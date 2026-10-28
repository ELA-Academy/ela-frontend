import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Form, Button, Card, Spinner, Container, Modal, Tab, Tabs } from "react-bootstrap";
import { ClipboardCheck, AlertTriangle, FileText, Check, Trash2, Edit2 } from "lucide-react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/api";

const PublicFormFiller = () => {
  const { formId } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0); // 0 = welcome page, 1 = questions page

  // Signature modal state
  const [showSigModal, setShowSigModal] = useState(false);
  const [activeSigFieldId, setActiveSigFieldId] = useState(null);
  const [sigMode, setSigMode] = useState("draw");
  const [typedName, setTypedName] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [sigUploading, setSigUploading] = useState(false);

  const canvasRef = useRef(null);

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
    // Dynamically inject beautiful cursive font for typed signature preview
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Alex+Brush&family=Dancing+Script:wght@600&family=Great+Vibes&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const fetchFormDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const apiBase = getApiBaseUrl();
        const res = await axios.get(`${apiBase}/api/board-extensions/public/forms/${formId}`);
        setFormConfig(res.data);
        const hasWelcome = res.data?.form_structure?.some(q => q.type === "welcome");
        setCurrentStep(hasWelcome ? 0 : 1);
      } catch (err) {
        console.error("Failed to load form:", err);
        setError("This form does not exist, has been deleted, or is currently unavailable.");
      } finally {
        setLoading(false);
      }
    };

    if (formId) {
      fetchFormDetails();
    }

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [formId]);

  // Canvas drawing handlers
  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Convert signature to image and upload
  const saveSignature = async () => {
    let signatureDataUrl = "";

    if (sigMode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const buffer = new Uint32Array(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data.buffer);
      const isCanvasEmpty = !buffer.some(color => color !== 0);
      if (isCanvasEmpty) {
        alert("Please draw your signature before saving.");
        return;
      }
      signatureDataUrl = canvas.toDataURL("image/png");
    } else {
      if (!typedName.trim()) {
        alert("Please type your name before saving.");
        return;
      }

      // Generate calligraphic signature image
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f172a";
      ctx.font = "italic 46px Georgia, serif"; // Calligraphy styling
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

      signatureDataUrl = canvas.toDataURL("image/png");
    }

    const response = await fetch(signatureDataUrl);
    const blob = await response.blob();
    const file = new File([blob], `signature_${Date.now()}.png`, { type: "image/png" });

    const formData = new FormData();
    formData.append("file", file);

    setSigUploading(true);
    try {
      const apiBase = getApiBaseUrl();
      const uploadRes = await axios.post(`${apiBase}/api/board-extensions/public/forms/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setAnswers((prev) => ({
        ...prev,
        [activeSigFieldId]: uploadRes.data.file_url
      }));

      setShowSigModal(false);
      setTypedName("");
    } catch (err) {
      console.error("Signature upload failed", err);
      alert("Failed to save signature. Please try again.");
    } finally {
      setSigUploading(false);
    }
  };

  const handleOpenSignatureModal = (fieldId) => {
    setActiveSigFieldId(fieldId);
    setSigMode("draw");
    setTypedName("");
    setShowSigModal(true);
  };

  const evaluateCondition = (q, currentAnswers) => {
    if (!q.conditional) return true;
    if (!q.depends_on || q.depends_value === undefined) return true;
    const parentAnswer = currentAnswers[q.depends_on];
    return String(parentAnswer || "").toLowerCase() === String(q.depends_value).toLowerCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formConfig) return;

    setSubmitting(true);
    setError("");
    try {
      const apiBase = getApiBaseUrl();
      await axios.post(`${apiBase}/api/board-extensions/public/forms/submit/${formId}`, {
        response: answers
      });
      setSuccess(true);
    } catch (err) {
      console.error("Failed to submit form:", err);
      setError("Failed to submit your response. Please check your inputs and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const backgroundImageUrl = formConfig?.background_image_url || formConfig?.settings?.background_image_url || "";
  const headerImageUrl = formConfig?.header_image_url || formConfig?.settings?.header_image_url || "";

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-slate-50">
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-2" />
          <p className="text-muted small">Loading form layout...</p>
        </div>
      </div>
    );
  }

  if (error && !formConfig) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-slate-50">
        <Container style={{ maxWidth: "500px" }}>
          <Card className="border-0 shadow-lg p-4 rounded-4 text-center">
            <Card.Body>
              <div className="d-inline-flex p-3 bg-danger-subtle text-danger rounded-circle mb-3">
                <AlertTriangle size={32} />
              </div>
              <h4 className="fw-bold text-slate-800 mb-2">Form Unavailable</h4>
              <p className="text-muted small mb-0">{error}</p>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  if (success) {
    const thankyou = formConfig?.form_structure?.find(q => q.type === "thankyou");
    const thankyouTitle = thankyou?.label || "Submission Successful!";
    const thankyouDesc = thankyou?.description || "Thank you for your submission. Your request has been registered.";

    return (
      <div 
        className="d-flex align-items-center justify-content-center min-vh-100 py-5 position-relative"
        style={{
          backgroundImage: backgroundImageUrl ? `url(${getFullUrl(backgroundImageUrl)})` : undefined,
          backgroundColor: backgroundImageUrl ? "#0f172a" : "#f8fafc",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        {backgroundImageUrl && (
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: "rgba(15, 23, 42, 0.25)", zIndex: 0 }} />
        )}
        <Container style={{ maxWidth: "520px", position: "relative", zIndex: 1 }}>
          <Card className="border-0 shadow-2xl p-4 rounded-4 text-center bg-white">
            <Card.Body>
              <div className="d-inline-flex p-3 bg-success-subtle text-success rounded-circle mb-3">
                <ClipboardCheck size={36} />
              </div>
              <h3 className="fw-bold text-slate-900 mb-2">{thankyouTitle}</h3>
              <p className="text-slate-600 small mb-4" style={{ lineHeight: "1.6" }}>{thankyouDesc}</p>
              <Button 
                variant="primary" 
                onClick={() => {
                  setAnswers({});
                  setSuccess(false);
                  const hasWelcome = formConfig?.form_structure?.some(q => q.type === "welcome");
                  setCurrentStep(hasWelcome ? 0 : 1);
                }}
                className="w-100 py-2.5 fw-bold rounded-3 border-0"
                style={{ backgroundColor: "#0f172a" }}
              >
                Submit another response
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  const welcomePage = formConfig?.form_structure?.find(q => q.type === "welcome");
  const formQuestions = formConfig?.form_structure?.filter(q => q.type !== "welcome" && q.type !== "thankyou" && q.type !== "settings") || [];

  return (
    <div 
      className="min-vh-100 py-4 py-md-5 position-relative"
      style={{
        backgroundImage: backgroundImageUrl ? `url(${getFullUrl(backgroundImageUrl)})` : undefined,
        backgroundColor: backgroundImageUrl ? "#0f172a" : "#f1f5f9",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Subtle overlay when background image is present to maintain contrast and legibility */}
      {backgroundImageUrl && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100" 
          style={{ backgroundColor: "rgba(15, 23, 42, 0.2)", pointerEvents: "none", zIndex: 0 }} 
        />
      )}

      <Container style={{ maxWidth: "760px", position: "relative", zIndex: 1 }}>
        
        {/* Cover image banner if configured */}
        {headerImageUrl && (
          <div 
            className="w-100 shadow-md border border-slate-200/80" 
            style={{ 
              height: "180px", 
              backgroundImage: `url(${getFullUrl(headerImageUrl)})`, 
              backgroundSize: "cover", 
              backgroundPosition: "center",
              borderRadius: "16px 16px 0 0",
              borderBottom: "none"
            }}
          />
        )}

        <Card 
          className="border-slate-200/80 shadow-2xl p-0 overflow-hidden bg-white"
          style={{ 
            borderRadius: headerImageUrl ? "0 0 16px 16px" : "16px",
            border: "1px solid #e2e8f0",
            borderTop: headerImageUrl ? "none" : "1px solid #e2e8f0"
          }}
        >
          <Card.Body className="p-4 p-md-5">
            {currentStep === 0 && welcomePage ? (
              <div className="text-center py-4">
                <h2 className="fw-bold text-slate-900 mb-3" style={{ fontSize: "24px" }}>
                  {welcomePage.label || formConfig.name}
                </h2>
                <p className="text-slate-600 mb-4" style={{ fontSize: "14.5px", lineHeight: "1.65" }}>
                  {welcomePage.description || formConfig.description || "Please click the button below to start filling out the form."}
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => setCurrentStep(1)}
                  className="w-100 py-2.5 fw-bold rounded-lg shadow-sm border-0 transition-all"
                  style={{ 
                    backgroundColor: "#0f172a", 
                    color: "#ffffff" 
                  }}
                >
                  Start Form
                </Button>
              </div>
            ) : (
              <>
                {/* Clean MS Forms Header Section */}
                <div className="mb-4 pb-3 border-bottom border-slate-100">
                  <h1 className="fw-bold text-slate-900 mb-2" style={{ fontSize: "24px", lineHeight: "1.3" }}>
                    {formConfig.name}
                  </h1>
                  
                  {formConfig.description && (
                    <div className="text-slate-600 mt-2 mb-3" style={{ fontSize: "14px", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>
                      {formConfig.description}
                    </div>
                  )}

                  <div className="text-slate-400 mt-2" style={{ fontSize: "12.5px", lineHeight: "1.5" }}>
                    When you submit this form, it will not automatically collect your details like name and email address unless you provide it yourself.
                  </div>

                  <div className="text-danger fw-semibold mt-2.5" style={{ fontSize: "12.5px" }}>
                    * Required
                  </div>
                </div>

                <Form onSubmit={handleSubmit}>
                  {formQuestions.map((q, idx) => {
                    if (!evaluateCondition(q, answers)) return null;
                    const signatureImage = answers[q.id];

                    return (
                      <div key={q.id} className="mb-4 p-3.5 p-md-4 rounded-3 bg-white border border-slate-200/90 shadow-2xs">
                        <Form.Group>
                          <Form.Label className="fw-bold text-slate-800 small mb-2 d-flex align-items-baseline">
                            <span style={{ fontSize: "14px" }}>{idx + 1}. {q.label}</span>
                            {q.required && <span className="text-danger ms-1 fw-bold">*</span>}
                          </Form.Label>
                          
                          {q.type === "textarea" ? (
                            <Form.Control
                              as="textarea"
                              rows={4}
                              placeholder="Enter your answer"
                              value={answers[q.id] || ""}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              required={q.required}
                              className="border-slate-300 rounded-2 py-2.5 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              style={{ fontSize: "14px", backgroundColor: "#fafbfc" }}
                            />
                          ) : q.type === "email" ? (
                            <Form.Control
                              type="email"
                              placeholder="Enter your answer"
                              value={answers[q.id] || ""}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              required={q.required}
                              className="border-slate-300 rounded-2 py-2.5 px-3 focus:border-indigo-500"
                              style={{ fontSize: "14px", backgroundColor: "#fafbfc" }}
                            />
                          ) : q.type === "date" ? (
                            <Form.Control
                              type="date"
                              value={answers[q.id] || ""}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              required={q.required}
                              className="border-slate-300 rounded-2 py-2.5 px-3 focus:border-indigo-500"
                              style={{ fontSize: "14px", backgroundColor: "#fafbfc" }}
                            />
                          ) : q.type === "number" ? (
                            <Form.Control
                              type="number"
                              placeholder="Enter your answer"
                              value={answers[q.id] || ""}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              required={q.required}
                              className="border-slate-300 rounded-2 py-2.5 px-3 focus:border-indigo-500"
                              style={{ fontSize: "14px", backgroundColor: "#fafbfc" }}
                            />
                          ) : q.type === "file" ? (
                            <div>
                              <Form.Control
                                type="file"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  try {
                                    const apiBase = getApiBaseUrl();
                                    const uploadRes = await axios.post(`${apiBase}/api/board-extensions/public/forms/upload`, formData, {
                                      headers: { "Content-Type": "multipart/form-data" }
                                    });
                                    handleInputChange(q.id, {
                                      filename: uploadRes.data.filename,
                                      file_url: uploadRes.data.file_url
                                    });
                                  } catch (err) {
                                    console.error("File upload failed", err);
                                    alert("Failed to upload file. Please try again.");
                                  }
                                }}
                                required={q.required && !answers[q.id]}
                                className="border-slate-300 rounded-2 py-2 px-3 focus:border-indigo-500"
                                style={{ fontSize: "13px" }}
                              />
                              {answers[q.id] && (
                                <div className="text-success small mt-1.5 fw-medium">
                                  ✓ {answers[q.id].filename} uploaded successfully
                                </div>
                              )}
                            </div>
                          ) : q.type === "signature" ? (
                            <div>
                              {signatureImage ? (
                                <div className="position-relative border border-slate-200 rounded-lg p-3 bg-white d-flex align-items-center justify-content-center shadow-sm">
                                  <img src={getFullUrl(signatureImage)} alt="Signature" style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain" }} />
                                  <div className="position-absolute top-0 end-0 p-2">
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm" 
                                      className="p-1 px-2 d-flex align-items-center gap-1 border-0" 
                                      onClick={() => handleInputChange(q.id, null)}
                                    >
                                      <Trash2 size={13} /> Reset
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => handleOpenSignatureModal(q.id)}
                                  className="border rounded-lg p-4 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all shadow-sm border-dashed"
                                  style={{ 
                                    borderStyle: "dashed", 
                                    borderColor: "#cbd5e1",
                                    minHeight: "80px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                >
                                  <span 
                                    className="text-slate-400 italic" 
                                    style={{ 
                                      fontFamily: "'Caveat', cursive", 
                                      fontSize: "24px" 
                                    }}
                                  >
                                    Sign here
                                  </span>
                                </div>
                              )}
                              <input
                                type="hidden"
                                value={signatureImage || ""}
                                required={q.required}
                              />
                            </div>
                          ) : (
                            <Form.Control
                              type="text"
                              placeholder="Enter your answer"
                              value={answers[q.id] || ""}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              required={q.required}
                              className="border-slate-300 rounded-2 py-2.5 px-3 focus:border-indigo-500"
                              style={{ fontSize: "14px", backgroundColor: "#fafbfc" }}
                            />
                          )}
                        </Form.Group>
                      </div>
                    );
                  })}

                  {error && (
                    <div className="alert alert-danger text-xs py-2 px-3 rounded-3 mb-4">
                      {error}
                    </div>
                  )}

                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={submitting}
                    className="w-100 py-3 fw-bold rounded-3 mt-4 shadow-sm border-0 transition-all"
                    style={{ 
                      backgroundColor: "#0f172a", 
                      color: "#ffffff",
                      fontSize: "15px"
                    }}
                  >
                    {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                    Submit
                  </Button>
                </Form>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Signature Modal */}
      <Modal show={showSigModal} onHide={() => setShowSigModal(false)} size="md" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: "16px" }}>Sign Form Document</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Tabs
            activeKey={sigMode}
            onSelect={(k) => setSigMode(k)}
            className="border-bottom px-3 pt-2"
          >
            <Tab eventKey="draw" title="Draw Signature">
              <div className="p-3">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-100 border rounded bg-slate-50 cursor-crosshair"
                  style={{ touchAction: "none", height: "180px", borderStyle: "dashed" }}
                />
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="small text-muted">Use pointer or finger to sign inside the grid.</span>
                  <Button variant="outline-secondary" size="sm" onClick={clearCanvas}>
                    Clear Pad
                  </Button>
                </div>
              </div>
            </Tab>
            <Tab eventKey="type" title="Type Signature">
              <div className="p-4">
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-slate-600">Type Your Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. John Doe"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="border rounded-lg"
                  />
                </Form.Group>

                {/* Calligraphy Cursive Preview Area */}
                <div className="border rounded bg-slate-50 p-4 text-center">
                  <div className="small text-muted mb-2 border-bottom pb-1">Calligraphy Preview</div>
                  {typedName ? (
                    <span 
                      style={{ 
                        fontFamily: "'Great Vibes', 'Alex Brush', 'Caveat', 'Dancing Script', cursive", 
                        fontSize: "46px",
                        color: "#0f172a",
                        display: "block",
                        padding: "10px 0"
                      }}
                    >
                      {typedName}
                    </span>
                  ) : (
                    <span className="text-muted small italic">Cursive preview will render here</span>
                  )}
                </div>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 px-3 pb-3">
          <Button variant="light" onClick={() => setShowSigModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveSignature} disabled={sigUploading} style={{ backgroundColor: "#0f172a", border: "none" }}>
            {sigUploading ? <Spinner size="sm" animation="border" /> : "Save Signature"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PublicFormFiller;
