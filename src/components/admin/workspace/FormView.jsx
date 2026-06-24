import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Spinner, Row, Col, Card } from "react-bootstrap";
import { Plus, Trash2, Clipboard, Eye, Copy, ArrowLeft } from "lucide-react";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const FormView = ({ boardId }) => {
  const [forms, setForms] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Active form review
  const [activeForm, setActiveForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Public/Internal Form filler
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [previewSubmitting, setPreviewSubmitting] = useState(false);

  // Form Builder state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [questions, setQuestions] = useState([
    { id: 1, label: "Task Title", type: "text", mapping: "title", required: true }
  ]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/board-extensions/boards/${boardId}/forms`);
      setForms(res.data);
      
      const cfRes = await api.get(`/board-extensions/boards/${boardId}/custom-fields`);
      setCustomFields(cfRes.data);
    } catch (err) {
      showError("Failed to fetch forms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boardId) {
      fetchForms();
    }
  }, [boardId]);

  const handleAddQuestion = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions([
      ...questions,
      { id: nextId, label: `New Question ${nextId}`, type: "text", mapping: "", required: false }
    ]);
  };

  const handleRemoveQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleCreateFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || questions.length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim(),
        form_structure: questions
      };
      await api.post(`/board-extensions/boards/${boardId}/forms`, payload);
      showSuccess("Form view created.");
      setShowCreateModal(false);
      setFormName("");
      setFormDesc("");
      setQuestions([{ id: 1, label: "Task Title", type: "text", mapping: "title", required: true }]);
      fetchForms();
    } catch (err) {
      showError("Failed to create form.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm("Are you sure you want to delete this form config?")) return;
    try {
      await api.delete(`/board-extensions/forms/${formId}`);
      showSuccess("Form deleted.");
      fetchForms();
    } catch (err) {
      showError("Failed to delete form.");
    }
  };

  const handleViewResponses = async (form) => {
    setActiveForm(form);
    setLoadingResponses(true);
    try {
      const res = await api.get(`/board-extensions/forms/${form.id}/responses`);
      setResponses(res.data);
    } catch (err) {
      showError("Failed to load responses.");
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleFormFillSubmit = async (e) => {
    e.preventDefault();
    if (!activeForm) return;

    setPreviewSubmitting(true);
    try {
      await api.post(`/board-extensions/forms/submit/${activeForm.id}`, {
        response: previewAnswers
      });
      showSuccess("Form response submitted. A new task has been auto-created!");
      setPreviewAnswers({});
      setShowPreviewModal(false);
      if (activeForm) handleViewResponses(activeForm);
    } catch (err) {
      showError("Failed to submit form.");
    } finally {
      setPreviewSubmitting(false);
    }
  };

  const handleCopyLink = (formId) => {
    // Generate public-facing simulation link
    const link = `${window.location.origin}/admin/boards/${boardId}?activeView=form&formId=${formId}`;
    navigator.clipboard.writeText(link);
    showSuccess("Form link copied to clipboard!");
  };

  return (
    <div className="p-3 bg-white rounded shadow-sm border mt-3">
      {activeForm ? (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2">
              <Button variant="light" size="sm" onClick={() => setActiveForm(null)}>
                <ArrowLeft size={16} /> Back
              </Button>
              <h4 className="fw-bold text-slate-800 mb-0">{activeForm.name} Responses</h4>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={() => setShowPreviewModal(true)} className="d-flex align-items-center gap-1">
                <Eye size={15} /> Preview & Fill
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={() => handleCopyLink(activeForm.id)} className="d-flex align-items-center gap-1">
                <Copy size={14} /> Copy Link
              </Button>
            </div>
          </div>

          {loadingResponses ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-5 text-muted bg-light rounded">
              <Clipboard size={40} className="text-slate-300 mb-2" />
              <h5>No submissions received yet</h5>
              <p className="small mb-0">Use the preview link to share this form and collect submissions.</p>
            </div>
          ) : (
            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Submission Date</th>
                  <th>Created Task ID</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      {r.created_task_id ? (
                        <Badge bg="success">Task #{r.created_task_id}</Badge>
                      ) : (
                        <Badge bg="danger">Failed</Badge>
                      )}
                    </td>
                    <td className="text-end">
                      <Button variant="link" size="sm" onClick={() => {
                        setSelectedResponse(r);
                        setShowResponseModal(true);
                      }}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      ) : (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold text-slate-800 mb-1">Forms Views</h4>
              <p className="text-muted small mb-0">Build task ingestion forms. Submitting a form automatically creates a task in this workspace.</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="d-flex align-items-center gap-1">
              <Plus size={16} /> Create Form
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-5 text-muted bg-light rounded-3">
              <Clipboard size={48} className="text-slate-300 mb-3" />
              <h5>No form views configured</h5>
              <p className="small mb-0">Convert this list/board into an ingestion form to collect tasks.</p>
            </div>
          ) : (
            <Row className="g-3">
              {forms.map((f) => (
                <Col key={f.id} md={4}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <h5 className="fw-bold text-slate-800 mb-2">{f.name}</h5>
                      <p className="text-muted small mb-3 text-truncate-2">{f.description || "No description provided."}</p>
                      <div className="d-flex justify-content-between align-items-center border-top pt-3">
                        <Button variant="outline-primary" size="sm" onClick={() => handleViewResponses(f)}>
                          Responses
                        </Button>
                        <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteForm(f.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}

      {/* Create Form Modal (Form Builder) */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Build Task Ingestion Form</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateFormSubmit}>
          <Modal.Body style={{ maxHeight: "calc(100vh - 210px)", overflowY: "auto" }}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Form Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Bug Report Form, Feature Request"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Instructions for the user..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </Form.Group>

            <div className="border-top pt-3 mt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Form Questions & Mappings</h6>
                <Button variant="outline-primary" size="sm" onClick={handleAddQuestion}>
                  + Add Question
                </Button>
              </div>

              {questions.map((q, idx) => (
                <Row key={q.id} className="align-items-end g-2 mb-2 p-2 border rounded bg-light">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Question Label</Form.Label>
                      <Form.Control
                        type="text"
                        value={q.label}
                        onChange={(e) => handleQuestionChange(q.id, "label", e.target.value)}
                        required
                        size="sm"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Answer Input Type</Form.Label>
                      <Form.Select
                        value={q.type}
                        onChange={(e) => handleQuestionChange(q.id, "type", e.target.value)}
                        size="sm"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Paragraph</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Maps To Task Field / Custom Field</Form.Label>
                      <Form.Select
                        value={q.mapping}
                        onChange={(e) => handleQuestionChange(q.id, "mapping", e.target.value)}
                        size="sm"
                        required
                      >
                        <option value="">Select Target...</option>
                        <optgroup label="Default Task Fields">
                          <option value="title">Task Title</option>
                          <option value="priority">Priority</option>
                          <option value="notes">Description / Notes</option>
                          <option value="due_date">Due Date</option>
                        </optgroup>
                        {customFields.length > 0 && (
                          <optgroup label="Workspace Custom Fields">
                            {customFields.map(cf => (
                              <option key={cf.id} value={`custom_field_${cf.id}`}>{cf.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={1} className="text-end">
                    <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveQuestion(q.id)} disabled={q.mapping === "title"}>
                      <Trash2 size={15} />
                    </Button>
                  </Col>
                </Row>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner animation="border" size="sm" /> : "Save Form"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Form Preview / Fill Simulator Modal */}
      {activeForm && (
        <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="md" centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">{activeForm.name}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleFormFillSubmit}>
            <Modal.Body>
              {activeForm.description && (
                <p className="text-muted small mb-4 bg-light p-2 rounded">{activeForm.description}</p>
              )}
              {activeForm.form_structure?.map((q) => (
                <Form.Group key={q.id} className="mb-3">
                  <Form.Label className="small fw-semibold">{q.label} {q.required && <span className="text-danger">*</span>}</Form.Label>
                  {q.type === "textarea" ? (
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={previewAnswers[q.id] || ""}
                      onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                      required={q.required}
                    />
                  ) : q.type === "date" ? (
                    <Form.Control
                      type="date"
                      value={previewAnswers[q.id] || ""}
                      onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                      required={q.required}
                    />
                  ) : q.type === "number" ? (
                    <Form.Control
                      type="number"
                      value={previewAnswers[q.id] || ""}
                      onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                      required={q.required}
                    />
                  ) : (
                    <Form.Control
                      type="text"
                      value={previewAnswers[q.id] || ""}
                      onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                      required={q.required}
                    />
                  )}
                </Form.Group>
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" onClick={() => setShowPreviewModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={previewSubmitting}>
                {previewSubmitting ? <Spinner animation="border" size="sm" /> : "Submit Form"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* Response Details View Modal */}
      {selectedResponse && (
        <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Response Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <strong>Submitted At:</strong> {new Date(selectedResponse.created_at).toLocaleString()}
            </div>
            <div className="border rounded bg-light p-3">
              {activeForm?.form_structure?.map((q) => {
                const ans = selectedResponse.response[q.id];
                return (
                  <div key={q.id} className="mb-3 border-bottom pb-2">
                    <div className="small fw-semibold text-slate-700">{q.label}</div>
                    <div className="text-slate-900 mt-1">{ans !== undefined ? String(ans) : <span className="text-muted small">No answer provided</span>}</div>
                  </div>
                );
              })}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowResponseModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default FormView;
