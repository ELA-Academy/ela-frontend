import React, { useMemo, useState } from "react";
import { Clock, Flag, User, AlertCircle, ArrowRight, Layers } from "lucide-react";
import "../../../styles/GanttView.css";

const GanttView = ({ board, onTaskClick }) => {
  const [zoomLevel, setZoomLevel] = useState("day"); // "day" or "week"

  // Flatten tasks from board groups
  const tasks = useMemo(() => {
    if (!board || !board.groups) return [];
    return board.groups.flatMap((g) =>
      (g.tasks || []).map((t) => ({
        ...t,
        groupName: g.name,
        groupColor: g.color || "#673de6",
      }))
    );
  }, [board]);

  // Determine date bounds of the timeline
  const { timelineDates, startDate, endDate } = useMemo(() => {
    const today = new Date();
    let minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    let maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Filter tasks that have dates
    const datedTasks = tasks.filter((t) => t.start_date || t.due_date);

    if (datedTasks.length > 0) {
      const dates = datedTasks.flatMap((t) => {
        const d = [];
        if (t.start_date) d.push(new Date(t.start_date));
        if (t.due_date) d.push(new Date(t.due_date));
        return d;
      });

      const parsedMin = new Date(Math.min(...dates));
      const parsedMax = new Date(Math.max(...dates));

      // Buffer of 3 days on each side
      minDate = new Date(parsedMin);
      minDate.setDate(parsedMin.getDate() - 5);
      maxDate = new Date(parsedMax);
      maxDate.setDate(parsedMax.getDate() + 5);
    }

    // Generate list of dates between minDate and maxDate
    const dateList = [];
    const curr = new Date(minDate);
    while (curr <= maxDate) {
      dateList.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    return {
      timelineDates: dateList,
      startDate: minDate,
      endDate: maxDate,
    };
  }, [tasks]);

  const daysCount = timelineDates.length;

  // Helpers to calculate CSS positioning
  const calculatePosition = (taskStartDateStr, taskDueDateStr) => {
    const today = new Date();
    const taskStart = taskStartDateStr ? new Date(taskStartDateStr) : null;
    const taskDue = taskDueDateStr ? new Date(taskDueDateStr) : null;

    if (!taskStart && !taskDue) {
      return { leftPercent: 0, widthPercent: 0, isUnscheduled: true };
    }

    const start = taskStart || taskDue;
    const end = taskDue || taskStart;

    // Normalize start/end to be within the timeline bounds
    const totalTimeSpan = endDate.getTime() - startDate.getTime();
    
    // Clamp values
    const clampedStart = Math.max(startDate.getTime(), start.getTime());
    const clampedEnd = Math.max(startDate.getTime(), Math.min(endDate.getTime(), end.getTime()));

    const startOffset = clampedStart - startDate.getTime();
    // Min 1-day width for visibility
    const duration = Math.max(24 * 60 * 60 * 1000, clampedEnd - clampedStart);

    const leftPercent = (startOffset / totalTimeSpan) * 100;
    const widthPercent = (duration / totalTimeSpan) * 100;

    return {
      leftPercent,
      widthPercent,
      isUnscheduled: false,
      isMilestone: taskStartDateStr === taskDueDateStr || (!taskStartDateStr && taskDueDateStr),
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Done":
        return "#00b67a";
      case "In Progress":
        return "#6d45f7";
      default:
        return "#7c8798";
    }
  };

  // Group tasks by lists
  const groupedTasks = useMemo(() => {
    const unscheduled = [];
    const scheduled = [];

    tasks.forEach((t) => {
      if (!t.start_date && !t.due_date) {
        unscheduled.push(t);
      } else {
        scheduled.push(t);
      }
    });

    return { scheduled, unscheduled };
  }, [tasks]);

  // Find linked dependency names
  const getDependencyName = (depId) => {
    const depTask = tasks.find((t) => t.id === depId);
    return depTask ? depTask.title : `Task #${depId}`;
  };

  return (
    <div className="gantt-view-container">
      {/* Top bar controls */}
      <div className="gantt-controls">
        <div className="controls-left">
          <Layers size={18} className="me-2 text-primary" />
          <span className="gantt-info-title">Timeline & Dependency Tracking</span>
        </div>
        <div className="controls-right d-flex gap-2 align-items-center">
          <span className="small text-muted">Timeline Range:</span>
          <span className="fw-semibold small">
            {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
            {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="gantt-empty-state">
          <AlertCircle size={32} className="mb-2 text-muted" />
          <p>No tasks found in this board. Add some tasks with dates to view the Gantt chart.</p>
        </div>
      ) : (
        <div className="gantt-surface">
          {/* Gantt Split View */}
          <div className="gantt-split-pane">
            
            {/* Left side: Task list list */}
            <div className="gantt-left-pane">
              <div className="pane-header">Tasks</div>
              <div className="pane-rows">
                {/* Scheduled Tasks Headers */}
                {groupedTasks.scheduled.map((task) => (
                  <div key={task.id} className="gantt-task-row-label" onClick={() => onTaskClick(task.id)}>
                    <div className="task-title-cell text-truncate">
                      <span className="group-indicator" style={{ backgroundColor: task.groupColor }} title={task.groupName} />
                      <span className="task-title-text">{task.title}</span>
                    </div>
                    <div className="task-meta-cell">
                      {task.assignee_name ? (
                        <span className="assignee-badge" title={task.assignee_name}>
                          <User size={10} className="me-1" />
                          {task.assignee_name.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="text-muted small">Unassigned</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Unscheduled header */}
                {groupedTasks.unscheduled.length > 0 && (
                  <>
                    <div className="unscheduled-separator-row">Unscheduled ({groupedTasks.unscheduled.length})</div>
                    {groupedTasks.unscheduled.map((task) => (
                      <div key={task.id} className="gantt-task-row-label unscheduled-label" onClick={() => onTaskClick(task.id)}>
                        <div className="task-title-cell text-truncate">
                          <span className="group-indicator" style={{ backgroundColor: task.groupColor }} />
                          <span className="task-title-text">{task.title}</span>
                        </div>
                        <span className="text-muted small italic">No dates set</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Right side: Timeline bars */}
            <div className="gantt-right-pane">
              {/* Timeline Header Grid */}
              <div className="pane-header timeline-header-grid" style={{ gridTemplateColumns: `repeat(${daysCount}, 1fr)` }}>
                {timelineDates.map((date, idx) => {
                  const dayNum = date.getDate();
                  const showMonth = dayNum === 1 || idx === 0;
                  return (
                    <div key={idx} className="timeline-header-cell">
                      {showMonth && <span className="month-label">{date.toLocaleDateString("en-US", { month: "short" })}</span>}
                      <span className="day-label">{dayNum}</span>
                    </div>
                  );
                })}
              </div>

              {/* Timeline Rows grid */}
              <div className="pane-rows timeline-rows-grid">
                {/* Scheduled tasks timeline bars */}
                {groupedTasks.scheduled.map((task) => {
                  const { leftPercent, widthPercent, isMilestone } = calculatePosition(
                    task.start_date,
                    task.due_date
                  );
                  const statusColor = getStatusColor(task.status);

                  return (
                    <div key={task.id} className="gantt-task-row-bar-container">
                      {/* Background day columns */}
                      <div className="timeline-grid-background" style={{ gridTemplateColumns: `repeat(${daysCount}, 1fr)` }}>
                        {Array.from({ length: daysCount }).map((_, i) => (
                          <div key={i} className="bg-grid-cell" />
                        ))}
                      </div>

                      {/* Timeline Bar */}
                      <div
                        className={`gantt-bar-wrapper ${isMilestone ? "milestone-wrapper" : ""}`}
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        onClick={() => onTaskClick(task.id)}
                      >
                        {isMilestone ? (
                          <div className="milestone-diamond" style={{ backgroundColor: statusColor }} title="Milestone (Due Date)" />
                        ) : (
                          <div className="gantt-bar" style={{ backgroundColor: `${statusColor}e0`, borderColor: statusColor }}>
                            <span className="gantt-bar-title text-truncate">{task.title}</span>
                          </div>
                        )}

                        {/* Dependency linkage indicator */}
                        {task.dependency_task_id && (
                          <div className="dependency-line-indicator" title={`Depends on: ${getDependencyName(task.dependency_task_id)}`}>
                            <ArrowRight size={10} className="me-1" />
                            Dep
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Spacer rows for unscheduled tasks */}
                {groupedTasks.unscheduled.length > 0 && (
                  <>
                    <div className="unscheduled-separator-timeline"> &nbsp; </div>
                    {groupedTasks.unscheduled.map((task) => (
                      <div key={task.id} className="gantt-task-row-bar-container unscheduled-container">
                        <div className="timeline-grid-background" style={{ gridTemplateColumns: `repeat(${daysCount}, 1fr)` }}>
                          {Array.from({ length: daysCount }).map((_, i) => (
                            <div key={i} className="bg-grid-cell" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default GanttView;
