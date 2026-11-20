import React, { useState, useEffect } from "react";
import { ShieldCheck, UserPlus, Trash2, Lock, Unlock, Search, CheckCircle2, AlertCircle } from "lucide-react";
import {
  getPayrollAccessList,
  grantPayrollAccess,
  updatePayrollAccess,
  revokePayrollAccess
} from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const ROLE_LABELS = {
  accounting_admin: "Accounting Manager",
  hr_admin: "HR Manager",
  custom: "Custom Co-Admin"
};

const PayrollPermissionsPage = () => {
  const [coAdmins, setCoAdmins] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
  const [defaultsByRole, setDefaultsByRole] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Grant form state
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedRole, setSelectedRole] = useState("hr_admin");
  const [grantBlocked, setGrantBlocked] = useState(["pay", "money", "taxes"]);
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await getPayrollAccessList();
      setCoAdmins(res.co_admins || []);
      setStaffList(res.staff || []);
      setAllFeatures(res.all_features || []);
      setDefaultsByRole(res.default_blocked_by_role || {});
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || "Only Super Admin can manage Payroll co-admin permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleSelectChange = (role) => {
    setSelectedRole(role);
    setGrantBlocked(defaultsByRole[role] || []);
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    setSaving(true);
    try {
      await grantPayrollAccess({
        staff_id: Number(selectedStaffId),
        access_role: selectedRole,
        blocked_features: grantBlocked
      });
      setSelectedStaffId("");
      setStaffSearch("");
      showToast("Co-admin access granted.");
      loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || "Failed to grant access.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatureBlock = async (coAdmin, featureKey) => {
    const currentBlocked = coAdmin.blocked_features || [];
    const nextBlocked = currentBlocked.includes(featureKey)
      ? currentBlocked.filter((k) => k !== featureKey)
      : [...currentBlocked, featureKey];
    try {
      const updated = await updatePayrollAccess(coAdmin.id, { blocked_features: nextBlocked });
      setCoAdmins((prev) => prev.map((a) => (a.id === coAdmin.id ? updated : a)));
      showToast(`Updated feature restrictions for ${coAdmin.staff_name}.`);
    } catch (err) {
      setErrorMsg("Failed to update feature restriction.");
    }
  };

  const handleRoleUpdate = async (coAdmin, nextRole) => {
    const nextBlocked = defaultsByRole[nextRole] || [];
    try {
      const updated = await updatePayrollAccess(coAdmin.id, {
        access_role: nextRole,
        blocked_features: nextBlocked
      });
      setCoAdmins((prev) => prev.map((a) => (a.id === coAdmin.id ? updated : a)));
      showToast(`Updated role for ${coAdmin.staff_name}.`);
    } catch (err) {
      setErrorMsg("Failed to update role.");
    }
  };

  const handleRevoke = async (coAdmin) => {
    try {
      await revokePayrollAccess(coAdmin.id);
      setCoAdmins((prev) => prev.filter((a) => a.id !== coAdmin.id));
      showToast(`Removed payroll access for ${coAdmin.staff_name}.`);
    } catch (err) {
      setErrorMsg("Failed to revoke access.");
    }
  };

  const existingIds = new Set(coAdmins.map((a) => a.staff_id));
  const filteredStaff = staffList.filter((s) => {
    if (existingIds.has(s.id)) return false;
    const q = staffSearch.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.department_names || []).join(" ").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", paddingBottom: "4rem" }}>
      {toastMsg && (
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
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <ShieldCheck size={26} color="#2563eb" />
          Payroll Co-Admin Access &amp; Controls
        </h1>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "0.35rem" }}>
          Grant HR Managers and Accounting Managers access to Payroll by name, and block specific features for any co-admin.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            borderRadius: "8px",
            padding: "0.9rem 1.15rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add Co-Admin Card */}
      <form
        onSubmit={handleGrantAccess}
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "1.5rem",
          marginBottom: "1.75rem"
        }}
      >
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <UserPlus size={18} color="#2563eb" />
          Add Payroll Co-Admin
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 220px", gap: "1rem", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
              Find staff member by name
            </label>
            <div style={{ position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "11px" }} />
              <input
                type="text"
                placeholder="Search HR or Accounting staff..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
              Select person
            </label>
            <select
              required
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem" }}
            >
              <option value="">-- Choose staff member --</option>
              {filteredStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.department_names?.length ? `(${s.department_names.join(", ")})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
              Department Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleSelectChange(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem" }}
            >
              <option value="hr_admin">HR Manager</option>
              <option value="accounting_admin">Accounting Manager</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            {selectedRole === "accounting_admin"
              ? "Accounting Manager gets all monetary features (Pay, Money, Taxes, Enumeration) + Time Tracking & People info."
              : "HR Manager oversees People, Documents, Performance, Time Tracking, and Cumulative Pay Tracking (monetary Pay blocked by default)."}
          </div>
          <button
            type="submit"
            disabled={saving || !selectedStaffId}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0.55rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {saving ? "Granting..." : "Grant Access"}
          </button>
        </div>
      </form>

      {/* Active Co-Admins & Feature Blocking Matrix */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading co-admins...</div>
        ) : coAdmins.length === 0 ? (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "2.5rem", textAlign: "center", color: "#6b7280" }}>
            No co-admins assigned yet. Only Super Admin currently has Payroll access.
          </div>
        ) : (
          coAdmins.map((admin) => (
            <div
              key={admin.id}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "1.35rem 1.5rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", paddingBottom: "0.85rem", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#111827" }}>
                    {admin.staff_name}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
                    {admin.staff_email}
                    {admin.department_names?.length > 0 && ` • ${admin.department_names.join(", ")}`}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <select
                    value={admin.access_role}
                    onChange={(e) => handleRoleUpdate(admin, e.target.value)}
                    style={{ padding: "0.35rem 0.65rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.84rem", fontWeight: 600 }}
                  >
                    <option value="hr_admin">{ROLE_LABELS.hr_admin}</option>
                    <option value="accounting_admin">{ROLE_LABELS.accounting_admin}</option>
                    <option value="custom">{ROLE_LABELS.custom}</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRevoke(admin)}
                    style={{
                      background: "#fef2f2",
                      color: "#b91c1c",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      padding: "0.38rem 0.75rem",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem"
                    }}
                  >
                    <Trash2 size={14} /> Revoke
                  </button>
                </div>
              </div>

              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "0.65rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Feature Access Controls (click any feature to block or allow)
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.6rem" }}>
                {allFeatures.map((feat) => {
                  const isBlocked = (admin.blocked_features || []).includes(feat.key);
                  return (
                    <button
                      key={feat.key}
                      type="button"
                      onClick={() => toggleFeatureBlock(admin, feat.key)}
                      style={{
                        textAlign: "left",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "8px",
                        border: isBlocked ? "1px solid #fecaca" : "1px solid #bbf7d0",
                        backgroundColor: isBlocked ? "#fef2f2" : "#f0fdf4",
                        color: isBlocked ? "#991b1b" : "#166534",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.83rem", fontWeight: 600 }}>{feat.label}</div>
                        <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>{isBlocked ? "Blocked" : "Allowed"}</div>
                      </div>
                      {isBlocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PayrollPermissionsPage;
