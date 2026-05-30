import { Link, useNavigate } from "react-router-dom";
import { Plane, Twitter, Github, Mail } from "lucide-react";

const getStoredUser = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleAIPlannerClick = (e) => {
    e.preventDefault();
    if (getStoredUser()) {
      navigate("/v2/create-trip");
    } else {
      window.dispatchEvent(new Event("open-login-dialog"));
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-sm">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="flex font-bold text-xl tracking-tight text-slate-900">
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
              <li>
                <a href="/v2/create-trip" onClick={handleAIPlannerClick} className="hover:text-indigo-600 transition-colors cursor-pointer">
                  AI Planner
                </a>
              </li>
              <li>
                <Link to="/explore" className="hover:text-indigo-600 transition-colors">
                  Destinations
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-left">
            <h4 className="font-bold text-[#1A1A1A] mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                  Terms of Service
                </Link>
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
            © {currentYear} Trip Buddy. Published for your next adventure.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
