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
import { getMyProfile, updateProfile } from "../../services/profileService";
import { showSuccess, showError } from "../../utils/notificationService";
import api from "../../utils/api";

import { useTheme } from "../../context/ThemeContext";

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
      <h1 className="page-title">My Profile</h1>
      <Card className="widget-card">
        <Card.Body>
          <h5 className="fw-bold mb-3 text-slate-800">Profile Details</h5>
          {profile && <ProfileDetails profile={profile} onProfileUpdated={(updated) => setProfile(prev => ({ ...prev, ...updated }))} />}
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

export default ProfilePage;
