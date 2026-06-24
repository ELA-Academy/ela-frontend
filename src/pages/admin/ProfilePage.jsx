import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  Tabs,
  Tab,
} from "react-bootstrap";
import { getMyProfile, changePassword, updateProfile } from "../../services/profileService";
import { showSuccess, showError } from "../../utils/notificationService";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getMyProfile();
        setProfile(data);
      } catch (err) {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid>
      <h1 className="page-title">My Profile & Settings</h1>
      <Card className="widget-card">
        <Card.Body>
          <Tabs defaultActiveKey="details" id="profile-tabs" className="mb-4">
            <Tab eventKey="details" title="Profile Details">
              {profile && <ProfileDetails profile={profile} onProfileUpdated={(updated) => setProfile(prev => ({ ...prev, ...updated }))} />}
            </Tab>
            <Tab eventKey="security" title="Security">
              <ChangePasswordForm />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

// Sub-component for editing profile details
const ProfileDetails = ({ profile, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    name: profile.name || "",
    email: profile.email || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showError("Name and email are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await updateProfile(formData);
      showSuccess(response.message);
      if (onProfileUpdated) {
        onProfileUpdated(response.user);
      }
    } catch (err) {
      showError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? <Spinner as="span" size="sm" /> : "Save Changes"}
          </Button>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Control type="text" value={profile.role} readOnly disabled />
          </Form.Group>
          {profile.departments && profile.departments.length > 0 && (
            <Form.Group className="mb-3">
              <Form.Label>Assigned Departments</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={profile.departments.join("\n")}
                readOnly
                disabled
              />
            </Form.Group>
          )}
        </Col>
      </Row>
    </Form>
  );
};

// Sub-component for the password change form
const ChangePasswordForm = () => {
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      showError("New password and confirmation do not match.");
      return;
    }
    if (passwords.new_password.length < 6) {
      showError("New password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { current_password, new_password } = passwords;
      const response = await changePassword({ current_password, new_password });
      showSuccess(response.message);
      // Clear form
      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      showError(err.response?.data?.error || "Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Row>
      <Col md={8} lg={6}>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Current Password</Form.Label>
            <Form.Control
              type="password"
              name="current_password"
              value={passwords.current_password}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              name="new_password"
              value={passwords.new_password}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirm New Password</Form.Label>
            <Form.Control
              type="password"
              name="confirm_password"
              value={passwords.confirm_password}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner as="span" size="sm" /> : "Update Password"}
          </Button>
        </Form>
      </Col>
    </Row>
  );
};

export default ProfilePage;
