import React, { useState, useEffect } from "react";
import {
  MoreVertical,
  Info,
  Check,
  X,
  Plus,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile, updatePaymentMethod } from "../../services/profileService";
import "../../styles/GustoTheme.css";

const GustoProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("personal"); // "personal" | "pay" | "work"
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [showSSN, setShowSSN] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Bank Form State
  const [bankName, setBankName] = useState("Chase Bank");
  const [accountType, setAccountType] = useState("Checking");
  const [routingNumber, setRoutingNumber] = useState("021000021");
  const [accountNumber, setAccountNumber] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
      if (data.bank_name) setBankName(data.bank_name);
      if (data.bank_account_type) setAccountType(data.bank_account_type);
      if (data.bank_routing) setRoutingNumber(data.bank_routing);
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const staffName = profile?.preferred_name || profile?.name || user?.name || "Staff Member";
  const userRole =
    user?.role === "teacher"
      ? "Teaching Faculty"
      : user?.role === "superadmin"
      ? "Super Administrator"
      : (profile?.job_title || "Contractor");

  const address = profile?.address || {
    street: "1420 Peachtree St NE, Apt 4B",
    city: "Atlanta",
    state: "GA",
    zip: "30309",
    country: "United States of America"
  };

  const emergency = profile?.emergency_contact || {
    name: "David Rigsby",
    relationship: "Spouse",
    phone: "+1 (404) 555-0188",
    email: "david.rigsby@example.com"
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    try {
      const last4 = accountNumber ? accountNumber.slice(-4) : (profile?.bank_account_last4 || "7600");
      const res = await updatePaymentMethod({
        bank_name: bankName,
        bank_account_type: accountType,
        bank_routing: routingNumber,
        bank_account_last4: last4,
        payment_method: "Direct deposit"
      });
      setProfile(res);
      setBankModalOpen(false);
      setSuccessMessage("Direct deposit banking information updated successfully.");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to update bank account:", err);
      alert("Failed to update banking details. Please try again.");
    }
  };

  return (
    <div>
      {/* Profile Header Card */}
      <div className="gusto-profile-header-card">
        <div className="gusto-profile-avatar-box">
          <span>{staffName.charAt(0)}</span>
        </div>
        <div>
          <h1 className="gusto-profile-title-name">{staffName}</h1>
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
          <Check className="w-4 h-4" /> {successMessage}
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
          {/* TAB: PERSONAL (Read-only for staff, verified and managed by school administration) */}
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
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#0d5c46",
                        backgroundColor: "#e3f3eb",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontWeight: 600
                      }}
                    >
                      Admin Managed
                    </span>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Preferred listed name</div>
                      <div className="gusto-profile-detail-value">
                        {profile?.preferred_name || profile?.name || staffName}
                      </div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Legal name</div>
                      <div className="gusto-profile-detail-value">
                        {profile?.legal_name || profile?.name || staffName}
                      </div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Pronouns</div>
                      <div className="gusto-profile-detail-value">{profile?.pronouns || "she / her / hers"}</div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div style={{ flex: 1 }}>
                      <div className="gusto-profile-detail-label">Social Security number (SSN)</div>
                      <div className="gusto-profile-detail-value" style={{ letterSpacing: showSSN ? "1px" : "2px" }}>
                        {showSSN ? `***-**-${profile?.ssn_last4 || "7600"}` : `***-**-••••`}
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
                      <div className="gusto-profile-detail-value">{profile?.birthday || "October 14, 1992"}</div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Personal email</div>
                      <div className="gusto-profile-detail-value">{profile?.personal_email || profile?.email || user?.email}</div>
                    </div>
                  </div>

                  <div className="gusto-profile-detail-row">
                    <div>
                      <div className="gusto-profile-detail-label">Phone number</div>
                      <div className="gusto-profile-detail-value">{profile?.phone || "+1 (404) 555-0192"}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", padding: "0.65rem 0.85rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>
                      Primary tax & employment identification details are maintained and verified during staff onboarding by school administration.
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
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          backgroundColor: "#f3f4f6",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px"
                        }}
                      >
                        Verified
                      </span>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Street address</div>
                        <div className="gusto-profile-detail-value">{address.street}</div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">City, State, Zip</div>
                        <div className="gusto-profile-detail-value">
                          {address.city}, {address.state} {address.zip}
                        </div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Country</div>
                        <div className="gusto-profile-detail-value">{address.country}</div>
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
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Full name</div>
                        <div className="gusto-profile-detail-value">{emergency.name}</div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Relationship</div>
                        <div className="gusto-profile-detail-value">{emergency.relationship}</div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Phone number</div>
                        <div className="gusto-profile-detail-value">{emergency.phone}</div>
                      </div>
                    </div>

                    <div className="gusto-profile-detail-row">
                      <div>
                        <div className="gusto-profile-detail-label">Email</div>
                        <div className="gusto-profile-detail-value">{emergency.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAY (Staff can view payments and update payment details) */}
          {activeSubTab === "pay" && (
            <div>
              {/* Payment Card */}
              <div className="gusto-profile-card">
                <h2 className="gusto-profile-card-title">Payment</h2>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Payment method</div>
                    <div className="gusto-profile-detail-value">
                      {profile?.payment_method || "Direct deposit"}
                    </div>
                  </div>
                  <Info className="w-4 h-4 text-slate-400" />
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Bank account</div>
                    <div className="gusto-profile-detail-value">
                      Bank Account #1 ({profile?.bank_account_type || "Checking"})
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.15rem" }}>
                      XXXX{profile?.bank_account_last4 || "7600"} • {profile?.bank_name || "Chase Bank"}
                    </div>
                  </div>
                  <button
                    className="gusto-icon-btn"
                    onClick={() => setBankModalOpen(true)}
                    title="Update bank account"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <button
                  type="button"
                  className="gusto-add-method-btn"
                  onClick={() => setBankModalOpen(true)}
                >
                  <Plus className="w-4 h-4" /> Add or update payment method
                </button>
              </div>

              {/* Compensation Card */}
              <div className="gusto-profile-card">
                <h2 className="gusto-profile-card-title">Compensation</h2>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Job title</div>
                    <div className="gusto-profile-detail-value">
                      {profile?.job_title || "Lead Classroom Teacher"}
                    </div>
                  </div>
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Rate</div>
                    <div className="gusto-profile-detail-value" style={{ fontWeight: 600 }}>
                      {profile?.rate_formatted || `$${profile?.hourly_rate || 30.00} per hour`}
                    </div>
                    <div style={{ fontSize: "0.775rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                      Configured by School Administration • Paid weekly
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
                    {profile?.department || profile?.department_names?.join(", ") || "Academic Faculty"}
                  </div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Worker type</div>
                  <div className="gusto-profile-detail-value">
                    {profile?.worker_type || "Contractor"}
                  </div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Location</div>
                  <div className="gusto-profile-detail-value">Main Campus — ELA Academy</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Manager / Admin contact</div>
                  <div className="gusto-profile-detail-value">
                    {profile?.manager_name || "Marcus Cooper / School Office"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                Add or update your direct deposit banking information. Payroll will automatically deposit into this account via Stripe Connect.
              </p>

              <div className="gusto-form-group">
                <label className="gusto-form-label">Bank name</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Chase Bank, Bank of America"
                  required
                />
              </div>

              <div className="gusto-form-group">
                <label className="gusto-form-label">Account type</label>
                <select
                  className="gusto-select"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
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
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  maxLength={9}
                  required
                />
              </div>

              <div className="gusto-form-group">
                <label className="gusto-form-label">Account number</label>
                <input
                  type="password"
                  className="gusto-select"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter new account number (or leave blank to keep existing)"
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
