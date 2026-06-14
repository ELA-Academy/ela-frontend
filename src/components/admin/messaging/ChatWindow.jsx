import React, { useState, useEffect, useRef, useCallback } from "react";
import { Form, Alert } from "react-bootstrap";
import { SendFill } from "react-bootstrap-icons";
import { getMessages, sendMessage } from "../../../services/messagingService";
import { useAuth } from "../../../context/AuthContext";
import useAutosizeTextArea from "../../../hooks/useAutosizeTextArea";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ChatSkeleton } from "../../Skeleton";
import { io } from "socket.io-client";
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
  Calendar,
  Phone
} from "lucide-react";

// A global, persistent in-memory cache to store conversation histories
const globalMessageCache = {};

const ChatWindow = ({ conversationId, conversation }) => {
  const [messages, setMessages] = useState(() => {
    return globalMessageCache[conversationId] || [];
  });
  const [newMessage, setNewMessage] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Only show the main spinner on the absolute first load when we have no cached messages
  const [loading, setLoading] = useState(() => {
    return !globalMessageCache[conversationId];
  });

  const [error, setError] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const textAreaRef = useRef(null);

  useAutosizeTextArea(textAreaRef.current, newMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(
    async (isInitialLoad = false) => {
      if (!conversationId) return;

      // If we already have cached messages, we do not show the loading spinner to make the UX feel instant!
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

  useEffect(() => {
    if (!conversationId) return;

    fetchMessages(true);

    const socketUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"]
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
    scrollToBottom();
  }, [messages]);

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

  if (!conversationId) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-muted">
        Select a conversation to start chatting.
      </div>
    );
  }

  if (loading) {
    return <ChatSkeleton count={4} />;
  }

  return (
    <div className="clickup-chat-layout">
      {/* ClickUp Header Panel with Tabs */}
      <div className="clickup-chat-header">
        <div className="clickup-header-left">
          <div className="clickup-header-avatar">
            {chatInitial}
          </div>
          <div className="clickup-header-info">
            <h5>{chatTitle}</h5>
            <span className="clickup-header-status-dot" />
          </div>
        </div>
        <div className="clickup-header-tabs">
          <button className="clickup-header-tab active">Chat</button>
          <button className="clickup-header-tab">Calendar</button>
          <button className="clickup-header-tab">Tasks</button>
        </div>
      </div>

      {/* Messages Scroll pane */}
      <div className="clickup-chat-messages">
        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        {/* Intro Banner at top of thread */}
        <div className="clickup-intro-section">
          <div className="clickup-intro-avatar">
            {chatInitial}
          </div>
          <h3>Chat with {chatTitle}</h3>
          <p className="clickup-intro-subtitle">
            This conversation started on {format(parseISO(conversation?.created_at || new Date().toISOString()), "MMMM d, yyyy")}.
          </p>
          <button type="button" className="clickup-intro-btn">
            <User size={13} /> View Profile
          </button>

          <div className="clickup-intro-cards">
            <div className="clickup-intro-card pink-card">
              <div className="card-icon pink-icon">
                <Calendar size={18} />
              </div>
              <div className="card-details">
                <strong>View Calendar</strong>
                <span>Find time to meet or just grab some coffee</span>
              </div>
            </div>
            <div className="clickup-intro-card green-card">
              <div className="card-icon green-icon">
                <Phone size={18} />
              </div>
              <div className="card-details">
                <strong>Start SyncUp</strong>
                <span>Jump on a voice call or video call</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="clickup-messages-list">
          {messages.map((msg) => {
            const isMe = isMyMessage(msg);
            return (
              <div
                key={msg.id}
                className={`clickup-message-row ${msg.status === "sending" ? "sending" : ""} ${
                  msg.status === "failed" ? "failed" : ""
                } ${isMe ? "is-me" : ""}`}
              >
                <div className="clickup-message-avatar">
                  {(msg.sender_name || "U").substring(0, 2).toUpperCase()}
                </div>
                <div className="clickup-message-body">
                  <div className="clickup-message-header">
                    <span className="clickup-message-sender">{msg.sender_name}</span>
                    <span className="clickup-message-time">
                      {formatMessageTime(msg.created_at, msg.status)}
                    </span>
                  </div>
                  <div className="clickup-message-content">
                    <p
                      style={{
                        color: msg.status === "failed" ? "red" : "inherit",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ClickUp Footer with greeting banner and dark panel input */}
      <div className="clickup-chat-footer">
        {!bannerDismissed && (
          <div className="clickup-footer-banner">
            <span>👋 Send a message to #{chatTitle} to get the conversation started!</span>
            <button className="clickup-banner-dismiss-btn" type="button" onClick={() => setBannerDismissed(true)}>
              Dismiss
            </button>
          </div>
        )}

        <div className="clickup-input-card">
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
              className="clickup-textarea"
            />

            <div className="clickup-toolbar-container">
              <div className="clickup-toolbar-left">
                <button type="button" className="toolbar-btn plus-btn" title="Add attachment">
                  <Plus size={16} />
                </button>
                <button type="button" className="toolbar-btn emoji-btn" title="AI helper">
                  <Sparkles size={14} />
                </button>
                <button type="button" className="toolbar-btn mention-btn" title="Mention member">
                  <AtSign size={14} />
                </button>
                <button type="button" className="toolbar-btn paperclip-btn" title="Attach file">
                  <Paperclip size={14} />
                </button>
                <button type="button" className="toolbar-btn mail-btn" title="Send email copy">
                  <Mail size={14} />
                </button>
                <button type="button" className="toolbar-btn voice-btn" title="Record audio">
                  <Mic size={14} />
                </button>
                <button type="button" className="toolbar-btn checklist-btn" title="Add checklist">
                  <CheckSquare size={14} />
                </button>
                <button type="button" className="toolbar-btn video-btn" title="Record video">
                  <Video size={14} />
                </button>
              </div>
              <div className="clickup-toolbar-right">
                <button type="submit" className="clickup-send-btn" disabled={!newMessage.trim()} title="Send message">
                  <SendFill size={13} />
                </button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
