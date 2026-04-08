import { useState } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import {
  CalendarDays,
  MapPin,
  ChevronLeft,
  Sparkles,
  ChevronRight,
  Loader2,
  TentTree,
} from "lucide-react";
import { format } from "date-fns";
import { BUDGET_OPTIONS, TRAVELER_OPTIONS } from "../assets/data";
import { generateTripWithAI } from "../services/aiModel";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import LoginDialog from "../components/shared/LoginDialog";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import Countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import * as FlagIcons from "country-flag-icons/react/3x2";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import { cn } from "../lib/utils";

Countries.registerLocale(enLocale);

const TRIP_GENERATING_FLAG_KEY = "tripbuddy:generating-trip";

const flagIconMap =
  /** @type {Record<string, import("react").ComponentType<{ className?: string }>>} */ (
    FlagIcons
  );

const CreateTrip = () => {
  const placesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [startDateValue, setStartDateValue] = /** @type {[
    Date | undefined,
    import("react").Dispatch<import("react").SetStateAction<Date | undefined>>
  ]} */ (useState(undefined));
  const [formData, setFormData] = useState(
    /** @type {{
     * destination: { label: string; value: unknown } | null;
     * noOfDays: string;
     * startDate: string;
     * travelers: string;
     * budget: string;
     * }} */ ({
      destination: null,
      noOfDays: "",
      startDate: "",
      travelers: "",
      budget: "",
    }),
  );

  const handleInputChange = (
    /** @type {"destination" | "noOfDays" | "startDate" | "travelers" | "budget"} */ name,
    /** @type {unknown} */ value,
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getFlagComponent = (/** @type {string} */ locationLabel) => {
    if (!locationLabel) return null;

    const parts = locationLabel.split(",");
    const countryName = parts[parts.length - 1].trim();
    const countryCode = Countries.getAlpha2Code(countryName, "en");

    if (countryCode && flagIconMap[countryCode]) {
      const Flag = flagIconMap[countryCode];
      return <Flag className="w-6 h-4 shadow-sm object-cover" />;
    }
    return <MapPin className="w-4 h-4 text-gray-400" />;
  };

  const getDestinationLabel = (/** @type {unknown} */ destination) => {
    if (!destination || typeof destination !== "object") return "";
    const destinationValue = /** @type {{ label?: unknown }} */ (destination);
    return typeof destinationValue.label === "string"
      ? destinationValue.label
      : "";
  };

  const waitForFirebaseUser = async () => {
    if (auth.currentUser) return auth.currentUser;

    return new Promise((resolve) => {
      let settled = false;
      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve(null);
      }, 8000);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        unsubscribe();
        resolve(user);
      });
    });
  };

  const saveTripLocally = (
    /** @type {string} */ docId,
    /** @type {unknown} */ tripPayload,
  ) => {
    localStorage.setItem(`local-trip-${docId}`, JSON.stringify(tripPayload));
  };

  const onGenerateTrip = async () => {
    const user = localStorage.getItem("user");
    const destinationLabel = getDestinationLabel(formData.destination);
    const firebaseUser = await waitForFirebaseUser();

    if (!user) {
      setOpenDialog(true);
      toast.error("Login required", {
        description: "Please sign in to continue.",
      });
      return;
    }

    if (!firebaseUser) {
      setOpenDialog(true);
      toast.error("Session expired", {
        description: "Please continue with Google to proceed.",
      });
      return;
    }

    if (
      !formData?.destination ||
      !formData?.noOfDays ||
      !formData?.budget ||
      !formData?.travelers
    ) {
      toast.error("Incomplete Details", {
        description: "Please fill all fields.",
      });
      return;
    }

    setLoading(true);
    sessionStorage.setItem(TRIP_GENERATING_FLAG_KEY, "1");
    navigate("/v2/view-trip");

    const loadingToastId = toast.info("Generating your itinerary...", {
      description: `Crafting a ${formData.noOfDays}-day adventure to ${destinationLabel}`,
      icon: <Loader2 className="animate-spin w-4 h-4" />,
    });

    const DYNAMIC_PROMPT = `
  Generate a detailed travel plan for:
  - Location: ${destinationLabel}
  - Duration: ${formData?.noOfDays} Days
  - Group: ${formData?.travelers}
  - Budget Level: ${formData?.budget}

  Instructions:
    1. Provide a 'trip_note' about ${destinationLabel} under 25 words.
  2. Provide a 'hotel_options' array. Each hotel must have: hotel_name, address, price_per_night,   image_url, rating, description, and geo_coordinates (lat/lng).
  3. Provide an 'itinerary' object. Each day (e.g., "day_1") must have: title, best_time_to_visit,  and a 'plan' array.
  4. Each activity in the plan must have: title, item_desc, image_url, ticket_pricing, travel_time_min, est_duration_min, and geo_coordinates (lat/lng).
    5. Convert all monetary values to INR and include rounded INR values wherever possible.
    6. IMPORTANT: If an image URL is unavailable, return an empty string for 'image_url'.
    7. Timing realism rules:
       - Keep a realistic day pace with proper time gaps between activities.
       - Meals (breakfast/lunch/dinner) must have est_duration_min >= 45.
       - Museums/major attractions usually need 60-180 minutes.
       - travel_time_min should reflect practical city movement, not ideal no-traffic movement.
    8. Return the result strictly as a single JSON object using snake_case keys as defined above.
  `.trim();

    try {
      const result = await generateTripWithAI(DYNAMIC_PROMPT);
      await saveToDB(result);
      toast.dismiss(loadingToastId);
      toast.success("Trip created", {
        description: "Your itinerary is ready.",
      });
    } catch (error) {
      sessionStorage.removeItem(TRIP_GENERATING_FLAG_KEY);
      const aiError = /** @type {{ message?: string; code?: string }} */ (
        error
      );
      console.error(error);
      toast.dismiss(loadingToastId);
      if (
        aiError?.message !== "AUTH_REQUIRED" &&
        aiError?.code !== "permission-denied"
      ) {
        toast.error("Generation Failed", {
          description: "AI encountered an error. Please try again.",
        });
      }
      navigate("/v2/create-trip");
    } finally {
      setLoading(false);
    }
  };

  /** @param {unknown} aiResult */
  const saveToDB = async (aiResult) => {
    try {
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;

      const firebaseUser = auth.currentUser;
      if (!firebaseUser?.uid) {
        throw new Error("AUTH_REQUIRED");
      }

      const docId = Date.now().toString();

      const parsedData =
        typeof aiResult === "string" ? JSON.parse(aiResult) : aiResult;

      const tripPayload = {
        userSelection: formData,
        tripData: parsedData,
        userEmail: user?.email || firebaseUser?.email || "",
        userName: user?.name || firebaseUser?.displayName || "",
        userPhoto: user?.picture || firebaseUser?.photoURL || "",
        userId: firebaseUser.uid,
        id: docId,
        createdAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", firebaseUser.uid, "trips", docId),
        tripPayload,
      );
      await setDoc(doc(db, "Trips", docId), tripPayload);

      sessionStorage.removeItem(TRIP_GENERATING_FLAG_KEY);
      navigate(`/v2/view-trip/${docId}`);
    } catch (error) {
      const dbError = /** @type {{ message?: string; code?: string }} */ (
        error
      );
      console.error("Firebase Error:", error);
      if (dbError?.message === "AUTH_REQUIRED") {
        setOpenDialog(true);
        toast.error("Please sign in", {
          description: "Please sign in to continue.",
        });
        return;
      }

      if (dbError?.code === "permission-denied") {
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const docId = Date.now().toString();
        const parsedData =
          typeof aiResult === "string" ? JSON.parse(aiResult) : aiResult;
        const fallbackTripPayload = {
          userSelection: formData,
          tripData: parsedData,
          userEmail: user?.email || "",
          userName: user?.name || "",
          userPhoto: user?.picture || "",
          userId: auth.currentUser?.uid || "",
          id: docId,
          createdAt: new Date().toISOString(),
        };

        saveTripLocally(docId, fallbackTripPayload);

        toast.warning("Cloud save unavailable", {
          description:
            "Trip opened from this device only until Firestore rules are updated.",
        });

        sessionStorage.removeItem(TRIP_GENERATING_FLAG_KEY);
        navigate(`/view-trip/${docId}`);
        return;
      }
      sessionStorage.removeItem(TRIP_GENERATING_FLAG_KEY);
      throw error;
    }
  };

  const stepMeta = [
    { id: 1, label: "Basics" },
    { id: 2, label: "Travelers" },
    { id: 3, label: "Budget" },
  ];

  return (
    <div className="max-padd-container flex justify-center items-center pt-20 pb-10 min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[85vh]">
        <div className="p-6 md:p-12 flex flex-col flex-1">
          <div className="mb-8 rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 to-purple-50 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs md:text-sm font-semibold text-indigo-700">
                Step {step} of 3
              </p>
              <p className="text-xs md:text-sm font-semibold text-gray-500">
                {stepMeta[step - 1]?.label}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {stepMeta.map((item) => {
                const isComplete = step > item.id;
                const isActive = step === item.id;

                return (
                  <div key={item.id} className="space-y-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all duration-500",
                        isComplete
                          ? "bg-indigo-600"
                          : isActive
                            ? "bg-indigo-400"
                            : "bg-indigo-100",
                      )}
                    />
                    <p
                      className={cn(
                        "text-[11px] md:text-xs font-medium truncate",
                        isActive || isComplete
                          ? "text-indigo-700"
                          : "text-gray-400",
                      )}
                    >
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                  <h3 className="text-3xl font-extrabold text-gray-900">
                    Plan your adventure
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Where and when are we going?
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="flex flex-col gap-3">
                    <label className="font-bold text-gray-800 flex items-center gap-2 ml-1">
                      <MapPin className="w-4 h-4 text-indigo-600" /> Destination
                    </label>
                    <div
                      className={cn(
                        "rounded-2xl border bg-white px-3 py-1 transition-all",
                        formData.destination
                          ? "border-indigo-200 ring-4 ring-indigo-50"
                          : "border-gray-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100",
                      )}
                    >
                      <GooglePlacesAutocomplete
                        apiKey={placesApiKey}
                        autocompletionRequest={{ types: ["(cities)"] }}
                        selectProps={{
                          value: formData.destination,
                          onChange: (v) => handleInputChange("destination", v),
                          placeholder: "Search city or destination...",
                          isClearable: true,
                          unstyled: true,
                          styles: {
                            container: (base) => ({
                              ...base,
                              width: "100%",
                            }),
                            control: () => ({
                              border: "none",
                              boxShadow: "none",
                              background: "transparent",
                              minHeight: "48px",
                              display: "flex",
                              alignItems: "center",
                            }),
                            placeholder: (base) => ({
                              ...base,
                              color: "#9ca3af",
                              fontSize: "0.95rem",
                              marginLeft: "4px",
                            }),
                            input: (base) => ({
                              ...base,
                              marginLeft: "4px",
                              color: "#111827",
                            }),
                            singleValue: (base) => ({
                              ...base,
                              marginLeft: "4px",
                              fontWeight: "500",
                              color: "#4f46e5",
                            }),
                            menu: (base) => ({
                              ...base,
                              zIndex: 100,
                              marginTop: "12px",
                              borderRadius: "1.25rem",
                              border: "1px solid #eef2ff",
                              backgroundColor: "#ffffff",
                              overflow: "hidden",
                              boxShadow:
                                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isFocused
                                ? "#f5f3ff"
                                : "transparent",
                              color: state.isFocused ? "#4f46e5" : "#374151",
                              padding: "12px 16px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                              transition: "all 0.2s ease",
                            }),
                          },
                          formatOptionLabel: (data, { context }) => {
                            if (context === "value")
                              return (
                                <div className="flex items-center gap-2">
                                  {getFlagComponent(data.label)}
                                  <span>{data.label}</span>
                                </div>
                              );
                            return (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-6 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden shrink-0 shadow-sm">
                                  {getFlagComponent(data.label)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-800 leading-tight">
                                    {data.label.split(",")[0]}
                                  </span>
                                  <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                                    {data.label
                                      .split(",")
                                      .slice(1)
                                      .join(",")
                                      .trim()}
                                  </span>
                                </div>
                              </div>
                            );
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-3">
                      <label className="font-bold text-gray-800 flex items-center gap-2 ml-1">
                        <CalendarDays className="w-4 h-4 text-indigo-600" />{" "}
                        Start Date
                      </label>
                      <Popover
                        open={isDatePopoverOpen}
                        onOpenChange={setIsDatePopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            className={cn(
                              "w-full justify-start text-left font-medium p-4 bg-white border rounded-2xl h-14.5 transition-all shadow-sm hover:bg-white",
                              startDateValue
                                ? "border-indigo-200 ring-4 ring-indigo-50 text-indigo-600"
                                : "border-gray-200 text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100",
                            )}
                          >
                            <CalendarDays
                              className={cn(
                                "mr-2 h-4 w-4",
                                startDateValue
                                  ? "text-indigo-600"
                                  : "text-gray-400",
                              )}
                            />
                            {startDateValue ? (
                              format(startDateValue, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 border-none shadow-2xl rounded-3xl"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={startDateValue}
                            onSelect={
                              /** @param {Date | undefined} date */
                              (date) => {
                                setStartDateValue(date);
                                handleInputChange(
                                  "startDate",
                                  date ? format(date, "yyyy-MM-dd") : "",
                                );
                                if (date) {
                                  setIsDatePopoverOpen(false);
                                }
                              }
                            }
                            disabled={{ before: today }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="font-bold text-gray-800 flex items-center gap-2 ml-1">
                        <TentTree className="w-4 h-4 text-indigo-600" /> No. of
                        Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        placeholder="Ex: 3"
                        value={formData.noOfDays}
                        className={cn(
                          "p-4 bg-white border rounded-2xl outline-none h-14.5 transition-all shadow-sm font-medium",
                          formData.noOfDays
                            ? "border-indigo-200 ring-4 ring-indigo-50 text-indigo-600"
                            : "border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100",
                        )}
                        onChange={(e) =>
                          handleInputChange("noOfDays", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-900">
                    Who's joining?
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {TRAVELER_OPTIONS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        handleInputChange("travelers", item.people)
                      }
                      role="button"
                      tabIndex={0}
                      aria-pressed={formData.travelers === item.people}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleInputChange("travelers", item.people);
                        }
                      }}
                      className={cn(
                        "group p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 text-left hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100",
                        formData.travelers === item.people
                          ? "border-indigo-600 bg-indigo-50 shadow-lg"
                          : "border-gray-100 bg-white hover:border-indigo-200",
                      )}
                    >
                      <div
                        className={cn(
                          "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                          formData.travelers === item.people
                            ? "bg-white text-indigo-600"
                            : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
                        )}
                      >
                        {item.icon}
                      </div>
                      <h4 className="font-bold text-gray-800">{item.title}</h4>
                      <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-900">
                    Choose Budget
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {BUDGET_OPTIONS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        !loading && handleInputChange("budget", item.label)
                      }
                      aria-disabled={loading}
                      className={cn(
                        "group p-6 border-2 rounded-2xl transition-all duration-200 text-left",
                        loading
                          ? "cursor-not-allowed border-slate-200 bg-slate-50/90 shadow-none"
                          : "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200",
                        !loading && formData.budget === item.label
                          ? "border-indigo-600 bg-indigo-50 shadow-lg"
                          : !loading
                            ? "border-gray-100 bg-white"
                            : "",
                      )}
                    >
                      <div
                        className={cn(
                          "mb-3 inline-flex h-12 min-w-12 px-2 items-center justify-center rounded-xl border text-2xl transition-colors",
                          loading
                            ? "border-slate-200 bg-slate-100 text-slate-400"
                            : formData.budget === item.label
                              ? "border-indigo-200 bg-white text-indigo-600 shadow-sm"
                              : "border-indigo-100 bg-indigo-50 text-indigo-600 group-hover:border-indigo-200 group-hover:bg-indigo-100",
                        )}
                      >
                        {item.icon}
                      </div>
                      <h4
                        className={cn(
                          "font-bold",
                          loading ? "text-slate-500" : "text-gray-800",
                        )}
                      >
                        {item.label}
                      </h4>
                      <p
                        className={cn(
                          "text-xs font-medium leading-relaxed",
                          loading ? "text-slate-400" : "text-indigo-600",
                        )}
                      >
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-auto pt-10 gap-4">
              {step > 1 && (
                <button
                  disabled={loading}
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-6 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-inner disabled:hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
              )}
              <button
                disabled={loading}
                onClick={() =>
                  step < 3 ? setStep(step + 1) : onGenerateTrip()
                }
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-gray-300 transition-all shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> Generating...
                  </>
                ) : step === 3 ? (
                  <>
                    <Sparkles className="w-5 h-5" /> Generate Plan
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <LoginDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onLoginSuccess={onGenerateTrip}
      />
    </div>
  );
};

export default CreateTrip;
