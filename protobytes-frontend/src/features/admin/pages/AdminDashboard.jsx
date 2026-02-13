import { useNavigate } from "react-router-dom";
import ProtectedRoute from "../../../components/common/ProtectedRoute";
import {
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminActions = [
    {
      title: "KYC Approval",
      description: "Review & verify user identities",
      color: "from-rose-500 to-rose-600",
      icon: <ClipboardDocumentCheckIcon className="h-8 w-8" />,
      path: "/admin/kyc",
    },
    {
      title: "Manage Users",
      description: "View, edit & control user accounts",
      color: "from-emerald-500 to-emerald-600",
      icon: <UserGroupIcon className="h-8 w-8" />,
      path: "/admin/users",
    },
    {
      title: "View Reports",
      description: "Analytics, flagged users & platform reports",
      color: "from-yellow-500 to-yellow-600",
      icon: <ChartBarIcon className="h-8 w-8" />,
      path: "/admin/reports",
    },
    {
      title: "Admin Settings",
      description: "Platform settings & admin controls",
      color: "from-indigo-500 to-indigo-600",
      icon: <Cog6ToothIcon className="h-8 w-8" />,
      path: "/admin/settings",
    },
  ];

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold font-display brand-gradient tracking-wide">
            ऐँचोपैंचो Admin
          </h1>
          <p className="text-gray-600 text-sm">
            Welcome Admin — Manage the platform efficiently.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {adminActions.map((action) => (
            <div
              key={action.title}
              onClick={() => navigate(action.path)}
              className={`
                group cursor-pointer rounded-2xl border bg-white shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition
                border-gray-100 p-6 flex flex-col gap-3
              `}
            >
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shadow`}
              >
                {action.icon}
              </div>

              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-rose-700">
                {action.title}
              </h2>

              <p className="text-gray-600 text-sm">{action.description}</p>

              <div className="flex justify-end">
                <button
                  className={`text-xs font-medium text-rose-700 group-hover:text-rose-900`}
                >
                  Open →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
