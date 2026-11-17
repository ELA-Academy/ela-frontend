import React, { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  CircleDollarSign,
  BarChart2,
  Landmark,
  Clock,
  FileText,
  DollarSign,
  Plus,
  Receipt,
  ChevronRight,
  Calendar,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { Modal, Button, Form } from "react-bootstrap";
import { useAuth } from "../../../context/AuthContext";
import "../../../styles/WorkspaceShell.css";

const PayrollLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Secondary sidebar resizer states & logic (flush and resizable like Workspace)
  const shellRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [secondaryCollapsed, setSecondaryCollapsed] = useState(false);

  // Shortcut Modal State (No window.alert)
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);
  const [shortcutName, setShortcutName] = useState("");
  const [shortcutUrl, setShortcutUrl] = useState("");
  const [customShortcuts, setCustomShortcuts] = useState([
    { name: "Monthly Wage Summary", url: "/admin/payroll/reports" },
    { name: "Contractor 1099 Forms", url: "/admin/payroll/taxes" }
  ]);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (!shellRef.current) return;
      const shellRect = shellRef.current.getBoundingClientRect();
      const newWidth = e.clientX - shellRect.left;
      if (newWidth >= 180 && newWidth <= 450) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleAddShortcut = (e) => {
    e.preventDefault();
    if (!shortcutName.trim()) return;
    setCustomShortcuts((prev) => [
      ...prev,
      { name: shortcutName.trim(), url: shortcutUrl.trim() || "/admin/payroll/reports" }
    ]);
    setShortcutName("");
    setShortcutUrl("");
    setShortcutModalOpen(false);
  };

  // Secondary sidebar links matching user requirement:
  // [Home, People, pay, report, taxes & compliance, time & attendance, Documents, Money]
  const navItems = [
    { path: "/admin/payroll", label: "Home", icon: Home, end: true },
    { path: "/admin/payroll/people", label: "People", icon: Users },
    {
      path: "/admin/payroll/pay",
      label: "Pay",
      icon: CircleDollarSign,
      children: [
        { path: "/admin/payroll/pay?tab=expenses", label: "Expenses", icon: Receipt }
      ]
    },
    { path: "/admin/payroll/reports", label: "Reports", icon: BarChart2 },
    { path: "/admin/payroll/taxes", label: "Taxes & compliance", icon: Landmark },
    { path: "/admin/payroll/time-attendance", label: "Time & attendance", icon: Clock },
    { path: "/admin/payroll/documents", label: "Documents", icon: FileText },
    { path: "/admin/payroll/money", label: "Money", icon: DollarSign },
  ];

  return (
    <div
      ref={shellRef}
      className={`workspace-shell ${secondaryCollapsed ? "secondary-collapsed" : ""}`}
      style={{ "--sidebar-width": `${sidebarWidth}px` }}
    >
      {secondaryCollapsed && (
        <button
          type="button"
          className="secondary-sidebar-expand-btn"
          onClick={() => setSecondaryCollapsed(false)}
          title="Expand Payroll Sidebar"
        >
          <PanelLeftOpen size={15} />
        </button>
      )}
      {/* Secondary Sidebar for Payroll (Standard Hostinger-style Workspace Shell) */}
      <aside className="workspace-secondary-sidebar">
        <div className="workspace-secondary-header">
          <div>
            <div className="workspace-secondary-eyebrow">DEPARTMENT</div>
            <h2>Payroll</h2>
          </div>
          <button
            type="button"
            className="secondary-sidebar-collapse-btn"
            onClick={() => setSecondaryCollapsed(true)}
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>

        <div className="workspace-secondary-body">
          <div className="workspace-secondary-section">
            <div className="workspace-secondary-section-header">
              <span>NAVIGATION</span>
            </div>
            <div className="workspace-secondary-links">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = item.end
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <div key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      className={({ isActive }) => `workspace-secondary-link ${isActive ? "active" : ""}`}
                    >
                      <Icon className="workspace-secondary-link-icon" />
                      <span className="workspace-secondary-link-title">{item.label}</span>
                    </NavLink>

                    {/* Expandable nested child like Expenses under Pay */}
                    {item.children && isItemActive && (
                      <div className="d-flex flex-column gap-0.5 ps-4 mt-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = child.path.includes("?")
                            ? location.pathname === child.path.split("?")[0] && location.search.includes(child.path.split("?")[1])
                            : location.pathname === child.path || (child.path.endsWith("/time-tracking") && (location.pathname.startsWith("/admin/payroll/time-attendance/time-tracking") || location.pathname.startsWith("/admin/payroll/time-attendance/timesheets")));
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`workspace-secondary-link ${isChildActive ? "active" : ""}`}
                              style={{ padding: "6px 10px" }}
                            >
                              <ChildIcon className="workspace-secondary-link-icon" style={{ width: "15px", height: "15px" }} />
                              <span className="workspace-secondary-link-title" style={{ fontSize: "13px" }}>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="workspace-secondary-section mt-3">
            <div className="workspace-secondary-section-header">
              <span>SHORTCUTS</span>
              <button
                type="button"
                onClick={() => setShortcutModalOpen(true)}
                title="Add Shortcut"
              >
                <Plus size={13} />
              </button>
            </div>
            <div className="workspace-secondary-links">
              {customShortcuts.map((sc, i) => (
                <Link
                  key={i}
                  to={sc.url}
                  className="workspace-secondary-link"
                  style={{ padding: "6px 10px" }}
                >
                  <span className="workspace-secondary-link-title" style={{ fontSize: "13px" }}>• {sc.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Resizer Handle (Same as Workspace layout) */}
      <div
        className={`sidebar-resizer ${isResizing ? "resizing" : ""}`}
        onMouseDown={startResizing}
        style={{
          width: "4px",
          cursor: "col-resize",
          backgroundColor: isResizing ? "#2563eb" : "transparent",
          transition: "background-color 0.15s ease",
          zIndex: 10
        }}
      />

      {/* Main Content Pane */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "1.75rem 2.25rem",
          overflowY: "auto",
          backgroundColor: "#ffffff",
          height: "100%"
        }}
      >
        <Outlet />
      </main>

      {/* Add Shortcut Modal (Replaces window.alert) */}
      <Modal show={shortcutModalOpen} onHide={() => setShortcutModalOpen(false)} centered>
        <Modal.Header closeButton className="border-b border-slate-100">
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
            Add Custom Shortcut
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddShortcut}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Shortcut Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Weekly Contractor Audit"
                value={shortcutName}
                onChange={(e) => setShortcutName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-semibold text-slate-700">Page Link / URL</Form.Label>
              <Form.Select value={shortcutUrl} onChange={(e) => setShortcutUrl(e.target.value)}>
                <option value="/admin/payroll/pay">Pay Dashboard</option>
                <option value="/admin/payroll/people">People & Contractors</option>
                <option value="/admin/payroll/reports">Reports & Analytics</option>
                <option value="/admin/payroll/taxes">Taxes & 1099</option>
                <option value="/admin/payroll/documents">Documents Repository</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-t border-slate-100">
            <Button variant="light" size="sm" onClick={() => setShortcutModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
              Add Shortcut
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PayrollLayout;
