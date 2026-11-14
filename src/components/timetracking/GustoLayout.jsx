import React, { useState, useEffect } from "react";
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
  ChevronDown,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Menu
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile } from "../../services/profileService";
import "../../styles/GustoTheme.css";

const GustoLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dynamicProfile, setDynamicProfile] = useState(null);

  // Teaching staff are locked to ELA TT, while admins/other depts can toggle back to /admin
  const isTeacher = user?.role === "teacher";
  const canAccessAdmin = !isTeacher;

  useEffect(() => {
    getMyProfile()
      .then((res) => setDynamicProfile(res))
      .catch((err) => console.log("Profile load fallback:", err));
  }, []);

  const staffName = dynamicProfile?.preferred_name || dynamicProfile?.name || user?.name || "Staff Member";
  const staffEmail = dynamicProfile?.work_email || dynamicProfile?.email || user?.email || "staff@elaaschool.org";
  const companyName = "ELA Academy LLC";
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

  const sampleNotifications = [
    {
      id: 1,
      title: "Pay period synced",
      desc: "Your weekly hours have been approved and synced with Stripe payroll.",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      title: "Direct deposit verified",
      desc: `Your primary account ending in ${dynamicProfile?.bank_account_last4 || "7600"} is active for direct deposit.`,
      time: "Yesterday",
      read: true
    }
  ];

  return (
    <div className="gusto-container">
      {/* Sidebar Navigation */}
      <aside className={`gusto-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Logo matching ELA TT branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.25rem 0.5rem 1.25rem",
              marginBottom: "0.5rem",
              borderBottom: "1px solid #f0f2f5"
            }}
          >
            <Link
              to="/time-tracking"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <div
                style={{
                  backgroundColor: "#0d5c46",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  padding: "0.25rem 0.55rem",
                  borderRadius: "6px",
                  letterSpacing: "0.5px"
                }}
              >
                ELA
              </div>
              <span
                style={{
                  color: "#0f172a",
                  fontWeight: 800,
                  fontSize: "1.45rem",
                  letterSpacing: "-0.03em",
                  fontFamily: "system-ui, -apple-system, sans-serif"
                }}
              >
                TT
              </span>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="gusto-nav-group">
            <NavLink
              to="/time-tracking"
              end
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/time-tracking/profile"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <User className="w-5 h-5" />
              <span>My profile</span>
            </NavLink>

            <NavLink
              to="/time-tracking/pay"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <CircleDollarSign className="w-5 h-5" />
              <span>Pay</span>
            </NavLink>

            <NavLink
              to="/time-tracking/hours"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <Clock className="w-5 h-5" />
              <span>Time tracking</span>
            </NavLink>

            <NavLink
              to="/time-tracking/benefits"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <Heart className="w-5 h-5" />
              <span>Benefits</span>
            </NavLink>

            <NavLink
              to="/time-tracking/documents"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <FileText className="w-5 h-5" />
              <span>Documents</span>
            </NavLink>

            <NavLink
              to="/time-tracking/performance"
              className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
            >
              <Star className="w-5 h-5" />
              <span>Performance</span>
            </NavLink>
          </nav>
        </div>

        {/* Bottom Nav Area: Refer and Help removed as requested */}
        <div className="gusto-sidebar-bottom">
          <NavLink
            to="/time-tracking/settings"
            className={({ isActive }) => `gusto-nav-link ${isActive ? "active" : ""}`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>

          {/* Quick link back to admin workspace for non-teaching staff */}
          {canAccessAdmin && (
            <Link
              to="/admin/dashboard"
              className="gusto-admin-switch-btn"
              title="Back to main administrative portal"
              style={{ marginTop: "0.5rem" }}
            >
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
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="gusto-icon-btn md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: "none" }}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div style={{ flex: 1 }} />

          <div className="gusto-header-actions">
            {/* Notification Bell */}
            <div style={{ position: "relative" }}>
              <button
                className="gusto-icon-btn"
                title="Notifications"
                onClick={() => setNotiOpen(!notiOpen)}
              >
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="gusto-noti-badge" />
              </button>

              {notiOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "120%",
                    right: 0,
                    width: "320px",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                    border: "1px solid #e2e8f0",
                    zIndex: 110,
                    overflow: "hidden"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
                      Notifications
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#0f766e", fontWeight: 600, cursor: "pointer" }}>
                      Mark all read
                    </span>
                  </div>
                  <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                    {sampleNotifications.map((noti) => (
                      <div
                        key={noti.id}
                        style={{
                          padding: "0.75rem 1rem",
                          borderBottom: "1px solid #f8fafc",
                          backgroundColor: noti.read ? "#ffffff" : "#fbfbfe"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {!noti.read && (
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: "#0f766e"
                              }}
                            />
                          )}
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                            {noti.title}
                          </span>
                        </div>
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "#64748b", lineHeight: 1.3 }}>
                          {noti.desc}
                        </p>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.25rem", display: "block" }}>
                          {noti.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div
              className="gusto-user-pill"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              tabIndex={0}
              style={{ position: "relative" }}
            >
              <div className="gusto-avatar">{userInitials}</div>
              <div className="gusto-user-details">
                <span className="gusto-user-name">{staffName}</span>
                <span className="gusto-user-company">{companyName}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />

              {/* User Menu Dropdown */}
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
                    width: "220px",
                    zIndex: 100,
                    padding: "0.5rem 0"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ padding: "0.6rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>{staffName}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {staffEmail}
                    </div>
                  </div>

                  <Link
                    to="/time-tracking/my-account"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.65rem 1rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      textDecoration: "none",
                      fontWeight: 500,
                      borderBottom: "1px solid #f1f5f9"
                    }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4 text-emerald-700" />
                    <span>My account</span>
                  </Link>

                  <Link
                    to="/time-tracking/settings"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.65rem 1rem",
                      fontSize: "0.85rem",
                      color: "#334155",
                      textDecoration: "none"
                    }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Settings</span>
                  </Link>

                  {canAccessAdmin && (
                    <Link
                      to="/admin/dashboard"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.65rem 1rem",
                        fontSize: "0.85rem",
                        color: "#334155",
                        textDecoration: "none"
                      }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Switch to Admin</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.65rem 1rem",
                      fontSize: "0.85rem",
                      color: "#dc2626",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      borderTop: "1px solid #f1f5f9"
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Nested Page Content */}
        <main className="gusto-content">
          <Outlet context={{ dynamicProfile, setDynamicProfile }} />
        </main>
      </div>
    </div>
  );
};

export default GustoLayout;
