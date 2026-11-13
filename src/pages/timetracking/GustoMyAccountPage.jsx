import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MoreVertical,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Building,
  DollarSign
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile } from "../../services/profileService";
import "../../styles/GustoTheme.css";

const GustoMyAccountPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getMyProfile().then(data => setProfile(data)).catch(() => {});
  }, []);

  const staffName = profile?.preferred_name || profile?.name || user?.name || "Murrisa Rigsby";
  const companyName = "ELA Academy LLC";

  const [activeMenu, setActiveMenu] = useState(null);

  const payments = [
    {
      id: "p1",
      date: "Oct 2, 2026",
      amount: "$1,140.00",
      company: companyName,
      status: "Paid",
      hours: "60.0 hrs",
      stripeTransferId: "tr_stripe_8291834"
    },
    {
      id: "p2",
      date: "Sep 18, 2026",
      amount: "$570.00",
      company: companyName,
      status: "Paid",
      hours: "30.0 hrs",
      stripeTransferId: "tr_stripe_7190281"
    },
    {
      id: "p3",
      date: "Sep 4, 2026",
      amount: "$670.00",
      company: companyName,
      status: "Paid",
      hours: "35.2 hrs",
      stripeTransferId: "tr_stripe_6601928"
    }
  ];

  const documents = [
    {
      id: "d1",
      title: "Form 1099: 2025",
      company: companyName,
      status: "Filed",
      statusDate: "Feb 2, 2026"
    }
  ];

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Back to Time Tracking navigation */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => navigate("/time-tracking")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "none",
            border: "none",
            color: "#0f766e",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0
          }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      {/* Hero Mint Green Banner (Image 5 replica) */}
      <div
        style={{
          backgroundColor: "#e3f3eb",
          borderRadius: "16px",
          padding: "2.5rem 3rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2.5rem",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ maxWidth: "550px", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 0.5rem",
              letterSpacing: "-0.02em"
            }}
          >
            Your work, all in one place
          </h1>
          <p style={{ fontSize: "1rem", color: "#374151", margin: 0, fontWeight: 400 }}>
            Manage where you've beenâ€”and where you're headed.
          </p>
        </div>

        {/* Clean SVG Illustration matching screenshot */}
        <div style={{ width: "240px", height: "130px", flexShrink: 0 }}>
          <svg viewBox="0 0 240 130" width="100%" height="100%" fill="none">
            {/* Desk */}
            <rect x="40" y="85" width="160" height="6" rx="3" fill="#cbd5e1" />
            <rect x="55" y="91" width="6" height="35" rx="2" fill="#94a3b8" />
            <rect x="175" y="91" width="6" height="35" rx="2" fill="#94a3b8" />

            {/* Monitor */}
            <rect x="80" y="35" width="80" height="50" rx="4" fill="#ffffff" stroke="#0f766e" strokeWidth="2.5" />
            <rect x="115" y="85" width="10" height="8" fill="#0f766e" />
            <circle cx="120" cy="60" r="14" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
            <text x="120" y="65" textAnchor="middle" fill="#854d0e" fontSize="14" fontWeight="bold">$</text>

            {/* Worker Character 1 */}
            <circle cx="50" cy="45" r="12" fill="#fed7aa" />
            <path d="M40 78 C40 60, 60 60, 60 78 Z" fill="#3b82f6" />

            {/* Worker Character 2 */}
            <circle cx="190" cy="45" r="12" fill="#fed7aa" />
            <path d="M180 78 C180 60, 200 60, 200 78 Z" fill="#eab308" />

            {/* Plant */}
            <circle cx="20" cy="100" r="8" fill="#bbf7d0" />
            <path d="M20 95 Q15 80 18 70 Q25 80 20 95 Z" fill="#15803d" />
            <path d="M20 95 Q25 80 22 70 Q15 80 20 95 Z" fill="#16a34a" />
          </svg>
        </div>
      </div>

      {/* Main Grid: Left Column (Recent Payments & Recent Documents), Right Column (Work Timeline) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1.1fr",
          gap: "2.5rem",
          alignItems: "start"
        }}
      >
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Section: Recent payments */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.85rem"
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                Recent payments
              </h2>
              <Link
                to="/time-tracking/pay"
                style={{
                  color: "#0f766e",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "underline"
                }}
              >
                View all
              </Link>
            </div>

            {/* Payments Card Box */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden"
              }}
            >
              {payments.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1.1rem 1.25rem",
                    borderBottom: idx === payments.length - 1 ? "none" : "1px solid #f1f5f9"
                  }}
                >
                  {/* Left: Co icon + Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "6px",
                        backgroundColor: "#c7d2fe",
                        color: "#3730a3",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      Co
                    </div>
                    <div>
                      <div style={{ fontSize: "0.925rem", fontWeight: 600, color: "#111827" }}>
                        {p.date}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                        {p.company}
                      </div>
                    </div>
                  </div>

                  {/* Right: Total amount + More icon */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Total amount</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827", marginTop: "0.1rem" }}>
                        {p.amount}
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}
                      onClick={() => alert(`Direct deposit via Stripe transferred for ${p.date}: ${p.amount}`)}
                      title="Payment details"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Recent documents */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.85rem"
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                Recent documents
              </h2>
              <Link
                to="/time-tracking/documents"
                style={{
                  color: "#0f766e",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "underline"
                }}
              >
                View all
              </Link>
            </div>

            {/* Documents Card Box */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden"
              }}
            >
              {documents.map((d, idx) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1.1rem 1.25rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "6px",
                        backgroundColor: "#c7d2fe",
                        color: "#3730a3",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      Co
                    </div>
                    <div>
                      <div style={{ fontSize: "0.925rem", fontWeight: 600, color: "#111827" }}>
                        {d.title}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                        {d.company}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Status</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.1rem" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>
                          {d.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{d.statusDate}</div>
                    </div>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}
                      onClick={() => navigate("/time-tracking/documents")}
                      title="Document options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Work timeline */}
        <div>
          <div style={{ marginBottom: "0.85rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
              Work timeline
            </h2>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "1.5rem"
            }}
          >
            {/* Timeline item */}
            <div style={{ display: "flex", gap: "1rem", position: "relative" }}>
              {/* Timeline dot & line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    border: "2px solid #0f766e",
                    backgroundColor: "#ffffff",
                    zIndex: 2
                  }}
                />
                <div
                  style={{
                    width: "2px",
                    height: "100%",
                    minHeight: "80px",
                    backgroundColor: "#e5e7eb",
                    marginTop: "4px"
                  }}
                />
              </div>

              {/* Card content */}
              <div style={{ flex: 1, paddingBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "6px",
                        backgroundColor: "#c7d2fe",
                        color: "#3730a3",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      Co
                    </div>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
                        {companyName}
                      </div>
                      <div style={{ fontSize: "0.825rem", color: "#6b7280", marginTop: "0.2rem" }}>
                        Contractor
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        Sep 21, 2025â€“Present
                      </div>
                      <div style={{ marginTop: "0.5rem" }}>
                        <Link
                          to="/time-tracking/hours"
                          style={{
                            fontSize: "0.825rem",
                            color: "#0f766e",
                            fontWeight: 600,
                            textDecoration: "underline"
                          }}
                        >
                          View work summary
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Sign In Button (Image 5 replica) */}
                  <button
                    type="button"
                    onClick={() => navigate("/time-tracking")}
                    style={{
                      backgroundColor: "#0d5c46",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.45rem 0.95rem",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer matching ELA TT */}
      <footer
        style={{
          marginTop: "4rem",
          paddingTop: "2rem",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.8rem",
          color: "#6b7280"
        }}
      >
        <div>ELA TT © 2026 • ELA Academy</div>
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <a href="#help" style={{ color: "#6b7280", textDecoration: "none" }}>Help center</a>
          <a href="#terms" style={{ color: "#6b7280", textDecoration: "none" }}>Terms</a>
          <a href="#privacy" style={{ color: "#6b7280", textDecoration: "none" }}>Privacy</a>
          <a href="#choices" style={{ color: "#6b7280", textDecoration: "none" }}>Privacy choices âœ“Ã—</a>
        </div>
      </footer>
    </div>
  );
};

export default GustoMyAccountPage;
