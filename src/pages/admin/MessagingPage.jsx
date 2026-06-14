import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { MessageSquareText, Plus } from "lucide-react";

import ChatWindow from "../../components/admin/messaging/ChatWindow";
import { useWorkspace } from "../../components/admin/workspace/WorkspaceLayout";
import "../../styles/Messaging.css";
import "../../styles/WorkspaceShell.css";
import "../../styles/Boards.css";

const MessagingPage = () => {
  const [searchParams] = useSearchParams();
  const {
    conversations,
    workspaceLoading: loading,
    openCreateChannelModal,
    openNewMessageModal,
  } = useWorkspace();

  const activeConversationId = Number(searchParams.get("conversation")) || null;

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [conversations, activeConversationId]
  );

  return (
    <>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 0' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row" style={{ padding: '16px 20px', background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0' }}>
              <div className="skeleton-loader skeleton-avatar" />
              <div style={{ flex: 1 }}>
                <div className="skeleton-loader skeleton-text" style={{ width: `${60 + i * 5}%`, marginBottom: 6 }} />
                <div className="skeleton-loader skeleton-text-sm" style={{ width: `${40 + i * 3}%` }} />
              </div>
              <div className="skeleton-loader" style={{ width: 50, height: 10, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : activeConversationId && activeConversation ? (
        <div className="workspace-message-panel">
          <ChatWindow
            conversationId={activeConversationId}
            conversation={activeConversation}
            key={activeConversationId}
          />
        </div>
      ) : (
        <div className="workspace-message-empty">
          <div>
            <h3>Select a conversation</h3>
            <p className="mb-0">
              Choose a channel, department thread, or direct message from the workspace sidebar.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagingPage;

