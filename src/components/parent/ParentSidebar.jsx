import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  FileText,
  LogOut,
  X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ParentSidebar = ({ open, onClose }) => {
  const { logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/parent/dashboard", icon: LayoutDashboard },
    { name: "Payments", path: "/parent/payments", icon: CreditCard },
    { name: "Family List", path: "/parent/family", icon: Users },
    { name: "Documents", path: "/parent/documents", icon: FileText },
  ];

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            zIndex: 35,
          }}
          className="d-md-none"
        />
      )}

      <aside className={`parent-sidebar ${open ? "open" : ""}`}>
        <div className="parent-sidebar-header">
          <img
            src="/images/ELA-logo.png"
            alt="ELA Academy Logo"
            className="parent-sidebar-logo"
          />
          <button
            onClick={onClose}
            className="d-md-none ms-auto btn p-0 border-0 text-muted"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="parent-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `parent-nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="parent-sidebar-footer">
          <button
            onClick={logout}
            className="btn p-0 border-0 d-flex align-items-center gap-2 text-danger"
            style={{ fontSize: "0.85rem", fontWeight: 600 }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default ParentSidebar;
