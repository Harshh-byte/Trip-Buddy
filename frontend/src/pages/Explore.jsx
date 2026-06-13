import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Languages, Wallet } from "lucide-react";
import SEO from "../components/shared/SEO";
import Skeleton from "@mui/material/Skeleton";
import {
  GetPlaceDetails,
  PHOTO_REF_URL,
  getStreetViewUrl,
} from "../services/googlePlaceApi";

let canUsePlacesPhotoLookup = true;

const SEASONAL_POOLS = {
  Spring: [
    {
      id: "spring-1",
      name: "Kyoto",
      country: "Japan",
      wikiTitle: "Kyoto",
      fallbackDesc:
        "Kyoto, once the capital of Japan, is a city on the island of Honshu famous for its thousands of classical Buddhist temples, gardens, imperial palaces, Shinto shrines, and traditional wooden houses.",
      tag: "Cherry Blossoms",
    },
    {
      id: "spring-2",
      name: "Amsterdam",
      country: "Netherlands",
      wikiTitle: "Amsterdam",
      fallbackDesc:
        "Amsterdam is the Netherlands' capital, known for its artistic heritage, elaborate canal system and narrow houses with gabled facades, legacies of the city's 17th-century Golden Age.",
      tag: "Tulip Season",
    },
    {
      id: "spring-3",
      name: "Washington, D.C.",
      country: "United States",
      wikiTitle: "Washington,_D.C.",
      fallbackDesc:
        "Washington, D.C., the U.S. capital, is a compact city on the Potomac River, bordering the states of Maryland and Virginia, defined by imposing neoclassical monuments and buildings.",
      tag: "Cherry Blossom Fest",
    },
    {
      id: "spring-4",
      name: "Bonn",
      country: "Germany",
      wikiTitle: "Bonn",
      fallbackDesc:
        "Bonn is a city in western Germany straddling the Rhine River. It’s known for the central Beethoven House, a memorial and museum honoring the composer's birthplace.",
      tag: "Blossom Avenues",
    },
    {
      id: "spring-5",
      name: "Vancouver",
      country: "Canada",
      wikiTitle: "Vancouver",
      fallbackDesc:
        "Vancouver, a bustling west coast seaport in British Columbia, is among Canada’s densest, most ethnically diverse cities, surrounded by mountains and popular for filming.",
      tag: "Mild Spring",
    },
    {
      id: "spring-6",
      name: "Paris",
      country: "France",
      wikiTitle: "Paris",
      fallbackDesc:
        "Paris, France's capital, is a major European city and a global center for art, fashion, gastronomy and culture, famed for its 19th-century cityscape.",
      tag: "Romantic",
    },
    {
      id: "spring-7",
      name: "Rome",
      country: "Italy",
      wikiTitle: "Rome",
      fallbackDesc:
        "Rome is the capital city and a special comune of Italy. Rome serves as the capital of the Lazio region, featuring historical ruins like the Colosseum.",
      tag: "Spring Sunshine",
    },
    {
      id: "spring-8",
      name: "Seville",
      country: "Spain",
      wikiTitle: "Seville",
      fallbackDesc:
        "Seville is the capital and largest city of the Spanish autonomous community of Andalusia and the province of Seville. It is famous for its stunning Alcázar palace complex.",
      tag: "Spring Blossoms",
    },
    {
      id: "spring-9",
      name: "London",
      country: "United Kingdom",
      wikiTitle: "London",
      fallbackDesc:
        "London is the capital and largest city of England and the United Kingdom, famous for its iconic landmarks like Big Ben, the Tower of London, and its historic royal parks that burst with spring colors.",
      tag: "Spring Gardens",
    },
    {
      id: "spring-10",
      name: "Florence",
      country: "Italy",
      wikiTitle: "Florence",
      fallbackDesc:
        "Florence, capital of Italy’s Tuscany region, is home to many masterpieces of Renaissance art and architecture, including the iconic Duomo and Michelangelo’s 'David'.",
      tag: "Art & Blooms",
    },
    {
      id: "spring-11",
      name: "Vienna",
      country: "Austria",
      wikiTitle: "Vienna",
      fallbackDesc:
        "Vienna, Austria’s capital, lies in the country’s east on the Danube River. Its artistic and intellectual legacy was shaped by residents including Mozart, Beethoven and Sigmund Freud.",
      tag: "Palace Gardens",
    },
    {
      id: "spring-12",
      name: "San Francisco",
      country: "United States",
      wikiTitle: "San Francisco",
      fallbackDesc:
        "San Francisco, in northern California, is a hilly city on the tip of a peninsula surrounded by the Pacific Ocean and San Francisco Bay, famous for the Golden Gate Bridge.",
      tag: "Bay Breezes",
    },
  ],
  Summer: [
    {
      id: "summer-1",
      name: "Santorini",
      country: "Greece",
      wikiTitle: "Santorini",
      fallbackDesc:
        "Santorini is one of the Cyclades islands in the Aegean Sea. It was devastated by a volcanic eruption in the 16th century BC, forever shaping its rugged landscape.",
      tag: "Sunny Coast",
    },
    {
      id: "summer-2",
      name: "Bali",
      country: "Indonesia",
      wikiTitle: "Bali",
      fallbackDesc:
        "Bali is a province of Indonesia and the westernmost of the Lesser Sunda Islands. East of Java and west of Lombok, the province includes the island of Bali.",
      tag: "Tropical Getaway",
    },
    {
      id: "summer-3",
      name: "Amalfi Coast",
      country: "Italy",
      wikiTitle: "Amalfi_Coast",
      fallbackDesc:
        "The Amalfi Coast is a 50-kilometer stretch of coastline along the southern edge of Italy’s Sorrentine Peninsula, in the Campania region.",
      tag: "Scenic Coast",
    },
    {
      id: "summer-4",
      name: "Barcelona",
      country: "Spain",
      wikiTitle: "Barcelona",
      fallbackDesc:
        "Barcelona is a city on the coast of northeastern Spain. It is the capital and largest city of the autonomous community of Catalonia.",
      tag: "Vibrant Culture",
    },
    {
      id: "summer-5",
      name: "Dubrovnik",
      country: "Croatia",
      wikiTitle: "Dubrovnik",
      fallbackDesc:
        "Dubrovnik is a city in southern Croatia fronting the Adriatic Sea. It's known for its distinctive Old Town, encircled with massive stone walls completed in the 16th century.",
      tag: "Historic Walls",
    },
    {
      id: "summer-6",
      name: "Reykjavik",
      country: "Iceland",
      wikiTitle: "Reykjavik",
      fallbackDesc:
        "Reykjavik, on the coast of Iceland, is the country's capital and largest city. It is home to the National and Saga museums, tracing Iceland’s Viking history.",
      tag: "Midnight Sun",
    },
    {
      id: "summer-7",
      name: "Maui",
      country: "United States",
      wikiTitle: "Maui",
      fallbackDesc:
        "Maui is an island in the Central Pacific, part of the Hawaiian archipelago. Sprawling Haleakala National Park encompasses the island’s highest peak.",
      tag: "Beach Vibe",
    },
    {
      id: "summer-8",
      name: "Nice",
      country: "France",
      wikiTitle: "Nice",
      fallbackDesc:
        "Nice, capital of the Alpes-Maritimes department on the French Riviera, sits on the pebbly shores of the Baie des Anges, founded by the Greeks.",
      tag: "Riviera Glamour",
    },
    {
      id: "summer-9",
      name: "Lisbon",
      country: "Portugal",
      wikiTitle: "Lisbon",
      fallbackDesc:
        "Lisbon is the hilly, coastal capital city of Portugal, renowned for its warm summer weather, pastel-colored buildings, traditional Fado music, and historic tram lines.",
      tag: "Sunny Streets",
    },
    {
      id: "summer-10",
      name: "Mallorca",
      country: "Spain",
      wikiTitle: "Mallorca",
      fallbackDesc:
        "Mallorca is one of Spain's Balearic Islands in the Mediterranean. It's known for beach resorts, sheltered coves, limestone mountains and Roman and Moorish remains.",
      tag: "Island Escape",
    },
    {
      id: "summer-11",
      name: "Oahu",
      country: "United States",
      wikiTitle: "Oahu",
      fallbackDesc:
        "Oahu is a Hawaiian island in the Central Pacific, home to the state capital, Honolulu, historic Pearl Harbor, and the famous world-class surf of the North Shore.",
      tag: "Surfer's Haven",
    },
    {
      id: "summer-12",
      name: "Mykonos",
      country: "Greece",
      wikiTitle: "Mykonos",
      fallbackDesc:
        "Mykonos is an island in the Cyclades group in the Aegean Sea. It's popularly known for its summer party atmosphere, iconic 16th-century windmills, and sandy beaches.",
      tag: "Cycladic Sun",
    },
  ],
  Autumn: [
    {
      id: "autumn-1",
      name: "Kyoto",
      country: "Japan",
      wikiTitle: "Kyoto",
      fallbackDesc:
        "Kyoto features jaw-dropping autumn colors (koyo) framing its ancient temples and Zen gardens, transforming the city into a scenic gold and red masterpiece.",
      tag: "Autumn Foliage",
    },
    {
      id: "autumn-2",
      name: "Munich",
      country: "Germany",
      wikiTitle: "Munich",
      fallbackDesc:
        "Munich, Bavaria’s capital, is home to centuries-old buildings and numerous museums. The city is famous for its annual Oktoberfest celebration and its beer halls.",
      tag: "Oktoberfest",
    },
    {
      id: "autumn-3",
      name: "Vermont",
      country: "United States",
      wikiTitle: "Vermont",
      fallbackDesc:
        "Vermont is a state in the northeastern United States, known for its natural landscape, which is primarily forested, and famous for its gorgeous fall foliage.",
      tag: "Autumn Colors",
    },
    {
      id: "autumn-4",
      name: "Seoul",
      country: "South Korea",
      wikiTitle: "Seoul",
      fallbackDesc:
        "Seoul, the capital of South Korea, is a huge metropolis where modern skyscrapers, high-tech subways and pop culture meet Buddhist temples, palaces and street markets.",
      tag: "Maple Season",
    },
    {
      id: "autumn-5",
      name: "Montreal",
      country: "Canada",
      wikiTitle: "Montreal",
      fallbackDesc:
        "Montreal is the largest city in Canada's Québec province. It’s set on an island in the Saint Lawrence River and named after Mt. Royal, the triple-peaked hill at its heart.",
      tag: "Charming Streets",
    },
    {
      id: "autumn-6",
      name: "Rome",
      country: "Italy",
      wikiTitle: "Rome",
      fallbackDesc:
        "Autumn is the perfect time to visit Rome, offering pleasant temperatures and stunning golden light that paints the historic ruins of the Roman Empire.",
      tag: "Golden Autumn",
    },
    {
      id: "autumn-7",
      name: "Prague",
      country: "Czech Republic",
      wikiTitle: "Prague",
      fallbackDesc:
        "Prague, capital city of the Czech Republic, is bisected by the Vltava River. Nicknamed “the City of a Hundred Spires,” it's known for its Old Town Square.",
      tag: "Fairytale Vibe",
    },
    {
      id: "autumn-8",
      name: "Paris",
      country: "France",
      wikiTitle: "Paris",
      fallbackDesc:
        "Paris in Autumn offers romantic walks through the Jardin du Luxembourg with fallen leaves and cozy afternoons inside warm Parisian bistros.",
      tag: "Cozy Streets",
    },
    {
      id: "autumn-9",
      name: "Tokyo",
      country: "Japan",
      wikiTitle: "Tokyo",
      fallbackDesc:
        "Tokyo, Japan’s bustling capital, mixes ultra-modern skyscrapers with historic temples, and its traditional parks offer stunning autumn maple leaf views.",
      tag: "Autumn Foliage",
    },
    {
      id: "autumn-10",
      name: "Edinburgh",
      country: "United Kingdom",
      wikiTitle: "Edinburgh",
      fallbackDesc:
        "Edinburgh is Scotland's compact, hilly capital, dominated by the majestic Edinburgh Castle, boasting atmospheric autumn mist and colorful historic streets.",
      tag: "Historic Fall",
    },
    {
      id: "autumn-11",
      name: "Boston",
      country: "United States",
      wikiTitle: "Boston",
      fallbackDesc:
        "Boston is the capital and largest city of Massachusetts, offering stunning autumn foliage along the Freedom Trail, historic brick streets, and vibrant universities.",
      tag: "New England Fall",
    },
    {
      id: "autumn-12",
      name: "Budapest",
      country: "Hungary",
      wikiTitle: "Budapest",
      fallbackDesc:
        "Budapest, Hungary’s capital, is bisected by the Danube River. Its 19th-century Chain Bridge connects the hilly Buda district with flat Pest, offering warm thermal baths in crisp autumn weather.",
      tag: "Golden Baths",
    },
  ],
  Winter: [
    {
      id: "winter-1",
      name: "Swiss Alps",
      country: "Switzerland",
      wikiTitle: "Swiss_Alps",
      fallbackDesc:
        "The Swiss Alps are part of the Alpine range, stretching across the country, world-famous for their premium ski resorts, cable cars, and dramatic glacier vistas.",
      tag: "Ski Paradise",
    },
    {
      id: "winter-2",
      name: "Reykjavik",
      country: "Iceland",
      wikiTitle: "Reykjavik",
      fallbackDesc:
        "Reykjavik in winter is a magical gateway to view the dancing Aurora Borealis (Northern Lights), thermal hot springs, and breathtaking ice caves.",
      tag: "Northern Lights",
    },
    {
      id: "winter-3",
      name: "Banff",
      country: "Canada",
      wikiTitle: "Banff,_Alberta",
      fallbackDesc:
        "Banff is a resort town in the province of Alberta, located within Banff National Park. The peaks of Mt. Rundle and Mt. Cascade dominate its skyline.",
      tag: "Winter Wonderland",
    },
    {
      id: "winter-4",
      name: "Hokkaido",
      country: "Japan",
      wikiTitle: "Hokkaido",
      fallbackDesc:
        "Hokkaido, the northernmost of Japan’s main islands, is famous for its volcanoes, natural hot springs (onsen) and world-class ski areas.",
      tag: "Snow Festival",
    },
    {
      id: "winter-5",
      name: "Tromsø",
      country: "Norway",
      wikiTitle: "Tromsø",
      fallbackDesc:
        "Tromsø, a city in northern Norway, is a major cultural hub above the Arctic Circle. It’s famed as a viewing point for colorful Northern Lights displays.",
      tag: "Arctic Circle",
    },
    {
      id: "winter-6",
      name: "Queenstown",
      country: "New Zealand",
      wikiTitle: "Queenstown,_New_Zealand",
      fallbackDesc:
        "While the Northern hemisphere is in winter, Queenstown experiences gorgeous summer weather, perfect for lake activities, hiking, and extreme sports.",
      tag: "Summer in Winter",
    },
    {
      id: "winter-7",
      name: "Zermatt",
      country: "Switzerland",
      wikiTitle: "Zermatt",
      fallbackDesc:
        "Zermatt, in southern Switzerland’s Valais canton, is a mountain resort renowned for skiing, climbing and hiking. The town lies below the iconic, pyramid-shaped Matterhorn peak.",
      tag: "Alpine Peaks",
    },
    {
      id: "winter-8",
      name: "Sydney",
      country: "Australia",
      wikiTitle: "Sydney",
      fallbackDesc:
        "Escape the freezing winter cold of the north by visiting Sydney, which is in its sun-soaked summer season, offering beautiful beaches like Bondi and outdoor harbor festivals.",
      tag: "Southern Summer",
    },
    {
      id: "winter-9",
      name: "Prague",
      country: "Czech Republic",
      wikiTitle: "Prague",
      fallbackDesc:
        "Prague comes alive in winter with world-famous, cozy Christmas markets, fairy-tale snowy spires, and hot traditional trdelník pastries.",
      tag: "Winter Markets",
    },
    {
      id: "winter-10",
      name: "Aspen",
      country: "United States",
      wikiTitle: "Aspen,_Colorado",
      fallbackDesc:
        "Aspen, in Colorado’s Rocky Mountains, is a famous ski resort town and a year-round destination for outdoor recreation, luxury shopping, and dining.",
      tag: "Snow Skiing",
    },
    {
      id: "winter-11",
      name: "Lapland",
      country: "Finland",
      wikiTitle: "Lapland_(Finland)",
      fallbackDesc:
        "Lapland is Finland’s northernmost region, a sparsely populated area bordering Sweden, Norway, Russia and the Baltic Sea, known as the official hometown of Santa Claus.",
      tag: "Santa's Home",
    },
    {
      id: "winter-12",
      name: "Salzburg",
      country: "Austria",
      wikiTitle: "Salzburg",
      fallbackDesc:
        "Salzburg is an Austrian city on the border of Germany, with views of the Eastern Alps, known as the birthplace of Mozart and decorated beautifully with snow-capped baroque domes.",
      tag: "Alpine Baroque",
    },
  ],
};

/**
 * Capitalize each word in a string.
 * @param {string} str
 * @returns {string}
 */
const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const Explore = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  /**
   * @param {Date} date
   * @returns {number}
   */
  const getWeekNumber = (date) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  /**
   * @param {number} month - zero-based month index (0 = January)
   * @returns {string}
   */
  const getSeason = (month) => {
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer";
    if (month >= 8 && month <= 10) return "Autumn";
    return "Winter";
  };

  /**
   * @param {{wikiTitle:string,name:string,country:string,language?:string,currencyName?:string,currencySymbol?:string,flag?:string,flagUrl?:string}} dest
   */
  const handlePlanTrip = (dest) => {
    navigate(`/explore/${encodeURIComponent(dest.wikiTitle)}`, {
      state: {
        destinationName: dest.name,
        countryName: dest.country,
        language: dest?.language || undefined,
        currencyName: dest?.currencyName || undefined,
        currencySymbol: dest?.currencySymbol || undefined,
        flag: dest?.flag || undefined,
        flagUrl: dest?.flagUrl || undefined,
      },
    });
  };

  useEffect(() => {
    const loadDestinations = async () => {
      setLoading(true);
      setError(null);

      const now = new Date();
      const season = getSeason(now.getMonth());
      const week = getWeekNumber(now);
      const year = now.getFullYear();

      const cacheKey = `trip_buddy_discover_weekly_v5_w${week}_y${year}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          setDestinations(JSON.parse(cached));
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      const pool = SEASONAL_POOLS[season];
      const selectedPool = [];
      for (let i = 0; i < 12; i++) {
        const idx = (week + i) % pool.length;
        selectedPool.push(pool[idx]);
      }

      try {
        const resolved = await Promise.all(
          selectedPool.map(async (dest) => {
            let desc = dest.fallbackDesc;
            let img = getStreetViewUrl(`${dest.name}, ${dest.country}`);
            let flag = "";
            let flagUrl = "";
            let currencySymbol = "";
            let currencyName = "";
            let language = "";

            try {
              const wikiRes = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(dest.wikiTitle)}`,
              );
              if (wikiRes.ok) {
                const wikiData = await wikiRes.json();
                if (wikiData.extract) {
                  desc = wikiData.extract;
                }
                if (wikiData.thumbnail?.source) {
                  img = wikiData.thumbnail.source;
                }
              }
            } catch (wikiErr) {}

            try {
              const countriesRes = await fetch(
                `https://corsproxy.io/?https://restcountries.com/v3.1/name/${encodeURIComponent(dest.country)}?fullText=true`,
              );
              if (countriesRes.ok) {
                const countriesData = await countriesRes.json();
                const countryObj = countriesData[0];
                if (countryObj) {
                  flag = countryObj.flag || "";
                  flagUrl =
                    countryObj.flags?.png || countryObj.flags?.svg || "";

                  const currencies =
                    countryObj.currencies &&
                    typeof countryObj.currencies === "object"
                      ? countryObj.currencies
                      : null;
                  const currencyKey = currencies
                    ? Object.keys(currencies)[0]
                    : null;
                  const currency = currencyKey
                    ? currencies?.[currencyKey]
                    : null;
                  if (currency && typeof currency === "object") {
                    currencySymbol = currency.symbol || currencyKey || "";
                    currencyName = currency.name || "";
                  }

                  const languages =
                    countryObj.languages &&
                    typeof countryObj.languages === "object"
                      ? Object.values(countryObj.languages)
                      : [];
                  if (languages.length > 0) {
                    language = String(languages[0]);
                  }
                }
              }
            } catch (countryErr) {}

            if (canUsePlacesPhotoLookup) {
              try {
                const placesRes = await GetPlaceDetails({
                  textQuery: `${dest.name}, ${dest.country}`,
                });
                const photoName =
                  placesRes?.data?.places?.[0]?.photos?.[0]?.name;
                if (photoName) {
                  img = PHOTO_REF_URL.replace("{NAME}", photoName);
                }
              } catch (placesErr) {
                if (
                  placesErr &&
                  placesErr.response &&
                  placesErr.response.status === 403
                ) {
                  canUsePlacesPhotoLookup = false;
                }
              }
            }

            return {
              ...dest,
              description: desc,
              image: img,
              flag,
              flagUrl,
              currencySymbol,
              currencyName,
              language,
            };
          }),
        );

        localStorage.setItem(cacheKey, JSON.stringify(resolved));
        setDestinations(resolved);
      } catch (err) {
        setError(
          "Could not load recommendations. Showing offline default views.",
        );
        const fallbackList = selectedPool.map((dest) => ({
          ...dest,
          description: dest.fallbackDesc,
          image: getStreetViewUrl(`${dest.name}, ${dest.country}`),
        }));
        setDestinations(fallbackList);
      } finally {
        setLoading(false);
      }
    };

    loadDestinations();
  }, []);

  const forceSkeleton = false;

  if (loading || forceSkeleton) {
    return (
      <div className="min-h-screen bg-slate-50 pt-44 pb-20 px-4 md:px-6 font-sans animate-in fade-in duration-300">
        <SEO
          title="Explore Destinations"
          description="Discover your next adventure with Trip Buddy's curated destinations."
        />

        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
              Discover Your Next{" "}
              <span className="text-indigo-600 italic">Adventure</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Explore our handpicked selection of global gems and let our AI turn
              your inspiration into a perfect itinerary.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm flex flex-col"
              >
                <div className="aspect-video relative overflow-hidden">
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width="100%"
                    height="100%"
                  />
                  <div className="absolute top-6 left-6 z-10">
                    <Skeleton
                      variant="rounded"
                      animation="wave"
                      width={64}
                      height={20}
                      className="rounded-full"
                      sx={{ bgcolor: "rgba(0, 0, 0, 0.12)" }}
                    />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 z-10 space-y-2">
                    <Skeleton
                      variant="rounded"
                      animation="wave"
                      width={80}
                      height={12}
                      className="rounded-sm"
                      sx={{ bgcolor: "rgba(0, 0, 0, 0.12)" }}
                    />
                    <Skeleton
                      variant="rounded"
                      animation="wave"
                      width={128}
                      height={24}
                      className="rounded-md"
                      sx={{ bgcolor: "rgba(0, 0, 0, 0.18)" }}
                    />
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton
                        variant="rounded"
                        animation="wave"
                        width="100%"
                        height={12}
                        className="rounded-sm"
                      />
                      <Skeleton
                        variant="rounded"
                        animation="wave"
                        width="100%"
                        height={12}
                        className="rounded-sm"
                      />
                      <Skeleton
                        variant="rounded"
                        animation="wave"
                        width="66%"
                        height={12}
                        className="rounded-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 border-y border-slate-100">
                      <div className="flex items-center gap-1.5 w-1/3">
                        <Languages className="w-4 h-4 text-slate-300 animate-pulse shrink-0" />
                        <Skeleton
                          variant="rounded"
                          animation="wave"
                          width={48}
                          height={12}
                          className="rounded-sm"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 w-1/3 justify-end">
                        <Wallet className="w-4 h-4 text-slate-300 animate-pulse shrink-0" />
                        <Skeleton
                          variant="rounded"
                          animation="wave"
                          width={48}
                          height={12}
                          className="rounded-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      sx={{
                        borderRadius: "1rem",
                        height: "2.5rem",
                        width: "100%",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-44 pb-20 px-4 md:px-6 font-sans">
      <SEO
        title="Explore Destinations"
        description="Discover your next adventure with Trip Buddy's curated destinations."
      />

      <div className="max-w-screen-2xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            Discover Your Next{" "}
            <span className="text-indigo-600 italic">Adventure</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Explore our handpicked selection of global gems and let our AI turn
            your inspiration into a perfect itinerary.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {destinations.map((dest, idx) => (
            <div
              key={dest.id}
              className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-in fade-in zoom-in-95 flex flex-col"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="aspect-video overflow-hidden relative">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <div className="absolute top-6 left-6">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/30">
                    {dest.tag}
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-1">
                    {dest.flagUrl ? (
                      <img
                        src={dest.flagUrl}
                        alt=""
                        className="w-4 h-3 object-cover rounded-xs inline-block shadow-sm"
                      />
                    ) : (
                      <span className="text-base leading-none">
                        {dest.flag || "📍"}
                      </span>
                    )}
                    <span>{dest.country}</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {dest.name}
                  </h3>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                    {dest.description || dest.fallbackDesc}
                  </p>

                  {(dest.language || dest.currencyName) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 py-3 border-y border-slate-100">
                      {dest.language && (
                        <div
                          className="flex items-center gap-1.5"
                          title={`Native Language: ${dest.language}`}
                        >
                          <Languages className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>{dest.language}</span>
                        </div>
                      )}
                      {dest.currencyName && (
                        <div
                          className="flex items-center gap-1.5 ml-auto"
                          title={`Local Currency: ${dest.currencyName}`}
                        >
                          <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{capitalizeWords(dest.currencyName)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => handlePlanTrip(dest)}
                    className="w-full h-10 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 group/btn shadow-md shadow-slate-900/10 cursor-pointer"
                  >
                    Read Guide
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
