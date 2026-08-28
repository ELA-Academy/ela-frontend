import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotFound from "../pages/NotFound";

const AdminOrITRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  const isITUser = user && (
    user.role === "superadmin" || (
      user.role === "staff" && Array.isArray(user.departmentNames) &&
      user.departmentNames.some((name) =>
        /\b(it|information technology|info tech|tech|administration|admin)\b/i.test((name || "").trim())
      )
    )
  );

  if (isITUser) {
    return <Outlet />;
  }

  if (user) {
    return <NotFound />;
  }

  return <Navigate to="/login" replace />;
};

export default AdminOrITRoute;
