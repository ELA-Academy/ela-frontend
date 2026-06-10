import React, { useState } from "react";
import { Modal, Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { addCredit } from "../../../services/billingService";
import { showSuccess, showError } from "../../../utils/notificationService";

const AddCreditModal = ({ show, handleClose, studentId, onCreditAdded }) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addCredit(studentId, { amount, reason });
      showSuccess("Credit added successfully!");
      onCreditAdded();
      handleClose();
      // Reset form
      setAmount("");
      setReason("");
    } catch (err) {
      showError(err.response?.data?.error || "Failed to add credit.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Credit</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Credit Amount</Form.Label>
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
          <Form.Group>
            <Form.Label>Reason for Credit</Form.Label>
            <Form.Control
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="e.g., Sibling discount, Referral bonus"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? <Spinner as="span" size="sm" /> : "Add Credit"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddCreditModal;
