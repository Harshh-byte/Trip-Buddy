import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, User, LogOut, Map, Sparkles, Gem } from "lucide-react";
import { Button } from "../ui/button";
import LoginDialog from "./LoginDialog";
import PricingDialog from "./PricingDialog";
import { googleLogout } from "@react-oauth/google";
import { AUTH_USER_CHANGED_EVENT } from "../../lib/authEvents";
import { auth, db } from "../../services/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../@/components/ui/dropdown-menu";

const getStoredUser = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const Header = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const [isPremium, setIsPremium] = useState(false);
  const navigate = useNavigate();

  const hasPremiumAccess = (profile) =>
    profile?.isPremium === true || profile?.isAdmin === true;

  useEffect(() => {
    let unsubSnapshot = null;
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.uid) {
        unsubSnapshot = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              setIsPremium(hasPremiumAccess(docSnap.data()));
            } else {
              setIsPremium(false);
            }
          },
          (err) => {
            console.error("Header profile snapshot error:", err);
          }
        );
      } else {
        setIsPremium(false);
        if (unsubSnapshot) {
          unsubSnapshot();
          unsubSnapshot = null;
        }
      }
    });
    const handleStorageChange = () => {
      setUser(getStoredUser());
    };
    const handleOpenLoginDialog = () => setOpenDialog(true);

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(AUTH_USER_CHANGED_EVENT, handleStorageChange);
    window.addEventListener("open-login-dialog", handleOpenLoginDialog);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, handleStorageChange);
      window.removeEventListener("open-login-dialog", handleOpenLoginDialog);
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
    navigate("/");
    window.location.reload();
  };

  const refreshUser = () => {
    setUser(getStoredUser());
  };

  const handleCreateTripClick = () => {
    if (user) {
      navigate("/v2/create-trip");
      return;
    }

    setOpenDialog(true);
  };

  return (
    <header className="fixed top-10 inset-x-0 mx-auto w-[92%] max-w-5xl bg-white/10 backdrop-blur-3xl rounded-[2.5rem] px-8 py-4 z-50 shadow-2xl shadow-black/5 border border-slate-900/10">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Link
            to={"/"}
            className="flex items-center gap-x-2.5 cursor-pointer group select-none"
          >
            <div className="bg-indigo-600 p-2 rounded-sm group-hover:rotate-12 transition-all duration-500">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900 select-none">
              Trip{" "}<span className="text-indigo-600">Buddy</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="hidden sm:flex h-10 px-6 items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
            onClick={handleCreateTripClick}
          >
            <Sparkles className="w-4 h-4" />
            Plan Trip
          </Button>
 
          <div className="flex items-center">
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`relative size-11 shrink-0 rounded-2xl p-0 overflow-hidden border-2 ring-2 ring-transparent transition-all duration-300 shadow-md ${
                      isPremium
                        ? "border-amber-400 hover:ring-amber-100 data-[state=open]:ring-amber-200"
                        : "border-white hover:ring-indigo-100 data-[state=open]:ring-indigo-200"
                    }`}
                  >
                    <img
                      src={user?.picture}
                      alt={user?.name}
                      className="h-full w-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-64 rounded-[1.8rem] p-3 border border-slate-100 shadow-2xl bg-white animate-in fade-in zoom-in-95 duration-300"
                  align="end"
                  sideOffset={15}
                >
                  <DropdownMenuLabel className="font-normal mb-2" inset={false}>
                    <div className="flex flex-col space-y-1 p-2">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-black text-slate-900 leading-none">
                          {user?.name}
                        </p>
                        {isPremium && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-amber-600 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                            <Gem className="w-2.5 h-2.5 shrink-0" />
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-slate-100 mb-2" />

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => navigate("/v2/my-trips")}
                      className="cursor-pointer gap-3 py-3 rounded-xl font-bold text-slate-600 focus:bg-indigo-50 focus:text-indigo-600"
                      inset={false}
                    >
                      <Map className="w-4.5 h-4.5" />
                      <span>My Trips</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer gap-3 py-3 rounded-xl font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                      inset={false}
                    >
                      <LogOut className="w-4.5 h-4.5" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                className="h-10 px-6 rounded-2xl bg-slate-900 flex items-center gap-2 font-black shadow-lg text-white transition-all hover:scale-105 cursor-pointer"
                onClick={() => setOpenDialog(true)}
              >
                <User className="w-4 h-4" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      <LoginDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onLoginSuccess={refreshUser}
      />
      <PricingDialog />
    </header>
  );
};

export default Header;
