import React, { useState } from "react";
import {
  Pencil,
  Plus,
  MoreVertical,
  Info,
  Check,
  X,
  User,
  MapPin,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/GustoTheme.css";

const GustoProfilePage = () => {
  const { user } = useAuth();
  const staffName = user?.name || "Murrisa Rigsby";
  const userRole =
    user?.role === "teacher"
      ? "Teaching Faculty"
      : user?.role === "superadmin"
      ? "Super Administrator"
      : "Contractor";

  const [activeSubTab, setActiveSubTab] = useState("personal"); // "personal" | "pay" | "work"
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editPersonalModalOpen, setEditPersonalModalOpen] = useState(false);
  const [showSSN, setShowSSN] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Bank account state
  const [bankAccount, setBankAccount] = useState({
    name: "Bank Account #1 (Checking)",
    last4: "1036",
    bankName: "Chase Bank",
    routing: "021000021",
    accountNumber: "XXXXXXXX1036",
    type: "Checking"
  });

  // Modal bank form states
  const [modalBankName, setModalBankName] = useState("Chase Bank");
  const [modalAccountType, setModalAccountType] = useState("Checking");
  const [modalRouting, setModalRouting] = useState("021000021");
  const [modalAccountNumber, setModalAccountNumber] = useState("");

  // Personal state
  const [personalData, setPersonalData] = useState({
    preferredName: staffName,
    legalName: user?.legalName || (staffName === "Murrisa Rigsby" ? "Murrisa Jane Rigsby" : staffName),
    pronouns: user?.pronouns || "she / her / hers",
    ssn: "6789",
    birthday: "October 14, 1992",
    personalEmail: user?.personalEmail || (user?.email?.includes("@gmail.com") ? user.email : "murrisarigsby@gmail.com"),
    phoneNumber: user?.phone || "+1 (404) 555-0192",
    // Address
    streetAddress: "1420 Peachtree St NE, Apt 4B",
    city: "Atlanta",
    state: "GA",
    zipCode: "30309",
    country: "United States",
    // Emergency Contact
    emergencyName: "David Rigsby",
    emergencyRelationship: "Spouse",
    emergencyPhone: "+1 (404) 555-0188",
    emergencyEmail: "david.rigsby@example.com"
  });

  const [editForm, setEditForm] = useState({ ...personalData });

  // Compensation details
  const jobTitle =
    user?.role === "teacher"
      ? "Lead Classroom Teacher"
      : user?.departmentNames?.[0]
      ? `${user.departmentNames[0]} Specialist`
      : "Contractor / Accounting Assistant";
  const hourlyRate = user?.role === "teacher" ? "$28.50 per hour" : "$19.00 per hour";

  const handleSaveBank = (e) => {
    e.preventDefault();
    const last4 = modalAccountNumber ? modalAccountNumber.slice(-4) : "1036";
    setBankAccount({
      name: `Bank Account #1 (${modalAccountType})`,
      last4: last4,
      bankName: modalBankName,
      routing: modalRouting,
      accountNumber: `XXXXXXXX${last4}`,
      type: modalAccountType
    });
    setBankModalOpen(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSavePersonal = (e) => {
    e.preventDefault();
    setPersonalData({ ...editForm });
    setEditPersonalModalOpen(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div>
      {/* Profile Header Card */}
      <div className="gusto-profile-header-card">
        <div className="gusto-profile-avatar-box">
          <span>{personalData.preferredName.charAt(0)}</span>
          <div
            className="gusto-avatar-edit-icon"
            title="Edit profile photo"
            onClick={() => setEditPersonalModalOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <Pencil className="w-3 h-3" />
          </div>
        </div>
        <div>
          <h1 className="gusto-profile-title-name">{personalData.preferredName}</h1>
          <div className="gusto-profile-title-role">{userRole}</div>
        </div>
      </div>

      {savedSuccess && (
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
          <Check className="w-4 h-4" /> Profile details updated successfully.
        </div>
      )}

      {/* Profile Layout with Secondary Subnav */}
      <div className="gusto-profile-layout">
        {/* Left Sub-nav */}
        <aside className="gusto-profile-subnav">
          <div className="gusto-profile-subnav-title">Information</div>
          <button
            className={`gusto-profile-subnav-btn ${activeSubTab === "personal" ? "active" : ""}`}
            onClick={() => setActiveSubTab("personal")}
          >
            Personal
          </button>
          <button
            className={`gusto-profile-subnav-btn ${activeSubTab === "pay" ? "active" : ""}`}
            onClick={() => setActiveSubTab("pay")}
          >
            Pay
          </button>
          <button
            className={`gusto-profile-subnav-btn ${activeSubTab === "work" ? "active" : ""}`}
            onClick={() => setActiveSubTab("work")}
          >
            Work
          </button>
        </aside>

        {/* Right Content Panels */}
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* TAB: PERSONAL (User requirement: Column 1 = personal details, Column 2 = address & emergency contact) */}
          {activeSubTab === "personal" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "1.5rem",
                  alignItems: "start"
                }}
              >
                {/* Column 1: Personal Details */}
                <div className="gusto-profile-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem"
                    }}
                  >
                    <h2 className="gusto-profile-card-title" style={{ margin: 0 }}>
                      Personal details
                    </h2>
                    <button
                      type="button"
                      className="gusto-icon-btn"
                      onClick={() => {
                        setEditForm({ ...personalData });
                        setEditPersonalModalOpen(true);
                      }}
                      title="Edit personal details"
                      style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem", color: "#673de6", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Preferred listed name</div>
                      <div className="gusto-profile-detail-value">{personalData.preferredName}</div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Legal name</div>
                      <div className="gusto-profile-detail-value">{personalData.legalName}</div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Pronouns</div>
                      <div className="gusto-profile-detail-value">{personalData.pronouns}</div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div style={{ flex: 1 }}>
                      <div className="gusto-profile-detail-label">Social Security number (SSN)</div>
                      <div className="gusto-profile-detail-value" style={{ letterSpacing: showSSN ? "1px" : "2px" }}>
                        {showSSN ? `***-**-${personalData.ssn}` : `***-**-••••`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSSN(!showSSN)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#64748b",
                        padding: "4px"
                      }}
                      title={showSSN ? "Hide SSN" : "Show SSN"}
                    >
                      {showSSN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Birthday</div>
                      <div className="gusto-profile-detail-value">{personalData.birthday}</div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Personal email</div>
                      <div className="gusto-profile-detail-value">{personalData.personalEmail}</div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Phone number</div>
                      <div className="gusto-profile-detail-value">{personalData.phoneNumber}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", padding: "0.65rem 0.85rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>
                      Primary tax & employment identification details are maintained and verified during staff onboarding by administration.
                    </span>
                  </div>
                </div>

                {/* Column 2: Address & Emergency Contact */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Address Card */}
                  <div className="gusto-profile-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem"
                      }}
                    >
                      <h2 className="gusto-profile-card-title" style={{ margin: 0 }}>
                        Home address
                      </h2>
                      <button
                        type="button"
                        className="gusto-icon-btn"
                        onClick={() => {
                          setEditForm({ ...personalData });
                          setEditPersonalModalOpen(true);
                        }}
                        title="Edit address"
                        style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem", color: "#673de6", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Street address</div>
                        <div className="gusto-profile-detail-value">{personalData.streetAddress}</div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">City, State, Zip</div>
                        <div className="gusto-profile-detail-value">
                          {personalData.city}, {personalData.state} {personalData.zipCode}
                        </div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Country</div>
                        <div className="gusto-profile-detail-value">{personalData.country}</div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact Card */}
                  <div className="gusto-profile-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem"
                      }}
                    >
                      <h2 className="gusto-profile-card-title" style={{ margin: 0 }}>
                        Emergency contact
                      </h2>
                      <button
                        type="button"
                        className="gusto-icon-btn"
                        onClick={() => {
                          setEditForm({ ...personalData });
                          setEditPersonalModalOpen(true);
                        }}
                        title="Edit emergency contact"
                        style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem", color: "#673de6", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Full name</div>
                        <div className="gusto-profile-detail-value">{personalData.emergencyName}</div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Relationship</div>
                        <div className="gusto-profile-detail-value">{personalData.emergencyRelationship}</div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Phone number</div>
                        <div className="gusto-profile-detail-value">{personalData.emergencyPhone}</div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Email</div>
                        <div className="gusto-profile-detail-value">{personalData.emergencyEmail}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAY */}
          {activeSubTab === "pay" && (
            <div>
              {/* Payment Card */}
              <div className="gusto-profile-card">
                <h2 className="gusto-profile-card-title">Payment</h2>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Payment method</div>
                    <div className="gusto-profile-detail-value">Direct deposit (Stripe Connect)</div>
                  </div>
                  <Info className="w-4 h-4 text-slate-400" />
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Bank account</div>
                    <div className="gusto-profile-detail-value">{bankAccount.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.15rem" }}>
                      XXXX{bankAccount.last4} â€¢ {bankAccount.bankName}
                    </div>
                  </div>
                  <button
                    className="gusto-icon-btn"
                    onClick={() => setBankModalOpen(true)}
                    title="Account options"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <button
                  type="button"
                  className="gusto-add-method-btn"
                  onClick={() => setBankModalOpen(true)}
                >
                  <Plus className="w-4 h-4" /> Add payment method
                </button>
              </div>

              {/* Compensation Card */}
              <div className="gusto-profile-card">
                <h2 className="gusto-profile-card-title">Compensation</h2>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Job title</div>
                    <div className="gusto-profile-detail-value">{jobTitle}</div>
                  </div>
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Rate</div>
                    <div className="gusto-profile-detail-value" style={{ fontWeight: 600 }}>
                      {hourlyRate}
                    </div>
                    <div style={{ fontSize: "0.775rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                      Configured by School Administration â€¢ Paid weekly
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: WORK */}
          {activeSubTab === "work" && (
            <div className="gusto-profile-card">
              <h2 className="gusto-profile-card-title">Work information</h2>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Department</div>
                  <div className="gusto-profile-detail-value">
                    {user?.departmentNames?.join(", ") ||
                      (user?.role === "teacher" ? "Academic Faculty" : "Administration & Support")}
                  </div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Employment type</div>
                  <div className="gusto-profile-detail-value">Hourly / Contractor / Staff</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Location</div>
                  <div className="gusto-profile-detail-value">Main Campus â€” ELA Academy</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Manager / Admin contact</div>
                  <div className="gusto-profile-detail-value">Cooper Galvis Enterprises LLC / School Office</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Personal Information Drawer / Modal */}
      {editPersonalModalOpen && (
        <div className="gusto-drawer-overlay" onClick={() => setEditPersonalModalOpen(false)}>
          <div
            className="gusto-drawer"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", width: "95%" }}
          >
            <div className="gusto-drawer-header">
              <h2 className="gusto-drawer-title">Edit personal details</h2>
              <button className="gusto-drawer-close" onClick={() => setEditPersonalModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePersonal} style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto", paddingRight: "0.5rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "-0.5rem", marginBottom: "1.25rem" }}>
                Update your preferred name, contact, address, or emergency contact. Official legal/tax records are updated via Admin onboarding.
              </p>

              <div className="gusto-form-group">
                <label className="gusto-form-label">Preferred listed name</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={editForm.preferredName}
                  onChange={(e) => setEditForm({ ...editForm, preferredName: e.target.value })}
                  required
                />
              </div>

              <div className="gusto-form-group">
                <label className="gusto-form-label">Pronouns</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={editForm.pronouns}
                  onChange={(e) => setEditForm({ ...editForm, pronouns: e.target.value })}
                  placeholder="e.g. she/her/hers, they/them"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">Personal email</label>
                  <input
                    type="email"
                    className="gusto-select"
                    value={editForm.personalEmail}
                    onChange={(e) => setEditForm({ ...editForm, personalEmail: e.target.value })}
                    required
                  />
                </div>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">Phone number</label>
                  <input
                    type="text"
                    className="gusto-select"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", margin: "1rem 0", paddingTop: "1rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.75rem" }}>
                  Home address
                </h3>
                <div className="gusto-form-group">
                  <label className="gusto-form-label">Street address</label>
                  <input
                    type="text"
                    className="gusto-select"
                    value={editForm.streetAddress}
                    onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem" }}>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">City</label>
                    <input
                      type="text"
                      className="gusto-select"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">State</label>
                    <input
                      type="text"
                      className="gusto-select"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    />
                  </div>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">ZIP</label>
                    <input
                      type="text"
                      className="gusto-select"
                      value={editForm.zipCode}
                      onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", margin: "1rem 0", paddingTop: "1rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.75rem" }}>
                  Emergency contact
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">Contact name</label>
                    <input
                      type="text"
                      className="gusto-select"
                      value={editForm.emergencyName}
                      onChange={(e) => setEditForm({ ...editForm, emergencyName: e.target.value })}
                    />
                  </div>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">Relationship</label>
                    <input
                      type="text"
                      className="gusto-select"
                      value={editForm.emergencyRelationship}
                      onChange={(e) => setEditForm({ ...editForm, emergencyRelationship: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">Contact phone</label>
                    <input
                      type="text"
                      className="gusto-select"
                      value={editForm.emergencyPhone}
                      onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
                    />
                  </div>
                  <div className="gusto-form-group">
                    <label className="gusto-form-label">Contact email</label>
                    <input
                      type="email"
                      className="gusto-select"
                      value={editForm.emergencyEmail}
                      onChange={(e) => setEditForm({ ...editForm, emergencyEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="gusto-drawer-footer" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="gusto-btn-secondary"
                  onClick={() => setEditPersonalModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="gusto-btn-primary">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Payment Method Modal */}
      {bankModalOpen && (
        <div className="gusto-drawer-overlay" onClick={() => setBankModalOpen(false)}>
          <div className="gusto-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="gusto-drawer-header">
              <h2 className="gusto-drawer-title">Bank account details</h2>
              <button className="gusto-drawer-close" onClick={() => setBankModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "-1rem", marginBottom: "1.5rem" }}>
                Add your direct deposit banking information. Payroll will automatically deposit into this account via Stripe Connect.
              </p>

              <div className="gusto-form-group">
                <label className="gusto-form-label">Bank name</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={modalBankName}
                  onChange={(e) => setModalBankName(e.target.value)}
                  placeholder="e.g. Chase Bank, Bank of America"
                  required
                />
              </div>

              <div className="gusto-form-group">
                <label className="gusto-form-label">Account type</label>
                <select
                  className="gusto-select"
                  value={modalAccountType}
                  onChange={(e) => setModalAccountType(e.target.value)}
                >
                  <option value="Checking">Checking Account</option>
                  <option value="Savings">Savings Account</option>
                </select>
              </div>

              <div className="gusto-form-group">
                <label className="gusto-form-label">Routing number (9 digits)</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={modalRouting}
                  onChange={(e) => setModalRouting(e.target.value)}
                  maxLength={9}
                  required
                />
              </div>

              <div className="gusto-form-group">
                <label className="gusto-form-label">Account number</label>
                <input
                  type="password"
                  className="gusto-select"
                  value={modalAccountNumber}
                  onChange={(e) => setModalAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  required
                />
              </div>

              <div className="gusto-drawer-footer">
                <button
                  type="button"
                  className="gusto-btn-secondary"
                  onClick={() => setBankModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="gusto-btn-primary">
                  Save bank details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GustoProfilePage;
