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
        id: `stop-${idx}`,
        time: item?.time || item?.start_time || "Flexible",
        title: item?.title || item?.name || "Activity",
        description:
          item?.item_desc ||
          item?.itemDesc ||
          item?.description ||
          "A highly recommended stop on your journey.",
        estDuration: item?.est_duration_min || null,
        geo_coordinates: item?.geo_coordinates || item?.coordinates || null,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
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

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pdfDownloading, setPdfDownloading] = useState(false);
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
      if (targetUserId) {
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
      toast.error("Failed to sync trip updates. Please try again.");
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
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

      const systemPrompt = ROAMIE_CONFIG.getSystemPrompt(trip?.tripData, trip?.userSelection);

      const response = await fetch(
        ROAMIE_CONFIG.getApiUrl(geminiApiKey),
        {
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
        },
      );

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
      toast.error("Failed to process message.");
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
        } catch (e) {
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
    return str
      .replace(/₹/g, "Rs. ")
      .replace(/[\u201e\u200e\u200b\u200f\ufeff]/g, "")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const exportToPDF = async () => {
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
        } catch (e) {
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
    } catch (error) {
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
        if (requestId) {
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
        } catch (e) {}
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
  }, [tripId, requestId, navigate]);

  useEffect(() => {
    if (!requestId || tripId) return;

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
            toast.error("Generation Failed", {
              description: data.error || "An error occurred while crafting your trip. Please try again.",
            });
            navigate("/v2/create-trip");
          }
        }
      },
    );

    return () => unsubscribe();
  }, [requestId, tripId, navigate]);

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
      startDate: formatFullDate(trip?.userSelection?.startDate || ""),
      interests: Array.isArray(trip?.userSelection?.interests)
        ? trip.userSelection.interests.join(", ")
        : trip?.userSelection?.interests || "General",
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
    { label: "Interests", value: summary.interests, icon: Heart },
    { label: "Budget", value: summary.budget, icon: Wallet },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-6 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white">
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
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-6 bg-mesh">
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
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate("/v2/create-trip")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-white hover:text-indigo-600 transition-colors border border-white/20 shadow-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Planner
                  </button>

                  <div className="relative group">
                    <button
                      onClick={handleShare}
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-indigo-600 transition-colors border border-white/20 shadow-sm cursor-pointer"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-slate-950/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 pointer-events-none transition-all duration-200 z-30 whitespace-nowrap">
                      {copied ? "Link Copied!" : "Share Trip"}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-950/90" />
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      onClick={exportToPDF}
                      disabled={pdfDownloading}
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-indigo-600 transition-colors border border-white/20 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {pdfDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-slate-950/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 pointer-events-none transition-all duration-200 z-30 whitespace-nowrap">
                      {pdfDownloading ? "Downloading..." : "Download PDF"}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-950/90" />
                    </div>
                  </div>
                </div>

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
                  <article className="flex h-full flex-col overflow-hidden rounded-4xl glass-card hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="relative h-56 w-full overflow-hidden">
                      <GetPhoto
                        locationItem={`${hotel.name}, ${hotel.address}`}
                        className="h-full w-full"
                        imageClassName="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                        <h4 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                          <span>{hotel.name}</span>
                          <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-indigo-50 shrink-0 transition-colors">
                            <Navigation className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
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
            <div className="w-full">
              <Accordion
                type="single"
                className="space-y-6"
                value={itineraryDays[activeDayIndex]?.key || "day-1"}
                onValueChange={(val) => {
                  if (val) {
                    const idx = itineraryDays.findIndex((d) => d.key === val);
                    if (idx !== -1) setActiveDayIndex(idx);
                  }
                }}
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
                            className="group/card relative flex flex-col h-full overflow-hidden rounded-4xl glass-card hover:shadow-xl hover:-translate-y-1 transition-all"
                          >
                            <div className="relative h-48 w-full overflow-hidden p-2 pb-0">
                              <GetPhoto
                                locationItem={`${activity.title}, ${summary.location}`}
                                className="h-full w-full rounded-3xl"
                                imageClassName="h-full w-full object-cover group-hover/card:scale-110 transition-transform duration-700"
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
                                <h5 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2 group-hover/card:text-indigo-600 transition-colors">
                                  <span>{activity.title}</span>
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
            </div>
          )}
        </section>

        {isOwner && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans select-none">
            {chatOpen && (
              <div className="w-96 max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-8rem)] rounded-4xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_24px_60px_-15px_rgba(79,70,229,0.15)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300 ease-out">
                <div className="p-5 bg-linear-to-b from-indigo-50/60 to-transparent border-b border-indigo-100/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-md text-white shadow-indigo-200">
                      <BotMessageSquare className="w-5 h-5" />
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
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
                        {ROAMIE_CONFIG.suggestedPrompts.map((promptText) => (
                          <button
                            key={promptText}
                            type="button"
                            onClick={() => setInputText(promptText.substring(2))}
                            className="text-xs font-semibold text-slate-600 bg-white hover:bg-indigo-50/30 border border-slate-200/70 hover:border-indigo-200/50 rounded-xl px-3 py-2 text-left transition-all cursor-pointer shadow-xs"
                          >
                            {promptText}
                          </button>
                        ))}
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
              <BotMessageSquare className={cn("w-5 h-5 transition-transform duration-300", chatOpen && "rotate-12 scale-110")} />
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
      </div>
    </div>
  );
};

export default ViewTrip;
