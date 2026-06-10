import React, { useState, useEffect, useCallback, useRef } from "react";
import { Spinner, Alert } from "react-bootstrap";
import { getMessageLogs } from "../../../services/administrationService";
import { useAuth } from "../../../context/AuthContext";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import "../../../styles/Messaging.css";

const MessageLogPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchLogs = useCallback(async () => {
    try {
      const data = await getMessageLogs();
      setConversations(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load message logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation]);

  const formatMessageTime = (isoString) => {
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

  return (
    <div className="messaging-layout">
      <div className="conversation-sidebar">
        <div className="card-header">
          <h5 className="mb-0">All Conversations</h5>
        </div>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          onSelect={(id) =>
            setActiveConversation(conversations.find((c) => c.id === id))
          }
          loading={loading}
          error={error}
        />
      </div>
      <div className="chat-window-area">
        {!activeConversation ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
            Select a conversation to view the message log.
          </div>
        ) : (
          <>
            <div className="chat-header">
              <h5>{activeConversation.participant_names}</h5>
            </div>
            <div className="chat-messages">
              {activeConversation.messages.map((msg) => {
                const isMe = isMyMessage(msg);
                return (
                  <div
                    key={msg.id}
                    className={`message-bubble ${isMe ? "sent" : "received"}`}
                  >
                    <div className="message-content">
                      {!isMe && (
                        <div className="sender-name">{msg.sender_name}</div>
                      )}
                      <p
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.content}
                      </p>
                      <div className="timestamp">
                        {formatMessageTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area text-center text-muted fst-italic py-3">
              This is a read-only log for administrative purposes.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ConversationList = ({
  conversations,
  activeConversationId,
  onSelect,
  loading,
  error,
}) => {
  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    return format(parseISO(isoString), "p");
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="conversation-list list-group list-group-flush">
      {conversations.length > 0 ? (
        conversations.map((convo) => (
          <div
            key={convo.id}
            className={`list-group-item list-group-item-action ${
              convo.id === activeConversationId ? "active" : ""
            }`}
            onClick={() => onSelect(convo.id)}
            style={{ cursor: "pointer" }}
          >
            <div className="d-flex w-100 justify-content-between">
              <h6 className="mb-1 text-truncate">{convo.participant_names}</h6>
              <small>{formatTimestamp(convo.last_message_time)}</small>
            </div>
            <p className="mb-1 text-muted text-truncate">
              {convo.last_message}
            </p>
          </div>
        ))
      ) : (
        <div className="p-4 text-center text-muted">
          No messages have been logged yet.
        </div>
      )}
    </div>
  );
};

export default MessageLogPage;
