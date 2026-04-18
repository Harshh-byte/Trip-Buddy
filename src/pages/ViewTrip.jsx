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
  MapPin,
  Navigation,
  Route,
  Star,
  Users,
  MapPinned,
  Share2,
  CheckCircle2,
  Globe,
  Compass,
  Sparkles,
  Hourglass,
} from "lucide-react";
import SEO from "../components/shared/SEO";
import {
  GetPlaceDetails,
  PHOTO_REF_URL,
  getStreetViewUrl,
} from "../services/googlePlaceApi";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

let canUsePlacesPhotoLookup = true;
const TRIP_GENERATING_FLAG_KEY = "tripbuddy:generating-trip";

const LOADING_MESSAGES = [
  { icon: Globe, text: "Analyzing your destination..." },
  { icon: Hotel, text: "Scouting premium stays..." },
  { icon: Route, text: "Mapping out optimal routes..." },
  { icon: Compass, text: "Uncovering local secrets..." },
  { icon: Sparkles, text: "Polishing your itinerary..." },
];

/** @param {string} tripId */
const getLocalTripKey = (tripId) => `local-trip-${tripId}`;

/** @param {string} tripId */
const readLocalTrip = (tripId) => {
  const raw = localStorage.getItem(getLocalTripKey(tripId));
  return raw ? JSON.parse(raw) : null;
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
        const axiosLikeError =
          /** @type {{ response?: { status?: number } }} */ (error);
        if (axiosLikeError?.response?.status === 403) {
          canUsePlacesPhotoLookup = false;
        }
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
            "h-full w-full object-cover transition-opacity duration-700",
            imageClassName,
          )}
          alt={`Photo of ${locationItem}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100">
          <p className="text-xs font-medium text-slate-400">No image</p>
        </div>
      )}
    </div>
  );
};

/** @param {unknown} value */
const toTitleCase = (value) => {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
};

/** @param {any} tripData */
const normalizeHotels = (tripData) => {
  const source =
    tripData?.hotel_options ||
    tripData?.hotels ||
    tripData?.accommodations ||
    [];
  return Array.isArray(source)
    ? source.map((hotel, idx) => ({
        id: `hotel-${idx}`,
        name: hotel?.hotel_name || hotel?.name || "Premium Stay",
        address: hotel?.address || hotel?.location || "Address unavailable",
        price:
          hotel?.price_per_night_inr ||
          hotel?.price_per_night_usd ||
          hotel?.price_per_night ||
          hotel?.price ||
          "Pricing varies",
        rating: hotel?.rating || null,
        description:
          hotel?.description ||
          hotel?.desc ||
          "Experience a wonderful stay curated for your comfort.",
      }))
    : [];
};

/** @param {any} planSource */
const normalizeActivities = (planSource) => {
  return Array.isArray(planSource)
    ? planSource.map((item, idx) => ({
        id: `stop-${idx}`,
        time: item?.time || item?.start_time || "Flexible",
        title: item?.title || item?.name || "Activity",
        description:
          item?.item_desc ||
          item?.itemDesc ||
          item?.description ||
          "A highly recommended stop on your journey.",
        estDuration: item?.est_duration_min || null,
      }))
    : [];
};

/** @param {any} tripData */
const normalizeItineraryDays = (tripData) => {
  const source =
    tripData?.itinerary || tripData?.day_wise_plan || tripData?.days || [];

  if (Array.isArray(source)) {
    return source.map((day, idx) => ({
      key: `day-${idx + 1}`,
      label: `Day ${idx + 1}`,
      title: day?.title || `Day ${idx + 1}`,
      activities: normalizeActivities(day?.plan || day?.activities || []),
    }));
  }

  if (source && typeof source === "object") {
    return Object.entries(source)
      .sort(
        ([a], [b]) =>
          (Number(a.match(/\d+/)?.[0]) || 0) -
          (Number(b.match(/\d+/)?.[0]) || 0),
      )
      .map(([key, value], idx) => {
        const dObj = typeof value === "object" ? value : {};
        const dNum = Number(key.match(/\d+/)?.[0] || idx + 1);
        return {
          key,
          label: dNum ? `Day ${dNum}` : toTitleCase(key),
          title: dObj?.title || toTitleCase(key),
          activities: normalizeActivities(dObj?.plan || dObj?.activities || []),
        };
      });
  }
  return [];
};

/** @param {unknown} value */
const formatPrice = (value) =>
  typeof value === "number" ? `₹${value}` : String(value || "N/A");
/** @param {string} name @param {string | null | undefined} address */
const getGoogleMapsUrl = (name, address) =>
  `https://google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address || ""}`)}`;

const ViewTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = (95 - prev) * 0.04;
        return prev + increment;
      });
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) {
        const isGenerating =
          sessionStorage.getItem(TRIP_GENERATING_FLAG_KEY) === "1";
        if (isGenerating) {
          setLoading(true);
          return;
        }
        navigate("/v2/create-trip");
        return;
      }

      let foundTrip = readLocalTrip(tripId);
      if (!foundTrip) {
        try {
          const docSnap = await getDoc(doc(db, "Trips", tripId));
          if (docSnap.exists()) {
            foundTrip = docSnap.data();
          } else if (auth.currentUser?.uid) {
            const userTripSnap = await getDoc(
              doc(db, "users", auth.currentUser.uid, "trips", tripId),
            );
            if (userTripSnap.exists()) foundTrip = userTripSnap.data();
          }
        } catch (e) {
          console.error("Error fetching trip:", e);
        }
      }

      if (foundTrip) {
        setTrip(foundTrip);
        sessionStorage.removeItem(TRIP_GENERATING_FLAG_KEY);
      } else {
        navigate("/v2/create-trip");
      }

      setLoading(false);
    };

    fetchTrip();
  }, [tripId, navigate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const destinationLabel = useMemo(() => {
    const dest = trip?.userSelection?.destination;
    return typeof dest?.label === "string"
      ? dest.label
      : dest?.value || "Your Destination";
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
      budget: base?.budget_note || "Budget flexible",
      travelers: trip?.userSelection?.travelers || "Solo/Group",
      startDate: trip?.userSelection?.startDate || "Flexible Date",
    };
  }, [trip, destinationLabel]);

  const hotels = useMemo(() => normalizeHotels(trip?.tripData), [trip]);
  const itineraryDays = useMemo(
    () => normalizeItineraryDays(trip?.tripData),
    [trip],
  );

  const statCards = [
    { label: "Duration", value: summary.duration, icon: CalendarDays },
    { label: "Travelers", value: summary.travelers, icon: Users },
    { label: "Start Date", value: summary.startDate, icon: Clock3 },
    { label: "Budget", value: summary.budget, icon: IndianRupee },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-6 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white">
        <div className="w-full max-w-sm md:max-w-md p-8 md:p-12 bg-white/75 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/80 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-linear-to-br from-indigo-500/15 via-violet-400/10 to-transparent blur-3xl animate-pulse" />

          <div className="relative z-10 mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 via-violet-600 to-fuchsia-500 shadow-2xl shadow-indigo-200/60 ring-1 ring-white/70 overflow-hidden">
            <div className="absolute inset-0 rounded-full border border-white/35 animate-pulse" />
            <div className="absolute inset-2 rounded-full border border-white/30" />
            <div className="absolute inset-3 rounded-full bg-white/10 backdrop-blur-sm" />

            {LOADING_MESSAGES.map((msg, index) => {
              const Icon = msg.icon;
              const isActive = index === loadingStep;
              return (
                <div
                  key={index}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out",
                    isActive
                      ? "opacity-100 transform translate-y-0 scale-100"
                      : "opacity-0 transform translate-y-4 scale-75",
                  )}
                >
                  <Icon className="w-11 h-11 text-white drop-shadow-md" />
                </div>
              );
            })}
          </div>

          <h3 className="relative z-10 text-3xl font-black text-slate-900 mb-3 tracking-tight">
            Crafting Magic...
          </h3>

          <div className="relative z-10 h-6 overflow-hidden mb-8 w-full">
            <div
              className="transition-transform duration-700 ease-in-out flex flex-col items-center"
              style={{ transform: `translateY(-${loadingStep * 24}px)` }}
            >
              {LOADING_MESSAGES.map((msg, i) => (
                <p
                  key={i}
                  className="h-6 text-sm font-bold text-indigo-600/90 leading-6"
                >
                  {msg.text}
                </p>
              ))}
            </div>
          </div>

          <div className="relative z-10 w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 99)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-6 bg-mesh">
      <SEO
        title={`Trip to ${destinationLabel}`}
        description={`Explore our curated AI itinerary for ${destinationLabel}. Includes recommended hotels, daily activities, and travel tips.`}
        keywords="AI Travel, Trip Planner, Itinerary Generator, Travel Agent, Vacation Planning"
        image="https://trip-buddy-n6b3.onrender.com/favicon.png"
        url={`https://trip-buddy-n6b3.onrender.com/view-trip/${tripId || ""}`}
      />
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <section className="overflow-hidden rounded-[2.5rem] glass-card">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-112 lg:min-h-full bg-slate-900 overflow-hidden">
              <GetPhoto
                locationItem={destinationLabel}
                className="absolute inset-0 h-full w-full rounded-none"
                imageClassName="h-full w-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/40 to-slate-900/10" />

              <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate("/v2/create-trip")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-white hover:text-indigo-600 transition-colors border border-white/20 shadow-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Planner
                  </button>

                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-white hover:text-indigo-600 transition-colors border border-white/20 shadow-sm"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Link Copied!" : "Share Trip"}
                  </button>
                </div>

                <div className="space-y-4 max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 backdrop-blur-md px-3.5 py-1.5 text-[11px] uppercase tracking-widest text-indigo-100 font-bold border border-indigo-400/30">
                    AI Curated Itinerary
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.05]">
                    {destinationLabel}
                  </h1>
                  <p className="max-w-xl text-slate-200 text-base md:text-lg leading-relaxed font-medium">
                    {trip?.tripData?.tripNote?.split(".")[0] ||
                      "A personalized plan built around your travel style, budget, and schedule."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8 bg-white/50 backdrop-blur-md flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {statCards.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col h-full rounded-2xl glass-card p-4 hover:-translate-y-0.5"
                  >
                    <div className="space-y-2.5">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-all duration-300">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {item.label}
                      </p>
                    </div>

                    <p className="mt-2 min-h-11 text-sm md:text-base font-bold text-slate-900 leading-snug line-clamp-3 wrap-break-word">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-3xl border border-indigo-100/60 bg-indigo-50/50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Route className="w-5 h-5 text-indigo-600" />
                  <p className="text-sm font-bold tracking-tight text-indigo-900">
                    Trip Overview
                  </p>
                </div>
                <p className="text-sm text-indigo-900/70 leading-relaxed font-medium">
                  Your personalized plan combines top-rated stays with a curated
                  daily pace, ensuring you experience the best without the
                  stress.
                </p>
              </div>
            </div>
          </div>
        </section>

        {hotels.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Hotel className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-black tracking-tight text-slate-900">
                Recommended Stays
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <a
                  key={hotel.id}
                  href={getGoogleMapsUrl(hotel.name, hotel.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block h-full"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-4xl glass-card hover:-translate-y-1">
                    <div className="relative h-56 w-full overflow-hidden">
                      <GetPhoto
                        locationItem={`${hotel.name}, ${hotel.address}`}
                        className="h-full w-full"
                        imageClassName="h-full w-full object-cover group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent" />
                      <span className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
                        {formatPrice(hotel.price)}{" "}
                        <span className="text-slate-500 font-medium">
                          / night
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6 space-y-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                          {hotel.name}
                        </h4>
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500 font-medium">
                          <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                          <span className="line-clamp-2">{hotel.address}</span>
                        </p>
                      </div>

                      {hotel.rating && (
                        <div className="inline-flex items-center gap-1.5 w-fit rounded-lg bg-amber-50 px-2.5 py-1 mt-auto">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          <span className="text-sm font-bold text-amber-700">
                            {hotel.rating} / 5
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <MapPinned className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-black tracking-tight text-slate-900">
              Daily Itinerary
            </h3>
          </div>

          {itineraryDays.length === 0 ? (
            <div className="rounded-4xl bg-indigo-50 border border-indigo-100 p-8 text-center">
              <p className="text-indigo-900 font-medium">
                Your itinerary details are still being prepared. Check back
                soon!
              </p>
            </div>
          ) : (
            <Accordion
              type="multiple"
              className="space-y-6"
              defaultValue={[itineraryDays[0]?.key]}
            >
              {itineraryDays.map((day) => (
                <AccordionItem
                  key={day.key}
                  value={day.key}
                  className="group overflow-hidden rounded-4xl glass-card data-[state=open]:ring-2 data-[state=open]:ring-indigo-100 data-[state=open]:bg-white/80"
                >
                  <AccordionTrigger
                    showIcon={false}
                    className="px-6 py-6 md:px-8 hover:no-underline transition-colors w-full"
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <div className="flex flex-col text-left flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2.5">
                          <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-indigo-600 shadow-inner">
                            {day.label}
                          </span>
                          <span className="h-0.5 w-6 rounded-full bg-indigo-100" />
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            {day.activities.length} Stops
                          </span>
                        </div>

                        <h4 className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors duration-300 truncate">
                          {day.title}
                        </h4>

                        <div className="grid grid-rows-[0fr] group-data-[state=closed]:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-in-out mt-1">
                          <div className="overflow-hidden">
                            <p className="mt-1 text-sm font-medium text-slate-500 truncate flex items-center gap-1.5 opacity-0 group-data-[state=closed]:opacity-100 transition-opacity duration-500 delay-100">
                              <span className="inline-flex items-center gap-1 text-indigo-600">
                                <MapPin className="w-3.5 h-3.5" />
                                Includes:
                              </span>
                              {day.activities.map((a) => a.title).join(" • ")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex shrink-0">
                        <div className="rounded-full bg-slate-50 border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 shadow-sm group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-300 group-data-[state=open]:bg-indigo-600 group-data-[state=open]:text-white group-data-[state=open]:border-indigo-600 group-data-[state=open]:shadow-md">
                          <span className="group-data-[state=open]:hidden">
                            View Day
                          </span>
                          <span className="hidden group-data-[state=open]:inline">
                            Close
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 md:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 pb-10 border-t border-indigo-100/50 mt-2">
                      {day.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="group/card relative flex flex-col h-full overflow-hidden rounded-4xl glass-card hover:-translate-y-1"
                        >
                          <div className="relative h-48 w-full overflow-hidden p-2 pb-0">
                            <GetPhoto
                              locationItem={`${activity.title}, ${summary.location}`}
                              className="h-full w-full rounded-3xl"
                              imageClassName="h-full w-full object-cover group-hover/card:scale-110"
                            />
                            <div className="absolute top-4 right-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
                                <Clock3 className="w-3.5 h-3.5 text-indigo-600" />
                                {activity.time}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col p-6 gap-3">
                            <a
                              href={getGoogleMapsUrl(
                                activity.title,
                                summary.location,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block focus:outline-none"
                            >
                              <h5 className="text-lg font-bold text-slate-900 leading-tight flex items-start justify-between gap-2 group-hover/card:text-indigo-600 transition-colors">
                                {activity.title}
                                <div className="p-1.5 rounded-full bg-slate-50 group-hover/card:bg-indigo-50 shrink-0 transition-colors">
                                  <Navigation className="w-4 h-4 text-slate-400 group-hover/card:text-indigo-600 transition-colors" />
                                </div>
                              </h5>
                            </a>

                            {activity.estDuration && (
                              <span className="w-fit inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 text-indigo-700 px-2.5 py-1.5 text-xs font-bold">
                                <Hourglass className="w-3.5 h-3.5" />
                                {activity.estDuration} min duration
                              </span>
                            )}

                            {activity.description && (
                              <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3 mt-1">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>
      </div>
    </div>
  );
};

export default ViewTrip;
