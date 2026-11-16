import React, { useState, useEffect } from "react";
import { FileText, CheckCircle2, PenTool } from "lucide-react";
import { Modal, Button, Form } from "react-bootstrap";
import { getMyDocuments, signMyDocument } from "../../services/payrollService";
import { useAuth } from "../../context/AuthContext";
import "../../styles/GustoTheme.css";

const GustoDocumentsPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [signatureName, setSignatureName] = useState(user?.name || "");
  const [filledData, setFilledData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await getMyDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const openDoc = (doc) => {
    setSelectedDoc(doc);
    setSignatureName(doc.signature_name || user?.name || "");
    setFilledData(doc.filled_data || {});
  };

  const handleSignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setSubmitting(true);
    try {
      await signMyDocument(selectedDoc.id, {
        signature_name: signatureName,
        filled_data: filledData
      });
      setSelectedDoc(null);
      showToast("Document signed & submitted to HR.");
      loadDocs();
    } catch (err) {
      showToast("Failed to submit document.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", paddingBottom: "4rem" }}>
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#1e3a8a",
            color: "#ffffff",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            zIndex: 9999,
            fontSize: "0.875rem",
            fontWeight: 600
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", marginBottom: "0.4rem" }}>
        Documents
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Review pay schedules, handbooks, and fill out or sign required onboarding &amp; payment authorization forms.
      </p>

      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading your documents...</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#6b7280" }}>
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            No documents assigned to your profile yet.
          </div>
        ) : (
          documents.map((doc) => {
            const isDone = doc.status === "Signed" || doc.status === "Submitted" || doc.status === "Acknowledged";
            return (
              <div
                key={doc.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid #f3f4f6",
                  gap: "1rem",
                  flexWrap: "wrap"
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f766e", cursor: "pointer" }} onClick={() => openDoc(doc)}>
                    {doc.document_title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {doc.document_category} • {doc.document_description || "Employer provided document"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span
                    style={{
                      backgroundColor: isDone ? "#dcfce7" : "#fef3c7",
                      color: isDone ? "#166534" : "#92400e",
                      padding: "0.2rem 0.65rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600
                    }}
                  >
                    {doc.status}
                  </span>
                  <Button
                    size="sm"
                    variant={isDone ? "outline-secondary" : "primary"}
                    style={!isDone ? { backgroundColor: "#0f766e", border: "none" } : {}}
                    onClick={() => openDoc(doc)}
                  >
                    {isDone ? "View" : doc.is_fillable ? "Fill & Sign" : "Review & Sign"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Document Viewer + Fillable Form + E-Signature Modal */}
      <Modal show={!!selectedDoc} onHide={() => setSelectedDoc(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            {selectedDoc?.document_title}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSignSubmit}>
          <Modal.Body>
            {selectedDoc?.content_body && (
              <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", whiteSpace: "pre-wrap", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {selectedDoc.content_body}
              </div>
            )}

            {selectedDoc?.is_fillable && selectedDoc.fillable_fields?.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div className="fw-bold small mb-2">Form Fields</div>
                <div className="row g-3">
                  {selectedDoc.fillable_fields.map((field) => (
                    <div key={field.key} className="col-md-6">
                      <Form.Label className="small fw-semibold">
                        {field.label} {field.required && "*"}
                      </Form.Label>
                      {field.type === "select" ? (
                        <Form.Select
                          required={field.required}
                          value={filledData[field.key] || ""}
                          onChange={(e) => setFilledData({ ...filledData, [field.key]: e.target.value })}
                        >
                          <option value="">-- Select --</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Form.Select>
                      ) : (
                        <Form.Control
                          required={field.required}
                          value={filledData[field.key] || ""}
                          onChange={(e) => setFilledData({ ...filledData, [field.key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Form.Group>
              <Form.Label className="small fw-semibold">
                <PenTool className="w-3.5 h-3.5 inline me-1" />
                Electronic Signature (Type your full name)
              </Form.Label>
              <Form.Control
                required
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Full legal name"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setSelectedDoc(null)}>Close</Button>
            <Button type="submit" disabled={submitting} style={{ backgroundColor: "#0f766e", border: "none" }}>
              {submitting ? "Submitting..." : "Sign & Submit"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default GustoDocumentsPage;
