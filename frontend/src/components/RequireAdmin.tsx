import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, booting } = useAuth();

  if (booting) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ mode: "login" }} replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return <>{children}</>;
}
