import React, { useState } from "react";
import { Modal, Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { receivePayment } from "../../../services/billingService";
import { showSuccess, showError } from "../../../utils/notificationService";

const ReceivePaymentModal = ({
  show,
  handleClose,
  studentId,
  invoice,
  onPaymentReceived,
}) => {
  const [amount, setAmount] = useState(invoice?.amount || "");
  const [method, setMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        amount,
        method,
        notes,
        invoice_id: invoice?.id,
      };
      await receivePayment(studentId, payload);
      showSuccess("Payment recorded successfully!");
      onPaymentReceived();
      handleClose();
      // Reset form
      setAmount("");
      setMethod("Cash");
      setNotes("");
    } catch (err) {
      showError(err.response?.data?.error || "Failed to record payment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Receive Payment</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {invoice && (
            <p className="text-muted">
              Applying payment to invoice for: {invoice.description}
            </p>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Payment Amount</Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
              />
            </InputGroup>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Payment Method</Form.Label>
            <Form.Select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
              <option value="Card (Manual)">Card (Manual)</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Check #1234"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? <Spinner as="span" size="sm" /> : "Record Payment"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReceivePaymentModal;
