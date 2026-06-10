import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext"; // Import useAuth
import "../styles/SuperAdminSetup.css";

// Main component remains the same

const SuperAdminSetup = () => {
  const [superAdminExists, setSuperAdminExists] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await api.get("/superadmin/check");
        setSuperAdminExists(response.data.super_admin_exists);
      } catch (err) {
        setError(
          "Could not connect to the server. Please ensure the backend is running and refresh the page."
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSuperAdmin();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }
    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }
    if (superAdminExists === false) {
      return <SuperAdminSignupForm />;
    }
    if (superAdminExists === true) {
      return <SuperAdminLoginForm />;
    }
    return null;
  };

  return (
    <Container fluid className="p-0">
      <Row className="g-0 vh-100">
        <Col
          md={6}
          lg={7}
          className="d-none d-md-flex align-items-center justify-content-center illustration-col"
        >
          <img
            src="/admin-illustration.svg"
            alt="Administrator Setup"
            className="img-fluid p-5"
            style={{ maxWidth: "650px" }}
          />
        </Col>
        <Col
          md={6}
          lg={5}
          className="d-flex align-items-center justify-content-center form-col"
        >
          <div className="form-wrapper">{renderContent()}</div>
        </Col>
      </Row>
    </Container>
  );
};

// Signup form remains the same
const SuperAdminSignupForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [view, setView] = useState("register"); // 'register' or 'verify'
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/superadmin/register", formData);
      setMessage(response.data.message);
      setView("verify");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/superadmin/verify", {
        email: formData.email,
        otp,
      });
      setMessage(response.data.message + " Reloading to the login screen...");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === "register") {
    return (
      <div>
        <h1 className="form-title">Create Super Admin</h1>
        <p className="form-subtitle">
          This is a one-time setup for the school's primary administrator.
        </p>
        <Form onSubmit={handleRegisterSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3" controlId="formBasicName">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Enter authorized email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </Form.Group>
          <div className="d-grid mt-4">
            <Button
              className="form-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </Form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="form-title">Verify Your Email</h1>
      {message && <Alert variant="success">{message}</Alert>}
      <p className="form-subtitle">
        Enter the 6-digit code sent to <strong>{formData.email}</strong>.
      </p>
      <Form onSubmit={handleVerifySubmit}>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3" controlId="formBasicOtp">
          <Form.Label>Verification Code</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength="6"
          />
        </Form.Group>
        <div className="d-grid mt-4">
          <Button className="form-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Spinner as="span" animation="border" size="sm" />
            ) : (
              "Verify & Complete Setup"
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

// --- MODIFIED LOGIN FORM ---
const SuperAdminLoginForm = () => {
  const { superAdminLogin } = useAuth(); // Get login function from context
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await superAdminLogin(formData.email, formData.password);
      // Let AdminLayout handle the final redirect after login
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="form-title">Super Admin Portal</h1>
      <p className="form-subtitle">Login to manage the school system.</p>
      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3" controlId="loginEmail">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="loginPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <div className="d-grid mt-4">
          <Button className="form-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Spinner as="span" animation="border" size="sm" />
            ) : (
              "Login"
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SuperAdminSetup;
