import React, { useState } from "react";
import {
  Pencil,
  Plus,
  MoreVertical,
  Info,
  Check,
  X,
  CreditCard,
  Building,
  User,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/GustoTheme.css";

const GustoProfilePage = () => {
  const { user } = useAuth();
  const staffName = user?.name || "Murrisa Rigsby";
  const userRole = user?.role === "teacher" ? "Teaching Faculty" : (user?.role === "superadmin" ? "Super Administrator" : "Contractor");

  const [activeSubTab, setActiveSubTab] = useState("pay"); // "work" | "pay" | "personal"
  const [bankModalOpen, setBankModalOpen] = useState(false);

  // Bank account state
  const [bankAccount, setBankAccount] = useState({
    name: "Bank Account #1 (Checking)",
    last4: "1036",
    bankName: "Chase Bank",
    routing: "021000021",
    accountNumber: "XXXXXXXX1036",
    type: "Checking"
  });

  // Modal form states
  const [modalBankName, setModalBankName] = useState("Chase Bank");
  const [modalAccountType, setModalAccountType] = useState("Checking");
  const [modalRouting, setModalRouting] = useState("021000021");
  const [modalAccountNumber, setModalAccountNumber] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Compensation details
  const jobTitle = user?.role === "teacher" 
    ? "Lead Classroom Teacher" 
    : (user?.departmentNames?.[0] ? `${user.departmentNames[0]} Specialist` : "Accounting/Bookkeeper Assistant");
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

  return (
    <div>
      {/* Profile Header Card (Image 4) */}
      <div className="gusto-profile-header-card">
        <div className="gusto-profile-avatar-box">
          <span>{staffName.charAt(0)}</span>
          <div className="gusto-avatar-edit-icon" title="Edit avatar">
            <Pencil className="w-3 h-3" />
          </div>
        </div>
        <div>
          <h1 className="gusto-profile-title-name">{staffName}</h1>
          <div className="gusto-profile-title-role">{userRole}</div>
        </div>
      </div>

      {savedSuccess && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#16a34a", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
          <Check className="w-4 h-4" /> Bank account details updated successfully.
        </div>
      )}

      {/* Profile Layout with Secondary Sidebar (Image 4) */}
      <div className="gusto-profile-layout">
        {/* Left Sub-nav */}
        <aside className="gusto-profile-subnav">
          <div className="gusto-profile-subnav-title">Information</div>
          <button
            className={`gusto-profile-subnav-btn ${activeSubTab === "work" ? "active" : ""}`}
            onClick={() => setActiveSubTab("work")}
          >
            Work
          </button>
          <button
            className={`gusto-profile-subnav-btn ${activeSubTab === "pay" ? "active" : ""}`}
            onClick={() => setActiveSubTab("pay")}
          >
            Pay
          </button>
          <button
            className={`gusto-profile-subnav-btn ${activeSubTab === "personal" ? "active" : ""}`}
            onClick={() => setActiveSubTab("personal")}
          >
            Personal
          </button>
        </aside>

        {/* Right Content Panels */}
        <div style={{ minWidth: 0 }}>
          {/* TAB: PAY (Image 4) */}
          {activeSubTab === "pay" && (
            <div>
              {/* Payment Card */}
              <div className="gusto-profile-card">
                <h2 className="gusto-profile-card-title">Payment</h2>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Payment method</div>
                    <div className="gusto-profile-detail-value">Direct deposit</div>
                  </div>
                  <Info className="w-4 h-4 text-slate-400" />
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Bank account</div>
                    <div className="gusto-profile-detail-value">{bankAccount.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.15rem" }}>
                      XXXX{bankAccount.last4}
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
                      Configured by School Administration
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
                    {user?.departmentNames?.join(", ") || (user?.role === "teacher" ? "Academic Faculty" : "Administration")}
                  </div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Employment type</div>
                  <div className="gusto-profile-detail-value">Hourly / Full-time</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Location</div>
                  <div className="gusto-profile-detail-value">Main Campus — ELA Academy</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PERSONAL */}
          {activeSubTab === "personal" && (
            <div className="gusto-profile-card">
              <h2 className="gusto-profile-card-title">Personal details</h2>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Legal name</div>
                  <div className="gusto-profile-detail-value">{staffName}</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Email address</div>
                  <div className="gusto-profile-detail-value">{user?.email || "staff@elaaschool.org"}</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Phone</div>
                  <div className="gusto-profile-detail-value">(404) 555-0192</div>
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
                Add your direct deposit banking information. Payroll will automatically deposit into this account.
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
