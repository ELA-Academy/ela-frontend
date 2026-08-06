import React, { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, NavLink, Link, useOutletContext, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Building2, ShieldCheck, Activity, FileText } from "lucide-react";
import { getActivityLogs } from "../../../services/activityService";
import { useAuth } from "../../../context/AuthContext";
import "../../../styles/WorkspaceShell.css";

const AdministrationLayout = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActivityLogs();
      setLogs(data || []);
    } catch (error) {
      console.error("Failed to fetch activity logs", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Resizer logic
  const shellRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(255);
  const [isResizing, setIsResizing] = useState(false);

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
      if (newWidth >= 180 && newWidth <= 600) {
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

  const recentLogs = logs.slice(0, 8);

  const contextValue = { logs, loading, refreshLogs: fetchLogs };

  return (
    <div 
      ref={shellRef}
      className="workspace-shell"
      style={{ "--sidebar-width": `${sidebarWidth}px` }}
    >
      <aside className="workspace-secondary-sidebar">
        <div className="workspace-secondary-header">
          <div>
            <div className="workspace-secondary-eyebrow">DEPARTMENT</div>
            <h2 style={{ fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "#1e293b", margin: 0 }}>
              Administration
            </h2>
          </div>
        </div>

        <div className="workspace-secondary-body">
          <section className="workspace-secondary-section">
            <div className="workspace-secondary-section-header">
              <span>NAVIGATION</span>
            </div>
            <div className="workspace-secondary-links">
              <NavLink 
                to="/admin/administration" 
                end
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <span className="workspace-secondary-link-icon"><LayoutDashboard size={15} /></span>
                <span className="workspace-secondary-link-text">
                  <span className="workspace-secondary-link-title">Overview</span>
                </span>
              </NavLink>

              <NavLink 
                to="/admin/administration/staff"
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <span className="workspace-secondary-link-icon"><Users size={15} /></span>
                <span className="workspace-secondary-link-text">
                  <span className="workspace-secondary-link-title">Staff Database</span>
                </span>
              </NavLink>

              {user?.role === "superadmin" && (
                <>
                  <NavLink 
                    to="/admin/administration/departments"
                    className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="workspace-secondary-link-icon"><Building2 size={15} /></span>
                    <span className="workspace-secondary-link-text">
                      <span className="workspace-secondary-link-title">Departments</span>
                    </span>
                  </NavLink>

                  <NavLink 
                    to="/admin/administration/super-admins"
                    className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="workspace-secondary-link-icon"><ShieldCheck size={15} /></span>
                    <span className="workspace-secondary-link-text">
                      <span className="workspace-secondary-link-title">Super Admins</span>
                    </span>
                  </NavLink>

                  <NavLink 
                    to="/admin/administration/activity-feed"
                    className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="workspace-secondary-link-icon"><Activity size={15} /></span>
                    <span className="workspace-secondary-link-text">
                      <span className="workspace-secondary-link-title">Activity Feed</span>
                    </span>
                  </NavLink>
                </>
              )}

              <NavLink 
                to="/admin/administration/message-log"
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <span className="workspace-secondary-link-icon"><FileText size={15} /></span>
                <span className="workspace-secondary-link-text">
                  <span className="workspace-secondary-link-title">Message Log</span>
                </span>
              </NavLink>
            </div>
          </section>

          <section className="workspace-secondary-section">
            <div className="workspace-secondary-section-header">
              <span>RECENT ACTIVITY</span>
            </div>
            <div className="workspace-secondary-links">
              {loading ? (
                <div style={{ padding: "8px 12px", fontSize: "11px", color: "#64748b" }}>Loading logs...</div>
              ) : recentLogs.length > 0 ? (
                recentLogs.map(log => (
                  <div 
                    key={log.id}
                    className="workspace-secondary-link"
                    style={{ cursor: "default" }}
                  >
                    <span className="workspace-secondary-link-text">
                      <span className="workspace-secondary-link-title" style={{ fontSize: "11px", whiteSpace: "normal" }}>
                        <strong>{log.actor_name}</strong> {log.action}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "8px 12px", fontSize: "11px", color: "#64748b" }}>No recent activity</div>
              )}
            </div>
          </section>
        </div>
      </aside>

      <div 
        className={`sidebar-resizer ${isResizing ? "resizing" : ""}`}
        onMouseDown={startResizing}
      />

      <div className="workspace-content-pane">
        <Outlet context={contextValue} />
      </div>
    </div>
  );
};

export default AdministrationLayout;

export const useAdministration = () => {
  return useOutletContext();
};
