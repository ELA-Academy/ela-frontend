import React from "react";
import FormPreview from "./FormPreview";
import { Alert } from "react-bootstrap";

const FormBuilderStep4 = ({ formState }) => {
  return (
    <div className="form-builder-container">
      <h4 className="step-subtitle">Step 4: Preview</h4>
      <Alert variant="info">
        <strong>Next Steps:</strong> This is a preview of your form. To get
        shareable links for parents, you must first send the form in Step 3. You
        can then find individual links in the "Submitted Registrations" tab on
        the main Enrollment page.
      </Alert>

      <div className="mt-4 p-4 border rounded bg-white">
        <FormPreview formStructure={formState.form_structure_json} />
      </div>
    </div>
  );
};

export default FormBuilderStep4;
