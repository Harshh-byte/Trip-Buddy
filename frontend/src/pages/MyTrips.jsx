import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  CalendarDays,
  Compass,
  Loader2,
  Route,
  Trash2,
  Users,
  Lock,
  AlertTriangle,
  X as CloseIcon,
} from "lucide-react";
import { auth, db } from "../services/firebaseConfig";
import LoginDialog from "../components/shared/LoginDialog";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import SEO from "../components/shared/SEO";
import Skeleton from "@mui/material/Skeleton";
import {
  GetPlaceDetails,
  PHOTO_REF_URL,
  getStreetViewUrl,
} from "../services/googlePlaceApi";

const MAX_TRIPS = 12;
let canUsePlacesPhotoLookup = true;

const toPrettyDate = (
  /** @type {string | number | Date | null | undefined} */ value,
) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDestinationLabel = (
  /** @type {{ userSelection?: { destination?: { label?: string; value?: string } } }} */ trip,
) => {
  const destination = trip?.userSelection?.destination;
  if (typeof destination?.label === "string") return destination.label;
  if (typeof destination?.value === "string") return destination.value;
  return "Destination not available";
};

const getDurationLabel = (trip) => {
  const days = trip?.userSelection?.noOfDays;
  return days ? `${days} Days` : "Trip Itinerary";
};

const getBudgetLabel = (trip) => {
  return trip?.userSelection?.budget || "Standard Budget";
};

const GetPhoto = (
  /** @type {{ locationItem: string, className?: string, imageClassName?: string }} */ {
    locationItem,
    className = "",
    imageClassName = "",
  },
) => {
  const [photoUrl, setPhotoUrl] = useState(/** @type {string | null} */ (null));
  const fallbackPhoto = useMemo(
    () => getStreetViewUrl(locationItem),
    [locationItem],
  );

  useEffect(() => {
    if (!locationItem) return;
    let isMounted = true;
    const fetchPlacePhoto = async () => {
      if (!canUsePlacesPhotoLookup) {
        if (isMounted) setPhotoUrl(fallbackPhoto || null);
        return;
      }
      try {
        const result = await GetPlaceDetails({ textQuery: locationItem });
        const photoName = result?.data?.places?.[0]?.photos?.[0]?.name;
        if (isMounted) {
          setPhotoUrl(
            photoName
              ? PHOTO_REF_URL.replace("{NAME}", photoName)
              : fallbackPhoto || null,
          );
        }
      } catch (error) {
        const requestError = /** @type {{ response?: { status?: number } }} */ (
          error
        );
        if (requestError?.response?.status === 403)
          canUsePlacesPhotoLookup = false;
        if (isMounted) setPhotoUrl(fallbackPhoto || null);
      }
    };
    fetchPlacePhoto();
    return () => {
      isMounted = false;
    };
  }, [locationItem, fallbackPhoto]);

  return (
    <div className={cn("relative overflow-hidden bg-slate-100", className)}>
      {photoUrl || fallbackPhoto ? (
        <img
          src={photoUrl || fallbackPhoto}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-transform duration-700",
            imageClassName,
          )}
          alt={`Photo of ${locationItem}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100">
          <Compass className="w-8 h-8 text-slate-300 animate-pulse" />
        </div>
      )}
    </div>
  );
};

const MyTrips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(/** @type {any[]} */ ([]));
  const [pendingRequests, setPendingRequests] = useState(
    /** @type {any[]} */ ([]),
  );
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState("");
  const [tripToDelete, setTripToDelete] = useState(/** @type {any | null} */ (null));
  const forceSkeleton = false;

  const performDeleteTrip = async (
    /** @type {{ id?: string; docId?: string; userSelection?: any }} */ trip,
  ) => {
    const firebaseUser = auth.currentUser;
    const targetTripId = trip?.id || trip?.docId;

    if (!firebaseUser?.uid || !targetTripId) {
      toast.error("Unable to delete trip", {
        description: "Please sign in again and try once more.",
      });
      return;
    }

    if (deletingTripId === targetTripId) return;
    setDeletingTripId(targetTripId);

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "users", firebaseUser.uid, "trips", targetTripId));
      batch.delete(doc(db, "Trips", targetTripId));
      await batch.commit();

      localStorage.removeItem(`local-trip-${targetTripId}`);
      setTrips((prev) =>
        prev.filter((item) => (item?.id || item?.docId) !== targetTripId),
      );

      toast.success("Trip removed", {
        description: "Your itinerary has been deleted permanently.",
      });
    } catch (error) {
      const errorObj = /** @type {{ code?: string }} */ (error);
      toast.error("Delete failed", {
        description:
          errorObj?.code === "permission-denied"
            ? "Unable to completely remove this itinerary due to syncing issues. Please try again later."
            : "Something went wrong while deleting this itinerary.",
      });
    } finally {
      setDeletingTripId("");
    }
  };

  const handleDeleteTrip = (
    /** @type {{ id?: string; docId?: string }} */ trip,
  ) => {
    const targetTripId = trip?.id || trip?.docId;

    if (!targetTripId) {
      toast.error("Unable to delete trip", {
        description: "Trip details are missing. Please refresh and try again.",
      });
      return;
    }

    if (deletingTripId === targetTripId) return;

    setTripToDelete(trip);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser?.uid) {
        setTrips([]);
        setIsAuthenticated(false);
        setLoading(false);
        setOpenLogin(true);
        return;
      }

      setIsAuthenticated(true);
      setLoading(true);

      try {
        const tripsRef = collection(db, "users", firebaseUser.uid, "trips");
        const tripsQuery = query(
          tripsRef,
          orderBy("createdAt", "desc"),
          limit(MAX_TRIPS),
        );
        const snapshot = await getDocs(tripsQuery);
        const data = snapshot.docs.map((docItem) => ({
          docId: docItem.id,
          ...docItem.data(),
        }));
        setTrips(data);

        const requestsRef = collection(db, "Trip_requests");
        const requestsQuery = query(
          requestsRef,
          where("userId", "==", firebaseUser.uid),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc"),
          limit(5),
        );
        const requestSnapshot = await getDocs(requestsQuery);
        const requestData = requestSnapshot.docs.map((docItem) => ({
          docId: docItem.id,
          ...docItem.data(),
        }));

        setPendingRequests(requestData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast.error("Dashboard Load Error", {
          description: "We couldn't load your saved itineraries. Please try refreshing the page.",
        });
        setTrips([]);
        setPendingRequests([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="min-h-screen bg-mesh pt-28 md:pt-32 pb-16 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute top-10 right-0 w-125 h-125 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-125 h-125 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      <SEO
        title="My Trips | Trip Buddy"
        description="View all your AI-generated travel itineraries in one place. Access your personalized travel plans, hotel recommendations, and daily schedules."
        keywords="AI Travel, Trip Planner, Itinerary Generator, Travel Agent, Vacation Planning"
        image="https://trip-buddy-n6b3.onrender.com/favicon.png"
        url="https://trip-buddy-n6b3.onrender.com/v2/my-trips"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="glass-card rounded-[3rem] p-8 md:p-12 mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8 border border-white/40 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-none">
              Your <span className="text-indigo-600">Journeys</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
              Every meticulously planned itinerary, gathered in your personal
              travel archive.
            </p>
          </div>
        </div>

        {(loading || forceSkeleton) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-md border border-white/50 shadow-xl p-2.5"
              >
                <div className="relative h-64 w-full overflow-hidden rounded-[1.8rem]">
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width="100%"
                    height="100%"
                  />
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 space-y-1">
                      <Skeleton variant="text" animation="wave" width="40%" height={12} />
                      <Skeleton variant="text" animation="wave" width="80%" height={20} />
                    </div>
                    <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 space-y-1">
                      <Skeleton variant="text" animation="wave" width="40%" height={12} />
                      <Skeleton variant="text" animation="wave" width="80%" height={20} />
                    </div>
                  </div>
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width="100%"
                    height={56}
                    className="rounded-2xl mt-auto"
                  />
                  <div className="flex justify-center mt-4">
                    <Skeleton variant="text" animation="wave" width="50%" height={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !forceSkeleton && !isAuthenticated && (
          <div className="relative overflow-hidden rounded-[2.5rem] glass-card p-12 text-center">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-50/50 via-white to-orange-50/30" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shadow-inner">
                <Lock className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Sign in to view your trips
              </h2>
              <p className="max-w-md text-slate-500 font-medium mt-3 leading-relaxed">
                We save every generated itinerary to your account so you never
                lose track of your dream vacations.
              </p>
              <Button
                onClick={() => setOpenLogin(true)}
                className="mt-8 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-10 text-base font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
              >
                Login to Continue
              </Button>
            </div>
          </div>
        )}

        {!loading &&
          !forceSkeleton &&
          isAuthenticated &&
          trips.length === 0 &&
          pendingRequests.length === 0 && (
            <div className="relative overflow-hidden rounded-[2.5rem] glass-card p-12 text-center">
              <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-indigo-50/30" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-inner border border-slate-100">
                  <Compass className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Your map is blank
                </h2>
                <p className="max-w-md text-slate-500 font-medium mt-3 leading-relaxed">
                  It looks like you haven't planned any trips yet. Generate your
                  first itinerary and it will appear here instantly!
                </p>
              </div>
            </div>
          )}

        {!loading &&
          !forceSkeleton &&
          isAuthenticated &&
          (trips.length > 0 || pendingRequests.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pendingRequests.map((req) => (
                <article
                  key={req.docId}
                  className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border-2 border-dashed border-indigo-200 bg-white/40 p-2 shadow-sm animate-in zoom-in-95 duration-500"
                >
                  <div className="relative h-64 w-full overflow-hidden rounded-4xl bg-indigo-50/50 flex flex-col items-center justify-center text-center p-8">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                      <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
                    </div>
                    <h3 className="text-xl font-black text-indigo-900 leading-tight">
                      Crafting Magic...
                    </h3>
                    <p className="text-sm text-indigo-600 mt-2 font-bold opacity-70">
                      Your itinerary is being meticulously assembled.
                    </p>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-black text-slate-900 truncate">
                      {req.formData?.destinationLabel || "New Adventure"}
                    </h3>
                    <div className="mt-6 flex items-center gap-4 text-sm font-black text-slate-400">
                      <span className="bg-slate-50 px-3 py-1 rounded-full">
                        {req.formData?.noOfDays} Days
                      </span>
                      <span className="bg-slate-50 px-3 py-1 rounded-full">
                        {req.formData?.travelers}
                      </span>
                    </div>
                    <div className="mt-8 w-full py-4 px-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-center text-xs uppercase tracking-widest animate-pulse">
                      Processing in Background
                    </div>
                  </div>
                </article>
              ))}

              {trips.map((trip, index) => {
                const destinationLabel = getDestinationLabel(trip);
                const tripDate = toPrettyDate(trip?.createdAt);
                const travelers = trip?.userSelection?.travelers || "Custom";
                const days = trip?.userSelection?.noOfDays || "N/A";
                const isDeleting = deletingTripId === (trip?.id || trip?.docId);

                return (
                  <article
                    key={trip?.docId || trip?.id}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-md border border-white/50 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8 duration-700"
                  >
                    <div className="relative h-64 w-full p-2.5 pb-0 overflow-hidden">
                      <GetPhoto
                        locationItem={destinationLabel}
                        className="h-full w-full rounded-[1.8rem] shadow-inner"
                        imageClassName="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-2.5 bg-linear-to-t from-slate-950/80 via-slate-900/10 to-transparent rounded-[1.8rem]" />

                      <div className="absolute top-6 right-6 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrip(trip);
                          }}
                          disabled={isDeleting}
                          className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 transition-all hover:bg-rose-600 hover:text-white hover:border-rose-500 disabled:opacity-50 shadow-lg cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="absolute bottom-6 left-8 z-20">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                            Itinerary
                          </span>
                          <h4 className="text-white text-xl font-black tracking-tight drop-shadow-md truncate max-w-50">
                            {destinationLabel.split(",")[0]}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-8">
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                            Duration
                          </p>
                          <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />{" "}
                            {days} Days
                          </p>
                        </div>
                        <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                            Travelers
                          </p>
                          <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />{" "}
                            {travelers}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          navigate(`/v2/view-trip/${trip?.id || trip?.docId}`)
                        }
                        className="mt-auto w-full h-14 rounded-2xl bg-slate-900 text-white font-black hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200"
                      >
                        <Route className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                        View Itinerary
                      </Button>
                      <p className="text-center text-[10px] font-bold text-slate-500 mt-4 tracking-widest uppercase">
                        Generated on {tripDate}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </div>

      <LoginDialog
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        onLoginSuccess={() => setOpenLogin(false)}
      />

      {tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Delete Itinerary</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <button
                onClick={() => setTripToDelete(null)}
                disabled={deletingTripId === (tripToDelete?.id || tripToDelete?.docId)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                <Compass className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {getDestinationLabel(tripToDelete)}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {getDurationLabel(tripToDelete)} • {getBudgetLabel(tripToDelete)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this itinerary? It will be removed from your saved trips database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setTripToDelete(null)}
                disabled={deletingTripId === (tripToDelete?.id || tripToDelete?.docId)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (tripToDelete) {
                    await performDeleteTrip(tripToDelete);
                    setTripToDelete(null);
                  }
                }}
                disabled={deletingTripId === (tripToDelete?.id || tripToDelete?.docId)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {deletingTripId === (tripToDelete?.id || tripToDelete?.docId) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Delete Itinerary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MyTrips;
