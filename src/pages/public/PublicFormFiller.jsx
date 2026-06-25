import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Form, Button, Card, Spinner, Container } from "react-bootstrap";
import { ClipboardCheck, AlertTriangle, FileText } from "lucide-react";
import axios from "axios";

const PublicFormFiller = () => {
  const { formId } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    const fetchFormDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${apiBaseUrl}/api/board-extensions/public/forms/${formId}`);
        setFormConfig(res.data);
      } catch (err) {
        console.error("Failed to load form:", err);
        setError("This form does not exist, has been deleted, or is currently unavailable.");
      } finally {
        setLoading(false);
      }
    };

    if (formId) {
      fetchFormDetails();
    }
  }, [formId, apiBaseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formConfig) return;

    setSubmitting(true);
    setError("");
    try {
      await axios.post(`${apiBaseUrl}/api/board-extensions/public/forms/submit/${formId}`, {
        response: answers
      });
      setSuccess(true);
    } catch (err) {
      console.error("Failed to submit form:", err);
      setError("Failed to submit your response. Please check your inputs and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-2" />
          <p className="text-muted small">Loading form details...</p>
        </div>
      </div>
    );
  }

  if (error && !formConfig) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <Container style={{ maxWidth: "500px" }}>
          <Card className="border-0 shadow-lg p-4 rounded-4 text-center">
            <Card.Body>
              <div className="d-inline-flex p-3 bg-danger-subtle text-danger rounded-circle mb-3">
                <AlertTriangle size={32} />
              </div>
              <h4 className="fw-bold text-slate-800 mb-2">Form Unavailable</h4>
              <p className="text-muted small mb-4">{error}</p>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  if (success) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <Container style={{ maxWidth: "500px" }}>
          <Card className="border-0 shadow-lg p-4 rounded-4 text-center">
            <Card.Body>
              <div className="d-inline-flex p-3 bg-success-subtle text-success rounded-circle mb-3">
                <ClipboardCheck size={32} />
              </div>
              <h4 className="fw-bold text-slate-850 mb-2">Thank you!</h4>
              <p className="text-muted small mb-4">Your response has been submitted successfully.</p>
              <Button 
                variant="primary" 
                onClick={() => {
                  setAnswers({});
                  setSuccess(false);
                }}
                className="w-100 fw-bold rounded-3"
              >
                Submit another response
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-5">
      <Container style={{ maxWidth: "680px" }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex p-2 bg-primary-subtle text-primary rounded-3 mb-2">
            <FileText size={24} />
          </div>
          <h2 className="fw-bold text-slate-850">{formConfig.name}</h2>
          {formConfig.description && (
            <p className="text-muted small mx-auto mb-0" style={{ maxWidth: "550px" }}>
              {formConfig.description}
            </p>
          )}
        </div>

        <Card className="border-0 shadow-lg rounded-4 p-2 p-md-4">
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              {formConfig.form_structure?.map((q) => (
                <Form.Group key={q.id} className="mb-4">
                  <Form.Label className="fw-semibold text-slate-700 small mb-1.5">
                    {q.label} {q.required && <span className="text-danger">*</span>}
                  </Form.Label>
                  
                  {q.type === "textarea" ? (
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Write your response here..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      required={q.required}
                      className="border rounded-3"
                    />
                  ) : q.type === "date" ? (
                    <Form.Control
                      type="date"
                      value={answers[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      required={q.required}
                      className="border rounded-3"
                    />
                  ) : q.type === "number" ? (
                    <Form.Control
                      type="number"
                      placeholder="Enter a number..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      required={q.required}
                      className="border rounded-3"
                    />
                  ) : (
                    <Form.Control
                      type="text"
                      placeholder="Type your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      required={q.required}
                      className="border rounded-3"
                    />
                  )}
                </Form.Group>
              ))}

              {error && (
                <div className="alert alert-danger text-xs py-2 px-3 rounded-3 mb-4">
                  {error}
                </div>
              )}

              <Button 
                variant="primary" 
                type="submit" 
                disabled={submitting}
                className="w-100 py-2 fw-bold rounded-3 mt-2"
              >
                {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Submit
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default PublicFormFiller;
