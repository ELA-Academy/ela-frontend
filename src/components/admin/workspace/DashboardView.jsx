import React, { useMemo, useState } from "react";
import { ChevronDown, CheckSquare, Clock, User, AlertCircle, BarChart3, Settings } from "lucide-react";
import { Dropdown, Form } from "react-bootstrap";
import "../../../styles/Boards.css";

const DashboardView = ({ board, assignees, onTaskClick }) => {
  // Available widgets toggle states
  const [visibleWidgets, setVisibleWidgets] = useState({
    stats: true,
    statusBreakdown: true,
    assigneeDistribution: true,
    overdueTasks: true,
    prioritySummary: true
  });

  const allTasks = useMemo(() => {
    if (!board?.groups) return [];
    return board.groups.flatMap((group) =>
      group.tasks.map((task) => ({
        ...task,
        group_id: group.id,
        group_name: group.name,
        group_color: group.color,
      }))
    );
  }, [board]);

  // Calculations
  const stats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "Done").length;
    const inProgress = allTasks.filter((t) => t.status === "In Progress").length;
    const todo = allTasks.filter((t) => t.status === "Not Started").length;
    const progress = total ? Math.round((completed / total) * 100) : 0;

    const urgentCount = allTasks.filter(t => t.priority === "Urgent" && t.status !== "Done").length;
    const highCount = allTasks.filter(t => t.priority === "High" && t.status !== "Done").length;

    const overdue = allTasks.filter((t) => {
      if (!t.due_date || t.status === "Done") return false;
      return new Date(`${t.due_date}T23:59:59`) < new Date();
    });

    return { total, completed, inProgress, todo, progress, urgentCount, highCount, overdue };
  }, [allTasks]);

  // Tasks by assignee
  const assigneeData = useMemo(() => {
    const counts = {};
    allTasks.forEach((t) => {
      const name = t.assignee_name || "Unassigned";
      counts[name] = (counts[name] || 0) + 1;
    });

    const palette = ["#673de6", "#00ca72", "#ff9f1a", "#ff59a3", "#1a73e8", "#ff3860"];
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percentage: stats.total ? Math.round((count / stats.total) * 100) : 0,
      color: palette[idx % palette.length]
    })).sort((a, b) => b.count - a.count);
  }, [allTasks, stats.total]);

  // Assignee Chart Conic Gradient
  const assigneeChartBg = useMemo(() => {
    if (!assigneeData.length) return "#e5e7eb";
    let current = 0;
    const stops = assigneeData.map((entry) => {
      const start = current;
      const sweep = (entry.count / stats.total) * 360;
      current += sweep;
      return `${entry.color} ${start}deg ${current}deg`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [assigneeData, stats.total]);

  const toggleWidget = (widgetKey) => {
    setVisibleWidgets(prev => ({
      ...prev,
      [widgetKey]: !prev[widgetKey]
    }));
  };

  return (
    <div className="dashboard-widgets-container">
      {/* Dashboard Customize Toolbar */}
      <div className="d-flex justify-content-end mb-3">
        <Dropdown align="end">
          <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1">
            <Settings size={14} /> Customize Dashboard
          </Dropdown.Toggle>
          <Dropdown.Menu className="p-3" style={{ minWidth: "220px" }}>
            <h6 className="dropdown-header px-0 text-slate-800 fw-bold mb-2">Visible Widgets</h6>
            {Object.entries(visibleWidgets).map(([key, isVisible]) => (
              <Form.Check
                key={key}
                type="checkbox"
                id={`widget-check-${key}`}
                label={key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
                checked={isVisible}
                onChange={() => toggleWidget(key)}
                className="mb-2 small"
              />
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Metrics Row */}
      {visibleWidgets.stats && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="dashboard-metric-card bg-white p-3 border rounded-4 shadow-sm">
              <span className="metric-eyebrow text-muted small d-block mb-1">TOTAL TASKS</span>
              <div className="d-flex align-items-center justify-content-between">
                <strong className="metric-value fs-2 text-slate-800">{stats.total}</strong>
                <CheckSquare size={24} className="text-slate-400" />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="dashboard-metric-card bg-white p-3 border rounded-4 shadow-sm">
              <span className="metric-eyebrow text-muted small d-block mb-1">COMPLETED PROGRESS</span>
              <div className="d-flex align-items-center justify-content-between">
                <strong className="metric-value fs-2 text-slate-800">{stats.progress}%</strong>
                <Clock size={24} className="text-success" />
              </div>
              <div className="progress mt-2" style={{ height: "4px" }}>
                <div className="progress-bar bg-success" style={{ width: `${stats.progress}%` }} />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="dashboard-metric-card bg-white p-3 border rounded-4 shadow-sm">
              <span className="metric-eyebrow text-muted small d-block mb-1">OVERDUE TASKS</span>
              <div className="d-flex align-items-center justify-content-between">
                <strong className="metric-value fs-2 text-danger">{stats.overdue.length}</strong>
                <AlertCircle size={24} className="text-danger" />
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="dashboard-metric-card bg-white p-3 border rounded-4 shadow-sm">
              <span className="metric-eyebrow text-muted small d-block mb-1">URGENT / HIGH</span>
              <div className="d-flex align-items-center justify-content-between">
                <strong className="metric-value fs-2 text-warning">{stats.urgentCount + stats.highCount}</strong>
                <BarChart3 size={24} className="text-warning" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <div className="row g-4">
        {/* Status Breakdown Widget */}
        {visibleWidgets.statusBreakdown && (
          <div className="col-md-6">
            <div className="dashboard-widget-card bg-white p-4 border rounded-4 shadow-sm h-100">
              <h4 className="widget-title fw-bold text-slate-800 mb-3">Task Status Breakdown</h4>
              <div className="status-bars-stack">
                <div className="status-bar-row mb-3">
                  <div className="d-flex justify-content-between text-muted small mb-1">
                    <span>To Do</span>
                    <span>{stats.todo} ({stats.total ? Math.round((stats.todo/stats.total)*100) : 0}%)</span>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div className="progress-bar bg-secondary" style={{ width: `${stats.total ? (stats.todo/stats.total)*100 : 0}%` }} />
                  </div>
                </div>
                <div className="status-bar-row mb-3">
                  <div className="d-flex justify-content-between text-muted small mb-1">
                    <span>In Progress</span>
                    <span>{stats.inProgress} ({stats.total ? Math.round((stats.inProgress/stats.total)*100) : 0}%)</span>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div className="progress-bar bg-warning" style={{ width: `${stats.total ? (stats.inProgress/stats.total)*100 : 0}%` }} />
                  </div>
                </div>
                <div className="status-bar-row">
                  <div className="d-flex justify-content-between text-muted small mb-1">
                    <span>Complete</span>
                    <span>{stats.completed} ({stats.progress}%)</span>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div className="progress-bar bg-success" style={{ width: `${stats.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assignee Distribution Widget */}
        {visibleWidgets.assigneeDistribution && (
          <div className="col-md-6">
            <div className="dashboard-widget-card bg-white p-4 border rounded-4 shadow-sm h-100">
              <h4 className="widget-title fw-bold text-slate-800 mb-3">Assignee Distribution</h4>
              <div className="workspace-assignee-donut-shell">
                <div className="workspace-assignee-donut" style={{ background: assigneeChartBg }} />
                <div className="workspace-assignee-legend" style={{ maxHeight: "160px", overflowY: "auto" }}>
                  {assigneeData.map((entry) => (
                    <div key={entry.name} className="workspace-assignee-legend-item d-flex align-items-center gap-2 mb-2">
                      <span className="legend-dot" style={{ backgroundColor: entry.color, width: 8, height: 8, borderRadius: "50%", display: "inline-block" }} />
                      <div className="d-flex w-100 align-items-center justify-content-between gap-3 text-slate-700 small">
                        <strong className="text-truncate" style={{ maxWidth: "120px" }}>{entry.name}</strong>
                        <span>{entry.count} ({entry.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Tasks Widget */}
        {visibleWidgets.overdueTasks && (
          <div className="col-md-6">
            <div className="dashboard-widget-card bg-white p-4 border rounded-4 shadow-sm h-100">
              <h4 className="widget-title fw-bold text-slate-800 mb-3">Overdue Tasks ({stats.overdue.length})</h4>
              <div className="overdue-tasks-list" style={{ maxHeight: "240px", overflowY: "auto" }}>
                {stats.overdue.length === 0 ? (
                  <div className="text-center py-4 text-muted small">No overdue tasks. Awesome job! 🎉</div>
                ) : (
                  stats.overdue.map((t) => (
                    <div 
                      key={t.id} 
                      onClick={() => onTaskClick(t.id)}
                      className="d-flex align-items-center justify-content-between py-2 border-bottom cursor-pointer hover-bg-slate p-2 rounded-3"
                    >
                      <div className="d-flex align-items-center gap-2 text-truncate flex-grow-1">
                        <AlertCircle size={14} className="text-danger flex-shrink-0" />
                        <span className="small text-slate-800 text-truncate">{t.title}</span>
                      </div>
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle small px-2 py-1 flex-shrink-0">
                        {t.due_date}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Priority Summary Widget */}
        {visibleWidgets.prioritySummary && (
          <div className="col-md-6">
            <div className="dashboard-widget-card bg-white p-4 border rounded-4 shadow-sm h-100">
              <h4 className="widget-title fw-bold text-slate-800 mb-3">Task Priority Distribution</h4>
              <div className="priority-summary-stack">
                {["Urgent", "High", "Normal", "Low"].map((p) => {
                  const pTasks = allTasks.filter(t => t.priority === p);
                  const pDone = pTasks.filter(t => t.status === "Done").length;
                  const pPct = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
                  const colorMap = { Urgent: "bg-danger", High: "bg-warning", Normal: "bg-primary", Low: "bg-secondary" };
                  
                  return (
                    <div key={p} className="priority-row d-flex align-items-center justify-content-between mb-3">
                      <div style={{ width: "80px" }}>
                        <span className="small fw-semibold text-slate-700">{p}</span>
                      </div>
                      <div className="flex-grow-1 mx-3">
                        <div className="progress" style={{ height: "6px" }}>
                          <div className={`progress-bar ${colorMap[p]}`} style={{ width: `${pPct}%` }} />
                        </div>
                      </div>
                      <div className="text-end text-muted small" style={{ width: "90px" }}>
                        {pDone}/{pTasks.length} Done ({pPct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
