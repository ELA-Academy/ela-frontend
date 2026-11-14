import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { CircleDollarSign, BarChart2, Landmark, Clock, FileText, DollarSign, CheckCircle2 } from "lucide-react";
import "../../../styles/GustoTheme.css";

const PayrollSectionPlaceholder = ({ title, description, icon: Icon }) => {
  const location = useLocation();
  const [syncing, setSyncing] = useState(false);
  const [syncedMsg, setSyncedMsg] = useState("");

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncedMsg(`Synchronized ${title} with Stripe Connect and local ledger successfully.`);
      setTimeout(() => setSyncedMsg(""), 4000);
    }, 1000);
  };

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {Icon && (
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            {title}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
            {description}
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "2.5rem",
          textAlign: "center"
        }}
      >
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "#2563eb" }}>
          {Icon ? <Icon className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
        </div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
          {title} Management Hub
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", maxWidth: "460px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
          Administered by Accounting Department & Super Admin. Automated with Stripe Connect and ELA Academy Payroll ledger.
        </p>

        {syncedMsg && (
          <div style={{ maxWidth: "460px", margin: "0 auto 1.25rem", padding: "0.6rem 1rem", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>{syncedMsg}</span>
          </div>
        )}

        <div style={{ display: "inline-flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="gusto-btn-primary"
            onClick={handleSync}
            disabled={syncing}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          >
            {syncing ? "Synchronizing with Stripe..." : "Run Sync"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollSectionPlaceholder;
