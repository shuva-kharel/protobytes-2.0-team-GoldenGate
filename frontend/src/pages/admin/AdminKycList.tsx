import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, AdminKycItem } from "../../api/adminApi";

const AdminKycList: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<AdminKycItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await adminApi.listKyc({
      status: status || undefined,
      category: category || undefined,
    });
    setItems(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [status, category]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black mb-6">KYC Review</h1>

      <div className="flex gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Filter by category (optional)"
          className="border rounded-lg px-3 py-2 flex-1"
        />
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-3">
          {items.map((k) => (
            <button
              key={k._id}
              onClick={() => navigate(`/admin/kyc/${k._id}`)}
              className="w-full text-left bg-white rounded-xl p-4 shadow-sm border hover:border-blue-300"
            >
              <div className="font-bold">
                {k.fullName} — <span className="text-blue-600">{k.status}</span>
              </div>
              <div className="text-sm text-gray-600">
                User: {k.user?.username} ({k.user?.email}) | Category:{" "}
                {k.category}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminKycList;
