import React from "react";
import { Heart, Shield, CheckCircle } from "lucide-react";
import "../../styles/GustoTheme.css";

const GustoBenefitsPage = () => {
  return (
    <div>
      <div className="gusto-page-header">
        <h1 className="gusto-page-title">Benefits</h1>
        <p className="gusto-page-subtitle">Your healthcare, dental, retirement, and wellness plans.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="gusto-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="gusto-card-title" style={{ margin: 0 }}>Medical & Healthcare</div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", background: "#dcfce7", padding: "0.2rem 0.5rem", borderRadius: "12px" }}>
              Enrolled
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>
            Blue Cross Blue Shield Gold PPO Plan
          </p>
        </div>

        <div className="gusto-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="gusto-card-title" style={{ margin: 0 }}>Dental & Vision</div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", background: "#dcfce7", padding: "0.2rem 0.5rem", borderRadius: "12px" }}>
              Enrolled
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>
            Guardian Comprehensive Dental & Vision
          </p>
        </div>
      </div>
    </div>
  );
};

export default GustoBenefitsPage;
