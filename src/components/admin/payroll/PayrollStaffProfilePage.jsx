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
  ChevronDown
} from "lucide-react";
import { getStaffById, updateStaff, updateStaffCompensation } from "../../../services/staffService";
import "../../../styles/GustoTheme.css";

const PayrollStaffProfilePage = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("work"); // "work" | "pay" | "personal" | "documents" | "performance" | "apps"
  const [toastMessage, setToastMessage] = useState("");

  // Modals
  const [editCompModalOpen, setEditCompModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [editPersonalModalOpen, setEditPersonalModalOpen] = useState(false);
  const [editWorkModalOpen, setEditWorkModalOpen] = useState(false);

  // Compensation Form State (Image 5 replica)
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

  useEffect(() => {
    fetchStaffDetails();
  }, [staffId]);

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
      console.error("Error loading staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Save Compensation (Image 5)
  const handleSaveCompensation = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateStaffCompensation(staffId, {
        rate: parseFloat(compRate) || 30.0,
        job_title: compJobTitle,
        receives_tips: compReceivesTips,
        effective_date: compEffectiveDate,
        reason: compReason || "Rate update"
      });
      setStaff(updated);
      setEditCompModalOpen(false);
      showToast("Compensation rate updated successfully.");
    } catch (err) {
      console.error("Failed to update compensation:", err);
      alert("Failed to update compensation rate.");
    }
  };

  // Save Role
  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateStaff(staffId, {
        job_title: roleJobTitle,
        work_email: roleWorkEmail,
        manager_name: roleManager
      });
      setStaff(updated);
      setEditRoleModalOpen(false);
      showToast("Role details updated successfully.");
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Failed to update role details.");
    }
  };

  // Save Personal Details
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateStaff(staffId, {
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
      });
      setStaff(updated);
      setEditPersonalModalOpen(false);
      showToast("Staff personal and address details updated successfully.");
    } catch (err) {
      console.error("Failed to update personal details:", err);
      alert("Failed to update personal information.");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
        Loading staff details from database...
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
          style={{ marginTop: "1rem", color: "#0d5c46", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
        >
          ← Return to People roster
        </button>
      </div>
    );
  }

  const staffName = staff.preferred_name || staff.name || "Caitlin MacFarlane";
  const workerType = staff.worker_type || "Contractor";

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Profile Header matching Image 4 & Image 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
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
            backgroundColor: "#f3f4f6",
            border: "2px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1e293b"
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

      {toastMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#16a34a",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
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

      {/* Main Grid: Left Subnav + Right Content Panels */}
      <div style={{ display: "flex", gap: "2.5rem", alignItems: "flex-start" }}>
        {/* Left Sub-navigation */}
        <aside style={{ width: "160px", flexShrink: 0 }}>
          {/* Information Group */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827", marginBottom: "0.6rem" }}>
              Information
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
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
                    padding: "0.45rem 0.6rem",
                    fontSize: "0.9rem",
                    fontWeight: activeSubTab === item.id ? 700 : 400,
                    color: activeSubTab === item.id ? "#111827" : "#4b5563",
                    backgroundColor: activeSubTab === item.id ? "#f3f4f6" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Group */}
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827", marginBottom: "0.6rem" }}>
              Additional
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
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
                    padding: "0.45rem 0.6rem",
                    fontSize: "0.9rem",
                    fontWeight: activeSubTab === item.id ? 700 : 400,
                    color: activeSubTab === item.id ? "#111827" : "#4b5563",
                    backgroundColor: activeSubTab === item.id ? "#f3f4f6" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* TAB: WORK (Image 4 replica) */}
          {activeSubTab === "work" && (
            <>
              {/* Card 1: Role */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem"
                }}
              >
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 1.25rem" }}>
                  Role
                </h2>

                {/* Job title */}
                <div style={{ paddingBottom: "1.25rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Job title</span>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.25rem" }}>
                    {staff.job_title || "Accounting Manager"}
                  </div>
                </div>

                {/* Department */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1.25rem 0",
                    borderBottom: "1px solid #f1f5f9"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Department</div>
                    <div style={{ fontSize: "0.9rem", color: "#0f766e", textDecoration: "underline", marginTop: "0.25rem" }}>
                      {staff.department || staff.department_names?.join(", ") || "Accounting Department"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditRoleModalOpen(true)}
                    style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Edit
                  </button>
                </div>

                {/* Work email */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1.25rem 0",
                    borderBottom: "1px solid #f1f5f9"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Work email</div>
                    <div style={{ fontSize: "0.9rem", color: "#0f766e", textDecoration: "underline", marginTop: "0.25rem" }}>
                      {staff.work_email || staff.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditRoleModalOpen(true)}
                    style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Edit
                  </button>
                </div>

                {/* Manager */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "1.25rem"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Manager</div>
                    <div style={{ fontSize: "0.9rem", color: "#0f766e", textDecoration: "underline", marginTop: "0.25rem" }}>
                      {staff.manager_name || "Marcus Cooper"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditRoleModalOpen(true)}
                    style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Card 2: Work */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Work
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditWorkModalOpen(true)}
                    style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Edit
                  </button>
                </div>

                <div style={{ paddingBottom: "1.25rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Worker type</div>
                  <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.25rem" }}>
                    {staff.worker_type || "Contractor"}
                  </div>
                </div>

                <div style={{ padding: "1.25rem 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Country</div>
                  <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.25rem" }}>
                    {staff.country || "United States of America"}
                  </div>
                </div>

                <div style={{ paddingTop: "1.25rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Start date</div>
                  <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.25rem" }}>
                    {staff.start_date || "Jan 22, 2023"}
                  </div>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.85rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer", marginTop: "0.6rem", padding: 0 }}
                    onClick={() => alert("Showing full work history")}
                  >
                    View work history
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB: PAY (Image 1 replica) */}
          {activeSubTab === "pay" && (
            <>
              {/* Card 1: Payment */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem"
                }}
              >
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 1.25rem" }}>
                  Payment
                </h2>

                <div style={{ paddingBottom: "1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Payment method</div>
                    <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.25rem" }}>
                      {staff.payment_method || "Direct deposit"}
                    </div>
                  </div>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>

                <div style={{ padding: "1.25rem 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Bank account</div>
                    <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.25rem" }}>
                      Bank Account #1 ({staff.bank_account_type || "Checking"})
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.15rem" }}>
                      XXXX{staff.bank_account_last4 || "7600"}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                    onClick={() => alert("Bank options: Verify, View routing, Archive")}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0f766e",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: 0
                  }}
                  onClick={() => alert("Add payment method modal")}
                >
                  <Plus className="w-4 h-4" /> Add payment method
                </button>
              </div>

              {/* Card 2: Compensation (Image 1 replica with Edit button opening Image 5) */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Compensation
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditCompModalOpen(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0f766e",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Edit
                  </button>
                </div>

                <div style={{ paddingBottom: "1.25rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Job title</div>
                  <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.25rem" }}>
                    {staff.job_title || "—"}
                  </div>
                </div>

                <div style={{ paddingTop: "1.25rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Rate</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827", marginTop: "0.25rem" }}>
                    {staff.rate_formatted || `$${staff.hourly_rate || 30.00} per hour`}
                  </div>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.85rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer", marginTop: "0.6rem", padding: 0 }}
                    onClick={() => alert("Showing compensation adjustments history")}
                  >
                    View compensation history
                  </button>
                </div>
              </div>

              {/* Card 3: Recent contractor payments */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Recent contractor payments
                  </h2>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.875rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}
                    onClick={() => alert("All contractor payments")}
                  >
                    View all
                  </button>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", textAlign: "left" }}>
                      <th style={{ padding: "0.65rem 0.5rem", fontWeight: 600 }}>Payday</th>
                      <th style={{ padding: "0.65rem 0.5rem", fontWeight: 600 }}>Payment method</th>
                      <th style={{ padding: "0.65rem 0.5rem", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "0.65rem 0.5rem", fontWeight: 600 }}>Total</th>
                      <th style={{ padding: "0.65rem 0.5rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#0f766e", textDecoration: "underline", fontWeight: 500 }}>
                        Oct 2, 2026
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#374151" }}>Direct deposit</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#16a34a", fontWeight: 600 }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
                          Complete
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "#111827" }}>
                        $1,200.00
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        <button type="button" style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB: PERSONAL */}
          {activeSubTab === "personal" && (
            <>
              {/* Personal details card */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Personal details
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditPersonalModalOpen(true)}
                    style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
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
                      style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
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
                      style={{ background: "none", border: "none", color: "#0f766e", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
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

          {/* TAB: DOCUMENTS */}
          {activeSubTab === "documents" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>Staff Documents</h2>
              <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Signed onboarding agreements, W-9 contractor tax forms, and pay schedules for {staffName}.
              </p>
            </div>
          )}

          {/* TAB: PERFORMANCE */}
          {activeSubTab === "performance" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>Performance & Reviews</h2>
              <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Goal tracking and review ratings for {staffName}.
              </p>
            </div>
          )}

          {/* TAB: APPS */}
          {activeSubTab === "apps" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>Integrated Apps</h2>
              <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Connected Stripe payout accounts, Google Workspace single sign-on, and timecard automations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* EDIT COMPENSATION MODAL (Image 5 replica) */}
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
            {/* Header */}
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
              {/* Job title (optional) */}
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
                    <option value="Teacher">Teacher</option>
                    <option value="HR Specialist">HR Specialist</option>
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
                    color: "#0f766e",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                    padding: 0
                  }}
                  onClick={() => {
                    const customTitle = prompt("Enter new job title:");
                    if (customTitle) setCompJobTitle(customTitle);
                  }}
                >
                  <Plus className="w-4 h-4" /> Create job title
                </button>
              </div>

              {/* Rate (optional) */}
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

              {/* Checkbox: This contractor receives tips */}
              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", color: "#374151", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={compReceivesTips}
                    onChange={(e) => setCompReceivesTips(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#0d5c46" }}
                  />
                  <span>This contractor receives tips</span>
                </label>
              </div>

              {/* Reason for change (optional) */}
              <div className="gusto-form-group" style={{ marginTop: "1.25rem" }}>
                <label className="gusto-form-label">Reason for change (optional)</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={compReason}
                  onChange={(e) => setCompReason(e.target.value)}
                  placeholder="e.g. Annual rate review, market adjustment"
                />
              </div>

              {/* Effective date */}
              <div className="gusto-form-group" style={{ marginTop: "1.25rem" }}>
                <label className="gusto-form-label">Effective date</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="gusto-select"
                    value={compEffectiveDate}
                    onChange={(e) => setCompEffectiveDate(e.target.value)}
                    placeholder="MM/DD/YYYY"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setCompEffectiveDate("")}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "2rem" }}>
                <button
                  type="button"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#374151",
                    cursor: "pointer"
                  }}
                  onClick={() => setEditCompModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#0d5c46",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    cursor: "pointer"
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editRoleModalOpen && (
        <div className="gusto-drawer-overlay" onClick={() => setEditRoleModalOpen(false)}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "480px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: 0 }}>Edit staff role</h2>
              <button type="button" onClick={() => setEditRoleModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRole} style={{ padding: "1.5rem" }}>
              <div className="gusto-form-group">
                <label className="gusto-form-label">Job title</label>
                <input type="text" className="gusto-select" value={roleJobTitle} onChange={(e) => setRoleJobTitle(e.target.value)} required />
              </div>
              <div className="gusto-form-group" style={{ marginTop: "1rem" }}>
                <label className="gusto-form-label">Work email</label>
                <input type="email" className="gusto-select" value={roleWorkEmail} onChange={(e) => setRoleWorkEmail(e.target.value)} required />
              </div>
              <div className="gusto-form-group" style={{ marginTop: "1rem" }}>
                <label className="gusto-form-label">Manager</label>
                <input type="text" className="gusto-select" value={roleManager} onChange={(e) => setRoleManager(e.target.value)} required />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.75rem" }}>
                <button type="button" className="gusto-btn-secondary" onClick={() => setEditRoleModalOpen(false)}>Cancel</button>
                <button type="submit" className="gusto-btn-primary">Save role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERSONAL MODAL */}
      {editPersonalModalOpen && (
        <div className="gusto-drawer-overlay" onClick={() => setEditPersonalModalOpen(false)}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: 0 }}>Edit personnel details (Admin)</h2>
              <button type="button" onClick={() => setEditPersonalModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePersonal} style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">Preferred name</label>
                  <input type="text" className="gusto-select" value={personalForm.preferred_name} onChange={(e) => setPersonalForm({ ...personalForm, preferred_name: e.target.value })} required />
                </div>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">Legal name</label>
                  <input type="text" className="gusto-select" value={personalForm.legal_name} onChange={(e) => setPersonalForm({ ...personalForm, legal_name: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">Pronouns</label>
                  <input type="text" className="gusto-select" value={personalForm.pronouns} onChange={(e) => setPersonalForm({ ...personalForm, pronouns: e.target.value })} />
                </div>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">SSN (Last 4)</label>
                  <input type="text" className="gusto-select" maxLength={4} value={personalForm.ssn_last4} onChange={(e) => setPersonalForm({ ...personalForm, ssn_last4: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">Birthday</label>
                  <input type="text" className="gusto-select" value={personalForm.birthday} onChange={(e) => setPersonalForm({ ...personalForm, birthday: e.target.value })} />
                </div>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">Phone</label>
                  <input type="text" className="gusto-select" value={personalForm.phone} onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e5e7eb", margin: "1.25rem 0", paddingTop: "1rem" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>Address</div>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">Street</label>
                  <input type="text" className="gusto-select" value={personalForm.street} onChange={(e) => setPersonalForm({ ...personalForm, street: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">City</label>
                    <input type="text" className="gusto-select" value={personalForm.city} onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })} />
                  </div>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">State</label>
                    <input type="text" className="gusto-select" value={personalForm.state} onChange={(e) => setPersonalForm({ ...personalForm, state: e.target.value })} />
                  </div>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">ZIP</label>
                    <input type="text" className="gusto-select" value={personalForm.zip} onChange={(e) => setPersonalForm({ ...personalForm, zip: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="gusto-btn-secondary" onClick={() => setEditPersonalModalOpen(false)}>Cancel</button>
                <button type="submit" className="gusto-btn-primary">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollStaffProfilePage;
