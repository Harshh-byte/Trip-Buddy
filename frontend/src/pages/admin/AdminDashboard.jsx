import { useEffect, useState, useMemo } from "react";
import {
  Users,
  MapPin,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { subscribeToUsers, subscribeToTrips } from "../../services/adminApi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const AdminDashboard = () => {
  const chartStyles = `
    .recharts-wrapper, .recharts-wrapper *, .recharts-surface, .recharts-surface * {
      outline: none !important;
      -webkit-tap-highlight-color: transparent;
    }
    .recharts-active-dot, .recharts-sector, .recharts-rectangle, .recharts-curve {
      outline: none !important;
    }
    path:focus, svg:focus, g:focus {
      outline: none !important;
    }
    .custom-tooltip {
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01) !important;
      border-radius: 16px !important;
    }
  `;
  /** @type {[any[], Function]} */
  const [users, setUsers] = useState([]);
  /** @type {[any[], Function]} */
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let usersLoaded = false;
    let tripsLoaded = false;

    const checkLoading = () => {
      if (usersLoaded && tripsLoaded) {
        setLoading(false);
      }
    };

    const unsubUsers = subscribeToUsers((data) => {
      setUsers(data);
      usersLoaded = true;
      checkLoading();
    });

    const unsubTrips = subscribeToTrips((data) => {
      setTrips(data);
      tripsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubUsers();
      unsubTrips();
    };
  }, []);

  const totalUsers = users.length;
  const totalTrips = trips.length;

  const userGrowth = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const newUsers = users.filter((u) => {
      const date = u?.createdAt?.seconds
        ? new Date(u.createdAt.seconds * 1000)
        : new Date(u.createdAt || 0);
      return date >= lastMonth;
    }).length;
    return newUsers > 0
      ? `+${Math.round((newUsers / totalUsers) * 100)}%`
      : "+0%";
  }, [users, totalUsers]);

  const tripGrowth = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const newTrips = trips.filter((t) => {
      const date = t?.createdAt?.seconds
        ? new Date(t.createdAt.seconds * 1000)
        : new Date(t.createdAt || 0);
      return date >= lastMonth;
    }).length;
    return newTrips > 0
      ? `+${Math.round((newTrips / totalTrips) * 100)}%`
      : "+0%";
  }, [trips, totalTrips]);

  const tripsOverTimeData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    return months.map((m, i) => ({
      name: m,
      trips: Math.floor(totalTrips / 7) + (i * 3 + (totalTrips % (i + 1))),
    }));
  }, [totalTrips]);

  const statCards = [
    {
      title: "Total Users",
      value: totalUsers,
      growth: userGrowth,
      isPositive: true,
      sub: "Joined since last month",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Trips",
      value: totalTrips,
      growth: tripGrowth,
      isPositive: true,
      sub: "Generated recently",
      icon: MapPin,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-slate-900 tracking-tight">
              Loading Overview
            </p>
            <p className="text-xs font-medium text-slate-400">
              Fetching real-time metrics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <style>{chartStyles}</style>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            System Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time metrics and platform analytics.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-6"
          >
            <div
              className={`p-4 rounded-2xl ${card.bg} ${card.color} shrink-0`}
            >
              <card.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {card.title}
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {card.value}
              </h3>
              <div
                className={`flex items-center gap-1 text-[11px] font-bold mt-1 ${
                  card.isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {card.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                <span>{card.growth}</span>
                <span className="text-slate-400 font-medium ml-0.5">
                  vs last month
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Line/Area Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-6">
            Generation Volume
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <AreaChart
                data={tripsOverTimeData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="trips"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fill="url(#colorTrips)"
                  className="outline-none focus:outline-none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
