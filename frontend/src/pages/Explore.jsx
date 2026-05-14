import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, MapPin, ArrowRight } from "lucide-react";
import SEO from "../components/shared/SEO";

const destinations = [
  {
    id: 1,
    name: "Paris",
    country: "France",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800",
    description: "The city of light, romance, and iconic architecture.",
    tag: "Romantic",
  },
  {
    id: 2,
    name: "Tokyo",
    country: "Japan",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800",
    description: "A neon-lit metropolis where tradition meets the future.",
    tag: "Vibrant",
  },
  {
    id: 3,
    name: "Bali",
    country: "Indonesia",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800",
    description: "Tropical paradise with lush jungles and serene beaches.",
    tag: "Relaxation",
  },
  {
    id: 4,
    name: "Rome",
    country: "Italy",
    image:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800",
    description: "An eternal city filled with history and ancient wonders.",
    tag: "Historic",
  },
  {
    id: 5,
    name: "New York",
    country: "USA",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800",
    description: "The concrete jungle where dreams are made of.",
    tag: "Iconic",
  },
  {
    id: 6,
    name: "Santorini",
    country: "Greece",
    image:
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&q=80&w=800",
    description: "White-washed buildings and stunning sunset views.",
    tag: "Scenic",
  },
];

const Explore = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6 font-sans">
      <SEO
        title="Explore Destinations"
        description="Discover your next adventure with Trip Buddy's curated destinations."
      />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Sparkles className="w-3 h-3" />
            Curated For You
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            Discover Your Next{" "}
            <span className="text-indigo-600 italic">Adventure</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Explore our handpicked selection of global gems and let our AI turn
            your inspiration into a perfect itinerary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest, idx) => (
            <div
              key={dest.id}
              className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-in fade-in zoom-in-95"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="aspect-4/5 overflow-hidden relative">
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
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-300 mb-1">
                    <MapPin className="w-3 h-3" />
                    {dest.country}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">
                    {dest.name}
                  </h3>
                </div>
              </div>

              <div className="p-8">
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {dest.description}
                </p>
                <button
                  onClick={() => navigate("/v2/create-trip")}
                  className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200"
                >
                  Plan this trip
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
