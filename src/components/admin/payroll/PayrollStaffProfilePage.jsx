import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Info,
  MoreVertical,
  Plus,
  Check,
  X,
  Calendar,
  DollarSign,
  Building,
  User,
  ShieldCheck,
  CreditCard,
  ChevronDown,
  Search,
  Filter,
  Columns,
  Eye,
  Download,
  FileText,
  Clock,
  History,
  AlertCircle
} from "lucide-react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import { getStaffById, updateStaff, updateStaffCompensation, getAllStaff } from "../../../services/staffService";
import "../../../styles/GustoTheme.css";

const PayrollStaffProfilePage = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [allStaffList, setAllStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("work"); // "work" | "pay" | "personal" | "documents" | "performance" | "apps"
  const [toastMessage, setToastMessage] = useState("");

  // Modals for editing details
  const [editCompModalOpen, setEditCompModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [editPersonalModalOpen, setEditPersonalModalOpen] = useState(false);
  const [editWorkModalOpen, setEditWorkModalOpen] = useState(false);

  // Pop-up modals replacing window.alert/prompt
  const [workHistoryModalOpen, setWorkHistoryModalOpen] = useState(false);
  const [compHistoryModalOpen, setCompHistoryModalOpen] = useState(false);
  const [bankOptionsModalOpen, setBankOptionsModalOpen] = useState(false);
  const [addPaymentMethodModalOpen, setAddPaymentMethodModalOpen] = useState(false);
  const [allPaymentsModalOpen, setAllPaymentsModalOpen] = useState(false);
  const [createJobTitleModalOpen, setCreateJobTitleModalOpen] = useState(false);
  const [newCustomJobTitle, setNewCustomJobTitle] = useState("");

  // Compensation Form State
  const [compJobTitle, setCompJobTitle] = useState("");
  const [compRate, setCompRate] = useState("30.00");
  const [compReceivesTips, setCompReceivesTips] = useState(false);
  const [compReason, setCompReason] = useState("");
  const [compEffectiveDate, setCompEffectiveDate] = useState("10/6/2026");

  // Role Form State
  const [roleJobTitle, setRoleJobTitle] = useState("");
  const [roleDepartment, setRoleDepartment] = useState("");
  const [roleWorkEmail, setRoleWorkEmail] = useState("");
  const [roleManager, setRoleManager] = useState("");

  // Personal Form State
  const [personalForm, setPersonalForm] = useState({
    preferred_name: "",
    legal_name: "",
    pronouns: "",
    ssn_last4: "",
    birthday: "",
    personal_email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    emg_name: "",
    emg_relationship: "",
    emg_phone: "",
    emg_email: ""
  });

  // Documents State (Image 2 replica)
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [docFilterType, setDocFilterType] = useState("all");
  const [addDocModalOpen, setAddDocModalOpen] = useState(false);
  const [manage1099ModalOpen, setManage1099ModalOpen] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState(null);

  // New Document Form State
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState("policy");
  const [newDocRequiresAck, setNewDocRequiresAck] = useState(true);

  const [documentsList, setDocumentsList] = useState([
    {
      id: "doc-1",
      name: "Form 1099: 2025",
      desc: "Form 1099 records your annual income as a contractor.",
      status: "Filed",
      statusDate: "Feb 2, 2026",
      type: "tax",
      canView: false,
      hasMenu: true
    },
    {
      id: "doc-2",
      name: "Form 1099: 2024",
      desc: "Form 1099 records your annual income as a contractor.",
      status: "Filed",
      statusDate: "Jan 16, 2025",
      type: "tax",
      canView: false,
      hasMenu: true
    },
    {
      id: "doc-3",
      name: "PTO/Leave Notification Form",
      desc: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Aug 20, 2024",
      type: "policy",
      canView: true,
      hasMenu: false
    },
    {
      id: "doc-4",
      name: "ELA Academy Employee Handbook",
      desc: "Employer provided document",
      status: "Signed",
      statusDate: "Aug 14, 2024",
      type: "handbook",
      canView: true,
      hasMenu: false
    },
    {
      id: "doc-5",
      name: "Pay Schedule 2026",
      desc: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Aug 14, 2024",
      type: "schedule",
      canView: true,
      hasMenu: false
    },
    {
      id: "doc-6",
      name: "2027 Pay Schedule",
      desc: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Aug 14, 2024",
      type: "schedule",
      canView: true,
      hasMenu: false
    },
    {
      id: "doc-7",
      name: "2028 Pay Schedule",
      desc: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Aug 14, 2024",
      type: "schedule",
      canView: true,
      hasMenu: false
    },
    {
      id: "doc-8",
      name: "2025 Pay Schedule",
      desc: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Aug 14, 2024",
      type: "schedule",
      canView: true,
      hasMenu: false
    },
    {
      id: "doc-9",
      name: "2029 Pay Schedule",
      desc: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Aug 14, 2024",
      type: "schedule",
      canView: true,
      hasMenu: false
    }
  ]);

  useEffect(() => {
    fetchStaffDetails();
    fetchRoster();
  }, [staffId]);

  const fetchRoster = async () => {
    try {
      const res = await getAllStaff();
      const list = Array.isArray(res) ? res : res.staff || [];
      setAllStaffList(list);
    } catch (e) {
      console.error("Failed to load staff roster:", e);
    }
  };

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      const data = await getStaffById(staffId);
      setStaff(data);
      // Init form states
      setCompJobTitle(data.job_title || "");
      setCompRate(data.hourly_rate ? String(data.hourly_rate) : "30.00");
      setCompReceivesTips(Boolean(data.receives_tips));

      setRoleJobTitle(data.job_title || "Accounting Manager");
      setRoleDepartment(data.department || "Accounting Department");
      setRoleWorkEmail(data.work_email || data.email || "");
      setRoleManager(data.manager_name || "Marcus Cooper");

      const addr = data.address || {};
      const emg = data.emergency_contact || {};
      setPersonalForm({
        preferred_name: data.preferred_name || data.name || "",
        legal_name: data.legal_name || data.name || "",
        pronouns: data.pronouns || "she/her/hers",
        ssn_last4: data.ssn_last4 || "7600",
        birthday: data.birthday || "October 14, 1992",
        personal_email: data.personal_email || data.email || "",
        phone: data.phone || "+1 (404) 555-0192",
        street: addr.street || "1420 Peachtree St NE, Apt 4B",
        city: addr.city || "Atlanta",
        state: addr.state || "GA",
        zip: addr.zip || "30309",
        country: addr.country || "United States of America",
        emg_name: emg.name || "David Rigsby",
        emg_relationship: emg.relationship || "Spouse",
        emg_phone: emg.phone || "+1 (404) 555-0188",
        emg_email: emg.email || "david.rigsby@example.com"
      });
    } catch (err) {
      console.error("Failed to load staff profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Save compensation changes
  const handleSaveCompensation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        job_title: compJobTitle,
        hourly_rate: parseFloat(compRate) || 0,
        receives_tips: compReceivesTips,
        reason: compReason,
        effective_date: compEffectiveDate
      };
      await updateStaffCompensation(staffId, payload);
      setStaff((prev) => ({
        ...prev,
        job_title: compJobTitle,
        hourly_rate: parseFloat(compRate) || 0,
        receives_tips: compReceivesTips
      }));
      setEditCompModalOpen(false);
      showToast("Compensation details updated successfully");
    } catch (err) {
      console.error("Failed to update compensation:", err);
      showToast("Error updating compensation rate.");
    }
  };

  // Save Role / Work changes
  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        job_title: roleJobTitle,
        department: roleDepartment,
        work_email: roleWorkEmail,
        manager_name: roleManager
      };
      await updateStaff(staffId, payload);
      setStaff((prev) => ({ ...prev, ...payload }));
      setEditRoleModalOpen(false);
      showToast("Role details updated successfully");
    } catch (err) {
      console.error("Failed to update role:", err);
      showToast("Error updating role details.");
    }
  };

  // Save Personal Details changes
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        preferred_name: personalForm.preferred_name,
        legal_name: personalForm.legal_name,
        pronouns: personalForm.pronouns,
        ssn_last4: personalForm.ssn_last4,
        birthday: personalForm.birthday,
        personal_email: personalForm.personal_email,
        phone: personalForm.phone,
        address: {
          street: personalForm.street,
          city: personalForm.city,
          state: personalForm.state,
          zip: personalForm.zip,
          country: personalForm.country
        },
        emergency_contact: {
          name: personalForm.emg_name,
          relationship: personalForm.emg_relationship,
          phone: personalForm.emg_phone,
          email: personalForm.emg_email
        }
      };
      await updateStaff(staffId, payload);
      setStaff((prev) => ({ ...prev, ...payload }));
      setEditPersonalModalOpen(false);
      showToast("Personal information updated successfully");
    } catch (err) {
      console.error("Failed to update personal details:", err);
      showToast("Error updating personal information.");
    }
  };

  // Add Document handler
  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: newDocTitle.trim(),
      desc: "Employer provided document",
      status: "Acknowledged",
      statusDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      type: newDocType,
      canView: true,
      hasMenu: false
    };
    setDocumentsList((prev) => [newDoc, ...prev]);
    setNewDocTitle("");
    setAddDocModalOpen(false);
    showToast(`Document '${newDoc.name}' assigned to staff.`);
  };

  if (loading) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "#6b7280" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>Loading contractor record...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.25rem", color: "#111827" }}>Staff record not found</h2>
        <button
          type="button"
          onClick={() => navigate("/admin/payroll/people")}
          style={{ marginTop: "1rem", color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
        >
          ← Return to People roster
        </button>
      </div>
    );
  }

  const staffName = staff.preferred_name || staff.name || "Caitlin MacFarlane";
  const workerType = staff.worker_type || "Contractor";

  // Calculate currentIndex in allStaffList
  const currentIndex = allStaffList.findIndex((s) => String(s.id) === String(staffId));
  const prevStaff = currentIndex > 0 ? allStaffList[currentIndex - 1] : null;
  const nextStaff = currentIndex < allStaffList.length - 1 ? allStaffList[currentIndex + 1] : null;

  // Filtered documents
  const filteredDocs = documentsList.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(docSearchQuery.toLowerCase()) || doc.desc.toLowerCase().includes(docSearchQuery.toLowerCase());
    if (docFilterType === "all") return matchesSearch;
    return matchesSearch && doc.type === docFilterType;
  });

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Header Row with Back Button, Staff Title, and Right Pager (Image 2 replica) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={() => navigate("/admin/payroll/people")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#111827", padding: "4px" }}
            title="Back to People"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Circular portrait avatar */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#eff6ff",
              border: "2px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1d4ed8"
            }}
          >
            {staffName.charAt(0)}
          </div>

          <div>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 700, color: "#111827", margin: "0 0 0.2rem" }}>
              {staffName}
            </h1>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              {workerType}
            </div>
          </div>
        </div>

        {/* Top Right Staff Pager (Image 2 replica: < Candice Evans 5 of 6 Candi Tsinigine >) */}
        {allStaffList.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", fontSize: "0.85rem", color: "#4b5563" }}>
            {prevStaff && (
              <button
                type="button"
                onClick={() => navigate(`/admin/payroll/people/${prevStaff.id}`)}
                style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
              >
                ‹ {prevStaff.name}
              </button>
            )}
            <span style={{ color: "#9ca3af", fontWeight: 500 }}>
              {currentIndex + 1} of {allStaffList.length}
            </span>
            {nextStaff && (
              <button
                type="button"
                onClick={() => navigate(`/admin/payroll/people/${nextStaff.id}`)}
                style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
              >
                {nextStaff.name} ›
              </button>
            )}
          </div>
        )}
      </div>

      {toastMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#1d4ed8",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500
          }}
        >
          <Check className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Main Container: Left Subnav + Right Card Contents */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "2.5rem", alignItems: "start" }}>
        {/* Left Sub-Sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem", letterSpacing: "0.02em" }}>
              Information
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {[
                { id: "work", label: "Work" },
                { id: "pay", label: "Pay" },
                { id: "personal", label: "Personal" }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSubTab(item.id)}
                  style={{
                    textAlign: "left",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: activeSubTab === item.id ? 600 : 500,
                    color: activeSubTab === item.id ? "#1d4ed8" : "#4b5563",
                    backgroundColor: activeSubTab === item.id ? "#eff6ff" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem", letterSpacing: "0.02em" }}>
              Additional
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {[
                { id: "documents", label: "Documents" },
                { id: "performance", label: "Performance" },
                { id: "apps", label: "Apps" }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSubTab(item.id)}
                  style={{
                    textAlign: "left",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: activeSubTab === item.id ? 600 : 500,
                    color: activeSubTab === item.id ? "#1d4ed8" : "#4b5563",
                    backgroundColor: activeSubTab === item.id ? "#eff6ff" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Right Content Pane */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* TAB: WORK (Image 4 replica) */}
          {activeSubTab === "work" && (
            <>
              {/* Role Card */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Role
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Job title */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "1rem", borderBottom: "1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "#6b7280" }}>
                        <span>Job title</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500, marginTop: "0.25rem" }}>
                        {staff.job_title || "Accounting Manager"}
                      </div>
                    </div>
                  </div>

                  {/* Department */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Department</div>
                      <div style={{ fontSize: "0.95rem", color: "#1d4ed8", fontWeight: 500, marginTop: "0.25rem", textDecoration: "underline" }}>
                        {staff.department || "Accounting Department"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditRoleModalOpen(true)}
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Work email */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Work email</div>
                      <div style={{ fontSize: "0.95rem", color: "#1d4ed8", fontWeight: 500, marginTop: "0.25rem", textDecoration: "underline" }}>
                        {staff.work_email || staff.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditRoleModalOpen(true)}
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Manager */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Manager</div>
                      <div style={{ fontSize: "0.95rem", color: "#1d4ed8", fontWeight: 500, marginTop: "0.25rem", textDecoration: "underline" }}>
                        {staff.manager_name || "Marcus Cooper"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditRoleModalOpen(true)}
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Work Card */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Work
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditWorkModalOpen(true)}
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Edit
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Worker type</div>
                    <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500, marginTop: "0.25rem" }}>
                      {workerType}
                    </div>
                  </div>

                  <div style={{ paddingTop: "0.5rem", borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Country</div>
                    <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500, marginTop: "0.25rem" }}>
                      {staff.country || "United States of America"}
                    </div>
                  </div>

                  <div style={{ paddingTop: "0.5rem", borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Start date</div>
                    <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500, marginTop: "0.25rem" }}>
                      {staff.hire_date ? new Date(staff.hire_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jan 22, 2023"}
                    </div>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.85rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer", marginTop: "0.6rem", padding: 0 }}
                      onClick={() => setWorkHistoryModalOpen(true)}
                    >
                      View work history
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: PAY (Image 1 replica) */}
          {activeSubTab === "pay" && (
            <>
              {/* Payment Method Card */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                      Payment
                    </h2>
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Payment method</div>
                  <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500, marginTop: "0.25rem" }}>
                    Direct deposit
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Bank account</div>
                      <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500, marginTop: "0.25rem" }}>
                        Bank Account #1 (Checking)
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.15rem" }}>
                        XXXX{staff.ssn_last4 || "7600"}
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                      onClick={() => setBankOptionsModalOpen(true)}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                    padding: 0
                  }}
                  onClick={() => setAddPaymentMethodModalOpen(true)}
                >
                  <Plus className="w-4 h-4" /> Add payment method
                </button>
              </div>

              {/* Compensation Card */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Compensation
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditCompModalOpen(true)}
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Edit
                  </button>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Job title</div>
                  <div style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500, marginTop: "0.25rem" }}>
                    {staff.job_title || "—"}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Rate</div>
                  <div style={{ fontSize: "1.05rem", color: "#111827", fontWeight: 600, marginTop: "0.25rem" }}>
                    ${parseFloat(staff.hourly_rate || 30).toFixed(2)} per hour
                  </div>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.85rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer", marginTop: "0.6rem", padding: 0 }}
                    onClick={() => setCompHistoryModalOpen(true)}
                  >
                    View compensation history
                  </button>
                </div>
              </div>

              {/* Recent Contractor Payments Card */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Recent contractor payments
                  </h2>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.875rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}
                    onClick={() => setAllPaymentsModalOpen(true)}
                  >
                    View all
                  </button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Payday</th>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Payment method</th>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Status</th>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Total</th>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "0.85rem 0.5rem", color: "#111827" }}>Oct 2, 2026</td>
                        <td style={{ padding: "0.85rem 0.5rem", color: "#4b5563" }}>Direct deposit</td>
                        <td style={{ padding: "0.85rem 0.5rem" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#1d4ed8", fontSize: "0.8rem", fontWeight: 600 }}>
                            ● Complete
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 0.5rem", fontWeight: 600, color: "#111827" }}>$1,200.00</td>
                        <td style={{ padding: "0.85rem 0.5rem", color: "#9ca3af", cursor: "pointer" }}>⋮</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "0.85rem 0.5rem", color: "#111827" }}>Sep 18, 2026</td>
                        <td style={{ padding: "0.85rem 0.5rem", color: "#4b5563" }}>Direct deposit</td>
                        <td style={{ padding: "0.85rem 0.5rem" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#1d4ed8", fontSize: "0.8rem", fontWeight: 600 }}>
                            ● Complete
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 0.5rem", fontWeight: 600, color: "#111827" }}>$1,200.00</td>
                        <td style={{ padding: "0.85rem 0.5rem", color: "#9ca3af", cursor: "pointer" }}>⋮</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB: PERSONAL (Preferred name, Legal name, Pronouns, SSN, Birthday, Personal email, Address & Emergency Contact) */}
          {activeSubTab === "personal" && (
            <>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Personal details
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditPersonalModalOpen(true)}
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Edit
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Preferred listed name</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827", marginTop: "0.15rem" }}>
                      {staff.preferred_name || staff.name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Legal name</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827", marginTop: "0.15rem" }}>
                      {staff.legal_name || staff.name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Pronouns</div>
                    <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.15rem" }}>
                      {staff.pronouns || "she/her/hers"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Social Security number (SSN)</div>
                    <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.15rem" }}>
                      ***-**-{staff.ssn_last4 || "7600"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Birthday</div>
                    <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.15rem" }}>
                      {staff.birthday || "October 14, 1992"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Personal email</div>
                    <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.15rem" }}>
                      {staff.personal_email || staff.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address & Emergency Contact */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>Home address</h3>
                    <button
                      type="button"
                      onClick={() => setEditPersonalModalOpen(true)}
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Edit
                    </button>
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.5 }}>
                    {staff.address?.street || "1420 Peachtree St NE, Apt 4B"}<br />
                    {staff.address?.city || "Atlanta"}, {staff.address?.state || "GA"} {staff.address?.zip || "30309"}<br />
                    {staff.address?.country || "United States of America"}
                  </div>
                </div>

                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>Emergency contact</h3>
                    <button
                      type="button"
                      onClick={() => setEditPersonalModalOpen(true)}
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Edit
                    </button>
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.5 }}>
                    <strong>{staff.emergency_contact?.name || "David Rigsby"}</strong> ({staff.emergency_contact?.relationship || "Spouse"})<br />
                    Phone: {staff.emergency_contact?.phone || "+1 (404) 555-0188"}<br />
                    Email: {staff.emergency_contact?.email || "david.rigsby@example.com"}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: DOCUMENTS (Image 2 Replica) */}
          {activeSubTab === "documents" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.75rem" }}>
              {/* Header with Title & Top Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem"
                }}
              >
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                  Documents
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setManage1099ModalOpen(true)}
                    style={{
                      borderColor: "#d1d5db",
                      color: "#374151",
                      backgroundColor: "#ffffff",
                      fontWeight: 600,
                      borderRadius: "8px",
                      padding: "0.45rem 0.95rem"
                    }}
                  >
                    Manage 1099 filing
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setAddDocModalOpen(true)}
                    style={{
                      backgroundColor: "#2563eb",
                      borderColor: "#2563eb",
                      fontWeight: 600,
                      borderRadius: "8px",
                      padding: "0.45rem 1rem"
                    }}
                  >
                    Add document
                  </Button>
                </div>
              </div>

              {/* Search & Filter Row (Image 2 replica) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1.25rem"
                }}
              >
                <div style={{ position: "relative", flex: 1, maxWidth: "380px" }}>
                  <Search className="w-4 h-4 text-slate-400" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Search Documents"
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.75rem 0.45rem 2.25rem",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Button
                    variant="light"
                    size="sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                      fontSize: "0.825rem",
                      fontWeight: 600
                    }}
                    onClick={() => {
                      setDocFilterType((prev) => (prev === "all" ? "tax" : prev === "tax" ? "schedule" : "all"));
                    }}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter{docFilterType !== "all" ? `: ${docFilterType}` : ""}</span>
                  </Button>

                  <Button
                    variant="light"
                    size="sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                      fontSize: "0.825rem",
                      fontWeight: 600
                    }}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Columns</span>
                  </Button>
                </div>
              </div>

              {/* Documents Table (Image 2 replica) */}
              <div style={{ overflowX: "auto" }}>
                <Table hover responsive style={{ fontSize: "0.875rem", marginBottom: 0 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#64748b" }}>
                      <th style={{ fontWeight: 600, padding: "0.75rem 0.5rem" }}>
                        Name ↕
                      </th>
                      <th style={{ fontWeight: 600, padding: "0.75rem 0.5rem" }}>
                        Status ↕
                      </th>
                      <th style={{ fontWeight: 600, padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.95rem 0.5rem" }}>
                          <div style={{ fontWeight: 600, color: "#1d4ed8", textDecoration: "underline", cursor: "pointer" }} onClick={() => setPreviewDocModal(doc)}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                            {doc.desc}
                          </div>
                        </td>

                        <td style={{ padding: "0.95rem 0.5rem", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: doc.status === "Filed" ? "#0284c7" : doc.status === "Signed" ? "#1d4ed8" : "#2563eb"
                              }}
                            />
                            <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.825rem" }}>
                              {doc.status}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "14px", marginTop: "0.1rem" }}>
                            {doc.statusDate}
                          </div>
                        </td>

                        <td style={{ padding: "0.95rem 0.5rem", verticalAlign: "middle", textAlign: "right" }}>
                          {doc.hasMenu ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal(doc)}
                              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal(doc)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#2563eb",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                textDecoration: "underline",
                                cursor: "pointer"
                              }}
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Table Pagination Footer (Image 2 replica) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid #f1f5f9",
                  marginTop: "0.5rem",
                  fontSize: "0.825rem",
                  color: "#64748b"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Form.Select size="sm" defaultValue="25" style={{ width: "70px", fontSize: "0.8rem" }}>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </Form.Select>
                  <span>Items per page</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#94a3b8" }}>
                  <span style={{ cursor: "pointer" }}>⏮</span>
                  <span style={{ cursor: "pointer" }}>◀</span>
                  <span style={{ cursor: "pointer" }}>▶</span>
                  <span style={{ cursor: "pointer" }}>⏭</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PERFORMANCE */}
          {activeSubTab === "performance" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.75rem" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>Performance & Reviews</h2>
              <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Goal tracking, performance feedback, and quarterly evaluations for {staffName}.
              </p>
            </div>
          )}

          {/* TAB: APPS */}
          {activeSubTab === "apps" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.75rem" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>Integrated Apps</h2>
              <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Connected Stripe payout accounts, Google Workspace single sign-on, and timecard automations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD DOCUMENT (Image 2 [Add document] button)      */}
      {/* ======================================================== */}
      <Modal show={addDocModalOpen} onHide={() => setAddDocModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Add Document for {staffName}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddDocument}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Document Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. 2026 Compensation Addendum"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Document Category</Form.Label>
              <Form.Select value={newDocType} onChange={(e) => setNewDocType(e.target.value)}>
                <option value="policy">Policy / Agreement</option>
                <option value="handbook">Employee Handbook</option>
                <option value="schedule">Pay Schedule</option>
                <option value="tax">Tax Form (1099 / W-9)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Upload File (PDF, DOCX, Image)</Form.Label>
              <Form.Control type="file" />
            </Form.Group>
            <Form.Check
              type="checkbox"
              id="req-ack-check"
              label="Require Contractor Signature / Acknowledgment"
              checked={newDocRequiresAck}
              onChange={(e) => setNewDocRequiresAck(e.target.checked)}
              className="small fw-semibold text-slate-700 mt-2"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setAddDocModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
              Upload & Assign Document
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: MANAGE 1099 FILING (Image 2 button)              */}
      {/* ======================================================== */}
      <Modal show={manage1099ModalOpen} onHide={() => setManage1099ModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Manage Form 1099 Filing — {staffName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
            <div className="fw-semibold text-blue-900 small mb-1">IRS 1099-NEC Filing Summary</div>
            <div className="small text-blue-700">
              Tax Year 2025: Reported Gross Contractor Payments: <strong>$28,800.00</strong>.
              Form filed on Feb 2, 2026.
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-sm">
            <span className="text-slate-600">Tax ID / SSN</span>
            <span className="fw-semibold">***-**-{staff.ssn_last4 || "7600"} (Verified)</span>
          </div>
          <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-sm">
            <span className="text-slate-600">IRS E-File Status</span>
            <span className="badge bg-emerald-100 text-emerald-800">Accepted by IRS</span>
          </div>
          <div className="d-flex justify-content-between align-items-center py-2 text-sm">
            <span className="text-slate-600">State Filing Copy</span>
            <span className="badge bg-blue-100 text-blue-800">Transmitted</span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setManage1099ModalOpen(false)}>
            Close
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => {
              setManage1099ModalOpen(false);
              showToast("Form 1099 PDF downloaded.");
            }}
          >
            Download Copy (PDF)
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: PREVIEW DOCUMENT (Replaces window.alert)          */}
      {/* ======================================================== */}
      <Modal show={Boolean(previewDocModal)} onHide={() => setPreviewDocModal(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            {previewDocModal?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <h5 className="fw-bold text-slate-800 mb-1">{previewDocModal?.name}</h5>
            <p className="text-muted small mb-3">{previewDocModal?.desc}</p>
            <div className="inline-flex gap-2">
              <span className="badge bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">
                Status: {previewDocModal?.status} on {previewDocModal?.statusDate}
              </span>
            </div>
            <div className="mt-4 p-3 bg-white border rounded text-start text-xs text-slate-500 font-mono">
              [Document Verification Hash: SHA-256: 8f9b2c... Authenticated by ELA Academy Compliance Hub]
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setPreviewDocModal(null)}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
            onClick={() => {
              setPreviewDocModal(null);
              showToast(`Downloaded '${previewDocModal?.name}'.`);
            }}
          >
            Download Official Copy
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ======================================================== */}
      {/* EDIT COMPENSATION MODAL (Image 5 replica)                */}
      {/* ======================================================== */}
      {editCompModalOpen && (
        <div className="gusto-drawer-overlay" onClick={() => setEditCompModalOpen(false)}>
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                Edit compensation
              </h2>
              <button
                type="button"
                onClick={() => setEditCompModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompensation} style={{ padding: "1.5rem" }}>
              <div className="gusto-form-group">
                <label className="gusto-form-label">Job title (optional)</label>
                <div style={{ position: "relative" }}>
                  <select
                    className="gusto-select"
                    value={compJobTitle}
                    onChange={(e) => setCompJobTitle(e.target.value)}
                  >
                    <option value="">(None)</option>
                    <option value="Accounting Manager">Accounting Manager</option>
                    <option value="Administrator Assistant">Administrator Assistant</option>
                    <option value="Teacher Aide">Teacher Aide</option>
                    <option value="HR Specialist">HR Specialist</option>
                    <option value="Teacher">Teacher</option>
                  </select>
                </div>
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                    padding: 0
                  }}
                  onClick={() => setCreateJobTitleModalOpen(true)}
                >
                  <Plus className="w-4 h-4" /> Create job title
                </button>
              </div>

              <div className="gusto-form-group" style={{ marginTop: "1.25rem" }}>
                <label className="gusto-form-label">Rate (optional)</label>
                <div style={{ fontSize: "0.775rem", color: "#6b7280", marginBottom: "0.4rem" }}>
                  Rate changes for contractors take effect immediately.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ position: "relative", width: "140px" }}>
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#4b5563", fontWeight: 600 }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="gusto-select"
                      style={{ paddingLeft: "1.75rem" }}
                      value={compRate}
                      onChange={(e) => setCompRate(e.target.value)}
                      required
                    />
                  </div>
                  <span style={{ fontSize: "0.9rem", color: "#374151" }}>per hour</span>
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", color: "#374151", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={compReceivesTips}
                    onChange={(e) => setCompReceivesTips(e.target.checked)}
                    style={{ accentColor: "#2563eb", width: "16px", height: "16px" }}
                  />
                  <span>This contractor receives tips</span>
                </label>
              </div>

              <div className="gusto-form-group" style={{ marginTop: "1.25rem" }}>
                <label className="gusto-form-label">Reason for change</label>
                <select
                  className="gusto-select"
                  value={compReason}
                  onChange={(e) => setCompReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Merit increase">Merit increase</option>
                  <option value="Annual review">Annual review</option>
                  <option value="Market adjustment">Market adjustment</option>
                  <option value="Correction">Correction</option>
                </select>
              </div>

              <div className="gusto-form-group" style={{ marginTop: "1.25rem" }}>
                <label className="gusto-form-label">Effective date</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={compEffectiveDate}
                  onChange={(e) => setCompEffectiveDate(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="gusto-btn gusto-btn-secondary"
                  onClick={() => setEditCompModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gusto-btn gusto-btn-primary"
                  style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE JOB TITLE MODAL (Replaces prompt()) */}
      <Modal show={createJobTitleModalOpen} onHide={() => setCreateJobTitleModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>Create New Job Title</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group>
            <Form.Label className="small fw-semibold text-slate-700">Job Title Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Lead STEM Instructor"
              value={newCustomJobTitle}
              onChange={(e) => setNewCustomJobTitle(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setCreateJobTitleModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (newCustomJobTitle.trim()) {
                setCompJobTitle(newCustomJobTitle.trim());
                setNewCustomJobTitle("");
              }
              setCreateJobTitleModalOpen(false);
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          >
            Apply Title
          </Button>
        </Modal.Footer>
      </Modal>

      {/* WORK HISTORY MODAL (Replaces window.alert) */}
      <Modal show={workHistoryModalOpen} onHide={() => setWorkHistoryModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>Work History — {staffName}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-sm text-slate-700">
          <div className="py-2 border-bottom">
            <div className="fw-semibold text-slate-900">Current Role: {staff.job_title || "Instructor"}</div>
            <div className="text-xs text-slate-500">Jan 22, 2023 – Present • Full Contractor</div>
          </div>
          <div className="py-2 text-xs text-slate-500">
            Initial Onboarding verified by Marcus Cooper (Super Admin) on Jan 20, 2023.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setWorkHistoryModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* COMPENSATION HISTORY MODAL (Replaces window.alert) */}
      <Modal show={compHistoryModalOpen} onHide={() => setCompHistoryModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>Compensation Adjustments History</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-sm text-slate-700">
          <div className="py-2 border-bottom">
            <div className="fw-semibold text-slate-900">${parseFloat(staff.hourly_rate || 30).toFixed(2)}/hr</div>
            <div className="text-xs text-slate-500">Effective Oct 6, 2026 • Annual Review adjustment</div>
          </div>
          <div className="py-2 text-xs text-slate-500">
            Previous rate: $28.00/hr (Jan 22, 2023 – Oct 5, 2026).
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setCompHistoryModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* BANK OPTIONS MODAL (Replaces window.alert) */}
      <Modal show={bankOptionsModalOpen} onHide={() => setBankOptionsModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>Bank Account Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-sm">
          <p className="text-slate-600 mb-3">Checking Account ending in XXXX{staff.ssn_last4 || "7600"}.</p>
          <Button variant="outline-primary" size="sm" className="w-100 mb-2" onClick={() => { setBankOptionsModalOpen(false); showToast("Micro-deposit verification re-sent."); }}>
            Re-verify Bank Account
          </Button>
          <Button variant="outline-secondary" size="sm" className="w-100" onClick={() => { setBankOptionsModalOpen(false); showToast("Routing information exported."); }}>
            View Full Routing Code
          </Button>
        </Modal.Body>
      </Modal>

      {/* ADD PAYMENT METHOD MODAL (Replaces window.alert) */}
      <Modal show={addPaymentMethodModalOpen} onHide={() => setAddPaymentMethodModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>Add Payment Method</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Method Type</Form.Label>
            <Form.Select size="sm">
              <option>Direct Deposit (Checking)</option>
              <option>Direct Deposit (Savings)</option>
              <option>Stripe Connect Express Account</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Routing Number</Form.Label>
            <Form.Control type="text" placeholder="9 digits" size="sm" />
          </Form.Group>
          <Form.Group>
            <Form.Label className="small fw-semibold text-slate-700">Account Number</Form.Label>
            <Form.Control type="text" placeholder="Account Number" size="sm" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setAddPaymentMethodModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setAddPaymentMethodModalOpen(false); showToast("Payment method registered."); }} style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
            Save Account
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ALL PAYMENTS MODAL (Replaces window.alert) */}
      <Modal show={allPaymentsModalOpen} onHide={() => setAllPaymentsModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>Payment History — {staffName}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Table hover responsive style={{ fontSize: "0.85rem" }}>
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th>Payday</th>
                <th>Method</th>
                <th>Gross Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Oct 2, 2026</td>
                <td>Direct Deposit</td>
                <td className="fw-bold">$1,200.00</td>
                <td><span className="badge bg-blue-100 text-blue-800">● Complete</span></td>
              </tr>
              <tr>
                <td>Sep 18, 2026</td>
                <td>Direct Deposit</td>
                <td className="fw-bold">$1,200.00</td>
                <td><span className="badge bg-blue-100 text-blue-800">● Complete</span></td>
              </tr>
              <tr>
                <td>Sep 4, 2026</td>
                <td>Direct Deposit</td>
                <td className="fw-bold">$1,200.00</td>
                <td><span className="badge bg-blue-100 text-blue-800">● Complete</span></td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setAllPaymentsModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* EDIT ROLE MODAL */}
      <Modal show={editRoleModalOpen} onHide={() => setEditRoleModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>Edit Role Details</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveRole}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Department</Form.Label>
              <Form.Control
                type="text"
                value={roleDepartment}
                onChange={(e) => setRoleDepartment(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Work Email</Form.Label>
              <Form.Control
                type="email"
                value={roleWorkEmail}
                onChange={(e) => setRoleWorkEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-semibold text-slate-700">Manager Name</Form.Label>
              <Form.Control
                type="text"
                value={roleManager}
                onChange={(e) => setRoleManager(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setEditRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
              Save Role Details
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT PERSONAL DETAILS MODAL */}
      <Modal show={editPersonalModalOpen} onHide={() => setEditPersonalModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>Edit Personal Details & Contacts</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSavePersonal}>
          <Modal.Body className="p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label className="small fw-semibold text-slate-700">Preferred Name</Form.Label>
                <Form.Control
                  type="text"
                  value={personalForm.preferred_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, preferred_name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-semibold text-slate-700">Legal Name</Form.Label>
                <Form.Control
                  type="text"
                  value={personalForm.legal_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, legal_name: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <Form.Label className="small fw-semibold text-slate-700">Pronouns</Form.Label>
                <Form.Control
                  type="text"
                  value={personalForm.pronouns}
                  onChange={(e) => setPersonalForm({ ...personalForm, pronouns: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <Form.Label className="small fw-semibold text-slate-700">SSN (Last 4 Digits)</Form.Label>
                <Form.Control
                  type="text"
                  maxLength={4}
                  value={personalForm.ssn_last4}
                  onChange={(e) => setPersonalForm({ ...personalForm, ssn_last4: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <Form.Label className="small fw-semibold text-slate-700">Birthday</Form.Label>
                <Form.Control
                  type="text"
                  value={personalForm.birthday}
                  onChange={(e) => setPersonalForm({ ...personalForm, birthday: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-semibold text-slate-700">Personal Email</Form.Label>
                <Form.Control
                  type="email"
                  value={personalForm.personal_email}
                  onChange={(e) => setPersonalForm({ ...personalForm, personal_email: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-semibold text-slate-700">Phone</Form.Label>
                <Form.Control
                  type="text"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                />
              </div>
              <div className="col-12"><hr className="my-2" /><div className="fw-bold small text-slate-900">Home Address</div></div>
              <div className="col-md-12">
                <Form.Label className="small fw-semibold text-slate-700">Street</Form.Label>
                <Form.Control
                  type="text"
                  value={personalForm.street}
                  onChange={(e) => setPersonalForm({ ...personalForm, street: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <Form.Label className="small fw-semibold text-slate-700">City</Form.Label>
                <Form.Control
                  type="text"
                  value={personalForm.city}
                  onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <Form.Label className="small fw-semibold text-slate-700">State</Form.Label>
                <Form.Control
                  type="text"
                  value={personalForm.state}
                  onChange={(e) => setPersonalForm({ ...personalForm, state: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <Form.Label className="small fw-semibold text-slate-700">ZIP</Form.Label>
                <Form.Control
                  type="text"
                  value={personalForm.zip}
                  onChange={(e) => setPersonalForm({ ...personalForm, zip: e.target.value })}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setEditPersonalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
              Save Personal Information
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PayrollStaffProfilePage;
