import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Check, Inbox } from "lucide-react";
import { Dropdown } from "react-bootstrap";
import { formatDistanceToNow, parseISO } from "date-fns";
import { getNotifications, markAllAsRead, markRead } from "../../../services/notificationService";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'mention', 'assignment'
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotificationsData = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotificationsData();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(() => {
      fetchNotificationsData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleNotificationClick = async (n) => {
    try {
      if (!n.is_read) {
        await markRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (n.target_link) {
        navigate(n.target_link);
      }
    } catch (err) {
      console.error("Failed to process notification click", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.category === activeTab;
  });

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      return formatDistanceToNow(parseISO(timeStr), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  return (
    <Dropdown align="end" ref={dropdownRef} className="notification-bell-dropdown">
      <Dropdown.Toggle as="div" className="position-relative cursor-pointer d-flex align-items-center justify-content-center p-2 rounded-circle hover-bg-slate">
        <Bell size={18} className="text-slate-600 hover-text-slate-900" />
        {unreadCount > 0 && (
          <span className="notification-badge-red">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-panel shadow-lg border">
        <div className="notification-panel-header d-flex align-items-center justify-content-between">
          <span className="panel-title">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="mark-all-read-btn d-flex align-items-center gap-1"
            >
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>

        <div className="notification-tabs d-flex">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            className={`tab-btn ${activeTab === "mention" ? "active" : ""}`}
            onClick={() => setActiveTab("mention")}
          >
            Mentions
          </button>
          <button
            className={`tab-btn ${activeTab === "assignment" ? "active" : ""}`}
            onClick={() => setActiveTab("assignment")}
          >
            Assignments
          </button>
        </div>

        <div className="notification-list-scroll">
          {filteredNotifications.length === 0 ? (
            <div className="empty-notifications-state text-center py-5 px-3">
              <Inbox size={32} className="text-slate-300 mb-2" />
              <div className="empty-title">All caught up!</div>
              <div className="empty-desc">No new notifications in this category.</div>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`notification-item d-flex align-items-start gap-2 ${
                  !n.is_read ? "unread" : ""
                }`}
              >
                <div className="notification-dot-wrapper">
                  {!n.is_read && <span className="notification-dot" />}
                </div>
                <div className="notification-content flex-grow-1">
                  <div className="notification-message text-slate-800">{n.message}</div>
                  <div className="notification-time text-slate-400">
                    {formatTime(n.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
