import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquareText, Plus } from "lucide-react";

import ChatWindow from "../../components/admin/messaging/ChatWindow";
import NewConversationModal from "../../components/admin/messaging/NewConversationModal";
import CreateChannelModal from "../../components/admin/workspace/CreateChannelModal";
import WorkspaceSecondarySidebar from "../../components/admin/workspace/WorkspaceSecondarySidebar";
import { getBoards } from "../../services/boardService";
import { getAllDepartments } from "../../services/departmentService";
import { createChannel, getConversations } from "../../services/messagingService";
import "../../styles/Messaging.css";
import "../../styles/WorkspaceShell.css";

const MessagingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [boards, setBoards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);

  const activeConversationId = Number(searchParams.get("conversation")) || null;

  const fetchWorkspaceData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");
      const [conversationData, boardData, departmentData] = await Promise.all([
        getConversations(),
        getBoards(),
        getAllDepartments(),
      ]);
      setConversations(Array.isArray(conversationData) ? conversationData : []);
      setBoards(Array.isArray(boardData) ? boardData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
    } catch (fetchError) {
      setError("Failed to load workspace conversations.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchWorkspaceData(true);
  }, [fetchWorkspaceData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) {
        return;
      }
      fetchWorkspaceData(false);
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchWorkspaceData]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const handleConversationStarted = (newConversationId) => {
    fetchWorkspaceData(false);
    setSearchParams({ conversation: String(newConversationId) });
  };

  const handleCreateChannel = async (payload) => {
    try {
      setCreatingChannel(true);
      setError("");
      const created = await createChannel(payload);
      setShowCreateChannelModal(false);
      fetchWorkspaceData(false);
      setSearchParams({ conversation: String(created.id) });
    } catch (createError) {
      setError(createError.response?.data?.error || "Failed to create channel.");
    } finally {
      setCreatingChannel(false);
    }
  };

  return (
    <>
      <div className="workspace-shell">
        <WorkspaceSecondarySidebar
          conversations={conversations}
          boards={boards}
          activeConversationId={activeConversationId}
          onCreateSpace={() => navigate("/admin/boards")}
          onCreateChannel={() => setShowCreateChannelModal(true)}
          onNewMessage={() => setShowNewModal(true)}
          loading={loading}
        />

        <div className="workspace-content-pane">
          <div className="workspace-panel workspace-hero">
            <div>
              <span className="workspace-secondary-eyebrow">Messaging</span>
              <h1>Channels, departments, and direct messages</h1>
              <p>
                Public channels stay visible across the school, department threads stay restricted
                to assigned teams, and superadmins can review everything from one place.
              </p>
            </div>
            <div className="workspace-hero-actions">
              <Button variant="light" onClick={() => setShowCreateChannelModal(true)}>
                <Plus size={16} />
                New Channel
              </Button>
              <Button variant="primary" onClick={() => setShowNewModal(true)}>
                <MessageSquareText size={16} />
                New Message
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")} className="mt-3">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="workspace-message-empty">
              <div>
                <Spinner animation="border" />
                <p className="mt-3 mb-0">Loading workspace conversations...</p>
              </div>
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
        </div>
      </div>

      <NewConversationModal
        show={showNewModal}
        handleClose={() => setShowNewModal(false)}
        onConversationStarted={handleConversationStarted}
      />

      <CreateChannelModal
        show={showCreateChannelModal}
        onHide={() => setShowCreateChannelModal(false)}
        onSubmit={handleCreateChannel}
        departments={departments}
        submitting={creatingChannel}
      />
    </>
  );
};

export default MessagingPage;
