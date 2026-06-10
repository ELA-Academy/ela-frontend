import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner, Row, Col, Alert } from "react-bootstrap";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { getActiveDepartments } from "../../services/admissionsService";
import { getAllStaff } from "../../services/staffService";
import { updateTask } from "../../services/taskService";
import { showSuccess, showError } from "../../utils/notificationService";

const EditTaskModal = ({ show, handleClose, task, onTaskUpdated }) => {
  const [formData, setFormData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const taskStatusOptions = ["To-Do", "In Progress", "Completed"];
  const leadStatusOptions = [
    "Waitlisted",
    "Interested",
    "Toured",
    "Admitted",
    "Enrolled",
  ];

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        note: task.note || "",
        status: task.status || "To-Do",
        lead_status: task.lead_status || "",
        due_date: task.due_date ? new Date(task.due_date) : null,
        assigned_department_ids: task.assigned_department_ids || [],
        assigned_staff_ids: task.assigned_staff_ids || [],
      });
    }
  }, [task]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);
        const [depts, staff] = await Promise.all([
          getActiveDepartments(),
          getAllStaff(),
        ]);
        setDepartments(depts);
        setStaffList(staff.filter((s) => s.is_active));
      } catch (err) {
        showError("Failed to load assignment options.");
      } finally {
        setLoading(false);
      }
    };
    if (show) {
      fetchDropdownData();
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
      };
      if (payload.lead_status === "") {
        delete payload.lead_status; // Don't send if unchanged
      }
      await updateTask(task.id, payload);
      showSuccess("Task updated successfully!");
      onTaskUpdated();
      handleClose();
    } catch (err) {
      showError("Failed to update task.");
    } finally {
      setIsSaving(false);
    }
  };

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));
  const staffOptions = staffList.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.department_names.join(", ") || "No Dept"})`,
  }));

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Task</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {loading ? (
            <div className="text-center">
              <Spinner />
            </div>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Task Status</Form.Label>
                    <Form.Select
                      value={formData.status || "To-Do"}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      {taskStatusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Due Date</Form.Label>
                    <DatePicker
                      selected={formData.due_date}
                      onChange={(date) =>
                        setFormData({ ...formData, due_date: date })
                      }
                      showTimeSelect
                      dateFormat="Pp"
                      className="form-control"
                      placeholderText="Select date and time"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.note || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                />
              </Form.Group>
              <Alert variant="info">
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Update Lead Status
                  </Form.Label>
                  <Form.Text className="d-block mb-2">
                    Optionally, update the status of the associated lead (
                    {task.lead_status}) when saving this task.
                  </Form.Text>
                  <Form.Select
                    value={formData.lead_status || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, lead_status: e.target.value })
                    }
                  >
                    <option value="">-- Do Not Change --</option>
                    {leadStatusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Alert>
              <Form.Group className="mb-3">
                <Form.Label>Re-assign To</Form.Label>
                <Select
                  options={departmentOptions}
                  isMulti
                  value={departmentOptions.filter((opt) =>
                    formData.assigned_department_ids.includes(opt.value)
                  )}
                  onChange={(opts) =>
                    setFormData({
                      ...formData,
                      assigned_department_ids: opts.map((o) => o.value),
                    })
                  }
                  placeholder="Select departments..."
                  className="mb-2"
                />
                <Select
                  options={staffOptions}
                  isMulti
                  value={staffOptions.filter((opt) =>
                    formData.assigned_staff_ids.includes(opt.value)
                  )}
                  onChange={(opts) =>
                    setFormData({
                      ...formData,
                      assigned_staff_ids: opts.map((o) => o.value),
                    })
                  }
                  placeholder="Select specific staff members..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? <Spinner as="span" size="sm" /> : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditTaskModal;
