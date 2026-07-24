import React, { useState, useEffect, useRef } from "react";
import { Badge, Offcanvas, Dropdown, Modal, Button } from "react-bootstrap";
import {
  Search,
  Bell,
  CheckCircle,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Play,
  Pause,
  Square,
  Timer,
  FileText,
  Folder,
  Briefcase,
  Users,
  CheckSquare,
  Calendar,
  Download,
  Smartphone,
  Laptop
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import UpdateNotifier from "../common/UpdateNotifier";
import { useTimer } from "../../context/TimerContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../../utils/api";

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

// Formats seconds to HH:MM:SS
const formatTime = (totalSeconds) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
};

const Header = () => {
  const { user, unreadCount, notifications, markAllNotificationsAsRead, markNotificationAsRead, vibrateBell } =
    useAuth();
  const navigate = useNavigate();

  // Timer Context
  const { 
    activeTimer, 
    pauseTimer, 
    resumeTimer, 
    stopTimer, 
    showLogModal, 
    setShowLogModal, 
    modalTask, 
    saveLoggedTime,
    elapsedSeconds
  } = useTimer();

  // Local filtering states for notifications
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'mention' | 'assignment'
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Global search states
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    tasks: [],
    boards: [],
    docs: [],
    files: [],
    users: []
  });
  const [searchFilter, setSearchFilter] = useState("all"); // all | tasks | boards | docs | files | users
  const [isSearching, setIsSearching] = useState(false);
  const searchDropdownRef = useRef(null);

  // Time logging modal states
  const [logDescription, setLogDescription] = useState("");
  const [logBillable, setLogBillable] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem("pwa_installed", "true");
      } catch (err) {}
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://") ||
      localStorage.getItem("pwa_installed") === "true";

    if (isStandalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setIsAppInstalled(true);
        try {
          localStorage.setItem("pwa_installed", "true");
        } catch (e) {}
      }
      setDeferredPrompt(null);
    } else {
      setShowPwaModal(true);
    }
  };

  // Dynamic upcoming reminder parsed from unread reminder notifications
  const upcomingReminder = React.useMemo(() => {
    const reminderNotifs = (notifications || []).filter(
      (n) => n.category === "reminder" && !n.is_read
    );
    if (reminderNotifs.length === 0) return null;

    // Sort by created_at descending (most recent first)
    const sorted = [...reminderNotifs].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const activeReminder = sorted[0];
    const msg = activeReminder.message || "";

    let clean = msg;
    if (clean.startsWith("Reminder: ")) {
      clean = clean.substring("Reminder: ".length);
    }
    if (clean.startsWith("'") && clean.includes("'", 1)) {
      const secondQuoteIdx = clean.indexOf("'", 1);
      const title = clean.substring(1, secondQuoteIdx);
      let rest = clean.substring(secondQuoteIdx + 1).trim();
      rest = rest.replace("starts in", "in")
                 .replace("minutes", "m")
                 .replace("minute", "m")
                 .replace("hours", "h")
                 .replace("hour", "h")
                 .replace("!", "");
      return { title, timeText: rest };
    }
    return { title: clean, timeText: "" };
  }, [notifications]);

  // Handle outside clicks for search dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSearchOverlay(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Debounced search fetching
  useEffect(() => {
    if (!globalQuery.trim()) {
      setSearchResults({ tasks: [], boards: [], docs: [], files: [], users: [] });
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/board-extensions/search?q=${encodeURIComponent(globalQuery)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [globalQuery]);

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

  // Local filtering logic for notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "mention" && notif.category !== "mention") return false;
    if (activeTab === "assignment" && notif.category !== "assignment") return false;
    if (unreadOnly && notif.is_read) return false;
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
      
      {/* Brand logo */}
      <div className="hostinger-brand-mark flex items-center gap-3">
        <img src="/images/ELA-logo.png" alt="ELA Academy" className="hostinger-logo-image h-8" />
        {upcomingReminder && (
          <>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-650 rounded-full border border-slate-100 text-[11px] font-medium leading-none shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-slate-800 font-semibold">{upcomingReminder.title}</span>
              <span className="text-slate-500">{upcomingReminder.timeText}</span>
            </div>
          </>
        )}
      </div>

      {/* Global Search Input Box with overlay */}
      <div className="flex items-center w-[360px] relative" ref={searchDropdownRef}>
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search tasks, spaces, docs, files, users..."
            className="w-full bg-slate-50 border-0 text-slate-900 placeholder-slate-400 text-xs rounded-xl py-2.5 pl-10 pr-4 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all duration-200"
            value={globalQuery}
            onChange={(e) => {
              setGlobalQuery(e.target.value);
              setShowSearchOverlay(true);
            }}
            onFocus={() => setShowSearchOverlay(true)}
          />
        </div>

        {showSearchOverlay && (globalQuery.trim() || isSearching) && (
          <div className="absolute top-full left-0 w-[450px] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 max-h-[480px] overflow-y-auto">
            {/* Filter Pills */}
            <div className="flex gap-1.5 mb-3 border-b border-slate-50 pb-2 overflow-x-auto whitespace-nowrap scrollbar-none">
              {["all", "tasks", "boards", "docs", "files", "users"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSearchFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    searchFilter === f
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {isSearching ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">Searching...</div>
            ) : (
              <div className="flex flex-col gap-4">
                
                {/* Tasks Category */}
                {(searchFilter === "all" || searchFilter === "tasks") && searchResults.tasks?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> Tasks
                    </div>
                    <div className="flex flex-col gap-1">
                      {searchResults.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => {
                            setShowSearchOverlay(false);
                            navigate(`/admin/boards/${task.board_id || 'all'}?task=${task.id}`);
                          }}
                          className="flex justify-between items-center px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-xs text-slate-700 font-medium"
                        >
                          <span className="truncate max-w-[280px]">{task.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            task.status === "Done" ? "bg-emerald-50 text-emerald-600" :
                            task.status === "In Progress" ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                          }`}>{task.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boards Category */}
                {(searchFilter === "all" || searchFilter === "boards") && searchResults.boards?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-teal-500" /> Boards
                    </div>
                    <div className="flex flex-col gap-1">
                      {searchResults.boards.map((board) => (
                        <div
                          key={board.id}
                          onClick={() => {
                            setShowSearchOverlay(false);
                            navigate(`/admin/boards/${board.id}`);
                          }}
                          className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-xs text-slate-700 font-medium"
                        >
                          {board.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Docs Category */}
                {(searchFilter === "all" || searchFilter === "docs") && searchResults.docs?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-sky-500" /> Docs
                    </div>
                    <div className="flex flex-col gap-1">
                      {searchResults.docs.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => {
                            setShowSearchOverlay(false);
                            navigate(`/admin/docs?docId=${doc.id}`);
                          }}
                          className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-xs text-slate-700 font-medium"
                        >
                          {doc.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files Category */}
                {(searchFilter === "all" || searchFilter === "files") && searchResults.files?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Folder className="w-3.5 h-3.5 text-amber-500" /> Files
                    </div>
                    <div className="flex flex-col gap-1">
                      {searchResults.files.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => {
                            setShowSearchOverlay(false);
                            navigate(`/admin/boards/${file.board_id}?tab=files`);
                          }}
                          className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-xs text-slate-700 font-medium flex justify-between items-center"
                        >
                          <span className="truncate max-w-[260px]">{file.filename}</span>
                          <span className="text-[10px] text-slate-400">{file.file_type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Category */}
                {(searchFilter === "all" || searchFilter === "users") && searchResults.users?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-rose-500" /> Users
                    </div>
                    <div className="flex flex-col gap-1">
                      {searchResults.users.map((u) => (
                        <div
                          key={`${u.role}-${u.id}`}
                          onClick={() => {
                            setShowSearchOverlay(false);
                            navigate(`/admin/messaging?chat=${u.email}`);
                          }}
                          className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-xs text-slate-700 font-medium flex justify-between"
                        >
                          <span>{u.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">{u.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {(!searchResults.tasks?.length && !searchResults.boards?.length && !searchResults.docs?.length && !searchResults.files?.length && !searchResults.users?.length) && (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">No results match your query</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Controls & User Profile Section */}
      <div className="flex items-center gap-4">
        
        {/* Persistent Timer Widget */}
        {activeTimer && (
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 shadow-sm transition-all duration-300">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeTimer.isRunning ? 'bg-indigo-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTimer.isRunning ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold max-w-[120px] truncate leading-none mb-0.5">
                {activeTimer.task.title}
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 leading-none">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              {activeTimer.isRunning ? (
                <button
                  onClick={pauseTimer}
                  title="Pause Timer"
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                >
                  <Pause className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  title="Resume Timer"
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              
              <button
                onClick={stopTimer}
                title="Stop & Log Time"
                className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-slate-600 transition-colors cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>
        )}



        {/* Auto Update Notification Button */}
        <UpdateNotifier />

        {/* Bell notification button triggers Offcanvas */}
        <div
          className="hostinger-round-action relative cursor-pointer text-slate-600 hover:text-slate-900 transition-colors"
          onClick={() => setShowNotifications(true)}
        >
          <style>{`
            @keyframes bell-vibrate {
              0% { transform: rotate(0); }
              15% { transform: rotate(15deg); }
              30% { transform: rotate(-15deg); }
              45% { transform: rotate(10deg); }
              60% { transform: rotate(-10deg); }
              75% { transform: rotate(4deg); }
              85% { transform: rotate(-4deg); }
              100% { transform: rotate(0); }
            }
            .vibrate-bell-active {
              animation: bell-vibrate 0.6s ease-in-out;
              color: #f59e0b !important;
            }
          `}</style>
          <Bell className={`w-5 h-5 transition-all ${vibrateBell ? "vibrate-bell-active" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-rose-500 text-white font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px] border border-white shadow-sm leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {/* Profile Dropdown panel */}
        <Dropdown align="end">
          <Dropdown.Toggle as="div" className="cursor-pointer flex items-center gap-3 select-none">
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

          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-230px)]">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => {
                const content = (
                  <>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                    )}
                    
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
                  </>
                );

                const isLink = !!notif.target_link;
                const Wrapper = isLink ? Link : "div";
                const wrapperProps = isLink 
                  ? { to: notif.target_link, className: `flex gap-3 p-4 border-b border-slate-100 transition-colors text-decoration-none ${notif.is_read ? 'text-slate-400 hover:bg-slate-50' : 'text-slate-700 bg-slate-50/50 hover:bg-slate-50'}` }
                  : { className: `flex gap-3 p-4 border-b border-slate-100 transition-colors ${notif.is_read ? 'text-slate-400' : 'text-slate-700 bg-slate-50/50'}` };

                return (
                  <Wrapper
                    key={notif.id}
                    style={{ color: "inherit", display: "flex", cursor: isLink ? "pointer" : "default" }}
                    {...wrapperProps}
                    onClick={() => {
                      setShowNotifications(false);
                      if (!notif.is_read) {
                        markNotificationAsRead(notif.id);
                      }
                    }}
                  >
                    {content}
                  </Wrapper>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <CheckCircle className="w-10 h-10 mb-2 opacity-50 text-slate-600" />
                <span className="text-xs font-semibold">No notifications found</span>
              </div>
            )}
          </div>

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

      {/* Time Logging Modal */}
      <Modal show={showLogModal} onHide={() => setShowLogModal(false)} centered className="border-0">
        <Modal.Header closeButton className="border-b border-slate-100 p-6 bg-slate-50/50">
          <Modal.Title className="font-bold text-base text-slate-950 flex items-center gap-2">
            <Timer className="w-5 h-5 text-slate-700" />
            <span>Log Time for: {modalTask?.title}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6">
          <div className="flex flex-col gap-4">
            
            {/* Show Elapsed Time */}
            {activeTimer && (
              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Time Tracker Duration
                </div>
                <div className="text-2xl font-mono font-bold text-slate-900">
                  {formatTime(activeTimer.elapsedSeconds)}
                </div>
              </div>
            )}

            {/* Manual Duration (if activeTimer is null or for overrides) */}
            {!activeTimer && (
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all duration-200"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Work Done / Comment
              </label>
              <textarea
                placeholder="What did you work on? (optional)"
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all duration-200 resize-none"
                value={logDescription}
                onChange={(e) => setLogDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-800">Billable</span>
                <span className="text-[10px] text-slate-400">Mark this time entry as billable</span>
              </div>
              <input
                type="checkbox"
                checked={logBillable}
                onChange={(e) => setLogBillable(e.target.checked)}
                className="w-4 h-4 text-slate-950 border-slate-200 rounded focus:ring-slate-900 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-end gap-2">
          <Button
            variant="light"
            onClick={() => setShowLogModal(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors border-0"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const secondsToLog = manualMinutes ? parseInt(manualMinutes, 10) * 60 : null;
              saveLoggedTime(logDescription, logBillable, secondsToLog);
              setLogDescription("");
              setLogBillable(false);
              setManualMinutes("");
            }}
            className="bg-slate-950 hover:bg-slate-950/90 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border-0"
          >
            Save Time Log
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Desktop PWA Installation Instructions Modal */}
      <Modal show={showPwaModal} onHide={() => setShowPwaModal(false)} centered size="md">
        <Modal.Header closeButton className="border-b border-slate-100 p-4">
          <Modal.Title className="font-bold text-base text-slate-950 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            <span>Install ELA Academy Desktop App</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-slate-700">
          <p className="text-xs text-slate-600 mb-3">
            Install ELA Academy as a standalone desktop app on Windows or macOS for fast one-click access directly from your desktop or taskbar!
          </p>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 items-start">
            <Laptop className="w-6 h-6 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h6 className="font-bold text-xs text-slate-900 mb-1">Desktop Browser Quick Install</h6>
              <p className="text-[12px] text-slate-600 mb-2 leading-relaxed">
                Look at the right side of your browser's address bar (URL bar) and click the <strong>Install</strong> icon ⊕, or open your browser menu (⋮) and select <strong>"Install ELA Academy App"</strong>.
              </p>
              <div className="bg-white p-2 rounded-lg border text-[11px] font-mono text-slate-500">
                Tip: Chrome / Edge will prompt "Install app?" to launch ELA Academy as a standalone window.
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-slate-100 p-3 bg-slate-50/50">
          <Button variant="dark" size="sm" onClick={() => setShowPwaModal(false)}>Got It</Button>
        </Modal.Footer>
      </Modal>

    </header>
  );
};

export default Header;
