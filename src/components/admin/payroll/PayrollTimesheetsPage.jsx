import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Search,
  Columns,
  RefreshCw,
  Info,
  X,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button, Modal } from "react-bootstrap";
import { getAllStaff } from "../../../services/staffService";
import "../../../styles/GustoTheme.css";

const PayrollTimesheetsPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("contractors"); // "employees" | "contractors" | "non-us"
  const [startDate, setStartDate] = useState("2026-09-27");
  const [endDate, setEndDate] = useState("2026-10-06");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Default contractors matching Image 7
  const defaultTimesheets = [
    { id: "dana-acosta", name: "Dana Acosta", hours: "33h 30m", totalHoursNum: 33.5 },
    { id: "nikolth-acosta", name: "Nikolth Acosta", hours: "25h", totalHoursNum: 25.0 },
    { id: "moyinoluwa-adebola", name: "Moyinoluwa Adebola", hours: "20h", totalHoursNum: 20.0 },
    { id: "danna-alvarez", name: "Danna Alvarez", hours: "28h", totalHoursNum: 28.0 },
    { id: "christian-ayemidejor", name: "Christian Ayemidejor", hours: "19h", totalHoursNum: 19.0 },
    { id: "aldren-barboza", name: "Aldren Barboza", hours: "18h", totalHoursNum: 18.0 }
  ];

  const [timesheets, setTimesheets] = useState(defaultTimesheets);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await getAllStaff();
        const list = Array.isArray(res) ? res : res.staff || [];
        if (list.length > 0) {
          const mapped = list.slice(0, 15).map((s, idx) => ({
            id: s.id || `staff-${idx}`,
            name: s.name,
            hours: `${20 + (idx % 15)}h`,
            totalHoursNum: 20 + (idx % 15)
          }));
          const existing = new Set(defaultTimesheets.map((d) => d.name.toLowerCase()));
          const extra = mapped.filter((m) => !existing.has(m.name.toLowerCase()));
          setTimesheets([...defaultTimesheets, ...extra]);
        }
      } catch (e) {
        console.error("Failed to load staff for timesheets:", e);
      }
    };
    loadStaff();
  }, []);

  const handleSyncHours = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setToastMessage("Contractor timesheets synced with ELA TT database.");
      setTimeout(() => setToastMessage(""), 4500);
    }, 1000);
  };

  const filteredTimesheets = timesheets.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#1e3a8a",
            color: "#ffffff",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            zIndex: 9999,
            fontSize: "0.875rem",
            fontWeight: 600
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Title (Image 7 replica) */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.825rem", color: "#6b7280", marginBottom: "0.35rem" }}>
          <span style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => navigate("/admin/payroll/time-attendance")}>Time tracking</span> / Timesheets
        </div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Timesheets
        </h1>
      </div>

      {/* Tabs Row (Employees | US Contractors | Non-US Contractors) */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "1.5rem",
          gap: "2rem"
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("employees")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "employees" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "employees" ? "#1d4ed8" : "#4b5563",
            fontWeight: activeTab === "employees" ? 700 : 500,
            fontSize: "0.95rem",
            padding: "0.5rem 0.25rem 0.85rem",
            cursor: "pointer"
          }}
        >
          Employees
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contractors")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "contractors" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "contractors" ? "#1d4ed8" : "#4b5563",
            fontWeight: activeTab === "contractors" ? 700 : 500,
            fontSize: "0.95rem",
            padding: "0.5rem 0.25rem 0.85rem",
            cursor: "pointer"
          }}
        >
          US Contractors
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("non-us")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "non-us" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "non-us" ? "#1d4ed8" : "#4b5563",
            fontWeight: activeTab === "non-us" ? 700 : 500,
            fontSize: "0.95rem",
            padding: "0.5rem 0.25rem 0.85rem",
            cursor: "pointer"
          }}
        >
          Non-US Contractors
        </button>
      </div>

      {/* Date Range Selector & Sync Subtext (Image 7 replica) */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>Select a start date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "0.4rem 0.75rem",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>

          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>to</span>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>Select an end date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "0.4rem 0.75rem",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>

          <Button
            variant="light"
            size="sm"
            onClick={handleSyncHours}
            disabled={isSyncing}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              color: "#374151",
              fontWeight: 600,
              padding: "0.4rem 0.95rem",
              borderRadius: "8px",
              fontSize: "0.85rem"
            }}
          >
            {isSyncing ? "Applying..." : "Apply"}
          </Button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#6b7280", marginTop: "0.6rem" }}>
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSyncing ? "animate-spin" : ""}`} />
          <span>Last dates synced Sep 13–Sep 26</span>
        </div>
      </div>

      {/* Confirmation / Info Banner (Image 7 replica) */}
      {!bannerDismissed && (
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "0.9rem" }}>
                Confirm your contractors have submitted their hours before syncing.
              </div>
              <div style={{ fontSize: "0.825rem", color: "#4b5563", marginTop: "0.15rem" }}>
                Submitting same-day payments before hours are logged may result in payment errors.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "2px" }}
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input & Columns Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.25rem"
        }}
      >
        <div style={{ position: "relative", flex: 1, maxWidth: "380px" }}>
          <Search className="w-4 h-4 text-slate-400" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search team members"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.45rem 0.75rem 0.45rem 2.25rem",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "0.875rem",
              outline: "none"
            }}
          />
        </div>

        <Button
          variant="light"
          size="sm"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: "0.825rem",
            fontWeight: 600
          }}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Columns</span>
        </Button>
      </div>

      {/* Timesheet List Table (Image 7 replica) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280", backgroundColor: "#f8fafc" }}>
              <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Timesheet for ↕</th>
              <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Total hrs ↕</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimesheets.map((t) => (
              <tr
                key={t.id}
                style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                onClick={() => navigate(`/admin/payroll/time-attendance/timesheets/${t.id}`)}
              >
                <td style={{ padding: "1rem" }}>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1d4ed8",
                      textDecoration: "underline"
                    }}
                  >
                    {t.name}
                  </span>
                </td>

                <td style={{ padding: "1rem", textAlign: "right", color: "#374151", fontWeight: 500 }}>
                  {t.hours}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollTimesheetsPage;
