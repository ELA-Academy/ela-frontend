import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Users,
  Archive,
  Bell,
  CheckCircle2,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import {
  getAdminDocuments,
  createAdminDocument,
  updateAdminDocument,
  updateDocumentRecipients,
  remindDocumentAssignment
} from "../../../services/payrollService";
import { getAllStaff } from "../../../services/staffService";
import { getAllDepartments } from "../../../services/departmentService";
import "../../../styles/GustoTheme.css";

const PayrollDocumentsPage = () => {
  const [section, setSection] = useState("artifacts"); // "artifacts" | "shared" | "templates" | "bulk" | "authorization"
  const [sharedTab, setSharedTab] = useState("active"); // "active" | "draft" | "archived"
  const [documents, setDocuments] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Pagination for Artifacts
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: "",
    category: "Company Policies",
    description: "",
    status: "active",
    content_body: "",
    requires_signature: true,
    is_fillable: false,
    file_name: "",
    future_hires_rule: "all",
    assign_to_existing: true
  });

  const [recipientsModalDoc, setRecipientsModalDoc] = useState(null);
  const [futureHiresRule, setFutureHiresRule] = useState("all");
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");

  const [viewArtifact, setViewArtifact] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, staffRes, deptRes] = await Promise.all([
        getAdminDocuments(),
        getAllStaff(),
        getAllDepartments().catch(() => [])
      ]);
      setDocuments(docRes.documents || []);
      setArtifacts(docRes.artifacts || []);
      setStaffList(Array.isArray(staffRes) ? staffRes : staffRes.staff || []);
      setDepartments(Array.isArray(deptRes) ? deptRes : deptRes.departments || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDoc = async (e) => {
    e.preventDefault();
    if (!newDoc.title.trim()) return;
    try {
      const res = await createAdminDocument({
        ...newDoc,
        doc_type: section === "templates" ? "template" : "shared"
      });
      setAddModalOpen(false);
      setNewDoc({
        title: "",
        category: "Company Policies",
        description: "",
        status: "active",
        content_body: "",
        requires_signature: true,
        is_fillable: false,
        file_name: "",
        future_hires_rule: "all",
        assign_to_existing: true
      });
      showToast(
        res?.assigned_count > 0
          ? `Document saved and attached to ${res.assigned_count} active worker(s).`
          : "Document saved successfully."
      );
      loadData();
    } catch (err) {
      showToast("Failed to save document.");
    }
  };

  const openRecipientsModal = (doc) => {
    setRecipientsModalDoc(doc);
    setFutureHiresRule(doc.future_hires_rule || "none");
    setSelectedDeptIds(doc.target_department_ids || []);
    setSelectedStaffIds([]);
    setRecipientSearch("");
  };

  const handleSaveRecipients = async () => {
    if (!recipientsModalDoc) return;
    try {
      const res = await updateDocumentRecipients(recipientsModalDoc.id, {
        future_hires_rule: futureHiresRule,
        department_ids: selectedDeptIds,
        staff_ids: selectedStaffIds
      });
      setRecipientsModalDoc(null);
      showToast(`Recipients updated (${res.added_recipients || 0} newly assigned).`);
      loadData();
    } catch (err) {
      showToast("Failed to update recipients.");
    }
  };

  const handleArchiveDoc = async (doc) => {
    try {
      const nextStatus = doc.status === "archived" ? "active" : "archived";
      await updateAdminDocument(doc.id, { status: nextStatus });
      showToast(nextStatus === "archived" ? "Document archived." : "Document restored to Active.");
      loadData();
    } catch (err) {
      showToast("Failed to update document status.");
    }
  };

  const handleSendReminder = async (artifact) => {
    try {
      await remindDocumentAssignment(artifact.id);
      showToast(`Reminder sent to ${artifact.staff_name} for "${artifact.document_title}".`);
      loadData();
    } catch (err) {
      showToast("Failed to send reminder.");
    }
  };

  const filteredArtifacts = artifacts.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.staff_name || "").toLowerCase().includes(q) ||
      (a.document_title || "").toLowerCase().includes(q) ||
      (a.status || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredArtifacts.length / itemsPerPage));
  const pagedArtifacts = filteredArtifacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filteredDocs = documents.filter((d) => {
    const typeMatch = section === "templates" ? d.doc_type === "template" : d.doc_type !== "template";
    const statusMatch = section === "shared" ? d.status === sharedTab : true;
    const qMatch = (d.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && statusMatch && qMatch;
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Documents
        </h1>
        {(section === "shared" || section === "templates") && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            style={{
              backgroundColor: "#0f766e",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0.55rem 1.1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <Plus className="w-4 h-4" />
            Add document
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "2rem", alignItems: "start" }}>
        {/* Left Sub-nav matching Gusto Image 4 & 5 */}
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
            Team
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginBottom: "1.5rem" }}>
            {[
              { id: "artifacts", label: "Artifacts" },
              { id: "shared", label: "Shared" },
              { id: "templates", label: "Templates" },
              { id: "bulk", label: "Bulk downloads" }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id);
                  setSearchQuery("");
                }}
                style={{
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  padding: "0.4rem 0.25rem",
                  fontSize: "0.875rem",
                  fontWeight: section === item.id ? 700 : 500,
                  color: section === item.id ? "#0f766e" : "#4b5563",
                  cursor: "pointer"
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
            Company
          </div>
          <button
            type="button"
            onClick={() => setSection("authorization")}
            style={{
              textAlign: "left",
              background: "none",
              border: "none",
              padding: "0.4rem 0.25rem",
              fontSize: "0.875rem",
              fontWeight: section === "authorization" ? 700 : 500,
              color: section === "authorization" ? "#0f766e" : "#4b5563",
              cursor: "pointer"
            }}
          >
            Authorization
          </button>
        </div>

        {/* Main Content */}
        <div>
          {section === "artifacts" && (
            <>
              <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <div style={{ position: "relative", width: "360px" }}>
                  <Search className="w-4 h-4 text-gray-400" style={{ position: "absolute", left: "12px", top: "11px" }} />
                  <input
                    type="text"
                    placeholder="Search member documents"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem 0.5rem 2.2rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.875rem"
                    }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontWeight: 700, color: "#374151" }}>Team member</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontWeight: 700, color: "#374151" }}>Document</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontWeight: 700, color: "#374151" }}>Status</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 700, color: "#374151" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading artifacts...</td></tr>
                    ) : pagedArtifacts.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No document assignments found. Assign recipients from the Shared tab.</td></tr>
                    ) : (
                      pagedArtifacts.map((a) => {
                        const isDone = a.status === "Signed" || a.status === "Submitted" || a.status === "Acknowledged";
                        return (
                          <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#0f766e" }}>{a.staff_name}</td>
                            <td style={{ padding: "0.85rem 1rem", color: "#0f766e", textDecoration: "underline", cursor: "pointer" }} onClick={() => setViewArtifact(a)}>
                              {a.document_title}
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
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
                                {a.status}
                              </span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "0.75rem", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => setViewArtifact(a)}
                                  style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                >
                                  <Eye className="w-4 h-4" /> View
                                </button>
                                {!isDone && (
                                  <button
                                    type="button"
                                    onClick={() => handleSendReminder(a)}
                                    style={{ background: "none", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.25rem 0.6rem", color: "#374151", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                  >
                                    <Bell className="w-3.5 h-3.5" /> Send reminder
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", borderTop: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "#4b5563" }}>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{ padding: "0.3rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>Items per page</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage(1)} style={{ border: "none", background: "none", cursor: "pointer", padding: "0.25rem" }}><ChevronsLeft className="w-4 h-4" /></button>
                    <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} style={{ border: "none", background: "none", cursor: "pointer", padding: "0.25rem" }}><ChevronLeft className="w-4 h-4" /></button>
                    <span style={{ fontSize: "0.82rem", color: "#4b5563", margin: "0 0.4rem" }}>Page {currentPage} of {totalPages}</span>
                    <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} style={{ border: "none", background: "none", cursor: "pointer", padding: "0.25rem" }}><ChevronRight className="w-4 h-4" /></button>
                    <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} style={{ border: "none", background: "none", cursor: "pointer", padding: "0.25rem" }}><ChevronsRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </>
          )}

          {(section === "shared" || section === "templates") && (
            <>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>
                {section === "shared" ? "Shared documents" : "Document templates"}
              </h2>

              {section === "shared" && (
                <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1rem" }}>
                  {["active", "draft", "archived"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSharedTab(t)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "0.6rem 0.25rem",
                        fontSize: "0.875rem",
                        fontWeight: sharedTab === t ? 700 : 500,
                        color: sharedTab === t ? "#111827" : "#6b7280",
                        borderBottom: sharedTab === t ? "2px solid #7c3aed" : "2px solid transparent",
                        cursor: "pointer",
                        textTransform: "capitalize"
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ position: "relative", width: "340px", marginBottom: "1rem" }}>
                <Search className="w-4 h-4 text-gray-400" style={{ position: "absolute", left: "12px", top: "11px" }} />
                <input
                  type="text"
                  placeholder="Search shared documents"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem 0.5rem 2.2rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.875rem"
                  }}
                />
              </div>

              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontWeight: 700, color: "#374151" }}>Name</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontWeight: 700, color: "#374151" }}>Uploaded by</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 700, color: "#374151" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No documents in this view.</td></tr>
                    ) : (
                      filteredDocs.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "0.9rem 1rem" }}>
                            <div style={{ fontWeight: 600, color: "#0f766e" }}>{doc.title}</div>
                            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{doc.category} • {doc.recipient_count || 0} assigned</div>
                          </td>
                          <td style={{ padding: "0.9rem 1rem", color: "#374151" }}>{doc.uploaded_by}</td>
                          <td style={{ padding: "0.9rem 1rem", textAlign: "right" }}>
                            <Dropdown align="end">
                              <Dropdown.Toggle variant="light" size="sm" style={{ border: "none", background: "transparent" }}>
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item onClick={() => setViewArtifact({ document_title: doc.title, content_body: doc.content_body || doc.description, status: doc.status })}>
                                  <Eye className="w-4 h-4 me-2 inline" /> View document details
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => openRecipientsModal(doc)}>
                                  <Users className="w-4 h-4 me-2 inline" /> Update recipients
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleArchiveDoc(doc)}>
                                  <Archive className="w-4 h-4 me-2 inline" /> {doc.status === "archived" ? "Restore document" : "Archive document"}
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {section === "bulk" && (
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "2rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Bulk downloads</h3>
              <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                Export signed contractor W-9s, Alternate Payment Forms, and acknowledged Pay Schedules for compliance audits.
              </p>
              <Button
                variant="outline-primary"
                onClick={() => {
                  const csv = ["Team Member,Document,Status,Signed At,Signature"]
                    .concat(artifacts.map((a) => `"${a.staff_name}","${a.document_title}","${a.status}","${a.signed_at || ""}","${a.signature_name || ""}"`))
                    .join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "document_artifacts_export.csv";
                  link.click();
                }}
              >
                <Download className="w-4 h-4 me-2 inline" /> Download Artifacts Audit CSV
              </Button>
            </div>
          )}

          {section === "authorization" && (
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "2rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Company Authorization</h3>
              <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                Cooper Galvis Enterprises LLC / ELA Academy is authorized for electronic document signing, contractor W-9 collection, and Stripe / Remitly disbursement tracking.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Document Modal */}
      <Modal show={addModalOpen} onHide={() => setAddModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem", fontWeight: 700 }}>Add shared document</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateDoc}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Document title</Form.Label>
              <Form.Control
                required
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                placeholder="e.g. 2027 Pay Schedule International"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Category</Form.Label>
              <Form.Select value={newDoc.category} onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}>
                <option value="Company Policies">Company Policies</option>
                <option value="Pay Schedules">Pay Schedules</option>
                <option value="Payroll & Payment">Payroll & Payment</option>
                <option value="Tax Documents">Tax Documents</option>
                <option value="Time Off & Leave">Time Off & Leave</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Status</Form.Label>
              <Form.Select value={newDoc.status} onChange={(e) => setNewDoc({ ...newDoc, status: e.target.value })}>
                <option value="active">Active (Ready to assign)</option>
                <option value="draft">Draft (Awaiting approval)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Upload file (optional — PDF, Word, or Text)</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md,.csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setNewDoc((prev) => ({
                    ...prev,
                    file_name: f.name,
                    title: prev.title || f.name.replace(/\.[^/.]+$/, "")
                  }));
                  if (f.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(f.name)) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setNewDoc((prev) => ({ ...prev, content_body: String(ev.target?.result || "") }));
                    };
                    reader.readAsText(f);
                  }
                }}
              />
              {newDoc.file_name && (
                <Form.Text className="text-emerald-700 fw-medium">Selected: {newDoc.file_name}</Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Document content / instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newDoc.content_body}
                onChange={(e) => setNewDoc({ ...newDoc, content_body: e.target.value })}
                placeholder="Paste document text or key schedule dates..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Auto-assign to future hires</Form.Label>
              <Form.Select
                value={newDoc.future_hires_rule}
                onChange={(e) => setNewDoc({ ...newDoc, future_hires_rule: e.target.value })}
              >
                <option value="all">All future hires</option>
                <option value="us">US-based hires only</option>
                <option value="non_us">International / Non-US hires only</option>
                <option value="none">Do not auto-assign</option>
              </Form.Select>
            </Form.Group>
            {newDoc.status === "active" && (
              <Form.Check
                type="checkbox"
                id="chk-assign-existing-workers"
                label="Automatically attach to all matching active workers now"
                checked={newDoc.assign_to_existing}
                onChange={(e) => setNewDoc({ ...newDoc, assign_to_existing: e.target.checked })}
                className="mb-2 fw-medium"
              />
            )}
            <Form.Check
              type="checkbox"
              id="chk-requires-sig"
              label="Require e-signature / acknowledgement from recipient"
              checked={newDoc.requires_signature}
              onChange={(e) => setNewDoc({ ...newDoc, requires_signature: e.target.checked })}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: "#0f766e", border: "none" }}>Save document</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Update Document Recipients Modal (Image 7) */}
      <Modal show={!!recipientsModalDoc} onHide={() => setRecipientsModalDoc(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.15rem", fontWeight: 700 }}>
            Update document recipients — {recipientsModalDoc?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>Future hires</div>
            <Form.Select value={futureHiresRule} onChange={(e) => setFutureHiresRule(e.target.value)}>
              <option value="none">Do not auto-assign to future hires</option>
              <option value="all">All future hires</option>
              <option value="us">US-based hires only</option>
              <option value="non_us">International / Non-US hires only</option>
            </Form.Select>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>Current team members & departments</div>
            <input
              type="text"
              placeholder="Search for a person or department..."
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", marginBottom: "0.75rem" }}
            />
            <div style={{ maxHeight: "260px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Departments
              </div>
              {departments
                .filter((d) => (d.name || "").toLowerCase().includes(recipientSearch.toLowerCase()))
                .map((d) => (
                  <Form.Check
                    key={`dept-${d.id}`}
                    type="checkbox"
                    label={d.name}
                    checked={selectedDeptIds.includes(d.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedDeptIds((p) => [...p, d.id]);
                      else setSelectedDeptIds((p) => p.filter((x) => x !== d.id));
                    }}
                    className="mb-1"
                  />
                ))}

              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginTop: "0.85rem", marginBottom: "0.4rem" }}>
                Individual Team Members
              </div>
              {staffList
                .filter((s) => (s.name || "").toLowerCase().includes(recipientSearch.toLowerCase()))
                .map((s) => (
                  <Form.Check
                    key={`staff-${s.id}`}
                    type="checkbox"
                    label={`${s.name} (${s.country || "US"})`}
                    checked={selectedStaffIds.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedStaffIds((p) => [...p, s.id]);
                      else setSelectedStaffIds((p) => p.filter((x) => x !== s.id));
                    }}
                    className="mb-1"
                  />
                ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setRecipientsModalDoc(null)}>Cancel</Button>
          <Button onClick={handleSaveRecipients} style={{ backgroundColor: "#0f766e", border: "none" }}>
            Send &amp; Save Recipients
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Artifact / Submitted Form Data Modal */}
      <Modal show={!!viewArtifact} onHide={() => setViewArtifact(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            <FileText className="w-4 h-4 me-2 inline" />
            {viewArtifact?.document_title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewArtifact?.staff_name && (
            <div style={{ marginBottom: "0.75rem", fontSize: "0.875rem" }}>
              <strong>Team member:</strong> {viewArtifact.staff_name}
            </div>
          )}
          <div style={{ marginBottom: "0.75rem", fontSize: "0.875rem" }}>
            <strong>Status:</strong> {viewArtifact?.status}
            {viewArtifact?.signature_name && ` (Signed by "${viewArtifact.signature_name}")`}
          </div>
          {viewArtifact?.content_body && (
            <div style={{ backgroundColor: "#f9fafb", padding: "0.85rem", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {viewArtifact.content_body}
            </div>
          )}
          {viewArtifact?.filled_data && Object.keys(viewArtifact.filled_data).length > 0 && (
            <div style={{ border: "1px solid #d1fae5", backgroundColor: "#ecfdf5", padding: "0.85rem", borderRadius: "6px" }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#065f46", marginBottom: "0.4rem" }}>
                Submitted Form Details
              </div>
              {Object.entries(viewArtifact.filled_data).map(([k, v]) => (
                <div key={k} style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                  <strong style={{ textTransform: "capitalize" }}>{k.replace(/_/g, " ")}:</strong> {v}
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewArtifact(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PayrollDocumentsPage;
