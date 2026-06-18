import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronRight,
  Hash,
  Lock,
  MessageCircle,
  Plus,
  Send,
  Shapes,
} from "lucide-react";

import "../../../styles/WorkspaceShell.css";

const WorkspaceSecondarySidebar = ({
  conversations = [],
  auditConversations = [],
  boards = [],
  selectedBoardId = null,
  selectedBoardGroups = [],
  activeConversationId = null,
  loading = false,
  onCreateSpace,
  onCreateChannel,
  onNewMessage,
}) => {
  const location = useLocation();

  const publicChannels = conversations.filter((item) => item.conversation_type === "channel");
  const departmentThreads = conversations.filter((item) => item.conversation_type === "department");
  const directMessages = conversations.filter((item) => item.conversation_type === "direct");
  const auditOnlyConversations = auditConversations.filter(
    (item) => !conversations.some((conversation) => conversation.id === item.id)
  );

  const isBoardsHome = location.pathname === "/admin/boards";

  const renderConversationLink = (conversation, icon, extraClass = "") => (
    <Link
      key={conversation.id}
      to={`/admin/messaging?conversation=${conversation.id}`}
      className={`workspace-secondary-link ${
        activeConversationId === conversation.id ? "active" : ""
      } ${extraClass}`}
    >
      <span className="workspace-secondary-link-icon">{icon}</span>
      <span className="workspace-secondary-link-text">
        <span className="workspace-secondary-link-title">{conversation.title}</span>
        {(conversation.unread_count || conversation.is_restricted) && (
          <span className="workspace-secondary-link-meta">
            {conversation.is_restricted ? "Restricted" : `${conversation.unread_count} unread`}
          </span>
        )}
      </span>
    </Link>
  );

  return (
    <aside className="workspace-secondary-sidebar">
      <div className="workspace-secondary-header">
        <div>
          <span className="workspace-secondary-eyebrow">Workspace</span>
          <h2>Collaboration hub</h2>
        </div>
        {onCreateSpace && (
          <button type="button" className="workspace-secondary-create" onClick={onCreateSpace}>
            <Plus size={15} />
          </button>
        )}
      </div>

      <div className="workspace-secondary-body">
        <section className="workspace-secondary-section">
          <div className="workspace-secondary-section-header">
            <span>Channels</span>
            {onCreateChannel && (
              <button type="button" onClick={onCreateChannel}>
                <Plus size={14} />
              </button>
            )}
          </div>
          <div className="workspace-secondary-links">
            {publicChannels.map((conversation) =>
              renderConversationLink(conversation, <Hash size={15} />)
            )}
            {publicChannels.length === 0 && <p className="workspace-empty-copy">No public channels yet.</p>}
          </div>
        </section>

        {auditOnlyConversations.length > 0 && (
          <section className="workspace-secondary-section workspace-superadmin-audit">
            <div className="workspace-secondary-section-header">
              <span>All Messages</span>
            </div>
            <div className="workspace-secondary-links">
              {auditOnlyConversations.map((conversation) =>
                renderConversationLink(
                  conversation,
                  conversation.conversation_type === "direct" ? <MessageCircle size={15} /> : <Lock size={14} />,
                  "audit-only"
                )
              )}
            </div>
          </section>
        )}

        <section className="workspace-secondary-section">
          <div className="workspace-secondary-section-header">
            <span>Department Messages</span>
          </div>
          <div className="workspace-secondary-links">
            {departmentThreads.map((conversation) =>
              renderConversationLink(
                conversation,
                conversation.is_restricted ? <Lock size={14} /> : <Hash size={14} />,
                "restricted"
              )
            )}
            {departmentThreads.length === 0 && (
              <p className="workspace-empty-copy">Department threads appear here automatically.</p>
            )}
          </div>
        </section>

        <section className="workspace-secondary-section">
          <div className="workspace-secondary-section-header">
            <span>Direct Messages</span>
            {onNewMessage && (
              <button type="button" onClick={onNewMessage}>
                <Send size={14} />
              </button>
            )}
          </div>
          <div className="workspace-secondary-links">
            {directMessages.map((conversation) =>
              renderConversationLink(conversation, <MessageCircle size={15} />)
            )}
            {directMessages.length === 0 && <p className="workspace-empty-copy">Start a new message to see it here.</p>}
          </div>
        </section>

        <section className="workspace-secondary-section">
          <div className="workspace-secondary-section-header">
            <span>Spaces</span>
            {onCreateSpace && (
              <button type="button" onClick={onCreateSpace}>
                <Plus size={14} />
              </button>
            )}
          </div>

          <div className="workspace-secondary-links">
            <Link
              to="/admin/boards"
              className={`workspace-secondary-link ${isBoardsHome ? "active" : ""}`}
            >
              <span className="workspace-secondary-link-icon">
                <Shapes size={15} />
              </span>
              <span className="workspace-secondary-link-text">
                <span className="workspace-secondary-link-title">All Tasks</span>
                <span className="workspace-secondary-link-meta">Entire school</span>
              </span>
            </Link>

            {boards.map((board) => {
              const isActiveBoard = selectedBoardId === board.id;
              const boardGroups = isActiveBoard ? selectedBoardGroups : [];

              return (
                <div key={board.id} className="workspace-space-block">
                  <Link
                    to={`/admin/boards/${board.id}`}
                    className={`workspace-secondary-link ${isActiveBoard ? "active" : ""}`}
                  >
                    <span className="workspace-secondary-link-icon">
                      {board.is_private ? <Lock size={15} /> : <Shapes size={15} />}
                    </span>
                    <span className="workspace-secondary-link-text">
                      <span className="workspace-secondary-link-title">{board.name}</span>
                      <span className="workspace-secondary-link-meta">
                        {board.is_private ? "Private space" : board.description || "Space"}
                      </span>
                    </span>
                    <ChevronRight size={14} className="workspace-space-arrow" />
                  </Link>

                  {isActiveBoard && boardGroups.length > 0 && (
                    <div className="workspace-space-groups">
                      {boardGroups.map((group) => (
                        <Link
                          key={group.id}
                          to={`/admin/boards/${board.id}`}
                          className="workspace-space-group-link"
                        >
                          <span
                            className="workspace-space-group-dot"
                            style={{ backgroundColor: group.color || "#673de6" }}
                          />
                          <span>{group.name}</span>
                          <small>{group.tasks?.length || 0}</small>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {!loading && boards.length === 0 && (
              <p className="workspace-empty-copy">Create your first space to start organizing projects.</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};

export default WorkspaceSecondarySidebar;
