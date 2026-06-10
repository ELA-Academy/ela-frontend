import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Badge,
} from "react-bootstrap";
import { TableSkeleton } from "../../components/Skeleton";
import { PencilSquare, Trash } from "react-bootstrap-icons";
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../services/departmentService";
import { showSuccess, showError } from "../../utils/notificationService";
import PageHeader from "../../components/admin/PageHeader";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";

// Define system departments by their unique, protected routes
const SYSTEM_DEPARTMENT_ROUTES = [
  "/admin/admissions",
  "/admin/accounting",
  "/admin/administration",
];

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (err) {
      setError("Failed to load departments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleShowCreateModal = () => {
    setIsEditing(false);
    setCurrentDept({ name: "", description: "", dashboard_route: "" });
    setShowModal(true);
  };

  const handleShowEditModal = (dept) => {
    setIsEditing(true);
    setCurrentDept(dept);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentDept(null);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    try {
      setDeleting(true);
      await deleteDepartment(deptToDelete.id);
      showSuccess("Department deleted successfully!");
      setShowDeleteModal(false);
      setDeptToDelete(null);
      fetchDepartments();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to delete department.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveChanges = async (deptData) => {
    try {
      if (isEditing) {
        await updateDepartment(deptData.id, deptData);
        showSuccess("Department updated successfully!");
      } else {
        await createDepartment(deptData);
        showSuccess("Department created successfully!");
      }
      fetchDepartments();
      handleCloseModal();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to save changes.");
    }
  };

  return (
    <>
      <PageHeader
        title="Manage Departments"
        buttonText="Create Department"
        onButtonClick={handleShowCreateModal}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        !error && (
          <div className="table-container">
          <Table className="modern-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Description</th>
                <th>Dashboard Route</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => {
                // --- NEW: Check if the department is a protected system department ---
                const isSystemDept = SYSTEM_DEPARTMENT_ROUTES.includes(
                  dept.dashboard_route
                );

                return (
                  <tr key={dept.id}>
                    <td>
                      <strong>{dept.name}</strong>
                      {/* --- NEW: Add a visual badge for system departments --- */}
                      {isSystemDept && (
                        <Badge bg="secondary" className="ms-2">
                          System
                        </Badge>
                      )}
                    </td>
                    <td>{dept.description}</td>
                    <td>{dept.dashboard_route || "N/A"}</td>
                    <td>
                      <Button
                        variant="link"
                        onClick={() => handleShowEditModal(dept)}
                        title="Edit"
                      >
                        <PencilSquare />
                      </Button>
                      {/* --- NEW: Disable the delete button for system departments --- */}
                      <Button
                        variant="link"
                        className="text-danger"
                        onClick={() => {
                          setDeptToDelete(dept);
                          setShowDeleteModal(true);
                        }}
                        disabled={isSystemDept}
                        title={
                          isSystemDept
                            ? "System departments cannot be deleted"
                            : "Delete"
                        }
                      >
                        <Trash />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          </div>
        )
      )}

      {showModal && (
        <DepartmentModal
          show={showModal}
          handleClose={handleCloseModal}
          handleSave={handleSaveChanges}
          isEditing={isEditing}
          department={currentDept}
        />
      )}

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeptToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Department"
        message={deptToDelete ? `Are you sure you want to permanently delete the department "${deptToDelete.name}"? This will affect staff and workspace dashboard routing.` : ""}
        loading={deleting}
      />
    </>
  );
};

// Sub-component for the Modal form
const DepartmentModal = ({
  show,
  handleClose,
  handleSave,
  isEditing,
  department,
}) => {
  const [formData, setFormData] = useState(department);

  const isSystemDept =
    isEditing && SYSTEM_DEPARTMENT_ROUTES.includes(department.dashboard_route);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave(formData);
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditing ? "Edit Department" : "Create New Department"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Department Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSystemDept}
            />
            {isSystemDept && (
              <Form.Text className="text-muted">
                The name of a system department cannot be changed.
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Dashboard Route (Optional)</Form.Label>
            <Form.Control
              type="text"
              name="dashboard_route"
              placeholder="/admin/custom-dashboard"
              value={formData.dashboard_route || ""}
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              For custom departments, link to a generic dashboard URL.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ManageDepartments;
