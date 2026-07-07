import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  getTaskUpdates, 
  createTaskUpdate, 
  toggleLike, 
  createReply,
  uploadTaskAttachment
} from "../../../services/boardService";
import { Spinner, Form } from "react-bootstrap";
import { X, Send, Paperclip, Smile, MessageSquare, ThumbsUp, CornerDownRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";
import api from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import "../../../styles/InlineCommentPanel.css";

const InlineCommentPanel = ({ task, isOpen, onClose, assignees = [], onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [activeReactCommentId, setActiveReactCommentId] = useState(null);
  
  // Threading / Replies states
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState({});
  const [postingReplies, setPostingReplies] = useState({});

  // Mentions states
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);

  // File Upload states
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);

  // -------------------------------------------------------------
  // Fetch Comments
  // -------------------------------------------------------------
  const fetchComments = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const data = await getTaskUpdates(task.id);
      setComments(data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && task) {
      fetchComments();
      setNewComment("");
      setAttachedFiles([]);
      setActiveReplyId(null);
      setReplyInputs({});
    }
  }, [isOpen, task]);

  // Scroll to bottom on new comment
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [comments]);

  // -------------------------------------------------------------
  // Mention Filter Logic
  // -------------------------------------------------------------
  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return assignees.slice(0, 8);
    const q = mentionQuery.toLowerCase();
    return assignees.filter(a => a.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [assignees, mentionQuery]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewComment(value);

    // Parse text before cursor for @ mention
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    if (atIndex !== -1) {
      const afterAt = textBeforeCursor.substring(atIndex + 1);
      // Ensure @ is preceded by start of line or space, and contains no space
      if ((atIndex === 0 || /[\s\n]/.test(textBeforeCursor[atIndex - 1])) && !/\s/.test(afterAt)) {
        setShowMentions(true);
        setMentionQuery(afterAt);
        setMentionCursorPos(cursorPos);
        return;
      }
    }
    setShowMentions(false);
    setMentionQuery("");
  };

  const insertMention = (member) => {
    const textBeforeCursor = newComment.substring(0, mentionCursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const before = newComment.substring(0, atIndex);
    const after = newComment.substring(mentionCursorPos);
    const mention = `@${member.name} `;
    
    setNewComment(before + mention + after);
    setShowMentions(false);
    setMentionQuery("");

    setTimeout(() => {
      if (textareaRef.current) {
        const pos = (before + mention).length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 50);
  };

  // -------------------------------------------------------------
  // File Upload Handlers
  // -------------------------------------------------------------
  const getAttachmentUrl = (filePath) => {
    if (!filePath) return "";
    const base = api.defaults.baseURL || "";
    if (filePath.startsWith("/static/")) {
      return `${base}/static${filePath.substring(7)}`;
    }
    return `${base}${filePath}`;
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const result = await uploadTaskAttachment(task.id, file);
        setAttachedFiles(prev => [...prev, { name: file.name, id: result?.id, file_path: result?.file_path }]);
      }
      toast.success("Attachment uploaded successfully");
    } catch (err) {
      console.error("Upload failed:", err);
      const status = err.response?.status;
      if (status === 413) {
        toast.error("File size is too large. Please upload a smaller file (limit is 50MB).");
      } else {
        const errMsg = err.response?.data?.error || "Failed to upload file. Please try again.";
        toast.error(errMsg);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachedFile = (idx) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // -------------------------------------------------------------
  // Submit New Comment
  // -------------------------------------------------------------
  const handleSubmitComment = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim() && attachedFiles.length === 0) return;
    setPosting(true);

    try {
      // Find matches for mentions
      const activeMentions = [];
      assignees.forEach(member => {
        if (newComment.includes(`@${member.name}`)) {
          activeMentions.push({ type: member.role || "staff", id: member.id });
        }
      });

      // Construct final html content
      let htmlContent = newComment.replace(/\n/g, "<br/>");
      htmlContent = htmlContent.replace(/@(\S+(?:\s\S+)?)/g, '<strong style="color:#673de6">@$1</strong>');

      if (attachedFiles.length > 0) {
        const fileLinks = attachedFiles.map(f => {
          const url = getAttachmentUrl(f.file_path);
          return `<a href="${url}" target="_blank" style="color:#673de6; text-decoration: underline; font-weight: 600;">${f.name}</a>`;
        }).join(", ");
        htmlContent += `<br/><small style="color:#64748b; display: block; margin-top: 8px;">Attached: ${fileLinks}</small>`;
      }

      await createTaskUpdate(task.id, {
        content: htmlContent,
        mentions: activeMentions
      });

      setNewComment("");
      setAttachedFiles([]);
      fetchComments();
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error("Failed to post comment:", err);
      const errMsg = err.response?.data?.error || "Failed to post comment. Please try again.";
      toast.error(errMsg);
    } finally {
      setPosting(false);
    }
  };

  // -------------------------------------------------------------
  // Like Handler
  // -------------------------------------------------------------
  const handleLikeComment = async (commentId) => {
    try {
      const res = await toggleLike(commentId);
      // Optimistic state updates
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            likes_count: res.likes_count,
            // Toggle local liked indication if possible
            liked_by_ids: res.liked ? [...(c.liked_by_ids || []), "me"] : (c.liked_by_ids || []).filter(id => id !== "me")
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  };

  const handleReactToComment = async (commentId, emoji) => {
    try {
      const res = await api.post(`/boards/updates/${commentId}/react`, { emoji });
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            reactions: res.data.reactions
          };
        }
        return c;
      }));
      setActiveReactCommentId(null);
    } catch (err) {
      console.error("Comment reaction failed:", err);
    }
  };

  useEffect(() => {
    if (!activeReactCommentId) return;
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".comment-actions")) {
        setActiveReactCommentId(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, [activeReactCommentId]);

  // -------------------------------------------------------------
  // Reply Handler
  // -------------------------------------------------------------
  const handlePostReply = async (commentId) => {
    const text = replyInputs[commentId];
    if (!text || !text.trim()) return;

    setPostingReplies(prev => ({ ...prev, [commentId]: true }));
    try {
      const formattedContent = text.replace(/\n/g, "<br/>");
      const replyData = await createReply(commentId, { content: formattedContent });
      
      // Clear reply input
      setReplyInputs(prev => ({ ...prev, [commentId]: "" }));
      setActiveReplyId(null);
      
      // Update comments list
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...(c.replies || []), replyData]
          };
        }
        return c;
      }));
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error("Failed to post reply:", err);
      const errMsg = err.response?.data?.error || "Failed to post reply. Please try again.";
      toast.error(errMsg);
    } finally {
      setPostingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleThreadExpanded = (commentId) => {
    setExpandedThreads(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Helper avatar coloring
  const getAvatarColor = (name) => {
    const charCodeSum = (name || "U").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `hsl(${charCodeSum % 360}, 55%, 50%)`;
  };

  if (!task) return null;

  return (
    <div className={`inline-comment-panel ${isOpen ? "open" : ""}`}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        multiple
        onChange={handleFileSelect}
      />

      <div className="inline-comment-header">
        <div className="d-flex align-items-center gap-2">
          <MessageSquare size={16} className="text-primary" />
          <h6 className="inline-comment-title">Comments: {task.title}</h6>
        </div>
        <button className="border-0 bg-transparent text-slate-400 hover:text-slate-600" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="inline-comment-body" ref={bodyRef}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="sm" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-5 text-slate-400 d-flex flex-column align-items-center gap-2">
            <MessageSquare size={32} className="text-slate-200" />
            <span style={{ fontSize: "13px" }}>No comments yet. Start the conversation!</span>
          </div>
        ) : (
          comments.map(c => {
            const hasReplies = c.replies && c.replies.length > 0;
            const isThreadExpanded = !!expandedThreads[c.id];
            
            return (
              <div key={c.id} className="d-flex flex-column mb-1">
                {/* Main Comment */}
                <div className="comment-item">
                  <div 
                    className="comment-avatar"
                    style={{ backgroundColor: getAvatarColor(c.sender_name) }}
                  >
                    {(c.sender_name || "U").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="comment-content-wrapper">
                    <div className="comment-meta">
                      <span className="comment-author">{c.sender_name}</span>
                      <span className="comment-time">
                        {c.created_at ? format(parseISO(c.created_at), "MMM d, h:mm a") : "Just now"}
                      </span>
                    </div>
                    <div 
                      className="comment-text"
                      dangerouslySetInnerHTML={{ __html: c.content }}
                    />
                    
                    {/* Reactions Pill Display row */}
                    {c.reactions && c.reactions.length > 0 && (
                      <div className="d-flex gap-1 flex-wrap mt-1 mb-2">
                        {Object.entries(
                          c.reactions.reduce((acc, r) => {
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
                              onClick={() => handleReactToComment(c.id, emoji)}
                              title={userList.map(r => r.user_name).join(", ")}
                            >
                              <span>{emoji}</span>
                              <span>{userList.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="comment-actions">
                      <button 
                        className="comment-action-btn"
                        onClick={() => handleLikeComment(c.id)}
                      >
                        <ThumbsUp size={12} />
                        <span>Like {c.likes_count > 0 && `(${c.likes_count})`}</span>
                      </button>
                      
                      <button 
                        className="comment-action-btn"
                        onClick={() => setActiveReplyId(c.id)}
                      >
                        <MessageSquare size={12} />
                        <span>Reply</span>
                      </button>

                      <div className="position-relative d-inline-block">
                        <button 
                          className="comment-action-btn"
                          onClick={() => setActiveReactCommentId(activeReactCommentId === c.id ? null : c.id)}
                        >
                          <Smile size={12} />
                          <span>React</span>
                        </button>

                        {/* Emoji Selector Overlay */}
                        {activeReactCommentId === c.id && (
                          <div className="position-absolute bg-white border border-slate-200 rounded-lg shadow-lg p-2 d-flex gap-1" style={{ zIndex: 100, bottom: "24px", left: "0" }}>
                            {["👍", "✅", "🔥", "❤️", "😊", "🎉", "😮", "😢"].map(emoji => (
                              <button 
                                key={emoji}
                                className="btn btn-sm btn-light p-1 border-0 hover:bg-slate-100 rounded"
                                style={{ fontSize: "16px", cursor: "pointer" }}
                                onClick={() => handleReactToComment(c.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Replies Thread */}
                {hasReplies && (
                  <div className="comment-replies-container">
                    <div className="mb-1">
                      <button 
                        className="border-0 bg-transparent text-primary p-0 d-flex align-items-center gap-1"
                        style={{ fontSize: "11.5px", fontWeight: "600" }}
                        onClick={() => toggleThreadExpanded(c.id)}
                      >
                        <CornerDownRight size={12} />
                        {isThreadExpanded ? "Hide" : "Show"} {c.replies.length} {c.replies.length === 1 ? "reply" : "replies"}
                      </button>
                    </div>

                    {isThreadExpanded && c.replies.map(reply => (
                      <div key={reply.id} className="comment-reply-item">
                        <div 
                          className="comment-reply-avatar"
                          style={{ backgroundColor: getAvatarColor(reply.sender_name) }}
                        >
                          {(reply.sender_name || "U").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="comment-content-wrapper">
                          <div className="comment-meta">
                            <span className="comment-author" style={{ fontSize: "12px" }}>{reply.sender_name}</span>
                            <span className="comment-time" style={{ fontSize: "10.5px" }}>
                              {reply.created_at ? format(parseISO(reply.created_at), "MMM d, h:mm a") : "Just now"}
                            </span>
                          </div>
                          <div 
                            className="comment-text"
                            style={{ fontSize: "12.5px" }}
                            dangerouslySetInnerHTML={{ __html: reply.content }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {activeReplyId === c.id && (
                  <div className="mt-2 ms-5">
                    <Form.Control
                      type="text"
                      placeholder="Write a reply..."
                      value={replyInputs[c.id] || ""}
                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handlePostReply(c.id);
                        } else if (e.key === "Escape") {
                          setActiveReplyId(null);
                        }
                      }}
                      autoFocus
                      style={{ fontSize: "12.5px", borderRadius: "6px" }}
                    />
                    <div className="d-flex justify-content-end gap-2 mt-1">
                      <button 
                        className="btn btn-sm btn-light py-0 px-2"
                        style={{ fontSize: "11px" }}
                        onClick={() => setActiveReplyId(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn btn-sm btn-primary py-0 px-2 d-flex align-items-center gap-1"
                        style={{ fontSize: "11px", background: "#673de6", borderColor: "#673de6" }}
                        disabled={!replyInputs[c.id]?.trim() || postingReplies[c.id]}
                        onClick={() => handlePostReply(c.id)}
                      >
                        {postingReplies[c.id] && (
                          <Spinner animation="border" size="sm" style={{ width: "10px", height: "10px" }} />
                        )}
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="inline-comment-footer">
        <Form onSubmit={handleSubmitComment}>
          <div className="inline-comment-input-box">
            <Form.Control
              ref={textareaRef}
              as="textarea"
              rows={2}
              placeholder="Comment or type '@' to mention..."
              value={newComment}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !showMentions) {
                  e.preventDefault();
                  handleSubmitComment(e);
                }
              }}
              className="inline-comment-textarea"
            />

            {/* Mentions autocomplete menu */}
            {showMentions && filteredMentions.length > 0 && (
              <div className="mention-autocomplete-menu">
                {filteredMentions.map(member => (
                  <div 
                    key={`${member.role}_${member.id}`}
                    className="mention-user-row"
                    onClick={() => insertMention(member)}
                  >
                    <div 
                      className="mention-user-avatar"
                      style={{ backgroundColor: getAvatarColor(member.name) }}
                    >
                      {(member.name || "U").substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: "12.5px", fontWeight: "500", color: "#1e293b" }}>{member.name}</span>
                    {member.role && (
                      <span className="text-muted ms-auto" style={{ fontSize: "10px" }}>{member.role}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attached Files List */}
          {attachedFiles.length > 0 && (
            <div className="d-flex flex-wrap">
              {attachedFiles.map((file, i) => (
                <span key={i} className="attachment-chip">
                  <Paperclip size={10} />
                  <span>{file.name}</span>
                  <span 
                    className="attachment-chip-remove"
                    onClick={() => removeAttachedFile(i)}
                  >
                    &times;
                  </span>
                </span>
              ))}
            </div>
          )}

          <div className="inline-comment-toolbar">
            <div className="inline-comment-tools">
              <Paperclip 
                size={16} 
                className="inline-comment-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Files"
              />
              {uploading && <Spinner animation="border" size="sm" style={{ width: "12px", height: "12px", color: "#94a3b8" }} />}
              
              <span 
                className="fw-bold cursor-pointer inline-comment-tool-btn" 
                style={{ fontSize: "15px", lineHeight: "1" }}
                title="Mention someone"
                onClick={() => {
                  const pos = textareaRef.current?.selectionStart || newComment.length;
                  const before = newComment.substring(0, pos);
                  const after = newComment.substring(pos);
                  setNewComment(before + "@" + after);
                  setShowMentions(true);
                  setMentionQuery("");
                  setMentionCursorPos(pos + 1);
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                      textareaRef.current.setSelectionRange(pos + 1, pos + 1);
                    }
                  }, 50);
                }}
              >
                @
              </span>
            </div>

            <button 
              type="submit"
              disabled={posting || (!newComment.trim() && attachedFiles.length === 0)}
              className={`inline-comment-send-btn ${(newComment.trim() || attachedFiles.length > 0) ? "active" : ""}`}
            >
              {posting ? (
                <Spinner animation="border" size="sm" style={{ width: "12px", height: "12px" }} />
              ) : (
                <Send size={13} />
              )}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default InlineCommentPanel;
