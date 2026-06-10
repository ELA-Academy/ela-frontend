import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Table,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { Check, X, Pencil, Trash } from "react-bootstrap-icons";
import {
  getPresetItems,
  createPresetItem,
  updatePresetItem,
  deletePresetItem,
} from "../../../services/billingService";
import { showSuccess, showError } from "../../../utils/notificationService";
import DeleteConfirmModal from "../DeleteConfirmModal";

const ManagePresetsModal = ({ show, handleClose, onUpdate }) => {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ description: "", amount: "" });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (show) {
      fetchPresets();
    }
  }, [show]);

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const data = await getPresetItems();
      setPresets(data);
    } catch (err) {
      showError("Failed to load presets.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditData({ description: "", amount: "" });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setEditData({ description: "", amount: "" });
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        await createPresetItem(editData);
        showSuccess("Preset added successfully.");
      } else {
        await updatePresetItem(editingId, editData);
        showSuccess("Preset updated successfully.");
      }
      handleCancel();
      fetchPresets();
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to save preset.");
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (presetId) => {
    setDeleteTargetId(presetId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePresetItem(deleteTargetId);
      showSuccess("Preset deleted successfully.");
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      fetchPresets();
      if (onUpdate) onUpdate();
    } catch (err) {
      showError("Failed to delete preset.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (preset) => {
    setEditingId(preset.id);
    setEditData({ description: preset.description, amount: preset.amount });
    setIsAdding(false);
  };

  const renderRow = (preset) => {
    const isEditingThisRow = editingId === preset.id;
    return (
      <tr key={preset.id}>
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
            preset.description
          )}
        </td>
        <td>
          {isEditingThisRow ? (
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) =>
                  setEditData({ ...editData, amount: e.target.value })
                }
              />
            </InputGroup>
          ) : (
            `$${preset.amount.toFixed(2)}`
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
              <Button variant="link" onClick={() => handleEdit(preset)}>
                <Pencil size={16} />
              </Button>
              <Button
                variant="link"
                className="text-danger"
                onClick={() => handleDeleteClick(preset.id)}
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
        <Modal.Title>Manage Presets</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Button onClick={handleAddNew} disabled={isAdding} className="mb-3">
          Add Preset
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
                <th>Rate</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr>
                  <td>
                    <Form.Control
                      type="text"
                      placeholder="Preset description"
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <InputGroup>
                      <InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editData.amount}
                        onChange={(e) =>
                          setEditData({ ...editData, amount: e.target.value })
                        }
                      />
                    </InputGroup>
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
              {presets.map(renderRow)}
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
        title="Delete Preset"
        message="Are you sure you want to permanently delete this preset?"
        loading={deleting}
      />
    </Modal>
  );
};

export default ManagePresetsModal;
