import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Bell, CheckCircle2, FileText } from "lucide-react";
import {
  getAdminAssignmentDetail,
  getPayrollDocumentFileUrl,
  remindDocumentAssignment
} from "../../../services/payrollService";
import PdfFieldCanvas from "./PdfFieldCanvas";
import "../../../styles/GustoTheme.css";

const PayrollDocumentViewerPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    getAdminAssignmentDetail(assignmentId)
      .then((res) => setAssignment(res))
      .catch((err) => console.error("Failed to load artifact:", err))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const handleRemind = async () => {
    if (!assignment) return;
    setSendingReminder(true);
    try {
      const updated = await remindDocumentAssignment(assignment.id);
      setAssignment(updated);
      setToastMsg(`Reminder email sent to ${assignment.staff_name}.`);
      setTimeout(() => setToastMsg(""), 4000);
    } catch (err) {
      setToastMsg(err?.response?.data?.error || "Failed to send reminder.");
      setTimeout(() => setToastMsg(""), 4000);
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "4rem", textAlign: "center", color: "#6b7280" }}>Loading document...</div>;
  }

  if (!assignment) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ color: "#6b7280" }}>Document record not found.</p>
        <button
          type="button"
          onClick={() => navigate("/admin/payroll/documents")}
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
    <div style={{ maxWidth: "1080px", margin: "0 auto", paddingBottom: "4rem" }}>
      {toastMsg && (
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
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate(-1)}
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
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            {assignment.document_title}
          </h1>
          <div style={{ fontSize: "0.88rem", color: "#4b5563", marginTop: "0.35rem" }}>
            Recipient: <strong>{assignment.staff_name}</strong>
            {assignment.staff_work_email && ` • Work: ${assignment.staff_work_email}`}
            {assignment.staff_personal_email && ` • Personal: ${assignment.staff_personal_email}`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              backgroundColor: isLocked ? "#dcfce7" : "#fef3c7",
              color: isLocked ? "#166534" : "#92400e",
              padding: "0.3rem 0.75rem",
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

          {!isLocked && (
            <button
              type="button"
              disabled={sendingReminder}
              onClick={handleRemind}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.45rem 0.95rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <Bell size={14} />
              {sendingReminder ? "Sending..." : "Send reminder"}
            </button>
          )}
        </div>
      </div>

      {isLocked && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            borderRadius: "8px",
            padding: "0.85rem 1.15rem",
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
            <Lock size={16} />
            <span>Signed &amp; Locked — This document cannot be edited by staff or administrators.</span>
          </div>
          <div>
            Signed by <strong>{assignment.signature_name}</strong>
            {assignment.signed_at && ` on ${new Date(assignment.signed_at).toLocaleString()}`}
          </div>
        </div>
      )}

      {fileUrl ? (
        <PdfFieldCanvas
          fileUrl={fileUrl}
          mode="sign"
          fields={assignment.fillable_fields || []}
          adminValues={assignment.admin_field_values || {}}
          filledData={assignment.filled_data || {}}
          autoContext={{
            companyName: "Cooper Galvis Enterprises LLC",
            signingDate: assignment.signed_at ? new Date(assignment.signed_at).toLocaleDateString("en-US") : "",
            dob: assignment.staff_birthday || "",
            startDate: assignment.staff_start_date || "",
            fullName: assignment.staff_name || ""
          }}
          locked={true}
        />
      ) : (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            <FileText size={18} color="#2563eb" />
            <span>Document Content</span>
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", color: "#374151" }}>
            {assignment.content_body || assignment.document_description || "No preview available."}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDocumentViewerPage;
