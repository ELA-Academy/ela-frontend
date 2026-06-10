import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Form, Button, Spinner, Alert, Container, Card } from "react-bootstrap";
import {
  getPublicEnrollmentForm,
  submitEnrollmentForm,
} from "../../services/enrollmentService";
import PublicLayout from "../../components/PublicLayout";
import "../../styles/MultiStepForm.css";

const PublicEnrollmentForm = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPublicEnrollmentForm(token);
      setFormData(data);
      if (data.prefill_data) {
        const initialResponses = {};
        const { students, parents } = data.prefill_data;
        data.form_structure.sections.forEach((section) => {
          section.fields.forEach((field) => {
            const label = field.label.toLowerCase();
            if (label.includes("first name") && students.length > 0)
              initialResponses[field.id] = students[0].first_name;
            else if (label.includes("last name") && students.length > 0)
              initialResponses[field.id] = students[0].last_name;
            else if (label.includes("date of birth") && students.length > 0)
              initialResponses[field.id] =
                students[0].date_of_birth.split("T")[0];
            else if (label.includes("grade level") && students.length > 0)
              initialResponses[field.id] = students[0].grade_level;
            else if (label.includes("email") && parents.length > 0)
              initialResponses[field.id] = parents[0].email;
            else if (label.includes("phone") && parents.length > 0)
              initialResponses[field.id] = parents[0].phone;
          });
        });
        setResponses(initialResponses);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not load the form. The link may be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (fieldId, value) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitEnrollmentForm(token, responses);
      setSubmitSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error || "An error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleSections =
    formData?.form_structure.sections.filter((s) => s.visible) || [];
  const totalSteps =
    visibleSections.length + (formData?.fee_required ? 1 : 0) + 1; // Sections + Payment (if any) + Review
  const currentSection = visibleSections[step - 1];

  if (loading)
    return (
      <PublicLayout>
        <div className="text-center p-5">
          <Spinner />
        </div>
      </PublicLayout>
    );

  if (submitSuccess) {
    return (
      <PublicLayout>
        <Container className="mt-5" style={{ minHeight: "60vh" }}>
          <Alert variant="success">
            <Alert.Heading>Thank You!</Alert.Heading>
            <p>
              Your enrollment form has been submitted successfully. Our
              admissions team will be in touch with you shortly.
            </p>
          </Alert>
        </Container>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="form-page-container">
        <div className="multistep-form">
          {error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            formData && (
              <>
                <h2 className="text-center">{formData.form_structure.title}</h2>
                <p className="text-center text-muted mb-4">
                  Enrollment for: <strong>{formData.student_name}</strong>
                </p>

                <Stepper
                  sections={visibleSections}
                  feeRequired={formData.fee_required}
                  currentStep={step}
                />

                <Form onSubmit={handleSubmit} className="form-step-content">
                  {visibleSections.map(
                    (section, index) =>
                      step === index + 1 && (
                        <FormSection
                          key={section.id}
                          section={section}
                          responses={responses}
                          onInputChange={handleInputChange}
                        />
                      )
                  )}

                  {step === visibleSections.length + 1 &&
                    formData.fee_required && (
                      <PaymentStep feeAmount={formData.fee_amount} />
                    )}

                  {step === totalSteps && (
                    <ReviewStep
                      sections={visibleSections}
                      responses={responses}
                    />
                  )}

                  <NavigationButtons
                    step={step}
                    totalSteps={totalSteps}
                    onBack={() => setStep((s) => s - 1)}
                    onNext={() => setStep((s) => s + 1)}
                    isSubmitting={isSubmitting}
                  />
                </Form>
              </>
            )
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

// --- Child Components ---

const Stepper = ({ sections, feeRequired, currentStep }) => {
  const steps = [...sections.map((s) => s.title)];
  if (feeRequired) steps.push("Payment");
  steps.push("Review & Submit");

  return (
    <div className="stepper-nav">
      {steps.map((label, index) => (
        <div
          key={index}
          className={`step ${currentStep === index + 1 ? "active" : ""} ${
            currentStep > index + 1 ? "completed" : ""
          }`}
        >
          <div className="step-number">
            {currentStep > index + 1 ? "✓" : index + 1}
          </div>
          <div className="step-label">{label}</div>
        </div>
      ))}
    </div>
  );
};

const FormSection = ({ section, responses, onInputChange }) => {
  const renderField = (field) => {
    // This function is the same as the old one
    const label = (
      <Form.Label>
        {" "}
        {field.label} {field.required && <span className="text-danger">*</span>}{" "}
      </Form.Label>
    );
    const value = responses[field.id] || "";
    switch (field.type) {
      case "short_answer":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control
              type="text"
              required={field.required}
              value={value}
              onChange={(e) => onInputChange(field.id, e.target.value)}
            />
          </Form.Group>
        );
      case "paragraph":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control
              as="textarea"
              rows={3}
              required={field.required}
              value={value}
              onChange={(e) => onInputChange(field.id, e.target.value)}
            />
          </Form.Group>
        );
      case "checkbox":
        return (
          <Form.Group key={field.id} className="mb-3">
            <Form.Check
              type="checkbox"
              required={field.required}
              checked={!!value}
              onChange={(e) => onInputChange(field.id, e.target.checked)}
              label={field.label}
            />
          </Form.Group>
        );
      case "dropdown":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Select
              required={field.required}
              value={value}
              onChange={(e) => onInputChange(field.id, e.target.value)}
            >
              <option value="">Select an option</option>
            </Form.Select>
          </Form.Group>
        );
      case "date_picker":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control
              type="date"
              required={field.required}
              value={value}
              onChange={(e) => onInputChange(field.id, e.target.value)}
            />
          </Form.Group>
        );
      case "file_upload":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control
              type="file"
              required={field.required}
              onChange={(e) => onInputChange(field.id, e.target.files[0])}
            />
          </Form.Group>
        );
      case "line_divider":
        return <hr key={field.id} className="my-4" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h3>{section.title}</h3>
      <hr />
      {section.fields.map(renderField)}
    </div>
  );
};

const PaymentStep = ({ feeAmount }) => (
  <div>
    <h3>Payment</h3>
    <hr />
    <Alert variant="info">
      A payment of <strong>${feeAmount.toFixed(2)}</strong> is required to
      complete this submission.
      <br />
      <br />
      After clicking "Next", you will be asked to review your information before
      being redirected to our secure payment portal to finalize the process.
    </Alert>
  </div>
);

const ReviewStep = ({ sections, responses }) => (
  <div>
    <h3>Review & Submit</h3>
    <hr />
    <p>Please review all your information before submitting.</p>
    {sections.map((section) => (
      <div key={section.id} className="review-section">
        <h5>{section.title}</h5>
        {section.fields.map((field) => {
          if (field.type === "line_divider") return null;
          return (
            <div key={field.id} className="review-grid">
              <strong>{field.label}:</strong>
              <span>{String(responses[field.id] || "Not provided")}</span>
            </div>
          );
        })}
      </div>
    ))}
  </div>
);

const NavigationButtons = ({
  step,
  totalSteps,
  onBack,
  onNext,
  isSubmitting,
}) => (
  <div className="navigation-buttons">
    <Button variant="secondary" onClick={onBack} disabled={step === 1}>
      Back
    </Button>
    {step < totalSteps ? (
      <Button variant="primary" onClick={onNext}>
        Next
      </Button>
    ) : (
      <Button variant="success" type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" /> : "Submit Application"}
      </Button>
    )}
  </div>
);

export default PublicEnrollmentForm;
