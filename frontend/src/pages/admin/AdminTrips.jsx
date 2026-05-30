import { useEffect, useState, useMemo } from "react";
import {
  subscribeToTrips,
  subscribeToUsers,
  deleteTrip,
} from "../../services/adminApi";
import {
  MapPin,
  ExternalLink,
  Search,
  ArrowUpDown,
  Globe,
  Trash2,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const AdminTrips = () => {
  /** @type {[any[], Function]} */
  const [trips, setTrips] = useState([]);
  /** @type {[Record<string, any>, Function]} */
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });
  const itemsPerPage = 10;

  useEffect(() => {
    let usersLoaded = false;
    let tripsLoaded = false;

    const checkLoading = () => {
      if (usersLoaded && tripsLoaded) {
        setLoading(false);
      }
    };

    // @ts-ignore
    const unsubUsers = subscribeToUsers((data) => {
      /** @type {Record<string, any>} */
      const map = {};
      // @ts-ignore
      data.forEach((u) => {
        map[u.uid || u.id] = u;
      });
      setUsersMap(map);
      usersLoaded = true;
      checkLoading();
    });

    const unsubTrips = subscribeToTrips((data) => {
      setTrips(data);
      tripsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubUsers();
      unsubTrips();
    };
  }, []);

  const enrichedTrips = useMemo(
    // @ts-ignore
    () =>
      trips.map((t) => {
        const owner = usersMap[t?.userId] || {};
        const rawLoc =
          t?.trip_summary?.location ||
          t?.tripSummary?.location ||
          t?.tripData?.trip_summary?.location ||
          t?.userSelection?.destination?.label ||
          t?.userSelection?.destination?.value ||
          "Unknown Location";

        // @ts-ignore
        const locParts = rawLoc.split(",").map(function (p) {
          return p.trim();
        });
        const loc =
          locParts.length > 1
            ? `${locParts[0]}, ${locParts[locParts.length - 1]}`
            : locParts[0];
        const coverImg =
          t?.trip_summary?.cover_image_url ||
          t?.tripSummary?.cover_image_url ||
          t?.tripData?.trip_summary?.cover_image_url ||
          t?.trip_summary?.coverImageUrl ||
          "";
        const duration =
          t?.trip_summary?.duration ||
          t?.tripSummary?.duration ||
          t?.tripData?.trip_summary?.duration ||
          (t?.userSelection?.noOfDays
            ? `${t.userSelection.noOfDays} Days`
            : "N/A");
        const budget =
          t?.userSelection?.budget ||
          t?.trip_summary?.budget_note ||
          t?.tripSummary?.budget_note ||
          t?.tripData?.trip_summary?.budget_note ||
          t?.tripSummary?.budgetNote ||
          "Standard";
        return {
          ...t,
          displayLocation: loc,
          coverImg,
          duration,
          budget,
          ownerEmail: owner.email || t?.userEmail || "Guest",
          ownerName: owner.name || "Traveler",
          ownerPicture:
            owner.photoURL ||
            owner.picture ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${owner.name || t?.userId || "guest"}`,
        };
      }),
    [trips, usersMap],
  );

  const filteredTrips = useMemo(() => {
    let sortable = [...enrichedTrips];
    if (sortConfig.key) {
      // @ts-ignore
      sortable.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortable.filter(
      (trip) =>
        trip.displayLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.ownerName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [enrichedTrips, sortConfig, searchTerm]);

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedTrips = useMemo(
    () =>
      filteredTrips.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [filteredTrips, currentPage],
  );

  // @ts-ignore
  const requestSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  // @ts-ignore
  const handleDeleteTrip = (tripId, location) => {
    toast.warning(`Remove trip to ${location}?`, {
      description:
        "This action will permanently delete this itinerary from the database.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteTrip(tripId);
            toast.success("Trip deleted successfully");
          } catch (err) {
            toast.error("Failed to delete trip");
          }
        },
      },
      cancel: {
        label: "Keep it",
        onClick: () => {},
      },
      duration: 5000,
    });
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-slate-900 tracking-tight">
              Synchronizing Registry
            </p>
            <p className="text-xs font-medium text-slate-400">
              Fetching itinerary data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trip Registry</h1>
          <p className="text-sm text-slate-500">
            Database of all generated itinerary payloads.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search locations or users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th
                  className="px-6 py-3 font-semibold cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => requestSort("displayLocation")}
                >
                  <div className="flex items-center gap-2">
                    Destination <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 font-semibold hidden md:table-cell">
                  Budget
                </th>
                <th
                  className="px-6 py-3 font-semibold cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => requestSort("ownerName")}
                >
                  <div className="flex items-center gap-2">
                    Owner <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTrips.map((trip) => (
                <tr
                  key={trip.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={trip.ownerPicture}
                        alt=""
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {trip.displayLocation}
                        </p>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          {trip.duration}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                        trip.budget.toLowerCase().includes("luxury") ||
                        trip.budget.toLowerCase().includes("high")
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : trip.budget.toLowerCase().includes("moderate") ||
                              trip.budget.toLowerCase().includes("medium") ||
                              trip.budget.toLowerCase().includes("mid")
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}
                    >
                      {trip.budget}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <p className="font-semibold text-slate-900">
                      {trip.ownerName}
                    </p>
                    <p className="text-[11px] text-slate-500 hidden sm:block">
                      {trip.ownerEmail}
                    </p>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        to={`/v2/view-trip/${trip.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() =>
                          handleDeleteTrip(trip.id, trip.displayLocation)
                        }
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedTrips.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No registry entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Simple Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-white disabled:opacity-50 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-white disabled:opacity-50 transition-colors hover:bg-slate-50"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTrips;
