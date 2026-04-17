import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useGoogleAuth } from "../../services/authApi";
import { toast } from "sonner";
import { Compass } from "lucide-react";

/**
 * @param {{
 *  open: boolean,
 *  onClose: () => void,
 *  onLoginSuccess?: () => void
 * }} props
 */
const LoginDialog = ({ open, onClose, onLoginSuccess = () => {} }) => {
  const handleLogin = useGoogleAuth({
    onSuccess: (userData) => {
      onClose();
      onLoginSuccess();
      if (userData?.firebaseSynced) {
        toast.success(`Welcome back, ${userData.name}!`, {
          description: "Successfully logged in.",
        });
      } else {
        toast.success(`Welcome back, ${userData.name}!`, {
          description:
            "Logged in successfully. Cloud sync is currently unavailable.",
        });
      }
    },
    onError: (error) => {
      const authError = /** @type {{ message?: string }} */ (error);
      const message =
        authError?.message === "FIREBASE_AUTH_SYNC_FAILED"
          ? "Authentication successful, but we couldn't route your profile. Please try again later."
          : "Login failed. Please try again.";

      toast.error("Unable to sign in", {
        description: message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-100 rounded-4xl p-0 overflow-hidden bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50">
        <div className="p-8 pb-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-[14px] flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
            <Compass className="w-6 h-6 text-indigo-600" />
          </div>

          <DialogHeader className="flex flex-col items-center w-full">
            <DialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">
              Let's Start with Trip Buddy
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-zinc-500 mt-2 font-medium">
              Continue with Google to start planning your trips.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full mt-8">
            <button
              onClick={() => handleLogin()}
              className="flex items-center justify-center w-full h-13 bg-white border border-zinc-200 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-200 transition-all duration-300 group focus:outline-none shadow-sm hover:shadow-md hover:shadow-indigo-100/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-4.5 h-4.5 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#ea4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285f4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#fbbc05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34a853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>
                <span className="font-bold text-[15px] text-slate-700 group-hover:text-indigo-900 transition-colors tracking-tight">
                  Continue with Google
                </span>
              </div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
