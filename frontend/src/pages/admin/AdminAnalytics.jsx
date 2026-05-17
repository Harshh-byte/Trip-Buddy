// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { subscribeToTrips } from "../../services/adminApi";
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Activity,
  Star,
  Wallet,
  CalendarDays,
} from "lucide-react";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#10b981",
];

const AdminAnalytics = () => {
  const chartStyles = `
    .recharts-wrapper, .recharts-wrapper *, .recharts-surface, .recharts-surface * {
      outline: none !important;
      -webkit-tap-highlight-color: transparent;
    }
    .recharts-active-dot, .recharts-sector, .recharts-rectangle, .recharts-curve {
      outline: none !important;
      transition: all 0.3s ease;
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
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTrips = subscribeToTrips((data) => {
      setTrips(data);
      setLoading(false);
    });
    return () => unsubTrips();
  }, []);

  const budgetData = useMemo(() => {
    const counts = {};
    trips.forEach((/** @type {any} */ t) => {
      if (!t?.userSelection) return;
      const budget = t.userSelection.budget || "Moderate";
      counts[budget] = (counts[budget] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [trips]);

  const travelerData = useMemo(() => {
    const counts = {};
    trips.forEach((/** @type {any} */ t) => {
      if (!t?.userSelection) return;
      const type = t.userSelection.travelers || "Solo";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [trips]);

  const interestData = useMemo(() => {
    const counts = {};
    trips.forEach((/** @type {any} */ t) => {
      if (!t?.userSelection) return;
      const interests = t.userSelection.interests;
      if (Array.isArray(interests)) {
        interests.forEach((i) => {
          if (i) counts[i] = (counts[i] || 0) + 1;
        });
      } else if (typeof interests === "string") {
        counts[interests] = (counts[interests] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [trips]);

  const durationData = useMemo(() => {
    const counts = {};
    trips.forEach((/** @type {any} */ t) => {
      if (!t?.userSelection) return;
      const days = t.userSelection.noOfDays || "3";
      counts[`${days} Days`] = (counts[`${days} Days`] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const valA = parseInt(a.name) || 0;
        const valB = parseInt(b.name) || 0;
        return valA - valB;
      });
  }, [trips]);

  const totalTrips = trips.length;
  const topInterest = interestData[0]?.name || "N/A";
  const topBudget = budgetData[0]?.name || "N/A";

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
  }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#475569"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-[11px] font-bold tracking-tight"
      >
        {name === "No Data" ? name : `${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

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
              Compiling Insights
            </p>
            <p className="text-xs font-medium text-slate-400">
              Please wait a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-400 mx-auto">
      <style>{chartStyles}</style>

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Advanced Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time insights into user preferences and platform usage.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Total Trips Planned",
            value: totalTrips,
            icon: CalendarDays,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            title: "Most Popular Interest",
            value: topInterest,
            icon: Star,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            title: "Primary Budget Tier",
            value: topBudget,
            icon: Wallet,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5"
          >
            <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color}`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {kpi.title}
              </p>
              <h4 className="text-2xl font-black text-slate-900">
                {kpi.value}
              </h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Budget Distribution */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <PieIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
              Budget Preferences
            </h3>
          </div>
          <div className="h-75 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={
                    budgetData.length > 0
                      ? budgetData
                      : [{ name: "No Data", value: 1 }]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={6}
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={true}
                  stroke="none"
                >
                  {(budgetData.length > 0
                    ? budgetData
                    : [{ name: "No Data", value: 1 }]
                  ).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        budgetData.length > 0
                          ? COLORS[index % COLORS.length]
                          : "#f1f5f9"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperClassName="custom-tooltip"
                  cursor={{ fill: "transparent" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traveler Types */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
              Traveler Dynamics
            </h3>
          </div>
          <div className="h-75 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={
                    travelerData.length > 0
                      ? travelerData
                      : [{ name: "No Data", value: 1 }]
                  }
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={true}
                  stroke="none"
                >
                  {(travelerData.length > 0
                    ? travelerData
                    : [{ name: "No Data", value: 1 }]
                  ).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        travelerData.length > 0
                          ? COLORS[(index + 3) % COLORS.length]
                          : "#f1f5f9"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperClassName="custom-tooltip"
                  cursor={{ fill: "transparent" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interests Popularity (Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
              Top Interest Trends
            </h3>
          </div>
          <div className="h-87.5 w-full">
            <ResponsiveContainer>
              <BarChart
                data={interestData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: "#64748b" }}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  wrapperClassName="custom-tooltip"
                />
                <Bar
                  dataKey="value"
                  fill="url(#barColor)"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Duration Distribution (Area Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
              Trip Duration
            </h3>
          </div>
          <div className="h-75 w-full">
            <ResponsiveContainer>
              <AreaChart
                data={durationData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e2e8f0"
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
                  tick={{ fontSize: 12, fontWeight: 600, fill: "#64748b" }}
                  dx={-10}
                />
                <Tooltip wrapperClassName="custom-tooltip" />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#f43f5e" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
