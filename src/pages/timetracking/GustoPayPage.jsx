import React from "react";
import { CircleDollarSign, Calendar, Download, FileText } from "lucide-react";
import "../../styles/GustoTheme.css";

const GustoPayPage = () => {
  return (
    <div>
      <div className="gusto-page-header">
        <h1 className="gusto-page-title">Pay</h1>
        <p className="gusto-page-subtitle">View pay stubs, payment schedule, and direct deposit information.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
        <div className="gusto-card">
          <div className="gusto-card-title">Recent pay stubs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            {[
              { period: "Sep 15 – Sep 30, 2026", date: "Paid Oct 1, 2026", net: "$2,450.00" },
              { period: "Sep 1 – Sep 14, 2026", date: "Paid Sep 15, 2026", net: "$2,450.00" },
              { period: "Aug 15 – Aug 31, 2026", date: "Paid Sep 1, 2026", net: "$2,450.00" }
            ].map((stub, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  border: "1px solid #e6e8eb",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#192024" }}>{stub.period}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{stub.date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#192024" }}>{stub.net}</span>
                  <button className="gusto-shift-edit-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gusto-card">
          <div className="gusto-card-title">Direct deposit</div>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Your pay is automatically deposited into your primary bank account on the 1st and 15th of every month.
          </p>
          <div style={{ marginTop: "1rem", padding: "0.85rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Primary Account</div>
            <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "0.2rem" }}>Chase Checking (•••• 8912)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GustoPayPage;
