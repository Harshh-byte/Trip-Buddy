import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  CalendarDays,
  Compass,
  Loader2,
  MapPin,
  Route,
  Sparkles,
  Trash2,
  Users,
  Lock,
} from "lucide-react";
import { auth, db } from "../services/firebaseConfig";
import LoginDialog from "../components/shared/LoginDialog";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import SEO from "../components/shared/SEO";
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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState("");

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
      console.error("Delete trip error:", error);
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

    toast.warning("Delete this itinerary?", {
      description: "This action is permanent and cannot be undone.",
      classNames: {
        toast:
          "border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/60 text-slate-800",
        title: "text-slate-900 font-semibold",
        description: "text-slate-600",
        actionButton:
          "rounded-full bg-rose-600 px-4 text-white shadow-sm transition-colors hover:bg-rose-700 focus:ring-2 focus:ring-rose-300",
        cancelButton:
          "rounded-full border border-slate-200 bg-white px-4 text-slate-700 transition-colors hover:bg-slate-100 focus:ring-2 focus:ring-slate-200",
      },
      action: {
        label: "Yes, delete it.",
        onClick: () => performDeleteTrip(trip),
      },
      cancel: { label: "Keep it.", onClick: () => {} },
      duration: 7000,
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser?.uid) {
        setTrips([]);
        setIsAuthenticated(false);
        setLoading(false);
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
      } catch (error) {
        console.error("Unable to fetch trips:", error);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="max-padd-container pt-28 pb-20 min-h-screen bg-mesh px-4">
      <SEO
        title="My Trips"
        description="View all your AI-generated travel itineraries in one place. Access your personalized travel plans, hotel recommendations, and daily schedules."
        keywords="AI Travel, Trip Planner, Itinerary Generator, Travel Agent, Vacation Planning"
        image="https://trip-buddy-n6b3.onrender.com/favicon.png"
        url="https://trip-buddy-n6b3.onrender.com/v2/my-trips"
      />
      <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Personal Planner History
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
              My Trips
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              All your AI-generated adventures, safely stored in one place.
            </p>
          </div>
          <Button
            onClick={() => navigate("/v2/create-trip")}
            className="h-14 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-8 text-base font-bold shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] border-0 text-white transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create New Trip
          </Button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col h-100 rounded-4xl border border-slate-200/60 bg-white p-2 shadow-sm"
              >
                <div className="h-48 w-full rounded-3xl bg-slate-100 animate-pulse" />
                <div className="p-5 space-y-4">
                  <div className="h-6 w-3/4 rounded-lg bg-slate-100 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-1/2 rounded-md bg-slate-50 animate-pulse" />
                    <div className="h-4 w-2/3 rounded-md bg-slate-50 animate-pulse" />
                  </div>
                  <div className="h-12 w-full rounded-xl bg-slate-50 animate-pulse mt-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !isAuthenticated && (
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

        {!loading && isAuthenticated && trips.length === 0 && (
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

        {!loading && isAuthenticated && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const destinationLabel = getDestinationLabel(trip);
              const tripDate = toPrettyDate(trip?.createdAt);
              const travelers =
                trip?.userSelection?.travelers || "Not specified";
              const days = trip?.userSelection?.noOfDays || "N/A";
              const isDeleting = deletingTripId === (trip?.id || trip?.docId);

              return (
                <article
                  key={trip?.docId || trip?.id}
                  className="group relative flex flex-col overflow-hidden rounded-4xl glass-card hover:-translate-y-1"
                >
                  <div className="relative h-52 w-full p-2 pb-0 overflow-hidden">
                    <GetPhoto
                      locationItem={destinationLabel}
                      className="h-full w-full rounded-3xl"
                      imageClassName="h-full w-full object-cover group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-slate-900/10 to-transparent rounded-3xl m-2" />

                    <div className="absolute top-5 right-5 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(trip);
                        }}
                        disabled={isDeleting}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur text-slate-400 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="absolute bottom-5 left-6 z-20">
                      <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
                        {days} Days
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {destinationLabel}
                    </h3>

                    <div className="mt-4 space-y-2.5 text-sm font-medium text-slate-500">
                      <p className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{destinationLabel}</span>
                      </p>
                      <p className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{travelers}</span>
                      </p>
                      <p className="flex items-center gap-2.5">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        <span>Created {tripDate}</span>
                      </p>
                    </div>

                    <Button
                      onClick={() =>
                        navigate(`/v2/view-trip/${trip?.id || trip?.docId}`)
                      }
                      className="mt-6 w-full h-12 rounded-xl bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      <Route className="w-4 h-4 mr-2" />
                      View Itinerary
                    </Button>
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
    </section>
  );
};

export default MyTrips;
