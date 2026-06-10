import React, { useState } from "react";
import { Form, Dropdown, Button } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import FormField from "./FormField";
import SubStepper from "./SubStepper";

const FormBuilderStep1 = ({ formState, setFormState }) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const sections = formState.form_structure_json?.sections || [];
  const activeSection = sections[activeSectionIndex];

  const handleTitleChange = (e) => {
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        title: e.target.value,
      },
    });
  };

  const handleSectionToggle = (sectionId) => {
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        sections: updatedSections,
      },
    });
  };

  const addField = (sectionId, fieldType) => {
    const newField = {
      id: uuidv4(),
      type: fieldType,
      label: "",
      required: true,
    };
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
    );
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        sections: updatedSections,
      },
    });
  };

  const updateField = (sectionId, fieldId, updatedField) => {
    const updatedSections = sections.map((s) => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: s.fields.map((f) => (f.id === fieldId ? updatedField : f)),
        };
      }
      return s;
    });
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        sections: updatedSections,
      },
    });
  };

  const deleteField = (sectionId, fieldId) => {
    const updatedSections = sections.map((s) => {
      if (s.id === sectionId) {
        return { ...s, fields: s.fields.filter((f) => f.id !== fieldId) };
      }
      return s;
    });
    setFormState({
      ...formState,
      form_structure_json: {
        ...formState.form_structure_json,
        sections: updatedSections,
      },
    });
  };

  return (
    <div className="form-builder-container">
      <input
        type="text"
        value={formState.form_structure_json?.title || ""}
        onChange={handleTitleChange}
        className="form-title-input"
        placeholder="New Student Enrollment Form"
      />

      <SubStepper sections={sections} activeIndex={activeSectionIndex} />

      {activeSection && (
        <div className="form-section">
          <div className="form-section-header">
            <h3>{activeSection.title}</h3>
            <Form.Check
              type="switch"
              id={`section-toggle-${activeSection.id}`}
              label="Visible"
              checked={activeSection.visible}
              onChange={() => handleSectionToggle(activeSection.id)}
            />
          </div>
          {activeSection.visible && (
            <>
              <div className="form-field-list">
                {activeSection.fields.map((field) => (
                  <FormField
                    key={field.id}
                    field={field}
                    onUpdate={(fieldId, updatedField) =>
                      updateField(activeSection.id, fieldId, updatedField)
                    }
                    onDelete={(fieldId) =>
                      deleteField(activeSection.id, fieldId)
                    }
                  />
                ))}
              </div>
              <div className="add-field-container">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" size="sm">
                    Add Form Field
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={() => addField(activeSection.id, "short_answer")}
                    >
                      Short Answer
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(activeSection.id, "paragraph")}
                    >
                      Paragraph
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(activeSection.id, "checkbox")}
                    >
                      Checkbox
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(activeSection.id, "dropdown")}
                    >
                      Dropdown
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(activeSection.id, "date_picker")}
                    >
                      Date Picker
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => addField(activeSection.id, "file_upload")}
                    >
                      File Upload
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      onClick={() => addField(activeSection.id, "line_divider")}
                    >
                      Line Divider
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </>
          )}
        </div>
      )}

      <div className="sub-step-navigation">
        <Button
          variant="secondary"
          onClick={() => setActiveSectionIndex((prev) => prev - 1)}
          disabled={activeSectionIndex === 0}
        >
          Back
        </Button>
        <Button
          className="ms-2"
          onClick={() => setActiveSectionIndex((prev) => prev + 1)}
          disabled={activeSectionIndex >= sections.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default FormBuilderStep1;
