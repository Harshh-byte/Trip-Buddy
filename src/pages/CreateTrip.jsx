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

const CreateTrip = () => {
  const placesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [startDateValue, setStartDateValue] = useState();
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

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getFlagComponent = (locationLabel) => {
    if (!locationLabel) return null;

    const parts = locationLabel.split(",");
    const countryName = parts[parts.length - 1].trim();
    const countryCode = Countries.getAlpha2Code(countryName, "en");

    if (countryCode && FlagIcons[countryCode]) {
      const Flag = FlagIcons[countryCode];
      return <Flag className="w-6 h-4 shadow-sm object-cover" />;
    }
    return <MapPin className="w-4 h-4 text-gray-400" />;
  };

  const getDestinationLabel = (destination) => {
    if (!destination || typeof destination !== "object") return "";
    return typeof destination.label === "string" ? destination.label : "";
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

  const saveTripLocally = (docId, tripPayload) => {
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
  4. Each activity in the plan must have: title, item_desc, image_url, ticket_pricing,  travel_time_min, and geo_coordinates (lat/lng).
    5. Convert all monetary values to INR and include rounded INR values wherever possible.
    6. IMPORTANT: If an image URL is unavailable, return an empty string for 'image_url'.
    7. Return the result strictly as a single JSON object using snake_case keys as defined above.
  `.trim();

    try {
      const result = await generateTripWithAI(DYNAMIC_PROMPT);
      await saveToDB(result);
      toast.dismiss(loadingToastId);
      toast.success("Trip created", {
        description: "Your itinerary is ready.",
      });
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToastId);
      if (
        error?.message !== "AUTH_REQUIRED" &&
        error?.code !== "permission-denied"
      ) {
        toast.error("Generation Failed", {
          description: "AI encountered an error. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

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
      await setDoc(doc(db, "AI-Trips", docId), tripPayload);

      navigate(`/view-trip/${docId}`);
    } catch (error) {
      console.error("Firebase Error:", error);
      if (error?.message === "AUTH_REQUIRED") {
        setOpenDialog(true);
        toast.error("Please sign in", {
          description: "Please sign in to continue.",
        });
        return;
      }

      if (error?.code === "permission-denied") {
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

        navigate(`/view-trip/${docId}`);
        return;
      }
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
            {/* 1. Destination Input */}
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
                    {/* 2. Date Input */}
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
                            onSelect={(date) => {
                              setStartDateValue(date);
                              handleInputChange(
                                "startDate",
                                date ? format(date, "yyyy-MM-dd") : "",
                              );
                              if (date) {
                                setIsDatePopoverOpen(false);
                              }
                            }}
                            disabled={{ before: new Date() }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* 3. Number of Days Input */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TRAVELER_OPTIONS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        handleInputChange("travelers", item.people)
                      }
                      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all text-left ${formData.travelers === item.people ? "border-indigo-600 bg-indigo-50 shadow-md" : "border-gray-100 bg-white"}`}
                    >
                      <div className="mb-2 text-2xl">{item.icon}</div>
                      <h4 className="font-bold text-gray-800">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
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
                      onClick={() => handleInputChange("budget", item.label)}
                      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all text-left ${formData.budget === item.label ? "border-indigo-600 bg-indigo-50 shadow-lg" : "border-gray-100 bg-white"}`}
                    >
                      <div className="p-2 bg-white rounded-lg mb-3 inline-block shadow-sm text-2xl">
                        {item.icon}
                      </div>
                      <h4 className="font-bold text-gray-800">{item.label}</h4>
                      <p className="text-xs text-indigo-600 font-bold uppercase">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-auto pt-10 gap-4">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-6 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
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
