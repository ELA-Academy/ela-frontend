import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Badge,
  Card,
  Tooltip,
  OverlayTrigger,
  Spinner,
} from "react-bootstrap";
import { PencilSquare, Trash } from "react-bootstrap-icons";
import { Plus } from "lucide-react";
import Select from "react-select"; // --- NEW IMPORT ---
import api from "../../utils/api";
import PageHeader from "../../components/admin/PageHeader";
import { TableSkeleton } from "../../components/Skeleton";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";

const ManageStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStaff, setCurrentStaff] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    department_ids: [], // Changed from department_id
    is_active: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [staffRes, deptRes] = await Promise.all([
        api.get("/staff"),
        api.get("/departments"),
      ]);
      setStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
      const activeDepts = Array.isArray(deptRes.data)
        ? deptRes.data.filter((d) => d.is_active)
        : [];
      setDepartments(activeDepts);
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShowModal = (staff = null) => {
    if (staff) {
      setIsEditing(true);
      setCurrentStaff({ ...staff, password: "" });
    } else {
      setIsEditing(false);
      setCurrentStaff({
        id: null,
        name: "",
        email: "",
        password: "",
        department_ids: [],
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...currentStaff };
    if (isEditing && !payload.password) delete payload.password;

    try {
      setSubmitting(true);
      setError("");
      if (isEditing) {
        await api.put(`/staff/${payload.id}`, payload);
      } else {
        await api.post("/staff", payload);
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save staff member.");
    } finally {
      setSubmitting(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/staff/${staffToDelete.id}`);
      setShowDeleteModal(false);
      setStaffToDelete(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete staff member.");
    } finally {
      setDeleting(false);
    }
  };

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  return (
    <div>
      <PageHeader
        title="Manage Staff"
        buttonText="Add Staff"
        onButtonClick={() => handleShowModal()}
      />
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <Card className="content-card">
          <Card.Body>
            <Table responsive className="modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Departments</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <strong>{staff.name}</strong>
                    </td>
                    <td>{staff.email}</td>
                    <td>{staff.department_names.join(", ")}</td>
                    <td>
                      <Badge bg={staff.is_active ? "success" : "secondary"}>
                        {staff.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="text-end action-buttons">
                      <OverlayTrigger overlay={<Tooltip>Edit</Tooltip>}>
                        <Button
                          variant="link"
                          onClick={() => handleShowModal(staff)}
                        >
                          <PencilSquare size={20} />
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}>
                        <Button
                          variant="link"
                          onClick={() => {
                            setStaffToDelete(staff);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash size={20} />
                        </Button>
                      </OverlayTrigger>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Edit" : "Add New"} Staff Member
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={currentStaff.name}
                onChange={(e) =>
                  setCurrentStaff({ ...currentStaff, name: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={currentStaff.email}
                onChange={(e) =>
                  setCurrentStaff({ ...currentStaff, email: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Departments</Form.Label>
              <Select
                options={departmentOptions}
                isMulti
                value={departmentOptions.filter((opt) =>
                  currentStaff.department_ids.includes(opt.value)
                )}
                onChange={(selectedOptions) =>
                  setCurrentStaff({
                    ...currentStaff,
                    department_ids: selectedOptions.map((opt) => opt.value),
                  })
                }
                required
              />
            </Form.Group>

            {isEditing && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Leave blank to keep current"
                    onChange={(e) =>
                      setCurrentStaff({ ...currentStaff, password: e.target.value })
                    }
                  />
                </Form.Group>

                <Form.Check
                  type="switch"
                  id="active-switch"
                  label="Account is Active"
                  checked={currentStaff.is_active}
                  onChange={(e) =>
                    setCurrentStaff({
                      ...currentStaff,
                      is_active: e.target.checked,
                    })
                  }
                />
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  {isEditing ? "Saving..." : "Adding..."}
                </>
              ) : (
                <>
                  {!isEditing && <Plus size={16} className="me-1" />}
                  {isEditing ? "Save Changes" : "Add"}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setStaffToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Staff Member"
        message={staffToDelete ? `Are you sure you want to permanently delete the staff member "${staffToDelete.name}"? They will lose access to all departmental workflows.` : ""}
        loading={deleting}
      />
    </div>
  );
};

export default ManageStaff;
