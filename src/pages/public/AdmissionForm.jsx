import React, { useState, useEffect } from "react";
import { createLead, getCaptchaChallenge } from "../../services/admissionsService";
import { useNavigate, Link } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import "../../styles/MultiStepForm.css";

const gradeLevels = [
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
];

const AdmissionForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    students: [
      {
        first_name: "",
        last_name: "",
        date_of_birth: "",
        city_state: "",
        grade_level: "",
      },
    ],
    parents: [{ first_name: "", last_name: "", email: "", phone: "" }],
    policy_agreed: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Captcha State
  const [captchaChallenge, setCaptchaChallenge] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const loadCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      setCaptchaAnswer("");
      const res = await getCaptchaChallenge();
      setCaptchaChallenge(res);
    } catch (e) {
      console.error("Failed to load captcha challenge:", e);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    if (step === 4) {
      loadCaptcha();
    }
  }, [step]);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    try {
      await createLead({
        ...formData,
        captcha_token: captchaChallenge?.token,
        captcha_answer: captchaAnswer
      });
      setSuccess(
        "Your application has been submitted successfully! Redirecting to homepage..."
      );
      setTimeout(() => navigate("/"), 5000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit application. Please review your information.");
      loadCaptcha();
      setStep(4);
    } finally {
      setIsLoading(false);
    }
  };

  const stepsList = [
    { number: 1, title: "Student Info", desc: "Prospective student details" },
    { number: 2, title: "Parent Info", desc: "Parent/Guardian contacts" },
    { number: 3, title: "Waiver & Policy", desc: "School waiver agreement" },
    { number: 4, title: "Review", desc: "Confirm information" }
  ];

  if (success) {
    return (
      <div className="apply-page-container align-items-center justify-content-center" style={{ backgroundColor: "#f8fafc" }}>
        <div
          className="text-center p-5 border-0 bg-white"
          style={{ maxWidth: "480px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
        >
          <div 
            className="d-flex align-items-center justify-content-center mx-auto mb-4"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#e0f2fe",
              color: "#0ea5e9"
            }}
          >
            <span style={{ fontSize: "28px", fontWeight: "bold" }}>✓</span>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>Application Received</h2>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6" }}>{success}</p>
        </div>
      </div>
    );
  }

  const getStepHeadline = () => {
    switch (step) {
      case 1:
        return { title: "Student Information", subtitle: "Provide prospective student details below" };
      case 2:
        return { title: "Parent/Guardian Details", subtitle: "Add primary guardian contact information" };
      case 3:
        return { title: "Policy & School Waiver", subtitle: "Review and accept school waiver terms" };
      case 4:
        return { title: "Review Details", subtitle: "Confirm all entered details before submitting" };
      default:
        return { title: "Application Form", subtitle: "" };
    }
  };

  const currentHeadline = getStepHeadline();

  return (
    <div className="apply-page-container">
      {/* Desktop Left Sidebar */}
      <aside className="apply-sidebar">
        <a 
          href="https://www.elaaschool.org/"
          className="d-inline-flex align-items-center gap-1.5 mb-4 text-decoration-none fw-bold text-xs"
          style={{ fontFamily: "'Inter', sans-serif", color: "#475569" }}
        >
          ← Back to School Website
        </a>
        <div className="sidebar-logo-container">
          <img 
            src="/images/ela-app-logo.png" 
            alt="ELA Academy Logo" 
            className="sidebar-logo" 
          />
          <span className="sidebar-title">ELA Academy</span>
        </div>

        <div className="vertical-steps">
          {stepsList.map((s) => (
            <div 
              key={s.number} 
              className={`vertical-step ${step === s.number ? "active" : ""} ${step > s.number ? "completed" : ""}`}
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
      <header className="mobile-apply-header">
        <div className="mobile-logo-bar">
          <a 
            href="https://www.elaaschool.org/"
            className="text-sky-600 text-xs fw-bold text-decoration-none"
            style={{ marginRight: "auto" }}
          >
            ← Website
          </a>
          <div className="mobile-logo-group" style={{ marginRight: "auto" }}>
            <img 
              src="/images/ela-app-logo.png" 
              alt="ELA Academy Logo" 
              className="mobile-logo" 
            />
            <span className="mobile-title">ELA Academy</span>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Step {step} of 4</span>
        </div>
        <div className="mobile-progress-track">
          {stepsList.map((s) => (
            <div 
              key={s.number} 
              className={`mobile-progress-dot ${step === s.number ? "active" : ""} ${step > s.number ? "completed" : ""}`}
            />
          ))}
        </div>
      </header>

      {/* Right Content Pane */}
      <main className="apply-content-wrapper">
        <div className="apply-form-container">
          <span className="step-eyebrow">Step {step} of 4</span>
          <h2 className="step-main-title">{currentHeadline.title}</h2>
          <p className="step-subtitle">{currentHeadline.subtitle}</p>

          <div className="apply-divider" />

          {/* Steps Switch */}
          <div style={{ flexGrow: 1 }}>
            {step === 1 && (
              <StudentInfoStep formData={formData} setFormData={setFormData} />
            )}
            {step === 2 && (
              <ParentInfoStep formData={formData} setFormData={setFormData} />
            )}
            {step === 3 && (
              <PolicyStep formData={formData} setFormData={setFormData} />
            )}
            {step === 4 && <ReviewStep formData={formData} error={error} />}
          </div>

          {/* Verification Challenge for Anti-Spam in Step 4 */}
          {step === 4 && captchaChallenge && (
            <div className="bg-slate-50 border rounded-3 p-3.5 mb-4 mt-3" style={{ fontFamily: "'Inter', sans-serif" }}>
              <label className="text-xs fw-bold text-slate-600 mb-2 d-flex justify-content-between align-items-center">
                <span>Verification Challenge (Anti-Spam)</span>
                <button 
                  type="button" 
                  className="btn btn-link text-xs p-0 text-sky-600 hover:text-sky-800 text-decoration-none font-semibold" 
                  onClick={loadCaptcha} 
                  disabled={loadingCaptcha}
                >
                  ↻ Refresh
                </button>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light font-bold text-slate-700 text-sm px-3" style={{ minWidth: "150px", textAlign: "center" }}>
                  {loadingCaptcha ? "Loading..." : captchaChallenge.question}
                </span>
                <input
                  required
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Your answer"
                  className="form-control text-sm"
                  style={{ height: "42px" }}
                />
              </div>
            </div>
          )}

          {/* Action Footer Navigation */}
          <div className="apply-actions">
            <button 
              type="button" 
              onClick={handleBack} 
              className="apply-btn" 
              disabled={step === 1}
            >
              Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="apply-btn primary"
                disabled={!isStepValid(step, formData)}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="apply-btn primary d-flex align-items-center gap-2"
                disabled={isLoading || !captchaAnswer.trim()}
              >
                {isLoading && <Spinner size="sm" animation="border" />}
                {isLoading ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>

          {/* Minimalist single-line footer */}
          <footer style={{ marginTop: "60px", padding: "20px 0 10px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>
              &copy; {new Date().getFullYear()} ELA Academy. All Rights Reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

// --- Step Child Components ---

const StudentInfoStep = ({ formData, setFormData }) => {
  const handleStudentChange = (index, e) => {
    const newStudents = [...formData.students];
    newStudents[index][e.target.name] = e.target.value;
    setFormData({ ...formData, students: newStudents });
  };
  const addStudent = () => {
    setFormData({
      ...formData,
      students: [
        ...formData.students,
        {
          first_name: "",
          last_name: "",
          date_of_birth: "",
          city_state: "",
          grade_level: "",
        },
      ],
    });
  };
  const removeStudent = (index) => {
    const newStudents = formData.students.filter((_, i) => i !== index);
    setFormData({ ...formData, students: newStudents });
  };
  return (
    <div>
      {formData.students.map((student, index) => (
        <div key={index} className="dynamic-entry">
          <div className="dynamic-entry-header">
            <h3>Student #{index + 1}</h3>
            {formData.students.length > 1 && (
              <button
                type="button"
                onClick={() => removeStudent(index)}
                className="btn-remove-entry"
              >
                Remove
              </button>
            )}
          </div>
          <div className="input-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="first_name"
                value={student.first_name}
                onChange={(e) => handleStudentChange(index, e)}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={student.last_name}
                onChange={(e) => handleStudentChange(index, e)}
                required
              />
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="date_of_birth"
                value={student.date_of_birth}
                onChange={(e) => handleStudentChange(index, e)}
                required
              />
            </div>
            <div className="form-group">
              <label>City/State *</label>
              <input
                type="text"
                name="city_state"
                value={student.city_state}
                placeholder="e.g. Austin, TX"
                onChange={(e) => handleStudentChange(index, e)}
                required
              />
            </div>
            <div className="form-group full-width">
              <label>Grade Level *</label>
              <select
                name="grade_level"
                value={student.grade_level}
                onChange={(e) => handleStudentChange(index, e)}
                required
              >
                <option value="">Select Grade Level</option>
                {gradeLevels.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addStudent} className="add-btn">
        + Add Another Student
      </button>
    </div>
  );
};

const ParentInfoStep = ({ formData, setFormData }) => {
  const handleParentChange = (index, e) => {
    const newParents = [...formData.parents];
    newParents[index][e.target.name] = e.target.value;
    setFormData({ ...formData, parents: newParents });
  };
  const addParent = () => {
    setFormData({
      ...formData,
      parents: [
        ...formData.parents,
        { first_name: "", last_name: "", email: "", phone: "" },
      ],
    });
  };
  const removeParent = (index) => {
    const newParents = formData.parents.filter((_, i) => i !== index);
    setFormData({ ...formData, parents: newParents });
  };
  return (
    <div>
      {formData.parents.map((parent, index) => (
        <div key={index} className="dynamic-entry">
          <div className="dynamic-entry-header">
            <h3>Parent/Guardian #{index + 1}</h3>
            {formData.parents.length > 1 && (
              <button
                type="button"
                onClick={() => removeParent(index)}
                className="btn-remove-entry"
              >
                Remove
              </button>
            )}
          </div>
          <div className="input-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="first_name"
                value={parent.first_name}
                onChange={(e) => handleParentChange(index, e)}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={parent.last_name}
                onChange={(e) => handleParentChange(index, e)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={parent.email}
                onChange={(e) => handleParentChange(index, e)}
                required
              />
            </div>
            <div className="form-group">
              <label>Mobile Phone *</label>
              <input
                type="tel"
                name="phone"
                value={parent.phone}
                placeholder="e.g. (123) 456-7890"
                onChange={(e) => handleParentChange(index, e)}
                required
              />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addParent} className="add-btn">
        + Add Another Parent/Guardian
      </button>
    </div>
  );
};

const PolicyStep = ({ formData, setFormData }) => (
  <div>
    <div className="policy-box">
      <p style={{ fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>
        Welcome to ELA Academy admissions registration!
      </p>
      <p>
        The data submitted will be used solely for establishing contact to
        provide additional information about the educational program at ELA
        Academy. Once you have been contacted, details on the enrollment process
        will be provided to you. Your personal information will not be shared to
        any outside sources unless otherwise authorized.
      </p>
    </div>
    <div
      className="form-group"
      style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "24px" }}
    >
      <input
        type="checkbox"
        id="policy_agreed"
        checked={formData.policy_agreed}
        onChange={(e) =>
          setFormData({ ...formData, policy_agreed: e.target.checked })
        }
        style={{ width: "18px", height: "18px", accentColor: "#0ea5e9", cursor: "pointer" }}
      />
      <label htmlFor="policy_agreed" style={{ marginBottom: 0, fontSize: "14px", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
        I understand and accept the admissions agreement *
      </label>
    </div>
  </div>
);

const ReviewStep = ({ formData, error }) => (
  <div>
    {error && (
      <Alert variant="danger" className="mb-4">
        {error}
      </Alert>
    )}
    {formData.students.map((student, index) => (
      <div key={index} className="review-box">
        <h4>Student #{index + 1}</h4>
        <div className="review-row">
          <strong>First Name:</strong>
          <span>{student.first_name}</span>
        </div>
        <div className="review-row">
          <strong>Last Name:</strong>
          <span>{student.last_name}</span>
        </div>
        <div className="review-row">
          <strong>Date of Birth:</strong>
          <span>{student.date_of_birth}</span>
        </div>
        <div className="review-row">
          <strong>City/State:</strong>
          <span>{student.city_state}</span>
        </div>
        <div className="review-row">
          <strong>Grade Level:</strong>
          <span>{student.grade_level}</span>
        </div>
      </div>
    ))}
    {formData.parents.map((parent, index) => (
      <div key={index} className="review-box">
        <h4>Parent/Guardian #{index + 1}</h4>
        <div className="review-row">
          <strong>First Name:</strong>
          <span>{parent.first_name}</span>
        </div>
        <div className="review-row">
          <strong>Last Name:</strong>
          <span>{parent.last_name}</span>
        </div>
        <div className="review-row">
          <strong>Email:</strong>
          <span>{parent.email}</span>
        </div>
        <div className="review-row">
          <strong>Mobile Phone:</strong>
          <span>{parent.phone}</span>
        </div>
      </div>
    ))}
    <div className="review-box">
      <h4>Policy & Waiver</h4>
      <div className="review-row">
        <strong>Agreement:</strong>
        <span>{formData.policy_agreed ? "Accepted" : "Not accepted"}</span>
      </div>
    </div>
  </div>
);

const isStepValid = (step, formData) => {
  switch (step) {
    case 1:
      return formData.students.every(
        (s) =>
          s.first_name &&
          s.last_name &&
          s.date_of_birth &&
          s.city_state &&
          s.grade_level
      );
    case 2:
      return formData.parents.every(
        (p) => p.first_name && p.last_name && p.email && p.phone
      );
    case 3:
      return formData.policy_agreed;
    default:
      return true;
  }
};

export default AdmissionForm;
