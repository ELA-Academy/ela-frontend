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
  Form
} from "react-bootstrap";
import { 
  Search, Filter, MoreHorizontal, Link as LinkIcon, 
  Trash2, Copy, Edit, Plus
} from "lucide-react";
import {
  getEnrollmentForms,
  createEnrollmentForm,
  deleteEnrollmentForm,
  copyEnrollmentForm,
  getEnrollmentSubmissions,
  deleteEnrollmentSubmission,
} from "../../../services/enrollmentService";
import { showSuccess, showError } from "../../../utils/notificationService";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";

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
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'form' | 'submission', id, name }
  const [deleting, setDeleting] = useState(false);

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

  const filteredForms = forms.filter(form => 
    form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.recipient_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(sub => 
    sub.lead_student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.form_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-4 px-md-4 bg-slate-50 min-vh-100 no-print">
      {/* Dynamic Style injection for premium Procare aesthetics */}
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
          max-width: 320px;
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
          background-color: #007ba4; /* Procare primary blue button */
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
      `}</style>

      {/* Title & Top Right Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold text-slate-800 mb-0" style={{ fontSize: "24px" }}>Registration</h1>
        <Button onClick={handleCreateForm} className="procare-btn-primary d-flex align-items-center gap-1">
          <Plus size={16} /> CREATE REGISTRATION
        </Button>
      </div>

      {/* Tabs */}
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
          Submitted Registrations
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border border-slate-200">
        <div className="procare-search-container">
          <Search className="procare-search-icon" size={16} />
          <input
            type="text"
            placeholder={activeTab === "forms" ? "Search forms..." : "Search submissions..."}
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
                <th>STUDENT NAME</th>
                <th>FORM NAME</th>
                <th>FORM STATUS</th>
                <th>PAYMENT</th>
                <th>DATE SENT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong className="text-slate-800">{sub.lead_student_name}</strong>
                    </td>
                    <td>{sub.form_name}</td>
                    <td>
                      <Badge
                        bg={sub.status === "Submitted" ? "success" : "secondary"}
                        style={{ fontSize: "0.75rem", padding: "0.3em 0.6em" }}
                      >
                        {sub.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        bg={sub.payment_status === "Paid" ? "success-light" : "warning-light"}
                        text={sub.payment_status === "Paid" ? "success" : "warning"}
                        style={{ fontSize: "0.75rem", padding: "0.3em 0.6em" }}
                      >
                        {sub.payment_status}
                      </Badge>
                    </td>
                    <td>{formatDate(sub.sent_at)}</td>
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
                            <Dropdown.Item onClick={(e) => handleDeleteSubmissionClick(sub.id, sub.lead_student_name, e)} className="text-danger">
                              <Trash2 size={14} className="me-2" /> Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-slate-400">
                    No submissions found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

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
    </div>
  );
};

export default EnrollmentDashboard;
