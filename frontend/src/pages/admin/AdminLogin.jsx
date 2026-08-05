import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  KeyRound,
  Mail,
  Lock,
  User,
  Loader2,
  ArrowRight,
  ArrowLeft,
  DatabaseZap,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginAdmin, seedAdminUser } from "../../services/adminApi";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import SEO from "../../components/shared/SEO";

const AdminLogin = () => {
  const [isSeederMode, setIsSeederMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const navigate = useNavigate();

  // @ts-ignore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Credentials required.");
    setLoading(true);
    try {
      if (isSeederMode) {
        if (!secretKey) throw new Error("Master secret key required.");
        await seedAdminUser(email, password, secretKey, name);
        toast.success("Root user deployed.");
      } else {
        await loginAdmin(email, password);
        toast.success("Session authenticated.");
      }
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-slate-900 relative overflow-hidden admin-scope">
      <SEO
        title="Auth Portal"
        description="Secure gateway for system administration."
      />

      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-300/20 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-160 h-160 bg-rose-300/20 rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-lg ${
              isSeederMode
                ? "bg-linear-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-200"
                : "bg-indigo-50 border border-indigo-100 shadow-indigo-100/50"
            }`}
          >
            {isSeederMode ? (
              <DatabaseZap className="w-9 h-9 text-white" />
            ) : (
              <img
                src="/favicon.svg"
                alt="Trip Buddy Admin"
                className="w-10 h-10 object-contain"
              />
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {isSeederMode ? "System Initialization" : "Admin Core"}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            {isSeederMode
              ? "Configure immutable root access for deployment."
              : "Enter authorized credentials to access the console."}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-4xl p-8 md:p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seeder Mode Fields */}
            {isSeederMode && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Display Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="System Admin"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                    Master Secret <Lock className="w-3 h-3" />
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 group-focus-within:text-rose-600 transition-colors" />
                    <input
                      type={showSecretKey ? "text" : "password"}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 bg-rose-50/50 border border-rose-100 rounded-xl text-sm font-medium text-slate-900 placeholder:text-rose-300 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600 transition-colors focus:outline-none"
                    >
                      {showSecretKey ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="h-px w-full bg-linear-to-r from-transparent via-slate-200 to-transparent my-2" />
              </div>
            )}

            {/* Standard Login Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Secure Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tripbuddy.io"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full py-6 mt-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isSeederMode
                  ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSeederMode
                    ? "Deploy Root Authorization"
                    : "Authenticate Session"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer Toggle */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSeederMode(!isSeederMode)}
            className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2 w-full uppercase tracking-widest group"
          >
            {isSeederMode ? (
              <>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                Abort Initialization
              </>
            ) : (
              <>
                <DatabaseZap className="w-3.5 h-3.5" />
                Root Setup Mode
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
