import React from "react";
import { Form, Button, Tooltip, OverlayTrigger } from "react-bootstrap";
import { Trash, GripVertical } from "react-bootstrap-icons";

const FormField = ({ field, onUpdate, onDelete }) => {
  const handleInputChange = (e) => {
    onUpdate(field.id, { ...field, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    onUpdate(field.id, { ...field, [e.target.name]: e.target.checked });
  };

  const renderFieldPreview = () => {
    switch (field.type) {
      case "short_answer":
        return <div className="field-placeholder">Short Answer Text</div>;
      case "paragraph":
        return <div className="field-placeholder">Long Answer Text</div>;
      case "checkbox":
        return (
          <div className="field-placeholder">
            <Form.Check type="checkbox" label="Checkbox option" readOnly />
          </div>
        );
      case "dropdown": {
        const optionsList = typeof field.options === "string"
          ? field.options.split(",").map((s) => s.trim()).filter(Boolean)
          : Array.isArray(field.options) ? field.options : [];
        return (
          <div className="field-placeholder">
            <Form.Select size="sm" disabled>
              <option value="">{field.label || "Select an option"} (Dropdown)</option>
              {optionsList.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </Form.Select>
          </div>
        );
      }
      case "multi_select": {
        const optionsList = typeof field.options === "string"
          ? field.options.split(",").map((s) => s.trim()).filter(Boolean)
          : Array.isArray(field.options) ? field.options : [];
        return (
          <div className="field-placeholder p-2 border rounded bg-white">
            <div className="text-muted small mb-1 fw-semibold">Parents can select all that apply:</div>
            {optionsList.length > 0 ? (
              optionsList.map((opt, i) => (
                <Form.Check key={i} type="checkbox" label={opt} disabled className="small mb-1" />
              ))
            ) : (
              <span className="text-muted fst-italic small">Add comma-separated options below</span>
            )}
          </div>
        );
      }
      case "date_picker":
        return <div className="field-placeholder">Date Picker</div>;
      case "signature":
        return (
          <div className="border border-2 border-dashed rounded p-3 bg-light text-center">
            <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
              <span className="fw-bold text-slate-700 small">✍️ Digital Signature Pad</span>
              <span className="badge bg-primary text-white" style={{ fontSize: "10px" }}>Touch / Mouse / Type</span>
            </div>
            <div className="border rounded bg-white p-2 text-muted" style={{ maxWidth: "340px", margin: "0 auto", fontSize: "12px" }}>
              <div className="d-flex justify-content-around text-slate-400 small mb-2 border-bottom pb-1">
                <span>[ Draw Signature ]</span>
                <span>[ Type Signature ]</span>
              </div>
              <div className="py-2 text-slate-400 fst-italic">
                Parents will draw or type their legal signature here
              </div>
            </div>
          </div>
        );
      case "file_upload":
        return <div className="field-placeholder">File Upload Button</div>;
      case "line_divider":
        return <hr />;
      default:
        return null;
    }
  };

  return (
    <div className="form-field">
      <div className="d-flex align-items-center mb-2">
        <GripVertical className="me-2 text-muted" />
        <div className="grow">
          <input
            type="text"
            name="label"
            value={field.label}
            onChange={handleInputChange}
            className="field-label-input"
            placeholder="Enter question or label"
          />
        </div>
        <div className="form-field-actions">
          <Form.Check
            type="switch"
            id={`required-${field.id}`}
            name="required"
            label="Required"
            checked={field.required}
            onChange={handleCheckboxChange}
          />
          <OverlayTrigger overlay={<Tooltip>Delete Field</Tooltip>}>
            <Button
              variant="link"
              className="text-danger p-0"
              onClick={() => onDelete(field.id)}
            >
              <Trash size={20} />
            </Button>
          </OverlayTrigger>
        </div>
      </div>
      {renderFieldPreview()}
      {(field.type === "dropdown" || field.type === "multi_select") && (
        <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
          <Form.Label className="small fw-semibold text-slate-700 mb-1 d-block">
            {field.type === "multi_select" ? "Multiple Choices" : "Dropdown Options"} (comma-separated):
          </Form.Label>
          <Form.Control
            size="sm"
            type="text"
            name="options"
            value={Array.isArray(field.options) ? field.options.join(", ") : (field.options || "")}
            onChange={(e) => onUpdate(field.id, { ...field, options: e.target.value })}
            placeholder="e.g. Option A, Option B, Option C"
          />
          <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
            {field.type === "multi_select"
              ? "Parents will be able to check all options that apply (e.g. classes, agreements)."
              : "Parents will select one option from this list."}
          </small>
        </div>
      )}
    </div>
  );
};

export default FormField;
