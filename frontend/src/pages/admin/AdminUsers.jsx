import { useEffect, useState, useMemo } from "react";
import {
  subscribeToUsers,
  toggleUserAdminStatus,
} from "../../services/adminApi";
import {
  Search,
  ArrowUpDown,
  Shield,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const unsub = subscribeToUsers(
      // @ts-ignore
      (data) => {
        setUsers(
          // @ts-ignore
          data.map((u) => ({
            ...u,
            displayName: u.name || "Unknown",
            displayEmail: u.email || "No Email",
            signupDate:
              u.createdAt?.toDate?.()?.toLocaleDateString?.() || "N/A",
            providerBadge: u.provider || "google",
          })),
        );
      },
      // @ts-ignore
      (err) => {
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

  // @ts-ignore
  const handleToggleAdmin = async (user) => {
    try {
      await toggleUserAdminStatus(user.id, user.isAdmin);
      toast.success(`Access updated for ${user.displayName}`);
    } catch (err) {
      toast.error("Update failed.");
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

  // @ts-ignore
  const requestSort = (key) =>
    setSortConfig((p) => ({
      key,
      direction: p.key === key && p.direction === "asc" ? "desc" : "asc",
    }));

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
                <th className="px-6 py-3 font-semibold hidden md:table-cell">
                  Contact
                </th>
                <th className="px-6 py-3 font-semibold hidden lg:table-cell">
                  Provider
                </th>
                <th
                  className="px-6 py-3 font-semibold cursor-pointer hidden sm:table-cell"
                  onClick={() => requestSort("createdAt")}
                >
                  <div className="flex items-center gap-2">
                    Joined <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 font-semibold text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-3 flex items-center gap-3">
                    <img
                      src={
                        user.photoURL ||
                        user.picture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`
                      }
                      alt=""
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {user.displayName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                        {user.id.slice(0, 10)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600 hidden md:table-cell">
                    {user.displayEmail}
                  </td>
                  <td className="px-6 py-3 hidden lg:table-cell">
                    <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      {user.providerBadge}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 hidden sm:table-cell">
                    {user.signupDate}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleToggleAdmin(user)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${user.isAdmin ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-900 hover:text-white"}`}
                    >
                      {user.isAdmin ? (
                        <>
                          <ShieldOff className="w-3 h-3" /> Admin
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3" /> User
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
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

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-white disabled:opacity-50 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-white disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
