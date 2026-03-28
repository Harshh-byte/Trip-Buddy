import { useNavigate } from "react-router-dom";
import { Home, MapPinned, Search, MoveLeft } from "lucide-react";
import { Button } from "../components/ui/button";

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-b from-[#FDF2E9] via-[#FFF7F1] to-[#FFFFFF] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-16 top-14 h-36 w-36 rounded-full bg-indigo-200/45 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-52 w-52 rounded-full bg-orange-200/40 blur-3xl" />

      <div className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 duration-700">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 text-center shadow-[0_20px_70px_-35px_rgba(0,0,0,0.35)] backdrop-blur md:p-10">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-[2rem] border border-[#F3E7DB] bg-[#FFFDF9] p-6 shadow-lg md:p-8">
              <MapPinned className="h-16 w-16 text-indigo-600 md:h-20 md:w-20" />
              <div className="absolute -right-2 -top-2 rounded-full bg-orange-500 p-2 text-white shadow-lg">
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </div>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#708783]">
            Trip Buddy
          </p>
          <h1 className="mb-2 text-6xl font-black tracking-[-0.04em] text-[#1A1A1A] md:text-8xl">
            404
          </h1>
          <h2 className="text-2xl font-bold text-[#1A1A1A] md:text-3xl">
            This stop is off the map
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 md:text-base">
            The page you are trying to reach is not available right now. It
            might have moved, been removed, or the link is incorrect
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => navigate("/")}
              className="h-12 rounded-xl bg-indigo-600 px-6 text-base font-bold text-white hover:bg-indigo-700 sm:h-13"
            >
              <Home className="h-5 w-5" />
              Return Home
            </Button>

            <button
              onClick={() => navigate(-1)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 font-semibold text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            >
              <MoveLeft className="h-4 w-4" />
              Previous Page
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400 md:text-sm">
            <span className="h-px w-7 bg-gray-200" />
            Let&apos;s get your trip back on track
            <span className="h-px w-7 bg-gray-200" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageNotFound;
