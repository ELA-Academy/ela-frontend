import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, Form, Spinner, Alert, Dropdown } from "react-bootstrap";
import { HandThumbsUp, HandThumbsUpFill, Reply, Send, X, Trash, Paperclip, Eye, EyeSlash } from "react-bootstrap-icons";
import {
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Circle,
  Flag,
  Link2,
  List,
  Pencil,
  Play,
  Save,
  Sparkles,
  StopCircle,
  Tag,
  Tags,
  Timer,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getTaskUpdates,
  createTaskUpdate,
  toggleLike,
  createReply,
  addTaskChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addTaskWatcher,
  removeTaskWatcher,
  uploadTaskAttachment,
  deleteTaskAttachment,
  getTaskHistory,
  updateTask,
  createTaskTemplate,
  getTaskTimeEntries,
  createTaskTimeEntry,
  deleteTaskTimeEntry,
  updateTaskTimeEstimate
} from "../../services/boardService";
import api from "../../utils/api";
import DOMPurify from "dompurify";
import { ListSkeleton } from "../Skeleton";
import "../../styles/Boards.css";

const UpdatesDrawer = ({
  taskId,
  task,
  onClose,
  allTasks = [],
  onTaskUpdated,
  groupName,
  boardName
}) => {
  const [activeTab, setActiveTab] = useState("updates");
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  // Task inline metadata states
  const [status, setStatus] = useState(task.status || "Not Started");
  const [taskTitle, setTaskTitle] = useState(task.title || "");
  const [priority, setPriority] = useState(task.priority || "Normal");
  const [startDate, setStartDate] = useState(task.start_date || "");
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [category, setCategory] = useState(task.category || "");
  const [tagsInput, setTagsInput] = useState(task.tags || "");
  const [descriptionHtml, setDescriptionHtml] = useState(task.description_html || "");
  const [editingDesc, setEditingDesc] = useState(false);

  const [checklist, setChecklist] = useState(task.checklist || []);
  const [watchers, setWatchers] = useState(task.watchers || []);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [taskAssignees, setTaskAssignees] = useState(task.assignees || []);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Time tracking states
  const [timeEstimate, setTimeEstimate] = useState(task.time_estimate_minutes || "");
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(task.time_spent_seconds || 0);
  const [timeEntries, setTimeEntries] = useState(task.time_entries || []);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [showManualLog, setShowManualLog] = useState(false);
  const [savingTime, setSavingTime] = useState(false);
  const timerIntervalRef = useRef(null);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskMeta, setNewSubtaskMeta] = useState({ assignees: [], due_date: "", priority: "Normal" });
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Advanced feature states
  const [dependencyTaskId, setDependencyTaskId] = useState(task.dependency_task_id || "");
  const [recurringSettings, setRecurringSettings] = useState(task.recurring_settings || "");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Editor states
  const [content, setContent] = useState("");
  const [trackedMentions, setTrackedMentions] = useState([]); // [{type, id, label}]

  // Autocomplete popup states
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });

  // Threaded replies local input states
  const [replyInputs, setReplyInputs] = useState({}); // {updateId: string}
  const [postingReplies, setPostingReplies] = useState({}); // {updateId: boolean}

  // Database listings for autocomplete
  const [mentionOptions, setMentionOptions] = useState([]); // [{type: 'staff'|'department'|'superadmin', id, label, searchStr}]

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Sync states when task changes
    setStatus(task.status || "Not Started");
    setTaskTitle(task.title || "");
    setPriority(task.priority || "Normal");
    setStartDate(task.start_date || "");
    setDueDate(task.due_date || "");
    setCategory(task.category || "");
    setTagsInput(task.tags || "");
    setDescriptionHtml(task.description_html || "");
    setChecklist(task.checklist || []);
    setWatchers(task.watchers || []);
    setAttachments(task.attachments || []);
    setSubtasks(task.subtasks || []);
    setTaskAssignees(
      task.assignees || (
        task.assignee_id
          ? [{
              id: task.assignee_id,
              role: task.assignee_role,
              name: task.assignee_name,
              email: task.assignee_email
            }]
          : []
      )
    );
    setDependencyTaskId(task.dependency_task_id || "");
    setRecurringSettings(task.recurring_settings || "");
    setTimeEstimate(task.time_estimate_minutes || "");
    setTimeSpentSeconds(task.time_spent_seconds || 0);
    setTimeEntries(task.time_entries || []);
  }, [task]);

  const refreshHistoryLogs = async () => {
    try {
      const data = await getTaskHistory(taskId);
      setHistoryLogs(data);
    } catch (err) {
      console.error("Failed to refresh history logs", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [updatesData, historyData] = await Promise.all([
          getTaskUpdates(taskId),
          getTaskHistory(taskId)
        ]);
        setUpdates(updatesData);
        setHistoryLogs(historyData);
      } catch (err) {
        console.error("Failed to load task updates and history.", err);
      } finally {
        setLoading(false);
      }
    };

    const loadMentionOptions = async () => {
      try {
        const [staffRes, deptRes] = await Promise.all([
          api.get("/staff"),
          api.get("/departments")
        ]);
        
        const options = [];
        options.push({
          type: "superadmin",
          id: 1,
          label: "Super Admin",
          searchStr: "super admin superadmin admin@ela-school.org"
        });
        
        if (Array.isArray(staffRes.data)) {
          staffRes.data.forEach((s) => {
            options.push({
              type: "staff",
              id: s.id,
              label: s.name,
              searchStr: `${s.name} ${s.email}`.toLowerCase()
            });
          });
        }
        
        if (Array.isArray(deptRes.data)) {
          deptRes.data.filter(d => d.is_active).forEach((d) => {
            options.push({
              type: "department",
              id: d.id,
              label: d.name,
              searchStr: d.name.toLowerCase()
            });
          });
        }
        
        setMentionOptions(options);
      } catch (err) {
        console.error("Failed to load mention options.", err);
      }
    };

    loadData();
    loadMentionOptions();
  }, [taskId]);

  // Cleanup timer interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleStartTimer = () => {
    setTimerActive(true);
    setTimerSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerActive(false);

    const totalMinutes = Math.max(1, Math.round(timerSeconds / 60));
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    setManualHours(hrs > 0 ? hrs : "");
    setManualMinutes(mins);
    setManualDesc(`Timer session (${formatTimer(timerSeconds)})`);
    setShowManualLog(true);
  };

  const handleAddManualTime = async (e) => {
    e.preventDefault();
    const hrs = parseInt(manualHours) || 0;
    const mins = parseInt(manualMinutes) || 0;
    const duration_seconds = (hrs * 3600) + (mins * 60);

    if (duration_seconds <= 0) {
      setError("Please log a valid duration greater than 0 minutes.");
      return;
    }

    try {
      setSavingTime(true);
      setError("");
      const start_time = new Date().toISOString();
      const response = await createTaskTimeEntry(taskId, {
        start_time,
        duration_seconds,
        description: manualDesc.trim() || "Manual time entry"
      });

      setTimeEntries((prev) => {
        const next = [response, ...prev];
        if (onTaskUpdated) onTaskUpdated(taskId, { time_entries: next });
        return next;
      });
      setTimeSpentSeconds((prev) => {
        const next = prev + duration_seconds;
        if (onTaskUpdated) onTaskUpdated(taskId, { time_spent_seconds: next });
        return next;
      });
      
      setManualHours("");
      setManualMinutes("");
      setManualDesc("");
      setShowManualLog(false);
    } catch (err) {
      setError("Failed to save time entry.");
    } finally {
      setSavingTime(false);
    }
  };

  const handleDeleteTime = async (entryId, durationSecs) => {
    if (!window.confirm("Are you sure you want to delete this time entry?")) return;
    try {
      setSavingTime(true);
      await deleteTaskTimeEntry(entryId);
      setTimeEntries((prev) => {
        const next = prev.filter((e) => e.id !== entryId);
        if (onTaskUpdated) onTaskUpdated(taskId, { time_entries: next });
        return next;
      });
      setTimeSpentSeconds((prev) => {
        const next = Math.max(0, prev - durationSecs);
        if (onTaskUpdated) onTaskUpdated(taskId, { time_spent_seconds: next });
        return next;
      });
    } catch (err) {
      setError("Failed to delete time entry.");
    } finally {
      setSavingTime(false);
    }
  };

  const handleEstimateChange = async (e) => {
    const val = e.target.value;
    setTimeEstimate(val);
  };

  const handleSaveEstimate = async () => {
    const mins = parseInt(timeEstimate);
    const estimateVal = isNaN(mins) || mins <= 0 ? null : mins;

    try {
      setSavingTime(true);
      setError("");
      await updateTaskTimeEstimate(taskId, estimateVal);
      setTimeEstimate(estimateVal === null ? "" : estimateVal);
      if (onTaskUpdated) onTaskUpdated(taskId, { time_estimate_minutes: estimateVal });
    } catch (err) {
      setError("Failed to save time estimate.");
    } finally {
      setSavingTime(false);
    }
  };

  const currentUserKey = (() => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return { id: decoded.id, role: decoded.role };
    } catch (err) {
      return null;
    }
  })();

  const isWatcher = watchers.some(
    (w) => w.id === currentUserKey?.id && w.role === currentUserKey?.role
  );

  const getAssigneeKey = (assignee) => `${assignee.role}_${assignee.id}`;

  const assigneeOptions = mentionOptions
    .filter((option) => option.type === "staff" || option.type === "superadmin")
    .map((option) => ({
      id: option.id,
      role: option.type,
      name: option.label,
      email: option.searchStr?.split(" ").find((part) => part.includes("@")) || ""
    }));

  const handleTitleBlur = async () => {
    const nextTitle = taskTitle.trim();
    if (!nextTitle || nextTitle === task.title) {
      setTaskTitle(task.title || "");
      return;
    }
    try {
      await updateTask(taskId, { title: nextTitle });
      if (onTaskUpdated) onTaskUpdated(taskId, { title: nextTitle });
    } catch (err) {
      setError("Failed to update task name.");
      setTaskTitle(task.title || "");
    }
  };

  const handleAssigneeToggle = async (assignee) => {
    const assigneeKey = getAssigneeKey(assignee);
    const nextAssignees = taskAssignees.some((item) => getAssigneeKey(item) === assigneeKey)
      ? taskAssignees.filter((item) => getAssigneeKey(item) !== assigneeKey)
      : [...taskAssignees, assignee];

    setTaskAssignees(nextAssignees);
    try {
      await updateTask(taskId, { assignees: nextAssignees });
      if (onTaskUpdated) onTaskUpdated(taskId, { assignees: nextAssignees });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to update assignees.");
      setTaskAssignees(task.assignees || []);
    }
  };

  // Metadata update handlers
  const handleStatusChange = async (e) => {
    const val = e.target.value;
    if (val === "Done" && subtasks.some((subtask) => subtask.status !== "Done")) {
      setError("Complete all subtasks before marking this task complete.");
      return;
    }
    setStatus(val);
    try {
      await updateTask(taskId, { status: val });
      if (onTaskUpdated) onTaskUpdated(taskId, { status: val });
      refreshHistoryLogs();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status.");
    }
  };

  const handleMainTaskCompleteToggle = () => {
    handleStatusChange({
      target: {
        value: status === "Done" ? "Not Started" : "Done",
      },
    });
  };

  const handleSubtaskCompleteToggle = (subtask) => {
    handleSubtaskCellChange(
      subtask.id,
      "status",
      subtask.status === "Done" ? "Not Started" : "Done"
    );
  };

  const handlePriorityChange = async (e) => {
    const val = e.target.value;
    setPriority(val);
    try {
      await updateTask(taskId, { priority: val });
      if (onTaskUpdated) onTaskUpdated(taskId, { priority: val });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to update priority.");
    }
  };

  const handleStartDateChange = async (e) => {
    const val = e.target.value;
    setStartDate(val);
    try {
      await updateTask(taskId, { start_date: val || null });
      if (onTaskUpdated) onTaskUpdated(taskId, { start_date: val || null });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to update start date.");
    }
  };

  const handleDueDateChange = async (e) => {
    const val = e.target.value;
    setDueDate(val);
    try {
      await updateTask(taskId, { due_date: val || null });
      if (onTaskUpdated) onTaskUpdated(taskId, { due_date: val || null });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to update due date.");
    }
  };

  const saveCategory = async () => {
    try {
      await updateTask(taskId, { category: category.trim() || null });
      if (onTaskUpdated) onTaskUpdated(taskId, { category: category.trim() || null });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to save category.");
    }
  };

  const saveTags = async () => {
    try {
      await updateTask(taskId, { tags: tagsInput.trim() || null });
      if (onTaskUpdated) onTaskUpdated(taskId, { tags: tagsInput.trim() || null });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to save tags.");
    }
  };

  const saveDescription = async () => {
    try {
      await updateTask(taskId, { description_html: descriptionHtml.trim() || null });
      if (onTaskUpdated) onTaskUpdated(taskId, { description_html: descriptionHtml.trim() || null });
      setEditingDesc(false);
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to save description.");
    }
  };

  const handleDependencyChange = async (e) => {
    const val = e.target.value;
    setDependencyTaskId(val);
    try {
      await updateTask(taskId, { dependency_task_id: val ? Number(val) : null });
      if (onTaskUpdated) onTaskUpdated(taskId, { dependency_task_id: val ? Number(val) : null });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to update dependency task.");
    }
  };

  const handleRecurringSettingsChange = async (e) => {
    const val = e.target.value;
    setRecurringSettings(val);
    try {
      await updateTask(taskId, { recurring_settings: val || null });
      if (onTaskUpdated) onTaskUpdated(taskId, { recurring_settings: val || null });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to update recurring settings.");
    }
  };

  const handleSaveAsTemplate = async () => {
    setSavingTemplate(true);
    try {
      await createTaskTemplate({
        title: task.title,
        notes: descriptionHtml || "",
        priority: priority,
        category: category,
        tags: tagsInput
      });
      alert("Task saved as template successfully!");
    } catch (err) {
      setError("Failed to save task as template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  // Subtask addition
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      const payload = {
        title: newSubtaskTitle.trim(),
        parent_task_id: taskId,
        status: "Not Started",
        priority: newSubtaskMeta.priority || "Normal",
        due_date: newSubtaskMeta.due_date || null,
        assignees: newSubtaskMeta.assignees || []
      };
      const groupId = task.group_id;
      const created = await api.post(`/boards/groups/${groupId}/tasks`, payload);
      
      const createdSub = {
        id: created.data.id,
        title: created.data.title,
        status: created.data.status,
        priority: created.data.priority,
        due_date: created.data.due_date,
        assignees: created.data.assignees || []
      };

      setSubtasks((prev) => {
        const next = [...prev, createdSub];
        if (onTaskUpdated) onTaskUpdated(taskId, { subtasks: next });
        return next;
      });
      setNewSubtaskTitle("");
      setNewSubtaskMeta({ assignees: [], due_date: "", priority: "Normal" });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to create subtask.");
    }
  };

  const handleSubtaskCellChange = async (subtaskId, field, value) => {
    try {
      const payload = field === "assignees" ? { assignees: value || [] } : { [field]: value };
      const updated = await updateTask(subtaskId, payload);
      setSubtasks((prev) => {
        const next = prev.map((sub) => {
          if (sub.id === subtaskId) {
            return {
              ...sub,
              title: updated.title,
              status: updated.status,
              priority: updated.priority,
              due_date: updated.due_date,
              assignees: updated.assignees || []
            };
          }
          return sub;
        });
        if (onTaskUpdated) {
          onTaskUpdated(subtaskId, payload);
        }
        return next;
      });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to update subtask cell.");
    }
  };

  const handleSubtaskTitleBlur = async (subtaskId, oldTitle, nextTitle) => {
    const clean = nextTitle.trim();
    if (!clean || clean === oldTitle) return;
    try {
      await updateTask(subtaskId, { title: clean });
      setSubtasks(prev => {
        const next = prev.map(s => s.id === subtaskId ? { ...s, title: clean } : s);
        if (onTaskUpdated) onTaskUpdated(subtaskId, { title: clean });
        return next;
      });
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to update subtask title.");
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, title: oldTitle } : s));
    }
  };

  // Checklist handlers
  const handleAddChecklistItem = async () => {
    if (!newChecklistItemTitle.trim()) return;
    try {
      const newItem = await addTaskChecklistItem(taskId, newChecklistItemTitle.trim());
      setChecklist((prev) => {
        const next = [...prev, newItem];
        if (onTaskUpdated) onTaskUpdated(taskId, { checklist: next });
        return next;
      });
      setNewChecklistItemTitle("");
    } catch (err) {
      setError("Failed to add checklist item.");
    }
  };

  const handleToggleChecklist = async (itemId, currentVal) => {
    try {
      const updated = await updateChecklistItem(itemId, { is_checked: !currentVal });
      setChecklist((prev) => {
        const next = prev.map((item) => (item.id === itemId ? updated : item));
        if (onTaskUpdated) onTaskUpdated(taskId, { checklist: next });
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    try {
      await deleteChecklistItem(itemId);
      setChecklist((prev) => {
        const next = prev.filter((item) => item.id !== itemId);
        if (onTaskUpdated) onTaskUpdated(taskId, { checklist: next });
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Watcher handlers
  const handleJoinAsWatcher = async () => {
    if (!currentUserKey) return;
    try {
      if (isWatcher) {
        await removeTaskWatcher(taskId, currentUserKey.id, currentUserKey.role);
        setWatchers((prev) => {
          const next = prev.filter((w) => !(w.id === currentUserKey.id && w.role === currentUserKey.role));
          if (onTaskUpdated) onTaskUpdated(taskId, { watchers: next });
          return next;
        });
      } else {
        const added = await addTaskWatcher(taskId, currentUserKey.id, currentUserKey.role);
        setWatchers((prev) => {
          const next = [...prev, added];
          if (onTaskUpdated) onTaskUpdated(taskId, { watchers: next });
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Attachment upload/delete
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingAttachment(true);
      const added = await uploadTaskAttachment(taskId, file);
      setAttachments((prev) => {
        const next = [...prev, added];
        if (onTaskUpdated) onTaskUpdated(taskId, { attachments: next });
        return next;
      });
    } catch (err) {
      setError("Failed to upload attachment file.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await deleteTaskAttachment(attachmentId);
      setAttachments((prev) => {
        const next = prev.filter((att) => att.id !== attachmentId);
        if (onTaskUpdated) onTaskUpdated(taskId, { attachments: next });
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Autocomplete triggers
  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setContent(value);

    // Parse for @ trigger
    const cursor = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1 && lastAtIdx >= textBeforeCursor.lastIndexOf(" ")) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      setAutocompleteQuery(query);
      
      const filtered = mentionOptions.filter((opt) =>
        opt.searchStr.includes(query.toLowerCase())
      );
      
      setAutocompleteSuggestions(filtered);
      setAutocompleteIndex(0);
      setShowAutocomplete(filtered.length > 0);
      
      setAutocompletePosition({
        top: 60,
        left: Math.min(30 + query.length * 6, 200)
      });
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIdx !== -1) {
      const textAfterCursor = content.slice(cursor);
      const mentionText = `@${suggestion.label} `;
      
      const newContent = content.slice(0, lastAtIdx) + mentionText + textAfterCursor;
      setContent(newContent);
      
      setTrackedMentions((prev) => [
        ...prev.filter((m) => m.id !== suggestion.id || m.type !== suggestion.type),
        { type: suggestion.type, id: suggestion.id, label: suggestion.label }
      ]);
      
      setShowAutocomplete(false);
      
      setTimeout(() => {
        textareaRef.current.focus();
        const newCursorPos = lastAtIdx + mentionText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    }
  };

  const handleKeyDown = (e) => {
    if (showAutocomplete && autocompleteSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAutocompleteIndex((prev) => (prev + 1) % autocompleteSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setAutocompleteIndex(
          (prev) => (prev - 1 + autocompleteSuggestions.length) % autocompleteSuggestions.length
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSuggestionSelect(autocompleteSuggestions[autocompleteIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowAutocomplete(false);
      }
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!content.trim() || posting) return;

    try {
      setPosting(true);
      setError("");
      
      const activeMentions = trackedMentions.filter((m) =>
        content.includes(`@${m.label}`)
      );
      
      const response = await createTaskUpdate(taskId, {
        content: content.trim(),
        mentions: activeMentions.map((m) => ({ type: m.type, id: m.id }))
      });
      
      setUpdates((prev) => [response, ...prev]);
      setContent("");
      setTrackedMentions([]);
    } catch (err) {
      setError("Failed to post task update discussion.");
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (updateId) => {
    try {
      const response = await toggleLike(updateId);
      setUpdates((prev) =>
        prev.map((up) => {
          if (up.id === updateId) {
            const token = localStorage.getItem("authToken");
            let userKey = "";
            if (token) {
              const decoded = JSON.parse(atob(token.split(".")[1]));
              userKey = `${decoded.role}_${decoded.id}`;
            }
            
            let likedBy = up.liked_by_ids || [];
            if (response.liked) {
              likedBy = [...likedBy, userKey];
            } else {
              likedBy = likedBy.filter((k) => k !== userKey);
            }
            
            return {
              ...up,
              likes_count: response.likes_count,
              liked_by_ids: likedBy
            };
          }
          return up;
        })
      );
    } catch (err) {
      console.error("Failed to toggle update like status.", err);
    }
  };

  const handleAddReply = async (updateId) => {
    const text = replyInputs[updateId];
    if (!text || !text.trim() || postingReplies[updateId]) return;

    try {
      setPostingReplies((prev) => ({ ...prev, [updateId]: true }));
      const replyData = await createReply(updateId, { content: text.trim() });
      
      setUpdates((prev) =>
        prev.map((up) => {
          if (up.id === updateId) {
            return { ...up, replies: [...up.replies, replyData] };
          }
          return up;
        })
      );
      
      setReplyInputs((prev) => ({ ...prev, [updateId]: "" }));
    } catch (err) {
      console.error("Failed to post reply.", err);
    } finally {
      setPostingReplies((prev) => ({ ...prev, [updateId]: false }));
    }
  };

  const renderParsedContent = (text) => {
    if (!text) return "";
    const parts = text.split(/(@[a-zA-Z0-9\s]+ Department|@[a-zA-Z0-9\s]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("@")) {
        return (
          <a key={idx} href="#" className="mention-link" onClick={(e) => e.preventDefault()}>
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getAvatarInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const checkUserLiked = (likedByIds) => {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const userKey = `${decoded.role}_${decoded.id}`;
      return (likedByIds || []).includes(userKey);
    } catch (err) {
      return false;
    }
  };

  const getPriorityColor = (prio) => {
    switch (prio) {
      case "Urgent": return "#ff3b30";
      case "High": return "#ff9500";
      case "Normal": return "#007aff";
      case "Low": return "#8e8e93";
      default: return "#cbd5e1";
    }
  };

  const combinedFeed = useMemo(() => {
    const feed = [];
    updates.forEach(u => {
      feed.push({
        ...u,
        feedType: "update",
        timestamp: new Date(u.created_at)
      });
    });
    historyLogs.forEach(h => {
      feed.push({
        ...h,
        feedType: "history",
        timestamp: new Date(h.created_at)
      });
    });
    return feed.sort((a, b) => a.timestamp - b.timestamp);
  }, [updates, historyLogs]);


  return (
    <>
      <div className="updates-drawer-overlay" onClick={onClose}></div>
      <div className="updates-drawer">
        <div className="drawer-header">
          <div className="drawer-header-left">
            {/* Breadcrumbs */}
            {(() => {
              const parentTask = allTasks.find(t => t.id === task.parent_task_id);
              return (
                <div className="cu-breadcrumbs">
                  <span className="cu-breadcrumb-item">{boardName || "Board"}</span>
                  <span className="cu-breadcrumb-separator">/</span>
                  <span className="cu-breadcrumb-item">{groupName || "List"}</span>
                  {parentTask && (
                    <>
                      <span className="cu-breadcrumb-separator">/</span>
                      <span className="cu-breadcrumb-item text-muted">Subtask of: {parentTask.title}</span>
                    </>
                  )}
                </div>
              );
            })()}

            <input
              className="drawer-title-input"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              placeholder="Task name"
            />
          </div>

          <div className="drawer-header-right">
            <button
              className={`drawer-watcher-btn ${isWatcher ? "active" : ""}`}
              onClick={handleJoinAsWatcher}
              title={isWatcher ? "You are watching this task. Click to stop." : "Watch this task"}
            >
              {isWatcher ? <Eye size={18} className="text-primary" /> : <EyeSlash size={18} />}
              {watchers.length > 0 && <span className="watcher-count-pill">{watchers.length}</span>}
            </button>
            <button className="drawer-close-btn" onClick={onClose} title="Close">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="drawer-body">
          {error && <Alert variant="danger" dismissible onClose={() => setError("")} className="m-3">{error}</Alert>}

          <div className="task-detail-split">
            {/* Left Panel: ClickUp-style task details */}
            <section className="task-detail-main">

              {/* ClickUp-style compact metadata rows */}
              <div className="cu-meta-grid">
                {/* Status row */}
                <div className="cu-meta-row">
                  <span className="cu-meta-label">
                    <span className="cu-meta-icon"><Circle size={14} /></span> Status
                  </span>
                  <div className="cu-meta-value">
                    <button
                      type="button"
                      className={`cu-complete-toggle ${status === "Done" ? "is-complete" : ""}`}
                      onClick={handleMainTaskCompleteToggle}
                      title={status === "Done" ? "Mark task as to do" : "Mark task complete"}
                    >
                      {status === "Done" && <Check size={12} />}
                    </button>
                    <Dropdown>
                      <Dropdown.Toggle as="div" className="cu-status-badge" style={{
                        backgroundColor: status === "Done" ? "#00ca72" : (status === "In Progress" ? "#fdab3d" : "#c4c4c4"),
                        color: "#fff"
                      }}>
                        {status === "Done" ? "COMPLETE" : (status === "In Progress" ? "IN PROGRESS" : "TO DO")}
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="board-dropdown-menu">
                        <Dropdown.Item onClick={() => handleStatusChange({ target: { value: "Not Started" } })}>
                          <span className="cu-status-dot" style={{ background: "#c4c4c4" }} /> To Do
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleStatusChange({ target: { value: "In Progress" } })}>
                          <span className="cu-status-dot" style={{ background: "#fdab3d" }} /> In Progress
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleStatusChange({ target: { value: "Done" } })}>
                          <span className="cu-status-dot" style={{ background: "#00ca72" }} /> Complete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                {/* Assignees row */}
                <div className="cu-meta-row">
                  <span className="cu-meta-label">
                    <span className="cu-meta-icon"><Users size={14} /></span> Assignees
                  </span>
                  <div className="cu-meta-value">
                    <div className="cu-assignee-row">
                      {taskAssignees.map((assignee) => (
                        <button
                          type="button"
                          key={getAssigneeKey(assignee)}
                          className="cu-assignee-pill active"
                          onClick={() => handleAssigneeToggle(assignee)}
                          title={`Remove ${assignee.name}`}
                        >
                          <span className="assignee-avatar clickup-avatar-sm">{getAvatarInitials(assignee.name)}</span>
                          <span>{assignee.name}</span>
                        </button>
                      ))}
                      <Dropdown>
                        <Dropdown.Toggle as="div" className="cu-add-assignee-btn" title="Add assignee">+</Dropdown.Toggle>
                        <Dropdown.Menu className="board-dropdown-menu" style={{ maxHeight: "250px", overflowY: "auto" }}>
                          {assigneeOptions.map((p) => {
                            const isSelected = taskAssignees.some((item) => getAssigneeKey(item) === getAssigneeKey(p));
                            return (
                              <Dropdown.Item
                                key={`assign_${p.role}_${p.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAssigneeToggle(p);
                                }}
                                className="d-flex align-items-center gap-2"
                              >
                                <input type="checkbox" checked={isSelected} readOnly />
                                <span className="assignee-avatar clickup-avatar-sm">{getAvatarInitials(p.name)}</span>
                                <span>{p.name}</span>
                              </Dropdown.Item>
                            );
                          })}
                        </Dropdown.Menu>
                      </Dropdown>
                      {taskAssignees.length === 0 && <span className="text-muted small">Empty</span>}
                    </div>
                  </div>
                </div>

                {/* Priority row */}
                <div className="cu-meta-row">
                  <span className="cu-meta-label">
                    <span className="cu-meta-icon"><Flag size={14} /></span> Priority
                  </span>
                  <div className="cu-meta-value">
                    <Dropdown>
                      <Dropdown.Toggle as="div" className="cu-priority-badge" style={{ color: getPriorityColor(priority) }}>
                        <Flag size={13} fill="currentColor" className="cu-priority-flag" />
                        {priority}
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="board-dropdown-menu">
                        {["Urgent", "High", "Normal", "Low"].map((prio) => (
                          <Dropdown.Item key={prio} onClick={() => handlePriorityChange({ target: { value: prio } })}>
                            <Flag size={13} fill="currentColor" style={{ color: getPriorityColor(prio), marginRight: "8px" }} /> {prio}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                {/* Dates row */}
                <div className="cu-meta-row">
                  <span className="cu-meta-label">
                    <span className="cu-meta-icon"><CalendarDays size={14} /></span> Dates
                  </span>
                  <div className="cu-meta-value">
                    <div className="cu-dates-inline">
                      <div className="cu-date-field">
                        <span className="cu-date-label">Start</span>
                        <input
                          type="date"
                          value={startDate ? startDate.split("T")[0] : ""}
                          onChange={handleStartDateChange}
                          className="cu-date-input"
                        />
                      </div>
                      <span className="cu-date-arrow">to</span>
                      <div className="cu-date-field">
                        <span className="cu-date-label">Due</span>
                        <input
                          type="date"
                          value={dueDate ? dueDate.split("T")[0] : ""}
                          onChange={handleDueDateChange}
                          className="cu-date-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Track time row */}
                <div className="cu-meta-row">
                  <span className="cu-meta-label">
                    <span className="cu-meta-icon"><Timer size={14} /></span> Track time
                  </span>
                  <div className="cu-meta-value">
                    <div className="cu-time-inline">
                      <span className={`cu-timer-dot ${timerActive ? "timer-pulsing" : ""}`} />
                      <span className="cu-timer-display">
                        {timerActive ? formatTimer(timerSeconds) : "00:00:00"}
                      </span>
                      {!timerActive ? (
                        <button className="cu-time-btn cu-time-start" onClick={handleStartTimer}><Play size={11} fill="currentColor" /> Start</button>
                      ) : (
                        <button className="cu-time-btn cu-time-stop" onClick={handleStopTimer}><StopCircle size={11} /> Stop</button>
                      )}
                      <button
                        className="cu-time-btn cu-time-log"
                        onClick={() => setShowManualLog(!showManualLog)}
                      >
                        {showManualLog ? "Cancel" : <><Pencil size={11} /> Log</>}
                      </button>
                      <span className="cu-time-spent">
                        {timeEstimate ? (
                          <>{Math.round((timeSpentSeconds / 3600) * 10) / 10}h / {Math.round((timeEstimate / 60) * 10) / 10}h est</>
                        ) : (
                          <>{Math.round((timeSpentSeconds / 3600) * 10) / 10}h spent</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* More section (collapsible) */}
                <div className="cu-meta-row">
                  <span className="cu-meta-label">
                    <span className="cu-meta-icon"><ChevronRight size={14} /></span> More
                  </span>
                  <div className="cu-meta-value cu-more-icons">
                    <button type="button" title="Category" className="cu-icon-btn" onClick={() => document.getElementById('cu-category-input')?.focus()}><Tag size={15} /></button>
                    <button type="button" title="Tags" className="cu-icon-btn" onClick={() => document.getElementById('cu-tags-input')?.focus()}><Tags size={15} /></button>
                    <button type="button" title="Dependency" className="cu-icon-btn" onClick={() => document.getElementById('cu-depends-select')?.focus()}><Link2 size={15} /></button>
                  </div>
                </div>
              </div>
              {/* Manual time log form (shown when toggled) */}
              {showManualLog && (
                <div className="cu-time-log-form">
                  <Form onSubmit={handleAddManualTime}>
                    <div className="row g-2 mb-2">
                      <div className="col-4">
                        <Form.Control type="number" placeholder="Hours" size="sm" value={manualHours} onChange={(e) => setManualHours(e.target.value)} />
                      </div>
                      <div className="col-4">
                        <Form.Control type="number" placeholder="Minutes" size="sm" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} />
                      </div>
                      <div className="col-4 d-flex align-items-center gap-1">
                        <Form.Control type="number" placeholder="Est (min)" size="sm" value={timeEstimate} onChange={handleEstimateChange} />
                        <Button variant="outline-primary" size="sm" onClick={handleSaveEstimate} disabled={savingTime} style={{ fontSize: "10px", whiteSpace: "nowrap" }}>Est</Button>
                      </div>
                    </div>
                    <Form.Control type="text" placeholder="What did you work on?" size="sm" className="mb-2" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} />
                    <div className="text-end">
                      <Button type="submit" variant="primary" size="sm" disabled={savingTime}>
                        {savingTime ? "Saving..." : "Log Time"}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

              {/* Time entries list */}
              {timeEntries.length > 0 && (
                <div className="cu-section-block">
                  <span className="cu-section-label">Logged Entries</span>
                  <div style={{ maxHeight: "100px", overflowY: "auto" }}>
                    {timeEntries.map((entry) => (
                      <div key={entry.id} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                        <div>
                          <span className="small d-block fw-semibold">{entry.description || "Time log"}</span>
                          <span className="text-muted" style={{ fontSize: "10px" }}>
                            By {entry.user_name} - {Math.round((entry.duration_seconds / 60) * 10) / 10} mins
                          </span>
                        </div>
                        <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteTime(entry.id, entry.duration_seconds)} disabled={savingTime}><X size={12} /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time progress bar */}
              {timeEstimate > 0 && (
                <div className="cu-section-block">
                  <div className="progress" style={{ height: "4px" }}>
                    <div
                      className={`progress-bar ${timeSpentSeconds > timeEstimate * 60 ? "bg-danger" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, (timeSpentSeconds / (timeEstimate * 60)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Hidden advanced fields */}
              <div className="cu-advanced-fields">
                <div className="cu-adv-row">
                  <span className="cu-adv-label">Category</span>
                  <input
                    id="cu-category-input"
                    type="text"
                    placeholder="e.g. Admissions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    onBlur={saveCategory}
                    className="cu-adv-input"
                  />
                </div>
                <div className="cu-adv-row">
                  <span className="cu-adv-label">Tags</span>
                  <input
                    id="cu-tags-input"
                    type="text"
                    placeholder="urgent, operations"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onBlur={saveTags}
                    className="cu-adv-input"
                  />
                </div>
                <div className="cu-adv-row">
                  <span className="cu-adv-label">Depends On</span>
                  <Form.Select id="cu-depends-select" size="sm" value={dependencyTaskId} onChange={handleDependencyChange} className="cu-adv-select">
                    <option value="">None</option>
                    {allTasks.filter(t => t.id !== taskId).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="cu-adv-row">
                  <span className="cu-adv-label">Recurring</span>
                  <Form.Select size="sm" value={recurringSettings} onChange={handleRecurringSettingsChange} className="cu-adv-select">
                    <option value="">No Recurrence</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </Form.Select>
                </div>
                <div className="cu-adv-row cu-adv-actions">
                  <span className="text-muted small">Reuse configurations:</span>
                  <Button variant="outline-primary" size="sm" onClick={handleSaveAsTemplate} disabled={savingTemplate} className="cu-template-btn">
                    {savingTemplate ? <Spinner size="sm" animation="border" /> : <><Save size={12} className="me-1" /> Save as Template</>}
                  </Button>
                </div>
              </div>

              {/* Description (ClickUp style - inline editable) */}
              <div className="cu-description-area" onClick={() => { if (!editingDesc) setEditingDesc(true); }}>
                {editingDesc ? (
                  <div>
                    <div className="cu-desc-toolbar">
                      <Button variant="outline-secondary" size="sm" onClick={() => setDescriptionHtml(prev => prev + "<b>Bold Text</b>")} title="Bold"><strong>B</strong></Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => setDescriptionHtml(prev => prev + "<i>Italic Text</i>")} title="Italic"><em>I</em></Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => setDescriptionHtml(prev => prev + "<ul><li>Item</li></ul>")} title="List"><List size={12} /> List</Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => setDescriptionHtml(prev => prev + "<h3>Header</h3>")} title="Header">H3</Button>
                    </div>
                    <textarea
                      className="cu-desc-textarea"
                      rows={4}
                      placeholder="Add description, or write with AI"
                      value={descriptionHtml}
                      onChange={(e) => setDescriptionHtml(e.target.value)}
                      autoFocus
                    />
                    <div className="cu-desc-actions">
                      <Button variant="link" size="sm" className="text-muted" onClick={(e) => { e.stopPropagation(); setEditingDesc(false); }}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); saveDescription(); }}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="cu-desc-display">
                    {descriptionHtml ? (
                      <div
                        className="small"
                        style={{ whiteSpace: "pre-wrap" }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(descriptionHtml)
                        }}
                      />
                    ) : (
                      <span className="cu-desc-placeholder"><Sparkles size={13} /> Add description, or write with AI</span>
                    )}
                  </div>
                )}
              </div>

              {/* Subtasks section (ClickUp style) */}
              <div className="cu-collapsible-section">
                <div className="cu-section-header">
                  <span className="cu-section-icon"><ChevronDown size={14} /></span>
                  <span className="cu-section-title">Subtasks</span>
                  <span className="cu-section-count">{subtasks.filter(s => s.status !== "Done").length} open</span>
                  {subtasks.length > 0 && (
                    <span className="cu-progress-mini" style={{
                      background: `linear-gradient(90deg, #00ca72 ${(subtasks.filter(s => s.status === "Done").length / subtasks.length) * 100}%, #e2e8f0 0%)`
                    }} />
                  )}
                </div>

                {subtasks.length > 0 && (
                  <div className="cu-subtask-list">
                    {subtasks.map((sub) => (
                      <div key={sub.id} className="cu-subtask-row">
                        <Dropdown>
                          <Dropdown.Toggle
                            as="button"
                            type="button"
                            className={`cu-subtask-status-dot ${sub.status === "Done" ? "is-complete" : ""}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSubtaskCompleteToggle(sub);
                            }}
                            title={sub.status === "Done" ? "Mark subtask as to do" : "Mark subtask complete"}
                            style={{
                              borderColor: sub.status === "Done" ? "#00ca72" : (sub.status === "In Progress" ? "#fdab3d" : "#c4c4c4")
                            }}
                          >
                            {sub.status === "Done" && <Check size={10} />}
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="board-dropdown-menu">
                            {["Not Started", "In Progress", "Done"].map((st) => (
                              <Dropdown.Item key={st} onClick={() => handleSubtaskCellChange(sub.id, "status", st)}>
                                <span className="cu-status-dot" style={{ background: st === "Done" ? "#00ca72" : (st === "In Progress" ? "#fdab3d" : "#c4c4c4") }} />
                                {st === "Done" ? "Complete" : (st === "In Progress" ? "In Progress" : "To Do")}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>

                        <input
                          type="text"
                          className="cu-subtask-title"
                          value={sub.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSubtasks(prev => prev.map(item => item.id === sub.id ? { ...item, title: val } : item));
                          }}
                          onBlur={(e) => handleSubtaskTitleBlur(sub.id, sub.title, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                        />

                        <div className="cu-subtask-meta">
                          <Dropdown>
                            <Dropdown.Toggle as="div" className="cu-subtask-assignee-cell">
                              {sub.assignees && sub.assignees.length > 0 ? (
                                <div className="d-flex" style={{ gap: "2px" }}>
                                  {sub.assignees.slice(0, 2).map((a) => (
                                    <div key={getAssigneeKey(a)} className="assignee-avatar clickup-avatar-sm" title={a.name}>
                                      {getAvatarInitials(a.name)}
                                    </div>
                                  ))}
                                  {sub.assignees.length > 2 && (
                                    <span className="cu-more-count">+{sub.assignees.length - 2}</span>
                                  )}
                                </div>
                              ) : (
                                <div className="cu-unassigned-circle">+</div>
                              )}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="board-dropdown-menu">
                              <Dropdown.Item onClick={() => handleSubtaskCellChange(sub.id, "assignees", [])}>
                                <span className="text-muted">Unassigned</span>
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              {assigneeOptions.map((p) => {
                                const isSelected = sub.assignees && sub.assignees.some((a) => getAssigneeKey(a) === getAssigneeKey(p));
                                return (
                                  <Dropdown.Item
                                    key={`st_${p.role}_${p.id}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const nextList = isSelected
                                        ? sub.assignees.filter((a) => getAssigneeKey(a) !== getAssigneeKey(p))
                                        : [...(sub.assignees || []), p];
                                      handleSubtaskCellChange(sub.id, "assignees", nextList);
                                    }}
                                    className="d-flex align-items-center gap-2"
                                  >
                                    <input type="checkbox" checked={isSelected} readOnly />
                                    <span>{p.name}</span>
                                  </Dropdown.Item>
                                );
                              })}
                            </Dropdown.Menu>
                          </Dropdown>

                          <div className="cu-subtask-date-cell">
                            <input
                              type="date"
                              value={sub.due_date ? sub.due_date.split("T")[0] : ""}
                              onChange={(e) => handleSubtaskCellChange(sub.id, "due_date", e.target.value)}
                              className="cu-hidden-date-picker"
                            />
                            <span className="cu-date-display">
                              {sub.due_date ? new Date(sub.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "-"}
                            </span>
                          </div>

                          <Dropdown>
                            <Dropdown.Toggle as="div" className="cu-subtask-priority-cell">
                              <Flag size={13} fill="currentColor" style={{ color: getPriorityColor(sub.priority) }} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="board-dropdown-menu">
                              {["Urgent", "High", "Normal", "Low"].map((prio) => (
                                <Dropdown.Item key={prio} onClick={() => handleSubtaskCellChange(sub.id, "priority", prio)}>
                                  <Flag size={13} fill="currentColor" style={{ color: getPriorityColor(prio), marginRight: "6px" }} /> {prio}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="cu-add-subtask-row">
                  <span className="cu-add-icon">+</span>
                  <input
                    type="text"
                    placeholder="Add task"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddSubtask(); }}
                    className="cu-add-subtask-input"
                  />
                  {newSubtaskTitle.trim() && (
                    <div className="cu-add-subtask-meta">
                      <Dropdown>
                        <Dropdown.Toggle as="div" className="cu-mini-meta-btn">
                          {newSubtaskMeta.assignees.length > 0 ? <>{newSubtaskMeta.assignees.length}<Users size={12} /></> : <Users size={12} />}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="board-dropdown-menu">
                          {assigneeOptions.map((p) => {
                            const isSelected = newSubtaskMeta.assignees.some((a) => getAssigneeKey(a) === getAssigneeKey(p));
                            return (
                              <Dropdown.Item
                                key={`nst_${p.role}_${p.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  const nextList = isSelected
                                    ? newSubtaskMeta.assignees.filter((a) => getAssigneeKey(a) !== getAssigneeKey(p))
                                    : [...newSubtaskMeta.assignees, p];
                                  setNewSubtaskMeta(prev => ({ ...prev, assignees: nextList }));
                                }}
                                className="d-flex align-items-center gap-2"
                              >
                                <input type="checkbox" checked={isSelected} readOnly />
                                <span>{p.name}</span>
                              </Dropdown.Item>
                            );
                          })}
                        </Dropdown.Menu>
                      </Dropdown>
                      <div className="position-relative">
                        <input
                          type="date"
                          value={newSubtaskMeta.due_date || ""}
                          onChange={(e) => setNewSubtaskMeta(prev => ({ ...prev, due_date: e.target.value }))}
                          className="cu-hidden-date-picker"
                        />
                        <span className="cu-mini-meta-btn"><CalendarDays size={12} /></span>
                      </div>
                      <Dropdown>
                        <Dropdown.Toggle as="div" className="cu-mini-meta-btn">
                          <Flag size={12} fill="currentColor" style={{ color: getPriorityColor(newSubtaskMeta.priority) }} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="board-dropdown-menu">
                          {["Urgent", "High", "Normal", "Low"].map((prio) => (
                            <Dropdown.Item key={prio} onClick={() => setNewSubtaskMeta(prev => ({ ...prev, priority: prio }))}>
                              <Flag size={13} fill="currentColor" style={{ color: getPriorityColor(prio), marginRight: "6px" }} /> {prio}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  )}
                </div>
              </div>

              {/* Relate items / Dependencies action */}
              <div className="cu-action-link" onClick={() => document.getElementById('cu-depends-select')?.focus()}>
                <span className="cu-action-icon"><Link2 size={14} /></span> Relate items or add dependencies
              </div>

              {/* Checklist section */}
              <div className="cu-collapsible-section">
                <div className="cu-section-header" style={{ cursor: "pointer" }}>
                  <span className="cu-section-icon"><CheckSquare size={14} /></span>
                  <span className="cu-section-title">Checklist</span>
                  {checklist.length > 0 && (
                    <span className="cu-section-count">{checklist.filter(item => item.is_checked).length}/{checklist.length}</span>
                  )}
                </div>

                {checklist.length > 0 && (
                  <>
                    <div className="progress mb-2" style={{ height: "3px" }}>
                      <div className="progress-bar bg-success" style={{ width: `${(checklist.filter(item => item.is_checked).length / checklist.length) * 100}%` }} />
                    </div>
                    <div className="cu-checklist-items">
                      {checklist.map((item) => (
                        <div key={item.id} className="cu-checklist-row">
                          <Form.Check
                            type="checkbox"
                            checked={item.is_checked}
                            onChange={() => handleToggleChecklist(item.id, item.is_checked)}
                            label={
                              <span className={item.is_checked ? "text-decoration-line-through text-muted" : ""} style={{ fontSize: "13px" }}>
                                {item.title}
                              </span>
                            }
                          />
                          <Button variant="link" size="sm" className="p-0 text-danger cu-delete-icon" onClick={() => handleDeleteChecklistItem(item.id)}>
                            <Trash size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="cu-add-item-row">
                  <input
                    type="text"
                    placeholder="+ Add checklist item..."
                    value={newChecklistItemTitle}
                    onChange={(e) => setNewChecklistItemTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddChecklistItem(); }}
                    className="cu-add-item-input"
                  />
                </div>
              </div>

              {/* Attach file action */}
              <div className="cu-collapsible-section">
                <div className="cu-section-header">
                  <span className="cu-section-icon"><Paperclip size={14} /></span>
                  <span className="cu-section-title">Attachments</span>
                  {attachments.length > 0 && <span className="cu-section-count">{attachments.length}</span>}
                  <button
                    className="cu-attach-btn"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploadingAttachment}
                  >
                    {uploadingAttachment ? <Spinner size="sm" animation="border" /> : "+ Add"}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
                </div>

                {attachments.length > 0 && (
                  <div className="cu-attachment-list">
                    {attachments.map((att) => (
                      <div key={att.id} className="cu-attachment-row">
                        <Paperclip className="text-muted" size={12} />
                        <div className="flex-grow-1">
                          <a href={`${api.defaults.baseURL.replace("/api", "")}${att.file_path}`} target="_blank" rel="noopener noreferrer" className="cu-attachment-name">
                            {att.filename}
                          </a>
                          <div className="cu-attachment-meta">By {att.uploaded_by_name}</div>
                        </div>
                        <Button variant="link" size="sm" className="p-0 text-danger cu-delete-icon" onClick={() => handleDeleteAttachment(att.id)}>
                          <Trash size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Watchers */}
              <div className="cu-collapsible-section">
                <div className="cu-section-header">
                  <span className="cu-section-icon">{isWatcher ? <EyeSlash size={14} /> : <Eye size={14} />}</span>
                  <span className="cu-section-title">Watchers</span>
                  {watchers.length > 0 && <span className="cu-section-count">{watchers.length}</span>}
                  <button className="cu-attach-btn" onClick={handleJoinAsWatcher}>
                    {isWatcher ? "Unwatch" : "+ Watch"}
                  </button>
                </div>
                {watchers.length > 0 && (
                  <div className="cu-watcher-list">
                    {watchers.map((w) => (
                      <span key={`${w.role}_${w.id}`} className="cu-watcher-chip">
                        <span className="assignee-avatar clickup-avatar-sm">{getAvatarInitials(w.name)}</span>
                        {w.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </section>

            {/* Right Panel: Unified Chronological Activity Log & Update Messaging (ClickUp style) */}
            <aside className="task-detail-activity-unified">
              <div className="activity-feed-header">
                <span>Activity</span>
              </div>

              <div className="activity-feed-scroll">
                {combinedFeed.map((item) => {
                  if (item.feedType === "history") {
                    return (
                      <div key={`history_${item.id}`} className="activity-feed-history-item">
                        <div className="activity-history-dot" />
                        <div className="flex-grow-1">
                          <strong>{item.actor_name}</strong> {item.action}
                        </div>
                        <span className="text-muted" style={{ fontSize: "10px" }}>
                          {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  } else {
                    const liked = checkUserLiked(item.liked_by_ids);
                    return (
                      <div key={`update_${item.id}`} className="update-feed-item m-0 bg-white border p-3 rounded-3 shadow-sm">
                        <div className="update-item-header">
                          <div className="update-author-info">
                            <div className="assignee-avatar">
                              {getAvatarInitials(item.sender_name)}
                            </div>
                            <div>
                              <div className="update-author-name">{item.sender_name}</div>
                              <div className="update-author-role">
                                {item.sender_role === "superadmin" ? "Superadmin" : "Staff"}
                              </div>
                            </div>
                          </div>
                          <div className="update-timestamp">
                            {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div
                          className="update-content"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.message) }}
                        />

                        {item.mentioned_names && item.mentioned_names.length > 0 && (
                          <div className="mentioned-tags mb-2 mt-1">
                            {item.mentioned_names.map((mn, idx) => (
                              <span key={idx} className="mentioned-tag">
                                @{mn}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="update-actions">
                          <button
                            className={`update-like-btn ${liked ? "liked" : ""}`}
                            onClick={() => handleToggleLike(item.id)}
                          >
                            {liked ? <HandThumbsUpFill size={14} /> : <HandThumbsUp size={14} />}
                            {item.likes_count > 0 && <span>{item.likes_count}</span>}
                          </button>
                          <button className="update-reply-toggle" onClick={() => setReplyInputs(prev => ({ ...prev, [item.id]: prev[item.id] !== undefined ? undefined : "" }))}>
                            <Reply size={14} /> Reply
                          </button>
                        </div>

                        {item.replies && item.replies.length > 0 && (
                          <div className="update-replies-list mt-2">
                            {item.replies.map((reply) => (
                              <div key={reply.id} className="update-reply-item">
                                <div className="reply-author">
                                  <span className="assignee-avatar clickup-avatar-sm">{getAvatarInitials(reply.sender_name)}</span>
                                  <strong>{reply.sender_name}</strong>
                                </div>
                                <div className="reply-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.message) }} />
                                <span className="reply-timestamp">
                                  {new Date(reply.created_at).toLocaleDateString()} at {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {replyInputs[item.id] !== undefined && (
                          <div className="mt-2">
                            <div className="input-group input-group-sm">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Write a reply..."
                                value={replyInputs[item.id] || ""}
                                onChange={(e) => setReplyInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter") handleAddReply(item.id); }}
                              />
                              <Button
                                variant="primary"
                                onClick={() => handleAddReply(item.id)}
                                disabled={postingReplies[item.id] || !(replyInputs[item.id] || "").trim()}
                              >
                                {postingReplies[item.id] ? <Spinner size="sm" animation="border" /> : <Send size={12} />}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                })}
                {combinedFeed.length === 0 && (
                  <div className="text-center py-5 text-muted">
                    <p className="mb-0">No updates or activity logs yet.</p>
                    <small>Start the discussion by posting what needs to be worked on!</small>
                  </div>
                )}
              </div>

              {/* Sticky bottom editor */}
              <div className="activity-feed-editor">
                <div className="cu-comment-editor">
                  <textarea
                    ref={textareaRef}
                    className="cu-comment-textarea"
                    placeholder="Write a comment..."
                    value={content}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    rows={2}
                  />

                  {showAutocomplete && autocompleteSuggestions.length > 0 && (
                    <div className="autocomplete-dropdown" style={{ position: "absolute", bottom: "100%", left: 0, right: 0, zIndex: 9999 }}>
                      {autocompleteSuggestions.map((s, idx) => (
                        <div
                          key={`${s.type}_${s.id}`}
                          className={`autocomplete-item p-2 cursor-pointer ${idx === autocompleteIndex ? "bg-light text-primary" : ""}`}
                          onClick={() => handleSuggestionSelect(s)}
                        >
                          <span className={`badge me-2 ${s.type === "department" ? "bg-info" : (s.type === "superadmin" ? "bg-warning" : "bg-secondary")}`}>
                            {s.type === "department" ? "Dept" : (s.type === "superadmin" ? "Admin" : "Staff")}
                          </span>
                          <strong>{s.label}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="cu-comment-footer">
                    <span className="cu-comment-hint">
                      Use <strong>@name</strong> or <strong>@department</strong>
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      className="cu-comment-send"
                      onClick={handlePostUpdate}
                      disabled={!content.trim() || posting}
                    >
                      {posting ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        <>
                          <Send size={12} />
                          Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};


export default UpdatesDrawer;


