import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  Calendar,
  ShieldAlert,
  UserCheck,
  Phone,
  Mail,
  Plus,
  KeyRound
} from "lucide-react";
import api from "../../utils/api";
import { Link } from "react-router-dom";

const ParentFamilyPage = () => {
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamily();
  }, []);

  const fetchFamily = () => {
    setLoading(true);
    api.get("/parent/family")
      .then((res) => {
        setFamilyData(res.data);
      })
      .catch((err) => {
        console.error("Failed to load family data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const children = familyData?.children || [];
  const parent = familyData?.parent;

  return (
    <div>
      <div className="parent-page-header">
        <h1 className="parent-page-title">Family & Children</h1>
        <Link
          to="/admissions/apply"
          className="btn-parent-outline"
        >
          <Plus size={16} />
          <span>Register Sibling</span>
        </Link>
      </div>

      {/* Parent Contact Card */}
      {parent && (
        <div className="parent-card mb-4">
          <div className="parent-card-header">
            <div className="d-flex align-items-center gap-2">
              <Users size={18} className="text-primary" />
              <h2 className="parent-card-title">Primary Parent Contact</h2>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-3">
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>PARENT NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                {parent.first_name} {parent.last_name}
              </div>
            </div>
            <div className="col-md-3">
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>EMAIL ADDRESS</div>
              <div style={{ fontSize: "0.9rem", color: "#0f172a" }} className="d-flex align-items-center gap-1">
                <Mail size={13} className="text-muted" />
                <span>{parent.email}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>PHONE NUMBER</div>
              <div style={{ fontSize: "0.9rem", color: "#0f172a" }} className="d-flex align-items-center gap-1">
                <Phone size={13} className="text-muted" />
                <span>{parent.phone}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>MY SIGN-IN PIN</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0284c7" }} className="d-flex align-items-center gap-1">
                <KeyRound size={15} />
                <span>{parent.sign_in_pin}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Children Grid */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
        Enrolled Students ({children.length})
      </h2>

      <div className="row g-3">
        {children.map((child) => (
          <div key={child.id} className="col-lg-6">
            <div className="parent-card h-100">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div className="parent-student-avatar" style={{ width: "42px", height: "42px", fontSize: "14px", background: "#f0ebff", color: "#673de6" }}>
                    {child.first_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                      {child.first_name} {child.last_name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      ID: {child.student_id_number || `STU-${child.id}`}
                    </div>
                  </div>
                </div>

                <span className={`badge ${child.status === 'Active' ? 'bg-success' : 'bg-secondary'} px-2 py-1`}>
                  {child.status}
                </span>
              </div>

              <div className="row g-2 mb-3" style={{ fontSize: "0.85rem" }}>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Grade Level</span>
                  <strong>{child.grade_level || "Not Set"}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Date of Birth</span>
                  <strong>{child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : "N/A"}</strong>
                </div>
              </div>

              {/* Authorized Pickups */}
              <div className="mt-3 pt-3 border-top">
                <div className="d-flex align-items-center gap-1 mb-2" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                  <UserCheck size={14} className="text-success" />
                  <span>AUTHORIZED PICKUP INDIVIDUALS</span>
                </div>

                {child.authorized_pickups && child.authorized_pickups.length > 0 ? (
                  <div className="d-flex flex-column gap-1">
                    {child.authorized_pickups.map((p, idx) => (
                      <div key={idx} className="p-2 bg-light rounded-2 border d-flex justify-content-between" style={{ fontSize: "0.8rem" }}>
                        <span><strong>{p.name}</strong> ({p.relationship})</span>
                        <span className="text-muted">{p.phone}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mb-0" style={{ fontSize: "0.78rem" }}>
                    Parents listed on file have automatic pickup authorization.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParentFamilyPage;
