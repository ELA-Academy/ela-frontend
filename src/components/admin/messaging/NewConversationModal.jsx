import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import Select from "react-select";
import {
  getUsersForMessaging,
  startConversation,
} from "../../../services/messagingService";
import { showSuccess, showError } from "../../../utils/notificationService";

const NewConversationModal = ({ show, handleClose, onConversationStarted }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const data = await getUsersForMessaging();
          const options = data.map((user) => ({
            value: user.id,
            label: `${user.name} (${user.role})`,
          }));
          setUsers(options);
        } catch (err) {
          showError("Failed to load users.");
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      showError("Please select at least one person to start a chat with.");
      return;
    }
    setIsSubmitting(true);
    try {
      const participantIds = selectedUsers.map((u) => u.value);
      const data = await startConversation(participantIds);
      showSuccess("Conversation started!");
      onConversationStarted(data.conversation_id);
      handleClose();
      setSelectedUsers([]);
    } catch (err) {
      showError(err.response?.data?.error || "Failed to start conversation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Start a New Conversation</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <Form.Group>
              <Form.Label>Select people to message:</Form.Label>
              <Select
                isMulti
                options={users}
                value={selectedUsers}
                onChange={setSelectedUsers}
                placeholder="Search for staff or admins..."
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : "Start Chat"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NewConversationModal;
