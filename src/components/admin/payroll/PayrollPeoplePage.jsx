import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  User,
  Users,
  Building,
  CheckSquare,
  Square,
  ArrowRight,
  Download
} from "lucide-react";
import { Modal, Button } from "react-bootstrap";
import { getAllStaff } from "../../../services/staffService";
import "../../../styles/GustoTheme.css";

const PayrollPeoplePage = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Active"); // "Active" | "Onboarding" | "Offboarding" | "Dismissed"
  const [selectedIds, setSelectedIds] = useState([]);
  const [peopleModal, setPeopleModal] = useState({ show: false, title: "", body: "" });
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getAllStaff();
      setStaffList(data || []);
    } catch (err) {
      console.error("Error loading staff list:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter staff by active tab and search
  const filteredStaff = staffList.filter((s) => {
    const statusMatch = (s.worker_status || "Active").toLowerCase() === activeTab.toLowerCase();
    const nameMatch = (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.job_title || "").toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && nameMatch;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredStaff.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Header matching Image 2 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem"
        }}
      >
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          People
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "0.45rem 0.9rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem"
            }}
            onClick={() => setPeopleModal({ show: true, title: "Export Roster", body: "Staff directory roster exported as CSV." })}
          >
            More <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "0.45rem 0.9rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer"
            }}
            onClick={() => setPeopleModal({ show: true, title: "Organization Chart", body: "Interactive organizational hierarchy view of ELA departments and personnel." })}
          >
            Org chart
          </button>

          <button
            type="button"
            style={{
              backgroundColor: "#2563eb",
              border: "none",
              borderRadius: "6px",
              padding: "0.45rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem"
            }}
            onClick={() => navigate("/admin/administration")}
          >
            Add <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs matching Image 2: Active, Onboarding, Offboarding, Dismissed */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "1.5rem"
        }}
      >
        {["Active", "Onboarding", "Offboarding", "Dismissed"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                padding: "0.6rem 0",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#1d4ed8" : "#6b7280",
                borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px"
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Search Input Box */}
      <div style={{ marginBottom: "1.25rem", maxWidth: "420px", position: "relative" }}>
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          className="gusto-select"
          placeholder="Search people"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: "2.25rem" }}
        />
      </div>

      {/* Table Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          fontSize: "0.85rem",
          color: "#4b5563"
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={selectedIds.length > 0 && selectedIds.length === filteredStaff.length}
            onChange={handleSelectAll}
            style={{ accentColor: "#2563eb", width: "15px", height: "15px" }}
          />
          <span>Select all ({filteredStaff.length})</span>
        </label>

        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            color: "#374151",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem"
          }}
          onClick={() => setPeopleModal({ show: true, title: "Filter Personnel", body: "Filter options: Department (Teacher, Accounting, HR, Admissions), Worker Type (Contractor, Employee)." })}
        >
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      {/* People Table matching Image 2 */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          overflow: "hidden"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#fbfbfe", color: "#6b7280", textAlign: "left" }}>
              <th style={{ width: "40px", padding: "0.75rem 1rem" }}></th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Name ⬍</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Department ⬍</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Job title ⬍</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Worker type ⬍</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                  Loading staff from database...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                  No personnel found matching current filters.
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => {
                const isSelected = selectedIds.includes(staff.id);
                const initial = (staff.name || "S").charAt(0).toUpperCase();

                return (
                  <tr
                    key={staff.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background-color 0.15s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                    onClick={() => navigate(`/admin/payroll/people/${staff.id}`)}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: "0.75rem 1rem" }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(staff.id)}
                        style={{ accentColor: "#2563eb", width: "15px", height: "15px" }}
                      />
                    </td>

                    {/* Name */}
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "#1d4ed8"
                          }}
                        >
                          {initial}
                        </div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#1d4ed8",
                            textDecoration: "underline"
                          }}
                        >
                          {staff.name}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: "0.75rem 1rem", color: "#1d4ed8", textDecoration: "underline" }}>
                      {staff.department || staff.department_names?.join(", ") || "Teacher Department"}
                    </td>

                    {/* Job Title */}
                    <td style={{ padding: "0.75rem 1rem", color: "#1d4ed8", textDecoration: "underline" }}>
                      {staff.job_title || "Teacher"}
                    </td>

                    {/* Worker Type */}
                    <td style={{ padding: "0.75rem 1rem", color: "#374151" }}>
                      {staff.worker_type || "Contractor"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info Modal replacing alert */}
      <Modal show={peopleModal.show} onHide={() => setPeopleModal({ show: false, title: "", body: "" })} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>{peopleModal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-sm text-slate-700">
          {peopleModal.body}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setPeopleModal({ show: false, title: "", body: "" })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            backgroundColor: "#1e3a8a",
            color: "#ffffff",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            fontSize: "0.875rem",
            fontWeight: 600,
            zIndex: 9999
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default PayrollPeoplePage;
