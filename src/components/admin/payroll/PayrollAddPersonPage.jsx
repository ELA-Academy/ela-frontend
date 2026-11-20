import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Check,
  X,
  Plus,
  Users,
  UserPlus,
  Building2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Lock
} from "lucide-react";
import { getAllStaff } from "../../../services/staffService";
import { getAllDepartments } from "../../../services/departmentService";
import { onboardStaffMember, getAdminDocuments } from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const ELA_BLUE = "#2563eb";
const ELA_BLUE_LIGHT = "#eff6ff";
const ELA_BLUE_BORDER = "#bfdbfe";

const ELA_DEPARTMENTS = [
  "Accounting Department",
  "Administration Office",
  "Admissions Department",
  "Human Resource Department",
  "Marketing Department",
  "Math Department",
  "Programs Department",
  "Social Media Specialist",
  "Teacher Department"
];

const ELA_JOB_TITLES = [
  "Accounting Manager",
  "Accounting/Bookkeeper Assistant",
  "Accounts Assistant",
  "Administer Assistant",
  "Administration Manager",
  "Administrator Assistant",
  "Admissions Assistant",
  "Assistant Principal",
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
    desc: "Someone within your organization that will not be paid through ELA Payroll."
  }
];

const COUNTRY_OPTIONS = [
  "United States of America",
  "Colombia",
  "Nigeria",
  "Philippines",
  "Mexico",
  "Canada",
  "United Kingdom",
  "Spain",
  "Argentina",
  "Venezuela",
  "Brazil",
  "India",
  "Other"
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

const PayrollAddPersonPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "manual" ? "manual" : "existing";

  const [step, setStep] = useState(1); // 1: Basics, 2: Employment info, 3: Documents
  const [addMode, setAddMode] = useState(initialMode); // "existing" | "manual"
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Directory search
  const [directorySearch, setDirectorySearch] = useState("");
  const [selectedExistingId, setSelectedExistingId] = useState("");

  // Department & Job Title UI helpers
  const [creatingDept, setCreatingDept] = useState(false);
  const [jobTitleDropdownOpen, setJobTitleDropdownOpen] = useState(false);
  const [creatingJobTitle, setCreatingJobTitle] = useState(false);
  const [customJobTitle, setCustomJobTitle] = useState("");

  // Offcanvas drawer for Step 3 "Edit documents"
  const [docsDrawerOpen, setDocsDrawerOpen] = useState(false);
  const [tempDocIds, setTempDocIds] = useState([]);

  const [form, setForm] = useState({
    staff_id: null,
    first_name: "",
    middle_initial: "",
    last_name: "",
    preferred_name: "",
    worker_type: "Contractor",
    country: "United States of America",
    work_email: "",
    personal_email: "",
    start_date: new Date().toISOString().slice(0, 10),
    department_id: "",
    department_name: "",
    new_department_name: "",
    job_title: "",
    receives_tips: false,
    manager_name: "Marcus Cooper",
    hourly_rate: "",
    assign_time_tracking: true,
    send_invite: initialMode === "manual",
    document_ids: []
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllStaff().catch(() => []),
      getAllDepartments().catch(() => []),
      getAdminDocuments().catch(() => ({ documents: [] }))
    ])
      .then(([sRes, dRes, docRes]) => {
        setStaffList(Array.isArray(sRes) ? sRes : sRes.staff || []);
        setDepartments(Array.isArray(dRes) ? dRes : dRes.departments || []);
        setSharedDocs((docRes.documents || []).filter((d) => d.status === "active"));
      })
      .finally(() => setLoading(false));
  }, []);

  // Merge DB departments with ELA standard departments from screenshot
  const mergedDepartments = useMemo(() => {
    const byLower = new Map();
    departments.forEach((d) => {
      if (d?.name) byLower.set(d.name.trim().toLowerCase(), { id: String(d.id), name: d.name.trim(), fromDb: true });
    });
    ELA_DEPARTMENTS.forEach((name) => {
      const key = name.toLowerCase();
      if (!byLower.has(key)) {
        byLower.set(key, { id: `preset:${name}`, name, fromDb: false });
      }
    });
    return Array.from(byLower.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [departments]);

  const mergedJobTitles = useMemo(() => {
    const set = new Set(ELA_JOB_TITLES);
    staffList.forEach((s) => {
      if (s.job_title && s.job_title.trim()) set.add(s.job_title.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [staffList]);

  const filteredDirectory = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    if (!q) return staffList;
    return staffList.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.department || "").toLowerCase().includes(q)
    );
  }, [staffList, directorySearch]);

  const handleSelectDirectoryStaff = (st) => {
    setSelectedExistingId(String(st.id));
    setErrorMsg("");
    const parsed = splitFullName(st.name);
    const matchedDept = mergedDepartments.find(
      (d) =>
        d.name.toLowerCase() === (st.department || "").toLowerCase() ||
        (st.department_names || []).some((dn) => dn.toLowerCase() === d.name.toLowerCase())
    );
    setForm((prev) => ({
      ...prev,
      staff_id: st.id,
      first_name: parsed.first,
      middle_initial: parsed.middle,
      last_name: parsed.last,
      preferred_name: st.preferred_name || parsed.first,
      worker_type: st.worker_type || "Contractor",
      country: st.country || "United States of America",
      work_email: st.work_email || st.email || "",
      personal_email: st.personal_email || "",
      start_date:
        st.start_date && /^\d{4}-\d{2}-\d{2}/.test(st.start_date)
          ? st.start_date.slice(0, 10)
          : prev.start_date,
      department_id: matchedDept && matchedDept.fromDb ? matchedDept.id : "",
      department_name: matchedDept ? matchedDept.name : st.department || "",
      new_department_name: matchedDept && !matchedDept.fromDb ? matchedDept.name : "",
      job_title: st.job_title || "",
      receives_tips: Boolean(st.receives_tips),
      manager_name: "Marcus Cooper",
      hourly_rate: st.hourly_rate != null ? String(st.hourly_rate) : "",
      send_invite: false
    }));
  };

  const isFormUS = useMemo(() => {
    const c = (form.country || "").toLowerCase();
    return c.includes("united states") || c === "us" || c === "usa";
  }, [form.country]);

  const handleStep1Continue = () => {
    setErrorMsg("");
    if (addMode === "existing" && !form.staff_id) {
      setErrorMsg("Please select a team member from the ELA Directory.");
      return;
    }
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setErrorMsg("Please enter first name and last name.");
      return;
    }
    if (!form.work_email.trim() && !form.personal_email.trim()) {
      setErrorMsg("Please provide at least a work email or personal email.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep2Continue = () => {
    setErrorMsg("");
    // Pre-select matching active documents based on future_hires_rule when entering Step 3
    if (form.document_ids.length === 0 && sharedDocs.length > 0) {
      const autoIds = sharedDocs
        .filter((d) => {
          const rule = d.future_hires_rule || "none";
          if (rule === "all") return true;
          if (rule === "us" && isFormUS) return true;
          if (rule === "non_us" && !isFormUS) return true;
          if (rule === "specific") {
            const types = d.target_hire_types || [];
            if (types.includes(form.worker_type)) return true;
            if (types.includes("us") && isFormUS) return true;
            if (types.includes("non_us") && !isFormUS) return true;
            if (form.department_id && (d.target_department_ids || []).includes(Number(form.department_id))) return true;
          }
          return false;
        })
        .map((d) => d.id);
      setForm((prev) => ({ ...prev, document_ids: autoIds }));
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async () => {
    setErrorMsg("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        manager_name: "Marcus Cooper",
        supervisor_name: "Marcus Cooper",
        email: form.work_email.trim() || form.personal_email.trim(),
        department_id: form.department_id && !String(form.department_id).startsWith("preset:") ? Number(form.department_id) : null,
        new_department_name: creatingDept
          ? form.new_department_name.trim()
          : String(form.department_id).startsWith("preset:")
          ? form.department_name
          : "",
        update_existing: addMode === "existing"
      };
      await onboardStaffMember(payload);
      navigate("/admin/payroll/people");
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || "Failed to save team member.");
    } finally {
      setSaving(false);
    }
  };

  const openDocsDrawer = () => {
    setTempDocIds([...form.document_ids]);
    setDocsDrawerOpen(true);
  };

  const toggleTempDoc = (id) => {
    setTempDocIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveDocsDrawer = () => {
    setForm((prev) => ({ ...prev, document_ids: tempDocIds }));
    setDocsDrawerOpen(false);
  };

  const displayName = form.preferred_name.trim() || form.first_name.trim() || "this person";
  const selectedDocs = sharedDocs.filter((d) => form.document_ids.includes(d.id));
  const stepTitles = ["Basics", "Employment info", "Documents"];
  const progressPct = (step / 3) * 100;

  const inputStyle = {
    width: "100%",
    padding: "0.6rem 0.85rem",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "0.9rem",
    color: "#111827",
    backgroundColor: "#ffffff"
  };

  return (
    <div style={{ maxWidth: "1040px", margin: "0 auto", paddingBottom: "5rem" }}>
      {/* Header & Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>
          Add a person
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#4b5563", marginBottom: "0.45rem" }}>
          <span style={{ fontWeight: 600 }}>{stepTitles[step - 1]}</span>
          <span style={{ fontWeight: 600 }}>Step {step} of 3</span>
        </div>
        <div style={{ width: "100%", height: "6px", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              backgroundColor: ELA_BLUE,
              transition: "width 0.25s ease"
            }}
          />
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            borderRadius: "8px",
            padding: "0.85rem 1.1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.55rem",
            fontSize: "0.875rem",
            fontWeight: 500
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ==================== STEP 1: BASICS ==================== */}
      {step === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: "2rem", alignItems: "start" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>
              Tell us who you&apos;d like to add
            </h2>

            {/* Mode Switcher: ELA Directory vs Manual */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  setAddMode("existing");
                  setErrorMsg("");
                }}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: addMode === "existing" ? `2px solid ${ELA_BLUE}` : "1px solid #d1d5db",
                  backgroundColor: addMode === "existing" ? ELA_BLUE_LIGHT : "#ffffff",
                  color: addMode === "existing" ? ELA_BLUE : "#374151",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <Users size={16} />
                Add from ELA Directory
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMode("manual");
                  setSelectedExistingId("");
                  setForm((p) => ({ ...p, staff_id: null, send_invite: true }));
                  setErrorMsg("");
                }}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: addMode === "manual" ? `2px solid ${ELA_BLUE}` : "1px solid #d1d5db",
                  backgroundColor: addMode === "manual" ? ELA_BLUE_LIGHT : "#ffffff",
                  color: addMode === "manual" ? ELA_BLUE : "#374151",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <UserPlus size={16} />
                Add New Person
              </button>
            </div>

            {/* ELA Directory Picker */}
            {addMode === "existing" && (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "1rem",
                  marginBottom: "1.5rem"
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111827", marginBottom: "0.5rem" }}>
                  Select existing staff member from ELA Directory
                </div>
                <div style={{ position: "relative", marginBottom: "0.65rem" }}>
                  <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "11px", top: "10px" }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or department..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: "2.2rem", paddingTop: "0.45rem", paddingBottom: "0.45rem" }}
                  />
                </div>
                <div style={{ maxHeight: "190px", overflowY: "auto", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                  {loading ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem" }}>Loading directory...</div>
                  ) : filteredDirectory.length === 0 ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem" }}>No matching staff found.</div>
                  ) : (
                    filteredDirectory.map((st) => {
                      const isSel = String(selectedExistingId) === String(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => handleSelectDirectoryStaff(st)}
                          style={{
                            padding: "0.6rem 0.85rem",
                            borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer",
                            backgroundColor: isSel ? ELA_BLUE_LIGHT : "#ffffff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: isSel ? ELA_BLUE : "#111827" }}>
                              {st.name}
                            </div>
                            <div style={{ fontSize: "0.76rem", color: "#6b7280" }}>
                              {st.work_email || st.email} {st.department ? `• ${st.department}` : ""}
                            </div>
                          </div>
                          {isSel && <CheckCircle2 size={16} color={ELA_BLUE} />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Name fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.88rem", color: "#111827", marginBottom: "0.35rem" }}>
                  First name
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.88rem", color: "#111827", marginBottom: "0.35rem" }}>
                  Middle initial
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={form.middle_initial}
                  onChange={(e) => setForm({ ...form, middle_initial: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.88rem", color: "#111827", marginBottom: "0.35rem" }}>
                Last name
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.88rem", color: "#111827", marginBottom: "0.15rem" }}>
                Preferred first name
              </label>
              <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.4rem" }}>
                ELA Academy will use this name in communications where a legal first name is not required (team member directory, org chart, etc.).
              </div>
              <input
                type="text"
                value={form.preferred_name}
                onChange={(e) => setForm({ ...form, preferred_name: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Worker Type */}
            <div style={{ marginBottom: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", marginBottom: "0.2rem" }}>
                Worker type
              </div>
              <div style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "0.9rem" }}>
                How your worker will be paid and represented in ELA Payroll.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {WORKER_TYPE_OPTIONS.map((opt) => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="workerType"
                      checked={form.worker_type === opt.value}
                      onChange={() => setForm({ ...form, worker_type: opt.value })}
                      style={{ marginTop: "3px", accentColor: ELA_BLUE }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>{opt.label}</div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Country */}
            <div style={{ marginBottom: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid #e5e7eb" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: "0.92rem", color: "#111827", marginBottom: "0.15rem" }}>
                Country
              </label>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.45rem" }}>
                Where your team member lives.
              </div>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                style={inputStyle}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Work Email & Personal Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.88rem", color: "#111827", marginBottom: "0.15rem" }}>
                  Work email
                </label>
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.4rem" }}>
                  Used for school sign-in and notifications.
                </div>
                <input
                  type="email"
                  placeholder="name@ela-academy.org"
                  value={form.work_email}
                  onChange={(e) => setForm({ ...form, work_email: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.88rem", color: "#111827", marginBottom: "0.15rem" }}>
                  Personal email
                </label>
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.4rem" }}>
                  Receives document links and HR reminders.
                </div>
                <input
                  type="email"
                  placeholder="personal@email.com"
                  value={form.personal_email}
                  onChange={(e) => setForm({ ...form, personal_email: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={handleStep1Continue}
                style={{
                  backgroundColor: ELA_BLUE,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.65rem 1.45rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Save and continue
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/payroll/people")}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "0.65rem 1.25rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right Info Card (Image 1) */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "1.25rem"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", marginBottom: "0.45rem" }}>
              ELA Directory Sync
            </div>
            <p style={{ fontSize: "0.83rem", color: "#4b5563", lineHeight: 1.5, marginBottom: "0.85rem" }}>
              Staff already invited to the ELA School App can be selected directly from the ELA Directory to configure their payroll profile, hourly rate, and onboarding documents.
            </p>
            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
              Both work and personal emails receive document signing alerts and HR reminders.
            </div>
          </div>
        </div>
      )}

      {/* ==================== STEP 2: EMPLOYMENT INFO (Images 4-8) ==================== */}
      {step === 2 && (
        <div style={{ maxWidth: "660px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.2rem" }}>
            Employment info
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1.5rem" }}>
            You can also edit {displayName}&apos;s employment information later from their profile.
          </p>

          {/* Contract Start Date */}
          <div style={{ marginBottom: "1.35rem" }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#111827", marginBottom: "0.15rem" }}>
              Contract start date
            </label>
            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.4rem" }}>
              You can edit this date later.
            </div>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Department Dropdown + Create Department (Image 6) */}
          <div style={{ marginBottom: "1.35rem" }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#111827", marginBottom: "0.4rem" }}>
              Department
            </label>
            {!creatingDept ? (
              <>
                <select
                  value={form.department_id || (form.department_name ? `preset:${form.department_name}` : "")}
                  onChange={(e) => {
                    const val = e.target.value;
                    const found = mergedDepartments.find((d) => d.id === val);
                    setForm({
                      ...form,
                      department_id: val,
                      department_name: found ? found.name : "",
                      new_department_name: found && !found.fromDb ? found.name : ""
                    });
                  }}
                  style={inputStyle}
                >
                  <option value="">(None)</option>
                  {mergedDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCreatingDept(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: ELA_BLUE,
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: "0.45rem",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  <Plus size={14} /> Create department
                </button>
              </>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Enter new department name..."
                  value={form.new_department_name}
                  onChange={(e) => setForm({ ...form, new_department_name: e.target.value, department_name: e.target.value })}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => {
                    setCreatingDept(false);
                    setForm({ ...form, new_department_name: "" });
                  }}
                  style={{ border: "1px solid #d1d5db", background: "#ffffff", borderRadius: "6px", padding: "0 0.85rem", fontSize: "0.84rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Job Title Radio Dropdown (Images 7 & 8) */}
          <div style={{ marginBottom: "1.35rem", position: "relative" }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#111827", marginBottom: "0.15rem" }}>
              Job title
            </label>
            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.45rem" }}>
              Make sure the job title reflects the team member&apos;s scope of work.
            </div>

            {!creatingJobTitle ? (
              <div>
                <button
                  type="button"
                  onClick={() => setJobTitleDropdownOpen((o) => !o)}
                  style={{
                    ...inputStyle,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <span style={{ color: form.job_title ? "#111827" : "#94a3b8" }}>
                    {form.job_title || "Select a job title"}
                  </span>
                  <ChevronDown size={16} color="#64748b" />
                </button>

                {jobTitleDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "100%",
                      marginTop: "4px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                      maxHeight: "260px",
                      overflowY: "auto",
                      zIndex: 30,
                      padding: "0.4rem 0"
                    }}
                  >
                    {mergedJobTitles.map((jt) => (
                      <label
                        key={jt}
                        onClick={() => {
                          setForm({ ...form, job_title: jt });
                          setJobTitleDropdownOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.65rem",
                          padding: "0.55rem 0.9rem",
                          cursor: "pointer",
                          fontSize: "0.88rem",
                          backgroundColor: form.job_title === jt ? ELA_BLUE_LIGHT : "transparent",
                          color: form.job_title === jt ? ELA_BLUE : "#111827",
                          fontWeight: form.job_title === jt ? 600 : 400
                        }}
                      >
                        <input
                          type="radio"
                          name="jobTitleRadio"
                          checked={form.job_title === jt}
                          onChange={() => {}}
                          style={{ accentColor: ELA_BLUE }}
                        />
                        <span>{jt}</span>
                      </label>
                    ))}
                    <div
                      onClick={() => {
                        setJobTitleDropdownOpen(false);
                        setCreatingJobTitle(true);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                        padding: "0.6rem 0.9rem",
                        cursor: "pointer",
                        fontSize: "0.88rem",
                        color: ELA_BLUE,
                        fontWeight: 600,
                        borderTop: "1px solid #f1f5f9"
                      }}
                    >
                      <Plus size={14} />
                      <span>Create a new job title</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Enter new job title..."
                  value={customJobTitle}
                  onChange={(e) => {
                    setCustomJobTitle(e.target.value);
                    setForm({ ...form, job_title: e.target.value });
                  }}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setCreatingJobTitle(false)}
                  style={{ border: "1px solid #d1d5db", background: "#ffffff", borderRadius: "6px", padding: "0 0.85rem", fontSize: "0.84rem", cursor: "pointer" }}
                >
                  Done
                </button>
              </div>
            )}

            {form.worker_type !== "Employee" && (
              <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginTop: "0.75rem", fontSize: "0.86rem", color: "#374151", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.receives_tips}
                  onChange={(e) => setForm({ ...form, receives_tips: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: ELA_BLUE }}
                />
                <span>This contractor receives tips</span>
              </label>
            )}
          </div>

          {/* Manager — ALWAYS Marcus Cooper */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#111827", marginBottom: "0.15rem" }}>
              Manager
            </label>
            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.4rem" }}>
              All ELA team members report under Marcus Cooper.
            </div>
            <div
              style={{
                ...inputStyle,
                backgroundColor: "#f8fafc",
                color: "#334155",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>Marcus Cooper</span>
              <Lock size={14} color="#94a3b8" />
            </div>
          </div>

          {/* Compensation */}
          <div style={{ marginBottom: "2rem", paddingTop: "1.25rem", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827", marginBottom: "0.2rem" }}>
              Compensation
            </div>
            <div style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "0.85rem" }}>
              Flat payments are always available when making a payment—no setup needed.
            </div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.88rem", color: "#111827", marginBottom: "0.35rem" }}>
              Hourly rate
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ position: "relative", width: "180px" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#4b5563", fontWeight: 600 }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.hourly_rate}
                  onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                  style={{ ...inputStyle, paddingLeft: "1.85rem" }}
                />
              </div>
              <span style={{ fontSize: "0.88rem", color: "#4b5563" }}>per hour</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={handleStep2Continue}
              style={{
                backgroundColor: ELA_BLUE,
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.65rem 1.45rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Save and continue
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                backgroundColor: "#ffffff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "0.65rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 3: DOCUMENTS (Images 9 & 10) ==================== */}
      {step === 3 && (
        <div style={{ maxWidth: "680px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>
            Set up documents
          </h2>

          {/* Contact Details Card (Image 9) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "1.35rem 1.5rem",
              marginBottom: "1.25rem"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827", marginBottom: "0.4rem" }}>
              Contact details
            </div>
            <div style={{ fontSize: "0.88rem", color: "#374151" }}>
              Emails will be sent to{" "}
              <strong>
                {[form.work_email, form.personal_email].filter(Boolean).join(" & ")}
              </strong>{" "}
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: "none",
                  border: "none",
                  color: ELA_BLUE,
                  fontWeight: 600,
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  marginLeft: "0.25rem"
                }}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Documents Card ONLY (Image 9) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "1.5rem",
              marginBottom: "1.75rem"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#111827", marginBottom: "0.3rem" }}>
              Documents
            </div>
            <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "1.25rem" }}>
              Send these documents to {displayName}. We&apos;ll store and make the signed versions accessible at any time.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>Includes</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                  Documents for: {[form.worker_type, form.job_title, form.department_name].filter(Boolean).join(", ")}
                </div>
              </div>
              <button
                type="button"
                onClick={openDocsDrawer}
                style={{
                  background: "none",
                  border: "none",
                  color: ELA_BLUE,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "underline",
                  cursor: "pointer"
                }}
              >
                Edit
              </button>
            </div>

            {selectedDocs.length === 0 ? (
              <div style={{ backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "1.1rem", fontSize: "0.85rem", color: "#64748b" }}>
                {sharedDocs.length === 0
                  ? "No active shared documents uploaded yet. You can upload PDF documents under Payroll → Documents → Shared."
                  : "No documents selected yet. Click Edit to choose documents for this team member."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.85rem" }}>
                {selectedDocs.map((doc) => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", color: "#111827" }}>
                    <Check size={16} color={ELA_BLUE} strokeWidth={2.5} />
                    <span>{doc.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              disabled={saving}
              onClick={handleFinalSubmit}
              style={{
                backgroundColor: ELA_BLUE,
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.65rem 1.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {saving ? "Saving..." : "Save & Complete"}
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                backgroundColor: "#ffffff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "0.65rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* ==================== RIGHT OFFCANVAS DRAWER: EDIT DOCUMENTS (Image 10) ==================== */}
      {docsDrawerOpen && (
        <div
          onClick={() => setDocsDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            zIndex: 1050,
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              height: "100%",
              backgroundColor: "#ffffff",
              boxShadow: "-10px 0 30px rgba(15, 23, 42, 0.18)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: "1.35rem 1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#111827" }}>
                Edit documents
              </h3>
              <button
                type="button"
                onClick={() => setDocsDrawerOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
              <p style={{ fontSize: "0.88rem", color: "#4b5563", marginBottom: "1.25rem" }}>
                Select documents for {displayName} to sign or acknowledge.
              </p>

              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827", marginBottom: "0.85rem" }}>
                Team documents:
              </div>

              {sharedDocs.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  No active shared documents found. Upload PDFs in Payroll → Documents → Shared first.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {sharedDocs.map((doc) => {
                    const checked = tempDocIds.includes(doc.id);
                    return (
                      <label
                        key={doc.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.7rem",
                          cursor: "pointer",
                          fontSize: "0.92rem",
                          color: "#111827"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTempDoc(doc.id)}
                          style={{ width: "18px", height: "18px", accentColor: ELA_BLUE, cursor: "pointer" }}
                        />
                        <span>{doc.title}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setDocsDrawerOpen(false)}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "0.55rem 1.2rem",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDocsDrawer}
                style={{
                  backgroundColor: ELA_BLUE,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.55rem 1.35rem",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollAddPersonPage;
