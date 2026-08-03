import React, { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, NavLink, Link, useOutletContext, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap } from "lucide-react";
import { getAllLeads } from "../../../services/admissionsService";
import "../../../styles/WorkspaceShell.css";

const AdmissionsLayout = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllLeads();
      setLeads(data || []);
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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

  const recentLeads = leads.slice(0, 8);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Waitlisted': return '#f59e0b';
      case 'Interested': return '#3b82f6';
      case 'Toured': return '#8b5cf6';
      case 'Admitted': return '#10b981';
      case 'Enrolled': return '#059669';
      default: return '#94a3b8';
    }
  };

  const getLeadName = (lead) => {
    if (lead.students && lead.students.length > 0) {
      return lead.students.map(s => `${s.first_name} ${s.last_name}`).join(', ');
    }
    return "Unknown Student";
  };

  const contextValue = { leads, loading, refreshLeads: fetchLeads };

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
              Admissions
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
                to="/admin/admissions" 
                end
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <span className="workspace-secondary-link-icon"><LayoutDashboard size={15} /></span>
                <span className="workspace-secondary-link-text">
                  <span className="workspace-secondary-link-title">Dashboard</span>
                </span>
              </NavLink>

              <NavLink 
                to="/admin/admissions/leads"
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <span className="workspace-secondary-link-icon"><Users size={15} /></span>
                <span className="workspace-secondary-link-text">
                  <span className="workspace-secondary-link-title">All Leads</span>
                </span>
              </NavLink>

              <NavLink 
                to="/admin/students"
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <span className="workspace-secondary-link-icon"><GraduationCap size={15} /></span>
                <span className="workspace-secondary-link-text">
                  <span className="workspace-secondary-link-title">Students</span>
                </span>
              </NavLink>
            </div>
          </section>

          <section className="workspace-secondary-section">
            <div className="workspace-secondary-section-header">
              <span>RECENT LEADS</span>
            </div>
            <div className="workspace-secondary-links">
              {loading ? (
                <div style={{ padding: "8px 12px", fontSize: "12px", color: "#64748b" }}>Loading leads...</div>
              ) : recentLeads.length > 0 ? (
                recentLeads.map(lead => (
                  <Link 
                    key={lead.id}
                    to={`/admin/admissions/leads/${lead.secure_token}`}
                    className={`workspace-secondary-link ${location.pathname.includes(lead.secure_token) ? 'active' : ''}`}
                  >
                    <span className="workspace-secondary-link-icon" style={{ display: 'flex', alignItems: 'center' }}>
                      <span 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: getStatusColor(lead.status) 
                        }} 
                      />
                    </span>
                    <span className="workspace-secondary-link-text">
                      <span className="workspace-secondary-link-title">{getLeadName(lead)}</span>
                    </span>
                  </Link>
                ))
              ) : (
                <div style={{ padding: "8px 12px", fontSize: "12px", color: "#64748b" }}>No recent leads</div>
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

export default AdmissionsLayout;

export const useAdmissions = () => {
  return useOutletContext();
};
