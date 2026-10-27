import React from "react";
import { User, Mail, Building, Briefcase, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/GustoTheme.css";

const GustoProfilePage = () => {
  const { user } = useAuth();
  const staffName = user?.name || "Staff Member";

  return (
    <div>
      <div className="gusto-page-header">
        <h1 className="gusto-page-title">My profile</h1>
        <p className="gusto-page-subtitle">Your personal, employment, and emergency contact details.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="gusto-card">
          <div className="gusto-card-title">Personal information</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Full Name</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#192024" }}>{staffName}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Email Address</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#192024" }}>{user?.email || "staff@elaaschool.org"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Role</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#673de6" }}>
                {user?.role === "teacher" ? "Teaching Faculty" : user?.role || "Staff Member"}
              </div>
            </div>
          </div>
        </div>

        <div className="gusto-card">
          <div className="gusto-card-title">Employment details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Organization</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#192024" }}>ELA Academy LLC</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Department</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#192024" }}>
                {user?.departmentNames?.join(", ") || (user?.role === "teacher" ? "Academic / Teaching Staff" : "Administration")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Employment Status</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#16a34a" }}>Active • Full-Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GustoProfilePage;
