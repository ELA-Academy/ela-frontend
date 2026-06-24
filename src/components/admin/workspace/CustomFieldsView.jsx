import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Spinner, Badge } from "react-bootstrap";
import { Plus, Trash2, Settings, ListPlus } from "lucide-react";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown (Single Select)" },
  { value: "multi_select", label: "Multi-Select" },
  { value: "currency", label: "Currency" },
  { value: "rating", label: "Rating (1-5 Stars)" },
  { value: "formula", label: "Formula Field" }
];

const CustomFieldsView = ({ boardId }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "text",
    options: "", // for dropdown / multi-select
    currencySymbol: "$", // for currency
    formulaExpr: "" // for formula
  });

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/board-extensions/boards/${boardId}/custom-fields`);
      setFields(res.data);
    } catch (err) {
      showError("Failed to fetch custom fields.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boardId) {
      fetchFields();
    }
  }, [boardId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const config = {};
      if (formData.type === "dropdown" || formData.type === "multi_select") {
        config.options = formData.options.split(",").map(opt => opt.trim()).filter(Boolean);
      } else if (formData.type === "currency") {
        config.currencySymbol = formData.currencySymbol;
      } else if (formData.type === "formula") {
        config.formula = formData.formulaExpr;
      }

      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        config: Object.keys(config).length > 0 ? config : null
      };

      await api.post(`/board-extensions/boards/${boardId}/custom-fields`, payload);
      showSuccess("Custom field added successfully!");
      setShowAddModal(false);
      setFormData({ name: "", type: "text", options: "", currencySymbol: "$", formulaExpr: "" });
      fetchFields();
    } catch (err) {
      showError("Failed to create custom field.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fieldId) => {
    if (!window.confirm("Are you sure you want to delete this custom field? This will delete all task values for this field.")) return;
    try {
      await api.delete(`/board-extensions/custom-fields/${fieldId}`);
      showSuccess("Custom field deleted.");
      fetchFields();
    } catch (err) {
      showError("Failed to delete custom field.");
    }
  };

  return (
    <div className="p-3 bg-white rounded shadow-sm border mt-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-slate-800 mb-1">Custom Fields</h4>
          <p className="text-muted small mb-0">Create fields to track additional task properties like budget, ratings, and statuses.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} className="d-flex align-items-center gap-1">
          <Plus size={16} /> Add Field
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center py-5 text-muted bg-light rounded-3">
          <Settings size={48} className="text-slate-300 mb-3" />
          <h5>No custom fields defined yet</h5>
          <p className="small mb-0">Add custom attributes to enrich your tasks.</p>
        </div>
      ) : (
        <Table responsive hover className="align-middle">
          <thead>
            <tr>
              <th>Field Name</th>
              <th>Type</th>
              <th>Configuration</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id}>
                <td className="fw-semibold text-slate-800">{f.name}</td>
                <td>
                  <Badge bg="info" className="text-capitalize">{f.type.replace("_", " ")}</Badge>
                </td>
                <td className="small text-muted">
                  {f.type === "dropdown" || f.type === "multi_select" ? (
                    <div className="d-flex flex-wrap gap-1">
                      {f.config?.options?.map((opt, i) => (
                        <Badge key={i} bg="light" className="text-dark border">{opt}</Badge>
                      ))}
                    </div>
                  ) : f.type === "currency" ? (
                    <span>Symbol: {f.config?.currencySymbol}</span>
                  ) : f.type === "formula" ? (
                    <code>{f.config?.formula}</code>
                  ) : (
                    "None"
                  )}
                </td>
                <td className="text-end">
                  <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(f.id)}>
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Create Custom Field</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Field Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Budget, Stage, Est. Completion Date"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Field Type</Form.Label>
              <Form.Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {(formData.type === "dropdown" || formData.type === "multi_select") && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Options (Comma separated)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. High, Medium, Low"
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  required
                />
                <Form.Text className="text-muted small">Enter options separated by commas (e.g. Phase 1, Phase 2, Phase 3).</Form.Text>
              </Form.Group>
            )}

            {formData.type === "currency" && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Currency Symbol</Form.Label>
                <Form.Select
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                >
                  <option value="$">USD ($)</option>
                  <option value="₦">NGN (₦)</option>
                  <option value="₦">₦</option>
                  <option value="€">EUR (€)</option>
                  <option value="£">GBP (£)</option>
                </Form.Select>
              </Form.Group>
            )}

            {formData.type === "formula" && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Formula Expression</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. {time_estimate} * 50"
                  value={formData.formulaExpr}
                  onChange={(e) => setFormData({ ...formData, formulaExpr: e.target.value })}
                  required
                />
                <Form.Text className="text-muted small">Use field variables like <code>{`{time_estimate}`}</code> inside brackets.</Form.Text>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner animation="border" size="sm" /> : "Create Field"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomFieldsView;
