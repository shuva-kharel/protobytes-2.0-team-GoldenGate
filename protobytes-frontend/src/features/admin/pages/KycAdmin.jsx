import { useEffect, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";

export default function KycAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(""); // "", "pending", "approved", "rejected"
  const [category, setCategory] = useState(""); // "", "individual", "business"
  const [actionBusy, setActionBusy] = useState(null); // id-in-action

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (category) params.set("category", category);

      const res = await axiosClient.get(`/admin/kyc?${params.toString()}`);
      setRows(res.data?.data || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load KYC list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category]);

  const approve = async (id) => {
    setActionBusy(id);
    try {
      await axiosClient.patch(`/admin/kyc/${id}/approve`);
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Approve failed");
    } finally {
      setActionBusy(null);
    }
  };

  const reject = async (id) => {
    const reason = prompt("Enter rejection reason (optional):") || "";
    setActionBusy(id);
    try {
      await axiosClient.patch(`/admin/kyc/${id}/reject`, { reason });
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Reject failed");
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">KYC Submissions</h1>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded p-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          className="border rounded p-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          <option value="individual">Individual</option>
          <option value="business">Business</option>
        </select>

        <button
          className="border rounded px-3 py-2 text-sm"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600">No records.</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Gov ID</th>
                <th className="p-2 text-left">Selfie</th>
                <th className="p-2 text-left">Submitted</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-2">
                    <div className="font-medium">{r.user?.username}</div>
                    <div className="text-xs text-gray-600">{r.user?.email}</div>
                  </td>
                  <td className="p-2">{r.category || "-"}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">
                    {r.governmentIdImage?.url ? (
                      <a
                        href={r.governmentIdImage.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rose-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2">
                    {r.selfieImage?.url ? (
                      <a
                        href={r.selfieImage.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rose-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                        onClick={() => approve(r._id)}
                        disabled={
                          actionBusy === r._id || r.status === "approved"
                        }
                      >
                        Approve
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-red-600 text-white disabled:opacity-50"
                        onClick={() => reject(r._id)}
                        disabled={
                          actionBusy === r._id || r.status === "rejected"
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
