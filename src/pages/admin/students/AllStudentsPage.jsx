import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Table, Alert, Card, Badge, Form } from "react-bootstrap";
import { Search, Filter, RotateCcw, User, Eye, X } from "lucide-react";
import PageHeader from "../../../components/admin/PageHeader";
import { getAllStudents } from "../../../services/studentService";
import { TableSkeleton } from "../../../components/Skeleton";

const AllStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverRef = useRef(null);

  // Close filter popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setShowFilterPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleToggleGrade = (grade) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatuses([]);
    setSelectedGrades([]);
  };

  const activeFilterCount = selectedStatuses.length + selectedGrades.length;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await getAllStudents();
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load students.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Extract unique grade levels dynamically
  const gradeOptions = useMemo(() => {
    const grades = new Set();
    students.forEach((s) => {
      if (s.grade_level) grades.add(s.grade_level);
    });
    return Array.from(grades).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search filter: First name, last name, or student ID number
      const fullName = `${student.first_name || ""} ${student.last_name || ""}`.toLowerCase();
      const idNumber = (student.student_id_number || "").toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        fullName.includes(searchTerm.toLowerCase()) ||
        idNumber.includes(searchTerm.toLowerCase());

      // Status checkbox filter
      let matchesStatus = true;
      if (selectedStatuses.length > 0) {
        matchesStatus = selectedStatuses.includes((student.status || "Active").toLowerCase());
      }

      // Grade checkbox filter
      let matchesGrade = true;
      if (selectedGrades.length > 0) {
        matchesGrade = selectedGrades.includes(student.grade_level);
      }

      return matchesSearch && matchesStatus && matchesGrade;
    });
  }, [students, searchTerm, selectedStatuses, selectedGrades]);

  const getStatusBadge = (status) => {
    const s = (status || "Active").toLowerCase();
    if (s === "active") {
      return (
        <span
          className="badge px-2 py-1 text-uppercase fw-semibold"
          style={{
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
            fontSize: "0.75rem",
          }}
        >
          Active
        </span>
      );
    }
    if (s === "enrolled") {
      return (
        <span
          className="badge px-2 py-1 text-uppercase fw-semibold"
          style={{
            backgroundColor: "#eff6ff",
            color: "#1e40af",
            border: "1px solid #bfdbfe",
            fontSize: "0.75rem",
          }}
        >
          Enrolled
        </span>
      );
    }
    if (s === "graduated") {
      return (
        <span
          className="badge px-2 py-1 text-uppercase fw-semibold"
          style={{
            backgroundColor: "#f5f3ff",
            color: "#5b21b6",
            border: "1px solid #ddd6fe",
            fontSize: "0.75rem",
          }}
        >
          Graduated
        </span>
      );
    }
    return (
      <span
        className="badge px-2 py-1 text-uppercase fw-semibold"
        style={{
          backgroundColor: "#f1f5f9",
          color: "#475569",
          border: "1px solid #cbd5e1",
          fontSize: "0.75rem",
        }}
      >
        {status || "Inactive"}
      </span>
    );
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="All Students" subtitle="Manage student records, enrollment status, and parent linkages" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="All Students"
        subtitle="Manage student records, enrollment status, and parent linkages"
        badge={`${students.length} Total Registered`}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Sleek Search & Popover Filter Toolbar */}
      <div className="content-card shadow-sm border mb-3 bg-white p-3 rounded-3" style={{ borderColor: "#cbd5e1" }}>
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "460px" }}>
            <div className="position-relative flex-grow-1">
              <Search
                className="position-absolute text-muted"
                size={15}
                style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
              <Form.Control
                type="text"
                placeholder="Search by student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: "36px",
                  paddingRight: searchTerm ? "32px" : "12px",
                  fontSize: "0.85rem",
                  borderColor: "#cbd5e1",
                  height: "38px"
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="btn btn-link position-absolute p-0 text-muted"
                  style={{ right: "10px", top: "50%", transform: "translateY(-50%)" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sleek Filter Popover Button */}
            <div className="position-relative" ref={filterPopoverRef}>
              <button
                type="button"
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className={`btn d-inline-flex align-items-center gap-1.5 px-3 ${
                  activeFilterCount > 0
                    ? "btn-primary text-white"
                    : "btn-outline-secondary bg-white text-slate-700"
                }`}
                style={{
                  borderColor: activeFilterCount > 0 ? "#2563eb" : "#cbd5e1",
                  height: "38px",
                  fontSize: "0.83rem",
                  fontWeight: "500",
                  whiteSpace: "nowrap"
                }}
              >
                <Filter size={15} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span
                    className="badge rounded-pill bg-white text-primary ms-1 fw-bold"
                    style={{ fontSize: "10px", padding: "2px 6px" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Floating Filter Popover */}
              {showFilterPopover && (
                <div
                  className="shadow-lg border bg-white p-3 position-absolute"
                  style={{
                    left: 0,
                    top: "45px",
                    zIndex: 1050,
                    width: "300px",
                    maxHeight: "420px",
                    overflowY: "auto",
                    borderRadius: "10px",
                    borderColor: "#cbd5e1",
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <span className="small fw-bold text-slate-800 text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.04em" }}>
                      Filter Students
                    </span>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="btn btn-link p-0 text-primary small text-decoration-none"
                        style={{ fontSize: "11px" }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Enrollment Status Checkboxes */}
                  <div className="mb-3">
                    <div className="small fw-semibold text-slate-500 text-uppercase mb-1.5" style={{ fontSize: "10px", letterSpacing: "0.04em" }}>
                      Enrollment Status
                    </div>
                    {["active", "enrolled", "inactive", "graduated"].map((status) => (
                      <Form.Check
                        key={status}
                        type="checkbox"
                        id={`stud-filter-${status}`}
                        label={status.charAt(0).toUpperCase() + status.slice(1)}
                        checked={selectedStatuses.includes(status)}
                        onChange={() => handleToggleStatus(status)}
                        className="small text-slate-700 mb-1"
                        style={{ fontSize: "0.82rem" }}
                      />
                    ))}
                  </div>

                  {/* Grade Level Checkboxes */}
                  {gradeOptions.length > 0 && (
                    <div className="mb-1">
                      <div className="small fw-semibold text-slate-500 text-uppercase mb-1.5" style={{ fontSize: "10px", letterSpacing: "0.04em" }}>
                        Grade Level
                      </div>
                      <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                        {gradeOptions.map((grade) => (
                          <Form.Check
                            key={grade}
                            type="checkbox"
                            id={`stud-filter-grade-${grade}`}
                            label={grade}
                            checked={selectedGrades.includes(grade)}
                            onChange={() => handleToggleGrade(grade)}
                            className="small text-slate-700 mb-1"
                            style={{ fontSize: "0.82rem" }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Showing count indicator */}
          <div className="small text-muted">
            Showing <strong className="text-dark">{filteredStudents.length}</strong> of{" "}
            <strong>{students.length}</strong> students
            {(searchTerm || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-link btn-sm p-0 ms-2 text-primary text-decoration-none"
                style={{ fontSize: "0.8rem" }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="content-card shadow-sm border" style={{ borderColor: "#cbd5e1" }}>
        <Table responsive className="modern-table mb-0 align-middle">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th style={{ color: "#334155", fontWeight: "600" }}>Student Name</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Student ID</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Grade Level</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Status</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Parent(s)</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Enrollment Date</th>
              <th style={{ color: "#334155", fontWeight: "600" }} className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <Link
                      to={`/admin/students/${student.id}`}
                      className="fw-bold text-decoration-none text-primary d-inline-flex align-items-center gap-2"
                    >
                      <User size={15} className="text-muted" />
                      <span>{student.last_name}, {student.first_name}</span>
                    </Link>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border font-monospace" style={{ borderColor: "#e2e8f0" }}>
                      {student.student_id_number || "—"}
                    </span>
                  </td>
                  <td>
                    <span className="fw-medium text-slate-700">{student.grade_level || "—"}</span>
                  </td>
                  <td>{getStatusBadge(student.status)}</td>
                  <td>
                    {student.parent_names && student.parent_names.length > 0 ? (
                      <span className="small text-slate-600">
                        {student.parent_names.join(", ")}
                      </span>
                    ) : (
                      <span className="text-muted small fst-italic">None linked</span>
                    )}
                  </td>
                  <td className="small text-slate-600">
                    {student.enrollment_date
                      ? new Date(student.enrollment_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="text-end">
                    <Link
                      to={`/admin/students/${student.id}`}
                      className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                      style={{ fontSize: "0.8rem" }}
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  <div className="py-3">
                    <User size={36} className="text-muted mb-2 opacity-50" />
                    <p className="mb-2 fw-medium">No students match your filter criteria.</p>
                    {hasActiveFilters && (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleResetFilters}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default AllStudentsPage;
