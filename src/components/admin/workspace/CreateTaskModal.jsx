import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Dropdown, InputGroup, Spinner } from "react-bootstrap";
import {
  CalendarCheck,
  CheckCircle,
  Flag,
  Zap,
  Paperclip,
  Plus,
  Tag,
  BookOpen,
  Bell,
  MoreHorizontal,
  ChevronDown
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/CreateTaskModal.css";
import api from "../../../utils/api";

// Custom forwardRef component for react-datepicker
const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    ref={ref}
    onClick={onClick}
    className="attribute-pill clickable-pill border-0 d-flex align-items-center gap-1"
  >
    <CalendarCheck size={14} />
    <span>{value || "+ Due date"}</span>
  </button>
));
CustomDateInput.displayName = "CustomDateInput";

const CreateTaskModal = ({ show, onHide, boards, members, onTaskCreated, initialBoardId, initialGroupId }) => {
  const [activeTab, setActiveTab] = useState("Task");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [priority, setPriority] = useState("Normal");
  const [dueDate, setDueDate] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiWriting, setAiWriting] = useState(false);

  // Mention autocomplete states
  const [trackedMentions, setTrackedMentions] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [mentionOptions, setMentionOptions] = useState([]);

  const textareaRef = useRef(null);

  useEffect(() => {
    if (initialBoardId) {
      setSelectedBoardId(Number(initialBoardId));
    } else if (boards && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    }
  }, [initialBoardId, boards, show]);

  useEffect(() => {
    if (selectedBoardId && boards) {
      const board = boards.find((b) => b.id === Number(selectedBoardId));
      if (board && board.groups && board.groups.length > 0) {
        // Pre-select group if provided, otherwise default to first group
        if (initialGroupId && board.groups.some(g => g.id === Number(initialGroupId))) {
          setSelectedGroupId(Number(initialGroupId));
        } else {
          setSelectedGroupId(board.groups[0].id);
        }
      } else {
        setSelectedGroupId("");
      }
    }
  }, [selectedBoardId, boards, initialGroupId, show]);

  useEffect(() => {
    const loadMentionOptions = async () => {
      try {
        const [staffRes, deptRes] = await Promise.all([
          api.get("/staff"),
          api.get("/departments")
        ]);
        
        const options = [];
        // Add superadmin
        options.push({
          type: "superadmin",
          id: 1,
          label: "Super Admin",
          searchStr: "super admin superadmin admin@ela-school.org"
        });
        
        // Add staff
        if (Array.isArray(staffRes.data)) {
          staffRes.data.forEach((s) => {
            options.push({
              type: "staff",
              id: s.id,
              label: s.name,
              searchStr: `${s.name} ${s.email}`.toLowerCase()
            });
          });
        }
        
        // Add departments
        if (Array.isArray(deptRes.data)) {
          deptRes.data.filter(d => d.is_active).forEach((d) => {
            options.push({
              type: "department",
              id: d.id,
              label: d.name,
              searchStr: d.name.toLowerCase()
            });
          });
        }
        
        setMentionOptions(options);
      } catch (err) {
        console.error("Failed to load mention options.", err);
      }
    };
    if (show) {
      loadMentionOptions();
    }
  }, [show]);

  const handleNotesChange = (e) => {
    const value = e.target.value;
    setNotes(value);

    // Parse for @ trigger
    const cursor = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1 && lastAtIdx >= textBeforeCursor.lastIndexOf(" ")) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      setAutocompleteQuery(query);
      
      const filtered = mentionOptions.filter((opt) =>
        opt.searchStr.includes(query.toLowerCase())
      );
      
      setAutocompleteSuggestions(filtered);
      setAutocompleteIndex(0);
      setShowAutocomplete(filtered.length > 0);
      
      setAutocompletePosition({
        top: 35, // Position offset
        left: Math.min(10 + query.length * 6, 250)
      });
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = notes.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIdx !== -1) {
      const textAfterCursor = notes.slice(cursor);
      const mentionText = `@${suggestion.label} `;
      
      const newNotes = notes.slice(0, lastAtIdx) + mentionText + textAfterCursor;
      setNotes(newNotes);
      
      setTrackedMentions((prev) => [
        ...prev.filter((m) => m.id !== suggestion.id || m.type !== suggestion.type),
        { type: suggestion.type, id: suggestion.id, label: suggestion.label }
      ]);
      
      setShowAutocomplete(false);
      
      setTimeout(() => {
        textareaRef.current.focus();
        const newCursorPos = lastAtIdx + mentionText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    }
  };

  const handleNotesKeyDown = (e) => {
    if (showAutocomplete && autocompleteSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAutocompleteIndex((prev) => (prev + 1) % autocompleteSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setAutocompleteIndex(
          (prev) => (prev - 1 + autocompleteSuggestions.length) % autocompleteSuggestions.length
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSuggestionSelect(autocompleteSuggestions[autocompleteIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowAutocomplete(false);
      }
    }
  };


  const handleCreate = async () => {
    if (!title.trim() || !selectedGroupId) return;
    try {
      setSubmitting(true);
      
      const activeMentions = trackedMentions.filter((m) =>
        notes.includes(`@${m.label}`)
      );

      const payload = {
        title,
        notes,
        status,
        priority,
        due_date: dueDate ? dueDate.toISOString().split("T")[0] : null,
        mentions: activeMentions.map((m) => ({ type: m.type, id: m.id }))
      };

      if (selectedAssignee) {
        payload.assignee_id = selectedAssignee.id;
        payload.assignee_role = selectedAssignee.role;
      }

      await onTaskCreated(selectedGroupId, payload);
      // Reset state
      setTitle("");
      setNotes("");
      setStatus("Not Started");
      setPriority("Normal");
      setDueDate(null);
      setSelectedAssignee(null);
      setTags([]);
      onHide();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiWrite = () => {
    if (!title.trim()) return;
    setAiWriting(true);
    setTimeout(() => {
      const mockAiPhrases = [
        `This task covers the operational checklist for "${title}". It involves assigning responsible owners, verifying due dates, and updating completion status on our boards.`,
        `Draft policy and SOP revisions for "${title}". Coordinate with admissions and accounting to sync timeline requirements.`,
        `Complete department testing of "${title}". Log all issues, verify access controls, and summarize validation results in a walkthrough report.`
      ];
      setNotes(mockAiPhrases[Math.floor(Math.random() * mockAiPhrases.length)]);
      setAiWriting(false);
    }, 1200);
  };

  const getInitials = (name) => {
    return (name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const selectedBoard = boards?.find((b) => b.id === Number(selectedBoardId));
  const selectedGroup = selectedBoard?.groups?.find((g) => g.id === Number(selectedGroupId));

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="clickup-task-modal">
      <div className="clickup-modal-container">
        {/* Top Navigation Tabs */}
        <div className="clickup-tabs-bar">
          {["Task", "Doc", "Reminder", "Whiteboard", "Dashboard"].map((tab) => (
            <button
              key={tab}
              className={`clickup-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <button className="clickup-modal-close" onClick={onHide}>&times;</button>
        </div>

        <div className="clickup-modal-content">
          {/* List selection & task type */}
          <div className="d-flex align-items-center gap-2 mb-3 px-1">
            <Dropdown className="clickup-dropdown">
              <Dropdown.Toggle variant="light" size="sm" className="clickup-drop-toggle">
                {selectedBoard ? `${selectedBoard.name} › ${selectedGroup?.name || "Select List"}` : "Select List..."}
              </Dropdown.Toggle>
              <Dropdown.Menu className="clickup-drop-menu">
                {boards?.map((b) => (
                  <div key={b.id}>
                    <Dropdown.Header className="fw-bold">{b.name}</Dropdown.Header>
                    {b.groups?.map((g) => (
                      <Dropdown.Item
                        key={g.id}
                        onClick={() => {
                          setSelectedBoardId(b.id);
                          setSelectedGroupId(g.id);
                        }}
                        active={Number(selectedGroupId) === g.id}
                        className="ps-4"
                      >
                        <span className="group-bullet-dot me-2" style={{ backgroundColor: g.color }} />
                        {g.name}
                      </Dropdown.Item>
                    ))}
                    <Dropdown.Divider />
                  </div>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown className="clickup-dropdown">
              <Dropdown.Toggle variant="light" size="sm" className="clickup-drop-toggle">
                <CheckCircle size={13} className="me-1 text-primary" /> Task
              </Dropdown.Toggle>
              <Dropdown.Menu className="clickup-drop-menu">
                <Dropdown.Item active>Task</Dropdown.Item>
                <Dropdown.Item disabled>Milestone</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Task Title Input */}
          <div className="clickup-input-container">
            <input
              type="text"
              className="clickup-title-input"
              placeholder="Task Name or type '/' for commands"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description Textarea */}
          <div className="clickup-desc-container mb-3">
            <textarea
              ref={textareaRef}
              className="clickup-desc-textarea"
              placeholder="Add description... (use @ to mention staff or department)"
              rows={4}
              value={notes}
              onChange={handleNotesChange}
              onKeyDown={handleNotesKeyDown}
            />
            {showAutocomplete && (
              <div
                className="mentions-autocomplete"
                style={{ top: `${autocompletePosition.top}px`, left: `${autocompletePosition.left}px` }}
              >
                {autocompleteSuggestions.map((s, idx) => (
                  <div
                    key={`${s.type}_${s.id}`}
                    className={`autocomplete-item ${idx === autocompleteIndex ? "active" : ""}`}
                    onClick={() => handleSuggestionSelect(s)}
                  >
                    <span className={s.type === "department" ? "mention-dept-badge" : "mention-staff-badge"}>
                      {s.type === "department" ? "Dept" : (s.type === "superadmin" ? "Admin" : "Staff")}
                    </span>
                    <strong>{s.label}</strong>
                  </div>
                ))}
              </div>
            )}
            {aiWriting && (
              <div className="clickup-desc-ai-loader">
                <Spinner size="sm" animation="border" className="text-primary me-2" />
                AI is generating notes...
              </div>
            )}
          </div>

          {/* Write with AI button */}
          <div className="mb-4">
            <Button
              variant="outline-secondary"
              size="sm"
              className="clickup-ai-btn d-flex align-items-center gap-1"
              onClick={handleAiWrite}
              disabled={!title.trim() || aiWriting}
            >
              <Zap size={13} className="text-purple-600" />
              <span>Write with AI</span>
            </Button>
          </div>

          {/* Attribute buttons row */}
          <div className="clickup-attributes-bar mb-3">
            {/* Status Dropdown */}
            <Dropdown className="attribute-dropdown">
              <Dropdown.Toggle as="div" className={`attribute-pill status-pill status-${status.toLowerCase().replace(" ", "-")}`}>
                {status.toUpperCase()}
              </Dropdown.Toggle>
              <Dropdown.Menu className="clickup-drop-menu text-center">
                {["Not Started", "In Progress", "Done"].map((s) => (
                  <Dropdown.Item key={s} onClick={() => setStatus(s)} active={status === s}>
                    {s}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {/* Assignee Dropdown */}
            <Dropdown className="attribute-dropdown">
              <Dropdown.Toggle as="div" className="attribute-pill clickable-pill">
                {selectedAssignee ? (
                  <div className="d-flex align-items-center gap-1">
                    <div className="assignee-avatar-mini">{getInitials(selectedAssignee.name)}</div>
                    <span>{selectedAssignee.name}</span>
                  </div>
                ) : (
                  <>+ Assignee</>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu className="clickup-drop-menu">
                <Dropdown.Item onClick={() => setSelectedAssignee(null)}>
                  <span className="text-muted">Unassigned</span>
                </Dropdown.Item>
                <Dropdown.Divider />
                {members?.map((m) => (
                  <Dropdown.Item
                    key={`${m.role}_${m.id}`}
                    onClick={() => setSelectedAssignee(m)}
                    active={selectedAssignee?.id === m.id && selectedAssignee?.role === m.role}
                  >
                    <strong>{m.name}</strong>
                    <div className="small text-muted">{m.email}</div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {/* Due Date picker */}
            <div className="position-relative">
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                placeholderText="+ Due date"
                customInput={<CustomDateInput />}
              />
            </div>

            {/* Priority dropdown */}
            <Dropdown className="attribute-dropdown">
              <Dropdown.Toggle as="div" className="attribute-pill clickable-pill d-flex align-items-center gap-1">
                <Flag size={13} className={`priority-flag-${priority.toLowerCase()}`} />
                <span>{priority}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="clickup-drop-menu text-center">
                {["Urgent", "High", "Normal", "Low"].map((p) => (
                  <Dropdown.Item key={p} onClick={() => setPriority(p)} active={priority === p}>
                    {p}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {/* Tags (Mocked dropdown) */}
            <Dropdown className="attribute-dropdown">
              <Dropdown.Toggle as="div" className="attribute-pill clickable-pill d-flex align-items-center gap-1">
                <Tag size={13} />
                <span>{tags.length > 0 ? `${tags.length} Tags` : "+ Tags"}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="clickup-drop-menu p-2" style={{ width: "200px" }}>
                {["Operations", "Admissions", "Finance", "Urgent Check"].map((t) => (
                  <Form.Check
                    key={t}
                    type="checkbox"
                    label={t}
                    checked={tags.includes(t)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTags([...tags, t]);
                      } else {
                        setTags(tags.filter((tag) => tag !== t));
                      }
                    }}
                    className="mb-1"
                  />
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {/* More dots option */}
            <div className="attribute-pill clickable-pill px-2">
              <MoreHorizontal size={14} />
            </div>
          </div>
        </div>

        {/* Footer controls bar */}
        <div className="clickup-footer-bar">
          <div className="d-flex align-items-center gap-3">
            <Button variant="light" size="sm" className="clickup-footer-btn font-semibold d-flex align-items-center gap-1">
              <BookOpen size={13} /> Templates
            </Button>
            <button className="clickup-icon-btn"><Paperclip size={16} /></button>
            <button className="clickup-icon-btn position-relative">
              <Bell size={16} />
              <span className="clickup-notif-dot">1</span>
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onHide} disabled={submitting}>
              Cancel
            </Button>
            <div className="d-flex">
              <Button
                variant="primary"
                size="sm"
                className="clickup-create-btn font-bold rounded-start-2 px-3"
                onClick={handleCreate}
                disabled={!title.trim() || submitting}
              >
                {submitting ? <Spinner size="sm" animation="border" /> : "Create Task"}
              </Button>
              <Button variant="primary" size="sm" className="clickup-create-split-btn rounded-end-2 px-1">
                <ChevronDown size={13} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTaskModal;
