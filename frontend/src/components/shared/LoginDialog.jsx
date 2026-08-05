import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useGoogleAuth, useEmailAuth } from "../../services/authApi";
import { toast } from "sonner";
import {
  Compass,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

/**
 * @param {{
 *  open: boolean,
 *  onClose: () => void,
 *  onLoginSuccess?: () => void
 * }} props
 */
const LoginDialog = ({ open, onClose, onLoginSuccess = () => {} }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /**
   * @param {any} userData
   */
  // @ts-ignore
  const handleAuthSuccess = (userData) => {
    setLoading(false);
    onClose();
    onLoginSuccess();
    toast.success(`Welcome back, ${userData.name}!`, {
      description: "Successfully logged in.",
    });
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  /**
   * @param {any} error
   */
  // @ts-ignore
  const handleAuthError = (error) => {
    setLoading(false);
    const authError = /** @type {{ code?: string, message?: string }} */ (
      error
    );
    let message = "Login failed. Please try again.";

    if (authError.code === "auth/user-not-found")
      message = "No account found with this email.";
    if (authError.code === "auth/wrong-password")
      message = "Incorrect password.";
    if (authError.code === "auth/email-already-in-use")
      message = "Email already registered.";
    if (authError.code === "auth/weak-password")
      message = "Password should be at least 6 characters.";

    toast.error("Login Error", { description: message });
  };

  const googleAuth = useGoogleAuth({
    onSuccess: handleAuthSuccess,
    onError: handleAuthError,
  });

  const emailAuth = useEmailAuth({
    onSuccess: handleAuthSuccess,
    onError: handleAuthError,
  });

  /**
   * @param {any} e
   */
  // @ts-ignore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignup && !name)) {
      toast.error("Missing fields", {
        description: "Please fill in all details.",
      });
      return;
    }
    setLoading(true);
    if (isSignup) {
      await emailAuth.signup(email, password, name);
    } else {
      await emailAuth.login(email, password);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden bg-white border border-slate-900/10 shadow-2xl">
        <div className="p-8 flex flex-col items-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 shadow-xs border border-indigo-100">
            <img
              src="/favicon.svg"
              alt="Trip Buddy"
              className="w-9 h-9 object-contain"
            />
          </div>

          <DialogHeader className="flex flex-col items-center w-full mb-8">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {isSignup ? "Create an account" : "Welcome back"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-slate-500 font-medium mt-1">
              {isSignup
                ? "Join Trip Buddy to start planning your journeys."
                : "Sign in to continue your adventure."}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-4">
            <button
              onClick={() => {
                setLoading(true);
                googleAuth();
              }}
              disabled={loading}
              className="flex items-center justify-center w-full h-12 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-indigo-200 transition-all duration-300 group shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#ea4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285f4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34a853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span className="font-bold text-sm text-slate-700">
                  Continue with Google
                </span>
              </div>
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Or email
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignup && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  />
                </div>
              )}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isSignup ? "Create Account" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 font-medium">
              {isSignup ? "Already have an account?" : "New to Trip Buddy?"}{" "}
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="text-indigo-600 font-bold hover:underline"
              >
                {isSignup ? "Sign In" : "Create Account"}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
