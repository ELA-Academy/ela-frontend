import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button, Offcanvas, Form, Spinner, Alert } from "react-bootstrap";
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
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [assignedDepts, setAssignedDepts] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [dueDate, setDueDate] = useState(null);

  const [showEditOffcanvas, setShowEditOffcanvas] = useState(false);
  const [editableData, setEditableData] = useState(null);

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
      await updateLead(token, { status, internal_notes: notes });
      showSuccess("Lead updated successfully!");
      fetchData();
    } catch (err) {
      showError("Failed to update lead.");
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
        JSON.stringify({ students: lead.students, parents: lead.parents })
      )
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
      await updateLeadDetails(token, editableData);
      handleCloseEdit();
      fetchData();
      showSuccess("Details updated successfully!");
    } catch (error) {
      console.error(error);
      showError("Failed to save changes.");
    }
  };

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!lead) return <p>Lead not found.</p>;

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  // --- THIS IS THE FIX ---
  // We now use `s.department_names` (plural) and join them into a string.
  const staffOptions = staffList.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.department_names.join(", ") || "No Department"})`,
  }));

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString() : "N/A";

  return (
    <div className="lead-detail-page">
      <header className="page-header">
        <h1>
          Lead: {lead.students?.map((s) => s.first_name).join(", ") || ""}
        </h1>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={() => setIsTaskModalOpen(true)}>
            Create Task
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Save Changes
          </Button>
        </div>
      </header>
      <div className="lead-grid">
        <div className="details-card">
          <div className="d-flex justify-content-between align-items-center">
            <h3>Application Details</h3>
            <Button
              variant="link"
              onClick={handleShowEdit}
              title="Edit Lead Details"
            >
              <PencilSquare size={20} />
            </Button>
          </div>
          {lead.students?.map((student, index) => (
            <div key={`student-${index}`} className="mb-4">
              <h4 className="h6 fw-bold text-primary">Student #{index + 1}</h4>
              <p>
                <strong>Name:</strong> {student.first_name} {student.last_name}
              </p>
              <p>
                <strong>Date of Birth:</strong>{" "}
                {formatDate(student.date_of_birth)}
              </p>
              <p>
                <strong>Grade Level:</strong> {student.grade_level}
              </p>
              <p>
                <strong>City/State:</strong> {student.city_state}
              </p>
            </div>
          ))}
          <hr />
          {lead.parents?.map((parent, index) => (
            <div key={`parent-${index}`} className="mt-4">
              <h4 className="h6 fw-bold text-primary">
                Parent/Guardian #{index + 1}
              </h4>
              <p>
                <strong>Name:</strong> {parent.first_name} {parent.last_name}
              </p>
              <p>
                <strong>Email:</strong> {parent.email}
              </p>
              <p>
                <strong>Phone:</strong> {parent.phone}
              </p>
            </div>
          ))}
        </div>
        <div className="details-card">
          <h3>Update Status & Notes</h3>
          <label htmlFor="status-select">
            <strong>Status</strong>
          </label>
          <select
            id="status-select"
            className="mb-3 form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {leadStatusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <label htmlFor="internal-notes">
            <strong>Internal Notes</strong>
          </label>
          <textarea
            id="internal-notes"
            className="form-control"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="8"
            placeholder="Add internal notes..."
          />
        </div>
        <div className="details-card full-width">
          <h3>Activity & Tasks</h3>
          <div className="timeline">
            {tasks.map((task) => (
              <div key={task.id} className="timeline-item">
                <p>
                  <strong>Task: {task.title}</strong>
                </p>
                {task.due_date && (
                  <p>
                    <strong>Due:</strong>{" "}
                    {new Date(task.due_date).toLocaleString()}
                  </p>
                )}
                {task.assigned_department_names?.length > 0 && (
                  <p>
                    Assigned to Dept(s):{" "}
                    {task.assigned_department_names.join(", ")}
                  </p>
                )}
                {task.assigned_staff_names?.length > 0 && (
                  <p>
                    Assigned to Staff: {task.assigned_staff_names.join(", ")}
                  </p>
                )}
                <p>Note: {task.note || "N/A"}</p>
                <small>
                  Created by {task.created_by_staff_name} on{" "}
                  {new Date(task.created_at).toLocaleString()}
                </small>
              </div>
            ))}
            <div className="timeline-item">
              <p>
                <strong>Lead Created</strong>
              </p>
              <small>
                Submitted on {new Date(lead.created_at).toLocaleString()}
              </small>
            </div>
          </div>
        </div>
      </div>
      {isTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create Task</h2>
            <form onSubmit={handleCreateTask}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
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
                    <Form.Label>Lead</Form.Label>
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
                    <Form.Label>Due Date</Form.Label>
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
                <Form.Label>Note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="Task Details here"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Assigned To</Form.Label>
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
              <div className="modal-actions">
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
      <Offcanvas
        show={showEditOffcanvas}
        onHide={handleCloseEdit}
        placement="end"
        style={{ width: "500px" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Edit Lead</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {editableData && (
            <Form>
              {editableData.students.map((student, index) => (
                <div
                  key={`edit-student-${index}`}
                  className="mb-4 p-3 border rounded"
                >
                  <h5>Student #{index + 1}</h5>
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
                >
                  <h5>Parent #{index + 1}</h5>
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
                className="w-100 mt-3"
              >
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
