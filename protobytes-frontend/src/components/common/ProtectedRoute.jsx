// src/components/common/ProtectedRoute.jsx
import { useAuth } from "../../features/auth/authStore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, booting } = useAuth();

  // Still loading current session? Wait
  if (booting) return <div>Loading…</div>;

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Role check (if roles array is provided)
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/home" replace />; // or an "Access Denied" page
  }

  return children;
}
