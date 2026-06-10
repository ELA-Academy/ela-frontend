import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Spinner } from "react-bootstrap";
import { Check, X, Pencil, Trash } from "react-bootstrap-icons";
import {
  getPresetDiscounts,
  createPresetDiscount,
  updatePresetDiscount,
  deletePresetDiscount,
} from "../../../services/billingService";
import { showSuccess, showError } from "../../../utils/notificationService";
import DeleteConfirmModal from "../DeleteConfirmModal";

const ManageDiscountsModal = ({ show, handleClose, onUpdate }) => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ description: "" });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (show) {
      fetchDiscounts();
    }
  }, [show]);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const data = await getPresetDiscounts();
      setDiscounts(data);
    } catch (err) {
      showError("Failed to load discounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditData({ description: "" });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setEditData({ description: "" });
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        await createPresetDiscount(editData);
        showSuccess("Discount added successfully.");
      } else {
        await updatePresetDiscount(editingId, editData);
        showSuccess("Discount updated successfully.");
      }
      handleCancel();
      fetchDiscounts();
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to save discount.");
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (discountId) => {
    setDeleteTargetId(discountId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePresetDiscount(deleteTargetId);
      showSuccess("Discount deleted successfully.");
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      fetchDiscounts();
      if (onUpdate) onUpdate();
    } catch (err) {
      showError("Failed to delete discount.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (discount) => {
    setEditingId(discount.id);
    setEditData({ description: discount.description });
    setIsAdding(false);
  };

  const renderRow = (discount) => {
    const isEditingThisRow = editingId === discount.id;
    return (
      <tr key={discount.id}>
        <td>
          {isEditingThisRow ? (
            <Form.Control
              type="text"
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
            />
          ) : (
            discount.description
          )}
        </td>
        <td className="text-end">
          {isEditingThisRow ? (
            <>
              <Button variant="link" onClick={handleSave}>
                <Check size={20} />
              </Button>
              <Button
                variant="link"
                className="text-danger"
                onClick={handleCancel}
              >
                <X size={20} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="link" onClick={() => handleEdit(discount)}>
                <Pencil size={16} />
              </Button>
              <Button
                variant="link"
                className="text-danger"
                onClick={() => handleDeleteClick(discount.id)}
              >
                <Trash size={16} />
              </Button>
            </>
          )}
        </td>
      </tr>
    );
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Manage Discounts</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Button onClick={handleAddNew} disabled={isAdding} className="mb-3">
          Add Discount
        </Button>
        {loading ? (
          <div className="text-center">
            <Spinner />
          </div>
        ) : (
          <Table hover>
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr>
                  <td>
                    <Form.Control
                      type="text"
                      placeholder="Discount description"
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="text-end">
                    <Button variant="link" onClick={handleSave}>
                      <Check size={20} />
                    </Button>
                    <Button
                      variant="link"
                      className="text-danger"
                      onClick={handleCancel}
                    >
                      <X size={20} />
                    </Button>
                  </td>
                </tr>
              )}
              {discounts.map(renderRow)}
            </tbody>
          </Table>
        )}
      </Modal.Body>

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Discount"
        message="Are you sure you want to permanently delete this discount description?"
        loading={deleting}
      />
    </Modal>
  );
};

export default ManageDiscountsModal;
