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
      toast.error(
        err instanceof Error ? err.message : "Authentication denied.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-slate-900">
      <SEO
        title="Auth Portal"
        description="Secure gateway for system administration."
      />

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-4 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isSeederMode ? "System Initialization" : "Admin Core"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isSeederMode
              ? "Configure immutable root access."
              : "Enter credentials to access the console."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSeederMode && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="System Admin"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                    Master Secret
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tripbuddy.io"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isSeederMode ? "Deploy Root" : "Authenticate"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSeederMode(!isSeederMode)}
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-full"
          >
            {isSeederMode ? (
              <>
                <ArrowLeft className="w-3 h-3" />
                Exit Setup
              </>
            ) : (
              "Root Access"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
