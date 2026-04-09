import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useGoogleAuth } from "../../services/authApi";
import { toast } from "sonner";
import { FaGoogle } from "react-icons/fa6";
import { Compass } from "lucide-react";

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
      const message =
        error?.message === "FIREBASE_AUTH_SYNC_FAILED"
          ? "Authentication successful, but we couldn't route your profile. Please try again later."
          : "Login failed. Please try again.";

      toast.error("Unable to sign in", {
        description: message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-[1.25rem] p-0 overflow-hidden bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50">
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
              className="flex items-center justify-center w-full h-[3.25rem] bg-white border border-zinc-200 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-200 transition-all duration-300 group focus:outline-none shadow-sm hover:shadow-md hover:shadow-indigo-100/50"
            >
              <div className="flex items-center gap-3">
                <FaGoogle className="text-red-500 text-[17px] group-hover:scale-110 transition-transform duration-300" />
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
