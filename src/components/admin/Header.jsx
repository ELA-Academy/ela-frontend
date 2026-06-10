import React, { useState } from "react";
import { Badge, Offcanvas, Dropdown } from "react-bootstrap";
import {
  Search,
  Bell,
  CheckCircle,
  User,
  LogOut,
  Settings,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

// Helper function for consistent, user-friendly timestamps
const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const Header = () => {
  const { user, unreadCount, notifications, markAllNotificationsAsRead } =
    useAuth();
  const navigate = useNavigate();

  // Local filtering states
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'mention' | 'assignment'
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const displayRole = () => {
    if (user?.role === "superadmin") {
      return "Superadmin";
    }
    if (user?.departmentNames && user.departmentNames.length > 0) {
      return user.departmentNames.join(" | ");
    }
    return "Staff";
  };

  const handleLogout = () => {
    navigate("/logout");
  };

  // Local filtering logic
  const filteredNotifications = notifications.filter((notif) => {
    // 1. Tab check
    if (activeTab === "mention" && notif.category !== "mention") return false;
    if (activeTab === "assignment" && notif.category !== "assignment") return false;

    // 2. Unread toggle check
    if (unreadOnly && notif.is_read) return false;

    // 3. Search query check
    if (
      searchQuery &&
      !notif.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    return true;
  });

  const getSenderInitials = (message) => {
    if (!message) return "N";
    const sender = message.split(" ")[0];
    return sender.substring(0, 2).toUpperCase();
  };

  return (
    <header className="hostinger-topbar h-20 bg-white flex items-center justify-between px-8 border-b border-slate-100 sticky top-0 z-40">
      {/* Search Input Box */}
      <div className="hostinger-brand-mark">
        <img src="/images/ELA-logo.png" alt="ELA Academy" className="hostinger-logo-image" />
      </div>

      <div className="flex items-center w-80">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search something here..."
            className="w-full bg-slate-50 border-0 text-slate-900 placeholder-slate-400 text-xs rounded-xl py-2.5 pl-10 pr-4 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Action Controls & User Profile Section */}
      <div className="flex items-center gap-4">
        {/* Bell notification button triggers Offcanvas */}
        <div
          className="hostinger-round-action relative cursor-pointer text-slate-600 hover:text-slate-900 transition-colors"
          onClick={() => setShowNotifications(true)}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-rose-500 text-white font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px] border border-white shadow-sm leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {/* Profile Dropdown panel */}
        <Dropdown align="end">
          <Dropdown.Toggle as="div" className="cursor-pointer flex items-center gap-3 select-none">
            {/* User profile labels inside the toggle for perfect alignment */}
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-semibold text-slate-950 leading-tight">
                {user?.name || "Admin"}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {displayRole()}
              </span>
            </div>

            <div className="hostinger-profile-avatar">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "AD"}
            </div>
            
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </Dropdown.Toggle>
          
          <Dropdown.Menu className="border-0 shadow-lg p-2 rounded-xl text-slate-800" style={{ minWidth: "220px" }}>
            <div className="px-3 py-2 border-b border-slate-50 mb-1">
              <div className="font-bold text-slate-950 text-sm">{user?.name}</div>
              <div className="text-slate-400 text-xs overflow-hidden text-ellipsis whitespace-nowrap">{user?.email}</div>
            </div>
            
            <Dropdown.Item as={Link} to="/admin/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              <span>Profile</span>
            </Dropdown.Item>
            
            <Dropdown.Item as={Link} to="/admin/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors text-slate-700">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </Dropdown.Item>
            
            <Dropdown.Divider className="border-slate-50" />
            
            <Dropdown.Item onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Spacious Offcanvas Notifications drawer */}
      <Offcanvas
        show={showNotifications}
        onHide={() => setShowNotifications(false)}
        placement="end"
        style={{ width: "420px" }}
        className="minimal-notifications-offcanvas"
      >
        <Offcanvas.Header closeButton className="border-b border-slate-100 p-6">
          <Offcanvas.Title className="font-bold text-xl tracking-tight text-slate-950">
            Notifications
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0 flex flex-col h-full bg-white">
          {/* Section 1: Dynamic category tabs */}
          <div className="flex border-b border-slate-100 px-3 bg-white">
            {["all", "mention", "assignment"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 text-center py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border-b-2 outline-none ${
                  activeTab === tab
                    ? "border-slate-950 text-slate-950"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "all" ? "All" : tab === "mention" ? "Mentioned" : "Assigned"}
              </button>
            ))}
          </div>

          {/* Section 2: Input searches and filters */}
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search notifications..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div
              className="flex items-center gap-2 cursor-pointer mt-3 select-none"
              onClick={() => setUnreadOnly(!unreadOnly)}
            >
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={() => {}}
                className="w-4 h-4 text-slate-950 border-slate-200 rounded focus:ring-slate-900 focus:ring-0 cursor-pointer"
                style={{ pointerEvents: "none" }}
              />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Unread only
              </span>
            </div>
          </div>

          {/* Section 3: Notification listings */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-230px)]">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <Link
                  to={notif.target_link || "#"}
                  key={notif.id}
                  className={`flex gap-3 p-4 border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors text-decoration-none ${
                    !notif.is_read ? "bg-slate-50/50" : ""
                  }`}
                  style={{ color: "inherit", display: "flex" }}
                  onClick={() => setShowNotifications(false)}
                >
                  {/* Unread pulsing marker */}
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  )}
                  
                  {/* Circle initials avatar icon */}
                  <div
                    className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-[10px] flex-shrink-0 border uppercase tracking-wider ${
                      notif.category === "mention"
                        ? "bg-sky-50 text-sky-600 border-sky-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {getSenderInitials(notif.message)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-800 font-medium leading-relaxed m-0 whitespace-normal break-words">
                      {notif.message}
                    </p>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                      {timeAgo(notif.created_at)}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <CheckCircle className="w-10 h-10 mb-2 opacity-50 text-slate-600" />
                <span className="text-xs font-semibold">No notifications found</span>
              </div>
            )}
          </div>

          {/* Section 4: persistent bottom action bar */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
              <button
                className="w-full bg-slate-950 text-white hover:bg-slate-900 transition-colors py-3 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
                onClick={markAllNotificationsAsRead}
              >
                Mark all as read
              </button>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  );
};

export default Header;
