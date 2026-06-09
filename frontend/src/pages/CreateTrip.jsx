import { useState, useEffect } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import {
  CalendarDays,
  MapPin,
  ChevronLeft,
  Loader2,
  TentTree,
  LandPlot,
  ChevronsRight,
} from "lucide-react";
import { format } from "date-fns";
import { BUDGET_OPTIONS, TRAVELER_OPTIONS, INTEREST_OPTIONS } from "../assets/data";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
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
import SEO from "../components/shared/SEO";

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
  const location = useLocation();
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
     * interests: string[];
     * }} */ ({
      destination: location.state?.destination || null,
      noOfDays: "",
      startDate: "",
      travelers: "",
      budget: "",
      interests: [],
    }),
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleInputChange = (
    /** @type {"destination" | "noOfDays" | "startDate" | "travelers" | "budget" | "interests"} */ name,
    /** @type {unknown} */ value,
  ) => {
    // @ts-ignore: allow dynamic key assignment on formData
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


  const handleNext = () => {
    if (step === 1) {
      if (!formData.destination) {
        toast.error("Destination Required", {
          description: "Please specify your travel destination to continue.",
        });
        return;
      }
      if (!formData.startDate) {
        toast.error("Departure Date", {
          description: "Please select a start date for your journey.",
        });
        return;
      }
      if (!formData.noOfDays) {
        toast.error("Trip Duration", {
          description: "Please enter the number of days for your itinerary.",
        });
        return;
      }
      if (Number(formData.noOfDays) > 7) {
        toast.error("Too many days", {
          description: "For optimal itineraries, trips are currently limited to 7 days.",
        });
        return;
      }
    }
    if (step === 2) {
      if (!formData.travelers) {
        toast.error("Travel Companions", {
          description: "Please select who will be joining you on this trip.",
        });
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      if (!formData.budget) {
        toast.error("Travel Budget", {
          description: "Please select a budget level to finalize your request.",
        });
        return;
      }
      if (formData.interests.length === 0) {
        toast.error("Select Interests", {
          description: "Please select at least one interest to personalize your trip.",
        });
        return;
      }
      onGenerateTrip();
    }
  };

  const onGenerateTrip = async () => {
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;
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

    setLoading(true);

    const loadingToastId = toast.info("Initializing itinerary...", {
      description: `Sending your request for a ${formData.noOfDays}-day adventure to ${destinationLabel}.`,
      icon: <Loader2 className="animate-spin w-4 h-4" />,
    });

    try {
      const docId = Date.now().toString();

      const requestPayload = {
        formData: {
          ...formData,
          destinationLabel: destinationLabel,
        },
        userEmail: user?.email || firebaseUser?.email || "",
        userName: user?.name || firebaseUser?.displayName || "",
        userPhoto: user?.picture || firebaseUser?.photoURL || "",
        userId: firebaseUser.uid,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "Trip_requests", docId), requestPayload);

      toast.dismiss(loadingToastId);

      sessionStorage.removeItem(TRIP_GENERATING_FLAG_KEY);
      navigate(`/v2/view-trip?requestId=${docId}`);
    } catch (error) {
      sessionStorage.removeItem(TRIP_GENERATING_FLAG_KEY);
      toast.dismiss(loadingToastId);
      toast.error("Request Failed", {
        description: "Unable to start generation. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const stepMeta = [
    { id: 1, label: "Destination" },
    { id: 2, label: "Companions" },
    { id: 3, label: "Experience" },
  ];

  return (
    <div className="min-h-screen bg-mesh pt-32 pb-20 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-700" />

      <SEO
        title="Create Your Trip | Trip Buddy"
        description="Plan your next adventure with our AI trip planner. Select your destination, budget, and travel style to get a personalized itinerary."
        keywords="AI Travel, Trip Planner, Itinerary Generator, Travel Agent, Vacation Planning"
        image="https://trip-buddy-n6b3.onrender.com/favicon.png"
        url="https://trip-buddy-n6b3.onrender.com/v2/create-trip"
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1]">
            Design your next <br />
            <span className="text-indigo-600">Great Adventure</span>
          </h1>
          <p className="text-slate-500 font-medium mt-4 text-lg">
            Tell us your preferences and let our AI curate the perfect
            itinerary.
          </p>
        </div>

        <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/40">
          <div className="p-1 md:p-2 bg-white/40 backdrop-blur-xl">
            <div className="bg-white/80 rounded-4xl p-6 md:p-12">
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    Step 0{step} / 03
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    {stepMeta[step - 1]?.label}
                  </span>
                </div>
                <div className="flex gap-3">
                  {stepMeta.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-all duration-700",
                        step >= item.id
                          ? "bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                          : "bg-slate-100",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-left">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                        Where are you{" "}
                        <span className="text-indigo-600">headed?</span>
                      </h3>
                      <p className="text-slate-500 font-medium mt-2">
                        Tell us your dream destination and when you want to go.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="flex flex-col gap-3">
                        <label className="font-bold text-gray-800 flex items-center gap-2 ml-1">
                          <MapPin className="w-4 h-4 text-indigo-600" />{" "}
                          Destination
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
                              onChange: (v) =>
                                handleInputChange("destination", v),
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
                                menuList: (base) => ({
                                  ...base,
                                  maxHeight: "220px",
                                  overflowY: "auto",
                                  scrollbarWidth: "thin",
                                  scrollbarColor: "rgba(79, 70, 229, 0.4) transparent",
                                  "&::-webkit-scrollbar": {
                                    width: "6px",
                                    height: "6px",
                                  },
                                  "&::-webkit-scrollbar-track": {
                                    background: "transparent",
                                  },
                                  "&::-webkit-scrollbar-thumb": {
                                    background: "rgba(79, 70, 229, 0.4)",
                                    borderRadius: "9999px",
                                  },
                                  "&::-webkit-scrollbar-thumb:hover": {
                                    background: "rgba(79, 70, 229, 0.7)",
                                  },
                                }),
                                option: (base, state) => ({
                                  ...base,
                                  backgroundColor: state.isFocused
                                    ? "#f5f3ff"
                                    : "transparent",
                                  color: state.isFocused
                                    ? "#4f46e5"
                                    : "#374151",
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
                            <TentTree className="w-4 h-4 text-indigo-600" /> No.
                            of Days
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="7"
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
                    <div className="text-left">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                        Who's <span className="text-indigo-600">joining?</span>
                      </h3>
                      <p className="text-slate-500 font-medium mt-2">
                        Let us know who you'll be traveling with.
                      </p>
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
                          <h4 className="font-bold text-gray-800">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="space-y-6">
                      <div className="text-left">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                          What's the <span className="text-indigo-600">vibe?</span>
                        </h3>
                        <p className="text-slate-500 font-medium mt-2">
                          Choose a budget that fits your travel style.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {BUDGET_OPTIONS.map((item) => (
                          <div
                            key={item.id}
                            onClick={() =>
                              !loading && handleInputChange("budget", item.label)
                            }
                            role="button"
                            tabIndex={0}
                            aria-pressed={formData.budget === item.label}
                            onKeyDown={(event) => {
                              if (loading) return;
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleInputChange("budget", item.label);
                              }
                            }}
                            className={cn(
                              "group p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 text-left hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100",
                              formData.budget === item.label
                                ? "border-indigo-600 bg-indigo-50 shadow-lg"
                                : "border-gray-100 bg-white hover:border-indigo-200",
                              loading && "opacity-50 cursor-not-allowed",
                            )}
                          >
                            <div
                              className={cn(
                                "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                                formData.budget === item.label
                                  ? "bg-white text-indigo-600"
                                  : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
                              )}
                            >
                              {item.icon}
                            </div>
                            <h4 className="font-bold text-gray-800">
                              {item.label}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="text-left">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                          What do you <span className="text-indigo-600">love?</span>
                        </h3>
                        <p className="text-slate-500 font-medium mt-2">
                          Pick the activities that define your perfect adventure.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {INTEREST_OPTIONS.map((item) => {
                          const isSelected = formData.interests.includes(item.label);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (loading) return;
                                const newInterests = isSelected
                                  ? formData.interests.filter((i) => i !== item.label)
                                  : [...formData.interests, item.label];
                                handleInputChange("interests", newInterests);
                              }}
                              role="button"
                              tabIndex={0}
                              aria-pressed={isSelected}
                              onKeyDown={(event) => {
                                if (loading) return;
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  const newInterests = isSelected
                                    ? formData.interests.filter((i) => i !== item.label)
                                    : [...formData.interests, item.label];
                                  handleInputChange("interests", newInterests);
                                }
                              }}
                              className={cn(
                                "group p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 text-left hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100",
                                isSelected
                                  ? "border-indigo-600 bg-indigo-50 shadow-lg"
                                  : "border-gray-100 bg-white hover:border-indigo-200",
                              )}
                            >
                              <div
                                className={cn(
                                  "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                                  isSelected
                                    ? "bg-white text-indigo-600"
                                    : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
                                )}
                              >
                                {item.icon}
                              </div>
                              <h4 className="font-bold text-gray-800">
                                {item.label}
                              </h4>
                              {item.desc && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {item.desc}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-12 gap-4">
                  {step > 1 && (
                    <button
                      disabled={loading}
                      onClick={() => setStep(step - 1)}
                      className="flex h-14 items-center gap-2 px-8 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                  )}
                  <button
                    disabled={loading}
                    onClick={handleNext}
                    className={cn(
                      "flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-black text-white transition-all shadow-xl shadow-indigo-100",
                      loading
                        ? "bg-slate-300"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95",
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span>Crafting Itinerary...</span>
                      </>
                    ) : step === 3 ? (
                      <>
                        <LandPlot className="w-5 h-5" />
                        <span>Generate Trip</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ChevronsRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
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
