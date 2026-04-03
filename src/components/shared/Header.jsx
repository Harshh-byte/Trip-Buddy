import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, User, LogOut, Map, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import LoginDialog from "./LoginDialog";
import { googleLogout } from "@react-oauth/google";
import { AUTH_USER_CHANGED_EVENT } from "../../lib/authEvents";
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
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(AUTH_USER_CHANGED_EVENT, handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
    navigate("/");
  };

  const refreshUser = () => {
    setUser(getStoredUser());
  };

  const handleCreateTripClick = () => {
    if (user) {
      navigate("/create-trip");
      return;
    }

    setOpenDialog(true);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 w-full z-50">
      {/* Logo */}
      <Link to={"/"} className="flex items-center gap-x-2 cursor-pointer group">
        <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
          <Plane className="w-6 h-6 text-white" />
        </div>
        <span className="hidden sm:flex font-bold text-xl tracking-tight">
          Trip Buddy
        </span>
      </Link>

      {/* Navigation & Actions */}
      <div className="flex items-center gap-x-3 sm:gap-x-6">
        <Button
          variant="outline"
          className="hidden sm:flex items-center gap-2 rounded-full border-gray-200 hover:bg-gray-50"
          onClick={handleCreateTripClick}
        >
          <Sparkles className="w-4 h-4" />
          Create Trip
        </Button>

        <div className="flex items-center">
          {user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative size-10 shrink-0 rounded-full p-0 overflow-hidden border border-gray-100 ring-2 ring-transparent hover:ring-indigo-100 data-[state=open]:ring-indigo-200 transition-[border-color,box-shadow] duration-200"
                >
                  <img
                    src={user?.picture}
                    alt={user?.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-56 mt-2 rounded-xl p-2"
                align="end"
              >
                <DropdownMenuLabel className="font-normal" inset={false}>
                  <div className="flex flex-col space-y-1 p-1">
                    <p className="text-sm font-semibold leading-none">
                      {user?.name}
                    </p>
                    <p className="text-xs leading-none text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => navigate("/my-trips")}
                    className="cursor-pointer gap-2 py-2 rounded-lg"
                    inset={false}
                  >
                    <Map className="w-4 h-4 text-indigo-600" />
                    <span>My Trips</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer gap-2 py-2 rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700"
                    inset={false}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              className="px-6 rounded-full bg-indigo-600 hover:bg-indigo-700 flex gap-2 font-semibold shadow-md shadow-indigo-100"
              onClick={() => setOpenDialog(true)}
            >
              <User className="w-4 h-4" />
              Login
            </Button>
          )}
        </div>
      </div>

      <LoginDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onLoginSuccess={refreshUser}
      />
    </header>
  );
};

export default Header;
