import React from "react";
import { Form } from "react-bootstrap";

const FormPreview = ({ formStructure }) => {
  if (!formStructure) {
    return null;
  }

  const renderPreviewField = (field) => {
    const label = (
      <Form.Label className="fw-bold">
        {field.label} {field.required && <span className="text-danger">*</span>}
      </Form.Label>
    );

    switch (field.type) {
      case "short_answer":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control type="text" readOnly placeholder="Short Answer" />
          </Form.Group>
        );
      case "paragraph":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control
              as="textarea"
              rows={3}
              readOnly
              placeholder="Paragraph"
            />
          </Form.Group>
        );
      case "checkbox":
        return (
          <Form.Group key={field.id} className="mb-3">
            <Form.Check type="checkbox" label={field.label} disabled />
          </Form.Group>
        );
      case "dropdown": {
        const optionsList = typeof field.options === "string"
          ? field.options.split(",").map((s) => s.trim()).filter(Boolean)
          : Array.isArray(field.options) ? field.options : [];
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Select disabled>
              <option>{field.label || "Please choose one"}...</option>
              {optionsList.map((opt, i) => (
                <option key={i}>{opt}</option>
              ))}
            </Form.Select>
          </Form.Group>
        );
      }
      case "multi_select": {
        const optionsList = typeof field.options === "string"
          ? field.options.split(",").map((s) => s.trim()).filter(Boolean)
          : Array.isArray(field.options) ? field.options : [];
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <div className="p-2 border rounded bg-white">
              {optionsList.length > 0 ? (
                optionsList.map((opt, i) => (
                  <Form.Check key={i} type="checkbox" label={opt} disabled className="mb-1" />
                ))
              ) : (
                <span className="text-muted small">No options added yet.</span>
              )}
            </div>
          </Form.Group>
        );
      }
      case "signature":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <div className="border border-2 border-dashed rounded p-3 bg-light text-center">
              <div className="text-muted small mb-2 fw-semibold">✍️ Parent / Guardian Digital Signature Pad</div>
              <div className="border rounded bg-white p-3 text-muted fst-italic" style={{ maxWidth: "340px", margin: "0 auto" }}>
                [ Sign here with touch screen, mouse, or keyboard ]
              </div>
            </div>
          </Form.Group>
        );
      case "date_picker":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control type="date" readOnly />
          </Form.Group>
        );
      case "file_upload":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Control type="file" disabled />
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
      <h2 className="text-center mb-4">{formStructure.title}</h2>
      {formStructure.sections
        .filter((s) => s.visible)
        .map((section) => (
          <div key={section.id} className="mb-5">
            <h4>{section.title}</h4>
            <hr />
            {section.fields.map(renderPreviewField)}
          </div>
        ))}
    </div>
  );
};

export default FormPreview;
