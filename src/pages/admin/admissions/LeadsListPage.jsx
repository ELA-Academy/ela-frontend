import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dropdown, Button, Modal, Form, Row, Col, Spinner } from "react-bootstrap";
import { ThreeDotsVertical, PersonCheckFill } from "react-bootstrap-icons";
import {
  getAllLeads,
  convertLeadToStudent,
  createManualLead,
} from "../../../services/admissionsService";
import { showSuccess, showError } from "../../../utils/notificationService";
import PageHeader from "../../../components/admin/PageHeader";
import { TableSkeleton } from "../../../components/Skeleton";
import "../../../styles/AdminModern.css";
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

const LeadsListPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Lead Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    student_first_name: "",
    student_last_name: "",
    date_of_birth: "",
    grade_level: "Kindergarten",
    city_state: "",
    parent_first_name: "",
    parent_last_name: "",
    parent_email: "",
    parent_phone: "",
    status: "Interested",
    internal_notes: "",
  });

  const gradeLevels = [
    "Kindergarten",
    "1st Grade",
    "2nd Grade",
    "3rd Grade",
    "4th Grade",
    "5th Grade",
    "6th Grade",
    "7th Grade",
    "8th Grade",
    "9th Grade",
    "10th Grade",
    "11th Grade",
    "12th Grade",
  ];

  const leadStatusOptions = [
    "Interested",
    "Waitlisted",
    "Toured",
    "Admitted",
  ];

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await getAllLeads();
      setLeads(data);
    } catch (err) {
      setError("Failed to fetch leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLeadSubmit = async (e) => {
    e.preventDefault();
    if (!newLeadForm.student_first_name.trim() || !newLeadForm.student_last_name.trim()) {
      showError("Student first and last names are required.");
      return;
    }
    if (!newLeadForm.parent_first_name.trim() || !newLeadForm.parent_last_name.trim() || !newLeadForm.parent_email.trim()) {
      showError("Parent/Guardian name and email are required.");
      return;
    }

    try {
      setCreatingLead(true);
      await createManualLead(newLeadForm);
      showSuccess("Prospective lead created successfully!");
      setShowCreateModal(false);
      setNewLeadForm({
        student_first_name: "",
        student_last_name: "",
        date_of_birth: "",
        grade_level: "Kindergarten",
        city_state: "",
        parent_first_name: "",
        parent_last_name: "",
        parent_email: "",
        parent_phone: "",
        status: "Interested",
        internal_notes: "",
      });
      fetchLeads();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to create lead.");
    } finally {
      setCreatingLead(false);
    }
  };

  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteTargetId, setPromoteTargetId] = useState(null);
  const [promoting, setPromoting] = useState(false);

  const handlePromoteClick = (leadId) => {
    setPromoteTargetId(leadId);
    setShowPromoteModal(true);
  };

  const handleConfirmPromote = async () => {
    setPromoting(true);
    try {
      await convertLeadToStudent(promoteTargetId);
      showSuccess("Lead successfully promoted to student!");
      setShowPromoteModal(false);
      setPromoteTargetId(null);
      fetchLeads();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to promote lead.");
    } finally {
      setPromoting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Date(dateString)
      .toLocaleString("en-US", options)
      .replace(",", "");
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Manage Leads" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <PageHeader
        title={`Manage Leads (${leads.length})`}
        buttonText="Add New Lead"
        onButtonClick={() => setShowCreateModal(true)}
      />
      <div className="content-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Created Date</th>
              <th>Student Name(s)</th>
              <th>Parent(s)</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{formatDate(lead.created_at)}</td>
                  <td>
                    <Link
                      to={`/admin/admissions/leads/${lead.secure_token}`}
                      className="text-primary fw-bold"
                    >
                      {lead.students
                        .map((s) => `${s.first_name} ${s.last_name}`)
                        .join(", ")}
                    </Link>
                  </td>
                  <td>
                    {lead.parents
                      .map((p) => `${p.first_name} ${p.last_name}`)
                      .join(", ")}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${lead.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <Dropdown align="end">
                      <Dropdown.Toggle as={CustomToggle}>
                        <ThreeDotsVertical size={20} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu popperConfig={{ strategy: "fixed" }}>
                        <Dropdown.Item
                          as={Link}
                          to={`/admin/admissions/leads/${lead.secure_token}`}
                        >
                          View Details
                        </Dropdown.Item>
                        {lead.status !== "Enrolled" && (
                          <Dropdown.Item onClick={() => handlePromoteClick(lead.id)}>
                            <PersonCheckFill className="me-2" /> Promote to
                            Student
                          </Dropdown.Item>
                        )}
                        <Dropdown.Divider />
                        <Dropdown.Item href="#" className="text-danger">
                          Archive Lead
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-5">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Add Lead Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <div>
            <Modal.Title className="fw-bold fs-5 text-slate-800">Add Prospective Lead</Modal.Title>
            <p className="text-muted small mb-0">
              Record a new prospective student & parent inquiry from a phone call or in-person visit.
            </p>
          </div>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form onSubmit={handleCreateLeadSubmit}>
            <div className="p-3 bg-light rounded-3 mb-3 border">
              <h6 className="fw-bold text-slate-700 mb-2" style={{ fontSize: "0.85rem", letterSpacing: "0.03em" }}>
                STUDENT DETAILS
              </h6>
              <Row className="g-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">First Name *</Form.Label>
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="e.g. Liam"
                      value={newLeadForm.student_first_name}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, student_first_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">Last Name *</Form.Label>
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="e.g. Johnson"
                      value={newLeadForm.student_last_name}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, student_last_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">Date of Birth</Form.Label>
                    <Form.Control
                      size="sm"
                      type="date"
                      value={newLeadForm.date_of_birth}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, date_of_birth: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">Grade Level</Form.Label>
                    <Form.Select
                      size="sm"
                      value={newLeadForm.grade_level}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, grade_level: e.target.value })}
                    >
                      {gradeLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">City / State</Form.Label>
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="e.g. Houston, TX"
                      value={newLeadForm.city_state}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, city_state: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="p-3 bg-light rounded-3 mb-3 border">
              <h6 className="fw-bold text-slate-700 mb-2" style={{ fontSize: "0.85rem", letterSpacing: "0.03em" }}>
                PARENT / PRIMARY CONTACT
              </h6>
              <Row className="g-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">First Name *</Form.Label>
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="e.g. Sarah"
                      value={newLeadForm.parent_first_name}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, parent_first_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">Last Name *</Form.Label>
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="e.g. Johnson"
                      value={newLeadForm.parent_last_name}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, parent_last_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">Email Address *</Form.Label>
                    <Form.Control
                      size="sm"
                      type="email"
                      placeholder="e.g. parent@example.com"
                      value={newLeadForm.parent_email}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, parent_email: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">Phone Number</Form.Label>
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="e.g. (555) 019-2834"
                      value={newLeadForm.parent_phone}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, parent_phone: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="p-3 bg-light rounded-3 mb-3 border">
              <Row className="g-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">Initial Status</Form.Label>
                    <Form.Select
                      size="sm"
                      value={newLeadForm.status}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, status: e.target.value })}
                    >
                      {leadStatusOptions.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mt-2">
                    <Form.Label className="small fw-semibold text-slate-600 mb-1">Additional Intake Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter student background, special accommodations, reason for calling, etc."
                      value={newLeadForm.internal_notes}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, internal_notes: e.target.value })}
                      style={{ fontSize: "0.85rem" }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                disabled={creatingLead}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={creatingLead}
                className="d-flex align-items-center gap-1 fw-bold"
              >
                {creatingLead ? (
                  <>
                    <Spinner size="sm" animation="border" /> Creating...
                  </>
                ) : (
                  "Create Prospective Lead"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <DeleteConfirmModal
        show={showPromoteModal}
        onHide={() => {
          setShowPromoteModal(false);
          setPromoteTargetId(null);
        }}
        onConfirm={handleConfirmPromote}
        title="Promote Lead to Student"
        message="Are you sure you want to promote this lead to a permanent student record? This is the final step before billing can begin."
        confirmText="Promote"
        loading={promoting}
      />
    </div>
  );
};

export default LeadsListPage;
