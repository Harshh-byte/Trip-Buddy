import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useGoogleAuth } from "../../services/authApi";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { FaGoogle } from "react-icons/fa6";

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
            "Logged in with Google. Firebase sync is currently unavailable.",
        });
      }
    },
    onError: (error) => {
      const message =
        error?.message === "FIREBASE_AUTH_SYNC_FAILED"
          ? "Google login worked, but Firebase Auth sync failed. Enable Google provider in Firebase Auth."
          : "Login failed. Please try again.";

      toast.error("Unable to sign in", {
        description: message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-100 rounded-3xl p-8">
        <DialogHeader className="flex flex-col items-center">
          <DialogTitle className="mt-4 text-2xl font-bold">
            Let's Start with Trip Buddy
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500 mt-2">
            Continue with Google to start planning your trips.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-4">
          <Button
            variant="outline"
            onClick={() => handleLogin()}
            className="w-full rounded-xl py-6 flex gap-3 border-gray-200 hover:bg-gray-50 font-semibold text-base"
          >
            <FaGoogle className="text-red-900" /> Continue with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
