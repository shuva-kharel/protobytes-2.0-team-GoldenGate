import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, booting } = useAuth();
  const loc = useLocation();

  if (booting) return <div className="p-10 text-center">Loading...</div>;
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ mode: "login", from: loc.pathname }}
        replace
      />
    );

  return <>{children}</>;
}
