import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  FileText
} from "lucide-react";

const ParentBottomNav = () => {
  const navItems = [
    { name: "Dashboard", path: "/parent/dashboard", icon: LayoutDashboard },
    { name: "Payments", path: "/parent/payments", icon: CreditCard },
    { name: "Family", path: "/parent/family", icon: Users },
    { name: "Documents", path: "/parent/documents", icon: FileText },
  ];

  return (
    <nav className="parent-bottom-nav d-md-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `parent-bottom-nav-item ${isActive ? "active" : ""}`
            }
          >
            <div className="parent-bottom-nav-icon-wrap">
              <Icon size={20} />
            </div>
            <span className="parent-bottom-nav-label">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default ParentBottomNav;
