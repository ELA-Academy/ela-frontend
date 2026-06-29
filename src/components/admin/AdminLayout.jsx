import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../context/AuthContext";
import { useTimer } from "../../context/TimerContext";
import { Play, Pause, Square } from "lucide-react";
import { subscribeUser } from "../../utils/push-notifications";
import "../../styles/AdminModern.css";

const AdminLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const {
    activeTimer,
    elapsedSeconds,
    pauseTimer,
    resumeTimer,
    stopTimer
  } = useTimer();

  useEffect(() => {
    if (isAuthenticated) {
      subscribeUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (
      user &&
      (location.pathname === "/admin" || location.pathname === "/admin/")
    ) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, navigate, location.pathname]);

  // Global premium tooltip interceptor and positioning handler
  useEffect(() => {
    let tooltipEl = document.getElementById("zbot-global-tooltip");
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.id = "zbot-global-tooltip";
      tooltipEl.className = "zbot-global-tooltip";
      document.body.appendChild(tooltipEl);
    }

    const handleMouseOver = (e) => {
      const target = e.target.closest("[title]");
      if (!target) return;

      const titleText = target.getAttribute("title");
      if (!titleText || target.tagName === "IFRAME") return;

      target.setAttribute("data-tooltip-text", titleText);
      target.removeAttribute("title");

      tooltipEl.innerText = titleText;
      tooltipEl.classList.add("show");

      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - tooltipEl.offsetWidth / 2;
      let y = rect.top - tooltipEl.offsetHeight - 8;

      if (y < 10) {
        y = rect.bottom + 8;
      }

      tooltipEl.style.left = `${Math.max(10, x + window.scrollX)}px`;
      tooltipEl.style.top = `${y + window.scrollY}px`;
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest("[data-tooltip-text]");
      if (!target) return;

      const titleText = target.getAttribute("data-tooltip-text");
      target.setAttribute("title", titleText);
      target.removeAttribute("data-tooltip-text");

      tooltipEl.classList.remove("show");
    };

    const handleScroll = () => {
      tooltipEl.classList.remove("show");
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleScroll, true);
      const el = document.getElementById("zbot-global-tooltip");
      if (el) el.remove();
    };
  }, []);

  const isWorkspacePage =
    location.pathname.startsWith("/admin/messaging") ||
    location.pathname.startsWith("/admin/boards") ||
    location.pathname.startsWith("/admin/inbox") ||
    location.pathname.startsWith("/admin/docs");

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="main-content">
        <Header collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <main
          className={isWorkspacePage ? "content-area-workspace" : "content-area"}
        >
          <Outlet />
        </main>
      </div>

      {/* Floating Dashboard Top Right Timer Widget */}
      {activeTimer && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "24px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid #e2e8f0",
            borderRadius: "9999px",
            padding: "6px 14px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 1000,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "11px",
            fontWeight: "600",
            color: "#1e293b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: activeTimer.isRunning ? "#6366f1" : "#f59e0b",
                animation: activeTimer.isRunning ? "pulse 1.5s infinite" : "none",
              }}
            />
            <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b" }}>
              {activeTimer.task.title}
            </span>
          </div>
          
          <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#0f172a", borderLeft: "1px solid #cbd5e1", paddingLeft: "8px" }}>
            {formatTime(elapsedSeconds)}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", borderLeft: "1px solid #cbd5e1", paddingLeft: "8px" }}>
            {activeTimer.isRunning ? (
              <button
                onClick={pauseTimer}
                style={{ background: "none", border: "none", padding: "3px", cursor: "pointer", color: "#475569" }}
                title="Pause"
              >
                <Pause size={11} />
              </button>
            ) : (
              <button
                onClick={resumeTimer}
                style={{ background: "none", border: "none", padding: "3px", cursor: "pointer", color: "#475569" }}
                title="Resume"
              >
                <Play size={11} fill="currentColor" />
              </button>
            )}
            <button
              onClick={stopTimer}
              style={{ background: "none", border: "none", padding: "3px", cursor: "pointer", color: "#ef4444" }}
              title="Stop & Log"
            >
              <Square size={10} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
