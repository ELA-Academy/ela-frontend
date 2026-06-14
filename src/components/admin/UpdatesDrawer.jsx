import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Spinner, Alert } from "react-bootstrap";
import { HandThumbsUp, HandThumbsUpFill, Reply, Send, X, Trash, Paperclip, Eye, EyeSlash } from "react-bootstrap-icons";
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

const UpdatesDrawer = ({ taskId, task, onClose, allTasks = [] }) => {
  const [activeTab, setActiveTab] = useState("updates");
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  // Task inline metadata states
  const [status, setStatus] = useState(task.status || "Not Started");
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
    setDependencyTaskId(task.dependency_task_id || "");
    setRecurringSettings(task.recurring_settings || "");
    setTimeEstimate(task.time_estimate_minutes || "");
    setTimeSpentSeconds(task.time_spent_seconds || 0);
    setTimeEntries(task.time_entries || []);
  }, [task]);

  useEffect(() => {
    const loadUpdates = async () => {
      try {
        setLoading(true);
        const data = await getTaskUpdates(taskId);
        setUpdates(data);
      } catch (err) {
        console.error("Failed to load updates.", err);
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

    loadUpdates();
    loadMentionOptions();
  }, [taskId]);

  useEffect(() => {
    if (activeTab === "activity") {
      const loadHistory = async () => {
        try {
          setLoadingHistory(true);
          const data = await getTaskHistory(taskId);
          setHistoryLogs(data);
        } catch (err) {
          console.error("Failed to load history logs.", err);
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [activeTab, taskId]);

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

      setTimeEntries((prev) => [response, ...prev]);
      setTimeSpentSeconds((prev) => prev + duration_seconds);
      
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
      setTimeEntries((prev) => prev.filter((e) => e.id !== entryId));
      setTimeSpentSeconds((prev) => Math.max(0, prev - durationSecs));
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

  // Metadata update handlers
  const handleStatusChange = async (e) => {
    const val = e.target.value;
    setStatus(val);
    try {
      await updateTask(taskId, { status: val });
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  const handlePriorityChange = async (e) => {
    const val = e.target.value;
    setPriority(val);
    try {
      await updateTask(taskId, { priority: val });
    } catch (err) {
      setError("Failed to update priority.");
    }
  };

  const handleStartDateChange = async (e) => {
    const val = e.target.value;
    setStartDate(val);
    try {
      await updateTask(taskId, { start_date: val || null });
    } catch (err) {
      setError("Failed to update start date.");
    }
  };

  const handleDueDateChange = async (e) => {
    const val = e.target.value;
    setDueDate(val);
    try {
      await updateTask(taskId, { due_date: val || null });
    } catch (err) {
      setError("Failed to update due date.");
    }
  };

  const saveCategory = async () => {
    try {
      await updateTask(taskId, { category: category.trim() || null });
    } catch (err) {
      setError("Failed to save category.");
    }
  };

  const saveTags = async () => {
    try {
      await updateTask(taskId, { tags: tagsInput.trim() || null });
    } catch (err) {
      setError("Failed to save tags.");
    }
  };

  const saveDescription = async () => {
    try {
      await updateTask(taskId, { description_html: descriptionHtml.trim() || null });
      setEditingDesc(false);
    } catch (err) {
      setError("Failed to save description.");
    }
  };

  const handleDependencyChange = async (e) => {
    const val = e.target.value;
    setDependencyTaskId(val);
    try {
      await updateTask(taskId, { dependency_task_id: val ? Number(val) : null });
    } catch (err) {
      setError("Failed to update dependency task.");
    }
  };

  const handleRecurringSettingsChange = async (e) => {
    const val = e.target.value;
    setRecurringSettings(val);
    try {
      await updateTask(taskId, { recurring_settings: val || null });
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
        priority: "Normal"
      };
      const groupId = task.group_id;
      const created = await api.post(`/boards/groups/${groupId}/tasks`, payload);
      setSubtasks((prev) => [
        ...prev,
        {
          id: created.data.id,
          title: created.data.title,
          status: created.data.status,
          priority: created.data.priority,
          due_date: created.data.due_date
        }
      ]);
      setNewSubtaskTitle("");
    } catch (err) {
      setError("Failed to create subtask.");
    }
  };

  // Checklist handlers
  const handleAddChecklistItem = async () => {
    if (!newChecklistItemTitle.trim()) return;
    try {
      const newItem = await addTaskChecklistItem(taskId, newChecklistItemTitle.trim());
      setChecklist((prev) => [...prev, newItem]);
      setNewChecklistItemTitle("");
    } catch (err) {
      setError("Failed to add checklist item.");
    }
  };

  const handleToggleChecklist = async (itemId, currentVal) => {
    try {
      const updated = await updateChecklistItem(itemId, { is_checked: !currentVal });
      setChecklist((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    try {
      await deleteChecklistItem(itemId);
      setChecklist((prev) => prev.filter((item) => item.id !== itemId));
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
        setWatchers((prev) => prev.filter((w) => !(w.id === currentUserKey.id && w.role === currentUserKey.role)));
      } else {
        const added = await addTaskWatcher(taskId, currentUserKey.id, currentUserKey.role);
        setWatchers((prev) => [...prev, added]);
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
      setAttachments((prev) => [...prev, added]);
    } catch (err) {
      setError("Failed to upload attachment file.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await deleteTaskAttachment(attachmentId);
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
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
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const key = `${decoded.role}_${decoded.id}`;
    return likedByIds?.includes(key);
  };

  return (
    <>
      <div className="updates-drawer-overlay" onClick={onClose}></div>
      <div className="updates-drawer">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{task.title}</div>
            <span
              className="drawer-subtitle"
              style={{ backgroundColor: status === "Done" ? "#00ca72" : (status === "In Progress" ? "#ff9f1a" : "#8c9baf") }}
            >
              {status}
            </span>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={28} />
          </button>
        </div>

        <div className="drawer-tabs">
          <div className={`drawer-tab ${activeTab === "updates" ? "active" : ""}`} onClick={() => setActiveTab("updates")}>
            Updates ({updates.length})
          </div>
          <div className={`drawer-tab ${activeTab === "files" ? "active" : ""}`} onClick={() => setActiveTab("files")}>
            Files ({attachments.length})
          </div>
          <div className={`drawer-tab ${activeTab === "activity" ? "active" : ""}`} onClick={() => setActiveTab("activity")}>
            Activity Log
          </div>
        </div>

        <div className="drawer-body">
          {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

          {/* Collapsible details pane stacked above the feed tabs */}
          {activeTab === "updates" && (
            <>
              {/* Parent Task Context */}
              {(() => {
                const parentTask = allTasks.find(t => t.id === task.parent_task_id);
                if (!parentTask) return null;
                return (
                  <div className="mb-2 px-3 py-2 bg-light border-start border-success border-3 rounded-2 text-muted small">
                    🌿 Subtask of: <strong>{parentTask.title}</strong>
                  </div>
                );
              })()}

              {/* Task Metadata panel (Upwork/ClickUp style) */}
              <div className="task-meta-panel mb-4 p-3 bg-light rounded-3">
                <div className="row g-2">
                  <div className="col-6">
                    <label className="text-muted small d-block fw-semibold mb-1">Status</label>
                    <Form.Select size="sm" value={status} onChange={handleStatusChange}>
                      <option value="Not Started">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Complete</option>
                    </Form.Select>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small d-block fw-semibold mb-1">Priority</label>
                    <Form.Select size="sm" value={priority} onChange={handlePriorityChange}>
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Normal">Normal</option>
                      <option value="Low">Low</option>
                    </Form.Select>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small d-block fw-semibold mb-1">Start Date</label>
                    <input type="date" value={startDate} onChange={handleStartDateChange} className="form-control form-control-sm" />
                  </div>
                  <div className="col-6">
                    <label className="text-muted small d-block fw-semibold mb-1">Due Date</label>
                    <input type="date" value={dueDate} onChange={handleDueDateChange} className="form-control form-control-sm" />
                  </div>
                  <div className="col-6">
                    <label className="text-muted small d-block fw-semibold mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Admissions"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      onBlur={saveCategory}
                      className="form-control form-control-sm"
                    />
                  </div>
                  <div className="col-6">
                    <label className="text-muted small d-block fw-semibold mb-1">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="urgent, operations"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onBlur={saveTags}
                      className="form-control form-control-sm"
                    />
                  </div>
                  <div className="col-6">
                    <label className="text-muted small d-block fw-semibold mb-1">Depends On</label>
                    <Form.Select size="sm" value={dependencyTaskId} onChange={handleDependencyChange}>
                      <option value="">None</option>
                      {allTasks.filter(t => t.id !== taskId).map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small d-block fw-semibold mb-1">Recurring Settings</label>
                    <Form.Select size="sm" value={recurringSettings} onChange={handleRecurringSettingsChange}>
                      <option value="">No Recurrence</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </Form.Select>
                  </div>
                </div>

                <div className="mt-3 border-top pt-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Reuse configurations:</span>
                  <Button variant="outline-primary" size="sm" onClick={handleSaveAsTemplate} disabled={savingTemplate}>
                    {savingTemplate ? <Spinner size="sm" animation="border" /> : "💾 Save as Template"}
                  </Button>
                </div>
              </div>

              {/* Watchers Quick List */}
              <div className="mb-4 border rounded-3 p-3 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Watchers ({watchers.length})</span>
                  <Button variant="link" size="sm" className="p-0 text-decoration-none text-slate-800 fw-bold" onClick={handleJoinAsWatcher}>
                    {isWatcher ? "Unwatch" : "+ Watch Task"}
                  </Button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {watchers.map((w) => (
                    <span key={`${w.role}_${w.id}`} className="badge bg-secondary p-2">
                      {w.name}
                    </span>
                  ))}
                  {watchers.length === 0 && <span className="text-muted small">No watchers following this task.</span>}
                </div>
              </div>

              {/* Time Tracking Panel */}
              <div className="mb-4 border rounded-3 p-3 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Time Tracking</span>
                  <div className="text-muted small">
                    {timeEstimate ? (
                      <span>
                        {Math.round((timeSpentSeconds / 3600) * 10) / 10}h spent / {Math.round((timeEstimate / 60) * 10) / 10}h est
                      </span>
                    ) : (
                      <span>{Math.round((timeSpentSeconds / 3600) * 10) / 10}h spent</span>
                    )}
                  </div>
                </div>

                {/* Progress bar if there is an estimate */}
                {timeEstimate > 0 && (
                  <div className="progress mb-3" style={{ height: "6px" }}>
                    <div
                      className={`progress-bar ${timeSpentSeconds > timeEstimate * 60 ? "bg-danger" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, (timeSpentSeconds / (timeEstimate * 60)) * 100)}%` }}
                    />
                  </div>
                )}

                {/* Timer Controls */}
                <div className="d-flex align-items-center justify-content-between p-2 mb-3 bg-light rounded-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`timer-status-dot ${timerActive ? "timer-pulsing" : ""}`} />
                    <span className="font-monospace fw-semibold" style={{ fontSize: "14px" }}>
                      {timerActive ? formatTimer(timerSeconds) : "00:00:00"}
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    {!timerActive ? (
                      <Button variant="success" size="sm" onClick={handleStartTimer} className="py-1">
                        ▶ Start Timer
                      </Button>
                    ) : (
                      <Button variant="danger" size="sm" onClick={handleStopTimer} className="py-1">
                        ■ Stop Timer
                      </Button>
                    )}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setShowManualLog(!showManualLog)}
                      className="py-1"
                    >
                      {showManualLog ? "Cancel" : "✍ Log Time"}
                    </Button>
                  </div>
                </div>

                {/* Manual Log Form */}
                {showManualLog && (
                  <Form onSubmit={handleAddManualTime} className="p-2 border rounded-3 mb-3 bg-light">
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <Form.Control
                          type="number"
                          placeholder="Hours"
                          size="sm"
                          value={manualHours}
                          onChange={(e) => setManualHours(e.target.value)}
                        />
                      </div>
                      <div className="col-6">
                        <Form.Control
                          type="number"
                          placeholder="Minutes"
                          size="sm"
                          value={manualMinutes}
                          onChange={(e) => setManualMinutes(e.target.value)}
                        />
                      </div>
                    </div>
                    <Form.Control
                      type="text"
                      placeholder="What did you work on? (Description)"
                      size="sm"
                      className="mb-2"
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                    />
                    <div className="text-end">
                      <Button type="submit" variant="primary" size="sm" disabled={savingTime}>
                        {savingTime ? "Saving..." : "Log Time"}
                      </Button>
                    </div>
                  </Form>
                )}

                {/* Estimate Section */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="flex-grow-1">
                    <Form.Control
                      type="number"
                      placeholder="Estimate (minutes)"
                      size="sm"
                      value={timeEstimate}
                      onChange={handleEstimateChange}
                    />
                  </div>
                  <Button variant="outline-primary" size="sm" onClick={handleSaveEstimate} disabled={savingTime}>
                    Save Est
                  </Button>
                </div>

                {/* Logged Entries List */}
                {timeEntries.length > 0 && (
                  <div className="time-entries-stack mt-2 pt-2 border-top">
                    <span className="text-muted small d-block mb-1 fw-semibold">Logged Entries:</span>
                    <div style={{ maxHeight: "120px", overflowY: "auto" }}>
                      {timeEntries.map((entry) => (
                        <div key={entry.id} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                          <div>
                            <span className="small d-block text-slate-800 font-semibold">{entry.description || "Time log"}</span>
                            <span className="text-muted" style={{ fontSize: "10px" }}>
                              By {entry.user_name} • {Math.round((entry.duration_seconds / 60) * 10) / 10} mins
                            </span>
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger"
                            onClick={() => handleDeleteTime(entry.id, entry.duration_seconds)}
                            disabled={savingTime}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description Panel */}
              <div className="mb-4 border rounded-3 p-3 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Description</span>
                  <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setEditingDesc(!editingDesc)}>
                    {editingDesc ? "Cancel" : "Edit"}
                  </Button>
                </div>
                {editingDesc ? (
                  <div>
                    {/* Rich text editing formatting helper toolbar */}
                    <div className="btn-group btn-group-sm mb-2" role="group">
                      <Button variant="outline-secondary" onClick={() => setDescriptionHtml(prev => prev + "<b>Bold Text</b>")} title="Bold">
                        <strong>B</strong>
                      </Button>
                      <Button variant="outline-secondary" onClick={() => setDescriptionHtml(prev => prev + "<i>Italic Text</i>")} title="Italic">
                        <em>I</em>
                      </Button>
                      <Button variant="outline-secondary" onClick={() => setDescriptionHtml(prev => prev + "<ul><li>Item</li></ul>")} title="Bullet List">
                        • List
                      </Button>
                      <Button variant="outline-secondary" onClick={() => setDescriptionHtml(prev => prev + "<h3>Header</h3>")} title="Header">
                        H3
                      </Button>
                      <Button variant="outline-secondary" onClick={() => setDescriptionHtml(prev => prev + "<span style='color: #6d45f7;'>Colored text</span>")} title="Color font">
                        🎨 Color
                      </Button>
                    </div>

                    <textarea
                      className="form-control form-control-sm mb-2"
                      rows={4}
                      placeholder="Add descriptions or HTML formatting..."
                      value={descriptionHtml}
                      onChange={(e) => setDescriptionHtml(e.target.value)}
                    />
                    <div className="text-end">
                      <Button variant="primary" size="sm" onClick={saveDescription}>
                        Save Description
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="small text-slate-700"
                    style={{ whiteSpace: "pre-wrap" }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(descriptionHtml) || "<span class='text-muted'>No description details configured. Click Edit to append notes.</span>"
                    }}
                  />
                )}
              </div>

              {/* Subtasks Tree Panel */}
              <div className="mb-4 border rounded-3 p-3 bg-white">
                <span className="fw-semibold d-block mb-2">Subtasks ({subtasks.length})</span>
                <div className="subtasks-container mb-3">
                  {subtasks.map((sub) => (
                    <div key={sub.id} className="d-flex align-items-center justify-content-between py-1 border-bottom">
                      <span className="small text-slate-700">{sub.title}</span>
                      <span className="badge bg-light text-slate-600 border small">{sub.status}</span>
                    </div>
                  ))}
                  {subtasks.length === 0 && <span className="text-muted small d-block">No subtasks.</span>}
                </div>
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    placeholder="+ Quick add subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddSubtask(); }}
                    className="form-control"
                  />
                  <Button variant="primary" onClick={handleAddSubtask}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Checklists Panel */}
              <div className="mb-4 border rounded-3 p-3 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Checklist</span>
                  <span className="text-muted small">
                    {checklist.filter(item => item.is_checked).length} of {checklist.length} done
                  </span>
                </div>

                {checklist.length > 0 && (
                  <div className="progress mb-3" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${(checklist.filter(item => item.is_checked).length / checklist.length) * 100}%` }}
                    />
                  </div>
                )}

                <div className="checklist-items-stack mb-3">
                  {checklist.map((item) => (
                    <div key={item.id} className="d-flex align-items-center justify-content-between py-1">
                      <Form.Check
                        type="checkbox"
                        checked={item.is_checked}
                        onChange={() => handleToggleChecklist(item.id, item.is_checked)}
                        label={
                          <span className={item.is_checked ? "text-decoration-line-through text-muted small" : "small"}>
                            {item.title}
                          </span>
                        }
                      />
                      <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteChecklistItem(item.id)}>
                        <Trash size={14} />
                      </Button>
                    </div>
                  ))}
                  {checklist.length === 0 && <span className="text-muted small d-block">No checklist items.</span>}
                </div>
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    placeholder="+ Add checklist item..."
                    value={newChecklistItemTitle}
                    onChange={(e) => setNewChecklistItemTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddChecklistItem(); }}
                    className="form-control"
                  />
                  <Button variant="primary" onClick={handleAddChecklistItem}>
                    Add
                  </Button>
                </div>
              </div>

              {/* updates discussion compiler */}
              <div className="update-editor-container">
                <textarea
                  ref={textareaRef}
                  className="update-editor-textarea"
                  placeholder="Write an update and mention others with @..."
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                />
                
                {showAutocomplete && (
                  <div
                    className="mentions-autocomplete"
                    style={{ top: `${autocompletePosition.top}px`, left: `${autocompletePosition.left}px` }}
                  >
                    {autocompleteSuggestions.map((s, idx) => (
                      <div
                        key={`${s.type}_${s.id}`}
                        className={`autocomplete-item ${idx === autocompleteIndex ? "active" : ""}`}
                        onClick={() => handleSuggestionSelect(s)}
                      >
                        <span className={s.type === "department" ? "mention-dept-badge" : "mention-staff-badge"}>
                          {s.type === "department" ? "Dept" : (s.type === "superadmin" ? "Admin" : "Staff")}
                        </span>
                        <strong>{s.label}</strong>
                      </div>
                    ))}
                  </div>
                )}

                <div className="update-editor-footer">
                  <span className="editor-helper-text">
                    Use <strong>@name</strong> or <strong>@department</strong>
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    className="d-flex align-items-center gap-2"
                    onClick={handlePostUpdate}
                    disabled={!content.trim() || posting}
                  >
                    {posting ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <>
                        <Send size={14} />
                        Update
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Updates Feed */}
              {loading ? (
                <ListSkeleton count={3} />
              ) : updates.length > 0 ? (
                updates.map((u) => {
                  const liked = checkUserLiked(u.liked_by_ids);
                  return (
                    <div key={u.id} className="update-feed-item">
                      <div className="update-item-header">
                        <div className="update-author-info">
                          <div className="assignee-avatar">
                            {getAvatarInitials(u.sender_name)}
                          </div>
                          <div>
                            <div className="update-author-name">{u.sender_name}</div>
                            <div className="update-author-role">
                              {u.sender_role === "superadmin" ? "Superadmin" : "Staff Member"}
                            </div>
                          </div>
                        </div>
                        <span className="update-timestamp">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="update-content">{renderParsedContent(u.content)}</div>

                      <div className="update-actions-footer">
                        <button className={`action-btn ${liked ? "active" : ""}`} onClick={() => handleToggleLike(u.id)}>
                          {liked ? <HandThumbsUpFill size={16} /> : <HandThumbsUp size={16} />}
                          <span>Like ({u.likes_count})</span>
                        </button>
                        <button className="action-btn">
                          <Reply size={16} />
                          <span>Reply ({u.replies?.length || 0})</span>
                        </button>
                      </div>

                      <div className="replies-section">
                        {u.replies?.map((r) => (
                          <div key={r.id} className="reply-item">
                            <div className="reply-header">
                              <span className="reply-author">{r.sender_name}</span>
                              <span className="text-muted small">
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="reply-content">{r.content}</div>
                          </div>
                        ))}

                        <div className="reply-input-box">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            className="reply-input"
                            value={replyInputs[u.id] || ""}
                            onChange={(e) =>
                              setReplyInputs({ ...replyInputs, [u.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddReply(u.id);
                            }}
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddReply(u.id)}
                            disabled={postingReplies[u.id] || !replyInputs[u.id]?.trim()}
                          >
                            {postingReplies[u.id] ? (
                              <Spinner size="xs" animation="border" style={{ width: "12px", height: "12px" }} />
                            ) : (
                              "Reply"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">No updates posted yet.</p>
                  <small>Start the discussion by posting what needs to be worked on!</small>
                </div>
              )}
            </>
          )}

          {activeTab === "files" && (
            <div>
              <div className="border rounded-3 p-3 bg-white mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-semibold">Uploaded Attachments ({attachments.length})</span>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => fileInputRef.current.click()}
                      disabled={uploadingAttachment}
                    >
                      {uploadingAttachment ? <Spinner size="sm" animation="border" /> : <><Paperclip size={14} className="me-1" /> Upload File</>}
                    </Button>
                  </div>
                </div>

                <div className="attachments-list">
                  {attachments.map((att) => (
                    <div key={att.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <Paperclip className="text-muted" />
                        <div>
                          <a href={`${api.defaults.baseURL.replace("/api", "")}${att.file_path}`} target="_blank" rel="noopener noreferrer" className="small fw-semibold text-decoration-none">
                            {att.filename}
                          </a>
                          <div className="text-muted" style={{ fontSize: "10px" }}>
                            Uploaded by {att.uploaded_by_name} on {new Date(att.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteAttachment(att.id)}>
                        <Trash size={15} />
                      </Button>
                    </div>
                  ))}
                  {attachments.length === 0 && (
                    <div className="text-center py-5 text-muted small">
                      No files uploaded yet. Files shared will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="border rounded-3 p-3 bg-white">
              <span className="fw-semibold d-block mb-3">History Log</span>
              {loadingHistory ? (
                <div className="text-center py-4">
                  <Spinner size="sm" animation="border" />
                </div>
              ) : historyLogs.length > 0 ? (
                <div className="history-logs-stack">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="py-2 border-bottom small">
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="text-slate-800">{log.actor_name}</strong>
                        <span className="text-muted" style={{ fontSize: "10px" }}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">{log.action}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted small">
                  No activity logged yet. Modifications to status/due-dates will be shown here.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdatesDrawer;
