import React, { useState, useEffect } from "react";
import { Modal, Button, Alert, Form, Spinner, ButtonGroup } from "react-bootstrap";
import { RotateCcw, AlertTriangle, ShieldAlert, Users, School } from "lucide-react";
import { cleanSlateWipe, wipeAllParents } from "../../services/studentService";
import { toast } from "react-toastify";

const CleanSlateModal = ({ show, onHide, onSuccess, initialMode = "full" }) => {
  const [wipeMode, setWipeMode] = useState(initialMode); // 'parents' or 'full'
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setWipeMode(initialMode || "full");
      setConfirmText("");
      setError("");
    }
  }, [show, initialMode]);

  const handleWipe = async (e) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== "RESET") {
      setError("Please type 'RESET' exactly to confirm.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (wipeMode === "parents") {
        const res = await wipeAllParents();
        toast.success(res.message || "All parent accounts removed. Ready for fresh family import.");
      } else {
        const res = await cleanSlateWipe();
        toast.success(res.message || "Clean slate wipe complete. All test students, parents, and plans removed.");
      }

      setConfirmText("");
      if (onSuccess) {
        onSuccess();
      }
      onHide();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to execute wipe. Please check permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmText("");
      setError("");
      onHide();
    }
  };

  const isConfirmed = confirmText.trim().toUpperCase() === "RESET";

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static" size="md">
      <Modal.Header closeButton={!loading} className="border-bottom pb-3">
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold text-danger fs-5">
          <div className="p-2 bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
            <ShieldAlert size={20} className="text-danger" />
          </div>
          <span>
            {wipeMode === "parents" ? "Wipe All Parent Accounts" : "Start on Clean Slate (Reset Data)"}
          </span>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleWipe}>
        <Modal.Body className="p-4">
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          {/* Scope Selector */}
          <div className="mb-3">
            <div className="small fw-bold text-slate-700 mb-1.5 text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.04em" }}>
              Choose Reset Scope:
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => setWipeMode("parents")}
                disabled={loading}
                className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1.5 py-2 ${
                  wipeMode === "parents" ? "btn-danger fw-bold shadow-sm" : "btn-outline-secondary bg-white text-slate-700"
                }`}
                style={{ fontSize: "12px", borderRadius: "8px" }}
              >
                <Users size={14} />
                <span>Parent Accounts Only</span>
              </button>

              <button
                type="button"
                onClick={() => setWipeMode("full")}
                disabled={loading}
                className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1.5 py-2 ${
                  wipeMode === "full" ? "btn-danger fw-bold shadow-sm" : "btn-outline-secondary bg-white text-slate-700"
                }`}
                style={{ fontSize: "12px", borderRadius: "8px" }}
              >
                <School size={14} />
                <span>Full Clean Slate</span>
              </button>
            </div>
          </div>

          {wipeMode === "parents" ? (
            <>
              <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 mb-3">
                <div className="d-flex align-items-start gap-2.5">
                  <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="fw-bold text-danger mb-1" style={{ fontSize: "13.5px" }}>
                      Wipe All Parent Accounts & Family Linkages
                    </div>
                    <div className="text-slate-600 small" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      This clears all parent accounts and portal login credentials so the Administration or Accounting department can re-import the clean family directory spreadsheet.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 border small text-slate-700 mb-3" style={{ fontSize: "12px" }}>
                <div className="fw-bold text-slate-800 mb-1.5 text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.04em" }}>
                  Summary of this action:
                </div>
                <ul className="mb-2 ps-3 text-muted">
                  <li>Removes <strong>all parent accounts</strong>, passwords, and portal logins</li>
                  <li>Removes <strong>parent payment methods</strong> & family relationships</li>
                  <li><strong className="text-success">Students & grade levels remain safe</strong> ready to pair with your new family spreadsheet</li>
                </ul>
                <div className="fw-semibold text-primary pt-1 border-top" style={{ fontSize: "11px" }}>
                  ✓ Authorized for Administration, Accounting & IT departments.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 mb-3">
                <div className="d-flex align-items-start gap-2.5">
                  <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="fw-bold text-danger mb-1" style={{ fontSize: "13.5px" }}>
                      Permanently wipe all Students, Parents & Tuition Records
                    </div>
                    <div className="text-slate-600 small" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      This tool resets the system to an empty slate ready for your real Procare spreadsheet imports.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 border small text-slate-700 mb-3" style={{ fontSize: "12px" }}>
                <div className="fw-bold text-slate-800 mb-1.5 text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.04em" }}>
                  What will be cleared:
                </div>
                <ul className="mb-2 ps-3 text-muted">
                  <li>All <strong>student accounts</strong> & documents</li>
                  <li>All <strong>parent accounts</strong> & family associations</li>
                  <li>All <strong>recurring tuition plans</strong> & invoices</li>
                  <li>All <strong>student financial ledgers</strong>, credits & payment records</li>
                </ul>
                <div className="fw-semibold text-primary pt-1 border-top" style={{ fontSize: "11px" }}>
                  ✓ Authorized for Administration, Accounting & IT departments.
                </div>
              </div>
            </>
          )}

          <div>
            <Form.Label className="small fw-bold text-slate-700 mb-1">
              To confirm, type <span className="text-danger fw-bold">RESET</span> below:
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="RESET"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={loading}
              autoFocus
              className="fw-bold text-center"
              style={{ letterSpacing: "0.1em" }}
            />
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top bg-light px-4 py-3">
          <Button variant="outline-secondary" onClick={handleClose} disabled={loading} size="sm" className="px-3">
            Cancel
          </Button>
          <Button
            variant="danger"
            type="submit"
            disabled={!isConfirmed || loading}
            size="sm"
            className="d-flex align-items-center gap-1.5 px-3 fw-semibold shadow-sm"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" />
                <span>Wiping Records...</span>
              </>
            ) : (
              <>
                <RotateCcw size={14} />
                <span>
                  {wipeMode === "parents" ? "Wipe All Parent Accounts" : "Wipe & Start Clean Slate"}
                </span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CleanSlateModal;
