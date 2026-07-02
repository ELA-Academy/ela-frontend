import React, { useState } from "react";
import { Search, Check, MoreHorizontal } from "lucide-react";

export default function SleekStatusSelector({
  currentStatus = "",
  customStatuses = [],
  onSelectStatus,
  onEditStatuses
}) {
  const [search, setSearch] = useState("");

  const statusList = customStatuses && customStatuses.length > 0
    ? customStatuses
    : [
        { id: "Not Started", label: "To do", color: "#7c8798", type: "Not Started" },
        { id: "In Progress", label: "In progress", color: "#6d45f7", type: "Active" },
        { id: "Done", label: "Complete", color: "#00b67a", type: "Done" }
      ];

  // Grouping status list into Not Started, Active, Done, Closed
  const getGroups = () => {
    const groups = {
      notStarted: [],
      active: [],
      done: [],
      closed: []
    };

    statusList.forEach((s) => {
      // Filter by search query if any
      const labelText = (s.label || s.id).toLowerCase();
      if (search && !labelText.includes(search.toLowerCase())) {
        return;
      }

      const type = s.type || "";
      if (type === "Not Started" || labelText === "to do" || labelText === "not started") {
        groups.notStarted.push(s);
      } else if (type === "Done" || labelText === "complete" || labelText === "closed" || labelText === "done") {
        if (labelText === "complete" || labelText === "closed") {
          groups.closed.push(s);
        } else {
          groups.done.push(s);
        }
      } else {
        groups.active.push(s);
      }
    });

    // Fallback logic to ensure Closed group has at least one status if Done is set
    if (groups.closed.length === 0 && groups.done.length > 0) {
      const lastDone = groups.done.pop();
      groups.closed.push(lastDone);
    }

    return groups;
  };

  const groups = getGroups();

  const renderStatusRow = (statusObj, iconType) => {
    const isSelected = String(statusObj.id).toLowerCase() === String(currentStatus).toLowerCase();
    
    // Choose bullet icon based on state type
    let bulletElement = null;
    if (iconType === "dashed") {
      bulletElement = <div className="status-dot-dashed" style={{ borderColor: statusObj.color }} />;
    } else if (iconType === "double") {
      bulletElement = (
        <div className="status-dot-double" style={{ border: `2.5px solid ${statusObj.color}`, color: statusObj.color }} />
      );
    } else if (iconType === "hollow") {
      bulletElement = (
        <svg className="status-dot-check-hollow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusObj.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="16 12 12 16 8 12" />
        </svg>
      );
    } else if (iconType === "filled") {
      bulletElement = (
        <svg className="status-dot-check-filled" width="14" height="14" viewBox="0 0 24 24" fill={statusObj.color}>
          <circle cx="12" cy="12" r="12" />
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#fff" />
        </svg>
      );
    }

    return (
      <div
        key={statusObj.id}
        className={`sleek-status-item d-flex align-items-center justify-content-between px-2 py-1.5 rounded cursor-pointer ${isSelected ? "active-status" : ""}`}
        onClick={() => onSelectStatus(statusObj.id)}
      >
        <div className="d-flex align-items-center gap-2">
          {bulletElement}
          <span className="sleek-status-label fw-bold text-slate-800" style={{ fontSize: "11.5px", letterSpacing: "0.2px" }}>
            {(statusObj.label || statusObj.id).toUpperCase()}
          </span>
        </div>
        {isSelected && <Check size={14} className="text-slate-800 fw-bold" />}
      </div>
    );
  };

  return (
    <div className="sleek-status-dropdown-container text-dark" onClick={(e) => e.stopPropagation()}>
      {/* Search Input Box */}
      <div className="sleek-search-container position-relative mb-2 px-2 pt-2">
        <Search size={13} className="sleek-search-icon text-slate-400 position-absolute" style={{ left: "18px", top: "18px" }} />
        <input
          type="text"
          className="form-control sleek-search-input py-1.5 text-dark"
          style={{ paddingLeft: "30px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Scrollable list */}
      <div className="sleek-scrollable-list px-2 pb-2" style={{ maxHeight: "280px", overflowY: "auto" }}>
        
        {/* Not Started Group */}
        {groups.notStarted.length > 0 && (
          <div className="sleek-group-section mb-2">
            <div className="sleek-group-header d-flex align-items-center justify-content-between py-1 text-slate-400 fw-bold" style={{ fontSize: "10.5px" }}>
              <span>Not started</span>
              {onEditStatuses && <MoreHorizontal size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={onEditStatuses} />}
            </div>
            <div className="d-flex flex-column gap-0.5">
              {groups.notStarted.map((s) => renderStatusRow(s, "dashed"))}
            </div>
          </div>
        )}

        {/* Active Group */}
        {groups.active.length > 0 && (
          <div className="sleek-group-section mb-2">
            <div className="sleek-group-header d-flex align-items-center justify-content-between py-1 text-slate-400 fw-bold" style={{ fontSize: "10.5px" }}>
              <span>Active</span>
              {onEditStatuses && <MoreHorizontal size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={onEditStatuses} />}
            </div>
            <div className="d-flex flex-column gap-0.5">
              {groups.active.map((s) => renderStatusRow(s, "double"))}
            </div>
          </div>
        )}

        {/* Done Group */}
        {groups.done.length > 0 && (
          <div className="sleek-group-section mb-2">
            <div className="sleek-group-header d-flex align-items-center justify-content-between py-1 text-slate-400 fw-bold" style={{ fontSize: "10.5px" }}>
              <span>Done</span>
              {onEditStatuses && <MoreHorizontal size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={onEditStatuses} />}
            </div>
            <div className="d-flex flex-column gap-0.5">
              {groups.done.map((s) => renderStatusRow(s, "hollow"))}
            </div>
          </div>
        )}

        {/* Closed Group */}
        {groups.closed.length > 0 && (
          <div className="sleek-group-section mb-2">
            <div className="sleek-group-header d-flex align-items-center justify-content-between py-1 text-slate-400 fw-bold" style={{ fontSize: "10.5px" }}>
              <span>Closed</span>
              {onEditStatuses && <MoreHorizontal size={12} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={onEditStatuses} />}
            </div>
            <div className="d-flex flex-column gap-0.5">
              {groups.closed.map((s) => renderStatusRow(s, "filled"))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
