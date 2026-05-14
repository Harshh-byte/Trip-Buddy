import { useEffect, useState } from "react";
import { subscribeToAiLogs } from "../../services/adminApi";
import { Cpu, CheckCircle2, XCircle, Clock, Activity, Zap } from "lucide-react";

const AdminAiLogs = () => {
  /** @type {[any[], Function]} */
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // @ts-ignore
    const unsub = subscribeToAiLogs(function (data) {
      setLogs(data || []);
    });
    return () => unsub();
  }, []);

  /** @type {any[]} */
  const filteredLogs = logs.filter((log) => {
    if (filter === "success") return log.success;
    if (filter === "failure") return !log.success;
    return true;
  });

  return (
    <div className="space-y-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-3">
            <div className="p-3 bg-sky-500 rounded-[1.25rem] shadow-lg shadow-sky-500/20 text-white">
              <Zap className="w-6 h-6" />
            </div>
            AI Telemetry <span className="text-gradient">Logs</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Real-time monitoring of Gemini API performance and generation
            status.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 p-2 bg-white/60 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm">
          {["all", "success", "failure"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Feed */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="glass-card p-6 border border-white/80 rounded-4xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:shadow-indigo-600/5 hover:-translate-y-0.5 group"
          >
            {/* Left side: Context & Status */}
            <div className="flex items-start gap-5 min-w-0 flex-1">
              <div
                className={`p-3 rounded-[1.25rem] border-2 shrink-0 ${
                  log.success
                    ? "bg-emerald-50 border-white text-emerald-500"
                    : "bg-rose-50 border-white text-rose-500"
                }`}
              >
                {log.success ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-black text-[#1A1A1A] truncate">
                    {log.requestedLocation || "Dynamic Generation Payload"}
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-tighter">
                    <Clock className="w-3 h-3" />
                    {log.createdAt?.toDate?.()?.toLocaleTimeString?.() ||
                      "Recently"}
                  </div>
                </div>

                <div className="mt-3 bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 relative overflow-hidden group-hover:bg-white transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20" />
                  <p className="text-[11px] font-bold text-gray-500 leading-relaxed font-mono overflow-hidden wrap-break-word">
                    {log.prompt || "No prompt context available"}
                  </p>
                </div>

                {!log.success && log.errorMessage && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <Activity className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-rose-600">
                      SYSTEM ERROR: {log.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Metrics */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0 shrink-0 gap-2">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                Execution
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-black tracking-tight ${
                    (log.durationMs || 0) > 4000
                      ? "text-amber-500"
                      : "text-indigo-600"
                  }`}
                >
                  {log.durationMs || "---"}
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase">
                  ms
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="p-20 text-center glass-card border border-white/80 rounded-[2.5rem] shadow-xl">
            <Cpu className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <span className="text-sm font-black text-gray-300 uppercase tracking-widest">
              No telemetry packets found
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAiLogs;
