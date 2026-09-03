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
  const [signerName, setSignerName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
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
        if (parents.length > 0) {
          setSignerName(`${parents[0].first_name || ''} ${parents[0].last_name || ''}`.trim() || parents[0].email);
        }
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
    if (!signerName.trim()) {
      alert("Please provide the full legal name of the signer before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const finalResponses = {
        ...responses,
        parent_signer_name: signerName.trim(),
        parent_signature: signatureDataUrl
      };
      await submitEnrollmentForm(token, finalResponses);
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
    (formData?.form_structure?.sections || []).filter((s) => s.visible && s.id !== "pickup_info");
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
                      onSaveSignature={setSignatureDataUrl}
                      signerName={signerName}
                      setSignerName={setSignerName}
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

const SignaturePad = ({ onSaveSignature, signerName, setSignerName }) => {
  const [sigMode, setSigMode] = useState("draw"); // "draw" or "type"
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (sigMode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#0b2f4c";
    }
  }, [sigMode]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      onSaveSignature(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSaveSignature(null);
  };

  const handleTypeChange = (name) => {
    setSignerName(name);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 400;
    tempCanvas.height = 100;
    const ctx = tempCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 100);
    ctx.font = "italic 32px 'Brush Script MT', cursive, sans-serif";
    ctx.fillStyle = "#0b2f4c";
    ctx.fillText(name || "Parent Signature", 20, 60);
    onSaveSignature(tempCanvas.toDataURL("image/png"));
  };

  return (
    <Card className="p-3 border border-slate-300 shadow-sm rounded-3 mt-4 bg-slate-50">
      <h5 className="fw-bold text-slate-800 mb-2">Parent / Guardian Digital Signature</h5>
      <p className="small text-muted mb-3">
        By signing below, you certify that all information provided is accurate and agree to the academy enrollment contract terms.
      </p>

      <Form.Group className="mb-3">
        <Form.Label className="small fw-semibold text-slate-700">FULL LEGAL NAME OF SIGNER *</Form.Label>
        <Form.Control 
          type="text"
          placeholder="e.g. Justice Dibofu"
          value={signerName}
          onChange={(e) => {
            setSignerName(e.target.value);
            if (sigMode === "type") handleTypeChange(e.target.value);
          }}
          required
        />
      </Form.Group>

      <div className="d-flex gap-2 mb-3">
        <Button 
          type="button" 
          size="sm" 
          variant={sigMode === "draw" ? "primary" : "outline-secondary"}
          onClick={() => setSigMode("draw")}
        >
          Draw Signature
        </Button>
        <Button 
          type="button" 
          size="sm" 
          variant={sigMode === "type" ? "primary" : "outline-secondary"}
          onClick={() => {
            setSigMode("type");
            handleTypeChange(signerName);
          }}
        >
          Type Signature
        </Button>
      </div>

      {sigMode === "draw" ? (
        <div>
          <div className="border rounded bg-white p-1 d-inline-block position-relative">
            <canvas 
              ref={canvasRef}
              width={480}
              height={120}
              style={{ cursor: "crosshair", touchAction: "none" }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div 
                className="position-absolute top-50 start-50 translate-middle text-muted pointer-events-none"
                style={{ fontSize: "13px", opacity: 0.5, userSelect: "none" }}
              >
                Sign here using mouse or touch
              </div>
            )}
          </div>
          <div className="mt-2">
            <Button type="button" variant="link" size="sm" className="text-danger p-0 text-decoration-none" onClick={clearCanvas}>
              Clear Signature
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 border rounded bg-white text-center">
          <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: "36px", color: "#0b2f4c" }}>
            {signerName || "Your Signature Preview"}
          </div>
        </div>
      )}
    </Card>
  );
};

const ReviewStep = ({ sections, responses, onSaveSignature, signerName, setSignerName }) => (
  <div>
    <h3>Review & Submit Contract</h3>
    <hr />
    <p>Please review all your information and sign below to execute the enrollment contract.</p>
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

    <SignaturePad 
      onSaveSignature={onSaveSignature}
      signerName={signerName}
      setSignerName={setSignerName}
    />
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
        {isSubmitting ? <Spinner size="sm" /> : "Sign & Submit Contract"}
      </Button>
    )}
  </div>
);

export default PublicEnrollmentForm;
