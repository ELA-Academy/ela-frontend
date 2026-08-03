import React, { useMemo, useState, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import Select from "react-select";
import { getUsersForMessaging } from "../../../services/messagingService";
import { showError } from "../../../utils/notificationService";

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
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.is_active !== false),
    [departments]
  );

  useEffect(() => {
    if (show && formState.conversation_type === "private_channel" && users.length === 0) {
      const fetchUsers = async () => {
        try {
          setLoadingUsers(true);
          const data = await getUsersForMessaging();
          const options = data.map((user) => ({
            value: user.id, // E.g. "staff_1" or "superadmin_2"
            label: `${user.name} (${user.role})`,
          }));
          setUsers(options);
        } catch (err) {
          showError("Failed to load users.");
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [show, formState.conversation_type, users.length]);

  const handleClose = () => {
    setFormState(EMPTY_STATE);
    setSelectedUsers([]);
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
      participant_ids:
        formState.conversation_type === "private_channel"
          ? selectedUsers.map((u) => u.value)
          : [],
    });
    setFormState(EMPTY_STATE);
    setSelectedUsers([]);
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
              <option value="private_channel">Private Channel (invite-only)</option>
              <option value="department">Department Channel (restricted to a department)</option>
            </Form.Select>
          </Form.Group>

          {formState.conversation_type === "department" && (
            <Form.Group className="mb-3">
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

          {formState.conversation_type === "private_channel" && (
            <Form.Group className="mb-3">
              <Form.Label>Select Members to Invite</Form.Label>
              {loadingUsers ? (
                <div className="text-center py-2">
                  <Spinner size="sm" animation="border" className="me-2" />
                  Loading members...
                </div>
              ) : (
                <Select
                  isMulti
                  options={users}
                  value={selectedUsers}
                  onChange={setSelectedUsers}
                  placeholder="Select staff or admins..."
                  menuPosition="fixed"
                />
              )}
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || (formState.conversation_type === "private_channel" && selectedUsers.length === 0)}>
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
