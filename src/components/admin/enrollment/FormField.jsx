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
      case "dropdown":
        return <div className="field-placeholder">Dropdown / Select Menu</div>;
      case "date_picker":
        return <div className="field-placeholder">Date Picker</div>;
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
    </div>
  );
};

export default FormField;
