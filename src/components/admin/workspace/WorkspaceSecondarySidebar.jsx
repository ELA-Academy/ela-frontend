import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import {
  ChevronRight,
  ChevronDown,
  Hash,
  Lock,
  MessageCircle,
  Plus,
  Send,
  Shapes,
  Home,
  Inbox,
  MessageSquare,
  CheckSquare,
  Folder,
  MoreHorizontal,
} from "lucide-react";

import "../../../styles/WorkspaceShell.css";

// Custom forwardRef for React-Bootstrap Dropdown toggles
const CustomDropdownToggle = React.forwardRef(({ children, onClick }, ref) => (
  <button
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }}
    className="sidebar-dropdown-toggle-btn"
    style={{
      background: "none",
      border: "none",
      padding: 0,
      color: "inherit",
      display: "flex",
      alignItems: "center",
      outline: "none",
      boxShadow: "none",
    }}
  >
    {children}
  </button>
));
CustomDropdownToggle.displayName = "CustomDropdownToggle";

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
  onCreateFolderList,
  onRename,
  onMove,
  onSettings,
  onDeleteBoard,
  onGlobalCreateTask,
}) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [expandedSpaces, setExpandedSpaces] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleSpace = (spaceId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSpaces((prev) => ({ ...prev, [spaceId]: !prev[spaceId] }));
  };

  const toggleFolder = (folderId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const publicChannels = conversations.filter((item) => item.conversation_type === "channel");
  const departmentThreads = conversations.filter((item) => item.conversation_type === "department");
  const directMessages = conversations.filter((item) => item.conversation_type === "direct");
  const auditOnlyConversations = auditConversations.filter(
    (item) => !conversations.some((conversation) => conversation.id === item.id)
  );

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

  // Tree helper
  const buildSpaceTree = (flatBoards) => {
    // Spaces (boards where parent_id is null and not a folder)
    const spaces = flatBoards.filter((b) => b.parent_id === null && !b.is_folder);
    
    // Legacy support: if there are boards with parent_id !== null but parent does not exist, treat them as spaces
    const boardIds = new Set(flatBoards.map((b) => b.id));
    const orphans = flatBoards.filter(
      (b) => b.parent_id !== null && !boardIds.has(b.parent_id) && !b.is_folder
    );
    
    const allSpaces = [...spaces, ...orphans];
    
    return allSpaces.map((space) => {
      const folders = flatBoards.filter((b) => b.parent_id === space.id && b.is_folder);
      const directLists = flatBoards.filter((b) => b.parent_id === space.id && !b.is_folder);
      
      const foldersWithLists = folders.map((folder) => {
        const lists = flatBoards.filter((b) => b.parent_id === folder.id && !b.is_folder);
        return { ...folder, lists };
      });
      
      return {
        ...space,
        folders: foldersWithLists,
        directLists,
      };
    });
  };

  const spaceTree = buildSpaceTree(boards);

  const renderListNode = (list) => {
    const isSelected = selectedBoardId === list.id;
    const groups = isSelected ? selectedBoardGroups : [];

    return (
      <div key={list.id} className="workspace-tree-list-node mb-1">
        <div
          className={`workspace-tree-row d-flex align-items-center justify-content-between p-1 px-2 rounded-2 ${
            isSelected ? "active" : ""
          }`}
          style={{ transition: "background 0.1s" }}
        >
          <Link
            to={`/admin/boards/${list.id}`}
            className="d-flex align-items-center gap-2 min-width-0 flex-grow-1 text-decoration-none"
            style={{ paddingLeft: "4px" }}
          >
            <span className="text-slate-400">
              {list.is_private ? <Lock size={13} className="text-rose-500" /> : <Hash size={13} />}
            </span>
            <span
              className="truncate-text"
              style={{
                fontSize: "11px",
                color: isSelected ? "#673de6" : "#4b5563",
                fontWeight: isSelected ? "700" : "500",
              }}
            >
              {list.name}
            </span>
          </Link>

          <div className="workspace-tree-actions">
            <Dropdown align="end">
              <Dropdown.Toggle as={CustomDropdownToggle}>
                <MoreHorizontal size={13} className="text-slate-400 hover-purple" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-slate-200 rounded-xl" style={{ fontSize: "12px" }}>
                <Dropdown.Item onClick={() => onRename(list.id, list.name)}>Rename</Dropdown.Item>
                <Dropdown.Item onClick={() => onMove(list.id, list.parent_id, false)}>Move List</Dropdown.Item>
                <Dropdown.Item onClick={() => onSettings && onSettings(list)}>List Settings</Dropdown.Item>
                <Dropdown.Item onClick={() => onDeleteBoard(list.id, list.name)} className="text-danger">
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {isSelected && groups.length > 0 && (
          <div className="workspace-space-groups" style={{ marginLeft: "14px" }}>
            {groups.map((group) => (
              <Link
                key={group.id}
                to={`/admin/boards/${list.id}`}
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
  };

  const renderFolderNode = (folder) => {
    const isExpanded = !!expandedFolders[folder.id];
    const isSelected = selectedBoardId === folder.id;

    return (
      <div key={folder.id} className="workspace-tree-folder-node mb-1">
        <div
          className={`workspace-tree-row d-flex align-items-center justify-content-between p-1 px-2 rounded-2 ${
            isSelected ? "active" : ""
          }`}
          style={{ cursor: "pointer", transition: "background 0.1s" }}
        >
          <div className="d-flex align-items-center gap-2 min-width-0 flex-grow-1" onClick={(e) => toggleFolder(folder.id, e)}>
            <span className="text-slate-400 d-flex align-items-center justify-content-center" style={{ width: "14px", height: "14px" }}>
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <span className="text-amber-500">
              {folder.is_private ? <Lock size={13} className="text-rose-500" /> : <Folder size={13} fill="#f59e0b" className="text-amber-500" />}
            </span>
            <span
              className="fw-semibold truncate-text"
              style={{ fontSize: "11.5px", color: "#4b5563" }}
            >
              {folder.name}
            </span>
          </div>

          <div className="workspace-tree-actions d-flex align-items-center gap-1">
            <Dropdown align="end">
              <Dropdown.Toggle as={CustomDropdownToggle}>
                <Plus size={13} className="text-slate-400 hover-purple" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-slate-200 rounded-xl" style={{ fontSize: "12px" }}>
                <Dropdown.Item onClick={() => onCreateFolderList(folder.id, "list")}>+ New List</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown align="end">
              <Dropdown.Toggle as={CustomDropdownToggle}>
                <MoreHorizontal size={13} className="text-slate-400 hover-purple" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-slate-200 rounded-xl" style={{ fontSize: "12px" }}>
                <Dropdown.Item onClick={() => onRename(folder.id, folder.name)}>Rename</Dropdown.Item>
                <Dropdown.Item onClick={() => onMove(folder.id, folder.parent_id, true)}>Move Folder</Dropdown.Item>
                <Dropdown.Item onClick={() => onSettings && onSettings(folder)}>Folder Settings</Dropdown.Item>
                <Dropdown.Item onClick={() => onDeleteBoard(folder.id, folder.name)} className="text-danger">
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {isExpanded && (
          <div className="workspace-tree-children" style={{ marginLeft: "10px", borderLeft: "1px dashed #e5e7eb", paddingLeft: "8px" }}>
            {folder.lists.map((list) => renderListNode(list))}
            {folder.lists.length === 0 && (
              <span className="text-slate-400 px-2 py-1 d-block" style={{ fontSize: "10px", fontStyle: "italic" }}>
                Empty Folder
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSpaceNode = (space) => {
    const isExpanded = !!expandedSpaces[space.id];
    const isSelected = selectedBoardId === space.id;

    return (
      <div key={space.id} className="workspace-tree-space-node mb-1">
        <div
          className={`workspace-tree-row d-flex align-items-center justify-content-between p-1 px-2 rounded-2 ${
            isSelected ? "active" : ""
          }`}
          style={{ cursor: "pointer", transition: "background 0.1s" }}
        >
          <div className="d-flex align-items-center gap-2 min-width-0 flex-grow-1" onClick={(e) => toggleSpace(space.id, e)}>
            <span className="text-slate-400 d-flex align-items-center justify-content-center" style={{ width: "16px", height: "16px" }}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <span className="text-slate-500">
              {space.is_private ? <Lock size={14} className="text-rose-500" /> : <Shapes size={14} className="text-indigo-500" />}
            </span>
            <Link
              to={`/admin/boards/${space.id}`}
              className="text-decoration-none text-slate-800 fw-bold truncate-text"
              style={{ fontSize: "12px", color: isSelected ? "#673de6" : "#374151" }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {space.name}
            </Link>
          </div>

          <div className="workspace-tree-actions d-flex align-items-center gap-1">
            <Dropdown align="end">
              <Dropdown.Toggle as={CustomDropdownToggle}>
                <Plus size={13} className="text-slate-400 hover-purple" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-slate-200 rounded-xl" style={{ fontSize: "12px" }}>
                <Dropdown.Item onClick={() => onCreateFolderList(space.id, "folder")}>+ New Folder</Dropdown.Item>
                <Dropdown.Item onClick={() => onCreateFolderList(space.id, "list")}>+ New List</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown align="end">
              <Dropdown.Toggle as={CustomDropdownToggle}>
                <MoreHorizontal size={13} className="text-slate-400 hover-purple" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-slate-200 rounded-xl" style={{ fontSize: "12px" }}>
                <Dropdown.Item onClick={() => onRename(space.id, space.name)}>Rename</Dropdown.Item>
                <Dropdown.Item onClick={() => onSettings && onSettings(space)}>Space Settings</Dropdown.Item>
                <Dropdown.Item onClick={() => onDeleteBoard(space.id, space.name)} className="text-danger">
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {isSelected && selectedBoardGroups.length > 0 && space.folders.length === 0 && space.directLists.length === 0 && (
          <div className="workspace-space-groups" style={{ marginLeft: "28px" }}>
            {selectedBoardGroups.map((group) => (
              <Link
                key={group.id}
                to={`/admin/boards/${space.id}`}
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

        {isExpanded && (
          <div className="workspace-tree-children" style={{ marginLeft: "14px", borderLeft: "1px solid #e5e7eb", paddingLeft: "8px" }}>
            {space.folders.map((folder) => renderFolderNode(folder))}
            {space.directLists.map((list) => renderListNode(list))}
            {space.folders.length === 0 && space.directLists.length === 0 && (
              <span className="text-slate-400 px-2 py-1 d-block" style={{ fontSize: "10.5px", fontStyle: "italic" }}>
                Empty Space
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const isInboxRoute = location.pathname === "/admin/inbox";
  const currentTab = searchParams.get("tab") || "inbox";
  const isBoardsHome = location.pathname === "/admin/boards";

  return (
    <aside className="workspace-secondary-sidebar">
      {/* Styles for hover triggers */}
      <style>
        {`
          .workspace-tree-row:hover .workspace-tree-actions {
            opacity: 1 !important;
          }
          .workspace-tree-actions {
            opacity: 0;
            transition: opacity 0.12s ease-in-out;
          }
          .hover-purple:hover {
            color: #673de6 !important;
          }
          .workspace-tree-row.active {
            background: rgba(103, 61, 230, 0.08);
          }
          .workspace-secondary-header {
            align-items: center;
          }
        `}
      </style>

      <div className="workspace-secondary-header">
        <div>
          <span className="workspace-secondary-eyebrow">Workspace</span>
          <h2>Collaboration hub</h2>
        </div>
        {onGlobalCreateTask && (
          <Dropdown align="end">
            <Dropdown.Toggle as={React.forwardRef(({ children, onClick }, ref) => (
              <button
                ref={ref}
                onClick={(e) => {
                  e.preventDefault();
                  onClick(e);
                }}
                className="workspace-secondary-create"
                title="Create New..."
              >
                <Plus size={15} />
              </button>
            ))}>
              <Plus size={15} />
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow border-slate-200 rounded-xl py-2" style={{ width: "200px" }}>
              <Dropdown.Header className="text-slate-400 font-bold px-3 py-1 text-uppercase" style={{ fontSize: "9px" }}>
                Global Create
              </Dropdown.Header>
              <Dropdown.Item className="d-flex align-items-center gap-2 px-3 py-2 font-medium" style={{ fontSize: "12px" }} onClick={onGlobalCreateTask}>
                <span>+ Task</span>
              </Dropdown.Item>
              <Dropdown.Item className="d-flex align-items-center gap-2 px-3 py-2 font-medium" style={{ fontSize: "12px" }} onClick={onNewMessage}>
                <span>+ Message</span>
              </Dropdown.Item>
              <Dropdown.Item className="d-flex align-items-center gap-2 px-3 py-2 font-medium" style={{ fontSize: "12px" }} onClick={onCreateChannel}>
                <span>+ Channel</span>
              </Dropdown.Item>
              <Dropdown.Item className="d-flex align-items-center gap-2 px-3 py-2 font-medium" style={{ fontSize: "12px" }} onClick={onCreateSpace}>
                <span>+ Space</span>
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Header className="text-slate-400 font-bold px-3 py-1 text-uppercase" style={{ fontSize: "9px" }}>
                Selected Space Actions
              </Dropdown.Header>
              <Dropdown.Item className="d-flex align-items-center gap-2 px-3 py-2 font-medium" style={{ fontSize: "12px" }} onClick={() => {
                if (selectedBoardId) {
                  onCreateFolderList(selectedBoardId, "folder");
                } else {
                  alert("Please select a Space first to create a folder under it.");
                }
              }}>
                <span>+ Folder</span>
              </Dropdown.Item>
              <Dropdown.Item className="d-flex align-items-center gap-2 px-3 py-2 font-medium" style={{ fontSize: "12px" }} onClick={() => {
                if (selectedBoardId) {
                  onCreateFolderList(selectedBoardId, "list");
                } else {
                  alert("Please select a Space/Folder first to create a list under it.");
                }
              }}>
                <span>+ List</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>

      <div className="workspace-secondary-body">
        {/* Home & Inbox section */}
        <section className="workspace-secondary-section top-navigation-section">
          <div className="workspace-secondary-links">
            <Link
              to="/admin/inbox?tab=home"
              className={`workspace-secondary-link ${isInboxRoute && currentTab === "home" ? "active" : ""}`}
            >
              <span className="workspace-secondary-link-icon"><Home size={15} /></span>
              <span className="workspace-secondary-link-text">
                <span className="workspace-secondary-link-title">Home</span>
              </span>
            </Link>
            <Link
              to="/admin/inbox?tab=inbox"
              className={`workspace-secondary-link ${isInboxRoute && currentTab === "inbox" ? "active" : ""}`}
            >
              <span className="workspace-secondary-link-icon"><Inbox size={15} /></span>
              <span className="workspace-secondary-link-text">
                <span className="workspace-secondary-link-title">Inbox</span>
              </span>
            </Link>
            <Link
              to="/admin/inbox?tab=replies"
              className={`workspace-secondary-link ${isInboxRoute && currentTab === "replies" ? "active" : ""}`}
            >
              <span className="workspace-secondary-link-icon"><MessageSquare size={15} /></span>
              <span className="workspace-secondary-link-text">
                <span className="workspace-secondary-link-title">Replies</span>
              </span>
            </Link>
            <Link
              to="/admin/inbox?tab=comments"
              className={`workspace-secondary-link ${isInboxRoute && currentTab === "comments" ? "active" : ""}`}
            >
              <span className="workspace-secondary-link-icon"><CheckSquare size={15} /></span>
              <span className="workspace-secondary-link-text">
                <span className="workspace-secondary-link-title">Assigned Comments</span>
              </span>
            </Link>
          </div>
        </section>

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

            {spaceTree.map((space) => renderSpaceNode(space))}

            {!loading && spaceTree.length === 0 && (
              <p className="workspace-empty-copy">Create your first space to start organizing projects.</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};

export default WorkspaceSecondarySidebar;
