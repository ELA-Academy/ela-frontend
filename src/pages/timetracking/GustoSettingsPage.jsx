import React, { useState } from "react";
import { Check } from "lucide-react";
import "../../styles/GustoTheme.css";

const GustoSettingsPage = () => {
  const [selectedTimezone, setSelectedTimezone] = useState("Eastern Time (EDT)");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const timezonesList = [
    "Eastern Time (EDT)",
    "Central Time (CDT)",
    "Mountain Time (MDT)",
    "Arizona (MST)",
    "Pacific Time (PDT)",
    "Alaska (AKDT)",
    "Hawaii (HST)",
    "Indiana (East) (EDT)"
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="gusto-page-header">
        <h1 className="gusto-page-title">Settings</h1>
        <p className="gusto-page-subtitle">Manage preferences, notifications, and time tracking configurations.</p>
      </div>

      <div className="gusto-settings-box">
        <form onSubmit={handleSave}>
          <div className="gusto-form-group">
            <label className="gusto-form-label">Current timezone</label>
            <select
              className="gusto-select"
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
            >
              {timezonesList.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className="gusto-form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#192024", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#673de6" }}
              />
              Receive email notifications for pay periods and clock approvals
            </label>
          </div>

          {saved && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#16a34a", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: 500 }}>
              <Check className="w-4 h-4" /> Preferences updated successfully!
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="submit" className="gusto-btn-primary">
              Save preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GustoSettingsPage;
