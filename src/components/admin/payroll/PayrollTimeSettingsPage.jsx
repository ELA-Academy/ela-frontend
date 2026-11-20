import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { Button, Form } from "react-bootstrap";
import {
  getAdminTimeSettings,
  updateAdminTimeSettings,
  getTimeAssignments,
  updateTimeAssignments
} from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const ALL_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PayrollTimeSettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general"); // "general" | "timesheets" | "geolocation" | "non_us" | "people"
  const [settings, setSettings] = useState({
    workweek_start: "Sunday",
    allowed_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    require_whole_hours: false,
    overtime_weekly_threshold: 40,
    overtime_daily_double: null,
    geolocation_enabled: false,
    non_us_tracking_enabled: true
  });
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([getAdminTimeSettings(), getTimeAssignments()]);
      setSettings(sRes);
      setAssignments(aRes.assignments || []);
    } catch (err) {
      console.error("Failed to load time settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const updated = await updateAdminTimeSettings(settings);
      setSettings(updated);
      showToast("Time tracking settings saved.");
    } catch (err) {
      showToast("Failed to save settings.");
    }
  };

  const handleTogglePerson = async (staffId, currentAssigned) => {
    try {
      await updateTimeAssignments({ staff_id: staffId, is_assigned: !currentAssigned });
      setAssignments((prev) =>
        prev.map((a) => (a.staff_id === staffId ? { ...a, is_assigned: !currentAssigned } : a))
      );
      showToast("Time tracking assignment updated.");
    } catch (err) {
      showToast("Failed to update assignment.");
    }
  };

  const toggleAllowedDay = (day) => {
    const current = settings.allowed_days || [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    setSettings({ ...settings, allowed_days: next });
  };

  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto", paddingBottom: "4rem" }}>
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

      <div style={{ fontSize: "0.85rem", color: "#2563eb", marginBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={() => navigate("/admin/payroll/time-attendance/time-tracking")}
          style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
        >
          <ArrowLeft className="w-4 h-4" /> Time tracking
        </button>{" "}
        <span style={{ color: "#6b7280" }}>/ Settings</span>
      </div>

      <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>
        Settings
      </h1>

      {/* Tabs matching Image 3 + People assigned (Image 2) */}
      <div style={{ display: "flex", gap: "1.75rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "general", label: "General" },
          { id: "timesheets", label: "Timesheets" },
          { id: "geolocation", label: "Geolocation" },
          { id: "non_us", label: "Non-US employees" },
          { id: "people", label: "People assigned to time tracking" }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              background: "none",
              border: "none",
              padding: "0.65rem 0.25rem",
              fontSize: "0.9rem",
              fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? "#111827" : "#6b7280",
              borderBottom: activeTab === t.id ? "2px solid #7c3aed" : "2px solid transparent",
              cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading settings...</p>
      ) : (
        <>
          {activeTab === "general" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <p style={{ color: "#4b5563", fontSize: "0.9rem", margin: 0 }}>
                For employees and contractors to use time tracking features, they must first be assigned to time tracking in the People section.
              </p>

              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Workweek</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.9rem", color: "#4b5563" }}>Start of workweek</span>
                  <Form.Select
                    style={{ maxWidth: "220px" }}
                    value={settings.workweek_start}
                    onChange={(e) => setSettings({ ...settings, workweek_start: e.target.value })}
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                  </Form.Select>
                </div>
              </div>

              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem" }}>Overtime policies</h2>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1rem" }}>
                  These policies apply to overtime-eligible W-2 employees based in the US.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "8px", padding: "0.9rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem", color: "#1e3a8a" }}>
                  <Info className="w-5 h-5 shrink-0" />
                  <span>Default weekly overtime threshold is configured below.</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: "520px" }}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Weekly overtime (hours/week)</Form.Label>
                    <Form.Control
                      type="number"
                      value={settings.overtime_weekly_threshold}
                      onChange={(e) => setSettings({ ...settings, overtime_weekly_threshold: Number(e.target.value) })}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Daily double overtime (hours/day)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="N/A"
                      value={settings.overtime_daily_double ?? ""}
                      onChange={(e) => setSettings({ ...settings, overtime_daily_double: e.target.value ? Number(e.target.value) : null })}
                    />
                  </Form.Group>
                </div>
              </div>

              <div>
                <Button onClick={handleSaveSettings} style={{ backgroundColor: "#2563eb", border: "none", fontWeight: 600 }}>
                  Save General Settings
                </Button>
              </div>
            </div>
          )}

          {activeTab === "timesheets" && (
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem" }}>Allowed Workdays &amp; Entry Rules</h2>
              <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1rem" }}>
                Restrict which days staff and teachers can log hours (default: Monday through Friday only; weekends disabled).
              </p>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                {ALL_DAYS.map((day) => {
                  const active = (settings.allowed_days || []).includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleAllowedDay(day)}
                      style={{
                        padding: "0.45rem 0.9rem",
                        borderRadius: "9999px",
                        border: active ? "1px solid #2563eb" : "1px solid #d1d5db",
                        backgroundColor: active ? "#eff6ff" : "#ffffff",
                        color: active ? "#2563eb" : "#4b5563",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer"
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <Form.Check
                type="switch"
                label="Prefer whole-hour entries (discourage odd minutes)"
                checked={settings.require_whole_hours}
                onChange={(e) => setSettings({ ...settings, require_whole_hours: e.target.checked })}
                className="mb-4"
              />

              <Button onClick={handleSaveSettings} style={{ backgroundColor: "#2563eb", border: "none", fontWeight: 600 }}>
                Save Timesheet Rules
              </Button>
            </div>
          )}

          {activeTab === "geolocation" && (
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Geolocation</h2>
              <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Optional location capture for mobile clock-in. Currently disabled because teachers log class hours manually.
              </p>
              <Form.Check
                type="switch"
                label="Enable geolocation verification"
                checked={settings.geolocation_enabled}
                onChange={(e) => setSettings({ ...settings, geolocation_enabled: e.target.checked })}
                className="mb-3"
              />
              <Button onClick={handleSaveSettings} style={{ backgroundColor: "#2563eb", border: "none", fontWeight: 600 }}>
                Save
              </Button>
            </div>
          )}

          {activeTab === "non_us" && (
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Non-US Employees &amp; International Contractors</h2>
              <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Unlike Gusto, ELA Academy enables time tracking for all international contractors (Colombia, Africa, etc.) with no minimum payout restriction.
              </p>
              <Form.Check
                type="switch"
                label="Allow Non-US contractors and employees to track time"
                checked={settings.non_us_tracking_enabled}
                onChange={(e) => setSettings({ ...settings, non_us_tracking_enabled: e.target.checked })}
                className="mb-3"
              />
              <Button onClick={handleSaveSettings} style={{ backgroundColor: "#2563eb", border: "none", fontWeight: 600 }}>
                Save
              </Button>
            </div>
          )}

          {activeTab === "people" && (
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.25rem" }}>People assigned to time tracking</h2>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>
                  Team members enabled here can track time in ELA TT. New hires are automatically assigned on onboarding.
                </p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <th style={{ padding: "0.8rem 1.25rem", textAlign: "left" }}>Name</th>
                    <th style={{ padding: "0.8rem 1.25rem", textAlign: "left" }}>State / Country</th>
                    <th style={{ padding: "0.8rem 1.25rem", textAlign: "left" }}>Employment type</th>
                    <th style={{ padding: "0.8rem 1.25rem", textAlign: "left" }}>Overtime policy</th>
                    <th style={{ padding: "0.8rem 1.25rem", textAlign: "right" }}>Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.staff_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.85rem 1.25rem", fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: "0.85rem 1.25rem", color: "#4b5563" }}>{a.state !== "-" ? a.state : a.country}</td>
                      <td style={{ padding: "0.85rem 1.25rem" }}>{a.employment_type}</td>
                      <td style={{ padding: "0.85rem 1.25rem", color: "#6b7280" }}>{a.overtime_policy}</td>
                      <td style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>
                        <Form.Check
                          type="switch"
                          inline
                          checked={a.is_assigned}
                          onChange={() => handleTogglePerson(a.staff_id, a.is_assigned)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PayrollTimeSettingsPage;
