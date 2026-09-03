import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  Spinner,
  Alert,
  Dropdown,
  Badge,
  Button,
  Tooltip,
  OverlayTrigger,
  Form,
  Modal
} from "react-bootstrap";
import { 
  Search, Filter, MoreHorizontal, Link as LinkIcon, 
  Trash2, Copy, Edit, Plus, CheckCircle, FileText, Download
} from "lucide-react";
import {
  getEnrollmentForms,
  createEnrollmentForm,
  deleteEnrollmentForm,
  copyEnrollmentForm,
  getEnrollmentSubmissions,
  deleteEnrollmentSubmission,
  approveSubmission
} from "../../../services/enrollmentService";
import { showSuccess, showError } from "../../../utils/notificationService";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import api from "../../../utils/api";

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="text-muted p-2 d-inline-block hover-bg-slate"
  >
    {children}
  </a>
));

const EnrollmentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("forms"); // "forms" or "submissions"
  const [submissionSubTab, setSubmissionSubTab] = useState("review"); // "review" (IN REVIEW) or "completed" (COMPLETED)
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'form' | 'submission', id, name }
  const [deleting, setDeleting] = useState(false);

  // View / Approve Submission Modal State
  const [viewSubmission, setViewSubmission] = useState(null);
  const [approving, setApproving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [formsData, submissionsData] = await Promise.all([
        getEnrollmentForms(),
        getEnrollmentSubmissions(),
      ]);
      setForms(formsData || []);
      setSubmissions(submissionsData || []);
    } catch (err) {
      setError("Failed to load enrollment data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateForm = async () => {
    try {
      const newForm = await createEnrollmentForm();
      showSuccess("New form template created!");
      navigate(`/admin/accounting/registration/forms/${newForm.id}`);
    } catch (err) {
      showError("Could not create form template.");
    }
  };

  const handleDeleteFormClick = (formId, formName, e) => {
    e.stopPropagation();
    setDeleteTarget({ type: "form", id: formId, name: formName });
    setShowDeleteModal(true);
  };

  const handleDeleteSubmissionClick = (submissionId, studentName, e) => {
    e.stopPropagation();
    setDeleteTarget({ type: "submission", id: submissionId, name: studentName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "form") {
        await deleteEnrollmentForm(deleteTarget.id);
        showSuccess("Form template deleted successfully.");
        setForms(forms.filter((f) => f.id !== deleteTarget.id));
      } else {
        await deleteEnrollmentSubmission(deleteTarget.id);
        showSuccess("Registration submission deleted successfully.");
        setSubmissions(submissions.filter((s) => s.id !== deleteTarget.id));
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      showError("Failed to delete target.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyForm = async (formId, e) => {
    e.stopPropagation();
    try {
      await copyEnrollmentForm(formId);
      showSuccess("Form template copied successfully!");
      fetchData();
    } catch (err) {
      showError("Failed to copy form template.");
    }
  };

  const handleCopyLink = (token, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/enrollment/${token}`;
    navigator.clipboard.writeText(url);
    showSuccess("Parent link copied to clipboard!");
  };

  const handleApproveSubmission = async (subId) => {
    try {
      setApproving(true);
      const res = await approveSubmission(subId);
      showSuccess(res.message || "Registration approved & contract linked to Student Profile!");
      setViewSubmission(null);
      fetchData();
    } catch (err) {
      showError("Failed to approve submission.");
    } finally {
      setApproving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter Submissions by status
  const inReviewSubmissions = submissions.filter(
    (s) => s.status !== "Completed" && s.status !== "APPROVED"
  );
  const completedSubmissions = submissions.filter(
    (s) => s.status === "Completed" || s.status === "APPROVED"
  );

  const hasUnapprovedSubmissions = inReviewSubmissions.length > 0;

  const filteredForms = forms.filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.recipient_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSubmissionsList =
    submissionSubTab === "review" ? inReviewSubmissions : completedSubmissions;

  const filteredSubmissions = currentSubmissionsList.filter((sub) =>
    (sub.lead_student_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sub.form_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const baseURL = api.defaults.baseURL || "";
  const baseStaticURL = baseURL.endsWith("/api") ? baseURL.slice(0, -4) : baseURL;

  return (
    <div className="py-4 px-md-4 bg-slate-50 min-vh-100 no-print">
      <style>{`
        .reg-tab-header {
          display: flex;
          align-items: center;
          gap: 2rem;
          border-bottom: 2px solid #E2E8F0;
          margin-bottom: 1.5rem;
        }
        .reg-tab-btn {
          background: none;
          border: none;
          color: #64748B;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.75rem 0.25rem;
          position: relative;
          transition: all 0.2s;
        }
        .reg-tab-btn:hover {
          color: #0F172A;
        }
        .reg-tab-btn.active {
          color: #0E7490;
        }
        .reg-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #0E7490;
        }
        .procare-search-container {
          position: relative;
          max-width: 340px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .procare-search-input {
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          font-size: 0.9rem;
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          width: 100%;
          outline: none;
          transition: border-color 0.15s;
        }
        .procare-search-input:focus {
          border-color: #0E7490;
        }
        .procare-search-icon {
          position: absolute;
          left: 0.75rem;
          color: #94A3B8;
        }
        .procare-filter-btn {
          background: none;
          border: none;
          color: #0E7490;
          padding: 6px;
          border-radius: 4px;
          transition: background 0.15s;
        }
        .procare-filter-btn:hover {
          background: #E2E8F0;
        }
        .procare-btn-primary {
          background-color: #007ba4;
          border-color: #007ba4;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .procare-btn-primary:hover {
          background-color: #006080;
          border-color: #006080;
        }
        .procare-table-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .procare-table thead {
          background-color: #F8FAFC;
        }
        .procare-table th {
          color: #475569;
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid #E2E8F0;
        }
        .procare-table td {
          padding: 0.9rem 1.25rem;
          font-size: 0.88rem;
          vertical-align: middle;
          border-bottom: 1px solid #F1F5F9;
        }
        .procare-table tr:last-child td {
          border-bottom: none;
        }
        .procare-link {
          color: #007ba4;
          font-weight: 500;
          text-decoration: none;
        }
        .procare-link:hover {
          text-decoration: underline;
        }
        .submission-metrics-container {
          display: flex;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
          background: #FFFFFF;
          margin-bottom: 1.5rem;
        }
        .submission-metric-btn {
          flex: 1;
          padding: 1.2rem 1.5rem;
          border: none;
          background: #FFFFFF;
          text-align: center;
          cursor: pointer;
          transition: background 0.15s;
        }
        .submission-metric-btn:first-child {
          border-right: 1px solid #E2E8F0;
        }
        .submission-metric-btn.active {
          background: #E0F2FE;
        }
        .metric-num {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0F172A;
          display: block;
        }
        .metric-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0284C7;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      `}</style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold text-slate-800 mb-0" style={{ fontSize: "24px" }}>Registration</h1>
        <Button onClick={handleCreateForm} className="procare-btn-primary d-flex align-items-center gap-1">
          <Plus size={16} /> CREATE REGISTRATION
        </Button>
      </div>

      {/* Top Main Tabs */}
      <div className="reg-tab-header">
        <button
          className={`reg-tab-btn ${activeTab === "forms" ? "active" : ""}`}
          onClick={() => setActiveTab("forms")}
        >
          Registration Forms
        </button>
        <button
          className={`reg-tab-btn ${activeTab === "submissions" ? "active" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          Submitted Registrations {hasUnapprovedSubmissions && <span className="text-danger fw-bold ms-1" style={{ fontSize: "14px" }}>•</span>}
        </button>
      </div>

      {/* Submissions Metrics Bar (Matching Image 2 & 4) */}
      {activeTab === "submissions" && (
        <div className="submission-metrics-container">
          <button
            className={`submission-metric-btn ${submissionSubTab === "review" ? "active" : ""}`}
            onClick={() => setSubmissionSubTab("review")}
          >
            <span className="metric-num">{inReviewSubmissions.length}</span>
            <span className="metric-label">IN REVIEW</span>
          </button>
          <button
            className={`submission-metric-btn ${submissionSubTab === "completed" ? "active" : ""}`}
            onClick={() => setSubmissionSubTab("completed")}
          >
            <span className="metric-num">{completedSubmissions.length}</span>
            <span className="metric-label">COMPLETED</span>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border border-slate-200">
        <div className="procare-search-container">
          <Search className="procare-search-icon" size={16} />
          <input
            type="text"
            placeholder={activeTab === "forms" ? "Search forms..." : "Search by form, lead or student name"}
            className="procare-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="procare-filter-btn">
            <Filter size={18} />
          </button>
        </div>
        <div className="small text-slate-500">
          SHOWING {activeTab === "forms" ? filteredForms.length : filteredSubmissions.length} RESULTS
        </div>
      </div>

      {/* Table Section */}
      <div className="procare-table-card">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: "#007ba4" }} />
          </div>
        ) : error ? (
          <Alert variant="danger" className="m-3">{error}</Alert>
        ) : activeTab === "forms" ? (
          /* --- Registration Forms Table --- */
          <Table responsive className="procare-table align-middle mb-0">
            <thead>
              <tr>
                <th>NAME</th>
                <th>FORM TYPE</th>
                <th>DATE CREATED</th>
                <th>FORM STATUS</th>
                <th className="text-center">SENT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.length > 0 ? (
                filteredForms.map((form) => (
                  <tr key={form.id}>
                    <td>
                      <Link
                        to={`/admin/accounting/registration/forms/${form.id}`}
                        className="procare-link"
                      >
                        {form.name}
                      </Link>
                    </td>
                    <td>{form.recipient_type}</td>
                    <td>{formatDate(form.created_at)}</td>
                    <td>
                      <Badge
                        bg={form.status === "Active" ? "success" : "secondary"}
                        style={{ fontSize: "0.75rem", padding: "0.3em 0.6em" }}
                      >
                        {form.status}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <span className="fw-semibold text-slate-700">
                        {submissions.filter((s) => s.form_id === form.id).length}
                      </span>
                    </td>
                    <td className="text-end">
                      <Dropdown align="end">
                        <Dropdown.Toggle as={CustomToggle}>
                          <MoreHorizontal size={18} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow border-slate-200">
                          <Dropdown.Item
                            as={Link}
                            to={`/admin/accounting/registration/forms/${form.id}`}
                          >
                            <Edit size={14} className="me-2 text-slate-500" /> Edit
                          </Dropdown.Item>
                          <Dropdown.Item onClick={(e) => handleCopyForm(form.id, e)}>
                            <Copy size={14} className="me-2 text-slate-500" /> Copy
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item
                            onClick={(e) => handleDeleteFormClick(form.id, form.name, e)}
                            className="text-danger"
                          >
                            <Trash2 size={14} className="me-2" /> Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-slate-400">
                    No registration forms found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        ) : (
          /* --- Submitted Registrations Table --- */
          <Table responsive className="procare-table align-middle mb-0">
            <thead>
              <tr>
                <th>FORM NAME</th>
                <th>FROM</th>
                <th>AMOUNT</th>
                <th>DATE RECEIVED</th>
                <th>FORM STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub) => {
                  const pdfUrl = `${baseStaticURL}/api/enrollment/submission/${sub.secure_token}/pdf`;
                  const isApproved = sub.status === "Completed" || sub.status === "APPROVED";

                  return (
                    <tr key={sub.id}>
                      <td>
                        <button
                          onClick={() => setViewSubmission(sub)}
                          className="procare-link bg-transparent border-0 p-0 text-start"
                        >
                          {sub.form_name}
                        </button>
                      </td>
                      <td>
                        <strong className="text-slate-800 d-block">{sub.lead_student_name || "Form Submitter"}</strong>
                        <span className="small text-slate-400">Web Link Submission</span>
                      </td>
                      <td>
                        {sub.payment_status === "Paid" ? (
                          <span className="text-slate-700 fw-semibold">Paid ${sub.fee_amount || 0}</span>
                        ) : (
                          <span className="text-slate-500">No Fee</span>
                        )}
                      </td>
                      <td>{formatDate(sub.submitted_at || sub.sent_at)}</td>
                      <td>
                        {isApproved ? (
                          <Badge bg="success" style={{ fontSize: "0.75rem", padding: "0.4em 0.7em" }}>
                            APPROVED
                          </Badge>
                        ) : (
                          <Badge bg="info" style={{ fontSize: "0.75rem", padding: "0.4em 0.7em" }}>
                            NEW
                          </Badge>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <OverlayTrigger overlay={<Tooltip>Copy Link</Tooltip>}>
                            <Button
                              variant="light"
                              size="sm"
                              className="p-1 text-slate-500 hover-bg-slate border-0"
                              onClick={(e) => handleCopyLink(sub.secure_token, e)}
                            >
                              <LinkIcon size={16} />
                            </Button>
                          </OverlayTrigger>
                          <Dropdown align="end">
                            <Dropdown.Toggle as={CustomToggle}>
                              <MoreHorizontal size={18} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow border-slate-200">
                              <Dropdown.Item onClick={() => setViewSubmission(sub)}>
                                <FileText size={14} className="me-2 text-slate-500" /> View Submission
                              </Dropdown.Item>
                              <Dropdown.Item href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download size={14} className="me-2 text-slate-500" /> Download Signed Contract
                              </Dropdown.Item>
                              {!isApproved && (
                                <Dropdown.Item 
                                  onClick={() => handleApproveSubmission(sub.id)} 
                                  className="text-success fw-bold"
                                >
                                  <CheckCircle size={14} className="me-2" /> Approve Registration
                                </Dropdown.Item>
                              )}
                              <Dropdown.Divider />
                              <Dropdown.Item onClick={(e) => handleDeleteSubmissionClick(sub.id, sub.lead_student_name, e)} className="text-danger">
                                <Trash2 size={14} className="me-2" /> Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-slate-400">
                    No submissions found under this section.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === "form" ? "Delete Registration Form" : "Delete Registration Submission"}
        message={
          deleteTarget?.type === "form"
            ? `Are you sure you want to permanently delete the form "${deleteTarget.name}"?`
            : `Are you sure you want to permanently delete the submission for "${deleteTarget?.name}"?`
        }
        loading={deleting}
      />

      {/* View & Approve Submission Modal */}
      {viewSubmission && (
        <Modal show={true} onHide={() => setViewSubmission(null)} size="lg" centered>
          <Modal.Header closeButton className="border-bottom pb-3">
            <Modal.Title style={{ fontSize: "18px", fontWeight: "700" }}>
              📋 Registration Submission Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
              <div>
                <h5 className="fw-bold text-slate-800 mb-1">{viewSubmission.form_name}</h5>
                <span className="text-muted small">Student: <strong>{viewSubmission.lead_student_name}</strong></span>
              </div>
              <Badge 
                bg={(viewSubmission.status === "Completed" || viewSubmission.status === "APPROVED") ? "success" : "info"}
                style={{ fontSize: "11px", padding: "0.4em 0.8em" }}
              >
                {viewSubmission.status}
              </Badge>
            </div>

            {/* Submission Answers */}
            <div className="bg-slate-50 p-3 rounded-3 border border-slate-200 mb-4">
              <h6 className="fw-bold text-slate-700 mb-3 border-bottom pb-2">Submitted Responses</h6>
              {viewSubmission.responses_json && typeof viewSubmission.responses_json === "object" ? (
                Object.entries(viewSubmission.responses_json).map(([key, val]) => {
                  if (key === "parent_signature") {
                    return (
                      <div key={key} className="mb-3">
                        <strong className="text-slate-700 d-block mb-1">Parent Digital Signature:</strong>
                        <div className="border rounded bg-white p-2 d-inline-block">
                          <img src={val} alt="Parent Signature" style={{ maxHeight: "80px" }} />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="d-flex justify-content-between py-1 border-bottom border-slate-200 text-slate-700 small">
                      <span className="fw-semibold">{key.replace(/_/g, " ")}:</span>
                      <span>{String(val)}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted small mb-0">No response details recorded.</p>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between">
            <a 
              href={`${baseStaticURL}/api/enrollment/submission/${viewSubmission.secure_token}/pdf`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            >
              <Download size={14} /> Download Contract PDF
            </a>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" onClick={() => setViewSubmission(null)}>
                Close
              </Button>
              {(viewSubmission.status !== "Completed" && viewSubmission.status !== "APPROVED") && (
                <Button 
                  style={{ backgroundColor: "#007ba4", borderColor: "#007ba4" }} 
                  size="sm" 
                  disabled={approving}
                  onClick={() => handleApproveSubmission(viewSubmission.id)}
                  className="d-flex align-items-center gap-1"
                >
                  {approving ? <Spinner animation="border" size="sm" /> : <><CheckCircle size={14} /> Approve & Link to Profile</>}
                </Button>
              )}
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default EnrollmentDashboard;
