import { Navigate, Outlet } from "react-router-dom";
import Loading from "./Loading";
import { useAuth } from "../../features/auth/authStore";

export default function ProtectedRoute() {
  const { user, booting } = useAuth();

  if (booting) return <Loading label="Loading your session..." />;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
