import React from "react";
import { Star, Award, TrendingUp } from "lucide-react";
import "../../styles/GustoTheme.css";

const GustoPerformancePage = () => {
  return (
    <div>
      <div className="gusto-page-header">
        <h1 className="gusto-page-title">Performance</h1>
        <p className="gusto-page-subtitle">Reviews, goals, feedback, and milestones.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="gusto-card">
          <div className="gusto-card-title">Recent reviews</div>
          <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#192024" }}>Fall 2026 Milestone Review</span>
              <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>Completed</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.4rem 0 0" }}>
              Conducted by Administration on Sep 28, 2026. Rating: Exceeds Expectations.
            </p>
          </div>
        </div>

        <div className="gusto-card">
          <div className="gusto-card-title">Active goals</div>
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#192024" }}>Quarterly Curriculum Enhancement</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Target: Dec 15, 2026 • 75% complete</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GustoPerformancePage;
