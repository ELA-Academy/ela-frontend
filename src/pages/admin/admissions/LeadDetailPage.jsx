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
} from "lucide-react";
import "../../../styles/StudentProfile.css";
import "../../../styles/AdminModern.css";

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

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [assignedDepts, setAssignedDepts] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [dueDate, setDueDate] = useState(null);

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
      const [leadData, tasksData, departmentsData, staffData] =
        await Promise.all([
          getLeadByToken(token),
          getTasksForLead(token),
          getActiveDepartments(),
          getAllStaff(),
        ]);

      setLead(leadData);
      setTasks(tasksData);
      setDepartments(departmentsData);
      setStaffList(staffData.filter((s) => s.is_active));
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
      (assignedDepts.length === 0 && assignedStaff.length === 0)
    ) {
      showWarning("Please provide a title and assign the task.");
      return;
    }
    try {
      await createTask({
        title: taskTitle,
        note: taskNote,
        lead_id: lead.id,
        assigned_department_ids: assignedDepts.map((d) => d.value),
        assigned_staff_ids: assignedStaff.map((s) => s.value),
        due_date: dueDate ? dueDate.toISOString() : null,
      });
      showSuccess("Task created and assigned!");
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskNote("");
      setAssignedDepts([]);
      setAssignedStaff([]);
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
            className="modal-content"
            style={{ borderRadius: "12px", border: "0" }}
          >
            <h2 className="fw-bold text-slate-800 h5 mb-3">Create Task</h2>
            <form onSubmit={handleCreateTask}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-slate-600">
                  Title
                </Form.Label>
                <Form.Control
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task Name"
                  required
                />
              </Form.Group>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-slate-600">
                      Lead
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={lead.students?.map((s) => s.first_name).join(", ")}
                      readOnly
                      disabled
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-slate-600">
                      Due Date
                    </Form.Label>
                    <DatePicker
                      selected={dueDate}
                      onChange={(date) => setDueDate(date)}
                      showTimeSelect
                      dateFormat="Pp"
                      className="form-control"
                      placeholderText="Select date and time"
                    />
                  </Form.Group>
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-slate-600">Note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="Task Details here"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-slate-600">
                  Assigned To
                </Form.Label>
                <Select
                  options={departmentOptions}
                  isMulti
                  value={assignedDepts}
                  onChange={setAssignedDepts}
                  placeholder="Select departments..."
                  className="mb-2"
                />
                <Select
                  options={staffOptions}
                  isMulti
                  value={assignedStaff}
                  onChange={setAssignedStaff}
                  placeholder="Select specific staff members..."
                />
              </Form.Group>
              <div className="modal-actions d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save
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
