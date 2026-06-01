import {
  MousePointerClick,
  Sparkles,
  Map,
  Star,
  TentTree,
  Bus,
  Clock,
  Globe,
  Tickets,
  UserStar,
  Compass,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CountUp from "react-countup";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../@/components/ui/accordion";
import { FAQ_DATA } from "../../assets/data";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <section className="min-h-screen bg-mesh pt-32 pb-12 px-6 flex items-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-blue-400/5 rounded-full blur-[100px] animate-pulse [animation-delay:4s]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center z-10">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/50 shadow-sm ring-1 ring-black/5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900/70">
                AI-Powered Travel Agent v2.0
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-[#1A1A1A] tracking-tight leading-[0.95]">
              Design Your <br />
              <span className="text-gradient">Dream Getaway</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-lg font-medium">
              Tell us where you want to go, and let our advanced AI craft the
              perfect itinerary tailored to your budget and interests.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Button removed as per request */}
            </div>
          </div>

          <div className="relative group animate-in fade-in slide-in-from-right-8 duration-1000 hidden lg:block">
            <div className="glass-card rounded-4xl p-8 transform transition-transform group-hover:-rotate-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Compass className="w-5 h-5 text-indigo-600 animate-[spin_10s_linear_infinite]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Day 1</h4>
                  <p className="text-xs text-gray-400">Perfectly Optimized</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Bus size={32} />
                  </div>
                  <div className="flex-1 text-left">
                    <h5 className="font-bold text-gray-900 text-sm">
                      Amalfi Coast Scenic Bus Tour
                    </h5>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      Ride the famous winding roads from Sorrento to Salerno
                      with panoramic cliffside views of the Tyrrhenian Sea.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-current" /> Best Views
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                        <Clock className="inline w-3 h-3 mr-1" /> 2 Hours
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <TentTree size={32} />
                  </div>
                  <div className="flex-1 text-left">
                    <h5 className="font-bold text-gray-900 text-sm">
                      Eco-Glamping in Tuscany
                    </h5>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      Wake up to rolling vineyards in a luxury sustainable tent.
                      Perfect for stargazing and wine tasting.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-current" /> Nature Choice
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                        <Clock className="inline w-3 h-3 mr-1" /> Overnight
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center">
                <Sparkles className="text-indigo-600 w-5 h-5 fill-indigo-50" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  Itinerary Optimized
                </p>
                <p className="text-[10px] text-gray-400">
                  100% Tailored to you
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Features />
      <FAQ />
    </div>
  );
};

const Features = () => {
  const features = [
    {
      icon: <MousePointerClick className="w-8 h-8 text-orange-500" />,
      title: "Plan in Seconds",
      description:
        "Tell us your destination, budget, and who you're traveling with. We handle the rest.",
      bgColor: "bg-orange-50",
    },
    {
      icon: <Sparkles className="w-8 h-8 text-indigo-600" />,
      title: "AI Itineraries",
      description:
        "Our advanced algorithms curate the best spots, hidden gems, and efficient routes just for you.",
      bgColor: "bg-indigo-50",
    },
    {
      icon: <Map className="w-8 h-8 text-green-600" />,
      title: "Smart Navigation",
      description:
        "Get one-click direct access to Google Maps for every hand-picked stop and stay on your itinerary.",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <section className="pt-16 sm:pt-20 md:pt-24 pb-0 bg-transparent px-6 relative z-10 -mt-12">
      <div className="max-w-7xl mx-auto text-center">
        <span className="text-indigo-600 font-bold tracking-widest uppercase text-sm">
          Seamless Experience
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] mt-4 mb-16 tracking-tight">
          Travel planning <br className="sm:hidden" />
          made <span className="text-gray-400">effortless</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-10 rounded-[2.5rem] glass-card text-left"
            >
              <div
                className={`${feature.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}
              >
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-500 leading-relaxed text-lg">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-20 mt-14 mb-0">
          <div className="glass rounded-3xl p-8 flex flex-col sm:flex-row justify-around items-center gap-8 divide-y sm:divide-y-0 sm:divide-x divide-gray-200/50">
            <div className="text-center px-8 w-full">
              <p className="text-4xl font-black text-slate-900 flex items-center justify-center gap-1">
                <Tickets className="w-6 h-6 text-indigo-500" />
                <CountUp
                  end={11}
                  duration={2.5}
                  enableScrollSpy
                  scrollSpyOnce
                />
                k+
              </p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Happy Travelers
              </p>
            </div>
            <div className="text-center px-8 w-full pt-8 sm:pt-0">
              <p className="text-4xl font-black text-slate-900 flex items-center justify-center gap-1">
                <UserStar className="w-6 h-6 text-amber-500" />
                <CountUp
                  end={4.8}
                  decimals={1}
                  duration={3}
                  enableScrollSpy
                  scrollSpyOnce
                />
                <span className="text-2xl text-slate-300">/5</span>
              </p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                User Rating
              </p>
            </div>
            <div className="text-center px-8 w-full pt-8 sm:pt-0">
              <p className="text-4xl font-black text-slate-900 flex items-center justify-center gap-2">
                <Globe className="w-6 h-6 text-green-600" />
                <CountUp
                  end={190}
                  duration={3.2}
                  enableScrollSpy
                  scrollSpyOnce
                />
                +
              </p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Countries Covered
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  return (
    <section className="bg-transparent px-6 pt-16 sm:pt-20 md:pt-24 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] tracking-tight">
            Frequently <span className="text-gray-400">Asked</span>{" "}
            <span className="text-gradient">Questions</span>
          </h2>
          <div className="w-20 h-1.5 bg-rose-600 rounded-full mt-4 mx-auto" />
          <p className="text-gray-500 mt-4 text-lg">
            Everything you need to know about planning your next trip.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {FAQ_DATA.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="glass-card rounded-3xl px-6 py-2 data-[state=open]:border-indigo-100"
            >
              <AccordionTrigger className="text-left font-bricolage font-bold text-[#1A1A1A] text-lg tracking-tight hover:no-underline hover:text-indigo-600 transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500 font-bricolage text-base leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default Hero;
