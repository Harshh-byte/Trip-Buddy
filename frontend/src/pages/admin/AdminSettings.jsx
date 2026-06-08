import { useState } from "react";
import {
  getStoredAdminUser,
  updateAdminName,
  updateAdminPicture,
  updateAdminAvatarSettings,
} from "../../services/adminApi";
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  RefreshCw,
  Edit3,
  Check,
  X as CloseIcon,
  Pin,
} from "lucide-react";
import { toast } from "sonner";

const AdminSettings = () => {
  const [adminUser, setAdminUser] = useState(getStoredAdminUser());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(adminUser?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const [isPinning, setIsPinning] = useState(false);

  const handleRandomAvatar = async () => {
    setIsRefreshing(true);
    const randomSeed = Math.random().toString(36).substring(7);
    const newUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${randomSeed}`;

    try {
      await updateAdminPicture(adminUser.uid, newUrl);
      setAdminUser(getStoredAdminUser());
      toast.success("Avatar refreshed & pinned!");
    } catch (err) {
      toast.error("Failed to refresh avatar");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleFixedAvatar = async () => {
    if (isPinning) return;
    setIsPinning(true);
    const newStatus = !adminUser?.isAvatarFixed;
    try {
      await updateAdminAvatarSettings(adminUser.uid, newStatus);
      setAdminUser(getStoredAdminUser());
      toast.success(newStatus ? "Avatar pinned (fixed)" : "Avatar will rotate on next login");
    } catch (err) {
      toast.error("Failed to update avatar settings");
    } finally {
      setIsPinning(false);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName === adminUser.name) {
      setIsEditingName(false);
      return;
    }
    setIsSaving(true);
    try {
      await updateAdminName(adminUser.uid, newName.trim());
      setAdminUser(getStoredAdminUser());
      setIsEditingName(false);
      toast.success("Name updated");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-sm text-slate-500">
          Customize your administrative identity and profile.
        </p>
      </div>

      <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-8 bg-slate-50/30">
          <div
            className="relative group cursor-pointer"
            onClick={handleRandomAvatar}
          >
            <img
              src={
                adminUser?.photoURL ||
                adminUser?.picture ||
                `https://api.dicebear.com/7.x/lorelei/svg?seed=${adminUser?.name || "admin"}`
              }
              alt="Profile"
              className={`w-32 h-32 rounded-3xl border-4 border-white object-cover shadow-xl transition-all duration-500 ${isRefreshing ? "opacity-50 scale-95 blur-[2px]" : "group-hover:scale-105"}`}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
              <div className="bg-white/90 p-2 rounded-xl shadow-lg">
                <RefreshCw
                  className={`w-5 h-5 text-indigo-600 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-3 group/name">
              {isEditingName ? (
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-indigo-100 shadow-sm">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-transparent px-2 py-1 font-bold text-xl text-slate-900 outline-none w-full max-w-50px"
                    autoFocus
                    // @ts-ignore
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  {/* @ts-ignore */}
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {adminUser?.name}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-slate-400 opacity-0 group-hover/name:opacity-100 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <p className="text-slate-500 font-medium">{adminUser?.email}</p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-indigo-200">
                <Shield className="w-3.5 h-3.5" /> Administrator
              </div>
              <button
                onClick={handleToggleFixedAvatar}
                disabled={isPinning}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                  adminUser?.isAvatarFixed
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
                title={adminUser?.isAvatarFixed ? "Avatar is pinned and will not change" : "Avatar is automatic and rotates on login"}
              >
                {adminUser?.isAvatarFixed ? (
                  <>
                    <Pin className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Fixed Avatar
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Auto-Rotating
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
              Verified Details
            </h3>

            <div className="grid grid-cols-1 gap-8">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-md hover:shadow-indigo-50/50 group">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Full Name
                  </label>
                  <p className="text-sm font-bold text-slate-700">
                    {adminUser?.name}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-md hover:shadow-indigo-50/50 group">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Email Address
                  </label>
                  <p className="text-sm font-bold text-slate-700">
                    {adminUser?.email}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
