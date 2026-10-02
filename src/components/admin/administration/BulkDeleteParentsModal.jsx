import React, { useState } from "react";
import { Modal, Button, Alert, Spinner } from "react-bootstrap";
import { Trash2, AlertTriangle } from "lucide-react";
import api from "../../../utils/api";
import { toast } from "react-toastify";

const BulkDeleteParentsModal = ({ show, onHide, selectedParents = [], onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!selectedParents || selectedParents.length === 0) {
      setError("No parents selected for deletion.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const parentIds = selectedParents.map((p) => p.id);
      await api.post("/parent/admin/bulk-delete", {
        parent_ids: parentIds
      });
      toast.success(`Successfully deleted ${selectedParents.length} parent account(s).`);
      if (onSuccess) {
        onSuccess(selectedParents.length);
      }
      onHide();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to delete parent accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="md">
      <Modal.Header closeButton={!loading} className="border-bottom pb-3">
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold text-danger fs-5">
          <div className="p-2 bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
            <Trash2 size={20} className="text-danger" />
          </div>
          <span>Delete Parent Accounts</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        <div className="d-flex align-items-start gap-3 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 mb-3">
          <AlertTriangle size={22} className="text-danger flex-shrink-0 mt-0.5" />
          <div>
            <div className="fw-bold text-danger mb-1" style={{ fontSize: "14px" }}>
              Are you sure you want to delete {selectedParents.length} parent account{selectedParents.length > 1 ? "s" : ""}?
            </div>
            <div className="text-slate-600 small" style={{ fontSize: "12.5px", lineHeight: "1.4" }}>
              This will permanently remove the login credentials and parent records for all <strong>{selectedParents.length} selected parent accounts</strong>. Linked students will remain in the directory.
            </div>
          </div>
        </div>

        {selectedParents.length > 0 && (
          <div>
            <div className="small fw-bold text-slate-700 mb-1 text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.03em" }}>
              Selected Parents ({selectedParents.length}):
            </div>
            <div
              className="p-2 bg-white border rounded-2 overflow-auto"
              style={{ maxHeight: "140px", fontSize: "12px" }}
            >
              {selectedParents.slice(0, 10).map((p) => (
                <div key={p.id} className="d-flex justify-content-between py-1 border-bottom border-light">
                  <span className="fw-semibold text-slate-800">{p.first_name} {p.last_name}</span>
                  <span className="text-muted">{p.email}</span>
                </div>
              ))}
              {selectedParents.length > 10 && (
                <div className="text-muted text-center pt-1 fst-italic">
                  ...and {selectedParents.length - 10} more parents
                </div>
              )}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-top bg-light px-4 py-3">
        <Button variant="outline-secondary" onClick={onHide} disabled={loading} size="sm" className="px-3">
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={loading || selectedParents.length === 0}
          size="sm"
          className="d-flex align-items-center gap-1.5 px-3 fw-semibold shadow-sm"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" />
              <span>Deleting {selectedParents.length} Parents...</span>
            </>
          ) : (
            <>
              <Trash2 size={14} />
              <span>Yes, Delete {selectedParents.length} Parent{selectedParents.length > 1 ? "s" : ""}</span>
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BulkDeleteParentsModal;
