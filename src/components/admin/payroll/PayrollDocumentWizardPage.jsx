import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Upload,
  FileText,
  X,
  CheckSquare,
  PenTool,
  Type,
  User,
  Calendar,
  Building2,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  uploadPayrollDocumentPdf,
  createAdminDocument,
  updateAdminDocument,
  getAdminDocumentDetail,
  getPayrollDocumentFileUrl
} from "../../../services/payrollService";
import { getAllStaff } from "../../../services/staffService";
import { getAllDepartments } from "../../../services/departmentService";
import PdfFieldCanvas from "./PdfFieldCanvas";
import "../../../styles/GustoTheme.css";

const REQUESTED_FIELD_PALETTE = [
  { type: "checkbox", label: "Checkbox", category: "recipient", required: false, icon: CheckSquare },
  { type: "initials", label: "Initials", category: "recipient", required: true, icon: PenTool },
  { type: "text_optional", label: "Text (Optional)", category: "recipient", required: false, icon: Type },
  { type: "signature", label: "Signature", category: "recipient", required: true, icon: PenTool },
  { type: "text", label: "Text", category: "recipient", required: true, icon: Type },
  { type: "full_name", label: "Full name", category: "recipient", required: true, icon: User }
];

const ADMIN_FIELD_PALETTE = [
  { type: "admin_full_name", label: "Admin full name", category: "admin", required: false, icon: User },
  { type: "admin_signature", label: "Admin signature", category: "admin", required: false, icon: PenTool },
  { type: "admin_title", label: "Admin title", category: "admin", required: false, icon: Type }
];

const AUTO_FIELD_PALETTE = [
  { type: "company_name", label: "Company name", category: "auto", required: false, icon: Building2 },
  { type: "signing_date", label: "Signing date", category: "auto", required: false, icon: Calendar },
  { type: "dob", label: "Date of birth", category: "auto", required: false, icon: Calendar },
  { type: "start_date", label: "Start date", category: "auto", required: false, icon: Calendar },
  { type: "recipient_full_name", label: "Recipient full name", category: "auto", required: false, icon: User }
];

const HIRE_TYPE_OPTIONS = [
  { id: "Employee", label: "Employees" },
  { id: "Contractor", label: "Contractors" },
  { id: "us", label: "US-based hires" },
  { id: "non_us", label: "International hires" }
];

const STEP_LABELS = [
  "Select file",
  "Customize",
  "Review",
  "Send document"
];

const PayrollDocumentWizardPage = () => {
  const navigate = useNavigate();
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(docId);
  const initialStatusParam = searchParams.get("status") === "draft" ? "draft" : "active";
  const initialStepParam = Number(searchParams.get("step") || 1);

  const fileInputRef = useRef(null);
  const [step, setStep] = useState(initialStepParam >= 1 && initialStepParam <= 4 ? initialStepParam : 1);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // Document State
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [localFile, setLocalFile] = useState(null);
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [docStatus, setDocStatus] = useState(initialStatusParam);
  const [fields, setFields] = useState([]);
  const [adminValues, setAdminValues] = useState({});

  // Step 4 Send Settings State
  const [documentScope, setDocumentScope] = useState("team"); // "team" | "individual"
  const [futureHiresEnabled, setFutureHiresEnabled] = useState(false);
  const [futureHiresMode, setFutureHiresMode] = useState("all"); // "all" | "specific"
  const [selectedHireTypes, setSelectedHireTypes] = useState([]);
  const [selectedFutureDeptIds, setSelectedFutureDeptIds] = useState([]);
  const [futureSearch, setFutureSearch] = useState("");

  const [currentMembersEnabled, setCurrentMembersEnabled] = useState(false);
  const [currentMembersMode, setCurrentMembersMode] = useState("all"); // "all" | "specific"
  const [selectedCurrentDeptIds, setSelectedCurrentDeptIds] = useState([]);
  const [selectedCurrentStaffIds, setSelectedCurrentStaffIds] = useState([]);
  const [currentSearch, setCurrentSearch] = useState("");

  const [individualStaffId, setIndividualStaffId] = useState("");
  const [individualSearch, setIndividualSearch] = useState("");

  // Reference data
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    Promise.all([getAllStaff(), getAllDepartments().catch(() => [])])
      .then(([sRes, dRes]) => {
        setStaffList(Array.isArray(sRes) ? sRes : sRes.staff || []);
        setDepartments(Array.isArray(dRes) ? dRes : dRes.departments || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    setLoading(true);
    getAdminDocumentDetail(docId)
      .then((doc) => {
        setTitle(doc.title || "");
        setFileName(doc.file_name || "");
        setFilePath(doc.file_path || "");
        setRequiresSignature(Boolean(doc.requires_signature));
        setDocStatus(doc.status || "draft");
        setFields(Array.isArray(doc.fillable_fields) ? doc.fillable_fields : []);
        setAdminValues(doc.admin_field_values || {});
        setDocumentScope(doc.document_scope || "team");
        setIsLocked(Boolean(doc.is_locked));

        if (doc.future_hires_rule && doc.future_hires_rule !== "none") {
          setFutureHiresEnabled(true);
          setFutureHiresMode(doc.future_hires_rule === "all" ? "all" : "specific");
          setSelectedHireTypes(doc.target_hire_types || []);
          setSelectedFutureDeptIds(doc.target_department_ids || []);
        }
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.error || "Failed to load document.");
      })
      .finally(() => setLoading(false));
  }, [docId, isEditing]);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setErrorMsg("");
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("File must be a .pdf document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File must be less than 10MB.");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadPayrollDocumentPdf(file);
      setLocalFile(file);
      setFileName(res.file_name || file.name);
      setFilePath(res.file_path);
      if (!title.trim()) {
        setTitle(file.name.replace(/\.pdf$/i, ""));
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || "Failed to upload PDF.");
    } finally {
      setUploading(false);
    }
  };

  const buildPayload = (targetStatus) => {
    const futureRule =
      documentScope === "team" && futureHiresEnabled
        ? futureHiresMode === "all"
          ? "all"
          : "specific"
        : "none";

    let assignMode = "none";
    if (targetStatus === "active") {
      if (documentScope === "individual" && individualStaffId) {
        assignMode = "individual";
      } else if (documentScope === "team" && currentMembersEnabled) {
        assignMode = currentMembersMode === "all" ? "all_current" : "specific_current";
      }
    }

    return {
      title: title.trim(),
      file_name: fileName,
      file_path: filePath,
      status: targetStatus,
      doc_type: "shared",
      requires_signature: requiresSignature,
      is_fillable: fields.some((f) => f.category === "recipient"),
      fillable_fields: fields,
      admin_field_values: adminValues,
      document_scope: documentScope,
      future_hires_rule: futureRule,
      target_hire_types: selectedHireTypes,
      target_department_ids: selectedFutureDeptIds,
      assign_mode: assignMode,
      current_department_ids: selectedCurrentDeptIds,
      staff_ids: selectedCurrentStaffIds,
      individual_staff_id: individualStaffId ? Number(individualStaffId) : null,
      send_now: targetStatus === "active"
    };
  };

  const handleSave = async (targetStatus) => {
    setErrorMsg("");
    if (!title.trim()) {
      setErrorMsg("Please enter a document name.");
      setStep(1);
      return;
    }
    if (!filePath && !localFile) {
      setErrorMsg("Please upload a PDF file first.");
      setStep(1);
      return;
    }
    if (targetStatus === "active" && documentScope === "individual" && !individualStaffId) {
      setErrorMsg("Please select a team member for this individual document.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(targetStatus);
      if (isEditing) {
        await updateAdminDocument(docId, payload);
      } else {
        await createAdminDocument(payload);
      }
      navigate(`/admin/payroll/documents?section=shared&tab=${targetStatus}`);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || "Failed to save document.");
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (list, setList, val) => {
    if (list.includes(val)) setList(list.filter((x) => x !== val));
    else setList([...list, val]);
  };

  if (loading) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "#6b7280" }}>
        Loading document editor...
      </div>
    );
  }

  const remoteFileUrl = isEditing && filePath ? getPayrollDocumentFileUrl(docId) : null;
  const progressPct = (step / 4) * 100;

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Header + 4-step Progress Bar (Gusto Images 2, 3, 4, 5) */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>
          {isEditing ? "Edit document" : "Add document"}
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem", fontSize: "0.85rem", color: "#4b5563" }}>
          <span style={{ fontWeight: 600 }}>{STEP_LABELS[step - 1]}</span>
          <span style={{ fontWeight: 600 }}>Step {step} of 4</span>
        </div>
        <div style={{ width: "100%", height: "6px", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              backgroundColor: "#2563eb",
              transition: "width 0.25s ease"
            }}
          />
        </div>
      </div>

      {isLocked && (
        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #fde68a",
            color: "#92400e",
            borderRadius: "8px",
            padding: "0.9rem 1.15rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.875rem",
            fontWeight: 600
          }}
        >
          <Lock size={16} />
          <span>This document has signed records and is locked from editing. You can still review it or update recipients.</span>
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
            fontSize: "0.875rem",
            fontWeight: 500
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ==================== STEP 1: SELECT FILE (Image 3) ==================== */}
      {step === 1 && (
        <div style={{ maxWidth: "620px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>
            Select file
          </h2>

          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827", marginBottom: "0.2rem" }}>
              Upload
            </div>
            <div style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "0.75rem" }}>
              File must be .pdf and less than 10MB
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (isLocked) return;
                const f = e.dataTransfer.files?.[0];
                if (f) handleFileSelect(f);
              }}
              style={{
                border: "1.5px dashed #cbd5e1",
                borderRadius: "8px",
                padding: "2rem 1.5rem",
                textAlign: "center",
                backgroundColor: "#fafafa"
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                disabled={isLocked || uploading}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                style={{ display: "none" }}
              />
              <button
                type="button"
                disabled={isLocked || uploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "0.5rem 1.1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#111827",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem"
                }}
              >
                <Upload size={15} />
                {uploading ? "Uploading PDF..." : "+ Upload files"}
              </button>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.5rem" }}>
                or drop file
              </div>
            </div>

            {fileName && (
              <div
                style={{
                  marginTop: "0.85rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>
                  <FileText size={16} color="#2563eb" />
                  <span>{fileName}</span>
                </div>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setFileName("");
                      setFilePath("");
                      setLocalFile(null);
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.85rem" }}>
              Document details
            </h3>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", color: "#111827", marginBottom: "0.2rem" }}>
                Name
              </label>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.4rem" }}>
                Recipients will see this name
              </div>
              <input
                type="text"
                value={title}
                disabled={isLocked}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ELA Academy Employee Handbook"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827", marginBottom: "0.45rem" }}>
                Recipient action
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.875rem", color: "#374151", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={requiresSignature}
                  disabled={isLocked}
                  onChange={(e) => setRequiresSignature(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
                />
                <span>Recipient must fill out or sign this document</span>
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => {
                setErrorMsg("");
                if (!filePath && !localFile) {
                  setErrorMsg("Please upload a PDF file to continue.");
                  return;
                }
                if (!title.trim()) {
                  setErrorMsg("Please enter a document name.");
                  return;
                }
                setStep(2);
              }}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.6rem 1.35rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/payroll/documents?section=shared")}
              style={{
                backgroundColor: "#ffffff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "0.6rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 2: CUSTOMIZE (Images 4 & 7) ==================== */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
            Customize &ldquo;{title}&rdquo;
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.25rem" }}>
            Drag and drop the fields you want into the document. All fields other than the checkbox and text (optional) will be required.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: "1.25rem", alignItems: "start" }}>
            <PdfFieldCanvas
              fileUrl={remoteFileUrl}
              localFile={localFile}
              mode={isLocked ? "preview" : "edit"}
              fields={fields}
              onChangeFields={setFields}
              adminValues={adminValues}
              onChangeAdminValues={setAdminValues}
            />

            {/* Right Sidebar Field Palette (Images 4 & 7) */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "1rem",
                maxHeight: "76vh",
                overflowY: "auto"
              }}
            >
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>Requested fields</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.65rem" }}>
                  Filled by the recipient
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {REQUESTED_FIELD_PALETTE.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable={!isLocked}
                        onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(item))}
                        style={{
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "0.5rem 0.7rem",
                          fontSize: "0.84rem",
                          fontWeight: 500,
                          color: "#111827",
                          backgroundColor: "#ffffff",
                          cursor: isLocked ? "not-allowed" : "grab",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        <Icon size={14} color="#2563eb" />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827", marginBottom: "0.55rem" }}>
                  Admin fields
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {ADMIN_FIELD_PALETTE.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable={!isLocked}
                        onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(item))}
                        style={{
                          border: "1px solid #bfdbfe",
                          borderRadius: "6px",
                          padding: "0.5rem 0.7rem",
                          fontSize: "0.84rem",
                          fontWeight: 500,
                          color: "#1e3a8a",
                          backgroundColor: "#eff6ff",
                          cursor: isLocked ? "not-allowed" : "grab",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        <Icon size={14} color="#2563eb" />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>Automatic fields</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.65rem" }}>
                  Autofilled based on existing information
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {AUTO_FIELD_PALETTE.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable={!isLocked}
                        onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(item))}
                        style={{
                          border: "1px solid #ddd6fe",
                          borderRadius: "6px",
                          padding: "0.5rem 0.7rem",
                          fontSize: "0.84rem",
                          fontWeight: 500,
                          color: "#5b21b6",
                          backgroundColor: "#f5f3ff",
                          cursor: isLocked ? "not-allowed" : "grab",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        <Icon size={14} color="#7c3aed" />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                backgroundColor: "#ffffff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "0.6rem 1.35rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.6rem 1.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Save &amp; continue
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 3: REVIEW (Image 5) ==================== */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
            Review &ldquo;{title}&rdquo;
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.25rem" }}>
            Review your mapped document. This is how the final document will appear. Text in [brackets] are what the recipient fills. Text with an asterisk* is autofilled.
          </p>

          <PdfFieldCanvas
            fileUrl={remoteFileUrl}
            localFile={localFile}
            mode="preview"
            fields={fields}
            adminValues={adminValues}
          />

          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() => setStep(4)}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.6rem 1.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                backgroundColor: "#ffffff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "0.6rem 1.35rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 4: SEND DOCUMENT (Images 2 & 6) ==================== */}
      {step === 4 && (
        <div style={{ maxWidth: "680px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>
            Send &ldquo;{title}&rdquo;
          </h2>

          {/* What kind of document is this? */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", marginBottom: "0.2rem" }}>
              What kind of document is this?
            </div>
            <div style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "0.85rem" }}>
              Select how you plan to use this document. You cannot change this selection later.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="documentScope"
                  checked={documentScope === "team"}
                  onChange={() => setDocumentScope("team")}
                  style={{ marginTop: "3px", accentColor: "#2563eb" }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#111827" }}>Team document</div>
                  <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>A shared document for multiple recipients</div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="documentScope"
                  checked={documentScope === "individual"}
                  onChange={() => setDocumentScope("individual")}
                  style={{ marginTop: "3px", accentColor: "#2563eb" }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#111827" }}>Individual document</div>
                  <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>A customized document for a single recipient</div>
                </div>
              </label>
            </div>
          </div>

          {/* TEAM DOCUMENT RECIPIENTS */}
          {documentScope === "team" && (
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", marginBottom: "0.2rem" }}>
                Who should receive this document?
              </div>
              <div style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "1rem" }}>
                You can always customize an individual&apos;s onboarding documents when adding them to ELA Payroll.
              </div>

              {/* Future hires checkbox (Image 6) */}
              <div style={{ marginBottom: "1.15rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 600, fontSize: "0.92rem", color: "#111827", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={futureHiresEnabled}
                    onChange={(e) => setFutureHiresEnabled(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
                  />
                  <span>Future hires</span>
                </label>

                {futureHiresEnabled && (
                  <div style={{ marginLeft: "1.6rem", marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.88rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="futureHiresMode"
                        checked={futureHiresMode === "all"}
                        onChange={() => setFutureHiresMode("all")}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>All future hires</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.88rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="futureHiresMode"
                        checked={futureHiresMode === "specific"}
                        onChange={() => setFutureHiresMode("specific")}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>Specific types of hires</span>
                    </label>

                    {futureHiresMode === "specific" && (
                      <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.75rem", backgroundColor: "#ffffff" }}>
                        <div style={{ position: "relative", marginBottom: "0.6rem" }}>
                          <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "10px" }} />
                          <input
                            type="text"
                            placeholder="Search for hire types or departments..."
                            value={futureSearch}
                            onChange={(e) => setFutureSearch(e.target.value)}
                            style={{ width: "100%", padding: "0.4rem 0.65rem 0.4rem 2rem", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.84rem" }}
                          />
                        </div>
                        <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginTop: "0.2rem" }}>
                            Worker Types
                          </div>
                          {HIRE_TYPE_OPTIONS.filter((o) => o.label.toLowerCase().includes(futureSearch.toLowerCase())).map((opt) => (
                            <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={selectedHireTypes.includes(opt.id)}
                                onChange={() => toggleItem(selectedHireTypes, setSelectedHireTypes, opt.id)}
                                style={{ accentColor: "#2563eb" }}
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginTop: "0.5rem" }}>
                            Departments
                          </div>
                          {departments
                            .filter((d) => (d.name || "").toLowerCase().includes(futureSearch.toLowerCase()))
                            .map((dept) => (
                              <label key={dept.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={selectedFutureDeptIds.includes(dept.id)}
                                  onChange={() => toggleItem(selectedFutureDeptIds, setSelectedFutureDeptIds, dept.id)}
                                  style={{ accentColor: "#2563eb" }}
                                />
                                <span>{dept.name}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current team members checkbox */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 600, fontSize: "0.92rem", color: "#111827", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={currentMembersEnabled}
                    onChange={(e) => setCurrentMembersEnabled(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
                  />
                  <span>Current team members</span>
                </label>

                {currentMembersEnabled && (
                  <div style={{ marginLeft: "1.6rem", marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.88rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="currentMembersMode"
                        checked={currentMembersMode === "all"}
                        onChange={() => setCurrentMembersMode("all")}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>All current team members</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.88rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="currentMembersMode"
                        checked={currentMembersMode === "specific"}
                        onChange={() => setCurrentMembersMode("specific")}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>Specific team members or departments</span>
                    </label>

                    {currentMembersMode === "specific" && (
                      <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.75rem", backgroundColor: "#ffffff" }}>
                        <div style={{ position: "relative", marginBottom: "0.6rem" }}>
                          <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "10px" }} />
                          <input
                            type="text"
                            placeholder="Search departments or team members..."
                            value={currentSearch}
                            onChange={(e) => setCurrentSearch(e.target.value)}
                            style={{ width: "100%", padding: "0.4rem 0.65rem 0.4rem 2rem", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.84rem" }}
                          />
                        </div>
                        <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                            Departments
                          </div>
                          {departments
                            .filter((d) => (d.name || "").toLowerCase().includes(currentSearch.toLowerCase()))
                            .map((dept) => (
                              <label key={`cur-dept-${dept.id}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={selectedCurrentDeptIds.includes(dept.id)}
                                  onChange={() => toggleItem(selectedCurrentDeptIds, setSelectedCurrentDeptIds, dept.id)}
                                  style={{ accentColor: "#2563eb" }}
                                />
                                <span>{dept.name}</span>
                              </label>
                            ))}

                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginTop: "0.5rem" }}>
                            Team Members
                          </div>
                          {staffList
                            .filter((s) => (s.name || "").toLowerCase().includes(currentSearch.toLowerCase()))
                            .map((s) => (
                              <label key={`cur-st-${s.id}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={selectedCurrentStaffIds.includes(s.id)}
                                  onChange={() => toggleItem(selectedCurrentStaffIds, setSelectedCurrentStaffIds, s.id)}
                                  style={{ accentColor: "#2563eb" }}
                                />
                                <span>
                                  {s.name}{" "}
                                  <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>
                                    ({s.work_email || s.personal_email || s.email})
                                  </span>
                                </span>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INDIVIDUAL DOCUMENT RECIPIENT */}
          {documentScope === "individual" && (
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", marginBottom: "0.5rem" }}>
                Select recipient
              </div>
              <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.75rem", backgroundColor: "#ffffff" }}>
                <div style={{ position: "relative", marginBottom: "0.6rem" }}>
                  <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "10px" }} />
                  <input
                    type="text"
                    placeholder="Search team member by name..."
                    value={individualSearch}
                    onChange={(e) => setIndividualSearch(e.target.value)}
                    style={{ width: "100%", padding: "0.4rem 0.65rem 0.4rem 2rem", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.84rem" }}
                  />
                </div>
                <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {staffList
                    .filter((s) => (s.name || "").toLowerCase().includes(individualSearch.toLowerCase()))
                    .map((s) => (
                      <label key={`ind-${s.id}`} style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.86rem", cursor: "pointer", padding: "0.2rem 0" }}>
                        <input
                          type="radio"
                          name="individualStaff"
                          checked={String(individualStaffId) === String(s.id)}
                          onChange={() => setIndividualStaffId(String(s.id))}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                        <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>
                          ({s.work_email || s.personal_email || s.email})
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {docStatus === "draft" ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave("draft")}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.6rem 1.4rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {saving ? "Saving..." : "Save as draft"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave("active")}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#2563eb",
                    border: "1px solid #2563eb",
                    borderRadius: "6px",
                    padding: "0.6rem 1.4rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Send document now
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave("active")}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.6rem 1.4rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {saving ? "Sending..." : "Send document"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave("draft")}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "0.6rem 1.25rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Save as draft
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setStep(3)}
              style={{
                backgroundColor: "#ffffff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "0.6rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDocumentWizardPage;
