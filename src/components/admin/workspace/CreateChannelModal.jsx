import React, { useMemo, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

const EMPTY_STATE = {
  name: "",
  conversation_type: "channel",
  department_id: "",
};

const CreateChannelModal = ({
  show,
  onHide,
  onSubmit,
  departments = [],
  submitting = false,
}) => {
  const [formState, setFormState] = useState(EMPTY_STATE);

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.is_active !== false),
    [departments]
  );

  const handleClose = () => {
    setFormState(EMPTY_STATE);
    onHide();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      ...formState,
      department_id:
        formState.conversation_type === "department" && formState.department_id
          ? Number(formState.department_id)
          : null,
    });
    setFormState(EMPTY_STATE);
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Channel</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Channel Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. School Updates"
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Visibility</Form.Label>
            <Form.Select
              value={formState.conversation_type}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  conversation_type: event.target.value,
                  department_id: "",
                }))
              }
            >
              <option value="channel">Public Channel (visible to everyone)</option>
              <option value="department">Department Channel (restricted to a department)</option>
            </Form.Select>
          </Form.Group>

          {formState.conversation_type === "department" && (
            <Form.Group>
              <Form.Label>Department</Form.Label>
              <Form.Select
                value={formState.department_id}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, department_id: event.target.value }))
                }
                required
              >
                <option value="">Select a department</option>
                {activeDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Creating...
              </>
            ) : (
              "Create Channel"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateChannelModal;
