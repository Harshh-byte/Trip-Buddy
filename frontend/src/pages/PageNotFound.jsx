import { useNavigate } from "react-router-dom";
import {
  Home,
  MoveLeft,
  Compass,
  Plane,
  Sparkles,
  Cloud,
  Navigation,
} from "lucide-react";
import { Button } from "../components/ui/button";
import SEO from "../components/shared/SEO";

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] md:min-h-[calc(100vh-5rem)] w-full items-center justify-center overflow-hidden bg-slate-50/80 px-4 py-8 md:py-16">
      <SEO
        title="404 - Page Not Found"
        description="The page you are looking for does not exist. Let's get you back on track to planning your next adventure."
        keywords="AI Travel, Trip Planner, Itinerary Generator, Travel Agent, Vacation Planning"
        image="https://trip-buddy-n6b3.onrender.com/favicon.png"
        url="https://trip-buddy-n6b3.onrender.com/404"
      />

      <div 
        className="pointer-events-none fixed inset-0 h-full w-full opacity-[0.4]" 
        style={{
          backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '44px 44px'
        }}
      />

      <div className="pointer-events-none absolute -left-12 top-6 h-64 w-64 rounded-full bg-indigo-500/15 blur-[90px] md:h-96 md:w-96 md:blur-[130px]" />
      <div className="pointer-events-none absolute -right-12 bottom-6 h-64 w-64 rounded-full bg-purple-500/15 blur-[90px] md:h-96 md:w-96 md:blur-[130px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/15 blur-[80px] md:h-80 md:w-80 md:blur-[120px]" />

      <div className="pointer-events-none absolute inset-0 block md:hidden">
        <div className="absolute top-[8%] right-[8%] flex items-center justify-center p-2.5 rounded-2xl bg-white/90 shadow-sm border border-slate-100">
          <Plane className="h-4 w-4 text-indigo-600 rotate-12" />
        </div>
        <div className="absolute bottom-[10%] left-[8%] flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 shadow-sm border border-slate-100">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] font-bold text-slate-500">Recalculating</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute top-[18%] left-[12%] flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 shadow-md shadow-slate-200/50 backdrop-blur-md border border-white animate-bounce animation-duration-[4s]">
          <Cloud className="h-5 w-5 text-sky-500" />
          <span className="text-xs font-bold text-slate-600">Off-Grid Destination</span>
        </div>

        <div className="absolute bottom-[22%] right-[12%] flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 shadow-md shadow-slate-200/50 backdrop-blur-md border border-white animate-bounce animation-duration-[5s]">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-bold text-slate-600">AI Route Recalculating</span>
        </div>

        <div className="absolute top-[28%] right-[18%] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md shadow-indigo-100 backdrop-blur-md border border-white animate-pulse">
          <Navigation className="h-4 w-4 text-indigo-600 rotate-45" />
        </div>

        <svg className="h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 120 700 Q 350 150 850 450 T 1550 180"
            fill="transparent"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeDasharray="8 8"
          />
        </svg>
        <Plane className="absolute top-[22%] left-[58%] w-7 h-7 text-indigo-500 rotate-12 animate-pulse" />
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md animate-in fade-in zoom-in-95 duration-500 my-auto">
        <div className="rounded-[2.25rem] sm:rounded-[2.5rem] border border-slate-100 bg-white/95 p-6 sm:p-9 text-center shadow-xl shadow-indigo-950/5 backdrop-blur-md">
          <div className="mb-4 sm:mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100/60 text-indigo-600 shadow-xs sm:h-20 sm:w-20 sm:rounded-3xl">
              <Compass className="h-8 w-8 text-indigo-600 sm:h-10 sm:w-10" />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-5xl font-black tracking-tight text-indigo-600 sm:text-6xl md:text-7xl">
              404
            </h1>

            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl md:text-2xl">
              Page not found
            </h2>

            <p className="mx-auto max-w-xs text-xs sm:text-sm font-medium leading-relaxed text-slate-400">
              The destination or page you&apos;re looking for doesn&apos;t exist, was removed, or is private.
            </p>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <button
              onClick={() => navigate(-1)}
              className="group flex h-12 w-full sm:w-auto sm:flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 active:scale-[0.98] transition-all hover:bg-slate-50 cursor-pointer shadow-xs"
            >
              <MoveLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              Go Back
            </button>

            <Button
              onClick={() => navigate("/")}
              className="flex h-12 w-full sm:w-auto sm:flex-1 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-bold text-white active:scale-[0.98] hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageNotFound;
