import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Calendar,
  CreditCard,
  KeyRound,
  UserPlus,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Check,
  Copy
} from "lucide-react";
import api from "../../utils/api";

const ParentDashboardPage = () => {
  const { activeStudent, childrenList } = useOutletContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  const [copiedPin, setCopiedPin] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [activeStudent]);

  const fetchDashboard = () => {
    setLoading(true);
    api.get("/parent/dashboard")
      .then((res) => {
        setDashboardData(res.data);
      })
      .catch((err) => {
        console.error("Failed to load parent dashboard:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleCopyPin = (pin) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const studentDisplayName = activeStudent
    ? activeStudent.name || `${activeStudent.first_name} ${activeStudent.last_name}`
    : dashboardData?.children?.[0]?.name || "Student";

  const balanceAmount = dashboardData ? dashboardData.current_balance : 0;
  const pin = dashboardData?.sign_in_pin || "2963";

  return (
    <div>
      <div className="parent-page-header">
        <h1 className="parent-page-title">Dashboard</h1>
      </div>

      <div className="parent-dashboard-grid">
        {/* Left Column: Daily Activity */}
        <div className="parent-card">
          <div className="parent-card-header">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                {studentDisplayName}'s Daily Activity
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded-2 border" style={{ fontSize: "0.8rem", color: "#475569" }}>
                <Calendar size={14} />
                <span>up to {selectedDate}</span>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          {dashboardData?.activities && dashboardData.activities.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {dashboardData.activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-3 border bg-light d-flex align-items-start justify-content-between"
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
                      {act.title}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                      {act.description}
                    </div>
                  </div>
                  <span className="badge bg-white text-muted border px-2 py-1" style={{ fontSize: "0.72rem" }}>
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="parent-activity-empty">
              <div className="parent-activity-empty-icon">
                <ClipboardList size={34} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                No daily activities could be found
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", maxWidth: "340px", margin: 0 }}>
                Daily activity logs, sign-in records, and classroom updates for {studentDisplayName} will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Widgets Stack */}
        <div className="parent-widget-stack">
          {/* Bill Amount Card */}
          <div className="parent-widget-card">
            <div className="parent-widget-label">BILL AMOUNT</div>
            <div className="parent-widget-balance" style={{ color: balanceAmount < 0 ? "#059669" : "#0f172a" }}>
              ${Math.max(0, balanceAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="parent-widget-subtext">
              {balanceAmount < 0 
                ? `$${Math.abs(balanceAmount).toFixed(2)} Credit on Account`
                : "CURRENT BALANCE"}
            </div>

            <Link to="/parent/payments" className="btn-parent-primary">
              <CreditCard size={16} />
              <span>{balanceAmount < 0 ? "MAKE PAYMENT" : "PAY NOW"}</span>
            </Link>
          </div>

          {/* Another Child / Register Card */}
          <div className="parent-widget-card text-center py-4">
            <div className="mb-2" style={{ fontSize: "28px" }}>
              👫
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              Another child?
            </div>
            <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem" }}>
              Easily register a sibling or new family member online.
            </p>
            <Link to="/admissions/apply" className="btn-parent-outline d-inline-flex">
              <UserPlus size={14} />
              <span>REGISTER</span>
            </Link>
          </div>

          {/* Mobile App Promo Card */}
          <div className="parent-widget-card text-center" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" }}>
            <div className="d-flex justify-content-center mb-2">
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f0ebff", display: "flex", alignItems: "center", justifyContent: "center", color: "#673de6" }}>
                <Smartphone size={24} />
              </div>
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              Stay Connected on Mobile
            </div>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
              Receive instant tuition reminders and push notifications on your phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardPage;
