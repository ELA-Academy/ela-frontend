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
import { FileText, LayoutList, Kanban, Flag, User, Calendar, BookOpen, Folder, Repeat, GitFork, Link, MoreHorizontal, Copy, Star, Edit3, Bell, ArrowRight, PlusSquare, Layers, ClipboardCopy, Zap, Clock, Mail, Archive, Trash2, MessageSquare, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

import UpdatesDrawer from "../../components/admin/UpdatesDrawer";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import SpaceSettingsModal from "../../components/admin/workspace/SpaceSettingsModal";
import CreateTaskModal from "../../components/admin/workspace/CreateTaskModal";
import CalendarView from "../../components/admin/workspace/CalendarView";
import GanttView from "../../components/admin/workspace/GanttView";
import DocsView from "../../components/admin/workspace/DocsView";
import DashboardView from "../../components/admin/workspace/DashboardView";
import { useWorkspace } from "../../components/admin/workspace/WorkspaceLayout";
import { useAuth } from "../../context/AuthContext";
import {
  createGroup,
  createTask,
  deleteGroup,
  deleteTask,
  getBoard,
  updateBoard,
  updateGroup,
  updateTask,
  getTaskTemplates,
  createTaskTemplate,
  deleteTaskTemplate,
} from "../../services/boardService";
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
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "gantt", label: "Gantt", icon: Calendar3 },
];

const BOARD_COLORS = ["#673de6", "#00ca72", "#ff9f1a", "#ff59a3", "#1a73e8", "#ff3860"];

const BoardDetailPage = () => {
  const { boardId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    boards,
    refreshWorkspace,
    assignees,
    departments,
  } = useWorkspace();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("list");
  const [collapsedStatuses, setCollapsedStatuses] = useState({});
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [newTaskTitles, setNewTaskTitles] = useState({});
  const [addingTask, setAddingTask] = useState({});
  const [inlineTaskBuilders, setInlineTaskBuilders] = useState({});
  const [addingGroup, setAddingGroup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSpaceSettingsModal, setShowSpaceSettingsModal] = useState(false);
  const [updatingSpaceSettings, setUpdatingSpaceSettings] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState(null);

  // Sorting & Grouping
  const [sortBy, setSortBy] = useState("position");
  const [sortOrder, setSortOrder] = useState("asc");
  const [groupBy, setGroupBy] = useState("status");
  const [kanbanGrouping, setKanbanGrouping] = useState("none");

  // Filters
  const [filterQuery, setFilterQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Bulk Actions
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // Saved Views
  const [savedViews, setSavedViews] = useState([]);
  const [currentViewName, setCurrentViewName] = useState("");
  const [newViewName, setNewViewName] = useState("");

  // Templates
  const [templates, setTemplates] = useState([]);

  const fetchWorkspace = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");

      const boardData = await getBoard(boardId);
      setBoard(boardData);
    } catch (fetchError) {
      setError("Failed to load space details.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [boardId]);

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

  // Load templates and saved views
  const fetchTemplates = useCallback(async () => {
    try {
      const data = await getTaskTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates", err);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (boardId) {
      try {
        const stored = localStorage.getItem(`saved_views_${boardId}`);
        if (stored) {
          setSavedViews(JSON.parse(stored));
        } else {
          setSavedViews([]);
        }
      } catch (err) {
        console.error("Failed to load saved views", err);
      }
    }
  }, [boardId]);

  // Saved Views Handlers
  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    const nextView = {
      name: newViewName.trim(),
      sortBy,
      sortOrder,
      groupBy,
      filterQuery,
      filterAssignee,
      filterPriority,
      filterCategory,
      kanbanGrouping,
      activeView
    };
    const nextViews = [...savedViews.filter(v => v.name !== nextView.name), nextView];
    setSavedViews(nextViews);
    localStorage.setItem(`saved_views_${boardId}`, JSON.stringify(nextViews));
    setNewViewName("");
    setCurrentViewName(nextView.name);
  };

  const handleApplyView = (viewName) => {
    const view = savedViews.find(v => v.name === viewName);
    if (!view) return;
    setCurrentViewName(viewName);
    if (view.sortBy !== undefined) setSortBy(view.sortBy);
    if (view.sortOrder !== undefined) setSortOrder(view.sortOrder);
    if (view.groupBy !== undefined) setGroupBy(view.groupBy);
    if (view.filterQuery !== undefined) setFilterQuery(view.filterQuery);
    if (view.filterAssignee !== undefined) setFilterAssignee(view.filterAssignee);
    if (view.filterPriority !== undefined) setFilterPriority(view.filterPriority);
    if (view.filterCategory !== undefined) setFilterCategory(view.filterCategory);
    if (view.kanbanGrouping !== undefined) setKanbanGrouping(view.kanbanGrouping);
    if (view.activeView !== undefined) setActiveView(view.activeView);
  };

  const handleDeleteView = (viewName) => {
    const nextViews = savedViews.filter(v => v.name !== viewName);
    setSavedViews(nextViews);
    localStorage.setItem(`saved_views_${boardId}`, JSON.stringify(nextViews));
    if (currentViewName === viewName) {
      setCurrentViewName("");
    }
  };

  // Bulk Actions
  const toggleSelectAll = (tasksList) => {
    const taskIds = tasksList.map(t => t.id);
    const allSelected = taskIds.every(id => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !taskIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => [...new Set([...prev, ...taskIds])]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedTaskIds.length} selected task(s)?`)) return;
    setSaving(true);
    try {
      await Promise.all(selectedTaskIds.map(id => deleteTask(id)));
      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          groups: prev.groups.map(group => ({
            ...group,
            tasks: group.tasks.filter(t => !selectedTaskIds.includes(t.id))
          }))
        };
      });
      setSelectedTaskIds([]);
    } catch (err) {
      setError("Failed to delete selected tasks.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      await Promise.all(selectedTaskIds.map(id => updateTask(id, { status: newStatus })));
      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          groups: prev.groups.map(group => ({
            ...group,
            tasks: group.tasks.map(t => selectedTaskIds.includes(t.id) ? { ...t, status: newStatus } : t)
          }))
        };
      });
      setSelectedTaskIds([]);
    } catch (err) {
      setError("Failed to update status in bulk.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPriorityChange = async (newPriority) => {
    setSaving(true);
    try {
      await Promise.all(selectedTaskIds.map(id => updateTask(id, { priority: newPriority })));
      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          groups: prev.groups.map(group => ({
            ...group,
            tasks: group.tasks.map(t => selectedTaskIds.includes(t.id) ? { ...t, priority: newPriority } : t)
          }))
        };
      });
      setSelectedTaskIds([]);
    } catch (err) {
      setError("Failed to update priority in bulk.");
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus, targetPriority = null) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    const taskId = Number(taskIdStr);
    
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    const updates = {};
    if (task.status !== targetStatus) {
      updates.status = targetStatus;
    }
    if (targetPriority && task.priority !== targetPriority) {
      updates.priority = targetPriority;
    }

    if (Object.keys(updates).length === 0) return;

    setSaving(true);
    patchTaskInState(taskId, (t) => ({ ...t, ...updates }));

    try {
      await updateTask(taskId, updates);
    } catch (err) {
      setError("Failed to update task via drag and drop.");
      fetchWorkspace(false);
    } finally {
      setSaving(false);
    }
  };

  // Inline creation from template
  const handleCreateFromTemplate = async (groupId, template) => {
    setSaving(true);
    try {
      const created = await createTask(groupId, {
        title: template.title,
        notes: template.notes,
        priority: template.priority,
        category: template.category,
        tags: template.tags
      });
      setBoard((prev) => ({
        ...prev,
        groups: prev.groups.map((group) =>
          group.id === groupId ? { ...group, tasks: [...group.tasks, created] } : group
        ),
      }));
    } catch (err) {
      setError("Failed to create task from template.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    let result = [...allTasks];

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.assignee_name && t.assignee_name.toLowerCase().includes(q))
      );
    }

    if (filterAssignee) {
      result = result.filter(
        (t) => String(t.assignee_id) === String(filterAssignee)
      );
    }

    if (filterPriority) {
      result = result.filter((t) => t.priority === filterPriority);
    }

    if (filterCategory) {
      result = result.filter(
        (t) => t.category && t.category.toLowerCase() === filterCategory.toLowerCase()
      );
    }

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "assignee") {
        valA = a.assignee_name || "";
        valB = b.assignee_name || "";
      }

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allTasks, filterQuery, filterAssignee, filterPriority, filterCategory, sortBy, sortOrder]);

  // Grouped Tasks for List View
  const groupedTasks = useMemo(() => {
    if (groupBy === "list") {
      if (!board?.groups) return [];
      return board.groups.map((group) => {
        const tasks = filteredTasks.filter((t) => t.group_id === group.id);
        return {
          id: group.id,
          name: group.name,
          color: group.color,
          tasks,
          isGroup: true
        };
      });
    }

    if (groupBy === "status") {
      return STATUS_OPTIONS.map((status) => {
        const tasks = filteredTasks.filter((t) => t.status === status);
        return {
          id: status,
          name: STATUS_META[status]?.label || status,
          color: STATUS_META[status]?.color || "#ccc",
          tasks,
          isStatus: true
        };
      });
    }

    if (groupBy === "priority") {
      return PRIORITY_OPTIONS.map((priority) => {
        const tasks = filteredTasks.filter((t) => t.priority === priority);
        const colors = { Urgent: "#f03e3e", High: "#f76707", Normal: "#1c7ed6", Low: "#748ffc" };
        return {
          id: priority,
          name: PRIORITY_META[priority]?.label || priority,
          color: colors[priority] || "#ccc",
          tasks,
          isPriority: true
        };
      });
    }

    if (groupBy === "assignee") {
      const groups = assignees.map((member) => {
        const tasks = filteredTasks.filter(
          (t) => t.assignee_id === member.id && t.assignee_role === member.role
        );
        return {
          id: `${member.role}_${member.id}`,
          name: member.name,
          color: "#4f46e5",
          tasks
        };
      });
      const unassignedTasks = filteredTasks.filter((t) => !t.assignee_id);
      groups.push({
        id: "unassigned",
        name: "Unassigned",
        color: "#94a3b8",
        tasks: unassignedTasks
      });
      return groups.filter((g) => g.tasks.length > 0 || g.id === "unassigned");
    }

    if (groupBy === "category") {
      const categories = [...new Set(allTasks.map((t) => t.category).filter(Boolean))];
      const groups = categories.map((cat) => {
        const tasks = filteredTasks.filter(
          (t) => t.category && t.category.toLowerCase() === cat.toLowerCase()
        );
        return {
          id: cat,
          name: cat,
          color: "#0891b2",
          tasks
        };
      });
      const uncategorizedTasks = filteredTasks.filter((t) => !t.category);
      if (uncategorizedTasks.length > 0) {
        groups.push({
          id: "uncategorized",
          name: "Uncategorized",
          color: "#94a3b8",
          tasks: uncategorizedTasks
        });
      }
      return groups;
    }

    return [
      {
        id: "all",
        name: "All Tasks",
        color: "#6366f1",
        tasks: filteredTasks
      }
    ];
  }, [board, filteredTasks, groupBy, assignees, allTasks]);

  // Swimlanes for Kanban
  const swimlanes = useMemo(() => {
    if (kanbanGrouping === "priority") {
      return PRIORITY_OPTIONS.map(p => ({ id: p, name: `${p} Priority` }));
    }
    if (kanbanGrouping === "list") {
      return (board?.groups || []).map(g => ({ id: g.id, name: g.name }));
    }
    if (kanbanGrouping === "assignee") {
      const items = assignees.map(a => ({ id: `${a.role}_${a.id}`, name: a.name }));
      items.push({ id: "unassigned", name: "Unassigned" });
      return items;
    }
    return [{ id: "all", name: "Tasks" }];
  }, [kanbanGrouping, board, assignees]);

  const getSwimlaneTasks = useCallback((swimlaneId, status) => {
    let tasks = filteredTasks.filter(t => t.status === status);

    if (kanbanGrouping === "priority") {
      tasks = tasks.filter(t => t.priority === swimlaneId);
    } else if (kanbanGrouping === "list") {
      tasks = tasks.filter(t => t.group_id === Number(swimlaneId));
    } else if (kanbanGrouping === "assignee") {
      if (swimlaneId === "unassigned") {
        tasks = tasks.filter(t => !t.assignee_id);
      } else {
        tasks = tasks.filter(t => `${t.assignee_role}_${t.assignee_id}` === swimlaneId);
      }
    }

    return tasks;
  }, [filteredTasks, kanbanGrouping]);

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

  const handleAddTask = async (groupId, statusVal = "Not Started") => {
    const key = `${groupId}_${statusVal}`;
    const builder = inlineTaskBuilders[key];
    const title = (builder?.title || "").trim();
    if (!title || addingTask[key]) return;

    try {
      setAddingTask((prev) => ({ ...prev, [key]: true }));
      setSaving(true);
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
      setBoard((prev) => ({
        ...prev,
        groups: prev.groups.map((group) =>
          group.id === groupId ? { ...group, tasks: [...group.tasks, created] } : group
        ),
      }));
      setInlineTaskBuilders((prev) => ({
        ...prev,
        [key]: { title: "", assignee: null, dueDate: null, priority: "Normal", active: false }
      }));
    } catch (createError) {
      setError("Failed to create task.");
    } finally {
      setAddingTask((prev) => ({ ...prev, [key]: false }));
      setSaving(false);
    }
  };

  const handleCreateTaskModalSubmit = async (groupId, taskPayload) => {
    try {
      setSaving(true);
      const created = await createTask(groupId, taskPayload);
      setBoard((prev) => ({
        ...prev,
        groups: prev.groups.map((group) =>
          group.id === groupId ? { ...group, tasks: [...group.tasks, created] } : group
        ),
      }));
    } catch (createError) {
      setError("Failed to create task.");
    } finally {
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
    return (
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
  };

  const renderKanbanCard = (task) => {
    const checklistCount = task.checklist?.length || 0;
    const checklistDone = task.checklist?.filter(item => item.is_checked).length || 0;
    const checklistProgress = checklistCount ? Math.round((checklistDone / checklistCount) * 100) : 0;
    const subtaskCount = task.subtasks?.length || 0;

    return (
      <article
        key={task.id}
        className="kanban-task-card"
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
      >
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div className="kanban-task-title fw-bold" onClick={() => handleOpenUpdatesDrawer(task)} style={{ cursor: "pointer" }}>
            {task.title}
          </div>
          {task.assignee_id && (
            <div className="assignee-avatar ms-auto flex-shrink-0" title={task.assignee_name}>
              {getInitials(task.assignee_name)}
            </div>
          )}
        </div>

        {task.category && (
          <span className="badge bg-info text-white me-1 mb-2" style={{ fontSize: "10px" }}>
            {task.category}
          </span>
        )}

        {task.recurring_settings && (
          <span className="badge bg-warning-subtle text-warning border border-warning-subtle me-1 mb-2 d-inline-flex align-items-center gap-1" style={{ fontSize: "10px" }} title="Recurring settings">
            <Repeat size={10} /> {task.recurring_settings}
          </span>
        )}

        <div className="kanban-task-meta mt-1">
          <span className="d-flex align-items-center gap-1 text-muted mb-1" style={{ fontSize: "11px" }}>
            <Folder size={11} className="text-slate-400" /> {task.group_name}
          </span>
          {task.start_date && (
            <span className="d-flex align-items-center gap-1 text-muted mb-1" style={{ fontSize: "11px" }}>
              <Calendar size={11} className="text-slate-400" /> Start: {new Date(task.start_date).toLocaleDateString()}
            </span>
          )}
          {task.due_date && (
            <span
              className={`d-flex align-items-center gap-1 ${
                task.status !== "Done" && new Date(`${task.due_date}T23:59:59`) < new Date()
                  ? "text-danger fw-bold"
                  : "text-muted"
              } mb-1`}
              style={{ fontSize: "11px" }}
            >
              <Calendar size={11} className={task.status !== "Done" && new Date(`${task.due_date}T23:59:59`) < new Date() ? "text-danger" : "text-slate-400"} /> Due: {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Checklist Progress Bar */}
        {checklistCount > 0 && (
          <div className="mt-2">
            <div className="d-flex justify-content-between text-muted" style={{ fontSize: "10px" }}>
              <span>Checklist</span>
              <span>{checklistDone}/{checklistCount}</span>
            </div>
            <div className="progress" style={{ height: "4px" }}>
              <div
                className="progress-bar bg-success"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Subtask indicator */}
        {subtaskCount > 0 && (
          <div className="text-muted mt-1 d-inline-flex align-items-center gap-1" style={{ fontSize: "11px" }}>
            <GitFork size={11} className="text-slate-400" style={{ transform: 'rotate(180deg)' }} /> {subtaskCount} Subtask{subtaskCount > 1 ? "s" : ""}
          </div>
        )}

        {/* Dependency indicator */}
        {task.dependency_task_id && (
          <div className="text-danger mt-1 fw-semibold d-inline-flex align-items-center gap-1" style={{ fontSize: "10px" }} title="Depends on another task">
            <Link size={10} className="text-danger" /> Has Dependency
          </div>
        )}

        <div className="kanban-task-footer mt-2 border-top pt-2 d-flex justify-content-between align-items-center">
          {renderPriorityDropdown(task)}
          <button className="chat-bubble-btn" onClick={() => handleOpenUpdatesDrawer(task)}>
            <ChatFill size={14} />
            {task.updates_count > 0 && <span className="chat-badge" style={{ fontSize: "9px" }}>{task.updates_count}</span>}
          </button>
        </div>
      </article>
    );
  };

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
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          const title = (newTaskTitles[groupId] || "").trim();
          if (title) {
            handleAddTask(groupId);
          } else {
            setTargetGroupId(groupId);
            setShowCreateTaskModal(true);
          }
        }}
      >
        <Plus size={16} />
        Add Task
      </Button>
    </div>
  );

  const renderOverviewView = () => (
    <DashboardView
      board={board}
      assignees={assignees}
      onTaskClick={handleTaskClickFromView}
    />
  );

  const renderListView = () => {
    const defaultGroupId = board.groups?.[0]?.id;
    return (
      <div className="workspace-list-view">
        {STATUS_OPTIONS.map((statusVal) => {
          const statusTasks = filteredTasks.filter((t) => t.status === statusVal);
          const statusMeta = STATUS_META[statusVal];
          const statusKey = defaultGroupId ? `${defaultGroupId}_${statusVal}` : `status_${statusVal}`;
          const isStatusCollapsed = collapsedStatuses[statusKey];
          
          const toggleStatusCollapse = () => {
            setCollapsedStatuses((prev) => ({
              ...prev,
              [statusKey]: !prev[statusKey],
            }));
          };

          return (
            <div key={statusVal} className="status-group-section mb-1">
              {/* Status Header */}
              <div className="status-group-header d-flex align-items-center py-1 px-1 mb-0" style={{ borderLeft: `3px solid ${statusMeta.color}` }}>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="status-collapse-btn p-0 border-0 bg-transparent"
                    onClick={toggleStatusCollapse}
                  >
                    <span className={`status-chevron d-inline-block ${isStatusCollapsed ? "collapsed" : ""}`} style={{ fontSize: "9px", color: "#64748b" }}>
                      ▼
                    </span>
                  </button>
                  <span className="badge rounded-pill text-white fw-bold px-2 py-1" style={{ backgroundColor: statusMeta.color, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {statusMeta.label}
                  </span>
                  <span className="text-muted small fw-semibold">
                    {statusTasks.length}
                  </span>
                </div>
              </div>

              {/* Status Tasks Table */}
              {!isStatusCollapsed && (
                <div className="workspace-table-container">
                  <table className="workspace-table">
                    <thead>
                      <tr>
                        <th style={{ width: "3%" }}></th>
                        <th style={{ width: "40%" }}>Name</th>
                        <th style={{ width: "15%" }}>Assignee</th>
                        <th style={{ width: "12%" }}>Due date</th>
                        <th style={{ width: "10%" }}>Priority</th>
                        <th style={{ width: "12%" }}>Status</th>
                        <th style={{ width: "5%" }}>Comments</th>
                        <th style={{ width: "3%" }}></th>
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
                                className="cell-editable-text flex-grow-1"
                                value={task.title}
                                onChange={(event) => {
                                  const val = event.target.value;
                                  patchTaskInState(task.id, (t) => ({ ...t, title: val }));
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
                              <button
                                type="button"
                                className="chat-bubble-btn"
                                onClick={() => handleOpenUpdatesDrawer(task)}
                              >
                                <MessageSquare size={13} className="text-slate-400" />
                                {task.updates_count > 0 && (
                                  <span className="chat-badge">{task.updates_count}</span>
                                )}
                              </button>
                            </div>
                          </td>
                          <td>{renderAssigneeCell(task)}</td>
                          <td>{renderDateCell(task, "due_date")}</td>
                          <td>{renderPriorityDropdown(task)}</td>
                          <td>{renderStatusDropdown(task)}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="chat-bubble-btn"
                              onClick={() => handleOpenUpdatesDrawer(task)}
                              style={{ opacity: 1 }}
                            >
                              <MessageSquare size={13} className="text-slate-300" />
                            </button>
                          </td>
                          <td>
                            {/* Three-dot context menu */}
                            <Dropdown align="end">
                              <Dropdown.Toggle as="button" className="task-row-menu-btn">
                                <MoreHorizontal size={16} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="task-context-menu">
                                <Dropdown.Item onClick={() => handleOpenUpdatesDrawer(task)}>
                                  <Edit3 size={14} /> Rename
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => {
                                  navigator.clipboard.writeText(task.title);
                                }}>
                                  <Copy size={14} /> Copy name
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/admin/boards/${boardId}?task=${task.id}`);
                                }}>
                                  <ClipboardCopy size={14} /> Copy link
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => handleTaskCellChange(task.id, "status", "Done")}>
                                  <CheckCircleFill size={14} className="text-success" /> Mark complete
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleOpenUpdatesDrawer(task)}>
                                  <MessageSquare size={14} /> Open task
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                  className="text-danger"
                                  onClick={() => {
                                    setDeleteTarget({ type: "task", id: task.id, name: task.title });
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <Trash2 size={14} /> Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}

                      {/* Inline Add Task Builder Row */}
                      {defaultGroupId && (
                        <tr>
                          <td colSpan="8" className="py-1">
                            {inlineTaskBuilders[statusKey]?.active ? (
                              <div className="clickup-inline-builder-row">
                                <span className="task-complete-dot me-1" style={{ borderColor: "#8c9baf", cursor: "default" }} />
                                <input
                                  type="text"
                                  placeholder="Task name or type '/' for commands"
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
                                      handleAddTask(defaultGroupId, statusVal);
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
                                    onClick={() => handleAddTask(defaultGroupId, statusVal)}
                                    disabled={!(inlineTaskBuilders[statusKey]?.title || "").trim()}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="clickup-add-task-link"
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
                                <Plus size={14} /> Add Task
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderBoardView = () => {
    return (
      <div className="kanban-swimlane-container">
        {swimlanes.map((lane) => (
          <div key={lane.id} className="kanban-swimlane-row mb-4">
            {kanbanGrouping !== "none" && (
              <h4 className="swimlane-title py-2 px-3 bg-light rounded-3 border-start border-primary border-4 mb-3 fw-bold">
                {lane.name}
              </h4>
            )}
            <div className="kanban-board-view">
              {STATUS_OPTIONS.map((status) => {
                const laneTasks = getSwimlaneTasks(lane.id, status);
                return (
                  <section
                    key={status}
                    className="kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) =>
                      handleDrop(
                        e,
                        status,
                        kanbanGrouping === "priority" ? lane.id : null
                      )
                    }
                  >
                    <div className="kanban-column-header d-flex justify-content-between align-items-center">
                      <span className={`monday-badge ${STATUS_META[status].className}`}>
                        {STATUS_META[status].label}
                      </span>
                      <span className="badge bg-secondary text-white rounded-pill">
                        {laneTasks.length}
                      </span>
                    </div>
                    <div className="kanban-card-stack mt-2">
                      {laneTasks.map((task) => renderKanbanCard(task))}
                      {laneTasks.length === 0 && (
                        <div className="kanban-empty py-4 text-center text-muted small">
                          Drag tasks here
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSkeletonLoader = () => (
    <div className="workspace-shell">
      {/* Skeleton Sidebar */}
      <aside className="workspace-secondary-sidebar" style={{ opacity: 0.6 }}>
        <div className="workspace-secondary-header">
          <div>
            <div className="skeleton-loader" style={{ width: 70, height: 10, marginBottom: 8 }} />
            <div className="skeleton-loader" style={{ width: 130, height: 18 }} />
          </div>
        </div>
        <div className="workspace-secondary-body">
          {[1, 2, 3].map((section) => (
            <div key={section} className="workspace-secondary-section">
              <div className="skeleton-loader" style={{ width: 90, height: 9, marginBottom: 10, marginLeft: 6 }} />
              {[1, 2].map((item) => (
                <div key={item} className="skeleton-sidebar-item">
                  <div className="skeleton-loader skeleton-icon" />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-loader skeleton-text" style={{ width: '80%', marginBottom: 4 }} />
                    <div className="skeleton-loader skeleton-text-sm" style={{ width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Skeleton Content */}
      <div className="workspace-content-pane">
        {/* Skeleton Topbar */}
        <div className="workspace-panel workspace-topbar" style={{ opacity: 0.5 }}>
          <div style={{ flex: 1 }}>
            <div className="skeleton-loader" style={{ width: 140, height: 11, marginBottom: 10 }} />
            <div className="skeleton-loader" style={{ width: 220, height: 24, marginBottom: 8 }} />
            <div className="skeleton-loader" style={{ width: 300, height: 13 }} />
          </div>
        </div>

        {/* Skeleton Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, opacity: 0.4 }}>
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="skeleton-loader" style={{ width: w, height: 30, borderRadius: 8 }} />
          ))}
        </div>

        {/* Skeleton Table Groups */}
        {[1, 2].map((group) => (
          <div key={group} className="skeleton-group">
            <div className="skeleton-group-header">
              <div className="skeleton-loader" style={{ width: 10, height: 10, borderRadius: 3 }} />
              <div className="skeleton-loader" style={{ width: 120, height: 16, borderRadius: 6 }} />
              <div className="skeleton-loader skeleton-badge" style={{ width: 50 }} />
            </div>
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="skeleton-table-row">
                <div className="skeleton-loader" style={{ width: 16, height: 16, borderRadius: 3 }} />
                <div className="skeleton-loader skeleton-text" style={{ width: '90%' }} />
                <div className="skeleton-loader skeleton-avatar" style={{ width: 26, height: 26 }} />
                <div className="skeleton-loader skeleton-badge" />
                <div className="skeleton-loader skeleton-badge" />
                <div className="skeleton-loader skeleton-text" style={{ width: '70%' }} />
                <div className="skeleton-loader skeleton-text" style={{ width: '70%' }} />
                <div className="skeleton-loader skeleton-text" style={{ width: '60%' }} />
                <div className="skeleton-loader skeleton-text" style={{ width: '50%' }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return renderSkeletonLoader();
  }

  if (!board) {
    return (
      <div className="workspace-panel">
        <Alert variant="danger">Space not found.</Alert>
      </div>
    );
  }

  // Handle task click inside views
  const handleTaskClickFromView = (taskId) => {
    const task = allTasks.find((t) => t.id === taskId);
    if (task) {
      handleOpenUpdatesDrawer(task);
    }
  };

  return (
    <>
      <div className="workspace-topbar mb-3 py-2 border-bottom d-flex align-items-center justify-content-between">
        <div>
          <div className="workspace-breadcrumb">Spaces / {board.name}</div>
          <div className="workspace-title-row d-flex align-items-center gap-2">
            <h2 className="mb-0 fs-4 fw-bold text-slate-800">{board.name}</h2>
            {saving && (
              <span className="sync-pill">
                <Spinner size="sm" animation="border" />
                Saving
              </span>
            )}
          </div>
          {board.description && (
            <div className="board-description-text text-muted small mt-1">
              {board.description}
            </div>
          )}
        </div>

        <div className="workspace-actions d-flex align-items-center gap-2">
          <Button variant="light" size="sm" className="workspace-icon-action" onClick={() => setShowSpaceSettingsModal(true)}>
            {board.is_private ? "Private Space" : "Space Access"}
          </Button>
          <Button variant="light" size="sm" className="workspace-icon-action" onClick={() => setActiveView("overview")}>
            Overview
          </Button>
          <Button variant="primary" size="sm" onClick={() => {
            setTargetGroupId(board.groups?.[0]?.id || null);
            setShowCreateTaskModal(true);
          }}>
            <Plus size={14} className="me-1" />
            Add Task
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* View Tab Selector Bar */}
      <div className="workspace-viewbar mb-3">
        <div className="workspace-tabs">
          {VIEW_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`workspace-tab ${activeView === key ? "active" : ""}`}
              onClick={() => {
                setActiveView(key);
                setSelectedTaskIds([]);
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        <div className="workspace-toolbar-actions">
          <button type="button" className="workspace-tool-btn">
            {boardStats.overdue} overdue
          </button>
          <button
            type="button"
            className="clickup-top-task-btn"
            onClick={() => {
              setTargetGroupId(board.groups?.[0]?.id || null);
              setShowCreateTaskModal(true);
            }}
          >
            <Plus size={14} /> Task
          </button>
        </div>
      </div>

      {activeView !== "calendar" && activeView !== "gantt" && (
        <div className="workspace-panel bg-white p-3 rounded-3 shadow-sm border mb-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* Left: View Filters & Search */}
            <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
              <div className="position-relative" style={{ minWidth: "200px" }}>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="form-control form-control-sm ps-4"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
                <Search size={14} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: "10px" }} />
              </div>

              {/* Assignee Filter */}
              <select
                className="form-select form-select-sm"
                style={{ width: "130px" }}
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
              >
                <option value="">Filter Owner</option>
                {assignees.map((a) => (
                  <option key={`${a.role}_${a.id}`} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                className="form-select form-select-sm"
                style={{ width: "130px" }}
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="">Filter Priority</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                className="form-select form-select-sm"
                style={{ width: "130px" }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Filter Category</option>
                {[...new Set(allTasks.map((t) => t.category).filter(Boolean))].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              
              {/* Clear Filters Button */}
              {(filterQuery || filterAssignee || filterPriority || filterCategory) && (
                <button
                  className="btn btn-link btn-sm text-decoration-none text-danger p-0 ms-2"
                  onClick={() => {
                    setFilterQuery("");
                    setFilterAssignee("");
                    setFilterPriority("");
                    setFilterCategory("");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Right: Group, Sort, Swimlanes, Saved Views */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Group By Selector removed to keep flat status grouping */}

              {/* Swimlane Selector (Only shown in kanban view) */}
              {activeView === "board" && (
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted small">Swimlane:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "120px" }}
                    value={kanbanGrouping}
                    onChange={(e) => setKanbanGrouping(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="priority">Priority</option>
                    <option value="assignee">Assignee</option>
                  </select>
                </div>
              )}

              {/* Sort Controls */}
              <div className="d-flex align-items-center gap-1">
                <span className="text-muted small">Sort:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "110px" }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="position">Position</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                  <option value="priority">Priority</option>
                  <option value="due_date">Due Date</option>
                  <option value="start_date">Start Date</option>
                  <option value="category">Category</option>
                </select>
                <button
                  className="btn btn-outline-secondary btn-sm p-1 d-flex align-items-center justify-content-center"
                  style={{ width: "28px", height: "28px" }}
                  onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>

              {/* Saved Views Dropdown */}
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-primary" size="sm" id="saved-views-dropdown">
                  {currentViewName || "Views"}
                </Dropdown.Toggle>
                <Dropdown.Menu className="p-3" style={{ minWidth: "260px" }}>
                  <h6 className="dropdown-header px-0 text-slate-800 fw-bold">Apply Saved View</h6>
                  {savedViews.length === 0 ? (
                    <span className="text-muted small d-block my-2">No saved views yet.</span>
                  ) : (
                    savedViews.map((v) => (
                      <div key={v.name} className="d-flex justify-content-between align-items-center my-1 gap-2">
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-decoration-none text-start text-dark text-truncate fw-semibold flex-grow-1"
                          onClick={() => handleApplyView(v.name)}
                        >
                          {v.name}
                        </button>
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-danger p-0"
                          onClick={() => handleDeleteView(v.name)}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                  <Dropdown.Divider />
                  <h6 className="dropdown-header px-0 text-slate-800 fw-bold">Save Current View</h6>
                  <div className="input-group input-group-sm mt-1">
                    <input
                      type="text"
                      placeholder="View Name"
                      className="form-control"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSaveView} disabled={!newViewName.trim()}>
                      Save
                    </button>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </div>
      )}

      {activeView === "overview" && renderOverviewView()}
      {activeView === "list" && renderListView()}
      {activeView === "board" && renderBoardView()}
      {activeView === "calendar" && (
        <CalendarView
          boardId={Number(boardId)}
          onTaskClick={handleTaskClickFromView}
          assignees={assignees}
          refreshWorkspace={refreshWorkspace}
        />
      )}
      {activeView === "gantt" && (
        <GanttView
          board={board}
          onTaskClick={handleTaskClickFromView}
        />
      )}
      {activeView === "docs" && (
        <DocsView
          boardId={Number(boardId)}
        />
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedTaskIds.length > 0 && (
        <div
          className="position-fixed bottom-4 start-50 translate-middle-x bg-dark text-white p-3 rounded-4 shadow-lg d-flex align-items-center gap-3"
          style={{ zIndex: 1050, bottom: "24px" }}
        >
          <div className="fw-semibold small">
            {selectedTaskIds.length} task(s) selected
          </div>
          
          <Dropdown>
            <Dropdown.Toggle variant="outline-light" size="sm">
              Status
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {STATUS_OPTIONS.map((status) => (
                <Dropdown.Item key={status} onClick={() => handleBulkStatusChange(status)}>
                  {STATUS_META[status]?.label || status}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown>
            <Dropdown.Toggle variant="outline-light" size="sm">
              Priority
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {PRIORITY_OPTIONS.map((p) => (
                <Dropdown.Item key={p} onClick={() => handleBulkPriorityChange(p)}>
                  {p}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={handleBulkDelete}>
            <Trash size={14} /> Delete
          </button>
          
          <button className="btn btn-link btn-sm text-white text-decoration-none" onClick={() => setSelectedTaskIds([])}>
            Cancel
          </button>
        </div>
      )}

      {activeTaskId && activeTask && (
        <UpdatesDrawer taskId={activeTaskId} task={activeTask} onClose={handleCloseUpdatesDrawer} allTasks={allTasks} />
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

      <CreateTaskModal
        show={showCreateTaskModal}
        onHide={() => {
          setShowCreateTaskModal(false);
          setTargetGroupId(null);
        }}
        boards={boards}
        members={assignees}
        initialBoardId={board.id}
        initialGroupId={targetGroupId}
        onTaskCreated={handleCreateTaskModalSubmit}
      />
    </>
  );
};

export default BoardDetailPage;
