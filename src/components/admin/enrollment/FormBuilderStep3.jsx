import React, { useState, useEffect, useMemo } from "react";
import {
  Form,
  Button,
  Modal,
  Spinner,
  ListGroup,
  InputGroup,
  Alert,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import {
  getPotentialRecipients,
  sendFormToRecipients,
} from "../../../services/enrollmentService";
import { showSuccess, showError } from "../../../utils/notificationService";

const FormBuilderStep3 = ({ formState, setFormState, onNextStep }) => {
  const [showModal, setShowModal] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [potentialRecipients, setPotentialRecipients] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchRecipients = async () => {
      if (showModal) {
        setLoadingRecipients(true);
        try {
          const data = await getPotentialRecipients(formState.recipient_type);
          setPotentialRecipients(data);
        } catch (err) {
          showError("Could not load recipient list.");
        } finally {
          setLoadingRecipients(false);
        }
      }
    };
    fetchRecipients();
  }, [showModal, formState.recipient_type]);

  const handleRecipientTypeChange = (e) => {
    setFormState({ ...formState, recipient_type: e.target.value });
  };

  const handleSelect = (id) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleSelectAll = (isSelect) => {
    if (isSelect) {
      const allIds = filteredRecipients.map((r) => r.id);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSendForm = async () => {
    if (selectedIds.size === 0) {
      onNextStep(); // Allow proceeding to preview without sending
      return;
    }
    setIsSending(true);
    try {
      await sendFormToRecipients(formState.id, Array.from(selectedIds));
      showSuccess("Enrollment form sent successfully!");
      onNextStep(); // Proceed to next step on success
    } catch (err) {
      showError(err.response?.data?.error || "Failed to send form.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredRecipients = useMemo(() => {
    return potentialRecipients.filter((r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [potentialRecipients, searchTerm]);

  return (
    <div className="form-builder-container">
      <h4 className="step-subtitle">Step 3: Recipients</h4>
      <div className="p-4 border rounded">
        <Form.Group>
          <Form.Label as="legend" className="fw-bold">
            Who is this form for?
          </Form.Label>
          <Form.Check
            type="radio"
            id="type-new"
            name="recipientType"
            value="New Students"
            label="New Students (from Leads)"
            checked={formState.recipient_type === "New Students"}
            onChange={handleRecipientTypeChange}
          />
          <OverlayTrigger
            overlay={
              <Tooltip>
                This feature will be enabled in a future update.
              </Tooltip>
            }
          >
            <span className="d-inline-block">
              <Form.Check
                type="radio"
                id="type-returning"
                name="recipientType"
                value="Returning Students"
                label="Returning Students (from Active Roster)"
                checked={formState.recipient_type === "Returning Students"}
                onChange={handleRecipientTypeChange}
                disabled
              />
            </span>
          </OverlayTrigger>
        </Form.Group>

        <div className="mt-4 p-3 border rounded bg-light">
          <h5>Send Form to Recipients</h5>
          <p>
            Select the students who should receive this enrollment form. This
            will also send them an email with the link.
          </p>
          <Button onClick={() => setShowModal(true)}>
            Add Students ({selectedIds.size} selected)
          </Button>
          {selectedIds.size > 0 && (
            <Button
              variant="success"
              className="ms-2"
              onClick={handleSendForm}
              disabled={isSending}
            >
              {isSending ? <Spinner as="span" size="sm" /> : `Send & Continue`}
            </Button>
          )}
        </div>
        <Alert variant="light" className="mt-3">
          You can also choose to send the form later. Simply click "Save &
          Continue" at the bottom to proceed to the preview step.
        </Alert>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Select Students</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          {loadingRecipients ? (
            <div className="text-center">
              <Spinner />
            </div>
          ) : filteredRecipients.length > 0 ? (
            <>
              <div className="d-flex justify-content-end mb-2">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleSelectAll(true)}
                >
                  Select All
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleSelectAll(false)}
                >
                  Deselect All
                </Button>
              </div>
              <ListGroup style={{ maxHeight: "400px", overflowY: "auto" }}>
                {filteredRecipients.map((recipient) => (
                  <ListGroup.Item key={recipient.id}>
                    <Form.Check
                      type="checkbox"
                      id={`recipient-${recipient.id}`}
                      checked={selectedIds.has(recipient.id)}
                      onChange={() => handleSelect(recipient.id)}
                      label={
                        <div>
                          <strong>{recipient.name}</strong>
                          <small className="d-block text-muted">
                            Status: {recipient.status}
                          </small>
                        </div>
                      }
                    />
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          ) : (
            <Alert variant="info">
              No eligible students found for this form type.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FormBuilderStep3;
