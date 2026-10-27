import React, { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import {
  Home,
  User,
  CircleDollarSign,
  Clock,
  Heart,
  FileText,
  Star,
  Settings,
  Bell,
  Gift,
  ChevronDown,
  ArrowLeft,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/GustoTheme.css";

const GustoLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Teaching staff are locked to Gusto, while admins/other depts can toggle back to /admin
  const isTeacher = user?.role === "teacher";
  const canAccessAdmin = !isTeacher;

  const staffName = user?.name || "Staff Member";
  const userInitials = staffName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="gusto-container">
      {/* Sidebar Navigation */}
      <aside className="gusto-sidebar">
        <div>
          {/* Logo */}
          <Link to="/time-tracking" className="gusto-logo-area" style={{ textDecoration: "none" }}>
            <img
              src="/images/ela-app-logo.png"
              alt="ELA Academy"
              className="gusto-logo-img"
              onError={(e) => {
                // fallback if image not found
                e.target.style.display = "none";
              }}
            />
            <span className="gusto-logo-text">ELA Gusto</span>
          </Link>

          {/* Nav Items */}
          <nav className="gusto-nav-group">
            <NavLink
              to="/time-tracking"
              end
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <Home />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/time-tracking/profile"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <User />
              <span>My profile</span>
            </NavLink>

            <NavLink
              to="/time-tracking/pay"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <CircleDollarSign />
              <span>Pay</span>
            </NavLink>

            <NavLink
              to="/time-tracking/hours"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <Clock />
              <span>Time tracking</span>
            </NavLink>

            <NavLink
              to="/time-tracking/benefits"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <Heart />
              <span>Benefits</span>
            </NavLink>

            <NavLink
              to="/time-tracking/documents"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <FileText />
              <span>Documents</span>
            </NavLink>

            <NavLink
              to="/time-tracking/performance"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <Star />
              <span>Performance</span>
            </NavLink>
          </nav>
        </div>

        {/* Bottom Area */}
        <div className="gusto-sidebar-bottom">
          <NavLink
            to="/time-tracking/settings"
            className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
          >
            <Settings />
            <span>Settings</span>
          </NavLink>

          {/* Quick link back to admin workspace for non-teaching staff */}
          {canAccessAdmin && (
            <Link to="/admin/dashboard" className="gusto-admin-switch-btn" title="Back to main administrative portal">
              <ArrowLeft className="w-4 h-4" />
              <span>Admin Portal</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="gusto-main">
        {/* Top Header */}
        <header className="gusto-header">
          <div className="gusto-header-actions">
            <button className="gusto-icon-btn" title="Rewards & Perks">
              <Gift className="w-5 h-5" />
            </button>
            <button className="gusto-icon-btn" title="Notifications">
              <Bell className="w-5 h-5" />
            </button>

            {/* User Profile Pill */}
            <div
              className="gusto-user-pill"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              tabIndex={0}
            >
              <div className="gusto-avatar">{userInitials}</div>
              <div className="gusto-user-details">
                <span className="gusto-user-name">{staffName}</span>
                <span className="gusto-user-company">ELA Academy LLC</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />

              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "115%",
                    right: 0,
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                    border: "1px solid #e2e8f0",
                    width: "200px",
                    zIndex: 100,
                    padding: "0.5rem 0",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ padding: "0.5rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>{staffName}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{user?.email || "staff@elaaschool.org"}</div>
                  </div>
                  {canAccessAdmin && (
                    <Link
                      to="/admin/dashboard"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.6rem 1rem",
                        fontSize: "0.85rem",
                        color: "#334155",
                        textDecoration: "none"
                      }}
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      Switch to Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.6rem 1rem",
                      fontSize: "0.85rem",
                      color: "#dc2626",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Nested Page Content */}
        <main className="gusto-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default GustoLayout;
