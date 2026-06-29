import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Table, Button, Form, Modal, Dropdown, Spinner, Alert } from "react-bootstrap";
import { 
  FileText, Plus, Search, Folder, Calendar, Sparkles, MoreHorizontal, 
  Trash2, Globe, Users, ArrowUpRight, Shield, Eye
} from "lucide-react";
import { useWorkspace } from "../../components/admin/workspace/WorkspaceLayout";
import { useAuth } from "../../context/AuthContext";
import { getAllWorkspaceDocs, createWorkspaceDoc, deleteWorkspaceDoc } from "../../services/boardService";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import DocsView from "../../components/admin/workspace/DocsView";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";

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

  useEffect(() => {
    if (!urlDocId) {
      fetchDocs();
    }
  }, [urlDocId]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await getAllWorkspaceDocs();
      setDocs(data);
    } catch (err) {
      console.error("Failed to load documents", err);
      setError("Failed to load workspace documents.");
    } finally {
      setLoading(false);
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
    setNewDocTitle(template ? `New ${template.label}` : "");
    if (boards && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    } else {
      setSelectedBoardId("");
    }
    setNewDocPublic(true);
    setShowCreateModal(true);
  };

  const handleCreateDoc = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBoardId) {
      toast.error("Please select a Space");
      return;
    }
    const title = newDocTitle.trim() || "Untitled Document";
    
    let initialHtml = "<p>Start writing your document notes here...</p>";
    if (newDocTemplate) {
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
      
      // Navigate to the standalone doc editor
      navigate(`/admin/docs?docId=${newDoc.id}`);
    } catch (err) {
      console.error("Failed to create document", err);
      toast.error("Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  // Filter docs
  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      // 1. Search Query
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (doc.location_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Tab Filter
      if (activeTab === "mine") {
        return doc.created_by_name === user?.name;
      }
      if (activeTab === "shared") {
        // Document is shared with me if I didn't create it, but have access
        const notMine = doc.created_by_name !== user?.name;
        const isSharedUser = (doc.shared_user_ids || []).includes(user?.id);
        const userDeptIds = departments ? departments.map(d => d.id) : []; // simple fallback
        const isSharedDept = (doc.shared_dept_ids || []).some(id => userDeptIds.includes(id));
        return notMine && (isSharedUser || isSharedDept || doc.is_public);
      }
      return true;
    });
  }, [docs, searchQuery, activeTab, user, departments]);

  const TEMPLATES = [
    {
      type: "project_overview",
      label: "Project Overview",
      desc: "Summarize goals, scope, and milestones.",
      icon: Sparkles,
      color: "#a855f7", // purple
      html: `
        <h2>Project Overview</h2>
        <p><strong>Goal:</strong> Define the main objectives of this project.</p>
        <p><strong>Scope:</strong> Outline features and constraints.</p>
        <p><strong>Milestones:</strong></p>
        <ul>
          <li>Phase 1: Planning & Design</li>
          <li>Phase 2: Core Development</li>
          <li>Phase 3: Testing & Launch</li>
        </ul>
      `
    },
    {
      type: "meeting_notes",
      label: "Meeting Notes",
      desc: "Capture an agenda, notes, and action items.",
      icon: Calendar,
      color: "#f59e0b", // amber
      html: `
        <h2>Meeting Notes</h2>
        <p><strong>Date:</strong> ${format(new Date(), "MMMM dd, yyyy")}</p>
        <p><strong>Attendees:</strong> Participant A, Participant B</p>
        <hr/>
        <p><strong>Agenda:</strong></p>
        <ol>
          <li>Status Updates</li>
          <li>Blockers & Issues</li>
          <li>Next steps</li>
        </ol>
        <p><strong>Action Items:</strong></p>
        <p>[ ] Follow up on design reviews</p>
      `
    },
    {
      type: "wiki",
      label: "Wiki",
      desc: "Organize information in one place.",
      icon: Folder,
      color: "#3b82f6", // blue
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
    <Container fluid className="px-4 py-4 bg-slate-50/20" style={{ minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold text-slate-800 m-0" style={{ fontSize: "22px" }}>All Docs</h1>
          <span className="text-slate-400 text-xs">Create and manage documents, wikis, and notes across all Spaces</span>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="d-flex align-items-center gap-1 text-slate-600 font-semibold border-slate-200"
            onClick={() => toast.info("Import flow is a mock visualization")}
          >
            <ArrowUpRight size={14} /> Import
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            className="d-flex align-items-center gap-1 font-bold px-3 shadow-sm bg-purple-600 hover:bg-purple-700 border-none"
            onClick={() => handleOpenCreateModal()}
          >
            <Plus size={15} /> New Doc
          </Button>
        </div>
      </div>

      {/* Templates Row */}
      <div className="mb-4">
        <span className="text-slate-400 font-bold d-block text-[10px] uppercase tracking-wider mb-2.5">Quick Templates</span>
        <Row className="g-3">
          {TEMPLATES.map(t => {
            const IconComponent = t.icon;
            return (
              <Col key={t.type} xs={12} md={4}>
                <Card 
                  className="border-slate-100 hover:border-purple-200 transition-all cursor-pointer shadow-sm rounded-3 hover:translate-y-[-2px]"
                  style={{ transition: "all 0.2s" }}
                  onClick={() => handleOpenCreateModal(t)}
                >
                  <Card.Body className="d-flex align-items-start gap-3 p-3">
                    <div 
                      className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "38px", height: "38px", backgroundColor: `${t.color}15`, color: t.color }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-slate-800 mb-1" style={{ fontSize: "13px" }}>{t.label}</h6>
                      <span className="text-slate-400 d-block text-[11px] leading-snug">{t.desc}</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Main filterable list card */}
      <Card className="border-slate-100 shadow-sm rounded-3">
        <Card.Header className="bg-white border-bottom border-slate-100 p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3">
            {/* Tabs */}
            <div className="d-flex border-bottom border-slate-100" style={{ gap: "20px" }}>
              <button 
                className={`pb-2 border-bottom fw-bold text-xs ${activeTab === "all" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                onClick={() => setActiveTab("all")}
                style={{ background: "none", border: "none", fontSize: "12px", outline: "none" }}
              >
                All Docs
              </button>
              <button 
                className={`pb-2 border-bottom fw-bold text-xs ${activeTab === "mine" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                onClick={() => setActiveTab("mine")}
                style={{ background: "none", border: "none", fontSize: "12px", outline: "none" }}
              >
                My Docs
              </button>
              <button 
                className={`pb-2 border-bottom fw-bold text-xs ${activeTab === "shared" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                onClick={() => setActiveTab("shared")}
                style={{ background: "none", border: "none", fontSize: "12px", outline: "none" }}
              >
                Shared with me
              </button>
            </div>

            {/* Search */}
            <div className="position-relative" style={{ maxWidth: "280px" }}>
              <span className="position-absolute top-50 start-0 translate-middle-y ps-2.5 text-slate-400">
                <Search size={13} />
              </span>
              <Form.Control
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-5 text-xs border-slate-200"
                style={{ fontSize: "12px", height: "32px", borderRadius: "6px" }}
              />
            </div>
          </div>
        </Card.Header>

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 my-3">
            <Spinner animation="border" variant="primary" size="sm" className="mb-2" />
            <span className="text-slate-400 text-xs">Loading documents...</span>
          </div>
        ) : error ? (
          <div className="p-4">
            <Alert variant="danger" className="text-xs m-0">{error}</Alert>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-5 my-3">
            <FileText size={36} className="text-slate-300 mb-2" />
            <h6 className="fw-bold text-slate-700 mb-1" style={{ fontSize: "13px" }}>No documents found</h6>
            <span className="text-slate-400 text-xs d-block mb-3">Try checking filters or create a new document.</span>
            <Button variant="primary" size="sm" onClick={() => handleOpenCreateModal()} className="font-semibold bg-purple-600 border-none">
              Create Document
            </Button>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover align="middle" className="text-slate-700 m-0 align-middle">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-bold border-bottom text-[9px] uppercase tracking-wider">
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
                          <span className="font-bold text-slate-800 hover:text-purple-600 transition-colors" style={{ fontSize: "12px" }}>
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="badge bg-slate-100 border border-slate-200/60 font-semibold px-2 py-1 rounded-2" style={{ fontSize: "10px", color: "#475569" }}>
                          {doc.location_name || "Workspace Space"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-medium" style={{ fontSize: "11.5px" }}>
                        {doc.created_by_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-medium" style={{ fontSize: "11.5px" }}>
                        {doc.updated_at ? format(parseISO(doc.updated_at), "MMM dd, yyyy HH:mm") : "Recently"}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="d-flex align-items-center gap-1.5">
                          {doc.is_public ? (
                            <span title="Public View Link Sharing Enabled" className="text-emerald-600 d-inline-flex align-items-center gap-0.5">
                              <Globe size={11} /> <span className="text-[9px] font-bold">Public</span>
                            </span>
                          ) : isSharedList ? (
                            <span title="Shared with specific members/depts" className="text-purple-600 d-inline-flex align-items-center gap-0.5">
                              <Users size={11} /> <span className="text-[9px] font-bold">Shared</span>
                            </span>
                          ) : (
                            <span title="Private to Space" className="text-slate-400 d-inline-flex align-items-center gap-0.5">
                              <Shield size={11} /> <span className="text-[9px] font-bold">Private</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-end" onClick={(e) => e.stopPropagation()}>
                        <Dropdown align="end">
                           <Dropdown.Toggle as={React.forwardRef(({ children, onClick }, ref) => (
                            <button
                              ref={ref}
                              onClick={onClick}
                              className="btn btn-link btn-sm p-1 text-slate-400 hover:text-slate-600 border-none outline-none"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                          ))} />
                          <Dropdown.Menu className="shadow border-slate-200 rounded-3 py-1" style={{ fontSize: "12px" }}>
                            <Dropdown.Item 
                              className="d-flex align-items-center gap-2 py-1.5 px-3"
                              onClick={() => navigate(`/admin/docs?docId=${doc.id}`)}
                            >
                              <Eye size={12} /> Open Document
                            </Dropdown.Item>
                            <Dropdown.Divider className="my-1 border-slate-100" />
                            <Dropdown.Item 
                              className="d-flex align-items-center gap-2 py-1.5 px-3 text-danger"
                              onClick={(e) => handleDelete(doc, e)}
                              disabled={deletingDocId === doc.id}
                            >
                              {deletingDocId === doc.id ? (
                                <>
                                  <Spinner size="sm" animation="border" style={{ width: "10px", height: "10px" }} />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 size={12} /> Delete Doc
                                </>
                              )}
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
        )}
      </Card>

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
              {newDocTemplate ? `Create Doc from Template` : "Create New Document"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-3">
            <Form.Group className="mb-3">
              <Form.Label className="text-slate-500 font-bold text-[10px] uppercase">Document Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Q3 Roadmap Planning"
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
    </Container>
  );
};

export default DocsHubPage;
