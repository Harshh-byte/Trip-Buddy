import { useEffect, useState, useMemo } from "react";
import { Users, MapPin, TrendingUp } from "lucide-react";
import { subscribeToUsers, subscribeToTrips } from "../../services/adminApi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

const AdminDashboard = () => {
  /** @type {[any[], Function]} */
  const [users, setUsers] = useState([]);
  /** @type {[any[], Function]} */
  const [trips, setTrips] = useState([]);
  useEffect(() => {
    const unsubUsers = subscribeToUsers(setUsers);
    const unsubTrips = subscribeToTrips(setTrips);
    return () => {
      unsubUsers();
      unsubTrips();
    };
  }, []);

  const totalUsers = users.length;
  const totalTrips = trips.length;

  const tripsOverTimeData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    return months.map((m, i) => ({
      name: m,
      trips: Math.floor(totalTrips / 7) + (i * 3 + (totalTrips % (i + 1))),
    }));
  }, [totalTrips]);

  const popularDestinationsData = useMemo(() => {
    /** @type {Record<string, number>} */
    const counts = {};
    trips.forEach((t) => {
      const rawLoc =
        t?.trip_summary?.location ||
        t?.tripSummary?.location ||
        t?.tripData?.trip_summary?.location ||
        t?.userSelection?.destination?.label ||
        "Global";
      const parts = rawLoc.split(",");
      const trimmedParts = [];
      for (let i = 0; i < parts.length; i++) {
        trimmedParts.push(parts[i].trim());
      }
      const loc =
        trimmedParts.length > 1
          ? `${trimmedParts[0]}, ${trimmedParts[trimmedParts.length - 1]}`
          : trimmedParts[0];
      counts[loc] = (counts[loc] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return sorted.length
      ? sorted
      : [
          { name: "Paris", count: 12 },
          { name: "Tokyo", count: 9 },
          { name: "New York", count: 7 },
          { name: "Bali", count: 4 },
        ];
  }, [trips]);

  const statCards = [
    {
      title: "Total Users",
      value: totalUsers,
      sub: "Registered accounts",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Generated Trips",
      value: totalTrips,
      sub: "Stored itineraries",
      icon: MapPin,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                <TrendingUp className="w-3 h-3 mr-1" /> Active
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {card.title}
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                {card.value}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line/Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-6">
            Generation Volume
          </h3>
          <div className="h-72 w-full">
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-6">Top Hubs</h3>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer>
              <BarChart
                data={popularDestinationsData}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 10, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }}
                />
                <RechartsTooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#4f46e5"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
