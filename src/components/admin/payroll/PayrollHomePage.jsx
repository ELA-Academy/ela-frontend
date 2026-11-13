import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  DollarSign,
  FileText,
  Mail,
  ShieldCheck,
  Building,
  MoreVertical,
  X
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "../../../styles/GustoTheme.css";

const PayrollHomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const adminName = user?.name ? user.name.split(" ")[0] : "Caitlin";
  const [showHires, setShowHires] = useState(false);

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Page Greeting (Image 3 replica) */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: "0 0 0.25rem" }}>
          Good afternoon, {adminName}
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0 }}>
          Here's what's going on with your team at Cooper Galvis Enterprises LLC / ELA Academy.
        </p>
      </div>

      {/* Main 2-Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1.1fr",
          gap: "2.5rem",
          alignItems: "start"
        }}
      >
        {/* Left Column: Important Tasks & Recent Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Section: Important Tasks */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.85rem" }}>
              Important tasks
            </h2>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.75rem"
              }}
            >
              {/* Task 1: Complete new hire check-ins */}
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "1.5rem" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.55rem", backgroundColor: "#fff1f2", color: "#e11d48", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.6rem" }}>
                  <Clock className="w-3.5 h-3.5" /> 18 days overdue
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>
                  Complete new hire check-ins
                </div>
                <div style={{ fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.4, marginBottom: "0.75rem" }}>
                  Add a rating and any notes on how things are going for these new hires.
                </div>
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    background: "none",
                    border: "none",
                    color: "#0d5c46",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0
                  }}
                  onClick={() => setShowHires(!showHires)}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showHires ? "rotate-180" : ""}`} />
                  Show 12 new hires
                </button>

                {showHires && (
                  <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "0.8rem", color: "#334155" }}>
                    • Caitlin MacFarlane, Dana Acosta, Nikoith Acosta, Moyinoluwa Adebola, Danna Alvarez, Christian Ayemidejor, Aldren Barboza, Mildred Buso-Castillo, Gina Paola Cagua, Claudia Carrillo, Eunice Carrillo, Marcus Cooper
                  </div>
                )}
              </div>

              {/* Task 2: Run payroll */}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.55rem", backgroundColor: "#f3f4f6", color: "#374151", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.6rem" }}>
                  <Calendar className="w-3.5 h-3.5" /> Due Oct 15
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>
                  Run payroll
                </div>
                <div style={{ fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.4, marginBottom: "1rem" }}>
                  Time to make employees happy (and the government too). Run payroll for the Sep 27–Oct 10, 2026 pay period.
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/admin/payroll/pay")}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "0.45rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#111827",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem"
                  }}
                >
                  Start &gt;
                </button>
              </div>
            </div>
          </div>

          {/* Section: Recent activity */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                Recent activity
              </h2>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "#0d5c46", fontSize: "0.85rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}
                onClick={() => alert("All recent payroll activities")}
              >
                View all activity
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden"
              }}
            >
              {[
                {
                  id: "act-1",
                  time: "4d ago",
                  text: "Your Sep 1–Sep 30 ELA TT invoice for $932.00 has been paid automatically. The funds will debit from your bank account in 1 business day.",
                  linkText: "View invoice"
                },
                {
                  id: "act-2",
                  time: "5d ago",
                  text: "Payroll confirmed for Sep 13–Sep 26. We'll debit $1,211.06 from the bank account ending in 3042 at 7pm EDT on Thu Oct 1.",
                  linkText: "View payroll"
                },
                {
                  id: "act-3",
                  time: "5d ago",
                  text: "Contractor payments confirmed for Fri Oct 2. We'll debit $24,745.00 from the bank account ending in 3042 at 7pm EDT on Thu Oct 1.",
                  linkText: "View details"
                }
              ].map((act, idx) => (
                <div
                  key={act.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    padding: "1.1rem 1.25rem",
                    borderBottom: idx === 2 ? "none" : "1px solid #f1f5f9"
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", minWidth: "50px", flexShrink: 0, marginTop: "0.15rem" }}>
                    {act.time}
                  </div>
                  <div style={{ flex: 1, fontSize: "0.85rem", color: "#374151", lineHeight: 1.4 }}>
                    {act.text}{" "}
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#0d5c46", fontWeight: 600, textDecoration: "underline", cursor: "pointer", padding: 0 }}
                      onClick={() => alert(`Opening details for ${act.linkText}`)}
                    >
                      {act.linkText}
                    </button>
                  </div>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "2px" }}
                    onClick={() => alert("Activity dismissed")}
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Payments in Progress, Upcoming, Recommendations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Section: Payments in progress */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                Payments in progress
              </h2>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "#0d5c46", fontSize: "0.85rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}
                onClick={() => navigate("/admin/payroll/pay")}
              >
                See history
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "1.25rem",
                color: "#6b7280",
                fontSize: "0.875rem"
              }}
            >
              No payrolls in progress
            </div>
          </div>

          {/* Section: Upcoming */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                Upcoming
              </h2>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "#0d5c46", fontSize: "0.85rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}
                onClick={() => alert("Syncing payroll events to Google/Outlook calendar")}
              >
                Sync calendar
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "1.25rem"
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>
                Payroll
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Bank Holiday</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Mon Oct 12</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                    Run payroll by 7:00pm EDT for Sep 27 - Oct 10
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Thu Oct 15</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Recommendations */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.85rem" }}>
              Recommendations
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Recommendation 1 */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.25rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "0.4rem" }}>
                    Bring all your contractor payments together
                  </div>
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </div>
                <p style={{ fontSize: "0.825rem", color: "#4b5563", lineHeight: 1.4, margin: "0 0 1rem" }}>
                  Along with your domestic contractors, you can pay global contractors. No new platform needed.
                </p>
                <button
                  type="button"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "0.4rem 0.85rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#111827",
                    cursor: "pointer"
                  }}
                  onClick={() => alert("Open global contractor onboarding")}
                >
                  Pay your global contractors
                </button>
              </div>

              {/* Recommendation 2 */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "1.25rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "0.4rem" }}>
                    Is it time to update your handbook?
                  </div>
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </div>
                <p style={{ fontSize: "0.825rem", color: "#4b5563", lineHeight: 1.4, margin: "0 0 1rem" }}>
                  Due to changing regulations, HR experts recommend reviewing your handbook regularly. Don't get caught out of compliance. Book a call to learn how to get started.
                </p>
                <button
                  type="button"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "0.4rem 0.85rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#111827",
                    cursor: "pointer"
                  }}
                  onClick={() => alert("Connecting with ELA HR compliance advisor")}
                >
                  Speak with a plan advisor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollHomePage;
