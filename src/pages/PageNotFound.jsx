import { useNavigate } from "react-router-dom";
import {
  Home,
  MapPinned,
  Search,
  MoveLeft,
  Compass,
  Plane,
} from "lucide-react";
import { Button } from "../components/ui/button";

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-indigo-300/30 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-orange-300/20 blur-[100px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-300/20 blur-[100px]" />

      <div className="pointer-events-none absolute inset-0 opacity-20 hidden md:block">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 100 800 Q 300 100 800 500 T 1500 200"
            fill="transparent"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeDasharray="10 10"
            className="animate-[dash_30s_linear_infinite]"
          />
        </svg>
        <Plane className="absolute top-[20%] left-[60%] w-8 h-8 text-indigo-400 rotate-25 animate-pulse" />
      </div>

      <div className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 duration-700">
        <div className="rounded-[3rem] border border-white/80 bg-white/70 p-8 text-center shadow-2xl shadow-indigo-900/5 backdrop-blur-xl md:p-14">
          <div className="mb-10 flex justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-400/40 animate-ping animation-duration-[3s]" />
              <div className="absolute inset-4 rounded-full border-2 border-orange-400/30 animate-ping animation-duration-[4s]" />

              <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-white to-indigo-50 shadow-xl border border-white">
                <Compass className="absolute h-16 w-16 text-indigo-100 animate-[spin_8s_linear_infinite]" />
                <MapPinned className="relative z-20 h-10 w-10 text-indigo-600 animate-bounce animation-duration-[2s]" />

                <div className="absolute -right-2 -top-2 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-2.5 text-white shadow-lg shadow-orange-500/30 ring-4 ring-white">
                  <Search className="h-4 w-4 font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-500/80">
              Trip Buddy Error
            </p>

            <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-purple-600 to-orange-500 md:text-[9rem] leading-none drop-shadow-sm">
              404
            </h1>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              This stop is off the map
            </h2>

            <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-slate-500 md:text-base">
              Looks like you took a wrong turn. The destination you are looking
              for has moved, been deleted, or never existed in the first place.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={() => navigate("/")}
              className="group h-14 rounded-2xl bg-indigo-600 px-8 text-base font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
            >
              <Home className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Return Home
            </Button>

            <button
              onClick={() => navigate(-1)}
              className="group flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 text-base font-bold text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 hover:-translate-y-0.5"
            >
              <MoveLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
              Previous Page
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-300 md:text-xs">
            <span className="h-px w-8 bg-slate-200" />
            Let&apos;s get back on track
            <span className="h-px w-8 bg-slate-200" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageNotFound;
