import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Button,
  Offcanvas,
  Form,
  Spinner,
  Alert,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { PencilSquare } from "react-bootstrap-icons";
import {
  showSuccess,
  showError,
  showWarning,
} from "../../../utils/notificationService";
import {
  getLeadByToken,
  updateLead,
  updateLeadDetails,
  createTask,
  getTasksForLead,
  getActiveDepartments,
} from "../../../services/admissionsService";
import { getAllStaff } from "../../../services/staffService";
import { getBoards } from "../../../services/boardService";
import {
  User,
  Plus,
  Shield,
  FileText,
  Mail,
  Phone,
  Clock,
  Printer,
  Edit2,
  Calendar,
  CheckCircle,
  PlusCircle,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import "../../../styles/StudentProfile.css";
import "../../../styles/AdminModern.css";

const sleekSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    height: "auto",
    fontSize: "12.5px",
    backgroundColor: "#ffffff",
    borderColor: state.isFocused ? "#673de6" : "#cbd5e1",
    borderRadius: "8px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(103, 61, 230, 0.15)" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "#673de6" : "#94a3b8",
    },
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "2px 8px",
    fontSize: "12.5px",
  }),
  input: (base) => ({
    ...base,
    margin: "0px",
    padding: "0px",
    fontSize: "12.5px",
    color: "#1e293b",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#94a3b8",
    fontSize: "12.5px",
    fontWeight: "400",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1e293b",
    fontSize: "12.5px",
    fontWeight: "500",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#f1f5f9",
    borderRadius: "5px",
    border: "1px solid #e2e8f0",
  }),
  multiValueLabel: (base) => ({
    ...base,
    fontSize: "11.5px",
    color: "#334155",
    fontWeight: "500",
    padding: "1px 6px",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#64748b",
    borderRadius: "0 4px 4px 0",
    "&:hover": {
      backgroundColor: "#fee2e2",
      color: "#ef4444",
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "8px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "12.5px",
    padding: "6px 12px",
    backgroundColor: state.isSelected
      ? "#673de6"
      : state.isFocused
      ? "#f8fafc"
      : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#1e293b",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#ede9fe",
    },
  }),
};

const LeadDetailPage = () => {
  const { token } = useParams();
  const [lead, setLead] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isEditingNotesCard, setIsEditingNotesCard] = useState(false);
  const [tempNotesCard, setTempNotesCard] = useState("");

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [assignedDepts, setAssignedDepts] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [boardsList, setBoardsList] = useState([]);

  const [showEditOffcanvas, setShowEditOffcanvas] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const leadStatusOptions = [
    "Waitlisted",
    "Interested",
    "Toured",
    "Admitted",
    "Enrolled",
  ];
  const gradeLevels = [
    "Kindergarten",
    "1st Grade",
    "2nd Grade",
    "3rd Grade",
    "4th Grade",
    "5th Grade",
    "6th Grade",
    "7th Grade",
    "8th Grade",
    "9th Grade",
    "10th Grade",
    "11th Grade",
    "12th Grade",
  ];

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [leadData, tasksData, departmentsData, staffData, boardsData] =
        await Promise.all([
          getLeadByToken(token),
          getTasksForLead(token),
          getActiveDepartments(),
          getAllStaff(),
          getBoards().catch(() => []),
        ]);

      setLead(leadData);
      setTasks(tasksData);
      setDepartments(departmentsData);
      setStaffList(staffData.filter((s) => s.is_active));
      setBoardsList((boardsData || []).filter((b) => !b.is_folder && !b.is_archived));
      setNotes(leadData.internal_notes || "");
      setStatus(leadData.status);
    } catch (err) {
      setError("Failed to fetch lead details.");
      showError("Could not load lead details.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      await updateLead(token, { status, internal_notes: notes });
      showSuccess("Lead updated successfully!");
      fetchData();
    } catch (err) {
      showError("Failed to update lead.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (
      !taskTitle ||
      (assignedDepts.length === 0 &&
        assignedStaff.length === 0 &&
        !selectedBoard)
    ) {
      showWarning(
        "Please provide a title and assign the task to a department, staff member, or workspace space."
      );
      return;
    }
    try {
      await createTask({
        title: taskTitle,
        note: taskNote,
        lead_id: lead.id,
        assigned_department_ids: assignedDepts.map((d) => d.value),
        assigned_staff_ids: assignedStaff.map((s) => s.value),
        workspace_board_id: selectedBoard ? selectedBoard.value : null,
        due_date: dueDate ? dueDate.toISOString() : null,
      });
      showSuccess("Task created and assigned!");
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskNote("");
      setAssignedDepts([]);
      setAssignedStaff([]);
      setSelectedBoard(null);
      setDueDate(null);
      fetchData();
    } catch (err) {
      showError("Failed to create task.");
    }
  };

  const handleShowEdit = () => {
    setEditableData(
      JSON.parse(
        JSON.stringify({ students: lead.students, parents: lead.parents }),
      ),
    );
    setShowEditOffcanvas(true);
  };
  const handleCloseEdit = () => setShowEditOffcanvas(false);

  const handleInputChange = (type, index, event) => {
    const { name, value } = event.target;
    const updatedData = { ...editableData };
    updatedData[type][index][name] = value;
    setEditableData(updatedData);
  };

  const handleDateChange = (type, index, date) => {
    const updatedData = { ...editableData };
    updatedData[type][index].date_of_birth = date.toISOString();
    setEditableData(updatedData);
  };

  const handleSaveChanges = async () => {
    try {
      setSavingDetails(true);
      await updateLeadDetails(token, editableData);
      handleCloseEdit();
      fetchData();
      showSuccess("Details updated successfully!");
    } catch (error) {
      console.error(error);
      showError("Failed to save changes.");
    } finally {
      setSavingDetails(false);
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const dob = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
      years--;
      months += 12;
    }
    return `${years} years and ${months} months`;
  };

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString() : "N/A";

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!lead) return <p>Lead not found.</p>;

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const staffOptions = staffList.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.department_names?.join(", ") || "No Department"})`,
  }));

  const boardOptions = boardsList.map((b) => ({
    value: b.id,
    label: b.name,
  }));

  const studentOne = lead.students && lead.students[0];
  const studentInitials = studentOne
    ? `${studentOne.first_name?.charAt(0) || ""}${studentOne.last_name?.charAt(0) || ""}`.toUpperCase()
    : "LD";

  return (
    <div className="student-profile-rebuild" style={{ padding: "20px" }}>
      {/* Top Breadcrumb Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div style={{ fontSize: "14px", color: "#64748b" }}>
          <Link
            to="/admin/admissions"
            className="text-decoration-none"
            style={{ color: "#0ea5e9" }}
          >
            Admissions
          </Link>
          <span className="mx-2">/</span>
          <span style={{ fontWeight: "600", color: "#0f172a" }}>
            Lead:{" "}
            {studentOne
              ? `${studentOne.first_name} ${studentOne.last_name}`
              : "Unknown"}{" "}
            profile
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex border-bottom mb-4">
        <button
          onClick={() => setActiveTab("profile")}
          className="py-2 px-3 border-0 bg-transparent fw-bold"
          style={{
            fontSize: "14px",
            color: activeTab === "profile" ? "#0ea5e9" : "#64748b",
            borderBottom:
              activeTab === "profile" ? "2px solid #0ea5e9" : "none",
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className="py-2 px-3 border-0 bg-transparent fw-bold d-flex align-items-center gap-1"
          style={{
            fontSize: "14px",
            color: activeTab === "activity" ? "#0ea5e9" : "#64748b",
            borderBottom:
              activeTab === "activity" ? "2px solid #0ea5e9" : "none",
          }}
        >
          Activity & Tasks{" "}
          <span
            className="badge bg-secondary rounded-pill"
            style={{ fontSize: "10px" }}
          >
            {tasks.length + 1}
          </span>
        </button>
      </div>

      <Row>
        {/* Left Sidebar Panel */}
        <Col md={3} className="mb-4">
          <Card
            className="shadow-sm border-0 py-4 px-3 text-center"
            style={{ backgroundColor: "#f8fafc", borderRadius: "12px" }}
          >
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                backgroundColor: "#e2e8f0",
                color: "#64748b",
                fontSize: "28px",
              }}
            >
              {studentInitials}
            </div>
            <h5
              className="fw-bold mb-1 text-slate-800"
              style={{ fontSize: "16px" }}
            >
              {studentOne
                ? `${studentOne.last_name}, ${studentOne.first_name}`
                : "Lead Profile"}
            </h5>

            <hr className="my-3" style={{ borderTop: "1px solid #cbd5e1" }} />

            <div className="text-start mb-3">
              <label
                className="fw-bold text-slate-500 mb-1"
                style={{ fontSize: "11px" }}
              >
                LEAD STATUS
              </label>
              <select
                id="status-select"
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ fontSize: "12px" }}
              >
                {leadStatusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-start mb-3">
              <label
                className="fw-bold text-slate-500 mb-1"
                style={{ fontSize: "11px" }}
              >
                INTERNAL NOTES
              </label>
              <textarea
                className="form-control form-control-sm"
                rows="5"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                style={{ fontSize: "12px" }}
              />
            </div>

            <div className="d-grid gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={handleUpdate}
                className="fw-bold"
                disabled={updating}
              >
                {updating ? (
                  <Spinner size="sm" animation="border" className="me-2" />
                ) : null}
                Save Changes
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setIsTaskModalOpen(true)}
                className="fw-bold"
              >
                Create Task
              </Button>
            </div>
          </Card>
        </Col>

        {/* Right Details Panel */}
        <Col md={9}>
          {activeTab === "profile" && (
            <div className="space-y-6">
              <Card
                className="shadow-sm border-0"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <table
                      className="table table-hover align-middle mb-0"
                      style={{ fontSize: "13px" }}
                    >
                      <tbody>
                        <tr>
                          <td
                            className="fw-bold text-slate-500 py-3 ps-4"
                            style={{ width: "200px" }}
                          >
                            STATUS
                          </td>
                          <td className="py-3">
                            <span
                              className="d-flex align-items-center gap-2 fw-bold"
                              style={{ color: "#f59e0b" }}
                            >
                              <span
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: "#f59e0b",
                                }}
                              />
                              {lead.status?.toUpperCase() || "PENDING"}
                            </span>
                          </td>
                        </tr>
                        {lead.students &&
                          lead.students.map((student, index) => (
                            <React.Fragment key={student.id}>
                              <tr>
                                <td className="fw-bold text-slate-500 py-3 ps-4">
                                  GRADE LEVEL
                                </td>
                                <td className="py-3 fw-bold text-slate-800">
                                  {student.grade_level}
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-bold text-slate-500 py-3 ps-4">
                                  DOB
                                </td>
                                <td className="py-3 text-slate-800 fw-bold">
                                  {formatDate(student.date_of_birth)} (
                                  {calculateAge(student.date_of_birth)})
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-bold text-slate-500 py-3 ps-4">
                                  CITY / STATE
                                </td>
                                <td className="py-3 text-slate-800">
                                  {student.city_state || "N/A"}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">
                            ACTIONS
                          </td>
                          <td className="py-3">
                            <button
                              onClick={handleShowEdit}
                              className="btn btn-link text-decoration-none p-0 fw-bold d-flex align-items-center gap-1"
                              style={{ color: "#0ea5e9", fontSize: "12px" }}
                            >
                              <PencilSquare size={14} /> EDIT DETAILS
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>

              {/* Parents / Guardians Section */}
              <div className="mt-4">
                <h4
                  className="fw-bold text-slate-800 mb-3"
                  style={{
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Shield size={18} className="text-slate-500" /> Parents &
                  Contacts
                </h4>

                <Row>
                  {lead.parents &&
                    lead.parents.map((parent, index) => (
                      <Col md={6} key={parent.id} className="mb-3">
                        <Card
                          className="shadow-sm border border-light"
                          style={{ borderRadius: "10px" }}
                        >
                          <Card.Body className="p-3">
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <div
                                className="d-flex align-items-center justify-content-center fw-bold text-white"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  backgroundColor: "#94a3b8",
                                  fontSize: "12px",
                                }}
                              >
                                {`${parent.first_name?.charAt(0) || ""}${parent.last_name?.charAt(0) || ""}`.toUpperCase()}
                              </div>
                              <div>
                                <h6 className="fw-bold m-0 text-slate-800">
                                  {parent.first_name} {parent.last_name}
                                </h6>
                              </div>
                            </div>

                            <div
                              className="space-y-2 text-slate-600"
                              style={{ fontSize: "12px" }}
                            >
                              <div className="d-flex">
                                <span
                                  className="fw-bold text-slate-400"
                                  style={{ width: "120px" }}
                                >
                                  EMAIL
                                </span>
                                <span className="text-slate-800 text-truncate">
                                  {parent.email}
                                </span>
                              </div>
                              <div className="d-flex">
                                <span
                                  className="fw-bold text-slate-400"
                                  style={{ width: "120px" }}
                                >
                                  PHONE
                                </span>
                                <span className="text-slate-800">
                                  {parent.phone}
                                </span>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                </Row>
              </div>

              {/* Dedicated Additional Notes & Student Context Section */}
              <div className="mt-4">
                <Card
                  className="shadow-sm border-0"
                  style={{ borderRadius: "10px", overflow: "hidden" }}
                >
                  <div
                    className="d-flex justify-content-between align-items-center px-4 py-3 bg-light border-bottom"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <FileText size={18} className="text-slate-500" />
                      <h4
                        className="fw-bold text-slate-800 m-0"
                        style={{ fontSize: "15px" }}
                      >
                        Additional Notes & Student Context
                      </h4>
                    </div>

                    <div>
                      {!isEditingNotesCard ? (
                        <button
                          onClick={() => {
                            setTempNotesCard(notes || "");
                            setIsEditingNotesCard(true);
                          }}
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                          style={{ fontSize: "12px", fontWeight: 600 }}
                        >
                          <PencilSquare size={13} /> {notes ? "Edit Notes" : "Add Notes"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditingNotesCard(false)}
                          className="btn btn-sm btn-link text-muted text-decoration-none"
                          style={{ fontSize: "12px" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <Card.Body className="p-4">
                    {isEditingNotesCard ? (
                      <div>
                        <textarea
                          className="form-control mb-3"
                          rows="6"
                          value={tempNotesCard}
                          onChange={(e) => setTempNotesCard(e.target.value)}
                          placeholder="Record intake notes, student history, special accommodations, phone call summaries, etc."
                          style={{ fontSize: "13px", lineHeight: "1.6" }}
                        />
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => setIsEditingNotesCard(false)}
                            disabled={updating}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            className="fw-bold"
                            disabled={updating}
                            onClick={async () => {
                              try {
                                setUpdating(true);
                                await updateLead(token, { status, internal_notes: tempNotesCard });
                                setNotes(tempNotesCard);
                                setIsEditingNotesCard(false);
                                showSuccess("Student notes updated successfully!");
                                fetchData();
                              } catch (err) {
                                showError("Failed to save notes.");
                              } finally {
                                setUpdating(false);
                              }
                            }}
                          >
                            {updating ? <Spinner size="sm" animation="border" className="me-1" /> : null}
                            Save Notes
                          </Button>
                        </div>
                      </div>
                    ) : notes && notes.trim() ? (
                      <div>
                        <div
                          style={{
                            fontSize: "13px",
                            lineHeight: "1.7",
                            color: "#334155",
                            whiteSpace: "pre-wrap",
                            maxHeight: isNotesExpanded ? "none" : "150px",
                            overflow: "hidden",
                            position: "relative"
                          }}
                        >
                          {notes}
                          {!isNotesExpanded && notes.length > 250 && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: "50px",
                                background: "linear-gradient(transparent, #ffffff)",
                                pointerEvents: "none"
                              }}
                            />
                          )}
                        </div>

                        {notes.length > 250 && (
                          <div className="mt-2 pt-2 border-top">
                            <button
                              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                              className="btn btn-sm btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-1 text-primary fw-bold"
                              style={{ fontSize: "12px" }}
                            >
                              {isNotesExpanded ? (
                                <>
                                  <ChevronUp size={14} /> Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={14} /> Read Full Note
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted">
                        <FileText size={32} className="text-slate-300 mb-2" />
                        <p className="mb-2" style={{ fontSize: "13px" }}>
                          No intake notes or context recorded yet for this prospective student.
                        </p>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => {
                            setTempNotesCard("");
                            setIsEditingNotesCard(true);
                          }}
                        >
                          + Add Student Note
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <Card
                className="shadow-sm border-0 p-4"
                style={{ borderRadius: "12px" }}
              >
                <h5 className="fw-bold text-slate-800 mb-4">
                  Activity Timeline & Tasks
                </h5>
                <div className="timeline">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="timeline-item mb-4 pb-3 border-bottom border-light"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="fw-bold mb-1 text-slate-800">
                            Task: {task.title}
                          </p>
                          <p
                            className="text-slate-600 mb-2"
                            style={{ fontSize: "13px" }}
                          >
                            {task.note || "No note details provided."}
                          </p>

                          {task.due_date && (
                            <div
                              className="text-slate-400 mb-1"
                              style={{ fontSize: "11px" }}
                            >
                              <strong>Due:</strong>{" "}
                              {new Date(task.due_date).toLocaleString()}
                            </div>
                          )}

                          <div
                            className="d-flex flex-wrap gap-2 text-slate-400"
                            style={{ fontSize: "11px" }}
                          >
                            {task.assigned_department_names?.length > 0 && (
                              <span>
                                <strong>Dept:</strong>{" "}
                                {task.assigned_department_names.join(", ")}
                              </span>
                            )}
                            {task.assigned_staff_names?.length > 0 && (
                              <span>
                                <strong>Staff:</strong>{" "}
                                {task.assigned_staff_names.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className="badge bg-light text-slate-600 border px-2 py-1 rounded"
                          style={{ fontSize: "11px" }}
                        >
                          {task.status}
                        </span>
                      </div>
                      <div
                        className="mt-2 text-slate-400"
                        style={{ fontSize: "10px" }}
                      >
                        Created by {task.created_by_staff_name || "System"} on{" "}
                        {new Date(task.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="timeline-item">
                    <p className="fw-bold mb-1 text-slate-800">Lead Created</p>
                    <small className="text-slate-400">
                      Submitted on {new Date(lead.created_at).toLocaleString()}
                    </small>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Col>
      </Row>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content p-4"
            style={{
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              maxWidth: "520px",
              boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold text-slate-800 mb-0" style={{ fontSize: "15px" }}>
                  Create Task
                </h5>
                <span className="text-muted" style={{ fontSize: "12px" }}>
                  Add a task for this prospective lead and optionally route to Workspace
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="btn-close"
                style={{ transform: "scale(0.8)" }}
                aria-label="Close"
              />
            </div>

            <form onSubmit={handleCreateTask}>
              <Form.Group className="mb-2">
                <Form.Label
                  className="fw-semibold text-slate-700 mb-1"
                  style={{ fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.03em" }}
                >
                  Task Title *
                </Form.Label>
                <Form.Control
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Schedule family campus tour"
                  required
                  style={{
                    fontSize: "12.5px",
                    height: "36px",
                    borderRadius: "8px",
                    borderColor: "#cbd5e1",
                  }}
                />
              </Form.Group>

              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label
                      className="fw-semibold text-slate-700 mb-1"
                      style={{ fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.03em" }}
                    >
                      Lead
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={lead.students?.map((s) => s.first_name).join(", ")}
                      readOnly
                      disabled
                      style={{
                        fontSize: "12.5px",
                        height: "36px",
                        borderRadius: "8px",
                        borderColor: "#e2e8f0",
                        backgroundColor: "#f8fafc",
                        color: "#64748b",
                      }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label
                      className="fw-semibold text-slate-700 mb-1"
                      style={{ fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.03em" }}
                    >
                      Due Date
                    </Form.Label>
                    <DatePicker
                      selected={dueDate}
                      onChange={(date) => setDueDate(date)}
                      showTimeSelect
                      dateFormat="Pp"
                      className="form-control"
                      placeholderText="Select date & time"
                      customInput={
                        <input
                          style={{
                            fontSize: "12.5px",
                            height: "36px",
                            borderRadius: "8px",
                            borderColor: "#cbd5e1",
                            width: "100%",
                          }}
                        />
                      }
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-2">
                <Form.Label
                  className="fw-semibold text-slate-700 mb-1"
                  style={{ fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.03em" }}
                >
                  Notes & Details
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="Add specific instructions or context for this task..."
                  style={{
                    fontSize: "12.5px",
                    borderRadius: "8px",
                    borderColor: "#cbd5e1",
                  }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label
                  className="fw-semibold text-slate-700 mb-1 d-block"
                  style={{ fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.03em" }}
                >
                  Assigned To
                </Form.Label>
                <div className="d-flex flex-column gap-2">
                  <Select
                    options={departmentOptions}
                    isMulti
                    value={assignedDepts}
                    onChange={setAssignedDepts}
                    placeholder="Select departments..."
                    styles={sleekSelectStyles}
                  />
                  <Select
                    options={staffOptions}
                    isMulti
                    value={assignedStaff}
                    onChange={setAssignedStaff}
                    placeholder="Select specific staff members..."
                    styles={sleekSelectStyles}
                  />
                  <Select
                    options={boardOptions}
                    value={selectedBoard}
                    onChange={setSelectedBoard}
                    isClearable
                    placeholder="Select Workspace space / board (optional)..."
                    styles={sleekSelectStyles}
                  />
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setIsTaskModalOpen(false)}
                  style={{
                    fontSize: "12.5px",
                    borderRadius: "7px",
                    padding: "6px 14px",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  style={{
                    fontSize: "12.5px",
                    borderRadius: "7px",
                    padding: "6px 18px",
                    backgroundColor: "#673de6",
                    borderColor: "#673de6",
                    fontWeight: "500",
                  }}
                >
                  Save Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Offcanvas */}
      <Offcanvas
        show={showEditOffcanvas}
        onHide={handleCloseEdit}
        placement="end"
        style={{ width: "500px" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-bold text-slate-800">
            Edit Lead Details
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {editableData && (
            <Form>
              {editableData.students.map((student, index) => (
                <div
                  key={`edit-student-${index}`}
                  className="mb-4 p-3 border rounded"
                  style={{ backgroundColor: "#f8fafc" }}
                >
                  <h5
                    className="fw-bold text-slate-700 mb-3"
                    style={{ fontSize: "14px" }}
                  >
                    Student #{index + 1}
                  </h5>
                  <Form.Group className="mb-2">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={student.first_name}
                      onChange={(e) => handleInputChange("students", index, e)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={student.last_name}
                      onChange={(e) => handleInputChange("students", index, e)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Date of Birth</Form.Label>
                    <DatePicker
                      selected={new Date(student.date_of_birth)}
                      onChange={(date) =>
                        handleDateChange("students", index, date)
                      }
                      className="form-control"
                      dateFormat="MMMM d, yyyy"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>City/State</Form.Label>
                    <Form.Control
                      type="text"
                      name="city_state"
                      value={student.city_state}
                      onChange={(e) => handleInputChange("students", index, e)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Grade Level</Form.Label>
                    <Form.Select
                      name="grade_level"
                      value={student.grade_level}
                      onChange={(e) => handleInputChange("students", index, e)}
                    >
                      <option value="">Select Grade</option>
                      {gradeLevels.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              ))}
              <hr />
              {editableData.parents.map((parent, index) => (
                <div
                  key={`edit-parent-${index}`}
                  className="mb-4 p-3 border rounded"
                  style={{ backgroundColor: "#f8fafc" }}
                >
                  <h5
                    className="fw-bold text-slate-700 mb-3"
                    style={{ fontSize: "14px" }}
                  >
                    Parent #{index + 1}
                  </h5>
                  <Form.Group className="mb-2">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={parent.first_name}
                      onChange={(e) => handleInputChange("parents", index, e)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={parent.last_name}
                      onChange={(e) => handleInputChange("parents", index, e)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={parent.email}
                      onChange={(e) => handleInputChange("parents", index, e)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={parent.phone}
                      onChange={(e) => handleInputChange("parents", index, e)}
                    />
                  </Form.Group>
                </div>
              ))}
              <Button
                variant="primary"
                onClick={handleSaveChanges}
                className="w-100 mt-3 fw-bold"
                disabled={savingDetails}
              >
                {savingDetails ? (
                  <Spinner size="sm" animation="border" className="me-2" />
                ) : null}
                Save Changes
              </Button>
            </Form>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default LeadDetailPage;
