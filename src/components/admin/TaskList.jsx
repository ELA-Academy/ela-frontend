import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Pencil,
  ExternalLink,
  ClipboardList,
  Search,
  CheckCircle2,
  Circle
} from "lucide-react";
import { updateTaskStatus } from "../../services/taskService";
import { updateTask as updateBoardTask } from "../../services/boardService";
import { showSuccess, showError } from "../../utils/notificationService";

const formatDueDate = (dateString, isCompleted) => {
  if (!dateString) {
    return <span className="text-slate-400">—</span>;
  }
  const dueDate = new Date(dateString.split("T")[0].replace(/-/g, "/"));
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue = !isCompleted && dueDate < now;
  const dateOptions = { month: "short", day: "numeric", year: "numeric" };
  return (
    <span
      className={`d-inline-flex align-items-center gap-1.5 ${
        isOverdue ? "text-danger fw-semibold" : "text-slate-600"
      }`}
      style={{ fontSize: "12.5px" }}
    >
      <Calendar size={12} className={isOverdue ? "text-danger" : "text-slate-400"} />
      {dueDate.toLocaleDateString(undefined, dateOptions)}
    </span>
  );
};

const getStatusBadgeStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "done" || s === "completed") {
    return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
  }
  if (s === "in progress" || s === "active") {
    return { bg: "#f5f3ff", color: "#673de6", border: "#ddd6fe" };
  }
  return { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
};

const TaskList = ({ tasks, title = "My Tasks", onEditTask, onTaskUpdated }) => {
  const [taskList, setTaskList] = useState(tasks || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // "active" | "all" | "completed"
  const TASKS_PER_PAGE = 15;

  useEffect(() => {
    setTaskList(tasks || []);
    setCurrentPage(1);
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = (taskList || []).filter((t) => {
      const isCompleted = t.status === "Completed" || t.status === "Done";
      if (statusFilter === "active" && isCompleted) return false;
      if (statusFilter === "completed" && !isCompleted) return false;
      if (!q) return true;

      const assignees = [
        ...(t.assigned_department_names || []),
        ...(t.assigned_staff_names || []),
      ].join(" ").toLowerCase();

      return (
        (t.title || "").toLowerCase().includes(q) ||
        (t.board_name || "").toLowerCase().includes(q) ||
        (t.group_name || "").toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q) ||
        assignees.includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const aComp = a.status === "Completed" || a.status === "Done";
      const bComp = b.status === "Completed" || b.status === "Done";
      if (aComp && !bComp) return 1;
      if (!aComp && bComp) return -1;
      return 0;
    });
  }, [taskList, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const pageCount = Math.ceil(filteredAndSortedTasks.length / TASKS_PER_PAGE) || 1;
  const indexOfLastTask = currentPage * TASKS_PER_PAGE;
  const indexOfFirstTask = indexOfLastTask - TASKS_PER_PAGE;
  const currentTasks = filteredAndSortedTasks.slice(indexOfFirstTask, indexOfLastTask);

  const handleCompleteTask = async (task) => {
    try {
      if (task.task_type === "board") {
        await updateBoardTask(task.id, { status: "Done" });
        showSuccess("Task marked as Done!");
      } else {
        await updateTaskStatus(task.id, "Completed");
        showSuccess("Task marked as complete!");
      }
      if (onTaskUpdated) {
        onTaskUpdated();
      } else {
        setTaskList((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: task.task_type === "board" ? "Done" : "Completed" }
              : t
          )
        );
      }
    } catch (err) {
      showError("Failed to update task. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-3 border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar Header */}
      <div className="px-4 py-3 border-bottom border-slate-100 d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3 bg-white">
        <div className="d-flex align-items-center gap-2">
          <ClipboardList size={16} className="text-slate-400" />
          <h6 className="m-0 fw-bold text-slate-900" style={{ fontSize: "14px" }}>
            {title}
          </h6>
          <span
            className="badge rounded-pill"
            style={{
              backgroundColor: "#f1f5f9",
              color: "#475569",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 8px"
            }}
          >
            {filteredAndSortedTasks.length}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Status Filter Pills */}
          <div className="d-flex bg-slate-100 rounded-2 p-0.5 gap-0.5">
            {[
              { key: "active", label: "Active" },
              { key: "all", label: "All" },
              { key: "completed", label: "Done" }
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`btn btn-sm border-0 rounded-2 px-2.5 py-1 fw-semibold ${
                  statusFilter === opt.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "bg-transparent text-slate-500"
                }`}
                style={{ fontSize: "11.5px" }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="position-relative" style={{ width: "220px" }}>
            <Search
              size={13}
              className="position-absolute text-slate-400"
              style={{ left: "10px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or spaces..."
              className="form-control form-control-sm border-slate-200 bg-slate-50"
              style={{ paddingLeft: "28px", fontSize: "12px", height: "30px", borderRadius: "7px" }}
            />
          </div>
        </div>
      </div>

      {/* Compact Table */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-5 text-slate-400" style={{ fontSize: "13px" }}>
          No tasks match your current filters.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle m-0">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 border-bottom border-slate-100" style={{ fontSize: "11px" }}>
                <th className="py-2.5 ps-4" style={{ width: "38%" }}>TASK</th>
                <th className="py-2.5" style={{ width: "22%" }}>LOCATION</th>
                <th className="py-2.5" style={{ width: "12%" }}>STATUS</th>
                <th className="py-2.5" style={{ width: "13%" }}>DUE DATE</th>
                <th className="py-2.5" style={{ width: "15%" }}>ASSIGNEES</th>
                <th className="py-2.5 pe-4 text-end" style={{ width: "110px" }}></th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.map((task) => {
                const assignees = [
                  ...(task.assigned_department_names || []),
                  ...(task.assigned_staff_names || []),
                ].filter(Boolean);
                const isCompleted = task.status === "Completed" || task.status === "Done";
                const statusStyle = getStatusBadgeStyle(task.status);
                const targetUrl =
                  task.task_type === "board" && task.board_id
                    ? `/admin/boards/${task.board_id}?task=${task.id}`
                    : task.lead_token
                    ? `/admin/admissions/leads/${task.lead_token}`
                    : "/admin/admissions/leads";

                return (
                  <tr
                    key={`${task.task_type || "task"}_${task.id}`}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      opacity: isCompleted ? 0.65 : 1
                    }}
                  >
                    {/* Task Title + Complete Toggle */}
                    <td className="py-2.5 ps-4">
                      <div className="d-flex align-items-center gap-2.5">
                        <button
                          type="button"
                          disabled={isCompleted}
                          onClick={() => handleCompleteTask(task)}
                          className="btn btn-link p-0 border-0 d-flex align-items-center flex-shrink-0"
                          title={isCompleted ? "Completed" : "Mark as Done"}
                          style={{ color: isCompleted ? "#10b981" : "#94a3b8" }}
                        >
                          {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </button>
                        <Link
                          to={targetUrl}
                          className={`text-decoration-none fw-medium text-truncate ${
                            isCompleted ? "text-decoration-line-through text-slate-400" : "text-slate-900"
                          }`}
                          style={{ fontSize: "13.5px", maxWidth: "360px" }}
                        >
                          {task.title}
                        </Link>
                      </div>
                    </td>

                    {/* Location / Space */}
                    <td className="py-2.5">
                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                        <span
                          className="badge fw-semibold"
                          style={{
                            backgroundColor: task.task_type === "board" ? "#eef2ff" : "#ecfeff",
                            color: task.task_type === "board" ? "#4f46e5" : "#0e7490",
                            fontSize: "10.5px",
                            padding: "3px 7px",
                            borderRadius: "6px"
                          }}
                        >
                          {task.task_type === "board" ? (task.board_name || "Workspace") : "Admissions"}
                        </span>
                        {task.group_name && (
                          <span className="text-slate-400 text-truncate" style={{ fontSize: "11.5px", maxWidth: "130px" }}>
                            {task.group_name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5">
                      <span
                        className="badge fw-semibold"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        {task.status || "To Do"}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="py-2.5">{formatDueDate(task.due_date, isCompleted)}</td>

                    {/* Assignees */}
                    <td className="py-2.5">
                      <span className="text-slate-500 text-truncate d-inline-block" style={{ fontSize: "12px", maxWidth: "160px" }}>
                        {assignees.length > 0 ? assignees.join(", ") : "—"}
                      </span>
                    </td>

                    {/* Compact Actions */}
                    <td className="py-2.5 pe-4 text-end">
                      <div className="d-inline-flex align-items-center gap-1">
                        {onEditTask && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            className="btn btn-light btn-sm p-1 border border-slate-200 text-slate-600 rounded-2"
                            title="Quick Edit"
                            style={{ width: "26px", height: "26px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        <Link
                          to={targetUrl}
                          className="btn btn-light btn-sm px-2 py-1 border border-slate-200 text-slate-700 rounded-2 d-inline-flex align-items-center gap-1 text-decoration-none fw-semibold"
                          style={{ fontSize: "11px", height: "26px" }}
                        >
                          <span>Open</span>
                          <ExternalLink size={11} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Pagination */}
      {pageCount > 1 && (
        <div className="px-4 py-2.5 border-top border-slate-100 d-flex justify-content-between align-items-center bg-slate-50/50" style={{ fontSize: "12px" }}>
          <span className="text-slate-500">
            Showing {indexOfFirstTask + 1}–{Math.min(indexOfLastTask, filteredAndSortedTasks.length)} of {filteredAndSortedTasks.length}
          </span>
          <div className="d-flex align-items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-light btn-sm border border-slate-200 px-2.5 py-1 fw-semibold text-slate-700"
              style={{ fontSize: "11.5px" }}
            >
              Prev
            </button>
            <span className="text-slate-500 px-1">
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              className="btn btn-light btn-sm border border-slate-200 px-2.5 py-1 fw-semibold text-slate-700"
              style={{ fontSize: "11.5px" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
