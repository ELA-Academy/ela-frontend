import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Form, Button, Spinner, Alert, Card } from "react-bootstrap";
import {
  ShieldCheck,
  Lock,
  CheckCircle,
  User,
  FileCheck,
  Download,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  getPublicEnrollmentForm,
  submitEnrollmentForm,
  createEnrollmentPaymentIntent,
} from "../../services/enrollmentService";
import { getApiBaseUrl } from "../../utils/api";
import { STRIPE_ELEMENT_OPTIONS } from "../../utils/stripe";
import "../../styles/MultiStepForm.css";

// --- Stripe Card Payment Sub-Component ---
const StripeCardForm = ({
  feeAmount,
  studentName,
  token,
  onPaymentSuccess,
  isPaid,
  paymentIntentId,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    if (!cardholderName.trim()) {
      setErrorMessage("Please enter the cardholder full name.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // 1. Create PaymentIntent on the backend
      const res = await createEnrollmentPaymentIntent(token);
      const { client_secret, payment_intent_id } = res;

      if (!client_secret) {
        throw new Error("Could not initialize Stripe payment session.");
      }

      // 2. Confirm card payment directly with Stripe
      const confirmResult = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName.trim(),
          },
        },
      });

      if (confirmResult.error) {
        setErrorMessage(
          confirmResult.error.message ||
            "Payment failed. Please check your card details and try again."
        );
        setIsProcessing(false);
        return;
      }

      if (confirmResult.paymentIntent.status === "succeeded") {
        onPaymentSuccess(confirmResult.paymentIntent.id);
      } else {
        setErrorMessage("Payment status pending or incomplete. Please check with your bank.");
      }
    } catch (err) {
      console.error("Stripe payment error:", err);
      setErrorMessage(
        err.response?.data?.error ||
          err.message ||
          "Payment processing failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPaid) {
    return (
      <div className="enrollment-payment-card border-success bg-white text-center p-4">
        <div
          className="d-flex align-items-center justify-content-center mx-auto mb-3"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "#ecfdf5",
            color: "#059669",
          }}
        >
          <CheckCircle size={32} />
        </div>
        <h4 className="fw-bold text-slate-800 mb-1">
          Registration Fee Paid Successfully
        </h4>
        <p className="text-muted small mb-3">
          Payment of <strong>${Number(feeAmount || 0).toFixed(2)}</strong> has
          been authorized and recorded.
        </p>
        <div className="bg-slate-50 border rounded p-2 mb-3 text-start small">
          <div className="text-muted">Stripe Reference ID:</div>
          <code className="text-slate-700">{paymentIntentId}</code>
        </div>
        <span className="payment-paid-pill">
          <ShieldCheck size={16} /> Verified by Stripe
        </span>
      </div>
    );
  }

  return (
    <div className="enrollment-payment-card">
      <div className="payment-summary-box">
        <div className="payment-summary-row mb-2">
          <span>Student:</span>
          <strong>{studentName || "Prospective Student"}</strong>
        </div>
        <div className="payment-summary-row mb-2">
          <span>Fee Description:</span>
          <span>Enrollment & Registration Fee</span>
        </div>
        <div className="payment-summary-row total">
          <span>Total Due:</span>
          <span>${Number(feeAmount || 0).toFixed(2)}</span>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="danger" className="py-2 small">
          {errorMessage}
        </Alert>
      )}

      <div>
        <div className="form-group mb-3">
          <label className="fw-semibold text-slate-700 mb-1">
            CARDHOLDER FULL NAME *
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Jane Doe"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            required
            disabled={isProcessing}
          />
        </div>

        <div className="form-group mb-3">
          <label className="fw-semibold text-slate-700 mb-1">
            CARD DETAILS *
          </label>
          <div className="stripe-element-wrapper">
            <CardElement
              options={{
                ...STRIPE_ELEMENT_OPTIONS,
                hidePostalCode: false,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handlePay}
          className="apply-btn primary w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-bold"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Spinner size="sm" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <Lock size={16} />
              <span>Pay ${Number(feeAmount || 0).toFixed(2)} & Continue</span>
            </>
          )}
        </button>

        <div className="stripe-secure-badge">
          <ShieldCheck size={14} className="text-success" />
          <span>Encrypted 256-bit SSL connection powered by Stripe</span>
        </div>
      </div>
    </div>
  );
};

// --- Main PublicEnrollmentForm Component ---
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

  // Stripe state
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [isPaid, setIsPaid] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPublicEnrollmentForm(token);
      setFormData(data);

      // Initialize Stripe if publishable key is returned
      const pubKey =
        data.stripe_publishable_key ||
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (pubKey) {
        setStripePromise(loadStripe(pubKey));
      }

      if (data.prefill_data) {
        const initialResponses = {};
        const { students, parents } = data.prefill_data;
        if (parents && parents.length > 0) {
          setSignerName(
            `${parents[0].first_name || ""} ${parents[0].last_name || ""}`.trim() ||
              parents[0].email ||
              ""
          );
        }
        (data.form_structure?.sections || []).forEach((section) => {
          (section.fields || []).forEach((field) => {
            const label = (field.label || "").toLowerCase();
            if (label.includes("first name") && students && students.length > 0)
              initialResponses[field.id] = students[0].first_name;
            else if (label.includes("last name") && students && students.length > 0)
              initialResponses[field.id] = students[0].last_name;
            else if (label.includes("date of birth") && students && students.length > 0)
              initialResponses[field.id] = (students[0].date_of_birth || "").split("T")[0];
            else if (label.includes("grade level") && students && students.length > 0)
              initialResponses[field.id] = students[0].grade_level;
            else if (label.includes("email") && parents && parents.length > 0)
              initialResponses[field.id] = parents[0].email;
            else if (label.includes("phone") && parents && parents.length > 0)
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

  const handlePaymentSuccess = (intentId) => {
    setPaymentIntentId(intentId);
    setIsPaid(true);
    setStep((prev) => prev + 1);
  };

  // --- Sanitize Sections & Remove Misplaced Fields ---
  const sanitizedSections = (formData?.form_structure?.sections || [])
    .filter((s) => s.visible && s.id !== "pickup_info")
    .map((section) => {
      // In student_info or parent_info, filter out misplaced signature pads or payment method dropdowns
      if (section.id === "student_info" || section.id === "parent_info") {
        const cleanedFields = (section.fields || []).filter((field) => {
          const lbl = (field.label || "").toLowerCase();
          const isSignature = field.type === "signature" || lbl.includes("signature");
          const isPaymentMethod = lbl.includes("payment method");
          return !isSignature && !isPaymentMethod;
        });
        return { ...section, fields: cleanedFields };
      }
      return section;
    });

  const feeRequired = Boolean(formData?.fee_required && formData?.fee_amount > 0);
  const totalSteps = sanitizedSections.length + (feeRequired ? 1 : 0) + 1;
  const paymentStepNumber = feeRequired ? sanitizedSections.length + 1 : null;
  const reviewStepNumber = totalSteps;

  const handleSubmit = async (e) => {
    e.preventDefault();
    let effectiveSigner = signerName.trim();
    if (!effectiveSigner && formData?.prefill_data?.parents?.length > 0) {
      const p = formData.prefill_data.parents[0];
      effectiveSigner =
        `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "";
    }

    if (!effectiveSigner) {
      alert("Please provide the full legal name of the signer before submitting.");
      return;
    }

    if (!signatureDataUrl) {
      alert("Please provide your digital signature before submitting.");
      return;
    }

    if (feeRequired && !isPaid && !paymentIntentId) {
      alert("Payment of the registration fee is required prior to contract submission.");
      setStep(paymentStepNumber);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalResponses = {
        ...responses,
        parent_signer_name: effectiveSigner,
        parent_signature: signatureDataUrl,
      };

      await submitEnrollmentForm(token, finalResponses, paymentIntentId);
      setSubmitSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error || "An error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = sanitizedSections.map((s, index) => ({
    number: index + 1,
    title: s.title,
    desc:
      s.id === "student_info"
        ? "Student details & grade level"
        : s.id === "parent_info"
        ? "Parent & guardian contacts"
        : "School policies & agreements",
  }));

  if (feeRequired) {
    stepsList.push({
      number: paymentStepNumber,
      title: "Registration Payment",
      desc: "Secure Stripe credit card fee",
    });
  }

  stepsList.push({
    number: reviewStepNumber,
    title: "Review & Sign",
    desc: "Verify & sign legal contract",
  });

  const getStepHeadline = () => {
    if (step <= sanitizedSections.length) {
      const cur = sanitizedSections[step - 1];
      return {
        title: cur?.title || "Form Section",
        subtitle:
          cur?.id === "student_info"
            ? "Provide prospective student details below"
            : cur?.id === "parent_info"
            ? "Add primary parent or guardian contact information"
            : "Review academy policies and consent agreements",
      };
    }
    if (feeRequired && step === paymentStepNumber) {
      return {
        title: "Registration & Enrollment Fee",
        subtitle: "Submit payment securely via Stripe to confirm enrollment",
      };
    }
    return {
      title: "Review & Sign Contract",
      subtitle: "Review all information and execute the enrollment contract",
    };
  };

  const currentHeadline = getStepHeadline();

  if (loading) {
    return (
      <div
        className="apply-page-container align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3 text-muted small fw-semibold">
            Loading Enrollment Form...
          </div>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div
        className="apply-page-container align-items-center justify-content-center"
        style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "20px" }}
      >
        <div
          className="text-center p-5 border-0 bg-white"
          style={{
            maxWidth: "500px",
            width: "100%",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div
            className="d-flex align-items-center justify-content-center mx-auto mb-4"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              color: "#ef4444",
              fontSize: "28px",
            }}
          >
            !
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
            Enrollment Form Unavailable
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6" }}>
            {error || "Could not load the requested enrollment form. The link may be expired, completed, or invalid."}
          </p>
          <div className="mt-4">
            <a
              href="https://www.elaaschool.org/"
              className="apply-btn text-decoration-none d-inline-block"
            >
              Return to School Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div
        className="apply-page-container align-items-center justify-content-center"
        style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "20px" }}
      >
        <div
          className="text-center p-5 border-0 bg-white"
          style={{
            maxWidth: "540px",
            width: "100%",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div
            className="d-flex align-items-center justify-content-center mx-auto mb-4"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#e0f2fe",
              color: "#0284c7",
            }}
          >
            <CheckCircle size={36} />
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: "12px",
            }}
          >
            Enrollment Contract Submitted!
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6" }}>
            Thank you, <strong>{signerName}</strong>! The enrollment contract for{" "}
            <strong>{formData?.student_name}</strong> has been received and
            confirmed by Exceptional Learning and Arts Academy.
          </p>

          {feeRequired && (
            <div className="bg-slate-50 border rounded p-3 my-3 text-start small">
              <div className="d-flex justify-content-between">
                <span className="text-muted">Registration Fee:</span>
                <span className="fw-bold text-success">
                  ${Number(formData.fee_amount || 0).toFixed(2)} Paid (Stripe)
                </span>
              </div>
              {paymentIntentId && (
                <div className="d-flex justify-content-between mt-1">
                  <span className="text-muted">Reference:</span>
                  <code className="text-slate-700">{paymentIntentId}</code>
                </div>
              )}
            </div>
          )}

          <div className="d-flex flex-column gap-2 mt-4">
            <a
              href={`${getApiBaseUrl()}/api/enrollment/submission/${token}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="apply-btn primary text-decoration-none d-flex align-items-center justify-content-center gap-2"
            >
              <Download size={16} /> Download Signed Contract (PDF)
            </a>
            <a
              href="https://www.elaaschool.org/"
              className="apply-btn text-decoration-none d-flex align-items-center justify-content-center"
            >
              Return to School Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page-container">
      {/* Desktop Left Sidebar */}
      <aside className="apply-sidebar">
        <a
          href="https://www.elaaschool.org/"
          className="d-inline-flex align-items-center gap-1 mb-4 text-decoration-none fw-bold"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: "#64748b",
            fontSize: "12px",
          }}
        >
          ← Back to School Website
        </a>

        <div className="sidebar-logo-container mb-3">
          <img
            src="/images/ela-app-logo.png"
            alt="ELA Academy Logo"
            className="sidebar-logo"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <div>
            <div className="sidebar-title">ELA Academy</div>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>
              Official Enrollment
            </div>
          </div>
        </div>

        {formData?.student_name && (
          <div className="student-badge-pill">
            <User size={13} />
            <span>Enrolling: {formData.student_name}</span>
          </div>
        )}

        <div className="vertical-steps mt-2">
          {stepsList.map((s) => (
            <div
              key={s.number}
              className={`vertical-step ${
                step === s.number ? "active" : ""
              } ${step > s.number ? "completed" : ""}`}
            >
              <div className="vertical-step-badge">
                {step > s.number ? "✓" : s.number}
              </div>
              <div className="vertical-step-content">
                <span className="vertical-step-title">{s.title}</span>
                <span className="vertical-step-desc">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="mobile-apply-header">
        <div className="mobile-logo-bar">
          <div className="mobile-logo-group">
            <img
              src="/images/ela-app-logo.png"
              alt="Logo"
              className="mobile-logo"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <span className="mobile-title">ELA Enrollment</span>
          </div>
          <span className="small text-muted fw-bold">
            Step {step} of {totalSteps}
          </span>
        </div>
        <div className="mobile-progress-track">
          {stepsList.map((s) => (
            <div
              key={s.number}
              className={`mobile-progress-dot ${
                step === s.number ? "active" : ""
              } ${step > s.number ? "completed" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="apply-content-wrapper">
        <div className="apply-form-container">
          <span className="step-eyebrow">
            STEP {step} OF {totalSteps} • {formData?.form_structure?.title || "Enrollment Contract"}
          </span>
          <h1 className="step-main-title">{currentHeadline.title}</h1>
          <p className="step-subtitle">{currentHeadline.subtitle}</p>
          <div className="apply-divider" />

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1">
            {/* Step 1 to N: Sanitized Form Sections */}
            {sanitizedSections.map(
              (section, index) =>
                step === index + 1 && (
                  <FormSection
                    key={section.id}
                    section={section}
                    responses={responses}
                    onInputChange={handleInputChange}
                    signerName={signerName}
                  />
                )
            )}

            {/* Step N+1: Stripe Payment Step (if fee required) */}
            {feeRequired && step === paymentStepNumber && (
              <div>
                {stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <StripeCardForm
                      feeAmount={formData?.fee_amount || 0}
                      studentName={formData?.student_name || "Student"}
                      token={token}
                      onPaymentSuccess={handlePaymentSuccess}
                      isPaid={isPaid}
                      paymentIntentId={paymentIntentId}
                    />
                  </Elements>
                ) : (
                  <div className="text-center p-4 border rounded bg-slate-50">
                    <Spinner size="sm" className="me-2" />
                    <span className="text-muted small">
                      Initializing secure payment gateway...
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Final Step: Review & Execute Contract */}
            {step === reviewStepNumber && (
              <ReviewStep
                sections={sanitizedSections}
                responses={responses}
                feeRequired={feeRequired}
                feeAmount={formData?.fee_amount || 0}
                isPaid={isPaid}
                paymentIntentId={paymentIntentId}
                onSaveSignature={setSignatureDataUrl}
                signatureDataUrl={signatureDataUrl}
                signerName={signerName}
                setSignerName={setSignerName}
              />
            )}

            {/* Navigation Buttons */}
            <div className="apply-actions mt-auto">
              <button
                type="button"
                className="apply-btn"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1 || isSubmitting}
              >
                ← Back
              </button>

              {step < totalSteps ? (
                <button
                  type="button"
                  className="apply-btn primary"
                  onClick={() => {
                    if (feeRequired && step === paymentStepNumber && !isPaid) {
                      alert(
                        "Please complete the registration payment before proceeding to review."
                      );
                      return;
                    }
                    setStep((s) => s + 1);
                  }}
                  disabled={feeRequired && step === paymentStepNumber && !isPaid}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  className="apply-btn primary d-inline-flex align-items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      <span>Submitting Contract...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck size={16} />
                      <span>Sign & Execute Contract</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

// --- Form Section Renderer Component ---
const FormSection = ({ section, responses, onInputChange, signerName }) => {
  const renderField = (field) => {
    const label = (
      <Form.Label className="fw-semibold text-slate-700 mb-1" style={{ fontSize: "13px" }}>
        {field.label} {field.required && <span className="text-danger">*</span>}
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
              placeholder={`Enter ${field.label.toLowerCase()}...`}
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
              placeholder={`Enter ${field.label.toLowerCase()}...`}
            />
          </Form.Group>
        );
      case "checkbox":
        return (
          <Form.Group key={field.id} className="mb-3">
            <Form.Check
              type="checkbox"
              id={`chk-${field.id}`}
              required={field.required}
              checked={Boolean(value)}
              onChange={(e) => onInputChange(field.id, e.target.checked)}
              label={
                <span className="fw-semibold text-slate-700" style={{ fontSize: "13px" }}>
                  {field.label} {field.required && <span className="text-danger">*</span>}
                </span>
              }
            />
          </Form.Group>
        );
      case "multi_select": {
        const optionsList =
          typeof field.options === "string"
            ? field.options
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : Array.isArray(field.options)
            ? field.options
            : [];
        const selected = Array.isArray(value)
          ? value
          : typeof value === "string" && value
          ? value.split(", ")
          : [];
        const handleToggle = (opt) => {
          let next;
          if (selected.includes(opt)) {
            next = selected.filter((item) => item !== opt);
          } else {
            next = [...selected, opt];
          }
          onInputChange(field.id, next.join(", "));
        };
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <div className="p-3 border rounded bg-white shadow-sm">
              {optionsList.length > 0 ? (
                optionsList.map((opt, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    id={`field-${field.id}-${idx}`}
                    label={opt}
                    checked={selected.includes(opt)}
                    onChange={() => handleToggle(opt)}
                    className="mb-2"
                  />
                ))
              ) : (
                <span className="text-muted small">No options configured.</span>
              )}
            </div>
          </Form.Group>
        );
      }
      case "dropdown": {
        const optionsList =
          typeof field.options === "string"
            ? field.options
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : Array.isArray(field.options)
            ? field.options
            : [];
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Select
              required={field.required}
              value={value}
              onChange={(e) => onInputChange(field.id, e.target.value)}
            >
              <option value="">Please choose one...</option>
              {optionsList.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        );
      }
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
      case "signature":
        return (
          <SectionSignaturePad
            key={field.id}
            field={field}
            value={value}
            onInputChange={onInputChange}
            signerName={signerName}
          />
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
    <div className="dynamic-entry">
      <div className="dynamic-entry-header mb-3">
        <h3 className="fw-bold text-slate-800 m-0">{section.title}</h3>
      </div>
      <div>{section.fields.map(renderField)}</div>
    </div>
  );
};

// --- In-Section Signature Pad ---
const SectionSignaturePad = ({ field, value, onInputChange, signerName }) => {
  const [sigMode, setSigMode] = useState("draw");
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [localSigner, setLocalSigner] = useState(signerName || "");

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
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
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
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      onInputChange(field.id, canvasRef.current.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onInputChange(field.id, "");
  };

  const handleTypeChange = (name) => {
    setLocalSigner(name);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 400;
    tempCanvas.height = 100;
    const ctx = tempCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 100);
    ctx.font = "italic 32px 'Brush Script MT', cursive, sans-serif";
    ctx.fillStyle = "#0b2f4c";
    ctx.fillText(name || "Parent Signature", 20, 60);
    onInputChange(field.id, tempCanvas.toDataURL("image/png"));
  };

  return (
    <Card className="p-3 border rounded-3 mb-4 bg-slate-50">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <Form.Label className="fw-bold mb-0 text-slate-800">
          {field.label} {field.required && <span className="text-danger">*</span>}
        </Form.Label>
        {value && <span className="badge bg-success small">Signature Captured ✓</span>}
      </div>
      <p className="small text-muted mb-3">
        Sign below using touch screen, mouse, or switch to type your signature.
      </p>

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
            handleTypeChange(localSigner);
          }}
        >
          Type Signature
        </Button>
      </div>

      {sigMode === "draw" ? (
        <div>
          <div
            className="border rounded bg-white p-1 d-inline-block position-relative shadow-sm"
            style={{ width: "100%", maxWidth: "480px" }}
          >
            <canvas
              ref={canvasRef}
              width={480}
              height={120}
              style={{
                width: "100%",
                height: "120px",
                cursor: "crosshair",
                touchAction: "none",
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && !value && (
              <div
                className="position-absolute top-50 start-50 translate-middle text-muted pointer-events-none"
                style={{ fontSize: "13px", opacity: 0.5, userSelect: "none" }}
              >
                Sign here with finger or mouse
              </div>
            )}
          </div>
          <div className="mt-2 d-flex align-items-center gap-3">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-danger p-0 text-decoration-none"
              onClick={clearCanvas}
            >
              Clear Signature
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Form.Group className="mb-2" style={{ maxWidth: "400px" }}>
            <Form.Label className="small fw-semibold text-slate-600">
              FULL LEGAL NAME
            </Form.Label>
            <Form.Control
              type="text"
              size="sm"
              placeholder="e.g. John Doe"
              value={localSigner}
              onChange={(e) => handleTypeChange(e.target.value)}
            />
          </Form.Group>
          <div
            className="p-3 border rounded bg-white text-center shadow-sm"
            style={{ maxWidth: "400px" }}
          >
            <div
              style={{
                fontFamily: "'Brush Script MT', cursive, sans-serif",
                fontSize: "32px",
                color: "#0b2f4c",
              }}
            >
              {localSigner || "Signature Preview"}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// --- Digital Signature Pad Component for Final Step ---
const SignaturePad = ({ onSaveSignature, signerName, setSignerName, signatureDataUrl }) => {
  const [sigMode, setSigMode] = useState("draw");
  const canvasRef = useRef(null);
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
    tempCanvas.width = 480;
    tempCanvas.height = 120;
    const ctx = tempCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 480, 120);
    ctx.font = "italic 36px 'Brush Script MT', cursive, sans-serif";
    ctx.fillStyle = "#0b2f4c";
    ctx.fillText(name || "Parent Signature", 30, 70);
    onSaveSignature(tempCanvas.toDataURL("image/png"));
  };

  return (
    <div className="review-box mt-4">
      <h4 className="d-flex align-items-center gap-2">
        <FileCheck size={16} /> Parent / Guardian Digital Signature
      </h4>
      <p className="small text-muted mb-3">
        By signing below, you certify that all information provided is accurate
        and legally agree to the enrollment contract terms.
      </p>

      <div className="form-group mb-3">
        <label className="fw-semibold text-slate-700 mb-1" style={{ fontSize: "13px" }}>
          FULL LEGAL NAME OF SIGNER *
        </label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. Jane Doe"
          value={signerName}
          onChange={(e) => {
            setSignerName(e.target.value);
            if (sigMode === "type") handleTypeChange(e.target.value);
          }}
          required
        />
      </div>

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
          <div
            className="border rounded bg-white p-1 d-inline-block position-relative shadow-sm"
            style={{ width: "100%", maxWidth: "480px" }}
          >
            <canvas
              ref={canvasRef}
              width={480}
              height={120}
              style={{
                width: "100%",
                height: "120px",
                cursor: "crosshair",
                touchAction: "none",
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && !signatureDataUrl && (
              <div
                className="position-absolute top-50 start-50 translate-middle text-muted pointer-events-none"
                style={{ fontSize: "13px", opacity: 0.5, userSelect: "none" }}
              >
                Sign here with finger or mouse
              </div>
            )}
          </div>
          <div className="mt-2">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-danger p-0 text-decoration-none"
              onClick={clearCanvas}
            >
              Clear Signature
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="p-3 border rounded bg-white text-center shadow-sm"
          style={{ maxWidth: "480px" }}
        >
          <div
            style={{
              fontFamily: "'Brush Script MT', cursive, sans-serif",
              fontSize: "36px",
              color: "#0b2f4c",
            }}
          >
            {signerName || "Your Signature Preview"}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Review Step Component ---
const ReviewStep = ({
  sections,
  responses,
  feeRequired,
  feeAmount,
  isPaid,
  paymentIntentId,
  onSaveSignature,
  signatureDataUrl,
  signerName,
  setSignerName,
}) => (
  <div>
    <div className="alert alert-info py-2 px-3 small mb-4">
      Please review your submitted information below before signing and
      submitting the official enrollment contract.
    </div>

    {/* Section Summaries */}
    {sections.map((section) => (
      <div key={section.id} className="review-box mb-3">
        <h4>{section.title}</h4>
        {section.fields.map((field) => {
          if (field.type === "line_divider") return null;
          const val = responses[field.id];
          return (
            <div key={field.id} className="review-row">
              <strong>{field.label}:</strong>
              {field.type === "signature" ||
              (typeof val === "string" && val?.startsWith("data:image")) ? (
                <div className="bg-white border rounded p-1 d-inline-block">
                  <img
                    src={val}
                    alt="Signature"
                    style={{ maxHeight: "40px", maxWidth: "200px" }}
                  />
                </div>
              ) : (
                <span>{String(val || "Not provided")}</span>
              )}
            </div>
          );
        })}
      </div>
    ))}

    {/* Payment Status Summary */}
    {feeRequired && (
      <div className="review-box mb-3">
        <h4>Registration Fee Status</h4>
        <div className="review-row">
          <strong>Amount:</strong>
          <span>${Number(feeAmount || 0).toFixed(2)}</span>
        </div>
        <div className="review-row">
          <strong>Status:</strong>
          <div>
            <span className="payment-paid-pill">
              <ShieldCheck size={14} /> Paid via Stripe
            </span>
            {paymentIntentId && (
              <div className="text-muted small mt-1">Ref: {paymentIntentId}</div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Digital Signature Pad */}
    <SignaturePad
      onSaveSignature={onSaveSignature}
      signerName={signerName}
      setSignerName={setSignerName}
      signatureDataUrl={signatureDataUrl}
    />
  </div>
);

export default PublicEnrollmentForm;
