import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Users,
  Archive,
  Bell,
  CheckCircle2,
  Download,
  Edit3,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Button, Dropdown } from "react-bootstrap";
import {
  getAdminDocuments,
  updateAdminDocument,
  remindDocumentAssignment
} from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const PayrollDocumentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSection = searchParams.get("section") || "shared";
  const initialTab = searchParams.get("tab") || "active";

  const [section, setSection] = useState(initialSection);
  const [sharedTab, setSharedTab] = useState(initialTab);
  const [documents, setDocuments] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Pagination for Artifacts
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const docRes = await getAdminDocuments();
      setDocuments(docRes.documents || []);
      setArtifacts(docRes.artifacts || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSection = (nextSection) => {
    setSection(nextSection);
    setSearchQuery("");
    setSearchParams({ section: nextSection, ...(nextSection === "shared" ? { tab: sharedTab } : {}) });
  };

  const handleSelectSharedTab = (nextTab) => {
    setSharedTab(nextTab);
    setSearchParams({ section: "shared", tab: nextTab });
  };

  const handleAddDocumentClick = () => {
    const targetStatus = section === "shared" && sharedTab === "draft" ? "draft" : "active";
    navigate(`/admin/payroll/documents/new?status=${targetStatus}`);
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
      showToast(err?.response?.data?.error || "Failed to send reminder.");
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
        {(section === "shared" || section === "templates") && sharedTab !== "archived" && (
          <button
            type="button"
            onClick={handleAddDocumentClick}
            style={{
              backgroundColor: "#2563eb",
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
        {/* Left Sub-nav matching Image 8 */}
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
                onClick={() => handleSelectSection(item.id)}
                style={{
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  padding: "0.4rem 0.25rem",
                  fontSize: "0.875rem",
                  fontWeight: section === item.id ? 700 : 500,
                  color: section === item.id ? "#2563eb" : "#4b5563",
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
            onClick={() => handleSelectSection("authorization")}
            style={{
              textAlign: "left",
              background: "none",
              border: "none",
              padding: "0.4rem 0.25rem",
              fontSize: "0.875rem",
              fontWeight: section === "authorization" ? 700 : 500,
              color: section === "authorization" ? "#2563eb" : "#4b5563",
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
                      <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No document assignments yet. Upload and send a document from Shared.</td></tr>
                    ) : (
                      pagedArtifacts.map((a) => {
                        const isDone = Boolean(a.is_locked);
                        return (
                          <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#2563eb" }}>{a.staff_name}</td>
                            <td
                              style={{ padding: "0.85rem 1rem", color: "#2563eb", textDecoration: "underline", cursor: "pointer" }}
                              onClick={() => navigate(`/admin/payroll/documents/artifacts/${a.id}`)}
                            >
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
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem"
                                }}
                              >
                                {isDone && <Lock size={11} />}
                                {a.status}
                              </span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "0.75rem", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/payroll/documents/artifacts/${a.id}`)}
                                  style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
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
                      onClick={() => handleSelectSharedTab(t)}
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
                  placeholder={`Search ${sharedTab} documents`}
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
                    {loading ? (
                      <tr><td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading documents...</td></tr>
                    ) : filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "2.5rem", textAlign: "center", color: "#6b7280" }}>
                          No {sharedTab} documents yet. Click <strong>Add document</strong> to upload a PDF.
                        </td>
                      </tr>
                    ) : (
                      filteredDocs.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "0.9rem 1rem" }}>
                            <div
                              onClick={() => navigate(`/admin/payroll/documents/${doc.id}/edit?step=${doc.is_locked ? 3 : 2}`)}
                              style={{ fontWeight: 600, color: "#2563eb", textDecoration: "underline", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                            >
                              {doc.title}
                              {doc.is_locked && <Lock size={13} color="#6b7280" title="Locked because signed copies exist" />}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.15rem" }}>
                              {doc.document_scope === "individual" ? "Individual document" : "Team document"} • {doc.recipient_count || 0} assigned
                              {doc.signed_count > 0 && ` • ${doc.signed_count} signed`}
                            </div>
                          </td>
                          <td style={{ padding: "0.9rem 1rem", color: "#374151" }}>{doc.uploaded_by}</td>
                          <td style={{ padding: "0.9rem 1rem", textAlign: "right" }}>
                            <Dropdown align="end">
                              <Dropdown.Toggle variant="light" size="sm" style={{ border: "none", background: "transparent" }}>
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {!doc.is_locked && (
                                  <Dropdown.Item onClick={() => navigate(`/admin/payroll/documents/${doc.id}/edit?step=2`)}>
                                    <Edit3 className="w-4 h-4 me-2 inline" /> Edit document
                                  </Dropdown.Item>
                                )}
                                <Dropdown.Item onClick={() => navigate(`/admin/payroll/documents/${doc.id}/edit?step=3`)}>
                                  <Eye className="w-4 h-4 me-2 inline" /> Preview document
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate(`/admin/payroll/documents/${doc.id}/edit?step=4`)}>
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
                Export signed document audit records for compliance.
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
                Cooper Galvis Enterprises LLC / ELA Academy is authorized for electronic document signing and staff compliance tracking.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollDocumentsPage;
