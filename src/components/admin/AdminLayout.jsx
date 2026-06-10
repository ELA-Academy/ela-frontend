import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../context/AuthContext";
import { subscribeUser } from "../../utils/push-notifications";
import "../../styles/AdminModern.css";

const AdminLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      subscribeUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (
      user &&
      (location.pathname === "/admin" || location.pathname === "/admin/")
    ) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, navigate, location.pathname]);

  const isWorkspacePage =
    location.pathname.startsWith("/admin/messaging") ||
    location.pathname.startsWith("/admin/boards");

  return (
    <div className={`admin-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="main-content">
        <Header collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <main
          className={isWorkspacePage ? "content-area-workspace" : "content-area"}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
