import React, { useMemo, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import Select from "react-select";

const DEFAULT_FORM = {
  name: "",
  description: "",
  is_private: false,
  access_members: [],
};

const SpaceSettingsModal = ({
  show,
  onHide,
  onSubmit,
  title,
  submitLabel,
  submitting = false,
  initialValues = DEFAULT_FORM,
  members = [],
}) => {
  const [formState, setFormState] = useState(initialValues);

  React.useEffect(() => {
    if (show) {
      setFormState(initialValues);
    }
  }, [initialValues, show]);

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        value: `${member.role}_${member.id}`,
        label: `${member.name}${member.email ? ` (${member.email})` : ""}`,
        member,
      })),
    [members]
  );

  const selectedMembers = useMemo(
    () =>
      memberOptions.filter((option) =>
        formState.access_members.some(
          (member) => `${member.role}_${member.id}` === option.value
        )
      ),
    [formState.access_members, memberOptions]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      ...formState,
      access_members: formState.is_private ? formState.access_members : [],
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Space Name</Form.Label>
            <Form.Control
              type="text"
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </Form.Group>

          <Form.Check
            type="switch"
            id="space-private-switch"
            className="mb-3"
            label="Lock this space to selected people only"
            checked={formState.is_private}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, is_private: event.target.checked }))
            }
          />

          {formState.is_private && (
            <Form.Group>
              <Form.Label>Allowed Members</Form.Label>
              <Select
                isMulti
                options={memberOptions}
                value={selectedMembers}
                onChange={(selectedOptions) =>
                  setFormState((prev) => ({
                    ...prev,
                    access_members: (selectedOptions || []).map((option) => ({
                      id: option.member.id,
                      role: option.member.role,
                      name: option.member.name,
                      email: option.member.email || "",
                    })),
                  }))
                }
                placeholder="Search staff and superadmins..."
              />
              <small className="text-muted d-block mt-2">
                Superadmins still keep full access. The creator is always kept in the private space.
              </small>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SpaceSettingsModal;
