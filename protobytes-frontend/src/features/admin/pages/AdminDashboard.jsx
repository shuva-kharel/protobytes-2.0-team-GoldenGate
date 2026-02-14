import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProtectedRoute from "../../../components/common/ProtectedRoute";
import { axiosClient } from "../../../api/axiosClient";
import {
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

function statusBadge(status) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [kycRows, setKycRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [productRows, setProductRows] = useState([]);

  const adminActions = useMemo(
    () => [
      {
        title: "KYC Queue",
        description: "Open full KYC moderation table",
        color: "from-rose-500 to-rose-600",
        icon: <ClipboardDocumentCheckIcon className="h-6 w-6" />,
        path: "/admin/kyc",
      },
      {
        title: "Users",
        description: "Review user accounts and trust state",
        color: "from-emerald-500 to-emerald-600",
        icon: <UserGroupIcon className="h-6 w-6" />,
        path: "/admin/users",
      },
      {
        title: "Reports",
        description: "Platform signals and moderation insights",
        color: "from-yellow-500 to-yellow-600",
        icon: <ChartBarIcon className="h-6 w-6" />,
        path: "/admin/reports",
      },
      {
        title: "Settings",
        description: "Admin-level platform settings",
        color: "from-indigo-500 to-indigo-600",
        icon: <Cog6ToothIcon className="h-6 w-6" />,
        path: "/admin/settings",
      },
    ],
    []
  );

  const loadWithProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, kycRes, productRes] = await Promise.all([
        axiosClient.get("/admin/stats"),
        axiosClient.get("/admin/kyc?status=pending"),
        axiosClient.get("/admin/products?status=pending_approval"),
      ]);
      setStats(statsRes.data || null);
      setKycRows((kycRes.data?.data || []).slice(0, 6));
      setProductRows((productRes.data?.items || []).slice(0, 6));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithProducts();
  }, []);

  const approve = async (id) => {
    setBusy(`approve:${id}`);
    try {
      await axiosClient.patch(`/admin/kyc/${id}/approve`);
      await loadWithProducts();
    } catch (e) {
      alert(e?.response?.data?.message || "Approve failed");
    } finally {
      setBusy("");
    }
  };

  const reject = async (id) => {
    const reason = prompt("Rejection reason (optional):") || "";
    setBusy(`reject:${id}`);
    try {
      await axiosClient.patch(`/admin/kyc/${id}/reject`, { reason });
      await loadWithProducts();
    } catch (e) {
      alert(e?.response?.data?.message || "Reject failed");
    } finally {
      setBusy("");
    }
  };

  const approveProduct = async (id) => {
    setBusy(`approve-product:${id}`);
    try {
      await axiosClient.patch(`/admin/products/${id}/approve`);
      await loadWithProducts();
    } catch (e) {
      alert(e?.response?.data?.message || "Approve failed");
    } finally {
      setBusy("");
    }
  };

  const rejectProduct = async (id) => {
    const reason = prompt("Rejection reason (optional):") || "";
    setBusy(`reject-product:${id}`);
    try {
      await axiosClient.patch(`/admin/products/${id}/reject`, { reason });
      await loadWithProducts();
    } catch (e) {
      alert(e?.response?.data?.message || "Reject failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
        <section className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="h-14 w-auto" />
                <h1 className="text-3xl font-extrabold font-display brand-gradient tracking-wide">
                  Admin Control Center
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Moderate KYC, monitor trust metrics, and keep platform quality high.
              </p>
            </div>
            <button
              onClick={loadWithProducts}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Total users</p>
            <p className="text-2xl font-bold mt-1">{stats?.totalUsers ?? "-"}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Email verified</p>
            <p className="text-2xl font-bold mt-1">{stats?.verifiedUsers ?? "-"}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Pending KYC</p>
            <p className="text-2xl font-bold mt-1 text-amber-700">{stats?.pendingKyc ?? "-"}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Approved (24h)</p>
            <p className="text-2xl font-bold mt-1 text-emerald-700">{stats?.approvedToday ?? "-"}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Rejected (24h)</p>
            <p className="text-2xl font-bold mt-1 text-rose-700">{stats?.rejectedToday ?? "-"}</p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {adminActions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className="text-left rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} text-white`}
              >
                {action.icon}
              </span>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{action.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{action.description}</p>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending KYC (Quick Review)</h2>
            <Link to="/admin/kyc" className="text-sm text-rose-700 hover:underline">
              Open full queue
            </Link>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Loading queue…</div>
          ) : kycRows.length === 0 ? (
            <div className="text-sm text-slate-500">No pending KYC right now.</div>
          ) : (
            <div className="space-y-3">
              {kycRows.map((r) => (
                <div key={r._id} className="rounded-xl border border-rose-100 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{r.user?.username || "Unknown user"}</p>
                      <p className="text-xs text-slate-600">{r.user?.email || "-"}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                      </p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a href={r.governmentIdImage?.url || "#"} target="_blank" rel="noreferrer" className="block">
                        {r.governmentIdImage?.url ? (
                          <img
                            src={r.governmentIdImage.url}
                            alt="Government ID"
                            className="h-24 w-32 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="h-24 w-32 rounded-lg border bg-slate-50 flex items-center justify-center text-xs text-slate-500">
                            No ID image
                          </div>
                        )}
                      </a>
                      <a href={r.selfieImage?.url || "#"} target="_blank" rel="noreferrer" className="block">
                        {r.selfieImage?.url ? (
                          <img
                            src={r.selfieImage.url}
                            alt="Selfie"
                            className="h-24 w-32 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="h-24 w-32 rounded-lg border bg-slate-50 flex items-center justify-center text-xs text-slate-500">
                            No selfie image
                          </div>
                        )}
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => approve(r._id)}
                      disabled={busy === `approve:${r._id}` || busy === `reject:${r._id}`}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm disabled:opacity-60"
                    >
                      {busy === `approve:${r._id}` ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => reject(r._id)}
                      disabled={busy === `approve:${r._id}` || busy === `reject:${r._id}`}
                      className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-sm disabled:opacity-60"
                    >
                      {busy === `reject:${r._id}` ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending Products (Quick Review)</h2>
            <span className="text-sm text-slate-500">{productRows.length} queued</span>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Loading products...</div>
          ) : productRows.length === 0 ? (
            <div className="text-sm text-slate-500">No pending products right now.</div>
          ) : (
            <div className="space-y-3">
              {productRows.map((p) => (
                <div key={p._id} className="rounded-xl border border-rose-100 p-3">
                  <div className="flex flex-wrap items-start gap-3 justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-600">
                        {p.category} · {p.location} · Rs {Number(p.borrowPrice || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        by @{p.uploadedBy?.username || "user"}
                      </p>
                      {p.description && (
                        <p className="mt-2 text-sm text-slate-700 line-clamp-3">{p.description}</p>
                      )}
                    </div>
                    {p.image?.url ? (
                      <a href={p.image.url} target="_blank" rel="noreferrer">
                        <img
                          src={p.image.url}
                          alt={p.name}
                          className="h-24 w-32 rounded-lg border object-cover"
                        />
                      </a>
                    ) : (
                      <div className="h-24 w-32 rounded-lg border bg-slate-50 flex items-center justify-center text-xs text-slate-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => approveProduct(p._id)}
                      disabled={busy === `approve-product:${p._id}` || busy === `reject-product:${p._id}`}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm disabled:opacity-60"
                    >
                      {busy === `approve-product:${p._id}` ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => rejectProduct(p._id)}
                      disabled={busy === `approve-product:${p._id}` || busy === `reject-product:${p._id}`}
                      className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-sm disabled:opacity-60"
                    >
                      {busy === `reject-product:${p._id}` ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ProtectedRoute>
  );
}
