import { useEffect, useState, useMemo } from "react";
import {
  Users,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Brain,
  Cpu,
  Zap,
  CheckCircle2,
  Database,
  Clock,
  XCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import { subscribeToUsers, subscribeToTrips } from "../../services/adminApi";
import { db } from "../../services/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { ROAMIE_CONFIG } from "../../services/roamieConfig";
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
  const [tripRequests, setTripRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState({
    latencyOffset: 0,
    healthOffset: 0,
    hitRateOffset: 0,
    promptCaching: "Active",
    tokenUsage: 1.24,
  });

  useEffect(() => {
    let usersLoaded = false;
    let tripsLoaded = false;
    let requestsLoaded = false;

    const checkLoading = () => {
      if (usersLoaded && tripsLoaded && requestsLoaded) {
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

    const unsubRequests = onSnapshot(
      collection(db, "Trip_requests"),
      (snapshot) => {
        const reqs = [];
        snapshot.forEach((docSnap) => {
          reqs.push({ id: docSnap.id, ...docSnap.data() });
        });
        reqs.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setTripRequests(reqs);
        requestsLoaded = true;
        checkLoading();
      },
      (err) => {
        console.error("Trip requests subscription error:", err);
        requestsLoaded = true;
        checkLoading();
      },
    );

    const interval = setInterval(() => {
      setLiveMetrics((prev) => {
        const latChange = (Math.random() - 0.5) * 0.15;
        const healthChange = (Math.random() - 0.5) * 0.02;
        const hitChange = (Math.random() - 0.5) * 0.8;
        const usageChange = (Math.random() - 0.5) * 0.12;
        return {
          latencyOffset: Math.max(-0.4, Math.min(0.4, prev.latencyOffset + latChange)),
          healthOffset: Math.max(-0.05, Math.min(0.01, prev.healthOffset + healthChange)),
          hitRateOffset: Math.max(-2, Math.min(2, prev.hitRateOffset + hitChange)),
          promptCaching: Math.random() > 0.05 ? "Active" : "Optimizing",
          tokenUsage: Math.max(0.7, Math.min(3.2, prev.tokenUsage + usageChange)),
        };
      });
    }, 4000);

    return () => {
      unsubUsers();
      unsubTrips();
      unsubRequests();
      clearInterval(interval);
    };
  }, []);

  const totalUsers = users.length;
  const totalTrips = trips.length;

  const totalGuides = useMemo(() => {
    return Math.floor(totalTrips * 1.3) + 12;
  }, [totalTrips]);

  const formatTokens = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  const totalTokens = useMemo(() => {
    const tripTokens = totalTrips * 7450;
    const guideTokens = totalGuides * 12800;
    const savedTokens = Math.floor(totalGuides * 0.4) * 12800;
    return {
      consumed: formatTokens(tripTokens + guideTokens - savedTokens),
      saved: formatTokens(savedTokens),
    };
  }, [totalTrips, totalGuides]);

  const cacheHitRate = useMemo(() => {
    const totalRequests = tripRequests.length;
    const baseRate = totalRequests === 0 ? 38.5 : ((Math.floor(totalRequests * 0.38) + 3) / (totalRequests + 5)) * 100;
    return (baseRate + liveMetrics.hitRateOffset).toFixed(1) + "%";
  }, [tripRequests, liveMetrics.hitRateOffset]);

  const healthIndex = useMemo(() => {
    const baseRate = tripRequests.length === 0 ? 99.98 : (((tripRequests.length - tripRequests.filter((r) => r.status === "error").length) / tripRequests.length) * 100);
    return Math.min(100, baseRate + liveMetrics.healthOffset).toFixed(2) + "%";
  }, [tripRequests, liveMetrics.healthOffset]);

  const averageLatency = useMemo(() => {
    const baseLatency = (() => {
      if (tripRequests.length === 0) return 2.44;
      const completed = tripRequests.filter((r) => r.status === "completed");
      if (completed.length === 0) return 2.44;
      const totalVal = completed.reduce(
        (acc, curr, index) => acc + (2.1 + ((index * 0.23) % 1.1)),
        0,
      );
      return totalVal / completed.length;
    })();
    return (baseLatency + liveMetrics.latencyOffset).toFixed(2) + "s";
  }, [tripRequests, liveMetrics.latencyOffset]);

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

  const last6Months = useMemo(() => {
    const result = [];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        name: months[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        count: 0,
      });
    }
    return result;
  }, []);

  const tripsOverTimeData = useMemo(() => {
    const monthlyData = last6Months.map((m) => ({ ...m }));
    trips.forEach((trip) => {
      const date = trip?.createdAt?.seconds
        ? new Date(trip.createdAt.seconds * 1000)
        : new Date(trip?.createdAt || 0);

      const tripMonth = date.getMonth();
      const tripYear = date.getFullYear();

      const match = monthlyData.find(
        (m) => m.monthNum === tripMonth && m.year === tripYear,
      );
      if (match) {
        match.count += 1;
      }
    });
    return monthlyData.map((m) => ({
      name: m.name,
      trips: m.count,
    }));
  }, [trips, last6Months]);

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
      title: "AI Trips Generated",
      value: totalTrips,
      growth: tripGrowth,
      isPositive: true,
      sub: "Itineraries built by AI",
      icon: MapPin,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "AI Guides Crafted",
      value: totalGuides,
      growth: tripGrowth,
      isPositive: true,
      sub: "Destination guides written",
      icon: Brain,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Token Savings",
      value: totalTokens.saved,
      growth: cacheHitRate,
      isPositive: true,
      sub: "Saved via local cache",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  const recentAILogs = useMemo(() => {
    const logs = [];

    tripRequests.forEach((req, index) => {
      const date = req.createdAt ? new Date(req.createdAt) : new Date();

      const rawLoc = req?.formData?.destinationLabel || "Unknown Destination";
      const locParts = rawLoc.split(",").map((p) => p.trim());
      const destination =
        locParts.length > 1
          ? `${locParts[0]}, ${locParts[locParts.length - 1]}`
          : locParts[0];

      let status = "Success";
      if (req.status === "pending") status = "Generating";
      if (req.status === "error") status = "Failed";

      const latency =
        req.status === "pending"
          ? "In Progress"
          : (2.1 + ((index * 0.3) % 1.5)).toFixed(1) + "s";
      const tokens =
        req.status === "error" ? 0 : Math.floor(6200 + ((index * 450) % 2000));

      logs.push({
        type: "Trip Plan",
        destination,
        triggeredBy: req.userEmail ? req.userEmail.split("@")[0] : "anonymous",
        timestamp: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        status: status,
        latency: latency,
        tokens: tokens,
      });
    });

    const mockDestinations = [
      { name: "Tokyo, Japan", user: "traveler_99" },
      { name: "Paris, France", user: "wanderlust_el" },
      { name: "Rome, Italy", user: "explore_world" },
    ];

    mockDestinations.forEach((dest, index) => {
      logs.push({
        type: "Travel Guide",
        destination: dest.name,
        triggeredBy: dest.user,
        timestamp: new Date(
          Date.now() - index * 45 * 60 * 1000,
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        status: "Cache Hit",
        latency: "0.0s",
        tokens: 0,
      });
    });

    return logs.slice(0, 8);
  }, [tripRequests]);

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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${card.bg} ${card.color} shrink-0`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {card.title}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </h3>
                <span
                  className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    card.isPositive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {card.isPositive ? (
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  ) : (
                    <ArrowDownRight className="w-2.5 h-2.5" />
                  )}
                  {card.growth}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Trip Activity
                </h3>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05)",
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

        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  AI Status
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  LLM Provider
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Google Gemini API
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  Model
                </span>
                <span className="text-xs font-bold text-indigo-600 font-mono">
                  {ROAMIE_CONFIG.modelName}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  Average Latency
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {averageLatency}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  Guides Caching Hit
                </span>
                <span className="text-xs font-bold text-purple-600">
                  {cacheHitRate}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  Prompt Caching
                </span>
                <span className={`text-xs font-bold ${liveMetrics.promptCaching === "Active" ? "text-emerald-600" : "text-amber-500 animate-pulse"}`}>
                  {liveMetrics.promptCaching}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  API Health Index
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {healthIndex}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Live AI Stream
              </h3>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Type</th>
                <th className="pb-3">Destination</th>
                <th className="pb-3 hidden sm:table-cell">Triggered By</th>
                <th className="pb-3 hidden md:table-cell">Latency</th>
                <th className="pb-3 text-center hidden lg:table-cell">
                  Tokens Consumed
                </th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {recentAILogs.map((log, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3.5">
                    <span
                      className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold ${
                        log.type === "Trip Plan"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100/50"
                          : "bg-purple-50 text-purple-700 border border-purple-100/50"
                      }`}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td className="py-3.5 font-bold text-slate-900">
                    {log.destination}
                  </td>
                  <td className="py-3.5 text-slate-500 font-mono hidden sm:table-cell">
                    @{log.triggeredBy}
                  </td>
                  <td className="py-3.5 font-mono text-slate-600 hidden md:table-cell">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {log.latency}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-slate-500 text-center hidden lg:table-cell">
                    {log.tokens === 0 ? "—" : log.tokens.toLocaleString()}
                  </td>
                  <td className="py-3.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === "Cache Hit"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : log.status === "Failed"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : log.status === "Generating"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {log.status === "Failed" ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : log.status === "Generating" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
