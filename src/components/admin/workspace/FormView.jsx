import React, { useState, useEffect, useRef } from "react";
import { Table, Button, Spinner, Row, Col, Card, Badge, Form as BootstrapForm, Modal, Dropdown } from "react-bootstrap";
import { Plus, Trash2, Clipboard, Eye, Copy, ArrowLeft, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Check, CheckSquare, Settings, Type, AlignJustify, Calendar, Paperclip, Hash, Mail, X, Upload, Palette, RefreshCw } from "lucide-react";
import api, { getApiBaseUrl } from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const PRESET_BANNERS = [
  { id: "banner1", name: "Abstract Wave", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner2", name: "Modern Classroom", url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner3", name: "Tech Network", url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner4", name: "Playful Learning", url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&auto=format&fit=crop&q=80" },
  { id: "banner5", name: "Job Desk & Stationery", url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1200&auto=format&fit=crop&q=80" }
];

const PRESET_BACKGROUNDS = [
  { id: "bg-none", name: "Default (Clean Neutral)", url: "" },
  { id: "bg1", name: "Warm Collaborative Studio", url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&auto=format&fit=crop&q=80" },
  { id: "bg2", name: "Academic Campus", url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&auto=format&fit=crop&q=80" },
  { id: "bg3", name: "Geometric Gradient", url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&auto=format&fit=crop&q=80" },
  { id: "bg4", name: "Modern Architecture", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80" }
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
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [questions, setQuestions] = useState([]);
  
  // Advanced Form Builder tab and page selection states
  const [builderTab, setBuilderTab] = useState("build"); // "build" | "settings" | "preview"
  const [selectedPage, setSelectedPage] = useState("questions"); // "welcome" | "questions" | "thankyou"
  const [welcomeTitle, setWelcomeTitle] = useState("Welcome to ELA Form");
  const [welcomeDesc, setWelcomeDesc] = useState("Please fill out this form to submit your request.");
  const [thankYouTitle, setThankYouTitle] = useState("Submission Successful!");
  const [thankYouDesc, setThankYouDesc] = useState("Thank you for your submission. Your request has been registered.");

  // Form Settings states
  const [notificationEmails, setNotificationEmails] = useState([]);
  const [notifyAllDeptMembers, setNotifyAllDeptMembers] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [confirmationSenderEmail, setConfirmationSenderEmail] = useState("");
  const [availableEmails, setAvailableEmails] = useState([]);
  const [emailSearchQuery, setEmailSearchQuery] = useState("");
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);

  // Theme & Images design panel state
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [themePanelTab, setThemePanelTab] = useState("cover"); // "cover" | "background"
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const coverFileRef = useRef(null);
  const bgFileRef = useRef(null);

  // Dropdown states for mapping new questions
  const [showAddQuestionDropdown, setShowAddQuestionDropdown] = useState(false);
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");
  const [activeSubMenu, setActiveSubMenu] = useState(null); // null | 'dates' | 'task_property'

  // Preview simulator inside builder
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});

  // Helper to format local file uploads/signatures with full backend port
  const getFullUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }
    const base = getApiBaseUrl();
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    const fetchAvailableEmails = async () => {
      try {
        const res = await api.get("/board-extensions/forms/available-emails");
        setAvailableEmails(res.data || []);
      } catch (err) {
        try {
          const [deptRes, staffRes] = await Promise.all([
            api.get("/departments"),
            api.get("/staff")
          ]);
          const emails = [];
          (deptRes.data || []).forEach(d => {
            if (d.email) emails.push({ label: `${d.name} (${d.email})`, email: d.email, category: "Department Mailbox", is_admin: true });
          });
          (staffRes.data || []).forEach(s => {
            if (s.email) emails.push({ label: `${s.name} (${s.email})`, email: s.email, category: "Staff Member", is_admin: false });
          });
          setAvailableEmails(emails);
        } catch (fallbackErr) {
          console.error("Failed to fetch available emails", fallbackErr);
        }
      }
    };
    fetchAvailableEmails();
  }, []);

  const handleAddNotificationEmail = (email) => {
    if (!email || !email.includes("@")) return;
    const clean = email.trim().toLowerCase();
    if (!notificationEmails.includes(clean)) {
      setNotificationEmails(prev => [...prev, clean]);
    }
    setEmailSearchQuery("");
    setShowEmailDropdown(false);
  };

  const handleRemoveNotificationEmail = (email) => {
    setNotificationEmails(prev => prev.filter(e => e !== email));
  };

  const handleAddCustomEmail = (customEmail) => {
    if (!customEmail || !customEmail.includes("@")) {
      showError("Please enter a valid email address.");
      return;
    }
    handleAddNotificationEmail(customEmail);
  };

  const filteredAvailableEmails = availableEmails.filter(item => {
    if (!emailSearchQuery.trim()) return true;
    const q = emailSearchQuery.toLowerCase();
    return item.label?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q);
  });

  const fetchForms = async () => {
    if (!boardId || String(boardId) === "NaN" || boardId === "undefined") return;
    try {
      setLoading(true);
      const res = await api.get(`/board-extensions/boards/${boardId}/forms`);
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
    if (boardId && String(boardId) !== "NaN" && boardId !== "undefined") {
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
    setBackgroundImageUrl("");
    setShowThemePanel(false);
    setNotificationEmails([]);
    setNotifyAllDeptMembers(false);
    setSendConfirmation(true);
    setConfirmationSenderEmail("");
    setEmailSearchQuery("");
    setShowEmailDropdown(false);
    setQuestions([
      { id: 1, label: "Full Name", type: "text", mapping: "title", required: true },
      { id: 2, label: "Email Address", type: "email", mapping: "submitter_email", required: true },
      { id: 3, label: "Additional Information", type: "textarea", mapping: "notes", required: false }
    ]);
    setIsEditing(true);
  };

  const handleStartEdit = (formConfig) => {
    setEditingFormId(formConfig.id);
    setFormName(formConfig.name);
    setFormDesc(formConfig.description || "");
    setBuilderTab("build");
    setSelectedPage("questions");
    setShowThemePanel(false);
    setHeaderImageUrl(formConfig.header_image_url || formConfig.settings?.header_image_url || PRESET_BANNERS[0].url);
    setBackgroundImageUrl(formConfig.background_image_url || formConfig.settings?.background_image_url || "");

    // Parse welcome, thank you, and settings configurations from structure
    const welcome = formConfig.form_structure?.find(q => q.type === "welcome");
    const thankyou = formConfig.form_structure?.find(q => q.type === "thankyou");
    const settings = formConfig.settings || formConfig.form_structure?.find(q => q.type === "settings") || {};

    setWelcomeTitle(welcome?.label || "Welcome to ELA Form");
    setWelcomeDesc(welcome?.description || "Please fill out this form to submit your request.");
    setThankYouTitle(thankyou?.label || "Submission Successful!");
    setThankYouDesc(thankyou?.description || "Thank you for your submission. Your request has been registered.");

    setNotificationEmails(settings.notification_emails || []);
    setNotifyAllDeptMembers(!!settings.notify_all_dept_members);
    setSendConfirmation(settings.send_confirmation !== undefined ? settings.send_confirmation : true);
    setConfirmationSenderEmail(settings.confirmation_sender_email || "");
    setEmailSearchQuery("");
    setShowEmailDropdown(false);

    setQuestions(formConfig.form_structure?.filter(q => q.type !== "welcome" && q.type !== "thankyou" && q.type !== "settings") || []);
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

  const handleImageUpload = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select a valid image file (PNG, JPG, WEBP, etc.).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError("Image size must be less than 10MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    if (target === "cover") setUploadingCover(true);
    if (target === "background") setUploadingBackground(true);

    try {
      const res = await api.post("/board-extensions/public/forms/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.file_url) {
        if (target === "cover") {
          setHeaderImageUrl(res.data.file_url);
          showSuccess("Cover image uploaded from desktop successfully!");
        } else {
          setBackgroundImageUrl(res.data.file_url);
          showSuccess("Background image uploaded from desktop successfully!");
        }
      }
    } catch (err) {
      showError("Failed to upload image from desktop. Please try again.");
    } finally {
      if (target === "cover") setUploadingCover(false);
      if (target === "background") setUploadingBackground(false);
      e.target.value = "";
    }
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

    if (!editingFormId && (!boardId || String(boardId) === "NaN" || boardId === "undefined")) {
      showError("Invalid or missing board identifier.");
      return;
    }

    setSubmitting(true);
    try {
      const settingsBlock = {
        id: "settings",
        type: "settings",
        notification_emails: notificationEmails,
        notify_all_dept_members: notifyAllDeptMembers,
        send_confirmation: sendConfirmation,
        confirmation_sender_email: confirmationSenderEmail,
        background_image_url: backgroundImageUrl,
        header_image_url: headerImageUrl
      };

      const fullStructure = [
        { id: "welcome", type: "welcome", label: welcomeTitle, description: welcomeDesc },
        { id: "thankyou", type: "thankyou", label: thankYouTitle, description: thankYouDesc },
        settingsBlock,
        ...questions
      ];

      const payload = {
        name: formName.trim(),
        description: formDesc.trim(),
        form_structure: fullStructure,
        settings: settingsBlock,
        header_image_url: headerImageUrl,
        background_image_url: backgroundImageUrl
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
      showError(err.response?.data?.error || "Failed to save form config.");
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

  const evaluateCondition = (q, currentAnswers) => {
    if (!q.conditional) return true;
    if (!q.depends_on || q.depends_value === undefined) return true;
    const parentAnswer = currentAnswers[q.depends_on];
    return String(parentAnswer || "").toLowerCase() === String(q.depends_value).toLowerCase();
  };

  if (isEditing) {
    return (
      <div className="bg-white min-vh-100 p-0 mt-3 rounded-4 shadow-sm border border-slate-100 overflow-hidden">
        {/* Hidden File Inputs for Desktop Upload */}
        <input 
          type="file" 
          ref={coverFileRef} 
          accept="image/*" 
          onChange={(e) => handleImageUpload(e, "cover")} 
          className="d-none" 
        />
        <input 
          type="file" 
          ref={bgFileRef} 
          accept="image/*" 
          onChange={(e) => handleImageUpload(e, "background")} 
          className="d-none" 
        />

        {/* Sleek Header */}
        <div className="d-flex align-items-center justify-content-between p-3 bg-white border-bottom border-slate-100">
          <div className="d-flex align-items-center gap-2">
            <Button variant="light" size="sm" onClick={() => setIsEditing(false)} className="border-0 bg-slate-50 text-slate-700 rounded-lg px-3">
              <ArrowLeft size={16} /> Back
            </Button>
            <div>
              <h5 className="fw-bold text-slate-850 mb-0" style={{ fontSize: "14px" }}>
                {editingFormId ? "Design Form" : "Create Form"}
              </h5>
            </div>
          </div>

          {/* Centered Controls: Build / Settings / Theme */}
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center bg-slate-100 p-1 rounded-pill">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 transition-all border-0 ${builderTab === "build" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-500 hover:text-slate-700 font-medium"}`}
                style={{ fontSize: "12.5px" }}
                onClick={() => setBuilderTab("build")}
              >
                <Sparkles size={13} className={builderTab === "build" ? "text-indigo-600" : ""} />
                <span>Build</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 transition-all border-0 ${builderTab === "settings" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-500 hover:text-slate-700 font-medium"}`}
                style={{ fontSize: "12.5px" }}
                onClick={() => setBuilderTab("settings")}
              >
                <Settings size={13} className={builderTab === "settings" ? "text-indigo-600" : ""} />
                <span>Settings</span>
              </button>
            </div>

            <Button
              variant="light"
              size="sm"
              onClick={() => setShowThemePanel(!showThemePanel)}
              className={`border-0 rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 transition-all ${showThemePanel ? "bg-indigo-50 text-indigo-700 font-semibold" : "bg-slate-100 text-slate-700"}`}
              style={{ fontSize: "12.5px" }}
            >
              <Palette size={13} className="text-indigo-600" />
              <span>Theme & Images</span>
            </Button>
          </div>

          <div className="d-flex gap-2">
            <Button variant="light" size="sm" onClick={() => setShowPreviewModal(true)} className="border-0 bg-slate-50 text-slate-650 rounded-lg px-3">
              <Eye size={14} className="me-1" /> Preview Form
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveForm} disabled={submitting} className="border-0 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 fw-semibold">
              {submitting ? <Spinner animation="border" size="sm" /> : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Theme & Images Customization Panel */}
        {showThemePanel && (
          <div className="bg-slate-50 border-bottom border-slate-200 p-4 transition-all animate-fadeIn">
            <div className="mx-auto" style={{ maxWidth: "780px" }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Palette size={16} className="text-indigo-600" />
                  <span className="fw-bold text-slate-800 small">Form Theme & Media Customization</span>
                </div>
                <div className="d-flex align-items-center gap-1 bg-white p-1 rounded-pill border">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-0.5 border-0 text-xs font-semibold ${themePanelTab === "cover" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
                    onClick={() => setThemePanelTab("cover")}
                  >
                    Cover Image
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-0.5 border-0 text-xs font-semibold ${themePanelTab === "background" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
                    onClick={() => setThemePanelTab("background")}
                  >
                    Background Image
                  </button>
                </div>
              </div>

              {themePanelTab === "cover" ? (
                <div className="bg-white border rounded-3 p-3 shadow-2xs">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-xs fw-bold text-slate-700 uppercase tracking-wider">Select Preset Cover Banner</span>
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => coverFileRef.current?.click()}
                        disabled={uploadingCover}
                        className="text-xs py-1 px-2.5 d-flex align-items-center gap-1.5"
                      >
                        {uploadingCover ? <Spinner size="sm" animation="border" /> : <Upload size={13} />}
                        <span>Upload from Desktop</span>
                      </Button>
                      {headerImageUrl && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setHeaderImageUrl("")}
                          className="text-xs py-1 px-2"
                        >
                          Remove Cover
                        </Button>
                      )}
                    </div>
                  </div>

                  <Row className="g-2 mb-3">
                    {PRESET_BANNERS.map((banner) => (
                      <Col key={banner.id} xs={6} sm={4} md={2.4}>
                        <div 
                          onClick={() => setHeaderImageUrl(banner.url)}
                          className={`rounded-lg border overflow-hidden cursor-pointer position-relative ${headerImageUrl === banner.url ? "border-indigo-600 border-2 shadow-sm" : "border-slate-200 hover:border-slate-350"}`}
                          style={{ height: "55px", backgroundImage: `url(${banner.url})`, backgroundSize: "cover", backgroundPosition: "center" }}
                          title={banner.name}
                        >
                          {headerImageUrl === banner.url && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 bg-indigo-650/15 d-flex align-items-center justify-content-center text-white">
                              <Check size={16} className="bg-indigo-600 rounded-circle p-0.5" />
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 text-truncate mt-1 text-center">{banner.name}</div>
                      </Col>
                    ))}
                  </Row>

                  <div className="border-top border-slate-100 pt-2.5 d-flex align-items-center justify-content-between">
                    <span className="small text-muted text-xs">Or custom image URL:</span>
                    <input 
                      type="text" 
                      className="form-control form-control-sm w-75 border-slate-200 text-xs rounded-lg"
                      placeholder="https://... or paste direct image URL"
                      value={headerImageUrl}
                      onChange={(e) => setHeaderImageUrl(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white border rounded-3 p-3 shadow-2xs">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-xs fw-bold text-slate-700 uppercase tracking-wider">Select Page Background Backdrop</span>
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => bgFileRef.current?.click()}
                        disabled={uploadingBackground}
                        className="text-xs py-1 px-2.5 d-flex align-items-center gap-1.5"
                      >
                        {uploadingBackground ? <Spinner size="sm" animation="border" /> : <Upload size={13} />}
                        <span>Upload from Desktop</span>
                      </Button>
                      {backgroundImageUrl && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setBackgroundImageUrl("")}
                          className="text-xs py-1 px-2"
                        >
                          Reset to Default
                        </Button>
                      )}
                    </div>
                  </div>

                  <Row className="g-2 mb-3">
                    {PRESET_BACKGROUNDS.map((bg) => (
                      <Col key={bg.id} xs={6} sm={4} md={2.4}>
                        <div 
                          onClick={() => setBackgroundImageUrl(bg.url)}
                          className={`rounded-lg border overflow-hidden cursor-pointer position-relative ${backgroundImageUrl === bg.url ? "border-indigo-600 border-2 shadow-sm" : "border-slate-200 hover:border-slate-350"}`}
                          style={{ 
                            height: "55px", 
                            backgroundImage: bg.url ? `url(${bg.url})` : "none", 
                            backgroundColor: bg.url ? "transparent" : "#f8fafc",
                            backgroundSize: "cover", 
                            backgroundPosition: "center" 
                          }}
                          title={bg.name}
                        >
                          {!bg.url && (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-[10px] text-slate-400 font-semibold">
                              Default Clean
                            </div>
                          )}
                          {backgroundImageUrl === bg.url && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 bg-indigo-650/15 d-flex align-items-center justify-content-center text-white">
                              <Check size={16} className="bg-indigo-600 rounded-circle p-0.5" />
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 text-truncate mt-1 text-center">{bg.name}</div>
                      </Col>
                    ))}
                  </Row>

                  <div className="border-top border-slate-100 pt-2.5 d-flex align-items-center justify-content-between">
                    <span className="small text-muted text-xs">Or custom background URL:</span>
                    <input 
                      type="text" 
                      className="form-control form-control-sm w-75 border-slate-200 text-xs rounded-lg"
                      placeholder="https://... or paste direct background URL"
                      value={backgroundImageUrl}
                      onChange={(e) => setBackgroundImageUrl(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {builderTab === "build" ? (
          <Row className="g-0">
          {/* Sleek Canvas */}
          <Col lg={9} className="p-4 bg-slate-50/60 border-end border-slate-100 overflow-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
            <div className="mx-auto" style={{ maxWidth: "680px" }}>
              
              {/* Optional Header Cover area */}
              {headerImageUrl && (
                <div 
                  className="position-relative bg-slate-100 overflow-hidden rounded-t-3 shadow-xs border border-slate-200" 
                  style={{ 
                    height: "150px", 
                    backgroundImage: `url(${getFullUrl(headerImageUrl)})`, 
                    backgroundSize: "cover", 
                    backgroundPosition: "center",
                    borderBottom: "none"
                  }}
                >
                  <div className="position-absolute top-0 end-0 p-2.5 d-flex gap-1.5">
                    <Button 
                      variant="light" 
                      size="sm" 
                      onClick={() => {
                        setThemePanelTab("cover");
                        setShowThemePanel(true);
                      }}
                      className="border-0 bg-white/90 hover:bg-white text-slate-700 shadow-sm rounded-lg text-xs py-1 px-2.5 fw-medium"
                    >
                      Change Cover
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm" 
                      onClick={() => setHeaderImageUrl("")}
                      className="border-0 bg-white/90 hover:bg-white text-danger shadow-sm rounded-lg text-xs py-1 px-2"
                      title="Remove Cover"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Clean MS Forms Style Form Header Card */}
              <div 
                className="bg-white border border-slate-200 p-4 shadow-sm mb-4"
                style={{ 
                  borderRadius: headerImageUrl ? "0 0 16px 16px" : "16px" 
                }}
              >
                <div className="mb-3">
                  <label className="form-label text-[11px] fw-bold text-slate-400 uppercase tracking-wider mb-1">
                    Form Title
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg fw-bold text-slate-900 border-slate-200 rounded-3 px-3 py-2"
                    style={{ fontSize: "20px" }}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter form title (e.g. Exceptional Learning and Arts Academy Job Application Form)"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-[11px] fw-bold text-slate-400 uppercase tracking-wider mb-1">
                    Form Description & Instructions
                  </label>
                  <textarea
                    rows={3}
                    className="form-control text-slate-700 border-slate-200 rounded-3 px-3 py-2 text-sm"
                    style={{ lineHeight: "1.6" }}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Please complete this form to apply for a position at ELA Academy. Ensure all information provided is accurate."
                  />
                </div>

                <div className="pt-2 border-top border-slate-100 text-slate-400 d-flex flex-column gap-1" style={{ fontSize: "12px" }}>
                  <span>Submitter notice: &ldquo;When you submit this form, it will not automatically collect your details like name and email address unless you provide it yourself.&rdquo;</span>
                  <span className="text-danger fw-semibold">* Required</span>
                </div>
              </div>

              {/* Form Fields In Canvas */}
              {questions.length === 0 ? (
                <div className="text-center py-5 border border-dashed border-slate-200 rounded-xl text-slate-400 bg-white">
                  <Sparkles size={24} className="mb-2 text-slate-350" />
                  <h6 className="small text-slate-500 font-semibold mb-1">Your form has no questions</h6>
                  <p className="small text-slate-400 mb-0" style={{ fontSize: "11px" }}>Add elements from the palette on the right to begin.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-3.5 bg-white border border-slate-200 rounded-3 shadow-2xs transition-all hover:border-slate-350">
                      <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom border-slate-100">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-slate-100 text-slate-700 font-bold px-2 py-1 text-xs rounded-pill">
                            Question {idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                            {q.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <Button variant="link" size="sm" className="p-1 text-slate-400 hover:text-slate-700" onClick={() => moveQuestion(idx, "up")} title="Move Up">
                            <ArrowUp size={13} />
                          </Button>
                          <Button variant="link" size="sm" className="p-1 text-slate-400 hover:text-slate-700" onClick={() => moveQuestion(idx, "down")} title="Move Down">
                            <ArrowDown size={13} />
                          </Button>
                          <Button variant="link" size="sm" className="p-1 text-danger hover:text-red-700 ms-1" onClick={() => handleRemoveQuestion(q.id)} title="Delete Question">
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>

                      <Row className="g-2 mb-2">
                        <Col md={6}>
                          <label className="text-[10px] fw-bold uppercase text-slate-400 mb-1 d-block">Question Label</label>
                          <input
                            type="text"
                            className="form-control form-control-sm border-slate-200 rounded-2 text-sm fw-medium text-slate-800"
                            value={q.label}
                            onChange={(e) => handleQuestionChange(q.id, "label", e.target.value)}
                            placeholder="Enter question title..."
                            required
                          />
                        </Col>
                        <Col md={3}>
                          <label className="text-[10px] fw-bold uppercase text-slate-400 mb-1 d-block">Input Type</label>
                          <BootstrapForm.Select
                            size="sm"
                            className="border-slate-200 rounded-2 text-xs font-semibold text-slate-700"
                            value={q.type}
                            onChange={(e) => handleQuestionChange(q.id, "type", e.target.value)}
                          >
                            <option value="text">Short Text</option>
                            <option value="email">Email Address</option>
                            <option value="textarea">Paragraph</option>
                            <option value="number">Numeric Value</option>
                            <option value="date">Date</option>
                            <option value="file">File Upload</option>
                            <option value="signature">Signature Pad</option>
                          </BootstrapForm.Select>
                        </Col>
                        <Col md={3}>
                          <label className="text-[10px] fw-bold uppercase text-slate-400 mb-1 d-block">Task Field Map</label>
                          <BootstrapForm.Select
                            size="sm"
                            className="border-slate-200 rounded-2 text-xs font-semibold text-indigo-650"
                            value={q.mapping || ""}
                            onChange={(e) => handleQuestionChange(q.id, "mapping", e.target.value)}
                          >
                            <option value="">Default / None</option>
                            <optgroup label="Default Fields">
                              <option value="title">Task Title</option>
                              <option value="submitter_email">Submitter Email</option>
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
                      </Row>

                      <div className="d-flex align-items-center justify-content-between pt-2 border-top border-slate-100">
                        {/* Live Input Preview */}
                        <div className="flex-grow-1 me-3">
                          <input 
                            type="text" 
                            disabled 
                            className="form-control form-control-sm border-dashed border-slate-250 bg-slate-50/50 text-slate-400 text-xs rounded-2" 
                            placeholder={q.type === "signature" ? "Draw/Type signature pad" : q.type === "file" ? "Upload file button" : "Enter your answer"} 
                          />
                        </div>

                        {/* Required toggle */}
                        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs text-slate-500 font-medium">Required</span>
                          <BootstrapForm.Check
                            type="switch"
                            id={`req-${q.id}`}
                            label=""
                            className="mb-0"
                            checked={!!q.required}
                            onChange={(e) => handleQuestionChange(q.id, "required", e.target.checked)}
                          />
                        </div>
                      </div>
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
              <span className="small text-muted font-bold tracking-wider uppercase mb-1" style={{ fontSize: "9px" }}>Standard Elements</span>
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
                onClick={() => handleAddQuestion("email", "Email Address", "submitter_email")}
              >
                <span className="p-1 bg-emerald-50 text-emerald-650 rounded-md d-inline-flex"><Mail size={11} /></span>
                Email Address
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
                onClick={() => handleAddQuestion("date", "Date", "due_date")}
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
                <span className="small text-muted font-bold tracking-wider uppercase mb-1" style={{ fontSize: "9px" }}>Unmapped Board Fields</span>
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
        ) : (
          <div className="p-4 bg-slate-50 min-vh-100 overflow-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
            <div className="mx-auto bg-white border border-slate-200 rounded-3 shadow-sm p-4" style={{ maxWidth: "720px" }}>
              <div className="border-bottom pb-3 mb-4">
                <h5 className="fw-bold text-slate-900 mb-1" style={{ fontSize: "16px" }}>
                  Form Notification & Email Settings
                </h5>
                <p className="text-muted small mb-0" style={{ fontSize: "12px" }}>
                  Configure who receives submission notifications and control automatic confirmation emails sent to submitters.
                </p>
              </div>

              {/* 1. Internal Submission Notifications */}
              <div className="mb-4 pb-4 border-bottom">
                <div className="d-flex align-items-start gap-2.5 mb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-slate-800 mb-0.5" style={{ fontSize: "14px" }}>
                      Submission Notification Recipients
                    </h6>
                    <p className="text-muted small mb-0" style={{ fontSize: "12px" }}>
                      Selected email addresses will automatically receive the submission details. By default, only the admin/department mailbox receives it so uninvolved department members are not disturbed.
                    </p>
                  </div>
                </div>

                {/* Selected Email Badges */}
                <div className="mb-2">
                  <label className="form-label text-xs fw-semibold text-slate-700 mb-1.5">
                    Notification Recipients ({notificationEmails.length})
                  </label>
                  <div className="d-flex flex-wrap gap-1.5 p-2 bg-slate-50 border rounded-2 min-h-[42px] align-items-center">
                    {notificationEmails.length === 0 ? (
                      <span className="text-muted small italic px-1" style={{ fontSize: "12px" }}>
                        Default: Primary Department / Admin Mailbox only (no extra staff will be emailed)
                      </span>
                    ) : (
                      notificationEmails.map((email) => (
                        <Badge
                          key={email}
                          bg="white"
                          className="text-slate-800 border shadow-2xs d-flex align-items-center gap-1.5 px-2.5 py-1.5 fw-medium"
                          style={{ fontSize: "12px" }}
                        >
                          <Mail size={12} className="text-indigo-600" />
                          <span>{email}</span>
                          <button
                            type="button"
                            className="btn btn-link p-0 text-slate-400 hover:text-danger ms-1 border-0 d-flex align-items-center"
                            onClick={() => handleRemoveNotificationEmail(email)}
                            title="Remove recipient"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Search & Add Recipient Dropdown */}
                <div className="position-relative mb-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0 text-slate-400">
                      <Mail size={13} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0 shadow-none text-xs"
                      placeholder="Search directory or type email and press Enter to add..."
                      value={emailSearchQuery}
                      onChange={(e) => {
                        setEmailSearchQuery(e.target.value);
                        setShowEmailDropdown(true);
                      }}
                      onFocus={() => setShowEmailDropdown(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomEmail(emailSearchQuery);
                        }
                      }}
                    />
                    {emailSearchQuery && (
                      <Button
                        variant="dark"
                        size="sm"
                        className="text-xs px-3"
                        onClick={() => handleAddCustomEmail(emailSearchQuery)}
                      >
                        + Add Email
                      </Button>
                    )}
                  </div>

                  {/* Autocomplete / List Dropdown */}
                  {showEmailDropdown && (
                    <div
                      className="position-absolute bg-white border rounded-3 shadow-lg w-100 p-2 mt-1 overflow-auto"
                      style={{ zIndex: 1050, maxHeight: "250px", fontSize: "12px" }}
                    >
                      <div className="d-flex align-items-center justify-content-between px-2 pb-1.5 border-bottom mb-1">
                        <span className="text-muted text-[10px] fw-bold uppercase">School Directory & Departments</span>
                        <button
                          type="button"
                          className="btn btn-link text-slate-400 p-0 text-xs border-0"
                          onClick={() => setShowEmailDropdown(false)}
                        >
                          Close
                        </button>
                      </div>

                      {filteredAvailableEmails.length === 0 ? (
                        <div className="p-3 text-center text-muted">
                          <p className="mb-1 small">No matching email found in directory.</p>
                          {emailSearchQuery.includes("@") && (
                            <Button
                              variant="light"
                              size="sm"
                              className="text-xs border mt-1"
                              onClick={() => handleAddCustomEmail(emailSearchQuery)}
                            >
                              Add &ldquo;{emailSearchQuery}&rdquo; as recipient
                            </Button>
                          )}
                        </div>
                      ) : (
                        filteredAvailableEmails.map((item, idx) => {
                          const isSelected = notificationEmails.includes(item.email.toLowerCase());
                          return (
                            <div
                              key={idx}
                              className={`d-flex align-items-center justify-content-between p-2 rounded cursor-pointer ${isSelected ? "bg-slate-100 text-slate-500" : "hover:bg-slate-50"}`}
                              onClick={() => {
                                if (!isSelected) {
                                  handleAddNotificationEmail(item.email);
                                } else {
                                  handleRemoveNotificationEmail(item.email.toLowerCase());
                                }
                              }}
                            >
                              <div className="d-flex flex-column">
                                <span className="fw-semibold text-slate-800">{item.label}</span>
                                <span className="text-muted text-[11px]">{item.email}</span>
                              </div>
                              <Badge bg={item.is_admin ? "primary" : "secondary"} className="text-[10px] uppercase">
                                {item.category || (item.is_admin ? "Admin" : "Staff")}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Checkbox: Also notify all department members */}
                <div className="p-2.5 bg-slate-50 border rounded-2">
                  <BootstrapForm.Check
                    type="checkbox"
                    id="notify-all-dept"
                    label="Also notify all members of the target department"
                    checked={notifyAllDeptMembers}
                    onChange={(e) => setNotifyAllDeptMembers(e.target.checked)}
                    className="text-xs text-slate-800 fw-medium"
                  />
                  <small className="text-muted d-block ms-4 mt-0.5" style={{ fontSize: "11px" }}>
                    Leave unchecked so general department staff who have no business with this submission are not emailed.
                  </small>
                </div>
              </div>

              {/* 2. Submitter Confirmation Email */}
              <div>
                <div className="d-flex align-items-start gap-2.5 mb-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2">
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-slate-800 mb-0.5" style={{ fontSize: "14px" }}>
                      Submitter Confirmation Email
                    </h6>
                    <p className="text-muted small mb-0" style={{ fontSize: "12px" }}>
                      Choose whether a receipt email is automatically sent to the person who filled out the form, and pick which official email address sends it.
                    </p>
                  </div>
                </div>

                {/* Enable / Disable Confirmation Toggle */}
                <div className="p-3 bg-slate-50 rounded-2 border mb-3">
                  <BootstrapForm.Check
                    type="switch"
                    id="send-confirmation-switch"
                    label="Send confirmation email to the person who filled out the form"
                    checked={sendConfirmation}
                    onChange={(e) => setSendConfirmation(e.target.checked)}
                    className="fw-semibold text-slate-800 text-xs"
                  />
                  <small className="text-muted d-block ms-4 mt-0.5" style={{ fontSize: "11px" }}>
                    When enabled, the submitter receives an institutional confirmation email receipt containing their submitted answers.
                  </small>
                </div>

                {/* If Confirmation is Enabled: Select Sender Email */}
                {sendConfirmation && (
                  <div className="ps-2">
                    <label className="form-label text-xs fw-semibold text-slate-700 mb-1">
                      Send Confirmation From (Sender Email)
                    </label>
                    <p className="text-muted text-[11px] mb-2">
                      Select which official email address appears in the &ldquo;From&rdquo; header of the submitter&apos;s confirmation email.
                    </p>

                    <BootstrapForm.Select
                      size="sm"
                      className="text-xs mb-2"
                      value={confirmationSenderEmail}
                      onChange={(e) => setConfirmationSenderEmail(e.target.value)}
                    >
                      <option value="">Default (Department / School Default Sender)</option>
                      {availableEmails.map((item, idx) => (
                        <option key={idx} value={item.email}>
                          {item.label}
                        </option>
                      ))}
                    </BootstrapForm.Select>

                    {confirmationSenderEmail && (
                      <div className="d-flex align-items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 border rounded">
                        <span className="text-muted">Selected Sender Mailbox:</span>
                        <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-200">{confirmationSenderEmail}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Live Simulator Modal */}
        {showPreviewModal && (
          <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold small text-slate-500 uppercase tracking-wider" style={{ fontSize: "11px" }}>
                Interactive Form Preview
              </Modal.Title>
            </Modal.Header>
            <BootstrapForm onSubmit={(e) => { e.preventDefault(); alert("Form simulated successfully! All required fields validated."); }}>
              <Modal.Body 
                className="pt-2 pb-4 px-3 px-md-4"
                style={{
                  backgroundImage: backgroundImageUrl ? `url(${getFullUrl(backgroundImageUrl)})` : undefined,
                  backgroundColor: backgroundImageUrl ? "#0f172a" : "#f8fafc",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="mx-auto bg-white rounded-4 shadow-xl overflow-hidden border border-slate-200" style={{ maxWidth: "620px" }}>
                  {headerImageUrl && (
                    <div style={{ height: "140px", backgroundImage: `url(${getFullUrl(headerImageUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  )}
                  <div className="p-4 border-bottom border-slate-100">
                    <h3 className="fw-bold text-slate-900 mb-2" style={{ fontSize: "22px" }}>{formName}</h3>
                    {formDesc && (
                      <p className="text-slate-600 mb-3" style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{formDesc}</p>
                    )}
                    <div className="text-slate-400 mt-2" style={{ fontSize: "12px" }}>
                      When you submit this form, it will not automatically collect your details like name and email address unless you provide it yourself.
                    </div>
                    <div className="text-danger fw-semibold mt-1" style={{ fontSize: "12px" }}>* Required</div>
                  </div>

                  <div className="p-4 d-flex flex-column gap-3">
                    {questions.map((q, idx) => {
                      if (!evaluateCondition(q, previewAnswers)) return null;
                      return (
                        <div key={q.id} className="p-3 rounded-3 bg-white border border-slate-200 shadow-2xs">
                          <BootstrapForm.Group className="mb-0">
                            <BootstrapForm.Label className="fw-bold text-slate-800 small mb-2 d-flex align-items-baseline">
                              <span>{idx + 1}. {q.label}</span>
                              {q.required && <span className="text-danger ms-1 fw-bold">*</span>}
                            </BootstrapForm.Label>
                            {q.type === "textarea" ? (
                              <BootstrapForm.Control as="textarea" rows={3} placeholder="Enter your answer" required={q.required} className="rounded-2 text-sm bg-slate-50/50" />
                            ) : q.type === "date" ? (
                              <BootstrapForm.Control type="date" required={q.required} className="rounded-2 text-sm bg-slate-50/50" />
                            ) : q.type === "number" ? (
                              <BootstrapForm.Control type="number" placeholder="Enter your answer" required={q.required} className="rounded-2 text-sm bg-slate-50/50" />
                            ) : q.type === "file" ? (
                              <BootstrapForm.Control type="file" required={q.required} className="rounded-2 text-sm" />
                            ) : q.type === "signature" ? (
                              <div className="border border-slate-200 rounded p-3 text-center cursor-pointer bg-slate-50 hover:bg-slate-100" style={{ borderStyle: "dashed" }}>
                                <span className="text-slate-400 italic small">Sign Here (Simulation Pad)</span>
                              </div>
                            ) : (
                              <BootstrapForm.Control type="text" placeholder="Enter your answer" required={q.required} className="rounded-2 text-sm bg-slate-50/50" />
                            )}
                          </BootstrapForm.Group>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="border-top-0">
                <Button variant="light" size="sm" onClick={() => setShowPreviewModal(false)} className="rounded-lg">Close</Button>
                <Button variant="primary" size="sm" type="submit" className="bg-slate-900 border-0 rounded-lg px-4">Submit</Button>
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
                    />
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
