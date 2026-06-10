import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Dropdown, Spinner } from "react-bootstrap";
import {
  Calendar3,
  ChatFill,
  CheckCircleFill,
  PaletteFill,
  Plus,
  Trash,
} from "react-bootstrap-icons";
import { FileText, LayoutList, Kanban } from "lucide-react";

import UpdatesDrawer from "../../components/admin/UpdatesDrawer";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import NewConversationModal from "../../components/admin/messaging/NewConversationModal";
import CreateChannelModal from "../../components/admin/workspace/CreateChannelModal";
import SpaceSettingsModal from "../../components/admin/workspace/SpaceSettingsModal";
import WorkspaceSecondarySidebar from "../../components/admin/workspace/WorkspaceSecondarySidebar";
import { useAuth } from "../../context/AuthContext";
import {
  createBoard,
  createGroup,
  createTask,
  deleteGroup,
  deleteTask,
  getBoard,
  getBoards,
  updateBoard,
  updateGroup,
  updateTask,
} from "../../services/boardService";
import { getAllDepartments } from "../../services/departmentService";
import { createChannel, getConversations, getUsersForMessaging } from "../../services/messagingService";
import "../../styles/Boards.css";
import "../../styles/WorkspaceShell.css";

const STATUS_OPTIONS = ["Not Started", "In Progress", "Done"];
const PRIORITY_OPTIONS = ["Urgent", "High", "Normal", "Low"];

const STATUS_META = {
  "Not Started": { label: "To do", className: "badge-status-todo", color: "#7c8798" },
  "In Progress": { label: "In progress", className: "badge-status-progress", color: "#6d45f7" },
  Done: { label: "Complete", className: "badge-status-ready", color: "#00b67a" },
};

const PRIORITY_META = {
  Urgent: { className: "badge-priority-urgent", label: "Urgent" },
  High: { className: "badge-priority-high", label: "High" },
  Normal: { className: "badge-priority-normal", label: "Normal" },
  Low: { className: "badge-priority-low", label: "Low" },
};

const VIEW_OPTIONS = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "list", label: "List", icon: LayoutList },
  { key: "board", label: "Board", icon: Kanban },
];

const BOARD_COLORS = ["#673de6", "#00ca72", "#ff9f1a", "#ff59a3", "#1a73e8", "#ff3860"];

const EMPTY_SPACE = {
  name: "",
  description: "",
  is_private: false,
  access_members: [],
};

const BoardDetailPage = () => {
  const { boardId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [boards, setBoards] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("list");
  const [collapsedStatuses, setCollapsedStatuses] = useState({});
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [newTaskTitles, setNewTaskTitles] = useState({});
  const [addingTask, setAddingTask] = useState({});
  const [addingGroup, setAddingGroup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [newSpace, setNewSpace] = useState(EMPTY_SPACE);
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [showSpaceSettingsModal, setShowSpaceSettingsModal] = useState(false);
  const [updatingSpaceSettings, setUpdatingSpaceSettings] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [departments, setDepartments] = useState([]);

  const fetchWorkspace = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");

      const [boardData, spacesData, conversationData, messagingUsers, departmentData] = await Promise.all([
        getBoard(boardId),
        getBoards(),
        getConversations(),
        getUsersForMessaging(),
        getAllDepartments(),
      ]);

      const normalizedAssignees = [
        {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
        },
        ...messagingUsers.map((participant) => {
          const [participantRole, rawId] = participant.id.split("_");
          return {
            id: Number(rawId),
            role: participantRole,
            name: participant.name,
            email: participant.email || "",
          };
        }),
      ].filter(
        (participant, index, array) =>
          array.findIndex(
            (item) => item.id === participant.id && item.role === participant.role
          ) === index
      );

      setBoard(boardData);
      setBoards(Array.isArray(spacesData) ? spacesData : []);
      setConversations(Array.isArray(conversationData) ? conversationData : []);
      setAssignees(normalizedAssignees);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
    } catch (fetchError) {
      setError("Failed to load space details.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [boardId, user.email, user.id, user.name, user.role]);

  useEffect(() => {
    fetchWorkspace(true);
  }, [fetchWorkspace]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden || activeTaskId) {
        return;
      }
      fetchWorkspace(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTaskId, fetchWorkspace]);

  const allTasks = useMemo(() => {
    if (!board?.groups) return [];
    return board.groups.flatMap((group) =>
      group.tasks.map((task) => ({
        ...task,
        group_id: group.id,
        group_name: group.name,
        group_color: group.color,
      }))
    );
  }, [board]);

  useEffect(() => {
    if (!board) return;

    const params = new URLSearchParams(location.search);
    const taskIdParam = Number(params.get("task"));
    if (!taskIdParam) {
      setActiveTaskId(null);
      setActiveTask(null);
      return;
    }

    const task = allTasks.find((item) => item.id === taskIdParam);
    setActiveTaskId(task ? taskIdParam : null);
    setActiveTask(task || null);
  }, [location.search, board, allTasks]);

  const boardStats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter((task) => task.status === "Done").length;
    const inProgress = allTasks.filter((task) => task.status === "In Progress").length;
    const overdue = allTasks.filter((task) => {
      if (!task.due_date || task.status === "Done") return false;
      return new Date(`${task.due_date}T23:59:59`) < new Date();
    }).length;
    const progress = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, overdue, progress };
  }, [allTasks]);

  const tasksByStatus = useMemo(
    () =>
      STATUS_OPTIONS.reduce((accumulator, status) => {
        accumulator[status] = allTasks.filter((task) => task.status === status);
        return accumulator;
      }, {}),
    [allTasks]
  );

  const assigneeSummary = useMemo(() => {
    if (!allTasks.length) {
      return [{ label: "Unassigned", value: 1, color: "#cfd4dc" }];
    }

    const counts = new Map();
    allTasks.forEach((task) => {
      const label = task.assignee_name || "Unassigned";
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    const palette = ["#673de6", "#00b67a", "#ff9f1a", "#ff59a3", "#1a73e8", "#111827"];
    return Array.from(counts.entries()).map(([label, value], index) => ({
      label,
      value,
      color: palette[index % palette.length],
    }));
  }, [allTasks]);

  const assigneeChartBackground = useMemo(() => {
    const total = assigneeSummary.reduce((sum, entry) => sum + entry.value, 0);
    if (!total) return "#e5e7eb";

    let current = 0;
    const stops = assigneeSummary.map((entry) => {
      const start = current;
      const sweep = (entry.value / total) * 360;
      current += sweep;
      return `${entry.color} ${start}deg ${current}deg`;
    });

    return `conic-gradient(${stops.join(", ")})`;
  }, [assigneeSummary]);

  const getTaskGroup = (task) => board?.groups?.find((group) => group.id === task.group_id);

  const getInitials = (name) =>
    (name || "")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const patchTaskInState = (taskId, updater) => {
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        groups: prev.groups.map((group) => ({
          ...group,
          tasks: group.tasks.map((task) => (task.id === taskId ? updater(task) : task)),
        })),
      };
    });
  };

  const handleTaskCellChange = async (taskId, field, value) => {
    setSaving(true);

    patchTaskInState(taskId, (task) => {
      const nextTask = { ...task, [field]: value };
      if (field === "assignee") {
        nextTask.assignee_id = value?.id || null;
        nextTask.assignee_name = value?.name || "";
        nextTask.assignee_email = value?.email || "";
        nextTask.assignee_role = value?.role || "";
      }
      return nextTask;
    });

    try {
      const payload =
        field === "assignee"
          ? { assignee_id: value?.id || null, assignee_role: value?.role || null }
          : { [field]: value };
      await updateTask(taskId, payload);
    } catch (updateError) {
      setError("Failed to save task changes.");
      fetchWorkspace(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddGroup = async () => {
    if (addingGroup) return;
    try {
      setAddingGroup(true);
      setSaving(true);
      const randomColor = BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)];
      const created = await createGroup(boardId, {
        name: "New List",
        color: randomColor,
      });
      setBoard((prev) => ({ ...prev, groups: [...prev.groups, created] }));
    } catch (createError) {
      setError("Failed to create a new list.");
    } finally {
      setAddingGroup(false);
      setSaving(false);
    }
  };

  const handleGroupTitleChange = async (groupId, value) => {
    setBoard((prev) => ({
      ...prev,
      groups: prev.groups.map((group) =>
        group.id === groupId ? { ...group, name: value } : group
      ),
    }));

    try {
      await updateGroup(groupId, { name: value });
    } catch (updateError) {
      setError("Failed to rename list.");
      fetchWorkspace(false);
    }
  };

  const handleGroupColorChange = async (groupId, color) => {
    setBoard((prev) => ({
      ...prev,
      groups: prev.groups.map((group) =>
        group.id === groupId ? { ...group, color } : group
      ),
    }));

    try {
      await updateGroup(groupId, { color });
    } catch (updateError) {
      setError("Failed to update list color.");
      fetchWorkspace(false);
    }
  };

  const handleAddTask = async (groupId) => {
    const title = (newTaskTitles[groupId] || "").trim();
    if (!title || addingTask[groupId]) return;

    try {
      setAddingTask((prev) => ({ ...prev, [groupId]: true }));
      setSaving(true);
      const created = await createTask(groupId, { title });
      setBoard((prev) => ({
        ...prev,
        groups: prev.groups.map((group) =>
          group.id === groupId ? { ...group, tasks: [...group.tasks, created] } : group
        ),
      }));
      setNewTaskTitles((prev) => ({ ...prev, [groupId]: "" }));
    } catch (createError) {
      setError("Failed to create task.");
    } finally {
      setAddingTask((prev) => ({ ...prev, [groupId]: false }));
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    await deleteGroup(groupId);
    setBoard((prev) => ({
      ...prev,
      groups: prev.groups.filter((group) => group.id !== groupId),
    }));
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    setBoard((prev) => ({
      ...prev,
      groups: prev.groups.map((group) => ({
        ...group,
        tasks: group.tasks.filter((task) => task.id !== taskId),
      })),
    }));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setError("");
      if (deleteTarget.type === "group") {
        await handleDeleteGroup(deleteTarget.id);
      } else {
        await handleDeleteTask(deleteTarget.id);
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (deleteError) {
      setError("Failed to delete the selected item.");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenUpdatesDrawer = (task) => {
    setActiveTaskId(task.id);
    setActiveTask(task);
    navigate(`/admin/boards/${boardId}?task=${task.id}`, { replace: true });
  };

  const handleCloseUpdatesDrawer = () => {
    setActiveTaskId(null);
    setActiveTask(null);
    navigate(`/admin/boards/${boardId}`, { replace: true });
    fetchWorkspace(false);
  };

  const handleCreateSpace = async (_event, payload = newSpace) => {
    if (!payload.name.trim() || creatingSpace) return;

    try {
      setCreatingSpace(true);
      const created = await createBoard(payload);
      setShowSpaceModal(false);
      setNewSpace(EMPTY_SPACE);
      navigate(`/admin/boards/${created.id}`);
    } catch (createError) {
      setError(createError.response?.data?.error || "Failed to create space.");
    } finally {
      setCreatingSpace(false);
    }
  };

  const handleUpdateSpaceSettings = async (payload) => {
    try {
      setUpdatingSpaceSettings(true);
      setError("");
      const updated = await updateBoard(boardId, payload);
      setBoard((prev) => ({ ...prev, ...updated }));
      setShowSpaceSettingsModal(false);
      fetchWorkspace(false);
    } catch (updateError) {
      setError(updateError.response?.data?.error || "Failed to update space settings.");
    } finally {
      setUpdatingSpaceSettings(false);
    }
  };

  const handleCreateChannel = async (payload) => {
    try {
      setCreatingChannel(true);
      setError("");
      await createChannel(payload);
      setShowCreateChannelModal(false);
      fetchWorkspace(false);
    } catch (createError) {
      setError(createError.response?.data?.error || "Failed to create channel.");
    } finally {
      setCreatingChannel(false);
    }
  };

  const renderAssigneeCell = (task) => (
    <Dropdown className="w-100">
      <Dropdown.Toggle as="div" className="assignee-cell">
        {task.assignee_id ? (
          <>
            <div className="assignee-avatar">{getInitials(task.assignee_name)}</div>
            <span className="assignee-name-txt">{task.assignee_name}</span>
          </>
        ) : (
          <span className="text-muted small">+ Assign owner</span>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu className="board-dropdown-menu">
        <Dropdown.Item onClick={() => handleTaskCellChange(task.id, "assignee", null)}>
          <span className="text-muted">Unassigned</span>
        </Dropdown.Item>
        <Dropdown.Divider />
        {assignees.map((participant) => (
          <Dropdown.Item
            key={`${participant.role}_${participant.id}`}
            onClick={() => handleTaskCellChange(task.id, "assignee", participant)}
          >
            <strong className="text-truncate d-block">{participant.name}</strong>
            <div className="text-muted small text-truncate">
              {participant.email || participant.role}
            </div>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );

  const renderStatusDropdown = (task) => {
    const meta = STATUS_META[task.status] || STATUS_META["Not Started"];
    return (
      <Dropdown className="w-100 text-center">
        <Dropdown.Toggle as="div">
          <span className={`monday-badge ${meta.className}`}>{meta.label}</span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="board-dropdown-menu board-status-menu">
          {STATUS_OPTIONS.map((status) => (
            <Dropdown.Item
              key={status}
              onClick={() => handleTaskCellChange(task.id, "status", status)}
              className="text-center fw-semibold"
            >
              <span className={`monday-badge ${STATUS_META[status].className}`}>
                {STATUS_META[status].label}
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const renderPriorityDropdown = (task) => {
    const meta = PRIORITY_META[task.priority] || PRIORITY_META.Normal;
    return (
      <Dropdown className="w-100 text-center">
        <Dropdown.Toggle as="div">
          <span className={`monday-badge ${meta.className}`}>{meta.label}</span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="board-dropdown-menu board-status-menu">
          {PRIORITY_OPTIONS.map((priority) => (
            <Dropdown.Item
              key={priority}
              onClick={() => handleTaskCellChange(task.id, "priority", priority)}
              className="text-center fw-semibold"
            >
              <span className={`monday-badge ${PRIORITY_META[priority].className}`}>
                {PRIORITY_META[priority].label}
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const renderTaskRow = (task, group) => (
    <tr key={task.id} className="workspace-row">
      <td>
        <div className="d-flex align-items-center gap-2">
          <span className="task-complete-dot" style={{ borderColor: group?.color || "#8c9baf" }}>
            {task.status === "Done" && <CheckCircleFill size={14} />}
          </span>
          <input
            type="text"
            className="cell-editable-text font-semibold flex-grow-1"
            value={task.title}
            onChange={(event) => handleTaskCellChange(task.id, "title", event.target.value)}
          />
          <button className="chat-bubble-btn" onClick={() => handleOpenUpdatesDrawer(task)}>
            <ChatFill size={16} />
            {task.updates_count > 0 && <span className="chat-badge">{task.updates_count}</span>}
          </button>
          <Button
            variant="link"
            className="text-muted p-0"
            onClick={() => {
              setDeleteTarget({ type: "task", id: task.id, name: task.title });
              setShowDeleteModal(true);
            }}
          >
            <Trash size={14} />
          </Button>
        </div>
      </td>
      <td>{renderAssigneeCell(task)}</td>
      <td>{renderStatusDropdown(task)}</td>
      <td>{renderPriorityDropdown(task)}</td>
      <td>
        <input
          type="date"
          className="cell-editable-text text-center text-muted"
          value={task.due_date || ""}
          onChange={(event) => handleTaskCellChange(task.id, "due_date", event.target.value)}
        />
      </td>
      <td className="text-muted small">{group?.name || task.group_name}</td>
    </tr>
  );

  const renderAddTaskRow = (groupId) => (
    <div className="add-task-row">
      <input
        type="text"
        placeholder="+ Add task"
        className="add-task-input"
        value={newTaskTitles[groupId] || ""}
        onChange={(event) =>
          setNewTaskTitles((prev) => ({ ...prev, [groupId]: event.target.value }))
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleAddTask(groupId);
          }
        }}
      />
      <Button variant="primary" size="sm" onClick={() => handleAddTask(groupId)}>
        {addingTask[groupId] ? <Spinner size="sm" animation="border" /> : <Plus size={16} />}
        Add Task
      </Button>
    </div>
  );

  const renderOverviewView = () => (
    <div className="workspace-overview-layout">
      <div className="workspace-surface">
        <h3>Resources & progress</h3>
        <div className="workspace-list-summary">
          <div className="workspace-list-summary-row">
            <div>
              <strong className="d-block mb-1">Overview documents</strong>
              <span className="text-muted">
                Drop SOPs, policy files, or onboarding docs here in the next file-upload pass.
              </span>
            </div>
            <div>
              <div className="workspace-list-progress mb-2">
                <div style={{ width: `${boardStats.progress}%` }} />
              </div>
              <small className="text-muted fw-semibold">{boardStats.progress}% complete</small>
            </div>
            <div className="text-muted fw-semibold d-flex align-items-center justify-content-end gap-2">
              <Calendar3 />
              {boardStats.overdue} overdue
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="mb-3">Lists</h3>
          <div className="workspace-list-summary">
            {board.groups.map((group) => {
              const groupDone = group.tasks.filter((task) => task.status === "Done").length;
              const groupProgress = group.tasks.length
                ? Math.round((groupDone / group.tasks.length) * 100)
                : 0;
              return (
                <div key={group.id} className="workspace-list-summary-row">
                  <div>
                    <strong className="d-block mb-1">{group.name}</strong>
                    <span className="text-muted">
                      {group.tasks.length} tasks in this list
                    </span>
                  </div>
                  <div>
                    <div className="workspace-list-progress mb-2">
                      <div style={{ width: `${groupProgress}%` }} />
                    </div>
                    <small className="text-muted fw-semibold">{groupProgress}% complete</small>
                  </div>
                  <div className="text-end text-muted fw-semibold">
                    {groupDone}/{group.tasks.length} done
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="workspace-surface">
        <h3>Tasks by assignee</h3>
        <div className="workspace-assignee-donut-shell">
          <div
            className="workspace-assignee-donut"
            style={{ background: assigneeChartBackground }}
          />
          <div className="workspace-assignee-legend">
            {assigneeSummary.map((entry) => (
              <div key={entry.label} className="workspace-assignee-legend-item">
                <span style={{ backgroundColor: entry.color }} />
                <div className="d-flex w-100 align-items-center justify-content-between gap-3">
                  <strong>{entry.label}</strong>
                  <small>{entry.value}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderListView = () => (
    <>
      {STATUS_OPTIONS.map((status) => {
        const statusTasks = tasksByStatus[status] || [];
        const collapsed = collapsedStatuses[status];

        return (
          <div key={status} className="group-container status-group-container">
            <div className="group-header status-group-header">
              <button
                type="button"
                className="status-collapse-btn"
                onClick={() =>
                  setCollapsedStatuses((prev) => ({ ...prev, [status]: !prev[status] }))
                }
              >
                <span className={`status-chevron ${collapsed ? "collapsed" : ""}`}>v</span>
                <span
                  className="group-color-indicator"
                  style={{ backgroundColor: STATUS_META[status].color }}
                />
                <span className={`monday-badge ${STATUS_META[status].className}`}>
                  {STATUS_META[status].label}
                </span>
                <span className="status-task-count">{statusTasks.length}</span>
              </button>
            </div>

            {!collapsed && (
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th style={{ width: "34%" }}>Name</th>
                    <th style={{ width: "18%" }}>Assignee</th>
                    <th style={{ width: "14%" }}>Status</th>
                    <th style={{ width: "12%" }}>Priority</th>
                    <th style={{ width: "12%" }}>Due date</th>
                    <th style={{ width: "10%" }}>List</th>
                  </tr>
                </thead>
                <tbody>
                  {statusTasks.map((task) => renderTaskRow(task, getTaskGroup(task)))}
                  {statusTasks.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-status-cell">
                        No tasks in this status yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </>
  );

  const renderBoardView = () => (
    <div className="kanban-board-view">
      {STATUS_OPTIONS.map((status) => (
        <section key={status} className="kanban-column">
          <div className="kanban-column-header">
            <span className={`monday-badge ${STATUS_META[status].className}`}>
              {STATUS_META[status].label}
            </span>
            <span>{tasksByStatus[status]?.length || 0}</span>
          </div>
          <div className="kanban-card-stack">
            {(tasksByStatus[status] || []).map((task) => (
              <article key={task.id} className="kanban-task-card">
                <div className="kanban-task-title">{task.title}</div>
                <div className="kanban-task-meta">
                  <span>{task.group_name}</span>
                  <span>{task.due_date || "No due date"}</span>
                </div>
                <div className="kanban-task-footer">
                  {renderPriorityDropdown(task)}
                  <button className="chat-bubble-btn" onClick={() => handleOpenUpdatesDrawer(task)}>
                    <ChatFill size={16} />
                    {task.updates_count > 0 && <span className="chat-badge">{task.updates_count}</span>}
                  </button>
                </div>
              </article>
            ))}
            {(tasksByStatus[status] || []).length === 0 && (
              <div className="kanban-empty">No tasks here yet.</div>
            )}
          </div>
        </section>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="workspace-shell">
        <WorkspaceSecondarySidebar boards={[]} conversations={[]} loading />
        <div className="workspace-content-pane">
          <div className="workspace-message-empty">
            <div>
              <Spinner animation="border" />
              <p className="mt-3 mb-0">Loading space...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="workspace-shell">
        <WorkspaceSecondarySidebar boards={boards} conversations={conversations} />
        <div className="workspace-content-pane">
          <Alert variant="danger">Space not found.</Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="workspace-shell">
        <WorkspaceSecondarySidebar
          conversations={conversations}
          boards={boards}
          selectedBoardId={board.id}
          selectedBoardGroups={board.groups}
          onCreateSpace={() => setShowSpaceModal(true)}
          onCreateChannel={() => setShowCreateChannelModal(true)}
          onNewMessage={() => setShowNewMessageModal(true)}
        />

        <div className="workspace-content-pane">
          <div className="workspace-panel workspace-topbar">
            <div>
              <div className="workspace-breadcrumb">Spaces / {board.name}</div>
              <div className="workspace-title-row">
                <h1 className="mb-0">{board.name}</h1>
                {saving && (
                  <span className="sync-pill">
                    <Spinner size="sm" animation="border" />
                    Saving
                  </span>
                )}
              </div>
              <div className="board-description-text">
                {board.description || "Use this space for departmental projects, folders, and task tracking."}
              </div>
            </div>

            <div className="workspace-actions">
              <Button variant="light" className="workspace-icon-action" onClick={() => setShowSpaceSettingsModal(true)}>
                {board.is_private ? "Private Space" : "Space Access"}
              </Button>
              <Button variant="light" className="workspace-icon-action" onClick={() => setActiveView("overview")}>
                <FileText size={15} />
                Overview
              </Button>
              <Button variant="primary" onClick={handleAddGroup} disabled={addingGroup}>
                {addingGroup ? <Spinner size="sm" animation="border" className="me-2" /> : <Plus size={16} className="me-1" />}
                Add List
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <div className="workspace-panel">
            <div className="workspace-overview-grid">
              <div className="workspace-overview-stat">
                <span>Total tasks</span>
                <strong>{boardStats.total}</strong>
              </div>
              <div className="workspace-overview-stat">
                <span>In progress</span>
                <strong>{boardStats.inProgress}</strong>
              </div>
              <div className="workspace-overview-stat">
                <span>Completed</span>
                <strong>{boardStats.completed}</strong>
              </div>
              <div className="workspace-overview-stat">
                <span>Progress</span>
                <strong>{boardStats.progress}%</strong>
              </div>
            </div>
          </div>

          <div className="workspace-viewbar">
            <div className="workspace-tabs">
              {VIEW_OPTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={`workspace-tab ${activeView === key ? "active" : ""}`}
                  onClick={() => setActiveView(key)}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
            <div className="workspace-toolbar-actions">
              <button type="button" className="workspace-tool-btn">
                {board.groups.length} lists
              </button>
              <button type="button" className="workspace-tool-btn">
                {boardStats.overdue} overdue
              </button>
            </div>
          </div>

          {activeView === "overview" && renderOverviewView()}
          {activeView === "list" && renderListView()}
          {activeView === "board" && renderBoardView()}

          <div className="workspace-panel mt-3">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-3">
              <div>
                <span className="workspace-secondary-eyebrow">Lists</span>
                <h3 className="mb-1">Manage lists and create tasks</h3>
                <p className="text-muted mb-0">
                  This keeps task creation close to the list structure just like the ClickUp flow.
                </p>
              </div>
            </div>

            {board.groups.map((group) => (
              <div key={group.id} className="group-container">
                <div className="group-header">
                  <div className="group-header-left">
                    <div className="group-color-indicator" style={{ backgroundColor: group.color }} />
                    <input
                      type="text"
                      className="group-title-input"
                      value={group.name}
                      onChange={(event) => handleGroupTitleChange(group.id, event.target.value)}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Dropdown align="end">
                      <Dropdown.Toggle as="a" className="text-muted cursor-pointer">
                        <PaletteFill size={16} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="p-2 board-dropdown-menu" style={{ minWidth: "120px" }}>
                        <div className="d-flex flex-wrap gap-2 justify-content-center">
                          {BOARD_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="color-swatch-btn"
                              style={{ backgroundColor: color }}
                              onClick={() => handleGroupColorChange(group.id, color)}
                              aria-label={`Set list color ${color}`}
                            />
                          ))}
                        </div>
                      </Dropdown.Menu>
                    </Dropdown>

                    <Button
                      variant="link"
                      className="p-0 text-muted"
                      onClick={() => {
                        setDeleteTarget({ type: "group", id: group.id, name: group.name });
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>

                <table className="workspace-table">
                  <thead>
                    <tr>
                      <th style={{ width: "34%" }}>Name</th>
                      <th style={{ width: "18%" }}>Assignee</th>
                      <th style={{ width: "14%" }}>Status</th>
                      <th style={{ width: "12%" }}>Priority</th>
                      <th style={{ width: "12%" }}>Due date</th>
                      <th style={{ width: "10%" }}>List</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.tasks.map((task) => renderTaskRow(task, group))}
                    {group.tasks.length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-status-cell">
                          No tasks in this list yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {renderAddTaskRow(group.id)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeTaskId && activeTask && (
        <UpdatesDrawer taskId={activeTaskId} task={activeTask} onClose={handleCloseUpdatesDrawer} />
      )}

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === "group" ? "Delete List" : "Delete Task"}
        message={
          deleteTarget?.type === "group"
            ? `Are you sure you want to permanently delete the list "${deleteTarget.name}"?`
            : `Are you sure you want to permanently delete the task "${deleteTarget?.name}"?`
        }
        loading={deleting}
      />

      <SpaceSettingsModal
        show={showSpaceModal}
        onHide={() => setShowSpaceModal(false)}
        onSubmit={async (payload) => {
          await handleCreateSpace({ preventDefault() {} }, payload);
        }}
        title="Create Space"
        submitLabel="Create Space"
        submitting={creatingSpace}
        initialValues={newSpace}
        members={assignees}
      />

      <SpaceSettingsModal
        show={showSpaceSettingsModal}
        onHide={() => setShowSpaceSettingsModal(false)}
        onSubmit={handleUpdateSpaceSettings}
        title="Edit Space Settings"
        submitLabel="Save Space"
        submitting={updatingSpaceSettings}
        initialValues={{
          name: board.name,
          description: board.description || "",
          is_private: board.is_private || false,
          access_members: board.access_members || [],
        }}
        members={assignees}
      />

      <NewConversationModal
        show={showNewMessageModal}
        handleClose={() => setShowNewMessageModal(false)}
        onConversationStarted={(conversationId) => {
          setShowNewMessageModal(false);
          fetchWorkspace(false);
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

export default BoardDetailPage;
