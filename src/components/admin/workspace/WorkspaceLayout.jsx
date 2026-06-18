import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getBoards } from "../../../services/boardService";
import { getConversations, getAuditConversations, getUsersForMessaging, createChannel } from "../../../services/messagingService";
import { getAllDepartments } from "../../../services/departmentService";
import WorkspaceSecondarySidebar from "./WorkspaceSecondarySidebar";
import CreateChannelModal from "./CreateChannelModal";
import SpaceSettingsModal from "./SpaceSettingsModal";
import NewConversationModal from "../../admin/messaging/NewConversationModal";
import { createBoard } from "../../../services/boardService";
import { io } from "socket.io-client";
import "../../../styles/WorkspaceShell.css";

/**
 * WorkspaceLayout wraps all workspace pages (/admin/boards, /admin/boards/:boardId, /admin/messaging).
 * It renders the secondary sidebar once and passes shared workspace data via useOutletContext.
 * Child pages no longer need to fetch or render the sidebar themselves.
 */
const WorkspaceLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Shared workspace data
  const [boards, setBoards] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [auditConversations, setAuditConversations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);

  // Modals
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  // Derive active board ID from URL
  const boardIdMatch = location.pathname.match(/\/admin\/boards\/(\d+)/);
  const activeBoardId = boardIdMatch ? Number(boardIdMatch[1]) : null;

  // Derive active conversation ID from search params
  const searchParams = new URLSearchParams(location.search);
  const activeConversationId = Number(searchParams.get("conversation")) || null;

  // Find active board's groups for sidebar expansion
  const activeBoard = useMemo(
    () => boards.find((b) => b.id === activeBoardId),
    [boards, activeBoardId]
  );

  const fetchWorkspaceData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setWorkspaceLoading(true);
      const [boardData, conversationData, auditConversationData, departmentData, messagingUsers] = await Promise.all([
        getBoards(),
        getConversations(),
        user?.role === "superadmin" ? getAuditConversations() : Promise.resolve([]),
        getAllDepartments(),
        getUsersForMessaging(),
      ]);

      setBoards(Array.isArray(boardData) ? boardData : []);
      setConversations(Array.isArray(conversationData) ? conversationData : []);
      setAuditConversations(Array.isArray(auditConversationData) ? auditConversationData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);

      const normalizedAssignees = [
        {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
        },
        ...(Array.isArray(messagingUsers) ? messagingUsers : []).map((p) => {
          const [pRole, rawId] = p.id.split("_");
          return { id: Number(rawId), role: pRole, name: p.name, email: p.email || "" };
        }),
      ].filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id && x.role === p.role) === i
      );
      setAssignees(normalizedAssignees);
    } catch (err) {
      console.error("Failed to load workspace data:", err);
    } finally {
      if (showLoading) setWorkspaceLoading(false);
    }
  }, [user?.id, user?.role, user?.name, user?.email]);

  // Initial fetch
  useEffect(() => {
    fetchWorkspaceData(true);
  }, [fetchWorkspaceData]);

  // Socket.io for live updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["polling"] });

    socket.on("conversation_updated", (data) => {
      if (user && data.recipient_id === user.id && data.recipient_role === user.role) {
        fetchWorkspaceData(false);
      }
    });

    return () => socket.disconnect();
  }, [fetchWorkspaceData, user]);

  // Periodic refresh (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) fetchWorkspaceData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchWorkspaceData]);

  // Handlers for sidebar modals
  const handleCreateSpace = async (payload) => {
    if (!payload.name?.trim() || creatingSpace) return;
    try {
      setCreatingSpace(true);
      const created = await createBoard(payload);
      setShowCreateSpaceModal(false);
      fetchWorkspaceData(false);
      navigate(`/admin/boards/${created.id}`);
    } catch (err) {
      console.error("Failed to create space:", err);
    } finally {
      setCreatingSpace(false);
    }
  };

  const handleCreateChannel = async (payload) => {
    try {
      setCreatingChannel(true);
      const created = await createChannel(payload);
      setShowCreateChannelModal(false);
      fetchWorkspaceData(false);
      navigate(`/admin/messaging?conversation=${created.id}`);
    } catch (err) {
      console.error("Failed to create channel:", err);
    } finally {
      setCreatingChannel(false);
    }
  };

  const handleConversationStarted = (newConversationId) => {
    fetchWorkspaceData(false);
    setShowNewMessageModal(false);
    navigate(`/admin/messaging?conversation=${newConversationId}`);
  };

  // Context passed to child pages
  const outletContext = {
    boards,
    setBoards,
    conversations,
    auditConversations,
    setConversations,
    departments,
    assignees,
    workspaceLoading,
    refreshWorkspace: () => fetchWorkspaceData(false),
    openCreateSpaceModal: () => setShowCreateSpaceModal(true),
    openCreateChannelModal: () => setShowCreateChannelModal(true),
    openNewMessageModal: () => setShowNewMessageModal(true),
  };

  return (
    <>
      <div className="workspace-shell">
        <WorkspaceSecondarySidebar
          conversations={conversations}
          auditConversations={auditConversations}
          boards={boards}
          selectedBoardId={activeBoardId}
          selectedBoardGroups={activeBoard?.groups || []}
          activeConversationId={activeConversationId}
          onCreateSpace={() => setShowCreateSpaceModal(true)}
          onCreateChannel={() => setShowCreateChannelModal(true)}
          onNewMessage={() => setShowNewMessageModal(true)}
          loading={workspaceLoading}
        />

        <div className="workspace-content-pane">
          <Outlet context={outletContext} />
        </div>
      </div>

      <SpaceSettingsModal
        show={showCreateSpaceModal}
        onHide={() => setShowCreateSpaceModal(false)}
        onSubmit={async (payload) => {
          await handleCreateSpace(payload);
        }}
        title="Create Space"
        submitLabel="Create Space"
        submitting={creatingSpace}
        initialValues={{ name: "", description: "", is_private: false, access_members: [] }}
        members={assignees}
      />

      <CreateChannelModal
        show={showCreateChannelModal}
        onHide={() => setShowCreateChannelModal(false)}
        onSubmit={handleCreateChannel}
        departments={departments}
        submitting={creatingChannel}
      />

      <NewConversationModal
        show={showNewMessageModal}
        handleClose={() => setShowNewMessageModal(false)}
        onConversationStarted={handleConversationStarted}
      />
    </>
  );
};

export default WorkspaceLayout;

/**
 * Custom hook for child pages to access workspace context.
 * Usage: const { boards, conversations, assignees, refreshWorkspace } = useWorkspace();
 */
export const useWorkspace = () => {
  return useOutletContext();
};
