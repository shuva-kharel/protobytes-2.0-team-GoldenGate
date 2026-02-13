import { useEffect, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";

function Stat({ label, value, tone = "slate" }) {
  const toneMap = {
    slate: "text-slate-900",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    rose: "text-rose-700",
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneMap[tone] || toneMap.slate}`}>
        {value ?? "-"}
      </p>
    </div>
  );
}

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/reports");
      setData(res.data || null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="max-w-7xl mx-auto py-8 px-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Reports</h1>
          <p className="text-sm text-slate-600">Operational snapshot of the platform.</p>
        </div>
        <button
          onClick={load}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Users" value={data?.totalUsers} />
        <Stat label="2FA Enabled Users" value={data?.active2FAUsers} tone="emerald" />
        <Stat label="Pending KYC" value={data?.pendingKyc} tone="amber" />
        <Stat label="Pending Products" value={data?.pendingProducts} tone="amber" />
        <Stat label="Open Product Requests" value={data?.openRequests} />
        <Stat label="Pending Borrow Requests" value={data?.borrowPending} />
        <Stat label="Active Sessions" value={data?.activeSessions} tone="emerald" />
        <Stat label="New Users (24h)" value={data?.newUsers24h} tone="rose" />
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
        Last generated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "-"}
      </div>
    </section>
  );
}
