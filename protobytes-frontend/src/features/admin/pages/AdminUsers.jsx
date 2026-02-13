import { useEffect, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";

function badgeClass(kind) {
  if (kind === "approved" || kind === "enabled" || kind === "true") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (kind === "pending") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (kind === "rejected" || kind === "false") {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function AdminUsers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [emailVerified, setEmailVerified] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/users", {
        params: {
          q: q.trim(),
          role,
          emailVerified,
          limit: 100,
        },
      });
      setRows(res.data?.items || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sendReset = async (id) => {
    if (!confirm("Send password reset link to this user?")) return;
    try {
      setBusy(id);
      const res = await axiosClient.post(`/admin/users/${id}/send-reset`);
      alert(res.data?.message || "Reset link sent");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to send reset link");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="max-w-7xl mx-auto py-8 px-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users Management</h1>
        <p className="text-sm text-slate-600">
          View user status, 2FA state, and send support password reset links.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-3 grid md:grid-cols-5 gap-2">
        <input
          className="rounded-md border px-3 py-2 text-sm md:col-span-2"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search username, full name or email"
        />
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={emailVerified}
          onChange={(e) => setEmailVerified(e.target.value)}
        >
          <option value="">All email states</option>
          <option value="true">Email verified</option>
          <option value="false">Email not verified</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="rounded-md bg-slate-900 text-white text-sm px-3 py-2 hover:bg-black"
          disabled={loading}
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">KYC</th>
              <th className="px-3 py-2 text-left">2FA</th>
              <th className="px-3 py-2 text-left">Joined</th>
              <th className="px-3 py-2 text-left">Support</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u._id} className="border-t align-top">
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900">{u.fullName || u.username}</div>
                  <div className="text-xs text-slate-600">@{u.username}</div>
                </td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">
                  <div>{u.email}</div>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${badgeClass(
                      String(!!u.isEmailVerified)
                    )}`}
                  >
                    {u.isEmailVerified ? "Verified" : "Unverified"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${badgeClass(
                      u.kycStatus
                    )}`}
                  >
                    {u.kycStatus}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${badgeClass(
                      u.twoFactor?.enabled ? "enabled" : "disabled"
                    )}`}
                  >
                    {u.twoFactor?.enabled
                      ? `Enabled (${u.twoFactor?.method || "email"})`
                      : "Disabled"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => sendReset(u._id)}
                    disabled={busy === u._id}
                    className="rounded-md border border-rose-200 text-rose-700 px-2 py-1 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {busy === u._id ? "Sending..." : "Send Reset Link"}
                  </button>
                </td>
              </tr>
            ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
