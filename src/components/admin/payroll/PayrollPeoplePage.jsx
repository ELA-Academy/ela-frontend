import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  Users,
  CheckCircle2,
  UserPlus,
  Building2,
  Info,
  Check
} from "lucide-react";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import { getAllStaff } from "../../../services/staffService";
import { getAllDepartments } from "../../../services/departmentService";
import {
  onboardStaffMember,
  dismissStaffMember,
  reactivateStaffMember,
  getAdminDocuments
} from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const DEFAULT_JOB_TITLES = [
  "HR Specialist",
  "Marketing and Communications Specialist",
  "Principal",
  "Programs Assistant",
  "Programs Manager",
  "Teacher",
  "Teacher Administrator",
  "Teacher Aide"
];

const WORKER_TYPE_OPTIONS = [
  {
    value: "Employee",
    label: "Employee",
    desc: "A legal classification for a worker paid an hourly or salaried wage with rights and benefits received through employment."
  },
  {
    value: "Contractor",
    label: "Contractor (Individual)",
    desc: "A self-employed person you pay for their services. You'll report their pay on a 1099."
  },
  {
    value: "Contractor Business",
    label: "Contractor (Business)",
    desc: "A contractor you pay through their business (EIN) instead of their SSN."
  },
  {
    value: "Volunteer",
    label: "Unpaid team member",
    desc: "Someone within your organization that will not be paid through payroll."
  }
];

const splitFullName = (fullName = "") => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", middle: "", last: "" };
  if (parts.length === 1) return { first: parts[0], middle: "", last: "" };
  if (parts.length === 2) return { first: parts[0], middle: "", last: parts[1] };
  return {
    first: parts[0],
    middle: parts[1].length <= 2 ? parts[1] : "",
    last: parts[1].length <= 2 ? parts.slice(2).join(" ") : parts.slice(1).join(" ")
  };
};

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

  // Add / Onboard Modal State
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [addMode, setAddMode] = useState("existing"); // "existing" (ELA DB) | "manual"
  const [selectedExistingStaffId, setSelectedExistingStaffId] = useState("");
  const [existingSearch, setExistingSearch] = useState("");
  const [onboardStep, setOnboardStep] = useState(1);
  const [creatingDept, setCreatingDept] = useState(false);
  const [creatingJobTitle, setCreatingJobTitle] = useState(false);
  const [submittingOnboard, setSubmittingOnboard] = useState(false);
  const [editDocsModalOpen, setEditDocsModalOpen] = useState(false);
  const [tempDocIds, setTempDocIds] = useState([]);

  const defaultFormState = () => ({
    staff_id: null,
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
    receives_tips: false,
    manager_name: "Marcus Cooper",
    supervisor_name: "Marcus Cooper",
    hourly_rate: "25",
    assign_time_tracking: true,
    enable_checkins: true,
    checkin_schedule: "30,60,90",
    send_invite: false,
    document_ids: []
  });

  const [onboardForm, setOnboardForm] = useState(defaultFormState);

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

  const allJobTitles = useMemo(() => {
    const set = new Set(DEFAULT_JOB_TITLES);
    staffList.forEach((s) => {
      if (s.job_title && s.job_title.trim()) set.add(s.job_title.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [staffList]);

  const managerOptions = useMemo(() => {
    const names = new Set(["Marcus Cooper"]);
    staffList.forEach((s) => {
      if (s.name) names.add(s.name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [staffList]);

  const openAddPersonModal = (mode = "existing") => {
    setAddMode(mode);
    setSelectedExistingStaffId("");
    setExistingSearch("");
    setCreatingDept(false);
    setCreatingJobTitle(false);
    setOnboardStep(1);
    setOnboardForm({
      ...defaultFormState(),
      send_invite: mode === "manual"
    });
    setOnboardOpen(true);
  };

  const handleSelectExistingStaff = (staff) => {
    setSelectedExistingStaffId(String(staff.id));
    const parsed = splitFullName(staff.name);
    const matchedDept = departments.find(
      (d) => d.name && (d.name === staff.department || (staff.department_names || []).includes(d.name))
    );
    setOnboardForm((prev) => ({
      ...prev,
      staff_id: staff.id,
      first_name: parsed.first,
      middle_initial: parsed.middle,
      last_name: parsed.last,
      preferred_name: staff.preferred_name || parsed.first,
      worker_type: staff.worker_type || "Contractor",
      country: staff.country || "United States of America",
      personal_email: staff.personal_email || staff.email || "",
      work_email: staff.work_email || staff.email || "",
      start_date: staff.start_date && /^\d{4}-\d{2}-\d{2}/.test(staff.start_date)
        ? staff.start_date.slice(0, 10)
        : prev.start_date,
      department_id: matchedDept ? String(matchedDept.id) : "",
      new_department_name: "",
      job_title: staff.job_title || "Teacher",
      receives_tips: Boolean(staff.receives_tips),
      manager_name: staff.manager_name || "Marcus Cooper",
      supervisor_name: staff.supervisor_name || staff.manager_name || "Marcus Cooper",
      hourly_rate: staff.hourly_rate != null ? String(staff.hourly_rate) : "25",
      checkin_schedule: staff.checkin_schedule || "30,60,90",
      send_invite: false
    }));
  };

  const handleOnboardSubmit = async (e) => {
    if (e) e.preventDefault();
    if (addMode === "existing" && !onboardForm.staff_id) {
      showToast("Please select a team member from the ELA directory first.");
      return;
    }
    try {
      setSubmittingOnboard(true);
      await onboardStaffMember({
        ...onboardForm,
        update_existing: addMode === "existing"
      });
      setOnboardOpen(false);
      setOnboardStep(1);
      showToast(
        addMode === "existing"
          ? `Updated payroll profile for ${onboardForm.first_name} ${onboardForm.last_name} and activated in Payroll.`
          : `Invited ${onboardForm.first_name} ${onboardForm.last_name} and assigned onboarding.`
      );
      fetchStaff();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save team member.");
    } finally {
      setSubmittingOnboard(false);
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
    const q = searchTerm.toLowerCase();
    const nameMatch =
      !q ||
      (s.name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.department || "").toLowerCase().includes(q) ||
      (s.job_title || "").toLowerCase().includes(q);
    return statusMatch && nameMatch;
  });

  const filteredDirectoryStaff = useMemo(() => {
    const q = existingSearch.trim().toLowerCase();
    if (!q) return staffList;
    return staffList.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.department || "").toLowerCase().includes(q)
    );
  }, [staffList, existingSearch]);

  const tabCounts = useMemo(() => {
    const counts = { Active: 0, Onboarding: 0, Offboarding: 0, Dismissed: 0 };
    staffList.forEach((s) => {
      const st = s.worker_status || "Active";
      if (counts[st] !== undefined) counts[st] += 1;
    });
    return counts;
  }, [staffList]);

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

  const totalSteps = 3;

  const isFormUS = useMemo(() => {
    const c = (onboardForm.country || "").toLowerCase();
    return c.includes("united states") || c === "us" || c === "usa";
  }, [onboardForm.country]);

  const autoTaxDocument = useMemo(() => {
    if (!isFormUS) {
      return {
        title: "International Worker / W-8BEN Notice",
        desc: "Documents international contractor status outside the United States."
      };
    }
    if (onboardForm.worker_type === "Employee") {
      return {
        title: "Employee's Withholding Certificate (Form W-4)",
        desc: "Collects federal tax withholding elections for W-2 employees."
      };
    }
    if (onboardForm.worker_type === "Volunteer") {
      return {
        title: "Unpaid Volunteer Acknowledgement",
        desc: "Documents unpaid team member classification."
      };
    }
    return {
      title: "Taxpayer Identification (Form W-9)",
      desc: `Verifies ${onboardForm.preferred_name || onboardForm.first_name || "worker"}'s identity for tax purposes such as generating their Form 1099.`
    };
  }, [isFormUS, onboardForm.worker_type, onboardForm.preferred_name, onboardForm.first_name]);

  const handleAdvanceStep = () => {
    if (onboardStep === 2) {
      // Pre-select active team documents matching future_hires_rule for this worker's country
      if (!onboardForm.document_ids || onboardForm.document_ids.length === 0) {
        const autoIds = sharedDocs
          .filter((d) => {
            const rule = d.future_hires_rule || "none";
            if (rule === "all") return true;
            if (rule === "us" && isFormUS) return true;
            if (rule === "non_us" && !isFormUS) return true;
            return false;
          })
          .map((d) => d.id);
        setOnboardForm((prev) => ({ ...prev, document_ids: autoIds }));
      }
    }
    setOnboardStep((s) => s + 1);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="m-0 fw-bold text-slate-900" style={{ fontSize: "1.65rem" }}>
          People
        </h1>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-light btn-sm border border-slate-200 text-slate-700 fw-semibold d-inline-flex align-items-center gap-1"
            style={{ borderRadius: "7px", padding: "5px 12px", fontSize: "12.5px" }}
            onClick={() => setPeopleModal({ show: true, title: "Export Roster", body: "Staff directory roster exported as CSV." })}
          >
            More <ChevronDown size={13} />
          </button>

          <button
            type="button"
            className="btn btn-light btn-sm border border-slate-200 text-slate-700 fw-semibold"
            style={{ borderRadius: "7px", padding: "5px 12px", fontSize: "12.5px" }}
            onClick={() => setPeopleModal({ show: true, title: "Organization Chart", body: "Interactive organizational hierarchy view of ELA departments and personnel." })}
          >
            Org chart
          </button>

          <Dropdown align="end">
            <Dropdown.Toggle
              size="sm"
              className="border-0 fw-semibold d-inline-flex align-items-center gap-1.5"
              style={{
                backgroundColor: "#2563eb",
                borderRadius: "7px",
                padding: "5px 14px",
                fontSize: "12.5px"
              }}
            >
              Add
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow border-slate-200 rounded-3 py-1" style={{ fontSize: "13px", minWidth: "210px" }}>
              <Dropdown.Item onClick={() => navigate("/admin/payroll/people/add?mode=existing")} className="py-2 px-3 fw-medium">
                Add a person (from ELA Directory)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/admin/payroll/people/add?mode=manual")} className="py-2 px-3">
                Add new person manually
              </Dropdown.Item>
              <Dropdown.Divider className="my-1" />
              <Dropdown.Item onClick={() => setPeopleModal({ show: true, title: "Add Multiple Employees", body: "Bulk employee onboarding is handled via Administration → Staff Import, then synced here from the ELA Directory." })} className="py-2 px-3 text-slate-600">
                Add multiple employees
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Tabs: Active, Onboarding, Offboarding, Dismissed */}
      <div className="d-flex align-items-center gap-4 border-bottom border-slate-200 mb-4">
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
                fontSize: "13.5px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#18181a" : "#64748b",
                borderBottom: isActive ? "2px solid #673de6" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px"
              }}
            >
              {tab} <span className="text-slate-400 ms-1" style={{ fontSize: "12px" }}>({tabCounts[tab]})</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Box */}
      <div className="mb-3 position-relative" style={{ maxWidth: "420px" }}>
        <Search size={14} className="text-slate-400 position-absolute" style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          type="text"
          className="form-control form-control-sm border-slate-200 bg-white"
          placeholder={activeTab === "Onboarding" ? "Search onboarding team members" : "Search people"}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: "34px", height: "36px", borderRadius: "8px", fontSize: "13px" }}
        />
      </div>

      {/* Table Action Bar */}
      <div className="d-flex justify-content-between align-items-center mb-2 text-slate-600" style={{ fontSize: "13px" }}>
        <label className="d-flex align-items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedIds.length > 0 && selectedIds.length === filteredStaff.length}
            onChange={handleSelectAll}
            style={{ accentColor: "#673de6", width: "15px", height: "15px" }}
          />
          <span>Select all ({filteredStaff.length})</span>
        </label>

        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none text-slate-700 fw-semibold d-inline-flex align-items-center gap-1"
          style={{ fontSize: "13px" }}
          onClick={() => setPeopleModal({ show: true, title: "Filter Personnel", body: "Filter options: Department (Teacher, Accounting, HR, Admissions), Worker Type (Contractor, Employee)." })}
        >
          <Filter size={13} /> Filter
        </button>
      </div>

      {/* People Table */}
      <div className="bg-white rounded-3 border border-slate-200 overflow-hidden shadow-sm">
        <table className="table table-hover align-middle m-0">
          <thead>
            {activeTab === "Onboarding" ? (
              <tr className="bg-slate-50 text-slate-500 border-bottom border-slate-200">
                <th style={{ width: "40px", padding: "0.75rem 1rem" }}></th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Start date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3 text-end">Actions</th>
              </tr>
            ) : (
              <tr className="bg-slate-50 text-slate-500 border-bottom border-slate-200">
                <th style={{ width: "40px", padding: "0.75rem 1rem" }}></th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Job title</th>
                <th className="py-2.5 px-3">Worker type</th>
                <th className="py-2.5 px-3 text-end">Actions</th>
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-slate-500">
                  Loading staff from database...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-slate-500">
                  No personnel found matching current filters.
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => {
                const isSelected = selectedIds.includes(staff.id);
                const initial = (staff.name || "S").charAt(0).toUpperCase();

                if (activeTab === "Onboarding") {
                  return (
                    <tr
                      key={staff.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/payroll/people/${staff.id}`)}
                    >
                      <td className="px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(staff.id)}
                          style={{ accentColor: "#673de6", width: "15px", height: "15px" }}
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="fw-semibold text-primary text-decoration-underline">{staff.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{staff.start_date || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className="d-inline-flex align-items-center gap-1.5 text-emerald-700 fw-medium" style={{ fontSize: "12.5px" }}>
                          <span className="rounded-circle bg-emerald-600 d-inline-block" style={{ width: "7px", height: "7px" }} />
                          Pending Setup
                        </span>
                      </td>
                      <td className="py-2.5 px-3" style={{ minWidth: "200px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: "6px", backgroundColor: "#e2e8f0" }}>
                            <div style={{ width: "65%", height: "100%", backgroundColor: "#2563eb" }} />
                          </div>
                          <span className="text-slate-600 fw-semibold" style={{ fontSize: "11.5px" }}>65%</span>
                        </div>
                        <span className="text-primary text-decoration-underline" style={{ fontSize: "11.5px" }}>View checklist</span>
                      </td>
                      <td className="py-2.5 px-3 text-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleReactivate(staff)}
                          className="btn btn-light btn-sm border border-slate-200 text-emerald-700 fw-semibold"
                          style={{ fontSize: "11.5px" }}
                        >
                          Mark Active
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={staff.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/payroll/people/${staff.id}`)}
                  >
                    <td className="px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(staff.id)}
                        style={{ accentColor: "#673de6", width: "15px", height: "15px" }}
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="d-flex align-items-center gap-2.5">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                          style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: "#eef2ff",
                            border: "1px solid #c7d2fe",
                            fontSize: "12px",
                            color: "#4338ca"
                          }}
                        >
                          {initial}
                        </div>
                        <span className="fw-semibold text-primary text-decoration-underline">
                          {staff.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-primary text-decoration-underline">
                      {staff.department || staff.department_names?.join(", ") || "Teacher Department"}
                    </td>
                    <td className="py-2.5 px-3 text-primary text-decoration-underline">
                      {staff.job_title || "Teacher"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {staff.worker_type || "Contractor"}
                      {staff.dismissed_effective_date && (
                        <div className="text-slate-400" style={{ fontSize: "11.5px" }}>
                          Dismissed {staff.dismissed_effective_date}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-end" onClick={(e) => e.stopPropagation()}>
                      {(staff.worker_status || "Active").toLowerCase() === "dismissed" ? (
                        <button
                          type="button"
                          onClick={() => handleReactivate(staff)}
                          className="btn btn-light btn-sm border border-emerald-200 text-emerald-700 fw-semibold"
                          style={{ fontSize: "11.5px" }}
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDismissTarget(staff)}
                          className="btn btn-light btn-sm border border-slate-200 text-danger fw-semibold"
                          style={{ fontSize: "11.5px" }}
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

      {/* Add / Onboard Person Modal */}
      <Modal show={onboardOpen} onHide={() => setOnboardOpen(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom pb-2">
          <div>
            <Modal.Title className="fw-bold text-slate-900" style={{ fontSize: "17px" }}>
              Add a person
            </Modal.Title>
            <div className="text-slate-500" style={{ fontSize: "12px" }}>
              Step {onboardStep} of {totalSteps} —{" "}
              {onboardStep === 1
                ? addMode === "existing"
                  ? "Select Staff from ELA Directory & Worker Type"
                  : "Basics & Worker Type"
                : onboardStep === 2
                ? "Employment Info & Compensation"
                : "Set up Payroll features"}
            </div>
          </div>
        </Modal.Header>

        <Form onSubmit={handleOnboardSubmit}>
          <Modal.Body className="py-3 px-4" style={{ maxHeight: "72vh", overflowY: "auto" }}>
            {/* Mode Switcher */}
            {onboardStep === 1 && (
              <div className="d-flex gap-2 p-1 bg-slate-100 rounded-3 mb-3">
                <button
                  type="button"
                  onClick={() => openAddPersonModal("existing")}
                  className={`btn btn-sm flex-grow-1 fw-semibold border-0 rounded-2 py-1.5 d-flex align-items-center justify-content-center gap-1.5 ${
                    addMode === "existing" ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-500"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Users size={14} /> Pull from ELA Database (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => openAddPersonModal("manual")}
                  className={`btn btn-sm flex-grow-1 fw-semibold border-0 rounded-2 py-1.5 d-flex align-items-center justify-content-center gap-1.5 ${
                    addMode === "manual" ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-500"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <UserPlus size={14} /> Add New Person Manually
                </button>
              </div>
            )}

            {/* STEP 1 */}
            {onboardStep === 1 && (
              <div className="space-y-3">
                {addMode === "existing" ? (
                  <div className="border rounded-3 p-3 bg-slate-50 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="fw-bold text-slate-800 m-0" style={{ fontSize: "13px" }}>
                        Select existing staff member (already invited by Administration)
                      </Form.Label>
                      <span className="badge bg-emerald-100 text-emerald-800" style={{ fontSize: "10.5px" }}>
                        Skips duplicate account invite
                      </span>
                    </div>

                    <div className="position-relative mb-2">
                      <Search size={13} className="position-absolute text-slate-400" style={{ left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                      <Form.Control
                        size="sm"
                        placeholder="Filter staff by name, email, or department..."
                        value={existingSearch}
                        onChange={(e) => setExistingSearch(e.target.value)}
                        style={{ paddingLeft: "30px" }}
                      />
                    </div>

                    <div className="bg-white border rounded-2" style={{ maxHeight: "155px", overflowY: "auto" }}>
                      {filteredDirectoryStaff.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 small">No matching staff in directory.</div>
                      ) : (
                        filteredDirectoryStaff.map((s) => {
                          const isChosen = String(s.id) === String(selectedExistingStaffId);
                          return (
                            <div
                              key={s.id}
                              onClick={() => handleSelectExistingStaff(s)}
                              className={`d-flex align-items-center justify-content-between px-3 py-2 border-bottom cursor-pointer ${
                                isChosen ? "bg-indigo-50" : "hover:bg-slate-50"
                              }`}
                              style={{ fontSize: "12.5px" }}
                            >
                              <div>
                                <div className="fw-semibold text-slate-900">{s.name}</div>
                                <div className="text-slate-500" style={{ fontSize: "11.5px" }}>
                                  {s.email} · {s.department || "No department"}
                                </div>
                              </div>
                              {isChosen && <CheckCircle2 size={16} className="text-indigo-600" />}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {onboardForm.staff_id && (
                      <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between text-slate-600" style={{ fontSize: "12px" }}>
                        <span>
                          Selected: <strong className="text-slate-900">{onboardForm.first_name} {onboardForm.last_name}</strong> ({onboardForm.personal_email})
                        </span>
                        <span className="text-emerald-700 fw-semibold">Ready for Payroll setup</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="row g-3 mb-3">
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
                      <Form.Label className="small fw-semibold">Preferred first name</Form.Label>
                      <Form.Control value={onboardForm.preferred_name} onChange={(e) => setOnboardForm({ ...onboardForm, preferred_name: e.target.value })} placeholder="First or middle name" />
                    </div>
                    <div className="col-md-6">
                      <Form.Label className="small fw-semibold">Personal email *</Form.Label>
                      <Form.Control type="email" required value={onboardForm.personal_email} onChange={(e) => setOnboardForm({ ...onboardForm, personal_email: e.target.value })} />
                    </div>
                  </div>
                )}

                {/* Worker Type Radio Cards (Matching Gusto Screenshot 4) */}
                <div>
                  <Form.Label className="small fw-bold text-slate-800 mb-2 d-block">Worker type</Form.Label>
                  <div className="d-flex flex-column gap-2">
                    {WORKER_TYPE_OPTIONS.map((wt) => {
                      const active = onboardForm.worker_type === wt.value;
                      return (
                        <label
                          key={wt.value}
                          className={`d-flex align-items-start gap-2.5 p-2.5 rounded-3 border cursor-pointer ${
                            active ? "border-emerald-600 bg-emerald-50/40" : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="worker_type"
                            checked={active}
                            onChange={() => setOnboardForm({ ...onboardForm, worker_type: wt.value })}
                            className="mt-1"
                            style={{ accentColor: "#2563eb" }}
                          />
                          <div>
                            <div className="fw-semibold text-slate-900" style={{ fontSize: "13px" }}>{wt.label}</div>
                            <div className="text-slate-500" style={{ fontSize: "11.5px" }}>{wt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="row g-3 mt-1">
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
                  {addMode === "existing" && (
                    <div className="col-md-6">
                      <Form.Label className="small fw-semibold">Preferred first name</Form.Label>
                      <Form.Control
                        value={onboardForm.preferred_name}
                        onChange={(e) => setOnboardForm({ ...onboardForm, preferred_name: e.target.value })}
                        placeholder="First or middle name"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Employment Info & Compensation (Matching Gusto Screenshots 6, 7, 8) */}
            {onboardStep === 2 && (
              <div className="row g-3">
                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Contract / Start date</Form.Label>
                  <Form.Control type="date" value={onboardForm.start_date} onChange={(e) => setOnboardForm({ ...onboardForm, start_date: e.target.value })} />
                  <Form.Text className="text-slate-400" style={{ fontSize: "11px" }}>Can be backdated if needed.</Form.Text>
                </div>

                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Hourly rate ($ per hour)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.25"
                    min="0"
                    value={onboardForm.hourly_rate}
                    onChange={(e) => setOnboardForm({ ...onboardForm, hourly_rate: e.target.value })}
                  />
                </div>

                {/* Department with inline "+ Create department" */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="small fw-semibold m-0">Department</Form.Label>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold"
                      style={{ fontSize: "11.5px", color: "#2563eb" }}
                      onClick={() => {
                        setCreatingDept((prev) => !prev);
                        setOnboardForm((prev) => ({ ...prev, department_id: "", new_department_name: "" }));
                      }}
                    >
                      {creatingDept ? "Select existing" : "+ Create department"}
                    </button>
                  </div>
                  {creatingDept ? (
                    <Form.Control
                      value={onboardForm.new_department_name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, new_department_name: e.target.value })}
                      placeholder="Enter new department name..."
                      autoFocus
                    />
                  ) : (
                    <Form.Select
                      value={onboardForm.department_id}
                      onChange={(e) => setOnboardForm({ ...onboardForm, department_id: e.target.value })}
                    >
                      <option value="">(None)</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Form.Select>
                  )}
                </div>

                {/* Job title dropdown + inline "+ Create a new job title" */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="small fw-semibold m-0">Job title</Form.Label>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold"
                      style={{ fontSize: "11.5px", color: "#2563eb" }}
                      onClick={() => setCreatingJobTitle((prev) => !prev)}
                    >
                      {creatingJobTitle ? "Choose from list" : "+ Create a new job title"}
                    </button>
                  </div>
                  {creatingJobTitle ? (
                    <Form.Control
                      value={onboardForm.job_title}
                      onChange={(e) => setOnboardForm({ ...onboardForm, job_title: e.target.value })}
                      placeholder="Enter new job title..."
                      autoFocus
                    />
                  ) : (
                    <Form.Select
                      value={onboardForm.job_title}
                      onChange={(e) => setOnboardForm({ ...onboardForm, job_title: e.target.value })}
                    >
                      {allJobTitles.map((jt) => (
                        <option key={jt} value={jt}>{jt}</option>
                      ))}
                    </Form.Select>
                  )}
                </div>

                <div className="col-12">
                  <Form.Check
                    type="checkbox"
                    id="chk-receives-tips"
                    label="This contractor / worker receives tips"
                    checked={onboardForm.receives_tips}
                    onChange={(e) => setOnboardForm({ ...onboardForm, receives_tips: e.target.checked })}
                    className="small text-slate-700"
                  />
                </div>

                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Manager (optional)</Form.Label>
                  <Form.Select
                    value={onboardForm.manager_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, manager_name: e.target.value })}
                  >
                    {managerOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                  </Form.Select>
                </div>

                <div className="col-md-6">
                  <Form.Label className="small fw-semibold">Supervisor (for appraisals)</Form.Label>
                  <Form.Select
                    value={onboardForm.supervisor_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, supervisor_name: e.target.value })}
                  >
                    {managerOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                  </Form.Select>
                </div>
              </div>
            )}

            {/* STEP 3: Set up Payroll features (Documents, Time & Attendance, Check-ins) */}
            {onboardStep === 3 && (
              <div className="d-flex flex-column gap-3">
                {/* Documents Card */}
                <div className="border border-slate-200 rounded-3 p-3 bg-white">
                  <div className="fw-bold text-slate-900 mb-1" style={{ fontSize: "14px" }}>
                    Documents
                  </div>
                  <div className="text-slate-500 mb-3" style={{ fontSize: "12px" }}>
                    Assign documents for {onboardForm.preferred_name || onboardForm.first_name || "this team member"}. Signed versions are stored and accessible anytime.
                  </div>

                  <div className="d-flex justify-content-between align-items-start border-bottom pb-2 mb-2.5">
                    <div>
                      <div className="fw-semibold text-slate-800" style={{ fontSize: "12.5px" }}>Includes</div>
                      <div className="text-slate-500" style={{ fontSize: "11.5px" }}>
                        Documents for: {onboardForm.worker_type}, {onboardForm.job_title},{" "}
                        {onboardForm.new_department_name ||
                          departments.find((d) => String(d.id) === String(onboardForm.department_id))?.name ||
                          "General"}
                        , and {onboardForm.country}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-link p-0 fw-semibold text-decoration-none"
                      style={{ fontSize: "12.5px", color: "#2563eb" }}
                      onClick={() => {
                        setTempDocIds(onboardForm.document_ids || []);
                        setEditDocsModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-1.5" style={{ fontSize: "12.5px" }}>
                    <div className="d-flex align-items-center justify-content-between text-slate-800">
                      <div className="d-flex align-items-center gap-2">
                        <Check size={14} className="text-emerald-700" />
                        <span className="fw-medium">{autoTaxDocument.title}</span>
                      </div>
                      <span title={autoTaxDocument.desc} className="text-slate-400 cursor-pointer">
                        <Info size={14} />
                      </span>
                    </div>

                    {sharedDocs
                      .filter((d) => (onboardForm.document_ids || []).includes(d.id))
                      .map((d) => (
                        <div key={d.id} className="d-flex align-items-center gap-2 text-slate-700">
                          <Check size={14} className="text-emerald-700" />
                          <span>{d.title}</span>
                        </div>
                      ))}

                    {(onboardForm.document_ids || []).length === 0 && (
                      <div className="text-slate-400 fst-italic" style={{ fontSize: "12px" }}>
                        No additional team documents selected. Click Edit to choose documents.
                      </div>
                    )}
                  </div>
                </div>

                {/* Time & Attendance Card */}
                <div className="border border-slate-200 rounded-3 p-3 bg-white">
                  <div className="fw-bold text-slate-900 mb-1" style={{ fontSize: "14px" }}>
                    Time &amp; Attendance
                  </div>
                  <div className="text-slate-500 mb-2" style={{ fontSize: "11.5px" }}>
                    Applicable for hourly or overtime team members.
                  </div>
                  <Form.Check
                    type="checkbox"
                    id="chk-enable-time-tracking"
                    checked={onboardForm.assign_time_tracking}
                    onChange={(e) => setOnboardForm({ ...onboardForm, assign_time_tracking: e.target.checked })}
                    label={
                      <div>
                        <div className="fw-semibold text-slate-800" style={{ fontSize: "13px" }}>
                          Enable Time Tracking for {onboardForm.preferred_name || onboardForm.first_name || "team member"}
                        </div>
                        <div className="text-slate-500" style={{ fontSize: "11.5px" }}>
                          Managers and admins can review and approve their hours.
                        </div>
                      </div>
                    }
                  />
                </div>

                {/* New Hire Check-ins Card */}
                <div className="border border-slate-200 rounded-3 p-3 bg-white">
                  <div className="fw-bold text-slate-900 mb-1" style={{ fontSize: "14px" }}>
                    New hire check-ins
                  </div>
                  <div className="text-slate-500 mb-2.5" style={{ fontSize: "12px" }}>
                    Keep a private running record and get reminders to check in on training &amp; probation progress.
                  </div>
                  <div className="mb-2.5">
                    <Form.Select
                      size="sm"
                      value={onboardForm.checkin_schedule}
                      disabled={!onboardForm.enable_checkins}
                      onChange={(e) => setOnboardForm({ ...onboardForm, checkin_schedule: e.target.value })}
                      style={{ maxWidth: "320px" }}
                    >
                      <option value="30,60,90">30 / 60 / 90 day check-ins (90-day probation)</option>
                      <option value="30,60">30 / 60 day check-ins</option>
                      <option value="30">30 day check-in only</option>
                    </Form.Select>
                  </div>
                  <Form.Check
                    type="checkbox"
                    id="chk-schedule-checkins"
                    checked={onboardForm.enable_checkins}
                    onChange={(e) => setOnboardForm({ ...onboardForm, enable_checkins: e.target.checked })}
                    label={<span className="fw-medium text-slate-800" style={{ fontSize: "13px" }}>Schedule new hire check-ins</span>}
                  />
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            {onboardStep > 1 && (
              <Button variant="light" size="sm" onClick={() => setOnboardStep((s) => s - 1)}>Back</Button>
            )}
            {onboardStep < totalSteps ? (
              <Button
                type="button"
                size="sm"
                style={{ backgroundColor: "#2563eb", border: "none" }}
                disabled={addMode === "existing" && !onboardForm.staff_id}
                onClick={handleAdvanceStep}
              >
                Save &amp; Continue
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={submittingOnboard}
                style={{ backgroundColor: "#2563eb", border: "none" }}
              >
                {submittingOnboard ? "Saving..." : "Save & Activate in Payroll"}
              </Button>
            )}
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Documents Drawer/Modal (Gusto Screenshot 2) */}
      <Modal show={editDocsModalOpen} onHide={() => setEditDocsModalOpen(false)} centered>
        <Modal.Header closeButton className="border-bottom pb-2">
          <Modal.Title className="fw-bold text-slate-900" style={{ fontSize: "16px" }}>
            Edit documents
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3 px-4" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          <div className="text-slate-500 mb-3" style={{ fontSize: "12.5px" }}>
            Select documents for {onboardForm.preferred_name || onboardForm.first_name || "this worker"} to sign or acknowledge.
          </div>

          <div className="mb-3">
            <div className="fw-bold text-slate-800 mb-1" style={{ fontSize: "12.5px" }}>
              Automatically includes:
            </div>
            <div className="ps-2 border-start border-2 border-emerald-500">
              <div className="fw-semibold text-slate-900" style={{ fontSize: "13px" }}>{autoTaxDocument.title}</div>
              <div className="text-slate-500" style={{ fontSize: "11.5px" }}>{autoTaxDocument.desc}</div>
            </div>
          </div>

          <div>
            <div className="fw-bold text-slate-800 mb-2" style={{ fontSize: "12.5px" }}>
              Team documents:
            </div>
            <div className="d-flex flex-column gap-2">
              {sharedDocs.map((d) => (
                <Form.Check
                  key={d.id}
                  type="checkbox"
                  id={`edit-doc-${d.id}`}
                  checked={tempDocIds.includes(d.id)}
                  onChange={(e) => {
                    setTempDocIds((prev) =>
                      e.target.checked ? [...prev, d.id] : prev.filter((id) => id !== d.id)
                    );
                  }}
                  label={<span className="text-slate-800 fw-medium" style={{ fontSize: "13px" }}>{d.title}</span>}
                />
              ))}
              {sharedDocs.length === 0 && (
                <div className="text-slate-400 small">No active team documents found. Add them under Payroll → Documents.</div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top py-2">
          <Button variant="light" size="sm" onClick={() => setEditDocsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            style={{ backgroundColor: "#2563eb", border: "none" }}
            onClick={() => {
              setOnboardForm((prev) => ({ ...prev, document_ids: tempDocIds }));
              setEditDocsModalOpen(false);
            }}
          >
            Save
          </Button>
        </Modal.Footer>
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
            <Button variant="light" size="sm" onClick={() => setDismissTarget(null)}>Cancel</Button>
            <Button type="submit" size="sm" variant="danger">Confirm Dismissal</Button>
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
