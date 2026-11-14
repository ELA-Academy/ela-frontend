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
  X
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
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);

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
      className="workspace-shell"
      style={{
        display: "grid",
        gridTemplateColumns: `${sidebarWidth}px 4px minmax(0, 1fr)`,
        minHeight: "calc(100vh - 70px)",
        height: "calc(100vh - 70px)",
        alignItems: "stretch",
        backgroundColor: "#ffffff",
        overflow: "hidden"
      }}
    >
      {/* Secondary Sidebar for Payroll (Tight, flush, ELA Blue theme) */}
      <aside
        style={{
          borderRight: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1rem 0.65rem",
          boxSizing: "border-box",
          overflowY: "auto",
          height: "100%"
        }}
      >
        <div>
          {/* Brand area with ELA Logo & Blue Heading */}
          <div
            style={{
              padding: "0.25rem 0.5rem 0.85rem",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: "0.65rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <img
              src="/images/ELA-logo.png"
              alt="ELA Academy"
              style={{ height: "24px", width: "auto", objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#1e3a8a",
                letterSpacing: "-0.02em"
              }}
            >
              Payroll
            </span>
          </div>

          {/* Navigation group */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = item.end
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <div key={item.path}>
                  <NavLink
                    to={item.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.55rem 0.75rem",
                      fontSize: "0.875rem",
                      fontWeight: isItemActive ? 600 : 500,
                      color: isItemActive ? "#1d4ed8" : "#4b5563",
                      backgroundColor: isItemActive ? "#eff6ff" : "transparent",
                      borderRadius: "8px",
                      textDecoration: "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: isItemActive ? "#2563eb" : "#6b7280" }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </NavLink>

                  {/* Expandable nested child like Expenses under Pay */}
                  {item.children && isItemActive && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", paddingLeft: "1.75rem", marginTop: "0.2rem" }}>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.search.includes("tab=expenses");
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.4rem 0.6rem",
                              fontSize: "0.8rem",
                              fontWeight: isChildActive ? 600 : 500,
                              color: isChildActive ? "#1d4ed8" : "#64748b",
                              backgroundColor: isChildActive ? "#dbeafe" : "transparent",
                              borderRadius: "6px",
                              textDecoration: "none"
                            }}
                          >
                            <ChildIcon className="w-3.5 h-3.5" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom shortcuts & Company pill */}
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.2rem 0.4rem" }}>
            <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
              Shortcuts
            </span>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px"
              }}
              onClick={() => setShortcutModalOpen(true)}
            >
              Add
            </button>
          </div>

          {/* Quick shortcuts list */}
          {customShortcuts.map((sc, i) => (
            <Link
              key={i}
              to={sc.url}
              style={{
                fontSize: "0.775rem",
                color: "#64748b",
                textDecoration: "none",
                padding: "0.25rem 0.4rem",
                borderRadius: "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              className="hover:bg-slate-50 hover:text-blue-600"
            >
              • {sc.name}
            </Link>
          ))}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 0.5rem",
              borderRadius: "6px",
              backgroundColor: "#f8fafc",
              border: "1px solid #f1f5f9",
              fontSize: "0.8rem",
              color: "#334155",
              marginTop: "0.25rem"
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "4px",
                backgroundColor: "#dbeafe",
                color: "#1e40af",
                fontWeight: 700,
                fontSize: "0.7rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ELA
            </div>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>
              ELA Academy LLC
            </span>
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
