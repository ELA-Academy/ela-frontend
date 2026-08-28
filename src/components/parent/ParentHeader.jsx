import React, { useState } from "react";
import { Menu, ChevronDown, User, LogOut, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ParentHeader = ({ onToggleSidebar, activeStudent, onSelectStudent, childrenList = [] }) => {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="parent-header">
      <div className="d-flex align-items-center gap-2">
        <div className="parent-logo-badge d-md-none">
          <img
            src="/images/ELA-logo.png"
            alt="ELA Academy Logo"
            className="parent-sidebar-logo"
          />
        </div>
        <span className="parent-header-school-name d-md-none" style={{ fontSize: "0.92rem", fontWeight: 700 }}>
          ELA Academy
        </span>
        <span className="parent-header-school-name d-none d-md-inline">
          Exceptional Learning and Arts Academy
        </span>
      </div>

      <div className="parent-header-right">
        {/* Child Selector Dropdown */}
        {childrenList.length > 0 && (
          <div className="position-relative">
            <button
              onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
              className="parent-child-selector"
            >
              <span>
                {activeStudent ? activeStudent.name || `${activeStudent.first_name} ${activeStudent.last_name}` : "All Children"}
              </span>
              <ChevronDown size={14} />
            </button>

            {studentDropdownOpen && (
              <div
                className="position-absolute bg-white rounded-3 shadow-lg border p-1"
                style={{ top: "100%", right: 0, marginTop: "6px", minWidth: "180px", zIndex: 50 }}
              >
                <button
                  onClick={() => {
                    onSelectStudent(null);
                    setStudentDropdownOpen(false);
                  }}
                  className={`btn w-100 text-start px-3 py-2 rounded-2 border-0 ${
                    !activeStudent ? "bg-light font-weight-bold" : ""
                  }`}
                  style={{ fontSize: "0.82rem" }}
                >
                  All Children
                </button>
                {childrenList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectStudent(c);
                      setStudentDropdownOpen(false);
                    }}
                    className={`btn w-100 text-start px-3 py-2 rounded-2 border-0 ${
                      activeStudent?.id === c.id ? "bg-light font-weight-bold" : ""
                    }`}
                    style={{ fontSize: "0.82rem" }}
                  >
                    {c.name || `${c.first_name} ${c.last_name}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Profile Avatar & Dropdown */}
        <div className="position-relative">
          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="parent-avatar-badge"
            title={user?.name || "Parent"}
          >
            {getInitials(user?.name)}
          </div>

          {profileDropdownOpen && (
            <div
              className="position-absolute bg-white rounded-3 shadow-lg border p-2"
              style={{ top: "100%", right: 0, marginTop: "10px", minWidth: "220px", zIndex: 50 }}
            >
              <div className="px-3 py-2 border-bottom">
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                  {user?.name || "Parent Account"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {user?.email}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={logout}
                  className="btn w-100 text-start px-3 py-2 rounded-2 border-0 d-flex align-items-center gap-2 text-danger"
                  style={{ fontSize: "0.85rem", fontWeight: 600 }}
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ParentHeader;
