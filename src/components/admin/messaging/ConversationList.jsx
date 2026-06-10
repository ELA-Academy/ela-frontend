import React from "react";
import { ListGroup, Badge, Spinner } from "react-bootstrap";
import { format, parseISO } from "date-fns";

const ConversationList = ({
  conversations,
  activeConversationId,
  onSelect,
  loading,
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

  return (
    <ListGroup variant="flush" className="conversation-list">
      {conversations.length > 0 ? (
        conversations.map((convo) => (
          <ListGroup.Item
            key={convo.id}
            action
            active={convo.id === activeConversationId}
            onClick={() => onSelect(convo.id)}
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto conversation-details">
              <div className="fw-bold">{convo.participant_names}</div>
              <span className="last-message-preview">{convo.last_message}</span>
            </div>
            <div className="d-flex flex-column align-items-end">
              <span className="timestamp">
                {formatTimestamp(convo.last_message_time)}
              </span>
              {convo.unread_count > 0 && (
                <Badge bg="primary" pill>
                  {convo.unread_count}
                </Badge>
              )}
            </div>
          </ListGroup.Item>
        ))
      ) : (
        <div className="p-4 text-center text-muted">No conversations yet.</div>
      )}
    </ListGroup>
  );
};

export default ConversationList;
