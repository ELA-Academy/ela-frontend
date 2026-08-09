import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { refundPayment } from "../../../services/billingService";
import { showSuccess, showError } from "../../../utils/notificationService";

const IssueRefundModal = ({
  show,
  handleClose,
  studentId,
  payment,
  studentName,
  accountBalance = 0,
  transactions = [],
  onRefundIssued,
}) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [staffNote, setStaffNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Scan ledger transactions to find previous refunds for this payment
  const getRefundStats = () => {
    if (!payment) return { paymentAmount: 0, previouslyRefunded: 0, maxRefund: 0 };
    const paymentAmount = Math.abs(payment.amount);
    
    // Find refund transactions in ledger that are refunds for this specific payment
    const refunds = transactions.filter(
      (tx) =>
        tx.type === "Payment" &&
        tx.method === "Refund" &&
        tx.notes &&
        tx.notes.includes(`Payment #${payment.id}`)
    );
    
    // Ledger refund transactions have positive amount on ledger (they add to balance)
    const previouslyRefunded = refunds.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const maxRefund = Math.max(0, paymentAmount - previouslyRefunded);

    return { paymentAmount, previouslyRefunded, maxRefund };
  };

  const { paymentAmount, previouslyRefunded, maxRefund } = getRefundStats();

  useEffect(() => {
    if (show && payment) {
      setAmount(maxRefund.toFixed(2));
      setDescription("");
      setStaffNote("");
    }
  }, [show, payment, maxRefund]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!payment) return;

    const refundAmt = parseFloat(amount);
    if (isNaN(refundAmt) || refundAmt <= 0) {
      showError("Please enter a valid refund amount.");
      return;
    }

    if (refundAmt > maxRefund) {
      showError(`Refund amount cannot exceed maximum refund of $${maxRefund.toFixed(2)}.`);
      return;
    }

    setIsSaving(true);
    try {
      await refundPayment(studentId, payment.id, {
        amount: refundAmt,
        description,
        staff_note: staffNote,
      });
      showSuccess("Refund issued successfully!");
      onRefundIssued();
      handleClose();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to issue refund.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!payment) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="modern-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "Prompt", fontWeight: "600", fontSize: "16px" }}>
          Issue Refund
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} style={{ fontFamily: "Prompt" }}>
        <Modal.Body>
          {/* Top Info Bar */}
          <Row className="mb-4 align-items-center">
            <Col md={5} className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#e2e8f0",
                  color: "#64748b",
                  fontSize: "16px",
                }}
              >
                {studentName?.charAt(0) || "S"}
              </div>
              <div>
                <h6 className="m-0 fw-bold text-slate-800" style={{ fontSize: "13px" }}>
                  {studentName}
                </h6>
                <span className="text-muted" style={{ fontSize: "11px" }}>
                  Account Balance: <b>${accountBalance.toFixed(2)}</b>
                </span>
              </div>
            </Col>
            
            <Col md={7}>
              <div className="p-3 bg-light rounded" style={{ fontSize: "11px" }}>
                <Row className="text-center">
                  <Col>
                    <div className="text-muted">Payment</div>
                    <div className="fw-bold text-slate-800">${paymentAmount.toFixed(2)}</div>
                  </Col>
                  <Col>
                    <div className="text-muted">Previously Refunded</div>
                    <div className="fw-bold text-slate-800">${previouslyRefunded.toFixed(2)}</div>
                  </Col>
                  <Col>
                    <div className="text-muted">Maximum Refund</div>
                    <div className="fw-bold text-danger">${maxRefund.toFixed(2)}</div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          <hr className="my-3" style={{ borderColor: "#cbd5e1" }} />

          {/* Refund Details */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-slate-600" style={{ fontSize: "11px" }}>
                  AMOUNT <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxRefund}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ fontSize: "12px", padding: "8px" }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-slate-600" style={{ fontSize: "11px" }}>
                  PAYMENT TYPE <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  disabled
                  value="original"
                  style={{ fontSize: "12px", padding: "8px" }}
                >
                  <option value="original">{payment.method || "Debit Card (Online)"}</option>
                </Form.Select>
                {/* Yellow Warn Box */}
                {(payment.method?.toLowerCase().includes("card") || payment.method?.toLowerCase().includes("ach")) && (
                  <div
                    className="p-2 mt-2 rounded"
                    style={{
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fef3c7",
                      color: "#d97706",
                      fontSize: "10px",
                    }}
                  >
                    Refund will go to the original card/account used
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-slate-600" style={{ fontSize: "11px" }}>
              DESCRIPTION <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ fontSize: "12px" }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-slate-600" style={{ fontSize: "11px" }}>
              STAFF ONLY NOTE
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Add optional internal note"
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
              style={{ fontSize: "12px", padding: "8px" }}
            />
          </Form.Group>

          <div className="text-end mt-4">
            <h5 className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>
              Total Refund: <span className="text-danger">${parseFloat(amount || 0).toFixed(2)}</span>
            </h5>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            style={{ fontSize: "12px", padding: "8px 16px" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            style={{
              backgroundColor: "#0ea5e9",
              borderColor: "#0ea5e9",
              borderRadius: "50px",
              fontSize: "12px",
              padding: "8px 24px",
              fontWeight: "600",
            }}
          >
            {isSaving ? <Spinner size="sm" animation="border" /> : "ISSUE REFUND"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default IssueRefundModal;
