import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Spinner, Alert, Button, Form, Nav } from "react-bootstrap";
import {
  Search,
  Filter,
  FileText,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";
import AccountingNav from "../../../components/admin/billing/AccountingNav";
import CreatePlanWizard from "../../../components/admin/billing/CreatePlanWizard";
import { getSubscriptions, getBillingPlans } from "../../../services/billingService";
import { getAllStudents } from "../../../services/studentService";
import "../../../styles/AdminModern.css";

const RecurringPlansPage = () => {
  const [activePlans, setActivePlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState("active-plans");

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 30;

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
    return activePlans.filter((plan) =>
      plan.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activePlans, searchTerm]);

  // Paginated active plans
  const paginatedActivePlans = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredActivePlans.slice(start, start + limit);
  }, [filteredActivePlans, page]);

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
      <div className="text-center p-5 font-prompt">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2 small">Loading recurring plans...</p>
      </div>
    );
  if (error) return <Alert variant="danger" className="font-prompt">{error}</Alert>;

  return (
    <div className="recurring-plans-page font-prompt" style={{ fontFamily: '"Prompt", sans-serif' }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1 className="page-title fs-4 fw-bold text-slate-800 m-0">Recurring Plans</h1>
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
          <div className="content-card mb-3 bg-white p-3 border rounded-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center flex-grow-1" style={{ maxWidth: "380px" }}>
                <div className="position-relative w-100">
                  <Search className="position-absolute text-muted" size={16} style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <Form.Control
                    type="text"
                    placeholder="Search Students"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    style={{ paddingLeft: "36px", fontSize: "0.85rem", borderRadius: "6px" }}
                  />
                </div>
              </div>
              <Button
                variant="outline-light"
                className="d-inline-flex align-items-center justify-content-center p-2 rounded-2 border-slate-300 text-slate-600"
                style={{ background: "#fff", border: "1px solid #cbd5e1" }}
              >
                <Filter size={18} />
              </Button>
            </div>
          </div>

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
                  <th style={{ width: "3%", padding: "12px", textAlign: "center" }}>
                    <Form.Check type="checkbox" />
                  </th>
                  <th style={{ width: "25%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    NAME
                  </th>
                  <th style={{ width: "25%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    PLAN NAME
                  </th>
                  <th style={{ width: "20%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    PLAN PERIOD
                  </th>
                  <th style={{ width: "12%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    NEXT INVOICE DATE
                  </th>
                  <th style={{ width: "12%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    NEXT DUE DATE
                  </th>
                  <th className="text-end" style={{ width: "10%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                    AMOUNT
                  </th>
                  <th style={{ width: "3%", padding: "12px" }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivePlans.map((plan) => {
                  const avatarColor = getAvatarBg(plan.student_name || "A");
                  const nextDueDate = new Date(new Date(plan.next_invoice_date).getTime() + 14 * 24 * 60 * 60 * 1000); // Default to +14 days due
                  
                  return (
                    <tr key={plan.id} className="workspace-row" style={{ borderBottom: "1px solid #f1f5f9", fontSize: "0.85rem" }}>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Form.Check type="checkbox" />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="d-flex align-items-center justify-content-center text-white fw-bold rounded-circle"
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
                            <span className="text-primary fw-bold cursor-pointer">
                              {plan.student_name}
                            </span>
                            <span className="text-muted small" style={{ fontSize: "0.72rem" }}>
                              Home Room 1st
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px", color: "#1f2937" }}>
                        <div className="d-flex align-items-center gap-1">
                          <FileText size={14} className="text-warning" />
                          <span className="fw-semibold">{plan.plan_name}</span>
                        </div>
                      </td>
                      <td className="text-slate-600" style={{ padding: "12px" }}>
                        <div>
                          {new Date(plan.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} -{" "}
                          {plan.end_date
                            ? new Date(plan.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "Ongoing"}
                        </div>
                        <div className="text-muted small" style={{ fontSize: "0.72rem" }}>{plan.cycle}</div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="text-primary fw-semibold cursor-pointer">
                          {new Date(plan.next_invoice_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </td>
                      <td className="text-slate-700" style={{ padding: "12px" }}>
                        {nextDueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="text-end fw-bold text-slate-800" style={{ padding: "12px" }}>
                        {formatCurrency(plan.total_amount)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <MoreHorizontal size={16} className="text-muted cursor-pointer" />
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
      
      <style>{`
        .workspace-row:hover {
          background-color: #fafbfd !important;
        }
      `}</style>
    </div>
  );
};

export default RecurringPlansPage;
