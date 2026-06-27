import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Wallet,
  Languages,
  Landmark,
  Sparkles,
  Navigation,
  Calendar,
  Hotel,
  Briefcase,
  Utensils,
  ShoppingBag,
  BookOpen,
  ShieldCheck,
  ScrollText,
  Building2,
  Map,
} from "lucide-react";
import SEO from "../components/shared/SEO";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import {
  GetPlaceDetails,
  PHOTO_REF_URL,
  getStreetViewUrl,
} from "../services/googlePlaceApi";

const getFallbackBlogData = (name, country) => ({
  introduction: `Welcome to ${name}, a spectacular destination in ${country} that is rich in history, culture, and unforgettable sights. Plan your visit to discover the local secrets and iconic landmarks that define this beautiful location.`,
  book_accommodations: `When staying in ${name}, look for centrally located hotels or traditional guest stays to experience local hospitality. Popular areas close to public transportation are recommended for convenience.`,
  transportation: `Getting around is convenient using the local public transportation networks (trains, buses, and metro lines). Walking is highly recommended to explore historical lanes and shopping streets.`,
  food: `Be sure to try local specialties and street foods. Key dishes reflect the region's agricultural history and culinary innovation.`,
  shopping: `Explore local craft markets and central commercial districts. High-quality regional souvenirs include traditional wares, textiles, and specialty food items.`,
  etiquette: `Respect local customs by speaking quietly in public spaces and showing respect at historical monuments. Greeting locals politely is always appreciated.`,
  language: `The official language is spoken widely, but tourist locations are very welcoming to English speakers. Learning a few basic greetings like 'thank you' will go a long way.`,
  budgeting: `Daily expenses vary. Credit cards are widely accepted, but keeping some cash is recommended for small shops and local markets.`,
  packing_tips: `Pack comfortable walking shoes, weather-appropriate clothing layers, and adapters for local power outlets.`,
  itinerary: `A perfect 3-day trip includes spending Day 1 visiting major historical sites, Day 2 exploring central neighborhoods and shopping areas, and Day 3 enjoying local nature or museum trails.`,
  safety: `The city is generally safe for international travelers. Keep standard precautions regarding personal items in busy transport stations and tourist spots.`,
  conclusion: `${name} is an amazing travel destination that leaves every visitor with deep memories. Plan your journey today and experience it for yourself!`,
});

const LOADING_STEPS = [
  { icon: Globe, text: "Gathering regional destination info..." },
  { icon: Landmark, text: "Curating top places to visit..." },
  { icon: Utensils, text: "Analyzing culinary highlights..." },
  { icon: Wallet, text: "Estimating local travel costs..." },
  { icon: Sparkles, text: "Polishing your travel guide..." },
];

const GuideDetails = () => {
  const { wikiTitle } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state || {};

  const [destinationName, setDestinationName] = useState(
    // @ts-ignore
    stateData.destinationName ||
      decodeURIComponent(wikiTitle || "").replace(/_/g, " "),
  );
  // @ts-ignore
  const [countryName, setCountryName] = useState(stateData.countryName || "");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [apiDone, setApiDone] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
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

  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  // @ts-ignore
  const [flag, setFlag] = useState(stateData.flag || "");
  // @ts-ignore
  const [flagUrl, setFlagUrl] = useState(stateData.flagUrl || "");
  const [currencyName, setCurrencyName] = useState(
    // @ts-ignore
    stateData.currencyName || "",
  );
  const [currencySymbol, setCurrencySymbol] = useState(
    // @ts-ignore
    stateData.currencySymbol || "",
  );
  const [language, setLanguage] = useState(
    // @ts-ignore
    stateData.language && stateData.language.length < 25
      ? stateData.language
      : "",
  );
  const [capital, setCapital] = useState("");
  const [attractions, setAttractions] = useState(/** @type {any[]} */ ([]));
  const [blogData, setBlogData] = useState(null);

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handlePlanTrip = () => {
    navigate("/v2/create-trip", {
      state: {
        destination: {
          label: `${destinationName}, ${countryName}`,
          value: {
            description: destinationName,
            matched_substrings: [],
            place_id: "",
            reference: "",
            structured_formatting: {
              main_text: destinationName,
              secondary_text: countryName,
            },
            terms: [],
            types: [],
          },
        },
      },
    });
  };

  useEffect(() => {
    const fetchGuideContent = async () => {
      setLoading(true);
      setApiDone(false);
      setProgress(0);
      setError(null);

      let currentName = destinationName;
      let currentCountry = countryName;

      try {
        const wikiRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle || "")}`,
        );
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          setDescription(wikiData.extract || "");
          if (wikiData.thumbnail?.source) {
            setCoverImage(wikiData.thumbnail.source);
          }

          if (!currentCountry && wikiData.description) {
            const desc = wikiData.description;
            let extracted = "";
            if (desc.includes(",")) {
              const parts = desc.split(",");
              const lastPart = parts[parts.length - 1].trim();
              if (/^[A-Za-z\s]+$/.test(lastPart)) {
                extracted = lastPart;
              }
            }
            if (!extracted) {
              const match = desc.match(/(?:in|of)\s+(?:the\s+)?([A-Za-z\s]+)$/i);
              if (match && match[1]) {
                extracted = match[1].trim();
              }
            }
            if (extracted) {
              currentCountry = extracted;
              setCountryName(currentCountry);
            }
          }
        }
      } catch (err) {
      }

      const streetViewCover = getStreetViewUrl(
        `${currentName}, ${currentCountry}`,
      );
      if (streetViewCover) {
        setCoverImage((prev) => prev || streetViewCover);
      }

      let fetchedFlag = flag;
      let fetchedFlagUrl = flagUrl;
      let fetchedLanguage = (language && language.length < 25) ? language : "";
      let fetchedCurrencyName = currencyName;
      let fetchedCurrencySymbol = currencySymbol;
      let fetchedCapital = "";

      if (currentCountry) {
        try {
          const countryRes = await fetch(
            `https://corsproxy.io/?https://restcountries.com/v3.1/name/${encodeURIComponent(currentCountry)}?fullText=true`,
          );
          if (countryRes.ok) {
            const countryData = await countryRes.json();
            const countryObj = countryData[0];
            if (countryObj) {
              fetchedFlag = countryObj.flag || "";
              fetchedFlagUrl =
                countryObj.flags?.png || countryObj.flags?.svg || "";
              fetchedCapital = countryObj.capital?.[0] || "";
              setFlag(fetchedFlag);
              setFlagUrl(fetchedFlagUrl);
              setCapital(fetchedCapital);

              if (!fetchedLanguage) {
                const languages = countryObj.languages
                  ? Object.values(countryObj.languages)
                  : [];
                if (languages.length > 0) {
                  fetchedLanguage = languages[0];
                  setLanguage(fetchedLanguage);
                }
              }

              if (!fetchedCurrencyName) {
                const currencyKey = countryObj.currencies
                  ? Object.keys(countryObj.currencies)[0]
                  : null;
                const currency = currencyKey
                  ? countryObj.currencies[currencyKey]
                  : null;
                if (currency) {
                  fetchedCurrencySymbol = currency.symbol || currencyKey;
                  fetchedCurrencyName = currency.name || "";
                  setCurrencySymbol(fetchedCurrencySymbol);
                  setCurrencyName(fetchedCurrencyName);
                }
              }
            }
          }
        } catch (countryErr) {
        }
      }

      try {
        const placeSearchRes = await GetPlaceDetails({
          textQuery: `${currentName}, ${currentCountry}`,
        });
        const placesList = placeSearchRes?.data?.places || [];
        if (placesList.length > 0) {
          const photoName = placesList[0].photos?.[0]?.name;
          if (photoName) {
            setCoverImage(PHOTO_REF_URL.replace("{NAME}", photoName));
          }
        }

        const attractionsSearchRes = await GetPlaceDetails({
          textQuery: `top tourist attractions in ${currentName}, ${currentCountry}`,
        });
        const attractionPlaces = attractionsSearchRes?.data?.places || [];
        const mappedAttractions = attractionPlaces
          .slice(0, 4)
          .map((place) => {
            const photoName = place.photos?.[0]?.name;
            return {
              id: place.id,
              name: place.displayName?.text || place.name || "Landmark",
              image: photoName
                ? PHOTO_REF_URL.replace("{NAME}", photoName)
                : getStreetViewUrl(place.displayName?.text || ""),
            };
          })
          .filter((att) => att.image);

        setAttractions(mappedAttractions);
      } catch (placesErr) {
      }

      const cacheKey = `trip_buddy_blog_content_${wikiTitle}`;
      const cachedBlog = localStorage.getItem(cacheKey);

      if (cachedBlog) {
        try {
          const parsed = JSON.parse(cachedBlog);
          setBlogData(parsed);

          if (parsed.country_name) {
            setCountryName((prev) => prev || parsed.country_name);
          }
          if (parsed.country_capital || parsed.capital_city) {
            setCapital((prev) => prev || parsed.country_capital || parsed.capital_city);
          }
          if (parsed.country_language) {
            setLanguage((prev) => prev || parsed.country_language);
          } else if (parsed.language && parsed.language.length < 25) {
            setLanguage((prev) => prev || parsed.language);
          }
          if (parsed.country_currency_name || parsed.currency_name) {
            setCurrencyName((prev) => prev || parsed.country_currency_name || parsed.currency_name);
          }
          if (parsed.country_currency_symbol || parsed.currency_symbol) {
            setCurrencySymbol((prev) => prev || parsed.country_currency_symbol || parsed.currency_symbol);
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      } else {
        try {
          const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (geminiApiKey) {
            const GEMINI_PROMPT = `
Generate a comprehensive, engaging travel blog guide for the destination "${currentName}, ${currentCountry}".
Return ONLY a valid JSON object matching this schema:
{
  "country_name": "The name of the country where this destination is located.",
  "country_capital": "The capital city of that country.",
  "country_language": "The primary official language spoken in that country.",
  "country_currency_name": "The name of the local currency used.",
  "country_currency_symbol": "The symbol of the local currency.",
  "introduction": "An engaging, descriptive introduction paragraph about the city.",
  "book_accommodations": "A paragraph with tips on the best neighborhoods/areas to stay, accommodation styles, and booking advice.",
  "transportation": "A paragraph explaining how to get around the city (public transit, walking, ride-sharing, ticketing tips).",
  "food": "A paragraph highlighting must-try local delicacies, famous dishes, and food culture.",
  "shopping": "A paragraph about popular shopping streets, markets, local souvenirs, and shopping tips.",
  "etiquette": "A paragraph about local customs, cultural do's and don'ts, and polite behaviors.",
  "language": "A paragraph about the official language, local communication styles, and a few essential phrases.",
  "budgeting": "A paragraph summarizing average daily costs, tipping culture, and smart ways to save money.",
  "packing_tips": "A paragraph advising what to pack (clothing, accessories, essentials) based on seasonal weather.",
  "itinerary": "A paragraph describing a perfect 3-day signature highlights itinerary overview.",
  "safety": "A paragraph covering safety guidelines, safe areas, emergency tips, and common travel scams to watch out for.",
  "conclusion": "A motivating, warm summary conclusion encouraging the reader to explore this wonderful destination."
}
Do not wrap in markdown codeblocks. Return raw JSON text only.
`;
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: GEMINI_PROMPT,
                        },
                      ],
                    },
                  ],
                  generationConfig: {
                    responseMimeType: "application/json",
                  },
                }),
              },
            );

            if (response.ok) {
              const result = await response.json();
              const rawText =
                result.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                const parsed = JSON.parse(rawText.trim());
                setBlogData(parsed);
                localStorage.setItem(cacheKey, JSON.stringify(parsed));

                if (parsed.country_name) {
                  setCountryName((prev) => prev || parsed.country_name);
                }
                if (parsed.country_capital) {
                  setCapital((prev) => prev || parsed.country_capital);
                }
                if (parsed.country_language) {
                  setLanguage((prev) => prev || parsed.country_language);
                } else if (parsed.language && parsed.language.length < 25) {
                  setLanguage((prev) => prev || parsed.language);
                }
                if (parsed.country_currency_name) {
                  setCurrencyName((prev) => prev || parsed.country_currency_name);
                }
                if (parsed.country_currency_symbol) {
                  setCurrencySymbol((prev) => prev || parsed.country_currency_symbol);
                }
              } else {
                toast.error("Personalization Issue", {
                  description: "Could not refine the guide details. Loading default travel tips.",
                });
              }
            } else {
              if (response.status === 429 || response.status === 503) {
                toast.error("High Server Demand", {
                  description: "The personalization service is currently experiencing high volume. Loading default travel tips.",
                });
              } else {
                toast.error("Personalization Offline", {
                  description: "The personalization service is temporarily offline. Loading default travel tips.",
                });
              }
            }
          }
        } catch (aiErr) {
          console.error("AI Generation Error:", aiErr);
          const errStr = String(aiErr?.message || aiErr || "").toLowerCase();
          const isHighDemand =
            errStr.includes("429") ||
            errStr.includes("quota") ||
            errStr.includes("limit") ||
            errStr.includes("exhausted") ||
            errStr.includes("503");

          if (isHighDemand) {
            toast.error("High Server Demand", {
              description: "The personalization service is currently experiencing high volume. Loading default travel tips.",
            });
          } else {
            toast.error("Personalization Error", {
              description: "Failed to generate custom guide. Loading default travel tips.",
            });
          }
        }
      }

      setApiDone(true);
    };

    fetchGuideContent();
  }, [wikiTitle]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-6 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white">
        <div className="w-full max-w-sm md:max-w-md p-8 md:p-12 bg-white/75 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/80 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-linear-to-br from-indigo-500/15 via-violet-400/10 to-transparent blur-3xl animate-pulse" />

          <div className="relative z-10 mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 via-violet-600 to-fuchsia-500 shadow-2xl shadow-indigo-200/60 ring-1 ring-white/70 overflow-hidden">
            <div className="absolute inset-0 rounded-full border border-white/35 animate-pulse" />
            <div className="absolute inset-2 rounded-full border border-white/30" />
            <div className="absolute inset-3 rounded-full bg-white/10 backdrop-blur-sm" />

            {LOADING_STEPS.map((step, index) => {
              const Icon = step.icon;
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
            Crafting Guide...
          </h3>

          <div className="relative z-10 h-6 overflow-hidden mb-8 w-full">
            <div
              className="transition-transform duration-700 ease-in-out flex flex-col items-center"
              style={{ transform: `translateY(-${loadingStep * 24}px)` }}
            >
              {LOADING_STEPS.map((step, i) => (
                <p
                  key={i}
                  className="h-6 text-sm font-bold text-indigo-600/90 leading-6"
                >
                  {step.text}
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

  const activeBlog =
    blogData || getFallbackBlogData(destinationName, countryName);
  const mapsUrl = `https://google.com/maps/search/?api=1&query=${encodeURIComponent(`${destinationName} ${countryName}`)}`;

  const blogSections = [
    {
      id: "accommodations",
      title: "Where to Stay (Book Accommodations)",
      content: activeBlog.book_accommodations,
      icon: Hotel,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50/50",
    },
    {
      id: "budgeting",
      title: "Budgeting & Expenses",
      content: activeBlog.budgeting,
      icon: Wallet,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-50/50",
    },
    {
      id: "transportation",
      title: "Getting Around (Transportation)",
      content: activeBlog.transportation,
      icon: Navigation,
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-50/50",
    },
    {
      id: "packing",
      title: "Packing Tips",
      content: activeBlog.packing_tips,
      icon: Briefcase,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50/50",
    },
    {
      id: "food",
      title: "Food & Cuisine",
      content: activeBlog.food,
      icon: Utensils,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-50/50",
    },
    {
      id: "shopping",
      title: "Where to Shop (Shopping)",
      content: activeBlog.shopping,
      icon: ShoppingBag,
      iconColor: "text-fuchsia-500",
      bgColor: "bg-fuchsia-50/50",
    },
    {
      id: "etiquette",
      title: "Local Etiquette & Customs",
      content: activeBlog.etiquette,
      icon: BookOpen,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50/50",
    },
    {
      id: "language",
      title: "Language & Communication",
      content: (activeBlog.language && activeBlog.language.length > 25)
        ? activeBlog.language
        : (activeBlog.language_info || activeBlog.language),
      icon: Languages,
      iconColor: "text-cyan-500",
      bgColor: "bg-cyan-50/50",
    },
    {
      id: "itinerary",
      title: "Signature 3-Day Itinerary Overview",
      content: activeBlog.itinerary,
      icon: Calendar,
      iconColor: "text-violet-500",
      bgColor: "bg-violet-50/50",
    },
    {
      id: "safety",
      title: "Safety & Scams to Avoid",
      content: activeBlog.safety,
      icon: ShieldCheck,
      iconColor: "text-teal-500",
      bgColor: "bg-teal-50/50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4 md:px-6 font-sans">
      <SEO
        title={`${destinationName} Travel Guide | Trip Buddy`}
        description={`Explore the ultimate travel guide for ${destinationName}, ${countryName}. Discover key facts, language, currency details, and top local attractions.`}
      />

      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12 mb-12 items-start">
          <section className="relative h-96 lg:h-112 rounded-[2.5rem] overflow-hidden shadow-xl flex-1">
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10">
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-white hover:text-indigo-600 transition-colors border border-white/20 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Explore
              </Link>
            </div>
            {coverImage ? (
              <img
                src={coverImage}
                alt={destinationName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                No Cover Photo Available
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/40 to-slate-900/10" />

            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/30">
                  <Map className="w-3.5 h-3.5 text-indigo-300" />
                  Travel Guide
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none mb-2">
                {destinationName}
              </h1>
              <p className="text-indigo-200 text-base md:text-lg font-bold flex items-center gap-2">
                {flagUrl ? (
                  <img
                    src={flagUrl}
                    alt=""
                    className="w-5 h-3.5 object-cover rounded-xs"
                  />
                ) : (
                  <span>{flag || "📍"}</span>
                )}
                {countryName}
              </p>
            </div>
          </section>          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
              <Globe className="w-5.5 h-5.5 text-indigo-600" />
              Quick Travel Facts
            </h3>

            <div className="space-y-5 text-sm font-semibold">
              {capital && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    Capital City
                  </span>
                  <span className="text-slate-900 font-black tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{capital}</span>
                </div>
              )}
              {language && (
                <div className="flex justify-between items-start py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-indigo-500" />
                    Language
                  </span>
                  <span className="text-slate-900 font-black text-right tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {capitalizeWords(language)}
                  </span>
                </div>
              )}
              {currencyName && (
                <div className="flex justify-between items-start py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Currency
                  </span>
                  <span className="text-slate-900 font-black text-right tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {currencySymbol && `${currencySymbol} `}
                    {capitalizeWords(currencyName)}
                  </span>
                </div>
              )}
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full h-12 border border-slate-200 hover:border-indigo-100 hover:text-indigo-600 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 shadow-xs hover:shadow-sm transition-all mt-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform"
                viewBox="0 0 92.3 132.3"
              >
                <path
                  fill="#1a73e8"
                  d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"
                />
                <path
                  fill="#ea4335"
                  d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"
                />
                <path
                  fill="#4285f4"
                  d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"
                />
                <path
                  fill="#fbbc04"
                  d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"
                />
                <path
                  fill="#34a853"
                  d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"
                />
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12 items-start">
          <div className="space-y-12">
            <section className="p-8 rounded-4xl border border-slate-100 bg-white/40 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50/50">
                  <ScrollText className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Introduction
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base pl-1">
                {activeBlog.introduction ||
                  description ||
                  `Discover the spectacular sights and unique atmosphere of ${destinationName}. Known for its beautiful landscapes and vibrant culture, it remains a premier destination for global travelers.`}
              </p>
            </section>

            {attractions.length > 0 && (
              <section className="p-8 rounded-4xl border border-slate-100 bg-white/40 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50/50">
                    <Landmark className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Top Places to Visit
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {attractions.map((att) => (
                    <div
                      key={att.id}
                      className="group relative rounded-3xl overflow-hidden shadow-md bg-white border border-slate-100 flex flex-col h-full hover:shadow-lg transition-shadow"
                    >
                      <div className="h-44 w-full overflow-hidden">
                        <img
                          src={att.image}
                          alt={att.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 flex-1 flex items-center">
                        <h4 className="font-extrabold text-sm text-slate-800 leading-tight">
                          {att.name}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {blogSections.map((sec) => (
              <section
                key={sec.id}
                className="p-8 rounded-4xl border border-slate-100 bg-white/40 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${sec.bgColor}`}>
                    <sec.icon className={`w-6 h-6 ${sec.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {sec.title}
                  </h3>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base pl-1">
                  {sec.content}
                </p>
              </section>
            ))}

            <section className="border-t pt-8 p-8 rounded-[2.5rem] bg-indigo-900/5 border border-indigo-100/50 space-y-4">
              <h3 className="text-2xl font-black text-indigo-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Conclusion
              </h3>
              <p className="text-indigo-950 font-bold leading-relaxed text-base italic pl-1">
                {activeBlog.conclusion}
              </p>
            </section>
          </div>

          <aside className="space-y-8 lg:sticky lg:top-40">
            <div className="rounded-[2.5rem] bg-slate-900 text-white p-8 relative overflow-hidden shadow-xl space-y-6">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-indigo-500/10 blur-2xl" />

              <div className="relative z-10 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                  AI Travel Planner
                </span>
                <h4 className="text-2xl font-black leading-tight tracking-tight">
                  Inspired to visit {destinationName}?
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Let our AI create a fully personalized, optimized daily
                  itinerary for your trip in seconds!
                </p>
              </div>

              <button
                onClick={handlePlanTrip}
                className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer relative z-10"
              >
                Plan this trip
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GuideDetails;
