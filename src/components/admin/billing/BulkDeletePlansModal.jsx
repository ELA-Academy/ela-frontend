import React, { useState } from "react";
import { Modal, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { bulkDeleteSubscriptions } from "../../../services/billingService";

const BulkDeletePlansModal = ({ show, onHide, selectedPlans = [], onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!selectedPlans || selectedPlans.length === 0) {
      setError("No plans selected for deletion.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const planIds = selectedPlans.map((p) => p.id);
      await bulkDeleteSubscriptions(planIds);
      if (onSuccess) {
        onSuccess(selectedPlans.length);
      }
      onHide();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to delete recurring plans. Please try again.");
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
          <span>Delete Recurring Plans</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        <div className="d-flex align-items-start gap-3 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 mb-3">
          <AlertTriangle size={22} className="text-danger flex-shrink-0 mt-0.5" />
          <div>
            <div className="fw-bold text-danger mb-1" style={{ fontSize: "14px" }}>
              Are you sure you want to delete {selectedPlans.length} recurring plan{selectedPlans.length > 1 ? "s" : ""}?
            </div>
            <div className="text-slate-600 small" style={{ fontSize: "12.5px", lineHeight: "1.4" }}>
              This will remove the active recurring tuition plans for all <strong>{selectedPlans.length} selected students</strong> and stop automatic recurring invoice generation.
            </div>
          </div>
        </div>

        <div className="p-3 bg-light rounded-3 border small text-slate-600 mb-3" style={{ fontSize: "12px" }}>
          <div className="fw-semibold text-slate-800 mb-1">Please Note:</div>
          <ul className="m-0 ps-3">
            <li>Existing past invoices and payments already generated will <strong>not</strong> be deleted.</li>
            <li>You can assign new tuition plans to these students at any time.</li>
          </ul>
        </div>

        {selectedPlans.length > 0 && (
          <div>
            <div className="small fw-bold text-slate-700 mb-1 text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.03em" }}>
              Selected Plans ({selectedPlans.length}):
            </div>
            <div
              className="p-2 bg-white border rounded-2 overflow-auto"
              style={{ maxHeight: "120px", fontSize: "12px" }}
            >
              {selectedPlans.slice(0, 8).map((plan) => (
                <div key={plan.id} className="d-flex justify-content-between py-1 border-bottom border-light">
                  <span className="fw-semibold text-slate-800">{plan.student_name}</span>
                  <span className="text-muted">{plan.plan_name}</span>
                </div>
              ))}
              {selectedPlans.length > 8 && (
                <div className="text-muted text-center pt-1 fst-italic">
                  ...and {selectedPlans.length - 8} more students
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
          disabled={loading || selectedPlans.length === 0}
          size="sm"
          className="d-flex align-items-center gap-1.5 px-3 fw-semibold shadow-sm"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" />
              <span>Deleting {selectedPlans.length} Plans...</span>
            </>
          ) : (
            <>
              <Trash2 size={14} />
              <span>Yes, Delete {selectedPlans.length} Plan{selectedPlans.length > 1 ? "s" : ""}</span>
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BulkDeletePlansModal;
