import React, { useState, useEffect } from "react";
import { Table, Button, Spinner, Row, Col, Card, Badge, Form as BootstrapForm, Modal } from "react-bootstrap";
import { Plus, Trash2, Clipboard, Eye, Copy, ArrowLeft, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Check, CheckSquare, Settings } from "lucide-react";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const PRESET_BANNERS = [
  { id: "banner1", name: "Abstract Wave", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner2", name: "Modern Classroom", url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner3", name: "Tech Network", url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner4", name: "Playful Learning", url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&auto=format&fit=crop&q=80" }
];

const FormView = ({ boardId }) => {
  const [forms, setForms] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState(null);

  // Active form review (submissions list)
  const [activeForm, setActiveForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Full-Screen visual form builder state
  const [isEditing, setIsEditing] = useState(false);
  const [editingFormId, setEditingFormId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [questions, setQuestions] = useState([]);

  // Banners UI state
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Preview simulator inside builder
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [previewSubmitting, setPreviewSubmitting] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  // Helper to format local file uploads/signatures with full backend port
  const getFullUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }
    return `${apiBaseUrl}${path}`;
  };

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

  // Visual Builder Actions
  const handleStartCreate = () => {
    setEditingFormId(null);
    setFormName("Untitled Form");
    setFormDesc("Provide instructions or details for this form submission...");
    setHeaderImageUrl(PRESET_BANNERS[0].url);
    setQuestions([
      { id: 1, label: "Task Title", type: "text", mapping: "title", required: true }
    ]);
    setIsEditing(true);
  };

  const handleStartEdit = (formConfig) => {
    setEditingFormId(formConfig.id);
    setFormName(formConfig.name);
    setFormDesc(formConfig.description || "");
    setHeaderImageUrl(formConfig.header_image_url || PRESET_BANNERS[0].url);
    setQuestions(formConfig.form_structure || []);
    setIsEditing(true);
  };

  const handleAddQuestion = (type = "text", label = "New Question", mapping = "") => {
    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions([
      ...questions,
      { id: nextId, label, type, mapping, required: false }
    ]);
  };

  const handleRemoveQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const moveQuestion = (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setQuestions(updated);
  };

  const handleSaveForm = async () => {
    if (!formName.trim()) {
      showError("Form title cannot be empty.");
      return;
    }
    if (questions.length === 0) {
      showError("Please add at least one question.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim(),
        form_structure: questions,
        header_image_url: headerImageUrl
      };

      if (editingFormId) {
        await api.put(`/board-extensions/forms/${editingFormId}`, payload);
        showSuccess("Form view updated successfully!");
      } else {
        await api.post(`/board-extensions/boards/${boardId}/forms`, payload);
        showSuccess("Form view created successfully!");
      }
      setIsEditing(false);
      fetchForms();
    } catch (err) {
      showError("Failed to save form config.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm("Are you sure you want to delete this form configuration?")) return;
    try {
      setDeletingFormId(formId);
      await api.delete(`/board-extensions/forms/${formId}`);
      showSuccess("Form deleted.");
      fetchForms();
    } catch (err) {
      showError("Failed to delete form.");
    } finally {
      setDeletingFormId(null);
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

  const handleCopyLink = (formId) => {
    const link = `${window.location.origin}/public/forms/${formId}`;
    navigator.clipboard.writeText(link);
    showSuccess("Public form link copied to clipboard!");
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    setUploadingBanner(true);
    try {
      const res = await api.post("/board-extensions/public/forms/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setHeaderImageUrl(res.data.file_url);
      showSuccess("Banner image uploaded successfully.");
    } catch (err) {
      showError("Failed to upload banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

  // Preview Submission Simulation
  const handlePreviewSubmit = (e) => {
    e.preventDefault();
    showSuccess("Submission simulated successfully! Signature/inputs verified.");
    setShowPreviewModal(false);
    setPreviewAnswers({});
  };

  const evaluateCondition = (q, currentAnswers) => {
    if (!q.conditional) return true;
    if (!q.depends_on || q.depends_value === undefined) return true;
    const parentAnswer = currentAnswers[q.depends_on];
    return String(parentAnswer || "").toLowerCase() === String(q.depends_value).toLowerCase();
  };

  // Visual Designer Layout
  if (isEditing) {
    return (
      <div className="bg-slate-50 min-vh-100 p-0 mt-3 rounded shadow-sm border overflow-hidden">
        {/* Editor Top Bar */}
        <div className="d-flex align-items-center justify-content-between p-3 bg-white border-bottom shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <Button variant="light" size="sm" onClick={() => setIsEditing(false)} className="border">
              <ArrowLeft size={16} /> Back
            </Button>
            <div>
              <h5 className="fw-bold text-slate-800 mb-0">
                {editingFormId ? "Editing Form Layout" : "Design New Form"}
              </h5>
              <span className="small text-muted">Interactive Form Designer</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowPreviewModal(true)}>
              <Eye size={15} className="me-1" /> Preview Layout
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveForm} disabled={submitting}>
              {submitting ? <Spinner animation="border" size="sm" /> : "Save Changes"}
            </Button>
          </div>
        </div>

        <Row className="g-0" style={{ minHeight: "calc(100vh - 160px)" }}>
          {/* Main Visual Canvas Sheet */}
          <Col lg={9} className="p-4 d-flex justify-content-center overflow-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
            <div className="w-100" style={{ maxWidth: "680px" }}>
              
              {/* Card Banner Header Area */}
              <div 
                className="position-relative rounded-t-lg bg-slate-200 border border-bottom-0 shadow-sm overflow-hidden" 
                style={{ 
                  height: "200px", 
                  backgroundImage: `url(${getFullUrl(headerImageUrl)})`, 
                  backgroundSize: "cover", 
                  backgroundPosition: "center",
                  borderRadius: "16px 16px 0 0" 
                }}
              >
                <div className="position-absolute top-0 end-0 p-3 bg-gradient-to-l from-black/55 to-transparent w-100 h-100 d-flex justify-content-end align-items-start">
                  <Button 
                    variant="light" 
                    size="sm" 
                    onClick={() => setShowBannerPicker(!showBannerPicker)}
                    className="shadow-sm border d-flex align-items-center gap-1 opacity-90 hover:opacity-100 font-semibold"
                  >
                    <ImageIcon size={14} /> Change Banner
                  </Button>
                </div>
              </div>

              {/* Banner Pick Panel Drawer */}
              {showBannerPicker && (
                <div className="bg-white border rounded p-3 mb-3 shadow-md border-slate-200" style={{ borderTop: "none", borderRadius: "0 0 12px 12px" }}>
                  <h6 className="fw-bold text-slate-800 small mb-2">Select Banner Design</h6>
                  <Row className="g-2 mb-3">
                    {PRESET_BANNERS.map((banner) => (
                      <Col key={banner.id} xs={3}>
                        <div 
                          onClick={() => setHeaderImageUrl(banner.url)}
                          className={`rounded border overflow-hidden cursor-pointer position-relative ${headerImageUrl === banner.url ? "border-indigo-600 border-2" : "border-slate-200"}`}
                          style={{ height: "60px", backgroundImage: `url(${banner.url})`, backgroundSize: "cover", backgroundPosition: "center" }}
                        >
                          {headerImageUrl === banner.url && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 bg-indigo-600/20 d-flex align-items-center justify-content-center text-white">
                              <Check size={20} className="fw-bold bg-indigo-600 rounded-circle p-1" />
                            </div>
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                  <div className="border-top pt-2 d-flex align-items-center justify-content-between">
                    <span className="small text-muted">Or upload custom banner:</span>
                    <input 
                      type="file" 
                      id="custom-banner-upload" 
                      className="d-none" 
                      accept="image/*"
                      onChange={handleBannerUpload}
                    />
                    <label htmlFor="custom-banner-upload" className="btn btn-outline-secondary btn-sm mb-0 cursor-pointer fw-semibold">
                      {uploadingBanner ? <Spinner size="sm" animation="border" /> : "Upload Image"}
                    </label>
                  </div>
                </div>
              )}

              {/* Form Design Sheet Content */}
              <div className="bg-white border rounded-b-lg shadow-lg p-4 mb-5" style={{ borderRadius: "0 0 16px 16px", borderTop: "none" }}>
                {/* Form Title & Description Inputs */}
                <div className="mb-4 pb-3 border-bottom">
                  <BootstrapForm.Group className="mb-3">
                    <BootstrapForm.Label className="small fw-semibold text-slate-500">Form Name</BootstrapForm.Label>
                    <BootstrapForm.Control
                      type="text"
                      className="fw-bold text-slate-905 fs-4 border-slate-200 rounded-lg p-2"
                      placeholder="e.g. Staff Leave Request Form"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </BootstrapForm.Group>
                  <BootstrapForm.Group>
                    <BootstrapForm.Label className="small fw-semibold text-slate-500">Form Instructions / Description</BootstrapForm.Label>
                    <BootstrapForm.Control
                      as="textarea"
                      rows={2}
                      className="text-muted border-slate-200 rounded-lg p-2"
                      placeholder="Provide instructions or details for this form submission..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </BootstrapForm.Group>
                </div>

                {/* Form Questions Canvas */}
                {questions.length === 0 ? (
                  <div className="text-center py-5 border-dashed border-2 rounded text-slate-400 bg-slate-50">
                    <Sparkles size={32} className="mb-2 text-slate-300" />
                    <h6>Interactive Canvas is Empty</h6>
                    <p className="small mb-0">Use the palette on the right to add entry fields!</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {questions.map((q, idx) => (
                      <Card key={q.id} className="border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all overflow-hidden rounded-xl">
                        <Card.Body className="p-3 bg-slate-50/30">
                          <Row className="g-2 align-items-center">
                            
                            {/* Reordering column handle */}
                            <Col xs="auto" className="d-flex flex-column align-items-center">
                              <Button variant="link" className="p-0 text-slate-400 hover:text-slate-800" onClick={() => moveQuestion(idx, "up")}>
                                <ArrowUp size={16} />
                              </Button>
                              <Button variant="link" className="p-0 text-slate-400 hover:text-slate-800" onClick={() => moveQuestion(idx, "down")}>
                                <ArrowDown size={16} />
                              </Button>
                            </Col>

                            {/* Label Entry Field */}
                            <Col>
                              <BootstrapForm.Group>
                                <BootstrapForm.Label className="small fw-semibold text-slate-500 mb-1">Field Label / Header</BootstrapForm.Label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm border-slate-300 rounded-lg fw-medium"
                                  value={q.label}
                                  onChange={(e) => handleQuestionChange(q.id, "label", e.target.value)}
                                  placeholder="e.g. Employee Name"
                                  required
                                />
                              </BootstrapForm.Group>
                            </Col>

                            {/* Field Type Display */}
                            <Col xs={2}>
                              <BootstrapForm.Group>
                                <BootstrapForm.Label className="small fw-semibold text-slate-500 mb-1">Type</BootstrapForm.Label>
                                <BootstrapForm.Select
                                  size="sm"
                                  className="border-slate-300 rounded-lg"
                                  value={q.type}
                                  onChange={(e) => handleQuestionChange(q.id, "type", e.target.value)}
                                >
                                  <option value="text">Short Text</option>
                                  <option value="textarea">Paragraph</option>
                                  <option value="number">Number</option>
                                  <option value="date">Date</option>
                                  <option value="file">File Upload</option>
                                  <option value="signature">Signature Pad</option>
                                </BootstrapForm.Select>
                              </BootstrapForm.Group>
                            </Col>

                            {/* Target Model Mapping Column */}
                            <Col xs={3}>
                              <BootstrapForm.Group>
                                <BootstrapForm.Label className="small fw-semibold text-slate-500 mb-1">Task Mapping</BootstrapForm.Label>
                                <BootstrapForm.Select
                                  size="sm"
                                  className="border-slate-300 rounded-lg"
                                  value={q.mapping}
                                  onChange={(e) => handleQuestionChange(q.id, "mapping", e.target.value)}
                                  required
                                >
                                  <option value="">Select Target...</option>
                                  <optgroup label="Default Task Fields">
                                    <option value="title">Task Title</option>
                                    <option value="priority">Priority</option>
                                    <option value="notes">Description / Notes</option>
                                    <option value="due_date">Due Date</option>
                                    <option value="file">File Attachment</option>
                                  </optgroup>
                                  {customFields.length > 0 && (
                                    <optgroup label="Custom Fields">
                                      {customFields.map(cf => (
                                        <option key={cf.id} value={`custom_field_${cf.id}`}>{cf.name}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </BootstrapForm.Select>
                              </BootstrapForm.Group>
                            </Col>

                            {/* Actions Column */}
                            <Col xs="auto" className="d-flex align-items-center gap-2 pt-4">
                              <BootstrapForm.Check
                                type="switch"
                                id={`req-switch-${q.id}`}
                                label="Required"
                                className="small mb-0 text-slate-600 font-semibold"
                                checked={q.required || false}
                                onChange={(e) => handleQuestionChange(q.id, "required", e.target.checked)}
                              />
                              <Button 
                                variant="link" 
                                className="text-danger p-1" 
                                onClick={() => handleRemoveQuestion(q.id)}
                                disabled={q.mapping === "title"}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </Col>

                            {/* Conditional Display Field Logic settings */}
                            <Col xs={12} className="mt-2 border-top pt-2">
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <BootstrapForm.Check
                                  type="checkbox"
                                  id={`cond-${q.id}`}
                                  label="Conditional field dependency"
                                  checked={q.conditional || false}
                                  className="small text-slate-500 font-medium mb-0"
                                  onChange={(e) => handleQuestionChange(q.id, "conditional", e.target.checked)}
                                />
                                {q.conditional && (
                                  <div className="d-flex align-items-center gap-1 ms-3">
                                    <span className="small text-muted text-xs">Show if</span>
                                    <BootstrapForm.Select
                                      size="sm"
                                      value={q.depends_on || ""}
                                      onChange={(e) => handleQuestionChange(q.id, "depends_on", Number(e.target.value))}
                                      style={{ width: "150px", fontSize: "11px" }}
                                    >
                                      <option value="">Select question...</option>
                                      {questions.filter(other => other.id !== q.id).map(other => (
                                        <option key={other.id} value={other.id}>{other.label}</option>
                                      ))}
                                    </BootstrapForm.Select>
                                    <span className="small text-muted text-xs">equals</span>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      style={{ width: "100px", fontSize: "11px" }}
                                      value={q.depends_value || ""}
                                      onChange={(e) => handleQuestionChange(q.id, "depends_value", e.target.value)}
                                      placeholder="Value..."
                                    />
                                  </div>
                                )}
                              </div>
                            </Col>

                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </Col>

          {/* Designer Palette Sidebar */}
          <Col lg={3} className="bg-white border-start p-3 overflow-auto shadow-sm" style={{ maxHeight: "calc(100vh - 160px)" }}>
            <h6 className="fw-bold text-slate-800 mb-3 border-bottom pb-2">Fields Palette</h6>
            
            {/* Standard Element Inserters */}
            <div className="d-flex flex-column gap-2 mb-4">
              <span className="small text-muted font-bold tracking-wider uppercase mb-1">Standard Field Types</span>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-slate-200 text-indigo-700 hover:bg-indigo-50/50 rounded-lg transition-all"
                onClick={() => handleAddQuestion("text", "Short Text Question")}
              >
                <span className="bg-indigo-100 text-indigo-700 p-1 rounded-sm"><Plus size={13} /></span> Short Text Field
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-slate-200 text-indigo-700 hover:bg-indigo-50/50 rounded-lg transition-all"
                onClick={() => handleAddQuestion("textarea", "Detailed Response")}
              >
                <span className="bg-indigo-100 text-indigo-700 p-1 rounded-sm"><Plus size={13} /></span> Paragraph / Notes
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-slate-200 text-indigo-700 hover:bg-indigo-50/50 rounded-lg transition-all"
                onClick={() => handleAddQuestion("number", "Count / Value")}
              >
                <span className="bg-indigo-100 text-indigo-700 p-1 rounded-sm"><Plus size={13} /></span> Numeric Entry
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-slate-200 text-indigo-700 hover:bg-indigo-50/50 rounded-lg transition-all"
                onClick={() => handleAddQuestion("date", "Due Date / Selected Date", "due_date")}
              >
                <span className="bg-indigo-100 text-indigo-700 p-1 rounded-sm"><Plus size={13} /></span> Date Selector
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-slate-200 text-indigo-700 hover:bg-indigo-50/50 rounded-lg transition-all"
                onClick={() => handleAddQuestion("file", "Document Attachments", "file")}
              >
                <span className="bg-indigo-100 text-indigo-700 p-1 rounded-sm"><Plus size={13} /></span> File Upload Field
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-slate-200 text-indigo-700 hover:bg-indigo-50/50 rounded-lg transition-all"
                onClick={() => handleAddQuestion("signature", "Employee's Signature")}
              >
                <span className="bg-indigo-100 text-indigo-700 p-1 rounded-sm"><Plus size={13} /></span> Signature Pad Field
              </Button>
            </div>

            {/* Custom fields mappings */}
            {customFields.length > 0 && (
              <div className="d-flex flex-column gap-2">
                <span className="small text-muted font-bold tracking-wider uppercase mb-1">Unmapped Custom Fields</span>
                {customFields
                  .filter(cf => !questions.some(q => q.mapping === `custom_field_${cf.id}`))
                  .map(cf => (
                    <Button 
                      key={cf.id}
                      variant="outline-secondary" 
                      size="sm" 
                      className="text-start d-flex align-items-center justify-content-between py-2 border-dashed rounded-lg"
                      onClick={() => handleAddQuestion(cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : 'text', cf.name, `custom_field_${cf.id}`)}
                    >
                      <span className="text-slate-600 text-xs truncate font-medium">{cf.name} ({cf.type})</span>
                      <span className="text-indigo-600"><Plus size={12} /></span>
                    </Button>
                  ))}
                {customFields.filter(cf => !questions.some(q => q.mapping === `custom_field_${cf.id}`)).length === 0 && (
                  <span className="text-muted small italic">All custom fields mapped!</span>
                )}
              </div>
            )}
          </Col>
        </Row>

        {/* Live Simulator Dialog */}
        {showPreviewModal && (
          <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="md" centered>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold small text-muted">LIVE PREVIEW SIMULATOR</Modal.Title>
            </Modal.Header>
            <BootstrapForm onSubmit={handlePreviewSubmit}>
              <Modal.Body className="pt-2">
                <div className="rounded-lg shadow-sm border overflow-hidden mb-3">
                  <div style={{ height: "100px", backgroundImage: `url(${headerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}></div>
                  <div className="p-3 bg-white">
                    <h4 className="fw-bold text-slate-800">{formName}</h4>
                    <p className="text-muted small mb-0">{formDesc}</p>
                  </div>
                </div>

                {questions.map((q) => {
                  if (!evaluateCondition(q, previewAnswers)) return null;
                  return (
                    <BootstrapForm.Group key={q.id} className="mb-3">
                      <BootstrapForm.Label className="small fw-semibold">{q.label} {q.required && <span className="text-danger">*</span>}</BootstrapForm.Label>
                      {q.type === "textarea" ? (
                        <BootstrapForm.Control as="textarea" rows={3} placeholder="Paragraph text..." required={q.required} />
                      ) : q.type === "date" ? (
                        <BootstrapForm.Control type="date" required={q.required} />
                      ) : q.type === "number" ? (
                        <BootstrapForm.Control type="number" placeholder="Enter value..." required={q.required} />
                      ) : q.type === "file" ? (
                        <BootstrapForm.Control type="file" required={q.required} />
                      ) : q.type === "signature" ? (
                        <div className="border border-slate-200 rounded p-4 text-center cursor-pointer bg-slate-50 hover:bg-slate-100" style={{ borderStyle: "dashed" }}>
                          <span className="text-slate-450 italic small">Sign Here (Simulation Pad)</span>
                        </div>
                      ) : (
                        <BootstrapForm.Control type="text" placeholder="Short response..." required={q.required} />
                      )}
                    </BootstrapForm.Group>
                  );
                })}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="light" onClick={() => setShowPreviewModal(false)}>Close Simulator</Button>
                <Button variant="primary" type="submit">Verify & Submit</Button>
              </Modal.Footer>
            </BootstrapForm>
          </Modal>
        )}

      </div>
    );
  }

  // standard forms list and response table view
  return (
    <div className="p-3 bg-white rounded shadow-sm border mt-3">
      {activeForm ? (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
            <div className="d-flex align-items-center gap-2">
              <Button variant="light" size="sm" onClick={() => setActiveForm(null)} className="border">
                <ArrowLeft size={16} /> Back
              </Button>
              <h4 className="fw-bold text-slate-800 mb-0">{activeForm.name} Submissions</h4>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={() => handleStartEdit(activeForm)} className="d-flex align-items-center gap-1">
                <Settings size={14} /> Design Form
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
              <p className="small mb-0">Use the public link to share this form and collect submissions.</p>
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
              <p className="text-muted small mb-0">Build task ingestion forms. Submitting a form automatically creates and assigns a task in this workspace.</p>
            </div>
            <Button variant="primary" size="sm" onClick={handleStartCreate} className="d-flex align-items-center gap-1">
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
                  <Card className="h-100 shadow-sm border-slate-200 overflow-hidden rounded-xl hover:shadow-md transition-all">
                    {/* Header Image preview */}
                    <div 
                      style={{ 
                        height: "100px", 
                        backgroundImage: `url(${getFullUrl(f.header_image_url) || PRESET_BANNERS[0].url})`, 
                        backgroundSize: "cover", 
                        backgroundPosition: "center" 
                      }}
                    ></div>
                    <Card.Body>
                      <h5 className="fw-bold text-slate-800 mb-1">{f.name}</h5>
                      <p className="text-muted small mb-3 text-truncate-2" style={{ minHeight: "36px" }}>{f.description || "No description provided."}</p>
                      <div className="d-flex flex-column gap-2 border-top pt-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <Button variant="outline-primary" size="sm" onClick={() => handleViewResponses(f)}>
                            Responses
                          </Button>
                          <div className="d-flex align-items-center gap-2">
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              onClick={() => handleCopyLink(f.id)} 
                              title="Copy Public Link"
                              className="p-1 px-2 d-flex align-items-center justify-content-center border-slate-350 text-slate-700"
                            >
                              <Copy size={13} />
                            </Button>
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              onClick={() => window.open(`/public/forms/${f.id}`, "_blank")} 
                              title="Preview Public Form"
                              className="p-1 px-2 d-flex align-items-center justify-content-center border-slate-350 text-slate-700"
                            >
                              <Eye size={13} />
                            </Button>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          <Button 
                            variant="link" 
                            className="text-slate-650 p-0 text-decoration-none small d-flex align-items-center gap-1 font-semibold" 
                            style={{ fontSize: "11px" }} 
                            onClick={() => handleStartEdit(f)}
                          >
                            <Settings size={12} /> Design Layout
                          </Button>
                          <Button 
                            variant="link" 
                            className="text-danger p-0 text-decoration-none small d-flex align-items-center gap-1" 
                            style={{ fontSize: "11px" }} 
                            onClick={() => handleDeleteForm(f.id)}
                            disabled={deletingFormId === f.id}
                          >
                            {deletingFormId === f.id ? "Deleting..." : <><Trash2 size={11} /> Delete</>}
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}

      {/* Response Details View Modal */}
      {selectedResponse && (
        <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Response Details</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
            <div className="mb-3">
              <strong>Submitted At:</strong> {new Date(selectedResponse.created_at).toLocaleString()}
            </div>
            <div className="border rounded bg-light p-3">
              {activeForm?.form_structure?.map((q) => {
                const ans = selectedResponse.response[q.id];
                const isSignature = q.type === "signature" && ans;
                const isFile = q.type === "file" && ans && ans.file_url;
                
                return (
                  <div key={q.id} className="mb-3 border-bottom pb-2">
                    <div className="small fw-semibold text-slate-700">{q.label}</div>
                    <div className="text-slate-900 mt-1">
                      {isSignature ? (
                        <div className="border p-2 bg-white rounded d-inline-block">
                          <img src={getFullUrl(ans)} alt="Signature" style={{ maxHeight: "50px", maxWidth: "200px" }} />
                        </div>
                      ) : isFile ? (
                        <a href={getFullUrl(ans.file_url)} target="_blank" rel="noreferrer" className="text-decoration-underline small font-medium">
                          {ans.filename || "Attached File"}
                        </a>
                      ) : ans !== undefined ? (
                        String(ans)
                      ) : (
                        <span className="text-muted small">No answer provided</span>
                      )}
                    </div>
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
