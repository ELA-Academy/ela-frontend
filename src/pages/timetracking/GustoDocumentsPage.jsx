import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Lock } from "lucide-react";
import { Button } from "react-bootstrap";
import { getMyDocuments } from "../../services/payrollService";
import "../../styles/GustoTheme.css";

const GustoDocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyDocuments()
      .then((res) => setDocuments(res.documents || []))
      .catch((err) => console.error("Failed to load documents:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", paddingBottom: "4rem" }}>
      <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", marginBottom: "0.4rem" }}>
        Documents
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Review and sign your assigned ELA Academy documents. Signed documents are permanently locked.
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
            const isDone = Boolean(doc.is_locked);
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
                  <div
                    style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f766e", cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => navigate(`/time-tracking/documents/${doc.id}`)}
                  >
                    {doc.document_title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                    {doc.signed_at
                      ? `Signed on ${new Date(doc.signed_at).toLocaleDateString()}`
                      : doc.assigned_at
                      ? `Assigned ${new Date(doc.assigned_at).toLocaleDateString()}`
                      : "Employer provided document"}
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
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    {isDone && <Lock size={11} />}
                    {doc.status}
                  </span>
                  <Button
                    size="sm"
                    variant={isDone ? "outline-secondary" : "primary"}
                    style={!isDone ? { backgroundColor: "#0f766e", border: "none" } : {}}
                    onClick={() => navigate(`/time-tracking/documents/${doc.id}`)}
                  >
                    {isDone ? "View" : "Review & Sign"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GustoDocumentsPage;
