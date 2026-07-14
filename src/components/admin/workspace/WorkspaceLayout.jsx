import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getBoards } from "../../../services/boardService";
import { getConversations, getAuditConversations, getUsersForMessaging, createChannel } from "../../../services/messagingService";
import { getAllDepartments } from "../../../services/departmentService";
import WorkspaceSecondarySidebar from "./WorkspaceSecondarySidebar";
import SpaceSettingsModal from "./SpaceSettingsModal";
import CreateChannelModal from "./CreateChannelModal";
import CreateTaskModal from "./CreateTaskModal";
import NewConversationModal from "../../admin/messaging/NewConversationModal";
import DeleteConfirmModal from "../DeleteConfirmModal";
import { createBoard, updateBoard, deleteBoard, createTask, createBoardFromTemplate } from "../../../services/boardService";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
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
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Secondary sidebar resizer states & logic
  const shellRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(255);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (!shellRef.current) return;
      const shellRect = shellRef.current.getBoundingClientRect();
      const newWidth = e.clientX - shellRect.left;
      if (newWidth >= 180 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Settings & Creation Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsBoard, setSettingsBoard] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  // Folder / List Creation States
  const [showCreateFolderListModal, setShowCreateFolderListModal] = useState(false);
  const [createParentId, setCreateParentId] = useState(null);
  const [createType, setCreateType] = useState("folder"); // "folder" or "list"
  const [createName, setCreateName] = useState("");
  const [creatingFolderList, setCreatingFolderList] = useState(false);

  // Rename States
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameBoardId, setRenameBoardId] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Move States
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveBoardId, setMoveBoardId] = useState(null);
  const [moveParentId, setMoveParentId] = useState(null);
  const [moveIsFolder, setMoveIsFolder] = useState(false);
  const [moveTargetParentId, setMoveTargetParentId] = useState("");
  const [moving, setMoving] = useState(false);

  // Delete States
  const [showDeleteBoardModal, setShowDeleteBoardModal] = useState(false);
  const [deleteBoardId, setDeleteBoardId] = useState(null);
  const [deleteBoardName, setDeleteBoardName] = useState("");
  const [deletingBoard, setDeletingBoard] = useState(false);

  // Global Create Task States
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const handleGlobalTaskCreated = async (groupId, payload) => {
    try {
      await createTask(groupId, payload);
      await fetchWorkspaceData(false);
    } catch (err) {
      console.error("Failed to create task globally:", err);
    }
  };

  const handleOpenCreateFolderList = (parentId, type) => {
    setCreateParentId(parentId);
    setCreateType(type);
    setCreateName("");
    setShowCreateFolderListModal(true);
  };

  const handleCreateFolderListSubmit = async (e) => {
    e.preventDefault();
    if (!createName.trim() || creatingFolderList) return;
    setCreatingFolderList(true);
    try {
      const created = await createBoard({
        name: createName.trim(),
        parent_id: createParentId,
        is_folder: createType === "folder",
        is_private: false
      });
      setShowCreateFolderListModal(false);
      await fetchWorkspaceData(false);
      if (createType === "list" && created?.id) {
        navigate(`/admin/boards/${created.id}`);
      }
    } catch (err) {
      console.error("Failed to create folder/list:", err);
    } finally {
      setCreatingFolderList(false);
    }
  };

  const handleOpenRename = (boardId, currentName) => {
    setRenameBoardId(boardId);
    setRenameName(currentName);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameName.trim() || renaming) return;
    setRenaming(true);
    try {
      await updateBoard(renameBoardId, { name: renameName.trim() });
      setShowRenameModal(false);
      await fetchWorkspaceData(false);
    } catch (err) {
      console.error("Failed to rename:", err);
    } finally {
      setRenaming(false);
    }
  };

  const handleOpenMove = (boardId, parentId, isFolder) => {
    setMoveBoardId(boardId);
    setMoveParentId(parentId);
    setMoveIsFolder(isFolder);
    setMoveTargetParentId(parentId === null ? "" : String(parentId));
    setShowMoveModal(true);
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (moving) return;
    setMoving(true);
    try {
      const targetParentId = moveTargetParentId === "" ? null : Number(moveTargetParentId);
      await updateBoard(moveBoardId, { parent_id: targetParentId });
      setShowMoveModal(false);
      await fetchWorkspaceData(false);
    } catch (err) {
      console.error("Failed to move:", err);
    } finally {
      setMoving(false);
    }
  };

  const handleOpenDeleteBoard = (boardId, name) => {
    setDeleteBoardId(boardId);
    setDeleteBoardName(name);
    setShowDeleteBoardModal(true);
  };

  const handleDeleteBoardSubmit = async () => {
    if (deletingBoard) return;
    setDeletingBoard(true);
    try {
      await deleteBoard(deleteBoardId);
      setShowDeleteBoardModal(false);
      await fetchWorkspaceData(false);
      if (activeBoardId === deleteBoardId) {
        navigate("/admin/boards");
      }
    } catch (err) {
      console.error("Failed to delete space/folder/list:", err);
    } finally {
      setDeletingBoard(false);
    }
  };

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

  // Socket.io for live updates and presence
  useEffect(() => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["polling", "websocket"] });

    socket.on("connect", () => {
      socket.emit("user_online", { id: user.id, role: user.role });
    });

    socket.on("online_users_list", (list) => {
      setOnlineUsers(list);
    });

    socket.on("conversation_updated", (data) => {
      if (data.recipient_id === user.id && data.recipient_role === user.role) {
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
  const handleOpenSettings = (board) => {
    setSettingsBoard(board);
    setShowSettingsModal(true);
  };

  const handleSettingsSubmit = async (payload) => {
    if (!payload.name?.trim() || savingSettings) return;
    setSavingSettings(true);
    try {
      if (settingsBoard) {
        // Edit existing Space, Folder or List
        await updateBoard(settingsBoard.id, payload);
      } else {
        // Create new Space
        let created;
        if (payload.from_template_id) {
          created = await createBoardFromTemplate(payload.from_template_id, {
            name: payload.name
          });
        } else {
          created = await createBoard({
            ...payload,
            parent_id: null,
            is_folder: false
          });
        }
        navigate(`/admin/boards/${created.id}`);
      }
      setShowSettingsModal(false);
      await fetchWorkspaceData(false);
    } catch (err) {
      console.error("Failed to save board settings:", err);
    } finally {
      setSavingSettings(false);
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

  const moveDestinationOptions = useMemo(() => {
    if (!showMoveModal || !moveBoardId) return [];
    
    // Spaces (boards where parent_id is null and not a folder)
    const spaces = boards.filter(b => b.parent_id === null && !b.is_folder && b.id !== moveBoardId);
    
    // Folders (boards where is_folder is true and not the item itself)
    const folders = boards.filter(b => b.is_folder && b.id !== moveBoardId);
    
    const options = [];
    
    // We can always move lists to top-level Spaces
    // Or we can move Folders to top-level Spaces (as their parent space)
    spaces.forEach(space => {
      options.push({ id: space.id, name: `Space: ${space.name}` });
    });
    
    // Only lists can be moved to folders
    if (!moveIsFolder) {
      folders.forEach(folder => {
        // Find parent space name for context
        const parentSpace = boards.find(b => b.id === folder.parent_id);
        const prefix = parentSpace ? `${parentSpace.name} > ` : "";
        options.push({ id: folder.id, name: `Folder: ${prefix}${folder.name}` });
      });
    }
    
    return options;
  }, [boards, showMoveModal, moveBoardId, moveIsFolder]);

  const settingsTitle = useMemo(() => {
    if (!settingsBoard) return "Create Space";
    if (settingsBoard.is_folder) return "Folder Settings";
    if (settingsBoard.parent_id !== null) return "List Settings";
    return "Space Settings";
  }, [settingsBoard]);

  const settingsSubmitLabel = useMemo(() => {
    if (!settingsBoard) return "Create Space";
    return "Save Settings";
  }, [settingsBoard]);

  const settingsInitialValues = useMemo(() => {
    if (!settingsBoard) return { name: "", description: "", is_private: false, access_members: [] };
    return {
      name: settingsBoard.name || "",
      description: settingsBoard.description || "",
      is_private: !!settingsBoard.is_private,
      access_members: settingsBoard.access_members || []
    };
  }, [settingsBoard]);

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
    onlineUsers,
    refreshWorkspace: () => fetchWorkspaceData(false),
    openCreateSpaceModal: () => handleOpenSettings(null),
    openSettingsModal: (board) => handleOpenSettings(board),
    openCreateChannelModal: () => setShowCreateChannelModal(true),
    openNewMessageModal: () => setShowNewMessageModal(true),
    openCreateTaskModal: () => setShowCreateTaskModal(true),
    openCreateFolderListModal: (parentId, type) => handleOpenCreateFolderList(parentId, type),
    openRenameModal: (boardId, currentName) => handleOpenRename(boardId, currentName),
    openMoveModal: (boardId, parentId, isFolder) => handleOpenMove(boardId, parentId, isFolder),
    openDeleteBoardModal: (boardId, name) => handleOpenDeleteBoard(boardId, name),
  };

  return (
    <>
      <div 
        ref={shellRef}
        className="workspace-shell"
        style={{ "--sidebar-width": `${sidebarWidth}px` }}
      >
        <WorkspaceSecondarySidebar
          conversations={conversations}
          onlineUsers={onlineUsers}
          auditConversations={auditConversations}
          boards={boards}
          selectedBoardId={activeBoardId}
          selectedBoardGroups={activeBoard?.groups || []}
          activeConversationId={activeConversationId}
          onCreateSpace={() => handleOpenSettings(null)}
          onCreateChannel={() => setShowCreateChannelModal(true)}
          onNewMessage={() => setShowNewMessageModal(true)}
          onCreateFolderList={handleOpenCreateFolderList}
          onRename={handleOpenRename}
          onMove={handleOpenMove}
          onSettings={handleOpenSettings}
          onDeleteBoard={handleOpenDeleteBoard}
          onGlobalCreateTask={() => setShowCreateTaskModal(true)}
          onRefreshWorkspace={() => fetchWorkspaceData(false)}
          loading={workspaceLoading}
        />

        <div 
          className={`sidebar-resizer ${isResizing ? "resizing" : ""}`}
          onMouseDown={startResizing}
        />

        <div className="workspace-content-pane">
          <Outlet context={outletContext} />
        </div>
      </div>

      <CreateTaskModal
        show={showCreateTaskModal}
        onHide={() => setShowCreateTaskModal(false)}
        boards={boards.filter(b => !b.is_folder)}
        members={assignees}
        onTaskCreated={handleGlobalTaskCreated}
        initialBoardId={activeBoardId}
      />

      <SpaceSettingsModal
        show={showSettingsModal}
        onHide={() => setShowSettingsModal(false)}
        onSubmit={handleSettingsSubmit}
        title={settingsTitle}
        submitLabel={settingsSubmitLabel}
        submitting={savingSettings}
        initialValues={settingsInitialValues}
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

      {/* Create Folder/List Modal */}
      <Modal show={showCreateFolderListModal} onHide={() => setShowCreateFolderListModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create {createType === "folder" ? "Folder" : "List"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateFolderListSubmit}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>{createType === "folder" ? "Folder Name" : "List Name"}</Form.Label>
              <Form.Control
                type="text"
                placeholder={`Enter ${createType} name`}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateFolderListModal(false)} disabled={creatingFolderList}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={creatingFolderList}>
              {creatingFolderList ? <Spinner animation="border" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Rename Modal */}
      <Modal show={showRenameModal} onHide={() => setShowRenameModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rename Item</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRenameSubmit}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>New Name</Form.Label>
              <Form.Control
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRenameModal(false)} disabled={renaming}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={renaming}>
              {renaming ? <Spinner animation="border" size="sm" /> : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Move Modal */}
      <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Move {moveIsFolder ? "Folder" : "List"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleMoveSubmit}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Select Destination Space {!moveIsFolder && "or Folder"}</Form.Label>
              <Form.Select
                value={moveTargetParentId}
                onChange={(e) => setMoveTargetParentId(e.target.value)}
                required
              >
                <option value="">-- Choose Destination --</option>
                {moveDestinationOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMoveModal(false)} disabled={moving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={moving || !moveTargetParentId}>
              {moving ? <Spinner animation="border" size="sm" /> : "Move"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={showDeleteBoardModal}
        onHide={() => setShowDeleteBoardModal(false)}
        onConfirm={handleDeleteBoardSubmit}
        title="Delete Confirmation"
        message={`Are you sure you want to permanently delete "${deleteBoardName}"? This will delete all lists, groups, and tasks contained inside it. This action cannot be undone.`}
        confirmText="Delete"
        loading={deletingBoard}
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
