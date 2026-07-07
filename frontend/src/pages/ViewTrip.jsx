import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { auth, db } from "../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "../lib/utils";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Hotel,
  MapPin,
  Navigation,
  Route,
  Star,
  Users,
  Heart,
  MapPinned,
  Share2,
  CheckCircle2,
  Globe,
  Compass,
  Sparkles,
  Hourglass,
  Wallet,
  Download,
  Loader2,
  Send,
  X,
  BotMessageSquare,
  Zap,
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  Check,
  Gem,
} from "lucide-react";
import SEO from "../components/shared/SEO";
import { ROAMIE_CONFIG } from "../services/roamieConfig";
import { applyTripPatch } from "../services/roamiePatch";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../components/ui/dialog";

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
        geo_coordinates: hotel?.geo_coordinates || hotel?.coordinates || null,
      }))
    : [];
};

/** @param {any} planSource */
const normalizeActivities = (planSource) => {
  return Array.isArray(planSource)
    ? planSource.map((item, idx) => ({
        id: item?.id || `stop-${idx}`,
        time: item?.time || item?.start_time || "Flexible",
        title: item?.title || item?.name || "Activity",
        description:
          item?.item_desc ||
          item?.itemDesc ||
          item?.description ||
          "A highly recommended stop on your journey.",
        estDuration: item?.est_duration_min || null,
        geo_coordinates: item?.geo_coordinates || item?.coordinates || null,
        holderName: item?.holderName || item?.holder || null,
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

/**
 * @param {string | number | Date | null | undefined} value
 */
const formatFullDate = (value) => {
  if (!value) return "Flexible Date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ViewTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    let unsubSnapshot = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user?.uid) {
        unsubSnapshot = onSnapshot(
          doc(db, "users", user.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setIsPremium(data?.isPremium === true || data?.isAdmin === true);
            } else {
              setIsPremium(false);
            }
          },
          (err) => {
            console.error("ViewTrip profile snapshot error:", err);
          }
        );
      } else {
        setIsPremium(false);
        if (unsubSnapshot) {
          unsubSnapshot();
          unsubSnapshot = null;
        }
      }
    });
    return () => {
      unsubscribe();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const [trip, setTrip] = useState(/** @type {any} */ (null));

  const isOwner = useMemo(() => {
    if (!trip) return false;

    const localTrip = readLocalTrip(tripId || "");
    if (localTrip) return true;

    if (currentUser) {
      if (trip.userId && currentUser.uid === trip.userId) return true;
      if (trip.userEmail && currentUser.email === trip.userEmail) return true;
    }

    return false;
  }, [trip, tripId, currentUser]);

  const canEdit = useMemo(() => {
    if (!trip) return false;
    if (isOwner) return true;
    return trip.sharingMode === "edit";
  }, [trip, isOwner]);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalMode, setActivityModalMode] = useState("add");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
  const [activityForm, setActivityForm] = useState({
    time: "",
    title: "",
    description: "",
    estDuration: "",
    location: "",
    holderName: "",
  });

  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [hotelModalMode, setHotelModalMode] = useState("add");
  const [selectedHotelIndex, setSelectedHotelIndex] = useState(0);
  const [hotelForm, setHotelForm] = useState({
    name: "",
    address: "",
    price: "",
    rating: "",
    description: "",
  });

  const openActivityModal = (mode, dayIdx, actIdx = null, activity = null) => {
    setActivityModalMode(mode);
    setSelectedDayIndex(dayIdx);
    if (mode === "edit" && activity) {
      setSelectedActivityIndex(actIdx);
      setActivityForm({
        time: activity.time || "",
        title: activity.title || "",
        description: activity.description || "",
        estDuration: activity.estDuration || "",
        location: activity.location || "",
        holderName: activity.holderName || "",
      });
    } else {
      setActivityForm({
        time: "10:00 AM",
        title: "",
        description: "",
        estDuration: "60",
        location: "",
        holderName: "",
      });
    }
    setActivityModalOpen(true);
  };

  const handleSaveActivity = (e) => {
    e.preventDefault();
    if (!activityForm.title.trim()) {
      toast.error("Activity Title is required");
      return;
    }

    const payload = {
      dayIndex: selectedDayIndex,
      newActivity: {
        id: `activity-${Date.now()}`,
        time: activityForm.time,
        title: activityForm.title,
        description: activityForm.description,
        estDuration: activityForm.estDuration
          ? parseInt(activityForm.estDuration)
          : null,
        geo_coordinates: null,
        holderName: activityForm.holderName.trim(),
      },
      activityIndex: selectedActivityIndex,
      updatedActivity: {
        time: activityForm.time,
        title: activityForm.title,
        description: activityForm.description,
        estDuration: activityForm.estDuration
          ? parseInt(activityForm.estDuration)
          : null,
        holderName: activityForm.holderName.trim(),
      },
    };

    if (activityModalMode === "add") {
      handleModifyItinerary("ADD_ACTIVITY", payload);
    } else {
      handleModifyItinerary("EDIT_ACTIVITY", payload);
    }

    setActivityModalOpen(false);
  };

  const openHotelModal = (mode, hotelIdx = null, hotel = null) => {
    setHotelModalMode(mode);
    if (mode === "edit" && hotel) {
      setSelectedHotelIndex(hotelIdx);
      setHotelForm({
        name: hotel.name || "",
        address: hotel.address || "",
        price: hotel.price || "",
        rating: hotel.rating || "",
        description: hotel.description || "",
      });
    } else {
      setHotelForm({
        name: "",
        address: "",
        price: "Pricing varies",
        rating: "4.5",
        description: "",
      });
    }
    setHotelModalOpen(true);
  };

  const handleSaveHotel = (e) => {
    e.preventDefault();
    if (!hotelForm.name.trim()) {
      toast.error("Hotel Name is required");
      return;
    }

    const payload = {
      hotelIndex: selectedHotelIndex,
      newHotel: {
        hotel_name: hotelForm.name,
        address: hotelForm.address,
        price: hotelForm.price,
        rating: hotelForm.rating,
        description: hotelForm.description,
      },
      updatedHotel: {
        name: hotelForm.name,
        hotel_name: hotelForm.name,
        address: hotelForm.address,
        price: hotelForm.price,
        rating: hotelForm.rating,
        description: hotelForm.description,
      },
    };

    if (hotelModalMode === "add") {
      handleModifyHotels("ADD_HOTEL", payload);
    } else {
      handleModifyHotels("EDIT_HOTEL", payload);
    }

    setHotelModalOpen(false);
  };

  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [apiDone, setApiDone] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const [chatOpen, setChatOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "model",
      content: ROAMIE_CONFIG.welcomeMessage,
    },
  ]);
  const [aiTyping, setAiTyping] = useState(false);

  const chatEndRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, aiTyping]);

  const updateTripDataInFirestore = async (newTripData) => {
    try {
      const updatedTrip = {
        ...trip,
        tripData: newTripData,
      };

      setTrip(updatedTrip);
      localStorage.setItem(
        getLocalTripKey(tripId || ""),
        JSON.stringify(updatedTrip),
      );

      const batch = writeBatch(db);

      const globalTripRef = doc(db, "Trips", tripId || "");
      batch.set(globalTripRef, updatedTrip, { merge: true });

      const targetUserId = trip.userId || auth.currentUser?.uid;
      if (targetUserId && auth.currentUser?.uid === targetUserId) {
        const userTripRef = doc(
          db,
          "users",
          targetUserId,
          "trips",
          tripId || "",
        );
        batch.set(userTripRef, updatedTrip, { merge: true });
      }

      await batch.commit();
      toast.success("Itinerary updated successfully!", {
        description: "Your route map and itinerary have been refreshed.",
      });
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : String(error);
      toast.error("Failed to sync trip updates", {
        description: `Please try again. Details: ${errMsg}`,
      });
    }
  };

  const handleModifyItinerary = async (action, payload) => {
    if (!canEdit) {
      toast.error("Permission Denied", {
        description: "You do not have permission to edit this itinerary.",
      });
      return;
    }

    const updatedTripData = JSON.parse(JSON.stringify(trip.tripData));

    let itineraryKey = "itinerary";
    if (updatedTripData.day_wise_plan) itineraryKey = "day_wise_plan";
    else if (updatedTripData.days) itineraryKey = "days";

    if (!updatedTripData[itineraryKey]) {
      updatedTripData[itineraryKey] = [];
    }
    const itinerary = updatedTripData[itineraryKey];

    const getDayObj = (dayIdx) => {
      if (Array.isArray(itinerary)) {
        return itinerary[dayIdx];
      } else if (itinerary && typeof itinerary === "object") {
        const sortedKeys = Object.keys(itinerary).sort(
          (a, b) =>
            (Number(a.match(/\d+/)?.[0]) || 0) -
            (Number(b.match(/\d+/)?.[0]) || 0),
        );
        const dayKey = sortedKeys[dayIdx];
        return itinerary[dayKey];
      }
      return null;
    };

    const getActivitiesKey = (dayObj) => {
      if (dayObj?.plan) return "plan";
      if (dayObj?.activities) return "activities";
      return "plan";
    };

    if (action === "EDIT_ACTIVITY") {
      const { dayIndex, activityIndex, updatedActivity } = payload;
      const dayObj = getDayObj(dayIndex);
      if (dayObj) {
        const actKey = getActivitiesKey(dayObj);
        if (!dayObj[actKey]) dayObj[actKey] = [];
        dayObj[actKey][activityIndex] = {
          ...dayObj[actKey][activityIndex],
          ...updatedActivity,
        };
      }
    } else if (action === "DELETE_ACTIVITY") {
      const { dayIndex, activityIndex } = payload;
      const dayObj = getDayObj(dayIndex);
      if (dayObj) {
        const actKey = getActivitiesKey(dayObj);
        if (dayObj[actKey]) {
          dayObj[actKey].splice(activityIndex, 1);
        }
      }
    } else if (action === "ADD_ACTIVITY") {
      const { dayIndex, newActivity } = payload;
      const dayObj = getDayObj(dayIndex);
      if (dayObj) {
        const actKey = getActivitiesKey(dayObj);
        if (!dayObj[actKey]) dayObj[actKey] = [];
        dayObj[actKey].push(newActivity);
      }
    } else if (action === "REORDER_ACTIVITY") {
      const { dayIndex, activityIndex, direction } = payload;
      const dayObj = getDayObj(dayIndex);
      if (dayObj) {
        const actKey = getActivitiesKey(dayObj);
        const list = dayObj[actKey];
        if (list && Array.isArray(list)) {
          const newIdx =
            direction === "up" ? activityIndex - 1 : activityIndex + 1;
          if (newIdx >= 0 && newIdx < list.length) {
            const temp = list[activityIndex];
            list[activityIndex] = list[newIdx];
            list[newIdx] = temp;
          }
        }
      }
    } else if (action === "EDIT_DAY_TITLE") {
      const { dayIndex, newTitle } = payload;
      const dayObj = getDayObj(dayIndex);
      if (dayObj) {
        dayObj.title = newTitle;
      }
    } else if (action === "ADD_DAY") {
      if (Array.isArray(itinerary)) {
        itinerary.push({
          title: `Day ${itinerary.length + 1}`,
          plan: [],
        });
      } else if (itinerary && typeof itinerary === "object") {
        const nextDayNum = Object.keys(itinerary).length + 1;
        itinerary[`day_${nextDayNum}`] = {
          title: `Day ${nextDayNum}`,
          plan: [],
        };
      }
    } else if (action === "DELETE_DAY") {
      const { dayIndex } = payload;
      if (Array.isArray(itinerary)) {
        if (dayIndex >= 0 && dayIndex < itinerary.length) {
          itinerary.splice(dayIndex, 1);
          itinerary.forEach((day, i) => {
            if (day.title?.startsWith("Day ")) {
              day.title = `Day ${i + 1}`;
            }
          });
        }
      } else if (itinerary && typeof itinerary === "object") {
        const sortedKeys = Object.keys(itinerary).sort(
          (a, b) =>
            (Number(a.match(/\d+/)?.[0]) || 0) -
            (Number(b.match(/\d+/)?.[0]) || 0),
        );
        const dayKey = sortedKeys[dayIndex];
        if (dayKey) {
          delete itinerary[dayKey];
          const sortedEntries = Object.entries(itinerary).sort(([a], [b]) => {
            const numA = parseInt(a.replace(/\D/g, "")) || 0;
            const numB = parseInt(b.replace(/\D/g, "")) || 0;
            return numA - numB;
          });
          const rekeyed = {};
          sortedEntries.forEach(([, val], i) => {
            rekeyed[`day_${i + 1}`] = val;
            if (val.title?.startsWith("Day ")) {
              val.title = `Day ${i + 1}`;
            }
          });
          updatedTripData[itineraryKey] = rekeyed;
        }
      }

      const newLength = Array.isArray(itinerary)
        ? itinerary.length
        : Object.keys(itinerary).length;
      if (activeDayIndex >= newLength) {
        setActiveDayIndex(Math.max(0, newLength - 1));
      }
    }

    await updateTripDataInFirestore(updatedTripData);
  };

  const handleModifyHotels = async (action, payload) => {
    if (!canEdit) {
      toast.error("Permission Denied", {
        description: "You do not have permission to edit hotels.",
      });
      return;
    }

    const updatedTripData = JSON.parse(JSON.stringify(trip.tripData));

    let hotelsKey = "hotel_options";
    if (updatedTripData.hotels) hotelsKey = "hotels";
    else if (updatedTripData.accommodations) hotelsKey = "accommodations";

    if (!updatedTripData[hotelsKey]) {
      updatedTripData[hotelsKey] = [];
    }
    const hotelsList = updatedTripData[hotelsKey];

    if (action === "ADD_HOTEL") {
      const { newHotel } = payload;
      hotelsList.push(newHotel);
    } else if (action === "EDIT_HOTEL") {
      const { hotelIndex, updatedHotel } = payload;
      if (hotelIndex >= 0 && hotelIndex < hotelsList.length) {
        hotelsList[hotelIndex] = {
          ...hotelsList[hotelIndex],
          ...updatedHotel,
        };
      }
    } else if (action === "DELETE_HOTEL") {
      const { hotelIndex } = payload;
      if (hotelIndex >= 0 && hotelIndex < hotelsList.length) {
        hotelsList.splice(hotelIndex, 1);
      }
    }

    await updateTripDataInFirestore(updatedTripData);
  };

  const handleUpdateSharingMode = async (mode) => {
    if (mode === "edit" && !isPremium) {
      window.dispatchEvent(new Event("open-pricing-dialog"));
      toast.error("Premium Feature Required", {
        description:
          "Real-time collaborative editing requires a Premium lifetime upgrade.",
      });
      return;
    }
    if (!isOwner) {
      toast.error("Access Denied", {
        description: "Only the trip owner can update sharing settings.",
      });
      return;
    }

    try {
      const updatedTrip = {
        ...trip,
        sharingMode: mode,
      };

      setTrip(updatedTrip);
      localStorage.setItem(
        getLocalTripKey(tripId || ""),
        JSON.stringify(updatedTrip),
      );

      const batch = writeBatch(db);

      const globalTripRef = doc(db, "Trips", tripId || "");
      batch.set(globalTripRef, updatedTrip, { merge: true });

      const targetUserId = trip.userId || auth.currentUser?.uid;
      if (targetUserId && auth.currentUser?.uid === targetUserId) {
        const userTripRef = doc(
          db,
          "users",
          targetUserId,
          "trips",
          tripId || "",
        );
        batch.set(userTripRef, updatedTrip, { merge: true });
      }

      await batch.commit();
      toast.success("Sharing settings updated!", {
        description: `Your trip is now ${mode === "edit" ? "collaborative (anyone can edit)" : "read-only (anyone can view)"}.`,
      });
    } catch (e) {
      console.error(e);
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error("Failed to update sharing settings", {
        description: `Details: ${errMsg}`,
      });
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!isPremium) {
      window.dispatchEvent(new Event("open-pricing-dialog"));
      toast.error("Premium Feature Required", {
        description:
          "Roamie AI Chat Assistant is a Premium feature. Please upgrade.",
      });
      return;
    }
    const trimmed = inputText.trim();
    if (!trimmed || aiTyping) return;

    const userMsg = { role: "user", content: trimmed };
    setChatHistory((prev) => [...prev, userMsg]);
    setInputText("");
    setAiTyping(true);

    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("Assistant service is not configured.");
      }

      const contentsForApi = chatHistory
        .filter((_, idx) => idx > 0)
        .map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        }));
      contentsForApi.push({
        role: "user",
        parts: [{ text: trimmed }],
      });

      const systemPrompt = ROAMIE_CONFIG.getSystemPrompt(
        trip?.tripData,
        trip?.userSelection,
      );

      const response = await fetch(ROAMIE_CONFIG.getApiUrl(geminiApiKey), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contentsForApi,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("No response text from AI.");
      }

      const parsed = JSON.parse(rawText.trim());
      setChatHistory((prev) => [
        ...prev,
        { role: "model", content: parsed.message },
      ]);

      if (parsed.patch) {
        const patchedData = applyTripPatch(trip?.tripData, parsed.patch);
        if (patchedData) {
          await updateTripDataInFirestore(patchedData);
        }
      }
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          content:
            "Sorry, I encountered an issue processing that request. Please try again.",
        },
      ]);
      const errMsg = error instanceof Error ? error.message : String(error);
      toast.error("Failed to process message", {
        description: `Details: ${errMsg}`,
      });
    } finally {
      setAiTyping(false);
    }
  };

  const getBase64Logo = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/favicon.png";
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        resolve(null);
      };
    });
  };

  const cleanTextForPDF = (str) => {
    if (typeof str !== "string") return "";
    return (
      str
        .replace(/₹/g, "Rs. ")
        .replace(/[\u201e\u200e\u200b\u200f\ufeff]/g, "")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, "-")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        // eslint-disable-next-line no-control-regex
        .replace(/[^\x00-\x7F]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  const exportToPDF = async () => {
    if (!isPremium) {
      window.dispatchEvent(new Event("open-pricing-dialog"));
      toast.error("Premium Feature Required", {
        description:
          "PDF downloads require a Premium lifetime upgrade. Please upgrade.",
      });
      return;
    }
    setPdfDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const logoBase64 = await getBase64Logo();

      const drawPageDecorations = (pdfDoc) => {
        pdfDoc.setFont("helvetica", "normal");
        pdfDoc.setFontSize(8);
        pdfDoc.setTextColor(156, 163, 175);
        pdfDoc.text("Trip Buddy — AI Travel Itinerary", 15, 10);
        pdfDoc.setDrawColor(229, 231, 235);
        pdfDoc.setLineWidth(0.2);
        pdfDoc.line(15, 12, 195, 12);

        pdfDoc.line(15, 282, 195, 282);
        pdfDoc.text("Generated with Passion by Trip Buddy", 15, 287);
      };

      let y = 15;

      doc.setFillColor(79, 70, 229);
      doc.roundedRect(15, y, 180, 22, 3, 3, "F");

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", 20, y + 3, 16, 16);
        } catch {
          // Silent fallback if image adding fails
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("TRIP BUDDY", logoBase64 ? 40 : 20, y + 14);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("YOUR AI TRAVEL COMPANION", 120, y + 13);

      y += 38;

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(cleanTextForPDF(destinationLabel.split(",")[0]), 15, y);

      y += 6;
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(79, 70, 229);
      doc.text(cleanTextForPDF(destinationLabel), 15, y);

      y += 10;

      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(15, y, 180, 34, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("DURATION", 22, y + 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(cleanTextForPDF(summary.duration), 22, y + 12);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("START DATE", 22, y + 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(cleanTextForPDF(summary.startDate), 22, y + 25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("TRAVELERS", 80, y + 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(cleanTextForPDF(summary.travelers), 80, y + 12);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("ESTIMATED BUDGET", 80, y + 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      const budgetLines = doc.splitTextToSize(
        cleanTextForPDF(summary.budget),
        108,
      );
      doc.text(budgetLines, 80, y + 25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("INTERESTS", 138, y + 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      const interestLines = doc.splitTextToSize(
        cleanTextForPDF(summary.interests),
        50,
      );
      doc.text(interestLines, 138, y + 12);

      y += 46;

      if (hotels.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text("Recommended Stays", 15, y);
        doc.setDrawColor(229, 231, 235);
        doc.line(15, y + 2, 195, y + 2);
        y += 8;

        hotels.forEach((hotel) => {
          if (y > 235) {
            doc.addPage();
            drawPageDecorations(doc);
            y = 25;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(17, 24, 39);
          doc.text(cleanTextForPDF(hotel.name), 15, y);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const ratingText = hotel.rating ? `Rating: ${hotel.rating}/5` : "";
          const priceText = hotel.price
            ? `${formatPrice(hotel.price)}/night`
            : "";
          const rightText = [ratingText, priceText]
            .filter(Boolean)
            .join("  |  ");
          doc.text(cleanTextForPDF(rightText), 195, y, { align: "right" });

          y += 5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(107, 114, 128);
          doc.text("Address: " + cleanTextForPDF(hotel.address), 15, y);

          y += 4.5;
          doc.setFontSize(9);
          doc.setTextColor(75, 85, 99);
          const hotelDescLines = doc.splitTextToSize(
            cleanTextForPDF(hotel.description),
            180,
          );
          for (let i = 0; i < hotelDescLines.length; i++) {
            if (y > 268) {
              doc.addPage();
              drawPageDecorations(doc);
              y = 25;
            }
            doc.text(hotelDescLines[i], 15, y);
            y += 4.5;
          }
          y += 5.5;
        });
      }

      if (itineraryDays.length > 0) {
        if (y > 210) {
          doc.addPage();
          drawPageDecorations(doc);
          y = 25;
        } else {
          y += 5;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text("Daily Itinerary", 15, y);
        doc.setDrawColor(229, 231, 235);
        doc.line(15, y + 2, 195, y + 2);
        y += 8;

        itineraryDays.forEach((day) => {
          if (y > 235) {
            doc.addPage();
            drawPageDecorations(doc);
            y = 25;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(79, 70, 229);
          doc.text(cleanTextForPDF(`${day.label} — ${day.title}`), 15, y);
          y += 6.5;

          let lastBulletY = null;
          let lastBulletPage = null;

          day.activities.forEach((act) => {
            if (y > 245) {
              doc.addPage();
              drawPageDecorations(doc);
              y = 25;
              lastBulletY = null;
            }

            const currentPage = doc.getNumberOfPages();
            if (lastBulletY !== null && lastBulletPage === currentPage) {
              doc.setDrawColor(199, 210, 254);
              doc.setLineWidth(0.5);
              doc.line(18, lastBulletY + 1.2, 18, y - 1 - 1.2);
            }

            doc.setFillColor(79, 70, 229);
            doc.circle(18, y - 1, 1.2, "F");

            lastBulletY = y - 1;
            lastBulletPage = currentPage;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(17, 24, 39);
            const actTitle = `${act.time}  -  ${act.title}`;
            doc.text(cleanTextForPDF(actTitle), 23, y);

            if (act.estDuration) {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8.5);
              doc.setTextColor(107, 114, 128);
              doc.text(
                cleanTextForPDF(`Duration: ${act.estDuration} min`),
                195,
                y,
                { align: "right" },
              );
            }

            y += 5;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(75, 85, 99);
            const actDescLines = doc.splitTextToSize(
              cleanTextForPDF(act.description),
              172,
            );
            for (let i = 0; i < actDescLines.length; i++) {
              if (y > 268) {
                doc.addPage();
                drawPageDecorations(doc);
                y = 25;
                lastBulletY = null;
              }
              doc.text(actDescLines[i], 23, y);
              y += 4.5;
            }
            y += 4.5;
          });
          y += 4;
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawPageDecorations(doc);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: "right" });
      }

      const fileName = `${destinationLabel.split(",")[0].trim().replace(/\s+/g, "_")}_Itinerary.pdf`;
      doc.save(fileName);
    } catch {
      // Silent error handling
    } finally {
      setPdfDownloading(false);
    }
  };

  useEffect(() => {
    if (!loading) return;

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (apiDone) {
          const next = prev + 8;
          if (next >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
              setLoading(false);
            }, 150);
            return 100;
          }
          return next;
        }

        // Simulating slow but steady and non-stagnant loading increments
        let increment = 0;
        if (prev < 35) {
          increment = 1.2 + Math.random() * 1.8;
        } else if (prev < 70) {
          increment = 0.5 + Math.random() * 1.0;
        } else if (prev < 90) {
          increment = 0.2 + Math.random() * 0.4;
        } else if (prev < 98) {
          increment = 0.05 + Math.random() * 0.1;
        } else {
          increment = 0.005; // Never fully stalls, keeps animating
        }

        return Math.min(prev + increment, 99);
      });
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [loading, apiDone]);

  useEffect(() => {
    if (authLoading) return;

    if (!tripId) {
      if (requestId) {
        return;
      }
      navigate("/v2/create-trip");
      return;
    }

    const tripRef = doc(db, "Trips", tripId);

    const unsubscribe = onSnapshot(
      tripRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          setTrip(docSnap.data());
          sessionStorage.removeItem(TRIP_GENERATING_FLAG_KEY);
          setApiDone(true);
        } else {
          let foundTrip = readLocalTrip(tripId);
          if (!foundTrip && currentUser?.uid) {
            try {
              const userTripSnap = await getDoc(
                doc(db, "users", currentUser.uid, "trips", tripId),
              );
              if (userTripSnap.exists()) foundTrip = userTripSnap.data();
            } catch (e) {
              console.error("Error fetching user trip fallback:", e);
            }
          }

          if (foundTrip) {
            setTrip(foundTrip);
            sessionStorage.removeItem(TRIP_GENERATING_FLAG_KEY);
            setApiDone(true);
          } else {
            toast.error("Itinerary Not Found", {
              description: "We couldn't locate the requested travel itinerary.",
            });
            navigate("/v2/create-trip");
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error("onSnapshot error:", error);
        const errMsg = error instanceof Error ? error.message : String(error);
        toast.error("Sync Error", {
          description: `There was a problem syncing itinerary details in real-time. Details: ${errMsg}`,
        });
      },
    );

    return () => unsubscribe();
  }, [tripId, requestId, navigate, authLoading, currentUser]);

  useEffect(() => {
    if (!requestId || tripId || authLoading) return;

    if (!currentUser) {
      toast.error("Access Denied", {
        description: "Please sign in to view this trip request.",
      });
      navigate("/v2/create-trip");
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "Trip_requests", requestId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.status === "completed" && data.tripId) {
            toast.success("Trip generated successfully!", {
              description: "Your custom travel itinerary is ready.",
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
            });
            navigate(`/v2/view-trip/${data.tripId}`, { replace: true });
          } else if (data.status === "error") {
            setLoading(false);
            const errStr = String(data.error || "").toLowerCase();
            const isHighDemand =
              errStr.includes("429") ||
              errStr.includes("quota") ||
              errStr.includes("limit") ||
              errStr.includes("exhausted") ||
              errStr.includes("503") ||
              errStr.includes("overloaded");

            if (isHighDemand) {
              toast.error("High Server Demand", {
                description:
                  "The personalization service is currently experiencing high volume. Please wait a moment and try again.",
              });
            } else {
              toast.error("Generation Failed", {
                description:
                  "We encountered an unexpected issue while crafting your itinerary. Please try again.",
              });
            }
            navigate("/v2/create-trip");
          }
        } else {
          setLoading(false);
          toast.error("Itinerary Request Not Found", {
            description: "The request for this itinerary could not be found.",
          });
          navigate("/v2/create-trip");
        }
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setLoading(false);
        const errMsg = error instanceof Error ? error.message : String(error);
        toast.error("Sync Connection Failed", {
          description: `Unable to establish connection to track your itinerary creation. Details: ${errMsg}`,
        });
        navigate("/v2/create-trip");
      },
    );

    return () => unsubscribe();
  }, [requestId, tripId, navigate, authLoading, currentUser]);

  useEffect(() => {
    if (!requestId || tripId || !loading) return;

    const timeout = setTimeout(() => {
      setLoading(false);
      toast.error("Generation Timeout", {
        description:
          "Crafting your luxury itinerary is taking longer than expected. Please try again.",
      });
      navigate("/v2/create-trip");
    }, 60000); // 60 seconds

    return () => clearTimeout(timeout);
  }, [requestId, tripId, loading, navigate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const destinationLabel =
    typeof trip?.userSelection?.destination?.label === "string"
      ? trip.userSelection.destination.label
      : trip?.userSelection?.destination?.value || "Your Destination";

  const summary = {
    location: trip?.tripData?.trip_summary?.location || destinationLabel,
    duration:
      trip?.tripData?.trip_summary?.duration ||
      (trip?.userSelection?.noOfDays
        ? `${trip.userSelection.noOfDays} Days`
        : "Custom Duration"),
    budget: trip?.tripData?.trip_summary?.budget_note || "Budget flexible",
    travelers: trip?.userSelection?.travelers || "Solo/Group",
    startDate: formatFullDate(trip?.userSelection?.startDate || ""),
    interests: Array.isArray(trip?.userSelection?.interests)
      ? trip.userSelection.interests.join(", ")
      : trip?.userSelection?.interests || "General",
  };

  const hotels = normalizeHotels(trip?.tripData);
  const itineraryDays = normalizeItineraryDays(trip?.tripData);

  const statCards = [
    { label: "Duration", value: summary.duration, icon: CalendarDays },
    { label: "Travelers", value: summary.travelers, icon: Users },
    { label: "Start Date", value: summary.startDate, icon: Clock3 },
    { label: "Interests", value: summary.interests, icon: Heart },
    { label: "Budget", value: summary.budget, icon: Wallet },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-36 md:pt-40 px-4 md:px-6 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white">
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

          <div className="relative z-10 w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden shadow-inner mb-4">
            <div
              className="absolute top-0 left-0 h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <p className="relative z-10 text-sm font-bold text-slate-400/80">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen pt-36 md:pt-40 pb-16 px-4 md:px-6 bg-mesh">
      <SEO
        title={`Trip to ${destinationLabel}`}
        description={`Explore our curated AI itinerary for ${destinationLabel}. Includes recommended hotels, daily activities, and travel tips.`}
        keywords="AI Travel, Trip Planner, Itinerary Generator, Travel Agent, Vacation Planning"
        image="https://trip-buddy-n6b3.onrender.com/favicon.png"
        url={`https://trip-buddy-n6b3.onrender.com/v2/view-trip/${tripId || ""}`}
      />
      <div className="max-w-screen-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                <TooltipProvider>
                  <div className="flex flex-wrap items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => navigate(-1)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-white hover:text-indigo-600 transition-colors border border-white/20 shadow-sm cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          BACK
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Go Back</TooltipContent>
                    </Tooltip>

                    <Dialog
                      open={sharingDialogOpen}
                      onOpenChange={setSharingDialogOpen}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DialogTrigger asChild>
                            <button className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-indigo-600 transition-colors border border-white/20 shadow-sm cursor-pointer">
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Share Itinerary
                        </TooltipContent>
                      </Tooltip>

                      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black font-outfit text-slate-900 flex items-center gap-2">
                            <Share2 className="w-6 h-6 text-indigo-600" />
                            Share Itinerary
                          </DialogTitle>
                          <DialogDescription className="text-slate-500 font-medium font-outfit">
                            Configure access and copy the link to collaborate
                            with other travelers.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                          {isOwner ? (
                            <div className="space-y-3">
                              <label className="text-sm font-bold text-slate-700 font-outfit">
                                Collaboration Access
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSharingMode("view")
                                  }
                                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-sm font-bold font-outfit transition-all cursor-pointer ${
                                    trip?.sharingMode !== "edit"
                                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <Lock className="w-4 h-4" />
                                  View Only
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSharingMode("edit")
                                  }
                                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-sm font-bold font-outfit transition-all cursor-pointer ${
                                    trip?.sharingMode === "edit"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <Unlock className="w-4 h-4" />
                                  Collaborative
                                  {!isPremium && (
                                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-slate-400 font-medium leading-relaxed min-h-9">
                                {trip?.sharingMode === "edit"
                                  ? "Anyone with this link will be able to add, edit, or delete items on this itinerary in real-time."
                                  : "Anyone with this link can view the itinerary. Only you can make edits."}
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl border flex items-center gap-3 bg-slate-50/50 border-slate-200">
                              {trip?.sharingMode === "edit" ? (
                                <>
                                  <div className="p-2 bg-emerald-100 rounded-xl">
                                    <Unlock className="w-5 h-5 text-emerald-600" />
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-slate-900 text-sm">
                                      Collaborative Access
                                    </h5>
                                    <p className="text-xs text-slate-500 font-medium">
                                      You are allowed to edit this itinerary
                                      collaboratively.
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="p-2 bg-indigo-100 rounded-xl">
                                    <Lock className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-slate-900 text-sm">
                                      Read-Only Mode
                                    </h5>
                                    <p className="text-xs text-slate-500 font-medium">
                                      Only the trip owner can edit this
                                      itinerary.
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 font-outfit">
                              Shareable Link
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={window.location.href}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-600 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleShare}
                                className="inline-flex h-10 items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 text-xs font-bold text-white transition-all shadow-md shadow-indigo-100 cursor-pointer"
                              >
                                {copied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Copied!
                                  </>
                                ) : (
                                  "Copy"
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={exportToPDF}
                          disabled={pdfDownloading}
                          className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-indigo-600 transition-colors border border-white/20 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          {pdfDownloading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {pdfDownloading ? "Downloading..." : "Download PDF"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                <div className="space-y-6 max-w-4xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-xl px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white font-black border border-white/20 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    AI Curated Adventure
                  </div>
                  <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-none drop-shadow-2xl">
                    {destinationLabel.split(",")[0]}
                  </h1>
                  <p className="max-w-xl text-white/80 text-lg md:text-xl leading-relaxed font-bold drop-shadow-md">
                    {trip?.tripData?.tripNote?.split(".")[0] ||
                      "A personalized plan built around your travel style, budget, and schedule."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8 bg-white/50 backdrop-blur-md flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {statCards.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex flex-col h-full rounded-[1.8rem] glass-card p-6 border border-white/60 bg-white/40 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all group",
                      item.label === "Budget" && "sm:col-span-2",
                    )}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-100 text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                        {item.label}
                      </p>
                    </div>

                    <p className="text-lg font-black text-slate-900 leading-tight wrap-break-word">
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

        <Tabs
          defaultValue="itinerary"
          className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
            <TabsList className="bg-slate-100/60 rounded-2xl p-1 gap-1">
              <TabsTrigger
                value="itinerary"
                className="rounded-xl px-5 py-2 text-sm font-bold flex items-center gap-2"
              >
                <MapPinned className="w-4 h-4 text-indigo-600" />
                <span>Daily Itinerary</span>
              </TabsTrigger>
              {(hotels.length > 0 || canEdit) && (
                <TabsTrigger
                  value="hotels"
                  className="rounded-xl px-5 py-2 text-sm font-bold flex items-center gap-2"
                >
                  <Hotel className="w-4 h-4 text-indigo-600" />
                  <span>Stays & Hotels</span>
                </TabsTrigger>
              )}
            </TabsList>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">
              {itineraryDays.length} Days Planned{" "}
              {hotels.length > 0 && `• ${hotels.length} Stays Curated`}
            </div>
          </div>

          <TabsContent value="itinerary" className="space-y-6 mt-0">
            <div className="flex items-center gap-3 px-2 mb-4">
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
              <div className="w-full">
                <Accordion
                  type="single"
                  className="space-y-6"
                  value={itineraryDays[activeDayIndex]?.key || "day-1"}
                  onValueChange={(val) => {
                    if (val) {
                      const idx = itineraryDays.findIndex((d) => d.key === val);
                      if (idx !== -1) {
                        setActiveDayIndex(idx);
                        setTimeout(() => {
                          const element = document.getElementById(
                            `day-item-${val}`,
                          );
                          if (element) {
                            const elementPosition =
                              element.getBoundingClientRect().top +
                              window.scrollY;
                            const header = document.querySelector("header");
                            const headerHeight = header
                              ? header.getBoundingClientRect().bottom
                              : 100;
                            const offsetPosition =
                              elementPosition - headerHeight - 24;

                            window.scrollTo({
                              top: offsetPosition,
                              behavior: "smooth",
                            });
                          }
                        }, 250);
                      }
                    }
                  }}
                >
                  {itineraryDays.map((day, dayIndex) => (
                    <AccordionItem
                      key={day.key}
                      value={day.key}
                      id={`day-item-${day.key}`}
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

                            <div className="flex items-center gap-2 group/title">
                              <h4 className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors duration-300 truncate">
                                {day.title}
                              </h4>
                              {canEdit && (
                                <div className="flex items-center gap-1 opacity-0 group-hover/title:opacity-100 transition-opacity ml-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newTitle = prompt(
                                        "Enter new title for this day:",
                                        day.title,
                                      );
                                      if (newTitle && newTitle.trim()) {
                                        handleModifyItinerary(
                                          "EDIT_DAY_TITLE",
                                          {
                                            dayIndex,
                                            newTitle: newTitle.trim(),
                                          },
                                        );
                                      }
                                    }}
                                    className="p-1 rounded-md hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-rows-[0fr] group-data-[state=closed]:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-in-out mt-1">
                              <div className="overflow-hidden">
                                <p className="mt-1 text-sm font-medium text-slate-500 truncate flex items-center gap-1.5 opacity-0 group-data-[state=closed]:opacity-100 transition-opacity duration-500 delay-100">
                                  <span className="inline-flex items-center gap-1 text-indigo-600">
                                    <MapPin className="w-3.5 h-3.5" />
                                    Includes:
                                  </span>
                                  {day.activities
                                    .map((a) => a.title)
                                    .join(" • ")}
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
                          {day.activities.map((activity, activityIdx) => (
                            <div
                              key={activity.id}
                              className="group/card bg-white rounded-4xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 flex flex-col h-full overflow-hidden transition-all duration-500"
                            >
                              <div className="relative h-48 w-full overflow-hidden">
                                <GetPhoto
                                  locationItem={`${activity.title}, ${summary.location}`}
                                  className="h-full w-full"
                                  imageClassName="h-full w-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-4 right-4 pointer-events-none">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm border border-slate-100">
                                    <Clock3 className="w-3.5 h-3.5 text-indigo-600" />
                                    {activity.time}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-1 flex-col p-6 gap-3 text-left">
                                <a
                                  href={getGoogleMapsUrl(
                                    activity.title,
                                    summary.location,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block focus:outline-none"
                                >
                                  <h5 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2 hover:text-indigo-600 transition-colors">
                                    <span>{activity.title}</span>
                                    <div className="p-1.5 rounded-full bg-slate-50 hover:bg-indigo-50 shrink-0 transition-colors">
                                      <Navigation className="w-4 h-4 text-slate-400 hover:text-indigo-600 transition-colors" />
                                    </div>
                                  </h5>
                                </a>

                                {activity.estDuration && (
                                  <span className="w-fit inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 text-indigo-700 px-2.5 py-1.5 text-xs font-bold">
                                    <Hourglass className="w-3.5 h-3.5" />
                                    {activity.estDuration} min duration
                                  </span>
                                )}

                                {activity.holderName && (
                                  <span className="w-fit inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-700 px-2.5 py-1.5 text-xs font-bold">
                                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                                    Holder: {activity.holderName}
                                  </span>
                                )}

                                {activity.description && (
                                  <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3 mt-1">
                                    {activity.description}
                                  </p>
                                )}

                                {canEdit && (
                                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={activityIdx === 0}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleModifyItinerary(
                                            "REORDER_ACTIVITY",
                                            {
                                              dayIndex,
                                              activityIndex: activityIdx,
                                              direction: "up",
                                            },
                                          );
                                        }}
                                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={
                                          activityIdx ===
                                          day.activities.length - 1
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleModifyItinerary(
                                            "REORDER_ACTIVITY",
                                            {
                                              dayIndex,
                                              activityIndex: activityIdx,
                                              direction: "down",
                                            },
                                          );
                                        }}
                                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openActivityModal(
                                            "edit",
                                            dayIndex,
                                            activityIdx,
                                            activity,
                                          );
                                        }}
                                        className="p-2 rounded-xl border border-slate-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            confirm(
                                              "Are you sure you want to delete this activity?",
                                            )
                                          ) {
                                            handleModifyItinerary(
                                              "DELETE_ACTIVITY",
                                              {
                                                dayIndex,
                                                activityIndex: activityIdx,
                                              },
                                            );
                                          }
                                        }}
                                        className="p-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openActivityModal("add", dayIndex)}
                              className="group/add bg-slate-50/50 hover:bg-indigo-50/30 rounded-4xl border border-dashed border-slate-300 hover:border-indigo-300 min-h-75 flex flex-col items-center justify-center p-8 gap-4 transition-all duration-500 cursor-pointer"
                            >
                              <div className="p-4 rounded-full bg-white border border-slate-200 shadow-sm group-hover/add:scale-110 group-hover/add:border-indigo-200 transition-transform">
                                <Plus className="w-6 h-6 text-slate-400 group-hover/add:text-indigo-600" />
                              </div>
                              <div className="text-center">
                                <h5 className="text-lg font-bold text-slate-700 group-hover/add:text-indigo-600">
                                  Add Activity
                                </h5>
                                <p className="text-xs text-slate-400 font-medium max-w-50 mt-1">
                                  Add a new custom activity or stop to this
                                  day's plan.
                                </p>
                              </div>
                            </button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </TabsContent>

          {(hotels.length > 0 || canEdit) && (
            <TabsContent value="hotels" className="space-y-6 mt-0">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <Hotel className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-3xl font-black tracking-tight text-slate-900">
                  Recommended Stays
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel, hotelIdx) => (
                  <a
                    key={hotel.id}
                    href={getGoogleMapsUrl(hotel.name, hotel.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block h-full focus:outline-none hover:-translate-y-2 transition-transform duration-500"
                  >
                    <div className="bg-white rounded-4xl border border-slate-200/80 shadow-sm group-hover:shadow-2xl flex flex-col h-full overflow-hidden transition-all duration-500">
                      <div className="relative h-75 w-full overflow-hidden">
                        <GetPhoto
                          locationItem={`${hotel.name}, ${hotel.address}`}
                          className="h-full w-full"
                          imageClassName="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-4 right-4 pointer-events-none">
                          <span className="rounded-full bg-white/95 backdrop-blur px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm border border-slate-100">
                            {formatPrice(hotel.price)}{" "}
                            <span className="text-slate-500 font-medium">
                              / night
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-6 space-y-4 text-left">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                            <span>{hotel.name}</span>
                            <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-indigo-50 shrink-0 transition-colors">
                              <Navigation className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            </div>
                          </h4>
                          <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500 font-medium">
                            <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                            <span className="line-clamp-2">
                              {hotel.address}
                            </span>
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

                        {canEdit && (
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 mt-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openHotelModal("edit", hotelIdx, hotel);
                              }}
                              className="p-2 rounded-xl border border-slate-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (
                                  confirm(
                                    "Are you sure you want to delete this hotel stay?",
                                  )
                                ) {
                                  handleModifyHotels("DELETE_HOTEL", {
                                    hotelIndex: hotelIdx,
                                  });
                                }
                              }}
                              className="p-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openHotelModal("add")}
                    className="group/add bg-slate-50/50 hover:bg-indigo-50/30 rounded-4xl border border-dashed border-slate-300 hover:border-indigo-300 min-h-87.5 flex flex-col items-center justify-center p-8 gap-4 transition-all duration-500 cursor-pointer"
                  >
                    <div className="p-4 rounded-full bg-white border border-slate-200 shadow-sm group-hover/add:scale-110 group-hover/add:border-indigo-200 transition-transform">
                      <Plus className="w-6 h-6 text-slate-400 group-hover/add:text-indigo-600" />
                    </div>
                    <div className="text-center">
                      <h5 className="text-lg font-bold text-slate-700 group-hover/add:text-indigo-600">
                        Add Stay Recommendation
                      </h5>
                      <p className="text-xs text-slate-400 font-medium max-w-50 mt-1">
                        Recommend another stay or accommodation choice.
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {isOwner && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans select-none">
            {chatOpen && (
              <div className="w-96 max-w-[calc(100vw-2rem)] h-145 max-h-[calc(100vh-8rem)] rounded-4xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_24px_60px_-15px_rgba(79,70,229,0.15)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300 ease-out">
                <div className="p-5 bg-linear-to-b from-indigo-50/60 to-transparent border-b border-indigo-100/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-md text-white shadow-indigo-200">
                      <BotMessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                        {ROAMIE_CONFIG.title}
                      </h4>
                      <p className="text-[10px] text-indigo-600/80 font-bold uppercase tracking-wider">
                        {ROAMIE_CONFIG.subtitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200/60 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!isPremium && (
                  <div className="bg-amber-50/90 border-b border-amber-100/50 px-5 py-3 flex items-center gap-2.5 shrink-0">
                    <Gem className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                    <p className="text-[10px] font-bold text-amber-800 leading-normal text-left font-helvetica">
                      Roamie AI Assistant is a Premium feature.{" "}
                      <button
                        type="button"
                        onClick={() =>
                          window.dispatchEvent(new Event("open-pricing-dialog"))
                        }
                        className="underline font-black hover:text-amber-950 cursor-pointer"
                      >
                        Upgrade now
                      </button>{" "}
                      to ask questions.
                    </p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 bg-linear-to-b from-transparent to-slate-50/30">
                  {chatHistory.map((msg, index) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3",
                          isUser ? "flex-row-reverse" : "flex-row",
                        )}
                      >
                        {!isUser && (
                          <div className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold bg-white border border-indigo-100 shadow-xs text-indigo-600">
                            <BotMessageSquare className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          className={cn(
                            "max-w-[78%] px-4 py-3 text-sm font-medium leading-relaxed tracking-tight shadow-xs",
                            isUser
                              ? "rounded-2xl rounded-tr-xs bg-indigo-600 text-white shadow-indigo-100/50"
                              : "rounded-2xl rounded-tl-xs bg-white border border-slate-100 text-slate-700",
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}

                  {aiTyping && (
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold bg-white border border-indigo-100 shadow-xs text-indigo-600">
                        <BotMessageSquare className="w-4 h-4" />
                      </div>
                      <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-100 px-4 py-3 shadow-xs flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
                      </div>
                    </div>
                  )}

                  {chatHistory.length === 1 && !aiTyping && (
                    <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">
                        Suggested Controls
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ROAMIE_CONFIG.suggestedPrompts.map((prompt) => {
                          const PromptIcon = prompt.icon;

                          return (
                            <button
                              key={prompt.text}
                              type="button"
                              onClick={() => setInputText(prompt.text)}
                              className={`inline-flex items-center gap-2 text-xs font-semibold border rounded-xl px-3 py-2 text-left transition-all cursor-pointer shadow-xs ${prompt.chipClassName}`}
                            >
                              <PromptIcon
                                className={`w-3.5 h-3.5 shrink-0 ${prompt.iconClassName}`}
                              />
                              <span>{prompt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask assistant to refine route..."
                    disabled={aiTyping}
                    className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400/90 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || aiTyping}
                    className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100 shrink-0 cursor-pointer disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-95 transition-all cursor-pointer relative group border border-indigo-500/20",
                chatOpen
                  ? "bg-slate-900 shadow-slate-900/10"
                  : "bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700 shadow-indigo-600/20",
              )}
            >
              <BotMessageSquare
                className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  chatOpen && "rotate-12 scale-110",
                )}
              />
              {!chatOpen && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative flex rounded-full h-3.5 w-3.5 bg-indigo-600 items-center justify-center text-white border border-white/20 shadow-sm">
                    <Zap className="w-2 h-2 fill-white text-white" />
                  </span>
                </span>
              )}
            </button>
          </div>
        )}

        <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black font-outfit text-slate-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                {activityModalMode === "add" ? "Add Activity" : "Edit Activity"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium font-outfit">
                Enter the details of the itinerary stop below.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveActivity} className="space-y-4 py-2">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  value={activityForm.title}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, title: e.target.value })
                  }
                  placeholder="E.g., Visit Golden Gate Bridge"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Time
                  </label>
                  <input
                    type="text"
                    value={activityForm.time}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, time: e.target.value })
                    }
                    placeholder="E.g., 10:00 AM"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={activityForm.estDuration}
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        estDuration: e.target.value,
                      })
                    }
                    placeholder="E.g., 60"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Activity Holder Name
                </label>
                <input
                  type="text"
                  value={activityForm.holderName}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      holderName: e.target.value,
                    })
                  }
                  placeholder="E.g., John Doe"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  value={activityForm.description}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Write a brief description of the plans or hidden details..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm transition-all resize-none font-medium text-slate-600"
                />
              </div>

              <DialogFooter className="sm:justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold font-outfit cursor-pointer"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-outfit transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Save Activity
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={hotelModalOpen} onOpenChange={setHotelModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black font-outfit text-slate-900 flex items-center gap-2">
                <Hotel className="w-6 h-6 text-indigo-600" />
                {hotelModalMode === "add"
                  ? "Add Stay Recommendation"
                  : "Edit Stay Details"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium font-outfit">
                Enter the details of the recommended hotel stay.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveHotel} className="space-y-4 py-2">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Hotel Name
                </label>
                <input
                  type="text"
                  required
                  value={hotelForm.name}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, name: e.target.value })
                  }
                  placeholder="E.g., Fairmont San Francisco"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Address / Location
                </label>
                <input
                  type="text"
                  value={hotelForm.address}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, address: e.target.value })
                  }
                  placeholder="E.g., 950 Mason St, San Francisco, CA"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Price (e.g., ₹8,500)
                  </label>
                  <input
                    type="text"
                    value={hotelForm.price}
                    onChange={(e) =>
                      setHotelForm({ ...hotelForm, price: e.target.value })
                    }
                    placeholder="E.g., ₹8,500"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Rating (1-5)
                  </label>
                  <input
                    type="text"
                    value={hotelForm.rating}
                    onChange={(e) =>
                      setHotelForm({ ...hotelForm, rating: e.target.value })
                    }
                    placeholder="E.g., 4.7"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  value={hotelForm.description}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, description: e.target.value })
                  }
                  placeholder="Describe key highlights, room choices, or why this stay was curated..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium transition-all resize-non text-slate-600"
                />
              </div>

              <DialogFooter className="sm:justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold font-outfit cursor-pointer"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-outfit transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Save Hotel Stay
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ViewTrip;
