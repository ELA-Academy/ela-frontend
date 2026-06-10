import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../../components/admin/PageHeader";
import {
  Tabs,
  Tab,
  Table,
  Spinner,
  Alert,
  Dropdown,
  Badge,
  Button,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { ThreeDotsVertical, Link45deg } from "react-bootstrap-icons";
import {
  getEnrollmentForms,
  createEnrollmentForm,
  deleteEnrollmentForm,
  copyEnrollmentForm,
  getEnrollmentSubmissions,
  deleteEnrollmentSubmission,
  resendSubmissionEmail,
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
    className="text-muted"
  >
    {children}
  </a>
));

const EnrollmentDashboard = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [formsData, submissionsData] = await Promise.all([
        getEnrollmentForms(),
        getEnrollmentSubmissions(),
      ]);
      setForms(formsData);
      setSubmissions(submissionsData);
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
      showSuccess("New form draft created!");
      navigate(`/admin/enrollment/forms/${newForm.id}`);
    } catch (err) {
      showError("Could not create form.");
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'form' | 'submission', id, name }
  const [deleting, setDeleting] = useState(false);

  const handleDeleteFormClick = (formId, formName) => {
    setDeleteTarget({ type: "form", id: formId, name: formName });
    setShowDeleteModal(true);
  };

  const handleDeleteSubmissionClick = (submissionId, studentName) => {
    setDeleteTarget({ type: "submission", id: submissionId, name: studentName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "form") {
        await deleteEnrollmentForm(deleteTarget.id);
        showSuccess("Form deleted successfully.");
      } else {
        await deleteEnrollmentSubmission(deleteTarget.id);
        showSuccess("Submission deleted.");
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showError(`Failed to delete ${deleteTarget.type}.`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyForm = async (formId) => {
    try {
      await copyEnrollmentForm(formId);
      showSuccess("Form copied successfully.");
      fetchData();
    } catch (err) {
      showError("Failed to copy form.");
    }
  };

  const handleResendEmail = async (submissionId) => {
    try {
      await resendSubmissionEmail(submissionId);
      showSuccess("Enrollment email has been resent.");
    } catch (err) {
      showError(err.response?.data?.error || "Failed to resend email.");
    }
  };

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/enrollment/${token}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showSuccess("Link copied to clipboard!");
      })
      .catch((err) => {
        showError("Failed to copy link.");
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      Sent: "info",
      Opened: "primary",
      Submitted: "warning",
      Completed: "success",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const renderFormsTable = () => {
    return (
      <Table responsive className="modern-table">
        <thead>
          <tr>
            <th>Form Name</th>
            <th>Type</th>
            <th>Date Created</th>
            <th>Status</th>
            <th>Sent</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {forms.length > 0 ? (
            forms.map((form) => (
              <tr key={form.id}>
                <td>
                  <Link
                    to={`/admin/enrollment/forms/${form.id}`}
                    className="fw-bold"
                  >
                    {form.name}
                  </Link>
                </td>
                <td>{form.recipient_type}</td>
                <td>{formatDate(form.created_at)}</td>
                <td>
                  <Badge
                    bg={form.status === "Active" ? "success" : "secondary"}
                  >
                    {form.status}
                  </Badge>
                </td>
                <td>
                  {submissions.filter((s) => s.form_id === form.id).length}
                </td>
                <td className="text-end">
                  <Dropdown align="end">
                    <Dropdown.Toggle as={CustomToggle}>
                      <ThreeDotsVertical size={20} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        as={Link}
                        to={`/admin/enrollment/forms/${form.id}`}
                      >
                        Edit
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleCopyForm(form.id)}>
                        Copy
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item
                        onClick={() => handleDeleteFormClick(form.id, form.name)}
                        className="text-danger"
                      >
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center p-5">
                No enrollment forms have been created yet.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    );
  };

  const renderSubmissionsTable = () => {
    return (
      <Table responsive className="modern-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Form Name</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Date Sent</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {submissions.length > 0 ? (
            submissions.map((sub) => (
              <tr key={sub.id}>
                <td>
                  <strong>{sub.lead_student_name}</strong>
                </td>
                <td>{sub.form_name}</td>
                <td>{getStatusBadge(sub.status)}</td>
                <td>
                  <Badge
                    bg={
                      sub.payment_status === "Paid"
                        ? "success-light"
                        : "warning-light"
                    }
                    text={sub.payment_status === "Paid" ? "success" : "warning"}
                  >
                    {sub.payment_status}
                  </Badge>
                </td>
                <td>{formatDate(sub.sent_at)}</td>
                <td className="text-end action-buttons">
                  <OverlayTrigger overlay={<Tooltip>Copy Parent Link</Tooltip>}>
                    <Button
                      variant="link"
                      onClick={() => handleCopyLink(sub.secure_token)}
                    >
                      <Link45deg size={22} />
                    </Button>
                  </OverlayTrigger>
                  <Dropdown align="end">
                    <Dropdown.Toggle as={CustomToggle}>
                      <ThreeDotsVertical size={20} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item href="#">View Submission</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleResendEmail(sub.id)}>
                        Resend Email
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item
                        onClick={() =>
                          handleDeleteSubmissionClick(sub.id, sub.lead_student_name)
                        }
                        className="text-danger"
                      >
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center p-5">
                No forms have been sent to recipients yet.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    );
  };

  return (
    <div>
      <PageHeader
        title="Enrollment Management"
        buttonText="Create New Form"
        onButtonClick={handleCreateForm}
      />
      {loading ? (
        <div className="text-center p-5">
          <Spinner />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Tabs defaultActiveKey="forms" id="enrollment-tabs" className="mb-3">
          <Tab eventKey="forms" title="Registration Forms">
            <div className="content-card">{renderFormsTable()}</div>
          </Tab>
          <Tab
            eventKey="submissions"
            title={`Submitted Registrations (${submissions.length})`}
          >
            <div className="content-card">{renderSubmissionsTable()}</div>
          </Tab>
        </Tabs>
      )}
      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === "form" ? "Delete Registration Form" : "Delete Registration Submission"}
        message={deleteTarget?.type === "form" 
          ? `Are you sure you want to permanently delete the form "${deleteTarget.name}"?` 
          : `Are you sure you want to permanently delete the registration submission for "${deleteTarget?.name}"?`}
        loading={deleting}
      />
    </div>
  );
};

export default EnrollmentDashboard;
