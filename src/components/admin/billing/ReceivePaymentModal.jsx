import React, { useState, useEffect } from "react";
import { Modal, Button, Form, InputGroup, Spinner, Row, Col, Alert } from "react-bootstrap";
import { receivePayment, chargeSavedCard, getStudentParentPaymentMethods } from "../../../services/billingService";
import { showSuccess, showError } from "../../../utils/notificationService";

const ReceivePaymentModal = ({
  show,
  handleClose,
  studentId,
  invoice,
  studentName,
  accountBalance = 0,
  onPaymentReceived,
}) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [staffNote, setStaffNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Saved Payment Methods
  const [parentPms, setParentPms] = useState([]);
  const [selectedPmId, setSelectedPmId] = useState("");
  const [loadingPms, setLoadingPms] = useState(false);

  useEffect(() => {
    if (show && studentId) {
      setAmount(invoice ? String(Math.abs(invoice.amount || invoice.total_amount || 0)) : "");
      setMethod("Charge Parent ACH/CC");
      setNotes("");
      setStaffNote("");
      setSendEmail(true);

      // Fetch saved payment methods
      setLoadingPms(true);
      getStudentParentPaymentMethods(studentId)
        .then((pms) => {
          setParentPms(pms || []);
          const defaultPm = pms.find((p) => p.is_default) || pms[0];
          if (defaultPm) {
            setSelectedPmId(defaultPm.id);
            setMethod("Charge Parent ACH/CC");
          } else {
            setMethod("Cash");
          }
        })
        .catch((err) => {
          console.error("Failed to load parent payment methods:", err);
        })
        .finally(() => {
          setLoadingPms(false);
        });
    }
  }, [show, studentId, invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      showError("Please enter a valid payment amount.");
      return;
    }

    setIsSaving(true);
    try {
      if (method === "Charge Parent ACH/CC") {
        if (!selectedPmId && parentPms.length > 0) {
          showError("Please select a saved card to charge.");
          setIsSaving(false);
          return;
        }

        const chargePayload = {
          amount: payAmount,
          invoice_id: invoice?.id || null,
          payment_method_id: selectedPmId || null,
        };

        const res = await chargeSavedCard(studentId, chargePayload);
        if (res.status === "requires_action") {
          showError("Payment requires 3D Secure verification. Parent has been notified.");
        } else {
          showSuccess(res.message || "Payment charged successfully via Stripe!");
        }
      } else {
        const payload = {
          amount: payAmount,
          method,
          notes: notes + (staffNote ? ` | Staff Note: ${staffNote}` : ""),
          send_email: sendEmail,
          invoice_id: invoice?.id || null,
        };
        await receivePayment(studentId, payload);
        showSuccess("Payment recorded successfully!");
      }

      onPaymentReceived();
      handleClose();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to process payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const initialLetter = studentName?.charAt(0) || "S";
  const isStripeCharge = method === "Charge Parent ACH/CC";

  return (
    <Modal show={show} onHide={handleClose} centered className="modern-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "Prompt", fontWeight: "600", fontSize: "16px" }}>
          Receive Payment
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} style={{ fontFamily: "Prompt" }}>
        <Modal.Body>
          {/* Student Profile Info */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <div
              className="d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#94a3b8",
                fontSize: "14px",
              }}
            >
              {initialLetter}
            </div>
            <div>
              <h6 className="m-0 fw-bold text-slate-800 text-uppercase" style={{ fontSize: "12px" }}>
                {studentName}
              </h6>
              <span className="text-muted" style={{ fontSize: "11px" }}>
                Account Balance: <b>${accountBalance.toFixed(2)}</b>
              </span>
            </div>
          </div>

          <hr className="my-3" style={{ borderColor: "#cbd5e1" }} />

          {invoice && (
            <div className="p-2 mb-3 rounded text-muted bg-light" style={{ fontSize: "11px" }}>
              Applying payment to Invoice #{invoice.id}: <b>{invoice.description}</b> (Due {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"})
            </div>
          )}

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-slate-600" style={{ fontSize: "11px" }}>
                  AMOUNT <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup size="sm">
                  <InputGroup.Text style={{ fontSize: "11px" }}>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    style={{ fontSize: "12px" }}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold text-slate-600" style={{ fontSize: "11px" }}>
                  PAYMENT TYPE <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{ fontSize: "12px", padding: "6px" }}
                >
                  <option value="Charge Parent ACH/CC">Charge Parent Saved Card (Stripe)</option>
                  <option value="Cash">Cash (Offline)</option>
                  <option value="Check">Check (Offline)</option>
                  <option value="Card">Card (Offline Terminal)</option>
                  <option value="Other">Other / Manual</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Stripe Card Picker if Charge Parent ACH/CC selected */}
          {isStripeCharge && (
            <Form.Group className="mb-3 p-3 bg-light rounded border">
              <Form.Label className="fw-bold text-slate-700 mb-1" style={{ fontSize: "11px" }}>
                SELECT SAVED STRIPE CARD
              </Form.Label>
              {loadingPms ? (
                <div className="text-muted" style={{ fontSize: "11px" }}>
                  <Spinner size="sm" animation="border" className="me-2" /> Loading saved payment methods...
                </div>
              ) : parentPms.length > 0 ? (
                <Form.Select
                  value={selectedPmId}
                  onChange={(e) => setSelectedPmId(e.target.value)}
                  style={{ fontSize: "12px" }}
                  required
                >
                  {parentPms.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.parent_name} - {pm.card_brand || pm.bank_name || "Card"} (•••• {pm.last4}) {pm.is_default ? "[DEFAULT]" : ""}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Alert variant="warning" className="m-0 py-2" style={{ fontSize: "11px" }}>
                  No saved payment method found on file for this student's parents. Please ask the parent to add a payment card in their Parent Portal, or select an offline payment method (Cash/Check).
                </Alert>
              )}
            </Form.Group>
          )}

          {!isStripeCharge && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-slate-600" style={{ fontSize: "11px" }}>
                DESCRIPTION / NOTES <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="e.g. Received cash payment at office"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required={!isStripeCharge}
                style={{ fontSize: "12px" }}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="send-email-check"
              label="Send email notification to parents on payment"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              style={{ fontSize: "12px", fontWeight: "500", color: "#475569" }}
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
            disabled={isSaving || (isStripeCharge && parentPms.length === 0)}
            style={{
              backgroundColor: "#00b8d4",
              borderColor: "#00b8d4",
              borderRadius: "50px",
              fontSize: "12px",
              padding: "8px 24px",
              fontWeight: "600",
              color: "#ffffff"
            }}
          >
            {isSaving ? <Spinner size="sm" animation="border" /> : isStripeCharge ? "CHARGE STRIPE CARD" : "SUBMIT PAYMENT"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReceivePaymentModal;

