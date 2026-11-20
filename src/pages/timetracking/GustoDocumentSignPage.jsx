import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, PenTool, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import {
  getMyDocumentDetail,
  signMyDocument,
  getPayrollDocumentFileUrl
} from "../../services/payrollService";
import { useAuth } from "../../context/AuthContext";
import PdfFieldCanvas from "../../components/admin/payroll/PdfFieldCanvas";
import "../../styles/GustoTheme.css";

const GustoDocumentSignPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filledData, setFilledData] = useState({});
  const [signatureName, setSignatureName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    getMyDocumentDetail(assignmentId)
      .then((res) => {
        setAssignment(res);
        setFilledData(res.filled_data || {});
        setSignatureName(res.signature_name || user?.name || "");
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.error || "Unable to load document.");
      })
      .finally(() => setLoading(false));
  }, [assignmentId, user?.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignment || assignment.is_locked) return;
    setErrorMsg("");

    // Validate required recipient fields placed on the PDF
    const recipientFields = (assignment.fillable_fields || []).filter((f) => f.category === "recipient");
    for (const f of recipientFields) {
      if (f.required) {
        const val = filledData[f.id];
        if (!val || (typeof val === "string" && !val.trim())) {
          setErrorMsg(`Please complete the required field "${f.label}" on the document before signing.`);
          return;
        }
      }
    }

    if (assignment.requires_signature && !signatureName.trim()) {
      setErrorMsg("Please type your full legal name to sign this document.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await signMyDocument(assignment.id, {
        signature_name: signatureName.trim() || user?.name || "",
        filled_data: filledData
      });
      setAssignment(updated);
      setSuccessMsg("Document signed and permanently locked.");
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || "Failed to submit document.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "4rem", textAlign: "center", color: "#6b7280" }}>Loading document...</div>;
  }

  if (!assignment) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ color: "#b91c1c" }}>{errorMsg || "Document not found."}</p>
        <button
          type="button"
          onClick={() => navigate("/time-tracking/documents")}
          style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}
        >
          ← Back to Documents
        </button>
      </div>
    );
  }

  const isLocked = Boolean(assignment.is_locked);
  const fileUrl = assignment.has_file ? getPayrollDocumentFileUrl(assignment.document_id) : null;

  return (
    <div style={{ maxWidth: "1060px", margin: "0 auto", paddingBottom: "4rem" }}>
      <button
        type="button"
        onClick={() => navigate("/time-tracking/documents")}
        style={{
          background: "none",
          border: "none",
          color: "#2563eb",
          fontWeight: 600,
          fontSize: "0.9rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          cursor: "pointer",
          marginBottom: "1rem",
          padding: 0
        }}
      >
        <ArrowLeft size={16} /> Back to Documents
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            {assignment.document_title}
          </h1>
          <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>
            {isLocked
              ? "This document has been signed and is permanently locked."
              : "Complete all required fields directly on the document below, then sign to submit."}
          </div>
        </div>
        <span
          style={{
            backgroundColor: isLocked ? "#dcfce7" : "#fef3c7",
            color: isLocked ? "#166534" : "#92400e",
            padding: "0.3rem 0.8rem",
            borderRadius: "9999px",
            fontSize: "0.8rem",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem"
          }}
        >
          {isLocked && <Lock size={13} />}
          {assignment.status}
        </span>
      </div>

      {successMsg && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            borderRadius: "8px",
            padding: "0.85rem 1.1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 600,
            fontSize: "0.875rem"
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            borderRadius: "8px",
            padding: "0.85rem 1.1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 500,
            fontSize: "0.875rem"
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLocked && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            borderRadius: "8px",
            padding: "0.85rem 1.1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
            fontSize: "0.875rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
            <Lock size={15} />
            <span>Signed &amp; Locked — Signed documents cannot be edited.</span>
          </div>
          <div>
            Signed by <strong>{assignment.signature_name}</strong>
            {assignment.signed_at && ` on ${new Date(assignment.signed_at).toLocaleString()}`}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {fileUrl ? (
          <PdfFieldCanvas
            fileUrl={fileUrl}
            mode="sign"
            fields={assignment.fillable_fields || []}
            adminValues={assignment.admin_field_values || {}}
            filledData={filledData}
            onChangeFilledData={setFilledData}
            autoContext={{
              companyName: "Cooper Galvis Enterprises LLC",
              signingDate: assignment.signed_at
                ? new Date(assignment.signed_at).toLocaleDateString("en-US")
                : new Date().toLocaleDateString("en-US"),
              dob: assignment.staff_birthday || "",
              startDate: assignment.staff_start_date || "",
              fullName: assignment.staff_name || user?.name || ""
            }}
            locked={isLocked}
          />
        ) : (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.65rem" }}>
              <FileText size={16} color="#2563eb" />
              <span>Document Details</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", color: "#374151" }}>
              {assignment.content_body || assignment.document_description || "Review this document and sign below."}
            </div>
          </div>
        )}

        {!isLocked && (
          <div
            style={{
              marginTop: "1.5rem",
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "1.35rem 1.5rem",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "1rem"
            }}
          >
            <div style={{ flex: 1, minWidth: "260px" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: "0.88rem", color: "#111827", marginBottom: "0.4rem" }}>
                <PenTool size={14} style={{ display: "inline", marginRight: "6px" }} />
                Electronic Signature (Type your full legal name)
              </label>
              <input
                type="text"
                required
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Full legal name"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.85rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.65rem 1.6rem",
                fontSize: "0.92rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {submitting ? "Submitting..." : "Sign & Submit"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default GustoDocumentSignPage;
