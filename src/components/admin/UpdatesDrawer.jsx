import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Spinner, Alert } from "react-bootstrap";
import { HandThumbsUp, HandThumbsUpFill, Reply, Send, X } from "react-bootstrap-icons";
import {
  getTaskUpdates,
  createTaskUpdate,
  toggleLike,
  createReply
} from "../../services/boardService";
import api from "../../utils/api";
import { ListSkeleton } from "../Skeleton";
import "../../styles/Boards.css";

const UpdatesDrawer = ({ taskId, task, onClose }) => {
  const [activeTab, setActiveTab] = useState("updates");
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

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
        // Add superadmin
        options.push({
          type: "superadmin",
          id: 1,
          label: "Super Admin",
          searchStr: "super admin superadmin admin@ela-school.org"
        });
        
        // Add staff
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
        
        // Add departments
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
      
      // Filter options
      const filtered = mentionOptions.filter((opt) =>
        opt.searchStr.includes(query.toLowerCase())
      );
      
      setAutocompleteSuggestions(filtered);
      setAutocompleteIndex(0);
      setShowAutocomplete(filtered.length > 0);
      
      // Position calculation
      const rect = textareaRef.current.getBoundingClientRect();
      // Estimate cursor position roughly
      setAutocompletePosition({
        top: 60, // Relative inside container
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
      
      // Track mention to submit in payload
      setTrackedMentions((prev) => [
        ...prev.filter((m) => m.id !== suggestion.id || m.type !== suggestion.type),
        { type: suggestion.type, id: suggestion.id, label: suggestion.label }
      ]);
      
      setShowAutocomplete(false);
      
      // Return focus and cursor index
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
      
      // Filter out tracked mentions that are no longer present in content text
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
            // Find current user identifier
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

  // Highlights mentions in comment text to blue color
  const renderParsedContent = (text) => {
    if (!text) return "";
    
    // Splitting text by `@` mentions
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

  // Initials background badge color theme generator
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
              style={{ backgroundColor: task.status === "Done" ? "#00ca72" : (task.status === "In Progress" ? "#ff9f1a" : "#8c9baf") }}
            >
              {task.status}
            </span>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={28} />
          </button>
        </div>

        <div className="drawer-tabs">
          <div
            className={`drawer-tab ${activeTab === "updates" ? "active" : ""}`}
            onClick={() => setActiveTab("updates")}
          >
            Updates ({updates.length})
          </div>
          <div
            className={`drawer-tab ${activeTab === "files" ? "active" : ""}`}
            onClick={() => setActiveTab("files")}
          >
            Files
          </div>
          <div
            className={`drawer-tab ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            Activity Log
          </div>
        </div>

        <div className="drawer-body">
          {activeTab === "updates" ? (
            <>
              {error && <Alert variant="danger">{error}</Alert>}
              
              {/* composer */}
              <div className="update-editor-container">
                <textarea
                  ref={textareaRef}
                  className="update-editor-textarea"
                  placeholder="Write an update and mention others with @..."
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                />
                
                {/* Autocomplete tags dropdown */}
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
                        <span
                          className={
                            s.type === "department" ? "mention-dept-badge" : "mention-staff-badge"
                          }
                        >
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

                      {/* threaded replies section */}
                      <div className="update-actions-footer">
                        <button
                          className={`action-btn ${liked ? "active" : ""}`}
                          onClick={() => handleToggleLike(u.id)}
                        >
                          {liked ? <HandThumbsUpFill size={16} /> : <HandThumbsUp size={16} />}
                          <span>Like ({u.likes_count})</span>
                        </button>
                        <button className="action-btn">
                          <Reply size={16} />
                          <span>Reply ({u.replies?.length || 0})</span>
                        </button>
                      </div>

                      {/* Replies List */}
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

                        {/* Reply Text input */}
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
          ) : activeTab === "files" ? (
            <div className="text-center py-5 text-muted">
              <p className="mb-0">No files uploaded yet.</p>
              <small>Files shared in updates will be consolidated here.</small>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <p className="mb-0">Activity log tracking.</p>
              <small>System changes to task cells will be catalogued chronologically.</small>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdatesDrawer;
