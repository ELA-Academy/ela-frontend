import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Form, Alert, Spinner, Card, Modal, Button } from "react-bootstrap";
import { SendFill } from "react-bootstrap-icons";
import { getMessages, sendMessage } from "../../../services/messagingService";
import { useAuth } from "../../../context/AuthContext";
import useAutosizeTextArea from "../../../hooks/useAutosizeTextArea";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ChatSkeleton } from "../../Skeleton";
import { io } from "socket.io-client";
import { updateTask } from "../../../services/boardService";
import DeleteConfirmModal from "../DeleteConfirmModal";
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
  Briefcase,
  MoreHorizontal,
  Pencil,
  Link2,
  MessageSquare,
  ArrowUpDown,
  ChevronRight,
  Bell
} from "lucide-react";
import api from "../../../utils/api";
import { toast } from "react-toastify";

// A global, persistent in-memory cache to store conversation histories
const globalMessageCache = {};

const renderMessageText = (text) => {
  if (!text) return "";
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (part.match(/https?:\/\/[^\s]+/)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-800 text-decoration-underline"
          style={{ wordBreak: "break-all" }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

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

  // Mentions State
  const [allAppUsers, setAllAppUsers] = useState([]);
  const [showMentionsDropdown, setShowMentionsDropdown] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState("");
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Message Menu / Action States
  const [activeMsgMenu, setActiveMsgMenu] = useState(null); // { message, pos: { x, y } }
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [showDeleteMsgModal, setShowDeleteMsgModal] = useState(false);
  const [msgIdToDelete, setMsgIdToDelete] = useState(null);
  const [deletingMsg, setDeletingMsg] = useState(false);

  // Keyboard Shortcuts for hovered message
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.isContentEditable
      ) {
        return;
      }
      if (!hoveredMessageId) return;

      const msg = messages.find((m) => m.id === hoveredMessageId);
      if (!msg) return;

      const isMe = isMyMessage(msg);

      if ((e.key === "e" || e.key === "E") && isMe) {
        e.preventDefault();
        handleStartEdit(msg);
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        handleMarkUnread();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleCopyLink(msg);
      } else if (e.key === "Delete") {
        e.preventDefault();
        if (isMe) {
          handleDeleteMsg(msg.id);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [hoveredMessageId, messages]);

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
    setActiveMsgMenu(null);
  };

  const handleSaveEdit = async (msgId) => {
    if (!editingText.trim()) return;
    try {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: editingText } : m))
      );
      if (globalMessageCache[conversationId]) {
        globalMessageCache[conversationId] = globalMessageCache[conversationId].map((m) =>
          m.id === msgId ? { ...m, content: editingText } : m
        );
      }
      setEditingMessageId(null);
      setEditingText("");
      toast.success("Message edited successfully");
    } catch (err) {
      toast.error("Failed to edit message");
    }
  };

  const handleDeleteMsg = (msgId) => {
    setMsgIdToDelete(msgId);
    setShowDeleteMsgModal(true);
    setActiveMsgMenu(null);
  };

  const handleConfirmDeleteMsg = async () => {
    if (!msgIdToDelete) return;
    try {
      setDeletingMsg(true);
      setMessages((prev) => prev.filter((m) => m.id !== msgIdToDelete));
      if (globalMessageCache[conversationId]) {
        globalMessageCache[conversationId] = globalMessageCache[conversationId].filter(
          (m) => m.id !== msgIdToDelete
        );
      }
      setShowDeleteMsgModal(false);
      setMsgIdToDelete(null);
      toast.success("Message deleted successfully");
    } catch (err) {
      toast.error("Failed to delete message");
    } finally {
      setDeletingMsg(false);
    }
  };

  const handleCopyLink = (msg) => {
    const link = `${window.location.origin}/admin/messaging?convoId=${conversationId}&msgId=${msg.id}`;
    navigator.clipboard.writeText(link)
      .then(() => toast.success("Message link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
    setActiveMsgMenu(null);
  };

  const handleMarkUnread = async () => {
    try {
      await markConversationUnread(conversationId);
      toast.success("Conversation marked as unread");
    } catch (err) {
      toast.error("Failed to mark conversation as unread");
    }
    setActiveMsgMenu(null);
  };

  const handleRemindMe = (time) => {
    toast.success(`We'll remind you in Inbox ${time}`);
    setActiveMsgMenu(null);
  };

  const handleAddRelationship = (type) => {
    toast.success(`Relationship added: ${type}`);
    setActiveMsgMenu(null);
  };

  // Fetch all app users for mentions on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/messaging/users");
        setAllAppUsers(res.data || []);
      } catch (err) {
        console.error("Error fetching users for mentions", err);
      }
    };
    fetchUsers();
  }, []);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    
    const selectionStart = e.target.selectionStart;
    const textBeforeCaret = val.slice(0, selectionStart);
    const lastAtIndex = textBeforeCaret.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCaret[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n') {
        const query = textBeforeCaret.slice(lastAtIndex + 1);
        if (!query.includes('\n')) {
          setMentionTriggerIndex(lastAtIndex);
          setMentionSearchQuery(query);
          setShowMentionsDropdown(true);
          setSelectedMentionIndex(0);
          return;
        }
      }
    }
    
    setShowMentionsDropdown(false);
  };

  const handleMentionBtnClick = () => {
    const textarea = textAreaRef.current;
    if (!textarea) return;
    
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const val = newMessage;
    
    const prefix = val.slice(0, selectionStart);
    const suffix = val.slice(selectionEnd);
    const newVal = prefix + '@' + suffix;
    
    setNewMessage(newVal);
    
    const newCursorPos = selectionStart + 1;
    setMentionTriggerIndex(selectionStart);
    setMentionSearchQuery("");
    setShowMentionsDropdown(true);
    setSelectedMentionIndex(0);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const selectMention = (userToMention) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;
    
    const val = newMessage;
    const triggerIndex = mentionTriggerIndex;
    if (triggerIndex === -1) return;
    
    const cursorPosition = textarea.selectionStart;
    
    const prefix = val.slice(0, triggerIndex);
    const suffix = val.slice(cursorPosition);
    const mentionText = `@${userToMention.name} `;
    const newVal = prefix + mentionText + suffix;
    
    setNewMessage(newVal);
    setShowMentionsDropdown(false);
    setMentionTriggerIndex(-1);
    setMentionSearchQuery("");
    
    const newCursorPos = triggerIndex + mentionText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const filteredUsers = useMemo(() => {
    if (!mentionSearchQuery) {
      return allAppUsers;
    }
    const q = mentionSearchQuery.toLowerCase();
    return allAppUsers.filter(u => 
      u.name.toLowerCase().includes(q) || 
      (u.email && u.email.toLowerCase().includes(q))
    );
  }, [allAppUsers, mentionSearchQuery]);

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
    if (showMentionsDropdown && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filteredUsers[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionsDropdown(false);
        return;
      }
    }

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
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                        className={`zbot-message-row ${msg.status === "sending" ? "sending" : ""} ${
                          msg.status === "failed" ? "failed" : ""
                        } ${isMe ? "is-me" : ""}`}
                      >
                        <div className="zbot-message-hover-actions">
                          <button
                            type="button"
                            className="zbot-message-action-btn"
                            title="More actions"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const menuHeight = 285;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const y = spaceBelow < menuHeight ? rect.top - menuHeight - 4 : rect.bottom + 4;
                              setActiveMsgMenu({
                                message: msg,
                                pos: {
                                  x: Math.max(10, rect.left - 230),
                                  y: y
                                }
                              });
                            }}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
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
                            {editingMessageId === msg.id ? (
                              <div className="mt-1 w-100">
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="zbot-textarea border rounded p-2 mb-2 w-100"
                                  style={{ background: "#ffffff", color: "#1f2937" }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEdit(msg.id);
                                    } else if (e.key === "Escape") {
                                      setEditingMessageId(null);
                                      setEditingText("");
                                    }
                                  }}
                                />
                                <div className="d-flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={() => handleSaveEdit(msg.id)}
                                    className="text-xs font-bold px-3 bg-purple-600 hover:bg-purple-700 border-none"
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline-secondary" 
                                    onClick={() => {
                                      setEditingMessageId(null);
                                      setEditingText("");
                                    }}
                                    className="text-xs font-semibold px-3 border-slate-200"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p
                                className="m-0"
                                style={{
                                  color: msg.status === "failed" ? "red" : "inherit",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {renderMessageText(msg.content)}
                              </p>
                            )}

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

            <div className="zbot-input-card" style={{ position: "relative" }}>
              {showMentionsDropdown && filteredUsers.length > 0 && (
                <div className="zbot-mentions-dropdown">
                  {filteredUsers.map((u, index) => (
                    <div
                      key={u.id}
                      className={`zbot-mention-item ${index === selectedMentionIndex ? "selected" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectMention(u)}
                    >
                      <div className="zbot-mention-item-avatar">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="zbot-mention-item-details">
                        <span className="zbot-mention-item-name">{u.name}</span>
                        <span className="zbot-mention-item-role">
                          {(u.role || "").replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Form onSubmit={handleSendMessage}>
                <Form.Control
                  as="textarea"
                  ref={textAreaRef}
                  rows={1}
                  placeholder={`Write to ${chatTitle}...`}
                  value={newMessage}
                  onChange={handleTextChange}
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
                    <button type="button" className="toolbar-btn mention-btn" title="Mention member" onClick={handleMentionBtnClick}>
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

      {activeMsgMenu && (
        <>
          <div className="zbot-context-menu-backdrop" onClick={() => setActiveMsgMenu(null)} />
          <div
            className="zbot-message-context-menu"
            style={{
              position: "fixed",
              top: activeMsgMenu.pos.y,
              left: activeMsgMenu.pos.x,
              zIndex: 10000,
            }}
          >
            {isMyMessage(activeMsgMenu.message) && (
              <div className="zbot-context-menu-item" onClick={() => handleStartEdit(activeMsgMenu.message)}>
                <div className="d-flex align-items-center gap-2">
                  <Pencil size={13} />
                  <span>Edit</span>
                </div>
                <span className="shortcut">E</span>
              </div>
            )}
            <div className="zbot-context-menu-item" onClick={handleMarkUnread}>
              <div className="d-flex align-items-center gap-2">
                <MessageSquare size={13} />
                <span>Mark as unread</span>
              </div>
              <span className="shortcut">U</span>
            </div>
            <div className="zbot-context-menu-item" onClick={() => handleCopyLink(activeMsgMenu.message)}>
              <div className="d-flex align-items-center gap-2">
                <Link2 size={13} />
                <span>Copy link</span>
              </div>
              <span className="shortcut">C</span>
            </div>
            
            <div className="zbot-context-menu-divider" />
            
            <div className="zbot-context-menu-item has-submenu">
              <div className="d-flex align-items-center gap-2">
                <ArrowUpDown size={13} />
                <span>Add relationship</span>
              </div>
              <ChevronRight size={12} className="submenu-arrow" />
              <div className="zbot-context-submenu">
                <div className="zbot-context-submenu-item" onClick={() => handleAddRelationship("Task")}>Task</div>
                <div className="zbot-context-submenu-item" onClick={() => handleAddRelationship("Doc")}>Doc</div>
                <div className="zbot-context-submenu-item" onClick={() => handleAddRelationship("Space")}>Space</div>
              </div>
            </div>

            <div className="zbot-context-menu-item has-submenu">
              <div className="d-flex align-items-center gap-2">
                <Clock size={13} />
                <span>Remind me in Inbox</span>
              </div>
              <ChevronRight size={12} className="submenu-arrow" />
              <div className="zbot-context-submenu">
                <div className="zbot-context-submenu-item" onClick={() => handleRemindMe("in 20 minutes")}>In 20 mins</div>
                <div className="zbot-context-submenu-item" onClick={() => handleRemindMe("in 1 hour")}>In 1 hour</div>
                <div className="zbot-context-submenu-item" onClick={() => handleRemindMe("tomorrow")}>Tomorrow</div>
              </div>
            </div>

            <div className="zbot-context-menu-item" onClick={() => {
              toast.success("You will now receive notifications for replies to this message");
              setActiveMsgMenu(null);
            }}>
              <div className="d-flex align-items-center gap-2">
                <Bell size={13} />
                <span>Get notified about new replies</span>
              </div>
            </div>

            {isMyMessage(activeMsgMenu.message) && (
              <>
                <div className="zbot-context-menu-divider" />
                <div className="zbot-context-menu-item text-danger" onClick={() => handleDeleteMsg(activeMsgMenu.message.id)}>
                  <div className="d-flex align-items-center gap-2">
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </div>
                  <span className="shortcut">Del</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal for Messages */}
      <DeleteConfirmModal
        show={showDeleteMsgModal}
        onHide={() => {
          setShowDeleteMsgModal(false);
          setMsgIdToDelete(null);
        }}
        onConfirm={handleConfirmDeleteMsg}
        title="Delete Message"
        message="Are you sure you want to permanently delete this message?"
        confirmText="Delete"
        loading={deletingMsg}
      />
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
