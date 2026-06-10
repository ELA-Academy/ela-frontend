import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotFound from "../pages/NotFound"; // We'll show a 404 page if a staff member tries to access

const SuperAdminRoute = () => {
  const { user, loading } = useAuth();

  // If we are still checking for the user, show a loading state
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // If the user is authenticated AND their role is 'superadmin', allow access
  if (user && user.role === "superadmin") {
    return <Outlet />;
  }

  // If the user is authenticated but IS NOT a superadmin, show the NotFound page.
  // This prevents staff from even knowing the page exists.
  if (user && user.role !== "superadmin") {
    return <NotFound />;
  }

  // If no user is authenticated at all, redirect to the login page
  // (This is a fallback, as ProtectedRoute should handle this already)
  return <Navigate to="/login" replace />;
};

export default SuperAdminRoute;
