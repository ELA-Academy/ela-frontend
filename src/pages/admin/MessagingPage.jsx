import React, { useMemo, useState, useEffect } from "react";
import { Button, Modal, Form, Spinner } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Volume2, 
  ThumbsUp, 
  Heart, 
  Award, 
  Share2, 
  Bold, 
  Italic, 
  Heading, 
  List, 
  ListOrdered, 
  Quote 
} from "lucide-react";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import api from "../../utils/api";

import ChatWindow from "../../components/admin/messaging/ChatWindow";
import { useWorkspace } from "../../components/admin/workspace/WorkspaceLayout";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Messaging.css";
import "../../styles/WorkspaceShell.css";
import "../../styles/Boards.css";

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBg = (name) => {
  if (!name) return "#6366f1";
  const colors = [
    "#7c3aed", // violet
    "#2563eb", // blue
    "#db2777", // pink
    "#ea580c", // orange
    "#059669", // emerald
    "#0891b2", // cyan
    "#d97706", // amber
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const MessagingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    conversations,
    auditConversations,
    workspaceLoading: loading,
    onlineUsers,
  } = useWorkspace();

  const activeConversationId = Number(searchParams.get("conversation")) || null;
  const chatEmail = searchParams.get("chat");

  // Handle redirect if navigating to a specific user email
  useEffect(() => {
    if (!chatEmail || loading) return;

    const handleChatRedirect = async () => {
      try {
        const res = await api.get("/messaging/users");
        const targetUser = res.data.find((u) => u.email === chatEmail);

        if (targetUser) {
          // Check if direct conversation exists
          const isSelf = targetUser.name.includes("(You)");
          const targetName = targetUser.name.replace(" (You)", "").trim();
          const existing = [...conversations, ...(auditConversations || [])].find(
            (c) =>
              c.conversation_type === "direct" &&
              c.participant_names &&
              (isSelf
                ? c.participant_names.length === 1 && c.participant_names.includes(targetName)
                : c.participant_names.length === 2 && c.participant_names.includes(targetName))
          );

          if (existing) {
            navigate(`/admin/messaging?conversation=${existing.id}`, { replace: true });
          } else {
            // Start a new conversation
            const startRes = await api.post("/messaging/conversations", {
              participant_ids: [targetUser.id],
            });
            navigate(`/admin/messaging?conversation=${startRes.data.conversation_id}`, { replace: true });
            window.location.reload(); // Force sidebar refresh
          }
        } else {
          navigate("/admin/messaging", { replace: true });
        }
      } catch (err) {
        console.error("Failed chat redirect:", err);
        navigate("/admin/messaging", { replace: true });
      }
    };

    handleChatRedirect();
  }, [chatEmail, conversations, auditConversations, navigate, loading]);

  const activeConversation = useMemo(
    () =>
      [...conversations, ...(auditConversations || [])].find(
        (conversation) => conversation.id === activeConversationId
      ),
    [conversations, auditConversations, activeConversationId]
  );

  // Announcements States
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [editorTab, setEditorTab] = useState("write"); // "write" or "preview"

  // Local Reactions State
  const [reactions, setReactions] = useState(() => {
    try {
      const saved = localStorage.getItem("announcement_reactions");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleReact = (announcementId, type) => {
    setReactions(prev => {
      const item = prev[announcementId] || { thumbs_up: 0, heart: 0, celebrate: 0, clicked: {} };
      const clicked = item.clicked || {};
      
      const newClicked = { ...clicked };
      const newTypeVal = item[type] || 0;
      
      let delta = 1;
      if (newClicked[type]) {
        delta = -1;
        newClicked[type] = false;
      } else {
        newClicked[type] = true;
      }
      
      const updated = {
        ...prev,
        [announcementId]: {
          ...item,
          [type]: Math.max(0, newTypeVal + delta),
          clicked: newClicked
        }
      };
      
      localStorage.setItem("announcement_reactions", JSON.stringify(updated));
      return updated;
    });
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/messaging/announcements");
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Error fetching announcements", err);
    }
  };

  useEffect(() => {
    if (!activeConversationId) {
      fetchAnnouncements();
    }
  }, [activeConversationId]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    setAnnouncementSubmitting(true);
    try {
      const res = await api.post("/messaging/announcements", newAnnouncement);
      setAnnouncements((prev) => [res.data, ...prev]);
      setNewAnnouncement({ title: "", content: "" });
      setShowAnnouncementModal(false);
      toast.success("Announcement posted successfully!");
    } catch (err) {
      console.error("Failed to create announcement", err);
      toast.error("Failed to post announcement.");
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const handleFormat = (tagOpen, tagClose = "") => {
    const textarea = document.getElementById("announcement-textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = tagOpen + selected + tagClose;

    const updatedContent = text.substring(0, start) + replacement + text.substring(end);
    setNewAnnouncement({ ...newAnnouncement, content: updatedContent });

    // Focus back and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagOpen.length, start + tagOpen.length + selected.length);
    }, 0);
  };

  const renderAnnouncementContent = (content) => {
    if (!content) return { __html: "" };
    // If it doesn't contain HTML tags, convert newlines to <br/>
    let formatted = content;
    if (!/<[a-z][\s\S]*>/i.test(content)) {
      formatted = content.replace(/\n/g, "<br/>");
    }
    return { __html: DOMPurify.sanitize(formatted) };
  };

  const renderReactionButton = (announcementId, type, icon, label) => {
    const item = reactions[announcementId] || { thumbs_up: 0, heart: 0, celebrate: 0, clicked: {} };
    const isClicked = !!item.clicked?.[type];
    const count = item[type] || 0;
    
    return (
      <button
        type="button"
        onClick={() => handleReact(announcementId, type)}
        className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill border-0 transition-all"
        style={{
          fontSize: "12px",
          fontWeight: "600",
          background: isClicked ? "rgba(99, 102, 241, 0.08)" : "#f1f5f9",
          color: isClicked ? "#4f46e5" : "#475569",
          cursor: "pointer",
          border: "1px solid",
          borderColor: isClicked ? "rgba(99, 102, 241, 0.2)" : "transparent"
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
        {count > 0 && (
          <span 
            className="ms-1 rounded-pill d-inline-flex align-items-center justify-content-center" 
            style={{
              padding: "2px 6px",
              fontSize: "10px",
              background: isClicked ? "#4f46e5" : "#64748b",
              color: "#ffffff"
            }}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <style>
        {`
          .rich-announcement-text ul {
            list-style-type: disc !important;
            margin-left: 20px !important;
            margin-bottom: 12px !important;
            padding-left: 0 !important;
          }
          .rich-announcement-text ol {
            list-style-type: decimal !important;
            margin-left: 20px !important;
            margin-bottom: 12px !important;
            padding-left: 0 !important;
          }
          .rich-announcement-text li {
            margin-bottom: 4px !important;
            display: list-item !important;
          }
          .rich-announcement-text blockquote {
            border-left: 4px solid #cbd5e1 !important;
            padding-left: 12px !important;
            color: #64748b !important;
            font-style: italic !important;
            margin: 12px 0 !important;
          }
          .rich-announcement-text h3 {
            font-size: 1.15rem !important;
            font-weight: 700 !important;
            margin-top: 14px !important;
            margin-bottom: 8px !important;
            color: #1e293b !important;
          }
          .feed-post-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .feed-post-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05) !important;
          }
        `}
      </style>
      {loading || chatEmail || (activeConversationId && !activeConversation) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <Spinner animation="border" variant="primary" />
          <span className="text-slate-400 text-xs font-semibold">
            {chatEmail ? "Opening direct conversation..." : "Loading conversation..."}
          </span>
        </div>
      ) : activeConversationId && activeConversation ? (
        <div className="workspace-message-panel">
          <ChatWindow
            conversationId={activeConversationId}
            conversation={activeConversation}
            onlineUsers={onlineUsers}
            key={activeConversationId}
          />
        </div>
      ) : (
        <div className="workspace-announcements-panel p-4" style={{ background: "#f8fafc", minHeight: "100%", borderRadius: "12px", overflowY: "auto" }}>
          
          {/* Social Media Feed Header Banner */}
          <div 
            className="feed-banner p-4 rounded-4 mb-4 text-white d-flex align-items-center justify-content-between" 
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.3)",
              paddingTop: "24px",
              paddingBottom: "24px"
            }}
          >
            <div>
              <h3 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ letterSpacing: "-0.02em" }}>
                <Volume2 size={24} className="text-warning" />
                Announcements
              </h3>
            </div>
            <Button 
              variant="light" 
              className="text-primary fw-bold px-3 py-2 rounded-3 border-0 shadow-sm d-flex align-items-center gap-1 hover:bg-slate-50" 
              onClick={() => { setEditorTab("write"); setShowAnnouncementModal(true); }}
            >
              <Plus size={16} /> New Post
            </Button>
          </div>

          {/* Social Media Composer Card */}
          <div className="composer-card bg-white p-3 rounded-4 border shadow-sm mb-4 d-flex align-items-center gap-3">
            <div 
              className="avatar rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style={{ width: "42px", height: "42px", background: getAvatarBg(user?.name || "User"), fontSize: "14px", flexShrink: 0 }}
            >
              {getInitials(user?.name || "User")}
            </div>
            <button 
              type="button" 
              className="flex-grow-1 text-start py-2.5 px-4 rounded-pill border bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
              onClick={() => { setEditorTab("write"); setShowAnnouncementModal(true); }}
              style={{ fontSize: "14px", cursor: "pointer", outline: "none" }}
            >
              Write an announcement to everyone, {user?.name?.split(" ")[0] || "Admin"}...
            </button>
          </div>

          {/* Feed Stream */}
          {announcements.length === 0 ? (
            <div className="text-center py-5 text-muted bg-white rounded-4 border shadow-sm">
              <Volume2 size={48} className="text-slate-300 mb-3 mx-auto d-block" style={{ display: "block", margin: "0 auto" }} />
              <h5 className="fw-bold">No announcements yet</h5>
              <p className="small mb-0">Important team-wide updates will appear here.</p>
            </div>
          ) : (
            <div className="announcements-list d-flex flex-column gap-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
              {announcements.map((announcement) => (
                <div key={announcement.id} className="feed-post-card bg-white p-4 rounded-4 shadow-sm border mb-4">
                  
                  {/* Post Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="avatar rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ 
                          width: "44px", 
                          height: "44px", 
                          background: getAvatarBg(announcement.created_by_name || "User"), 
                          fontSize: "14px", 
                          boxShadow: "0 2px 5px rgba(0,0,0,0.08)"
                        }}
                      >
                        {getInitials(announcement.created_by_name || "User")}
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold text-slate-800" style={{ fontSize: "14px" }}>
                          {announcement.created_by_name}
                        </h6>
                        <span className="text-muted text-xs d-block mt-0.5">
                          Staff Member • {new Date(announcement.created_at).toLocaleDateString()} at {new Date(announcement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Share Link Button */}
                    <button
                      type="button"
                      className="btn-share p-1.5 rounded-circle border-0 bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/admin/messaging`);
                        toast.success("Feed link copied!");
                      }}
                      title="Copy feed link"
                      style={{ cursor: "pointer" }}
                    >
                      <Share2 size={15} />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="feed-post-body my-3">
                    {announcement.title && (
                      <h4 className="fw-bold text-slate-900 mb-2.5" style={{ fontSize: "16px", lineHeight: "1.4" }}>
                        {announcement.title}
                      </h4>
                    )}
                    <div 
                      className="text-slate-700 rich-announcement-text" 
                      style={{ fontSize: "14.5px", lineHeight: "1.6" }}
                      dangerouslySetInnerHTML={renderAnnouncementContent(announcement.content)}
                    />
                  </div>

                  {/* Post Actions Footer */}
                  <div className="d-flex flex-wrap gap-2 pt-3 border-top border-slate-100 mt-3 align-items-center">
                    {renderReactionButton(announcement.id, "thumbs_up", "👍", "Like")}
                    {renderReactionButton(announcement.id, "heart", "❤️", "Love")}
                    {renderReactionButton(announcement.id, "celebrate", "🎉", "Celebrate")}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Announcement Modal */}
          <Modal show={showAnnouncementModal} onHide={() => setShowAnnouncementModal(false)} centered size="md">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: "18px" }}>Post New Announcement</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleCreateAnnouncement}>
              <Modal.Body className="pt-2">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-slate-700">Post Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. System Maintenance, Holiday Schedule"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    required
                    style={{ fontSize: "13.5px" }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-slate-700 d-flex justify-content-between align-items-center w-100">
                    <span>Message Body</span>
                    
                    {/* Editor Tab Headers */}
                    <div className="d-flex gap-2" style={{ fontSize: "11px" }}>
                      <button
                        type="button"
                        className="pb-0.5 border-0 bg-transparent"
                        style={{ 
                          fontWeight: "600",
                          color: editorTab === 'write' ? '#4f46e5' : '#64748b',
                          borderBottom: editorTab === 'write' ? '2px solid #4f46e5' : '2px solid transparent'
                        }}
                        onClick={() => setEditorTab('write')}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        className="pb-0.5 border-0 bg-transparent"
                        style={{ 
                          fontWeight: "600",
                          color: editorTab === 'preview' ? '#4f46e5' : '#64748b',
                          borderBottom: editorTab === 'preview' ? '2px solid #4f46e5' : '2px solid transparent'
                        }}
                        onClick={() => setEditorTab('preview')}
                      >
                        Preview
                      </button>
                    </div>
                  </Form.Label>

                  {editorTab === 'write' ? (
                    <>
                      {/* Markdown/HTML Formatting Toolbar */}
                      <div 
                        className="d-flex flex-wrap gap-1 bg-light p-2 border border-bottom-0"
                        style={{ borderTopLeftRadius: "6px", borderTopRightRadius: "6px" }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                          onClick={() => handleFormat("<strong>", "</strong>")}
                          title="Bold"
                          style={{ width: "28px", height: "28px", padding: 0 }}
                        >
                          <Bold size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                          onClick={() => handleFormat("<em>", "</em>")}
                          title="Italic"
                          style={{ width: "28px", height: "28px", padding: 0 }}
                        >
                          <Italic size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                          onClick={() => handleFormat("<h3>", "</h3>")}
                          title="Heading"
                          style={{ width: "28px", height: "28px", padding: 0 }}
                        >
                          <Heading size={13} />
                        </button>
                        <div className="vr mx-1" style={{ height: "20px" }} />
                        <button
                          type="button"
                          className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                          onClick={() => handleFormat("<ul>\n  <li>", "</li>\n</ul>")}
                          title="Bullet List"
                          style={{ width: "28px", height: "28px", padding: 0 }}
                        >
                          <List size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                          onClick={() => handleFormat("<ol>\n  <li>", "</li>\n</ol>")}
                          title="Numbered List"
                          style={{ width: "28px", height: "28px", padding: 0 }}
                        >
                          <ListOrdered size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                          onClick={() => handleFormat("<blockquote>", "</blockquote>")}
                          title="Quote"
                          style={{ width: "28px", height: "28px", padding: 0 }}
                        >
                          <Quote size={13} />
                        </button>
                      </div>

                      <Form.Control
                        id="announcement-textarea"
                        as="textarea"
                        rows={6}
                        className="rounded-t-0 text-sm border"
                        placeholder="Write post content. Select text and click tools above to format."
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        required
                        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, fontSize: "13.5px", fontFamily: "Segoe UI, sans-serif" }}
                      />
                    </>
                  ) : (
                    <div 
                      className="announcement-preview-box p-3 border rounded bg-slate-50 overflow-auto text-slate-700 rich-announcement-text" 
                      style={{ minHeight: "176px", maxHeight: "250px", fontSize: "13.5px", background: "#f8fafc" }}
                      dangerouslySetInnerHTML={renderAnnouncementContent(newAnnouncement.content || "<em>No content written to preview yet.</em>")}
                    />
                  )}
                </Form.Group>
              </Modal.Body>
              <Modal.Footer className="border-top-0 pt-0">
                <Button variant="light" size="sm" onClick={() => setShowAnnouncementModal(false)}>Cancel</Button>
                <Button variant="primary" size="sm" type="submit" disabled={announcementSubmitting}>
                  {announcementSubmitting ? <Spinner animation="border" size="sm" /> : "Post to Feed"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </div>
      )}
    </>
  );
};

export default MessagingPage;
