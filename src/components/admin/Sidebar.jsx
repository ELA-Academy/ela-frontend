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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Activity,
  UserPlus,
  DollarSign,
  BriefcaseBusiness
} from "lucide-react";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, unreadTasks } = useAuth();
  const [openSections, setOpenSections] = useState({
    core: true,
    departments: true,
    management: true,
    preferences: true
  });

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

  const filterLinks = (links) => links.filter((link) => link.role.includes(user?.role));
  const visibleDepartmentDashboards = departmentDashboardLinks.filter((link) => {
    if (user?.role === "superadmin") return true;
    return user?.dashboardRoutes?.includes(link.route);
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const NavItem = ({ to, icon: Icon, label, badgeCount, end = false, compact = false }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `sidebar-nav-item group relative flex items-center transition-all duration-150 ease-out no-underline ${
          isActive ? "sidebar-nav-active" : "sidebar-nav-inactive"
        } ${
          compact || collapsed
            ? "w-full min-h-[54px] flex-col justify-center gap-1 rounded-[12px]"
            : "w-full px-3 py-[9px] gap-3 rounded-[12px]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <Icon size={collapsed || compact ? 17 : 18} strokeWidth={isActive ? 2.2 : 1.8} />
            {badgeCount > 0 && (
              <span className="sidebar-count-badge">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </div>
          {collapsed || compact ? (
            <span className="sidebar-collapsed-label">{label}</span>
          ) : (
            <span className="sidebar-expanded-label">{label}</span>
          )}
        </>
      )}
    </NavLink>
  );

  const NavSection = ({ keyName, title, links }) => {
    if (!links.length) return null;
    const isOpen = openSections[keyName];

    return (
      <div className="sidebar-section">
        {!collapsed ? (
          <button className="sidebar-section-toggle" onClick={() => toggleSection(keyName)}>
            <span>{title}</span>
            <ChevronDown size={14} className={isOpen ? "rotate-0" : "-rotate-90"} />
          </button>
        ) : (
          <div className="sidebar-section-spacer" />
        )}

        {(collapsed || isOpen) && (
          <div className={`sidebar-section-items ${collapsed ? "collapsed-items" : ""}`}>
            {links.map((link) => (
              <NavItem
                key={link.path}
                to={link.path}
                icon={link.icon}
                label={link.label}
                badgeCount={link.badgeCount}
                end={link.end}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`sidebar h-screen flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 ${
        collapsed ? "w-[96px]" : "w-[260px]"
      }`}
    >
      <div className={`sidebar-header-shell ${collapsed ? "justify-center px-0" : "px-4"}`}>
        {!collapsed && <span className="sidebar-header-label">Navigation</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-collapse-btn"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      <div className={`sidebar-scroll ${collapsed ? "px-2" : "px-3"}`}>
        <nav className="sidebar-nav-shell">
          <NavSection keyName="core" title="Core" links={filterLinks(coreLinks)} />
          <NavSection keyName="departments" title="Departments" links={visibleDepartmentDashboards} />
          <NavSection keyName="management" title="Management" links={filterLinks(managementLinks)} />
          <NavSection keyName="preferences" title="Preferences" links={filterLinks(utilityLinks)} />
        </nav>
      </div>

      <div className={`sidebar-footer-shell ${collapsed ? "px-2" : "px-3"}`}>
        <NavLink
          to="/logout"
          className={() =>
            `sidebar-nav-item sidebar-nav-logout group relative flex items-center transition-all duration-150 ease-out no-underline ${
              collapsed
                ? "w-full min-h-[54px] flex-col justify-center gap-1 rounded-[12px]"
                : "w-full px-3 py-[9px] gap-3 rounded-[12px]"
            }`
          }
        >
          <LogOut size={17} className="flex-shrink-0" strokeWidth={1.8} />
          {collapsed ? (
            <span className="sidebar-collapsed-label">Logout</span>
          ) : (
            <span className="sidebar-expanded-label">Logout</span>
          )}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
