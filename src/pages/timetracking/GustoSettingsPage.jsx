import React, { useState } from "react";
import { Check } from "lucide-react";
import "../../styles/GustoTheme.css";

const GustoSettingsPage = () => {
  const [selectedTimezone, setSelectedTimezone] = useState("Eastern Time (US & Canada) (EDT, GMT-4)");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const expandedTimezonesList = [
    // US & Canada
    "Eastern Time (US & Canada) (EDT, GMT-4)",
    "Central Time (US & Canada) (CDT, GMT-5)",
    "Mountain Time (US & Canada) (MDT, GMT-6)",
    "Arizona (MST, GMT-7)",
    "Pacific Time (US & Canada) (PDT, GMT-7)",
    "Alaska (AKDT, GMT-8)",
    "Hawaii (HST, GMT-10)",
    "Indiana (East) (EDT, GMT-4)",
    "Newfoundland (NDT, GMT-2:30)",
    "Atlantic Time (Canada) (ADT, GMT-3)",
    // Latin America
    "Mexico City (CST, GMT-6)",
    "Central America (GMT-6)",
    "Bogota, Lima, Quito (GMT-5)",
    "Caracas (VET, GMT-4)",
    "Santiago (CLST, GMT-3)",
    "Buenos Aires, Georgetown (GMT-3)",
    "Brasilia (BRT, GMT-3)",
    // Europe
    "London, Edinburgh, Dublin (GMT / BST)",
    "Greenwich Mean Time (UTC / GMT)",
    "Amsterdam, Berlin, Rome, Paris, Madrid (CET / CEST, GMT+1/2)",
    "Athens, Bucharest, Istanbul, Helsinki (EET / EEST, GMT+2/3)",
    "Moscow, St. Petersburg, Volgograd (MSK, GMT+3)",
    // Middle East & Africa
    "Cairo (EEST, GMT+3)",
    "Kuwait, Riyadh, Baghdad (AST, GMT+3)",
    "Abu Dhabi, Muscat, Dubai (GST, GMT+4)",
    "West Central Africa (WAT, GMT+1)",
    "South Africa Standard Time (SAST, GMT+2)",
    "Nairobi, East Africa (EAT, GMT+3)",
    // Asia & Pacific
    "Islamabad, Karachi (PKT, GMT+5)",
    "Mumbai, New Delhi, Kolkata, Chennai (IST, GMT+5:30)",
    "Dhaka (BST, GMT+6)",
    "Bangkok, Hanoi, Jakarta (ICT, GMT+7)",
    "Beijing, Shanghai, Hong Kong, Singapore (CST / SGT, GMT+8)",
    "Perth, Western Australia (AWST, GMT+8)",
    "Tokyo, Osaka, Seoul (JST / KST, GMT+9)",
    "Adelaide, Darwin (ACST, GMT+9:30)",
    "Sydney, Melbourne, Brisbane (AEST / AEDT, GMT+10/11)",
    "Auckland, Wellington (NZST / NZDT, GMT+12/13)",
    "American Samoa (SST, GMT-11)"
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
              {expandedTimezonesList.map((tz) => (
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
