// src/features/admin/pages/AdminDashboard.jsx
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "../../../components/common/ProtectedRoute";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="max-w-4xl mx-auto py-10 space-y-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">
          Welcome, admin! Use the buttons below to manage the platform.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/admin/kyc")}
            className="bg-blue-600 text-white px-6 py-4 rounded hover:bg-blue-700"
          >
            KYC Approval
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="bg-green-600 text-white px-6 py-4 rounded hover:bg-green-700"
          >
            Manage Users
          </button>

          <button
            onClick={() => navigate("/admin/reports")}
            className="bg-yellow-600 text-white px-6 py-4 rounded hover:bg-yellow-700"
          >
            View Reports
          </button>

          <button
            onClick={() => navigate("/admin/settings")}
            className="bg-rose-600 text-white px-6 py-4 rounded hover:bg-rose-700"
          >
            Admin Settings
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
