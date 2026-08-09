import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Spinner, Alert, Button, Form, Overlay, Popover } from "react-bootstrap";
import {
  Search,
  Filter,
  Clock,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { getTransactions } from "../../../services/billingService";
import "../../../styles/AdminModern.css"; // Ensure fonts and base styles

const AccountingDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [metrics, setMetrics] = useState({ total_paid: 0, total_in_process: 0, total_unpaid: 0 });

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 30;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    enrollment_status: "",
    transaction_type: "",
    payment_mode: "",
    payment_status: ""
  });
  
  // Staged filters inside the popover (applied only when clicking "APPLY")
  const [stagedFilters, setStagedFilters] = useState({
    enrollment_status: "",
    transaction_type: "",
    payment_mode: "",
    payment_status: ""
  });

  // Top cards quick filter state
  const [cardFilter, setCardFilter] = useState(null); // 'paid', 'process', 'unpaid'

  // Popover target ref
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterBtnRef = useRef(null);

  // Sorting
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Prepare query parameters
      const params = {
        page,
        limit,
        search: searchTerm,
        sort_field: sortField,
        sort_order: sortOrder
      };

      // If a card filter is active, override standard filters
      if (cardFilter === "paid") {
        params.transaction_type = "payment";
        params.payment_status = "successful";
      } else if (cardFilter === "process") {
        params.transaction_type = "payment";
        params.payment_status = "in process";
      } else if (cardFilter === "unpaid") {
        params.transaction_type = "invoice";
        params.payment_status = "in process"; // Maps to unpaid/sent invoices
      } else {
        // Standard filters
        if (activeFilters.enrollment_status) params.enrollment_status = activeFilters.enrollment_status;
        if (activeFilters.transaction_type) params.transaction_type = activeFilters.transaction_type;
        if (activeFilters.payment_mode) params.payment_mode = activeFilters.payment_mode;
        if (activeFilters.payment_status) params.payment_status = activeFilters.payment_status;
      }

      const data = await getTransactions(params);
      setTransactions(data.transactions || []);
      setTotalResults(data.total_results || 0);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, activeFilters, cardFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle Search Input Change (Debounced search can be added, but direct fetch on Enter/Blur is cleaner, or simple state fetch)
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchTransactions();
    }
  };

  // Quick Filter via Card Clicks
  const handleCardClick = (type) => {
    setPage(1);
    if (cardFilter === type) {
      setCardFilter(null); // Toggle off
    } else {
      setCardFilter(type);
      // Clear standard filters when quick card filters are activated
      setActiveFilters({
        enrollment_status: "",
        transaction_type: "",
        payment_mode: "",
        payment_status: ""
      });
      setStagedFilters({
        enrollment_status: "",
        transaction_type: "",
        payment_mode: "",
        payment_status: ""
      });
    }
  };

  // Apply Popover Filters
  const handleApplyFilters = () => {
    setPage(1);
    setCardFilter(null); // Clear card quick filter
    setActiveFilters(stagedFilters);
    setShowFilterPopover(false);
  };

  // Reset all search/filters
  const handleResetFilters = () => {
    setPage(1);
    setSearchTerm("");
    setCardFilter(null);
    setActiveFilters({
      enrollment_status: "",
      transaction_type: "",
      payment_mode: "",
      payment_status: ""
    });
    setStagedFilters({
      enrollment_status: "",
      transaction_type: "",
      payment_mode: "",
      payment_status: ""
    });
    setShowFilterPopover(false);
  };

  // Sort handler
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortField(field);
    setSortOrder(isAsc ? "desc" : "asc");
    setPage(1);
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    const absVal = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    return `${sign}$${absVal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format short metrics helper (e.g. 1.58M or 11.73K)
  const formatMetricVal = (num) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  // Export to CSV helper
  const handleExport = () => {
    if (transactions.length === 0) return;
    
    // Header
    let csvContent = "data:text/csv;charset=utf-8,Date,Student,Type,Description,Status,Amount\n";
    
    // Rows
    transactions.forEach((tx) => {
      const student = tx.student_name.replace(/"/g, '""');
      const desc = tx.description.replace(/"/g, '""');
      const amt = tx.amount;
      const formattedDate = new Date(tx.date).toLocaleDateString() + " " + new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      csvContent += `"${formattedDate}","${student}","${tx.type}","${desc}","${tx.status}",${amt}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Transactions_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Circular Initials helper
  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "";
  };

  // Helpers to check if filters are active
  const isFilterActive = activeFilters.enrollment_status || activeFilters.transaction_type || activeFilters.payment_mode || activeFilters.payment_status;

  return (
    <div className="all-transactions-page font-prompt" style={{ fontFamily: '"Prompt", sans-serif' }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title fs-4 fw-bold text-slate-800 m-0">All Transactions</h1>
        <Button
          variant="link"
          className="text-primary fw-bold text-decoration-none d-flex align-items-center gap-1 p-0 fs-7"
          onClick={handleExport}
          style={{ letterSpacing: "0.05em" }}
        >
          <Download size={14} /> EXPORT
        </Button>
      </div>

      {/* Top Cards/Banners */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div
            className={`metric-card-styled p-3 text-center cursor-pointer border rounded-3 transition-all ${
              cardFilter === "paid" ? "active-card bg-sky-blue border-primary" : "bg-white"
            }`}
            onClick={() => handleCardClick("paid")}
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              borderColor: cardFilter === "paid" ? "#00b8d4" : "#e2e8f0"
            }}
          >
            <div className="metric-val fs-3 fw-bold text-slate-800">
              {formatMetricVal(metrics.total_paid)}
            </div>
            <div className="metric-label small fw-bold mt-1 text-gold" style={{ color: "#d97706", fontSize: "0.72rem", letterSpacing: "0.05em" }}>
              AMOUNT PAID
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div
            className={`metric-card-styled p-3 text-center cursor-pointer border rounded-3 transition-all ${
              cardFilter === "process" ? "active-card bg-sky-blue border-primary" : "bg-white"
            }`}
            onClick={() => handleCardClick("process")}
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              borderColor: cardFilter === "process" ? "#00b8d4" : "#e2e8f0"
            }}
          >
            <div className="metric-val fs-3 fw-bold text-slate-800">
              {formatMetricVal(metrics.total_in_process)}
            </div>
            <div className="metric-label small fw-bold mt-1 text-gold" style={{ color: "#d97706", fontSize: "0.72rem", letterSpacing: "0.05em" }}>
              AMOUNT IN PROCESS
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div
            className={`metric-card-styled p-3 text-center cursor-pointer border rounded-3 transition-all ${
              cardFilter === "unpaid" ? "active-card bg-sky-blue border-danger" : "bg-white"
            }`}
            onClick={() => handleCardClick("unpaid")}
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              borderColor: cardFilter === "unpaid" ? "#ef4444" : "#e2e8f0"
            }}
          >
            <div className="metric-val fs-3 fw-bold text-danger">
              {formatMetricVal(metrics.total_unpaid)}
            </div>
            <div className="metric-label small fw-bold mt-1 text-gold" style={{ color: "#d97706", fontSize: "0.72rem", letterSpacing: "0.05em" }}>
              AMOUNT UNPAID
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="content-card mb-4 bg-white p-3 border rounded-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          {/* Search Box */}
          <div className="d-flex align-items-center flex-grow-1" style={{ maxWidth: "380px" }}>
            <div className="position-relative w-100">
              <Search className="position-absolute text-muted" size={16} style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <Form.Control
                type="text"
                placeholder="Search Students"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{ paddingLeft: "36px", fontSize: "0.85rem", borderRadius: "6px" }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex align-items-center gap-2 position-relative">
            <Button
              variant="outline-light"
              className={`btn-toolbar-styled d-inline-flex align-items-center justify-content-center p-2 rounded-2 ${
                isFilterActive ? "border-primary text-primary" : "border-slate-300 text-slate-600"
              }`}
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              style={{ background: "#fff", border: "1px solid #cbd5e1" }}
            >
              <Filter size={18} />
            </Button>
            
            {showFilterPopover && (
              <div 
                className="shadow-lg border bg-white p-3 position-absolute" 
                style={{ 
                  right: 0, 
                  top: "45px", 
                  zIndex: 9999, 
                  minWidth: "320px", 
                  borderRadius: "10px",
                  borderColor: "#e2e8f0"
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "-6px",
                  right: "14px",
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#fff",
                  borderLeft: "1px solid #e2e8f0",
                  borderTop: "1px solid #e2e8f0",
                  transform: "rotate(45deg)",
                  zIndex: 1
                }} />
                
                <div style={{ position: "relative", zIndex: 2 }}>
                  <h6 className="fw-bold mb-3 text-slate-800 small text-uppercase text-start" style={{ letterSpacing: "0.03em" }}>Filter Transactions</h6>
                  
                  <Form.Group className="mb-3 text-start">
                    <Form.Label className="small fw-semibold text-slate-600 mb-1" style={{ fontSize: "0.72rem" }}>ENROLLMENT STATUS</Form.Label>
                    <Form.Select
                      value={stagedFilters.enrollment_status}
                      onChange={(e) => setStagedFilters({ ...stagedFilters, enrollment_status: e.target.value })}
                      style={{ fontSize: "0.82rem" }}
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="on hold">On Hold</option>
                      <option value="graduate">Graduate</option>
                      <option value="in active">Inactive</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3 text-start">
                    <Form.Label className="small fw-semibold text-slate-600 mb-1" style={{ fontSize: "0.72rem" }}>TRANSACTION TYPE</Form.Label>
                    <Form.Select
                      value={stagedFilters.transaction_type}
                      onChange={(e) => setStagedFilters({ ...stagedFilters, transaction_type: e.target.value })}
                      style={{ fontSize: "0.82rem" }}
                    >
                      <option value="">All Transaction Types</option>
                      <option value="invoice">Invoice</option>
                      <option value="payment">Payment</option>
                      <option value="credit">Credit</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3 text-start">
                    <Form.Label className="small fw-semibold text-slate-600 mb-1" style={{ fontSize: "0.72rem" }}>PAYMENT MODE</Form.Label>
                    <Form.Select
                      value={stagedFilters.payment_mode}
                      onChange={(e) => setStagedFilters({ ...stagedFilters, payment_mode: e.target.value })}
                      style={{ fontSize: "0.82rem" }}
                    >
                      <option value="">All Payment Modes</option>
                      <option value="cards">Cards</option>
                      <option value="bank / ach transfer">Bank / ACH transfer</option>
                      <option value="oother">Other</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3 text-start">
                    <Form.Label className="small fw-semibold text-slate-600 mb-1" style={{ fontSize: "0.72rem" }}>PAYMENT STATUS</Form.Label>
                    <Form.Select
                      value={stagedFilters.payment_status}
                      onChange={(e) => setStagedFilters({ ...stagedFilters, payment_status: e.target.value })}
                      style={{ fontSize: "0.82rem" }}
                    >
                      <option value="">All Statuses</option>
                      <option value="successful">Successful</option>
                      <option value="in process">In Process</option>
                      <option value="failed">Failed</option>
                    </Form.Select>
                  </Form.Group>

                  <div className="d-flex gap-2 justify-content-end mt-4 pt-2 border-top">
                    <Button variant="link" size="sm" className="text-secondary text-decoration-none" onClick={handleResetFilters}>
                      RESET
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplyFilters}
                      style={{ backgroundColor: "#00b8d4", borderColor: "#00b8d4", borderRadius: "20px", padding: "4px 20px", fontWeight: "600" }}
                    >
                      APPLY
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <Button
              variant="outline-light"
              className="btn-toolbar-styled d-inline-flex align-items-center justify-content-center p-2 rounded-2 border-slate-300 text-slate-600"
              onClick={handleResetFilters}
              style={{ background: "#fff", border: "1px solid #cbd5e1" }}
              title="Reset Filters"
            >
              <Clock size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Pagination Summary Info */}
      <div className="d-flex justify-content-between align-items-center mb-2 px-1">
        <div className="small fw-bold text-slate-600 text-uppercase" style={{ letterSpacing: "0.03em", fontSize: "0.75rem" }}>
          SHOWING {transactions.length} RESULTS
        </div>
        
        {totalResults > 0 && (
          <div className="d-flex align-items-center gap-2 small fw-semibold text-slate-600">
            <span>
              {((page - 1) * limit) + 1} - {Math.min(page * limit, totalResults)} of {totalResults}
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
                disabled={page * limit >= totalResults}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2 small">Loading transactions...</p>
        </div>
      ) : (
        <div className="content-card bg-white border rounded-3 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <Table responsive hover className="workspace-table align-middle m-0" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th onClick={() => handleSort("date")} className="cursor-pointer" style={{ width: "15%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                  DATE {sortField === "date" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ width: "25%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                  STUDENT
                </th>
                <th onClick={() => handleSort("type")} className="cursor-pointer" style={{ width: "15%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                  TYPE {sortField === "type" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ width: "25%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                  DESCRIPTION
                </th>
                <th style={{ width: "10%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                  STATUS
                </th>
                <th onClick={() => handleSort("amount")} className="cursor-pointer text-end" style={{ width: "10%", fontSize: "0.78rem", fontWeight: "600", textTransform: "none", color: "#64748b", padding: "12px" }}>
                  AMOUNT {sortField === "amount" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                // Status Icons & styles mapping
                let statusBadge = null;
                const statusLower = tx.status?.toLowerCase();
                
                if (statusLower === "success" || statusLower === "paid" || statusLower === "success/applied") {
                  statusBadge = (
                    <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                      <CheckCircle2 size={14} className="text-success" /> Success
                    </span>
                  );
                } else if (statusLower === "sent" || statusLower === "applied" || statusLower === "draft") {
                  statusBadge = (
                    <span className="text-primary small fw-semibold d-flex align-items-center gap-1">
                      <CheckCircle2 size={14} className="text-primary" /> Sent
                    </span>
                  );
                } else if (statusLower === "in process") {
                  statusBadge = (
                    <span className="text-warning small fw-semibold d-flex align-items-center gap-1">
                      <AlertCircle size={14} className="text-warning" /> In Process
                    </span>
                  );
                } else { // Failed, Void, Overdue
                  statusBadge = (
                    <span className="text-danger small fw-semibold d-flex align-items-center gap-1">
                      <XCircle size={14} className="text-danger" /> Failed
                    </span>
                  );
                }

                // Row action items list trigger
                return (
                  <tr key={tx.id} className="workspace-row" style={{ borderBottom: "1px solid #f1f5f9", fontSize: "0.85rem" }}>
                    <td className="text-slate-600" style={{ padding: "12px" }}>
                      <div className="fw-semibold">
                        {new Date(tx.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </div>
                      <div className="text-muted small" style={{ fontSize: "0.72rem" }}>
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div className="d-flex align-items-center gap-2">
                        {/* Student Initials Avatar */}
                        <div
                          className="d-flex align-items-center justify-content-center text-white fw-bold rounded-circle"
                          style={{
                            width: "30px",
                            height: "30px",
                            backgroundColor: "#22c55e",
                            fontSize: "11px"
                          }}
                        >
                          {getInitials(tx.student_name)}
                        </div>
                        <div className="d-flex flex-column">
                          <span
                            className="text-primary fw-bold cursor-pointer"
                            onClick={() => navigate(`/admin/accounting/accounts/${tx.student_id}`)}
                          >
                            {tx.student_name}
                          </span>
                          <span className="text-muted small" style={{ fontSize: "0.72rem" }}>
                            Home Room {tx.grade || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-700" style={{ padding: "12px" }}>
                      <div className="fw-semibold">{tx.type}</div>
                      <div className="text-muted small" style={{ fontSize: "0.72rem" }}>
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td className="text-slate-600" style={{ padding: "12px" }}>
                      {tx.description}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {statusBadge}
                    </td>
                    <td className={`text-end fw-bold ${tx.amount < 0 ? "text-slate-800" : "text-slate-900"}`} style={{ padding: "12px" }}>
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted small">
                    No transactions found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
      
      <style>{`
        .metric-card-styled {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .metric-card-styled:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.04);
        }
        .metric-card-styled.active-card {
          background-color: #f0fdfa !important;
        }
        .btn-toolbar-styled:hover {
          border-color: #94a3b8 !important;
          background: #f8fafc !important;
        }
        .workspace-row:hover {
          background-color: #fafbfd !important;
        }
      `}</style>
    </div>
  );
};

export default AccountingDashboard;
