import { useEffect, useState, useMemo } from "react";
import {
  subscribeToUsers,
  deleteUserAndData,
  getStoredAdminUser,
} from "../../services/adminApi";
import {
  Search,
  ArrowUpDown,
  Activity,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  X as CloseIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentAdmin = getStoredAdminUser();
  const itemsPerPage = 10;

  useEffect(() => {
    const unsub = subscribeToUsers(
      (data) => {
        setUsers(
          data.map((u) => ({
            ...u,
            displayName: u.name || "Unknown",
            displayEmail: u.email || "No Email",
            signupDate:
              u.createdAt?.toDate?.()?.toLocaleDateString?.() || "N/A",
            providerBadge: u.provider || "google",
          })),
        );
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === "permission-denied") {
          toast.error("Access Denied", {
            description:
              "You don't have permission to view the user directory. Please check your Firestore security rules.",
          });
        } else {
          toast.error("Database Error", {
            description:
              "Failed to sync user directory. Please try again later.",
          });
        }
      },
    );
    return () => unsub();
  }, []);

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await deleteUserAndData(deletingUser.id, deletingUser.email);
      toast.success(`User ${deletingUser.displayName} and associated trips deleted.`);
      setDeletingUser(null);
    } catch (err) {
      toast.error("Failed to delete user data.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    /** @type {any[]} */
    let sorted = [...users];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let valA =
          sortConfig.key === "createdAt"
            ? a.createdAt?.toMillis?.() || 0
            : a[sortConfig.key];
        let valB =
          sortConfig.key === "createdAt"
            ? b.createdAt?.toMillis?.() || 0
            : b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted.filter(
      (u) =>
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayEmail.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [users, sortConfig, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [filteredUsers, currentPage],
  );

  const requestSort = (key) =>
    setSortConfig((p) => ({
      key,
      direction: p.key === key && p.direction === "asc" ? "desc" : "asc",
    }));

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-slate-900 tracking-tight">
              Accessing Directory
            </p>
            <p className="text-xs font-medium text-slate-400">
              Verifying identities...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Directory</h1>
          <p className="text-sm text-slate-500">
            Identity and access management.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search identities..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th
                  className="px-6 py-3 font-semibold cursor-pointer"
                  onClick={() => requestSort("displayName")}
                >
                  <div className="flex items-center gap-2">
                    Identity <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 font-semibold">
                  Contact
                </th>
                <th className="px-6 py-3 font-semibold">
                  Provider
                </th>
                <th
                  className="px-6 py-3 font-semibold cursor-pointer"
                  onClick={() => requestSort("createdAt")}
                >
                  <div className="flex items-center gap-2">
                    Joined <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((user) => {
                const isSelf = user.id === currentAdmin?.uid;
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-3 flex items-center gap-3">
                      <img
                        src={
                          user.photoURL ||
                          user.picture ||
                          `https://api.dicebear.com/7.x/lorelei/svg?seed=${user.displayName}`
                        }
                        alt=""
                        className="w-8 h-8 rounded-full border border-slate-200 shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {user.displayName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {user.displayEmail}
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        {user.providerBadge}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {user.signupDate}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setDeletingUser(user)}
                        disabled={isSelf}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 disabled:opacity-20 disabled:pointer-events-none cursor-pointer inline-flex items-center justify-center"
                        title={isSelf ? "You cannot delete your own admin account" : "Delete User & Data"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No matching users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-white disabled:opacity-50 transition-colors hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-white disabled:opacity-50 transition-colors hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Delete User Account</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-4">
              <img
                src={
                  deletingUser.photoURL ||
                  deletingUser.picture ||
                  `https://api.dicebear.com/7.x/lorelei/svg?seed=${deletingUser.displayName}`
                }
                alt=""
                className="w-10 h-10 rounded-full border border-slate-200 object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {deletingUser.displayName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {deletingUser.displayEmail}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this user account? All trips created by this user will also be removed from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Delete User & Trips
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
