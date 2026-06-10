import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Form, Modal, Table } from "react-bootstrap";
import { PencilSquare, ShieldLock, Trash } from "react-bootstrap-icons";

import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import PageHeader from "../../components/admin/PageHeader";
import { TableSkeleton } from "../../components/Skeleton";
import {
  createSuperAdmin,
  deleteSuperAdmin,
  getSuperAdmins,
  updateSuperAdmin,
} from "../../services/superAdminService";

const EMPTY_ADMIN = {
  id: null,
  name: "",
  email: "",
  password: "",
  is_active: true,
};

const ManageSuperAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(EMPTY_ADMIN);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getSuperAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load super admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleShowModal = (admin = null) => {
    if (admin) {
      setIsEditing(true);
      setCurrentAdmin({ ...admin, password: "" });
    } else {
      setIsEditing(false);
      setCurrentAdmin(EMPTY_ADMIN);
    }
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      if (isEditing) {
        const payload = { ...currentAdmin };
        if (!payload.password) {
          delete payload.password;
        }
        await updateSuperAdmin(currentAdmin.id, payload);
      } else {
        await createSuperAdmin(currentAdmin);
      }
      setShowModal(false);
      setCurrentAdmin(EMPTY_ADMIN);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save super admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToDelete) return;
    try {
      setDeleting(true);
      setError("");
      await deleteSuperAdmin(adminToDelete.id);
      setShowDeleteModal(false);
      setAdminToDelete(null);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete super admin.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Super Admin Access"
        buttonText="Add Super Admin"
        onButtonClick={() => handleShowModal()}
      />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <Card className="content-card">
          <Card.Body>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="module-card-icon" style={{ borderColor: "#e9d5ff", color: "#673de6" }}>
                <ShieldLock size={18} />
              </div>
              <div>
                <h5 className="mb-1">Individual superadmin accounts</h5>
                <p className="text-muted mb-0">
                  Administration and IT can each keep separate superadmin access and staff-management control.
                </p>
              </div>
            </div>

            <Table responsive className="modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <strong>{admin.name}</strong>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <Badge bg={admin.is_active ? "success" : "secondary"}>
                        {admin.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td className="text-end action-buttons">
                      <Button variant="link" onClick={() => handleShowModal(admin)}>
                        <PencilSquare size={18} />
                      </Button>
                      <Button
                        variant="link"
                        onClick={() => {
                          setAdminToDelete(admin);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Edit Super Admin" : "Add Super Admin"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={currentAdmin.name}
                onChange={(event) => setCurrentAdmin((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={currentAdmin.email}
                onChange={(event) => setCurrentAdmin((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder={isEditing ? "Leave blank to keep the current password" : ""}
                value={currentAdmin.password}
                onChange={(event) => setCurrentAdmin((prev) => ({ ...prev, password: event.target.value }))}
                required={!isEditing}
              />
            </Form.Group>

            <Form.Check
              type="switch"
              id="super-admin-active"
              label="Account is active"
              checked={currentAdmin.is_active}
              onChange={(event) =>
                setCurrentAdmin((prev) => ({ ...prev, is_active: event.target.checked }))
              }
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setAdminToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Super Admin"
        message={
          adminToDelete
            ? `Are you sure you want to permanently delete the super admin account "${adminToDelete.name}"?`
            : ""
        }
        loading={deleting}
      />
    </div>
  );
};

export default ManageSuperAdmins;
