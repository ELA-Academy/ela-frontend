import React, { useState } from "react";
import { createLead } from "../../services/admissionsService";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../../components/PublicLayout";
import "../../styles/MultiStepForm.css";

// Constants for Grade Levels
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

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    try {
      await createLead(formData);
      setSuccess(
        "Your application has been submitted successfully! Redirecting to homepage..."
      );
      setTimeout(() => navigate("/"), 5000);
    } catch (err) {
      setError("Failed to submit application. Please review your information.");
      setStep(5);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <PublicLayout>
        <div className="form-page-container">
          <div
            className="multistep-form"
            style={{ textAlign: "center", padding: "50px" }}
          >
            <h2>Thank You!</h2>
            <p>{success}</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="form-page-container">
        <div className="multistep-form">
          <Stepper currentStep={step} />
          <div className="form-step-content">
            {step === 1 && (
              <StudentInfoStep formData={formData} setFormData={setFormData} />
            )}
            {step === 2 && (
              <ParentInfoStep formData={formData} setFormData={setFormData} />
            )}
            {step === 3 && <PickupInfoStep />}
            {step === 4 && (
              <PolicyStep formData={formData} setFormData={setFormData} />
            )}
            {step === 5 && <ReviewStep formData={formData} error={error} />}
          </div>
          <NavigationButtons
            step={step}
            handleBack={handleBack}
            handleNext={handleNext}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            isStepValid={isStepValid(step, formData)}
          />
        </div>
      </div>
    </PublicLayout>
  );
};

// --- Child Components for each step ---

const Stepper = ({ currentStep }) => (
  <div className="stepper-nav">
    {["Student", "Parent", "Pickup", "Policy", "Review"].map((label, index) => (
      <div
        key={index}
        className={`step ${currentStep === index + 1 ? "active" : ""} ${
          currentStep > index + 1 ? "completed" : ""
        }`}
      >
        <div className="step-number">
          {currentStep > index + 1 ? "✓" : index + 1}
        </div>
        <div className="step-label">{label} Info</div>
      </div>
    ))}
  </div>
);

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
      <h2>Student Information</h2>
      {formData.students.map((student, index) => (
        <div key={index} className="dynamic-entry">
          <div className="dynamic-entry-header">
            <h3>Student #{index + 1}</h3>
            {formData.students.length > 1 && (
              <button
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
      <button onClick={addStudent} className="add-btn">
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
      <h2>Parent/Guardian Information</h2>
      {formData.parents.map((parent, index) => (
        <div key={index} className="dynamic-entry">
          <div className="dynamic-entry-header">
            <h3>Parent/Guardian #{index + 1}</h3>
            {formData.parents.length > 1 && (
              <button
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
                onChange={(e) => handleParentChange(index, e)}
                required
              />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addParent} className="add-btn">
        + Add Another Parent/Guardian
      </button>
    </div>
  );
};

const PickupInfoStep = () => (
  <div>
    <h2>Authorized Pickup Information</h2>
    <p style={{ textAlign: "center", color: "#777", margin: "50px 0" }}>
      This page is not required for the initial application. Please continue to
      the next step.
    </p>
  </div>
);

const PolicyStep = ({ formData, setFormData }) => (
  <div>
    <h2>Policy & Waiver</h2>
    <div className="policy-container">
      <p>
        Thank you for your interest in Exceptional Learning and Arts Academy!
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
      style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}
    >
      <input
        type="checkbox"
        id="policy_agreed"
        checked={formData.policy_agreed}
        onChange={(e) =>
          setFormData({ ...formData, policy_agreed: e.target.checked })
        }
      />
      <label htmlFor="policy_agreed" style={{ marginBottom: 0 }}>
        I understand and accept *
      </label>
    </div>
  </div>
);

const ReviewStep = ({ formData, error }) => (
  <div>
    <h2>Review Your Information</h2>
    {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
    {formData.students.map((student, index) => (
      <div key={index} className="review-section">
        <h3>Student #{index + 1}</h3>
        <div className="review-grid">
          <strong>First Name:</strong>
          <span>{student.first_name}</span>
        </div>
        <div className="review-grid">
          <strong>Last Name:</strong>
          <span>{student.last_name}</span>
        </div>
        <div className="review-grid">
          <strong>Date of Birth:</strong>
          <span>{student.date_of_birth}</span>
        </div>
        <div className="review-grid">
          <strong>City/State:</strong>
          <span>{student.city_state}</span>
        </div>
        <div className="review-grid">
          <strong>Grade Level:</strong>
          <span>{student.grade_level}</span>
        </div>
      </div>
    ))}
    {formData.parents.map((parent, index) => (
      <div key={index} className="review-section">
        <h3>Parent/Guardian #{index + 1}</h3>
        <div className="review-grid">
          <strong>First Name:</strong>
          <span>{parent.first_name}</span>
        </div>
        <div className="review-grid">
          <strong>Last Name:</strong>
          <span>{parent.last_name}</span>
        </div>
        <div className="review-grid">
          <strong>Email:</strong>
          <span>{parent.email}</span>
        </div>
        <div className="review-grid">
          <strong>Mobile Phone:</strong>
          <span>{parent.phone}</span>
        </div>
      </div>
    ))}
    <div className="review-section">
      <h3>Policy & Waiver</h3>
      <div className="review-grid">
        <strong>Agreement:</strong>
        <span>{formData.policy_agreed ? "Yes" : "No"}</span>
      </div>
    </div>
  </div>
);

const NavigationButtons = ({
  step,
  handleBack,
  handleNext,
  handleSubmit,
  isLoading,
  isStepValid,
}) => (
  <div className="navigation-buttons">
    <button onClick={handleBack} className="nav-btn" disabled={step === 1}>
      Back
    </button>
    {step < 5 ? (
      <button
        onClick={handleNext}
        className="nav-btn primary"
        disabled={!isStepValid}
      >
        Continue
      </button>
    ) : (
      <button
        onClick={handleSubmit}
        className="nav-btn primary"
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Submit Application"}
      </button>
    )}
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
      return true; // Pickup step is always skippable
    case 4:
      return formData.policy_agreed;
    default:
      return true;
  }
};

export default AdmissionForm;
