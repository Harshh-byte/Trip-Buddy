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
      <DialogContent className="sm:max-w-105 rounded-[2.5rem] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.18)] animate-in fade-in zoom-in-95 duration-300">
        <div className="relative p-8 flex flex-col items-center">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-14 h-14 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-indigo-100 group transition-transform hover:scale-105 duration-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-indigo-600"
            >
              <path
                d="M2 11.5H1.5H2ZM15.8737 13.8322C16.0572 13.6258 16.0386 13.3098 15.8322 13.1263C15.6258 12.9428 15.3098 12.9614 15.1263 13.1678L15.8737 13.8322ZM11.5 18L11.8536 18.3535L11.8639 18.3431L11.8737 18.3322L11.5 18ZM10.382 18.5528V19.0528H10.4033L10.4245 19.0509L10.382 18.5528ZM11.3938 13.7812C11.5491 13.5529 11.49 13.2419 11.2616 13.0866C11.0333 12.9313 10.7223 12.9905 10.567 13.2188L11.3938 13.7812ZM11.2995 6.41181L10.8951 6.70589V6.70589L11.2995 6.41181ZM8.80665 7.47883L9.24559 7.2394L8.80665 7.47883ZM4.87907 7.61492L4.41762 7.80745L4.87907 7.61492ZM5.2119 14.7848L5.0262 15.249L5.2119 14.7848ZM8.51673 17.1219L8.10331 16.8407L8.51673 17.1219ZM8.40385 17.3707L8.89522 17.4632L8.40385 17.3707ZM21.2764 14.0528L20.8292 14.2764L21.2764 14.0528ZM20.1056 12.8292L20.8292 14.2764L21.7236 13.8292L21 12.3819L20.1056 12.8292ZM5.3976 14.3205L2.8143 13.2872L2.44291 14.2157L5.0262 15.249L5.3976 14.3205ZM2.5 12.8229V11.5H1.5V12.8229H2.5ZM2.5 11.5V7.99998H1.5V11.5H2.5ZM3 7.49998H3.95617V6.49998H3V7.49998ZM4.41762 7.80745L5.78198 11.0776L6.70488 10.6925L5.34052 7.4224L4.41762 7.80745ZM7.16632 12H18.7639V11H7.16632V12ZM15.1263 13.1678L11.1263 17.6678L11.8737 18.3322L15.8737 13.8322L15.1263 13.1678ZM10.382 18.0528H9.38743V19.0528H10.382V18.0528ZM8.93015 17.4031L11.3938 13.7812L10.567 13.2188L8.10331 16.8407L8.93015 17.4031ZM9.38743 18.0528C9.07074 18.0528 8.83871 17.7634 8.89522 17.4632L7.91249 17.2782C7.7421 18.1831 8.43325 19.0528 9.38743 19.0528V18.0528ZM11.1464 17.6464C10.8691 17.9237 10.8114 17.9723 10.7636 17.9959C10.7279 18.0135 10.6849 18.0251 10.3394 18.0546L10.4245 19.0509C10.6971 19.0277 10.9631 19.0128 11.2069 18.8923C11.4386 18.7777 11.6309 18.5762 11.8536 18.3535L11.1464 17.6464ZM20.382 15H13.5V16H20.382V15ZM9.61997 15H8.92585V16H9.61997V15ZM15.4044 11.2059L11.7039 6.11772L10.8951 6.70589L14.5956 11.7941L15.4044 11.2059ZM10.4908 5.49998H9.68454V6.49998H10.4908V5.49998ZM8.3677 7.71826L10.5611 11.7394L11.4389 11.2606L9.24559 7.2394L8.3677 7.71826ZM9.68454 5.49998C8.54595 5.49998 7.82248 6.71869 8.3677 7.71826L9.24559 7.2394C9.06386 6.90622 9.30501 6.49998 9.68454 6.49998V5.49998ZM11.7039 6.11772C11.4216 5.7296 10.9707 5.49998 10.4908 5.49998V6.49998C10.6507 6.49998 10.8011 6.57652 10.8951 6.70589L11.7039 6.11772ZM5.78198 11.0776C6.01505 11.6362 6.56103 12 7.16632 12V11C6.96456 11 6.78257 10.8787 6.70488 10.6925L5.78198 11.0776ZM3.95617 7.49998C4.15794 7.49998 4.33993 7.62124 4.41762 7.80745L5.34052 7.4224C5.10745 6.86378 4.56147 6.49998 3.95617 6.49998V7.49998ZM2.8143 13.2872C2.62447 13.2113 2.5 13.0274 2.5 12.8229H1.5C1.5 13.4363 1.87342 13.9879 2.44291 14.2157L2.8143 13.2872ZM5.0262 15.249C6.26648 15.7451 7.59003 16 8.92585 16V15C7.71725 15 6.51975 14.7694 5.3976 14.3205L5.0262 15.249ZM8.10331 16.8407C8.03475 16.9415 7.94787 17.0903 7.91249 17.2782L8.89522 17.4632C8.8943 17.4681 8.89394 17.4659 8.89909 17.4551C8.90444 17.4438 8.91383 17.4271 8.93015 17.4031L8.10331 16.8407ZM20.8292 14.2764C20.9954 14.6088 20.7537 15 20.382 15V16C21.497 16 22.2223 14.8265 21.7236 13.8292L20.8292 14.2764ZM2.5 7.99998C2.5 7.72383 2.72386 7.49998 3 7.49998V6.49998C2.17157 6.49998 1.5 7.17155 1.5 7.99998H2.5ZM21 12.3819C20.5765 11.535 19.7109 11 18.7639 11V12C19.3321 12 19.8515 12.321 20.1056 12.8292L21 12.3819Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>

          <DialogHeader className="flex flex-col items-center w-full mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-center">
              {isSignup ? "Create an Account" : "Welcome Back"}
            </DialogTitle>
            <DialogDescription className="text-center text-xs font-semibold text-slate-500 mt-1 max-w-70">
              {isSignup
                ? "Join Trip Buddy to start planning your perfect trips."
                : "Sign in to access your saved itineraries and AI assistant."}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-4 relative z-10">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                googleAuth();
              }}
              disabled={loading}
              className="flex items-center justify-center w-full h-12 bg-white border border-slate-200/90 rounded-2xl hover:bg-slate-50/80 hover:border-indigo-300/80 transition-all duration-300 group shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
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
                <span className="font-bold text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  Continue with Google
                </span>
              </div>
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-200/60" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Or email
              </span>
              <div className="h-px flex-1 bg-slate-200/60" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignup && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    autoComplete="name"
                    required={isSignup}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
              )}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
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
                className="w-full h-12 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mt-2"
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

            <p className="text-center text-xs text-slate-500 font-semibold pt-2">
              {isSignup ? "Already have an account?" : "New to Trip Buddy?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline cursor-pointer transition-colors ml-1"
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
