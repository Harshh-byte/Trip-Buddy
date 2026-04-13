import { Button } from "../ui/button";
import { FaArrowRightLong } from "react-icons/fa6";
import {
  MousePointerClick,
  Sparkles,
  Map,
  Star,
  TentTree,
  Bus,
  Clock,
  Twitter,
  Github,
  Mail,
  Plane,
  Globe,
  Tickets,
  UserStar,
  Compass,
} from "lucide-react";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../@/components/ui/accordion";
import { FAQ_DATA } from "../../assets/data";

const Hero = () => {
  return (
    <div className="flex flex-col">
      <section className="min-h-screen bg-[#FDF2E9] pt-24 pb-12 px-6 flex items-center relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 text-left animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/50 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
              </span>
              <span className="text-sm font-medium text-indigo-900">
                AI-Powered Travel Agent v2.0
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1]">
              Design Your Dream <br />
              <span className="text-indigo-600">Getaway in Seconds</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
              Tell us where you want to go, and let our advanced AI craft the
              perfect itinerary tailored to your budget and interests.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                className="group relative overflow-hidden px-8 py-7 text-lg font-bold rounded-2xl text-white bg-linear-to-r from-[#1A1A1A] via-[#232323] to-[#121212] border border-white/15 shadow-[0_14px_34px_-14px_rgba(17,24,39,0.65)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_42px_-16px_rgba(17,24,39,0.72)] active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-indigo-300/40"
              >
                <Link
                  to="/v2/create-trip"
                  aria-label="Start planning your trip"
                  className="inline-flex items-center justify-center gap-3"
                >
                  Start Planning
                  <FaArrowRightLong className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative group animate-in fade-in slide-in-from-right-8 duration-1000 hidden lg:block">
            <div className="bg-white rounded-[2rem] shadow-2xl border border-white p-8 transform transition-transform group-hover:-rotate-1">
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
      <Footer />
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
    <section className="pt-8 sm:pt-10 md:pt-12 pb-0 bg-white px-6">
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
              className="group p-10 rounded-[2.5rem] bg-[#FDF2E9]/50 border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 text-left"
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
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/30 p-8 flex flex-col sm:flex-row justify-around items-center gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
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
    <section className="bg-white px-6 pt-8 sm:pt-10 md:pt-12 pb-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] tracking-tight">
            Frequently <span className="text-gray-400">Asked</span>{" "}
            <span className="text-indigo-600">Questions</span>
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
              className="border border-gray-100 rounded-[1.5rem] px-6 py-2 bg-[#FDF2E9]/30 data-[state=open]:bg-white data-[state=open]:shadow-xl data-[state=open]:shadow-indigo-50 transition-all duration-300"
            >
              <AccordionTrigger className="text-left font-bold text-[#1A1A1A] text-lg hover:no-underline hover:text-indigo-600 transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500 text-base leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:flex font-bold text-xl tracking-tight">
                Trip Buddy
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your intelligent travel companion. We turn your bucket list into
              optimized itineraries using state-of-the-art AI.
            </p>
          </div>

          <div className="text-left">
            <h4 className="font-bold text-[#1A1A1A] mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">
                Trip Builder
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">
                Explore Places
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">
                Plans & Pricing
              </li>
            </ul>
          </div>

          <div className="text-left">
            <h4 className="font-bold text-[#1A1A1A] mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">
                Help Center
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">
                Privacy Policy
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition-colors">
                Terms of Service
              </li>
            </ul>
          </div>

          <div className="space-y-4 text-left">
            <h4 className="font-bold text-[#1A1A1A]">Stay Connected</h4>
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/Harshh_hb"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on X"
                className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-50 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <Twitter className="h-5 w-5" />
              </a>

              <a
                href="https://github.com/Harshh-byte"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View GitHub profile"
                className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                <Github className="h-5 w-5" />
              </a>

              <a
                href="mailto:rockstarharsh7jan@gmail.com?subject=Trip%20Buddy%20Contact"
                aria-label="Send an email"
                className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs">
            © {currentYear} Trip Buddy AI. Published for your next adventure.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Hero;
