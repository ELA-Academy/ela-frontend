import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Sliders,
  MapPin,
  Clock,
  ChevronRight,
  Eye
} from "lucide-react";
import { Button } from "react-bootstrap";
import { getAdminTimesheets, adminSyncTimesheets } from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const formatMinutes = (mins) => {
  const h = Math.floor((mins || 0) / 60);
  const m = (mins || 0) % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const PayrollTimesheetsPage = () => {
  const navigate = useNavigate();

  const today = new Date();
  const twoWeeksAgo = new Date(today.getTime() - 13 * 86400000);
  const [startDate, setStartDate] = useState(twoWeeksAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState("all"); // "all" | "us_contractors" | "non_us" | "employees"
  const [searchQuery, setSearchQuery] = useState("");
  const [timesheets, setTimesheets] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      const res = await getAdminTimesheets(startDate, endDate);
      setTimesheets(res.timesheets || []);
      setActiveCount(res.active_on_time_tracking || 0);
      setLastSyncedAt(res.last_synced_at);
    } catch (err) {
      console.error("Failed to load timesheets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimesheets();
  }, [startDate, endDate]);

  const handleSyncHours = async () => {
    setIsSyncing(true);
    try {
      const res = await adminSyncTimesheets({ start_date: startDate, end_date: endDate });
      setLastSyncedAt(res.last_synced_at);
      showToast(`Locked & synced ${res.synced_count} shift(s) to Payroll.`);
      loadTimesheets();
    } catch (err) {
      showToast("Failed to sync timesheets.");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredTimesheets = timesheets.filter((t) => {
    const qMatch = (t.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!qMatch) return false;
    const isEmp = (t.worker_type || "").toLowerCase() === "employee";
    if (activeTab === "employees") return isEmp;
    if (activeTab === "us_contractors") return !isEmp && t.is_us;
    if (activeTab === "non_us") return !isEmp && !t.is_us;
    return true;
  });

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "4rem" }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Time tracking
        </h1>
        <Button
          onClick={handleSyncHours}
          disabled={isSyncing}
          style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync & Lock Timesheets to Payroll"}
        </Button>
      </div>

      {/* Contractor timesheets summary card (Matching Image 1) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <div style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>Contractor timesheets</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginTop: "0.2rem" }}>
            {activeCount} active on time tracking
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>Last synced to payments</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827", marginTop: "0.2rem" }}>
            {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Not synced yet"}
          </div>
        </div>
        <Button
          onClick={() => navigate("/admin/payroll/pay")}
          style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
        >
          Go to Payroll <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Manage time tracking cards (Matching Image 1) */}
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>
        Manage time tracking
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <Sliders className="w-6 h-6 text-purple-700 mb-2" />
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>Settings and policies</div>
            <p style={{ fontSize: "0.84rem", color: "#4b5563", marginBottom: "1rem" }}>
              Assign people to time tracking and manage workweek, Mon–Fri rules, overtime, and non-US settings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/payroll/time-attendance/settings")}
            style={{ background: "none", border: "none", padding: 0, color: "#0f766e", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
          >
            Manage settings and policies <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <MapPin className="w-6 h-6 text-teal-700 mb-2" />
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>Geolocation</div>
            <p style={{ fontSize: "0.84rem", color: "#4b5563", marginBottom: "1rem" }}>
              Optional mobile location verification. Teachers log class hours manually by subject and grade.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/payroll/time-attendance/settings")}
            style={{ background: "none", border: "none", padding: 0, color: "#0f766e", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
          >
            Configure <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <Clock className="w-6 h-6 text-indigo-700 mb-2" />
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>Full Shift Visibility</div>
            <p style={{ fontSize: "0.84rem", color: "#4b5563", marginBottom: "1rem" }}>
              Admins see exact start/end times, class notes, and timezones for every contractor and teacher.
            </p>
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#059669" }}>Enabled for ELA Academy</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Team" },
            { id: "us_contractors", label: "US Contractors" },
            { id: "non_us", label: "Non-US Contractors" },
            { id: "employees", label: "Employees" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "6px",
                border: activeTab === tab.id ? "1px solid #0f766e" : "1px solid #d1d5db",
                backgroundColor: activeTab === tab.id ? "#f0fdfa" : "#ffffff",
                color: activeTab === tab.id ? "#0f766e" : "#374151",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "0.42rem 0.6rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.85rem" }}
          />
          <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "0.42rem 0.6rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.85rem" }}
          />
          <div style={{ position: "relative" }}>
            <Search className="w-4 h-4 text-gray-400" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Search team member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "0.42rem 0.75rem 0.42rem 2rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.85rem" }}
            />
          </div>
        </div>
      </div>

      {/* Timesheets Table */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
              <th style={{ padding: "0.85rem 1rem", textAlign: "left" }}>Team member</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "left" }}>Type / Country</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "left" }}>Timezone</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "left" }}>Shifts Logged</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Total Hours</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading timesheets...</td></tr>
            ) : filteredTimesheets.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No team members found.</td></tr>
            ) : (
              filteredTimesheets.map((t) => (
                <tr key={t.staff_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ fontWeight: 600, color: "#0f766e", cursor: "pointer" }} onClick={() => navigate(`/admin/payroll/time-attendance/timesheets/${t.staff_id}?start=${startDate}&end=${endDate}`)}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{t.department}</div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div>{t.worker_type}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{t.is_us ? "United States" : t.country}</div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "#4b5563" }}>{t.timezone}</td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    {t.shifts && t.shifts.length > 0 ? (
                      <div style={{ fontSize: "0.8rem", color: "#374151" }}>
                        {t.shifts.slice(0, 2).map((s) => (
                          <div key={s.id}>
                            {s.work_date}: <strong>{s.start_time}–{s.end_time}</strong> {s.note ? `(${s.note})` : ""}
                          </div>
                        ))}
                        {t.shifts.length > 2 && <span style={{ color: "#6b7280" }}>+{t.shifts.length - 2} more</span>}
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>No shifts</span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 700 }}>
                    {formatMinutes(t.total_minutes)}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/payroll/time-attendance/timesheets/${t.staff_id}?start=${startDate}&end=${endDate}`)}
                      style={{ background: "none", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.3rem 0.7rem", fontSize: "0.8rem", fontWeight: 600, color: "#0f766e", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <Eye className="w-3.5 h-3.5" /> Review / Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollTimesheetsPage;
