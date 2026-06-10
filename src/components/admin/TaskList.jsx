import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  Pencil,
  ExternalLink,
  ClipboardList
} from "lucide-react";
import { updateTaskStatus } from "../../services/taskService";
import { updateTask as updateBoardTask } from "../../services/boardService";
import { showSuccess, showError } from "../../utils/notificationService";

const formatDueDate = (dateString) => {
  if (!dateString) {
    return <span className="text-slate-400">No due date</span>;
  }
  const dueDate = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue = dueDate < now;
  const dateOptions = { year: "numeric", month: "short", day: "numeric" };
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${isOverdue ? "text-rose-500 font-semibold" : "text-slate-500"}`}>
      <Calendar className="w-3.5 h-3.5" />
      {dueDate.toLocaleDateString(undefined, dateOptions)}
    </span>
  );
};

const TaskList = ({ tasks, title = "My Tasks", onEditTask, onTaskUpdated }) => {
  const [taskList, setTaskList] = useState(tasks || []);
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 10;

  useEffect(() => {
    setTaskList(tasks || []);
    setCurrentPage(1);
  }, [tasks]);

  const sortedTasks = useMemo(() => {
    return [...taskList].sort((a, b) => {
      const aComp = a.status === "Completed" || a.status === "Done";
      const bComp = b.status === "Completed" || b.status === "Done";
      if (aComp && !bComp) return 1;
      if (!aComp && bComp) return -1;
      return 0;
    });
  }, [taskList]);

  const indexOfLastTask = currentPage * TASKS_PER_PAGE;
  const indexOfFirstTask = indexOfLastTask - TASKS_PER_PAGE;
  const currentTasks = sortedTasks.slice(indexOfFirstTask, indexOfLastTask);
  const pageCount = Math.ceil(sortedTasks.length / TASKS_PER_PAGE);

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
        setTaskList((currentTasks) =>
          currentTasks.map((t) =>
            t.id === task.id ? { ...t, status: task.task_type === "board" ? "Done" : "Completed" } : t
          )
        );
      }
    } catch (err) {
      showError("Failed to update task. Please try again.");
    }
  };

  const renderPagination = () => {
    if (pageCount <= 1) return null;
    return (
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
        <button
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Previous
        </button>
        <span className="text-xs font-medium text-slate-500">
          Page {currentPage} of {pageCount}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage === pageCount}
          className="px-3 py-1.5 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-50">
        <h5 className="text-base font-bold text-slate-950 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-slate-400" />
          {title} <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold ml-1">{taskList ? taskList.length : 0}</span>
        </h5>
      </div>

      {/* Task card list matching Image 3 visual style */}
      {!taskList || taskList.length === 0 ? (
        <p className="text-slate-400 text-sm py-4">No tasks assigned at the moment.</p>
      ) : (
        <div className="space-y-4">
          {currentTasks.map((task) => {
            const assignees = [
              ...task.assigned_department_names,
              ...task.assigned_staff_names,
            ].filter(Boolean);
            const isCompleted = task.status === "Completed" || task.status === "Done";
            
            // Color indicators for left bar
            const leftBarColor = isCompleted
              ? "bg-slate-200"
              : task.task_type === "board"
              ? "bg-emerald-500"
              : "bg-sky-500";

            return (
              <div
                className={`bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all duration-200 hover:shadow-md relative overflow-hidden ${
                  isCompleted ? "opacity-75" : ""
                }`}
                key={task.id}
              >
                {/* Left side indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${leftBarColor}`} />

                <div className="flex items-start gap-3 pl-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    disabled={isCompleted}
                    onChange={() => handleCompleteTask(task)}
                    className="w-4 h-4 border-slate-200 rounded text-slate-950 focus:ring-slate-950 focus:ring-0 mt-1 cursor-pointer disabled:cursor-not-allowed"
                    title={isCompleted ? "Task is complete" : "Mark as complete"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${isCompleted ? "line-through text-slate-400" : "text-slate-900"}`}>
                        {task.title}
                      </span>
                      
                      {/* Tag pill based on type */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        task.task_type === "board"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-sky-50 text-sky-600 border border-sky-100"
                      }`}>
                        {task.task_type === "board" ? "Workspace" : "Admissions"}
                      </span>

                      {task.lead_status && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          {task.lead_status}
                        </span>
                      )}

                      {task.task_type === "board" && task.board_name && (
                        <span className="bg-slate-50 text-slate-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          {task.board_name} {task.group_name ? `(${task.group_name})` : ""}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px]">
                      {formatDueDate(task.due_date)}
                      {assignees.length > 0 && (
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {assignees.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side actions - Tailwind buttons */}
                <div className="flex items-center gap-2 self-end md:self-auto pl-7 md:pl-0">
                  {onEditTask && !isCompleted && (
                    task.task_type === "board" ? (
                      <Link
                        to={`/admin/boards/${task.board_id}?task=${task.id}`}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        title="View in Workspace"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Edit Task & Update Lead"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )
                  )}
                  {task.lead_secure_token && (
                    <Link
                      to={`/admin/admissions/leads/${task.lead_secure_token}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg text-decoration-none"
                    >
                      View Lead
                    </Link>
                  )}
                  {task.task_type === "board" && task.board_id && (
                    <Link
                      to={`/admin/boards/${task.board_id}?task=${task.id}`}
                      className="bg-slate-950 hover:bg-slate-900 text-white transition-colors text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg text-decoration-none flex items-center gap-1"
                    >
                      Workspace <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination controls footer */}
      {pageCount > 1 && renderPagination()}
    </div>
  );
};

export default TaskList;
