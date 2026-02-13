import { useEffect, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/settings");
      setSettings(res.data || null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load admin settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="max-w-5xl mx-auto py-8 px-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
          <p className="text-sm text-slate-600">
            Platform configuration summary for support and moderation.
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <dl className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">App Name</dt>
            <dd className="font-medium text-slate-900">{settings?.appName || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Client Origin</dt>
            <dd className="font-medium text-slate-900 break-all">{settings?.clientOrigin || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Cookie Secure</dt>
            <dd className="font-medium text-slate-900">{String(!!settings?.cookieSecure)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Mail From</dt>
            <dd className="font-medium text-slate-900 break-all">{settings?.mailFrom || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Product Approval Required</dt>
            <dd className="font-medium text-slate-900">
              {settings?.moderation?.productApprovalRequired ? "Yes" : "No"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        These are read-only diagnostics for now. If you want runtime-editable admin settings,
        I can add persisted platform config with secure update endpoints.
      </div>
    </section>
  );
}
