import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner, Alert, Button } from "react-bootstrap";
import { getFormById, updateForm } from "../../../services/enrollmentService";
import { showSuccess, showError } from "../../../utils/notificationService";
import FormBuilderStep1 from "../../../components/admin/enrollment/FormBuilderStep1";
import FormBuilderStep2 from "../../../components/admin/enrollment/FormBuilderStep2";
import FormBuilderStep3 from "../../../components/admin/enrollment/FormBuilderStep3";
import FormBuilderStep4 from "../../../components/admin/enrollment/FormBuilderStep4";
import "../../../styles/FormBuilder.css";

const WizardStep = ({ number, label, isActive }) => (
  <div className={`wizard-step ${isActive ? "active" : ""}`}>
    <div className="wizard-step-number">{number}</div>
    <div className="wizard-step-label">{label}</div>
  </div>
);

const EnrollmentFormBuilder = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [formState, setFormState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(1);

  const fetchForm = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFormById(formId);
      setFormState(data);
    } catch (err) {
      setError("Failed to load form data.");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const handleSaveChanges = async (newStatus = null) => {
    if (!formState) return false;
    setIsSaving(true);
    try {
      const payload = {
        name: formState.form_structure_json.title,
        status: newStatus || formState.status,
        form_structure_json: formState.form_structure_json,
        collect_fee: formState.collect_fee,
        fee_amount: formState.fee_amount,
        recipient_type: formState.recipient_type,
      };
      await updateForm(formId, payload);
      if (newStatus) {
        showSuccess(`Form ${newStatus.toLowerCase()} successfully!`);
      } else {
        showSuccess("Draft saved successfully!");
      }
      return true;
    } catch (err) {
      showError("Failed to save form.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = async () => {
    // If we are on step 3, the component itself will handle saving and then call this function
    if (activeStep === 3) {
      setActiveStep(4);
      return;
    }

    const saved = await handleSaveChanges();
    if (saved) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleSaveAndExit = async () => {
    const saved = await handleSaveChanges();
    if (saved) {
      navigate("/admin/enrollment");
    }
  };

  const handlePublishAndExit = async () => {
    const published = await handleSaveChanges("Active");
    if (published) {
      navigate("/admin/enrollment");
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="content-area" style={{ paddingBottom: "100px" }}>
      <div className="form-builder-wizard">
        <WizardStep
          number={1}
          label="Create the Form"
          isActive={activeStep === 1}
        />
        <WizardStep
          number={2}
          label="Add Payment Method"
          isActive={activeStep === 2}
        />
        <WizardStep
          number={3}
          label="Share & Select Recipients"
          isActive={activeStep === 3}
        />
        <WizardStep
          number={4}
          label="Preview & Open"
          isActive={activeStep === 4}
        />
      </div>

      <div className="form-builder-content">
        {formState && activeStep === 1 && (
          <FormBuilderStep1 formState={formState} setFormState={setFormState} />
        )}
        {formState && activeStep === 2 && (
          <FormBuilderStep2 formState={formState} setFormState={setFormState} />
        )}
        {formState && activeStep === 3 && (
          <FormBuilderStep3
            formState={formState}
            setFormState={setFormState}
            onNextStep={() => setActiveStep(4)}
          />
        )}
        {formState && activeStep === 4 && (
          <FormBuilderStep4 formState={formState} />
        )}
      </div>

      <div className="builder-footer">
        <Button
          variant="outline-secondary"
          onClick={handleSaveAndExit}
          disabled={isSaving}
        >
          {isSaving ? <Spinner as="span" size="sm" /> : "Save and Exit"}
        </Button>
        <div>
          {activeStep > 1 && (
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => setActiveStep((p) => p - 1)}
            >
              Back
            </Button>
          )}
          {/* Step 3 has its own custom "Send & Continue" button */}
          {activeStep < 3 && (
            <Button onClick={handleNextStep} disabled={isSaving}>
              {isSaving ? <Spinner as="span" size="sm" /> : "Save & Continue"}
            </Button>
          )}
          {activeStep === 3 && (
            <Button
              onClick={() =>
                document.querySelector(".btn-success")?.click() ||
                handleNextStep()
              }
              disabled={isSaving}
            >
              {isSaving ? <Spinner as="span" size="sm" /> : "Save & Continue"}
            </Button>
          )}
          {activeStep === 4 && (
            <Button
              variant="primary"
              onClick={handlePublishAndExit}
              disabled={isSaving}
            >
              {isSaving ? <Spinner as="span" size="sm" /> : "Save & Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollmentFormBuilder;
