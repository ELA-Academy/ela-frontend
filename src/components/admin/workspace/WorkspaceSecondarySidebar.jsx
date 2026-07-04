import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { unfollowChannel, markConversationUnread, toggleFavoriteConversation } from "../../../services/messagingService";
import { Dropdown, Overlay } from "react-bootstrap";
import { saveBoardAsTemplate, archiveBoard, unarchiveBoard } from "../../../services/boardService";
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
  FileText,
  MoreHorizontal,
  Mail,
  User,
  Star,
  XCircle,
  Calendar,
  Bell,
  BellOff,
  Link2,
  Edit3,
  Copy,
  Palette,
  Zap,
  Tag,
  EyeOff,
  Archive,
  Shield,
  Settings,
  List,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

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

const getInitials = (name) => {
  const cleanName = name.replace("— You", "").replace("- You", "").trim();
  const parts = cleanName.split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBg = (name) => {
  const colors = [
    "#7c3aed", // violet
    "#2563eb", // blue
    "#db2777", // pink
    "#ea580c", // orange
    "#059669", // emerald
    "#0891b2", // cyan
    "#d97706", // amber
    "#b45309", // brown
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

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
  onRefreshWorkspace,
}) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [expandedSpaces, setExpandedSpaces] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});
  const [openDropdownConvoId, setOpenDropdownConvoId] = useState(null);
  const [myTasksExpanded, setMyTasksExpanded] = useState(true);
  const [favoriteConvoIds, setFavoriteConvoIds] = useState([]);
  const [menuConfig, setMenuConfig] = useState(null);
  const navigate = useNavigate();

  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (menuConfig && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      let top = menuConfig.pos?.top || 0;
      let left = menuConfig.pos?.left || 0;

      // Adjust top if it overflows the bottom
      if (top + rect.height > winHeight) {
        top = Math.max(10, winHeight - rect.height - 12);
      }
      // Adjust left if it overflows the right
      if (left + rect.width > winWidth) {
        left = Math.max(10, winWidth - rect.width - 12);
      }

      menuRef.current.style.top = `${top}px`;
      menuRef.current.style.left = `${left}px`;
    }
  }, [menuConfig]);

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

  const { user } = useAuth();
  const [closedDmIds, setClosedDmIds] = useState([]);

  const handleCloseDM = (convoId) => {
    setClosedDmIds((prev) => [...prev, convoId]);
    toast.success("Conversation closed");
  };

  const handleUnfollowChannel = async (convoId) => {
    try {
      await unfollowChannel(convoId);
      setClosedDmIds((prev) => [...prev, convoId]);
      toast.success("Channel unfollowed. It has been removed from your sidebar.");
      if (activeConversationId === convoId) {
        navigate("/admin/messaging");
      }
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      console.error("Failed to unfollow channel:", err);
      toast.error("Failed to unfollow channel.");
    }
  };

  const handleMarkUnread = async (convoId) => {
    try {
      await markConversationUnread(convoId);
      toast.success("Marked as unread");
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      console.error("Failed to mark as unread:", err);
      toast.error("Failed to mark as unread.");
    }
  };

  const handleToggleFavorite = async (convoId) => {
    try {
      await toggleFavoriteConversation(convoId);
      setFavoriteConvoIds((prev) =>
        prev.includes(convoId) ? prev.filter((id) => id !== convoId) : [...prev, convoId]
      );
      const isFav = favoriteConvoIds.includes(convoId);
      toast.success(isFav ? "Removed from favorites" : "Added to favorites");
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      toast.error("Failed to toggle favorite.");
    }
  };

  const renderMenuContent = () => {
    if (!menuConfig) return null;
    const { type, data } = menuConfig;

    if (type === "space-actions") {
      const space = data;
      return (
        <div className="clickup-menu">
          {/* Section 1: Quick actions */}
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.success("Added to favorites"); }}>
            <span className="clickup-menu-icon"><Star size={13} /></span>
            <span>Favorite</span>
            <ChevronRight size={12} className="clickup-menu-arrow ms-auto" />
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onRename(space.id, space.name); }}>
            <span className="clickup-menu-icon"><Edit3 size={13} /></span>
            <span>Rename</span>
          </div>
          <div className="clickup-menu-item" onClick={() => {
            setMenuConfig(null);
            navigator.clipboard.writeText(`${window.location.origin}/admin/boards/${space.id}`);
            toast.success("Link copied!");
          }}>
            <span className="clickup-menu-icon"><Link2 size={13} /></span>
            <span>Copy link</span>
          </div>

          <div className="clickup-menu-divider" />

          {/* Section 2: Create & Customize */}
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onCreateFolderList(space.id, "list"); }}>
            <span className="clickup-menu-icon"><Plus size={13} /></span>
            <span>Create new</span>
            <ChevronRight size={12} className="clickup-menu-arrow ms-auto" />
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Color & Icon customization coming soon"); }}>
            <span className="clickup-menu-icon"><Palette size={13} /></span>
            <span>Color & Icon</span>
            <ChevronRight size={12} className="clickup-menu-arrow ms-auto" />
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Automations coming soon"); }}>
            <span className="clickup-menu-icon"><Zap size={13} /></span>
            <span>Automations</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Custom Fields"); }}>
            <span className="clickup-menu-icon"><CheckSquare size={13} /></span>
            <span>Custom Fields</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Task statuses"); }}>
            <span className="clickup-menu-icon"><List size={13} /></span>
            <span>Task statuses</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Tags"); }}>
            <span className="clickup-menu-icon"><Tag size={13} /></span>
            <span>Tags</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("More options"); }}>
            <span className="clickup-menu-icon"><MoreHorizontal size={13} /></span>
            <span>More</span>
            <ChevronRight size={12} className="clickup-menu-arrow ms-auto" />
          </div>

          <div className="clickup-menu-divider" />

          {/* Section 3: Templates & Imports */}
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Imports feature coming soon"); }}>
            <span className="clickup-menu-icon"><ExternalLink size={13} /></span>
            <span>Imports</span>
            <ChevronRight size={12} className="clickup-menu-arrow ms-auto" />
          </div>
          <div className="clickup-menu-item" onClick={async () => {
            setMenuConfig(null);
            const templateName = window.prompt("Enter template name:", `Template: ${space.name}`);
            if (!templateName) return;
            try {
              await saveBoardAsTemplate(space.id, { template_name: templateName });
              toast.success("Space saved as template!");
              onRefreshWorkspace();
            } catch (err) {
              toast.error("Failed to save as template");
            }
          }}>
            <span className="clickup-menu-icon"><FileText size={13} /></span>
            <span>Save as Template</span>
          </div>

          <div className="clickup-menu-divider" />

          {/* Section 4: Move & Copy */}
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onMove(space.id, space.parent_id, false); }}>
            <span className="clickup-menu-icon"><ChevronRight size={13} style={{ transform: "rotate(90deg)" }} /></span>
            <span>Move</span>
            <ChevronRight size={12} className="clickup-menu-arrow ms-auto" />
          </div>

          {/* Section 5: Hide */}
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Space hidden from sidebar"); }}>
            <span className="clickup-menu-icon"><EyeOff size={13} /></span>
            <span>Hide Space</span>
          </div>

          <div className="clickup-menu-divider" />

          {/* Section 6: Destructive / management */}
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Space duplicated"); }}>
            <span className="clickup-menu-icon"><Copy size={13} /></span>
            <span>Duplicate</span>
          </div>
          <div className="clickup-menu-item" onClick={async () => {
            setMenuConfig(null);
            if (!window.confirm(`Are you sure you want to archive "${space.name}"?`)) return;
            try {
              await archiveBoard(space.id);
              toast.success("Space archived successfully!");
              if (window.location.pathname.includes(`/admin/boards/${space.id}`)) {
                navigate("/admin/boards");
              }
              onRefreshWorkspace();
            } catch (err) {
              toast.error("Failed to archive space");
            }
          }}>
            <span className="clickup-menu-icon"><Archive size={13} /></span>
            <span>Archive</span>
          </div>
          <div className="clickup-menu-item text-danger" onClick={() => { setMenuConfig(null); onDeleteBoard(space.id, space.name); }}>
            <span className="clickup-menu-icon"><Trash2 size={13} /></span>
            <span>Delete</span>
          </div>

          <div className="clickup-menu-divider" />

          {/* Section 7: Sharing button */}
          <div className="clickup-menu-footer">
            <button
              type="button"
              className="clickup-menu-footer-btn"
              onClick={() => {
                setMenuConfig(null);
                onSettings && onSettings(space);
              }}
            >
              <Shield size={13} /> Sharing & Permissions
            </button>
          </div>
        </div>
      );
    }

    if (type === "space-create") {
      const space = data;
      return (
        <div className="clickup-menu">
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onCreateFolderList(space.id, "folder"); }}>
            <span className="clickup-menu-icon"><Folder size={13} /></span>
            <span>+ New Folder</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onCreateFolderList(space.id, "list"); }}>
            <span className="clickup-menu-icon"><List size={13} /></span>
            <span>+ New List</span>
          </div>
        </div>
      );
    }

    if (type === "folder-create") {
      const folder = data;
      return (
        <div className="clickup-menu">
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onCreateFolderList(folder.id, "list"); }}>
            <span className="clickup-menu-icon"><List size={13} /></span>
            <span>+ New List</span>
          </div>
        </div>
      );
    }

    if (type === "folder-actions") {
      const folder = data;
      return (
        <div className="clickup-menu">
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onRename(folder.id, folder.name); }}>
            <span className="clickup-menu-icon"><Edit3 size={13} /></span>
            <span>Rename</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onMove(folder.id, folder.parent_id, true); }}>
            <span className="clickup-menu-icon"><ChevronRight size={13} style={{ transform: "rotate(90deg)" }} /></span>
            <span>Move Folder</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onSettings && onSettings(folder); }}>
            <span className="clickup-menu-icon"><Settings size={13} /></span>
            <span>Folder Settings</span>
          </div>
          <div className="clickup-menu-divider" />
          <div className="clickup-menu-item text-danger" onClick={() => { setMenuConfig(null); onDeleteBoard(folder.id, folder.name); }}>
            <span className="clickup-menu-icon"><Trash2 size={13} /></span>
            <span>Delete</span>
          </div>
        </div>
      );
    }

    if (type === "list-actions") {
      const list = data;
      return (
        <div className="clickup-menu">
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onRename(list.id, list.name); }}>
            <span className="clickup-menu-icon"><Edit3 size={13} /></span>
            <span>Rename</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onMove(list.id, list.parent_id, false); }}>
            <span className="clickup-menu-icon"><ChevronRight size={13} style={{ transform: "rotate(90deg)" }} /></span>
            <span>Move List</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); onSettings && onSettings(list); }}>
            <span className="clickup-menu-icon"><Settings size={13} /></span>
            <span>List Settings</span>
          </div>
          <div className="clickup-menu-divider" />
          <div className="clickup-menu-item text-danger" onClick={() => { setMenuConfig(null); onDeleteBoard(list.id, list.name); }}>
            <span className="clickup-menu-icon"><Trash2 size={13} /></span>
            <span>Delete</span>
          </div>
        </div>
      );
    }

    if (type === "channel-actions") {
      const conversation = data;
      return (
        <div className="clickup-menu">
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); handleMarkUnread(conversation.id); }}>
            <span className="clickup-menu-icon"><Mail size={13} /></span>
            <span>Mark as unread</span>
          </div>
          <div className="clickup-menu-item" onClick={() => {
            setMenuConfig(null);
            navigator.clipboard.writeText(`${window.location.origin}/admin/messaging?conversation=${conversation.id}`);
            toast.success("Link copied!");
          }}>
            <span className="clickup-menu-icon"><Link2 size={13} /></span>
            <span>Copy link</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); handleToggleFavorite(conversation.id); }}>
            <span className="clickup-menu-icon"><Star size={13} className={favoriteConvoIds.includes(conversation.id) ? "text-warning" : ""} fill={favoriteConvoIds.includes(conversation.id) ? "currentColor" : "none"} /></span>
            <span>{favoriteConvoIds.includes(conversation.id) ? "Unfavorite" : "Favorite"}</span>
          </div>
          <div className="clickup-menu-divider" />
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Email to Channel feature is coming soon"); }}>
            <span className="clickup-menu-icon"><Mail size={13} /></span>
            <span>Email to Channel</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info("Notification settings"); }}>
            <span className="clickup-menu-icon"><Bell size={13} /></span>
            <span>Notification settings</span>
          </div>
          <div className="clickup-menu-divider" />
          <div className="clickup-menu-item text-danger" onClick={() => { setMenuConfig(null); handleUnfollowChannel(conversation.id); }}>
            <span className="clickup-menu-icon"><BellOff size={13} /></span>
            <span>Unfollow</span>
          </div>
        </div>
      );
    }

    if (type === "dm-actions") {
      const conversation = data;
      let dmTitle = conversation.title;
      if (dmTitle === "Yourself") {
        dmTitle = `${user ? user.name : "Yourself"} — You`;
      }
      return (
        <div className="clickup-menu">
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); handleMarkUnread(conversation.id); }}>
            <span className="clickup-menu-icon"><Mail size={13} /></span>
            <span>Mark as unread</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); toast.info(`Viewing profile of ${dmTitle.replace(" — You", "")}`); }}>
            <span className="clickup-menu-icon"><User size={13} /></span>
            <span>View Profile</span>
          </div>
          <div className="clickup-menu-item" onClick={() => { setMenuConfig(null); handleToggleFavorite(conversation.id); }}>
            <span className="clickup-menu-icon"><Star size={13} className={favoriteConvoIds.includes(conversation.id) ? "text-warning" : ""} fill={favoriteConvoIds.includes(conversation.id) ? "currentColor" : "none"} /></span>
            <span>{favoriteConvoIds.includes(conversation.id) ? "Unfavorite" : "Favorite"}</span>
          </div>
          <div className="clickup-menu-divider" />
          <div className="clickup-menu-item text-danger" onClick={() => { setMenuConfig(null); handleCloseDM(conversation.id); }}>
            <span className="clickup-menu-icon"><XCircle size={13} /></span>
            <span>Close DM</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // Merge channels and department threads into one unified "Channels" list
  const allChannels = conversations.filter(
    (item) => (item.conversation_type === "channel" || item.conversation_type === "department") && !closedDmIds.includes(item.id)
  ).filter((conv, index, self) =>
    index === self.findIndex((c) => c.id === conv.id)
  );
  const directMessages = conversations.filter(
    (item) => item.conversation_type === "direct" && !closedDmIds.includes(item.id)
  ).filter((conv, index, self) =>
    index === self.findIndex((c) => c.id === conv.id)
  );
  const auditOnlyConversations = auditConversations.filter(
    (item) => !conversations.some((conversation) => conversation.id === item.id)
  );

  const renderConversationLink = (conversation, icon, extraClass = "") => {
    const isDirect = conversation.conversation_type === "direct";
    const isChannel = conversation.conversation_type === "channel" || conversation.conversation_type === "department";
    let dmTitle = conversation.title;
    if (isDirect && dmTitle === "Yourself") {
      dmTitle = `${user ? user.name : "Yourself"} — You`;
    }

    const initials = isDirect ? getInitials(dmTitle) : "";
    const avatarBg = isDirect ? getAvatarBg(dmTitle) : "";

    // Channel suffix initials square badge (Zbot style)
    let channelSuffixInitial = "";
    if (isChannel && dmTitle.includes("-")) {
      const parts = dmTitle.split("-");
      const suffix = parts[parts.length - 1].trim();
      if (suffix) {
        channelSuffixInitial = suffix.charAt(0).toUpperCase();
      }
    }

    return (
      <div 
        key={conversation.id} 
        className={`workspace-secondary-link-wrapper ${openDropdownConvoId === conversation.id ? "dropdown-open" : ""}`}
      >
        <Link
          to={`/admin/messaging?conversation=${conversation.id}`}
          className={`workspace-secondary-link ${
            activeConversationId === conversation.id ? "active" : ""
          } ${extraClass}`}
          style={{ paddingRight: (isDirect || isChannel) ? "30px" : "8px" }}
        >
          {isDirect ? (
            <div className="zbot-sidebar-avatar" style={{ backgroundColor: avatarBg }}>
              {initials}
              <span className={`avatar-status-dot ${dmTitle.includes("— You") ? "online" : "offline"}`}></span>
            </div>
          ) : isChannel && channelSuffixInitial ? (
            <span className="workspace-secondary-link-icon d-flex align-items-center">
              <Hash size={14} className="text-slate-400" />
              <span 
                className="zbot-channel-badge-square ms-1"
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  backgroundColor: "#0e9e73",
                  color: "#ffffff",
                  fontSize: "8.5px",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1
                }}
              >
                {channelSuffixInitial}
              </span>
            </span>
          ) : (
            <span className="workspace-secondary-link-icon">{icon}</span>
          )}
          <span className="workspace-secondary-link-text">
            <span className="workspace-secondary-link-title">{dmTitle}</span>
            {(conversation.unread_count > 0) && (
              <span className="workspace-secondary-link-meta">
                {`${conversation.unread_count} unread`}
              </span>
            )}
          </span>
        </Link>

        {(isDirect || isChannel) && (
          <button
            className="sidebar-dm-actions-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuConfig({
                type: isChannel ? "channel-actions" : "dm-actions",
                data: conversation,
                pos: { top: rect.bottom + 4, left: rect.right + 8 }
              });
            }}
          >
            <MoreHorizontal size={13} />
          </button>
        )}
      </div>
    );
  };

  // Tree helper
  const buildSpaceTree = (flatBoards) => {
    // Spaces (boards where parent_id is null and not a folder)
    const spaces = flatBoards.filter((b) => b.parent_id === null && !b.is_folder);
    
    // Legacy support: if there are boards with parent_id !== null but parent does not exist, treat them as spaces
    const boardIds = new Set(flatBoards.map((b) => b.id));
    const orphans = flatBoards.filter(
      (b) => b.parent_id !== null && !boardIds.has(b.parent_id) && !b.is_folder
    );
    
    const allSpaces = [...spaces, ...orphans].filter((item, index, self) =>
      index === self.findIndex((b) => b.id === item.id)
    );
    
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
                minWidth: 0,
                flexGrow: 1,
                flexShrink: 1,
                display: "block"
              }}
            >
              {list.name}
            </span>
            {list.tasks_count > 0 && (
              <span 
                className="ms-auto me-1 text-slate-500" 
                style={{ 
                  fontSize: "9px", 
                  fontWeight: "700", 
                  backgroundColor: "#e2e8f0", 
                  padding: "1px 6.5px", 
                  borderRadius: "999px",
                  lineHeight: "1.3"
                }}
              >
                {list.tasks_count}
              </span>
            )}
          </Link>

          <div className="workspace-tree-actions">
            <button
              className="workspace-tree-action-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuConfig({ type: "list-actions", data: list, pos: { top: rect.bottom + 4, left: rect.right + 8 } });
              }}
            >
              <MoreHorizontal size={13} className="text-slate-400 hover-purple" />
            </button>
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
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0, overflow: "hidden" }} onClick={(e) => toggleFolder(folder.id, e)}>
            <span className="text-slate-400 d-flex align-items-center justify-content-center" style={{ width: "14px", height: "14px", flexShrink: 0 }}>
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <span className="text-amber-500" style={{ flexShrink: 0 }}>
              {folder.is_private ? <Lock size={13} className="text-rose-500" /> : <Folder size={13} fill="#f59e0b" className="text-amber-500" />}
            </span>
            <span
              className="fw-semibold truncate-text"
              style={{ 
                fontSize: "11.5px", 
                color: "#4b5563",
                minWidth: 0,
                flexGrow: 1,
                flexShrink: 1,
                display: "block"
              }}
            >
              {folder.name}
            </span>
          </div>

          <div className="workspace-tree-actions d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
            <button
              className="workspace-tree-action-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuConfig({ type: "folder-create", data: folder, pos: { top: rect.bottom + 4, left: rect.right + 8 } });
              }}
            >
              <Plus size={13} className="text-slate-400 hover-purple" />
            </button>

            <button
              className="workspace-tree-action-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuConfig({ type: "folder-actions", data: folder, pos: { top: rect.bottom + 4, left: rect.right + 8 } });
              }}
            >
              <MoreHorizontal size={13} className="text-slate-400 hover-purple" />
            </button>
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
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0, overflow: "hidden" }} onClick={(e) => toggleSpace(space.id, e)}>
            <span className="text-slate-400 d-flex align-items-center justify-content-center" style={{ width: "16px", height: "16px", flexShrink: 0 }}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <span className="text-slate-500" style={{ fontSize: "14px", flexShrink: 0 }}>
              {space.icon || (space.is_private ? "🔒" : "📋")}
            </span>
            <Link
              to={`/admin/boards/${space.id}`}
              className="text-decoration-none text-slate-800 fw-bold truncate-text"
              style={{ 
                fontSize: "12px", 
                color: isSelected ? "#673de6" : "#374151",
                minWidth: 0,
                flexGrow: 1,
                flexShrink: 1,
                display: "block"
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {space.name}
            </Link>
          </div>

          <div className="workspace-tree-actions d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
            <button
              className="workspace-tree-action-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuConfig({ type: "space-create", data: space, pos: { top: rect.bottom + 4, left: rect.right + 8 } });
              }}
            >
              <Plus size={13} className="text-slate-400 hover-purple" />
            </button>

            <button
              className="workspace-tree-action-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuConfig({ type: "space-actions", data: space, pos: { top: rect.bottom + 4, left: rect.right + 8 } });
              }}
            >
              <MoreHorizontal size={13} className="text-slate-400 hover-purple" />
            </button>
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

      <div className="workspace-secondary-header" style={{ paddingBottom: "10px", borderBottom: "none" }}>
        <div>
          <h2 style={{ fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "#1e293b", margin: 0 }}>
            Home
            <ChevronDown size={12} className="text-slate-400" style={{ cursor: "pointer" }} />
          </h2>
        </div>
        <div className="d-flex align-items-center gap-1">
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
                  style={{ width: "24px", height: "24px", borderRadius: "6px", padding: 0 }}
                  title="Create New..."
                >
                  <Plus size={14} />
                </button>
              ))}>
                <Plus size={14} />
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-slate-200 rounded-xl py-2" style={{ width: "200px", zIndex: 1060 }} popperConfig={{ strategy: "fixed" }}>
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
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
      </div>

      <div className="workspace-secondary-body">
        {/* Home tree structure navigation (Zbot Style) */}
        <section className="workspace-secondary-section top-navigation-section" style={{ gap: "4px" }}>
          <div className="workspace-secondary-links">
            <Link
              to="/admin/inbox?tab=inbox"
              className={`workspace-secondary-link ${isInboxRoute && currentTab === "inbox" ? "active" : ""}`}
              style={{ padding: "4px 8px" }}
            >
              <span className="workspace-secondary-link-icon"><Inbox size={14} /></span>
              <span className="workspace-secondary-link-text">
                <span className="workspace-secondary-link-title" style={{ fontSize: "12px", fontWeight: "500" }}>Inbox</span>
              </span>
            </Link>

            <Link
              to="/admin/inbox?tab=replies"
              className={`workspace-secondary-link ${isInboxRoute && currentTab === "replies" ? "active" : ""}`}
              style={{ padding: "4px 8px" }}
            >
              <span className="workspace-secondary-link-icon"><Send size={14} style={{ transform: "rotate(180deg)" }} /></span>
              <span className="workspace-secondary-link-text">
                <span className="workspace-secondary-link-title" style={{ fontSize: "12px", fontWeight: "500" }}>Replies</span>
              </span>
            </Link>

            <Link
              to="/admin/inbox?tab=comments"
              className={`workspace-secondary-link ${isInboxRoute && currentTab === "comments" ? "active" : ""}`}
              style={{ padding: "4px 8px" }}
            >
              <span className="workspace-secondary-link-icon"><MessageSquare size={14} /></span>
              <span className="workspace-secondary-link-text">
                <span className="workspace-secondary-link-title" style={{ fontSize: "12px", fontWeight: "500" }}>Assigned Comments</span>
              </span>
            </Link>

            <Link
              to="/admin/docs"
              className={`workspace-secondary-link ${location.pathname === "/admin/docs" ? "active" : ""}`}
              style={{ padding: "4px 8px" }}
            >
              <span className="workspace-secondary-link-icon"><FileText size={14} /></span>
              <span className="workspace-secondary-link-text">
                <span className="workspace-secondary-link-title" style={{ fontSize: "12px", fontWeight: "500" }}>Docs</span>
              </span>
            </Link>

            {/* Collapsible My Tasks Tree Node */}
            <div>
              <div 
                className={`workspace-secondary-link ${isInboxRoute && currentTab === "home" ? "active" : ""}`}
                style={{ cursor: "pointer", padding: "4px 8px" }}
                onClick={(e) => {
                  setMyTasksExpanded(!myTasksExpanded);
                }}
              >
                <span className="workspace-secondary-link-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                  {myTasksExpanded ? <ChevronDown size={12} className="me-1 text-slate-400" /> : <ChevronRight size={12} className="me-1 text-slate-400" />}
                  <CheckSquare size={14} />
                </span>
                <span className="workspace-secondary-link-text ms-1">
                  <span className="workspace-secondary-link-title" style={{ fontSize: "12px", fontWeight: "500" }}>My Tasks</span>
                </span>
              </div>
              
              {myTasksExpanded && (
                <div style={{ marginLeft: "20px", borderLeft: "1px dashed #cbd5e1", paddingLeft: "8px", display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px" }}>
                  <Link
                    to="/admin/inbox?tab=home"
                    className="workspace-secondary-link py-1"
                    style={{ fontSize: "11px", padding: "3px 8px" }}
                  >
                    <span 
                      className="me-2" 
                      style={{ 
                        width: "12px", 
                        height: "12px", 
                        borderRadius: "50%", 
                        backgroundColor: "#c084fc", 
                        color: "#fff", 
                        fontSize: "8px", 
                        fontWeight: "700", 
                        display: "inline-flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {user?.name ? user.name[0].toUpperCase() : "M"}
                    </span>
                    <span className="workspace-secondary-link-title" style={{ fontSize: "11.5px", fontWeight: "500" }}>Assigned to me</span>
                  </Link>
                  <Link
                    to="/admin/inbox?tab=home"
                    className="workspace-secondary-link py-1"
                    style={{ fontSize: "11px", padding: "3px 8px" }}
                  >
                    <span className="workspace-secondary-link-icon me-2"><Calendar size={11} /></span>
                    <span className="workspace-secondary-link-title" style={{ fontSize: "11.5px", fontWeight: "500" }}>Today & Overdue</span>
                  </Link>
                </div>
              )}
            </div>
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
            {allChannels.map((conversation) =>
              renderConversationLink(conversation, <Hash size={15} />)
            )}
            {allChannels.length === 0 && <p className="workspace-empty-copy">No channels yet. Create one!</p>}
          </div>
        </section>

        <section className="workspace-secondary-section">
          <div className="workspace-secondary-section-header">
            <span>Direct Messages</span>
          </div>
          <div className="workspace-secondary-links">
            {directMessages.map((conversation) =>
              renderConversationLink(conversation, <MessageCircle size={15} />)
            )}
            {onNewMessage && (
              <button 
                type="button" 
                onClick={onNewMessage} 
                className="workspace-new-dm-btn"
              >
                <Plus size={14} />
                <span>New message</span>
              </button>
            )}
            {directMessages.length === 0 && !onNewMessage && (
              <p className="workspace-empty-copy">Start a new message to see it here.</p>
            )}
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

            {onCreateSpace && (
              <button 
                type="button" 
                onClick={onCreateSpace} 
                className="workspace-new-dm-btn"
                style={{ paddingLeft: "10px", marginTop: "4px" }}
              >
                <Plus size={14} />
                <span>New Space</span>
              </button>
            )}
          </div>
        </section>
      </div>

      {/* ClickUp-style floating context menu portal */}
      {menuConfig && createPortal(
        <>
          <div
            className="clickup-menu-backdrop"
            onClick={() => setMenuConfig(null)}
          />
          <div
            ref={menuRef}
            className="clickup-menu-portal"
            style={{
              position: "fixed",
              top: menuConfig.pos?.top || 0,
              left: menuConfig.pos?.left || 0,
              zIndex: 9999,
            }}
          >
            {renderMenuContent()}
          </div>
        </>,
        document.body
      )}
    </aside>
  );
};

export default WorkspaceSecondarySidebar;
