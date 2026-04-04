import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { cn } from "../lib/utils";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  IndianRupee,
  Hotel,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Star,
  Ticket,
  Users,
  MapPinned,
} from "lucide-react";
import {
  GetPlaceDetails,
  PHOTO_REF_URL,
  getStreetViewUrl,
} from "../services/googlePlaceApi";

let canUsePlacesPhotoLookup = true;

const getLocalTripKey = (tripId) => `local-trip-${tripId}`;

const readLocalTrip = (tripId) => {
  const raw = localStorage.getItem(getLocalTripKey(tripId));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const GetPhoto = ({ locationItem, className = "", imageClassName = "" }) => {
  const [photoUrl, setPhotoUrl] = useState(/** @type {string | null} */ (null));
  const fallbackPhoto = useMemo(
    () => getStreetViewUrl(locationItem),
    [locationItem],
  );

  useEffect(() => {
    if (locationItem) {
      fetchPlacePhoto();
    }
  }, [locationItem]);

  const fetchPlacePhoto = async () => {
    if (!canUsePlacesPhotoLookup) {
      setPhotoUrl(fallbackPhoto || null);
      return;
    }

    const data = {
      textQuery: locationItem,
    };

    try {
      const result = await GetPlaceDetails(data);
      const places = result?.data?.places;
      const photoName = places?.[0]?.photos?.[0]?.name;

      if (photoName) {
        setPhotoUrl(PHOTO_REF_URL.replace("{NAME}", photoName));
        return;
      }

      setPhotoUrl(fallbackPhoto || null);
    } catch (error) {
      const statusCode = error?.response?.status;
      if (statusCode === 403) {
        canUsePlacesPhotoLookup = false;
        setPhotoUrl(fallbackPhoto || null);
        return;
      }

      console.error("Error fetching photo:", error);
      setPhotoUrl(fallbackPhoto || null);
    }
  };

  return (
    <div className={cn("relative overflow-hidden bg-gray-100", className)}>
      {photoUrl || fallbackPhoto ? (
        <img
          src={photoUrl || fallbackPhoto}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500",
            imageClassName,
          )}
          alt="Location"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-xs text-gray-500">Image unavailable</p>
        </div>
      )}
    </div>
  );
};

const toTitleCase = (value) => {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const normalizeHotels = (tripData) => {
  const source =
    tripData?.hotel_options ||
    tripData?.hotels ||
    tripData?.accommodations ||
    [];

  if (!Array.isArray(source)) return [];

  return source.map((hotel, index) => ({
    id: `${hotel?.hotel_name || hotel?.name || "hotel"}-${index}`,
    name: hotel?.hotel_name || hotel?.name || "Not provided by AI",
    address: hotel?.address || hotel?.location || "Not provided by AI",
    price:
      hotel?.price_per_night_inr ||
      hotel?.price_per_night_usd ||
      hotel?.price_per_night ||
      hotel?.price ||
      "N/A",
    rating: hotel?.rating || null,
    description: hotel?.description || hotel?.desc || "Not provided by AI",
    image: hotel?.image_url || hotel?.image || null,
    geo: hotel?.geo_coordinates || hotel?.coordinates || null,
  }));
};

const normalizeActivities = (planSource) => {
  if (!Array.isArray(planSource)) return [];

  return planSource.map((item, index) => ({
    id: `${item?.title || item?.name || "stop"}-${index}`,
    time: item?.time || item?.start_time || "Flexible",
    title: item?.title || item?.name || "Not provided by AI",
    description:
      item?.item_desc ||
      item?.itemDesc ||
      item?.description ||
      "Not provided by AI",
    image: item?.image_url || item?.image || null,
    ticketPricing:
      item?.ticket_pricing_inr !== undefined &&
      item?.ticket_pricing_inr !== null
        ? item.ticket_pricing_inr
        : item?.ticket_pricing_usd !== undefined &&
            item?.ticket_pricing_usd !== null
          ? item.ticket_pricing_usd
          : item?.ticket_pricing !== undefined && item?.ticket_pricing !== null
            ? item.ticket_pricing
            : "N/A",
    travelTime:
      item?.travel_time_min !== undefined && item?.travel_time_min !== null
        ? item.travel_time_min
        : null,
    geo: item?.geo_coordinates || item?.coordinates || null,
  }));
};

const normalizeItineraryDays = (tripData) => {
  const itinerarySource =
    tripData?.itinerary || tripData?.day_wise_plan || tripData?.days || [];

  if (Array.isArray(itinerarySource)) {
    return itinerarySource.map((day, index) => ({
      key: `day-${index + 1}`,
      label: `Day ${index + 1}`,
      title: day?.title || `Day ${index + 1}`,
      bestTime: day?.best_time_to_visit || day?.bestTime || "11 AM",
      activities: normalizeActivities(day?.plan || day?.activities || []),
    }));
  }

  if (itinerarySource && typeof itinerarySource === "object") {
    return Object.entries(itinerarySource)
      .sort(([keyA], [keyB]) => {
        const numberA = Number((keyA.match(/\d+/) || [])[0] || 0);
        const numberB = Number((keyB.match(/\d+/) || [])[0] || 0);
        return numberA - numberB;
      })
      .map(([dayKey, dayValue], index) => {
        const dayObject =
          dayValue && typeof dayValue === "object" ? dayValue : {};
        const dayNumber = Number((dayKey.match(/\d+/) || [])[0] || index + 1);
        const dayLabel = dayNumber ? `Day ${dayNumber}` : toTitleCase(dayKey);

        return {
          key: dayKey,
          label: dayLabel,
          title: dayObject?.title || toTitleCase(dayKey),
          bestTime:
            dayObject?.best_time_to_visit || dayObject?.bestTime || "11 AM",
          activities: normalizeActivities(
            dayObject?.plan || dayObject?.activities || [],
          ),
        };
      });
  }

  return [];
};

const formatPrice = (value) => {
  if (typeof value === "number") {
    return `₹${value}`;
  }
  if (!value) return "N/A";
  return String(value);
};

const ViewTrip = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) {
        navigate("/create-trip");
        return;
      }

      const localTrip = readLocalTrip(tripId);
      if (localTrip) {
        setTrip(localTrip);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "Trips", tripId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTrip(docSnap.data());
        } else {
          const uid = auth.currentUser?.uid;
          if (uid) {
            const userTripRef = doc(db, "users", uid, "trips", tripId);
            const userTripSnap = await getDoc(userTripRef);

            if (userTripSnap.exists()) {
              setTrip(userTripSnap.data());
            } else {
              navigate("/create-trip");
            }
          } else {
            navigate("/create-trip");
          }
        }
      } catch {
        const fallbackTrip = readLocalTrip(tripId);
        if (fallbackTrip) {
          setTrip(fallbackTrip);
        } else {
          navigate("/create-trip");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, navigate]);

  const destinationLabel = useMemo(() => {
    const destination = trip?.userSelection?.destination;
    if (typeof destination?.label === "string") return destination.label;
    if (typeof destination?.value === "string") return destination.value;
    return "Your Trip";
  }, [trip]);

  const summary = useMemo(() => {
    const base = trip?.tripData?.trip_summary || {};
    return {
      location: base?.location || destinationLabel,
      duration:
        base?.duration ||
        (trip?.userSelection?.noOfDays
          ? `${trip.userSelection.noOfDays} Days`
          : "Custom Duration"),
      budget: base?.budget_note || "Budget unavailable",
      travelers: trip?.userSelection?.travelers || "Not specified",
      startDate: trip?.userSelection?.startDate || "Flexible",
    };
  }, [trip, destinationLabel]);

  const hotels = useMemo(() => normalizeHotels(trip?.tripData), [trip]);
  const itineraryDays = useMemo(
    () => normalizeItineraryDays(trip?.tripData),
    [trip],
  );

  const statCards = [
    {
      label: "Duration",
      value: summary.duration,
      icon: CalendarDays,
    },
    {
      label: "Travelers",
      value: summary.travelers,
      icon: Users,
    },
    {
      label: "Start Date",
      value: summary.startDate,
      icon: Clock3,
    },
    {
      label: "Budget",
      value: summary.budget,
      icon: IndianRupee,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-6 bg-[radial-gradient(circle_at_top,#fff7ed,#f5f3ff_48%,#eff6ff)] flex items-center justify-center">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 backdrop-blur-sm px-8 py-6 shadow-xl shadow-indigo-100/40">
          <p className="text-base text-gray-600">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  const getGoogleMapsUrl = (name, address) => {
    const query = encodeURIComponent(`${name} ${address || ""}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  return (
    <div className="min-h-screen pt-20 pb-14 px-4 md:px-6 bg-[radial-gradient(circle_at_top,#fff7ed,#fdf2f8_34%,#eef2ff_68%,#f8fafc)]">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-white shadow-2xl shadow-indigo-100/50">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-104 lg:min-h-144 bg-slate-950">
              <GetPhoto
                locationItem={destinationLabel}
                className="absolute inset-0 h-full w-full rounded-none"
                imageClassName="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/5" />
              <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate("/create-trip")}
                    className="w-fit inline-flex items-center gap-2 rounded-full border border-white bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 hover:text-indigo-700 hover:border-indigo-100 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Plan Another Trip
                  </button>
                </div>

                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white font-semibold border border-indigo-600">
                    AI Generated Itinerary
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-[0.95]">
                      {destinationLabel}
                    </h1>
                    <p className="max-w-2xl text-white/85 text-sm md:text-base leading-relaxed">
                      {trip?.tripData?.tripNote?.split(".")[0] ||
                        "A personalized plan built around your travel style, budget, and schedule."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8 bg-linear-to-br from-white via-indigo-50/40 to-amber-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {statCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm"
                    >
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl mb-4 bg-indigo-50/80 text-indigo-600 border border-indigo-100/80 shadow-sm backdrop-blur-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-base font-bold text-gray-900 leading-snug wrap-break-word">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[1.75rem] border border-indigo-100 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Route className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">
                    Trip Summary
                  </p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your plan combines hotels, daily activities, and travel pace
                  into one clean trip overview, so you can scan everything at a
                  glance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {hotels.length > 0 && (
          <section className="rounded-[2.5rem] border border-white/70 bg-white/90 p-5 md:p-7 shadow-xl shadow-indigo-100/30">
            <div className="flex items-center gap-2 mb-6">
              <Hotel className="w-5 h-5 text-indigo-600" />
              <h3 className="text-2xl font-extrabold text-gray-900">
                Hotel Picks
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {hotels.map((hotel) => (
                <a
                  key={hotel.id}
                  href={getGoogleMapsUrl(hotel.name, hotel.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full transition-transform hover:scale-[1.01]"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow">
                    <div className="relative h-44 w-full">
                      <GetPhoto
                        locationItem={hotel.name + "," + hotel.address}
                        className="h-full w-full"
                        imageClassName="h-full w-full object-cover"
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                        {formatPrice(hotel.price)} / night
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-base font-bold text-gray-900">
                          {hotel.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {hotel.address}
                      </p>
                      {hotel.rating && (
                        <p className="text-xs text-amber-600 font-semibold inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                          {hotel.rating} / 5
                        </p>
                      )}
                      {hotel.description && (
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                          {hotel.description}
                        </p>
                      )}
                    </div>
                  </article>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[2.5rem] border border-white/70 bg-white/90 p-5 md:p-7 shadow-xl shadow-indigo-100/30">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-indigo-600" />
              <h3 className="text-2xl font-extrabold text-gray-900">
                Trip Overview
              </h3>
            </div>
          </div>

          {itineraryDays.length === 0 ? (
            <div className="rounded-[1.75rem] bg-indigo-50 border border-indigo-100 p-5">
              <p className="text-sm text-indigo-900">
                Your itinerary details are still being prepared. Please generate
                again for a richer plan.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {itineraryDays.map((day) => (
                <article
                  key={day.key}
                  className="overflow-hidden rounded-[2rem] border border-gray-100 bg-linear-to-br from-[#fff8f0] via-white to-[#eef2ff]"
                >
                  <div className="border-b border-white/80 p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">
                          {day.label}
                        </p>
                        <h4 className="text-xl font-extrabold text-gray-900 mt-1">
                          {day.title}
                        </h4>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white border border-indigo-100 px-3 py-1 text-xs font-semibold text-gray-700 w-fit shadow-sm">
                        <Clock3 className="w-3.5 h-3.5 text-indigo-600" />
                        Best Time: {day.bestTime}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="flex flex-col gap-5">
                      {day.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-sm"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 p-4">
                            <div className="md:pr-2">
                              <GetPhoto
                                locationItem={
                                  activity.title + "," + summary.location
                                }
                                className="aspect-square w-full rounded-2xl"
                                imageClassName="h-full w-full object-cover"
                              />
                            </div>

                            <div className="space-y-3 md:pl-2 md:border-l md:border-gray-100">
                              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 leading-none">
                                <Clock3 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="leading-none">Time</span>
                                <span className="text-indigo-700 tracking-normal leading-none">
                                  {activity.time}
                                </span>
                              </p>
                              <a
                                href={getGoogleMapsUrl(
                                  activity.title,
                                  summary.location,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group"
                              >
                                <h5 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                  {activity.title}
                                  <Navigation className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                                </h5>
                              </a>

                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                                  <Ticket className="w-3.5 h-3.5" />
                                  Ticket: {formatPrice(activity.ticketPricing)}
                                </span>
                                {activity.travelTime !== null && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">
                                    <LocateFixed className="w-3.5 h-3.5" />
                                    {activity.travelTime} min travel
                                  </span>
                                )}
                              </div>

                              {activity.description && (
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 max-w-prose">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ViewTrip;
