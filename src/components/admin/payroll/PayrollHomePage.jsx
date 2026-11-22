import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Calendar,
  ChevronDown,
  DollarSign,
  FileText,
  Users,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getPayrollHomeSummary } from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const PayrollHomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const adminName = user?.name ? user.name.split(" ")[0] : "Admin";
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    active_staff_count: 0,
    onboarding_staff: [],
    unpaid_hours: 0,
    unpaid_staff_count: 0,
    pending_documents_count: 0,
    recent_runs: []
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPayrollHomeSummary();
        if (data) setSummary(data);
      } catch (err) {
        console.error("Failed to load payroll home summary:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: "0 0 0.25rem" }}>
          {greeting}, {adminName}
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0 }}>
          Live payroll, timesheet, and team overview for ELA Academy.
        </p>
      </div>

      {/* Live KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}
      >
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "0.8rem", fontWeight: 600 }}>
            <Users className="w-4 h-4 text-blue-600" /> Active Team Members
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginTop: "0.4rem" }}>
            {loading ? "—" : summary.active_staff_count}
          </div>
        </div>

        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "0.8rem", fontWeight: 600 }}>
            <Clock className="w-4 h-4 text-emerald-600" /> Unpaid Logged Hours
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginTop: "0.4rem" }}>
            {loading ? "—" : `${summary.unpaid_hours}h`}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
            Across {summary.unpaid_staff_count} staff member(s)
          </div>
        </div>

        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "0.8rem", fontWeight: 600 }}>
            <FileText className="w-4 h-4 text-amber-600" /> Unsigned HR Documents
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginTop: "0.4rem" }}>
            {loading ? "—" : summary.pending_documents_count}
          </div>
        </div>

        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "0.8rem", fontWeight: 600 }}>
            <DollarSign className="w-4 h-4 text-indigo-600" /> Recorded Payroll Runs
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginTop: "0.4rem" }}>
            {loading ? "—" : summary.recent_runs.length}
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.1fr", gap: "2rem", alignItems: "start" }}>
        {/* Left: Actionable Tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>
              Action items
            </h2>

            {summary.onboarding_staff.length > 0 && (
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "0.3rem" }}>
                  Staff currently onboarding ({summary.onboarding_staff.length})
                </div>
                <button
                  type="button"
                  onClick={() => setShowOnboarding(!showOnboarding)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "none", border: "none", color: "#2563eb", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", padding: 0 }}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showOnboarding ? "rotate-180" : ""}`} />
                  {showOnboarding ? "Hide onboarding list" : "View onboarding staff"}
                </button>
                {showOnboarding && (
                  <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "0.84rem", color: "#334155" }}>
                    {summary.onboarding_staff.map((s) => s.name).join(", ")}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
                  Review timesheets &amp; run payroll
                </div>
                <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                  {summary.unpaid_hours > 0
                    ? `${summary.unpaid_hours} unpaid hour(s) logged across ${summary.unpaid_staff_count} team member(s).`
                    : "All logged timesheets are up to date."}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => navigate("/admin/payroll/time-attendance/time-tracking")}
                  style={{ backgroundColor: "#ffffff", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.45rem 0.9rem", fontSize: "0.84rem", fontWeight: 600, color: "#111827", cursor: "pointer" }}
                >
                  Timesheets
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/payroll/pay")}
                  style={{ backgroundColor: "#2563eb", border: "1px solid #2563eb", borderRadius: "6px", padding: "0.45rem 0.9rem", fontSize: "0.84rem", fontWeight: 600, color: "#ffffff", cursor: "pointer" }}
                >
                  Run payroll &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real Recent Payroll Runs */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", margin: 0 }}>
              Recent payroll runs
            </h2>
            <button
              type="button"
              onClick={() => navigate("/admin/payroll/pay/history")}
              style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}
            >
              See history
            </button>
          </div>

          {summary.recent_runs.length === 0 ? (
            <div style={{ fontSize: "0.875rem", color: "#6b7280", padding: "0.5rem 0" }}>
              No payroll runs recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {summary.recent_runs.map((run) => (
                <div
                  key={run.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.86rem", fontWeight: 600, color: "#111827" }}>
                      Run #{run.id} · {run.pay_date || "—"}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                      {run.item_count} worker(s) · {run.run_type}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>
                      ${Number(run.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: 600 }}>
                      <CheckCircle2 className="w-3 h-3 inline me-1" />
                      {run.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollHomePage;
