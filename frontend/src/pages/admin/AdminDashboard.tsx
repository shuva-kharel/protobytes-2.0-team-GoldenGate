import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await adminApi.stats();
      setData(res.data);
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black mb-6">Admin Dashboard</h1>

      {!data ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            Total Users: <b>{data.totalUsers}</b>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            Verified Users: <b>{data.verifiedUsers}</b>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            Pending KYC: <b>{data.pendingKyc}</b>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            Approved Today: <b>{data.approvedToday}</b>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            Rejected Today: <b>{data.rejectedToday}</b>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
