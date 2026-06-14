import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../utils/api";

const SetupPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Setup token is missing.");
        setLoading(false);
        return;
      }
      try {
        const response = await api.post("/auth/verify-setup-token", { token });
        if (response.data.valid) {
          setUserName(response.data.name);
          setUserEmail(response.data.email);
        } else {
          setError("Invalid or expired invitation token.");
        }
      } catch (err) {
        setError("This invite link has expired or is invalid.");
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/auth/setup-password", { token, password });
      setSuccess("Your password has been successfully configured! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to configure password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 py-5">
      <Card className="shadow-lg border-0 rounded-4 p-4" style={{ maxWidth: "480px", width: "100%" }}>
        <Card.Body>
          <div className="text-center mb-4">
            <img src="/images/ELA-logo.png" alt="ELA Academy" className="mb-3" style={{ height: "50px" }} />
            <h2 className="fw-bold text-slate-900">Set Up Your Password</h2>
            <p className="text-muted text-xs">Configure your access credentials to proceed to your dashboard.</p>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted small">Verifying your invite token...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="rounded-3">{error}</Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              {success && <Alert variant="success" className="rounded-3">{success}</Alert>}
              <div className="mb-3 p-3 bg-light rounded-3 text-start">
                <div className="small text-muted">Invited Member:</div>
                <div className="fw-bold text-slate-800">{userName}</div>
                <div className="small text-slate-500">{userEmail}</div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-slate-700">New Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter at least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                    className="rounded-3 py-2 pe-5"
                  />
                  <button
                    type="button"
                    className="btn border-0 position-absolute end-0 top-50 translate-middle-y text-muted px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ zIndex: 10, background: "none", boxShadow: "none" }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold text-slate-700">Confirm Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-type your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                    className="rounded-3 py-2 pe-5"
                  />
                  <button
                    type="button"
                    className="btn border-0 position-absolute end-0 top-50 translate-middle-y text-muted px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ zIndex: 10, background: "none", boxShadow: "none" }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 rounded-3 py-2.5 fw-bold"
                disabled={submitting}
              >
                {submitting ? <Spinner animation="border" size="sm" /> : "Complete Setup"}
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SetupPassword;
