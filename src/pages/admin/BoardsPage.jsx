import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Plus, Shapes, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import CreateChannelModal from "../../components/admin/workspace/CreateChannelModal";
import SpaceSettingsModal from "../../components/admin/workspace/SpaceSettingsModal";
import WorkspaceSecondarySidebar from "../../components/admin/workspace/WorkspaceSecondarySidebar";
import {
  createBoard,
  deleteBoard,
  getAllBoardTasks,
  getBoards,
} from "../../services/boardService";
import NewConversationModal from "../../components/admin/messaging/NewConversationModal";
import { getAllDepartments } from "../../services/departmentService";
import { createChannel, getConversations, getUsersForMessaging } from "../../services/messagingService";
import "../../styles/Boards.css";
import "../../styles/WorkspaceShell.css";

const BoardsPage = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);

  const fetchWorkspaceOverview = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");
      const [boardData, taskData, conversationData, departmentData, messagingUsers] = await Promise.all([
        getBoards(),
        getAllBoardTasks(),
        getConversations(),
        getAllDepartments(),
        getUsersForMessaging(),
      ]);
      setBoards(Array.isArray(boardData) ? boardData : []);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setConversations(Array.isArray(conversationData) ? conversationData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
      setWorkspaceMembers(
        (Array.isArray(messagingUsers) ? messagingUsers : []).map((participant) => {
          const [role, rawId] = participant.id.split("_");
          return {
            id: Number(rawId),
            role,
            name: participant.name,
            email: participant.email || "",
          };
        })
      );
    } catch (fetchError) {
      setError("Failed to load the workspace overview.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchWorkspaceOverview(true);
  }, [fetchWorkspaceOverview]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) {
        return;
      }
      fetchWorkspaceOverview(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchWorkspaceOverview]);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completed = tasks.filter((task) => task.status === "Done").length;
    const inProgress = tasks.filter((task) => task.status === "In Progress").length;
    const overdue = tasks.filter((task) => {
      if (!task.due_date || task.status === "Done") return false;
      return new Date(`${task.due_date}T23:59:59`) < new Date();
    }).length;

    return {
      spaces: boards.length,
      totalTasks,
      completed,
      inProgress,
      progress: totalTasks ? Math.round((completed / totalTasks) * 100) : 0,
      overdue,
    };
  }, [boards, tasks]);

  const handleCreate = async (payload) => {
    if (!payload.name.trim() || creatingBoard) return;
    try {
      setCreatingBoard(true);
      setError("");
      const created = await createBoard(payload);
      setShowModal(false);
      fetchWorkspaceOverview(false);
      navigate(`/admin/boards/${created.id}`);
    } catch (createError) {
      setError(createError.response?.data?.error || "Failed to create space.");
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleCreateChannel = async (payload) => {
    try {
      setCreatingChannel(true);
      setError("");
      await createChannel(payload);
      setShowCreateChannelModal(false);
      fetchWorkspaceOverview(false);
    } catch (createError) {
      setError(createError.response?.data?.error || "Failed to create channel.");
    } finally {
      setCreatingChannel(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!boardToDelete) return;
    try {
      setDeleting(true);
      setError("");
      await deleteBoard(boardToDelete.id);
      setShowDeleteModal(false);
      setBoardToDelete(null);
      fetchWorkspaceOverview(false);
    } catch (deleteError) {
      setError("Failed to delete space.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="workspace-shell">
        <WorkspaceSecondarySidebar
          conversations={conversations}
          boards={boards}
          onCreateSpace={() => setShowModal(true)}
          onCreateChannel={() => setShowCreateChannelModal(true)}
          onNewMessage={() => setShowNewMessageModal(true)}
          loading={loading}
        />

        <div className="workspace-content-pane">
          <div className="workspace-panel workspace-hero">
            <div>
              <span className="workspace-secondary-eyebrow">All Tasks</span>
              <h1>School-wide project control center</h1>
              <p>
                This replaces the old workspace card grid with a ClickUp-style command surface:
                spaces live in the sidebar, while this page gives leadership one view of every task
                moving across admissions, accounting, administration, and beyond.
              </p>
            </div>
            <div className="workspace-hero-actions">
              <Button variant="primary" onClick={() => setShowModal(true)}>
                <Plus size={16} />
                New Space
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")} className="mt-3">
              {error}
            </Alert>
          )}

          <div className="workspace-panel">
            <div className="workspace-overview-grid">
              <div className="workspace-overview-stat">
                <span>Spaces</span>
                <strong>{stats.spaces}</strong>
              </div>
              <div className="workspace-overview-stat">
                <span>Total Tasks</span>
                <strong>{stats.totalTasks}</strong>
              </div>
              <div className="workspace-overview-stat">
                <span>In Progress</span>
                <strong>{stats.inProgress}</strong>
              </div>
              <div className="workspace-overview-stat">
                <span>Completed</span>
                <strong>{stats.progress}%</strong>
              </div>
            </div>
          </div>

          <div className="workspace-panel">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
              <div>
                <span className="workspace-secondary-eyebrow">Spaces</span>
                <h3 className="mb-1">Active spaces</h3>
                <p className="text-muted mb-0">Jump straight into any department space from here.</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : boards.length > 0 ? (
              <div className="workspace-list-summary">
                {boards.map((board) => {
                  const boardTasks = tasks.filter((task) => task.board_id === board.id);
                  const boardCompleted = boardTasks.filter((task) => task.status === "Done").length;
                  const boardProgress = boardTasks.length
                    ? Math.round((boardCompleted / boardTasks.length) * 100)
                    : 0;

                  return (
                    <div key={board.id} className="workspace-list-summary-row">
                      <div>
                        <strong className="d-block mb-1">{board.name}</strong>
                        <span className="text-muted">{board.description || "No description added yet."}</span>
                      </div>
                      <div>
                        <div className="workspace-list-progress mb-2">
                          <div style={{ width: `${boardProgress}%` }} />
                        </div>
                        <small className="text-muted fw-semibold">
                          {boardCompleted}/{boardTasks.length} tasks complete
                        </small>
                      </div>
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button variant="light" onClick={() => navigate(`/admin/boards/${board.id}`)}>
                          Open
                          <ArrowRight size={15} />
                        </Button>
                        <Button
                          variant="link"
                          className="text-danger text-decoration-none"
                          onClick={() => {
                            setBoardToDelete(board);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="workspace-message-empty">
                <div>
                  <Shapes size={34} className="mb-3" />
                  <h3>Create your first space</h3>
                  <p className="mb-3">
                    Spaces will appear in the secondary sidebar and become the home for folders, lists,
                    and tasks across the school.
                  </p>
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} />
                    Create Space
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="workspace-panel">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
              <div>
                <span className="workspace-secondary-eyebrow">Tasks</span>
                <h3 className="mb-1">Latest school-wide tasks</h3>
                <p className="text-muted mb-0">A quick school-level list for leadership reviews.</p>
              </div>
            </div>

            <div className="group-container mb-0">
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Space</th>
                    <th>List</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 14).map((task) => (
                    <tr key={task.id} className="workspace-row">
                      <td>
                        <button
                          type="button"
                          className="workspace-inline-link"
                          onClick={() => navigate(`/admin/boards/${task.board_id}?task=${task.id}`)}
                        >
                          {task.title}
                        </button>
                      </td>
                      <td>{task.board_name}</td>
                      <td>{task.group_name}</td>
                      <td>{task.assignee_name || "Unassigned"}</td>
                      <td>{task.status}</td>
                      <td>{task.priority || "Normal"}</td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-status-cell">
                        No board tasks have been created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <SpaceSettingsModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleCreate}
        title="Create Space"
        submitLabel="Create Space"
        submitting={creatingBoard}
        members={workspaceMembers}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setBoardToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Space"
        message={
          boardToDelete
            ? `Are you sure you want to permanently delete the space "${boardToDelete.name}"? All lists and tasks inside it will be removed.`
            : ""
        }
        loading={deleting}
      />

      <NewConversationModal
        show={showNewMessageModal}
        handleClose={() => setShowNewMessageModal(false)}
        onConversationStarted={(conversationId) => {
          setShowNewMessageModal(false);
          fetchWorkspaceOverview(false);
          navigate(`/admin/messaging?conversation=${conversationId}`);
        }}
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

export default BoardsPage;
