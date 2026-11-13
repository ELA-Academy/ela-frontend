import React, { useState } from "react";
import {
  Shield,
  Bell,
  Lock,
  Smartphone,
  KeyRound,
  FileText,
  User,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/GustoTheme.css";

const GustoSettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("security"); // "personal" | "security" | "notifications" | "privacy" | "documents"

  // Settings State
  const [email, setEmail] = useState(user?.email || "murrisarigsby@gmail.com");
  const [textNumber, setTextNumber] = useState("+1 XXX-XXX-1144");
  const [passkeyStatus, setPasskeyStatus] = useState("Not set up");
  const [authenticatorStatus, setAuthenticatorStatus] = useState("Disabled");
  const [photoIdStatus, setPhotoIdStatus] = useState("Disabled");

  // Notifications state
  const [emailPrefs, setEmailPrefs] = useState(
    "New features and updates, Offers and promotions, Feedback and surveys, Gusto sales representative communications"
  );
  const [pushPrefs, setPushPrefs] = useState("Account information, All marketing notifications");
  const [textPrefs, setTextPrefs] = useState("Account information");
  const [voicePrefs, setVoicePrefs] = useState("None");

  // Timezone and preferences
  const [timezone, setTimezone] = useState("Eastern Time (US & Canada) (EDT, GMT-4)");
  const [paperlessConsent, setPaperlessConsent] = useState(true);

  // Modals
  const [activeModal, setActiveModal] = useState(null); // "email" | "password" | "text" | "notifications" | "exposure"
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    setActiveModal(null);
    showToast("Setting successfully updated!");
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Page Title */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Settings
        </h1>
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

      {/* Main Settings Layout (Sidebar subnav + Content panel) */}
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        {/* Left Subnav */}
        <aside style={{ width: "170px", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {[
              { id: "personal", label: "Personal" },
              { id: "security", label: "Security" },
              { id: "notifications", label: "Notifications" },
              { id: "privacy", label: "Privacy" },
              { id: "documents", label: "Documents" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  textAlign: "left",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.925rem",
                  fontWeight: activeTab === tab.id ? 700 : 400,
                  color: activeTab === tab.id ? "#111827" : "#4b5563",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "6px",
                  transition: "color 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Right Content Area */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* TAB 1: SECURITY (Image 2) */}
          {activeTab === "security" && (
            <>
              {/* Account Card */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem"
                }}
              >
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 1.25rem" }}>
                  Account
                </h2>

                {/* Email Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    paddingBottom: "1.25rem",
                    borderBottom: "1px solid #f1f5f9"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Email</div>
                    <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.2rem" }}>
                      {email}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => setActiveModal("email")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0f766e",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        display: "block"
                      }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal("exposure")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0f766e",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        textDecoration: "underline",
                        marginTop: "0.25rem",
                        display: "block"
                      }}
                    >
                      Check exposure
                    </button>
                  </div>
                </div>

                {/* Password Row */}
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
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Password</div>
                    <div style={{ fontSize: "0.9rem", color: "#111827", marginTop: "0.2rem" }}>
                      ••••••••••••
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal("password")}
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
                    Change
                  </button>
                </div>

                {/* Passkey Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "1.25rem"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Passkey</div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.2rem" }}>
                      {passkeyStatus}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPasskeyStatus("Active (Mac Touch ID / Windows Hello)");
                      showToast("Passkey registered with device credentials.");
                    }}
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
                    Add
                  </button>
                </div>
              </div>

              {/* Two-step Authentication Card */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem"
                }}
              >
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 1.25rem" }}>
                  Two-step authentication
                </h2>

                {/* Authenticator App */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "1.25rem",
                    borderBottom: "1px solid #f1f5f9"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                      Authenticator app
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.2rem" }}>
                      {authenticatorStatus}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthenticatorStatus("Enabled (Google Authenticator)");
                      showToast("Authenticator application paired successfully.");
                    }}
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
                    Set up
                  </button>
                </div>

                {/* Text Message */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "1.25rem 0",
                    borderBottom: "1px solid #f1f5f9"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                      Text message
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#111827", marginTop: "0.2rem" }}>
                      Active
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.1rem" }}>
                      {textNumber}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => setActiveModal("text")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0f766e",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        display: "block"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTextNumber("Not configured");
                        showToast("SMS verification disabled.");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0f766e",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        textDecoration: "underline",
                        marginTop: "0.25rem",
                        display: "block"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Photo ID Backup */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "1.25rem"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                      Photo ID backup
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.2rem" }}>
                      {photoIdStatus}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoIdStatus("Uploaded & Verified");
                      showToast("Photo ID verification completed.");
                    }}
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
                    Add
                  </button>
                </div>
              </div>

              {/* Recent Account Activity Card */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem"
                  }}
                >
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                    Recent account activity
                  </h2>
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0f766e",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                    onClick={() => alert("Showing all activity sessions")}
                  >
                    View all
                  </button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", textAlign: "left" }}>
                        <th style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>Time</th>
                        <th style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>Event</th>
                        <th style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>Browser</th>
                        <th style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>IP</th>
                        <th style={{ padding: "0.75rem 0.5rem", fontWeight: 600, textAlign: "right" }}>
                          Report Suspicious
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #f1f5f9", color: "#1e293b" }}>
                        <td style={{ padding: "0.75rem 0.5rem" }}>Today at 2:14 PM</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>Sign in</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>Chrome on Windows</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>192.168.1.42</td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                          <button
                            type="button"
                            style={{ background: "none", border: "none", color: "#0f766e", cursor: "pointer", textDecoration: "underline", fontSize: "0.8rem" }}
                            onClick={() => alert("Activity verified safe.")}
                          >
                            Report
                          </button>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #f1f5f9", color: "#1e293b" }}>
                        <td style={{ padding: "0.75rem 0.5rem" }}>Yesterday at 9:02 AM</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>Timecard synced</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>Chrome on Windows</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>192.168.1.42</td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                          <button
                            type="button"
                            style={{ background: "none", border: "none", color: "#0f766e", cursor: "pointer", textDecoration: "underline", fontSize: "0.8rem" }}
                            onClick={() => alert("Activity verified safe.")}
                          >
                            Report
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: NOTIFICATIONS (Image 3) */}
          {activeTab === "notifications" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "1.5rem"
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 1.25rem" }}>
                Preferences
              </h2>

              {/* Emails */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingBottom: "1.25rem",
                  borderBottom: "1px solid #f1f5f9"
                }}
              >
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Emails</div>
                  <div style={{ fontSize: "0.875rem", color: "#4b5563", marginTop: "0.25rem", lineHeight: 1.4 }}>
                    {emailPrefs}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("notifications")}
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

              {/* Push notifications */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "1.25rem 0",
                  borderBottom: "1px solid #f1f5f9"
                }}
              >
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                    Push notifications
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#4b5563", marginTop: "0.25rem", lineHeight: 1.4 }}>
                    {pushPrefs}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("notifications")}
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

              {/* Text messages */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "1.25rem 0",
                  borderBottom: "1px solid #f1f5f9"
                }}
              >
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                    Text messages
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#4b5563", marginTop: "0.25rem", lineHeight: 1.4 }}>
                    {textPrefs}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("notifications")}
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

              {/* Voice calls */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingTop: "1.25rem"
                }}
              >
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                    Voice calls
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#4b5563", marginTop: "0.25rem", lineHeight: 1.4 }}>
                    {voicePrefs}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("notifications")}
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
            </div>
          )}

          {/* TAB 3: PERSONAL */}
          {activeTab === "personal" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "1.5rem"
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 1.25rem" }}>
                Localization & Display
              </h2>
              <div className="gusto-form-group">
                <label className="gusto-form-label">Timezone</label>
                <select
                  className="gusto-select"
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    showToast("Timezone updated.");
                  }}
                >
                  <option value="Eastern Time (US & Canada) (EDT, GMT-4)">Eastern Time (US & Canada) (EDT, GMT-4)</option>
                  <option value="Central Time (US & Canada) (CDT, GMT-5)">Central Time (US & Canada) (CDT, GMT-5)</option>
                  <option value="Mountain Time (US & Canada) (MDT, GMT-6)">Mountain Time (US & Canada) (MDT, GMT-6)</option>
                  <option value="Pacific Time (US & Canada) (PDT, GMT-7)">Pacific Time (US & Canada) (PDT, GMT-7)</option>
                </select>
              </div>
              <div className="gusto-form-group" style={{ marginTop: "1rem" }}>
                <label className="gusto-form-label">Language</label>
                <select className="gusto-select" defaultValue="English (US)">
                  <option value="English (US)">English (United States)</option>
                  <option value="Spanish">EspaÃ±ol</option>
                  <option value="French">FranÃ§ais</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY */}
          {activeTab === "privacy" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "1.5rem"
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 1.25rem" }}>
                Privacy & Data Preferences
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "#0f766e" }} />
                  <span style={{ fontSize: "0.875rem", color: "#374151" }}>
                    Enable product analytics to help improve Gusto time tracking and reporting features.
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "#0f766e" }} />
                  <span style={{ fontSize: "0.875rem", color: "#374151" }}>
                    Keep sensitive banking and SSN fields masked by default across all dashboards.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTS */}
          {activeTab === "documents" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "1.5rem"
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 1.25rem" }}>
                Document Delivery Elections
              </h2>
              <div style={{ padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.35rem" }}>
                  Electronic Delivery Consent (Form 1099 / W-2)
                </div>
                <p style={{ fontSize: "0.825rem", color: "#64748b", margin: "0 0 1rem", lineHeight: 1.5 }}>
                  You have consented to receive all tax forms and employment contracts electronically in your Gusto portal. You may revoke consent at any time to receive paper mailings.
                </p>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>
                  <Check className="w-4 h-4" /> Paperless tax delivery active
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Email Modal */}
      {activeModal === "email" && (
        <div className="gusto-drawer-overlay" onClick={() => setActiveModal(null)}>
          <div className="gusto-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="gusto-drawer-header">
              <h2 className="gusto-drawer-title">Change account email</h2>
              <button className="gusto-drawer-close" onClick={() => setActiveModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className="gusto-form-group">
                <label className="gusto-form-label">New email address</label>
                <input
                  type="email"
                  className="gusto-select"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="gusto-drawer-footer">
                <button type="button" className="gusto-btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="gusto-btn-primary">
                  Save email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Password Modal */}
      {activeModal === "password" && (
        <div className="gusto-drawer-overlay" onClick={() => setActiveModal(null)}>
          <div className="gusto-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="gusto-drawer-header">
              <h2 className="gusto-drawer-title">Change password</h2>
              <button className="gusto-drawer-close" onClick={() => setActiveModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className="gusto-form-group">
                <label className="gusto-form-label">Current password</label>
                <input type="password" className="gusto-select" placeholder="Enter current password" required />
              </div>
              <div className="gusto-form-group">
                <label className="gusto-form-label">New password</label>
                <input type="password" className="gusto-select" placeholder="Min. 8 characters" required />
              </div>
              <div className="gusto-drawer-footer">
                <button type="button" className="gusto-btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="gusto-btn-primary">
                  Update password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check Exposure Modal */}
      {activeModal === "exposure" && (
        <div className="gusto-drawer-overlay" onClick={() => setActiveModal(null)}>
          <div className="gusto-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
            <div className="gusto-drawer-header">
              <h2 className="gusto-drawer-title">Account exposure check</h2>
              <button className="gusto-drawer-close" onClick={() => setActiveModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div style={{ padding: "0.5rem 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div style={{ fontSize: "0.875rem", color: "#166534" }}>
                  <strong>No compromised credentials found.</strong> Your email has not appeared in any known public data leaks.
                </div>
              </div>
            </div>
            <div className="gusto-drawer-footer">
              <button type="button" className="gusto-btn-primary" onClick={() => setActiveModal(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notification Preferences Modal */}
      {activeModal === "notifications" && (
        <div className="gusto-drawer-overlay" onClick={() => setActiveModal(null)}>
          <div className="gusto-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="gusto-drawer-header">
              <h2 className="gusto-drawer-title">Notification preferences</h2>
              <button className="gusto-drawer-close" onClick={() => setActiveModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className="gusto-form-group">
                <label className="gusto-form-label">Email notification topics</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={emailPrefs}
                  onChange={(e) => setEmailPrefs(e.target.value)}
                />
              </div>
              <div className="gusto-form-group">
                <label className="gusto-form-label">Push notifications</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={pushPrefs}
                  onChange={(e) => setPushPrefs(e.target.value)}
                />
              </div>
              <div className="gusto-form-group">
                <label className="gusto-form-label">Text messages</label>
                <input
                  type="text"
                  className="gusto-select"
                  value={textPrefs}
                  onChange={(e) => setTextPrefs(e.target.value)}
                />
              </div>
              <div className="gusto-drawer-footer">
                <button type="button" className="gusto-btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="gusto-btn-primary">
                  Save preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GustoSettingsPage;
