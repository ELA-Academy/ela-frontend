import React, { useState } from "react";
import { Search, UserPlus } from "lucide-react";

export default function SleekAssigneeSelector({
  selectedAssignees = [],
  members = [],
  currentUser = null,
  onToggleAssignee,
  onInviteEmail
}) {
  const [search, setSearch] = useState("");

  const getAssigneeKey = (m) => m.email || String(m.id || m._id);

  // Normalize selectedAssignees to array
  let selectedList = [];
  if (selectedAssignees) {
    if (Array.isArray(selectedAssignees)) {
      selectedList = selectedAssignees;
    } else {
      selectedList = [selectedAssignees];
    }
  }
  const selectedKeys = new Set(selectedList.map(getAssigneeKey));

  // Filter members based on search query
  const filteredMembers = (members || []).filter((m) => {
    if (!m) return false;
    const nameMatch = m.name?.toLowerCase().includes(search.toLowerCase());
    const emailMatch = m.email?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || emailMatch;
  });

  // Group members into assigned (Assignees) vs unassigned (People)
  const assignedList = filteredMembers.filter((m) => selectedKeys.has(getAssigneeKey(m)));
  const unassignedList = filteredMembers.filter((m) => !selectedKeys.has(getAssigneeKey(m)));

  const getAvatarInitials = (name = "") => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name = "") => {
    const colors = [
      "#f97316", // Orange
      "#3b82f6", // Blue
      "#6366f1", // Indigo
      "#10b981", // Emerald
      "#ec4899", // Pink
      "#8b5cf6", // Purple
      "#ef4444", // Red
      "#06b6d4", // Cyan
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="sleek-assignee-dropdown-container text-dark" onClick={(e) => e.stopPropagation()}>
      {/* Search Input Box */}
      <div className="sleek-search-container position-relative mb-2 px-2 pt-2">
        <Search size={13} className="sleek-search-icon text-slate-400 position-absolute" style={{ left: "18px", top: "18px" }} />
        <input
          type="text"
          className="form-control sleek-search-input py-1.5 text-dark"
          style={{ paddingLeft: "30px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          placeholder="Search or enter email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Scrollable list */}
      <div className="sleek-scrollable-list px-2 pb-2" style={{ maxHeight: "250px", overflowY: "auto" }}>
        
        {/* Assignees Header and List */}
        {assignedList.length > 0 && (
          <div className="sleek-group-section mb-2">
            <div className="sleek-group-header py-1 text-slate-400 fw-bold text-uppercase" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
              Assignees
            </div>
            <div className="d-flex flex-column gap-1">
              {assignedList.map((m) => {
                const isMe = currentUser && String(m.id || m._id) === String(currentUser.id || currentUser._id);
                const initials = getAvatarInitials(m.name);
                return (
                  <div
                    key={getAssigneeKey(m)}
                    className="sleek-assignee-item d-flex align-items-center gap-2 px-2 py-1.5 rounded cursor-pointer"
                    onClick={() => onToggleAssignee(m)}
                  >
                    {isMe ? (
                      <div className="sleek-avatar me-avatar d-flex align-items-center justify-content-center fw-bold" style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #6366f1", color: "#6366f1", fontSize: "10px" }}>
                        {initials}
                      </div>
                    ) : (
                      <div className="sleek-avatar d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: getAvatarColor(m.name), fontSize: "10px" }}>
                        {initials}
                      </div>
                    )}
                    <span className="sleek-item-name fw-semibold text-slate-800" style={{ fontSize: "12px" }}>
                      {isMe ? "Me" : m.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* People Header and List */}
        {unassignedList.length > 0 && (
          <div className="sleek-group-section mb-2">
            <div className="sleek-group-header py-1 text-slate-400 fw-bold text-uppercase" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
              People
            </div>
            <div className="d-flex flex-column gap-1">
              {unassignedList.map((m) => {
                const isMe = currentUser && String(m.id || m._id) === String(currentUser.id || currentUser._id);
                const initials = getAvatarInitials(m.name);
                return (
                  <div
                    key={getAssigneeKey(m)}
                    className="sleek-assignee-item d-flex align-items-center gap-2 px-2 py-1.5 rounded cursor-pointer"
                    onClick={() => onToggleAssignee(m)}
                  >
                    {isMe ? (
                      <div className="sleek-avatar me-avatar d-flex align-items-center justify-content-center fw-bold" style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #6366f1", color: "#6366f1", fontSize: "10px" }}>
                        {initials}
                      </div>
                    ) : (
                      <div className="sleek-avatar d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: getAvatarColor(m.name), fontSize: "10px" }}>
                        {initials}
                      </div>
                    )}
                    <span className="sleek-item-name text-slate-700" style={{ fontSize: "12px" }}>
                      {isMe ? "Me" : m.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invite button */}
        <div 
          className="sleek-assignee-item invite-btn d-flex align-items-center gap-2 px-2 py-1.5 rounded cursor-pointer mt-1"
          onClick={() => {
            if (onInviteEmail) onInviteEmail(search);
          }}
        >
          <div className="sleek-avatar d-flex align-items-center justify-content-center bg-light text-slate-600" style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px dashed #cbd5e1" }}>
            <UserPlus size={11} />
          </div>
          <span className="sleek-item-name fw-semibold text-slate-800" style={{ fontSize: "12px" }}>
            Invite people via email
          </span>
        </div>

      </div>
    </div>
  );
}
