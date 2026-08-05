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
  Settings,
  BarChart3,
  Plane,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getStoredAdminUser, logoutAdmin } from "../../services/adminApi";
import SEO from "../shared/SEO";

const AdminLayout = () => {
  const [adminUser, setAdminUser] = useState(getStoredAdminUser());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleStorage = () => setAdminUser(getStoredAdminUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
    { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    { name: "Directory", path: "/admin/users", icon: Users },
    { name: "Registry", path: "/admin/trips", icon: MapPin },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find(
      (item) => item.path === location.pathname,
    );
    return currentItem ? currentItem.name : "System Overview";
  };

  const getPageMaxWidth = () => {
    const wideRoutes = [
      "/admin/dashboard",
      "/admin/analytics",
      "/admin/users",
      "/admin/trips",
    ];
    return wideRoutes.includes(location.pathname)
      ? "max-w-none"
      : "max-w-7xl mx-auto";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden admin-scope">
      <SEO
        title="Admin Dashboard"
        description="System Dashboard"
        keywords="Admin, Dashboard, Trip Buddy"
        image="https://trip-buddy-n6b3.onrender.com/favicon.png"
        url="https://trip-buddy-n6b3.onrender.com/admin/dashboard"
      />

      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-40 relative ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-110"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="h-16 flex items-center border-b border-slate-100 pl-6 gap-3 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 shrink-0 flex items-center justify-center shadow-xs">
            <img
              src="/favicon.svg"
              alt="Trip Buddy"
              className="w-7 h-7 object-contain"
            />
          </div>
          <span
            className={`font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${
              isCollapsed
                ? "w-0 opacity-0 pointer-events-none"
                : "w-32 opacity-100"
            }`}
          >
            Trip <span className="text-indigo-600">Buddy</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm font-medium transition-all duration-300 group relative py-2.5 pr-3 pl-4.5 gap-3 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
                title={isCollapsed ? item.name : ""}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span
                  className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                    isCollapsed
                      ? "w-0 opacity-0 pointer-events-none"
                      : "w-32 opacity-100 ml-1"
                  }`}
                >
                  {item.name}
                </span>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-indigo-600 rounded-r-full transition-all duration-300 group-[.active]:h-3/4 opacity-0 group-[.active]:opacity-100" />
              </NavLink>
            );
          })}
        </nav>

        <div
          className={`p-4 border-t border-slate-100 transition-all duration-300 ${isCollapsed ? "pl-5 pr-3" : "pl-4 pr-4"}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <img
              src={
                adminUser?.photoURL ||
                adminUser?.picture ||
                `https://api.dicebear.com/7.x/lorelei/svg?seed=${adminUser?.name || "admin"}`
              }
              alt="Admin"
              className="w-10 h-10 rounded-xl border border-slate-200 object-cover shrink-0 shadow-sm transition-all duration-300"
            />
            <div
              className={`flex flex-col transition-all duration-300 overflow-hidden whitespace-nowrap ${
                isCollapsed
                  ? "w-0 opacity-0 pointer-events-none"
                  : "w-32 opacity-100 ml-1"
              }`}
            >
              <span className="text-sm font-semibold text-slate-900 truncate">
                {adminUser?.name}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Administrator
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center py-2.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 gap-3 ${
              isCollapsed ? "pl-2.5" : "pl-3.5"
            }`}
            title={isCollapsed ? "Sign Out" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span
              className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                isCollapsed
                  ? "w-0 opacity-0 pointer-events-none"
                  : "w-32 opacity-100 ml-1"
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-white/70 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="lg:hidden flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-md shadow-indigo-200 shrink-0">
                <Plane className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Trip <span className="text-indigo-600">Buddy</span>
              </span>
            </div>

            <h2 className="hidden lg:block text-lg font-bold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4"></div>
        </header>

        <main
          className={`flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8 w-full animate-in fade-in duration-500 ${getPageMaxWidth()}`}
        >
          <Outlet />
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 pb-safe z-40">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                      isActive
                        ? "text-indigo-600"
                        : "text-slate-400 hover:text-slate-600"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;
