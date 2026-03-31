import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
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
  Loader2,
  MapPin,
  Route,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { auth, db } from "../services/firebaseConfig";
import LoginDialog from "../components/shared/LoginDialog";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const MAX_TRIPS = 12;

const toPrettyDate = (value) => {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDestinationLabel = (trip) => {
  const destination = trip?.userSelection?.destination;

  if (typeof destination?.label === "string") return destination.label;
  if (typeof destination?.value === "string") return destination.value;
  return "Destination not available";
};

const MyTrips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState("");

  const performDeleteTrip = async (trip) => {
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
      batch.delete(doc(db, "AI-Trips", targetTripId));
      await batch.commit();

      localStorage.removeItem(`local-trip-${targetTripId}`);

      setTrips((prev) =>
        prev.filter((item) => (item?.id || item?.docId) !== targetTripId),
      );

      toast.success("Trip removed", {
        description: "Your itinerary has been deleted from database.",
      });
    } catch (error) {
      console.error("Delete trip error:", error);
      toast.error("Delete failed", {
        description:
          error?.code === "permission-denied"
            ? "Couldn't delete this itinerary from all database collections. Please check Firestore delete rules for AI-Trips."
            : "Something went wrong while deleting this itinerary.",
      });
    } finally {
      setDeletingTripId("");
    }
  };

  const handleDeleteTrip = (trip) => {
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
        label: "Delete",
        onClick: () => {
          performDeleteTrip(trip);
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
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
    <section className="max-padd-container pt-28 pb-10 min-h-screen bg-gray-50 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Personal Planner History
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1">
                My Trips
              </h1>
              <p className="text-gray-500 mt-2">
                Your latest AI-generated itineraries are saved here.
              </p>
            </div>
            <Button
              onClick={() => navigate("/create-trip")}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 px-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create New Trip
            </Button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-48 rounded-3xl border border-gray-200 bg-white animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && !isAuthenticated && (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Sign in to view your trips
            </h2>
            <p className="text-gray-500 mt-2">
              We save every generated itinerary to your account for quick
              access.
            </p>
            <Button
              onClick={() => setOpenLogin(true)}
              className="mt-5 rounded-full bg-indigo-600 hover:bg-indigo-700 px-8"
            >
              Login with Google
            </Button>
          </div>
        )}

        {!loading && isAuthenticated && trips.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              It's quiet in here
            </h2>
            <p className="text-gray-500 mt-2">
              Create your first itinerary and it will appear here instantly.
            </p>
          </div>
        )}

        {!loading && isAuthenticated && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip) => {
              const destinationLabel = getDestinationLabel(trip);
              const tripDate = toPrettyDate(trip?.createdAt);
              const travelers =
                trip?.userSelection?.travelers || "Not specified";
              const days = trip?.userSelection?.noOfDays || "N/A";

              return (
                <article
                  key={trip?.docId || trip?.id}
                  className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2">
                      {destinationLabel}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold whitespace-nowrap">
                      {days} Days
                    </span>
                  </div>

                  <div className="space-y-2 mt-4 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span className="truncate">{destinationLabel}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span className="truncate">{travelers}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-indigo-600" />
                      <span>{tripDate}</span>
                    </p>
                  </div>

                  <Button
                    onClick={() =>
                      navigate(`/view-trip/${trip?.id || trip?.docId}`)
                    }
                    variant="outline"
                    className="mt-5 w-full rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Route className="w-4 h-4 mr-2" />
                    View Itinerary
                  </Button>

                  <Button
                    onClick={() => handleDeleteTrip(trip)}
                    variant="outline"
                    disabled={deletingTripId === (trip?.id || trip?.docId)}
                    className="mt-2 w-full rounded-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {deletingTripId === (trip?.id || trip?.docId) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Itinerary
                      </>
                    )}
                  </Button>
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
