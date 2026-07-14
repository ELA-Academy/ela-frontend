import React, { useMemo, useState, useEffect } from "react";
import { Button, Modal, Form, Spinner } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MessageSquareText, Plus, Volume2 } from "lucide-react";
import api from "../../utils/api";

import ChatWindow from "../../components/admin/messaging/ChatWindow";
import { useWorkspace } from "../../components/admin/workspace/WorkspaceLayout";
import "../../styles/Messaging.css";
import "../../styles/WorkspaceShell.css";
import "../../styles/Boards.css";

const MessagingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    conversations,
    auditConversations,
    workspaceLoading: loading,
    openCreateChannelModal,
    openNewMessageModal,
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
    } catch (err) {
      console.error("Failed to create announcement", err);
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  return (
    <>
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
        <div className="workspace-announcements-panel p-4" style={{ background: "#f8fafc", minHeight: "100%", borderRadius: "12px" }}>
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <Volume2 className="text-primary" size={24} />
              <h3 className="mb-0 fw-bold text-slate-800">Workspace Announcements</h3>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowAnnouncementModal(true)} className="d-flex align-items-center gap-1">
              <Plus size={16} /> New Announcement
            </Button>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Volume2 size={48} className="text-slate-300 mb-3" />
              <h5>No announcements yet</h5>
              <p className="small mb-0">Important team-wide updates will appear here.</p>
            </div>
          ) : (
            <div className="announcements-list d-flex flex-column gap-3" style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
              {announcements.map((announcement) => (
                <div key={announcement.id} className="announcement-card bg-white p-3 rounded-3 shadow-sm border">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="mb-0 fw-bold text-slate-800">{announcement.title}</h5>
                    <span className="text-muted small">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="announcement-body text-slate-600 mb-2" style={{ whiteSpace: "pre-line", fontSize: "0.95rem" }}>
                    {announcement.content}
                  </p>
                  <div className="d-flex align-items-center gap-2 pt-2 border-top border-light">
                    <div
                      className="avatar-small bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                      style={{ width: "24px", height: "24px", fontSize: "0.75rem" }}
                    >
                      {announcement.created_by_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-muted small fw-medium">Posted by {announcement.created_by_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Announcement Modal */}
          <Modal show={showAnnouncementModal} onHide={() => setShowAnnouncementModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title className="fw-bold">Post New Announcement</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleCreateAnnouncement}>
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. System Maintenance, Holiday Schedule"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Type the announcement message details..."
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    required
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="light" onClick={() => setShowAnnouncementModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={announcementSubmitting}>
                  {announcementSubmitting ? <Spinner animation="border" size="sm" /> : "Post Announcement"}
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
