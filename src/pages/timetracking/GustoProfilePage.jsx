import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  Pencil,
  ExternalLink,
  AlertCircle,
  Landmark,
  Lock
} from "lucide-react";
import { Offcanvas, Form, Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import {
  getMyProfile,
  updatePaymentMethod,
  updateMyPersonalDetails
} from "../../services/profileService";
import {
  startMyStripeConnectOnboarding,
  getMyStripeConnectStatus
} from "../../services/payrollService";
import "../../styles/GustoTheme.css";

const GustoProfilePage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState(searchParams.get("tab") || "personal");
  const [showSSN, setShowSSN] = useState(false);

  // Offcanvas states
  const [personalDrawerOpen, setPersonalDrawerOpen] = useState(false);
  const [bankDrawerOpen, setBankDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Status banner
  const [banner, setBanner] = useState({ type: "", text: "" });

  // Stripe Connect status
  const [stripeStatus, setStripeStatus] = useState({ connected: false, payouts_enabled: false, account_id: null });
  const [stripeLoading, setStripeLoading] = useState(false);

  // Editable Personal Form State (synced from real DB profile)
  const [personalForm, setPersonalForm] = useState({
    pronouns: "",
    ssn_last4: "",
    birthday: "",
    personal_email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States of America",
    emg_name: "",
    emg_relationship: "",
    emg_phone: "",
    emg_email: ""
  });

  // Bank / Payment Method Form State
  const [paymentMethod, setPaymentMethod] = useState("Direct deposit");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("Checking");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const showNotice = (text, type = "success") => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: "", text: "" }), 5000);
  };

  useEffect(() => {
    fetchProfile();
    fetchStripeStatus();
    if (searchParams.get("stripe_connect") === "return") {
      showNotice("Returned from Stripe payout setup. Status refreshed.");
    }
  }, []);

  const syncFormFromProfile = (data) => {
    const addr = data?.address || {};
    const emg = data?.emergency_contact || {};
    setPersonalForm({
      pronouns: data?.pronouns || "",
      ssn_last4: data?.ssn_last4 || "",
      birthday: data?.birthday || "",
      personal_email: data?.personal_email || "",
      phone: data?.phone || "",
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: addr.country || "United States of America",
      emg_name: emg.name || "",
      emg_relationship: emg.relationship || "",
      emg_phone: emg.phone || "",
      emg_email: emg.email || ""
    });
    setPaymentMethod(data?.payment_method || "Direct deposit");
    setBankName(data?.bank_name || "");
    setAccountType(data?.bank_account_type || "Checking");
    setRoutingNumber(data?.bank_routing || "");
    setAccountNumber("");
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
      syncFormFromProfile(data);
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStripeStatus = async () => {
    try {
      const status = await getMyStripeConnectStatus();
      setStripeStatus(status);
    } catch (err) {
      // Non-fatal if superadmin without connect
    }
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await updateMyPersonalDetails({
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
      setProfile(updated);
      syncFormFromProfile(updated);
      setPersonalDrawerOpen(false);
      showNotice("Your personal details have been saved and synced with administration.");
    } catch (err) {
      showNotice(err.response?.data?.error || "Failed to save personal details.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const last4 = accountNumber ? accountNumber.slice(-4) : (profile?.bank_account_last4 || "");
      const res = await updatePaymentMethod({
        payment_method: paymentMethod,
        bank_name: bankName,
        bank_account_type: accountType,
        bank_routing: routingNumber,
        bank_account_last4: last4
      });
      setProfile(res);
      syncFormFromProfile(res);
      setBankDrawerOpen(false);
      showNotice("Your payout payment method has been updated.");
    } catch (err) {
      showNotice(err.response?.data?.error || "Failed to update payment method.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    try {
      setStripeLoading(true);
      const res = await startMyStripeConnectOnboarding();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Unable to launch Stripe payout setup right now.";
      showNotice(msg, "error");
    } finally {
      setStripeLoading(false);
    }
  };

  const staffName = profile?.preferred_name || profile?.name || user?.name || "Staff Member";
  const userRole =
    user?.role === "teacher"
      ? "Teaching Faculty"
      : user?.role === "superadmin"
      ? "Super Administrator"
      : (profile?.job_title || "Staff");

  const addr = profile?.address || {};
  const emg = profile?.emergency_contact || {};
  const hasAddress = Boolean(addr.street || addr.city || addr.state || addr.zip);
  const hasEmergency = Boolean(emg.name || emg.phone || emg.email);
  const notProvided = <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not provided</span>;

  if (loading) {
    return <div style={{ padding: "2rem", color: "#6b7280" }}>Loading your profile...</div>;
  }

  return (
    <div>
      {/* Profile Header Card */}
      <div className="gusto-profile-header-card">
        <div className="gusto-profile-avatar-box">
          <span>{staffName.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <h1 className="gusto-profile-title-name">{staffName}</h1>
          <div className="gusto-profile-title-role">{userRole}</div>
        </div>
      </div>

      {banner.text && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: banner.type === "error" ? "#b91c1c" : "#16a34a",
            backgroundColor: banner.type === "error" ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${banner.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500
          }}
        >
          {banner.type === "error" ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span>{banner.text}</span>
        </div>
      )}

      {/* Profile Layout with Secondary Subnav */}
      <div className="gusto-profile-layout">
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

        <div style={{ minWidth: 0, flex: 1 }}>
          {/* TAB: PERSONAL */}
          {activeSubTab === "personal" && (
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 className="gusto-profile-card-title" style={{ margin: 0 }}>
                    Personal details
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPersonalDrawerOpen(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Preferred listed name</div>
                    <div className="gusto-profile-detail-value">{profile?.preferred_name || profile?.name || staffName}</div>
                  </div>
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Legal name</div>
                    <div className="gusto-profile-detail-value">{profile?.legal_name || profile?.name || staffName}</div>
                  </div>
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Pronouns</div>
                    <div className="gusto-profile-detail-value">{profile?.pronouns || notProvided}</div>
                  </div>
                </div>

                <div className="gusto-profile-detail-row">
                  <div style={{ flex: 1 }}>
                    <div className="gusto-profile-detail-label">Social Security number (SSN — Optional)</div>
                    <div className="gusto-profile-detail-value" style={{ letterSpacing: showSSN ? "1px" : "2px" }}>
                      {profile?.ssn_last4
                        ? showSSN
                          ? `***-**-${profile.ssn_last4}`
                          : "***-**-••••"
                        : notProvided}
                    </div>
                  </div>
                  {profile?.ssn_last4 && (
                    <button
                      type="button"
                      onClick={() => setShowSSN(!showSSN)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
                      title={showSSN ? "Hide SSN" : "Show SSN"}
                    >
                      {showSSN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Date of birth</div>
                    <div className="gusto-profile-detail-value">{profile?.birthday || notProvided}</div>
                  </div>
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Work email</div>
                    <div className="gusto-profile-detail-value">{profile?.work_email || profile?.email || notProvided}</div>
                  </div>
                </div>

                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Personal email</div>
                    <div className="gusto-profile-detail-value">{profile?.personal_email || notProvided}</div>
                  </div>
                </div>

                <div className="gusto-profile-detail-row" style={{ borderBottom: "none" }}>
                  <div>
                    <div className="gusto-profile-detail-label">Phone number</div>
                    <div className="gusto-profile-detail-value">{profile?.phone || notProvided}</div>
                  </div>
                </div>
              </div>

              {/* Column 2: Home Address + Emergency Contact */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div className="gusto-profile-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 className="gusto-profile-card-title" style={{ margin: 0 }}>Home address</h2>
                    <button
                      type="button"
                      onClick={() => setPersonalDrawerOpen(true)}
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Edit
                    </button>
                  </div>

                  {hasAddress ? (
                    <>
                      <div className="gusto-profile-detail-row">
                        <div>
                          <div className="gusto-profile-detail-label">Street address</div>
                          <div className="gusto-profile-detail-value">{addr.street || notProvided}</div>
                        </div>
                      </div>
                      <div className="gusto-profile-detail-row">
                        <div>
                          <div className="gusto-profile-detail-label">City, State, ZIP</div>
                          <div className="gusto-profile-detail-value">
                            {[addr.city, addr.state, addr.zip].filter(Boolean).join(", ") || notProvided}
                          </div>
                        </div>
                      </div>
                      <div className="gusto-profile-detail-row" style={{ borderBottom: "none" }}>
                        <div>
                          <div className="gusto-profile-detail-label">Country</div>
                          <div className="gusto-profile-detail-value">{addr.country || "United States of America"}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      No home address on file yet. Click <strong>Edit</strong> to add yours.
                    </div>
                  )}
                </div>

                <div className="gusto-profile-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 className="gusto-profile-card-title" style={{ margin: 0 }}>Emergency contact</h2>
                    <button
                      type="button"
                      onClick={() => setPersonalDrawerOpen(true)}
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Edit
                    </button>
                  </div>

                  {hasEmergency ? (
                    <>
                      <div className="gusto-profile-detail-row">
                        <div>
                          <div className="gusto-profile-detail-label">Full name</div>
                          <div className="gusto-profile-detail-value">{emg.name || notProvided}</div>
                        </div>
                      </div>
                      <div className="gusto-profile-detail-row">
                        <div>
                          <div className="gusto-profile-detail-label">Relationship</div>
                          <div className="gusto-profile-detail-value">{emg.relationship || notProvided}</div>
                        </div>
                      </div>
                      <div className="gusto-profile-detail-row">
                        <div>
                          <div className="gusto-profile-detail-label">Phone</div>
                          <div className="gusto-profile-detail-value">{emg.phone || notProvided}</div>
                        </div>
                      </div>
                      <div className="gusto-profile-detail-row" style={{ borderBottom: "none" }}>
                        <div>
                          <div className="gusto-profile-detail-label">Email</div>
                          <div className="gusto-profile-detail-value">{emg.email || notProvided}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      No emergency contact on file yet. Click <strong>Edit</strong> to add one.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAY (Payout method editable via Stripe Connect or Bank details; Compensation is Admin-only!) */}
          {activeSubTab === "pay" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Stripe Payout Setup Card */}
              <div className="gusto-profile-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <h2 className="gusto-profile-card-title" style={{ margin: "0 0 0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Landmark className="w-5 h-5 text-blue-600" /> Payout Method (How You Get Paid)
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>
                      Connect your bank account via Stripe so Accounting can send your payouts directly, or enter your bank/payment details below.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={stripeLoading}
                      onClick={handleStripeConnect}
                      style={{ backgroundColor: "#635bff", borderColor: "#635bff", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {stripeLoading
                        ? "Connecting..."
                        : stripeStatus.payouts_enabled
                        ? "Manage Stripe Payouts"
                        : "Connect Payouts with Stripe"}
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => setBankDrawerOpen(true)}>
                      <Pencil className="w-3.5 h-3.5 me-1 inline" /> Edit Bank Details
                    </Button>
                  </div>
                </div>

                <div style={{ marginTop: "1.25rem", padding: "1rem", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      Stripe Connect Status
                    </span>
                    {stripeStatus.payouts_enabled ? (
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#15803d", backgroundColor: "#dcfce7", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                        <ShieldCheck className="w-3.5 h-3.5 inline me-1" /> Active &amp; Ready for Payouts
                      </span>
                    ) : stripeStatus.connected ? (
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#b45309", backgroundColor: "#fef3c7", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                        Onboarding Incomplete
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", backgroundColor: "#e2e8f0", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                        Not connected yet
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginTop: "0.75rem", fontSize: "0.875rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Payment Method</div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{profile?.payment_method || "Not set"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Bank Name</div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{profile?.bank_name || notProvided}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Account</div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>
                        {profile?.bank_account_last4
                          ? `${profile.bank_account_type || "Checking"} •••• ${profile.bank_account_last4}`
                          : notProvided}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Routing Number</div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{profile?.bank_routing || notProvided}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compensation Card — Strictly Read-Only (Admin Only) */}
              <div className="gusto-profile-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 className="gusto-profile-card-title" style={{ margin: 0 }}>Compensation</h2>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#475569", backgroundColor: "#f1f5f9", padding: "0.25rem 0.6rem", borderRadius: "9999px", fontWeight: 600 }}>
                    <Lock className="w-3 h-3" /> Managed by Admin Only
                  </span>
                </div>
                <div className="gusto-profile-detail-row">
                  <div>
                    <div className="gusto-profile-detail-label">Hourly rate</div>
                    <div className="gusto-profile-detail-value" style={{ fontWeight: 600 }}>
                      {profile?.hourly_rate > 0 ? `$${Number(profile.hourly_rate).toFixed(2)} / hour` : notProvided}
                    </div>
                  </div>
                </div>
                <div className="gusto-profile-detail-row" style={{ borderBottom: "none" }}>
                  <div>
                    <div className="gusto-profile-detail-label">Worker type</div>
                    <div className="gusto-profile-detail-value">{profile?.worker_type || "Contractor"}</div>
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
                  <div className="gusto-profile-detail-label">Job title</div>
                  <div className="gusto-profile-detail-value">{profile?.job_title || notProvided}</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Department</div>
                  <div className="gusto-profile-detail-value">{profile?.department || notProvided}</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Worker type</div>
                  <div className="gusto-profile-detail-value">{profile?.worker_type || "Contractor"}</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Country</div>
                  <div className="gusto-profile-detail-value">{profile?.country || "United States of America"}</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row">
                <div>
                  <div className="gusto-profile-detail-label">Start date</div>
                  <div className="gusto-profile-detail-value">{profile?.start_date || notProvided}</div>
                </div>
              </div>
              <div className="gusto-profile-detail-row" style={{ borderBottom: "none" }}>
                <div>
                  <div className="gusto-profile-detail-label">Manager</div>
                  <div className="gusto-profile-detail-value">{profile?.manager_name || notProvided}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT OFFCANVAS: EDIT PERSONAL DETAILS */}
      <Offcanvas
        show={personalDrawerOpen}
        onHide={() => setPersonalDrawerOpen(false)}
        placement="end"
        style={{ width: "500px", maxWidth: "95vw" }}
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Edit Personal Details
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleSavePersonal}>
            <div className="row g-3">
              <div className="col-6">
                <Form.Label className="small fw-semibold">Pronouns</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="e.g. she/her, he/him, they/them"
                  value={personalForm.pronouns}
                  onChange={(e) => setPersonalForm({ ...personalForm, pronouns: e.target.value })}
                />
              </div>
              <div className="col-6">
                <Form.Label className="small fw-semibold">SSN Last 4 (Optional)</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  maxLength={4}
                  placeholder="Optional (4 digits)"
                  value={personalForm.ssn_last4}
                  onChange={(e) => setPersonalForm({ ...personalForm, ssn_last4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                />
              </div>
              <div className="col-6">
                <Form.Label className="small fw-semibold">Date of Birth</Form.Label>
                <Form.Control
                  size="sm"
                  type="date"
                  value={personalForm.birthday}
                  onChange={(e) => setPersonalForm({ ...personalForm, birthday: e.target.value })}
                />
              </div>
              <div className="col-6">
                <Form.Label className="small fw-semibold">Phone Number</Form.Label>
                <Form.Control
                  size="sm"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                />
              </div>
              <div className="col-12">
                <Form.Label className="small fw-semibold">Personal Email</Form.Label>
                <Form.Control
                  size="sm"
                  type="email"
                  placeholder="personal@email.com"
                  value={personalForm.personal_email}
                  onChange={(e) => setPersonalForm({ ...personalForm, personal_email: e.target.value })}
                />
              </div>

              <div className="col-12"><hr className="my-1" /><div className="small fw-bold text-secondary">Home Address</div></div>
              <div className="col-12">
                <Form.Label className="small fw-semibold">Street Address</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="Street & Apt"
                  value={personalForm.street}
                  onChange={(e) => setPersonalForm({ ...personalForm, street: e.target.value })}
                />
              </div>
              <div className="col-5">
                <Form.Label className="small fw-semibold">City</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={personalForm.city}
                  onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })}
                />
              </div>
              <div className="col-3">
                <Form.Label className="small fw-semibold">State</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={personalForm.state}
                  onChange={(e) => setPersonalForm({ ...personalForm, state: e.target.value })}
                />
              </div>
              <div className="col-4">
                <Form.Label className="small fw-semibold">ZIP</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={personalForm.zip}
                  onChange={(e) => setPersonalForm({ ...personalForm, zip: e.target.value })}
                />
              </div>
              <div className="col-12">
                <Form.Label className="small fw-semibold">Country</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={personalForm.country}
                  onChange={(e) => setPersonalForm({ ...personalForm, country: e.target.value })}
                />
              </div>

              <div className="col-12"><hr className="my-1" /><div className="small fw-bold text-secondary">Emergency Contact</div></div>
              <div className="col-6">
                <Form.Label className="small fw-semibold">Full Name</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={personalForm.emg_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, emg_name: e.target.value })}
                />
              </div>
              <div className="col-6">
                <Form.Label className="small fw-semibold">Relationship</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="e.g. Spouse, Parent"
                  value={personalForm.emg_relationship}
                  onChange={(e) => setPersonalForm({ ...personalForm, emg_relationship: e.target.value })}
                />
              </div>
              <div className="col-6">
                <Form.Label className="small fw-semibold">Phone</Form.Label>
                <Form.Control
                  size="sm"
                  type="tel"
                  value={personalForm.emg_phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, emg_phone: e.target.value })}
                />
              </div>
              <div className="col-6">
                <Form.Label className="small fw-semibold">Email</Form.Label>
                <Form.Control
                  size="sm"
                  type="email"
                  value={personalForm.emg_email}
                  onChange={(e) => setPersonalForm({ ...personalForm, emg_email: e.target.value })}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="light" size="sm" onClick={() => setPersonalDrawerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      {/* RIGHT OFFCANVAS: EDIT PAYMENT / BANK METHOD */}
      <Offcanvas
        show={bankDrawerOpen}
        onHide={() => setBankDrawerOpen(false)}
        placement="end"
        style={{ width: "440px", maxWidth: "95vw" }}
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Update Payout Payment Method
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleSaveBank}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Payment Method</Form.Label>
              <Form.Select size="sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Direct deposit">Direct deposit</option>
                <option value="Stripe Direct Deposit">Stripe Direct Deposit</option>
                <option value="Check">Check</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Bank Name</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                placeholder="e.g. Bank of America, Chase"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Account Type</Form.Label>
              <Form.Select size="sm" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Routing Number</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                maxLength={9}
                placeholder="9-digit routing number"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Account Number (stored as last 4 digits)</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                placeholder={profile?.bank_account_last4 ? `Currently ending in ${profile.bank_account_last4}` : "Enter account number"}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="light" size="sm" onClick={() => setBankDrawerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Payment Method"}
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default GustoProfilePage;
