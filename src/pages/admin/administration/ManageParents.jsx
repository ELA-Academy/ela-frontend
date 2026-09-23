import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Badge,
  Card,
  Spinner,
  Dropdown
} from "react-bootstrap";
import {
  Users,
  Plus,
  Mail,
  Phone,
  KeyRound,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  UserCheck,
  Filter,
  X,
  RotateCcw
} from "lucide-react";
import Select from "react-select";
import api from "../../../utils/api";
import PageHeader from "../../../components/admin/PageHeader";
import { TableSkeleton } from "../../../components/Skeleton";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import { toast } from "react-toastify";

const ManageParents = () => {
  const [parentsList, setParentsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  // Delete Confirm State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [parentToDelete, setParentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [currentParent, setCurrentParent] = useState({
    id: null,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    sign_in_pin: "2963",
    is_active: true,
    student_ids: [],
    send_invite: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [parentsRes, studentsRes] = await Promise.all([
        api.get("/parent/admin/all"),
        api.get("/students/")
      ]);
      setParentsList(Array.isArray(parentsRes.data) ? parentsRes.data : []);
      setStudentsList(Array.isArray(studentsRes.data) ? studentsRes.data : []);
    } catch (err) {
      setError("Failed to fetch parent accounts data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShowModal = (parent = null) => {
    if (parent) {
      setIsEditing(true);
      setCurrentParent({
        id: parent.id,
        first_name: parent.first_name,
        last_name: parent.last_name,
        email: parent.email,
        phone: parent.phone || "",
        password: "",
        sign_in_pin: parent.sign_in_pin || "2963",
        is_active: parent.is_active !== false,
        student_ids: parent.children ? parent.children.map((c) => c.id) : [],
        send_invite: false
      });
    } else {
      setIsEditing(false);
      setCurrentParent({
        id: null,
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        sign_in_pin: "2963",
        is_active: true,
        student_ids: [],
        send_invite: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (isEditing) {
        const payload = { ...currentParent };
        if (!payload.password) delete payload.password;
        await api.put(`/parent/admin/${payload.id}`, payload);
        toast.success("Parent account updated successfully!");
      } else {
        await api.post("/parent/admin/create", currentParent);
        toast.success("Parent account created successfully!");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save parent account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvite = async (parentId) => {
    setResendingId(parentId);
    try {
      const res = await api.post(`/parent/admin/${parentId}/resend-invite`);
      toast.success(res.data?.message || "Invitation link resent successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to resend invite.");
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!parentToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/parent/admin/${parentToDelete.id}`);
      toast.success("Parent account removed successfully.");
      setShowDeleteModal(false);
      setParentToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete parent account.");
    } finally {
      setDeleting(false);
    }
  };

  // Student multi-select options
  const studentOptions = studentsList.map((s) => ({
    value: s.id,
    label: `${s.first_name} ${s.last_name} (${s.grade_level || "Student"})`
  }));

  // Filtering States
  // Filtering States - Checkbox multi-select
  const [selectedPortalStatuses, setSelectedPortalStatuses] = useState([]);
  const [selectedLinkStatuses, setSelectedLinkStatuses] = useState([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverRef = useRef(null);

  // Close filter popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setShowFilterPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTogglePortalStatus = (status) => {
    setSelectedPortalStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleToggleLinkStatus = (status) => {
    setSelectedLinkStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleClearFilters = () => {
    setSelectedPortalStatuses([]);
    setSelectedLinkStatuses([]);
    setSearchTerm("");
  };

  const activeFilterCount = selectedPortalStatuses.length + selectedLinkStatuses.length;

  const filteredParents = parentsList.filter((p) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const email = (p.email || "").toLowerCase();
    const childrenNames = (p.children || []).map((c) => c.name.toLowerCase()).join(" ");
    const matchesSearch = !searchTerm.trim() || fullName.includes(term) || email.includes(term) || childrenNames.includes(term);

    // Portal Status Checkbox Filter
    let matchesPortal = true;
    if (selectedPortalStatuses.length > 0) {
      matchesPortal = selectedPortalStatuses.some((status) => {
        if (status === "active") return p.is_active !== false && p.has_password;
        if (status === "pending_setup") return p.is_active !== false && !p.has_password;
        if (status === "disabled") return p.is_active === false;
        return false;
      });
    }

    // Student Link Checkbox Filter
    let matchesLink = true;
    if (selectedLinkStatuses.length > 0) {
      matchesLink = selectedLinkStatuses.some((status) => {
        if (status === "linked") return p.children && p.children.length > 0;
        if (status === "unlinked") return !p.children || p.children.length === 0;
        return false;
      });
    }

    return matchesSearch && matchesPortal && matchesLink;
  });

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Parent Accounts Database"
        subtitle="Manage registered parent portal accounts, send invite links, and review portal access status"
        badge="Administration & Accounting"
        actions={
          <button
            onClick={() => handleShowModal()}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Parent Account</span>
          </button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Sleek Search & Popover Filter Toolbar */}
      <div className="content-card shadow-sm border mb-3 bg-white p-3 rounded-3" style={{ borderColor: "#cbd5e1" }}>
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "460px" }}>
            <div className="position-relative flex-grow-1">
              <Search
                className="position-absolute text-muted"
                size={15}
                style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
              <Form.Control
                type="text"
                placeholder="Search parent name, email, or child..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: "36px",
                  paddingRight: searchTerm ? "32px" : "12px",
                  fontSize: "0.85rem",
                  borderColor: "#cbd5e1",
                  height: "38px"
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="btn btn-link position-absolute p-0 text-muted"
                  style={{ right: "10px", top: "50%", transform: "translateY(-50%)" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sleek Filter Popover Button */}
            <div className="position-relative" ref={filterPopoverRef}>
              <button
                type="button"
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className={`btn d-inline-flex align-items-center gap-1.5 px-3 ${
                  activeFilterCount > 0
                    ? "btn-primary text-white"
                    : "btn-outline-secondary bg-white text-slate-700"
                }`}
                style={{
                  borderColor: activeFilterCount > 0 ? "#2563eb" : "#cbd5e1",
                  height: "38px",
                  fontSize: "0.83rem",
                  fontWeight: "500",
                  whiteSpace: "nowrap"
                }}
              >
                <Filter size={15} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span
                    className="badge rounded-pill bg-white text-primary ms-1 fw-bold"
                    style={{ fontSize: "10px", padding: "2px 6px" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Floating Filter Popover */}
              {showFilterPopover && (
                <div
                  className="shadow-lg border bg-white p-3 position-absolute"
                  style={{
                    left: 0,
                    top: "45px",
                    zIndex: 1050,
                    width: "290px",
                    borderRadius: "10px",
                    borderColor: "#cbd5e1",
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <span className="small fw-bold text-slate-800 text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.04em" }}>
                      Filter Accounts
                    </span>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="btn btn-link p-0 text-primary small text-decoration-none"
                        style={{ fontSize: "11px" }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Portal Status Checkboxes */}
                  <div className="mb-3">
                    <div className="small fw-semibold text-slate-500 text-uppercase mb-1.5" style={{ fontSize: "10px", letterSpacing: "0.04em" }}>
                      Portal Status
                    </div>
                    <Form.Check
                      type="checkbox"
                      id="mp-filter-active"
                      label="Active (Password Set)"
                      checked={selectedPortalStatuses.includes("active")}
                      onChange={() => handleTogglePortalStatus("active")}
                      className="small text-slate-700 mb-1"
                      style={{ fontSize: "0.82rem" }}
                    />
                    <Form.Check
                      type="checkbox"
                      id="mp-filter-pending"
                      label="Pending Activation (Invited)"
                      checked={selectedPortalStatuses.includes("pending_setup")}
                      onChange={() => handleTogglePortalStatus("pending_setup")}
                      className="small text-slate-700 mb-1"
                      style={{ fontSize: "0.82rem" }}
                    />
                    <Form.Check
                      type="checkbox"
                      id="mp-filter-disabled"
                      label="Disabled Accounts"
                      checked={selectedPortalStatuses.includes("disabled")}
                      onChange={() => handleTogglePortalStatus("disabled")}
                      className="small text-slate-700"
                      style={{ fontSize: "0.82rem" }}
                    />
                  </div>

                  {/* Student Link Checkboxes */}
                  <div className="mb-1">
                    <div className="small fw-semibold text-slate-500 text-uppercase mb-1.5" style={{ fontSize: "10px", letterSpacing: "0.04em" }}>
                      Student Links
                    </div>
                    <Form.Check
                      type="checkbox"
                      id="mp-filter-linked"
                      label="Linked to Student(s)"
                      checked={selectedLinkStatuses.includes("linked")}
                      onChange={() => handleToggleLinkStatus("linked")}
                      className="small text-slate-700 mb-1"
                      style={{ fontSize: "0.82rem" }}
                    />
                    <Form.Check
                      type="checkbox"
                      id="mp-filter-unlinked"
                      label="No Students Linked"
                      checked={selectedLinkStatuses.includes("unlinked")}
                      onChange={() => handleToggleLinkStatus("unlinked")}
                      className="small text-slate-700"
                      style={{ fontSize: "0.82rem" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Showing count indicator */}
          <div className="small text-muted">
            Showing <strong className="text-dark">{filteredParents.length}</strong> of{" "}
            <strong>{parentsList.length}</strong> accounts
            {(searchTerm || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-link btn-sm p-0 ms-2 text-primary text-decoration-none"
                style={{ fontSize: "0.8rem" }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <Card className="content-card shadow-sm border" style={{ borderColor: "#cbd5e1" }}>
        <Card.Body className="p-0">
          {loading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : filteredParents.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="modern-table mb-0 align-middle">
                <thead>
                  <tr>
                    <th>PARENT NAME</th>
                    <th>EMAIL & CONTACT</th>
                    <th>LINKED STUDENTS</th>
                    <th>SIGN-IN PIN</th>
                    <th>PORTAL STATUS</th>
                    <th className="text-end">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParents.map((parent) => (
                    <tr key={parent.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              background: "#f0ebff",
                              color: "#673de6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "12px"
                            }}
                          >
                            {parent.first_name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              {parent.first_name} {parent.last_name}
                            </div>
                            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                              ID: #{parent.id}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.82rem", color: "#0f172a" }}>
                            <Mail size={12} className="text-muted" />
                            <span>{parent.email}</span>
                          </div>
                          {parent.phone && parent.phone !== "N/A" && (
                            <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              <Phone size={12} className="text-muted" />
                              <span>{parent.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        {parent.children && parent.children.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {parent.children.map((c) => (
                              <Badge
                                key={c.id}
                                bg="light"
                                text="dark"
                                className="border px-2 py-1"
                                style={{ fontSize: "0.72rem", fontWeight: 600 }}
                              >
                                🎓 {c.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                            No children linked
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1 font-monospace" style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>
                          <KeyRound size={13} className="text-warning" />
                          <span>{parent.sign_in_pin || "2963"}</span>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Badge
                            bg={parent.is_active ? "success" : "secondary"}
                            style={{ width: "fit-content", fontSize: "0.7rem" }}
                          >
                            {parent.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <small style={{ fontSize: "0.72rem", color: parent.has_password ? "#059669" : "#d97706", fontWeight: 600 }}>
                            {parent.has_password ? "✓ Password Active" : "⏳ Pending Setup"}
                          </small>
                        </div>
                      </td>

                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            title="Resend password setup invite"
                            disabled={resendingId === parent.id}
                            onClick={() => handleResendInvite(parent.id)}
                            className="d-flex align-items-center gap-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {resendingId === parent.id ? (
                              <Spinner size="sm" animation="border" />
                            ) : (
                              <Send size={13} />
                            )}
                            <span className="d-none d-md-inline">Invite</span>
                          </Button>

                          <Button
                            variant="outline-primary"
                            size="sm"
                            title="Edit Parent"
                            onClick={() => handleShowModal(parent)}
                          >
                            <Edit2 size={13} />
                          </Button>

                          <Button
                            variant="outline-danger"
                            size="sm"
                            title="Delete Account"
                            onClick={() => {
                              setParentToDelete(parent);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <Users size={40} className="mb-2 text-secondary opacity-50" />
              <p className="mb-0" style={{ fontSize: "0.9rem" }}>No parent accounts found matching your search.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* CREATE / EDIT PARENT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            {isEditing ? "Edit Parent Account" : "Create New Parent Account"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600 }}>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="e.g. Caitlin"
                    value={currentParent.first_name}
                    onChange={(e) => setCurrentParent({ ...currentParent, first_name: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="e.g. MacFarlane"
                    value={currentParent.last_name}
                    onChange={(e) => setCurrentParent({ ...currentParent, last_name: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    placeholder="parent@example.com"
                    value={currentParent.email}
                    onChange={(e) => setCurrentParent({ ...currentParent, email: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={currentParent.phone}
                    onChange={(e) => setCurrentParent({ ...currentParent, phone: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    {isEditing ? "Change Password (optional)" : "Initial Password (optional)"}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder={isEditing ? "Leave blank to keep unchanged" : "Leave blank to auto-send setup invite"}
                    value={currentParent.password}
                    onChange={(e) => setCurrentParent({ ...currentParent, password: e.target.value })}
                  />
                  {!isEditing && (
                    <Form.Text className="text-muted" style={{ fontSize: "0.75rem" }}>
                      If omitted, a secure 7-day password setup link will be emailed to the parent.
                    </Form.Text>
                  )}
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Sign-In PIN</Form.Label>
                  <Form.Control
                    type="text"
                    maxLength={10}
                    placeholder="2963"
                    value={currentParent.sign_in_pin}
                    onChange={(e) => setCurrentParent({ ...currentParent, sign_in_pin: e.target.value })}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: "0.75rem" }}>
                    4-digit PIN for reception kiosk attendance.
                  </Form.Text>
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Linked Students</Form.Label>
                  <Select
                    isMulti
                    options={studentOptions}
                    placeholder="Search and select children..."
                    value={studentOptions.filter((opt) => currentParent.student_ids.includes(opt.value))}
                    onChange={(selected) =>
                      setCurrentParent({
                        ...currentParent,
                        student_ids: selected ? selected.map((opt) => opt.value) : []
                      })
                    }
                  />
                </Form.Group>
              </div>

              {!isEditing && (
                <div className="col-12">
                  <Form.Check
                    type="checkbox"
                    id="sendInviteCheck"
                    label="Send welcoming email with Parent Portal password setup link"
                    checked={currentParent.send_invite}
                    onChange={(e) => setCurrentParent({ ...currentParent, send_invite: e.target.checked })}
                    style={{ fontSize: "0.85rem", fontWeight: 600 }}
                  />
                </div>
              )}

              {isEditing && (
                <div className="col-12">
                  <Form.Check
                    type="checkbox"
                    id="activeParentCheck"
                    label="Account is Active (can log in to Parent Portal)"
                    checked={currentParent.is_active}
                    onChange={(e) => setCurrentParent({ ...currentParent, is_active: e.target.checked })}
                    style={{ fontSize: "0.85rem", fontWeight: 600 }}
                  />
                </div>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Update Parent" : "Create Parent Account"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Parent Account"
        message={`Are you sure you want to delete the parent account for "${parentToDelete?.first_name} ${parentToDelete?.last_name}" (${parentToDelete?.email})?`}
        deleting={deleting}
      />
    </div>
  );
};

export default ManageParents;
