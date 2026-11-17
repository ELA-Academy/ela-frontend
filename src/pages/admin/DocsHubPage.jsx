import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Table, Button, Form, Modal, Dropdown, Spinner, Alert } from "react-bootstrap";
import {
  FileText, Plus, Search, Folder, Calendar, Sparkles, MoreHorizontal,
  Trash2, Globe, Users, Shield, Eye, Receipt, Copy, BookmarkPlus,
  LayoutTemplate, LayoutGrid, List as ListIcon, Lock
} from "lucide-react";
import DOMPurify from "dompurify";
import { useWorkspace } from "../../components/admin/workspace/WorkspaceLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getAllWorkspaceDocs,
  createWorkspaceDoc,
  deleteWorkspaceDoc,
  duplicateWorkspaceDoc,
  saveDocAsTemplate,
  getDocTemplates,
  deleteDocTemplate
} from "../../services/boardService";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import DocsView from "../../components/admin/workspace/DocsView";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";

const TemplateThumbnail = ({ type, accent }) => {
  if (type === "blank") {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 w-100">
        <Plus size={28} style={{ color: "#673de6" }} strokeWidth={2.2} />
      </div>
    );
  }

  return (
    <div className="p-2.5 h-100 w-100 d-flex flex-column justify-content-between bg-white" style={{ fontSize: "7px" }}>
      <div>
        <div className="mx-auto mb-1.5 rounded-1" style={{ width: "42%", height: "4px", backgroundColor: "#1e293b" }} />
        <div className="mx-auto mb-2 rounded-1" style={{ width: "65%", height: "2.5px", backgroundColor: "#cbd5e1" }} />
        <div className="rounded-1 mb-2" style={{ height: "2px", backgroundColor: accent }} />
        <div className="d-flex justify-content-between mb-1.5">
          <div className="rounded-1" style={{ width: "30%", height: "3px", backgroundColor: "#94a3b8" }} />
          <div className="rounded-1" style={{ width: "24%", height: "3px", backgroundColor: "#94a3b8" }} />
        </div>
        <div className="rounded-1 mb-2 mx-auto" style={{ width: "55%", height: "4px", backgroundColor: accent }} />
        {type === "expense_report" ? (
          <div className="border rounded-1 p-1 mb-1.5" style={{ borderColor: "#e2e8f0" }}>
            <div className="d-flex gap-1 mb-1">
              <div className="rounded-1" style={{ width: "25%", height: "3px", backgroundColor: "#94a3b8" }} />
              <div className="rounded-1" style={{ width: "50%", height: "3px", backgroundColor: "#cbd5e1" }} />
              <div className="rounded-1 ms-auto" style={{ width: "18%", height: "3px", backgroundColor: accent }} />
            </div>
            <div className="d-flex gap-1 mb-1">
              <div className="rounded-1" style={{ width: "25%", height: "2.5px", backgroundColor: "#e2e8f0" }} />
              <div className="rounded-1" style={{ width: "50%", height: "2.5px", backgroundColor: "#e2e8f0" }} />
              <div className="rounded-1 ms-auto" style={{ width: "18%", height: "2.5px", backgroundColor: "#cbd5e1" }} />
            </div>
            <div className="d-flex gap-1">
              <div className="rounded-1" style={{ width: "25%", height: "2.5px", backgroundColor: "#e2e8f0" }} />
              <div className="rounded-1" style={{ width: "50%", height: "2.5px", backgroundColor: "#e2e8f0" }} />
              <div className="rounded-1 ms-auto" style={{ width: "18%", height: "2.5px", backgroundColor: "#cbd5e1" }} />
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-1 mb-2">
            <div className="rounded-1" style={{ width: "100%", height: "2.5px", backgroundColor: "#e2e8f0" }} />
            <div className="rounded-1" style={{ width: "92%", height: "2.5px", backgroundColor: "#e2e8f0" }} />
            <div className="rounded-1" style={{ width: "84%", height: "2.5px", backgroundColor: "#e2e8f0" }} />
            <div className="rounded-1" style={{ width: "68%", height: "2.5px", backgroundColor: "#e2e8f0" }} />
          </div>
        )}
      </div>
      <div className="d-flex justify-content-between align-items-center pt-1">
        <div className="rounded-1" style={{ width: "32%", height: "3px", backgroundColor: "#64748b" }} />
        <div className="rounded-circle" style={{ width: "12px", height: "12px", backgroundColor: `${accent}25`, border: `1.5px solid ${accent}` }} />
      </div>
    </div>
  );
};

const DocsHubPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { boards, assignees, departments } = useWorkspace();

  const searchParams = new URLSearchParams(window.location.search);
  const urlDocId = searchParams.get("docId");

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "shared" | "mine"
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "title"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [showTemplates, setShowTemplates] = useState(true);

  // Creation Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [newDocPublic, setNewDocPublic] = useState(true);
  const [newDocTemplate, setNewDocTemplate] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(false);

  // Custom Document Templates states
  const [customTemplates, setCustomTemplates] = useState([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateSourceDoc, setTemplateSourceDoc] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  useEffect(() => {
    if (!urlDocId) {
      fetchDocs();
      fetchTemplates();
    }
  }, [urlDocId]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await getAllWorkspaceDocs();
      setDocs(data || []);
    } catch (err) {
      console.error("Failed to load documents", err);
      setError("Failed to load workspace documents.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await getDocTemplates();
      setCustomTemplates(data || []);
    } catch (err) {
      console.error("Failed to load document templates", err);
    }
  };

  const handleDelete = (doc, e) => {
    if (e) e.stopPropagation();
    setDocToDelete(doc);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    try {
      setDeletingDoc(true);
      setDeletingDocId(docToDelete.id);
      await deleteWorkspaceDoc(docToDelete.id);
      setDocs(prev => prev.filter(d => d.id !== docToDelete.id));
      toast.success("Document deleted");
      setShowDeleteModal(false);
      setDocToDelete(null);
    } catch (err) {
      console.error("Failed to delete doc", err);
      toast.error("Failed to delete document");
    } finally {
      setDeletingDoc(false);
      setDeletingDocId(null);
    }
  };

  const handleOpenCreateModal = (template = null) => {
    setNewDocTemplate(template);
    setNewDocTitle(template && template.type !== "blank" ? `New ${template.label}` : "");
    if (boards && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    } else {
      setSelectedBoardId("");
    }
    setNewDocPublic(true);
    setShowCreateModal(true);
  };

  const handleDuplicateDoc = async (doc, e) => {
    if (e) e.stopPropagation();
    try {
      const duplicated = await duplicateWorkspaceDoc(doc.id);
      setDocs(prev => [duplicated, ...prev]);
      toast.success(`Duplicated "${doc.title}"`);
    } catch (err) {
      console.error("Failed to duplicate document", err);
      toast.error("Failed to duplicate document");
    }
  };

  const handleOpenSaveTemplateModal = (doc, e) => {
    if (e) e.stopPropagation();
    setTemplateSourceDoc(doc);
    setTemplateName(`${doc.title} Template`);
    setTemplateDesc(`Reusable template based on "${doc.title}"`);
    setShowSaveTemplateModal(true);
  };

  const handleSaveAsTemplate = async (e) => {
    if (e) e.preventDefault();
    if (!templateSourceDoc) return;
    try {
      setSavingTemplate(true);
      const created = await saveDocAsTemplate(templateSourceDoc.id, {
        name: templateName.trim() || templateSourceDoc.title,
        description: templateDesc.trim(),
        category: "Custom",
      });
      setCustomTemplates(prev => [created, ...prev]);
      toast.success("Saved as reusable template!");
      setShowSaveTemplateModal(false);
      setTemplateSourceDoc(null);
    } catch (err) {
      console.error("Failed to save document template", err);
      toast.error("Failed to save document template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplateConfirm = async () => {
    if (!templateToDelete) return;
    try {
      setDeletingTemplate(true);
      await deleteDocTemplate(templateToDelete.id);
      setCustomTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
      toast.success("Template deleted");
      setShowDeleteTemplateModal(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error("Failed to delete template", err);
      toast.error("Failed to delete template");
    } finally {
      setDeletingTemplate(false);
    }
  };

  const handleCreateDoc = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBoardId) {
      toast.error("Please select a Space");
      return;
    }
    const title = newDocTitle.trim() || "Untitled Document";

    let initialHtml = "<p>Start writing your document here...</p>";
    if (newDocTemplate && newDocTemplate.html) {
      initialHtml = newDocTemplate.html;
    }

    try {
      setCreating(true);
      const docData = {
        title,
        content_html: initialHtml,
        is_public: newDocPublic
      };

      const newDoc = await createWorkspaceDoc(selectedBoardId, docData);
      toast.success("Document created successfully!");
      setShowCreateModal(false);
      navigate(`/admin/docs?docId=${newDoc.id}`);
    } catch (err) {
      console.error("Failed to create document", err);
      toast.error("Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  const filteredDocs = useMemo(() => {
    const filtered = docs.filter(doc => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.location_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === "mine") {
        return doc.created_by_name === user?.name;
      }
      if (activeTab === "shared") {
        const notMine = doc.created_by_name !== user?.name;
        const isSharedUser = (doc.shared_user_ids || []).includes(user?.id);
        const userDeptIds = departments ? departments.map(d => d.id) : [];
        const isSharedDept = (doc.shared_dept_ids || []).some(id => userDeptIds.includes(id));
        return notMine && (isSharedUser || isSharedDept || doc.is_public);
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return sortBy === "oldest" ? dateA - dateB : dateB - dateA;
    });
  }, [docs, searchQuery, activeTab, sortBy, user, departments]);

  const TEMPLATES = [
    {
      type: "blank",
      label: "Blank document",
      desc: "Start with an empty page",
      icon: Plus,
      color: "#673de6",
      html: "<p>Start writing your document here...</p>"
    },
    {
      type: "expense_report",
      label: "Expense Report",
      desc: "Itemized expenses, totals & approvals",
      icon: Receipt,
      color: "#10b981",
      html: `
        <h2>Expense Report</h2>
        <p><strong>Submitted By:</strong> [Employee Name] &nbsp;|&nbsp; <strong>Department:</strong> [Department]</p>
        <p><strong>Report Date:</strong> ${format(new Date(), "MMMM dd, yyyy")} &nbsp;|&nbsp; <strong>Period:</strong> [Start Date – End Date]</p>
        <p><strong>Business Purpose:</strong> [Describe the purpose of these expenses]</p>
        <hr/>
        <h3>Itemized Expenses</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; text-align: left;">Date</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; text-align: left;">Category</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; text-align: left;">Description</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; text-align: left;">Payment Method</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; text-align: left;">Receipt</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">${format(new Date(), "MM/dd/yyyy")}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Supplies</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Classroom / office supplies</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Personal Card</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Yes</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">$0.00</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Travel / Meals</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">$0.00</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">Other</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">$0.00</td>
            </tr>
          </tbody>
        </table>
        <h3>Summary &amp; Approval</h3>
        <p><strong>Subtotal:</strong> $0.00</p>
        <p><strong>Less Advances:</strong> $0.00</p>
        <p><strong>Total Reimbursement Due:</strong> $0.00</p>
        <p><strong>Employee Signature:</strong> ______________________ &nbsp;&nbsp; <strong>Approved By:</strong> ______________________</p>
      `
    },
    {
      type: "project_overview",
      label: "Project Overview",
      desc: "Summarize goals, scope & milestones",
      icon: Sparkles,
      color: "#a855f7",
      html: `
        <h2>Project Overview</h2>
        <p><strong>Goal:</strong> Define the main objectives of this project.</p>
        <p><strong>Scope:</strong> Outline features and constraints.</p>
        <p><strong>Milestones:</strong></p>
        <ul>
          <li>Phase 1: Planning &amp; Design</li>
          <li>Phase 2: Core Development</li>
          <li>Phase 3: Testing &amp; Launch</li>
        </ul>
      `
    },
    {
      type: "meeting_notes",
      label: "Meeting Notes",
      desc: "Capture agenda, notes & action items",
      icon: Calendar,
      color: "#f59e0b",
      html: `
        <h2>Meeting Notes</h2>
        <p><strong>Date:</strong> ${format(new Date(), "MMMM dd, yyyy")}</p>
        <p><strong>Attendees:</strong> Participant A, Participant B</p>
        <hr/>
        <p><strong>Agenda:</strong></p>
        <ol>
          <li>Status Updates</li>
          <li>Blockers &amp; Issues</li>
          <li>Next steps</li>
        </ol>
        <p><strong>Action Items:</strong></p>
        <p>[ ] Follow up on design reviews</p>
      `
    },
    {
      type: "wiki",
      label: "Wiki",
      desc: "Organize team knowledge in one place",
      icon: Folder,
      color: "#3b82f6",
      html: `
        <h2>Knowledge Base Wiki</h2>
        <p>Welcome to our workspace wiki page. Use this to share details about systems, setup steps, or standard procedures.</p>
        <h3>Getting Started</h3>
        <p>Review the team onboarding docs and guidelines.</p>
      `
    }
  ];

  if (urlDocId) {
    return (
      <DocsView
        boardId={null}
        assignees={assignees}
        departments={departments}
      />
    );
  }

  return (
    <Container fluid className="px-4 py-4" style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom border-slate-200">
        <div>
          <h1 className="fw-bold text-slate-900 m-0" style={{ fontSize: "16px", letterSpacing: "0.06em" }}>
            DOCUMENTS
          </h1>
          <span className="text-slate-400" style={{ fontSize: "12px" }}>
            Document library, reusable templates, and collaborative editor
          </span>
        </div>
        <Button
          variant="dark"
          size="sm"
          className="d-flex align-items-center gap-1.5 fw-semibold px-3 py-2 rounded-3 shadow-sm"
          style={{ backgroundColor: "#0f172a", borderColor: "#0f172a", fontSize: "12.5px" }}
          onClick={() => handleOpenCreateModal(TEMPLATES[0])}
        >
          <Plus size={15} /> New document
        </Button>
      </div>

      {/* Start a new document (Template Gallery Card) */}
      <div className="bg-white border border-slate-200 rounded-4 p-4 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-semibold text-slate-800" style={{ fontSize: "14px" }}>
            Start a new document
          </span>
          <button
            type="button"
            onClick={() => setShowTemplates(prev => !prev)}
            className="btn btn-link p-0 text-decoration-none text-slate-500 hover:text-slate-800 fw-medium"
            style={{ fontSize: "12.5px" }}
          >
            {showTemplates ? "Hide templates" : "Template gallery"}
          </button>
        </div>

        {showTemplates && (
          <>
            <div className="d-flex flex-wrap gap-3">
              {TEMPLATES.map(t => (
                <div
                  key={t.type}
                  className="cursor-pointer"
                  style={{ width: "168px" }}
                  onClick={() => handleOpenCreateModal(t)}
                >
                  <div
                    className="rounded-3 border bg-white overflow-hidden mb-2"
                    style={{
                      height: "200px",
                      borderColor: "#e2e8f0",
                      transition: "all 0.18s ease",
                      boxShadow: "0 1px 2px rgba(15,23,42,0.04)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#673de6";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(103, 61, 230, 0.12)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.04)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <TemplateThumbnail type={t.type} accent={t.color} />
                  </div>
                  <div className="fw-semibold text-slate-800 text-truncate" style={{ fontSize: "12.5px" }}>
                    {t.label}
                  </div>
                  <div className="text-slate-400 text-truncate" style={{ fontSize: "11px" }}>
                    {t.desc}
                  </div>
                </div>
              ))}

              {/* Saved Custom Templates alongside built-in ones */}
              {customTemplates.map(tpl => (
                <div
                  key={`tpl_${tpl.id}`}
                  className="cursor-pointer position-relative"
                  style={{ width: "168px" }}
                  onClick={() =>
                    handleOpenCreateModal({
                      type: `custom_${tpl.id}`,
                      label: tpl.name,
                      desc: tpl.description || "Custom saved template",
                      html: tpl.content_html || "<p></p>",
                    })
                  }
                >
                  <div
                    className="rounded-3 border bg-white overflow-hidden mb-2 position-relative"
                    style={{
                      height: "200px",
                      borderColor: "#e2e8f0",
                      transition: "all 0.18s ease",
                      boxShadow: "0 1px 2px rgba(15,23,42,0.04)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#673de6";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(103, 61, 230, 0.12)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.04)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      className="p-3 h-100 w-100 overflow-hidden bg-white"
                      style={{
                        transform: "scale(0.35)",
                        transformOrigin: "top left",
                        width: "285%",
                        height: "285%",
                        pointerEvents: "none",
                        color: "#334155",
                        fontSize: "13px"
                      }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tpl.content_html || "") }}
                    />
                    <span
                      className="badge position-absolute top-0 start-0 m-2"
                      style={{ backgroundColor: "#eef2ff", color: "#4f46e5", fontSize: "9px", fontWeight: 700 }}
                    >
                      <LayoutTemplate size={9} className="me-1" />
                      Saved
                    </span>
                    <button
                      type="button"
                      className="btn btn-light btn-sm position-absolute top-0 end-0 m-1.5 p-1 rounded-circle border shadow-sm text-slate-400 hover:text-danger"
                      title="Delete Template"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplateToDelete(tpl);
                        setShowDeleteTemplateModal(true);
                      }}
                      style={{ width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="fw-semibold text-slate-800 text-truncate" style={{ fontSize: "12.5px" }}>
                    {tpl.name}
                  </div>
                  <div className="text-slate-400 text-truncate" style={{ fontSize: "11px" }}>
                    {tpl.description || `Saved by ${tpl.created_by_name}`}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Document Library Header & Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3 mb-3">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <h2 className="fw-bold text-slate-900 m-0" style={{ fontSize: "15px" }}>
            Recent documents{" "}
            <span className="text-slate-400 fw-normal">({filteredDocs.length})</span>
          </h2>

          {/* Filter Pills */}
          <div className="d-flex bg-white border border-slate-200 rounded-3 p-0.5 gap-0.5">
            {[
              { key: "all", label: "All" },
              { key: "mine", label: "My Docs" },
              { key: "shared", label: "Shared" }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`btn btn-sm border-0 rounded-2 px-2.5 py-1 fw-semibold ${
                  activeTab === tab.key ? "bg-slate-900 text-white" : "bg-transparent text-slate-500 hover:text-slate-800"
                }`}
                style={{ fontSize: "11.5px" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="position-relative" style={{ width: "240px" }}>
            <span className="position-absolute top-50 start-0 translate-middle-y ps-2.5 text-slate-400">
              <Search size={14} />
            </span>
            <Form.Control
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-5 bg-white border-slate-200 rounded-3"
              style={{ fontSize: "12.5px", height: "34px" }}
            />
          </div>

          {/* Sort */}
          <Form.Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border-slate-200 rounded-3"
            style={{ fontSize: "12.5px", height: "34px", width: "145px" }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title (A–Z)</option>
          </Form.Select>

          {/* Grid / List Toggle */}
          <div className="d-flex bg-white border border-slate-200 rounded-3 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`btn btn-sm border-0 p-1.5 rounded-2 ${viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
              title="Library Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`btn btn-sm border-0 p-1.5 rounded-2 ${viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
              title="Table List View"
            >
              <ListIcon size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Document Library Content */}
      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 my-4 bg-white rounded-4 border border-slate-200">
          <Spinner animation="border" variant="primary" size="sm" className="mb-2" />
          <span className="text-slate-400 text-xs">Loading document library...</span>
        </div>
      ) : error ? (
        <Alert variant="danger" className="text-xs">{error}</Alert>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-5 my-3 bg-white rounded-4 border border-slate-200">
          <FileText size={38} className="text-slate-300 mb-2" />
          <h6 className="fw-bold text-slate-700 mb-1" style={{ fontSize: "14px" }}>No documents found</h6>
          <span className="text-slate-400 text-xs d-block mb-3">
            Try adjusting your search or start from a template above.
          </span>
          <Button
            variant="dark"
            size="sm"
            onClick={() => handleOpenCreateModal(TEMPLATES[0])}
            className="fw-semibold px-3"
          >
            Create Document
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <Row className="g-3">
          {filteredDocs.map(doc => {
            const hasUserShares = doc.shared_user_ids && doc.shared_user_ids.length > 0;
            const hasDeptShares = doc.shared_dept_ids && doc.shared_dept_ids.length > 0;
            const isSharedList = hasUserShares || hasDeptShares;

            return (
              <Col key={doc.id} xs={12} sm={6} md={4} lg={3} xl={2} style={{ minWidth: "210px" }}>
                <Card
                  className="border-slate-200 rounded-4 overflow-hidden h-100 cursor-pointer bg-white"
                  style={{ transition: "all 0.18s ease", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
                  onClick={() => navigate(`/admin/docs?docId=${doc.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#94a3b8";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(15,23,42,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.04)";
                  }}
                >
                  {/* Miniature Live Document Preview */}
                  <div
                    className="border-bottom border-slate-100 bg-white overflow-hidden position-relative"
                    style={{ height: "155px" }}
                  >
                    <div
                      className="p-3"
                      style={{
                        transform: "scale(0.36)",
                        transformOrigin: "top left",
                        width: "278%",
                        height: "278%",
                        pointerEvents: "none",
                        color: "#334155",
                        fontSize: "13px",
                        lineHeight: 1.5
                      }}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(doc.content_html || "<p>Empty document</p>")
                      }}
                    />
                    <div
                      className="position-absolute bottom-0 start-0 end-0"
                      style={{ height: "28px", background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95))" }}
                    />
                  </div>

                  {/* Card Footer */}
                  <Card.Body className="p-3 d-flex flex-column justify-content-between">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div className="overflow-hidden">
                        <div className="fw-bold text-slate-800 text-truncate" style={{ fontSize: "13px" }} title={doc.title}>
                          {doc.title}
                        </div>
                        <div className="text-slate-400 text-truncate" style={{ fontSize: "11px" }}>
                          {doc.location_name || "Workspace"}
                        </div>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown align="end">
                          <Dropdown.Toggle
                            as={React.forwardRef(({ onClick }, ref) => (
                              <button
                                ref={ref}
                                type="button"
                                onClick={onClick}
                                className="btn btn-link btn-sm p-1 text-slate-400 hover:text-slate-700 border-0"
                              >
                                <MoreHorizontal size={15} />
                              </button>
                            ))}
                          />
                          <Dropdown.Menu className="shadow border-slate-200 rounded-3 py-1" style={{ fontSize: "12px" }}>
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3"
                              onClick={() => navigate(`/admin/docs?docId=${doc.id}`)}
                            >
                              <Eye size={12} /> Open in Editor
                            </Dropdown.Item>
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3"
                              onClick={() => navigate(`/admin/docs?docId=${doc.id}&mode=view`)}
                            >
                              <Lock size={12} /> Open Read-Only
                            </Dropdown.Item>
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3"
                              onClick={(e) => handleDuplicateDoc(doc, e)}
                            >
                              <Copy size={12} /> Duplicate Doc
                            </Dropdown.Item>
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3"
                              onClick={(e) => handleOpenSaveTemplateModal(doc, e)}
                            >
                              <BookmarkPlus size={12} /> Save as Template
                            </Dropdown.Item>
                            <Dropdown.Divider className="my-1 border-slate-100" />
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3 text-danger"
                              onClick={(e) => handleDelete(doc, e)}
                              disabled={deletingDocId === doc.id}
                            >
                              <Trash2 size={12} /> Delete Doc
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center text-slate-400" style={{ fontSize: "10.5px" }}>
                      <span>
                        {doc.updated_at ? format(parseISO(doc.updated_at), "MMM dd, yyyy") : "Recently"}
                      </span>
                      {doc.is_public ? (
                        <span className="text-emerald-600 d-inline-flex align-items-center gap-1 fw-semibold">
                          <Globe size={10} /> Public
                        </span>
                      ) : isSharedList ? (
                        <span className="text-purple-600 d-inline-flex align-items-center gap-1 fw-semibold">
                          <Users size={10} /> Shared
                        </span>
                      ) : (
                        <span className="text-slate-400 d-inline-flex align-items-center gap-1 fw-semibold">
                          <Shield size={10} /> Private
                        </span>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card className="border-slate-200 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <Table hover align="middle" className="text-slate-700 m-0 align-middle">
              <thead>
                <tr className="bg-slate-50 text-slate-400 fw-bold border-bottom text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Created By</th>
                  <th className="py-2.5 px-3">Date Updated</th>
                  <th className="py-2.5 px-3">Sharing</th>
                  <th className="py-2.5 px-3 text-end" style={{ width: "80px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => {
                  const hasUserShares = doc.shared_user_ids && doc.shared_user_ids.length > 0;
                  const hasDeptShares = doc.shared_dept_ids && doc.shared_dept_ids.length > 0;
                  const isSharedList = hasUserShares || hasDeptShares;

                  return (
                    <tr
                      key={doc.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/docs?docId=${doc.id}`)}
                    >
                      <td className="py-2.5 px-3">
                        <div className="d-flex align-items-center gap-2">
                          <FileText size={15} className="text-blue-500 flex-shrink-0" />
                          <span className="fw-bold text-slate-800" style={{ fontSize: "12.5px" }}>
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="badge bg-slate-100 border border-slate-200 fw-semibold px-2 py-1 rounded-2" style={{ fontSize: "10.5px", color: "#475569" }}>
                          {doc.location_name || "Workspace Space"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500" style={{ fontSize: "12px" }}>
                        {doc.created_by_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400" style={{ fontSize: "12px" }}>
                        {doc.updated_at ? format(parseISO(doc.updated_at), "MMM dd, yyyy HH:mm") : "Recently"}
                      </td>
                      <td className="py-2.5 px-3">
                        {doc.is_public ? (
                          <span className="text-emerald-600 d-inline-flex align-items-center gap-1 fw-bold" style={{ fontSize: "11px" }}>
                            <Globe size={11} /> Public
                          </span>
                        ) : isSharedList ? (
                          <span className="text-purple-600 d-inline-flex align-items-center gap-1 fw-bold" style={{ fontSize: "11px" }}>
                            <Users size={11} /> Shared
                          </span>
                        ) : (
                          <span className="text-slate-400 d-inline-flex align-items-center gap-1 fw-bold" style={{ fontSize: "11px" }}>
                            <Shield size={11} /> Private
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-end" onClick={(e) => e.stopPropagation()}>
                        <Dropdown align="end">
                          <Dropdown.Toggle
                            as={React.forwardRef(({ onClick }, ref) => (
                              <button
                                ref={ref}
                                type="button"
                                onClick={onClick}
                                className="btn btn-link btn-sm p-1 text-slate-400 hover:text-slate-600 border-0"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                            ))}
                          />
                          <Dropdown.Menu className="shadow border-slate-200 rounded-3 py-1" style={{ fontSize: "12px" }}>
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3"
                              onClick={() => navigate(`/admin/docs?docId=${doc.id}`)}
                            >
                              <Eye size={12} /> Open in Editor
                            </Dropdown.Item>
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3"
                              onClick={() => navigate(`/admin/docs?docId=${doc.id}&mode=view`)}
                            >
                              <Lock size={12} /> Open Read-Only
                            </Dropdown.Item>
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3"
                              onClick={(e) => handleDuplicateDoc(doc, e)}
                            >
                              <Copy size={12} /> Duplicate Doc
                            </Dropdown.Item>
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3"
                              onClick={(e) => handleOpenSaveTemplateModal(doc, e)}
                            >
                              <BookmarkPlus size={12} /> Save as Template
                            </Dropdown.Item>
                            <Dropdown.Divider className="my-1 border-slate-100" />
                            <Dropdown.Item
                              className="d-flex align-items-center gap-2 py-1.5 px-3 text-danger"
                              onClick={(e) => handleDelete(doc, e)}
                              disabled={deletingDocId === doc.id}
                            >
                              <Trash2 size={12} /> Delete Doc
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Creation Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        centered
        className="zbot-premium-modal"
      >
        <Form onSubmit={handleCreateDoc}>
          <Modal.Header closeButton className="border-bottom border-slate-100 pb-2">
            <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: "16px" }}>
              {newDocTemplate && newDocTemplate.type !== "blank"
                ? `Create from "${newDocTemplate.label}"`
                : "Create New Document"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-3">
            <Form.Group className="mb-3">
              <Form.Label className="text-slate-500 font-bold text-[10px] uppercase">Document Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Q4 Expense Report"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                required
                className="text-xs border-slate-200"
                style={{ fontSize: "12px", height: "36px" }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-slate-500 font-bold text-[10px] uppercase">Target Space (Location)</Form.Label>
              <Form.Select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                required
                className="text-xs border-slate-200"
                style={{ fontSize: "12px", height: "36px" }}
              >
                <option value="">Select a Space...</option>
                {boards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-[10px] text-slate-400">
                Documents belong inside a Space and can be shared globally.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="text-slate-500 font-bold text-[10px] uppercase d-block">Link Sharing</Form.Label>
              <Form.Check
                type="switch"
                id="modal-public-switch"
                label="Make document visible to all Workspace members"
                checked={newDocPublic}
                onChange={(e) => setNewDocPublic(e.target.checked)}
                className="text-slate-600 font-medium"
                style={{ fontSize: "11.5px" }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top border-slate-100 pt-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="text-xs font-semibold px-3 border-slate-200"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="sm"
              className="text-xs font-bold px-3 bg-purple-600 hover:bg-purple-700 border-none d-flex align-items-center gap-1.5"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Spinner size="sm" animation="border" style={{ width: "12px", height: "12px" }} />
                  Creating...
                </>
              ) : (
                "Create Doc"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDocToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message="Are you sure you want to permanently delete this document?"
        confirmText="Delete"
        loading={deletingDoc}
      />

      {/* Save as Template Modal */}
      <Modal
        show={showSaveTemplateModal}
        onHide={() => setShowSaveTemplateModal(false)}
        centered
        className="zbot-premium-modal"
      >
        <Form onSubmit={handleSaveAsTemplate}>
          <Modal.Header closeButton className="border-bottom border-slate-100 pb-2">
            <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: "16px" }}>
              Save Document as Template
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-3">
            <Form.Group className="mb-3">
              <Form.Label className="text-slate-500 font-bold text-[10px] uppercase">Template Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Monthly Expense Report"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                required
                className="text-xs border-slate-200"
                style={{ fontSize: "12px", height: "36px" }}
              />
            </Form.Group>
            <Form.Group className="mb-1">
              <Form.Label className="text-slate-500 font-bold text-[10px] uppercase">Description (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Brief summary of when to use this template"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                className="text-xs border-slate-200"
                style={{ fontSize: "12px", height: "36px" }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top border-slate-100 pt-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="text-xs font-semibold px-3 border-slate-200"
              onClick={() => setShowSaveTemplateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="sm"
              className="text-xs font-bold px-3 bg-purple-600 hover:bg-purple-700 border-none d-flex align-items-center gap-1.5"
              disabled={savingTemplate}
            >
              {savingTemplate ? (
                <>
                  <Spinner size="sm" animation="border" style={{ width: "12px", height: "12px" }} />
                  Saving...
                </>
              ) : (
                "Save Template"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete template confirmation modal */}
      <DeleteConfirmModal
        show={showDeleteTemplateModal}
        onHide={() => {
          setShowDeleteTemplateModal(false);
          setTemplateToDelete(null);
        }}
        onConfirm={handleDeleteTemplateConfirm}
        title="Delete Template"
        message={`Are you sure you want to delete the template "${templateToDelete?.name || ""}"?`}
        confirmText="Delete"
        loading={deletingTemplate}
      />
    </Container>
  );
};

export default DocsHubPage;
