import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, Form, Spinner, Alert, Dropdown, OverlayTrigger, Popover, Modal } from "react-bootstrap";
import { HandThumbsUp, HandThumbsUpFill, Reply, Send, X, Trash, Paperclip, Eye, EyeSlash, Gear, Bookmark, BookmarkFill, ThreeDots, Person } from "react-bootstrap-icons";
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
  Smile,
  Plus,
  PlusCircle,
  Mic,
  Video,
  GripVertical,
  Edit2,
  FileText,
  Hash,
  Globe,
  DollarSign,
  Mail,
  Phone,
  Star,
  Layers,
  ListPlus,
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
  reorderChecklistItems,
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
import SleekAssigneeSelector from "./SleekAssigneeSelector";
import SleekStatusSelector from "./SleekStatusSelector";
import { ListSkeleton } from "../Skeleton";
import { useTimer } from "../../context/TimerContext";
import "../../styles/Boards.css";

import { useAuth } from "../../context/AuthContext";

const UpdatesDrawer = ({
  taskId,
  task,
  boardId,
  boardCustomFields = [],
  onOpenCustomFields,
  onRefreshWorkspace,
  onClose,
  allTasks = [],
  onTaskUpdated,
  onSelectTask,
  groupName,
  boardName,
  customStatuses
}) => {
  const { user } = useAuth();

  const BOARD_COLORS = ["#008a00", "#0050ef", "#a20025", "#d80073", "#f0a30a", "#e3c800", "#76608a", "#6d8764", "#fa6800", "#1ba1e2"];
  
  // Custom alerts and thread view states
  const [customAlert, setCustomAlert] = useState({ show: false, message: "", type: "success" });
  const [activeThreadComment, setActiveThreadComment] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const showToast = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(() => {
      setCustomAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Custom Fields Editing states
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editFieldName, setEditFieldName] = useState("");
  const [editFieldOptionsList, setEditFieldOptionsList] = useState([]);
  const [newEditOptionText, setNewEditOptionText] = useState("");
  const [savingEditField, setSavingEditField] = useState(false);

  // Drag and drop options sorting handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData("text/plain"));
    const list = [...editFieldOptionsList];
    const [removed] = list.splice(sourceIndex, 1);
    list.splice(targetIndex, 0, removed);
    setEditFieldOptionsList(list);
  };

  const handleStartEditField = (field) => {
    setEditingFieldId(field.id);
    setEditFieldName(field.name);
    const options = field.config?.options || [];
    const colors = field.config?.optionColors || {};
    setEditFieldOptionsList(options.map(opt => ({
      label: opt,
      color: colors[opt] || BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)]
    })));
    setNewEditOptionText("");
  };

  const handleSaveEditField = async (field) => {
    if (!editFieldName.trim()) {
      showToast("Field name is required", "danger");
      return;
    }

    try {
      setSavingEditField(true);
      const updatedConfig = {
        ...(field.config || {}),
      };

      if (field.type === "dropdown" || field.type === "multi_select" || field.type === "labels") {
        updatedConfig.options = editFieldOptionsList.map(opt => opt.label.trim()).filter(Boolean);
        updatedConfig.optionColors = editFieldOptionsList.reduce((acc, opt) => {
          if (opt.label.trim()) acc[opt.label.trim()] = opt.color;
          return acc;
        }, {});
      }

      await api.put(`/board-extensions/custom-fields/${field.id}`, {
        name: editFieldName.trim(),
        config: updatedConfig
      });

      showToast("Field updated successfully!");
      setEditingFieldId(null);

      if (onRefreshWorkspace) {
        onRefreshWorkspace();
      }
      
      const fieldsRes = await api.get(`/board-extensions/boards/${boardId}/custom-fields`);
      setCustomFields(fieldsRes.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to save custom field settings", "danger");
    } finally {
      setSavingEditField(false);
    }
  };

  const handleDeleteField = (fieldId) => {
    setConfirmAction({
      message: "Are you sure you want to delete this custom field? This will delete the field and all its values from this space.",
      onConfirm: async () => {
        try {
          setSavingEditField(true);
          await api.delete(`/board-extensions/custom-fields/${fieldId}`);
          showToast("Custom field deleted successfully!");
          setEditingFieldId(null);

          if (onRefreshWorkspace) {
            onRefreshWorkspace();
          }

          const fieldsRes = await api.get(`/board-extensions/boards/${boardId}/custom-fields`);
          setCustomFields(fieldsRes.data);
        } catch (err) {
          console.error(err);
          showToast("Failed to delete custom field", "danger");
        } finally {
          setSavingEditField(false);
        }
      }
    });
  };
  useEffect(() => {
    if (task && task.custom_field_values) {
      setCustomFieldValues(task.custom_field_values);
    }
  }, [task?.custom_field_values]);
  const formatCommentDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return format(d, "MMM d 'at' h:mm a");
    } catch (e) {
      return dateStr;
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
        return <CalendarDays size={13} className="text-slate-400" />;
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

  const renderCustomFieldCell = (field, value, onChange) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "website":
      case "text_area":
        return (
          <input
            type={field.type === "email" ? "email" : "text"}
            className="form-control form-control-sm text-xs bg-light border-0"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="-"
          />
        );
      case "number":
      case "currency":
      case "money":
        return (
          <input
            type="number"
            className="form-control form-control-sm text-xs bg-light border-0"
            value={value || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
            placeholder="-"
          />
        );
      case "checkbox":
        return (
          <input
            type="checkbox"
            className="form-check-input cursor-pointer"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
        );
      case "date":
        return (
          <input
            type="date"
            className="form-control form-control-sm text-xs bg-light border-0"
            value={value ? value.split("T")[0] : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "dropdown": {
        const options = field.config?.options || [];
        return (
          <Form.Select
            size="sm"
            className="text-xs bg-light border-0 py-1"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">-</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </Form.Select>
        );
      }
      case "multi_select":
      case "labels": {
        const options = field.config?.options || [];
        const selected = Array.isArray(value) ? value : (value ? [value] : []);
        
        const toggleOption = (opt) => {
          let updated;
          if (selected.includes(opt)) {
            updated = selected.filter(o => o !== opt);
          } else {
            updated = [...selected, opt];
          }
          onChange(updated);
        };

        return (
          <Dropdown align="end" className="w-100">
            <Dropdown.Toggle as="div" className="cursor-pointer d-flex flex-wrap gap-1 align-items-center w-100 min-h-[24px] bg-light rounded px-2 py-1">
              {selected.length === 0 ? <span className="text-slate-400 small">-</span> : (
                selected.map((opt, i) => (
                  <Badge key={i} bg="light" className="text-dark border" style={{ fontSize: "10px" }}>{opt}</Badge>
                ))
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-sm border rounded-3 p-2" style={{ fontSize: "12px" }}>
              {options.map((opt, idx) => (
                <Form.Check
                  key={idx}
                  type="checkbox"
                  label={opt}
                  id={`field-drawer-${field.id}-opt-${idx}`}
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="mb-1"
                />
              ))}
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
                onClick={() => onChange(rating === star ? 0 : star)}
                style={{ fontSize: "15px" }}
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
            className="form-control form-control-sm text-xs bg-light border-0"
            value={typeof value === 'object' ? JSON.stringify(value) : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="-"
          />
        );
    }
  };

  const renderThreadView = () => {
    if (!activeThreadComment) return null;

    // Find the latest version of this comment in the updates list to get updated replies/likes
    const currentComment = updates.find(u => u.id === activeThreadComment.id) || activeThreadComment;
    const liked = checkUserLiked(currentComment.liked_by_ids);

    return (
      <div className="d-flex flex-column h-100" style={{ minHeight: 0 }}>
        {/* Thread Header */}
        <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3 bg-light p-2.5 rounded-3">
          <button
            type="button"
            className="btn btn-link text-slate-600 hover:text-slate-800 p-0 border-0 d-flex align-items-center gap-1.5 fw-semibold"
            onClick={() => setActiveThreadComment(null)}
            style={{ textDecoration: "none", fontSize: "12.5px" }}
          >
            ← Back
          </button>
          <div className="d-flex align-items-center gap-1.5">
            <span className="assignee-avatar zbot-avatar-sm" style={{ width: "20px", height: "20px", fontSize: "9px" }}>
              {getAvatarInitials(currentComment.sender_name)}
            </span>
            <span className="small fw-semibold text-slate-800">Thread by {currentComment.sender_name}</span>
          </div>
          <span className="text-muted small" style={{ fontSize: "11px" }}>{currentComment.replies?.length || 0} replies</span>
        </div>

        {/* Thread Content */}
        <div className="flex-grow-1 overflow-y-auto pr-1" style={{ maxHeight: "380px", overflowY: "auto", minHeight: 0 }}>
          {/* Parent Comment Card */}
          <div className="update-feed-item m-0 bg-white border rounded-3 shadow-sm mb-3 p-3 clickup-comment-card text-dark border-indigo-200" style={{ borderLeft: "4px solid #673de6" }}>
            <div className="update-item-header d-flex align-items-center justify-content-between mb-2">
              <div className="update-author-info d-flex align-items-center gap-2">
                <div className="assignee-avatar bg-purple text-white fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: "28px", height: "28px", fontSize: "11px", backgroundColor: "#a855f7" }}>
                  {getAvatarInitials(currentComment.sender_name)}
                </div>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="update-author-name fw-bold text-slate-800" style={{ fontSize: "13px" }}>{currentComment.sender_name}</span>
                  <span className="update-timestamp text-muted" style={{ fontSize: "11px" }}>
                    {formatCommentDate(currentComment.created_at)}
                  </span>
                </div>
              </div>
              {/* Parent actions */}
              <div className="comment-card-actions d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-link text-slate-400 hover:text-warning p-0 border-0"
                  onClick={() => handleToggleBookmark(currentComment.id, currentComment)}
                  title="Save to Inbox Later"
                  style={{ textDecoration: "none" }}
                  disabled={bookmarkingCommentId === currentComment.id}
                >
                  {bookmarkingCommentId === currentComment.id ? (
                    <Spinner size="sm" animation="border" className="text-warning" style={{ width: "12px", height: "12px" }} />
                  ) : bookmarkedComments[currentComment.id] ? (
                    <BookmarkFill size={14} className="text-warning" />
                  ) : (
                    <Bookmark size={14} />
                  )}
                </button>
                {(user?.role === 'superadmin' || currentComment.sender_email === user?.email) && (
                  <button
                    type="button"
                    className="btn btn-link text-slate-400 hover:text-slate-600 p-0 border-0"
                    onClick={() => handleStartEditComment(currentComment)}
                    title="Edit message"
                    style={{ textDecoration: "none" }}
                  >
                    <Pencil size={12} />
                  </button>
                )}
                <Dropdown align="end">
                  <Dropdown.Toggle as="button" className="btn btn-link text-slate-400 hover:text-slate-600 p-0 border-0">
                    <Person size={14} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow border-0 py-1" style={{ fontSize: "12px", minWidth: "180px", zIndex: 1100 }}>
                    <Dropdown.Header className="px-3 py-1 font-semibold text-slate-500" style={{ fontSize: "10.5px" }}>Assign task to...</Dropdown.Header>
                    {mentionOptions.filter(m => m.type === 'staff' || m.type === 'superadmin').map(m => {
                      const member = { id: m.id, role: m.type, name: m.label };
                      const isAssigned = taskAssignees.some(a => a.id === member.id && a.role === member.role);
                      return (
                        <Dropdown.Item
                          key={`${member.role}_${member.id}`}
                          className="d-flex align-items-center justify-content-between px-3 py-1.5"
                          onClick={() => handleToggleTaskAssignee(member)}
                        >
                          <span>{member.name}</span>
                          {isAssigned && <Check size={14} className="text-success" />}
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown align="end">
                  <Dropdown.Toggle as="button" className="btn btn-link text-slate-400 hover:text-slate-600 p-0 border-0">
                    <ThreeDots size={14} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow border-0 py-1" style={{ fontSize: "12px", minWidth: "140px", zIndex: 1100 }}>
                    <Dropdown.Item onClick={() => handleCopyCommentUrl(currentComment)}>
                      <Link2 size={13} className="me-2" /> Copy Link
                    </Dropdown.Item>
                    {(user?.role === 'superadmin' || currentComment.sender_email === user?.email) && (
                      <Dropdown.Item className="text-danger" onClick={() => handleDeleteComment(currentComment.id)}>
                        <Trash size={13} className="me-2" /> Delete
                      </Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>

            {editingCommentId === currentComment.id ? (
              <div className="ps-5 mb-2 mt-1">
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={editingCommentContent}
                  onChange={(e) => setEditingCommentContent(e.target.value)}
                  style={{ fontSize: "13px" }}
                />
                <div className="d-flex justify-content-end gap-1.5 mt-2">
                  <Button size="sm" variant="outline-secondary" className="px-2.5 py-0.5 text-xs" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                  <Button
                    size="sm"
                    variant="dark"
                    className="px-3 py-0.5 text-xs d-flex align-items-center gap-1"
                    onClick={() => handleSaveEditComment(currentComment.id)}
                    disabled={savingCommentId === currentComment.id}
                  >
                    {savingCommentId === currentComment.id ? (
                      <>
                        <Spinner size="sm" animation="border" style={{ width: "10px", height: "10px" }} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="update-content text-slate-700 ps-5 mb-2"
                style={{ fontSize: "13px" }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentComment.content || currentComment.message) }}
              />
            )}
          </div>

          {/* Separator / Title */}
          <div className="text-slate-500 small fw-semibold px-2 mb-2">Replies</div>

          {/* Replies list */}
          <div className="update-replies-list ps-3 border-start ms-2 mb-3">
            {currentComment.replies && currentComment.replies.length > 0 ? (
              currentComment.replies.map((reply) => (
                <div key={reply.id} className="update-reply-item bg-light p-2.5 rounded-3 mb-2.5 border">
                  <div className="reply-author d-flex align-items-center gap-2 mb-1">
                    <span className="assignee-avatar zbot-avatar-sm" style={{ width: "18px", height: "18px", fontSize: "8px" }}>
                      {getAvatarInitials(reply.sender_name)}
                    </span>
                    <strong style={{ fontSize: "11px" }}>{reply.sender_name}</strong>
                    <span className="reply-timestamp ms-auto text-muted" style={{ fontSize: "9px" }}>
                      {new Date(reply.created_at).toLocaleDateString()} at {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div 
                    className="reply-content text-secondary" 
                    style={{ fontSize: "11px" }} 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.content || reply.message) }} 
                  />
                </div>
              ))
            ) : (
              <div className="text-muted small py-3 text-center">No replies yet. Be the first to reply!</div>
            )}
          </div>
        </div>

        {/* Reply Input Wrapper */}
        <div className="reply-input-wrapper mt-auto border-top pt-2">
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control"
              placeholder="Reply to comment..."
              value={replyInputs[currentComment.id] || ""}
              onChange={(e) => {
                const val = e.target.value;
                setReplyInputs(prev => ({ ...prev, [currentComment.id]: val }));
                if (val.endsWith("@")) {
                  setActiveReplyDropdown(currentComment.id);
                } else if (!val.includes("@")) {
                  setActiveReplyDropdown(null);
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddReply(currentComment.id); }}
            />
            <Dropdown align="end" show={activeReplyDropdown === currentComment.id} onToggle={(isOpen) => setActiveReplyDropdown(isOpen ? currentComment.id : null)}>
              <Dropdown.Toggle as="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2 py-0 border-end-0" style={{ borderTop: "1px solid #ced4da", borderBottom: "1px solid #ced4da", borderRadius: 0 }}>
                @
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-0 py-1" style={{ fontSize: "11px", maxHeight: "200px", overflowY: "auto", zIndex: 1100 }}>
                {(() => {
                  const currentVal = replyInputs[currentComment.id] || "";
                  const lastAtIdx = currentVal.lastIndexOf("@");
                  const query = lastAtIdx !== -1 ? currentVal.slice(lastAtIdx + 1).toLowerCase() : "";
                  const filtered = mentionOptions.filter(m => m.type !== 'department' && m.searchStr.includes(query));
                  if (filtered.length === 0) return <Dropdown.Item disabled>No matching users</Dropdown.Item>;
                  return filtered.map(member => (
                    <Dropdown.Item
                      key={`${member.type}_${member.id}`}
                      onClick={() => {
                        const baseVal = currentVal.slice(0, lastAtIdx);
                        setReplyInputs(prev => ({ ...prev, [currentComment.id]: baseVal + `@${member.label} ` }));
                        setReplyMentions(prev => {
                          const currentMentions = prev[currentComment.id] || [];
                          return { ...prev, [currentComment.id]: [...currentMentions, { type: member.type, id: member.id, label: member.label }] };
                        });
                        setActiveReplyDropdown(null);
                      }}
                    >
                      {member.label}
                    </Dropdown.Item>
                  ));
                })()}
              </Dropdown.Menu>
            </Dropdown>
            <Button
              variant="primary"
              onClick={() => handleAddReply(currentComment.id)}
              disabled={postingReplies[currentComment.id] || !(replyInputs[currentComment.id] || "").trim()}
            >
              {postingReplies[currentComment.id] ? <Spinner size="sm" animation="border" /> : <Send size={12} />}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditCustomFieldModal = () => {
    const field = boardCustomFields.find(f => f.id === editingFieldId);
    if (!field) return null;

    return (
      <Modal
        show={editingFieldId !== null}
        onHide={() => setEditingFieldId(null)}
        centered
        size="sm"
        className="zbot-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6 fw-bold">Edit Custom Field</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3 pt-2">
          <Form.Group>
            <Form.Label className="small fw-semibold text-slate-700">Field name *</Form.Label>
            <Form.Control
              type="text"
              size="sm"
              value={editFieldName}
              onChange={(e) => setEditFieldName(e.target.value)}
              style={{ fontSize: "12px" }}
            />
          </Form.Group>

          {(field.type === "dropdown" || field.type === "multi_select" || field.type === "labels") && (
            <Form.Group>
              <Form.Label className="small fw-semibold text-slate-700 d-flex justify-content-between">
                <span>Dropdown options *</span>
                <small className="text-muted">(Drag to reorder)</small>
              </Form.Label>
              <div className="d-flex flex-column gap-1.5 mb-2 pr-1" style={{ maxHeight: "180px", overflowY: "auto" }}>
                {editFieldOptionsList.map((opt, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className="d-flex align-items-center gap-1.5 mb-1 p-1 rounded border border-light bg-white cursor-grab"
                    style={{ transition: "background-color 0.15s" }}
                  >
                    <GripVertical size={12} className="text-slate-400 me-1" style={{ cursor: "grab" }} />
                    <span className="rounded-circle d-inline-block" style={{ backgroundColor: opt.color, width: "8px", height: "8px", flexShrink: 0 }} />
                    <Form.Control
                      type="text"
                      size="sm"
                      value={opt.label}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setEditFieldOptionsList(prev => prev.map((item, i) => i === idx ? { ...item, label: nextVal } : item));
                      }}
                      style={{ fontSize: "12px", height: "28px", border: "none", padding: "2px" }}
                    />
                    <button
                      type="button"
                      className="btn btn-link text-slate-400 hover:text-danger p-0 border-0 ms-1"
                      onClick={() => setEditFieldOptionsList(prev => prev.filter((_, i) => i !== idx))}
                      style={{ textDecoration: "none", fontSize: "10px" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="+ Add option"
                  value={newEditOptionText}
                  onChange={(e) => setNewEditOptionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newEditOptionText.trim()) {
                      e.preventDefault();
                      const color = BOARD_COLORS[editFieldOptionsList.length % BOARD_COLORS.length] || "#64748b";
                      setEditFieldOptionsList(prev => [...prev, { label: newEditOptionText.trim(), color }]);
                      setNewEditOptionText("");
                    }
                  }}
                  style={{ fontSize: "12px", height: "28px" }}
                />
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => {
                    if (newEditOptionText.trim()) {
                      const color = BOARD_COLORS[editFieldOptionsList.length % BOARD_COLORS.length] || "#64748b";
                      setEditFieldOptionsList(prev => [...prev, { label: newEditOptionText.trim(), color }]);
                      setNewEditOptionText("");
                    }
                  }}
                  style={{ height: "28px", padding: "0 8px" }}
                >
                  +
                </Button>
              </div>
            </Form.Group>
          )}

          <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-2">
            <Button
              variant="outline-danger"
              size="sm"
              className="p-1.5 d-flex align-items-center justify-content-center"
              onClick={() => handleDeleteField(field.id)}
              disabled={savingEditField}
              style={{ borderRadius: "6px" }}
            >
              <Trash size={14} />
            </Button>
            <div className="d-flex gap-1.5">
              <Button
                variant="outline-secondary"
                size="sm"
                className="px-3 py-1"
                onClick={() => setEditingFieldId(null)}
                style={{ fontSize: "12px", borderRadius: "6px" }}
              >
                Cancel
              </Button>
              <Button
                variant="dark"
                size="sm"
                className="px-4 py-1"
                onClick={() => handleSaveEditField(field)}
                disabled={savingEditField}
                style={{ fontSize: "12px", borderRadius: "6px" }}
              >
                {savingEditField ? <Spinner animation="border" size="sm" /> : "Save"}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  const renderConfirmModal = () => {
    if (!confirmAction) return null;
    return (
      <Modal show={confirmAction !== null} onHide={() => setConfirmAction(null)} centered size="sm">
        <Modal.Body className="text-center p-4">
          <div className="text-warning mb-2" style={{ fontSize: "24px" }}>⚠️</div>
          <p className="small fw-semibold text-slate-800 mb-4">{confirmAction.message}</p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="outline-secondary" size="sm" className="px-3" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button variant="danger" size="sm" className="px-3" onClick={() => {
              confirmAction.onConfirm();
              setConfirmAction(null);
            }}>Confirm</Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  const [activeTab, setActiveTab] = useState("updates");
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const statusOptionsList = useMemo(() => {
    if (customStatuses && customStatuses.length > 0) {
      return customStatuses;
    }
    return [
      { id: "Not Started", label: "To do", color: "#7c8798" },
      { id: "In Progress", label: "In progress", color: "#6d45f7" },
      { id: "Done", label: "Complete", color: "#00b67a" }
    ];
  }, [customStatuses]);

  // Task inline metadata states
  const [status, setStatus] = useState(task.status || "Not Started");
  const [taskTitle, setTaskTitle] = useState(task.title || "");
  const [priority, setPriority] = useState(task.priority || "Normal");
  const [startDate, setStartDate] = useState(task.start_date || "");
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [category, setCategory] = useState(task.category || "");
  const [tagsInput, setTagsInput] = useState(task.tags || "");
  const [descriptionHtml, setDescriptionHtml] = useState(task.description_html || "");
  const [initialDescriptionHtml, setInitialDescriptionHtml] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");

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
  
  const {
    activeTimer,
    startTimer,
    stopTimer,
    elapsedSeconds,
    showLogModal
  } = useTimer();

  const isCurrentTimerActive = activeTimer && activeTimer.task?.id === taskId;
  const timerActive = isCurrentTimerActive && activeTimer.isRunning;
  const timerSeconds = isCurrentTimerActive ? elapsedSeconds : 0;

  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [showManualLog, setShowManualLog] = useState(false);
  const [savingTime, setSavingTime] = useState(false);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskMeta, setNewSubtaskMeta] = useState({ assignees: [], due_date: "", priority: "Normal" });
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState("");
  const [editingChecklistItemId, setEditingChecklistItemId] = useState(null);
  const [editingChecklistItemTitle, setEditingChecklistItemTitle] = useState("");
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Advanced feature states
  const [dependencyTaskId, setDependencyTaskId] = useState(task.dependency_task_id || "");
  const [recurringSettings, setRecurringSettings] = useState(task.recurring_settings || "");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Editor states
  const [content, setContent] = useState("");
  const [trackedMentions, setTrackedMentions] = useState([]); // [{type, id, label}]
  const [activeReactCommentId, setActiveReactCommentId] = useState(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);

  // Autocomplete popup states
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });

  // Threaded replies local input states
  const [replyInputs, setReplyInputs] = useState({}); // {updateId: string}
  const [postingReplies, setPostingReplies] = useState({}); // {updateId: boolean}
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({}); // {updateId: boolean}

  // Database listings for autocomplete
  const [mentionOptions, setMentionOptions] = useState([]); // [{type: 'staff'|'department'|'superadmin', id, label, searchStr}]

  // Reply mentions state
  const [replyMentions, setReplyMentions] = useState({}); // {updateId: [{type, id, label}]}
  const [activeReplyDropdown, setActiveReplyDropdown] = useState(null); // commentId or null
  const [savingCommentId, setSavingCommentId] = useState(null);
  const [savingChecklistItemId, setSavingChecklistItemId] = useState(null);

  // Bookmark comments state
  const [bookmarkedComments, setBookmarkedComments] = useState(() => {
    try {
      const saved = localStorage.getItem("zbot_bookmarked_comments");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [bookmarkingCommentId, setBookmarkingCommentId] = useState(null);

  const handleToggleBookmark = async (commentId, commentItem) => {
    try {
      setBookmarkingCommentId(commentId);
      const isBookmarked = !bookmarkedComments[commentId];
      const next = { ...bookmarkedComments, [commentId]: isBookmarked };
      setBookmarkedComments(next);
      localStorage.setItem("zbot_bookmarked_comments", JSON.stringify(next));
      
      const savedDataStr = localStorage.getItem("zbot_saved_comments_data");
      let savedData = {};
      try {
        savedData = savedDataStr ? JSON.parse(savedDataStr) : {};
      } catch {
        savedData = {};
      }
      
      if (isBookmarked && commentItem) {
        savedData[commentId] = {
          id: commentId,
          content: commentItem.content || commentItem.message || "",
          sender_name: commentItem.sender_name || "Unknown",
          sender_email: commentItem.sender_email || "",
          created_at: commentItem.created_at || new Date().toISOString(),
          task_id: taskId,
          task_title: task?.title || "Task",
          board_id: boardId,
          board_name: boardName || "Board",
          target_link: `/admin/boards/${boardId}?task=${taskId}`
        };
      } else {
        delete savedData[commentId];
      }
      localStorage.setItem("zbot_saved_comments_data", JSON.stringify(savedData));
      
      // Simulate/add a tiny delay so the user sees the loader spinning
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (isBookmarked) {
        showToast("Comment saved to Later!");
      } else {
        showToast("Comment removed from Later.");
      }
    } finally {
      setBookmarkingCommentId(null);
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = comment.content || comment.message;
    setEditingCommentContent(tempDiv.textContent || tempDiv.innerText || "");
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingCommentContent.trim()) {
      showToast("Comment content cannot be empty", "danger");
      return;
    }
    try {
      setSavingCommentId(commentId);
      await api.put(`/boards/updates/${commentId}`, { content: editingCommentContent.trim() });
      showToast("Comment updated!");
      setEditingCommentId(null);
      fetchTaskUpdates();
    } catch (err) {
      console.error(err);
      showToast("Failed to update comment", "danger");
    } finally {
      setSavingCommentId(null);
    }
  };

  const handleDeleteComment = (commentId) => {
    setConfirmAction({
      message: "Are you sure you want to delete this comment?",
      onConfirm: async () => {
        try {
          await api.delete(`/boards/updates/${commentId}`);
          showToast("Comment deleted!");
          fetchTaskUpdates();
        } catch (err) {
          console.error(err);
          showToast("Failed to delete comment", "danger");
        }
      }
    });
  };

  const handleCopyCommentUrl = (comment) => {
    const url = `${window.location.origin}${window.location.pathname}?board=${boardId}&task=${taskId}#comment-${comment.id}`;
    navigator.clipboard.writeText(url);
    showToast("Comment link copied to clipboard!");
  };

  const handleToggleTaskAssignee = async (member) => {
    const isAssigned = taskAssignees.some(a => a.id === member.id && a.role === member.role);
    let nextAssignees;
    if (isAssigned) {
      nextAssignees = taskAssignees.filter(a => !(a.id === member.id && a.role === member.role));
    } else {
      nextAssignees = [...taskAssignees, member];
    }
    setTaskAssignees(nextAssignees);

    try {
      await updateTask(taskId, {
        assignees: nextAssignees.map(a => ({ id: a.id, role: a.role }))
      });
      if (onTaskUpdated) {
        onTaskUpdated(taskId, { assignees: nextAssignees });
      }
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  };

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  // Custom Fields state & effect
  const [customFields, setCustomFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);

  useEffect(() => {
    const fetchCustomFields = async () => {
      if (!boardId || !taskId) return;
      try {
        setLoadingCustomFields(true);
        const fieldsRes = await api.get(`/board-extensions/boards/${boardId}/custom-fields`);
        setCustomFields(fieldsRes.data);

        const valsRes = await api.get(`/board-extensions/tasks/${taskId}/custom-fields`);
        const valMap = {};
        valsRes.data.forEach(v => {
          valMap[v.field_id] = v.value;
        });
        setCustomFieldValues(valMap);
      } catch (err) {
        console.error("Failed to load custom fields", err);
      } finally {
        setLoadingCustomFields(false);
      }
    };
    fetchCustomFields();
  }, [boardId, taskId]);

  const handleCustomFieldChange = async (fieldId, nextValue) => {
    try {
      setCustomFieldValues(prev => ({ ...prev, [fieldId]: nextValue }));
      await api.put(`/board-extensions/tasks/${taskId}/custom-fields`, {
        field_id: fieldId,
        value: nextValue
      });
      refreshHistoryLogs();
      if (onTaskUpdated) {
        onTaskUpdated(taskId, {
          custom_field_values: {
            ...(task.custom_field_values || {}),
            [fieldId]: nextValue
          }
        });
      }
    } catch (err) {
      console.error("Failed to save custom field value", err);
    }
  };

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const descEditorRef = useRef(null);

  useEffect(() => {
    if (editingDesc && descEditorRef.current) {
      descEditorRef.current.innerHTML = descriptionHtml || "";
    }
  }, [editingDesc]);

  useEffect(() => {
    if (!activeReactCommentId) return;
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".clickup-comment-card")) {
        setActiveReactCommentId(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, [activeReactCommentId]);

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
        const [usersRes, deptRes] = await Promise.all([
          api.get("/messaging/users"),
          api.get("/departments")
        ]);
        
        const options = [];
        
        if (Array.isArray(usersRes.data)) {
          usersRes.data.forEach((u) => {
            const [uRole, rawId] = u.id.split("_");
            const cleanLabel = u.name.replace(" (You)", "");
            options.push({
              type: uRole,
              id: Number(rawId),
              label: cleanLabel,
              searchStr: `${cleanLabel} ${u.email || ""}`.toLowerCase()
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

  // Fetch/refresh time entries when the log modal closes (which means they just finished saving a log!)
  useEffect(() => {
    if (!showLogModal && taskId) {
      const refreshTimeEntries = async () => {
        try {
          const entries = await getTaskTimeEntries(taskId);
          setTimeEntries(entries);
          const totalSpent = entries.reduce((acc, entry) => acc + (entry.duration_seconds || 0), 0);
          setTimeSpentSeconds(totalSpent);
          
          if (onTaskUpdated) {
            onTaskUpdated(taskId, {
              time_spent_seconds: totalSpent,
              time_entries: entries
            });
          }
        } catch (err) {
          console.error("Failed to refresh time entries", err);
        }
      };
      refreshTimeEntries();
    }
  }, [showLogModal, taskId]);

  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleStartTimer = () => {
    startTimer({ id: taskId, title: task.title || taskTitle });
  };

  const handleStopTimer = () => {
    stopTimer();
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
      setSavingDesc(true);
      await updateTask(taskId, { description_html: descriptionHtml.trim() || null });
      if (onTaskUpdated) onTaskUpdated(taskId, { description_html: descriptionHtml.trim() || null });
      setEditingDesc(false);
      refreshHistoryLogs();
    } catch (err) {
      setError("Failed to save description.");
    } finally {
      setSavingDesc(false);
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
      showToast("Task saved as template successfully!");
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

  const handleStartEditChecklist = (item) => {
    setEditingChecklistItemId(item.id);
    setEditingChecklistItemTitle(item.title);
  };

  const handleSaveChecklistItemTitle = async (itemId, oldTitle) => {
    const clean = editingChecklistItemTitle.trim();
    if (!clean || clean === oldTitle) {
      setEditingChecklistItemId(null);
      return;
    }
    try {
      setSavingChecklistItemId(itemId);
      const updated = await updateChecklistItem(itemId, { title: clean });
      setChecklist(prev => {
        const next = prev.map(item => item.id === itemId ? updated : item);
        if (onTaskUpdated) onTaskUpdated(taskId, { checklist: next });
        return next;
      });
      setEditingChecklistItemId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingChecklistItemId(null);
    }
  };

  const handleDragStartChecklist = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverChecklist = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    const items = [...checklist];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    setDraggedItemIndex(targetIndex);
    setChecklist(items);
  };

  const handleDragEndChecklist = async () => {
    if (draggedItemIndex === null) return;
    setDraggedItemIndex(null);
    try {
      const orderedIds = checklist.map(item => item.id);
      await reorderChecklistItems(taskId, orderedIds);
      if (onTaskUpdated) onTaskUpdated(taskId, { checklist });
    } catch (err) {
      console.error("Failed to save checklist order:", err);
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

  const handleReactToComment = async (commentId, emoji) => {
    try {
      const res = await api.post(`/boards/updates/${commentId}/react`, { emoji });
      setUpdates((prev) =>
        prev.map((item) => {
          if (item.id === commentId) {
            return { ...item, reactions: res.data.reactions };
          }
          return item;
        })
      );
    } catch (err) {
      console.error("Comment reaction failed:", err);
      toast.error("Failed to add reaction.");
    } finally {
      setActiveReactCommentId(null);
    }
  };

  const handleInsertInputEmoji = (emoji) => {
    setContent(prev => prev + emoji);
    textareaRef.current?.focus();
    setShowInputEmojiPicker(false);
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

  const fetchTaskUpdates = async () => {
    try {
      const updatesData = await getTaskUpdates(taskId);
      setUpdates(updatesData);
    } catch (err) {
      console.error("Failed to load task updates.", err);
    }
  };

  const handleAddReply = async (updateId) => {
    const text = replyInputs[updateId];
    if (!text || !text.trim() || postingReplies[updateId]) return;

    try {
      setPostingReplies((prev) => ({ ...prev, [updateId]: true }));
      const activeMentions = (replyMentions[updateId] || []).filter(m => text.includes(`@${m.label}`));
      const replyData = await createReply(updateId, {
        content: text.trim(),
        mentions: activeMentions.map(m => ({ type: m.type, id: m.id }))
      });
      
      setUpdates((prev) =>
        prev.map((up) => {
          if (up.id === updateId) {
            return { ...up, replies: [...up.replies, replyData] };
          }
          return up;
        })
      );
      
      setReplyInputs((prev) => ({ ...prev, [updateId]: "" }));
      setReplyMentions((prev) => ({ ...prev, [updateId]: [] }));
    } catch (err) {
      console.error("Failed to post reply.", err);
      showToast("Failed to post reply.", "danger");
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
            {/* Left Panel: Zbot-style task details */}
            <section className="task-detail-main">

              {/* Zbot-style compact metadata rows */}
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
                        backgroundColor: (statusOptionsList.find(s => s.id === status) || statusOptionsList[0]).color,
                        color: "#fff",
                        cursor: "pointer"
                      }}>
                        {(statusOptionsList.find(s => s.id === status) || statusOptionsList[0]).label.toUpperCase()}
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow">
                        <SleekStatusSelector
                          currentStatus={status}
                          customStatuses={statusOptionsList}
                          onSelectStatus={(nextVal) => handleStatusChange({ target: { value: nextVal } })}
                        />
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
                          <span className="assignee-avatar zbot-avatar-sm">{getAvatarInitials(assignee.name)}</span>
                          <span>{assignee.name}</span>
                        </button>
                      ))}
                      <Dropdown>
                        <Dropdown.Toggle as="div" className="cu-add-assignee-btn" title="Add assignee">+</Dropdown.Toggle>
                        <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow">
                          <SleekAssigneeSelector
                            selectedAssignees={taskAssignees}
                            members={assigneeOptions}
                            currentUser={user}
                            onToggleAssignee={handleAssigneeToggle}
                            onInviteEmail={(email) => toast.info(email ? `Invitation email sent to ${email}!` : "Invitation email sent!")}
                          />
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
                {/* Custom Fields (Dynamically loaded) */}
                {customFields.map((f) => (
                  <div key={f.id} className="cu-adv-row">
                    <span className="cu-adv-label">{f.name}</span>
                    <div style={{ flex: 1 }}>
                      {f.type === "text" && (
                        <input
                          type="text"
                          className="cu-adv-input"
                          value={customFieldValues[f.id] || ""}
                          onChange={(e) => handleCustomFieldChange(f.id, e.target.value)}
                          placeholder={`Enter ${f.name}...`}
                        />
                      )}
                      {f.type === "number" && (
                        <input
                          type="number"
                          className="cu-adv-input"
                          value={customFieldValues[f.id] || ""}
                          onChange={(e) => handleCustomFieldChange(f.id, e.target.value ? Number(e.target.value) : "")}
                          placeholder="0"
                        />
                      )}
                      {f.type === "date" && (
                        <input
                          type="date"
                          className="cu-adv-input"
                          value={customFieldValues[f.id] || ""}
                          onChange={(e) => handleCustomFieldChange(f.id, e.target.value)}
                        />
                      )}
                      {f.type === "dropdown" && (
                        <Form.Select
                          size="sm"
                          className="cu-adv-select"
                          value={customFieldValues[f.id] || ""}
                          onChange={(e) => handleCustomFieldChange(f.id, e.target.value)}
                        >
                          <option value="">Select...</option>
                          {f.config?.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </Form.Select>
                      )}
                      {f.type === "multi_select" && (
                        <Dropdown>
                          <Dropdown.Toggle variant="light" size="sm" className="w-100 text-start bg-white border d-flex justify-content-between align-items-center" style={{ fontSize: "12px", padding: "4px 8px" }}>
                            <span className="text-truncate">{Array.isArray(customFieldValues[f.id]) && customFieldValues[f.id].length > 0 ? customFieldValues[f.id].join(", ") : "Select options..."}</span>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="p-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                            {f.config?.options?.map((opt, i) => {
                              const selected = Array.isArray(customFieldValues[f.id]) && customFieldValues[f.id].includes(opt);
                              return (
                                <Form.Check
                                  key={i}
                                  type="checkbox"
                                  label={opt}
                                  checked={selected}
                                  onChange={() => {
                                    const currentList = Array.isArray(customFieldValues[f.id]) ? customFieldValues[f.id] : [];
                                    const nextList = selected ? currentList.filter(o => o !== opt) : [...currentList, opt];
                                    handleCustomFieldChange(f.id, nextList);
                                  }}
                                  className="small my-1"
                                />
                              );
                            })}
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                      {f.type === "currency" && (
                        <div className="d-flex align-items-center gap-1 w-100">
                          <span className="text-muted small">{f.config?.currencySymbol || "$"}</span>
                          <input
                            type="number"
                            className="cu-adv-input"
                            value={customFieldValues[f.id] || ""}
                            onChange={(e) => handleCustomFieldChange(f.id, e.target.value ? Number(e.target.value) : "")}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                      {f.type === "rating" && (
                        <div className="d-flex align-items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const active = (customFieldValues[f.id] || 0) >= star;
                            return (
                              <span
                                key={star}
                                onClick={() => handleCustomFieldChange(f.id, star)}
                                style={{ color: active ? "#ffc107" : "#e4e5e9", fontSize: "16px", cursor: "pointer" }}
                              >
                                ★
                              </span>
                            );
                          })}
                          {(customFieldValues[f.id] || 0) > 0 && (
                            <Button variant="link" size="sm" className="p-0 text-danger ms-2" onClick={() => handleCustomFieldChange(f.id, 0)} style={{ fontSize: "10px", textDecoration: "none" }}>Clear</Button>
                          )}
                        </div>
                      )}
                      {f.type === "formula" && (
                        <Badge bg="secondary" className="py-2 px-3 fw-bold" style={{ fontSize: "11px" }}>
                          {(() => {
                            try {
                              let resolved = f.config?.formula || "";
                              resolved = resolved.replace("{time_estimate}", task.time_estimate_minutes || 0);
                              customFields.forEach(cf => {
                                const val = customFieldValues[cf.id] !== undefined ? customFieldValues[cf.id] : 0;
                                resolved = resolved.replace(`{${cf.name}}`, typeof val === 'number' ? val : 0);
                              });
                              const result = new Function(`return ${resolved}`)();
                              return typeof result === 'number' && !isNaN(result) ? result : 0;
                            } catch {
                              return "Error";
                            }
                          })()}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                <div className="cu-adv-row cu-adv-actions">
                  <span className="text-muted small">Reuse configurations:</span>
                  <Button variant="outline-primary" size="sm" onClick={handleSaveAsTemplate} disabled={savingTemplate} className="cu-template-btn">
                    {savingTemplate ? <Spinner size="sm" animation="border" /> : <><Save size={12} className="me-1" /> Save as Template</>}
                  </Button>
                </div>
              </div>

              {/* Description (Zbot style - inline editable) */}
              <div className="cu-description-area" onClick={() => {
                if (!editingDesc) {
                  setInitialDescriptionHtml(descriptionHtml);
                  setEditingDesc(true);
                }
              }}>
                {editingDesc ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <div className="cu-desc-toolbar mb-2 p-1 bg-light border rounded d-flex gap-1">
                      <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => document.execCommand('bold')}><b>B</b></button>
                      <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => document.execCommand('italic')}><i>I</i></button>
                      <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => document.execCommand('underline')}><u>U</u></button>
                      <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => document.execCommand('strikeThrough')}><s>S</s></button>
                      <div className="vr mx-1" />
                      <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => document.execCommand('insertUnorderedList')}>• List</button>
                      <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => document.execCommand('insertOrderedList')}>1. List</button>
                      <div className="vr mx-1" />
                      <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => document.execCommand('formatBlock', '<h3>')}>H3</button>
                    </div>
                    <div
                      ref={descEditorRef}
                      contentEditable
                      className="cu-desc-textarea p-3 border rounded bg-white"
                      style={{ minHeight: "120px", outline: "none", overflowY: "auto" }}
                      onInput={(e) => setDescriptionHtml(e.currentTarget.innerHTML)}
                    />
                    <div className="cu-desc-actions mt-2">
                      <Button variant="link" size="sm" className="text-muted" onClick={(e) => { e.stopPropagation(); setEditingDesc(false); }} disabled={savingDesc}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); saveDescription(); }} disabled={savingDesc}>
                        {savingDesc ? <Spinner size="sm" animation="border" className="me-1" /> : null}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="cu-desc-display position-relative" style={{ cursor: "pointer" }}>
                    <div className="d-flex align-items-center justify-content-between mb-1.5 text-muted text-xs">
                      <span className="fw-semibold">Description</span>
                      <span className="d-flex align-items-center gap-1 text-primary" style={{ fontSize: "11px" }}>
                        <Pencil size={11} /> Click to edit
                      </span>
                    </div>
                    {descriptionHtml ? (
                      <div
                        className="small p-2.5 rounded bg-light border border-slate-100"
                        style={{ whiteSpace: "pre-wrap" }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(descriptionHtml)
                        }}
                      />
                    ) : (
                      <span className="cu-desc-placeholder p-2.5 d-block border border-dashed rounded text-center bg-light">
                        <Sparkles size={13} className="text-primary me-1" /> Add description, or write with AI
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Fields Section (Zbot style) */}
              <div className="cu-collapsible-section cu-custom-fields-section border-top pt-3 mt-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="cu-section-icon"><ChevronDown size={14} /></span>
                    <span className="cu-section-title fw-bold text-slate-800">Custom Fields</span>
                  </div>
                  <Dropdown popperConfig={{ strategy: "fixed" }}>
                    <Dropdown.Toggle as="button" className="btn btn-link text-slate-500 p-0 text-decoration-none d-flex align-items-center gap-1 font-semibold border-0 bg-transparent" style={{ fontSize: "11px" }}>
                      <Plus size={12} /> Add Field
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-0" style={{ fontSize: "12px", minWidth: "180px", zIndex: 1100 }}>
                      <Dropdown.Item onClick={() => onOpenCustomFields && onOpenCustomFields(false)}>
                        <PlusCircle size={14} className="me-2 text-primary" /> Create a field
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => onOpenCustomFields && onOpenCustomFields(true)}>
                        <Layers size={14} className="me-2 text-slate-500" /> Add field from Workspace
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                <div className="d-flex flex-column gap-2.5">
                  {boardCustomFields.length === 0 ? (
                    <div className="text-muted text-center py-2.5 small bg-light rounded border border-dashed">
                      No custom fields configured. Click "Add Field" to start!
                    </div>
                  ) : (
                    boardCustomFields.map((field) => {
                      const val = customFieldValues[field.id] ?? "";
                      
                      return (
                        <div key={field.id} className="cu-custom-field-row d-flex align-items-center justify-content-between">
                          <span className="text-slate-600 font-medium d-flex align-items-center gap-2" style={{ fontSize: "12.5px", width: "160px" }}>
                            {getFieldIcon(field.type)}
                            <span className="text-truncate" style={{ maxWidth: "110px" }} title={field.name}>{field.name}</span>
                            <Gear
                              size={12}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer ms-auto"
                              onClick={() => handleStartEditField(field)}
                              style={{ flexShrink: 0 }}
                            />
                          </span>
                          <div className="flex-grow-1 ms-3">
                            {renderCustomFieldCell(field, val, (newVal) => handleCustomFieldChange(field.id, newVal))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Subtasks section (Zbot style) */}
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
                      <div
                        key={sub.id}
                        className="cu-subtask-row"
                        onDoubleClick={() => {
                          const fullSub = allTasks.find(t => t.id === sub.id) || sub;
                          if (onSelectTask) {
                            onSelectTask(fullSub);
                          }
                        }}
                      >
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
                                    <div key={getAssigneeKey(a)} className="assignee-avatar zbot-avatar-sm" title={a.name}>
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
                            <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow">
                              <SleekAssigneeSelector
                                selectedAssignees={sub.assignees || []}
                                members={assigneeOptions}
                                currentUser={user}
                                onToggleAssignee={(p) => {
                                  const isSelected = sub.assignees && sub.assignees.some((a) => getAssigneeKey(a) === getAssigneeKey(p));
                                  const nextList = isSelected
                                    ? sub.assignees.filter((a) => getAssigneeKey(a) !== getAssigneeKey(p))
                                    : [...(sub.assignees || []), p];
                                  handleSubtaskCellChange(sub.id, "assignees", nextList);
                                }}
                                onInviteEmail={(email) => toast.info(email ? `Invitation email sent to ${email}!` : "Invitation email sent!")}
                              />
                            </Dropdown.Menu>
                          </Dropdown>

                          <div className="cu-subtask-date-cell">
                            <input
                              type="date"
                              value={sub.due_date ? sub.due_date.split("T")[0] : ""}
                              onChange={(e) => handleSubtaskCellChange(sub.id, "due_date", e.target.value)}
                              className="cu-hidden-date-picker"
                              onClick={(e) => {
                                try {
                                  e.target.showPicker();
                                } catch (err) {}
                              }}
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
                        <Dropdown.Menu className="board-dropdown-menu p-0 border-0 shadow">
                          <SleekAssigneeSelector
                            selectedAssignees={newSubtaskMeta.assignees || []}
                            members={assigneeOptions}
                            currentUser={user}
                            onToggleAssignee={(p) => {
                              const isSelected = newSubtaskMeta.assignees.some((a) => getAssigneeKey(a) === getAssigneeKey(p));
                              const nextList = isSelected
                                ? newSubtaskMeta.assignees.filter((a) => getAssigneeKey(a) !== getAssigneeKey(p))
                                : [...newSubtaskMeta.assignees, p];
                              setNewSubtaskMeta(prev => ({ ...prev, assignees: nextList }));
                            }}
                            onInviteEmail={(email) => toast.info(email ? `Invitation email sent to ${email}!` : "Invitation email sent!")}
                          />
                        </Dropdown.Menu>
                      </Dropdown>
                      <div className="position-relative">
                        <input
                          type="date"
                          value={newSubtaskMeta.due_date || ""}
                          onChange={(e) => setNewSubtaskMeta(prev => ({ ...prev, due_date: e.target.value }))}
                          className="cu-hidden-date-picker"
                          onClick={(e) => {
                            try {
                              e.target.showPicker();
                            } catch (err) {}
                          }}
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
                      {checklist.map((item, idx) => (
                        <div 
                          key={item.id} 
                          className="cu-checklist-row d-flex align-items-center justify-content-between p-1 rounded"
                          style={{ 
                            cursor: draggedItemIndex === idx ? "grabbing" : "default",
                            backgroundColor: draggedItemIndex === idx ? "#f1f5f9" : "transparent"
                          }}
                          draggable
                          onDragStart={(e) => handleDragStartChecklist(e, idx)}
                          onDragOver={(e) => handleDragOverChecklist(e, idx)}
                          onDragEnd={handleDragEndChecklist}
                        >
                          <div className="d-flex align-items-center gap-2 flex-grow-1">
                            <span 
                              style={{ cursor: "grab", color: "#94a3b8" }}
                              className="d-inline-flex align-items-center"
                              title="Drag to reorder"
                            >
                              <GripVertical size={13} />
                            </span>

                            <Form.Check
                              type="checkbox"
                              checked={item.is_checked}
                              onChange={() => handleToggleChecklist(item.id, item.is_checked)}
                              className="mb-0"
                            />

                            {editingChecklistItemId === item.id ? (
                              <div className="position-relative w-100 d-flex align-items-center">
                                <input
                                  type="text"
                                  className="form-control form-control-sm py-0.5 border-primary pe-4"
                                  style={{ fontSize: "13px" }}
                                  value={editingChecklistItemTitle}
                                  onChange={(e) => setEditingChecklistItemTitle(e.target.value)}
                                  onBlur={() => handleSaveChecklistItemTitle(item.id, item.title)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveChecklistItemTitle(item.id, item.title);
                                    if (e.key === "Escape") setEditingChecklistItemId(null);
                                  }}
                                  autoFocus
                                  disabled={savingChecklistItemId === item.id}
                                />
                                {savingChecklistItemId === item.id && (
                                  <Spinner size="sm" animation="border" className="position-absolute end-0 me-2" style={{ width: "12px", height: "12px" }} />
                                )}
                              </div>
                            ) : (
                              <span 
                                className={item.is_checked ? "text-decoration-line-through text-muted" : ""} 
                                style={{ fontSize: "13px", cursor: "pointer" }}
                                onClick={() => handleStartEditChecklist(item)}
                                title="Click to edit"
                              >
                                {item.title}
                              </span>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 text-slate-400 hover:text-slate-600" 
                              onClick={() => handleStartEditChecklist(item)}
                            >
                              <Edit2 size={12} />
                            </Button>
                            <Button variant="link" size="sm" className="p-0 text-danger cu-delete-icon" onClick={() => handleDeleteChecklistItem(item.id)}>
                              <Trash size={12} />
                            </Button>
                          </div>
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
                          <a href={`${api.defaults.baseURL}${att.file_path}`} target="_blank" rel="noopener noreferrer" className="cu-attachment-name">
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
                        <span className="assignee-avatar zbot-avatar-sm">{getAvatarInitials(w.name)}</span>
                        {w.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </section>

            {/* Right Panel: Separate Chronological Activity Log & Update Messaging (Zbot style) */}
            <aside className="task-detail-activity-unified">
              {/* Activities (History) Feed - Rendered at the top */}
              <div className="activity-feed-section mb-2">
                <div className="activity-feed-header py-2 border-bottom d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-bold text-uppercase text-secondary" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>Activities</span>
                  <span className="badge bg-light text-dark rounded-pill">{historyLogs.length}</span>
                </div>
                <div className="activity-feed-scroll" style={{ maxHeight: "100px", overflowY: "auto", paddingRight: "5px" }}>
                  {loading ? (
                    <div className="d-flex flex-column gap-2" style={{ opacity: 0.6 }}>
                      <div className="bg-slate-200 rounded animate-pulse" style={{ height: "15px", width: "90%" }} />
                      <div className="bg-slate-200 rounded animate-pulse" style={{ height: "15px", width: "80%" }} />
                      <div className="bg-slate-200 rounded animate-pulse" style={{ height: "15px", width: "70%" }} />
                    </div>
                  ) : (
                    <>
                      {historyLogs.map((item) => (
                        <div key={`history_${item.id}`} className="activity-feed-history-item py-1 mb-1 d-flex align-items-start justify-content-between" style={{ fontSize: "11px" }}>
                          <div className="d-flex align-items-start gap-2">
                            <div className="activity-history-dot mt-1" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6d45f7", flexShrink: 0 }} />
                            <span className="text-secondary">
                              <strong>{item.actor_name}</strong> {item.action}
                            </span>
                          </div>
                          <span className="text-muted text-nowrap ms-2" style={{ fontSize: "9px" }}>
                            {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      {historyLogs.length === 0 && (
                        <div className="text-center py-3 text-muted" style={{ fontSize: "11px" }}>
                          No activities recorded yet.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Comments (Discussion) Feed - Rendered at the bottom */}
              <div className="comments-feed-section d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
                {activeThreadComment ? (
                  renderThreadView()
                ) : (
                  <>
                    <div className="activity-feed-header py-2 border-bottom d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-uppercase text-secondary" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>Comments</span>
                      <span className="badge bg-light text-dark rounded-pill">{updates.length}</span>
                    </div>

                    <div className="activity-feed-scroll flex-grow-1" style={{ overflowY: "auto", paddingRight: "5px", minHeight: 0 }}>
                      {loading ? (
                        <div className="d-flex flex-column gap-3" style={{ opacity: 0.6 }}>
                          {[1, 2].map((i) => (
                            <div key={i} className="bg-white border p-3 rounded-3 shadow-sm animate-pulse">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <div className="rounded-circle bg-slate-200" style={{ width: "24px", height: "24px" }} />
                                <div className="bg-slate-200 rounded" style={{ height: "12px", width: "100px" }} />
                              </div>
                              <div className="bg-slate-200 rounded mb-2" style={{ height: "15px", width: "80%" }} />
                              <div className="bg-slate-200 rounded" style={{ height: "15px", width: "60%" }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {updates.map((item) => {
                            const liked = checkUserLiked(item.liked_by_ids);
                            return (
                              <div key={`update_${item.id}`} className="update-feed-item m-0 bg-white border rounded-3 shadow-sm mb-3 p-3 clickup-comment-card text-dark">
                                <div className="update-item-header d-flex align-items-center justify-content-between mb-2">
                                  <div className="update-author-info d-flex align-items-center gap-2">
                                    <div className="assignee-avatar bg-purple text-white fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: "28px", height: "28px", fontSize: "11px", backgroundColor: "#a855f7" }}>
                                      {getAvatarInitials(item.sender_name)}
                                    </div>
                                    <div className="d-flex align-items-baseline gap-2">
                                      <span className="update-author-name fw-bold text-slate-800" style={{ fontSize: "13px" }}>{item.sender_name}</span>
                                      <span className="update-timestamp text-muted" style={{ fontSize: "11px" }}>
                                        {formatCommentDate(item.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="comment-card-actions d-flex align-items-center gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-link text-slate-400 hover:text-warning p-0 border-0"
                                      onClick={() => handleToggleBookmark(item.id, item)}
                                      title="Save to Inbox Later"
                                      style={{ textDecoration: "none" }}
                                      disabled={bookmarkingCommentId === item.id}
                                    >
                                      {bookmarkingCommentId === item.id ? (
                                        <Spinner size="sm" animation="border" className="text-warning" style={{ width: "12px", height: "12px" }} />
                                      ) : bookmarkedComments[item.id] ? (
                                        <BookmarkFill size={14} className="text-warning" />
                                      ) : (
                                        <Bookmark size={14} />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-link text-slate-400 hover:text-indigo-600 p-0 border-0"
                                      onClick={() => setActiveThreadComment(item)}
                                      title="Reply in Thread"
                                      style={{ textDecoration: "none" }}
                                    >
                                      <Reply size={14} />
                                    </button>

                                    {(user?.role === 'superadmin' || item.sender_email === user?.email) && (
                                      <button
                                        type="button"
                                        className="btn btn-link text-slate-400 hover:text-slate-600 p-0 border-0"
                                        onClick={() => handleStartEditComment(item)}
                                        title="Edit message"
                                        style={{ textDecoration: "none" }}
                                      >
                                        <Pencil size={12} />
                                      </button>
                                    )}

                                    <Dropdown align="end">
                                      <Dropdown.Toggle as="button" className="btn btn-link text-slate-400 hover:text-slate-600 p-0 border-0">
                                        <Person size={14} />
                                      </Dropdown.Toggle>
                                      <Dropdown.Menu className="shadow border-0 py-1" style={{ fontSize: "12px", minWidth: "180px", zIndex: 1100 }}>
                                        <Dropdown.Header className="px-3 py-1 font-semibold text-slate-500" style={{ fontSize: "10.5px" }}>Assign task to...</Dropdown.Header>
                                        {mentionOptions.filter(m => m.type === 'staff' || m.type === 'superadmin').map(m => {
                                          const member = { id: m.id, role: m.type, name: m.label };
                                          const isAssigned = taskAssignees.some(a => a.id === member.id && a.role === member.role);
                                          return (
                                            <Dropdown.Item
                                              key={`${member.role}_${member.id}`}
                                              className="d-flex align-items-center justify-content-between px-3 py-1.5"
                                              onClick={() => handleToggleTaskAssignee(member)}
                                            >
                                              <span>{member.name}</span>
                                              {isAssigned && <Check size={14} className="text-success" />}
                                            </Dropdown.Item>
                                          );
                                        })}
                                      </Dropdown.Menu>
                                    </Dropdown>

                                    <Dropdown align="end">
                                      <Dropdown.Toggle as="button" className="btn btn-link text-slate-400 hover:text-slate-600 p-0 border-0">
                                        <ThreeDots size={14} />
                                      </Dropdown.Toggle>
                                      <Dropdown.Menu className="shadow border-0 py-1" style={{ fontSize: "12px", minWidth: "140px", zIndex: 1100 }}>
                                        <Dropdown.Item onClick={() => handleCopyCommentUrl(item)}>
                                          <Link2 size={13} className="me-2" /> Copy Link
                                        </Dropdown.Item>
                                        {(user?.role === 'superadmin' || item.sender_email === user?.email) && (
                                          <Dropdown.Item className="text-danger" onClick={() => handleDeleteComment(item.id)}>
                                            <Trash size={13} className="me-2" /> Delete
                                          </Dropdown.Item>
                                        )}
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </div>
                                </div>

                                {editingCommentId === item.id ? (
                                  <div className="ps-5 mb-2 mt-1">
                                    <Form.Control
                                      as="textarea"
                                      rows={2}
                                      value={editingCommentContent}
                                      onChange={(e) => setEditingCommentContent(e.target.value)}
                                      style={{ fontSize: "13px" }}
                                    />
                                    <div className="d-flex justify-content-end gap-1.5 mt-2">
                                      <Button size="sm" variant="outline-secondary" className="px-2.5 py-0.5 text-xs" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                      <Button
                                        size="sm"
                                        variant="dark"
                                        className="px-3 py-0.5 text-xs d-flex align-items-center gap-1"
                                        onClick={() => handleSaveEditComment(item.id)}
                                        disabled={savingCommentId === item.id}
                                      >
                                        {savingCommentId === item.id ? (
                                          <>
                                            <Spinner size="sm" animation="border" style={{ width: "10px", height: "10px" }} />
                                            <span>Saving...</span>
                                          </>
                                        ) : (
                                          "Save"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className="update-content text-slate-700 ps-5 mb-2"
                                    style={{ fontSize: "13px" }}
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content || item.message) }}
                                  />
                                )}

                                {item.mentioned_names && item.mentioned_names.length > 0 && (
                                  <div className="mentioned-tags mb-2 mt-1 ps-5">
                                    {item.mentioned_names.map((mn, idx) => (
                                      <span key={idx} className="mentioned-tag badge bg-light text-primary me-1">
                                        @{mn}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Reactions Pill Display row */}
                                {item.reactions && item.reactions.length > 0 && (
                                  <div className="d-flex gap-1 flex-wrap mt-1 mb-2 ps-5">
                                    {Object.entries(
                                      item.reactions.reduce((acc, r) => {
                                        if (!acc[r.emoji]) acc[r.emoji] = [];
                                        acc[r.emoji].push(r);
                                        return acc;
                                      }, {})
                                    ).map(([emoji, userList]) => {
                                      const currentRole = user?.role === 'superadmin' ? 'superadmin' : 'staff';
                                      const hasMyReaction = userList.some(r => r.user_id === user?.id && r.user_role === currentRole);
                                      return (
                                        <button
                                          key={emoji}
                                          className={`btn btn-sm py-0.5 px-2 d-flex align-items-center gap-1 border-slate-200 transition-all ${hasMyReaction ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white text-slate-700"}`}
                                          style={{ fontSize: "11px", fontWeight: "600", borderRadius: "12px", border: "1px solid" }}
                                          onClick={() => handleReactToComment(item.id, emoji)}
                                          title={userList.map(r => r.user_name).join(", ")}
                                        >
                                          <span>{emoji}</span>
                                          <span>{userList.length}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="update-actions border-top pt-2 mt-2 d-flex align-items-center justify-content-between ps-5">
                                  <div className="d-flex align-items-center gap-3">
                                    <button
                                      className={`update-like-btn border-0 bg-transparent text-slate-400 hover:text-primary ${liked ? "text-primary text-opacity-100" : ""}`}
                                      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                      onClick={() => handleToggleLike(item.id)}
                                    >
                                      {liked ? <HandThumbsUpFill size={14} style={{ color: "#673de6" }} /> : <HandThumbsUp size={14} />}
                                      {item.likes_count > 0 && <span style={{ fontSize: "11px" }}>{item.likes_count}</span>}
                                    </button>
                                    <div className="position-relative d-inline-block">
                                      <button 
                                        className="border-0 bg-transparent text-slate-400 hover:text-slate-600 p-0" 
                                        title="Add reaction" 
                                        onClick={() => setActiveReactCommentId(activeReactCommentId === item.id ? null : item.id)}
                                      >
                                        <Smile size={14} />
                                      </button>
                                      {activeReactCommentId === item.id && (
                                        <div className="position-absolute bg-white border border-slate-200 rounded-lg shadow-lg p-2 d-flex gap-1" style={{ zIndex: 100, bottom: "24px", left: "0" }}>
                                          {["👍", "✅", "🔥", "❤️", "😊", "🎉", "😮", "😢"].map(emoji => (
                                            <button 
                                              key={emoji}
                                              className="btn btn-sm btn-light p-1 border-0 hover:bg-slate-100 rounded"
                                              style={{ fontSize: "16px", cursor: "pointer" }}
                                              onClick={() => handleReactToComment(item.id, emoji)}
                                            >
                                              {emoji}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <button 
                                    className="update-reply-toggle border border-light-subtle rounded-pill bg-light hover:bg-light-subtle px-2 py-0.5 d-inline-flex align-items-center gap-1.5"
                                    style={{ fontSize: "11px", fontWeight: "600", cursor: "pointer", color: "#673de6" }}
                                    onClick={() => setActiveThreadComment(item)}
                                  >
                                    <span>
                                      {item.replies && item.replies.length > 0 ? (
                                        `${item.replies.length} ${item.replies.length === 1 ? "reply" : "replies"}`
                                      ) : (
                                        "Reply"
                                      )}
                                    </span>
                                    {item.replies && item.replies.length > 0 && (
                                      <span className="assignee-avatar rounded-circle text-white fw-bold d-flex align-items-center justify-content-center bg-purple" style={{ width: "14px", height: "14px", fontSize: "7px", backgroundColor: "#a855f7" }}>
                                        {getAvatarInitials(item.replies[0].sender_name)}
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {updates.length === 0 && (
                            <div className="text-center py-5 text-muted">
                              <p className="mb-0">No comments yet.</p>
                              <small>Start the discussion by posting what needs to be worked on!</small>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Sticky bottom editor */}
              {!activeThreadComment && (
                <div className="activity-feed-editor">
                  <div className="cu-comment-editor border rounded-3 p-2 bg-white position-relative" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <textarea
                      ref={textareaRef}
                      className="cu-comment-textarea border-0 w-100 bg-transparent text-slate-800"
                      style={{ outline: "none", fontSize: "13px", resize: "none" }}
                      placeholder="Write a comment..."
                      value={content}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      rows={2}
                    />

                    {showAutocomplete && autocompleteSuggestions.length > 0 && (
                      <div className="autocomplete-dropdown position-absolute bg-white border rounded shadow-lg p-2" style={{ bottom: "100%", left: 0, right: 0, zIndex: 9999 }}>
                        {autocompleteSuggestions.map((s, idx) => (
                          <div
                            key={`${s.type}_${s.id}`}
                            className={`autocomplete-item p-2 cursor-pointer rounded ${idx === autocompleteIndex ? "bg-light text-primary" : ""}`}
                            onClick={() => handleSuggestionSelect(s)}
                          >
                            <span className={`badge me-2 ${s.type === "department" ? "bg-info" : (s.type === "superadmin" ? "bg-warning" : "bg-secondary")}`}>
                              {s.type === "department" ? "Dept" : (s.type === "superadmin" ? "Admin" : "Staff")}
                            </span>
                            <span>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="d-flex align-items-center justify-content-between border-top pt-2 mt-2">
                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-link p-1 text-slate-400 hover:text-slate-600 bg-transparent border-0"
                          title="Attach files"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip size={14} />
                        </button>
                        <div className="position-relative d-inline-block">
                          <button 
                            type="button" 
                            className="btn btn-link p-1 text-slate-400 hover:text-slate-600 bg-transparent border-0" 
                            title="Emoji" 
                            onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                          >
                            <Smile size={14} />
                          </button>
                          {showInputEmojiPicker && (
                            <div className="position-absolute bg-white border border-slate-200 rounded-lg shadow-lg p-2 d-flex gap-1" style={{ zIndex: 100, bottom: "30px", left: "0" }}>
                              {["👍", "✅", "🔥", "❤️", "😊", "🎉", "😮", "😢"].map(emoji => (
                                <button 
                                  key={emoji}
                                  className="btn btn-sm btn-light p-1 border-0 hover:bg-slate-100 rounded"
                                  style={{ fontSize: "16px", cursor: "pointer" }}
                                  onClick={() => handleInsertInputEmoji(emoji)}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="button" className="btn btn-link p-1 text-slate-400 hover:text-slate-600 bg-transparent border-0" title="Video comment" onClick={() => toast.info("Video comments not supported on this device.")}>
                          <Video size={14} />
                        </button>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-link p-1 text-slate-400 hover:text-slate-600 bg-transparent border-0" title="Voice comment" onClick={() => toast.info("Voice comment feature requires audio permission.")}>
                          <Mic size={14} />
                        </button>
                        <Button
                          variant="dark"
                          size="sm"
                          className="rounded-circle p-0 d-flex align-items-center justify-content-center text-white"
                          style={{ width: "26px", height: "26px", backgroundColor: "#1e1e24", border: "none" }}
                          onClick={handlePostUpdate}
                          disabled={!content.trim() || posting}
                          title="Send Comment"
                        >
                          {posting ? (
                            <Spinner size="sm" animation="border" style={{ width: "12px", height: "12px" }} />
                          ) : (
                            <Send size={12} className="text-white" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
        {renderEditCustomFieldModal()}
        {renderConfirmModal()}
        {customAlert.show && (
          <div 
            className="position-fixed start-50 translate-middle shadow-lg text-white p-3 rounded d-flex align-items-center justify-content-center gap-2"
            style={{ 
              top: "10%", 
              zIndex: 10000, 
              backgroundColor: customAlert.type === "danger" ? "#dc3545" : "#198754",
              minWidth: "250px",
              maxWidth: "400px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: "500"
            }}
          >
            <span>{customAlert.message}</span>
          </div>
        )}
      </div>
    </>
  );
};


export default UpdatesDrawer;


