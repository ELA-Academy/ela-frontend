import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Spinner, Dropdown } from "react-bootstrap";
import { Plus, Shapes, ArrowRight, User, Calendar, Flag, Trash2 } from "lucide-react";
import { CheckCircleFill, Trash } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";

import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import {
  deleteBoard,
  getAllBoardTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../../services/boardService";
import { useWorkspace } from "../../components/admin/workspace/WorkspaceLayout";
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

const getInitials = (name) =>
  (name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getPriorityFlag = (priority, size = 13) => {
  switch (priority) {
    case "Urgent":
      return <Flag size={size} fill="#ef4444" className="text-red-500" />;
    case "High":
      return <Flag size={size} fill="#f97316" className="text-orange-500" />;
    case "Normal":
      return <Flag size={size} fill="#3b82f6" className="text-blue-500" />;
    case "Low":
      return <Flag size={size} fill="#9ca3af" className="text-gray-400" />;
    default:
      return <Flag size={size} className="text-slate-300" />;
  }
};

const BoardsPage = () => {
  const navigate = useNavigate();
  const {
    boards,
    workspaceLoading,
    refreshWorkspace,
    openCreateSpaceModal,
    assignees,
  } = useWorkspace();

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Collapse states for List groups and Status sections
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [collapsedStatuses, setCollapsedStatuses] = useState({});
  
  // Inline task builder state
  const [inlineTaskBuilders, setInlineTaskBuilders] = useState({});
  const [addingTask, setAddingTask] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setTasksLoading(true);
      }
      setError("");
      const taskData = await getAllBoardTasks();
      setTasks(Array.isArray(taskData) ? taskData : []);
    } catch (fetchError) {
      setError("Failed to load workspace tasks.");
    } finally {
      if (showLoading) {
        setTasksLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) {
        return;
      }
      fetchTasks(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleTaskCellChange = async (taskId, field, value) => {
    // Optimistic Update
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const nextTask = { ...task, [field]: value };
          if (field === "assignee") {
            nextTask.assignee_id = value?.id || null;
            nextTask.assignee_name = value?.name || "";
            nextTask.assignee_email = value?.email || "";
            nextTask.assignee_role = value?.role || "";
          }
          return nextTask;
        }
        return task;
      })
    );

    try {
      const payload =
        field === "assignee"
          ? { assignee_id: value?.id || null, assignee_role: value?.role || null }
          : { [field]: value };
      await updateTask(taskId, payload);
    } catch (updateError) {
      setError("Failed to save task changes.");
      fetchTasks(false);
    }
  };

  const handleAddTask = async (groupId, statusVal = "Not Started") => {
    const key = `${groupId}_${statusVal}`;
    const builder = inlineTaskBuilders[key];
    const title = (builder?.title || "").trim();
    if (!title || addingTask[key]) return;

    try {
      setAddingTask((prev) => ({ ...prev, [key]: true }));
      const payload = {
        title,
        status: statusVal,
        priority: builder?.priority || "Normal",
        due_date: builder?.dueDate || null
      };
      if (builder?.assignee) {
        payload.assignee_id = builder.assignee.id;
        payload.assignee_role = builder.assignee.role;
      }

      const created = await createTask(groupId, payload);
      
      // Enrich task context for BoardsPage state
      const board = boards.find(b => b.groups?.some(g => g.id === groupId));
      const group = board?.groups?.find(g => g.id === groupId);
      
      const enrichedTask = {
        ...created,
        board_id: board?.id,
        board_name: board?.name,
        group_name: group?.name,
        group_color: group?.color
      };

      setTasks((prev) => [...prev, enrichedTask]);
      setInlineTaskBuilders((prev) => ({
        ...prev,
        [key]: { title: "", assignee: null, dueDate: null, priority: "Normal", active: false }
      }));
    } catch (createError) {
      setError("Failed to create task.");
    } finally {
      setAddingTask((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError("");
      if (deleteTarget.type === "space") {
        await deleteBoard(deleteTarget.id);
        refreshWorkspace();
        fetchTasks(false);
      } else if (deleteTarget.type === "task") {
        await deleteTask(deleteTarget.id);
        setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(`Failed to delete ${deleteTarget.type}.`);
    } finally {
      setDeleting(false);
    }
  };

  const renderAssigneeCell = (task) => (
    <Dropdown className="w-100">
      <Dropdown.Toggle as="div" className="assignee-cell clickup-cell-assignee">
        {task.assignee_id ? (
          <>
            <div className="assignee-avatar clickup-avatar-sm">{getInitials(task.assignee_name)}</div>
            <span className="assignee-name-txt">{task.assignee_name}</span>
          </>
        ) : (
          <div className="clickup-unassigned-icon mx-auto" title="Unassigned">
            <User size={13} strokeWidth={2.5} />
          </div>
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

  const renderDateCell = (task, fieldName) => {
    const dateVal = task[fieldName];
    const displayVal = dateVal ? format(parseISO(dateVal), "MMM d") : "";
    return (
      <div className="clickup-date-cell-wrapper position-relative text-center w-100">
        <input
          type="date"
          className="clickup-date-input-hidden"
          value={dateVal || ""}
          onChange={(event) =>
            handleTaskCellChange(task.id, fieldName, event.target.value)
          }
        />
        <div className="clickup-date-display d-inline-flex align-items-center justify-content-center gap-1 text-muted cursor-pointer w-100">
          <Calendar size={12} className={dateVal ? "text-slate-500" : "text-slate-300"} />
          {displayVal && <span className="clickup-date-text">{displayVal}</span>}
        </div>
      </div>
    );
  };

  const renderPriorityDropdown = (task) => (
    <Dropdown className="w-100 text-center clickup-cell-priority">
      <Dropdown.Toggle as="div" className="d-inline-flex align-items-center justify-content-center cursor-pointer w-100">
        {getPriorityFlag(task.priority, 13)}
      </Dropdown.Toggle>
      <Dropdown.Menu className="board-dropdown-menu board-status-menu">
        {PRIORITY_OPTIONS.map((priority) => (
          <Dropdown.Item
            key={priority}
            onClick={() => handleTaskCellChange(task.id, "priority", priority)}
            className="d-flex align-items-center gap-2"
          >
            {getPriorityFlag(priority, 12)}
            <span>{priority}</span>
          </Dropdown.Item>
        ))}
        <Dropdown.Divider />
        <Dropdown.Item onClick={() => handleTaskCellChange(task.id, "priority", null)} className="text-muted">
          <Flag size={12} className="text-slate-300 me-2" />
          <span>Clear Priority</span>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  const loading = workspaceLoading || tasksLoading;

  return (
    <div className="p-4 bg-light min-vh-100">
      {/* Header Row */}
      <div className="mb-4 mt-2 d-flex align-items-center justify-content-between">
        <div>
          <span className="workspace-secondary-eyebrow d-block mb-1">Spaces Overview</span>
          <h2 className="mb-0 fs-4 fw-bold text-slate-800">All Tasks List</h2>
        </div>
        <div>
          <Button variant="primary" size="sm" onClick={openCreateSpaceModal}>
            <Plus size={14} className="me-1" />
            New Space
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className="mt-3">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Loading workspace tasks...</p>
        </div>
      ) : boards.length > 0 ? (
        <div className="workspace-list-view">
          {boards.map((board) => {
            const boardGroups = board.groups || [];
            return boardGroups.map((group) => {
              const groupTasks = tasks.filter((t) => t.group_id === group.id);
              const collapsed = collapsedGroups[group.id];

              return (
                <div key={group.id} className="group-container mb-4 bg-white p-3 border rounded-4 shadow-sm">
                  {/* Space / Folder Header */}
                  <div className="group-header d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="status-collapse-btn p-0 border-0 bg-transparent text-slate-700"
                        onClick={() =>
                          setCollapsedGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                        }
                      >
                        <span className={`status-chevron d-inline-block transition-all ${collapsed ? "collapsed rotate-n90" : ""}`} style={{ marginRight: "8px" }}>
                          ▼
                        </span>
                      </button>
                      <div className="group-color-indicator" style={{ backgroundColor: group.color || "#673de6" }} />
                      <strong className="fs-6 text-slate-700">{board.name}</strong>
                      <span className="text-muted mx-1">/</span>
                      <span className="fs-6 fw-bold text-slate-800">{group.name}</span>
                      <span className="badge bg-light border text-dark ms-2" style={{ fontSize: "11px" }}>
                        {groupTasks.length} task{groupTasks.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/admin/boards/${board.id}`)}>
                        View Board
                        <ArrowRight size={13} className="ms-1" />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-0"
                        onClick={() => {
                          setDeleteTarget({ type: "space", id: board.id, name: board.name });
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete Space
                      </Button>
                    </div>
                  </div>

                  {/* Tasks grouped by Status under this folder */}
                  {!collapsed && (
                    <div className="group-content ms-2 mt-3">
                      {STATUS_OPTIONS.map((statusVal) => {
                        const statusTasks = groupTasks.filter((t) => t.status === statusVal);
                        const statusMeta = STATUS_META[statusVal];
                        const statusKey = `${group.id}_${statusVal}`;
                        const isStatusCollapsed = collapsedStatuses[statusKey];
                        
                        const toggleStatusCollapse = () => {
                          setCollapsedStatuses((prev) => ({
                            ...prev,
                            [statusKey]: !prev[statusKey],
                          }));
                        };

                        return (
                          <div key={statusVal} className="status-group-section mb-3">
                            {/* Status Sub-Header */}
                            <div className="status-group-header d-flex align-items-center justify-content-between py-1 px-2 mb-1" style={{ borderLeft: `3px solid ${statusMeta.color}` }}>
                              <div className="d-flex align-items-center gap-2">
                                <button
                                  type="button"
                                  className="status-collapse-btn p-0 border-0 bg-transparent text-slate-700"
                                  onClick={toggleStatusCollapse}
                                >
                                  <span className={`status-chevron d-inline-block transition-all ${isStatusCollapsed ? "collapsed rotate-n90" : ""}`} style={{ marginRight: "6px", fontSize: "10px" }}>
                                    ▼
                                  </span>
                                </button>
                                <span className="badge rounded-pill text-white fw-bold px-2 py-1" style={{ backgroundColor: statusMeta.color, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                  {statusMeta.label}
                                </span>
                                <span className="text-muted small fw-semibold ms-1">
                                  {statusTasks.length}
                                </span>
                              </div>
                            </div>

                            {/* Status Tasks Table */}
                            {!isStatusCollapsed && (
                              <div className="workspace-table-container ms-3">
                                <table className="workspace-table mb-2">
                                  <thead>
                                    <tr>
                                      <th style={{ width: "3%", textAlign: "center" }}></th>
                                      <th style={{ width: "57%" }}>Name</th>
                                      <th style={{ width: "17%" }}>Assignee</th>
                                      <th style={{ width: "13%" }}>Due Date</th>
                                      <th style={{ width: "10%" }}>Priority</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {statusTasks.map((task) => (
                                      <tr key={task.id} className="workspace-row">
                                        <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                                          <span
                                            className="task-complete-dot"
                                            style={{ borderColor: statusMeta.color || "#8c9baf", cursor: "pointer" }}
                                            onClick={() =>
                                              handleTaskCellChange(
                                                task.id,
                                                "status",
                                                task.status === "Done" ? "Not Started" : "Done"
                                              )
                                            }
                                          >
                                            {task.status === "Done" && <CheckCircleFill size={14} style={{ color: statusMeta.color }} />}
                                          </span>
                                        </td>
                                        <td>
                                          <div className="d-flex align-items-center gap-2">
                                            <input
                                              type="text"
                                              className="cell-editable-text font-semibold flex-grow-1"
                                              value={task.title}
                                              onChange={(event) => {
                                                const val = event.target.value;
                                                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: val } : t));
                                              }}
                                              onBlur={(event) =>
                                                handleTaskCellChange(task.id, "title", event.target.value)
                                              }
                                              onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                  event.target.blur();
                                                }
                                              }}
                                            />
                                            <Button
                                              variant="link"
                                              className="text-muted p-0"
                                              onClick={() => {
                                                setDeleteTarget({ type: "task", id: task.id, name: task.title });
                                                setShowDeleteModal(true);
                                              }}
                                            >
                                              <Trash2 size={13} />
                                            </Button>
                                          </div>
                                        </td>
                                        <td>{renderAssigneeCell(task)}</td>
                                        <td>{renderDateCell(task, "due_date")}</td>
                                        <td>{renderPriorityDropdown(task)}</td>
                                      </tr>
                                    ))}

                                    {/* Inline Add Task Builder Row */}
                                    <tr>
                                      <td colSpan="5" className="py-2">
                                        {inlineTaskBuilders[statusKey]?.active ? (
                                          <div className="clickup-inline-builder-row">
                                            <span className="task-complete-dot me-1" style={{ borderColor: "#8c9baf", cursor: "default" }} />
                                            <input
                                              type="text"
                                              placeholder="Task Name or type '/' for commands"
                                              className="clickup-inline-builder-input"
                                              value={inlineTaskBuilders[statusKey]?.title || ""}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setInlineTaskBuilders(prev => ({
                                                  ...prev,
                                                  [statusKey]: {
                                                    ...prev[statusKey],
                                                    title: val
                                                  }
                                                }));
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                  e.preventDefault();
                                                  handleAddTask(group.id, statusVal);
                                                }
                                              }}
                                              autoFocus
                                            />

                                            <div className="clickup-inline-toolbar">
                                              <span className="clickup-inline-pill">
                                                <span className="group-bullet-dot" style={{ backgroundColor: "#3b82f6", width: 8, height: 8 }} />
                                                Task
                                              </span>

                                              {/* Assignee Selection */}
                                              <Dropdown align="end">
                                                <Dropdown.Toggle as="div" className={`clickup-inline-icon-btn ${inlineTaskBuilders[statusKey]?.assignee ? "has-value" : ""}`} title="Assignee">
                                                  {inlineTaskBuilders[statusKey]?.assignee ? (
                                                    <div className="assignee-avatar clickup-avatar-sm" style={{ width: 18, height: 18, fontSize: 8 }}>
                                                      {getInitials(inlineTaskBuilders[statusKey]?.assignee.name)}
                                                    </div>
                                                  ) : (
                                                    <User size={13} />
                                                  )}
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="board-dropdown-menu">
                                                  <Dropdown.Item onClick={() => {
                                                    setInlineTaskBuilders(prev => ({
                                                      ...prev,
                                                      [statusKey]: { ...prev[statusKey], assignee: null }
                                                    }));
                                                  }}>
                                                    <span className="text-muted">Unassigned</span>
                                                  </Dropdown.Item>
                                                  <Dropdown.Divider />
                                                  {assignees.map((a) => (
                                                    <Dropdown.Item key={`${a.role}_${a.id}`} onClick={() => {
                                                      setInlineTaskBuilders(prev => ({
                                                        ...prev,
                                                        [statusKey]: { ...prev[statusKey], assignee: a }
                                                      }));
                                                    }}>
                                                      <strong>{a.name}</strong>
                                                    </Dropdown.Item>
                                                  ))}
                                                </Dropdown.Menu>
                                              </Dropdown>

                                              {/* Due Date Input */}
                                              <div className="position-relative d-inline-block">
                                                <input
                                                  type="date"
                                                  className="clickup-date-input-hidden"
                                                  value={inlineTaskBuilders[statusKey]?.dueDate || ""}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    setInlineTaskBuilders(prev => ({
                                                      ...prev,
                                                      [statusKey]: { ...prev[statusKey], dueDate: val }
                                                    }));
                                                  }}
                                                />
                                                <button type="button" className={`clickup-inline-icon-btn ${inlineTaskBuilders[statusKey]?.dueDate ? "has-value" : ""}`} title="Due Date">
                                                  <Calendar size={13} />
                                                </button>
                                              </div>

                                              {/* Priority Selection */}
                                              <Dropdown align="end">
                                                <Dropdown.Toggle as="div" className={`clickup-inline-icon-btn ${inlineTaskBuilders[statusKey]?.priority ? "has-value" : ""}`} title="Priority">
                                                  {getPriorityFlag(inlineTaskBuilders[statusKey]?.priority || "Normal", 13)}
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="board-dropdown-menu">
                                                  {PRIORITY_OPTIONS.map((p) => (
                                                    <Dropdown.Item key={p} onClick={() => {
                                                      setInlineTaskBuilders(prev => ({
                                                        ...prev,
                                                        [statusKey]: { ...prev[statusKey], priority: p }
                                                      }));
                                                    }}>
                                                      {getPriorityFlag(p, 12)} <span className="ms-1">{p}</span>
                                                    </Dropdown.Item>
                                                  ))}
                                                </Dropdown.Menu>
                                              </Dropdown>

                                              <span className="toolbar-divider bg-slate-200 mx-1" style={{ width: 1, height: 16 }} />

                                              <button
                                                type="button"
                                                className="clickup-inline-btn-cancel"
                                                onClick={() => {
                                                  setInlineTaskBuilders(prev => ({
                                                    ...prev,
                                                    [statusKey]: { ...prev[statusKey], active: false }
                                                  }));
                                                }}
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                className="clickup-inline-btn-save"
                                                onClick={() => handleAddTask(group.id, statusVal)}
                                                disabled={!(inlineTaskBuilders[statusKey]?.title || "").trim()}
                                              >
                                                Save ↵
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div
                                            className="d-flex align-items-center gap-2 py-1 cursor-pointer text-muted hover-text-slate-700"
                                            onClick={() => {
                                              setInlineTaskBuilders(prev => ({
                                                ...prev,
                                                [statusKey]: {
                                                  title: "",
                                                  assignee: null,
                                                  dueDate: null,
                                                  priority: "Normal",
                                                  active: true
                                                }
                                              }));
                                            }}
                                          >
                                            <span style={{ fontSize: "13px", fontWeight: "600" }}>+ Add Task</span>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>
      ) : (
        <div className="workspace-message-empty p-5 border border-dashed rounded-4 bg-white text-center">
          <div>
            <Shapes size={42} className="mb-3 text-primary opacity-75" />
            <h3>Create your first space</h3>
            <p className="mb-4 text-muted">
              Spaces act as structural folders for your projects and tasks across the school.
            </p>
            <Button variant="primary" onClick={openCreateSpaceModal}>
              <Plus size={16} />
              Create Space
            </Button>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteTarget ? `Delete ${deleteTarget.type === "space" ? "Space" : "Task"}` : "Delete"}
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete the ${deleteTarget.type} "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        loading={deleting}
      />
    </div>
  );
};

export default BoardsPage;
