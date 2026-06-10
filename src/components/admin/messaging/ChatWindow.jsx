import React, { useState, useEffect, useRef, useCallback } from "react";
import { Form, Button, InputGroup, Alert } from "react-bootstrap";
import { SendFill } from "react-bootstrap-icons";
import { getMessages, sendMessage } from "../../../services/messagingService";
import { useAuth } from "../../../context/AuthContext";
import useAutosizeTextArea from "../../../hooks/useAutosizeTextArea";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ChatSkeleton } from "../../Skeleton";

// A global, persistent in-memory cache to store conversation histories
// This ensures that switching between chats is completely instantaneous and has zero loading screen!
const globalMessageCache = {};

const ChatWindow = ({ conversationId, conversation }) => {
  const [messages, setMessages] = useState(() => {
    return globalMessageCache[conversationId] || [];
  });
  const [newMessage, setNewMessage] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  
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
          // Extremely fast comparison to avoid heavy stringification
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
          
          // No changes, keep the exact same array reference
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
    if (conversationId) {
      fetchMessages(true);

      const interval = setInterval(() => {
        if (document.hidden || inputFocused || newMessage.trim()) {
          return;
        }
        fetchMessages(false);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [conversationId, fetchMessages, inputFocused, newMessage]);

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
    // THIS IS THE FIX: Check both sender_type AND sender_id
    return user.role === msg.sender_type && user.id === msg.sender_id;
  };

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
    <>
      <div className="chat-header">
        <h5>{conversation?.title || conversation?.participant_names || "Chat"}</h5>
      </div>
      <div className="chat-messages">
        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}
        {messages.map((msg) => {
          const isMe = isMyMessage(msg);
          return (
            <div
              key={msg.id}
              className={`message-bubble ${isMe ? "sent" : "received"} ${
                msg.status === "sending" ? "sending" : ""
              }`}
            >
              <div className="message-content">
                {!isMe && <div className="sender-name">{msg.sender_name}</div>}
                <p
                  style={{
                    color: msg.status === "failed" ? "red" : "inherit",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </p>
                <div className="timestamp">
                  {formatMessageTime(msg.created_at, msg.status)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <Form onSubmit={handleSendMessage}>
          <InputGroup>
            <Form.Control
              as="textarea"
              ref={textAreaRef}
              rows={1}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <Button
              variant="primary"
              type="submit"
              className="rounded-circle ms-2"
            >
              <SendFill />
            </Button>
          </InputGroup>
        </Form>
      </div>
    </>
  );
};

export default ChatWindow;
