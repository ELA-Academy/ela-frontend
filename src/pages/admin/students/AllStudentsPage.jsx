import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Table, Alert, Card, Badge } from "react-bootstrap";
import { Search, Filter, RotateCcw, User, Eye } from "lucide-react";
import PageHeader from "../../../components/admin/PageHeader";
import { getAllStudents } from "../../../services/studentService";
import { TableSkeleton } from "../../../components/Skeleton";

const AllStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

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

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== "all") {
        matchesStatus =
          (student.status || "").toLowerCase() === statusFilter.toLowerCase();
      }

      // Grade filter
      let matchesGrade = true;
      if (gradeFilter !== "all") {
        matchesGrade = student.grade_level === gradeFilter;
      }

      return matchesSearch && matchesStatus && matchesGrade;
    });
  }, [students, searchTerm, statusFilter, gradeFilter]);

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || gradeFilter !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setGradeFilter("all");
  };

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

      {/* High-Visibility Filter & Search Toolbar */}
      <Card
        className="content-card shadow-sm border mb-4"
        style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1" }}
      >
        <Card.Body className="p-3">
          <div className="row g-3 align-items-end">
            {/* Search Input */}
            <div className="col-md-5">
              <label
                className="form-label small fw-bold text-slate-700 text-uppercase mb-1"
                style={{ fontSize: "11px", letterSpacing: "0.04em" }}
              >
                Search Students
              </label>
              <div className="input-group" style={{ borderColor: "#cbd5e1" }}>
                <span
                  className="input-group-text bg-white border-end-0"
                  style={{ borderColor: "#cbd5e1" }}
                >
                  <Search size={15} className="text-muted" />
                </span>
                <input
                  type="text"
                  placeholder="Search by student name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control border-start-0 bg-white"
                  style={{ fontSize: "0.85rem", borderColor: "#cbd5e1" }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-md-3">
              <label
                className="form-label small fw-bold text-slate-700 text-uppercase mb-1"
                style={{ fontSize: "11px", letterSpacing: "0.04em" }}
              >
                Status
              </label>
              <select
                className="form-select bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: "0.85rem", borderColor: "#cbd5e1" }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="enrolled">Enrolled</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>

            {/* Grade Level Filter */}
            <div className="col-md-2">
              <label
                className="form-label small fw-bold text-slate-700 text-uppercase mb-1"
                style={{ fontSize: "11px", letterSpacing: "0.04em" }}
              >
                Grade Level
              </label>
              <select
                className="form-select bg-white"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                style={{ fontSize: "0.85rem", borderColor: "#cbd5e1" }}
              >
                <option value="all">All Grades</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="col-md-2 text-md-end">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-outline-secondary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
                  style={{ borderColor: "#cbd5e1", fontSize: "0.82rem" }}
                >
                  <RotateCcw size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Result Count and Active Indicators */}
          <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top border-slate-200">
            <div className="small text-muted">
              Showing <strong className="text-dark">{filteredStudents.length}</strong> of{" "}
              <strong>{students.length}</strong> students
            </div>
            {hasActiveFilters && (
              <span className="badge bg-secondary-subtle text-secondary border">
                Active filters applied
              </span>
            )}
          </div>
        </Card.Body>
      </Card>

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
