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
      case "dropdown":
        return (
          <Form.Group key={field.id} className="mb-3">
            {label}
            <Form.Select disabled>
              <option>Dropdown Preview</option>
            </Form.Select>
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
