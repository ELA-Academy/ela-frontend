import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Table, Alert, Card, Badge, Form, Dropdown, Button } from "react-bootstrap";
import { Search, Filter, RotateCcw, User, Eye, X, FileSpreadsheet, Trash2, CheckSquare, ChevronDown } from "lucide-react";
import PageHeader from "../../../components/admin/PageHeader";
import { getAllStudents } from "../../../services/studentService";
import { TableSkeleton } from "../../../components/Skeleton";
import FamilyImportWizardModal from "../../../components/admin/administration/FamilyImportWizardModal";
import BulkDeleteStudentsModal from "../../../components/admin/students/BulkDeleteStudentsModal";
import CleanSlateModal from "../../../components/admin/CleanSlateModal";

const AllStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showCleanSlateModal, setShowCleanSlateModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
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

  const handleResetFilters = handleClearFilters;
  const activeFilterCount = selectedStatuses.length + selectedGrades.length;
  const hasActiveFilters = Boolean(searchTerm.trim() || activeFilterCount > 0);

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

  useEffect(() => {
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

  const selectedStudentsList = useMemo(() => {
    return students.filter((s) => selectedStudentIds.has(s.id));
  }, [students, selectedStudentIds]);

  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentIds.has(s.id));

  const toggleSelectAllFiltered = () => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredStudents.forEach((s) => next.delete(s.id));
      } else {
        filteredStudents.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(new Set(students.map((s) => s.id)));
  };

  const clearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
        actions={
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setShowCleanSlateModal(true)}
              className="btn btn-outline-danger d-inline-flex align-items-center gap-1.5 shadow-sm"
              style={{ fontWeight: 500 }}
              title="Reset test data and start on a clean slate"
            >
              <RotateCcw size={15} />
              <span>Clean Slate (Reset Data)</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-outline-primary d-inline-flex align-items-center gap-2 shadow-sm"
              style={{ fontWeight: 500 }}
            >
              <FileSpreadsheet size={16} />
              <span>Import Student & Family Directory</span>
            </button>
          </div>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Sleek Search & Popover Filter Toolbar */}
      <div className="shadow-sm border mb-3 bg-white p-2.5 rounded-3 position-relative" style={{ borderColor: "#e2e8f0", zIndex: 100, overflow: "visible" }}>
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "460px" }}>
            <div className="position-relative flex-grow-1">
              <Search
                className="position-absolute text-muted"
                size={14}
                style={{ left: "10px", top: "50%", transform: "translateY(-50%)" }}
              />
              <Form.Control
                type="text"
                placeholder="Search by student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: "32px",
                  paddingRight: searchTerm ? "30px" : "10px",
                  fontSize: "12.5px",
                  borderColor: "#cbd5e1",
                  borderRadius: "7px",
                  height: "34px"
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="btn btn-link position-absolute p-0 text-muted"
                  style={{ right: "8px", top: "50%", transform: "translateY(-50%)" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Sleek Filter Popover Button */}
            <div className="position-relative" ref={filterPopoverRef} style={{ zIndex: 110 }}>
              <button
                type="button"
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className={`btn d-inline-flex align-items-center gap-1.5 px-2.5 ${
                  activeFilterCount > 0
                    ? "btn-primary text-white"
                    : "btn-outline-secondary bg-white text-slate-700"
                }`}
                style={{
                  borderColor: activeFilterCount > 0 ? "#673de6" : "#cbd5e1",
                  backgroundColor: activeFilterCount > 0 ? "#673de6" : "#ffffff",
                  height: "34px",
                  fontSize: "12.5px",
                  borderRadius: "7px",
                  fontWeight: "500",
                  whiteSpace: "nowrap"
                }}
              >
                <Filter size={13} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span
                    className="badge rounded-pill bg-white text-primary ms-1 fw-bold"
                    style={{ fontSize: "10px", padding: "1px 5px" }}
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
                    top: "40px",
                    zIndex: 1050,
                    width: "280px",
                    maxHeight: "420px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    borderColor: "#e2e8f0",
                    fontSize: "12.5px",
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

      {/* Sticky Bulk Actions Bar when students are selected */}
      {selectedStudentIds.size > 0 && (
        <div
          className="d-flex align-items-center justify-content-between p-2.5 px-3 mb-3 rounded-3 shadow-sm transition-all"
          style={{
            backgroundColor: "#1e1b4b",
            color: "#ffffff",
            position: "sticky",
            top: "12px",
            zIndex: 1040,
            border: "1px solid #312e81"
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge bg-primary px-2.5 py-1.5 fw-bold d-flex align-items-center gap-1"
              style={{ fontSize: "12px" }}
            >
              <CheckSquare size={13} />
              <span>{selectedStudentIds.size}</span>
            </span>
            <span className="small fw-semibold">
              student{selectedStudentIds.size > 1 ? "s" : ""} selected
            </span>
            {selectedStudentIds.size < students.length && (
              <button
                type="button"
                onClick={selectAllStudents}
                className="btn btn-link btn-sm text-white text-decoration-underline p-0 ms-2"
                style={{ fontSize: "12px" }}
              >
                Select all {students.length} students
              </button>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowBulkDeleteModal(true)}
              className="d-inline-flex align-items-center gap-1.5 fw-semibold px-3 shadow-sm bg-danger border-0"
              style={{ height: "32px", fontSize: "12.5px" }}
            >
              <Trash2 size={14} />
              <span>Bulk Delete ({selectedStudentIds.size})</span>
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={clearSelection}
              className="py-1 px-2.5"
              style={{ height: "32px", fontSize: "12px" }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="content-card shadow-sm border" style={{ borderColor: "#cbd5e1" }}>
        <Table responsive className="modern-table mb-0 align-middle">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th style={{ width: "4%", padding: "12px 8px", textAlign: "center" }}>
                <Form.Check
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  title={allFilteredSelected ? "Deselect all" : "Select all"}
                />
              </th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Student Name</th>
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
                <tr key={student.id} style={{ backgroundColor: selectedStudentIds.has(student.id) ? "#f5f3ff" : undefined }}>
                  <td style={{ textAlign: "center", padding: "12px 8px" }} onClick={(e) => e.stopPropagation()}>
                    <Form.Check
                      type="checkbox"
                      checked={selectedStudentIds.has(student.id)}
                      onChange={() => toggleSelectStudent(student.id)}
                    />
                  </td>
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

      {/* Bulk Delete Students Modal */}
      <BulkDeleteStudentsModal
        show={showBulkDeleteModal}
        onHide={() => setShowBulkDeleteModal(false)}
        selectedStudents={selectedStudentsList}
        onSuccess={() => {
          clearSelection();
          fetchStudents();
        }}
      />

      {/* Clean Slate Wipe Modal */}
      <CleanSlateModal
        show={showCleanSlateModal}
        onHide={() => setShowCleanSlateModal(false)}
        onSuccess={() => {
          clearSelection();
          fetchStudents();
        }}
      />

      {/* FAMILY DIRECTORY IMPORT & RECONCILIATION MODAL */}
      <FamilyImportWizardModal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        onSuccess={() => {
          fetchStudents();
        }}
      />
    </div>
  );
};

export default AllStudentsPage;
