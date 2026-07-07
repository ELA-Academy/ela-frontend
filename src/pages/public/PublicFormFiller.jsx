import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Form, Button, Card, Spinner, Container, Modal, Tab, Tabs } from "react-bootstrap";
import { ClipboardCheck, AlertTriangle, FileText, Check, Trash2, Edit2 } from "lucide-react";
import axios from "axios";

const PublicFormFiller = () => {
  const { formId } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Signature modal state
  const [showSigModal, setShowSigModal] = useState(false);
  const [activeSigFieldId, setActiveSigFieldId] = useState(null);
  const [sigMode, setSigMode] = useState("draw");
  const [typedName, setTypedName] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [sigUploading, setSigUploading] = useState(false);

  const canvasRef = useRef(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  // Helper to format local file uploads/signatures with full backend port
  const getFullUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }
    return `${apiBaseUrl}${path}`;
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
        const res = await axios.get(`${apiBaseUrl}/api/board-extensions/public/forms/${formId}`);
        setFormConfig(res.data);
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
      document.head.removeChild(link);
    };
  }, [formId, apiBaseUrl]);

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
      const uploadRes = await axios.post(`${apiBaseUrl}/api/board-extensions/public/forms/upload`, formData, {
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
      await axios.post(`${apiBaseUrl}/api/board-extensions/public/forms/submit/${formId}`, {
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
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-slate-50">
        <Container style={{ maxWidth: "500px" }}>
          <Card className="border-0 shadow-lg p-4 rounded-4 text-center">
            <Card.Body>
              <div className="d-inline-flex p-3 bg-success-subtle text-success rounded-circle mb-3">
                <ClipboardCheck size={32} />
              </div>
              <h4 className="fw-bold text-slate-800 mb-2">Thank you!</h4>
              <p className="text-muted small mb-4">Your response has been submitted successfully.</p>
              <Button 
                variant="primary" 
                onClick={() => {
                  setAnswers({});
                  setSuccess(false);
                }}
                className="w-100 fw-bold rounded-3"
              >
                Submit another response
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-slate-50 py-5">
      <Container style={{ maxWidth: "680px" }}>
        
        {/* Full width custom header image uploader preview */}
        {formConfig.header_image_url && (
          <div 
            className="w-100 rounded-t-lg shadow-md border-bottom-0" 
            style={{ 
              height: "200px", 
              backgroundImage: `url(${getFullUrl(formConfig.header_image_url)})`, 
              backgroundSize: "cover", 
              backgroundPosition: "center",
              borderRadius: "16px 16px 0 0",
              border: "1px solid #e2e8f0"
            }}
          ></div>
        )}

        <Card 
          className="border-slate-200 shadow-xl p-2 p-md-4"
          style={{ 
            borderRadius: formConfig.header_image_url ? "0 0 16px 16px" : "16px",
            border: "1px solid #e2e8f0",
            borderTop: formConfig.header_image_url ? "none" : "1px solid #e2e8f0"
          }}
        >
          <Card.Body>
            <div className="mb-4 pb-3 border-bottom">
              <h2 className="fw-bold text-slate-900 mb-2">{formConfig.name}</h2>
              {formConfig.description && (
                <p className="text-muted small mb-0">{formConfig.description}</p>
              )}
            </div>

            <Form onSubmit={handleSubmit}>
              {formConfig.form_structure?.map((q) => {
                if (!evaluateCondition(q, answers)) return null;
                const signatureImage = answers[q.id];

                return (
                  <Form.Group key={q.id} className="mb-4">
                    <Form.Label className="fw-semibold text-slate-700 small mb-2 d-flex align-items-center justify-content-between">
                      <span>{q.label} {q.required && <span className="text-danger">*</span>}</span>
                    </Form.Label>
                    
                    {q.type === "textarea" ? (
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Write your response here..."
                        value={answers[q.id] || ""}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        required={q.required}
                        className="border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    ) : q.type === "date" ? (
                      <Form.Control
                        type="date"
                        value={answers[q.id] || ""}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        required={q.required}
                        className="border-slate-200 rounded-lg focus:border-indigo-500"
                      />
                    ) : q.type === "number" ? (
                      <Form.Control
                        type="number"
                        placeholder="Enter a numeric value..."
                        value={answers[q.id] || ""}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        required={q.required}
                        className="border-slate-200 rounded-lg focus:border-indigo-500"
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
                              const uploadRes = await axios.post(`${apiBaseUrl}/api/board-extensions/public/forms/upload`, formData, {
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
                          className="border-slate-200 rounded-lg focus:border-indigo-500"
                        />
                        {answers[q.id] && (
                          <div className="text-success small mt-1">
                            ✓ {answers[q.id].filename} uploaded
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
                        placeholder="Type your answer..."
                        value={answers[q.id] || ""}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        required={q.required}
                        className="border-slate-200 rounded-lg focus:border-indigo-500"
                      />
                    )}
                  </Form.Group>
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
                className="w-100 py-2.5 fw-bold rounded-lg mt-3 shadow-md border-0 transition-all"
                style={{ 
                  backgroundColor: "#4f46e5", 
                  color: "#ffffff" 
                }}
              >
                {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Submit Response
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>

      {/* Signature Modal */}
      <Modal show={showSigModal} onHide={() => setShowSigModal(false)} size="md" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-slate-800">Sign Form Document</Modal.Title>
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
          <Button variant="primary" onClick={saveSignature} disabled={sigUploading} style={{ backgroundColor: "#4f46e5", border: "none" }}>
            {sigUploading ? <Spinner size="sm" animation="border" /> : "Save Signature"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PublicFormFiller;
