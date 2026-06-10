import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Show a loading indicator while the auth state is being determined.
    return <div>Loading...</div>;
  }

  // If the user is authenticated, allow them to see the nested admin pages.
  if (isAuthenticated) {
    return <Outlet />;
  }

  // If the user is NOT authenticated, redirect them to the main staff login page.
  // The /superadmin route handles its own logic, so this is a safe default.
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
