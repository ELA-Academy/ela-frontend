import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  GraduationCap,
  Users,
  Building2,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  Activity,
  UserPlus,
  DollarSign,
  BriefcaseBusiness
} from "lucide-react";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, unreadTasks } = useAuth();
  const [hoveredLink, setHoveredLink] = useState(null);

  const coreLinks = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", role: ["superadmin", "staff"], end: true },
    { path: "/admin/boards", icon: FolderKanban, label: "Workspace", role: ["superadmin", "staff"] },
    { path: "/admin/tasks", icon: ClipboardCheck, label: "My Tasks", role: ["superadmin", "staff"], badgeCount: unreadTasks }
  ];

  const departmentDashboardLinks = [
    { path: "/admin/admissions", icon: UserPlus, label: "Admissions", route: "/admin/admissions" },
    { path: "/admin/accounting", icon: DollarSign, label: "Accounting", route: "/admin/accounting" },
    { path: "/admin/administration", icon: BriefcaseBusiness, label: "Administration", route: "/admin/administration" }
  ];

  const managementLinks = [
    { path: "/admin/students", icon: GraduationCap, label: "Students", role: ["superadmin", "staff"] },
    { path: "/admin/super-admins", icon: ShieldCheck, label: "Super Admins", role: ["superadmin"] },
    { path: "/admin/staff", icon: Users, label: "Manage Staff", role: ["superadmin"] },
    { path: "/admin/departments", icon: Building2, label: "Departments", role: ["superadmin"] },
    { path: "/admin/activity-feed", icon: Activity, label: "Activity Feed", role: ["superadmin"] }
  ];

  const utilityLinks = [
    { path: "/admin/profile", icon: User, label: "Profile", role: ["superadmin", "staff"] },
    { path: "/admin/settings", icon: Settings, label: "Settings", role: ["superadmin", "staff"] }
  ];

  const activeLinks = [];

  // Core Links
  coreLinks.forEach((link) => {
    if (link.role.includes(user?.role)) {
      activeLinks.push(link);
    }
  });

  // Department Dashboards
  departmentDashboardLinks.forEach((link) => {
    if (user?.role === "superadmin" || user?.dashboardRoutes?.includes(link.route)) {
      activeLinks.push({ ...link, role: ["superadmin", "staff"] });
    }
  });

  // Management Links
  managementLinks.forEach((link) => {
    if (link.role.includes(user?.role)) {
      activeLinks.push(link);
    }
  });

  // Utility Links
  utilityLinks.forEach((link) => {
    if (link.role.includes(user?.role)) {
      activeLinks.push(link);
    }
  });

  const userInitial = user?.name ? user.name.substring(0, 2).toUpperCase() : "ZB";

  const handleMouseEnter = (e, label) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sidebar = document.querySelector(".sidebar");
    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { top: 0 };
    setHoveredLink({
      label,
      top: rect.top - sidebarRect.top + rect.height / 2
    });
  };

  const handleMouseLeave = () => {
    setHoveredLink(null);
  };

  const NavItem = ({ to, icon: Icon, label, badgeCount, end = false }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `sidebar-nav-item group relative flex flex-col items-center justify-center gap-1 w-full py-2.5 transition-all duration-150 ease-out no-underline ${
          isActive ? "sidebar-nav-active" : "sidebar-nav-inactive"
        }`
      }
      onMouseEnter={(e) => handleMouseEnter(e, label)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <Icon size={20} strokeWidth={2.0} />
        {badgeCount > 0 && (
          <span className="sidebar-count-badge">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </div>
      <span className="sidebar-label">{label}</span>
    </NavLink>
  );

  return (
    <aside className="sidebar h-screen flex flex-col flex-shrink-0 w-[60px] select-none" style={{ position: "relative" }}>
      <div className="sidebar-header-zbot">
        <div className="sidebar-avatar-logo">
          {userInitial}
        </div>
      </div>

      <div className="sidebar-scroll-zbot">
        <nav className="sidebar-nav-shell-zbot">
          {activeLinks.map((link) => (
            <NavItem
              key={link.path}
              to={link.path}
              icon={link.icon}
              label={link.label}
              badgeCount={link.badgeCount}
              end={link.end}
            />
          ))}
        </nav>
      </div>

      <div className="sidebar-footer-zbot">
        <NavLink
          to="/logout"
          className="sidebar-nav-item sidebar-nav-logout-zbot group relative flex flex-col items-center justify-center gap-1 w-full py-2.5 no-underline"
          onMouseEnter={(e) => handleMouseEnter(e, "Logout")}
          onMouseLeave={handleMouseLeave}
        >
          <LogOut size={20} strokeWidth={2.0} />
          <span className="sidebar-label">Logout</span>
        </NavLink>
      </div>

      {hoveredLink && (
        <div
          className="sidebar-tooltip-zbot-portal"
          style={{ top: `${hoveredLink.top}px` }}
        >
          {hoveredLink.label}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
