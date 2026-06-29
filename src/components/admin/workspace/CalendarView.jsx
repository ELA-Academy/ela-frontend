import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Button, Form, Alert, ButtonGroup } from "react-bootstrap";
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Clock, MapPin, AlignLeft, User, RefreshCw } from "lucide-react";
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getCalendarTasks } from "../../../services/boardService";
import "../../../styles/CalendarView.css";

const CalendarView = ({ boardId, onTaskClick, assignees, refreshWorkspace }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // "month", "week", "day"
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formAllDay, setFormAllDay] = useState(false);
  const [formColor, setFormColor] = useState("#673de6");
  const [formRecurrence, setFormRecurrence] = useState("None");
  const [formReminder, setFormReminder] = useState(0); // 0 means no reminder

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Calculate start and end dates based on currentDate and viewMode
      let startStr = "";
      let endStr = "";

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      if (viewMode === "month") {
        // Fetch previous, current, and next month to cover the grid
        const startDate = new Date(year, month - 1, 20);
        const endDate = new Date(year, month + 2, 10);
        startStr = startDate.toISOString().split("T")[0];
        endStr = endDate.toISOString().split("T")[0];
      } else if (viewMode === "week") {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        startStr = startOfWeek.toISOString().split("T")[0];
        endStr = endOfWeek.toISOString().split("T")[0];
      } else {
        startStr = currentDate.toISOString().split("T")[0];
        endStr = currentDate.toISOString().split("T")[0];
      }

      const params = {
        board_id: boardId,
        start: startStr,
        end: endStr,
      };

      const [eventsData, tasksData] = await Promise.all([
        getCalendarEvents(params),
        getCalendarTasks(params),
      ]);

      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      setError("Failed to fetch calendar data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [boardId, currentDate, viewMode]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Helpers
  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const grid = [];

    // Previous month filler
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      grid.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      grid.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month filler
    const totalCells = grid.length > 35 ? 42 : 35;
    const remaining = totalCells - grid.length;
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return grid;
  };

  const getDaysInWeek = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSameDay = (d1, d2) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Navigations
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Precompute expanded recurring events for visible dates
  const expandedEvents = useMemo(() => {
    if (!events.length) return [];
    
    const expanded = [];
    
    events.forEach(e => {
      // Add original event occurrence
      expanded.push(e);
      
      if (!e.recurring_rule || e.recurring_rule === "None") return;
      
      const startDt = new Date(e.start_datetime);
      const endDt = e.end_datetime ? new Date(e.end_datetime) : null;
      const durationMs = endDt ? (endDt.getTime() - startDt.getTime()) : 0;
      
      const rangeStart = new Date(currentDate);
      rangeStart.setDate(currentDate.getDate() - 35);
      
      const rangeEnd = new Date(currentDate);
      rangeEnd.setDate(currentDate.getDate() + 45);
      
      let nextDt = new Date(startDt);
      
      let limit = 0;
      while (nextDt <= rangeEnd && limit < 150) {
        limit++;
        
        if (e.recurring_rule === "Daily") {
          nextDt.setDate(nextDt.getDate() + 1);
        } else if (e.recurring_rule === "Weekly") {
          nextDt.setDate(nextDt.getDate() + 7);
        } else if (e.recurring_rule === "Monthly") {
          nextDt.setMonth(nextDt.getMonth() + 1);
        } else {
          break;
        }
        
        if (nextDt > rangeEnd) break;
        
        if (nextDt > startDt && nextDt >= rangeStart) {
          const occStart = new Date(nextDt);
          const occEnd = endDt ? new Date(nextDt.getTime() + durationMs) : null;
          
          expanded.push({
            ...e,
            id: `${e.id}-occ-${occStart.getTime()}`,
            original_id: e.id,
            start_datetime: occStart.toISOString(),
            end_datetime: occEnd ? occEnd.toISOString() : null,
            is_occurrence: true
          });
        }
      }
    });
    
    return expanded;
  }, [events, currentDate]);

  // Match items for a specific day
  const getItemsForDay = (date) => {
    const dayEvents = expandedEvents.filter((e) => {
      const eDate = new Date(e.start_datetime);
      return isSameDay(eDate, date);
    });

    const dayTasks = tasks.filter((t) => {
      if (!t.due_date && !t.start_date) return false;
      const tDue = t.due_date ? new Date(t.due_date) : null;
      const tStart = t.start_date ? new Date(t.start_date) : null;
      
      // Show on due date or start date
      return (tDue && isSameDay(tDue, date)) || (tStart && isSameDay(tStart, date));
    });

    return {
      events: dayEvents,
      tasks: dayTasks,
    };
  };

  // Event Modal handlers
  const handleOpenAddModal = (date = new Date()) => {
    setSelectedEvent(null);
    setIsEditing(true);
    setFormTitle("");
    setFormDescription("");
    setFormStartDate(date.toISOString().split("T")[0]);
    setFormStartTime("09:00");
    setFormEndDate(date.toISOString().split("T")[0]);
    setFormEndTime("10:00");
    setFormAllDay(false);
    setFormColor("#673de6");
    setFormRecurrence("None");
    setFormReminder(0);
    setShowEventModal(true);
  };

  const handleOpenDetailModal = (event) => {
    setSelectedEvent(event);
    setIsEditing(false);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    
    const startDt = new Date(event.start_datetime);
    setFormStartDate(startDt.toISOString().split("T")[0]);
    setFormStartTime(startDt.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }));
    
    if (event.end_datetime) {
      const endDt = new Date(event.end_datetime);
      setFormEndDate(endDt.toISOString().split("T")[0]);
      setFormEndTime(endDt.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }));
    } else {
      setFormEndDate("");
      setFormEndTime("");
    }
    
    setFormAllDay(event.all_day || false);
    setFormColor(event.color || "#673de6");
    setFormRecurrence(event.recurring_rule || "None");
    setFormReminder(event.reminder_minutes || 0);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      const startIso = `${formStartDate}T${formStartTime || "00:00"}:00`;
      const endIso = formEndDate ? `${formEndDate}T${formEndTime || "00:00"}:00` : null;

      const payload = {
        board_id: boardId,
        title: formTitle,
        description: formDescription,
        start_datetime: new Date(startIso).toISOString(),
        end_datetime: endIso ? new Date(endIso).toISOString() : null,
        all_day: formAllDay,
        color: formColor,
        recurring_rule: formRecurrence === "None" ? null : formRecurrence,
        reminder_minutes: formReminder > 0 ? Number(formReminder) : null,
      };

      if (selectedEvent) {
        // Update original event ID if editing from a virtual occurrence
        const eventId = selectedEvent.original_id || selectedEvent.id;
        await updateCalendarEvent(eventId, payload);
      } else {
        // Create
        await createCalendarEvent(payload);
      }

      setShowEventModal(false);
      fetchCalendarData();
      if (refreshWorkspace) refreshWorkspace();
    } catch (err) {
      console.error(err);
      alert("Failed to save event");
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const eventId = selectedEvent.original_id || selectedEvent.id;
        await deleteCalendarEvent(eventId);
        setShowEventModal(false);
        fetchCalendarData();
        if (refreshWorkspace) refreshWorkspace();
      } catch (err) {
        console.error(err);
        alert("Failed to delete event");
      }
    }
  };

  // Render grids
  const renderMonthGrid = () => {
    const days = getDaysInMonth(currentDate);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="calendar-grid-month">
        <div className="calendar-grid-header">
          {dayNames.map((name) => (
            <div key={name} className="calendar-header-cell">
              {name}
            </div>
          ))}
        </div>
        <div className="calendar-grid-body">
          {days.map((day, idx) => {
            const { events: dayEvents, tasks: dayTasks } = getItemsForDay(day.date);
            return (
              <div
                key={idx}
                className={`calendar-day-cell ${!day.isCurrentMonth ? "other-month" : ""} ${isToday(day.date) ? "today" : ""}`}
                onClick={() => handleOpenAddModal(day.date)}
              >
                <div className="day-number-container">
                  <span className="day-number">{day.date.getDate()}</span>
                </div>
                <div className="day-cell-content" onClick={(e) => e.stopPropagation()}>
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="calendar-item event-item"
                      style={{ borderLeftColor: event.color, backgroundColor: `${event.color}15` }}
                      onClick={() => handleOpenDetailModal(event)}
                    >
                      <span className="item-dot" style={{ backgroundColor: event.color }} />
                      <span className="item-title">{event.title}</span>
                    </div>
                  ))}
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="calendar-item task-item"
                      style={{ borderLeftColor: task.group_color || "#673de6" }}
                      onClick={() => onTaskClick(task.id)}
                    >
                      <span className="task-status-indicator" style={{ backgroundColor: task.status === "Done" ? "#00b67a" : "#ff9f1a" }} />
                      <span className="item-title text-truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekGrid = () => {
    const days = getDaysInWeek(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="calendar-grid-week">
        <div className="calendar-week-header">
          <div className="timezone-cell" />
          {days.map((day) => (
            <div key={day.toISOString()} className={`week-header-cell ${isToday(day) ? "today" : ""}`}>
              <span className="week-day-name">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="week-day-number">{day.getDate()}</span>
            </div>
          ))}
        </div>
        <div className="calendar-week-body">
          {/* Simple scrollable list of events and tasks grouping by weekday to keep UI sleek and responsive */}
          <div className="week-list-view">
            {days.map((day) => {
              const { events: dayEvents, tasks: dayTasks } = getItemsForDay(day);
              return (
                <div key={day.toISOString()} className="week-list-column">
                  <div className="week-column-header">
                    <strong>{day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</strong>
                    {isToday(day) && <span className="today-badge">Today</span>}
                  </div>
                  <div className="week-column-content">
                    {dayEvents.length === 0 && dayTasks.length === 0 ? (
                      <div className="empty-day-placeholder">No events or tasks</div>
                    ) : (
                      <>
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="week-card event-card"
                            style={{ borderLeftColor: event.color }}
                            onClick={() => handleOpenDetailModal(event)}
                          >
                            <div className="card-time">
                              <Clock size={12} className="me-1" />
                              {new Date(event.start_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="card-title">{event.title}</div>
                            {event.description && <div className="card-desc text-truncate">{event.description}</div>}
                          </div>
                        ))}
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className="week-card task-card"
                            style={{ borderLeftColor: task.group_color || "#673de6" }}
                            onClick={() => onTaskClick(task.id)}
                          >
                            <div className="task-meta">
                              <span className="task-list-name">{task.group_name}</span>
                              <span className={`task-priority-badge ${task.priority?.toLowerCase()}`}>{task.priority}</span>
                            </div>
                            <div className="card-title">{task.title}</div>
                            <div className="task-status">Status: {task.status}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  <button className="add-event-inline-btn" onClick={() => handleOpenAddModal(day)}>
                    <Plus size={14} className="me-1" /> Add Event
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayGrid = () => {
    const { events: dayEvents, tasks: dayTasks } = getItemsForDay(currentDate);

    return (
      <div className="calendar-day-view">
        <div className="day-view-header">
          <h2>{currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h2>
          {isToday(currentDate) && <span className="today-badge">Today</span>}
        </div>

        <div className="day-view-grid">
          <div className="day-section">
            <h3 className="section-title text-slate-800 fw-bold mb-3 d-flex align-items-center">
              <span className="dot event-dot me-2" /> Events ({dayEvents.length})
            </h3>
            {dayEvents.length === 0 ? (
              <div className="empty-state-card">No events scheduled for this day.</div>
            ) : (
              <div className="day-cards-list">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="day-card event-detail-card"
                    style={{ borderLeftColor: event.color }}
                    onClick={() => handleOpenDetailModal(event)}
                  >
                    <div className="card-header-row">
                      <h4 className="event-title">{event.title}</h4>
                      <span className="event-time">
                        {new Date(event.start_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        {event.end_datetime && ` - ${new Date(event.end_datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                    </div>
                    {event.description && <p className="event-desc mt-2">{event.description}</p>}
                    {event.recurring_rule && (
                      <div className="event-badge mt-2">
                        🔄 Recurrence: {event.recurring_rule}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary btn-sm mt-3" onClick={() => handleOpenAddModal(currentDate)}>
              <Plus size={16} className="me-1" /> Add Event
            </button>
          </div>

          <div className="day-section">
            <h3 className="section-title text-slate-800 fw-bold mb-3 d-flex align-items-center">
              <span className="dot task-dot me-2" /> Tasks ({dayTasks.length})
            </h3>
            {dayTasks.length === 0 ? (
              <div className="empty-state-card">No tasks due or starting on this day.</div>
            ) : (
              <div className="day-cards-list">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="day-card task-detail-card"
                    style={{ borderLeftColor: task.group_color || "#673de6" }}
                    onClick={() => onTaskClick(task.id)}
                  >
                    <div className="card-header-row">
                      <h4 className="task-title">{task.title}</h4>
                      <span className={`task-badge status-${task.status.toLowerCase().replace(" ", "-")}`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="task-meta-row mt-2">
                      <span className="task-list"><LayoutList size={12} className="me-1" /> {task.group_name}</span>
                      <span className="task-priority"><Flag size={12} className="me-1" /> {task.priority}</span>
                      {task.assignee_name && <span className="task-assignee"><User size={12} className="me-1" /> {task.assignee_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-view-container">
      {/* Calendar Header Controls */}
      <div className="calendar-controls-bar">
        <div className="controls-left">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleToday}>
            Today
          </button>
          <div className="btn-group mx-2">
            <button className="btn btn-outline-secondary btn-sm p-1" onClick={handlePrev}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-outline-secondary btn-sm p-1" onClick={handleNext}>
              <ChevronRight size={16} />
            </button>
          </div>
          <span className="current-range-label">{formatMonthYear(currentDate)}</span>
          {loading && <RefreshCw size={16} className="animate-spin text-muted ms-3" />}
        </div>

        <div className="controls-right">
          <ButtonGroup size="sm">
            <Button variant={viewMode === "month" ? "primary" : "outline-secondary"} onClick={() => setViewMode("month")}>
              Month
            </Button>
            <Button variant={viewMode === "week" ? "primary" : "outline-secondary"} onClick={() => setViewMode("week")}>
              Week
            </Button>
            <Button variant={viewMode === "day" ? "primary" : "outline-secondary"} onClick={() => setViewMode("day")}>
              Day
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Calendar Grid Area */}
      <div className="calendar-surface-card">
        {viewMode === "month" && renderMonthGrid()}
        {viewMode === "week" && renderWeekGrid()}
        {viewMode === "day" && renderDayGrid()}
      </div>

      {/* Event Add/Detail Modal */}
      <Modal show={showEventModal} onHide={() => setShowEventModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent ? (isEditing ? "Edit Event" : "Event Details") : "Schedule New Event"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveEvent}>
          <Modal.Body>
            {isEditing ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Event Title</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="What's the event?"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Add notes, agenda, or location details..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </Form.Group>

                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        required
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        disabled={formAllDay}
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>End Time</Form.Label>
                      <Form.Control
                        type="time"
                        disabled={formAllDay}
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="All Day Event"
                    checked={formAllDay}
                    onChange={(e) => setFormAllDay(e.target.checked)}
                  />
                </Form.Group>

                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Event Theme Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="form-control-color w-100"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Recurrence Rule</Form.Label>
                      <Form.Select value={formRecurrence} onChange={(e) => setFormRecurrence(e.target.value)}>
                        <option value="None">Does not repeat (None)</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Reminder Alert</Form.Label>
                  <Form.Select value={formReminder} onChange={(e) => setFormReminder(Number(e.target.value))}>
                    <option value={0}>No Reminder</option>
                    <option value={5}>5 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                    <option value={1440}>1 day before</option>
                  </Form.Select>
                </Form.Group>
              </>
            ) : (
              <div className="event-detail-view p-2">
                <div className="d-flex align-items-center mb-3">
                  <span className="color-badge me-3" style={{ backgroundColor: formColor }} />
                  <h3 className="event-title mb-0">{formTitle}</h3>
                </div>

                <div className="detail-meta-list">
                  <div className="meta-item">
                    <Clock size={16} className="me-2 text-muted" />
                    <span>
                      {formStartDate} {!formAllDay && `@ ${formStartTime}`}
                      {formEndDate && ` to ${formEndDate} ${!formAllDay && `@ ${formEndTime}`}`}
                      {formAllDay && " (All Day)"}
                    </span>
                  </div>

                  {formDescription && (
                    <div className="meta-item align-items-start mt-3">
                      <AlignLeft size={16} className="me-2 text-muted mt-1" />
                      <div className="description-text whitespace-pre-wrap">{formDescription}</div>
                    </div>
                  )}

                  {formRecurrence !== "None" && (
                    <div className="meta-item mt-2">
                      <span className="badge bg-light text-dark border">🔄 Repeats: {formRecurrence}</span>
                    </div>
                  )}

                  {formReminder > 0 && (
                    <div className="meta-item mt-2">
                      <span className="badge bg-light text-dark border">🔔 Reminder set for {formReminder} mins before</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            {selectedEvent ? (
              <>
                {isEditing ? (
                  <>
                    <Button variant="light" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="danger" className="me-auto" onClick={handleDeleteEvent}>
                      <Trash2 size={16} /> Delete
                    </Button>
                    <Button variant="light" onClick={() => setIsEditing(true)}>
                      Edit Event
                    </Button>
                    <Button variant="secondary" onClick={() => setShowEventModal(false)}>
                      Close
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Button variant="light" onClick={() => setShowEventModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Schedule Event
                </Button>
              </>
            )}
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default CalendarView;
