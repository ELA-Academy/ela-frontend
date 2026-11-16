import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  User,
  Users,
  Building,
  CheckSquare,
  Square,
  ArrowRight,
  Download
} from "lucide-react";
import { Modal, Button, Form } from "react-bootstrap";
import { getAllStaff } from "../../../services/staffService";
import { getAllDepartments } from "../../../services/departmentService";
import {
  onboardStaffMember,
  dismissStaffMember,
  reactivateStaffMember,
  getAdminDocuments
} from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const PayrollPeoplePage = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Active"); // "Active" | "Onboarding" | "Offboarding" | "Dismissed"
  const [selectedIds, setSelectedIds] = useState([]);
  const [peopleModal, setPeopleModal] = useState({ show: false, title: "", body: "" });
  const [toastMessage, setToastMessage] = useState("");
  const [departments, setDepartments] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);

  // Onboard Wizard Modal
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardForm, setOnboardForm] = useState({
    first_name: "",
    middle_initial: "",
    last_name: "",
    preferred_name: "",
    worker_type: "Contractor",
    country: "United States of America",
    personal_email: "",
    work_email: "",
    start_date: new Date().toISOString().slice(0, 10),
    department_id: "",
    new_department_name: "",
    job_title: "Teacher",
    manager_name: "Marcus Cooper",
    supervisor_name: "Marcus Cooper",
    hourly_rate: "25",
    assign_time_tracking: true,
    checkin_schedule: "30,60,90",
    document_ids: []
  });

  // Dismiss Modal (Effective Date, never delete)
  const [dismissTarget, setDismissTarget] = useState(null);
  const [dismissDate, setDismissDate] = useState(new Date().toISOString().slice(0, 10));
  const [dismissReason, setDismissReason] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const [data, depts, docs] = await Promise.all([
        getAllStaff(),
        getAllDepartments().catch(() => []),
        getAdminDocuments().catch(() => ({ documents: [] }))
      ]);
      setStaffList(Array.isArray(data) ? data : data.staff || []);
      setDepartments(Array.isArray(depts) ? depts : depts.departments || []);
      setSharedDocs((docs.documents || []).filter((d) => d.status === "active"));
    } catch (err) {
      console.error("Error loading staff list:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    try {
      await onboardStaffMember(onboardForm);
      setOnboardOpen(false);
      setOnboardStep(1);
      showToast(`Invited ${onboardForm.first_name} ${onboardForm.last_name} and assigned onboarding documents.`);
      fetchStaff();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to onboard team member.");
    }
  };

  const handleDismissConfirm = async (e) => {
    e.preventDefault();
    if (!dismissTarget) return;
    try {
      await dismissStaffMember(dismissTarget.id, { effective_date: dismissDate, reason: dismissReason });
      setDismissTarget(null);
      setDismissReason("");
      showToast(`${dismissTarget.name} marked as Dismissed (unpaid hours will still process on next payroll).`);
      fetchStaff();
    } catch (err) {
      showToast("Failed to dismiss team member.");
    }
  };

  const handleReactivate = async (staff) => {
    try {
      await reactivateStaffMember(staff.id);
      showToast(`${staff.name} reactivated!`);
      fetchStaff();
    } catch (err) {
      showToast("Failed to reactivate.");
    }
  };

  // Filter staff by active tab and search
  const filteredStaff = staffList.filter((s) => {
    const statusMatch = (s.worker_status || "Active").toLowerCase() === activeTab.toLowerCase();
    const nameMatch = (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.job_title || "").toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && nameMatch;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredStaff.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Header matching Image 2 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem"
        }}
      >
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          People
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "0.45rem 0.9rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem"
            }}
            onClick={() => setPeopleModal({ show: true, title: "Export Roster", body: "Staff directory roster exported as CSV." })}
          >
            More <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "0.45rem 0.9rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer"
            }}
            onClick={() => setPeopleModal({ show: true, title: "Organization Chart", body: "Interactive organizational hierarchy view of ELA departments and personnel." })}
          >
            Org chart
          </button>

          <button
            type="button"
            style={{
              backgroundColor: "#2563eb",
              border: "none",
              borderRadius: "6px",
              padding: "0.45rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem"
            }}
            onClick={() => {
              setOnboardStep(1);
              setOnboardOpen(true);
            }}
          >
            + Add person
          </button>
        </div>
      </div>

      {/* Tabs matching Image 2: Active, Onboarding, Offboarding, Dismissed */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "1.5rem"
        }}
      >
        {["Active", "Onboarding", "Offboarding", "Dismissed"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                padding: "0.6rem 0",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#1d4ed8" : "#6b7280",
                borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px"
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Search Input Box */}
      <div style={{ marginBottom: "1.25rem", maxWidth: "420px", position: "relative" }}>
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          className="gusto-select"
          placeholder="Search people"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: "2.25rem" }}
        />
      </div>

      {/* Table Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          fontSize: "0.85rem",
          color: "#4b5563"
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={selectedIds.length > 0 && selectedIds.length === filteredStaff.length}
            onChange={handleSelectAll}
            style={{ accentColor: "#2563eb", width: "15px", height: "15px" }}
          />
          <span>Select all ({filteredStaff.length})</span>
        </label>

        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            color: "#374151",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem"
          }}
          onClick={() => setPeopleModal({ show: true, title: "Filter Personnel", body: "Filter options: Department (Teacher, Accounting, HR, Admissions), Worker Type (Contractor, Employee)." })}
        >
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      {/* People Table matching Image 2 */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          overflow: "hidden"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#fbfbfe", color: "#6b7280", textAlign: "left" }}>
              <th style={{ width: "40px", padding: "0.75rem 1rem" }}></th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Name ⬍</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Department ⬍</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Job title ⬍</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Worker type ⬍</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                  Loading staff from database...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                  No personnel found matching current filters.
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => {
                const isSelected = selectedIds.includes(staff.id);
                const initial = (staff.name || "S").charAt(0).toUpperCase();

                return (
                  <tr
                    key={staff.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background-color 0.15s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                    onClick={() => navigate(`/admin/payroll/people/${staff.id}`)}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: "0.75rem 1rem" }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(staff.id)}
                        style={{ accentColor: "#2563eb", width: "15px", height: "15px" }}
                      />
                    </td>

                    {/* Name */}
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "#1d4ed8"
                          }}
                        >
                          {initial}
                        </div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#1d4ed8",
                            textDecoration: "underline"
                          }}
                        >
                          {staff.name}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: "0.75rem 1rem", color: "#1d4ed8", textDecoration: "underline" }}>
                      {staff.department || staff.department_names?.join(", ") || "Teacher Department"}
                    </td>

                    {/* Job Title */}
                    <td style={{ padding: "0.75rem 1rem", color: "#1d4ed8", textDecoration: "underline" }}>
                      {staff.job_title || "Teacher"}
                    </td>

                    {/* Worker Type */}
                    <td style={{ padding: "0.75rem 1rem", color: "#374151" }}>
                      {staff.worker_type || "Contractor"}
                      {staff.dismissed_effective_date && (
                        <div style={{ fontSize: "0.74rem", color: "#9ca3af" }}>
                          Dismissed {staff.dismissed_effective_date}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      {(staff.worker_status || "Active").toLowerCase() === "dismissed" ? (
                        <button
                          type="button"
                          onClick={() => handleReactivate(staff)}
                          style={{ background: "none", border: "1px solid #0f766e", color: "#0f766e", borderRadius: "6px", padding: "0.25rem 0.65rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDismissTarget(staff)}
                          style={{ background: "none", border: "1px solid #d1d5db", color: "#dc2626", borderRadius: "6px", padding: "0.25rem 0.65rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          Dismiss
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Onboard Team Member Wizard Modal */}
      <Modal show={onboardOpen} onHide={() => setOnboardOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            Add &amp; Onboard Team Member — Step {onboardStep} of 3
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleOnboardSubmit}>
          <Modal.Body>
            {onboardStep === 1 && (
              <div className="row g-3">
                <div className="col-md-5">
                  <Form.Label className="small fw-semibold">First name *</Form.Label>
                  <Form.Control required value={onboardForm.first_name} onChange={(e) => setOnboardForm({ ...onboardForm, first_name: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <Form.Label className="small fw-semibold">M.I.</Form.Label>
                  <Form.Control maxLength={2} value={onboardForm.middle_initial} onChange={(e) => setOnboardForm({ ...onboardForm, middle_initial: e.target.value })} />
                </div>
                <div className="col-md-5">
                  <Form.Label className="small fw-semibold">Last name *</Form.Label>
                  <Form.Control required value={onboardForm.last_name} onChange={(e) => setOnboardForm({ ...onboardForm, last_name: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Preferred name</Form.Label>
                  <Form.Control value={onboardForm.preferred_name} onChange={(e) => setOnboardForm({ ...onboardForm, preferred_name: e.target.value })} placeholder="First or middle name" />
                </div>
                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Worker type</Form.Label>
                  <Form.Select value={onboardForm.worker_type} onChange={(e) => setOnboardForm({ ...onboardForm, worker_type: e.target.value })}>
                    <option value="Contractor">Contractor (Individual)</option>
                    <option value="Contractor Business">Contractor (Business)</option>
                    <option value="Employee">Employee (W-2)</option>
                    <option value="Volunteer">Volunteer (Unpaid)</option>
                  </Form.Select>
                </div>
                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Country</Form.Label>
                  <Form.Select value={onboardForm.country} onChange={(e) => setOnboardForm({ ...onboardForm, country: e.target.value })}>
                    <option value="United States of America">United States of America</option>
                    <option value="Colombia">Colombia (International)</option>
                    <option value="Nigeria">Nigeria (International)</option>
                    <option value="Kenya">Kenya (International)</option>
                    <option value="Other International">Other International</option>
                  </Form.Select>
                </div>
                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Personal email *</Form.Label>
                  <Form.Control type="email" required value={onboardForm.personal_email} onChange={(e) => setOnboardForm({ ...onboardForm, personal_email: e.target.value })} />
                </div>
              </div>
            )}

            {onboardStep === 2 && (
              <div className="row g-3">
                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Start date (can be backdated)</Form.Label>
                  <Form.Control type="date" value={onboardForm.start_date} onChange={(e) => setOnboardForm({ ...onboardForm, start_date: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Hourly rate ($/hr)</Form.Label>
                  <Form.Control type="number" step="0.25" value={onboardForm.hourly_rate} onChange={(e) => setOnboardForm({ ...onboardForm, hourly_rate: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Department</Form.Label>
                  <Form.Select value={onboardForm.department_id} onChange={(e) => setOnboardForm({ ...onboardForm, department_id: e.target.value })}>
                    <option value="">-- Select existing department --</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Form.Select>
                </div>
                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Or create new department</Form.Label>
                  <Form.Control value={onboardForm.new_department_name} onChange={(e) => setOnboardForm({ ...onboardForm, new_department_name: e.target.value })} placeholder="e.g. Math Department" />
                </div>
                <div className="col-md-4">
                  <Form.Label className="small fw-semibold">Job title</Form.Label>
                  <Form.Control value={onboardForm.job_title} onChange={(e) => setOnboardForm({ ...onboardForm, job_title: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <Form.Label className="small fw-semibold">Manager</Form.Label>
                  <Form.Control value={onboardForm.manager_name} onChange={(e) => setOnboardForm({ ...onboardForm, manager_name: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <Form.Label className="small fw-semibold">Supervisor</Form.Label>
                  <Form.Control value={onboardForm.supervisor_name} onChange={(e) => setOnboardForm({ ...onboardForm, supervisor_name: e.target.value })} />
                </div>
              </div>
            )}

            {onboardStep === 3 && (
              <div>
                <div className="mb-3">
                  <div className="small fw-bold mb-2">Onboarding Documents to Send</div>
                  <div style={{ maxHeight: "170px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "0.75rem" }}>
                    {sharedDocs.map((d) => (
                      <Form.Check
                        key={d.id}
                        type="checkbox"
                        label={`${d.title} (${d.category})`}
                        checked={onboardForm.document_ids.includes(d.id)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...onboardForm.document_ids, d.id]
                            : onboardForm.document_ids.filter((x) => x !== d.id);
                          setOnboardForm({ ...onboardForm, document_ids: ids });
                        }}
                        className="mb-1"
                      />
                    ))}
                  </div>
                </div>
                <Form.Check
                  type="switch"
                  label="Automatically enable Time Tracking permission (recommended)"
                  checked={onboardForm.assign_time_tracking}
                  onChange={(e) => setOnboardForm({ ...onboardForm, assign_time_tracking: e.target.checked })}
                  className="mb-3"
                />
                <Form.Group>
                  <Form.Label className="small fw-semibold">Training &amp; Probation Check-in Reminder</Form.Label>
                  <Form.Select value={onboardForm.checkin_schedule} onChange={(e) => setOnboardForm({ ...onboardForm, checkin_schedule: e.target.value })}>
                    <option value="30,60,90">30 / 60 / 90 days (Standard 90-day probation)</option>
                    <option value="30,60">30 / 60 days</option>
                    <option value="30">30 days only</option>
                  </Form.Select>
                </Form.Group>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            {onboardStep > 1 && (
              <Button variant="light" onClick={() => setOnboardStep((s) => s - 1)}>Back</Button>
            )}
            {onboardStep < 3 ? (
              <Button type="button" style={{ backgroundColor: "#0f766e", border: "none" }} onClick={() => setOnboardStep((s) => s + 1)}>
                Save &amp; Continue
              </Button>
            ) : (
              <Button type="submit" style={{ backgroundColor: "#0f766e", border: "none" }}>
                Send Invitation &amp; Onboard
              </Button>
            )}
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Dismiss Modal (Effective Date, Never Delete) */}
      <Modal show={!!dismissTarget} onHide={() => setDismissTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>Dismiss {dismissTarget?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDismissConfirm}>
          <Modal.Body>
            <p className="small text-muted">
              Dismissed team members are preserved (never deleted) and can be reactivated at any time. Any unpaid hours worked before dismissal will still appear in the upcoming payroll run.
            </p>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Effective date of dismissal</Form.Label>
              <Form.Control type="date" required value={dismissDate} onChange={(e) => setDismissDate(e.target.value)} />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-semibold">Reason / Notes</Form.Label>
              <Form.Control as="textarea" rows={2} value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setDismissTarget(null)}>Cancel</Button>
            <Button type="submit" variant="danger">Confirm Dismissal</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Info Modal replacing alert */}
      <Modal show={peopleModal.show} onHide={() => setPeopleModal({ show: false, title: "", body: "" })} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>{peopleModal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-sm text-slate-700">
          {peopleModal.body}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setPeopleModal({ show: false, title: "", body: "" })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            backgroundColor: "#1e3a8a",
            color: "#ffffff",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            fontSize: "0.875rem",
            fontWeight: 600,
            zIndex: 9999
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default PayrollPeoplePage;
