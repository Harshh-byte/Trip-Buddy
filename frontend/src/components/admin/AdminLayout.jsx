import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MapPin,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Command,
  Settings,
} from "lucide-react";
import { getStoredAdminUser, logoutAdmin } from "../../services/adminApi";
import SEO from "../shared/SEO";

const AdminLayout = () => {
  const [adminUser, setAdminUser] = useState(getStoredAdminUser());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const handleStorage = () => setAdminUser(getStoredAdminUser());
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logoutAdmin();
    setAdminUser(null);
    navigate("/admin/login");
  };

  const navItems = [
    { name: "Overview", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Directory", path: "/admin/users", icon: Users },
    { name: "Registry", path: "/admin/trips", icon: MapPin },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 relative">
      <SEO
        title="Admin Dashboard"
        description="System Panel"
        keywords="Admin, Dashboard, Trip Buddy"
        image="https://trip-buddy-n6b3.onrender.com/favicon.png"
        url="https://trip-buddy-n6b3.onrender.com/admin/dashboard"
      />

      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Structural Sidebar */}
      <aside
        className={`
          ${isMobile ? "fixed inset-y-0 left-0 z-50 shadow-2xl" : "relative border-r border-slate-200"}
          ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"}
          transition-all duration-300 ease-in-out bg-white flex flex-col shrink-0
        `}
      >
        {/* Brand Section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Command className="w-5 h-5" />
            </div>
            {(sidebarOpen || isMobile) && (
              <span className="font-bold text-sm tracking-tight leading-none text-slate-900">
                Trip <span className="text-indigo-600">Buddy</span>
              </span>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`
                }
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${sidebarOpen || isMobile ? "" : "mx-auto"}`}
                />
                {(sidebarOpen || isMobile) && (
                  <>
                    <span className="truncate flex-1">{item.name}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div
            className={`flex items-center gap-3 mb-4 ${!(sidebarOpen || isMobile) && "justify-center"}`}
          >
            <img
              src={
                adminUser?.photoURL ||
                adminUser?.picture ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminUser?.name || "admin"}`
              }
              alt="Admin"
              className="w-9 h-9 rounded-full border border-slate-200 object-cover shrink-0 bg-white shadow-sm"
            />
            {(sidebarOpen || isMobile) && (
              <div className="flex flex-col truncate text-left">
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {adminUser?.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Admin
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 justify-center py-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-transparent hover:border-rose-100 ${
              !(sidebarOpen || isMobile) && "px-0"
            }`}
          >
            <LogOut className="w-4 h-4" />
            {(sidebarOpen || isMobile) && (
              <span className="text-xs font-bold uppercase tracking-widest">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 px-4 md:px-8 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-slate-800">
              Admin Panel
            </h2>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-500">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
