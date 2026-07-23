import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Dropdown, Spinner, OverlayTrigger, Popover, Tooltip, Modal, Form } from "react-bootstrap";
import DOMPurify from "dompurify";
import {
  Calendar3,
  ChatFill,
  CheckCircleFill,
  PaletteFill,
  Plus,
  Trash,
} from "react-bootstrap-icons";
import { FileText, LayoutList, Kanban, Flag, User, Calendar, BookOpen, Folder, Repeat, GitFork, Link, MoreHorizontal, Copy, Star, Edit3, Bell, ArrowRight, PlusSquare, Layers, ClipboardCopy, Zap, Clock, Mail, Archive, Trash2, MessageSquare, Search, AlignLeft, Table, PieChart, Image, Activity, Share2, Users, MapPin, Pin, Settings, Lock, Filter, RefreshCw, Columns, ChevronDown, Send, MousePointer, Type, PenTool, StickyNote, Eraser, Square, Target, Paperclip, Hash, Globe, DollarSign, CheckSquare, PlusCircle, ArrowLeft, ListPlus, Tag, Sparkles, Phone, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";

import UpdatesDrawer from "../../components/admin/UpdatesDrawer";
import InlineCommentPanel from "../../components/admin/workspace/InlineCommentPanel";
import SleekAssigneeSelector from "../../components/admin/SleekAssigneeSelector";
import SleekStatusSelector from "../../components/admin/SleekStatusSelector";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import SpaceSettingsModal from "../../components/admin/workspace/SpaceSettingsModal";
import CreateTaskModal from "../../components/admin/workspace/CreateTaskModal";
import SpreadsheetImportModal from "../../components/admin/workspace/SpreadsheetImportModal";
import CalendarView from "../../components/admin/workspace/CalendarView";
import GanttView from "../../components/admin/workspace/GanttView";
import DocsView from "../../components/admin/workspace/DocsView";
import DashboardView from "../../components/admin/workspace/DashboardView";
import CustomFieldsView from "../../components/admin/workspace/CustomFieldsView";
import FilesView from "../../components/admin/workspace/FilesView";
import FormView from "../../components/admin/workspace/FormView";
import TimesheetsView from "../../components/admin/workspace/TimesheetsView";
import MilestonesView from "../../components/admin/workspace/MilestonesView";
import { useWorkspace } from "../../components/admin/workspace/WorkspaceLayout";
import { useAuth } from "../../context/AuthContext";
import { getActivityLogs } from "../../services/activityService";
import {
  createBoard,
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
  uploadTaskAttachment,
  bulkMoveTasks,
  bulkUpdateCustomFields,
} from "../../services/boardService";
import api from "../../utils/api";
import "../../styles/Boards.css";
import "../../styles/WorkspaceShell.css";

const DEFAULT_STATUS_OPTIONS = ["Not Started", "In Progress", "Done"];
const PRIORITY_OPTIONS = ["Urgent", "High", "Normal", "Low"];

const DEFAULT_STATUS_META = {
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

const ALL_AVAILABLE_VIEWS = [
  { type: "overview", label: "Overview", icon: FileText, desc: "Project landing page" },
  { type: "list", label: "List", icon: LayoutList, desc: "To-do list layout" },
  { type: "board", label: "Board", icon: Kanban, desc: "Kanban board" },
  { type: "table", label: "Table", icon: Table, desc: "Spreadsheet style" },
  { type: "calendar", label: "Calendar", icon: Calendar, desc: "Calendar view" },
  { type: "gantt", label: "Gantt", icon: Calendar3, desc: "Gantt Chart" },
  { type: "files", label: "Files", icon: Folder, desc: "File folder storage" },
  { type: "docs", label: "Doc", icon: FileText, desc: "Wiki pages" },
  { type: "form", label: "Form", icon: ClipboardCopy, desc: "Survey sheets" },
  { type: "timesheets", label: "Timesheets", icon: Clock, desc: "Time tracking log" },
  { type: "custom_fields", label: "Custom Fields", icon: Layers, desc: "Field manager" },
  { type: "milestones", label: "Milestones", icon: Target, desc: "Project milestones" },
  { type: "timeline", label: "Timeline", icon: Calendar, desc: "Roadmap view" },
  { type: "dashboard", label: "Dashboard", icon: PieChart, desc: "Reports" },
  { type: "whiteboard", label: "Whiteboard", icon: Image, desc: "Canvas drawing" },
  { type: "activity", label: "Activity", icon: Activity, desc: "Audit feed" },
  { type: "mind_map", label: "Mind Map", icon: Share2, desc: "Visual ideas" },
  { type: "team", label: "Team", icon: Users, desc: "Capacity view" },
  { type: "map", label: "Map", icon: MapPin, desc: "Geographic layout" },
];

const getViewIcon = (type) => {
  switch (type) {
    case "overview": return FileText;
    case "list": return LayoutList;
    case "board": return Kanban;
    case "table": return Table;
    case "calendar": return Calendar;
    case "gantt": return Calendar3;
    case "files": return Folder;
    case "docs": return BookOpen;
    case "form": return ClipboardCopy;
    case "timesheets": return Clock;
    case "custom_fields": return Layers;
    case "milestones": return Target;
    case "timeline": return Calendar;
    case "dashboard": return PieChart;
    case "whiteboard": return Image;
    case "activity": return Activity;
    case "mind_map": return Share2;
    case "team": return Users;
    case "map": return MapPin;
    default: return FileText;
  }
};

const CustomFieldTextInput = ({ initialValue, type, onSave, placeholder }) => {
  const [val, setVal] = useState(initialValue || "");

  useEffect(() => {
    setVal(initialValue || "");
  }, [initialValue]);

  const handleBlur = () => {
    if (val !== initialValue) {
      onSave(val);
    }
  };

  return (
    <input
      type={type}
      className="cell-editable-text w-100"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      }}
      placeholder={placeholder || "-"}
    />
  );
};

const CustomFieldNumberInput = ({ initialValue, onSave, placeholder }) => {
  const [val, setVal] = useState(initialValue !== undefined && initialValue !== null ? initialValue : "");

  useEffect(() => {
    setVal(initialValue !== undefined && initialValue !== null ? initialValue : "");
  }, [initialValue]);

  const handleBlur = () => {
    if (val !== initialValue) {
      onSave(val !== "" ? Number(val) : "");
    }
  };

  return (
    <input
      type="number"
      className="cell-editable-text w-100"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      }}
      placeholder={placeholder || "-"}
    />
  );
};

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
  const [showCreateStatusModal, setShowCreateStatusModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#673de6");
  
  const [showInlineStatusCreator, setShowInlineStatusCreator] = useState(false);
  const [inlineStatusName, setInlineStatusName] = useState("");
  const [inlineStatusColor, setInlineStatusColor] = useState("#673de6");

  const [statusInlineCreatorAbove, setStatusInlineCreatorAbove] = useState(null);
  const [renamingStatusVal, setRenamingStatusVal] = useState(null);
  const [renameStatusText, setRenameStatusText] = useState("");
  const [showEditStatusesModal, setShowEditStatusesModal] = useState(false);
  const [modalStatuses, setModalStatuses] = useState([]);
  const [collapsedTasks, setCollapsedTasks] = useState({});

  useEffect(() => {
    if (showEditStatusesModal) {
      const current = board?.custom_statuses && board.custom_statuses.length > 0
        ? board.custom_statuses
        : [
            { id: "Not Started", label: "To do", color: "#7c8798", type: "Not Started" },
            { id: "In Progress", label: "In progress", color: "#6d45f7", type: "Active" },
            { id: "Done", label: "Complete", color: "#00b67a", type: "Done" }
          ];
      const withType = current.map(s => {
        if (s.type) return s;
        if (s.id === "Not Started" || s.label === "To do") return { ...s, type: "Not Started" };
        if (s.id === "Done" || s.label === "Complete" || s.label === "Closed" || s.label === "Done") return { ...s, type: "Done" };
        return { ...s, type: "Active" };
      });
      setModalStatuses(withType);
    }
  }, [showEditStatusesModal, board]);

  const STATUS_OPTIONS = useMemo(() => {
    if (board?.custom_statuses && board.custom_statuses.length > 0) {
      return board.custom_statuses.map((s) => s.id);
    }
    return DEFAULT_STATUS_OPTIONS;
  }, [board]);

  const STATUS_META = useMemo(() => {
    if (board?.custom_statuses && board.custom_statuses.length > 0) {
      const meta = {};
      board.custom_statuses.forEach((s) => {
        meta[s.id] = {
          label: s.label || s.id,
          className: `badge-status-${s.id.toLowerCase().replace(/\s+/g, "-")}`,
          color: s.color || "#7c8798",
        };
      });
      return meta;
    }
    return DEFAULT_STATUS_META;
  }, [board]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [activeView, setActiveView] = useState("list");
  const [collapsedStatuses, setCollapsedStatuses] = useState({});
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeCommentTaskId, setActiveCommentTaskId] = useState(null);

  const [newTaskTitles, setNewTaskTitles] = useState({});
  const [addingTask, setAddingTask] = useState({});
  const [inlineTaskBuilders, setInlineTaskBuilders] = useState({});
  const [inlineSubtaskBuilders, setInlineSubtaskBuilders] = useState({});
  const [inlineSubtaskMeta, setInlineSubtaskMeta] = useState({});
  const [addingGroup, setAddingGroup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSpaceSettingsModal, setShowSpaceSettingsModal] = useState(false);
  const [updatingSpaceSettings, setUpdatingSpaceSettings] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showSpreadsheetImportModal, setShowSpreadsheetImportModal] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState(null);

  // Sorting & Grouping
  const [sortBy, setSortBy] = useState("position");
  const [sortOrder, setSortOrder] = useState("asc");
  const [groupBy, setGroupBy] = useState("status");
  const [kanbanGrouping, setKanbanGrouping] = useState("none");

  // Filters
  const [filterQuery, setFilterQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const isMeFiltered = String(filterAssignee) === String(user?.id);
  const handleToggleMeFilter = () => {
    if (isMeFiltered) {
      setFilterAssignee("");
    } else {
      setFilterAssignee(String(user?.id));
    }
  };

  // Bulk Actions
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // Move Tasks Modal State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetTasks, setMoveTargetTasks] = useState([]);
  const [destSpaceId, setDestSpaceId] = useState("");
  const [destFolderId, setDestFolderId] = useState("");
  const [destListId, setDestListId] = useState("");
  const [destGroupId, setDestGroupId] = useState("");
  const [destGroups, setDestGroups] = useState([]);
  const [loadingDestGroups, setLoadingDestGroups] = useState(false);

  // Bulk Custom Fields State
  const [boardCustomFields, setBoardCustomFields] = useState([]);
  const [showBulkCustomFieldsModal, setShowBulkCustomFieldsModal] = useState(false);
  const [selectedBulkFieldId, setSelectedBulkFieldId] = useState("");
  const [bulkFieldValue, setBulkFieldValue] = useState("");

  // Custom Fields Offcanvas States
  const [showCustomFieldsOffcanvas, setShowCustomFieldsOffcanvas] = useState(false);
  const [customFieldsOffcanvasTab, setCustomFieldsOffcanvasTab] = useState("create");

  // Custom Fields Offcanvas Form States
  const [selectedFieldType, setSelectedFieldType] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldDesc, setFieldDesc] = useState("");
  const [fieldDefaultValue, setFieldDefaultValue] = useState("");
  const [fieldOptions, setFieldOptions] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPinned, setFieldPinned] = useState(false);
  const [fieldVisibleToGuests, setFieldVisibleToGuests] = useState(true);
  const [offcanvasStep, setOffcanvasStep] = useState(1);
  const [offcanvasSearchQuery, setOffcanvasSearchQuery] = useState("");
  const [workspaceFields, setWorkspaceFields] = useState([]);
  const [loadingWorkspaceFields, setLoadingWorkspaceFields] = useState(false);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [savingField, setSavingField] = useState(false);

  // Custom Field Manager & Column Editing States
  const [showFieldManagerModal, setShowFieldManagerModal] = useState(false);
  const [managerSelectedLocation, setManagerSelectedLocation] = useState("all");
  const [managerFields, setManagerFields] = useState([]);
  const [loadingManagerFields, setLoadingManagerFields] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState("");
  const [editingCustomField, setEditingCustomField] = useState(null);
  const [editFieldNameInput, setEditFieldNameInput] = useState("");
  const [showDeleteConfirmFieldId, setShowDeleteConfirmFieldId] = useState(null);
  const [managerEditingFieldId, setManagerEditingFieldId] = useState(null);
  const [managerEditingFieldName, setManagerEditingFieldName] = useState("");
  const [managerDeletingFieldId, setManagerDeletingFieldId] = useState(null);
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState("");

  // Advanced dropdown/labels option builder states
  const [fieldOptionsList, setFieldOptionsList] = useState([
    { label: "Simple", color: "#10b981" },
    { label: "Moderate", color: "#f59e0b" },
    { label: "Complex", color: "#ef4444" }
  ]);
  const [newOptionText, setNewOptionText] = useState("");

  // Button field configuration states
  const [buttonName, setButtonName] = useState("");
  const [buttonColor, setButtonColor] = useState("#64748b");

  // Money configuration state
  const [currencyCode, setCurrencyCode] = useState("USD");

  // Hidden Columns State
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    try {
      const stored = localStorage.getItem(`hidden_columns_${boardId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const [deletingFieldId, setDeletingFieldId] = useState(null);

  useEffect(() => {
    if (boardId) {
      try {
        const stored = localStorage.getItem(`hidden_columns_${boardId}`);
        if (stored) {
          setHiddenColumns(JSON.parse(stored));
        } else {
          setHiddenColumns([]);
        }
      } catch (e) {
        setHiddenColumns([]);
      }
    }
  }, [boardId]);

  const toggleHideColumn = (colKey) => {
    const keyStr = String(colKey);
    setHiddenColumns((prev) => {
      const isHidden = prev.includes(keyStr);
      const updated = isHidden ? prev.filter((c) => c !== keyStr) : [...prev, keyStr];
      if (boardId) {
        localStorage.setItem(`hidden_columns_${boardId}`, JSON.stringify(updated));
      }
      toast.info(isHidden ? `Column shown` : `Column hidden`);
      return updated;
    });
  };

  const isColHidden = (key) => hiddenColumns.includes(String(key));

  // List View Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);
  const [dragOverPos, setDragOverPos] = useState("below");
  const [dragOverStatusGroup, setDragOverStatusGroup] = useState(null);

  const handleListRowDragStart = (e, task) => {
    e.dataTransfer.setData("text/plain", String(task.id));
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(task.id);
  };

  const handleListRowDragOver = (e, targetTask) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!targetTask || draggedTaskId === targetTask.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "above" : "below";
    setDragOverTaskId(targetTask.id);
    setDragOverPos(pos);
    setDragOverStatusGroup(targetTask.status);
  };

  const handleListRowDragLeave = (e, targetTask) => {
    if (dragOverTaskId === targetTask.id) {
      setDragOverTaskId(null);
    }
  };

  const handleListRowDrop = async (e, targetTask, targetStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragOverStatusGroup(null);

    if (!taskIdStr) return;
    const sourceTaskId = Number(taskIdStr);

    const sourceTask = allTasks.find((t) => t.id === sourceTaskId);
    if (!sourceTask) return;

    const statusChanged = sourceTask.status !== targetStatus;

    setBoard((prev) => {
      if (!prev || !prev.groups) return prev;
      return {
        ...prev,
        groups: prev.groups.map((group) => {
          let tasks = [...(group.tasks || [])];
          const itemIdx = tasks.findIndex((t) => t.id === sourceTaskId);
          if (itemIdx === -1) return group;

          const [movedItem] = tasks.splice(itemIdx, 1);
          movedItem.status = targetStatus;

          if (targetTask) {
            let targetIdx = tasks.findIndex((t) => t.id === targetTask.id);
            if (targetIdx !== -1) {
              if (dragOverPos === "below") targetIdx += 1;
              tasks.splice(targetIdx, 0, movedItem);
            } else {
              tasks.push(movedItem);
            }
          } else {
            tasks.push(movedItem);
          }

          tasks = tasks.map((t, idx) => ({ ...t, position: idx }));
          return { ...group, tasks };
        }),
      };
    });

    if (statusChanged) {
      try {
        await updateTask(sourceTaskId, { status: targetStatus });
      } catch (err) {
        toast.error("Failed to update status on drag and drop.");
        fetchWorkspace(false);
      }
    }
  };

  const handleStatusSectionDragOver = (e, statusVal) => {
    e.preventDefault();
    setDragOverStatusGroup(statusVal);
  };

  const handleStatusSectionDrop = async (e, statusVal) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragOverStatusGroup(null);

    if (!taskIdStr) return;
    const sourceTaskId = Number(taskIdStr);
    const sourceTask = allTasks.find((t) => t.id === sourceTaskId);
    if (!sourceTask || sourceTask.status === statusVal) return;

    patchTaskInState(sourceTaskId, (t) => ({ ...t, status: statusVal }));
    try {
      await updateTask(sourceTaskId, { status: statusVal });
    } catch (err) {
      toast.error("Failed to update status.");
      fetchWorkspace(false);
    }
  };

  const CLICKUP_PALETTE_COLORS = [
    "#a855f7", "#818cf8", "#38bdf8", "#2dd4bf", "#4ade80", "#facc15", "#fb923c",
    "#6366f1", "#2563eb", "#0ea5e9", "#0d9488", "#16a34a", "#eab308", "#ea580c",
    "#f43f5e", "#ec4899", "#d946ef", "#d97706", "#78716c", "#94a3b8", "#ef4444",
    "#be185d", "#8b5cf6", "#7c2d12", "#1e293b", "#64748b"
  ];

  const getClickUpOptionStyle = (colorHex) => {
    if (!colorHex) return { backgroundColor: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" };
    let hex = colorHex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.substring(0, 2), 16) || 100;
    const g = parseInt(hex.substring(2, 4), 16) || 100;
    const b = parseInt(hex.substring(4, 6), 16) || 100;
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.16)`,
      color: colorHex,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`
    };
  };

  const fetchWorkspaceFields = async () => {
    try {
      setLoadingWorkspaceFields(true);
      const res = await api.get("/board-extensions/custom-fields/workspace");
      setWorkspaceFields(res.data || []);
    } catch (err) {
      console.error("Failed to fetch workspace custom fields:", err);
    } finally {
      setLoadingWorkspaceFields(false);
    }
  };

  useEffect(() => {
    if (showCustomFieldsOffcanvas && customFieldsOffcanvasTab === "existing") {
      fetchWorkspaceFields();
    }
  }, [showCustomFieldsOffcanvas, customFieldsOffcanvasTab]);

  // Bulk Tags State
  const [showBulkTagsModal, setShowBulkTagsModal] = useState(false);
  const [bulkTagsValue, setBulkTagsValue] = useState("");

  const handleOpenMoveTaskModal = (task) => {
    const tasksToMove = task ? [task] : selectedTaskIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean);
    if (tasksToMove.length === 0) return;
    setMoveTargetTasks(tasksToMove);
    
    const firstTask = tasksToMove[0];
    const firstTaskGroup = board.groups?.find(g => g.id === firstTask.group_id);
    const currentBoard = boards.find(b => b.id === (firstTaskGroup?.board_id || boardId));
    
    let initialSpaceId = "";
    if (currentBoard) {
      if (currentBoard.parent_id === null) {
        initialSpaceId = currentBoard.id;
      } else {
        const parent = boards.find(b => b.id === currentBoard.parent_id);
        if (parent) {
          initialSpaceId = parent.parent_id === null ? parent.id : parent.parent_id;
        }
      }
    }
    setDestSpaceId(initialSpaceId);
    setDestFolderId("");
    setDestListId("");
    setDestGroupId("");
    setDestGroups([]);
    setShowMoveModal(true);
  };

  const handleSpaceChange = (spaceId) => {
    setDestSpaceId(spaceId);
    setDestFolderId("");
    if (!spaceId) {
      setDestListId("");
      setDestGroupId("");
      setDestGroups([]);
      return;
    }
    const spaceLists = boards.filter(b => b.parent_id === Number(spaceId) && !b.is_folder);
    if (spaceLists.length === 0) {
      setDestListId("CREATE_DEFAULT");
      setDestGroupId("CREATE_DEFAULT_GROUP");
    } else {
      setDestListId("");
      setDestGroupId("");
    }
    setDestGroups([]);
  };

  const handleFolderChange = (folderId) => {
    setDestFolderId(folderId);
    setDestListId("");
    setDestGroupId("");
    setDestGroups([]);
  };

  const handleListSelect = async (listId) => {
    setDestListId(listId);
    if (!listId) {
      setDestGroups([]);
      setDestGroupId("");
      return;
    }
    setLoadingDestGroups(true);
    try {
      const res = await getBoard(listId);
      setDestGroups(res.groups || []);
      if (res.groups && res.groups.length > 0) {
        setDestGroupId(res.groups[0].id);
      } else {
        setDestGroupId("");
      }
    } catch (err) {
      toast.error("Failed to load target list statuses.");
    } finally {
      setLoadingDestGroups(false);
    }
  };

  const handleExecuteMove = async () => {
    if (!destGroupId) return;
    setSaving(true);
    try {
      let finalGroupId = destGroupId;
      if (destListId === "CREATE_DEFAULT") {
        const defaultList = await createBoard({
          name: "General",
          parent_id: Number(destSpaceId),
          is_private: false,
          is_folder: false
        });
        const boardDetail = await getBoard(defaultList.id);
        if (boardDetail.groups && boardDetail.groups.length > 0) {
          finalGroupId = boardDetail.groups[0].id;
        } else {
          throw new Error("Failed to create default group in new list");
        }
      }

      const taskIds = moveTargetTasks.map(t => t.id);
      await bulkMoveTasks(taskIds, Number(finalGroupId));
      
      setBoard((prev) => ({
        ...prev,
        groups: prev.groups.map(g => ({
          ...g,
          tasks: (g.tasks || []).filter(t => !taskIds.includes(t.id))
        }))
      }));
      
      setSelectedTaskIds([]);
      setShowMoveModal(false);
      toast.success(`Successfully moved ${taskIds.length} task(s)!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to move tasks.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkTagsChange = () => {
    setBulkTagsValue("");
    setShowBulkTagsModal(true);
  };

  const handleSaveBulkTags = async () => {
    setSaving(true);
    try {
      await Promise.all(selectedTaskIds.map(id => updateTask(id, { tags: bulkTagsValue })));
      selectedTaskIds.forEach(id => {
        patchTaskInState(id, (task) => ({ ...task, tags: bulkTagsValue }));
      });
      setSelectedTaskIds([]);
      setShowBulkTagsModal(false);
      toast.success("Tags updated in bulk!");
    } catch (err) {
      toast.error("Failed to update tags in bulk.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenBulkCustomFields = async () => {
    try {
      const res = await api.get(`/board-extensions/boards/${boardId}/custom-fields`);
      setBoardCustomFields(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedBulkFieldId(res.data[0].id);
      } else {
        setSelectedBulkFieldId("");
      }
      setBulkFieldValue("");
      setShowBulkCustomFieldsModal(true);
    } catch (err) {
      toast.error("Failed to load custom fields for this board.");
    }
  };

  const handleSaveBulkCustomFields = async () => {
    if (!selectedBulkFieldId) return;
    setSaving(true);
    try {
      let val = bulkFieldValue;
      const field = boardCustomFields.find(f => f.id === Number(selectedBulkFieldId));
      if (field) {
        if (field.type === 'number' || field.type === 'rating') {
          val = Number(bulkFieldValue);
        }
      }
      await bulkUpdateCustomFields(selectedTaskIds, Number(selectedBulkFieldId), val);
      setSelectedTaskIds([]);
      setShowBulkCustomFieldsModal(false);
      toast.success("Custom fields updated in bulk!");
      fetchWorkspace(false);
    } catch (err) {
      toast.error("Failed to update custom fields in bulk.");
    } finally {
      setSaving(false);
    }
  };

  // Saved Views
  const [savedViews, setSavedViews] = useState([]);
  const [currentViewName, setCurrentViewName] = useState("");
  const [newViewName, setNewViewName] = useState("");
  const [newViewPrivate, setNewViewPrivate] = useState(false);
  const [newViewPinned, setNewViewPinned] = useState(false);

  // Dynamic Space Views states
  const [boardViews, setBoardViews] = useState([]);
  const [renamingViewKey, setRenamingViewKey] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [sharingViewKey, setSharingViewKey] = useState(null);
  const [viewSearchQuery, setViewSearchQuery] = useState("");
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const sortedBoardViews = useMemo(() => {
    if (!boardViews) return [];
    return [...boardViews].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [boardViews]);

  const currentViewType = useMemo(() => {
    if (activeView === "overview" || activeView === "custom_fields") return activeView;
    const match = boardViews.find(v => v.key === activeView);
    return match ? match.type : activeView;
  }, [activeView, boardViews]);

  const filteredAvailableViews = useMemo(() => {
    const q = viewSearchQuery.trim().toLowerCase();
    if (!q) return ALL_AVAILABLE_VIEWS;
    return ALL_AVAILABLE_VIEWS.filter(v =>
      v.label.toLowerCase().includes(q) ||
      v.desc.toLowerCase().includes(q)
    );
  }, [viewSearchQuery]);

  const showMainToolbar = useMemo(() => {
    return ["list", "board", "table"].includes(currentViewType);
  }, [currentViewType]);
  
  // Interactive Whiteboard persisted notes state
  const [whiteboardNotes, setWhiteboardNotes] = useState(() => {
    try {
      const stored = localStorage.getItem(`whiteboard_notes_${boardId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load whiteboard notes", e);
    }
    return [
      { id: 1, text: "Brainstorming new features", color: "#fef08a", x: 40, y: 30, type: "sticky" },
      { id: 2, text: "Zbot-style views checklist", color: "#fbcfe8", x: 260, y: 50, type: "sticky" },
      { id: 3, text: "Staging deployment config notes", color: "#bbf7d0", x: 120, y: 200, type: "sticky" }
    ];
  });

  const [activeWhiteboardTool, setActiveWhiteboardTool] = useState("Pointer");
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Helper to persist whiteboard notes to localStorage
  const persistWhiteboardNotes = (notes) => {
    if (boardId) {
      localStorage.setItem(`whiteboard_notes_${boardId}`, JSON.stringify(notes));
    }
  };

  // Sync whiteboard notes when boardId changes
  useEffect(() => {
    if (!boardId) return;
    try {
      const stored = localStorage.getItem(`whiteboard_notes_${boardId}`);
      if (stored) {
        setWhiteboardNotes(JSON.parse(stored));
      } else {
        const defaultNotes = [
          { id: 1, text: "Brainstorming new features", color: "#fef08a", x: 40, y: 30, type: "sticky" },
          { id: 2, text: "Zbot-style views checklist", color: "#fbcfe8", x: 260, y: 50, type: "sticky" },
          { id: 3, text: "Staging deployment config notes", color: "#bbf7d0", x: 120, y: 200, type: "sticky" }
        ];
        setWhiteboardNotes(defaultNotes);
        persistWhiteboardNotes(defaultNotes);
      }
    } catch (e) {
      console.error(e);
    }
  }, [boardId]);

  // Canvas freehand drawing logic
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeWhiteboardTool === "Erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#4f46e5";
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && boardId) {
      localStorage.setItem(`whiteboard_drawing_${boardId}`, canvas.toDataURL());
    }
  };

  // Drag-and-drop handler for notes/shapes/text
  const handleNoteMouseDown = (noteId, e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") {
      return;
    }
    e.preventDefault();
    const noteElement = e.currentTarget;
    const canvasElement = noteElement.parentElement;
    const canvasRect = canvasElement.getBoundingClientRect();
    
    const startX = e.clientX - noteElement.offsetLeft;
    const startY = e.clientY - noteElement.offsetTop;
    
    const handleMouseMove = (moveEvent) => {
      let newX = moveEvent.clientX - startX;
      let newY = moveEvent.clientY - startY;
      
      const maxLeft = canvasRect.width - noteElement.offsetWidth;
      const maxTop = canvasRect.height - noteElement.offsetHeight;
      newX = Math.max(0, Math.min(newX, maxLeft));
      newY = Math.max(0, Math.min(newY, maxTop));
      
      setWhiteboardNotes(prev => prev.map(n => n.id === noteId ? { ...n, x: newX, y: newY } : n));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      
      // Persist the updated positions on drag release
      setWhiteboardNotes(currentNotes => {
        persistWhiteboardNotes(currentNotes);
        return currentNotes;
      });
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Re-initialize and size canvas when whiteboard view is loaded
  useEffect(() => {
    if (currentViewType !== "whiteboard") return;
    
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width || 800;
      canvas.height = rect.height || 450;
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#4f46e5";

      // Restore drawing from localStorage
      const savedDrawing = localStorage.getItem(`whiteboard_drawing_${boardId}`);
      if (savedDrawing) {
        const img = new Image();
        img.src = savedDrawing;
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentViewType, boardId]);

  useEffect(() => {
    if (boardId) {
      try {
        const stored = localStorage.getItem(`board_views_${boardId}`);
        if (stored) {
          setBoardViews(JSON.parse(stored));
        } else {
          const initialViews = [
            { key: "list", type: "list", label: "List", isPinned: false, isPrivate: false, isDefault: true, isFavorite: false },
            { key: "board", type: "board", label: "Board", isPinned: false, isPrivate: false, isDefault: false, isFavorite: false },
            { key: "table", type: "table", label: "Table", isPinned: false, isPrivate: false, isDefault: false, isFavorite: false },
            { key: "calendar", type: "calendar", label: "Calendar", isPinned: false, isPrivate: false, isDefault: false, isFavorite: false },
            { key: "gantt", type: "gantt", label: "Gantt", isPinned: false, isPrivate: false, isDefault: false, isFavorite: false },
            { key: "files", type: "files", label: "Files", isPinned: false, isPrivate: false, isDefault: false, isFavorite: false },
          ];
          setBoardViews(initialViews);
          localStorage.setItem(`board_views_${boardId}`, JSON.stringify(initialViews));
        }
      } catch (err) {
        console.error("Failed to load board views", err);
      }
    }
  }, [boardId]);

  const saveBoardViews = (newViews) => {
    setBoardViews(newViews);
    localStorage.setItem(`board_views_${boardId}`, JSON.stringify(newViews));
  };

  const handleRenameView = (key, newLabel) => {
    if (!newLabel.trim()) return;
    const updated = boardViews.map(v => v.key === key ? { ...v, label: newLabel.trim() } : v);
    saveBoardViews(updated);
    setRenamingViewKey(null);
  };

  const handleToggleFavoriteView = (key) => {
    const updated = boardViews.map(v => v.key === key ? { ...v, isFavorite: !v.isFavorite } : v);
    saveBoardViews(updated);
  };

  const handleTogglePinView = (key) => {
    const updated = boardViews.map(v => v.key === key ? { ...v, isPinned: !v.isPinned } : v);
    saveBoardViews(updated);
  };

  const handleTogglePrivateView = (key) => {
    const updated = boardViews.map(v => v.key === key ? { ...v, isPrivate: !v.isPrivate } : v);
    saveBoardViews(updated);
  };

  const handleSetDefaultView = (key) => {
    const updated = boardViews.map(v => v.key === key ? { ...v, isDefault: true } : { ...v, isDefault: false });
    saveBoardViews(updated);
  };

  const handleDuplicateViewTab = (key) => {
    const target = boardViews.find(v => v.key === key);
    if (!target) return;
    const newKey = `${target.type}_${Date.now()}`;
    const newView = {
      ...target,
      key: newKey,
      label: `${target.label} (Copy)`,
      isDefault: false
    };
    const updated = [...boardViews, newView];
    saveBoardViews(updated);
    setActiveView(newKey);
    toast.success("View duplicated successfully!");
  };

  const handleDeleteViewTab = (key) => {
    if (boardViews.length <= 1) {
      toast.warn("Cannot delete the only remaining view.");
      return;
    }
    const updated = boardViews.filter(v => v.key !== key);
    saveBoardViews(updated);
    if (activeView === key) {
      setActiveView(updated[0].key);
    }
    toast.success("View deleted.");
  };

  const handleAddNewView = (viewType) => {
    const template = ALL_AVAILABLE_VIEWS.find(v => v.type === viewType);
    if (!template) return;
    const newKey = `${viewType}_${Date.now()}`;
    const newView = {
      key: newKey,
      type: viewType,
      label: template.label,
      isPinned: newViewPinned,
      isPrivate: newViewPrivate,
      isDefault: false,
      isFavorite: false
    };
    const updated = [...boardViews, newView];
    saveBoardViews(updated);
    setActiveView(newKey);
    setNewViewPrivate(false);
    setNewViewPinned(false);
    toast.success(`Added ${template.label} View!`);
  };

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
      
      const res = await api.get(`/board-extensions/boards/${boardId}/custom-fields`);
      setBoardCustomFields(res.data || []);
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
    if (currentViewType === "activity") {
      const fetchLogs = async () => {
        try {
          setLoadingActivity(true);
          const data = await getActivityLogs();
          setActivityLogs(data);
        } catch (err) {
          console.error("Failed to fetch activity logs:", err);
        } finally {
          setLoadingActivity(false);
        }
      };
      fetchLogs();
    }
  }, [currentViewType]);

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
      (group.tasks || []).map((task) => ({
        ...task,
        group_id: group.id,
        group_name: group.name,
        group_color: group.color,
      }))
    );
  }, [board]);

  const activeTask = useMemo(() => {
    if (!activeTaskId || !board?.groups) return null;
    for (const group of board.groups) {
      for (const task of (group.tasks || [])) {
        if (task.id === activeTaskId) {
          return { ...task, group_id: group.id };
        }
        if (task.subtasks) {
          const sub = task.subtasks.find((s) => s.id === activeTaskId);
          if (sub) {
            return { ...sub, group_id: group.id, parent_task_id: task.id };
          }
        }
      }
    }
    return null;
  }, [activeTaskId, board]);

  const activeCommentTask = useMemo(() => {
    return allTasks.find(t => t.id === activeCommentTaskId) || null;
  }, [allTasks, activeCommentTaskId]);

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
            tasks: (group.tasks || []).filter(t => !selectedTaskIds.includes(t.id))
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
            tasks: (group.tasks || []).map(t => selectedTaskIds.includes(t.id) ? { ...t, status: newStatus } : t)
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
            tasks: (group.tasks || []).map(t => selectedTaskIds.includes(t.id) ? { ...t, priority: newPriority } : t)
          }))
        };
      });
      setSelectedTaskIds([]);
      toast.success("Priority updated in bulk!");
    } catch (err) {
      toast.error("Failed to update priority in bulk.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAssigneeChange = async (assignee) => {
    setSaving(true);
    try {
      const nextAssignees = assignee ? [{ id: assignee.id, role: assignee.role, name: assignee.name, email: assignee.email }] : [];
      await Promise.all(selectedTaskIds.map(id => updateTask(id, { assignees: nextAssignees })));
      
      selectedTaskIds.forEach(id => {
        patchTaskInState(id, (task) => {
          const nextTask = { ...task, assignees: nextAssignees };
          const primary = nextAssignees[0];
          nextTask.assignee_id = primary?.id || null;
          nextTask.assignee_name = primary?.name || "";
          nextTask.assignee_email = primary?.email || "";
          nextTask.assignee_role = primary?.role || "";
          return nextTask;
        });
      });
      setSelectedTaskIds([]);
      toast.success("Assignees updated in bulk!");
    } catch (err) {
      toast.error("Failed to update assignees in bulk.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDateChange = async (newDateStr) => {
    if (!newDateStr) return;
    setSaving(true);
    try {
      const dateOnly = newDateStr.split("T")[0];
      await Promise.all(selectedTaskIds.map(id => updateTask(id, { due_date: dateOnly })));
      
      selectedTaskIds.forEach(id => {
        patchTaskInState(id, (task) => {
          return { ...task, due_date: dateOnly };
        });
      });
      setSelectedTaskIds([]);
      toast.success("Due dates updated in bulk!");
    } catch (err) {
      toast.error("Failed to update due dates in bulk.");
    } finally {
      setSaving(false);
    }
  };

  const saveInlineStatusAbove = async (targetStatusVal) => {
    const name = inlineStatusName.trim();
    if (!name) return;

    if (STATUS_OPTIONS.some(s => s.toLowerCase() === name.toLowerCase())) {
      toast.error("A status group with this name already exists.");
      return;
    }

    try {
      setSaving(true);
      const currentStatuses = board.custom_statuses && board.custom_statuses.length > 0
        ? [...board.custom_statuses]
        : [
            { id: "Not Started", label: "To do", color: "#7c8798", type: "Not Started" },
            { id: "In Progress", label: "In progress", color: "#6d45f7", type: "Active" },
            { id: "Done", label: "Complete", color: "#00b67a", type: "Done" }
          ];

      const newStatusObj = {
        id: name,
        label: name,
        color: inlineStatusColor,
        type: "Active"
      };

      const targetIdx = currentStatuses.findIndex(s => s.id === targetStatusVal);
      if (targetIdx !== -1) {
        currentStatuses.splice(targetIdx, 0, newStatusObj);
      } else {
        currentStatuses.unshift(newStatusObj);
      }

      const updated = await updateBoard(boardId, { custom_statuses: currentStatuses });
      setBoard(updated);
      setInlineStatusName("");
      setStatusInlineCreatorAbove(null);
      toast.success("Status group created above!");
    } catch (err) {
      toast.error("Failed to create status group.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRenameStatus = async (oldStatusVal) => {
    const newName = renameStatusText.trim();
    if (!newName || newName === oldStatusVal) {
      setRenamingStatusVal(null);
      return;
    }

    if (STATUS_OPTIONS.some(s => s.toLowerCase() === newName.toLowerCase() && s !== oldStatusVal)) {
      toast.error("A status group with this name already exists.");
      return;
    }

    try {
      setSaving(true);
      const currentStatuses = board.custom_statuses && board.custom_statuses.length > 0
        ? [...board.custom_statuses]
        : [
            { id: "Not Started", label: "To do", color: "#7c8798", type: "Not Started" },
            { id: "In Progress", label: "In progress", color: "#6d45f7", type: "Active" },
            { id: "Done", label: "Complete", color: "#00b67a", type: "Done" }
          ];

      const index = currentStatuses.findIndex(s => s.id === oldStatusVal);
      if (index !== -1) {
        currentStatuses[index] = {
          ...currentStatuses[index],
          label: newName,
        };
      }

      const updated = await updateBoard(boardId, { custom_statuses: currentStatuses });
      setBoard(updated);
      setRenamingStatusVal(null);
      toast.success("Status renamed successfully!");
    } catch (err) {
      toast.error("Failed to rename status.");
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
          group.id === groupId ? { ...group, tasks: [...(group.tasks || []), created] } : group
        ),
      }));
    } catch (err) {
      setError("Failed to create task from template.");
    } finally {
      setSaving(false);
    }
  };

  const getTaskAssignees = (task) => {
    if (!task) return [];
    if (Array.isArray(task.assignees) && task.assignees.length > 0) {
      return task.assignees;
    }
    if (task.assignee_id) {
      return [{
        id: task.assignee_id,
        role: task.assignee_role,
        name: task.assignee_name,
        email: task.assignee_email,
      }];
    }
    return [];
  };

  const getAssigneeKey = (assignee) => (assignee ? `${assignee.role}_${assignee.id}` : "");

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    let result = allTasks.filter((task) => !task.parent_task_id);

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          getTaskAssignees(t).some((assignee) =>
            assignee.name?.toLowerCase().includes(q)
          )
      );
    }

    if (filterAssignee) {
      result = result.filter((t) =>
        getTaskAssignees(t).some((assignee) => getAssigneeKey(assignee) === filterAssignee)
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
      let valA, valB;
      if (typeof sortBy === "string" && sortBy.startsWith("custom_field_")) {
        const fieldId = Number(sortBy.replace("custom_field_", ""));
        valA = a.custom_field_values?.[fieldId] ?? "";
        valB = b.custom_field_values?.[fieldId] ?? "";
      } else {
        valA = a[sortBy];
        valB = b[sortBy];
      }

      if (sortBy === "assignee") {
        valA = getTaskAssignees(a).map((assignee) => assignee.name).join(", ");
        valB = getTaskAssignees(b).map((assignee) => assignee.name).join(", ");
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
        const tasks = filteredTasks.filter((t) =>
          getTaskAssignees(t).some(
            (assignee) => assignee.id === member.id && assignee.role === member.role
          )
        );
        return {
          id: `${member.role}_${member.id}`,
          name: member.name,
          color: "#4f46e5",
          tasks
        };
      });
      const unassignedTasks = filteredTasks.filter((t) => getTaskAssignees(t).length === 0);
      groups.push({
        id: "unassigned",
        name: "Unassigned",
        color: "#94a3b8",
        tasks: unassignedTasks
      });
      return groups.filter((g) => (g.tasks || []).length > 0 || g.id === "unassigned");
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
        tasks = tasks.filter(t => getTaskAssignees(t).length === 0);
      } else {
        tasks = tasks.filter(t =>
          getTaskAssignees(t).some((assignee) => getAssigneeKey(assignee) === swimlaneId)
        );
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
    } else {
      const task = allTasks.find((item) => item.id === taskIdParam);
      setActiveTaskId(task ? taskIdParam : null);
    }

    const viewParam = params.get("view");
    if (viewParam) {
      setActiveView(viewParam);
    }

    if (params.get("manage_statuses") === "true") {
      setShowCreateStatusModal(true);
      const nextParams = new URLSearchParams(location.search);
      nextParams.delete("manage_statuses");
      navigate(`${location.pathname}?${nextParams.toString()}`, { replace: true });
    }
  }, [location.search, board, allTasks]);

  const getIncompleteSubtasks = (task) =>
    (task.subtasks || []).filter((subtask) => subtask.status !== "Done");

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
      const taskAssignees = getTaskAssignees(task);
      if (taskAssignees.length === 0) {
        counts.set("Unassigned", (counts.get("Unassigned") || 0) + 1);
        return;
      }
      taskAssignees.forEach((assignee) => {
        const label = assignee.name || "Unnamed";
        counts.set(label, (counts.get(label) || 0) + 1);
      });
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

  const renderTaskNotesIcon = (task) => {
    const hasNotes = (task.notes && task.notes.trim()) || (task.description_html && task.description_html.trim());
    if (!hasNotes) return null;

    const rawContent = task.notes || task.description_html;
    const cleanContent = DOMPurify.sanitize(rawContent);

    const popover = (
      <Popover id={`popover-task-notes-${task.id}`} className="task-notes-popover shadow-sm">
        <Popover.Header as="h3" className="fs-6 py-1 px-2">Task Description / Notes</Popover.Header>
        <Popover.Body className="p-2" style={{ maxHeight: "250px", overflowY: "auto", fontSize: "12px" }}>
          <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
        </Popover.Body>
      </Popover>
    );

    return (
      <OverlayTrigger
        trigger={["hover", "focus"]}
        placement="right"
        overlay={popover}
      >
        <span className="task-notes-icon-wrapper cursor-pointer ms-1 d-inline-flex align-items-center">
          <AlignLeft size={13} className="text-slate-400" />
        </span>
      </OverlayTrigger>
    );
  };

  const handleSaveTableTask = async () => {
    const builder = inlineTaskBuilders["table_builder"];
    const title = (builder?.title || "").trim();
    if (!title) return;

    const defaultGroupId = board.groups?.[0]?.id;
    if (!defaultGroupId) {
      setError("No list/group found to add task to.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        status: builder?.status || "Not Started",
        priority: builder?.priority || "Normal",
        due_date: builder?.dueDate || null
      };
      if (builder?.assignee) {
        payload.assignees = [builder.assignee];
      }
      const created = await createTask(defaultGroupId, payload);
      setBoard((prev) => ({
        ...prev,
        groups: prev.groups.map((group) =>
          group.id === defaultGroupId ? { ...group, tasks: [...(group.tasks || []), created] } : group
        ),
      }));
      setInlineTaskBuilders((prev) => ({
        ...prev,
        table_builder: { title: "", assignee: null, dueDate: null, priority: "Normal", status: "Not Started", active: false }
      }));
    } catch (createError) {
      setError("Failed to create task in table.");
    } finally {
      setSaving(false);
    }
  };

  const patchTaskInState = (taskId, updater) => {
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        groups: prev.groups.map((group) => ({
          ...group,
          tasks: (group.tasks || []).map((task) => {
            if (task.id === taskId) {
              return updater(task);
            }
            if (task.subtasks && task.subtasks.some((sub) => sub.id === taskId)) {
              return {
                ...task,
                subtasks: task.subtasks.map((sub) => (sub.id === taskId ? updater(sub) : sub)),
              };
            }
            return task;
          }),
        })),
      };
    });
  };

  const handleTaskCellChange = async (taskId, field, value) => {
    setSaving(true);

    const currentTask = allTasks.find((task) => task.id === taskId);
    if (field === "status" && value === "Done" && currentTask && getIncompleteSubtasks(currentTask).length > 0) {
      setError("Complete all subtasks before marking this task complete.");
      setSaving(false);
      return;
    }

    patchTaskInState(taskId, (task) => {
      const nextTask = { ...task, [field]: value };
      if (field === "assignees") {
        nextTask.assignees = value || [];
        const primary = nextTask.assignees[0];
        nextTask.assignee_id = primary?.id || null;
        nextTask.assignee_name = primary?.name || "";
        nextTask.assignee_email = primary?.email || "";
        nextTask.assignee_role = primary?.role || "";
      }
      return nextTask;
    });

    try {
      const payload =
        field === "assignees"
          ? { assignees: value || [] }
          : { [field]: value };
      await updateTask(taskId, payload);
    } catch (updateError) {
      setError(updateError.response?.data?.error || "Failed to save task changes.");
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

  const handleCreateStatus = async (e) => {
    if (e) e.preventDefault();
    const name = newStatusName.trim();
    if (!name) return;

    if (STATUS_OPTIONS.some(s => s.toLowerCase() === name.toLowerCase())) {
      alert("A status group with this name already exists.");
      return;
    }

    try {
      setSaving(true);
      const currentStatuses = board.custom_statuses && board.custom_statuses.length > 0
        ? board.custom_statuses
        : [
            { id: "Not Started", label: "To do", color: "#7c8798" },
            { id: "In Progress", label: "In progress", color: "#6d45f7" },
            { id: "Done", label: "Complete", color: "#00b67a" }
          ];

      const newStatusObj = {
        id: name,
        label: name,
        color: newStatusColor
      };

      const nextStatuses = [...currentStatuses, newStatusObj];
      const updated = await updateBoard(boardId, { custom_statuses: nextStatuses });
      setBoard(updated);
      setNewStatusName("");
      setShowCreateStatusModal(false);
    } catch (err) {
      setError("Failed to create status group.");
    } finally {
      setSaving(false);
    }
  };

  const saveInlineStatus = async () => {
    const name = inlineStatusName.trim();
    if (!name) return;

    if (STATUS_OPTIONS.some(s => s.toLowerCase() === name.toLowerCase())) {
      toast.error("A status group with this name already exists.");
      return;
    }

    try {
      setSaving(true);
      const currentStatuses = board.custom_statuses && board.custom_statuses.length > 0
        ? board.custom_statuses
        : [
            { id: "Not Started", label: "To do", color: "#7c8798" },
            { id: "In Progress", label: "In progress", color: "#6d45f7" },
            { id: "Done", label: "Complete", color: "#00b67a" }
          ];

      const newStatusObj = {
        id: name,
        label: name,
        color: inlineStatusColor
      };

      const nextStatuses = [...currentStatuses, newStatusObj];
      const updated = await updateBoard(boardId, { custom_statuses: nextStatuses });
      setBoard(updated);
      setInlineStatusName("");
      setShowInlineStatusCreator(false);
      toast.success("Status group created!");
    } catch (err) {
      toast.error("Failed to create status group.");
    } finally {
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
        payload.assignees = [builder.assignee];
      }
      const created = await createTask(groupId, payload);
      setBoard((prev) => ({
        ...prev,
        groups: prev.groups.map((group) =>
          group.id === groupId ? { ...group, tasks: [...(group.tasks || []), created] } : group
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

  const handleAddSubtaskFromList = async (parentTask, title) => {
    const cleanTitle = (title || "").trim();
    if (!cleanTitle) return;

    const meta = inlineSubtaskMeta[parentTask.id] || { assignees: [], due_date: "", priority: "Normal" };

    try {
      setSaving(true);
      const created = await createTask(parentTask.group_id, {
        title: cleanTitle,
        parent_task_id: parentTask.id,
        status: "Not Started",
        priority: meta.priority || "Normal",
        due_date: meta.due_date || null,
        assignees: meta.assignees || [],
      });
      setBoard((prev) => ({
        ...prev,
        groups: prev.groups.map((group) =>
          group.id === parentTask.group_id
            ? {
                ...group,
                tasks: (group.tasks || []).map((task) =>
                  task.id === parentTask.id
                    ? { ...task, subtasks: [...(task.subtasks || []), created] }
                    : task
                ).concat(created),
              }
            : group
        ),
      }));
      setInlineSubtaskBuilders((prev) => ({ ...prev, [parentTask.id]: "" }));
      setInlineSubtaskMeta((prev) => ({ ...prev, [parentTask.id]: undefined }));
    } catch (createError) {
      setError("Failed to create subtask.");
      fetchWorkspace(false);
    } finally {
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
          group.id === groupId ? { ...group, tasks: [...(group.tasks || []), created] } : group
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
        tasks: (group.tasks || []).filter((task) => task.id !== taskId),
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
    navigate(`/admin/boards/${boardId}?task=${task.id}`, { replace: true });
  };

  const handleCloseUpdatesDrawer = () => {
    setActiveTaskId(null);
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
      <div className="zbot-date-cell-wrapper position-relative text-center w-100" style={{ minHeight: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <input
          type="date"
          className="zbot-date-input-hidden"
          value={dateVal ? dateVal.substring(0, 10) : ""}
          onChange={(event) =>
            handleTaskCellChange(task.id, fieldName, event.target.value)
          }
          onClick={(e) => {
            try {
              e.target.showPicker();
            } catch (err) {}
          }}
        />
        <div className="zbot-date-display d-inline-flex align-items-center justify-content-center gap-1 text-muted cursor-pointer w-100">
          <Calendar size={12} className={dateVal ? "text-slate-500" : "text-slate-300"} />
          {displayVal ? (
            <span className="zbot-date-text">{displayVal}</span>
          ) : (
            <span className="zbot-date-text text-slate-300" style={{ fontSize: "10px" }}>Set Date</span>
          )}
        </div>
      </div>
    );
  };

  const renderAssigneeCell = (task) => {
    const selectedAssignees = getTaskAssignees(task);
    const selectedKeys = new Set(selectedAssignees.map(getAssigneeKey));
    const toggleAssignee = (participant) => {
      const participantKey = getAssigneeKey(participant);
      const nextAssignees = selectedKeys.has(participantKey)
        ? selectedAssignees.filter((assignee) => getAssigneeKey(assignee) !== participantKey)
        : [...selectedAssignees, participant];
      handleTaskCellChange(task.id, "assignees", nextAssignees);
    };

    return (
    <Dropdown className="w-100">
      <Dropdown.Toggle as="div" className="assignee-cell zbot-cell-assignee">
        {selectedAssignees.length > 0 ? (
          <div className="assignee-stack">
            {selectedAssignees.slice(0, 3).map((assignee) => (
              <div
                key={getAssigneeKey(assignee)}
                className="assignee-avatar zbot-avatar-sm"
                title={assignee.name}
              >
                {getInitials(assignee.name)}
              </div>
            ))}
            <span className="assignee-name-txt">
              {selectedAssignees.length === 1
                ? selectedAssignees[0].name
                : `${selectedAssignees.length} assigned`}
            </span>
          </div>
        ) : (
          <div className="zbot-unassigned-icon mx-auto" title="Unassigned">
            <User size={13} strokeWidth={2.5} />
          </div>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow" popperConfig={{ strategy: "fixed" }}>
        <SleekAssigneeSelector
          selectedAssignees={selectedAssignees}
          members={assignees}
          currentUser={user}
          onToggleAssignee={toggleAssignee}
          onInviteEmail={(email) => toast.info(email ? `Invitation email sent to ${email}!` : "Invitation email sent!")}
        />
      </Dropdown.Menu>
    </Dropdown>
    );
  };

  const renderStatusDropdown = (task) => {
    const meta = STATUS_META[task.status] || STATUS_META["Not Started"];
    return (
      <Dropdown className="w-100 text-center">
        <Dropdown.Toggle as="div">
          <span className={`monday-badge ${meta.className}`} style={{ backgroundColor: meta.color }}>{meta.label}</span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow" popperConfig={{ strategy: "fixed" }}>
          <SleekStatusSelector
            currentStatus={task.status}
            customStatuses={board?.custom_statuses}
            onSelectStatus={(status) => handleTaskCellChange(task.id, "status", status)}
            onEditStatuses={() => setShowEditStatusesModal(true)}
          />
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const renderTaskCheckCircleDropdown = (task, statusMeta) => {
    const isDone = task.status === "Done" || task.status === "Complete";
    return (
      <Dropdown className="d-inline-block">
        <Dropdown.Toggle as="span" className="task-complete-dot d-inline-flex align-items-center justify-content-center" style={{
          borderColor: statusMeta.color || "#8c9baf",
          cursor: getIncompleteSubtasks(task).length > 0 && task.status !== "Done" ? "not-allowed" : "pointer",
          opacity: getIncompleteSubtasks(task).length > 0 && task.status !== "Done" ? 0.6 : 1
        }} title={getIncompleteSubtasks(task).length > 0 ? "Complete subtasks before marking this task complete" : "Change Status"}>
          {isDone ? (
            <CheckCircleFill size={14} style={{ color: statusMeta.color || "#00b67a" }} />
          ) : (
            <span className="dot-inner" style={{ background: statusMeta.color || "#8c9baf", width: "8px", height: "8px", borderRadius: "50%" }} />
          )}
        </Dropdown.Toggle>
        <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow" style={{ zIndex: 1050 }} popperConfig={{ strategy: "fixed" }}>
          <SleekStatusSelector
            currentStatus={task.status}
            customStatuses={board?.custom_statuses}
            onSelectStatus={(status) => {
              if (getIncompleteSubtasks(task).length > 0 && status === "Done") {
                showError("Please complete all subtasks first.");
                return;
              }
              handleTaskCellChange(task.id, "status", status);
            }}
            onEditStatuses={() => setShowEditStatusesModal(true)}
          />
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const renderSubtaskCheckCircleDropdown = (subtask, subtaskFull, statusMeta) => {
    const isDone = subtask.status === "Done" || subtask.status === "Complete";
    return (
      <Dropdown className="d-inline-block">
        <Dropdown.Toggle as="span" className="task-complete-dot d-inline-flex align-items-center justify-content-center" style={{
          borderColor: statusMeta.color || "#8c9baf",
          cursor: "pointer"
        }} title="Change Status">
          {isDone ? (
            <CheckCircleFill size={14} style={{ color: statusMeta.color || "#00b67a" }} />
          ) : (
            <span className="dot-inner" style={{ background: statusMeta.color || "#8c9baf", width: "8px", height: "8px", borderRadius: "50%" }} />
          )}
        </Dropdown.Toggle>
        <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow" style={{ zIndex: 1050 }} popperConfig={{ strategy: "fixed" }}>
          <SleekStatusSelector
            currentStatus={subtask.status}
            customStatuses={board?.custom_statuses}
            onSelectStatus={(status) => handleTaskCellChange(subtask.id, "status", status)}
            onEditStatuses={() => setShowEditStatusesModal(true)}
          />
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const renderPriorityDropdown = (task) => {
    return (
      <Dropdown className="w-100 text-center zbot-cell-priority">
        <Dropdown.Toggle as="div" className="d-inline-flex align-items-center justify-content-center cursor-pointer w-100">
          {getPriorityFlag(task.priority, 13)}
        </Dropdown.Toggle>
        <Dropdown.Menu className="board-dropdown-menu board-status-menu" popperConfig={{ strategy: "fixed" }}>
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

    const isOverdue = task.due_date && task.status !== "Done" && new Date(`${task.due_date}T23:59:59`) < new Date();

    return (
      <article
        key={task.id}
        className={`kanban-task-card ${isOverdue ? "is-overdue" : ""}`}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
      >
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div className="kanban-task-title fw-bold d-flex align-items-center flex-wrap" onClick={() => handleOpenUpdatesDrawer(task)} style={{ cursor: "pointer" }}>
            {task.title}
            {renderTaskNotesIcon(task)}
          </div>
          {getTaskAssignees(task).length > 0 && (
            <div className="assignee-stack ms-auto flex-shrink-0">
              {getTaskAssignees(task).slice(0, 3).map((assignee) => (
                <div key={getAssigneeKey(assignee)} className="assignee-avatar" title={assignee.name}>
                  {getInitials(assignee.name)}
                </div>
              ))}
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

  // --- MOCK VIEW RENDERERS ---
  const renderTimelineView = () => {
    const dates = [];
    const today = new Date();
    for (let i = -1; i < 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    
    return (
      <div className="workspace-timeline-view p-4 bg-white rounded-3 shadow-sm border mb-4">
        <h5 className="fw-bold text-slate-800 mb-3 flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <span>Workspace Timeline / Roadmap</span>
        </h5>
        <div className="table-responsive">
          <table className="table table-bordered border-slate-100 align-middle">
            <thead className="bg-slate-50">
              <tr>
                <th style={{ minWidth: "200px" }} className="text-xs font-bold text-slate-500 uppercase">Task Name</th>
                {dates.map((d, idx) => (
                  <th key={idx} className="text-center text-xs font-bold text-slate-400 uppercase" style={{ minWidth: "100px" }}>
                    {format(d, "MMM d")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.slice(0, 8).map((t) => {
                const start = t.start_date ? new Date(t.start_date) : today;
                const due = t.due_date ? new Date(t.due_date) : today;
                const startIdx = Math.max(0, Math.min(6, Math.floor((start - today) / (86400 * 1000)) + 1));
                const span = Math.max(1, Math.min(7 - startIdx, Math.ceil((due - start) / (86400 * 1000)) + 1));
                
                return (
                  <tr key={t.id}>
                    <td className="text-xs font-semibold text-slate-700 cursor-pointer hover:text-primary" onClick={() => handleTaskClickFromView(t.id)}>
                      {t.title}
                    </td>
                    {Array.from({ length: 7 }).map((_, colIdx) => {
                      if (colIdx === startIdx) {
                        return (
                          <td key={colIdx} colSpan={span} className="p-1">
                            <div 
                              onClick={() => handleTaskClickFromView(t.id)}
                              className="text-white text-[10px] fw-bold rounded-pill p-2 text-center shadow-sm cursor-pointer hover:opacity-90"
                              style={{ 
                                backgroundColor: t.status === "Done" ? "#00b67a" : (t.priority === "Urgent" || t.priority === "High" ? "#ff59a3" : "#673de6"),
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {t.title} ({t.priority})
                            </div>
                          </td>
                        );
                      }
                      if (colIdx > startIdx && colIdx < startIdx + span) {
                        return null;
                      }
                      return <td key={colIdx} style={{ backgroundColor: "#fafbfc" }}></td>;
                    })}
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted text-xs">No tasks on this timeline.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDashboardReportView = () => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === "Done").length;
    const pending = total - completed;
    const overdue = filteredTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "Done").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const urgent = filteredTasks.filter(t => t.priority === "Urgent").length;
    const high = filteredTasks.filter(t => t.priority === "High").length;
    const normal = filteredTasks.filter(t => t.priority === "Normal").length;
    const low = filteredTasks.filter(t => t.priority === "Low").length;

    return (
      <div className="workspace-dashboard-report p-4 bg-white rounded-3 shadow-sm border mb-4">
        <h5 className="fw-bold text-slate-800 mb-4 flex items-center gap-2">
          <PieChart size={18} className="text-indigo-500" />
          <span>Workspace Reporting Dashboard</span>
        </h5>
        
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border bg-slate-50/50 d-flex flex-column gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Tasks</span>
              <span className="fs-3 fw-bold text-slate-900">{total}</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border bg-emerald-50/20 border-emerald-100 d-flex flex-column gap-1">
              <span className="text-[10px] text-emerald-600 font-bold uppercase">Completed</span>
              <span className="fs-3 fw-bold text-emerald-600">{completed}</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border bg-indigo-50/20 border-indigo-100 d-flex flex-column gap-1">
              <span className="text-[10px] text-indigo-600 font-bold uppercase">In Progress</span>
              <span className="fs-3 fw-bold text-indigo-600">{pending}</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-3 border bg-rose-50/20 border-rose-100 d-flex flex-column gap-1">
              <span className="text-[10px] text-rose-600 font-bold uppercase">Overdue</span>
              <span className="fs-3 fw-bold text-rose-600">{overdue}</span>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="p-3 rounded-3 border h-100">
              <h6 className="fw-bold text-slate-700 mb-3">Task Completion Rate</h6>
              <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="progress" style={{ height: "10px" }}>
                    <div className="progress-bar bg-emerald-500" style={{ width: `${rate}%` }}></div>
                  </div>
                </div>
                <span className="fw-bold text-slate-800 text-sm">{rate}%</span>
              </div>
              <p className="text-muted text-[10px] mt-2 mb-0">Calculated from total tasks assigned to status groups on this board.</p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 rounded-3 border h-100">
              <h6 className="fw-bold text-slate-700 mb-3">Priority Distribution</h6>
              <div className="d-flex flex-column gap-2.5">
                {[
                  { name: "Urgent", count: urgent, color: "bg-rose-500" },
                  { name: "High", count: high, color: "bg-orange-500" },
                  { name: "Normal", count: normal, color: "bg-indigo-500" },
                  { name: "Low", count: low, color: "bg-slate-400" }
                ].map((item, idx) => {
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div key={idx} className="d-flex align-items-center justify-content-between text-xs">
                      <span className="fw-semibold text-slate-600" style={{ width: "80px" }}>{item.name}</span>
                      <div className="flex-grow-1 mx-3">
                        <div className="progress" style={{ height: "6px" }}>
                          <div className={`progress-bar ${item.color}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                      <span className="fw-bold text-slate-800" style={{ width: "30px", textAlign: "right" }}>{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWhiteboardView = () => {
    const handleAddNote = (color) => {
      const newNote = {
        id: Date.now(),
        text: "New sticky note - Double click to edit",
        color,
        type: "sticky",
        x: 50 + Math.random() * 150,
        y: 60 + Math.random() * 150
      };
      setWhiteboardNotes(prev => {
        const updated = [...prev, newNote];
        persistWhiteboardNotes(updated);
        return updated;
      });
    };

    const handleDeleteNote = (id) => {
      setWhiteboardNotes(prev => {
        const updated = prev.filter(n => n.id !== id);
        persistWhiteboardNotes(updated);
        return updated;
      });
    };

    const handleUpdateNoteText = (id, newText) => {
      setWhiteboardNotes(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, text: newText } : n);
        persistWhiteboardNotes(updated);
        return updated;
      });
    };

    const handleCanvasClick = (e) => {
      if (e.target !== e.currentTarget && e.target.id !== "whiteboard-drawing-canvas") {
        return;
      }
      
      if (!["Sticky", "Text", "Shapes"].includes(activeWhiteboardTool)) {
        return;
      }
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - 80;
      const y = e.clientY - rect.top - 80;
      
      let newElement = {
        id: Date.now(),
        x: Math.max(0, x),
        y: Math.max(0, y),
        text: activeWhiteboardTool === "Text" ? "Type something..." : "Double click to edit",
        type: activeWhiteboardTool.toLowerCase(),
        color: activeWhiteboardTool === "Sticky" ? "#fef08a" : activeWhiteboardTool === "Text" ? "transparent" : "#dbeafe"
      };
      
      setWhiteboardNotes(prev => {
        const updated = [...prev, newElement];
        persistWhiteboardNotes(updated);
        return updated;
      });
    };

    return (
      <div className="workspace-whiteboard-view p-4 bg-white rounded-3 shadow-sm border mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-slate-800 mb-0 flex items-center gap-2">
            <Image size={18} className="text-warning" />
            <span>Workspace Whiteboard / Canvas</span>
          </h5>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-warning" onClick={() => handleAddNote("#fef08a")} style={{ fontSize: "11px" }}>+ Yellow Note</Button>
            <Button size="sm" variant="outline-danger" onClick={() => handleAddNote("#fbcfe8")} style={{ fontSize: "11px" }}>+ Pink Note</Button>
            <Button size="sm" variant="outline-success" onClick={() => handleAddNote("#bbf7d0")} style={{ fontSize: "11px" }}>+ Green Note</Button>
          </div>
        </div>

        <div className="d-flex gap-3 border rounded-3 bg-slate-50/50 p-2" style={{ minHeight: "450px" }}>
          <div className="d-flex flex-column gap-2 p-2 bg-white rounded-3 shadow-sm border align-items-center" style={{ width: "40px" }}>
            {[
              { name: "Pointer", icon: MousePointer },
              { name: "Text", icon: Type },
              { name: "Draw", icon: PenTool },
              { name: "Sticky", icon: StickyNote },
              { name: "Erase", icon: Eraser },
              { name: "Shapes", icon: Square }
            ].map((tool) => {
              const Icon = tool.icon;
              const isActive = activeWhiteboardTool === tool.name;
              return (
                <button 
                  key={tool.name} 
                  className={`p-2 border-0 rounded hover:bg-slate-100 ${isActive ? "bg-purple-100 text-purple-600 font-bold border border-purple-200" : "bg-white text-slate-500"}`} 
                  title={tool.name}
                  onClick={() => {
                    setActiveWhiteboardTool(tool.name);
                    toast.info(`Switched to ${tool.name} tool.`);

                    // Instant spawn elements when toolbar icon is clicked
                    if (tool.name === "Sticky") {
                      const newNote = {
                        id: Date.now(),
                        text: "New sticky note - Double click to edit",
                        color: "#fef08a",
                        type: "sticky",
                        x: 120 + Math.random() * 80,
                        y: 120 + Math.random() * 80
                      };
                      setWhiteboardNotes(prev => {
                        const updated = [...prev, newNote];
                        persistWhiteboardNotes(updated);
                        return updated;
                      });
                    } else if (tool.name === "Text") {
                      const newText = {
                        id: Date.now(),
                        text: "Type something...",
                        color: "transparent",
                        type: "text",
                        x: 120 + Math.random() * 80,
                        y: 120 + Math.random() * 80
                      };
                      setWhiteboardNotes(prev => {
                        const updated = [...prev, newText];
                        persistWhiteboardNotes(updated);
                        return updated;
                      });
                    } else if (tool.name === "Shapes") {
                      const newShape = {
                        id: Date.now(),
                        text: "Double click to edit",
                        color: "#dbeafe",
                        type: "shapes",
                        x: 120 + Math.random() * 80,
                        y: 120 + Math.random() * 80
                      };
                      setWhiteboardNotes(prev => {
                        const updated = [...prev, newShape];
                        persistWhiteboardNotes(updated);
                        return updated;
                      });
                    }
                  }}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>

          <div 
            className="flex-grow-1 position-relative bg-white rounded-3 border shadow-inner p-3 overflow-hidden" 
            style={{ 
              backgroundImage: "radial-gradient(#e2e8f0 1.2px, transparent 1.2px)", 
              backgroundSize: "16px 16px",
              minHeight: "450px"
            }}
            onClick={handleCanvasClick}
          >
            {/* Freehand drawing canvas layer */}
            <canvas
              ref={canvasRef}
              id="whiteboard-drawing-canvas"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: activeWhiteboardTool === "Draw" || activeWhiteboardTool === "Erase" ? "auto" : "none",
                zIndex: 1
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />

            {whiteboardNotes.map((note) => {
              const isText = note.type === "text";
              const isShape = note.type === "shapes";

              return (
                <div 
                  key={note.id}
                  onMouseDown={(e) => handleNoteMouseDown(note.id, e)}
                  style={{
                    position: "absolute",
                    left: `${note.x}px`,
                    top: `${note.y}px`,
                    width: isText ? "180px" : "160px",
                    height: isText ? "80px" : "160px",
                    backgroundColor: note.color,
                    padding: isText ? "4px" : "12px",
                    boxShadow: isText ? "none" : "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
                    border: isText ? "1px dashed #cbd5e1" : "1px solid rgba(0,0,0,0.05)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderRadius: isShape ? "50%" : isText ? "4px" : "2px",
                    cursor: activeWhiteboardTool === "Pointer" ? "move" : "default",
                    zIndex: 2
                  }}
                >
                  <textarea 
                    className={`bg-transparent border-0 w-100 resize-none focus:outline-none ${isShape ? "text-center my-auto" : "h-75 text-slate-800 font-semibold"}`}
                    style={{
                      height: isShape ? "60px" : "100%",
                      color: "#1f2937",
                      fontWeight: 600,
                      textAlign: isShape ? "center" : "left",
                    }}
                    value={note.text}
                    onChange={(e) => handleUpdateNoteText(note.id, e.target.value)}
                    placeholder={isText ? "Type here..." : ""}
                  />
                  {!isText && (
                    <div className="d-flex justify-content-between align-items-center border-top border-dark/5 pt-1.5 mt-1.5 flex-shrink-0">
                      <span className="text-[9px] text-slate-400" style={{ fontSize: "9px" }}>
                        {isShape ? "Shape" : "Sticky Note"}
                      </span>
                      <button 
                        onClick={() => handleDeleteNote(note.id)} 
                        className="btn btn-link p-0 text-danger hover:text-red-700" 
                        style={{ fontSize: "9px", textDecoration: "none" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {isText && (
                    <div className="position-absolute" style={{ right: "4px", bottom: "4px", display: "flex", gap: "4px" }}>
                      <button 
                        onClick={() => handleDeleteNote(note.id)} 
                        className="btn btn-link p-0 text-danger" 
                        style={{ fontSize: "9px", textDecoration: "none" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderActivityView = () => {
    if (loadingActivity) {
      return (
        <div className="workspace-activity-view p-4 bg-white rounded-3 shadow-sm border mb-4 text-center">
          <Spinner animation="border" variant="dark" />
          <div className="text-xs text-slate-400 mt-2 font-medium">Loading activities...</div>
        </div>
      );
    }

    const taskIds = new Set(allTasks.map(t => t.id));
    const groupIds = new Set((board?.groups || []).map(g => g.id));
    const spaceActivities = activityLogs.filter(log => {
      if (log.target_type === "Board" && log.target_id === Number(boardId)) return true;
      if (log.target_type === "Group" && groupIds.has(log.target_id)) return true;
      if (log.target_type === "Task" && taskIds.has(log.target_id)) return true;
      return false;
    });

    const timeAgo = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.round((now - date) / 1000);
      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.round(hours / 24);
      return `${days}d ago`;
    };

    const getIconForAction = (actionStr) => {
      const lower = actionStr.toLowerCase();
      if (lower.includes("complete") || lower.includes("status of 'done'")) return CheckCircleFill;
      if (lower.includes("uploaded") || lower.includes("attachment") || lower.includes("doc")) return FileText;
      if (lower.includes("log") || lower.includes("timesheet")) return Clock;
      return Plus;
    };

    const getColorForAction = (actionStr) => {
      const lower = actionStr.toLowerCase();
      if (lower.includes("complete") || lower.includes("status of 'done'")) return "#00b67a";
      if (lower.includes("uploaded") || lower.includes("attachment") || lower.includes("doc")) return "#673de6";
      if (lower.includes("log") || lower.includes("timesheet")) return "#f59e0b";
      return "#3b82f6";
    };

    return (
      <div className="workspace-activity-view p-4 bg-white rounded-3 shadow-sm border mb-4">
        <h5 className="fw-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity size={18} className="text-rose-500" />
          <span>Space Activity Logs & Audit Feed</span>
        </h5>
        {spaceActivities.length === 0 ? (
          <div className="text-center py-5 text-slate-400 text-xs">
            No recent activity logs for this Space.
          </div>
        ) : (
          <div className="d-flex flex-column gap-3.5" style={{ borderLeft: "2px solid #f1f5f9", paddingLeft: "16px", marginLeft: "8px" }}>
            {spaceActivities.map((act) => {
              const Icon = getIconForAction(act.action);
              const color = getColorForAction(act.action);
              return (
                <div key={act.id} className="position-relative d-flex gap-3 align-items-start text-xs">
                  <div 
                    className="position-absolute rounded-circle bg-white border d-flex align-items-center justify-content-center"
                    style={{ left: "-27px", top: "2px", width: "20px", height: "20px" }}
                  >
                    <Icon size={10} style={{ color }} />
                  </div>
                  <div>
                    <span className="fw-bold text-slate-800">{act.actor_name}</span>{" "}
                    <span className="text-slate-500">
                      {act.action}
                      {act.target_name && ` (${act.target_type}: ${act.target_name})`}
                    </span>
                    <span className="d-block text-[10px] text-slate-400 font-medium mt-1">{timeAgo(act.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMindMapView = () => {
    return (
      <div className="workspace-mindmap-view p-4 bg-white rounded-3 shadow-sm border mb-4">
        <h5 className="fw-bold text-slate-800 mb-4 flex items-center gap-2">
          <Share2 size={18} className="text-indigo-500" />
          <span>Workspace Task Mind Map</span>
        </h5>
        
        <div className="border rounded-3 p-3 bg-slate-50 d-flex align-items-center justify-content-center overflow-auto" style={{ minHeight: "450px" }}>
          <div className="position-relative" style={{ width: "700px", height: "400px" }}>
            <svg className="position-absolute w-100 h-100" style={{ left: 0, top: 0, pointerEvents: "none" }}>
              <path d="M 350 200 Q 250 150 150 100" stroke="#cbd5e1" strokeWidth="2" fill="none" />
              <path d="M 350 200 Q 350 100 350 60" stroke="#cbd5e1" strokeWidth="2" fill="none" />
              <path d="M 350 200 Q 450 150 550 100" stroke="#cbd5e1" strokeWidth="2" fill="none" />
              <path d="M 350 200 Q 350 300 350 340" stroke="#cbd5e1" strokeWidth="2" fill="none" />
            </svg>

            <div 
              className="position-absolute bg-slate-900 text-white rounded-circle shadow-lg d-flex align-items-center justify-content-center text-center p-3 fw-bold"
              style={{ left: "300px", top: "165px", width: "100px", height: "70px", fontSize: "12px", zIndex: 10 }}
            >
              {board?.name || "Project"}
            </div>

            <div 
              className="position-absolute bg-white border border-slate-200 text-slate-700 rounded-3 shadow-sm p-2 text-center text-xs fw-semibold"
              style={{ left: "100px", top: "80px", width: "100px" }}
            >
              To Do
            </div>
            <div 
              className="position-absolute bg-white border border-indigo-200 text-indigo-700 rounded-3 shadow-sm p-2 text-center text-xs fw-semibold"
              style={{ left: "300px", top: "30px", width: "100px" }}
            >
              In Progress
            </div>
            <div 
              className="position-absolute bg-white border border-emerald-200 text-emerald-700 rounded-3 shadow-sm p-2 text-center text-xs fw-semibold"
              style={{ left: "500px", top: "80px", width: "100px" }}
            >
              Complete
            </div>
            <div 
              className="position-absolute bg-white border border-slate-200 text-slate-500 rounded-3 shadow-sm p-2 text-center text-xs fw-semibold"
              style={{ left: "300px", top: "340px", width: "100px" }}
            >
              Unscheduled
            </div>

            <div className="position-absolute bottom-0 end-0 text-[10px] text-slate-400 font-bold bg-white/80 p-2 rounded shadow-sm">
              Interactive node branches for status groupings
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamView = () => {
    const teamMembers = assignees;

    return (
      <div className="workspace-team-view p-4 bg-white rounded-3 shadow-sm border mb-4">
        <h5 className="fw-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <span>Team Capacity Planning & Workload</span>
        </h5>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr className="text-xs text-slate-400 uppercase font-bold">
                <th>Team Member</th>
                <th>Role</th>
                <th>Assigned Tasks</th>
                <th>Workload Capacity</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member, idx) => {
                const count = filteredTasks.filter(t => t.responsible_staff_id === member.id || t.responsible_super_admin_id === member.id).length;
                const capacity = count * 20;
                const barColor = capacity > 80 ? "bg-rose-500" : (capacity > 40 ? "bg-indigo-500" : "bg-emerald-500");
                return (
                  <tr key={idx} className="text-xs">
                    <td className="fw-semibold text-slate-800 flex items-center gap-2">
                      <div className="bg-slate-100 rounded-circle text-slate-600 d-flex align-items-center justify-content-center fw-bold" style={{ width: "26px", height: "26px", fontSize: "10px" }}>
                        {member.name.substring(0,2).toUpperCase()}
                      </div>
                      <span>{member.name}</span>
                    </td>
                    <td className="text-muted capitalize">{member.role}</td>
                    <td className="fw-bold text-slate-700">{count} tasks</td>
                    <td>
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="flex-grow-1" style={{ maxWidth: "200px" }}>
                          <div className="progress" style={{ height: "6px" }}>
                            <div className={`progress-bar ${barColor}`} style={{ width: `${capacity}%` }}></div>
                          </div>
                        </div>
                        <span className="font-semibold text-slate-500">{capacity}% ({count * 8}h / 40h)</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMapView = () => {
    return (
      <div className="workspace-map-view p-4 bg-white rounded-3 shadow-sm border mb-4">
        <h5 className="fw-bold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-danger" />
          <span>Workspace Geographic / Site Locations</span>
        </h5>
        <div className="row g-3">
          <div className="col-12 col-md-8">
            <div className="border rounded-3 p-3 bg-slate-50 d-flex align-items-center justify-content-center text-muted" style={{ minHeight: "360px", backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
              <div className="text-center">
                <MapPin size={48} className="text-danger mb-2 animate-bounce" />
                <h6 className="fw-bold text-slate-700">Campus Layout Blueprint</h6>
                <p className="small mb-0 text-[10px]">Mock Map Visualizer showing active task site coordinates.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="border rounded-3 p-3 bg-slate-50/50">
              <h6 className="fw-bold text-xs text-slate-700 mb-3 uppercase tracking-wide">Tasks by Location</h6>
              <div className="d-flex flex-column gap-2">
                {[
                  { site: "Main Office Campus", tasks: ["Setup Password flow UI", "Create staging environment"], color: "#673de6" },
                  { site: "Administration Block", tasks: ["Password Reset endpoints"], color: "#00b67a" },
                  { site: "Remote Sites", tasks: ["Announcements endpoint"], color: "#f59e0b" }
                ].map((loc, idx) => (
                  <div key={idx} className="bg-white border rounded-2xl p-2.5 shadow-sm">
                    <span className="fw-bold text-xs text-slate-850 d-block mb-1.5 flex items-center gap-1">
                      <span className="d-inline-block rounded-circle" style={{ width: "6px", height: "6px", backgroundColor: loc.color }} />
                      {loc.site}
                    </span>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-1 text-[10px] text-slate-500 font-medium">
                      {loc.tasks.map((taskName, tIdx) => (
                        <li key={tIdx} className="truncate">• {taskName}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            <React.Fragment key={statusVal}>
              {/* Inline status builder above if active */}
              {statusInlineCreatorAbove === statusVal && (
                <div className="clickup-inline-status-builder my-2 p-2 border rounded-3 bg-white shadow-sm d-flex align-items-center gap-2">
                  <OverlayTrigger
                    trigger="click"
                    placement="bottom"
                    rootClose
                    overlay={
                      <Popover id="inline-status-color-picker-above" className="border-0 shadow-sm rounded-3">
                        <Popover.Body className="p-2">
                          <div className="clickup-color-picker-row d-flex gap-1">
                            {BOARD_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={`color-swatch btn p-0 rounded-circle ${inlineStatusColor === c ? "active" : ""}`}
                                style={{ backgroundColor: c, width: "20px", height: "20px", border: inlineStatusColor === c ? "2px solid #000" : "none" }}
                                onClick={() => setInlineStatusColor(c)}
                              />
                            ))}
                          </div>
                        </Popover.Body>
                      </Popover>
                    }
                  >
                    <span 
                      className="color-dot cursor-pointer rounded-circle d-inline-block" 
                      style={{ backgroundColor: inlineStatusColor, width: "12px", height: "12px" }} 
                      title="Click to change color"
                    />
                  </OverlayTrigger>
                  <input
                    type="text"
                    className="form-control form-control-sm flex-grow-1"
                    placeholder="New status..."
                    value={inlineStatusName}
                    onChange={(e) => setInlineStatusName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveInlineStatusAbove(statusVal);
                      }
                      if (e.key === "Escape") {
                        setStatusInlineCreatorAbove(null);
                      }
                    }}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    className="btn btn-sm btn-success py-0 px-2" 
                    onClick={() => saveInlineStatusAbove(statusVal)}
                    disabled={saving}
                  >
                    ✓
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-light py-0 px-2" 
                    onClick={() => setStatusInlineCreatorAbove(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div 
                className={`status-group-section mb-1 ${dragOverStatusGroup === statusVal ? "drag-over-group" : ""}`}
                onDragOver={(e) => handleStatusSectionDragOver(e, statusVal)}
                onDrop={(e) => handleStatusSectionDrop(e, statusVal)}
              >
                {/* Status Header */}
                <div className="status-group-header d-flex align-items-center">
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
                    {renamingStatusVal === statusVal ? (
                      <input
                        type="text"
                        className="form-control form-control-sm d-inline-block py-0 px-1"
                        style={{ width: "150px", fontSize: "12px", fontWeight: "bold" }}
                        value={renameStatusText}
                        onChange={(e) => setRenameStatusText(e.target.value)}
                        onBlur={() => handleSaveRenameStatus(statusVal)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRenameStatus(statusVal);
                          if (e.key === "Escape") setRenamingStatusVal(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="clickup-status-badge" style={{ backgroundColor: statusMeta.color }}>
                        <span className="clickup-status-icon">
                          {statusVal === "Done" && <CheckCircleFill size={8} style={{ color: "#fff" }} />}
                        </span>
                        {statusMeta.label}
                      </span>
                    )}
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#9ca3af" }}>
                      {statusTasks.length}
                    </span>

                    {/* Status header actions (dropdown and plus button) */}
                    <div className="status-header-actions d-inline-flex align-items-center gap-1 ms-2">
                      <Dropdown className="d-inline-block">
                        <Dropdown.Toggle as="span" className="p-1 cursor-pointer text-slate-400 hover:text-slate-600 rounded" style={{ fontSize: "12px" }}>
                          <MoreHorizontal size={14} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow-lg border rounded-3 py-1" style={{ fontSize: "13px", zIndex: 1060 }}>
                          <div className="dropdown-header text-xs text-muted text-uppercase fw-bold pb-1">Group options</div>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-1.5" onClick={() => {
                            setRenamingStatusVal(statusVal);
                            setRenameStatusText(statusMeta.label);
                          }}>
                            <Edit3 size={13} /> Rename
                          </Dropdown.Item>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-1.5" onClick={() => {
                            setStatusInlineCreatorAbove(statusVal);
                            setInlineStatusName("");
                            setInlineStatusColor(BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)]);
                          }}>
                            <Plus size={13} /> New status
                          </Dropdown.Item>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-1.5" onClick={() => setShowEditStatusesModal(true)}>
                            <Settings size={13} /> Edit statuses
                          </Dropdown.Item>
                          <Dropdown.Divider className="my-1" />
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-1.5" onClick={toggleStatusCollapse}>
                            <ChevronDown size={13} style={{ transform: isStatusCollapsed ? "rotate(-90deg)" : "none" }} /> {isStatusCollapsed ? "Expand group" : "Collapse group"}
                          </Dropdown.Item>
                          <Dropdown.Divider className="my-1" />
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-1.5" onClick={() => {
                            const ids = statusTasks.map(t => t.id);
                            setSelectedTaskIds(prev => [...new Set([...prev, ...ids])]);
                          }}>
                            <PlusSquare size={13} /> Select all
                          </Dropdown.Item>
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-1.5" onClick={() => {
                            const allStatusKeys = STATUS_OPTIONS.map(val => defaultGroupId ? `${defaultGroupId}_${val}` : `status_${val}`);
                            const nextCollapsed = {};
                            allStatusKeys.forEach(k => { nextCollapsed[k] = true; });
                            setCollapsedStatuses(nextCollapsed);
                          }}>
                            <ChevronDown size={13} /> Collapse all groups
                          </Dropdown.Item>
                          <Dropdown.Divider className="my-1" />
                          <Dropdown.Item className="d-flex align-items-center gap-2 py-1.5" onClick={() => toast.info("Automation rules configured!")}>
                            <Zap size={13} /> Automate status
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>

                      <button
                        type="button"
                        className="border-0 bg-transparent p-1 text-slate-400 hover:text-slate-600 rounded d-inline-flex align-items-center"
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
                        title="Add Task"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Tasks Table */}
                {!isStatusCollapsed && (
                  <div className="workspace-table-container">
                    <table className="workspace-table" style={{ minWidth: boardCustomFields.length > 0 ? `${800 + boardCustomFields.length * 150}px` : "100%" }}>
                      <thead>
                        <tr>
                           <th style={{ width: "3%" }} className="zbot-sticky-col-1">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              style={{ width: "13px", height: "13px", cursor: "pointer" }}
                              checked={statusTasks.length > 0 && statusTasks.every(t => selectedTaskIds.includes(t.id))}
                              onChange={(e) => {
                                const ids = statusTasks.map(t => t.id);
                                if (e.target.checked) {
                                  setSelectedTaskIds(prev => [...new Set([...prev, ...ids])]);
                                } else {
                                  setSelectedTaskIds(prev => prev.filter(id => !ids.includes(id)));
                                }
                              }}
                            />
                          </th>
                          <th style={{ width: "3%" }} className="zbot-sticky-col-2"></th>
                          {renderStandardFieldHeader("title", "Name", { width: "32%", minWidth: "350px" }, "zbot-sticky-col-3")}
                          {!isColHidden("assignee") && renderStandardFieldHeader("assignee", "Assignee", { width: "12%", minWidth: "120px" })}
                          {!isColHidden("due_date") && renderStandardFieldHeader("due_date", "Due date", { width: "10%", minWidth: "110px" })}
                          {!isColHidden("priority") && renderStandardFieldHeader("priority", "Priority", { width: "8%", minWidth: "90px" })}
                          {!isColHidden("status") && renderStandardFieldHeader("status", "Status", { width: "10%", minWidth: "120px" })}
                          {boardCustomFields.filter(f => !isColHidden(f.id)).map(field => renderCustomFieldHeader(field))}
                          <th style={{ width: "5%", minWidth: "80px" }}>Comments</th>
                          <th style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }} className="zbot-sticky-col-right">
                            <button
                              type="button"
                              className="header-plus-circle-btn"
                              onClick={() => handleOpenCustomFieldsOffcanvas(false)}
                              title="Add Custom Field"
                            >
                              <Plus size={12} />
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusTasks.map((task) => {
                          const isCollapsed = !!collapsedTasks[task.id];
                          const subtaskCount = task.subtasks?.length || 0;
                          return (
                            <React.Fragment key={task.id}>
                            <tr 
                              className={`workspace-row ${task.due_date && task.status !== "Done" && new Date(`${task.due_date}T23:59:59`) < new Date() ? "is-overdue" : ""} ${draggedTaskId === task.id ? "is-dragging" : ""} ${dragOverTaskId === task.id ? `drag-over-${dragOverPos}` : ""}`}
                              onDoubleClick={() => handleOpenUpdatesDrawer(task)}
                              draggable
                              onDragStart={(e) => handleListRowDragStart(e, task)}
                              onDragOver={(e) => handleListRowDragOver(e, task)}
                              onDragLeave={(e) => handleListRowDragLeave(e, task)}
                              onDrop={(e) => handleListRowDrop(e, task, statusVal)}
                            >
                              <td style={{ textAlign: "center", verticalAlign: "middle" }} className="zbot-sticky-col-1">
                                <input
                                  type="checkbox"
                                  className={`form-check-input task-select-checkbox ${selectedTaskIds.includes(task.id) ? "opacity-100" : "opacity-0"}`}
                                  style={{ width: "13px", height: "13px", cursor: "pointer", transition: "opacity 0.15s" }}
                                  checked={selectedTaskIds.includes(task.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTaskIds(prev => [...prev, task.id]);
                                    } else {
                                      setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
                                    }
                                  }}
                                />
                              </td>
                              <td style={{ textAlign: "center", verticalAlign: "middle" }} className="zbot-sticky-col-2">
                                <div className="d-flex align-items-center justify-content-center gap-1">
                                  {subtaskCount > 0 ? (
                                    <span
                                      className="cursor-pointer text-slate-400 hover:text-slate-600 d-inline-flex align-items-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCollapsedTasks((prev) => ({
                                          ...prev,
                                          [task.id]: !prev[task.id],
                                        }));
                                      }}
                                      title={isCollapsed ? "Expand subtasks" : "Collapse subtasks"}
                                      style={{ transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "none" }}
                                    >
                                      <ChevronDown size={11} />
                                    </span>
                                  ) : (
                                    <span style={{ width: "11px", display: "inline-block" }} />
                                  )}
                                  {renderTaskCheckCircleDropdown(task, statusMeta)}
                                </div>
                              </td>
                              <td style={{ minWidth: "350px" }} className="zbot-sticky-col-3">
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
                                  {subtaskCount > 0 && (
                                    <span 
                                      className="d-inline-flex align-items-center gap-1 text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 hover:bg-slate-100" 
                                      style={{ fontSize: "10px", backgroundColor: "#f8fafc", cursor: "pointer", height: "18px" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCollapsedTasks((prev) => ({
                                          ...prev,
                                          [task.id]: !prev[task.id],
                                        }));
                                      }}
                                      title={`${subtaskCount} subtask(s)`}
                                    >
                                      <GitFork size={10} style={{ transform: "rotate(180deg)" }} />
                                      {subtaskCount}
                                    </span>
                                  )}
                                  {renderTaskNotesIcon(task)}
                                  <button
                                    type="button"
                                    className="zbot-inline-icon-btn"
                                    onClick={() =>
                                      setInlineSubtaskBuilders((prev) => ({
                                        ...prev,
                                        [task.id]: prev[task.id] === undefined ? "" : undefined,
                                      }))
                                    }
                                    title="Add subtask"
                                  >
                                    <PlusSquare size={13} className="text-slate-400" />
                                  </button>
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
                              {!isColHidden("assignee") && <td style={{ minWidth: "120px" }}>{renderAssigneeCell(task)}</td>}
                              {!isColHidden("due_date") && <td style={{ minWidth: "110px" }}>{renderDateCell(task, "due_date")}</td>}
                              {!isColHidden("priority") && <td style={{ minWidth: "90px" }}>{renderPriorityDropdown(task)}</td>}
                              {!isColHidden("status") && <td style={{ minWidth: "120px" }}>{renderStatusDropdown(task)}</td>}
                              {boardCustomFields.filter(f => !isColHidden(f.id)).map(field => (
                                <td key={field.id} style={{ width: "140px", minWidth: "140px", maxWidth: "180px" }} className="text-truncate">
                                  {renderCustomFieldCell(task, field)}
                                </td>
                              ))}
                              <td className="text-center position-relative" style={{ minWidth: "80px" }}>
                                <button
                                  type="button"
                                  className="chat-bubble-btn position-relative d-inline-flex align-items-center justify-content-center cursor-pointer border-0 bg-transparent"
                                  style={{ width: "24px", height: "24px" }}
                                  onClick={() => setActiveCommentTaskId(activeCommentTaskId === task.id ? null : task.id)}
                                >
                                  <MessageSquare size={13} className={task.updates_count > 0 ? "text-primary" : "text-slate-300"} />
                                  {task.updates_count > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "9px", padding: "1px 3px" }}>
                                      {task.updates_count}
                                    </span>
                                  )}
                                </button>
                              </td>
                              <td style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }} className="zbot-sticky-col-right">
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
                                    <Dropdown.Item onClick={() => handleOpenMoveTaskModal(task)}>
                                      <ArrowRight size={14} /> Move task
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
                            {!isCollapsed && (task.subtasks || []).map((subtask) => {
                              const subtaskFull = { ...subtask, group_id: task.group_id, parent_task_id: task.id };
                              return (
                                <tr
                                  key={`subtask_${subtask.id}`}
                                  className="workspace-row workspace-subtask-row"
                                  onDoubleClick={() => handleOpenUpdatesDrawer(subtaskFull)}
                                >
                                  <td className="zbot-sticky-col-1"></td>
                                  <td className="zbot-sticky-col-2"></td>
                                  <td className="zbot-sticky-col-3" style={{ minWidth: "350px" }}>
                                    <div className="d-flex align-items-center gap-2" style={{ paddingLeft: "16px" }}>
                                      <span className="subtask-tree-line" style={{ width: "12px", height: "14px", borderLeft: "1.5px solid #cbd5e1", borderBottom: "1.5px solid #cbd5e1", borderBottomLeftRadius: "4px", display: "inline-block", marginRight: "2px", transform: "translateY(-5px)" }} />
                                      {renderSubtaskCheckCircleDropdown(subtask, subtaskFull, STATUS_META[subtask.status] || STATUS_META["Not Started"])}
                                      <input
                                        type="text"
                                        className="cell-editable-text flex-grow-1"
                                        value={subtask.title}
                                        onChange={(event) => {
                                          const val = event.target.value;
                                          patchTaskInState(subtask.id, (s) => ({ ...s, title: val }));
                                        }}
                                        onBlur={(event) =>
                                          handleTaskCellChange(subtask.id, "title", event.target.value)
                                        }
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.target.blur();
                                          }
                                        }}
                                      />
                                      {renderTaskNotesIcon(subtaskFull)}
                                      <button
                                        type="button"
                                        className="zbot-inline-icon-btn"
                                        onClick={() =>
                                          setInlineSubtaskBuilders((prev) => ({
                                            ...prev,
                                            [subtask.id]: prev[subtask.id] === undefined ? "" : undefined,
                                          }))
                                        }
                                        title="Add subtask"
                                      >
                                        <PlusSquare size={13} className="text-slate-400" />
                                      </button>
                                      <button
                                        type="button"
                                        className="chat-bubble-btn"
                                        onClick={() => handleOpenUpdatesDrawer(subtaskFull)}
                                      >
                                        <MessageSquare size={13} className="text-slate-400" />
                                        {subtask.updates_count > 0 && (
                                          <span className="chat-badge">{subtask.updates_count}</span>
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                  {!isColHidden("assignee") && <td style={{ minWidth: "120px" }}>{renderAssigneeCell(subtaskFull)}</td>}
                                  {!isColHidden("due_date") && <td style={{ minWidth: "110px" }}>{renderDateCell(subtaskFull, "due_date")}</td>}
                                  {!isColHidden("priority") && <td style={{ minWidth: "90px" }}>{renderPriorityDropdown(subtaskFull)}</td>}
                                  {!isColHidden("status") && <td style={{ minWidth: "120px" }}>{renderStatusDropdown(subtaskFull)}</td>}
                                  {boardCustomFields.filter(f => !isColHidden(f.id)).map(field => (
                                    <td key={field.id} style={{ width: "140px", minWidth: "140px" }}></td>
                                  ))}
                                  <td className="text-center position-relative" style={{ minWidth: "80px" }}>
                                    <button
                                      type="button"
                                      className="chat-bubble-btn position-relative d-inline-flex align-items-center justify-content-center cursor-pointer border-0 bg-transparent"
                                      style={{ width: "24px", height: "24px" }}
                                      onClick={() => setActiveCommentTaskId(activeCommentTaskId === subtask.id ? null : subtask.id)}
                                    >
                                      <MessageSquare size={13} className={subtask.updates_count > 0 ? "text-primary" : "text-slate-300"} />
                                      {subtask.updates_count > 0 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "9px", padding: "1px 3px" }}>
                                          {subtask.updates_count}
                                        </span>
                                      )}
                                    </button>
                                  </td>
                                  <td style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }} className="zbot-sticky-col-right">
                                    <Dropdown align="end">
                                      <Dropdown.Toggle as="button" className="task-row-menu-btn">
                                        <MoreHorizontal size={16} />
                                      </Dropdown.Toggle>
                                      <Dropdown.Menu className="task-context-menu">
                                        <Dropdown.Item onClick={() => handleOpenUpdatesDrawer(subtaskFull)}>
                                          <Edit3 size={14} /> Rename
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => {
                                          navigator.clipboard.writeText(subtask.title);
                                        }}>
                                          <Copy size={14} /> Copy name
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => {
                                          navigator.clipboard.writeText(`${window.location.origin}/admin/boards/${boardId}?task=${subtask.id}`);
                                        }}>
                                          <ClipboardCopy size={14} /> Copy link
                                        </Dropdown.Item>
                                        <Dropdown.Divider />
                                        <Dropdown.Item onClick={() => handleTaskCellChange(subtask.id, "status", "Done")}>
                                          <CheckCircleFill size={14} className="text-success" /> Mark complete
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleOpenUpdatesDrawer(subtaskFull)}>
                                          <MessageSquare size={14} /> Open task
                                        </Dropdown.Item>
                                        <Dropdown.Divider />
                                        <Dropdown.Item
                                          className="text-danger"
                                          onClick={() => {
                                            setDeleteTarget({ type: "task", id: subtask.id, name: subtask.title });
                                            setShowDeleteModal(true);
                                          }}
                                        >
                                          <Trash2 size={14} /> Delete
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </td>
                                </tr>
                              );
                            })}
                            {!isCollapsed && inlineSubtaskBuilders[task.id] !== undefined && (() => {
                              const subtaskMeta = inlineSubtaskMeta[task.id] || { assignees: [], due_date: "", priority: "Normal" };
                              const updateMeta = (parentTaskId, field, value) => {
                                setInlineSubtaskMeta((prev) => ({
                                  ...prev,
                                  [parentTaskId]: {
                                    ...(prev[parentTaskId] || { assignees: [], due_date: "", priority: "Normal" }),
                                    [field]: value,
                                  },
                                }));
                              };
                              return (
                                <tr className="workspace-subtask-builder-row">
                                  <td className="zbot-sticky-col-1" />
                                  <td className="zbot-sticky-col-2" />
                                  <td colSpan="7">
                                    <div className="zbot-inline-builder-row subtask-builder d-flex align-items-center justify-content-between" style={{ paddingLeft: "16px" }}>
                                      <div className="d-flex align-items-center flex-grow-1 gap-2">
                                        <span className="subtask-tree-line" style={{ width: "12px", height: "14px", borderLeft: "1.5px solid #cbd5e1", borderBottom: "1.5px solid #cbd5e1", borderBottomLeftRadius: "4px", display: "inline-block", marginRight: "2px", transform: "translateY(-5px)" }} />
                                        <span className="color-dot rounded-circle d-inline-block border" style={{ backgroundColor: "#cbd5e1", width: "12px", height: "12px", borderStyle: "dashed" }} />
                                        <input
                                          type="text"
                                          placeholder="Subtask name or type '/' for commands"
                                          className="zbot-inline-builder-input flex-grow-1"
                                          value={inlineSubtaskBuilders[task.id] || ""}
                                          onChange={(e) =>
                                            setInlineSubtaskBuilders((prev) => ({ ...prev, [task.id]: e.target.value }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              handleAddSubtaskFromList(task, inlineSubtaskBuilders[task.id]);
                                            }
                                            if (e.key === "Escape") {
                                              setInlineSubtaskBuilders((prev) => ({ ...prev, [task.id]: undefined }));
                                              setInlineSubtaskMeta((prev) => ({ ...prev, [task.id]: undefined }));
                                            }
                                          }}
                                          autoFocus
                                        />
                                      </div>
                                      <div className="subtask-builder-meta-icons d-flex align-items-center gap-2 mx-2">
                                        {/* Assignee Selector Dropdown */}
                                        <Dropdown>
                                          <Dropdown.Toggle as="div" className="cursor-pointer text-slate-400 hover:text-slate-700">
                                            {subtaskMeta.assignees.length > 0 ? (
                                              <div className="d-flex -space-x-1" style={{ marginRight: "4px" }}>
                                                {subtaskMeta.assignees.slice(0, 2).map((a) => (
                                                  <div key={getAssigneeKey(a)} className="assignee-avatar zbot-avatar-sm" title={a.name}>
                                                    {getInitials(a.name)}
                                                  </div>
                                                ))}
                                                {subtaskMeta.assignees.length > 2 && (
                                                  <div className="assignee-avatar zbot-avatar-sm bg-slate-200 text-slate-600 font-bold d-flex align-items-center justify-content-center" style={{ fontSize: "10px" }}>
                                                    +{subtaskMeta.assignees.length - 2}
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <User size={14} className="text-slate-400" />
                                            )}
                                          </Dropdown.Toggle>
                                          <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow">
                                            <SleekAssigneeSelector
                                              selectedAssignees={subtaskMeta.assignees}
                                              members={assignees}
                                              currentUser={user}
                                              onToggleAssignee={(p) => {
                                                const isSelected = subtaskMeta.assignees.some((a) => getAssigneeKey(a) === getAssigneeKey(p));
                                                const nextList = isSelected
                                                  ? subtaskMeta.assignees.filter((a) => getAssigneeKey(a) !== getAssigneeKey(p))
                                                  : [...subtaskMeta.assignees, p];
                                                updateMeta(task.id, "assignees", nextList);
                                              }}
                                              onInviteEmail={(email) => toast.info(email ? `Invitation email sent to ${email}!` : "Invitation email sent!")}
                                            />
                                          </Dropdown.Menu>
                                        </Dropdown>

                                        {/* Due Date Picker Hidden Input */}
                                        <div className="position-relative d-flex align-items-center">
                                          <input
                                            type="date"
                                            className="zbot-date-input-hidden"
                                            value={subtaskMeta.due_date || ""}
                                            onChange={(e) => updateMeta(task.id, "due_date", e.target.value)}
                                            onClick={(e) => {
                                              try {
                                                e.target.showPicker();
                                              } catch (err) {}
                                            }}
                                            style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 2 }}
                                          />
                                          <div className="text-slate-400 hover:text-slate-700 cursor-pointer d-flex align-items-center gap-1">
                                            <Calendar size={14} className={subtaskMeta.due_date ? "text-primary" : ""} />
                                            {subtaskMeta.due_date && <span className="small text-primary" style={{ fontSize: "11px" }}>{format(parseISO(subtaskMeta.due_date), "MMM d")}</span>}
                                          </div>
                                        </div>

                                        {/* Priority Dropdown */}
                                        <Dropdown>
                                          <Dropdown.Toggle as="div" className="cursor-pointer text-slate-400 hover:text-slate-700">
                                            {getPriorityFlag(subtaskMeta.priority, 14)}
                                          </Dropdown.Toggle>
                                          <Dropdown.Menu className="board-dropdown-menu">
                                            {PRIORITY_OPTIONS.map((prio) => (
                                              <Dropdown.Item
                                                key={prio}
                                                onClick={() => updateMeta(task.id, "priority", prio)}
                                                className="d-flex align-items-center gap-2"
                                              >
                                                {getPriorityFlag(prio, 12)}
                                                <span>{prio}</span>
                                              </Dropdown.Item>
                                            ))}
                                          </Dropdown.Menu>
                                        </Dropdown>
                                      </div>
                                      <button
                                        type="button"
                                        className="zbot-inline-save-btn"
                                        onClick={() => handleAddSubtaskFromList(task, inlineSubtaskBuilders[task.id])}
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })()}
                            </React.Fragment>
                          );
                        })}

                      {/* Inline Add Task Builder Row */}
                      {defaultGroupId && (
                        <tr>
                          <td colSpan="8" className="py-1">
                            {inlineTaskBuilders[statusKey]?.active ? (
                              <div className="zbot-inline-builder-row">
                                <span className="task-complete-dot me-1" style={{ borderColor: "#8c9baf", cursor: "default" }} />
                                <input
                                  type="text"
                                  placeholder="Task name or type '/' for commands"
                                  className="zbot-inline-builder-input"
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

                                <div className="zbot-inline-toolbar">
                                  <span className="zbot-inline-pill">
                                    <span className="group-bullet-dot" style={{ backgroundColor: "#3b82f6", width: 8, height: 8 }} />
                                    Task
                                  </span>

                                  {/* Assignee Selection */}
                                  <Dropdown align="end">
                                    <Dropdown.Toggle as="div" className={`zbot-inline-icon-btn ${inlineTaskBuilders[statusKey]?.assignee ? "has-value" : ""}`} title="Assignee">
                                      {inlineTaskBuilders[statusKey]?.assignee ? (
                                        <div className="assignee-avatar zbot-avatar-sm" style={{ width: 18, height: 18, fontSize: 8 }}>
                                          {getInitials(inlineTaskBuilders[statusKey]?.assignee.name)}
                                        </div>
                                      ) : (
                                        <User size={13} />
                                      )}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow">
                                      <SleekAssigneeSelector
                                        selectedAssignees={inlineTaskBuilders[statusKey]?.assignee}
                                        members={assignees}
                                        currentUser={user}
                                        onToggleAssignee={(p) => {
                                          const isSelected = inlineTaskBuilders[statusKey]?.assignee && getAssigneeKey(inlineTaskBuilders[statusKey].assignee) === getAssigneeKey(p);
                                          const nextValue = isSelected ? null : p;
                                          setInlineTaskBuilders(prev => ({
                                            ...prev,
                                            [statusKey]: { ...prev[statusKey], assignee: nextValue }
                                          }));
                                        }}
                                        onInviteEmail={(email) => toast.info(email ? `Invitation email sent to ${email}!` : "Invitation email sent!")}
                                      />
                                    </Dropdown.Menu>
                                  </Dropdown>

                                  {/* Due Date Input */}
                                  <div className="position-relative d-inline-block">
                                    <input
                                      type="date"
                                      className="zbot-date-input-hidden"
                                      value={inlineTaskBuilders[statusKey]?.dueDate || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setInlineTaskBuilders(prev => ({
                                          ...prev,
                                          [statusKey]: { ...prev[statusKey], dueDate: val }
                                        }));
                                      }}
                                      onClick={(e) => {
                                        try {
                                          e.target.showPicker();
                                        } catch (err) {}
                                      }}
                                    />
                                    <button type="button" className={`zbot-inline-icon-btn ${inlineTaskBuilders[statusKey]?.dueDate ? "has-value" : ""}`} title="Due Date">
                                      <Calendar size={13} />
                                    </button>
                                  </div>

                                  {/* Priority Selection */}
                                  <Dropdown align="end">
                                    <Dropdown.Toggle as="div" className={`zbot-inline-icon-btn ${inlineTaskBuilders[statusKey]?.priority ? "has-value" : ""}`} title="Priority">
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
                                    className="zbot-inline-btn-cancel"
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
                                    className="zbot-inline-btn-save"
                                    onClick={() => handleAddTask(defaultGroupId, statusVal)}
                                    disabled={!(inlineTaskBuilders[statusKey]?.title || "").trim() || addingTask[statusKey]}
                                  >
                                    {addingTask[statusKey] ? <Spinner size="sm" animation="border" /> : "Save"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="zbot-add-task-link"
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
          </React.Fragment>
        );
      })}

        {/* ClickUp-style inline new status creator */}
        {showInlineStatusCreator ? (
          <div className="clickup-inline-status-builder">
            <OverlayTrigger
              trigger="click"
              placement="bottom"
              rootClose
              overlay={
                <Popover id="inline-status-color-picker" className="border-0 shadow-sm rounded-3" style={{ minWidth: "auto" }}>
                  <Popover.Body className="p-2">
                    <div className="clickup-color-picker-row">
                      {BOARD_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`color-swatch${inlineStatusColor === c ? " active" : ""}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setInlineStatusColor(c)}
                        />
                      ))}
                    </div>
                  </Popover.Body>
                </Popover>
              }
            >
              <span 
                className="color-dot" 
                style={{ backgroundColor: inlineStatusColor }} 
                title="Click to change color"
              />
            </OverlayTrigger>
            <input
              type="text"
              placeholder="Type a status name..."
              value={inlineStatusName}
              onChange={(e) => setInlineStatusName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveInlineStatus();
                }
                if (e.key === "Escape") {
                  setShowInlineStatusCreator(false);
                }
              }}
              autoFocus
            />
            <button 
              type="button" 
              className="confirm-btn" 
              onClick={saveInlineStatus}
              title="Create status"
              disabled={saving}
            >
              {saving ? <Spinner size="sm" animation="border" /> : "✓"}
            </button>
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={() => setShowInlineStatusCreator(false)}
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="clickup-new-status-btn"
            onClick={() => {
              setShowInlineStatusCreator(true);
              setInlineStatusName("");
              setInlineStatusColor(BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)]);
            }}
          >
            <Plus size={14} /> New status
          </button>
        )}
      </div>
    );
  };

  const renderTableView = () => {
    return (
      <div className="workspace-table-container zbot-proper-table bg-white rounded-3 shadow-sm border p-2">
        <table className="workspace-table" style={{ minWidth: boardCustomFields.length > 0 ? `${800 + boardCustomFields.length * 150}px` : "100%" }}>
          <thead>
            <tr>
              <th style={{ width: "3%" }}></th>
              {renderStandardFieldHeader("title", "Name", { width: "32%", minWidth: "350px" })}
              {renderStandardFieldHeader("assignee", "Assignee", { width: "12%", minWidth: "120px" })}
              {renderStandardFieldHeader("status", "Status", { width: "12%", minWidth: "120px" })}
              {renderStandardFieldHeader("due_date", "Due date", { width: "10%", minWidth: "110px" })}
              {renderStandardFieldHeader("priority", "Priority", { width: "8%", minWidth: "90px" })}
              {boardCustomFields.map(field => renderCustomFieldHeader(field))}
              <th style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }}>
                <button
                  type="button"
                  className="header-plus-circle-btn"
                  onClick={() => handleOpenCustomFieldsOffcanvas(false)}
                  title="Add Custom Field"
                >
                  <Plus size={12} />
                </button>
              </th>
              <th style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => {
              const statusMeta = STATUS_META[task.status] || STATUS_META["Not Started"];
              return (
                <React.Fragment key={task.id}>
                  <tr 
                    className={`workspace-row ${task.due_date && task.status !== "Done" && new Date(`${task.due_date}T23:59:59`) < new Date() ? "is-overdue" : ""}`}
                    onDoubleClick={() => handleOpenUpdatesDrawer(task)}
                  >
                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                      <span
                        className="task-complete-dot"
                        style={{
                          borderColor: statusMeta.color || "#8c9baf",
                          cursor: getIncompleteSubtasks(task).length > 0 ? "not-allowed" : "pointer",
                          opacity: getIncompleteSubtasks(task).length > 0 && task.status !== "Done" ? 0.6 : 1
                        }}
                        title={
                          getIncompleteSubtasks(task).length > 0
                            ? "Complete subtasks before marking this task complete"
                            : "Mark complete"
                        }
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
                    <td style={{ minWidth: "350px" }}>
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
                        {renderTaskNotesIcon(task)}
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
                    <td style={{ minWidth: "120px" }}>{renderAssigneeCell(task)}</td>
                    <td style={{ minWidth: "120px" }}>{renderStatusDropdown(task)}</td>
                    <td style={{ minWidth: "110px" }}>{renderDateCell(task, "due_date")}</td>
                    <td style={{ minWidth: "90px" }}>{renderPriorityDropdown(task)}</td>
                    {boardCustomFields.map(field => (
                      <td key={field.id} style={{ width: "140px", minWidth: "140px", maxWidth: "180px" }} className="text-truncate">
                        {renderCustomFieldCell(task, field)}
                      </td>
                    ))}
                    <td style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }}></td>
                    <td style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }}>
                      {/* Three-dot context menu */}
                      <Dropdown align="end">
                        <Dropdown.Toggle as="button" className="task-row-menu-btn">
                          <MoreHorizontal size={16} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="task-context-menu" popperConfig={{ strategy: "fixed" }}>
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
                          <Dropdown.Item onClick={() => handleOpenMoveTaskModal(task)}>
                            <ArrowRight size={14} /> Move task
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
                  {(task.subtasks || []).map((subtask) => {
                    const subtaskFull = { ...subtask, group_id: task.group_id, parent_task_id: task.id };
                    const subtaskStatusMeta = STATUS_META[subtask.status] || STATUS_META["Not Started"];
                    return (
                      <tr
                        key={`subtask_${subtask.id}`}
                        className="workspace-row workspace-subtask-row"
                        onDoubleClick={() => handleOpenUpdatesDrawer(subtaskFull)}
                      >
                        <td></td>
                        <td>
                          <div className="d-flex align-items-center gap-2" style={{ paddingLeft: "24px" }}>
                            {renderSubtaskCheckCircleDropdown(subtask, subtaskFull, subtaskStatusMeta)}
                            <GitFork size={13} className="text-slate-300" style={{ transform: "rotate(180deg)" }} />
                            <input
                              type="text"
                              className="cell-editable-text flex-grow-1"
                              value={subtask.title}
                              onChange={(event) => {
                                const val = event.target.value;
                                patchTaskInState(subtask.id, (s) => ({ ...s, title: val }));
                              }}
                              onBlur={(event) =>
                                handleTaskCellChange(subtask.id, "title", event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.target.blur();
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td>{renderAssigneeCell(subtaskFull)}</td>
                        <td>{renderStatusDropdown(subtaskFull)}</td>
                        <td>{renderDateCell(subtaskFull, "due_date")}</td>
                        <td>{renderPriorityDropdown(subtaskFull)}</td>
                        <td></td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* Inline Table Task Builder Row */}
            {inlineTaskBuilders["table_builder"]?.active ? (
              <tr className="workspace-table-builder-row bg-light-subtle">
                <td></td>
                <td>
                  <input
                    type="text"
                    placeholder="New Task Name"
                    className="form-control form-control-sm cell-editable-text w-100"
                    value={inlineTaskBuilders["table_builder"]?.title || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInlineTaskBuilders(prev => ({
                        ...prev,
                        table_builder: {
                          ...prev.table_builder,
                          title: val
                        }
                      }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveTableTask();
                      }
                      if (e.key === "Escape") {
                        setInlineTaskBuilders(prev => ({
                          ...prev,
                          table_builder: { ...prev.table_builder, active: false }
                        }));
                      }
                    }}
                    autoFocus
                  />
                </td>
                <td>
                  {/* Assignee selection */}
                  <Dropdown className="w-100">
                    <Dropdown.Toggle as="div" className="assignee-cell zbot-cell-assignee cursor-pointer text-center">
                      {inlineTaskBuilders["table_builder"]?.assignee ? (
                        <div className="assignee-stack justify-content-center">
                          <div className="assignee-avatar zbot-avatar-sm" title={inlineTaskBuilders["table_builder"]?.assignee.name}>
                            {getInitials(inlineTaskBuilders["table_builder"]?.assignee.name)}
                          </div>
                          <span className="assignee-name-txt ms-1 text-truncate" style={{ maxWidth: "80px" }}>
                            {inlineTaskBuilders["table_builder"]?.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <div className="zbot-unassigned-icon mx-auto" title="Unassigned">
                          <User size={13} strokeWidth={2.5} />
                        </div>
                      )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow" popperConfig={{ strategy: "fixed" }}>
                      <SleekAssigneeSelector
                        selectedAssignees={inlineTaskBuilders["table_builder"]?.assignee}
                        members={assignees}
                        currentUser={user}
                        onToggleAssignee={(p) => {
                          const isSelected = inlineTaskBuilders["table_builder"]?.assignee && getAssigneeKey(inlineTaskBuilders["table_builder"].assignee) === getAssigneeKey(p);
                          const nextValue = isSelected ? null : p;
                          setInlineTaskBuilders(prev => ({
                            ...prev,
                            table_builder: { ...prev.table_builder, assignee: nextValue }
                          }));
                        }}
                        onInviteEmail={(email) => toast.info(email ? `Invitation email sent to ${email}!` : "Invitation email sent!")}
                      />
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
                <td>
                  {/* Status Selection */}
                  <Dropdown className="w-100 text-center">
                    <Dropdown.Toggle as="div" className="cursor-pointer">
                      <span className={`monday-badge ${STATUS_META[inlineTaskBuilders["table_builder"]?.status || "Not Started"]?.className || ""}`} style={{ backgroundColor: STATUS_META[inlineTaskBuilders["table_builder"]?.status || "Not Started"]?.color }}>
                        {STATUS_META[inlineTaskBuilders["table_builder"]?.status || "Not Started"]?.label || "To do"}
                      </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="board-dropdown-menu board-status-menu" popperConfig={{ strategy: "fixed" }}>
                      {STATUS_OPTIONS.map((status) => (
                        <Dropdown.Item
                          key={status}
                          onClick={() => {
                            setInlineTaskBuilders(prev => ({
                              ...prev,
                              table_builder: { ...prev.table_builder, status }
                            }));
                          }}
                          className="text-center fw-semibold"
                        >
                          <span className={`monday-badge ${STATUS_META[status].className}`} style={{ backgroundColor: STATUS_META[status].color }}>
                            {STATUS_META[status].label}
                          </span>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
                <td>
                  {/* Due Date selection */}
                  <div className="position-relative text-center w-100" style={{ minHeight: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input
                      type="date"
                      className="zbot-date-input-hidden"
                      value={inlineTaskBuilders["table_builder"]?.dueDate ? inlineTaskBuilders["table_builder"].dueDate.substring(0, 10) : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInlineTaskBuilders(prev => ({
                          ...prev,
                          table_builder: { ...prev.table_builder, dueDate: val }
                        }));
                      }}
                      onClick={(e) => {
                        try {
                          e.target.showPicker();
                        } catch (err) {}
                      }}
                    />
                    <div className="zbot-date-display d-inline-flex align-items-center justify-content-center gap-1 text-muted cursor-pointer w-100">
                      <Calendar size={12} className={inlineTaskBuilders["table_builder"]?.dueDate ? "text-slate-500" : "text-slate-300"} />
                      {inlineTaskBuilders["table_builder"]?.dueDate ? (
                        <span className="zbot-date-text">{format(parseISO(inlineTaskBuilders["table_builder"]?.dueDate), "MMM d")}</span>
                      ) : (
                        <span className="zbot-date-text text-slate-300" style={{ fontSize: "10px" }}>Set Date</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  {/* Priority Selection */}
                  <Dropdown className="w-100 text-center">
                    <Dropdown.Toggle as="div" className="d-inline-flex align-items-center justify-content-center cursor-pointer w-100">
                      {getPriorityFlag(inlineTaskBuilders["table_builder"]?.priority || "Normal", 13)}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="board-dropdown-menu board-status-menu" popperConfig={{ strategy: "fixed" }}>
                      {PRIORITY_OPTIONS.map((p) => (
                        <Dropdown.Item
                          key={p}
                          onClick={() => {
                            setInlineTaskBuilders(prev => ({
                              ...prev,
                              table_builder: { ...prev.table_builder, priority: p }
                            }));
                          }}
                          className="d-flex align-items-center gap-2"
                        >
                          {getPriorityFlag(p, 12)}
                          <span>{p}</span>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
                <td>
                  <div className="d-flex gap-1 justify-content-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                      style={{ fontSize: "11px" }}
                      onClick={() => {
                        setInlineTaskBuilders(prev => ({
                          ...prev,
                          table_builder: { ...prev.table_builder, active: false }
                        }));
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary py-0 px-2"
                      style={{ fontSize: "11px" }}
                      onClick={handleSaveTableTask}
                      disabled={!(inlineTaskBuilders["table_builder"]?.title || "").trim() || saving}
                    >
                      {saving ? <Spinner size="sm" animation="border" /> : "Save"}
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="7" className="py-1">
                  <div
                    className="zbot-add-task-link"
                    onClick={() => {
                      setInlineTaskBuilders(prev => ({
                        ...prev,
                        table_builder: {
                          title: "",
                          assignee: null,
                          dueDate: null,
                          priority: "Normal",
                          status: "Not Started",
                          active: true
                        }
                      }));
                    }}
                  >
                    <Plus size={14} /> Add Task
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                      <span className={`monday-badge ${STATUS_META[status].className}`} style={{ backgroundColor: STATUS_META[status].color }}>
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

  const renderEditStatusesModal = () => {
    const onDragStart = (e, statusId) => {
      e.dataTransfer.setData("text/plain", statusId);
    };

    const onDragOver = (e) => {
      e.preventDefault();
    };

    const onDrop = (e, targetGroup, targetIndex) => {
      e.preventDefault();
      const statusId = e.dataTransfer.getData("text/plain");
      if (!statusId) return;

      const draggedIdx = modalStatuses.findIndex(s => s.id === statusId);
      if (draggedIdx === -1) return;

      const next = [...modalStatuses];
      const [draggedItem] = next.splice(draggedIdx, 1);
      draggedItem.type = targetGroup;

      const groupItems = next.filter(s => s.type === targetGroup);
      if (targetIndex !== undefined && targetIndex < groupItems.length) {
        const targetItem = groupItems[targetIndex];
        const targetAbsIndex = next.findIndex(s => s.id === targetItem.id);
        next.splice(targetAbsIndex, 0, draggedItem);
      } else {
        const lastGroupAbsIndex = next.map((s, idx) => s.type === targetGroup ? idx : -1).reduce((a, b) => Math.max(a, b), -1);
        if (lastGroupAbsIndex !== -1) {
          next.splice(lastGroupAbsIndex + 1, 0, draggedItem);
        } else {
          if (targetGroup === "Not Started") {
            next.unshift(draggedItem);
          } else if (targetGroup === "Done") {
            next.push(draggedItem);
          } else {
            const firstDoneIdx = next.findIndex(s => s.type === "Done");
            if (firstDoneIdx !== -1) {
              next.splice(firstDoneIdx, 0, draggedItem);
            } else {
              next.push(draggedItem);
            }
          }
        }
      }
      setModalStatuses(next);
    };

    const handleRenameModalStatus = (id, newLabel) => {
      setModalStatuses(prev => prev.map(s => s.id === id ? { ...s, label: newLabel } : s));
    };

    const handleColorModalStatus = (id, newColor) => {
      setModalStatuses(prev => prev.map(s => s.id === id ? { ...s, color: newColor } : s));
    };

    const handleAddModalStatus = (groupType) => {
      const colors = BOARD_COLORS;
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const id = `status_${Date.now()}`;
      const newStatus = {
        id: id,
        label: groupType === "Not Started" ? "New Not Started" : groupType === "Done" ? "New Done" : "New Active Status",
        color: randomColor,
        type: groupType
      };
      setModalStatuses(prev => [...prev, newStatus]);
    };

    const handleDeleteModalStatus = (id) => {
      setModalStatuses(prev => prev.filter(s => s.id !== id));
    };

    const handleApplyStatuses = async () => {
      try {
        setSaving(true);
        const custom = modalStatuses.map(s => ({
          id: s.id.startsWith("status_") ? s.label : s.id,
          label: s.label,
          color: s.color,
          type: s.type
        }));
        
        const updated = await updateBoard(boardId, { custom_statuses: custom });
        setBoard(updated);
        setShowEditStatusesModal(false);
        toast.success("Statuses updated successfully!");
      } catch (err) {
        toast.error("Failed to update custom statuses.");
      } finally {
        setSaving(false);
      }
    };

    const notStartedList = modalStatuses.filter(s => s.type === "Not Started");
    const activeList = modalStatuses.filter(s => s.type === "Active");
    const doneList = modalStatuses.filter(s => s.type === "Done");

    return (
      <Modal show={showEditStatusesModal} onHide={() => setShowEditStatusesModal(false)} size="lg" centered className="edit-statuses-modal text-dark">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold fs-5 text-dark">Edit {board?.name || "Project"} statuses</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 text-dark">
          <div className="row g-0 rounded border overflow-hidden">
            <div className="col-md-4 border-end bg-light p-3" style={{ minHeight: "450px" }}>
              <div className="mb-4">
                <label className="fw-bold text-slate-700 small mb-2 d-block">Status type</label>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="radio" name="statusType" id="inheritSpace" disabled />
                  <label className="form-check-label text-muted small" htmlFor="inheritSpace">Inherit from Space</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="statusType" id="useCustom" defaultChecked />
                  <label className="form-check-label fw-semibold text-slate-800 small" htmlFor="useCustom">Use custom statuses</label>
                </div>
              </div>

              <div>
                <label className="fw-bold text-slate-700 small mb-2 d-block">Status template</label>
                <select className="form-select form-select-sm text-dark" defaultValue="custom">
                  <option value="custom">Custom (edited)</option>
                </select>
              </div>
            </div>

            <div className="col-md-8 p-3 bg-white d-flex flex-column" style={{ maxHeight: "500px", overflowY: "auto" }}>
              <div 
                className="status-edit-group mb-4"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, "Not Started")}
              >
                <div className="fw-bold text-slate-500 small text-uppercase mb-2 d-flex align-items-center justify-content-between">
                  <span>Not started</span>
                  <Plus size={14} className="cursor-pointer" onClick={() => handleAddModalStatus("Not Started")} />
                </div>
                <div className="d-flex flex-column gap-2">
                  {notStartedList.map((status, idx) => (
                    <div 
                      key={status.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, status.id)}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, "Not Started", idx)}
                      className="d-flex align-items-center gap-2 border p-2 rounded bg-white shadow-sm"
                      style={{ cursor: "grab" }}
                    >
                      <span className="text-slate-400 fw-bold">::</span>
                      <OverlayTrigger
                        trigger="click"
                        placement="bottom"
                        rootClose
                        overlay={
                          <Popover id={`modal-color-${status.id}`} className="border-0 shadow-sm rounded-3">
                            <Popover.Body className="p-2">
                              <div className="clickup-color-picker-row d-flex gap-1">
                                {BOARD_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    className="color-swatch btn p-0 rounded-circle"
                                    style={{ backgroundColor: c, width: "18px", height: "18px" }}
                                    onClick={() => handleColorModalStatus(status.id, c)}
                                  />
                                ))}
                              </div>
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <span className="color-dot cursor-pointer rounded-circle d-inline-block" style={{ backgroundColor: status.color, width: "10px", height: "10px" }} />
                      </OverlayTrigger>
                      <input 
                        type="text" 
                        value={status.label} 
                        onChange={(e) => handleRenameModalStatus(status.id, e.target.value)}
                        className="form-control form-control-sm border-0 fw-semibold text-slate-800 p-0 shadow-none bg-transparent"
                      />
                      <Trash size={12} className="text-slate-400 hover:text-danger cursor-pointer" onClick={() => handleDeleteModalStatus(status.id)} />
                    </div>
                  ))}
                  {notStartedList.length === 0 && <div className="text-center py-2 border border-dashed rounded text-muted small">Drag status here</div>}
                </div>
              </div>

              <div 
                className="status-edit-group mb-4"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, "Active")}
              >
                <div className="fw-bold text-slate-500 small text-uppercase mb-2 d-flex align-items-center justify-content-between">
                  <span>Active</span>
                  <Plus size={14} className="cursor-pointer" onClick={() => handleAddModalStatus("Active")} />
                </div>
                <div className="d-flex flex-column gap-2">
                  {activeList.map((status, idx) => (
                    <div 
                      key={status.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, status.id)}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, "Active", idx)}
                      className="d-flex align-items-center gap-2 border p-2 rounded bg-white shadow-sm"
                      style={{ cursor: "grab" }}
                    >
                      <span className="text-slate-400 fw-bold">::</span>
                      <OverlayTrigger
                        trigger="click"
                        placement="bottom"
                        rootClose
                        overlay={
                          <Popover id={`modal-color-${status.id}`} className="border-0 shadow-sm rounded-3">
                            <Popover.Body className="p-2">
                              <div className="clickup-color-picker-row d-flex gap-1">
                                {BOARD_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    className="color-swatch btn p-0 rounded-circle"
                                    style={{ backgroundColor: c, width: "18px", height: "18px" }}
                                    onClick={() => handleColorModalStatus(status.id, c)}
                                  />
                                ))}
                              </div>
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <span className="color-dot cursor-pointer rounded-circle d-inline-block" style={{ backgroundColor: status.color, width: "10px", height: "10px" }} />
                      </OverlayTrigger>
                      <input 
                        type="text" 
                        value={status.label} 
                        onChange={(e) => handleRenameModalStatus(status.id, e.target.value)}
                        className="form-control form-control-sm border-0 fw-semibold text-slate-800 p-0 shadow-none bg-transparent"
                      />
                      <Trash size={12} className="text-slate-400 hover:text-danger cursor-pointer" onClick={() => handleDeleteModalStatus(status.id)} />
                    </div>
                  ))}
                  {activeList.length === 0 && <div className="text-center py-2 border border-dashed rounded text-muted small">Drag status here</div>}
                </div>
              </div>

              <div 
                className="status-edit-group mb-4"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, "Done")}
              >
                <div className="fw-bold text-slate-500 small text-uppercase mb-2 d-flex align-items-center justify-content-between">
                  <span>Done</span>
                  <Plus size={14} className="cursor-pointer" onClick={() => handleAddModalStatus("Done")} />
                </div>
                <div className="d-flex flex-column gap-2">
                  {doneList.map((status, idx) => (
                    <div 
                      key={status.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, status.id)}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, "Done", idx)}
                      className="d-flex align-items-center gap-2 border p-2 rounded bg-white shadow-sm"
                      style={{ cursor: "grab" }}
                    >
                      <span className="text-slate-400 fw-bold">::</span>
                      <OverlayTrigger
                        trigger="click"
                        placement="bottom"
                        rootClose
                        overlay={
                          <Popover id={`modal-color-${status.id}`} className="border-0 shadow-sm rounded-3">
                            <Popover.Body className="p-2">
                              <div className="clickup-color-picker-row d-flex gap-1">
                                {BOARD_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    className="color-swatch btn p-0 rounded-circle"
                                    style={{ backgroundColor: c, width: "18px", height: "18px" }}
                                    onClick={() => handleColorModalStatus(status.id, c)}
                                  />
                                ))}
                              </div>
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <span className="color-dot cursor-pointer rounded-circle d-inline-block" style={{ backgroundColor: status.color, width: "10px", height: "10px" }} />
                      </OverlayTrigger>
                      <input 
                        type="text" 
                        value={status.label} 
                        onChange={(e) => handleRenameModalStatus(status.id, e.target.value)}
                        className="form-control form-control-sm border-0 fw-semibold text-slate-800 p-0 shadow-none bg-transparent"
                      />
                      <Trash size={12} className="text-slate-400 hover:text-danger cursor-pointer" onClick={() => handleDeleteModalStatus(status.id)} />
                    </div>
                  ))}
                  {doneList.length === 0 && <div className="text-center py-2 border border-dashed rounded text-muted small">Drag status here</div>}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 d-flex justify-content-between">
          <a href="#" className="small text-decoration-none text-slate-500 hover:text-slate-700" onClick={(e) => e.preventDefault()}>Learn more about statuses</a>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => toast.success("Template saved!")}>Save as template</Button>
            <Button variant="dark" size="sm" onClick={handleApplyStatuses} disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : "Apply changes"}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  };

  // Custom Field Manager & Column Editing Callbacks
  const fetchManagerFields = useCallback(async () => {
    try {
      setLoadingManagerFields(true);
      if (managerSelectedLocation === "all" || managerSelectedLocation === "workspace") {
        const res = await api.get("/board-extensions/boards/custom-fields/workspace?all=true");
        setManagerFields(res.data || []);
      } else {
        const res = await api.get(`/board-extensions/boards/${managerSelectedLocation}/custom-fields`);
        setManagerFields(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load manager fields:", err);
    } finally {
      setLoadingManagerFields(false);
    }
  }, [managerSelectedLocation]);

  useEffect(() => {
    if (showFieldManagerModal) {
      fetchManagerFields();
    }
  }, [showFieldManagerModal, fetchManagerFields]);

  const groupedManagerFields = useMemo(() => {
    let list = managerFields || [];
    const query = managerSearchQuery.toLowerCase().trim();
    if (query) {
      list = list.filter(f => f.name.toLowerCase().includes(query) || f.type.toLowerCase().includes(query));
    }
    
    const groups = {};
    list.forEach(f => {
      const typeLabel = f.type ? (f.type.charAt(0).toUpperCase() + f.type.slice(1)) : "Text";
      if (!groups[typeLabel]) {
        groups[typeLabel] = [];
      }
      groups[typeLabel].push(f);
    });
    return groups;
  }, [managerFields, managerSearchQuery]);

  // Helper mapping types to friendly names
  const getFriendlyFieldTypeLabel = (type) => {
    if (!type) return "Text";
    switch (type) {
      case "email": return "User's Email";
      case "dropdown": return "Dropdown";
      case "multi_select":
      case "labels": return "Labels";
      case "text": return "Text Field";
      case "text_area": return "Long Text";
      case "number": return "Number Field";
      case "date": return "Due Date";
      case "checkbox": return "Checkbox Field";
      case "money":
      case "currency": return "Budget";
      case "rating": return "Rating";
      case "website": return "Website Url";
      default: return `${type.charAt(0).toUpperCase() + type.slice(1)} Field`;
    }
  };

  const handleOpenCustomFieldsOffcanvas = (addExisting = false) => {
    setOffcanvasStep(1);
    setCustomFieldsOffcanvasTab(addExisting ? "existing" : "create");
    setSelectedFieldType("");
    setFieldName("");
    setFieldDesc("");
    setFieldDefaultValue("");
    setFieldOptions("");
    setFieldRequired(false);
    setFieldPinned(false);
    setFieldVisibleToGuests(true);
    setShowMoreSettings(false);
    setSavingField(false);
    setFieldOptionsList([
      { label: "Simple", color: "#10b981" },
      { label: "Moderate", color: "#f59e0b" },
      { label: "Complex", color: "#ef4444" }
    ]);
    setNewOptionText("");
    setButtonName("");
    setButtonColor("#64748b");
    setCurrencyCode("USD");
    setShowCustomFieldsOffcanvas(true);
  };

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

  const getFieldDefaultName = (type) => {
    switch (type) {
      case "email": return "User's Email";
      case "dropdown": return "Dropdown";
      case "multi_select":
      case "labels": return "Labels";
      case "text": return "Text Field";
      case "text_area": return "Long Text";
      case "number": return "Number Field";
      case "date": return "Due Date";
      case "checkbox": return "Checkbox Field";
      case "money":
      case "currency": return "Budget";
      case "rating": return "Rating";
      case "website": return "Website Url";
      default: return `${type.charAt(0).toUpperCase() + type.slice(1)} Field`;
    }
  };

  const handleManagerSelectTypeForCreation = (type) => {
    let normalizedType = type.toLowerCase().replace(" ", "_");
    if (normalizedType === "text_area_(long_text)") normalizedType = "text_area";
    if (normalizedType === "labels_(multi-select)") normalizedType = "labels";
    if (normalizedType === "text_area") normalizedType = "text_area";

    setShowFieldManagerModal(false);
    setSelectedFieldType(normalizedType);
    setFieldName("");
    setFieldDesc("");
    setFieldDefaultValue("");
    setFieldOptions("");
    setFieldRequired(false);
    setFieldPinned(false);
    setFieldVisibleToGuests(true);
    setOffcanvasStep(2);
    setShowCustomFieldsOffcanvas(true);
  };

  const handleSortColumn = (fieldId, order) => {
    setSortBy(`custom_field_${fieldId}`);
    setSortOrder(order);
  };

  const handleMoveColumn = (fieldId, direction) => {
    setBoardCustomFields(prev => {
      const idx = prev.findIndex(f => f.id === fieldId);
      if (idx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      if (direction === "start") {
        next.unshift(item);
      } else {
        next.push(item);
      }
      return next;
    });
  };

  const handleHideColumn = (fieldId) => {
    toggleHideColumn(fieldId);
  };

  const handleDuplicateColumn = async (field) => {
    try {
      const payload = {
        name: `${field.name} Copy`,
        type: field.type,
        config: field.config
      };
      await api.post(`/board-extensions/boards/${boardId}/custom-fields`, payload);
      toast.success("Column duplicated successfully!");
      fetchWorkspace(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate column.");
    }
  };

  const handleDeleteFieldConfirm = async (fieldId) => {
    if (window.confirm("Are you sure you want to delete this custom field? This will delete all task values associated with it.")) {
      try {
        await api.delete(`/board-extensions/custom-fields/${fieldId}`);
        toast.success("Custom field deleted successfully.");
        setEditingCustomField(null);
        fetchWorkspace(false);
        if (showFieldManagerModal) {
          fetchManagerFields();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete custom field.");
      }
    }
  };

  const handleSaveEditField = async (fieldId) => {
    const cleanName = editFieldNameInput.trim();
    if (!cleanName) {
      toast.error("Field name cannot be empty.");
      return;
    }
    try {
      await api.put(`/board-extensions/custom-fields/${fieldId}`, {
        name: cleanName
      });
      toast.success("Field updated successfully!");
      setEditingCustomField(null);
      fetchWorkspace(false);
      if (showFieldManagerModal) {
        fetchManagerFields();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update custom field.");
    }
  };

  const handleCreateCustomField = async (e) => {
    if (e) e.preventDefault();
    if (!fieldName.trim()) {
      toast.error("Field name is required");
      return;
    }

    try {
      setSavingField(true);
      const config = {
        description: fieldDesc,
        defaultValue: fieldDefaultValue,
        required: fieldRequired,
        pinned: fieldPinned,
        visibleToGuests: fieldVisibleToGuests,
      };

      if (selectedFieldType === "dropdown" || selectedFieldType === "multi_select" || selectedFieldType === "labels") {
        config.options = fieldOptionsList.map(opt => opt.label.trim()).filter(Boolean);
        config.optionColors = fieldOptionsList.reduce((acc, opt) => {
          if (opt.label.trim()) acc[opt.label.trim()] = opt.color;
          return acc;
        }, {});
      } else if (selectedFieldType === "currency" || selectedFieldType === "money") {
        config.currencyCode = currencyCode;
        config.currencySymbol = currencyCode === "USD" ? "$" : (currencyCode === "EUR" ? "€" : (currencyCode === "GBP" ? "£" : "$"));
      } else if (selectedFieldType === "button") {
        config.buttonName = buttonName.trim() || "Click";
        config.buttonColor = buttonColor;
      }

      const payload = {
        name: fieldName.trim(),
        type: selectedFieldType === "labels" ? "multi_select" : selectedFieldType,
        config: config
      };

      await api.post(`/board-extensions/boards/${boardId}/custom-fields`, payload);
      toast.success("Custom field created successfully!");
      setShowCustomFieldsOffcanvas(false);
      
      // Reload custom fields and board data
      await fetchWorkspace(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create custom field");
    } finally {
      setSavingField(false);
    }
  };

  const handleSaveCustomFieldChanges = async (e) => {
    if (e) e.preventDefault();
    if (!fieldName || !fieldName.trim()) {
      toast.error("Field name is required");
      return;
    }

    try {
      setSavingField(true);
      const config = {
        description: fieldDesc,
        defaultValue: fieldDefaultValue,
        required: fieldRequired,
        pinned: fieldPinned,
        visibleToGuests: fieldVisibleToGuests,
      };

      if (selectedFieldType === "dropdown" || selectedFieldType === "multi_select" || selectedFieldType === "labels") {
        config.options = fieldOptionsList.map(opt => opt.label.trim()).filter(Boolean);
        config.optionColors = fieldOptionsList.reduce((acc, opt) => {
          if (opt.label.trim()) acc[opt.label.trim()] = opt.color;
          return acc;
        }, {});
      } else if (selectedFieldType === "currency" || selectedFieldType === "money") {
        config.currencyCode = currencyCode;
        config.currencySymbol = currencyCode === "USD" ? "$" : (currencyCode === "EUR" ? "€" : (currencyCode === "GBP" ? "£" : "$"));
      } else if (selectedFieldType === "button") {
        config.buttonName = buttonName.trim() || "Click";
        config.buttonColor = buttonColor;
      }

      const payload = {
        name: fieldName.trim(),
        type: selectedFieldType === "labels" ? "multi_select" : selectedFieldType,
        config: config
      };

      await api.put(`/board-extensions/custom-fields/${editingCustomField.id}`, payload);
      toast.success("Custom field updated successfully!");
      setShowCustomFieldsOffcanvas(false);
      setEditingCustomField(null);
      await fetchWorkspace(false);
      fetchManagerFields();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update custom field");
    } finally {
      setSavingField(false);
    }
  };

  const handleAddExistingField = async (existingField) => {
    try {
      const payload = {
        name: existingField.name,
        type: existingField.type,
        config: existingField.config
      };

      await api.post(`/board-extensions/boards/${boardId}/custom-fields`, payload);
      toast.success(`Added custom field "${existingField.name}" to space!`);
      setShowCustomFieldsOffcanvas(false);
      
      // Reload custom fields and board data
      await fetchWorkspace(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add existing custom field");
    }
  };

  const renderCustomFieldCell = (task, field) => {
    const value = task.custom_field_values?.[field.id] ?? "";
    
    const handleUpdateValue = async (newVal) => {
      // Optimistic state update
      patchTaskInState(task.id, (t) => {
        const updated = { ...(t.custom_field_values || {}), [field.id]: newVal };
        return { ...t, custom_field_values: updated };
      });
      
      try {
        await api.put(`/board-extensions/tasks/${task.id}/custom-fields`, {
          field_id: field.id,
          value: newVal
        });
      } catch (err) {
        console.error("Failed to update custom field:", err);
        toast.error("Failed to update custom field");
      }
    };

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "website":
      case "text_area":
        return (
          <CustomFieldTextInput
            type={field.type === "email" ? "email" : "text"}
            initialValue={value}
            onSave={(newVal) => {
              patchTaskInState(task.id, (t) => {
                const updated = { ...(t.custom_field_values || {}), [field.id]: newVal };
                return { ...t, custom_field_values: updated };
              });
              handleUpdateValue(newVal);
            }}
            placeholder="-"
          />
        );
      case "number":
      case "currency":
      case "money":
        return (
          <CustomFieldNumberInput
            initialValue={value}
            onSave={(newVal) => {
              patchTaskInState(task.id, (t) => {
                const updated = { ...(t.custom_field_values || {}), [field.id]: newVal };
                return { ...t, custom_field_values: updated };
              });
              handleUpdateValue(newVal);
            }}
            placeholder="-"
          />
        );
      case "checkbox":
        return (
          <input
            type="checkbox"
            className="form-check-input cursor-pointer"
            checked={!!value}
            onChange={(e) => handleUpdateValue(e.target.checked)}
          />
        );
      case "date":
        return (
          <input
            type="date"
            className="cell-editable-text w-100 px-1"
            value={value ? value.split("T")[0] : ""}
            onChange={(e) => handleUpdateValue(e.target.value)}
          />
        );
      case "dropdown": {
        const options = field.config?.options || [];
        const optionColors = field.config?.optionColors || {};
        const currentVal = value || "";
        const optColor = optionColors[currentVal] || "#64748b";
        const pillStyle = getClickUpOptionStyle(optColor);

        return (
          <Dropdown align="end" className="w-100">
            <Dropdown.Toggle as="div" className="cursor-pointer d-flex align-items-center w-100">
              {currentVal ? (
                <span className="clickup-dropdown-pill" style={pillStyle}>
                  {currentVal}
                  <ChevronDown size={10} className="ms-1" />
                </span>
              ) : (
                <span className="text-slate-300 px-1 font-medium cursor-pointer">-</span>
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-lg border-0 rounded-3 p-2" style={{ fontSize: "12px", minWidth: "180px", zIndex: 1060 }} popperConfig={{ strategy: "fixed" }}>
              <div className="px-1 pb-1.5 mb-1 border-bottom">
                <input
                  type="text"
                  className="form-control form-control-sm text-xs border-slate-200"
                  placeholder="Search or add options..."
                  value={dropdownSearchQuery}
                  onChange={(e) => setDropdownSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <Dropdown.Item onClick={() => handleUpdateValue("")} className="text-slate-400 py-1 font-medium" style={{ fontSize: "12px" }}>
                - (Clear)
              </Dropdown.Item>
              {options
                .filter((opt) => opt.toLowerCase().includes((dropdownSearchQuery || "").toLowerCase()))
                .map((opt, idx) => {
                  const color = optionColors[opt] || "#64748b";
                  const optStyle = getClickUpOptionStyle(color);
                  return (
                    <Dropdown.Item
                      key={idx}
                      onClick={() => handleUpdateValue(opt)}
                      className="py-1 px-1 my-0.5 rounded border-0 bg-transparent"
                    >
                      <div className="clickup-dropdown-option-item" style={optStyle}>
                        <span className="text-slate-400 font-bold" style={{ fontSize: "10px" }}>::</span>
                        <span>{opt}</span>
                      </div>
                    </Dropdown.Item>
                  );
                })}
            </Dropdown.Menu>
          </Dropdown>
        );
      }
      case "multi_select":
      case "labels": {
        const options = field.config?.options || [];
        const optionColors = field.config?.optionColors || {};
        const selected = Array.isArray(value) ? value : (value ? [value] : []);
        
        const toggleOption = (opt) => {
          let updated;
          if (selected.includes(opt)) {
            updated = selected.filter(o => o !== opt);
          } else {
            updated = [...selected, opt];
          }
          handleUpdateValue(updated);
        };

        return (
          <Dropdown align="end" className="w-100">
            <Dropdown.Toggle as="div" className="cursor-pointer d-flex flex-wrap gap-1 align-items-center w-100 min-h-[24px]">
              {selected.length === 0 ? <span className="text-slate-300 px-1 font-medium">-</span> : (
                selected.map((opt, i) => {
                  const color = optionColors[opt] || "#64748b";
                  const optStyle = getClickUpOptionStyle(color);
                  return (
                    <span key={i} className="clickup-dropdown-pill" style={optStyle}>
                      {opt}
                    </span>
                  );
                })
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-lg border-0 rounded-3 p-2" style={{ fontSize: "12px", minWidth: "180px", zIndex: 1060 }} popperConfig={{ strategy: "fixed" }}>
              <div className="px-1 pb-1.5 mb-1 border-bottom">
                <input
                  type="text"
                  className="form-control form-control-sm text-xs border-slate-200"
                  placeholder="Search options..."
                  value={dropdownSearchQuery}
                  onChange={(e) => setDropdownSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {options
                .filter((opt) => opt.toLowerCase().includes((dropdownSearchQuery || "").toLowerCase()))
                .map((opt, idx) => {
                  const color = optionColors[opt] || "#64748b";
                  const optStyle = getClickUpOptionStyle(color);
                  const isChecked = selected.includes(opt);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleOption(opt)}
                      className="d-flex align-items-center justify-content-between py-1 px-1 my-0.5 rounded cursor-pointer hover:bg-slate-50"
                    >
                      <div className="clickup-dropdown-option-item flex-grow-1 me-2" style={optStyle}>
                        <span className="text-slate-400 font-bold" style={{ fontSize: "10px" }}>::</span>
                        <span>{opt}</span>
                      </div>
                      <Form.Check
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mb-0 cursor-pointer"
                      />
                    </div>
                  );
                })}
            </Dropdown.Menu>
          </Dropdown>
        );
      }
      case "rating": {
        const rating = Number(value) || 0;
        return (
          <div className="d-flex align-items-center gap-0.5 text-warning cursor-pointer">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => handleUpdateValue(rating === star ? 0 : star)}
                style={{ fontSize: "13px" }}
              >
                {star <= rating ? "★" : "☆"}
              </span>
            ))}
          </div>
        );
      }
      default:
        return (
          <input
            type="text"
            className="cell-editable-text w-100"
            value={typeof value === 'object' ? JSON.stringify(value) : value}
            onChange={(e) => handleUpdateValue(e.target.value)}
            placeholder="-"
          />
        );
    }
  };

  const getFieldIcon = (type) => {
    switch (type) {
      case "text":
      case "text_area":
        return <FileText size={13} className="text-slate-400" />;
      case "number":
        return <Hash size={13} className="text-slate-400" />;
      case "date":
        return <Calendar size={13} className="text-slate-400" />;
      case "dropdown":
      case "multi_select":
      case "labels":
        return <ListPlus size={13} className="text-slate-400" />;
      case "currency":
      case "money":
        return <DollarSign size={13} className="text-slate-400" />;
      case "email":
        return <Mail size={13} className="text-slate-400" />;
      case "phone":
        return <Phone size={13} className="text-slate-400" />;
      case "website":
        return <Globe size={13} className="text-slate-400" />;
      case "rating":
        return <Star size={13} className="text-slate-400" />;
      case "checkbox":
        return <CheckSquare size={13} className="text-slate-400" />;
      default:
        return <Layers size={13} className="text-slate-400" />;
    }
  };

  const renderCustomFieldsOffcanvasContent = () => {
    const popularList = [
      { type: "dropdown", label: "Dropdown", icon: <ListPlus size={14} /> },
      { type: "text", label: "Text", icon: <FileText size={14} /> },
      { type: "date", label: "Date", icon: <Calendar size={14} /> },
      { type: "text_area", label: "Text area (Long Text)", icon: <AlignLeft size={14} /> },
      { type: "number", label: "Number", icon: <Hash size={14} /> },
      { type: "labels", label: "Labels (Multi-select)", icon: <Tag size={14} /> }
    ];

    const allList = [
      { type: "button", label: "Button", icon: <MousePointer size={14} /> },
      { type: "checkbox", label: "Checkbox", icon: <CheckSquare size={14} /> },
      { type: "date", label: "Date", icon: <Calendar size={14} /> },
      { type: "dropdown", label: "Dropdown", icon: <ListPlus size={14} /> },
      { type: "email", label: "Email", icon: <Mail size={14} /> },
      { type: "files", label: "Files", icon: <Paperclip size={14} /> },
      { type: "formula", label: "Formula", icon: <Type size={14} /> },
      { type: "labels", label: "Labels (Multi-select)", icon: <Tag size={14} /> },
      { type: "location", label: "Location", icon: <MapPin size={14} /> },
      { type: "money", label: "Money", icon: <DollarSign size={14} /> },
      { type: "number", label: "Number", icon: <Hash size={14} /> },
      { type: "people", label: "People", icon: <Users size={14} /> },
      { type: "phone", label: "Phone", icon: <Phone size={14} /> },
      { type: "progress_auto", label: "Progress (Auto)", icon: <Columns size={14} /> },
      { type: "progress_manual", label: "Progress (Manual)", icon: <Columns size={14} /> },
      { type: "rating", label: "Rating", icon: <Star size={14} /> },
      { type: "relationship", label: "Relationship", icon: <Link size={14} /> },
      { type: "rollup", label: "Rollup", icon: <Repeat size={14} /> },
      { type: "signature", label: "Signature", icon: <PenTool size={14} /> },
      { type: "tasks", label: "Tasks", icon: <CheckSquare size={14} /> },
      { type: "text", label: "Text", icon: <FileText size={14} /> },
      { type: "text_area", label: "Text area (Long Text)", icon: <AlignLeft size={14} /> },
      { type: "voting", label: "Voting", icon: <ArrowRight size={14} /> },
      { type: "website", label: "Website", icon: <Globe size={14} /> }
    ];

    const filterQuery = offcanvasSearchQuery.toLowerCase().trim();
    const filteredPopular = popularList.filter(f => f.label.toLowerCase().includes(filterQuery));
    const filteredAll = allList.filter(f => f.label.toLowerCase().includes(filterQuery));

    if (offcanvasStep === 1) {
      return (
        <>
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
            <h5 className="fw-bold text-slate-800 mb-0 d-flex align-items-center gap-2">
              <button 
                type="button" 
                className="bg-transparent border-0 p-0 text-slate-500 hover:text-slate-700" 
                onClick={() => {
                  setShowFieldManagerModal(true);
                  setShowCustomFieldsOffcanvas(false);
                }}
                title="Open Custom Field Manager"
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
              >
                <Settings size={18} />
              </button>
              Fields
            </h5>
            <button type="button" className="btn-close" onClick={() => setShowCustomFieldsOffcanvas(false)}></button>
          </div>

          <div className="p-3 border-bottom">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 text-xs"
                placeholder="Search Task Fields"
                value={offcanvasSearchQuery}
                onChange={(e) => setOffcanvasSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex border-bottom bg-light">
            <button
              type="button"
              className={`flex-grow-1 py-2 border-0 bg-transparent text-xs fw-bold ${customFieldsOffcanvasTab === 'create' ? 'border-bottom border-primary border-2 text-primary' : 'text-slate-500'}`}
              onClick={() => setCustomFieldsOffcanvasTab('create')}
            >
              Create new
            </button>
            <button
              type="button"
              className={`flex-grow-1 py-2 border-0 bg-transparent text-xs fw-bold ${customFieldsOffcanvasTab === 'existing' ? 'border-bottom border-primary border-2 text-primary' : 'text-slate-500'}`}
              onClick={() => setCustomFieldsOffcanvasTab('existing')}
            >
              Add existing
            </button>
          </div>

          <div className="custom-fields-list-scroll flex-grow-1">
            {customFieldsOffcanvasTab === 'create' ? (
              <>
                {filteredPopular.length > 0 && (
                  <>
                    <div className="custom-fields-section-title">Popular</div>
                    <div className="d-flex flex-column gap-1 mb-3">
                      {filteredPopular.map(f => (
                        <button
                          key={f.type}
                          type="button"
                          className="custom-field-item-btn"
                          onClick={() => {
                            setSelectedFieldType(f.type);
                            setFieldName(getFieldDefaultName(f.type));
                            setOffcanvasStep(2);
                          }}
                        >
                          {f.icon}
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {filteredAll.length > 0 && (
                  <>
                    <div className="custom-fields-section-title">All</div>
                    <div className="d-flex flex-column gap-1">
                      {filteredAll.map((f, idx) => (
                        <button
                          key={`${f.type}-${idx}`}
                          type="button"
                          className="custom-field-item-btn"
                          onClick={() => {
                            setSelectedFieldType(f.type);
                            setFieldName(getFieldDefaultName(f.type));
                            setOffcanvasStep(2);
                          }}
                        >
                          {f.icon}
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {filteredPopular.length === 0 && filteredAll.length === 0 && (
                  <div className="text-center py-5 text-muted small">No fields match your search.</div>
                )}
              </>
            ) : (
              // Add existing tab
              <div>
                {loadingWorkspaceFields ? (
                  <div className="text-center py-5"><Spinner size="sm" animation="border" /></div>
                ) : workspaceFields.filter(wf => !boardCustomFields.some(bcf => bcf.name === wf.name)).length === 0 ? (
                  <div className="text-center py-5 text-muted small">No other custom fields found in workspace.</div>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    {workspaceFields
                      .filter(wf => !boardCustomFields.some(bcf => bcf.name === wf.name))
                      .map(f => (
                        <button
                          key={f.id}
                          type="button"
                          className="custom-field-item-btn d-flex justify-content-between align-items-center"
                          onClick={() => handleAddExistingField(f)}
                        >
                          <span className="d-flex align-items-center gap-2">
                            {getFieldIcon(f.type)}
                            <strong>{f.name}</strong>
                          </span>
                          <Badge bg="light" className="text-dark border text-capitalize" style={{ fontSize: "10px" }}>{f.type}</Badge>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      );
    }

    if (offcanvasStep === 2) {
      return (
        <form onSubmit={editingCustomField ? handleSaveCustomFieldChanges : handleCreateCustomField} className="d-flex flex-column h-100 bg-white">
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white">
            <div className="d-flex align-items-center gap-2">
              {!editingCustomField && (
                <button
                  type="button"
                  className="btn btn-link p-0 text-slate-500 hover:text-slate-700"
                  onClick={() => setOffcanvasStep(1)}
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <Dropdown>
                <Dropdown.Toggle variant="light" size="sm" className="fw-bold text-slate-800 text-capitalize d-flex align-items-center gap-1 border rounded-2 px-2.5 py-1 bg-light" style={{ fontSize: "13px" }}>
                  <span>
                    {selectedFieldType === "dropdown" ? "Dropdown" :
                     selectedFieldType === "labels" ? "Labels" :
                     selectedFieldType === "text" ? "Text" :
                     selectedFieldType === "long_text" ? "Text area (Long Text)" :
                     selectedFieldType === "number" ? "Number" :
                     selectedFieldType === "date" ? "Date" :
                     selectedFieldType === "currency" ? "Currency" :
                     selectedFieldType === "rating" ? "Rating (1-5 Stars)" :
                     selectedFieldType.replace('_', ' ')}
                  </span>
                  <ChevronDown size={14} className="text-slate-500 ms-1" />
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow border-0 py-1" style={{ fontSize: "13px", zIndex: 1100 }}>
                  <Dropdown.Item onClick={() => setSelectedFieldType("dropdown")}>Dropdown</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedFieldType("labels")}>Labels</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedFieldType("text")}>Text</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedFieldType("long_text")}>Text area (Long Text)</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedFieldType("number")}>Number</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedFieldType("date")}>Date</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedFieldType("currency")}>Currency</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedFieldType("rating")}>Rating (1-5 Stars)</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <button type="button" className="btn-close" onClick={() => { setShowCustomFieldsOffcanvas(false); setEditingCustomField(null); }}></button>
          </div>

          <div className="custom-fields-list-scroll flex-grow-1 d-flex flex-column gap-4 bg-white">
            <Form.Group>
              <Form.Label className="small fw-semibold text-slate-700">Field name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Task Complexity"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                required
                autoFocus
                style={{ fontSize: "13px" }}
              />
            </Form.Group>

            {(selectedFieldType === "dropdown" || selectedFieldType === "multi_select" || selectedFieldType === "labels") && (
              <Form.Group>
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <Form.Label className="small fw-semibold text-slate-700 mb-0">Dropdown options *</Form.Label>
                  <span className="text-muted small d-inline-flex align-items-center gap-1" style={{ fontSize: "11px" }}>
                    <Columns size={11} /> Manual
                  </span>
                </div>
                <div className="d-flex flex-column gap-2 mb-2">
                  {fieldOptionsList.map((opt, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-2">
                      <OverlayTrigger
                        trigger="click"
                        rootClose
                        placement="bottom"
                        overlay={
                          <Popover id={`opt-color-popover-${idx}`} className="shadow-lg border-0 p-2" style={{ zIndex: 2300 }}>
                            <Popover.Body className="p-1">
                              <div className="text-xs font-bold text-slate-500 mb-1 px-1">Option Color</div>
                              <div className="clickup-color-swatch-grid">
                                {CLICKUP_PALETTE_COLORS.map((c) => (
                                  <span
                                    key={c}
                                    className={`clickup-color-swatch ${opt.color === c ? "active" : ""}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => {
                                      setFieldOptionsList(prev => prev.map((item, i) => i === idx ? { ...item, color: c } : item));
                                    }}
                                  />
                                ))}
                              </div>
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <span
                          className="clickup-color-picker-btn"
                          style={{ backgroundColor: opt.color || "#64748b" }}
                          title="Click to change option color"
                        />
                      </OverlayTrigger>
                      <Form.Control
                        type="text"
                        value={opt.label}
                        onChange={(e) => {
                          const newText = e.target.value;
                          setFieldOptionsList(prev => prev.map((item, i) => i === idx ? { ...item, label: newText } : item));
                        }}
                        style={{ fontSize: "13px", height: "32px" }}
                      />
                      <button
                        type="button"
                        className="btn btn-link text-slate-400 hover:text-danger p-0 border-0"
                        onClick={() => setFieldOptionsList(prev => prev.filter((_, i) => i !== idx))}
                        style={{ textDecoration: "none", fontSize: "11px" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="text"
                    placeholder="+ Add option"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newOptionText.trim()) {
                        e.preventDefault();
                        const color = BOARD_COLORS[fieldOptionsList.length % BOARD_COLORS.length] || "#64748b";
                        setFieldOptionsList(prev => [...prev, { label: newOptionText.trim(), color }]);
                        setNewOptionText("");
                      }
                    }}
                    style={{ fontSize: "13px", height: "32px" }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary p-1 d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px", borderRadius: "6px" }}
                    onClick={() => {
                      if (newOptionText.trim()) {
                        const color = BOARD_COLORS[fieldOptionsList.length % BOARD_COLORS.length] || "#64748b";
                        setFieldOptionsList(prev => [...prev, { label: newOptionText.trim(), color }]);
                        setNewOptionText("");
                      }
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </Form.Group>
            )}

            {(selectedFieldType === "currency" || selectedFieldType === "money") && (
              <Form.Group>
                <Form.Label className="small fw-semibold text-slate-700">Currency</Form.Label>
                <Form.Select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  style={{ fontSize: "13px" }}
                >
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="NGN">NGN - Nigerian Naira (₦)</option>
                </Form.Select>
              </Form.Group>
            )}

            {selectedFieldType === "button" && (
              <Form.Group>
                <Form.Label className="small fw-semibold text-slate-700">Button details</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Enter button name"
                    value={buttonName}
                    onChange={(e) => setButtonName(e.target.value)}
                    style={{ fontSize: "13px" }}
                  />
                  <OverlayTrigger
                    trigger="click"
                    rootClose
                    placement="bottom"
                    overlay={
                      <Popover id="button-color-popover" className="shadow border-0 p-2" style={{ zIndex: 1100 }}>
                        <Popover.Body className="p-1">
                          <div className="d-flex flex-wrap gap-1.5" style={{ width: "160px" }}>
                            {BOARD_COLORS.map(c => (
                              <span
                                key={c}
                                className="color-dot cursor-pointer rounded-circle d-inline-block"
                                style={{ backgroundColor: c, width: "18px", height: "18px", border: buttonColor === c ? "2px solid #000" : "1px solid #e2e8f0" }}
                                onClick={() => setButtonColor(c)}
                              />
                            ))}
                          </div>
                        </Popover.Body>
                      </Popover>
                    }
                  >
                    <span
                      className="cursor-pointer rounded-circle d-inline-block border"
                      style={{ backgroundColor: buttonColor, width: "24px", height: "24px", flexShrink: 0 }}
                      title="Select Button Color"
                    />
                  </OverlayTrigger>
                </div>
              </Form.Group>
            )}

            <div>
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none small text-slate-600 fw-bold d-flex align-items-center gap-1"
                onClick={() => setShowMoreSettings(!showMoreSettings)}
                style={{ fontSize: "12.5px" }}
              >
                More settings and permissions <ChevronDown size={14} style={{ transform: showMoreSettings ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {showMoreSettings && (
                <div className="card mt-2 p-3 bg-light border border-slate-200 d-flex flex-column gap-3">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-700">Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Tell other users how to use this field"
                      value={fieldDesc}
                      onChange={(e) => setFieldDesc(e.target.value)}
                      style={{ fontSize: "12.5px" }}
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-700">Default value</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Default text"
                      value={fieldDefaultValue}
                      onChange={(e) => setFieldDefaultValue(e.target.value)}
                      style={{ fontSize: "12.5px" }}
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-700">Permissions</Form.Label>
                    <Form.Select
                      value="Workspace default"
                      disabled
                      style={{ fontSize: "12.5px" }}
                    >
                      <option>Workspace default</option>
                    </Form.Select>
                  </Form.Group>

                  <div className="d-flex flex-column gap-2 border-top pt-2">
                    <div className="config-setting-row">
                      <span className="config-setting-label">Required in tasks</span>
                      <Form.Check
                        type="switch"
                        id="req-switch"
                        checked={fieldRequired}
                        onChange={(e) => setFieldRequired(e.target.checked)}
                      />
                    </div>

                    <div className="config-setting-row">
                      <span className="config-setting-label">Pinned</span>
                      <Form.Check
                        type="switch"
                        id="pin-switch"
                        checked={fieldPinned}
                        onChange={(e) => setFieldPinned(e.target.checked)}
                      />
                    </div>

                    <div className="config-setting-row">
                      <span className="config-setting-label">Visible to Guests and Limited Members</span>
                      <Form.Check
                        type="switch"
                        id="guest-switch"
                        checked={fieldVisibleToGuests}
                        onChange={(e) => setFieldVisibleToGuests(e.target.checked)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 border-top bg-white d-flex align-items-center justify-content-between">
            <div>
              {editingCustomField && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center p-2 rounded-circle"
                  style={{ width: "34px", height: "34px" }}
                  onClick={() => {
                    setManagerDeletingFieldId(editingCustomField.id);
                  }}
                  title="Delete Custom Field"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button
                type="button"
                variant="outline-secondary"
                className="px-3.5 py-1.5 fw-bold"
                style={{ fontSize: "12.5px", borderRadius: "6px" }}
                onClick={() => {
                  if (editingCustomField) {
                    setShowCustomFieldsOffcanvas(false);
                    setEditingCustomField(null);
                  } else {
                    setOffcanvasStep(1);
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="dark"
                className="px-4 py-1.5 fw-bold d-flex align-items-center gap-1.5"
                style={{ fontSize: "12.5px", borderRadius: "6px" }}
                disabled={savingField}
              >
                {savingField && <Spinner animation="border" size="sm" className="me-1" />}
                {editingCustomField ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      );
    }
  };

  // Handle task click inside views
  const handleTaskClickFromView = (taskId) => {
    const task = allTasks.find((t) => t.id === taskId);
    if (task) {
      handleOpenUpdatesDrawer(task);
    }
  };

  const renderStandardFieldHeader = (fieldKey, fieldName, style = {}, className = "") => {
    if (isColHidden(fieldKey)) return null;
    return (
      <th 
        key={fieldKey} 
        style={{ cursor: "pointer", position: "relative", ...style }}
        className={className}
      >
        <Dropdown align="start">
          <Dropdown.Toggle as="div" className="d-flex align-items-center justify-content-between w-100 fw-semibold text-slate-700">
            <span className="text-truncate">{fieldName}</span>
            <ChevronDown size={10} className="ms-1 text-slate-400 opacity-50" />
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow border-0 py-1" style={{ fontSize: "12px", minWidth: "190px", zIndex: 1060 }} popperConfig={{ strategy: "fixed" }}>
            <Dropdown.Item onClick={() => handleSortColumn(fieldKey, "asc")}>Sort ascending</Dropdown.Item>
            <Dropdown.Item onClick={() => handleSortColumn(fieldKey, "desc")}>Sort descending</Dropdown.Item>
            <Dropdown.Item onClick={() => setGroupBy(fieldKey)}>Group by {fieldName.toLowerCase()}</Dropdown.Item>
            <Dropdown.Divider />
            {fieldKey === "status" && (
              <Dropdown.Item onClick={() => setShowEditStatusesModal(true)}>Edit statuses</Dropdown.Item>
            )}
            <Dropdown.Item onClick={() => handleOpenCustomFieldsOffcanvas(false)}>Insert left</Dropdown.Item>
            <Dropdown.Item onClick={() => handleOpenCustomFieldsOffcanvas(false)}>Insert right</Dropdown.Item>
            <Dropdown.Item onClick={() => toast.info(`${fieldName} column fit to content`)}>Fit to content</Dropdown.Item>
            <Dropdown.Item onClick={() => toast.info(`${fieldName} column pinned`)}>Pin column</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => handleMoveColumn(fieldKey, "start")}>Move to start</Dropdown.Item>
            <Dropdown.Item onClick={() => handleMoveColumn(fieldKey, "end")}>Move to end</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => handleHideColumn(fieldKey)}>Hide column</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </th>
    );
  };

  const renderCustomFieldHeader = (field) => {
    if (isColHidden(field.id)) return null;
    return (
      <th 
        key={field.id} 
        style={{ width: "140px", minWidth: "140px", maxWidth: "180px", cursor: "pointer" }} 
        className="position-relative"
      >
        <Dropdown align="end">
          <Dropdown.Toggle as="div" className="d-flex align-items-center justify-content-between w-100 fw-semibold text-slate-700">
            <span className="text-truncate">{field.name}</span>
            <ChevronDown size={10} className="ms-1 text-slate-400 opacity-50" />
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow border-0 py-1" style={{ fontSize: "12px", minWidth: "180px", zIndex: 1060 }} popperConfig={{ strategy: "fixed" }}>
            <Dropdown.Item onClick={() => handleSortColumn(field.id, "asc")}>Sort</Dropdown.Item>
            <Dropdown.Item onClick={() => handleSortColumn(field.id, "desc")}>Sort entire column</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => {
              setEditingCustomField(field);
              setFieldName(field.name);
              setSelectedFieldType(field.type);
              
              if (field.config?.options) {
                const opts = field.config.options.map(opt => {
                  if (typeof opt === "string") {
                    const color = field.config?.optionColors?.[opt] || "#64748b";
                    return { label: opt, color };
                  }
                  return opt;
                });
                setFieldOptionsList(opts);
              } else {
                setFieldOptionsList([]);
              }
              if (field.config?.currency) {
                setCurrencyCode(field.config.currency);
              }
              if (field.config?.button_name) {
                setButtonName(field.config.button_name);
                setButtonColor(field.config.button_color || "#3b82f6");
              }
              
              setFieldDesc(field.description || "");
              setFieldRequired(field.required || false);
              setFieldPinned(field.pinned || false);
              setFieldVisibleToGuests(field.visible_to_guests !== false);
              
              setOffcanvasStep(2);
              setShowCustomFieldsOffcanvas(true);
            }}>Edit field</Dropdown.Item>

            <Dropdown.Item onClick={() => handleMoveColumn(field.id, "start")}>Move to start</Dropdown.Item>
            <Dropdown.Item onClick={() => handleMoveColumn(field.id, "end")}>Move to end</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => handleHideColumn(field.id)}>Hide column</Dropdown.Item>
            <Dropdown.Item onClick={() => handleDuplicateColumn(field)}>Duplicate</Dropdown.Item>
            <Dropdown.Item onClick={() => {
              setManagerDeletingFieldId(field.id);
            }} className="text-danger">Delete field</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </th>
    );
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
          <Button variant="light" size="sm" className="workspace-icon-action" onClick={() => setShowSpreadsheetImportModal(true)}>
            <Upload size={14} className="me-1" />
            Import
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
        <div className="workspace-tabs d-flex align-items-center flex-wrap" style={{ gap: "4px" }}>
          {sortedBoardViews.map((view, index) => {
            const Icon = getViewIcon(view.type);
            const isActive = activeView === view.key;
            return (
              <React.Fragment key={view.key}>
                <div
                  className={`workspace-tab ${isActive ? "active" : ""} d-inline-flex align-items-center`}
                  style={{ cursor: "pointer", position: "relative" }}
                  onClick={() => {
                    setActiveView(view.key);
                    setSelectedTaskIds([]);
                  }}
                >
                  {renamingViewKey === view.key ? (
                    <input
                      type="text"
                      className="view-rename-input px-1 text-slate-800"
                      style={{ fontSize: "11px", border: "1px solid #cbd5e1", borderRadius: "4px", width: "90px" }}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameView(view.key, renameValue);
                        if (e.key === "Escape") setRenamingViewKey(null);
                      }}
                      onBlur={() => handleRenameView(view.key, renameValue)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <Icon size={14} className="me-1" />
                      <span>{view.label}</span>
                      {view.isFavorite && <Star size={10} className="ms-1 text-warning fill-current" />}
                      {view.isPrivate && <Lock size={10} className="ms-1 text-slate-450" />}
                      {view.isPinned && <Pin size={10} className="ms-1 text-slate-450 rotate-45" />}
                    </>
                  )}

                  {/* Dropdown Menu on hover/click */}
                  <Dropdown align="end" onClick={(e) => e.stopPropagation()} className="d-inline-block ms-1">
                    <Dropdown.Toggle as="span" className="p-0 border-0 hover-dots cursor-pointer">
                      <MoreHorizontal size={13} className="text-slate-400 hover:text-slate-700" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="view-settings-menu border-0 shadow-lg py-2" style={{ minWidth: "180px", borderRadius: "10px", fontSize: "12px", zIndex: 1060 }}>
                      <Dropdown.Item onClick={() => handleToggleFavoriteView(view.key)} className="py-2 flex items-center">
                        <Star size={13} className={`me-2 ${view.isFavorite ? "text-warning fill-current" : ""}`} /> 
                        {view.isFavorite ? "Unfavorite" : "Favorite"}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => { setRenamingViewKey(view.key); setRenameValue(view.label); }} className="py-2 flex items-center">
                        <Edit3 size={13} className="me-2" /> Rename
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?view=${view.key}`);
                        toast.success("Link copied to clipboard!");
                      }} className="py-2 flex items-center">
                        <Link size={13} className="me-2" /> Copy link to view
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => handleTogglePinView(view.key)} className="py-2 flex items-center justify-between">
                        <span className="flex items-center"><Pin size={13} className="me-2 rotate-45" /> Pin view</span>
                        <Form.Check type="switch" checked={view.isPinned} onChange={() => {}} readOnly className="ms-3 cursor-pointer" />
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleTogglePrivateView(view.key)} className="py-2 flex items-center justify-between">
                        <span className="flex items-center"><Lock size={13} className="me-2" /> Private view</span>
                        <Form.Check type="switch" checked={view.isPrivate} onChange={() => {}} readOnly className="ms-3 cursor-pointer" />
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleSetDefaultView(view.key)} className="py-2 flex items-center justify-between">
                        <span className="flex items-center"><ClipboardCopy size={13} className="me-2" /> Set as default view</span>
                        <Form.Check type="switch" checked={view.isDefault} onChange={() => {}} readOnly className="ms-3 cursor-pointer" />
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => handleDuplicateViewTab(view.key)} className="py-2 flex items-center">
                        <Copy size={13} className="me-2" /> Duplicate view
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleDeleteViewTab(view.key)} className="py-2 flex items-center text-danger">
                        <Trash2 size={13} className="me-2 text-danger" /> Delete view
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <div className="px-3 py-1">
                        <Button 
                          size="sm" 
                          variant="dark" 
                          className="w-100 py-1.5" 
                          style={{ fontSize: "11px", fontWeight: "bold" }}
                          onClick={() => { setSharingViewKey(view.key); setShowSharingModal(true); }}
                        >
                          Sharing & Permissions
                        </Button>
                      </div>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                {index === 0 && sortedBoardViews.length > 1 && (
                  <div className="workspace-tab-divider" />
                )}
              </React.Fragment>
            );
          })}

          {/* Divider before + View button */}
          <div className="workspace-tab-divider" />

          {/* + View Button */}
          <Dropdown align="start" onClick={(e) => e.stopPropagation()} className="d-inline-block ms-1">
            <Dropdown.Toggle as="button" className="workspace-tab add-view-tab" style={{ border: "none", background: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              <Plus size={14} />
              <span>View</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="add-view-dropdown border-0 shadow-lg p-0" style={{ width: "360px", maxHeight: "450px", overflowY: "auto", borderRadius: "10px", zIndex: 1060 }}>
              <div className="px-3 py-2.5 border-b border-slate-100 mb-2 position-relative">
                <input
                  type="text"
                  placeholder="Search or describe a view to create"
                  className="w-100 px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none"
                  style={{ fontSize: "11.5px", paddingRight: "32px", borderColor: "#cbd5e1" }}
                  value={viewSearchQuery}
                  onChange={(e) => setViewSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button 
                  type="button"
                  className="position-absolute end-0 top-50 translate-middle-y me-4 border-0 bg-transparent text-slate-400 hover:text-primary d-flex align-items-center justify-content-center" 
                  style={{ width: "24px", height: "24px" }}
                >
                  <Send size={12} />
                </button>
              </div>

              <div className="dropdown-header text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-2">Popular</div>
              
              <div className="add-view-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "0 12px 12px" }}>
                {filteredAvailableViews.map((v) => {
                  const Icon = v.icon;
                  const VIEW_STYLE_META = {
                    list: { bg: "#64748b", text: "#ffffff", label: "List", desc: "" },
                    gantt: { bg: "#e11d48", text: "#ffffff", label: "Gantt", desc: "Chart" },
                    calendar: { bg: "#ea580c", text: "#ffffff", label: "Calendar", desc: "" },
                    docs: { bg: "#2563eb", text: "#ffffff", label: "Doc", desc: "Wiki" },
                    board: { bg: "#4f46e5", text: "#ffffff", label: "Board", desc: "Kanban" },
                    form: { bg: "#7c3aed", text: "#ffffff", label: "Form", desc: "Survey" },
                    dashboard: { bg: "#db2777", text: "#ffffff", label: "Dashboard", desc: "Report" },
                    table: { bg: "#16a34a", text: "#ffffff", label: "Table", desc: "" },
                    timeline: { bg: "#ea580c", text: "#ffffff", label: "Timeline", desc: "" },
                    whiteboard: { bg: "#ca8a04", text: "#ffffff", label: "Whiteboard", desc: "" },
                    activity: { bg: "#06b6d4", text: "#ffffff", label: "Activity", desc: "Feed" },
                    mind_map: { bg: "#ec4899", text: "#ffffff", label: "Mind Map", desc: "" },
                    team: { bg: "#8b5cf6", text: "#ffffff", label: "Team", desc: "" },
                    map: { bg: "#ea580c", text: "#ffffff", label: "Map", desc: "" },
                    custom_fields: { bg: "#0d9488", text: "#ffffff", label: "Fields", desc: "Manager" },
                    overview: { bg: "#4b5563", text: "#ffffff", label: "Overview", desc: "" }
                  };
                  const meta = VIEW_STYLE_META[v.type] || { bg: "#64748b", text: "#ffffff", label: v.label, desc: v.desc };
                  return (
                    <Dropdown.Item 
                      key={v.type} 
                      onClick={() => handleAddNewView(v.type)}
                      className="add-view-grid-item d-flex align-items-center p-2 rounded-3 border bg-white"
                      style={{ gap: "8px", transition: "background 0.1s", fontSize: "11.5px", borderColor: "#f1f5f9" }}
                    >
                      <div 
                        className="add-view-icon-badge" 
                        style={{ 
                          width: "24px", 
                          height: "24px", 
                          borderRadius: "6px", 
                          backgroundColor: meta.bg, 
                          color: meta.text, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Icon size={12} />
                      </div>
                      <div className="d-flex align-items-center flex-wrap gap-1 min-w-0" style={{ lineHeight: "1.2" }}>
                        <span className="fw-bold text-slate-800 text-truncate">{meta.label}</span>
                        {meta.desc && (
                          <span className="text-slate-400 font-medium text-[10px]">{meta.desc}</span>
                        )}
                      </div>
                    </Dropdown.Item>
                  );
                })}
              </div>

              <div className="px-3 py-2 border-top border-slate-100 d-flex align-items-center gap-3 bg-slate-50" style={{ fontSize: "11px", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px" }}>
                <Form.Check 
                  type="checkbox"
                  id="add-view-private"
                  label="Private view"
                  className="text-slate-500 m-0 font-medium"
                  style={{ fontSize: "11px" }}
                  checked={newViewPrivate}
                  onChange={(e) => setNewViewPrivate(e.target.checked)}
                />
                <Form.Check 
                  type="checkbox"
                  id="add-view-pin"
                  label="Pin view"
                  className="text-slate-500 m-0 font-medium"
                  style={{ fontSize: "11px" }}
                  checked={newViewPinned}
                  onChange={(e) => setNewViewPinned(e.target.checked)}
                />
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <div className="workspace-toolbar-actions">
          <button type="button" className="workspace-tool-btn">
            {boardStats.overdue} overdue
          </button>
          <button
            type="button"
            className="zbot-top-task-btn"
            onClick={() => {
              setTargetGroupId(board.groups?.[0]?.id || null);
              setShowCreateTaskModal(true);
            }}
          >
            <Plus size={14} /> Task
          </button>
        </div>
      </div>

      {showMainToolbar && (
        <div className="workspace-inline-toolbar d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          {/* Left Side: Grouping & Layout controls */}
          <div className="d-flex align-items-center gap-1.5">
            <Dropdown className="d-inline-block">
              <Dropdown.Toggle as="button" className="zbot-status-pill-btn">
                <span className="zbot-status-dot" style={{ backgroundColor: "#673de6" }} />
                <span className="font-bold">{groupBy === "status" ? "Status" : groupBy === "priority" ? "Priority" : groupBy === "assignee" ? "Teammate" : "Group"}</span>
                <ChevronDown size={11} className="ms-1.5 text-slate-400" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="border-0 shadow-lg py-1" style={{ fontSize: "11.5px", zIndex: 1060 }} popperConfig={{ strategy: "fixed" }}>
                <Dropdown.Item onClick={() => setGroupBy("status")}>Group: Status</Dropdown.Item>
                <Dropdown.Item onClick={() => setGroupBy("priority")}>Group: Priority</Dropdown.Item>
                <Dropdown.Item onClick={() => setGroupBy("assignee")}>Group: Teammate</Dropdown.Item>
                <Dropdown.Item onClick={() => setGroupBy("category")}>Group: Category</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <button 
              type="button" 
              onClick={() => {
                refreshWorkspace();
                fetchWorkspace(true);
              }} 
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center p-1.5 text-slate-600" 
              title="Refresh Feed"
              disabled={loading}
              style={{ minWidth: "30px", height: "28px", borderRadius: "6px" }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>

            <Dropdown className="d-inline-block ms-1">
              <Dropdown.Toggle 
                as="button" 
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-2.5 py-1 text-slate-700" 
                title="Customize Columns"
                style={{ height: "28px", borderRadius: "6px" }}
              >
                <Columns size={12} />
                <span className="font-semibold text-xs">Columns</span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow-lg border-0 py-2 px-1" style={{ minWidth: "210px", zIndex: 1060 }} popperConfig={{ strategy: "fixed" }}>
                <div className="px-2 pb-1.5 mb-1 border-bottom text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Show / Hide Fields
                </div>
                <div className="d-flex flex-column gap-1 max-h-[260px] overflow-y-auto px-1" onClick={(e) => e.stopPropagation()}>
                  <Form.Check
                    type="checkbox"
                    id="col-toggle-assignee"
                    label="Assignee"
                    checked={!isColHidden("assignee")}
                    onChange={() => toggleHideColumn("assignee")}
                    className="text-xs font-medium cursor-pointer"
                  />
                  <Form.Check
                    type="checkbox"
                    id="col-toggle-due_date"
                    label="Due date"
                    checked={!isColHidden("due_date")}
                    onChange={() => toggleHideColumn("due_date")}
                    className="text-xs font-medium cursor-pointer"
                  />
                  <Form.Check
                    type="checkbox"
                    id="col-toggle-priority"
                    label="Priority"
                    checked={!isColHidden("priority")}
                    onChange={() => toggleHideColumn("priority")}
                    className="text-xs font-medium cursor-pointer"
                  />
                  <Form.Check
                    type="checkbox"
                    id="col-toggle-status"
                    label="Status"
                    checked={!isColHidden("status")}
                    onChange={() => toggleHideColumn("status")}
                    className="text-xs font-medium cursor-pointer"
                  />
                  {boardCustomFields.length > 0 && <Dropdown.Divider className="my-1" />}
                  {boardCustomFields.map((field) => (
                    <Form.Check
                      key={field.id}
                      type="checkbox"
                      id={`col-toggle-custom-${field.id}`}
                      label={field.name}
                      checked={!isColHidden(field.id)}
                      onChange={() => toggleHideColumn(field.id)}
                      className="text-xs font-medium cursor-pointer"
                    />
                  ))}
                </div>
                {hiddenColumns.length > 0 && (
                  <>
                    <Dropdown.Divider className="my-1" />
                    <Dropdown.Item
                      onClick={() => {
                        setHiddenColumns([]);
                        if (boardId) localStorage.removeItem(`hidden_columns_${boardId}`);
                        toast.success("All columns shown!");
                      }}
                      className="text-xs text-primary font-bold py-1"
                    >
                      Reset / Show all columns
                    </Dropdown.Item>
                  </>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {/* Quick Filters */}
            <div className="d-flex align-items-center gap-1 border-start ps-2 ms-1">
              <Filter size={11} className="text-slate-400 me-1" />
              <select 
                className="zbot-borderless-select"
                value={filterAssignee} 
                onChange={(e) => setFilterAssignee(e.target.value)}
                title="Filter Assignee"
              >
                <option value="">Assignee</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <select 
                className="zbot-borderless-select"
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                title="Filter Priority"
              >
                <option value="">Priority</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select 
                className="zbot-borderless-select"
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                title="Filter Category"
              >
                <option value="">Category</option>
                {board?.categories?.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {(filterQuery || filterAssignee || filterPriority || filterCategory) && (
                <button 
                  type="button" 
                  onClick={() => {
                    setFilterQuery("");
                    setFilterAssignee("");
                    setFilterPriority("");
                    setFilterCategory("");
                  }} 
                  className="btn btn-link text-slate-400 p-0 text-decoration-none font-bold"
                  style={{ fontSize: "10.5px", marginLeft: "4px" }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Toggleable Search, Me quick filter, swimlanes, sort & saved views */}
          <div className="d-flex align-items-center gap-1.5">
            {/* Toggleable Search */}
            {showSearchInput || filterQuery ? (
              <div className="d-flex align-items-center position-relative me-1">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="form-control form-control-sm"
                  style={{ width: "130px", fontSize: "11px", height: "24px", paddingLeft: "22px", borderRadius: "4px", borderColor: "#cbd5e1" }}
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  autoFocus
                  onBlur={() => { if (!filterQuery) setShowSearchInput(false); }}
                />
                <Search className="position-absolute start-0 ms-1.5 text-slate-400" size={11} style={{ top: "50%", transform: "translateY(-50%)" }} />
              </div>
            ) : (
              <button 
                type="button" 
                className="workspace-inline-tool-btn" 
                onClick={() => setShowSearchInput(true)} 
                title="Search Tasks"
              >
                <Search size={12} />
              </button>
            )}

            {/* Quick Teammates toggle */}
            <button 
              type="button" 
              className={`workspace-inline-tool-btn ${groupBy === "assignee" ? "active" : ""}`}
              onClick={() => setGroupBy(groupBy === "assignee" ? "status" : "assignee")}
              title="Group by Teammates"
            >
              <Users size={12} />
            </button>

            {/* Subtask toggle indicator */}
            <button 
              type="button" 
              className="workspace-inline-tool-btn" 
              onClick={() => toast.info("Subtasks are automatically grouped within parent tasks.")}
              title="Subtask Settings"
            >
              <GitFork size={12} />
            </button>

            {/* Me quick-filter profile icon */}
            <button 
              type="button" 
              onClick={handleToggleMeFilter} 
              className={`zbot-me-filter-btn ${isMeFiltered ? "active" : ""}`}
              title={isMeFiltered ? "Clear Me Filter" : "Filter: Assigned to Me"}
            >
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "ME"}
            </button>

            {/* Space settings gear */}
            <button 
              type="button" 
              className="workspace-inline-tool-btn" 
              onClick={() => setShowSpaceSettingsModal(true)}
              title="Space Settings"
            >
              <Settings size={12} />
            </button>

            {/* Swimlanes */}
            {currentViewType === "board" && (
              <select
                className="zbot-borderless-select border-start ps-1.5 ms-1"
                value={kanbanGrouping}
                onChange={(e) => setKanbanGrouping(e.target.value)}
                title="Kanban Swimlane"
              >
                <option value="none">Swimlane: None</option>
                <option value="priority">Swimlane: Priority</option>
                <option value="assignee">Swimlane: Assignee</option>
              </select>
            )}

            {/* Sort controls */}
            <div className="d-flex align-items-center gap-1 border-start ps-2 ms-1">
              <select
                className="zbot-borderless-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                title="Sort Tasks"
              >
                <option value="position">Sort: Default</option>
                <option value="title">Sort: Alphabetical</option>
                <option value="priority">Sort: Priority</option>
                <option value="due_date">Sort: Due Date</option>
              </select>
              <button
                className="workspace-inline-tool-btn"
                onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                title="Toggle Sort Order"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>

            {/* Saved Views Config Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle as="button" className="workspace-inline-tool-btn border-0 py-1" style={{ fontSize: "11.5px", fontWeight: "600", color: "#64748b" }}>
                <Layers size={12} className="me-1" />
                <span>{currentViewName || "Views"}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-0" style={{ minWidth: "220px", borderRadius: "10px", zIndex: 1060 }} popperConfig={{ strategy: "fixed" }}>
                <div className="px-3 py-2 border-b">
                  <span className="text-muted small fw-bold d-block mb-1">Save Current Config</span>
                  <div className="d-flex gap-1">
                    <input
                      type="text"
                      placeholder="View Name"
                      className="form-control form-control-sm text-xs"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                    />
                    <Button variant="primary" size="sm" onClick={handleSaveView} style={{ fontSize: "10px" }}>
                      Save
                    </Button>
                  </div>
                </div>
                <div className="py-1">
                  {savedViews.length === 0 ? (
                    <span className="dropdown-item-text text-muted small py-2">No saved custom configs.</span>
                  ) : (
                    savedViews.map((v) => (
                      <div key={v.name} className="d-flex align-items-center justify-content-between px-2 hover:bg-slate-50">
                        <button
                          className="btn btn-link text-start text-xs text-decoration-none py-1.5 px-2 text-slate-700 flex-grow-1"
                          onClick={() => handleApplyView(v.name)}
                        >
                          {v.name}
                        </button>
                        <button
                          className="btn btn-link text-danger p-1 text-decoration-none"
                          onClick={() => handleDeleteView(v.name)}
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      )}

            <div 
        className="board-views-wrapper"
        style={{ 
          paddingRight: activeCommentTaskId ? "420px" : "0",
          transition: "padding-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {currentViewType === "overview" && renderOverviewView()}
        {currentViewType === "list" && renderListView()}
        {currentViewType === "board" && renderBoardView()}
        {currentViewType === "table" && renderTableView()}
        {currentViewType === "calendar" && (
          <CalendarView
            boardId={Number(boardId)}
            onTaskClick={handleTaskClickFromView}
            assignees={assignees}
            refreshWorkspace={refreshWorkspace}
          />
        )}
        {currentViewType === "gantt" && (
          <GanttView
            board={board}
            onTaskClick={handleTaskClickFromView}
          />
        )}
        {currentViewType === "docs" && (
          <DocsView
            boardId={Number(boardId)}
            assignees={assignees}
            departments={departments}
          />
        )}
        {currentViewType === "custom_fields" && (
          <CustomFieldsView
            boardId={Number(boardId)}
          />
        )}
        {currentViewType === "milestones" && (
          <MilestonesView
            boardId={Number(boardId)}
          />
        )}
        {currentViewType === "files" && (
          <FilesView
            boardId={Number(boardId)}
          />
        )}
        {currentViewType === "form" && (
          <FormView
            boardId={Number(boardId)}
            boardCustomFields={boardCustomFields}
          />
        )}
        {currentViewType === "timesheets" && (
          <TimesheetsView
            boardId={Number(boardId)}
            groups={board?.groups}
          />
        )}
        {currentViewType === "timeline" && renderTimelineView()}
        {currentViewType === "dashboard" && renderDashboardReportView()}
        {currentViewType === "whiteboard" && renderWhiteboardView()}
        {currentViewType === "activity" && renderActivityView()}
        {currentViewType === "mind_map" && renderMindMapView()}
        {currentViewType === "team" && renderTeamView()}
        {currentViewType === "map" && renderMapView()}
      </div>

      <InlineCommentPanel
        task={activeCommentTask}
        isOpen={!!activeCommentTaskId}
        onClose={() => setActiveCommentTaskId(null)}
        assignees={assignees}
        onCommentAdded={() => {
          fetchWorkspace(false);
        }}
      />


      {/* Floating Bulk Actions Bar */}
      {selectedTaskIds.length > 0 && (
        <div
          className="position-fixed bottom-4 start-50 translate-middle-x text-white p-2.5 rounded-3 shadow-lg d-flex align-items-center gap-2 border border-slate-700 clickup-bulk-toolbar"
          style={{ zIndex: 1050, bottom: "30px", backgroundColor: "#1e1e24" }}
        >
          <div className="d-flex align-items-center border-end pe-3 border-slate-700">
            <span className="badge bg-primary text-white fw-bold me-2 px-2 py-1" style={{ fontSize: "12px", backgroundColor: "#673de6" }}>
              {selectedTaskIds.length}
            </span>
            <span className="small fw-semibold">task(s) selected</span>
            <span className="cursor-pointer text-slate-400 hover:text-white ms-2 text-xs" onClick={() => setSelectedTaskIds([])} title="Clear selection">✕</span>
          </div>

          <div className="d-flex align-items-center gap-2 ps-2">
            {/* Status Dropdown */}
            <Dropdown>
              <Dropdown.Toggle variant="link" className="text-white text-decoration-none btn-sm d-flex align-items-center gap-1" style={{ fontSize: "12px" }}>
                <Activity size={13} /> Status
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border rounded-3 py-1" style={{ fontSize: "12px" }}>
                {STATUS_OPTIONS.map((status) => (
                  <Dropdown.Item key={status} onClick={() => handleBulkStatusChange(status)}>
                    {STATUS_META[status]?.label || status}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {/* Assignees Dropdown */}
            <Dropdown>
              <Dropdown.Toggle variant="link" className="text-white text-decoration-none btn-sm d-flex align-items-center gap-1" style={{ fontSize: "12px" }}>
                <User size={13} /> Assignees
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border rounded-3 py-1" style={{ fontSize: "12px", maxHeight: "200px", overflowY: "auto" }}>
                <Dropdown.Item onClick={() => handleBulkAssigneeChange(null)}>
                  <span className="text-muted">Unassigned</span>
                </Dropdown.Item>
                <Dropdown.Divider />
                {assignees.map((a) => (
                  <Dropdown.Item key={`${a.role}_${a.id}`} onClick={() => handleBulkAssigneeChange(a)}>
                    {a.name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {/* Dates Button */}
            <div className="position-relative d-inline-block">
              <button 
                type="button" 
                className="btn btn-link btn-sm text-white text-decoration-none d-flex align-items-center gap-1" 
                style={{ fontSize: "12px" }}
                onClick={() => document.getElementById("bulk-date-picker-hidden")?.showPicker()}
              >
                <Calendar size={13} /> Dates
              </button>
              <input 
                type="date" 
                id="bulk-date-picker-hidden" 
                className="position-absolute opacity-0 top-0 start-0 w-100 h-100" 
                style={{ pointerEvents: "none" }}
                onChange={(e) => handleBulkDateChange(e.target.value)}
              />
            </div>

            {/* Custom Fields */}
            <button 
               type="button" 
               className="btn btn-link btn-sm text-white text-decoration-none d-flex align-items-center gap-1" 
               style={{ fontSize: "12px" }}
               onClick={handleOpenBulkCustomFields}
             >
               <Layers size={13} /> Custom Fields
             </button>

            {/* Tags */}
            <button 
              className="btn btn-link btn-sm text-white text-decoration-none d-flex align-items-center gap-1" 
              style={{ fontSize: "12px" }}
              onClick={handleBulkTagsChange}
            >
              <Pin size={13} /> Tags
            </button>

            {/* Move/Add */}
            <button 
              type="button" 
              className="btn btn-link btn-sm text-white text-decoration-none d-flex align-items-center gap-1" 
              style={{ fontSize: "12px" }}
              onClick={() => handleOpenMoveTaskModal(null)}
            >
              <ArrowRight size={13} /> Move/Add
            </button>

            {/* Copy */}
            <button 
              type="button" 
              className="btn btn-link btn-sm text-white text-decoration-none d-flex align-items-center gap-1" 
              style={{ fontSize: "12px" }}
              onClick={() => {
                const names = selectedTaskIds.map(id => {
                  const task = allTasks.find(t => t.id === id);
                  return task ? task.title : id;
                }).join("\n");
                navigator.clipboard.writeText(names);
                toast.success("Copied selected task titles to clipboard!");
              }}
            >
              <Copy size={13} /> Copy
            </button>

            {/* Delete button (trash can) */}
            <button 
              type="button" 
              className="btn btn-link btn-sm text-danger text-decoration-none d-inline-flex align-items-center p-1 ms-2"
              onClick={handleBulkDelete}
              disabled={saving}
              title="Delete selected tasks"
            >
              <Trash2 size={15} />
            </button>

            {/* More options dropdown */}
            <Dropdown className="d-inline-block">
              <Dropdown.Toggle variant="link" className="text-white text-decoration-none btn-sm p-1 text-slate-400" style={{ fontSize: "12px" }}>
                <MoreHorizontal size={14} />
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border rounded-3 py-1" style={{ fontSize: "12px" }}>
                <div className="dropdown-header text-uppercase fw-bold text-slate-400 pb-1" style={{ fontSize: "10px" }}>Change Priority</div>
                {PRIORITY_OPTIONS.map((p) => (
                  <Dropdown.Item key={p} onClick={() => handleBulkPriorityChange(p)}>
                    {p}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      )}

      {/* Render custom statuses edit modal */}
      {renderEditStatusesModal()}

      {activeTaskId && activeTask && (
        <UpdatesDrawer
          taskId={activeTaskId}
          task={activeTask}
          boardId={Number(boardId)}
          boardCustomFields={boardCustomFields}
          onOpenCustomFields={handleOpenCustomFieldsOffcanvas}
          onRefreshWorkspace={() => fetchWorkspace(false)}
          onClose={handleCloseUpdatesDrawer}
          allTasks={allTasks}
          onTaskUpdated={(tId, updates) => patchTaskInState(tId, (t) => ({ ...t, ...updates }))}
          onSelectTask={handleOpenUpdatesDrawer}
          groupName={board?.groups?.find((g) => g.id === activeTask.group_id)?.name}
          boardName={board?.name}
          customStatuses={board?.custom_statuses}
        />
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

      {/* Create Status Group Modal */}
      <Modal show={showCreateStatusModal} onHide={() => setShowCreateStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Status Group</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateStatus}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Group / Status Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. In Review, QA, Blocked"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Theme Color</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                {BOARD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="border-0 rounded-circle"
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: c,
                      boxShadow: newStatusColor === c ? "0 0 0 3px rgba(0, 0, 0, 0.3)" : "none",
                      cursor: "pointer"
                    }}
                    onClick={() => setNewStatusColor(c)}
                  />
                ))}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateStatusModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : "Create Group"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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

      {/* View Sharing & Permissions Modal */}
      <Modal show={showSharingModal} onHide={() => setShowSharingModal(false)} centered className="border-0">
        <Modal.Header closeButton className="border-b border-slate-100 p-6 bg-slate-50/50">
          <Modal.Title className="font-bold text-base text-slate-950 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-700" />
            <span>Sharing & Permissions: {boardViews.find(v => v.key === sharingViewKey)?.label}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6">
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-slate-50 border rounded-2xl">
              <span className="text-xs font-semibold text-slate-800 d-block mb-1">Share View Link</span>
              <div className="d-flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  className="form-control text-xs bg-white border"
                  value={`${window.location.origin}${window.location.pathname}?view=${sharingViewKey}`} 
                />
                <Button 
                  size="sm" 
                  variant="dark"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?view=${sharingViewKey}`);
                    toast.success("Link copied!");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div>
              <span className="text-xs font-semibold text-slate-800 d-block mb-1.5">Who has access?</span>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-center text-xs py-1">
                  <span>Workspace Admins</span>
                  <span className="text-slate-400 font-medium">Full Access</span>
                </div>
                <div className="d-flex justify-content-between align-items-center text-xs py-1 border-top">
                  <span>Workspace Members</span>
                  <span className="text-slate-400 font-medium">Can Edit / View</span>
                </div>
                <div className="d-flex justify-content-between align-items-center text-xs py-1 border-top">
                  <span>External / Guest Share</span>
                  <Form.Check type="switch" label="" id="guest-access-switch" />
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-slate-100 p-4 bg-slate-50/50">
          <Button variant="light" onClick={() => setShowSharingModal(false)} className="text-xs font-bold px-4 py-2 border-0 rounded-xl">
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Move Task Modal */}
      <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)} centered size="md">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: "16px" }}>
            Move {moveTargetTasks.length === 1 ? `'${moveTargetTasks[0].title}'` : `${moveTargetTasks.length} tasks`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="text-muted small mb-4">Select a destination Space, List, and Status/Group to move these tasks to.</p>
          <div className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fw-bold text-slate-700 text-xs uppercase mb-1">Destination Space</Form.Label>
              <Form.Select 
                value={destSpaceId} 
                onChange={(e) => handleSpaceChange(e.target.value)}
                style={{ fontSize: "13px" }}
              >
                <option value="">-- Select Space --</option>
                {boards.filter(b => b.parent_id === null && !b.is_folder && !b.is_personal).map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {destSpaceId && boards.filter(b => b.parent_id === Number(destSpaceId) && b.is_folder).length > 0 && (
              <Form.Group>
                <Form.Label className="fw-bold text-slate-700 text-xs uppercase mb-1">Folder (Optional)</Form.Label>
                <Form.Select 
                  value={destFolderId} 
                  onChange={(e) => handleFolderChange(e.target.value)}
                  style={{ fontSize: "13px" }}
                >
                  <option value="">-- No Folder (Direct List) --</option>
                  {boards.filter(b => b.parent_id === Number(destSpaceId) && b.is_folder).map(f => (
                    <option key={f.id} value={f.id}>📁 {f.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {destSpaceId && (
              <Form.Group>
                <Form.Label className="fw-bold text-slate-700 text-xs uppercase mb-1">Destination List</Form.Label>
                <Form.Select 
                  value={destListId} 
                  onChange={(e) => handleListSelect(e.target.value)}
                  style={{ fontSize: "13px" }}
                >
                  <option value="">-- Select List --</option>
                  {boards.filter(b => b.parent_id === (destFolderId !== "" ? Number(destFolderId) : Number(destSpaceId)) && !b.is_folder).length === 0 && (
                    <option value="CREATE_DEFAULT">-- Auto-create default list ('General') --</option>
                  )}
                  {(destFolderId !== "" 
                    ? boards.filter(b => b.parent_id === Number(destFolderId) && !b.is_folder)
                    : boards.filter(b => b.parent_id === Number(destSpaceId) && !b.is_folder)
                  ).map(l => (
                    <option key={l.id} value={l.id}>{l.icon || "📋"} {l.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {destListId && (
              <Form.Group>
                <Form.Label className="fw-bold text-slate-700 text-xs uppercase mb-1">
                  Destination Status / Group {loadingDestGroups && <Spinner animation="border" size="sm" className="ms-2" />}
                </Form.Label>
                <Form.Select 
                  value={destGroupId} 
                  onChange={(e) => setDestGroupId(e.target.value)}
                  style={{ fontSize: "13px" }}
                  disabled={loadingDestGroups || destListId === "CREATE_DEFAULT"}
                >
                  {destListId === "CREATE_DEFAULT" ? (
                    <option value="CREATE_DEFAULT_GROUP">Default Group ("List")</option>
                  ) : (
                    destGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))
                  )}
                </Form.Select>
              </Form.Group>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowMoveModal(false)} className="px-4 py-1.5" style={{ fontSize: "12.5px" }}>
            Cancel
          </Button>
          <Button 
            variant="dark" 
            onClick={handleExecuteMove} 
            disabled={!destGroupId || saving}
            className="px-4 py-1.5" 
            style={{ fontSize: "12.5px" }}
          >
            {saving ? <Spinner animation="border" size="sm" /> : "Move Task(s)"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Custom Fields Modal */}
      <Modal show={showBulkCustomFieldsModal} onHide={() => setShowBulkCustomFieldsModal(false)} centered size="md">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: "16px" }}>
            Bulk Update Custom Fields ({selectedTaskIds.length} tasks)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {boardCustomFields.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">No custom fields configured for this space. Create some in the "Fields" view first!</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              <Form.Group>
                <Form.Label className="fw-bold text-slate-700 text-xs uppercase mb-1">Custom Field</Form.Label>
                <Form.Select 
                  value={selectedBulkFieldId} 
                  onChange={(e) => {
                    setSelectedBulkFieldId(e.target.value);
                    setBulkFieldValue("");
                  }}
                  style={{ fontSize: "13px" }}
                >
                  {boardCustomFields.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-bold text-slate-700 text-xs uppercase mb-1">New Value</Form.Label>
                {(() => {
                  const activeField = boardCustomFields.find(f => f.id === Number(selectedBulkFieldId));
                  if (!activeField) return <Form.Control type="text" disabled />;
                  
                  if (activeField.type === "dropdown" || activeField.type === "multi_select") {
                    const opts = activeField.config?.options || [];
                    return (
                      <Form.Select 
                        value={bulkFieldValue} 
                        onChange={(e) => setBulkFieldValue(e.target.value)}
                        style={{ fontSize: "13px" }}
                      >
                        <option value="">-- Choose Option --</option>
                        {opts.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </Form.Select>
                    );
                  }
                  
                  if (activeField.type === "date") {
                    return (
                      <Form.Control 
                        type="date" 
                        value={bulkFieldValue} 
                        onChange={(e) => setBulkFieldValue(e.target.value)}
                        style={{ fontSize: "13px" }}
                      />
                    );
                  }

                  if (activeField.type === "number" || activeField.type === "currency" || activeField.type === "rating") {
                    return (
                      <Form.Control 
                        type="number" 
                        placeholder="Enter number value" 
                        value={bulkFieldValue} 
                        onChange={(e) => setBulkFieldValue(e.target.value)}
                        style={{ fontSize: "13px" }}
                      />
                    );
                  }

                  return (
                    <Form.Control 
                      type="text" 
                      placeholder="Enter value" 
                      value={bulkFieldValue} 
                      onChange={(e) => setBulkFieldValue(e.target.value)}
                      style={{ fontSize: "13px" }}
                    />
                  );
                })()}
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowBulkCustomFieldsModal(false)} className="px-4 py-1.5" style={{ fontSize: "12.5px" }}>
            Cancel
          </Button>
          <Button 
            variant="dark" 
            onClick={handleSaveBulkCustomFields} 
            disabled={boardCustomFields.length === 0 || saving}
            className="px-4 py-1.5" 
            style={{ fontSize: "12.5px" }}
          >
            {saving ? <Spinner animation="border" size="sm" /> : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Tags Modal */}
      <Modal show={showBulkTagsModal} onHide={() => setShowBulkTagsModal(false)} centered size="md">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: "16px" }}>
            Bulk Update Tags ({selectedTaskIds.length} tasks)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="text-muted small mb-4">Add or replace tags for the selected tasks. Separate multiple tags with commas.</p>
          <Form.Group>
            <Form.Label className="fw-bold text-slate-700 text-xs uppercase mb-1">Tags</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="e.g. urgent, feature, bug" 
              value={bulkTagsValue} 
              onChange={(e) => setBulkTagsValue(e.target.value)}
              style={{ fontSize: "13px" }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowBulkTagsModal(false)} className="px-4 py-1.5" style={{ fontSize: "12.5px" }}>
            Cancel
          </Button>
          <Button 
            variant="dark" 
            onClick={handleSaveBulkTags} 
            disabled={saving}
            className="px-4 py-1.5" 
            style={{ fontSize: "12.5px" }}
          >
            {saving ? <Spinner animation="border" size="sm" /> : "Save Tags"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom Fields Offcanvas */}
      {showCustomFieldsOffcanvas && (
        <div className="custom-fields-offcanvas-overlay" onClick={() => setShowCustomFieldsOffcanvas(false)}></div>
      )}
      <div className={`custom-fields-offcanvas ${showCustomFieldsOffcanvas ? "open" : ""}`}>
        {renderCustomFieldsOffcanvasContent()}
      </div>

      {/* Custom Field Manager Modal */}
      <Modal 
        show={showFieldManagerModal} 
        onHide={() => setShowFieldManagerModal(false)} 
        centered 
        size="xl" 
        dialogClassName="custom-field-manager-modal"
      >
        <Modal.Body className="p-0 d-flex" style={{ height: "650px", overflow: "hidden" }}>
          
          {/* Sidebar */}
          <div className="border-end p-3 bg-light d-flex flex-column" style={{ width: "260px" }}>
            <div className="d-flex align-items-center gap-2 mb-4">
              <Settings className="text-primary" size={18} />
              <h6 className="fw-bold text-slate-800 mb-0">Custom Field Manager</h6>
            </div>
            
            <div className="d-flex flex-column gap-1 overflow-auto flex-grow-1">
              <button 
                type="button" 
                className={`btn btn-sm text-start py-2 px-3 border-0 rounded text-xs ${managerSelectedLocation === "all" ? "bg-white shadow-sm text-primary fw-bold" : "text-slate-600 bg-transparent"}`}
                onClick={() => setManagerSelectedLocation("all")}
              >
                All Custom Fields
              </button>
              <button 
                type="button" 
                className={`btn btn-sm text-start py-2 px-3 border-0 rounded text-xs ${managerSelectedLocation === "workspace" ? "bg-white shadow-sm text-primary fw-bold" : "text-slate-600 bg-transparent"}`}
                onClick={() => setManagerSelectedLocation("workspace")}
              >
                Workspace Fields
              </button>
              
              <div className="text-slate-400 text-xs fw-semibold uppercase px-3 pt-3 pb-1.5" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>By Location</div>
              {boards.map(b => (
                <button 
                  key={b.id}
                  type="button" 
                  className={`btn btn-sm text-start py-2 px-3 border-0 rounded text-truncate text-xs d-flex align-items-center gap-2 ${managerSelectedLocation === b.id ? "bg-white shadow-sm text-primary fw-bold" : "text-slate-600 bg-transparent"}`}
                  onClick={() => setManagerSelectedLocation(b.id)}
                  title={b.name}
                >
                  <span className="text-warning">📂</span>
                  <span>{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Pane */}
          <div className="flex-grow-1 p-4 d-flex flex-column bg-white" style={{ minWidth: 0 }}>
            {/* Header toolbar */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-2">
                <span className="text-slate-400 text-xs font-semibold">
                  {managerSelectedLocation === "all" ? "All Locations" : managerSelectedLocation === "workspace" ? "Workspace Fields" : `Space / ${boards.find(b => b.id === managerSelectedLocation)?.name || "Space"}`}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-secondary px-3 py-1.5 text-xs bg-white text-slate-600 border" 
                  onClick={() => {
                    const existing = workspaceFields.find(wf => !boardCustomFields.some(bcf => bcf.name === wf.name));
                    if (existing) {
                      api.post(`/board-extensions/boards/${boardId}/custom-fields`, {
                        name: existing.name,
                        type: existing.type,
                        config: existing.config
                      }).then(() => {
                        toast.success("Added custom field successfully!");
                        fetchWorkspace(false);
                        fetchManagerFields();
                      });
                    } else {
                      toast.info("No other custom fields found to add.");
                    }
                  }}
                  style={{ fontWeight: "600" }}
                >
                  Add existing
                </button>

                <Dropdown align="end" className="position-relative">
                  <Dropdown.Toggle as="button" className="btn btn-sm btn-dark px-3 py-1.5 text-xs text-white border-0" style={{ fontWeight: "600", backgroundColor: "#1e293b", borderRadius: "5px" }}>
                    Create new
                  </Dropdown.Toggle>
                  <Dropdown.Menu 
                    className="shadow-lg border border-slate-200 py-2" 
                    style={{ 
                      fontSize: "12.5px", 
                      width: "250px", 
                      maxHeight: "400px", 
                      overflowY: "auto", 
                      borderRadius: "8px",
                      zIndex: 2100 
                    }}
                    popperConfig={{ strategy: "fixed" }}
                  >
                    <div className="px-2.5 pb-2 border-bottom mb-2">
                      <input 
                        type="text" 
                        className="form-control form-control-sm text-xs" 
                        placeholder="Search..." 
                        style={{ borderRadius: "4px" }}
                        value={dropdownSearchQuery}
                        onChange={(e) => setDropdownSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="px-3 py-1 text-slate-400 text-uppercase fw-bold" style={{ fontSize: "9.5px", letterSpacing: "0.5px" }}>All</div>
                    {[
                      { label: "Dropdown", type: "Dropdown", icon: <ListPlus size={13} className="text-success" /> },
                      { label: "Text", type: "Text", icon: <Type size={13} className="text-primary" /> },
                      { label: "Date", type: "Date", icon: <Calendar size={13} className="text-info" /> },
                      { label: "Text area (Long Text)", type: "Text area", icon: <AlignLeft size={13} className="text-secondary" /> },
                      { label: "Number", type: "Number", icon: <Hash size={13} className="text-primary" /> },
                      { label: "Labels (Multi-select)", type: "Labels", icon: <Tag size={13} className="text-warning" /> },
                      { label: "Checkbox", type: "Checkbox", icon: <CheckSquare size={13} className="text-slate-500" /> },
                      { label: "Money", type: "Money", icon: <DollarSign size={13} className="text-success" /> },
                      { label: "Website", type: "Website", icon: <Globe size={13} className="text-info" /> },
                      { label: "Files", type: "Files", icon: <Paperclip size={13} className="text-secondary" /> },
                      { label: "Relationship", type: "Relationship", icon: <Link size={13} className="text-primary" /> },
                      { label: "People", type: "People", icon: <Users size={13} className="text-purple" /> }
                    ]
                    .filter(item => item.label.toLowerCase().includes(dropdownSearchQuery.toLowerCase()))
                    .map(item => (
                      <Dropdown.Item 
                        key={item.label} 
                        className="d-flex align-items-center gap-2.5 py-2 px-3"
                        onClick={() => handleManagerSelectTypeForCreation(item.type)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                <button 
                  type="button" 
                  className="btn-close ms-2" 
                  onClick={() => setShowFieldManagerModal(false)}
                ></button>
              </div>
            </div>

            {/* Search toolbar */}
            <div className="mb-4 d-flex gap-3">
              <div className="input-group input-group-sm flex-grow-1" style={{ maxWidth: "300px" }}>
                <span className="input-group-text bg-light border-end-0 text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0 ps-0 text-xs"
                  placeholder="Search fields..."
                  value={managerSearchQuery}
                  onChange={(e) => setManagerSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Fields table view */}
            <div className="flex-grow-1 overflow-auto border rounded bg-white">
              {loadingManagerFields ? (
                <div className="h-100 w-100 d-flex align-items-center justify-content-center">
                  <Spinner animation="border" className="text-primary" />
                </div>
              ) : Object.keys(groupedManagerFields).length === 0 ? (
                <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center text-muted py-5">
                  <span style={{ fontSize: "36px" }}>📂</span>
                  <span className="mt-2 text-xs">No custom fields found in this location.</span>
                </div>
              ) : (
                <table className="table table-hover align-middle mb-0 text-slate-700" style={{ fontSize: "12.5px" }}>
                  <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                    <tr className="text-slate-400 text-uppercase fw-semibold" style={{ fontSize: "10.5px" }}>
                      <th className="ps-3 py-2.5" style={{ width: "35%" }}>Name</th>
                      <th className="py-2.5" style={{ width: "20%" }}>Type</th>
                      <th className="py-2.5" style={{ width: "15%" }}>Created By</th>
                      <th className="py-2.5" style={{ width: "15%" }}>Date Created</th>
                      <th className="py-2.5" style={{ width: "15%" }}>Location(s)</th>
                      <th className="text-end pe-3 py-2.5" style={{ width: "5%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedManagerFields).map(([typeLabel, fieldsList]) => (
                      <React.Fragment key={typeLabel}>
                        {/* Group Header */}
                        <tr className="bg-light border-bottom border-top">
                          <td colSpan={6} className="ps-3 py-2 text-slate-500 fw-bold" style={{ fontSize: "11px" }}>
                            {typeLabel} <span className="badge bg-secondary-subtle text-secondary rounded-pill ms-1.5">{fieldsList.length}</span>
                          </td>
                        </tr>
                        {/* Field list rows */}
                        {fieldsList.map(f => {
                          const fLocationBoard = boards.find(b => b.id === f.board_id);
                          return (
                            <tr key={f.id}>
                              <td className="ps-3 py-2.5 fw-semibold text-slate-800">
                                {managerEditingFieldId === f.id ? (
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm text-xs py-0.5 px-1.5 w-75 border-primary shadow-sm"
                                    value={managerEditingFieldName}
                                    onChange={(e) => setManagerEditingFieldName(e.target.value)}
                                    onBlur={async () => {
                                      const cleanVal = managerEditingFieldName.trim();
                                      if (!cleanVal) {
                                        toast.error("Field name cannot be empty.");
                                        setManagerEditingFieldId(null);
                                        return;
                                      }
                                      try {
                                        await api.put(`/board-extensions/custom-fields/${f.id}`, { name: cleanVal });
                                        toast.success("Field renamed successfully!");
                                        setManagerEditingFieldId(null);
                                        fetchManagerFields();
                                        fetchWorkspace(false);
                                      } catch (err) {
                                        console.error(err);
                                        toast.error("Failed to rename field.");
                                      }
                                    }}
                                    onKeyDown={async (e) => {
                                      if (e.key === "Enter") {
                                        const cleanVal = managerEditingFieldName.trim();
                                        if (!cleanVal) {
                                          toast.error("Field name cannot be empty.");
                                          setManagerEditingFieldId(null);
                                          return;
                                        }
                                        try {
                                          await api.put(`/board-extensions/custom-fields/${f.id}`, { name: cleanVal });
                                          toast.success("Field renamed successfully!");
                                          setManagerEditingFieldId(null);
                                          fetchManagerFields();
                                          fetchWorkspace(false);
                                        } catch (err) {
                                          console.error(err);
                                          toast.error("Failed to rename field.");
                                        }
                                      }
                                      if (e.key === "Escape") {
                                        setManagerEditingFieldId(null);
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  f.name
                                )}
                              </td>
                              <td className="py-2.5 d-flex align-items-center gap-2">
                                {(() => {
                                  let typeIcon = <Type size={13} className="text-slate-400" />;
                                  if (f.type === "dropdown") typeIcon = <ListPlus size={13} className="text-success" />;
                                  if (f.type === "date") typeIcon = <Calendar size={13} className="text-info" />;
                                  if (f.type === "number") typeIcon = <Hash size={13} className="text-primary" />;
                                  if (f.type === "labels") typeIcon = <Tag size={13} className="text-warning" />;
                                  if (f.type === "checkbox") typeIcon = <CheckSquare size={13} className="text-slate-500" />;
                                  if (f.type === "money") typeIcon = <DollarSign size={13} className="text-success" />;
                                  return (
                                    <>
                                      {typeIcon}
                                      <span className="text-slate-500 text-xs capitalize">{f.type}</span>
                                    </>
                                  );
                                })()}
                              </td>
                              <td className="py-2.5">
                                <div className="assignee-avatar bg-purple text-white fw-bold d-flex align-items-center justify-content-center rounded-circle" style={{ width: "22px", height: "22px", fontSize: "9px" }}>
                                  {user ? user.name.substring(0, 2).toUpperCase() : "SA"}
                                </div>
                              </td>
                              <td className="py-2.5 text-slate-400" style={{ fontSize: "11.5px" }}>
                                {f.created_at ? new Date(f.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                              </td>
                              <td className="py-2.5">
                                <span className="badge bg-light text-slate-600 border px-2 py-1 text-xs d-inline-flex align-items-center gap-1.5">
                                  <span className="text-warning">📂</span>
                                  <span>{fLocationBoard ? fLocationBoard.name : "Space"}</span>
                                </span>
                              </td>
                              <td className="text-end pe-3 py-2.5">
                                <Dropdown align="end">
                                  <Dropdown.Toggle as="button" className="btn btn-link text-slate-400 hover:text-slate-600 p-0 border-0">
                                    <MoreHorizontal size={14} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu 
                                    className="shadow-lg border-0 py-1.5" 
                                    style={{ fontSize: "12.5px", minWidth: "160px", borderRadius: "6px" }} 
                                    popperConfig={{ strategy: "fixed" }}
                                  >
                                    <Dropdown.Item 
                                      className="d-flex align-items-center gap-2 py-2 px-3"
                                      onClick={() => {
                                        setShowFieldManagerModal(false);
                                        setEditingCustomField(f);
                                        setFieldName(f.name);
                                        setSelectedFieldType(f.type);
                                        
                                        if (f.config?.options) {
                                          const opts = f.config.options.map(opt => {
                                            if (typeof opt === "string") {
                                              const color = f.config?.optionColors?.[opt] || "#64748b";
                                              return { label: opt, color };
                                            }
                                            return opt;
                                          });
                                          setFieldOptionsList(opts);
                                        } else {
                                          setFieldOptionsList([]);
                                        }
                                        if (f.config?.currency) {
                                          setCurrencyCode(f.config.currency);
                                        }
                                        if (f.config?.button_name) {
                                          setButtonName(f.config.button_name);
                                          setButtonColor(f.config.button_color || "#3b82f6");
                                        }
                                        
                                        setFieldDesc(f.description || "");
                                        setFieldRequired(f.required || false);
                                        setFieldPinned(f.pinned || false);
                                        setFieldVisibleToGuests(f.visible_to_guests !== false);
                                        
                                        setOffcanvasStep(2);
                                        setShowCustomFieldsOffcanvas(true);
                                      }}
                                    >
                                      <Edit3 size={13} className="text-slate-400" />
                                      <span>Edit</span>
                                    </Dropdown.Item>

                                    <Dropdown.Item 
                                      className="d-flex align-items-center gap-2 py-2 px-3"
                                      onClick={() => {
                                        setManagerEditingFieldId(f.id);
                                        setManagerEditingFieldName(f.name);
                                      }}
                                    >
                                      <Type size={13} className="text-slate-400" />
                                      <span>Rename</span>
                                    </Dropdown.Item>

                                    <Dropdown.Item 
                                      className="d-flex align-items-center gap-2 py-2 px-3"
                                      onClick={() => handleDuplicateColumn(f)}
                                    >
                                      <Copy size={13} className="text-slate-400" />
                                      <span>Duplicate</span>
                                    </Dropdown.Item>

                                    <Dropdown.Item 
                                      className="d-flex align-items-center gap-2 py-2 px-3"
                                      onClick={() => {
                                        navigator.clipboard.writeText(f.id);
                                        toast.success("Field ID copied to clipboard!");
                                      }}
                                    >
                                      <ClipboardCopy size={13} className="text-slate-400" />
                                      <span>Copy field ID</span>
                                    </Dropdown.Item>

                                    <Dropdown.Divider />

                                    <Dropdown.Item 
                                      className="d-flex align-items-center gap-2 py-2 px-3 text-danger"
                                      onClick={() => setManagerDeletingFieldId(f.id)}
                                    >
                                      <Trash2 size={13} className="text-danger" />
                                      <span>Delete</span>
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </Modal.Body>
      </Modal>

      {/* Styled Native confirmation delete modal replacement */}
      <Modal show={!!managerDeletingFieldId} onHide={() => setManagerDeletingFieldId(null)} centered size="sm">
        <Modal.Body className="p-3 text-center">
          <span style={{ fontSize: "28px" }} className="text-warning mb-2 d-block">⚠️</span>
          <h6 className="fw-bold text-slate-800 mb-2">Delete Custom Field?</h6>
          <p className="text-slate-500 mb-3" style={{ fontSize: "11.5px" }}>This will delete the custom field and all associated task values permanently.</p>
          <div className="d-flex gap-2 justify-content-center">
            <button type="button" className="btn btn-xs btn-light border px-3 py-1" style={{ fontSize: "12px" }} onClick={() => setManagerDeletingFieldId(null)}>Cancel</button>
            <button 
              type="button" 
              className="btn btn-xs btn-danger text-white px-3 py-1 d-inline-flex align-items-center gap-1" 
              style={{ fontSize: "12px" }}
              disabled={deletingFieldId === managerDeletingFieldId}
              onClick={async () => {
                try {
                  setDeletingFieldId(managerDeletingFieldId);
                  await api.delete(`/board-extensions/custom-fields/${managerDeletingFieldId}`);
                  toast.success("Custom field deleted successfully.");
                  setManagerDeletingFieldId(null);
                  fetchWorkspace(false);
                  fetchManagerFields();
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to delete custom field.");
                } finally {
                  setDeletingFieldId(null);
                }
              }}
            >
              {deletingFieldId === managerDeletingFieldId ? (
                <>
                  <Spinner animation="border" size="sm" style={{ width: "12px", height: "12px" }} />
                  <span>Deleting...</span>
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <SpreadsheetImportModal
        show={showSpreadsheetImportModal}
        onHide={() => setShowSpreadsheetImportModal(false)}
        boardId={Number(boardId)}
        groups={board?.groups || []}
        existingCustomFields={boardCustomFields}
        onImportComplete={() => fetchWorkspace(false)}
      />
    </>
  );
};


export default BoardDetailPage;
