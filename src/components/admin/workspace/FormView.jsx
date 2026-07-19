import React, { useState, useEffect } from "react";
import { Table, Button, Spinner, Row, Col, Card, Badge, Form as BootstrapForm, Modal, Dropdown } from "react-bootstrap";
import { Plus, Trash2, Clipboard, Eye, Copy, ArrowLeft, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Check, CheckSquare, Settings, Type, AlignJustify, Calendar, Paperclip, Hash } from "lucide-react";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const PRESET_BANNERS = [
  { id: "banner1", name: "Abstract Wave", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner2", name: "Modern Classroom", url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner3", name: "Tech Network", url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner4", name: "Playful Learning", url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&auto=format&fit=crop&q=80" }
];

const FormView = ({ boardId, boardCustomFields = [] }) => {
  const [forms, setForms] = useState([]);
  const customFields = boardCustomFields;
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
  
  // Advanced Form Builder tab and page selection states
  const [builderTab, setBuilderTab] = useState("build"); // "build" | "settings" | "preview"
  const [selectedPage, setSelectedPage] = useState("questions"); // "welcome" | "questions" | "thankyou"
  const [welcomeTitle, setWelcomeTitle] = useState("Welcome to ELA Form");
  const [welcomeDesc, setWelcomeDesc] = useState("Please fill out this form to submit your request.");
  const [thankYouTitle, setThankYouTitle] = useState("Submission Successful!");
  const [thankYouDesc, setThankYouDesc] = useState("Thank you for your submission. Your request has been registered.");

  // Dropdown states for mapping new questions
  const [showAddQuestionDropdown, setShowAddQuestionDropdown] = useState(false);
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");
  const [activeSubMenu, setActiveSubMenu] = useState(null); // null | 'dates' | 'task_property'

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
      // Parse form structure from json if it's a string
      const parsed = (res.data || []).map(f => {
        let struct = f.form_structure;
        if (typeof struct === "string") {
          try {
            struct = JSON.parse(struct);
          } catch (e) {
            struct = [];
          }
        }
        return { ...f, form_structure: struct || [] };
      });
      setForms(parsed);
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
    setFormName("Form");
    setFormDesc("");
    setWelcomeTitle("Welcome to ELA Form");
    setWelcomeDesc("Please fill out this form to submit your request.");
    setThankYouTitle("Submission Successful!");
    setThankYouDesc("Thank you for your submission. Your request has been registered.");
    setBuilderTab("build");
    setSelectedPage("questions");
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
    setBuilderTab("build");
    setSelectedPage("questions");
    setHeaderImageUrl(formConfig.header_image_url || PRESET_BANNERS[0].url);

    // Parse welcome and thank you configurations from structure
    const welcome = formConfig.form_structure?.find(q => q.type === "welcome");
    const thankyou = formConfig.form_structure?.find(q => q.type === "thankyou");

    setWelcomeTitle(welcome?.label || "Welcome to ELA Form");
    setWelcomeDesc(welcome?.description || "Please fill out this form to submit your request.");
    setThankYouTitle(thankyou?.label || "Submission Successful!");
    setThankYouDesc(thankyou?.description || "Thank you for your submission. Your request has been registered.");

    setQuestions(formConfig.form_structure?.filter(q => q.type !== "welcome" && q.type !== "thankyou") || []);
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
      const fullStructure = [
        { id: "welcome", type: "welcome", label: welcomeTitle, description: welcomeDesc },
        { id: "thankyou", type: "thankyou", label: thankYouTitle, description: thankYouDesc },
        ...questions
      ];

      const payload = {
        name: formName.trim(),
        description: formDesc.trim(),
        form_structure: fullStructure,
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

  if (isEditing) {
    return (
      <div className="bg-white min-vh-100 p-0 mt-3 rounded-4 shadow-sm border border-slate-100 overflow-hidden">
        {/* Sleek Header */}
        <div className="d-flex align-items-center justify-content-between p-3 bg-white border-bottom border-slate-100">
          <div className="d-flex align-items-center gap-2">
            <Button variant="light" size="sm" onClick={() => setIsEditing(false)} className="border-0 bg-slate-50 text-slate-700 rounded-lg px-3">
              <ArrowLeft size={16} /> Back
            </Button>
            <div>
              <h5 className="fw-bold text-slate-850 mb-0" style={{ fontSize: "13.5px" }}>
                {editingFormId ? "Design Form" : "Create Form"}
              </h5>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button variant="light" size="sm" onClick={() => setShowPreviewModal(true)} className="border-0 bg-slate-50 text-slate-650 rounded-lg px-3">
              <Eye size={14} className="me-1" /> Preview Layout
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveForm} disabled={submitting} className="border-0 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 fw-semibold">
              {submitting ? <Spinner animation="border" size="sm" /> : "Save Changes"}
            </Button>
          </div>
        </div>

        <Row className="g-0">
          {/* Sleek Canvas */}
          <Col lg={9} className="p-4 bg-white border-end border-slate-100 overflow-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
            <div className="mx-auto" style={{ maxWidth: "620px" }}>
              
              {/* Optional Header image cover area */}
              {headerImageUrl && (
                <div 
                  className="position-relative bg-slate-100 overflow-hidden mb-4 rounded-xl border border-slate-100" 
                  style={{ 
                    height: "140px", 
                    backgroundImage: `url(${getFullUrl(headerImageUrl)})`, 
                    backgroundSize: "cover", 
                    backgroundPosition: "center" 
                  }}
                >
                  <div className="position-absolute top-0 end-0 p-2">
                    <Button 
                      variant="light" 
                      size="sm" 
                      onClick={() => setShowBannerPicker(!showBannerPicker)}
                      className="border-0 bg-white/80 hover:bg-white text-slate-700 shadow-sm rounded-lg"
                      style={{ fontSize: "11px" }}
                    >
                      Change Cover
                    </Button>
                  </div>
                </div>
              )}

              {/* Cover Banner Selection Panel */}
              {showBannerPicker && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
                  <h6 className="fw-bold text-slate-805 small mb-2">Select Cover Design</h6>
                  <Row className="g-2 mb-3">
                    {PRESET_BANNERS.map((banner) => (
                      <Col key={banner.id} xs={3}>
                        <div 
                          onClick={() => setHeaderImageUrl(banner.url)}
                          className={`rounded-lg border overflow-hidden cursor-pointer position-relative ${headerImageUrl === banner.url ? "border-indigo-600 border-2" : "border-slate-200"}`}
                          style={{ height: "50px", backgroundImage: `url(${banner.url})`, backgroundSize: "cover", backgroundPosition: "center" }}
                        >
                          {headerImageUrl === banner.url && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 bg-indigo-650/10 d-flex align-items-center justify-content-center text-white">
                              <Check size={18} className="bg-indigo-650 rounded-circle p-1" />
                            </div>
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                  <div className="border-top border-slate-200 pt-2 d-flex align-items-center justify-content-between">
                    <span className="small text-muted text-xs">Or custom image URL:</span>
                    <input 
                      type="text" 
                      className="form-control form-control-sm w-50 border-slate-200 text-xs rounded-lg"
                      placeholder="https://..."
                      value={headerImageUrl}
                      onChange={(e) => setHeaderImageUrl(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Form Title & Description */}
              <div className="mb-4 pb-3 border-bottom border-slate-100">
                <input
                  type="text"
                  className="fw-bold text-slate-800 border-0 bg-transparent w-100 p-0 mb-1"
                  style={{ fontSize: "20px", outline: "none", boxShadow: "none" }}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Untitled Form"
                />
                <textarea
                  rows={2}
                  className="text-slate-500 border-0 bg-transparent w-100 p-0 text-sm"
                  style={{ outline: "none", boxShadow: "none", resize: "none" }}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Form description (optional)"
                />
              </div>

              {/* Form Fields In Canvas */}
              {questions.length === 0 ? (
                <div className="text-center py-5 border border-dashed border-slate-200 rounded-xl text-slate-400 bg-slate-50/50">
                  <Sparkles size={24} className="mb-2 text-slate-350" />
                  <h6 className="small text-slate-500 font-semibold mb-1">Your form is empty</h6>
                  <p className="small text-slate-400 mb-0" style={{ fontSize: "11px" }}>Add elements from the palette on the right to begin.</p>
                </div>
              ) : (
                <div className="d-flex flex-column">
                  {/* Table header (rendered once) */}
                  <div className="d-none d-md-flex align-items-center px-2 py-2 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-bottom border-slate-100 mb-1">
                    <div style={{ width: "30px" }}></div>
                    <div className="flex-grow-1 ms-2">Field Label / Title</div>
                    <div style={{ width: "110px" }} className="ms-3">Input Type</div>
                    <div style={{ width: "160px" }} className="ms-3">Task Field Map</div>
                    <div style={{ width: "80px" }} className="ms-3 text-center">Required</div>
                    <div style={{ width: "30px" }} className="ms-2"></div>
                  </div>

                  {questions.map((q, idx) => (
                    <div key={q.id} className="py-2.5 border-bottom border-slate-100 px-2 rounded-lg transition-colors">
                      <Row className="g-2 align-items-center">
                        {/* Drag handles */}
                        <Col xs="auto" className="d-flex align-items-center justify-content-center" style={{ width: "30px" }}>
                          <div className="d-flex flex-column align-items-center">
                            <Button variant="link" className="p-0 text-slate-400 hover:text-slate-700" onClick={() => moveQuestion(idx, "up")}>
                              <ArrowUp size={12} />
                            </Button>
                            <Button variant="link" className="p-0 text-slate-400 hover:text-slate-700" onClick={() => moveQuestion(idx, "down")}>
                              <ArrowDown size={12} />
                            </Button>
                          </div>
                        </Col>

                        {/* Question label */}
                        <Col className="ms-2">
                          <input
                            type="text"
                            className="form-control form-control-sm border-0 border-bottom border-slate-200 rounded-0 px-0 bg-transparent font-medium text-slate-800 text-sm"
                            style={{ boxShadow: "none" }}
                            value={q.label}
                            onChange={(e) => handleQuestionChange(q.id, "label", e.target.value)}
                            placeholder="Enter field label..."
                            required
                          />
                        </Col>

                        {/* Question Type */}
                        <Col xs="auto" style={{ width: "110px" }} className="ms-3">
                          <BootstrapForm.Select
                            size="sm"
                            className="border-0 border-bottom border-slate-200 rounded-0 px-0 bg-transparent text-xs font-semibold text-slate-650"
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
                        </Col>

                        {/* Mapping target */}
                        <Col xs="auto" style={{ width: "160px" }} className="ms-3">
                          <BootstrapForm.Select
                            size="sm"
                            className="border-0 border-bottom border-slate-200 rounded-0 px-0 bg-transparent text-xs font-semibold text-indigo-650"
                            value={q.mapping || ""}
                            onChange={(e) => handleQuestionChange(q.id, "mapping", e.target.value)}
                          >
                            <option value="">Choose Target...</option>
                            <optgroup label="Default Fields">
                              <option value="title">Task Title</option>
                              <option value="notes">Description / Notes</option>
                              <option value="start_date">Start Date</option>
                              <option value="due_date">End Date / Due Date</option>
                              <option value="priority">Priority</option>
                              <option value="status">Status</option>
                            </optgroup>
                            {customFields.length > 0 && (
                              <optgroup label="Custom Fields">
                                {customFields.map(cf => (
                                  <option key={cf.id} value={`custom_field_${cf.id}`}>{cf.name}</option>
                                ))}
                              </optgroup>
                            )}
                          </BootstrapForm.Select>
                        </Col>

                        {/* Required toggle */}
                        <Col xs="auto" style={{ width: "80px" }} className="ms-3 d-flex justify-content-center">
                          <BootstrapForm.Check
                            type="switch"
                            id={`req-${q.id}`}
                            label=""
                            className="mb-0 text-slate-500"
                            checked={q.required || false}
                            onChange={(e) => handleQuestionChange(q.id, "required", e.target.checked)}
                          />
                        </Col>

                        {/* Delete button */}
                        <Col xs="auto" style={{ width: "30px" }} className="ms-2 d-flex justify-content-center">
                          <Button 
                            variant="link" 
                            className="text-rose-500 hover:text-rose-700 p-0 border-0"
                            onClick={() => handleRemoveQuestion(q.id)}
                            disabled={q.mapping === "title"}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </Col>

                        {/* Conditional Display Logic */}
                        <Col xs={12} className="mt-1 ms-4 ps-3">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <BootstrapForm.Check
                              type="checkbox"
                              id={`cond-${q.id}`}
                              label="Conditional display logic"
                              checked={q.conditional || false}
                              className="text-muted mb-0 font-medium"
                              style={{ fontSize: "10.5px" }}
                              onChange={(e) => handleQuestionChange(q.id, "conditional", e.target.checked)}
                            />
                            {q.conditional && (
                              <div className="d-flex align-items-center gap-1.5 ms-2 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100" style={{ fontSize: "11px" }}>
                                <span>Show if</span>
                                <BootstrapForm.Select
                                  size="sm"
                                  className="border-0 border-bottom border-slate-200 bg-transparent text-xs p-0 rounded-0 font-semibold"
                                  value={q.depends_on || ""}
                                  onChange={(e) => handleQuestionChange(q.id, "depends_on", Number(e.target.value))}
                                  style={{ width: "105px", outline: "none", boxShadow: "none" }}
                                >
                                  <option value="">Select field...</option>
                                  {questions.filter(other => other.id !== q.id).map(other => (
                                    <option key={other.id} value={other.id}>{other.label}</option>
                                  ))}
                                </BootstrapForm.Select>
                                <span>equals</span>
                                <input
                                  type="text"
                                  className="border-0 border-bottom border-slate-200 bg-transparent text-xs p-0 text-slate-800 font-semibold"
                                  style={{ width: "70px", outline: "none", boxShadow: "none" }}
                                  value={q.depends_value || ""}
                                  onChange={(e) => handleQuestionChange(q.id, "depends_value", e.target.value)}
                                  placeholder="Value..."
                                />
                              </div>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>

          {/* Sleek Elements Palette */}
          <Col lg={3} className="p-4 bg-white overflow-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
            <h6 className="fw-bold text-slate-850 mb-3" style={{ fontSize: "13px" }}>Fields Palette</h6>
            
            <div className="d-flex flex-column gap-2 mb-4">
              <span className="small text-muted font-bold tracking-wider uppercase mb-1" style={{ fontSize: "9px" }}>Standard Fields</span>
              <Button 
                variant="light" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-0 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                style={{ fontSize: "12.5px" }}
                onClick={() => handleAddQuestion("text", "Short Text")}
              >
                <span className="p-1 bg-indigo-50 text-indigo-650 rounded-md d-inline-flex"><Type size={11} /></span>
                Short Text
              </Button>
              <Button 
                variant="light" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-0 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                style={{ fontSize: "12.5px" }}
                onClick={() => handleAddQuestion("textarea", "Paragraph / Notes", "notes")}
              >
                <span className="p-1 bg-blue-50 text-blue-650 rounded-md d-inline-flex"><AlignJustify size={11} /></span>
                Paragraph / Notes
              </Button>
              <Button 
                variant="light" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-0 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                style={{ fontSize: "12.5px" }}
                onClick={() => handleAddQuestion("number", "Numeric Value")}
              >
                <span className="p-1 bg-amber-50 text-amber-650 rounded-md d-inline-flex"><Hash size={11} /></span>
                Numeric Value
              </Button>
              <Button 
                variant="light" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-0 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                style={{ fontSize: "12.5px" }}
                onClick={() => handleAddQuestion("date", "Due Date", "due_date")}
              >
                <span className="p-1 bg-rose-50 text-rose-650 rounded-md d-inline-flex"><Calendar size={11} /></span>
                Date / Time
              </Button>
              <Button 
                variant="light" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-0 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                style={{ fontSize: "12.5px" }}
                onClick={() => handleAddQuestion("file", "File Upload", "file")}
              >
                <span className="p-1 bg-teal-50 text-teal-650 rounded-md d-inline-flex"><Paperclip size={11} /></span>
                File Upload
              </Button>
              <Button 
                variant="light" 
                size="sm" 
                className="text-start d-flex align-items-center gap-2 py-2 border-0 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                style={{ fontSize: "12.5px" }}
                onClick={() => handleAddQuestion("signature", "Signature Pad")}
              >
                <span className="p-1 bg-purple-50 text-purple-650 rounded-md d-inline-flex"><CheckSquare size={11} /></span>
                Signature Pad
              </Button>
            </div>

            {/* Custom fields mappings */}
            {customFields.length > 0 && (
              <div className="d-flex flex-column gap-2">
                <span className="small text-muted font-bold tracking-wider uppercase mb-1" style={{ fontSize: "9px" }}>Unmapped Custom Fields</span>
                {customFields
                  .filter(cf => !questions.some(q => q.mapping === `custom_field_${cf.id}`))
                  .map(cf => (
                    <Button 
                      key={cf.id}
                      variant="light" 
                      size="sm" 
                      className="text-start d-flex align-items-center justify-content-between py-2 px-3 border-0 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                      onClick={() => handleAddQuestion(cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : 'text', cf.name, `custom_field_${cf.id}`)}
                    >
                      <span className="text-slate-600 text-xs truncate font-medium">{cf.name}</span>
                      <span className="badge bg-white text-slate-400 border px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold">{cf.type}</span>
                    </Button>
                  ))}
                {customFields.filter(cf => !questions.some(q => q.mapping === `custom_field_${cf.id}`)).length === 0 && (
                  <span className="text-slate-400 small italic text-xs">All custom fields mapped!</span>
                )}
              </div>
            )}
          </Col>
        </Row>

        {/* Live Simulator Modal */}
        {showPreviewModal && (
          <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="md" centered>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold small text-slate-500 uppercase tracking-wider" style={{ fontSize: "11px" }}>Simulator Preview</Modal.Title>
            </Modal.Header>
            <BootstrapForm onSubmit={(e) => { e.preventDefault(); alert("Form simulated successfully!"); }}>
              <Modal.Body className="pt-2">
                <div className="rounded-xl overflow-hidden mb-3 border border-slate-100">
                  {headerImageUrl && <div style={{ height: "100px", backgroundImage: `url(${headerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}></div>}
                  <div className="p-3 bg-white">
                    <h4 className="fw-bold text-slate-800" style={{ fontSize: "18px" }}>{formName}</h4>
                    <p className="text-muted small mb-0">{formDesc}</p>
                  </div>
                </div>

                {questions.map((q) => {
                  if (!evaluateCondition(q, previewAnswers)) return null;
                  return (
                    <BootstrapForm.Group key={q.id} className="mb-3">
                      <BootstrapForm.Label className="small fw-semibold text-slate-700">{q.label} {q.required && <span className="text-danger">*</span>}</BootstrapForm.Label>
                      {q.type === "textarea" ? (
                        <BootstrapForm.Control as="textarea" rows={3} placeholder="Paragraph response..." required={q.required} />
                      ) : q.type === "date" ? (
                        <BootstrapForm.Control type="date" required={q.required} />
                      ) : q.type === "number" ? (
                        <BootstrapForm.Control type="number" placeholder="Enter number..." required={q.required} />
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
              <Modal.Footer className="border-top-0">
                <Button variant="light" size="sm" onClick={() => setShowPreviewModal(false)} className="rounded-lg">Close</Button>
                <Button variant="primary" size="sm" type="submit" className="bg-slate-900 border-0 rounded-lg">Submit Form</Button>
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
