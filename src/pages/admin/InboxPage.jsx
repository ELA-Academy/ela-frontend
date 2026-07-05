import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../components/admin/workspace/WorkspaceLayout";
import {
  getNotifications,
  markRead,
  markAllAsRead,
} from "../../services/notificationService";
import { getAllBoardTasks, getCalendarEvents, updateTask } from "../../services/boardService";
import {
  Bell,
  CheckCircle,
  Clock,
  Inbox,
  MessageSquare,
  CheckSquare,
  Home,
  Calendar,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  User,
  Flag,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Lock,
  List,
  Square,
  MoreHorizontal,
} from "lucide-react";
import { Form, Button, Spinner, Tabs, Tab, Dropdown, Modal, Badge } from "react-bootstrap";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { 
  getPersonalBoard, 
  createPersonalList, 
  createPersonalTask, 
  updatePersonalList, 
  deletePersonalList, 
  updatePersonalTask, 
  deletePersonalTask 
} from "../../services/taskService";

const InboxPage = () => {
  const { user } = useAuth();
  const { boards, refreshWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Main Tab: "home" | "inbox" | "replies" | "comments"
  const activeTab = searchParams.get("tab") || "inbox";

  // Active Inbox Sub-Tab: "primary" | "other" | "later" | "cleared"
  const [inboxSubTab, setInboxSubTab] = useState("primary");

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Calendar Events State
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Personal Tasks States
  const [personalBoard, setPersonalBoard] = useState(null);
  const [personalLoading, setPersonalLoading] = useState(true);
  const [personalError, setPersonalError] = useState("");
  const [collapsedLists, setCollapsedLists] = useState({});
  
  // List Creation/Editing Modal
  const [showListModal, setShowListModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [listNameInput, setListNameInput] = useState("");
  const [listColorInput, setListColorInput] = useState("#673de6");

  // Inline Quick Task Titles
  const [quickTaskTitles, setQuickTaskTitles] = useState({});

  // Local storage for snoozed/later notifications
  const [laterIds, setLaterIds] = useState(() => {
    try {
      const saved = localStorage.getItem("snoozed_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveLaterIds = (ids) => {
    setLaterIds(ids);
    localStorage.setItem("snoozed_notifications", JSON.stringify(ids));
  };

  // Fetch all inbox and home data
  const fetchData = useCallback(async () => {
    setLoadingNotifs(true);
    setLoadingTasks(true);
    setLoadingEvents(true);

    try {
      // 1. Fetch Notifications
      const notifData = await getNotifications();
      setNotifications(Array.isArray(notifData) ? notifData : []);

      // 2. Fetch Tasks
      const taskData = await getAllBoardTasks();
      setTasks(Array.isArray(taskData) ? taskData : []);

      // 3. Fetch Calendar Events
      const eventData = await getCalendarEvents();
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      console.error("Failed to fetch inbox data:", err);
    } finally {
      setLoadingNotifs(false);
      setLoadingTasks(false);
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Personal Board Loading
  const fetchPersonalBoard = useCallback(async () => {
    try {
      setPersonalLoading(true);
      const data = await getPersonalBoard();
      setPersonalBoard(data);
    } catch (err) {
      setPersonalError("Failed to load personal lists.");
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "personal") {
      fetchPersonalBoard();
    }
  }, [activeTab, fetchPersonalBoard]);

  // Personal List Handlers
  const handleOpenCreateList = () => {
    setEditingList(null);
    setListNameInput("");
    setListColorInput("#673de6");
    setShowListModal(true);
  };

  const handleOpenEditList = (list) => {
    setEditingList(list);
    setListNameInput(list.name);
    setListColorInput(list.color || "#673de6");
    setShowListModal(true);
  };

  const handleSaveList = async (e) => {
    e.preventDefault();
    if (!listNameInput.trim()) return;

    try {
      if (editingList) {
        await updatePersonalList(editingList.id, {
          name: listNameInput.trim(),
          color: listColorInput
        });
        toast.success("List updated successfully");
      } else {
        await createPersonalList({
          name: listNameInput.trim(),
          color: listColorInput
        });
        toast.success("List created successfully");
      }
      setShowListModal(false);
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to save list.");
    }
  };

  const handleDeleteListClick = async (listId) => {
    if (!window.confirm("Are you sure you want to delete this list and all tasks inside?")) return;
    try {
      await deletePersonalList(listId);
      toast.success("List deleted");
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to delete list.");
    }
  };

  const toggleListCollapse = (listId) => {
    setCollapsedLists(prev => ({
      ...prev,
      [listId]: !prev[listId]
    }));
  };

  // Personal Task Handlers
  const handleAddQuickTask = async (listId) => {
    const title = quickTaskTitles[listId];
    if (!title || !title.trim()) return;

    try {
      await createPersonalTask({
        list_id: listId,
        title: title.trim(),
        status: "Not Started",
        priority: "Normal"
      });
      setQuickTaskTitles(prev => ({ ...prev, [listId]: "" }));
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to add task.");
    }
  };

  const handleTogglePersonalTaskStatus = async (task) => {
    const nextStatus = task.status === "Done" ? "Not Started" : "Done";
    try {
      await updatePersonalTask(task.id, { status: nextStatus });
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleUpdateTaskPriority = async (task, priority) => {
    try {
      await updatePersonalTask(task.id, { priority });
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to update priority.");
    }
  };

  const handleUpdateTaskDueDate = async (task, dateVal) => {
    try {
      await updatePersonalTask(task.id, { due_date: dateVal || null });
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to update due date.");
    }
  };

  const handleDeletePersonalTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deletePersonalTask(taskId);
      toast.success("Task deleted");
      fetchPersonalBoard();
    } catch (err) {
      toast.error("Failed to delete task.");
    }
  };

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Filter tasks assigned to current user
  const myTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter((task) => {
      const assigneeIds = task.assignee_ids || [];
      const matchesAssignee = assigneeIds.includes(user.id);
      const matchesRespStaff = task.responsible_staff_id === user.id && user.role === "staff";
      const matchesRespAdmin = task.responsible_super_admin_id === user.id && user.role === "superadmin";
      return matchesAssignee || matchesRespStaff || matchesRespAdmin;
    });
  }, [tasks, user]);

  // Group myTasks by status
  const myToDoTasks = useMemo(() => myTasks.filter((t) => t.status === "Not Started"), [myTasks]);
  const myInProgressTasks = useMemo(() => myTasks.filter((t) => t.status === "In Progress"), [myTasks]);
  const myDoneTasks = useMemo(() => myTasks.filter((t) => t.status === "Done"), [myTasks]);

  // Clear/Mark Read single notification
  const handleClearNotif = async (id) => {
    try {
      await markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      // Remove from Later if it was there
      saveLaterIds(laterIds.filter((x) => x !== id));
    } catch (err) {
      console.error("Failed to clear notification:", err);
    }
  };

  // Snooze/Snooze notification to "Later" tab
  const handleSnoozeNotif = (id) => {
    if (!laterIds.includes(id)) {
      saveLaterIds([...laterIds, id]);
    }
  };

  // Un-snooze notification
  const handleUnsnoozeNotif = (id) => {
    saveLaterIds(laterIds.filter((x) => x !== id));
  };

  // Clear all unread notifications
  const handleClearAll = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      saveLaterIds([]);
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
    }
  };

  // Filter notifications based on sub-tabs
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const isSnoozed = laterIds.includes(notif.id);

      if (inboxSubTab === "cleared") {
        return notif.is_read;
      }

      if (inboxSubTab === "later") {
        return isSnoozed && !notif.is_read;
      }

      // Hide cleared or snoozed from Active (Primary/Other)
      if (notif.is_read || isSnoozed) return false;

      // Primary: mentions & assignments
      if (inboxSubTab === "primary") {
        return notif.category === "mention" || notif.category === "assignment";
      }

      // Other: general notifications
      if (inboxSubTab === "other") {
        return notif.category !== "mention" && notif.category !== "assignment";
      }

      return true;
    });
  }, [notifications, inboxSubTab, laterIds]);

  // Filter replies (mock replies feed from notifications or updates)
  const replyNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const lowerMsg = n.message.toLowerCase();
      return lowerMsg.includes("reply") || lowerMsg.includes("replied") || lowerMsg.includes("comment");
    });
  }, [notifications]);

  // Filter assigned comments
  const assignedComments = useMemo(() => {
    return notifications.filter((n) => n.category === "assignment" || n.message.toLowerCase().includes("assign"));
  }, [notifications]);

  // Toggle task status quickly
  const handleToggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === "Done" ? "Not Started" : "Done";
      await updateTask(task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      refreshWorkspace();
    } catch (err) {
      console.error("Failed to toggle task status:", err);
    }
  };

  // Helper for priority color flags
  const getPriorityFlag = (priority) => {
    switch (priority) {
      case "Urgent":
        return <Flag size={13} fill="#ff3860" className="text-rose-500" />;
      case "High":
        return <Flag size={13} fill="#ff9f1a" className="text-amber-500" />;
      case "Normal":
        return <Flag size={13} fill="#1a73e8" className="text-blue-500" />;
      default:
        return <Flag size={13} className="text-slate-400" />;
    }
  };

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="inbox-page-wrapper">
      {/* Local Page CSS for Rich Aesthetics */}
      <style>
        {`
          .inbox-page-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            color: #1f2937;
          }
          .inbox-header-block {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          .inbox-header-block h1 {
            font-size: 1.6rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            margin: 0 0 6px;
          }
          .inbox-tab-nav {
            display: flex;
            gap: 8px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
            padding-bottom: 2px;
          }
          .inbox-tab-btn {
            background: none;
            border: none;
            padding: 10px 16px;
            font-size: 13.5px;
            font-weight: 700;
            color: #6b7280;
            border-bottom: 2px solid transparent;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.15s ease;
          }
          .inbox-tab-btn:hover {
            color: #374151;
            background: rgba(0, 0, 0, 0.02);
            border-radius: 6px 6px 0 0;
          }
          .inbox-tab-btn.active {
            color: #673de6;
            border-bottom-color: #673de6;
          }
          .notif-sub-tabs {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
          }
          .notif-sub-tab-btn {
            background: none;
            border: none;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 700;
            color: #9ca3af;
            border-radius: 6px;
            transition: all 0.12s ease;
          }
          .notif-sub-tab-btn:hover,
          .notif-sub-tab-btn.active {
            color: #1f2937;
            background: #f3f4f6;
          }
          .notif-card {
            background: #ffffff;
            border: 1px solid #eff1f5;
            border-radius: 12px;
            padding: 14px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 10px;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .notif-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            border-color: #e5e7eb;
          }
          .notif-category-badge {
            font-size: 9.5px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 999px;
            letter-spacing: 0.05em;
          }
          .badge-mention {
            background: rgba(103, 61, 230, 0.08);
            color: #673de6;
          }
          .badge-assignment {
            background: rgba(251, 191, 36, 0.1);
            color: #b45309;
          }
          .badge-general {
            background: rgba(156, 163, 175, 0.1);
            color: #4b5563;
          }
          .my-tasks-grid {
            display: grid;
            grid-template-columns: 1.3fr 0.7fr;
            gap: 24px;
          }
          .tasks-column {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          .agenda-column {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 20px;
            align-self: start;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          .task-row-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid #f3f4f6;
            margin-bottom: 8px;
            transition: background 0.1s;
          }
          .task-row-item:hover {
            background: #f9fafb;
          }
          .empty-state-card {
            background: #ffffff;
            border: 1px dashed #d1d5db;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            color: #6b7280;
          }
          .calendar-mini-event {
            background: rgba(103, 61, 230, 0.05);
            border-left: 3px solid #673de6;
            padding: 8px 12px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 8px;
            font-size: 12.5px;
          }
          
          /* Personal tasks split view styles */
          .personal-split-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 24px;
          }
          .personal-lists-column {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          .assigned-comments-column {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            align-self: start;
          }
          .personal-list-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 20px;
            overflow: hidden;
          }
          .personal-list-header {
            padding: 14px 20px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .personal-task-row {
            padding: 10px 20px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: background 0.15s;
          }
          .personal-task-row:hover {
            background: #f8fafc;
          }
          .personal-task-row.is-done .task-title {
            text-decoration: line-through;
            color: #94a3b8;
          }
          .task-checkbox {
            cursor: pointer;
            color: #64748b;
            transition: color 0.15s;
          }
          .task-checkbox:hover {
            color: #673de6;
          }
          .priority-dropdown button {
            border: none;
            background: transparent;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 500;
            font-size: 11px;
          }
          .priority-dropdown button:hover {
            background: rgba(0,0,0,0.05);
          }
          .quick-add-task-row {
            padding: 10px 20px;
            background: #fff;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .color-dot-select {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid transparent;
            transition: transform 0.1s;
          }
          .color-dot-select.selected {
            border-color: #000;
            transform: scale(1.15);
          }
          @media (max-width: 992px) {
            .personal-split-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      {/* Hero Header */}
      {activeTab !== "personal" ? (
        <>
          <div className="inbox-header-block">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h1>
                  {greeting}, {user?.name || "Member"}
                </h1>
                <p className="text-slate-500 mb-0" style={{ fontSize: "13.5px" }}>
                  Here's a breakdown of your inbox notifications and pending tasks.
                </p>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={fetchData}
                className="d-flex align-items-center gap-1 font-semibold"
              >
                Refresh Feed
              </Button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="inbox-tab-nav">
            <button
              className={`inbox-tab-btn ${activeTab === "inbox" ? "active" : ""}`}
              onClick={() => setTab("inbox")}
            >
              <Inbox size={15} />
              <span>Inbox</span>
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="badge bg-danger rounded-pill" style={{ fontSize: "10px" }}>
                  {notifications.filter((n) => !n.is_read).length}
                </span>
              )}
            </button>
            <button
              className={`inbox-tab-btn ${activeTab === "replies" ? "active" : ""}`}
              onClick={() => setTab("replies")}
            >
              <MessageSquare size={15} />
              <span>Replies</span>
            </button>
            <button
              className={`inbox-tab-btn ${activeTab === "comments" ? "active" : ""}`}
              onClick={() => setTab("comments")}
            >
              <CheckSquare size={15} />
              <span>Assigned Comments</span>
            </button>
            <button
              className={`inbox-tab-btn ${activeTab === "home" ? "active" : ""}`}
              onClick={() => setTab("home")}
            >
              <Home size={15} />
              <span>My Tasks</span>
              {myToDoTasks.length > 0 && (
                <span className="badge bg-indigo rounded-pill ms-1" style={{ fontSize: "10px", backgroundColor: "#673de6" }}>
                  {myToDoTasks.length}
                </span>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="d-flex align-items-center gap-2 mb-4 bg-white border p-3 rounded-3 shadow-sm">
          <CheckSquare size={20} className="text-indigo-600" />
          <h2 className="m-0 font-bold" style={{ fontSize: "16px", color: "#1e293b" }}>Personal List</h2>
        </div>
      )}

      {/* Main Tab Renderers */}
      {loadingNotifs && activeTab !== "home" ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-slate-400 mt-2">Loading feed details...</p>
        </div>
      ) : (
        <>
          {/* TAB: INBOX */}
          {activeTab === "inbox" && (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="notif-sub-tabs">
                  <button
                    className={`notif-sub-tab-btn ${inboxSubTab === "primary" ? "active" : ""}`}
                    onClick={() => setInboxSubTab("primary")}
                  >
                    Primary
                  </button>
                  <button
                    className={`notif-sub-tab-btn ${inboxSubTab === "other" ? "active" : ""}`}
                    onClick={() => setInboxSubTab("other")}
                  >
                    Other
                  </button>
                  <button
                    className={`notif-sub-tab-btn ${inboxSubTab === "later" ? "active" : ""}`}
                    onClick={() => setInboxSubTab("later")}
                  >
                    Later
                  </button>
                  <button
                    className={`notif-sub-tab-btn ${inboxSubTab === "cleared" ? "active" : ""}`}
                    onClick={() => setInboxSubTab("cleared")}
                  >
                    Cleared
                  </button>
                </div>
                {inboxSubTab !== "cleared" && filteredNotifications.length > 0 && (
                  <Button variant="link" size="sm" onClick={handleClearAll} className="text-decoration-none text-slate-500 font-semibold p-0">
                    Clear All Unread
                  </Button>
                )}
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="empty-state-card">
                  <Inbox size={42} className="text-slate-300 mx-auto mb-3" />
                  <h4>Your inbox is cleared!</h4>
                  <p className="text-slate-400 max-w-sm mx-auto mb-0" style={{ fontSize: "13px" }}>
                    {inboxSubTab === "later"
                      ? "You don't have any snoozed notifications."
                      : inboxSubTab === "cleared"
                      ? "Cleared updates will appear here once you mark them read."
                      : "Nice job! You are all caught up on your inbox updates."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div key={notif.id} className="notif-card">
                    <div className="d-flex align-items-start gap-3 min-width-0">
                      <span className={`notif-category-badge badge-${notif.category || "general"}`}>
                        {notif.category || "general"}
                      </span>
                      <div className="min-width-0">
                        {notif.target_link ? (
                          <Link
                            to={notif.target_link}
                            className="text-slate-800 fw-bold text-decoration-none hover-purple d-block truncate-text mb-1"
                            style={{ fontSize: "13px" }}
                          >
                            {notif.message}
                          </Link>
                        ) : (
                          <span className="text-slate-800 fw-semibold d-block truncate-text mb-1" style={{ fontSize: "13px" }}>
                            {notif.message}
                          </span>
                        )}
                        <small className="text-slate-400" style={{ fontSize: "11px" }}>
                          {format(new Date(notif.created_at), "PPp")}
                        </small>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      {inboxSubTab === "later" ? (
                        <button
                          className="btn btn-sm btn-light border rounded-pill p-1 px-2 d-flex align-items-center gap-1 text-slate-500"
                          style={{ fontSize: "11px" }}
                          onClick={() => handleUnsnoozeNotif(notif.id)}
                        >
                          <Clock size={12} />
                          <span>Un-snooze</span>
                        </button>
                      ) : !notif.is_read ? (
                        <>
                          <button
                            className="btn btn-sm btn-light border rounded-pill p-1 px-2 d-flex align-items-center gap-1 text-slate-500"
                            style={{ fontSize: "11px" }}
                            onClick={() => handleSnoozeNotif(notif.id)}
                          >
                            <Clock size={12} />
                            <span>Later</span>
                          </button>
                          <button
                            className="btn btn-sm btn-success rounded-pill p-1 px-2 d-flex align-items-center gap-1 text-white border-0"
                            style={{ fontSize: "11px", backgroundColor: "#00b67a" }}
                            onClick={() => handleClearNotif(notif.id)}
                          >
                            <CheckCircle size={12} />
                            <span>Clear</span>
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: REPLIES */}
          {activeTab === "replies" && (
            <div>
              <h5 className="font-bold text-slate-800 mb-3" style={{ fontSize: "14px" }}>Replies in Thread updates</h5>
              {replyNotifications.length === 0 ? (
                <div className="empty-state-card">
                  <MessageSquare size={42} className="text-slate-300 mx-auto mb-3" />
                  <h4>No thread replies yet</h4>
                  <p className="text-slate-400 max-w-sm mx-auto mb-0" style={{ fontSize: "13px" }}>
                    Replies to tasks you are watching or commented on will show up in this feed.
                  </p>
                </div>
              ) : (
                replyNotifications.map((notif) => (
                  <div key={notif.id} className="notif-card">
                    <div className="d-flex align-items-start gap-3 min-width-0">
                      <span className="notif-category-badge badge-mention">
                        Reply
                      </span>
                      <div className="min-width-0">
                        {notif.target_link ? (
                          <Link
                            to={notif.target_link}
                            className="text-slate-800 fw-bold text-decoration-none hover-purple d-block truncate-text mb-1"
                            style={{ fontSize: "13px" }}
                          >
                            {notif.message}
                          </Link>
                        ) : (
                          <span className="text-slate-800 fw-semibold d-block truncate-text mb-1" style={{ fontSize: "13px" }}>
                            {notif.message}
                          </span>
                        )}
                        <small className="text-slate-400" style={{ fontSize: "11px" }}>
                          {format(new Date(notif.created_at), "PPp")}
                        </small>
                      </div>
                    </div>
                    {!notif.is_read && (
                      <button
                        className="btn btn-sm btn-success rounded-pill p-1 px-2 d-flex align-items-center gap-1 text-white border-0 flex-shrink-0"
                        style={{ fontSize: "11px", backgroundColor: "#00b67a" }}
                        onClick={() => handleClearNotif(notif.id)}
                      >
                        <CheckCircle size={12} />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: COMMENTS */}
          {activeTab === "comments" && (
            <div>
              <h5 className="font-bold text-slate-800 mb-3" style={{ fontSize: "14px" }}>Assigned Comments and Task Mentions</h5>
              {assignedComments.length === 0 ? (
                <div className="empty-state-card">
                  <CheckSquare size={42} className="text-slate-300 mx-auto mb-3" />
                  <h4>No assigned comments</h4>
                  <p className="text-slate-400 max-w-sm mx-auto mb-0" style={{ fontSize: "13px" }}>
                    Tasks or updates where a comment explicitly assigns work to you will appear here.
                  </p>
                </div>
              ) : (
                assignedComments.map((notif) => (
                  <div key={notif.id} className="notif-card">
                    <div className="d-flex align-items-start gap-3 min-width-0">
                      <span className="notif-category-badge badge-assignment">
                        Comment
                      </span>
                      <div className="min-width-0">
                        {notif.target_link ? (
                          <Link
                            to={notif.target_link}
                            className="text-slate-800 fw-bold text-decoration-none hover-purple d-block truncate-text mb-1"
                            style={{ fontSize: "13px" }}
                          >
                            {notif.message}
                          </Link>
                        ) : (
                          <span className="text-slate-800 fw-semibold d-block truncate-text mb-1" style={{ fontSize: "13px" }}>
                            {notif.message}
                          </span>
                        )}
                        <small className="text-slate-400" style={{ fontSize: "11px" }}>
                          {format(new Date(notif.created_at), "PPp")}
                        </small>
                      </div>
                    </div>
                    {!notif.is_read && (
                      <button
                        className="btn btn-sm btn-success rounded-pill p-1 px-2 d-flex align-items-center gap-1 text-white border-0 flex-shrink-0"
                        style={{ fontSize: "11px", backgroundColor: "#00b67a" }}
                        onClick={() => handleClearNotif(notif.id)}
                      >
                        <CheckCircle size={12} />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: MY TASKS (HOME) */}
          {activeTab === "home" && (
            <div className="my-tasks-grid">
              {/* Column 1: Tasks Feed */}
              <div className="tasks-column">
                <h4 className="font-bold mb-4" style={{ fontSize: "15px" }}>Tasks Assigned to Me</h4>

                <Tabs defaultActiveKey="todo" id="my-tasks-subtabs" className="mb-3">
                  <Tab eventKey="todo" title={`To Do (${myToDoTasks.length})`}>
                    <div className="pt-2">
                      {myToDoTasks.length === 0 ? (
                        <p className="text-slate-400 py-3 text-center" style={{ fontSize: "12.5px" }}>
                          Zero tasks left to do! Excellent.
                        </p>
                      ) : (
                        myToDoTasks.map((task) => (
                          <div key={task.id} className="task-row-item">
                            <div className="d-flex align-items-center gap-2 min-width-0">
                              <Form.Check
                                type="checkbox"
                                checked={task.status === "Done"}
                                onChange={() => handleToggleTaskStatus(task)}
                                className="custom-check-bullet flex-shrink-0"
                              />
                              <Link
                                to={`/admin/boards/${task.board_id}`}
                                className="fw-semibold text-slate-800 text-decoration-none truncate-text hover-purple"
                                style={{ fontSize: "12.5px" }}
                              >
                                {task.title}
                              </Link>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              {getPriorityFlag(task.priority)}
                              {task.due_date && (
                                <span className="text-slate-400" style={{ fontSize: "11px" }}>
                                  Due {task.due_date}
                                </span>
                              )}
                              <Link to={`/admin/boards/${task.board_id}`} className="text-slate-400 hover-purple">
                                <ArrowRight size={13} />
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Tab>
                  <Tab eventKey="progress" title={`In Progress (${myInProgressTasks.length})`}>
                    <div className="pt-2">
                      {myInProgressTasks.length === 0 ? (
                        <p className="text-slate-400 py-3 text-center" style={{ fontSize: "12.5px" }}>
                          No tasks currently in progress.
                        </p>
                      ) : (
                        myInProgressTasks.map((task) => (
                          <div key={task.id} className="task-row-item">
                            <div className="d-flex align-items-center gap-2 min-width-0">
                              <Form.Check
                                type="checkbox"
                                checked={task.status === "Done"}
                                onChange={() => handleToggleTaskStatus(task)}
                                className="custom-check-bullet flex-shrink-0"
                              />
                              <Link
                                to={`/admin/boards/${task.board_id}`}
                                className="fw-semibold text-slate-800 text-decoration-none truncate-text hover-purple"
                                style={{ fontSize: "12.5px" }}
                              >
                                {task.title}
                              </Link>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              {getPriorityFlag(task.priority)}
                              {task.due_date && (
                                <span className="text-slate-400" style={{ fontSize: "11px" }}>
                                  Due {task.due_date}
                                </span>
                              )}
                              <Link to={`/admin/boards/${task.board_id}`} className="text-slate-400 hover-purple">
                                <ArrowRight size={13} />
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Tab>
                  <Tab eventKey="done" title={`Completed (${myDoneTasks.length})`}>
                    <div className="pt-2">
                      {myDoneTasks.length === 0 ? (
                        <p className="text-slate-400 py-3 text-center" style={{ fontSize: "12.5px" }}>
                          Completed tasks will show up here.
                        </p>
                      ) : (
                        myDoneTasks.map((task) => (
                          <div key={task.id} className="task-row-item">
                            <div className="d-flex align-items-center gap-2 min-width-0">
                              <Form.Check
                                type="checkbox"
                                checked={task.status === "Done"}
                                onChange={() => handleToggleTaskStatus(task)}
                                className="custom-check-bullet flex-shrink-0"
                              />
                              <Link
                                to={`/admin/boards/${task.board_id}`}
                                className="fw-semibold text-slate-400 text-decoration-none text-decoration-line-through truncate-text hover-purple"
                                style={{ fontSize: "12.5px" }}
                              >
                                {task.title}
                              </Link>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              {getPriorityFlag(task.priority)}
                              {task.due_date && (
                                <span className="text-slate-400" style={{ fontSize: "11px" }}>
                                  Done {task.due_date}
                                </span>
                              )}
                              <Link to={`/admin/boards/${task.board_id}`} className="text-slate-400 hover-purple">
                                <ArrowRight size={13} />
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </div>

              {/* Column 2: Agenda & recents */}
              <div className="agenda-column">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Calendar size={16} className="text-indigo-500" />
                  <h4 className="font-bold mb-0" style={{ fontSize: "14px" }}>Calendar Agenda</h4>
                </div>

                {loadingEvents ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-slate-400" style={{ fontSize: "12px", fontStyle: "italic" }}>
                    No upcoming calendar events scheduled.
                  </p>
                ) : (
                  events.slice(0, 5).map((evt) => (
                    <div key={evt.id} className="calendar-mini-event">
                      <div className="fw-bold text-slate-800 truncate-text" style={{ fontSize: "12px" }}>
                        {evt.title}
                      </div>
                      <small className="text-slate-500" style={{ fontSize: "10.5px" }}>
                        {evt.start_datetime ? format(new Date(evt.start_datetime), "PPp") : "All Day"}
                      </small>
                    </div>
                  ))
                )}

                <hr className="my-4 border-slate-200" />

                <div className="d-flex align-items-center gap-2 mb-3">
                  <MessageSquare size={16} className="text-indigo-500" />
                  <h4 className="font-bold mb-0" style={{ fontSize: "14px" }}>Assigned Comments & Mentions</h4>
                </div>

                {assignedComments.length === 0 ? (
                  <p className="text-slate-400 mb-3" style={{ fontSize: "12px", fontStyle: "italic" }}>
                    No assigned comments or mentions.
                  </p>
                ) : (
                  <div className="mb-3" style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {assignedComments.slice(0, 5).map((notif) => (
                      <div key={notif.id} className="notif-card" style={{ padding: "10px 14px", fontSize: "12px", border: "1px solid #eff1f5", margin: 0 }}>
                        <div className="d-flex align-items-start gap-2 min-width-0">
                          <span className="notif-category-badge badge-assignment" style={{ padding: "2px 6px", fontSize: "8.5px" }}>
                            Comment
                          </span>
                          <div className="min-width-0">
                            {notif.target_link ? (
                              <Link
                                to={notif.target_link}
                                className="text-slate-800 fw-bold text-decoration-none hover-purple d-block truncate-text mb-1"
                                style={{ fontSize: "12px" }}
                              >
                                {notif.message}
                              </Link>
                            ) : (
                              <span className="text-slate-800 fw-semibold d-block truncate-text mb-1" style={{ fontSize: "12px" }}>
                                {notif.message}
                              </span>
                            )}
                            <small className="text-slate-400" style={{ fontSize: "10px" }}>
                              {format(new Date(notif.created_at), "PPp")}
                            </small>
                          </div>
                        </div>
                        {!notif.is_read && (
                          <button
                            className="btn btn-sm btn-success rounded-pill p-1 px-2 d-flex align-items-center gap-1 text-white border-0 flex-shrink-0"
                            style={{ fontSize: "10px", backgroundColor: "#00b67a" }}
                            onClick={() => handleClearNotif(notif.id)}
                          >
                            <CheckCircle size={10} />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <hr className="my-4 border-slate-200" />

                <h4 className="font-bold mb-3" style={{ fontSize: "13px" }}>My Space Boards</h4>
                <div className="d-flex flex-wrap gap-1.5">
                  {boards.slice(0, 6).map((board) => (
                    <Link
                      key={board.id}
                      to={`/admin/boards/${board.id}`}
                      className="btn btn-sm btn-light border py-1 px-2.5 text-slate-700 font-semibold"
                      style={{ fontSize: "11px", borderRadius: "8px" }}
                    >
                      {board.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PERSONAL LISTS & ASSIGNED COMMENTS SPLIT VIEW */}
          {activeTab === "personal" && (
            <div className="personal-split-grid">
              {/* Left Panel: Personal Lists & Tasks */}
              <div className="personal-lists-column">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <Lock size={16} className="text-slate-400" />
                    <span className="text-slate-500" style={{ fontSize: '13px' }}>Private to you</span>
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleOpenCreateList}
                    style={{ background: "#673de6", borderColor: "#673de6" }}
                  >
                    <Plus size={16} className="me-1" /> New List
                  </Button>
                </div>

                {personalLoading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : personalError ? (
                  <Alert variant="danger">{personalError}</Alert>
                ) : !personalBoard || !personalBoard.groups || personalBoard.groups.length === 0 ? (
                  <div className="text-center py-5 border rounded-3 bg-white">
                    <List size={40} className="text-slate-300 mb-3" />
                    <h5>No Personal Lists yet</h5>
                    <p className="text-slate-500 mb-4">Create your first private list to organize your personal todos.</p>
                    <Button 
                      variant="primary" 
                      onClick={handleOpenCreateList}
                      style={{ background: "#673de6", borderColor: "#673de6" }}
                    >
                      Create List
                    </Button>
                  </div>
                ) : (
                  personalBoard.groups.map(list => {
                    const isCollapsed = !!collapsedLists[list.id];
                    return (
                      <div key={list.id} className="personal-list-card">
                        <div className="personal-list-header">
                          <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => toggleListCollapse(list.id)}>
                            <span className="text-slate-400">
                              {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                            </span>
                            <span 
                              className="rounded-circle" 
                              style={{ width: "10px", height: "10px", backgroundColor: list.color || "#673de6", display: "inline-block" }}
                            />
                            <h6 className="mb-0 fw-bold text-slate-800">{list.name}</h6>
                            <Badge bg="light" text="dark" className="ms-2 border" style={{ fontSize: "11px" }}>
                              {list.tasks?.length || 0}
                            </Badge>
                          </div>

                          <div className="d-flex align-items-center gap-1">
                            <Dropdown align="end">
                              <Dropdown.Toggle as="button" className="border-0 bg-transparent p-1 text-slate-400 hover:text-slate-600">
                                <MoreHorizontal size={16} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="shadow border">
                                <Dropdown.Item onClick={() => handleOpenEditList(list)}>
                                  <Edit3 size={14} className="me-2" /> Rename List
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => handleDeleteListClick(list.id)} className="text-danger">
                                  <Trash2 size={14} className="me-2" /> Delete List
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="personal-list-content">
                            {(!list.tasks || list.tasks.length === 0) ? (
                              <div className="text-center py-4 text-slate-400" style={{ fontSize: "13px" }}>
                                No tasks in this list. Add one below.
                              </div>
                            ) : (
                              list.tasks.map(task => {
                                const isDone = task.status === "Done";
                                const pColor = 
                                  task.priority === "Urgent" ? "#ef4444" : 
                                  task.priority === "High" ? "#f57c00" : 
                                  task.priority === "Low" ? "#94a3b8" : "#3b82f6";
                                
                                return (
                                  <div key={task.id} className={`personal-task-row ${isDone ? "is-done" : ""}`}>
                                    <div className="task-checkbox" onClick={() => handleTogglePersonalTaskStatus(task)}>
                                      {isDone ? (
                                        <CheckSquare size={18} className="text-success" />
                                      ) : (
                                        <Square size={18} />
                                      )}
                                    </div>
                                    
                                    <div className="flex-grow-1 task-title text-slate-800 fw-medium" style={{ fontSize: "13.5px" }}>
                                      {task.title}
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                      {/* Priority Dropdown */}
                                      <Dropdown className="priority-dropdown">
                                        <Dropdown.Toggle as="button" style={{ color: pColor }}>
                                          {task.priority || "Normal"}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="shadow border" style={{ fontSize: "12px" }}>
                                          <Dropdown.Item onClick={() => handleUpdateTaskPriority(task, "Urgent")} className="text-danger">Urgent</Dropdown.Item>
                                          <Dropdown.Item onClick={() => handleUpdateTaskPriority(task, "High")} style={{ color: "#f57c00" }}>High</Dropdown.Item>
                                          <Dropdown.Item onClick={() => handleUpdateTaskPriority(task, "Normal")} className="text-primary">Normal</Dropdown.Item>
                                          <Dropdown.Item onClick={() => handleUpdateTaskPriority(task, "Low")} className="text-muted">Low</Dropdown.Item>
                                        </Dropdown.Menu>
                                      </Dropdown>

                                      {/* Due Date picker */}
                                      <div className="d-flex align-items-center text-slate-400 gap-1" style={{ fontSize: "12px", position: "relative" }}>
                                        <Calendar size={13} />
                                        <input 
                                          type="date" 
                                          value={task.due_date ? task.due_date.substring(0, 10) : ""}
                                          onChange={(e) => handleUpdateTaskDueDate(task, e.target.value)}
                                          className="border-0 p-0 text-slate-600 bg-transparent cursor-pointer"
                                          style={{ outline: "none", fontSize: "12px", width: "105px" }}
                                        />
                                      </div>

                                      {/* Delete Task */}
                                      <button 
                                        className="border-0 bg-transparent text-slate-400 hover:text-danger p-1"
                                        onClick={() => handleDeletePersonalTask(task.id)}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}

                            {/* Quick Add Task Row */}
                            <div className="quick-add-task-row border-top">
                              <Plus size={16} className="text-slate-400" />
                              <Form.Control
                                type="text"
                                placeholder="Add task..."
                                value={quickTaskTitles[list.id] || ""}
                                onChange={(e) => setQuickTaskTitles(prev => ({ ...prev, [list.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddQuickTask(list.id);
                                  }
                                }}
                                className="border-0 p-0 shadow-none bg-transparent"
                                style={{ fontSize: "13px" }}
                              />
                              {quickTaskTitles[list.id]?.trim() && (
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  onClick={() => handleAddQuickTask(list.id)}
                                  style={{ color: "#673de6", fontWeight: "600", textDecoration: "none", fontSize: "12px" }}
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Panel: Assigned Comments */}
              <div className="assigned-comments-column">
                <h5 className="font-bold text-slate-800 mb-3" style={{ fontSize: "14px" }}>Assigned Comments</h5>
                {assignedComments.length === 0 ? (
                  <div className="empty-state-card" style={{ padding: "20px" }}>
                    <CheckSquare size={36} className="text-slate-300 mx-auto mb-2" />
                    <h6 style={{ fontSize: "13px", fontWeight: "700" }}>No assigned comments</h6>
                    <p className="text-slate-400 mb-0" style={{ fontSize: "11.5px" }}>
                      Comments assigning work to you will show up here.
                    </p>
                  </div>
                ) : (
                  assignedComments.map((notif) => (
                    <div key={notif.id} className="notif-card" style={{ padding: "10px 14px", fontSize: "12px" }}>
                      <div className="d-flex align-items-start gap-2 min-width-0">
                        <span className="notif-category-badge badge-assignment" style={{ padding: "2px 6px", fontSize: "8.5px" }}>
                          Comment
                        </span>
                        <div className="min-width-0">
                          {notif.target_link ? (
                            <Link
                              to={notif.target_link}
                              className="text-slate-800 fw-bold text-decoration-none hover-purple d-block truncate-text mb-1"
                              style={{ fontSize: "12px" }}
                            >
                              {notif.message}
                            </Link>
                          ) : (
                            <span className="text-slate-800 fw-semibold d-block truncate-text mb-1" style={{ fontSize: "12px" }}>
                              {notif.message}
                            </span>
                          )}
                          <small className="text-slate-400" style={{ fontSize: "10px" }}>
                            {format(new Date(notif.created_at), "PPp")}
                          </small>
                        </div>
                      </div>
                      {!notif.is_read && (
                        <button
                          className="btn btn-sm btn-success rounded-pill p-1 px-2 d-flex align-items-center gap-1 text-white border-0 flex-shrink-0"
                          style={{ fontSize: "10px", backgroundColor: "#00b67a" }}
                          onClick={() => handleClearNotif(notif.id)}
                        >
                          <CheckCircle size={10} />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit List Modal */}
      <Modal show={showListModal} onHide={() => setShowListModal(false)} centered>
        <Form onSubmit={handleSaveList}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: "16px", fontWeight: "700" }}>
              {editingList ? "Rename List" : "Create Personal List"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "13px", fontWeight: "600" }}>List Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Weekly Goals, Urgent Todos"
                value={listNameInput}
                onChange={(e) => setListNameInput(e.target.value)}
                required
                style={{ fontSize: "13.5px" }}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: "13px", fontWeight: "600" }}>Theme Color</Form.Label>
              <div className="d-flex gap-2 mt-1">
                {["#673de6", "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map(c => (
                  <span
                    key={c}
                    className={`color-dot-select ${listColorInput === c ? "selected" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setListColorInput(c)}
                  />
                ))}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowListModal(false)} style={{ fontSize: "13px" }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              style={{ background: "#673de6", borderColor: "#673de6", fontSize: "13px" }}
            >
              {editingList ? "Save Changes" : "Create List"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default InboxPage;
