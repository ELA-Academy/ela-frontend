import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Table, Spinner, Alert, Button, Form, Nav, Dropdown } from "react-bootstrap";
import {
  Search,
  Filter,
  FileText,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  RotateCcw,
  Edit3,
  Layers,
  Calendar,
  Trash2,
  CheckSquare
} from "lucide-react";
import AccountingNav from "../../../components/admin/billing/AccountingNav";
import CreatePlanWizard from "../../../components/admin/billing/CreatePlanWizard";
import BulkEditPlansModal from "../../../components/admin/billing/BulkEditPlansModal";
import BulkDeletePlansModal from "../../../components/admin/billing/BulkDeletePlansModal";
import CleanSlateModal from "../../../components/admin/CleanSlateModal";
import EditPlanModal from "../../../components/admin/billing/EditPlanModal";
import { getSubscriptions, getBillingPlans, deleteSubscription } from "../../../services/billingService";
import { getAllStudents } from "../../../services/studentService";
import { TableSkeleton } from "../../../components/Skeleton";
import "../../../styles/AdminModern.css";

import ProcareImportWizardModal from "../../../components/admin/billing/ProcareImportWizardModal";
import { Upload } from "lucide-react";

// Safe date formatter to prevent UTC timezone offset issues (e.g. Sep 1 showing as Aug 31)
const formatDateSafe = (dateStr) => {
  if (!dateStr) return "N/A";
  const str = String(dateStr).split("T")[0].trim();
  const parts = str.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }
  return dateStr;
};

const getPlanNextDueDate = (plan) => {
  if (plan.next_due_date) {
    return formatDateSafe(plan.next_due_date);
  }
  if (!plan.next_invoice_date) return "N/A";
  const parts = String(plan.next_invoice_date).split("T")[0].split("-").map(Number);
  if (parts.length !== 3) return "N/A";
  const [y, m, d] = parts;
  const dueDay = plan.due_day != null && plan.due_day > 0 ? Number(plan.due_day) : 1;
  let dueYear = y;
  let dueMonth = m;
  if (d > dueDay) {
    dueMonth = m + 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }
  const dObj = new Date(dueYear, dueMonth - 1, dueDay);
  return dObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const RecurringPlansPage = () => {
  const [activePlans, setActivePlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState("active-plans");

  // Selection & Bulk Edit State
  const [selectedPlanIds, setSelectedPlanIds] = useState(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showCleanSlateModal, setShowCleanSlateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Search & Pagination & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCycles, setSelectedCycles] = useState([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverRef = useRef(null);
  const [page, setPage] = useState(1);
  const limit = 30;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setShowFilterPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleCycle = (cycle) => {
    setSelectedCycles((prev) =>
      prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle]
    );
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCycles([]);
    setPage(1);
  };

  const activeFilterCount = selectedCycles.length;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [subs, tmpls, stds] = await Promise.all([
        getSubscriptions(),
        getBillingPlans(),
        getAllStudents()
      ]);
      setActivePlans(subs || []);
      setTemplates(tmpls || []);
      setStudents(stds || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load recurring plan data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlanCreated = () => {
    setShowWizard(false);
    fetchData();
  };

  // Filter and search active plans
  const filteredActivePlans = useMemo(() => {
    return activePlans.filter((plan) => {
      const matchesSearch =
        !searchTerm.trim() ||
        plan.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.plan_name?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesCycle = true;
      if (selectedCycles.length > 0) {
        matchesCycle = selectedCycles.some((c) =>
          (plan.cycle || "").toLowerCase().replace("-", "") === c.toLowerCase().replace("-", "")
        );
      }

      return matchesSearch && matchesCycle;
    });
  }, [activePlans, searchTerm, selectedCycles]);

  // Paginated active plans
  const paginatedActivePlans = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredActivePlans.slice(start, start + limit);
  }, [filteredActivePlans, page]);

  // Selected plans objects
  const selectedPlansList = useMemo(() => {
    return activePlans.filter((p) => selectedPlanIds.has(p.id));
  }, [activePlans, selectedPlanIds]);

  const allCurrentPageSelected =
    paginatedActivePlans.length > 0 &&
    paginatedActivePlans.every((p) => selectedPlanIds.has(p.id));

  const toggleSelectAllCurrentPage = () => {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      if (allCurrentPageSelected) {
        paginatedActivePlans.forEach((p) => next.delete(p.id));
      } else {
        paginatedActivePlans.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    const next = new Set(filteredActivePlans.map((p) => p.id));
    setSelectedPlanIds(next);
  };

  const clearSelection = () => {
    setSelectedPlanIds(new Set());
  };

  const toggleSelectPlan = (id) => {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeletePlan = async (plan) => {
    if (
      !window.confirm(
        `Are you sure you want to delete recurring plan '${plan.plan_name}' for ${plan.student_name}?`
      )
    ) {
      return;
    }
    try {
      await deleteSubscription(plan.id);
      setSelectedPlanIds((prev) => {
        const next = new Set(prev);
        next.delete(plan.id);
        return next;
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to delete recurring plan.");
    }
  };

  // Compute number of students without a plan
  const studentsWithoutPlan = useMemo(() => {
    const uniqueStudentsWithPlan = new Set(activePlans.map((p) => p.account_id));
    // Match against students financial accounts or just students
    const activeStudentIds = students.map((s) => s.id);
    const count = students.filter(s => {
      // Find if student has a subscription
      const hasSub = activePlans.some(p => p.student_name.toLowerCase().includes(s.first_name.toLowerCase()));
      return !hasSub;
    }).length;
    return count;
  }, [students, activePlans]);

  const formatCurrency = (amount) =>
    (amount != null ? amount : 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });

  // Circular initials avatar
  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "";
  };

  const colors = ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4"];
  const getAvatarBg = (name) => {
    const code = name.charCodeAt(0) || 0;
    return colors[code % colors.length];
  };

  if (loading)
    return (
      <div className="recurring-plans-page font-prompt" style={{ fontFamily: '"Prompt", sans-serif' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1 fs-4 text-slate-800">Recurring Plans</h2>
          </div>
        </div>
        <AccountingNav />
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  if (error) return <Alert variant="danger" className="font-prompt">{error}</Alert>;

  return (
    <div className="recurring-plans-page font-prompt" style={{ fontFamily: '"Prompt", sans-serif' }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1 className="page-title fs-4 fw-bold text-slate-800 m-0">Recurring Plans</h1>
        <div className="d-flex gap-2">
          <Button
            onClick={() => setShowImportModal(true)}
            variant="outline-success"
            style={{
              borderRadius: "20px",
              fontSize: "0.82rem",
              fontWeight: "600",
              padding: "6px 18px"
            }}
            className="d-flex align-items-center gap-1 shadow-sm bg-white"
          >
            <Upload size={15} /> IMPORT PROCARE PLANS
          </Button>

          <Button
            variant="outline-danger"
            onClick={() => setShowCleanSlateModal(true)}
            style={{
              borderRadius: "20px",
              fontSize: "0.82rem",
              fontWeight: "600",
              padding: "6px 16px"
            }}
            className="d-flex align-items-center gap-1 shadow-sm"
            title="Reset test data and start on a clean slate"
          >
            <RotateCcw size={14} /> CLEAN SLATE (RESET)
          </Button>

          <Button
            onClick={() => setShowWizard(true)}
            style={{
              backgroundColor: "#00b8d4",
              borderColor: "#00b8d4",
              borderRadius: "20px",
              fontSize: "0.82rem",
              fontWeight: "600",
              padding: "6px 20px"
            }}
            className="d-flex align-items-center gap-1 shadow-sm"
          >
            <Plus size={16} /> CREATE RECURRING PLAN
          </Button>
        </div>
      </div>

      <AccountingNav />

      {/* Sub tabs Navigation */}
      <div className="border-bottom mb-3">
        <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => { setActiveTab(k); setPage(1); }} className="border-0">
          <Nav.Item>
            <Nav.Link 
              eventKey="active-plans" 
              className={`px-3 py-2 border-0 fw-semibold ${activeTab === "active-plans" ? "text-slate-900 border-bottom border-primary border-3 fw-bold" : "text-muted"}`}
              style={{ 
                borderBottom: activeTab === "active-plans" ? "3px solid #00b8d4 !important" : "none",
                fontSize: "0.85rem"
              }}
            >
              Active Plans
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="plan-templates" 
              className={`px-3 py-2 border-0 fw-semibold ${activeTab === "plan-templates" ? "text-slate-900 border-bottom border-primary border-3 fw-bold" : "text-muted"}`}
              style={{ 
                borderBottom: activeTab === "plan-templates" ? "3px solid #00b8d4 !important" : "none",
                fontSize: "0.85rem"
              }}
            >
              Plan Templates
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      {activeTab === "active-plans" ? (
        <>
          {/* Toolbar */}
          <div className="shadow-sm border mb-3 bg-white p-2.5 rounded-3 position-relative" style={{ borderColor: "#e2e8f0", zIndex: 100, overflow: "visible" }}>
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "460px" }}>
                <div className="position-relative flex-grow-1">
                  <Search className="position-absolute text-muted" size={14} style={{ left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                  <Form.Control
                    type="text"
                    placeholder="Search students or plans..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    style={{ paddingLeft: "32px", paddingRight: searchTerm ? "30px" : "10px", fontSize: "12.5px", height: "34px", borderColor: "#cbd5e1", borderRadius: "7px" }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => { setSearchTerm(""); setPage(1); }}
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
                        zIndex: 1060,
                        width: "250px",
                        borderRadius: "8px",
                        borderColor: "#e2e8f0",
                        fontSize: "12.5px",
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                        <span className="small fw-bold text-slate-800 text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.04em" }}>
                          Plan Cycle
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

                      {["Weekly", "Bi-Weekly", "Monthly", "Quarterly"].map((cycle) => (
                        <Form.Check
                          key={cycle}
                          type="checkbox"
                          id={`plan-cycle-${cycle}`}
                          label={cycle}
                          checked={selectedCycles.includes(cycle)}
                          onChange={() => handleToggleCycle(cycle)}
                          className="small text-slate-700 mb-1.5"
                          style={{ fontSize: "0.82rem" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bulk Actions Bar when items are selected */}
          {selectedPlanIds.size > 0 && (
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
                  <span>{selectedPlanIds.size}</span>
                </span>
                <span className="small fw-semibold">
                  recurring plan{selectedPlanIds.size > 1 ? "s" : ""} selected
                </span>
                {selectedPlanIds.size < filteredActivePlans.length && (
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="btn btn-link btn-sm text-white text-decoration-underline p-0 ms-2"
                    style={{ fontSize: "12px" }}
                  >
                    Select all {filteredActivePlans.length} plans
                  </button>
                )}
              </div>

              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowBulkEditModal(true)}
                  className="d-inline-flex align-items-center gap-1.5 fw-semibold px-3 shadow-sm"
                  style={{ height: "32px", fontSize: "12.5px" }}
                >
                  <Calendar size={14} />
                  <span>Bulk Edit Dates & Schedule</span>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="d-inline-flex align-items-center gap-1.5 fw-semibold px-3 shadow-sm bg-danger border-0"
                  style={{ height: "32px", fontSize: "12.5px" }}
                >
                  <Trash2 size={14} />
                  <span>Bulk Delete ({selectedPlanIds.size})</span>
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

          {/* Subtitle / summary info */}
          <div className="d-flex justify-content-between align-items-center mb-2 px-1">
            <div className="small fw-bold text-slate-600 text-uppercase" style={{ letterSpacing: "0.03em", fontSize: "0.72rem" }}>
              SHOWING {filteredActivePlans.length} RESULTS |{" "}
              <span className="text-primary cursor-pointer" onClick={() => setShowWizard(true)}>
                {studentsWithoutPlan} students do not have any tuition plan assigned. Click to Assign.
              </span>
            </div>
            
            {filteredActivePlans.length > 0 && (
              <div className="d-flex align-items-center gap-2 small fw-semibold text-slate-600">
                <span>
                  {((page - 1) * limit) + 1} - {Math.min(page * limit, filteredActivePlans.length)} of {filteredActivePlans.length}
                </span>
                <div className="d-flex gap-1">
                  <Button
                    variant="light"
                    size="sm"
                    className="p-1 border d-flex align-items-center justify-content-center"
                    style={{ width: "24px", height: "24px" }}
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <Button
                    variant="light"
                    size="sm"
                    className="p-1 border d-flex align-items-center justify-content-center"
                    style={{ width: "24px", height: "24px" }}
                    disabled={page * limit >= filteredActivePlans.length}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Active Plans Table */}
          <div className="content-card bg-white border rounded-3 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <Table responsive hover className="workspace-table align-middle m-0" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th style={{ width: "4%", padding: "12px 6px", textAlign: "center" }}>
                    <div className="d-flex align-items-center justify-content-center gap-1">
                      <Form.Check
                        type="checkbox"
                        checked={allCurrentPageSelected}
                        onChange={toggleSelectAllCurrentPage}
                        title={allCurrentPageSelected ? "Deselect page" : "Select page"}
                      />
                      <Dropdown align="start">
                        <Dropdown.Toggle
                          as="button"
                          className="btn btn-link p-0 text-muted border-0 shadow-none"
                          style={{ fontSize: "10px", lineHeight: 1 }}
                        >
                          <ChevronDown size={12} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow-sm border py-1" style={{ fontSize: "12px", minWidth: "180px" }}>
                          <Dropdown.Item onClick={toggleSelectAllCurrentPage}>
                            {allCurrentPageSelected ? "Deselect this page" : `Select this page (${paginatedActivePlans.length})`}
                          </Dropdown.Item>
                          <Dropdown.Item onClick={selectAllFiltered}>
                            Select all {filteredActivePlans.length} plans
                          </Dropdown.Item>
                          {selectedPlanIds.size > 0 && (
                            <>
                              <Dropdown.Divider className="my-1" />
                              <Dropdown.Item onClick={clearSelection} className="text-danger">
                                Clear selection
                              </Dropdown.Item>
                            </>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </th>
                  <th style={{ width: "25%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    NAME
                  </th>
                  <th style={{ width: "23%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    PLAN NAME
                  </th>
                  <th style={{ width: "20%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    PLAN PERIOD
                  </th>
                  <th style={{ width: "13%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    NEXT INVOICE DATE
                  </th>
                  <th style={{ width: "13%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    NEXT DUE DATE
                  </th>
                  <th className="text-end" style={{ width: "10%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    AMOUNT
                  </th>
                  <th style={{ width: "4%", padding: "12px", textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivePlans.map((plan) => {
                  const avatarColor = getAvatarBg(plan.student_name || "A");
                  const isSelected = selectedPlanIds.has(plan.id);

                  return (
                    <tr
                      key={plan.id}
                      className="workspace-row"
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: "0.85rem",
                        backgroundColor: isSelected ? "#f5f3ff" : undefined
                      }}
                    >
                      <td style={{ padding: "12px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <Form.Check
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectPlan(plan.id)}
                        />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="d-flex align-items-center justify-content-center text-white fw-bold rounded-circle flex-shrink-0"
                            style={{
                              width: "30px",
                              height: "30px",
                              backgroundColor: avatarColor,
                              fontSize: "11px"
                            }}
                          >
                            {getInitials(plan.student_name)}
                          </div>
                          <div className="d-flex flex-column">
                            <span
                              className="text-primary fw-bold cursor-pointer"
                              onClick={() => { setEditingPlan(plan); setShowEditModal(true); }}
                            >
                              {plan.student_name}
                            </span>
                            <span className="text-muted small" style={{ fontSize: "0.72rem" }}>
                              {plan.grade_level || "Student"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px", color: "#1f2937" }}>
                        <div className="d-flex align-items-center gap-1">
                          <FileText size={14} className="text-warning flex-shrink-0" />
                          <span className="fw-semibold">{plan.plan_name}</span>
                        </div>
                      </td>
                      <td className="text-slate-600" style={{ padding: "12px" }}>
                        <div>
                          {formatDateSafe(plan.start_date)} -{" "}
                          {plan.end_date ? formatDateSafe(plan.end_date) : "Ongoing"}
                        </div>
                        <div className="d-flex align-items-center gap-1.5 mt-0.5">
                          <span className="text-muted small" style={{ fontSize: "0.72rem" }}>{plan.cycle}</span>
                          <span
                            className={`badge border ${
                              plan.due_day === 15 ? "bg-info-subtle text-info-emphasis" : "bg-primary-subtle text-primary-emphasis"
                            }`}
                            style={{ fontSize: "10px", padding: "1px 5px" }}
                          >
                            {plan.due_day === 15 ? "15th Due" : "1st Due"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          className="text-primary fw-semibold cursor-pointer d-inline-flex align-items-center gap-1"
                          onClick={() => { setEditingPlan(plan); setShowEditModal(true); }}
                          title="Click to edit schedule"
                        >
                          {formatDateSafe(plan.next_invoice_date)}
                          <Edit3 size={11} className="opacity-50" />
                        </span>
                        <div className="text-muted" style={{ fontSize: "10.5px" }}>
                          Generates 5d prior
                        </div>
                      </td>
                      <td className="text-slate-800 fw-semibold" style={{ padding: "12px" }}>
                        {getPlanNextDueDate(plan)}
                      </td>
                      <td className="text-end fw-bold text-slate-800" style={{ padding: "12px" }}>
                        {formatCurrency(plan.total_amount)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Dropdown align="end">
                          <Dropdown.Toggle
                            as="button"
                            className="btn btn-sm btn-link text-muted p-0 border-0"
                            style={{ boxShadow: "none" }}
                          >
                            <MoreHorizontal size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm border-0 py-1" style={{ fontSize: "12.5px" }}>
                            <Dropdown.Item onClick={() => { setEditingPlan(plan); setShowEditModal(true); }}>
                              <Edit3 size={13} className="me-2 text-primary" />
                              Edit Plan Dates & Details
                            </Dropdown.Item>
                            <Dropdown.Divider className="my-1" />
                            <Dropdown.Item
                              className="text-danger"
                              onClick={() => handleDeletePlan(plan)}
                            >
                              <Trash2 size={13} className="me-2" />
                              Delete Plan
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}

                {filteredActivePlans.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted small">
                      No active recurring plans found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </>
      ) : (
        /* Plan Templates Tab */
        <div className="content-card bg-white border rounded-3 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <Table responsive hover className="workspace-table align-middle m-0" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={{ width: "40%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>TEMPLATE NAME</th>
                <th style={{ width: "45%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>CHARGES / DISCOUNT ITEMS</th>
                <th className="text-end" style={{ width: "15%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>ITEMS COUNT</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tmpl) => (
                <tr key={tmpl.id} className="workspace-row" style={{ borderBottom: "1px solid #f1f5f9", fontSize: "0.85rem" }}>
                  <td style={{ padding: "12px" }}>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-primary-light p-1.5 rounded-2 d-inline-flex">
                        <FileText size={16} className="text-primary" />
                      </div>
                      <span className="fw-bold text-slate-800">{tmpl.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-600" style={{ padding: "12px" }}>
                    {tmpl.items_json?.map((item) => (
                      <span key={item.description} className="badge bg-light text-dark border me-1 small" style={{ fontSize: "10px" }}>
                        {item.description} ({formatCurrency(item.amount || item.value)})
                      </span>
                    )) || "No items"}
                  </td>
                  <td className="text-end fw-bold text-slate-600" style={{ padding: "12px" }}>
                    {tmpl.items_json?.length || 0} items
                  </td>
                </tr>
              ))}

              {templates.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted small">
                    No billing plan templates found. Click "Create Recurring Plan" to make a new one.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      <CreatePlanWizard
        show={showWizard}
        handleClose={() => setShowWizard(false)}
        onPlanCreated={handlePlanCreated}
      />

      <ProcareImportWizardModal
        show={showImportModal}
        handleClose={() => setShowImportModal(false)}
        onImportSuccess={fetchData}
      />

      <BulkEditPlansModal
        show={showBulkEditModal}
        onHide={() => setShowBulkEditModal(false)}
        selectedPlans={selectedPlansList}
        onSuccess={() => {
          clearSelection();
          fetchData();
        }}
      />

      <BulkDeletePlansModal
        show={showBulkDeleteModal}
        onHide={() => setShowBulkDeleteModal(false)}
        selectedPlans={selectedPlansList}
        onSuccess={() => {
          clearSelection();
          fetchData();
        }}
      />

      <CleanSlateModal
        show={showCleanSlateModal}
        onHide={() => setShowCleanSlateModal(false)}
        onSuccess={() => {
          clearSelection();
          fetchData();
        }}
      />

      <EditPlanModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditingPlan(null);
        }}
        plan={editingPlan}
        onSuccess={fetchData}
      />
      
      <style>{`
        .workspace-row:hover {
          background-color: #fafbfd !important;
        }
      `}</style>
    </div>
  );
};

export default RecurringPlansPage;
