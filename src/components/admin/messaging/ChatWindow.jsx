import React, { useState, useEffect, useRef, useCallback } from "react";
import { Form, Alert, Spinner, Card, Modal, Button } from "react-bootstrap";
import { SendFill } from "react-bootstrap-icons";
import { getMessages, sendMessage } from "../../../services/messagingService";
import { useAuth } from "../../../context/AuthContext";
import useAutosizeTextArea from "../../../hooks/useAutosizeTextArea";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ChatSkeleton } from "../../Skeleton";
import { io } from "socket.io-client";
import { updateTask } from "../../../services/boardService";
import {
  Plus,
  Smile,
  AtSign,
  Paperclip,
  Mail,
  Video,
  Mic,
  CheckSquare,
  Sparkles,
  User,
  Calendar as CalendarIcon,
  Phone,
  Trash2,
  AlertCircle,
  Clock,
  Briefcase
} from "lucide-react";
import api from "../../../utils/api";
import { toast } from "react-toastify";

// A global, persistent in-memory cache to store conversation histories
const globalMessageCache = {};

const ChatWindow = ({ conversationId, conversation }) => {
  const { user } = useAuth();
  
  // Navigation tabs: 'chat' | 'calendar' | 'tasks'
  const [activeTab, setActiveTab] = useState("chat");

  // Messages States
  const [messages, setMessages] = useState(() => {
    return globalMessageCache[conversationId] || [];
  });
  const [newMessage, setNewMessage] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(() => {
    return !globalMessageCache[conversationId];
  });
  const [error, setError] = useState("");
  
  // File Upload State
  const [uploading, setUploading] = useState(false);
  
  // Target Participant (for direct messages)
  const [targetUser, setTargetUser] = useState(null);
  
  // Tasks Tab States
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [boardsList, setBoardsList] = useState([]);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    boardId: "",
    groupId: "",
    priority: "Normal",
    dueDate: ""
  });
  const [groupsForSelectedBoard, setGroupsForSelectedBoard] = useState([]);

  // Calendar Tab States
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: "",
    description: "",
    start_datetime: "",
    end_datetime: "",
    all_day: false,
    color: "#673de6"
  });

  const messagesEndRef = useRef(null);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  useAutosizeTextArea(textAreaRef.current, newMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(
    async (isInitialLoad = false) => {
      if (!conversationId) return;

      if (isInitialLoad && !globalMessageCache[conversationId]) {
        setLoading(true);
      }

      try {
        const data = await getMessages(conversationId);

        setMessages((currentMessages) => {
          if (currentMessages.length !== data.length) {
            globalMessageCache[conversationId] = data;
            return data;
          }

          if (currentMessages.length > 0) {
            const lastCurrent = currentMessages[currentMessages.length - 1];
            const lastData = data[data.length - 1];
            if (
              lastCurrent.id !== lastData.id ||
              lastCurrent.status !== lastData.status ||
              lastCurrent.content !== lastData.content
            ) {
              globalMessageCache[conversationId] = data;
              return data;
            }
          }

          return currentMessages;
        });
      } catch (err) {
        setError("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  // Resolve direct message participant & fetch messaging users list
  useEffect(() => {
    if (!conversationId || conversation?.conversation_type !== "direct") {
      setTargetUser(null);
      return;
    }

    const resolveTargetUser = async () => {
      try {
        const res = await api.get("/messaging/users");
        const cleanConvoTitle = (conversation.title || "").replace(" (You)", "").trim();
        const matched = res.data.find(
          (u) => u.name.replace(" (You)", "").trim() === cleanConvoTitle
        );
        if (matched) {
          setTargetUser(matched);
        }
      } catch (err) {
        console.error("Error resolving target user", err);
      }
    };

    resolveTargetUser();
  }, [conversationId, conversation]);

  // Load Tasks assigned to target user
  const fetchAssignedTasks = async () => {
    setLoadingTasks(true);
    try {
      let role, userId;
      if (targetUser) {
        const parts = targetUser.id.split("_");
        role = parts[0];
        userId = parts[1];
      } else {
        role = user.role;
        userId = user.id;
      }
      const res = await api.get(`/board-extensions/tasks/assigned-to/${role}/${userId}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load assigned tasks", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Load Calendar Events
  const fetchCalendarEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get("/boards/calendar-events");
      setCalendarEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tasks") {
      fetchAssignedTasks();
    } else if (activeTab === "calendar") {
      fetchCalendarEvents();
    }
  }, [activeTab, targetUser]);

  // Load Boards List (for adding tasks)
  useEffect(() => {
    if (showAddTaskModal) {
      const fetchBoards = async () => {
        try {
          const res = await api.get("/boards");
          setBoardsList(res.data.filter(b => !b.is_folder && b.parent_id !== null));
        } catch (err) {
          console.error("Failed to fetch boards", err);
        }
      };
      fetchBoards();
    }
  }, [showAddTaskModal]);

  // Handle board select to populate status groups
  const handleBoardSelect = async (boardId) => {
    setNewTaskData(prev => ({ ...prev, boardId, groupId: "" }));
    if (!boardId) {
      setGroupsForSelectedBoard([]);
      return;
    }
    try {
      const res = await api.get(`/boards/${boardId}`);
      setGroupsForSelectedBoard(res.data.groups || []);
    } catch (err) {
      console.error("Failed to load board details", err);
    }
  };

  // Create task assigned to user
  const handleAddTask = async (e) => {
    e.preventDefault();
    const { title, boardId, groupId, priority, dueDate } = newTaskData;
    if (!groupId) {
      toast.warn("Please select a status group.");
      return;
    }

    try {
      let targetRole, targetUserId;
      if (targetUser) {
        const parts = targetUser.id.split("_");
        targetRole = parts[0];
        targetUserId = parseInt(parts[1], 10);
      } else {
        targetRole = user.role;
        targetUserId = user.id;
      }

      const payload = {
        title,
        group_id: Number(groupId),
        priority,
        due_date: dueDate || null,
        responsible_staff_id: targetRole === "staff" ? targetUserId : null,
        responsible_super_admin_id: targetRole === "superadmin" ? targetUserId : null
      };

      await api.post(`/boards/groups/${groupId}/tasks`, payload);
      toast.success("Task created and assigned successfully!");
      setShowAddTaskModal(false);
      setNewTaskData({ title: "", boardId: "", groupId: "", priority: "Normal", dueDate: "" });
      fetchAssignedTasks();
    } catch (err) {
      console.error("Failed to create task", err);
      toast.error("Failed to create task.");
    }
  };

  // Create calendar event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post("/boards/calendar-events", {
        title: newEventData.title,
        description: newEventData.description,
        start_datetime: newEventData.start_datetime,
        end_datetime: newEventData.end_datetime || null,
        all_day: newEventData.all_day,
        color: newEventData.color
      });
      toast.success("Event created successfully!");
      setShowAddEventModal(false);
      setNewEventData({ title: "", description: "", start_datetime: "", end_datetime: "", all_day: false, color: "#673de6" });
      fetchCalendarEvents();
    } catch (err) {
      console.error("Failed to create event", err);
      toast.error("Failed to create calendar event.");
    }
  };

  // Toggle Task Completion
  const handleToggleComplete = async (task) => {
    const nextStatus = task.status === "Done" ? "Not Started" : "Done";
    try {
      await updateTask(task.id, { status: nextStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch (err) {
      console.error("Failed to toggle task status", err);
      toast.error("Failed to update task.");
    }
  };

  // Socket setup
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages(true);

    const socketUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      transports: ["polling"]
    });

    socket.emit("join", { conversation_id: conversationId });

    socket.on("new_message", (message) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === message.id)) {
          return prev;
        }
        const filtered = prev.filter((msg) => !(String(msg.id).startsWith("temp_") && msg.content === message.content));
        const nextMessages = [...filtered, message];
        globalMessageCache[conversationId] = nextMessages;
        return nextMessages;
      });
    });

    return () => {
      socket.emit("leave", { conversation_id: conversationId });
      socket.disconnect();
    };
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    if (activeTab === "chat") {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: newMessage,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      sender_type: user.role,
      sender_name: user.name,
      status: "sending",
    };
    setMessages((prevMessages) => {
      const nextMessages = [...prevMessages, optimisticMessage];
      globalMessageCache[conversationId] = nextMessages;
      return nextMessages;
    });
    setNewMessage("");
    try {
      const sentMessage = await sendMessage(
        conversationId,
        optimisticMessage.content
      );
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === tempId ? sentMessage : msg))
      );
      globalMessageCache[conversationId] = (globalMessageCache[conversationId] || []).map(
        (msg) => (msg.id === tempId ? sentMessage : msg)
      );
    } catch (err) {
      setError("Failed to send message.");
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempId ? { ...msg, status: "failed" } : msg
        )
      );
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  // Upload message attachment
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (newMessage.trim()) {
      formData.append("content", newMessage.trim());
      setNewMessage("");
    }

    try {
      const tempId = `temp_${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        content: newMessage.trim() || `Uploaded attachment: ${file.name}`,
        created_at: new Date().toISOString(),
        sender_id: user.id,
        sender_type: user.role,
        sender_name: user.name,
        status: "sending",
        filename: file.name,
        file_path: ""
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      const res = await api.post(`/messaging/conversations/${conversationId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? res.data : msg))
      );
      globalMessageCache[conversationId] = (globalMessageCache[conversationId] || []).map(
        (msg) => (msg.id === tempId ? res.data : msg)
      );
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Failed to upload attachment.");
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatMessageTime = (isoString, status) => {
    if (status === "sending") return "Sending...";
    if (status === "failed") return "Failed to send";
    if (!isoString) return "";
    const date = parseISO(isoString);
    if (isToday(date)) return format(date, "p");
    if (isYesterday(date)) return `Yesterday at ${format(date, "p")}`;
    return format(date, "MMM d, yyyy 'at' p");
  };

  const isMyMessage = (msg) => {
    if (!user || !msg) return false;
    return user.role === msg.sender_type && user.id === msg.sender_id;
  };

  const chatTitle = conversation?.title || conversation?.participant_names || "Chat";
  const chatInitial = chatTitle.substring(0, 2).toUpperCase();

  // Task Filter Groupings
  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "Done") return false;
    return new Date(`${t.due_date}T23:59:59`) < new Date();
  });
  const activeTasks = tasks.filter((t) => t.status !== "Done" && (!t.due_date || new Date(`${t.due_date}T23:59:59`) >= new Date()));
  const completedTasks = tasks.filter((t) => t.status === "Done");

  return (
    <div className="zbot-chat-layout">
      {/* Zbot Header Panel with Tabs */}
      <div className="zbot-chat-header">
        <div className="zbot-header-left">
          <div className="zbot-header-avatar">
            {chatInitial}
          </div>
          <div className="zbot-header-info">
            <h5>{chatTitle}</h5>
            <span className="zbot-header-status-dot" />
          </div>
        </div>
        <div className="zbot-header-tabs">
          <button 
            className={`zbot-header-tab ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
          <button 
            className={`zbot-header-tab ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            Calendar
          </button>
          <button 
            className={`zbot-header-tab ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks
          </button>
        </div>
      </div>

      {activeTab === "chat" && (
        <>
          {/* Messages Scroll pane */}
          <div className="zbot-chat-messages">
            {error && (
              <Alert variant="danger" onClose={() => setError("")} dismissible>
                {error}
              </Alert>
            )}

            {loading ? (
              <ChatSkeleton count={4} />
            ) : (
              <>
                {/* Intro Banner at top of thread */}
                <div className="zbot-intro-section">
                  <div className="zbot-intro-avatar">
                    {chatInitial}
                  </div>
                  <h3>Chat with {chatTitle}</h3>
                  <p className="zbot-intro-subtitle">
                    This conversation started on {format(parseISO(conversation?.created_at || new Date().toISOString()), "MMMM d, yyyy")}.
                  </p>
                  
                  <div className="zbot-intro-cards">
                    <div className="zbot-intro-card pink-card" onClick={() => setActiveTab("calendar")}>
                      <div className="card-icon pink-icon">
                        <CalendarIcon size={18} />
                      </div>
                      <div className="card-details">
                        <strong>View Calendar</strong>
                        <span>Find schedule events or sync calendars</span>
                      </div>
                    </div>
                    <div className="zbot-intro-card green-card" onClick={() => setActiveTab("tasks")}>
                      <div className="card-icon green-icon">
                        <CheckSquare size={18} />
                      </div>
                      <div className="card-details">
                        <strong>Assigned Tasks</strong>
                        <span>Manage lists and follow work tasks</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="zbot-messages-list">
                  {messages.map((msg) => {
                    const isMe = isMyMessage(msg);
                    return (
                      <div
                        key={msg.id}
                        className={`zbot-message-row ${msg.status === "sending" ? "sending" : ""} ${
                          msg.status === "failed" ? "failed" : ""
                        } ${isMe ? "is-me" : ""}`}
                      >
                        <div className="zbot-message-avatar">
                          {(msg.sender_name || "U").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="zbot-message-body">
                          <div className="zbot-message-header">
                            <span className="zbot-message-sender">{msg.sender_name}</span>
                            <span className="zbot-message-time">
                              {formatMessageTime(msg.created_at, msg.status)}
                            </span>
                          </div>
                          <div className="zbot-message-content">
                            <p
                              className="m-0"
                              style={{
                                color: msg.status === "failed" ? "red" : "inherit",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {msg.content}
                            </p>

                            {/* Attachment Rendering */}
                            {msg.file_path && (
                              <div className="mt-2">
                                {msg.file_path.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                  <img 
                                    src={`${api.defaults.baseURL.replace("/api", "")}${msg.file_path}`} 
                                    alt={msg.filename} 
                                    className="max-width-[240px] rounded-lg border border-slate-100 shadow-sm"
                                    style={{ maxWidth: "260px" }}
                                  />
                                ) : (
                                  <a 
                                    href={`${api.defaults.baseURL.replace("/api", "")}${msg.file_path}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="d-inline-flex align-items-center gap-2 bg-slate-50 border rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-decoration-none"
                                  >
                                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{msg.filename}</span>
                                  </a>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </div>

          {/* Zbot Footer with greeting banner and dark panel input */}
          <div className="zbot-chat-footer">
            {!bannerDismissed && (
              <div className="zbot-footer-banner">
                <span>👋 Send a message to #{chatTitle} to get the conversation started!</span>
                <button className="zbot-banner-dismiss-btn" type="button" onClick={() => setBannerDismissed(true)}>
                  Dismiss
                </button>
              </div>
            )}

            <div className="zbot-input-card">
              <Form onSubmit={handleSendMessage}>
                <Form.Control
                  as="textarea"
                  ref={textAreaRef}
                  rows={1}
                  placeholder={`Write to ${chatTitle}, press 'space' for AI, '/' for commands`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  className="zbot-textarea"
                />

                <div className="zbot-toolbar-container">
                  <div className="zbot-toolbar-left">
                    <button type="button" className="toolbar-btn plus-btn" title="Add attachment" onClick={handlePaperclipClick}>
                      <Plus size={16} />
                    </button>
                    <button type="button" className="toolbar-btn emoji-btn" title="AI helper">
                      <Sparkles size={14} />
                    </button>
                    <button type="button" className="toolbar-btn mention-btn" title="Mention member">
                      <AtSign size={14} />
                    </button>
                    <button type="button" className="toolbar-btn paperclip-btn" title="Attach file" onClick={handlePaperclipClick}>
                      <Paperclip size={14} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      style={{ display: "none" }} 
                    />
                    {uploading && <Spinner size="sm" animation="border" className="ms-2" />}
                  </div>
                  <div className="zbot-toolbar-right">
                    <button type="submit" className="zbot-send-btn" disabled={!newMessage.trim() || uploading} title="Send message">
                      <SendFill size={13} />
                    </button>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </>
      )}

      {/* Calendar Sub-view */}
      {activeTab === "calendar" && (
        <div className="p-4 bg-white overflow-y-auto flex-1">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <h4 className="fw-bold text-slate-800 mb-0">Workspace Calendar Agenda</h4>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => setShowAddEventModal(true)}
              className="d-flex align-items-center gap-1"
            >
              <Plus size={16} /> Add Schedule Event
            </Button>
          </div>

          {loadingEvents ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : calendarEvents.length === 0 ? (
            <div className="text-center py-5 text-muted">No scheduled events in workspace.</div>
          ) : (
            <div className="d-flex flex-col gap-3">
              {calendarEvents.map((evt) => (
                <Card key={evt.id} className="border-0 shadow-sm bg-slate-50/50 rounded-2xl p-3 flex flex-row items-start gap-3 border-l-4" style={{ borderLeftColor: evt.color || "#673de6" }}>
                  <div className="p-2 bg-white rounded-xl shadow-sm text-slate-600 flex flex-col items-center min-w-[50px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {format(parseISO(evt.start_datetime), "MMM")}
                    </span>
                    <span className="text-lg font-bold text-slate-900 leading-none">
                      {format(parseISO(evt.start_datetime), "d")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h6 className="fw-bold text-slate-850 mb-1">{evt.title}</h6>
                    <p className="text-xs text-slate-500 mb-2">{evt.description || "No description."}</p>
                    <div className="d-flex align-items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span className="d-flex align-items-center gap-1">
                        <Clock size={11} />
                        {evt.all_day ? "All Day" : format(parseISO(evt.start_datetime), "p")}
                      </span>
                      <span>By {evt.created_by_name}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Sub-view */}
      {activeTab === "tasks" && (
        <div className="p-4 bg-white overflow-y-auto flex-1">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <h4 className="fw-bold text-slate-800 mb-0">Assigned Tasks ({tasks.length})</h4>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => setShowAddTaskModal(true)}
              className="d-flex align-items-center gap-1"
            >
              <Plus size={16} /> Add Task
            </Button>
          </div>

          {loadingTasks ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-5 text-muted">No assigned tasks for this member.</div>
          ) : (
            <div className="d-flex flex-col gap-4">
              
              {/* Overdue Section */}
              {overdueTasks.length > 0 && (
                <div>
                  <h6 className="text-danger fw-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle size={13} /> Overdue ({overdueTasks.length})
                  </h6>
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    {overdueTasks.map((t) => renderTaskRow(t))}
                  </div>
                </div>
              )}

              {/* Active Section */}
              {activeTasks.length > 0 && (
                <div>
                  <h6 className="text-indigo-600 fw-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Clock size={13} /> Active ({activeTasks.length})
                  </h6>
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    {activeTasks.map((t) => renderTaskRow(t))}
                  </div>
                </div>
              )}

              {/* Completed Section */}
              {completedTasks.length > 0 && (
                <div>
                  <h6 className="text-emerald-600 fw-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckSquare size={13} /> Completed ({completedTasks.length})
                  </h6>
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    {completedTasks.map((t) => renderTaskRow(t))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal show={showAddTaskModal} onHide={() => setShowAddTaskModal(false)} centered className="border-0">
        <Form onSubmit={handleAddTask}>
          <Modal.Header closeButton className="border-b border-slate-100 p-6 bg-slate-50/50">
            <Modal.Title className="font-bold text-base text-slate-950 flex items-center gap-2">
              <Plus className="w-5 h-5 text-slate-750" />
              <span>Assign New Task to: {chatTitle}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6">
            <div className="flex flex-col gap-4">
              <Form.Group>
                <Form.Label className="small fw-semibold">Task Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold">Workspace Board</Form.Label>
                <Form.Select
                  value={newTaskData.boardId}
                  onChange={(e) => handleBoardSelect(e.target.value)}
                  required
                >
                  <option value="">-- Choose Board --</option>
                  {boardsList.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold">Status Group</Form.Label>
                <Form.Select
                  value={newTaskData.groupId}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, groupId: e.target.value }))}
                  required
                  disabled={!newTaskData.boardId}
                >
                  <option value="">-- Choose Group --</option>
                  {groupsForSelectedBoard.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold">Priority</Form.Label>
                <Form.Select
                  value={newTaskData.priority}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold">Due Date</Form.Label>
                <Form.Control
                  type="date"
                  value={newTaskData.dueDate}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-end gap-2">
            <Button variant="light" onClick={() => setShowAddTaskModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-slate-950 hover:bg-slate-900 border-0 text-white">
              Create & Assign
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add Event Modal */}
      <Modal show={showAddEventModal} onHide={() => setShowAddEventModal(false)} centered className="border-0">
        <Form onSubmit={handleAddEvent}>
          <Modal.Header closeButton className="border-b border-slate-100 p-6 bg-slate-50/50">
            <Modal.Title className="font-bold text-base text-slate-950 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-slate-750" />
              <span>Create Schedule Event</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6">
            <div className="flex flex-col gap-4">
              <Form.Group>
                <Form.Label className="small fw-semibold">Event Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Weekly Coffee Sync"
                  value={newEventData.title}
                  onChange={(e) => setNewEventData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Location or conference link..."
                  value={newEventData.description}
                  onChange={(e) => setNewEventData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold">Start Date & Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={newEventData.start_datetime}
                  onChange={(e) => setNewEventData(prev => ({ ...prev, start_datetime: e.target.value }))}
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold">End Date & Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={newEventData.end_datetime}
                  onChange={(e) => setNewEventData(prev => ({ ...prev, end_datetime: e.target.value }))}
                />
              </Form.Group>

              <Form.Group className="d-flex align-items-center justify-content-between bg-slate-50 p-2.5 rounded-xl border">
                <Form.Label className="m-0 small fw-semibold">All Day Event</Form.Label>
                <Form.Check
                  type="checkbox"
                  checked={newEventData.all_day}
                  onChange={(e) => setNewEventData(prev => ({ ...prev, all_day: e.target.checked }))}
                />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-end gap-2">
            <Button variant="light" onClick={() => setShowAddEventModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-slate-950 hover:bg-slate-900 border-0 text-white">
              Create Event
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );

  function renderTaskRow(t) {
    return (
      <div key={t.id} className="d-flex align-items-center justify-content-between p-3 border-b last:border-0 hover:bg-slate-50/30 transition-colors bg-white">
        <div className="d-flex align-items-center gap-2.5 flex-grow-1 min-w-0">
          <input
            type="checkbox"
            checked={t.status === "Done"}
            onChange={() => handleToggleComplete(t)}
            className="w-4 h-4 rounded cursor-pointer accent-indigo-650 flex-shrink-0"
          />
          <span className={`text-xs font-semibold text-slate-800 truncate ${t.status === "Done" ? "line-through text-slate-400" : ""}`}>
            {t.title}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex-shrink-0 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
            <Briefcase size={10} />
            {t.board_name}
          </span>
        </div>
        <div className="d-flex align-items-center gap-4 flex-shrink-0">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            t.priority === "Urgent" ? "bg-rose-50 text-rose-600 border-rose-100" :
            t.priority === "High" ? "bg-amber-50 text-amber-600 border-amber-100" :
            t.priority === "Normal" ? "bg-sky-50 text-sky-600 border-sky-100" : "bg-slate-50 text-slate-400 border-slate-100"
          }`}>
            {t.priority}
          </span>
          {t.due_date && (
            <span className={`text-[10px] font-bold ${
              new Date(`${t.due_date}T23:59:59`) < new Date() && t.status !== "Done" ? "text-rose-600" : "text-slate-400"
            }`}>
              {t.due_date}
            </span>
          )}
        </div>
      </div>
    );
  }
};

export default ChatWindow;
