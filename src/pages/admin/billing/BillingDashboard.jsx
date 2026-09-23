import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Table, Alert, Card } from "react-bootstrap";
import { Search, RotateCcw, DollarSign, AlertCircle, CheckCircle, ArrowRight, User } from "lucide-react";
import AccountingNav from "../../../components/admin/billing/AccountingNav";
import { CardSkeleton, TableSkeleton } from "../../../components/Skeleton";
import { getBillingAccounts } from "../../../services/billingService";

const BillingDashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all"); // 'all', 'due', 'paid', 'credit'
  const [gradeFilter, setGradeFilter] = useState("all");

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const data = await getBillingAccounts();
        setAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load billing accounts.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0.00";
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  // Grade level options
  const gradeOptions = useMemo(() => {
    const grades = new Set();
    accounts.forEach((acc) => {
      if (acc.grade_level) grades.add(acc.grade_level);
    });
    return Array.from(grades).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [accounts]);

  // Overall totals
  const metrics = useMemo(() => {
    let totalDueAmount = 0;
    let accountsWithDue = 0;
    let accountsPaidInFull = 0;
    let accountsInCredit = 0;

    accounts.forEach((acc) => {
      const bal = Number(acc.open_balance) || 0;
      if (bal > 0.001) {
        totalDueAmount += bal;
        accountsWithDue += 1;
      } else if (bal < -0.001) {
        accountsInCredit += 1;
      } else {
        accountsPaidInFull += 1;
      }
    });

    return { totalDueAmount, accountsWithDue, accountsPaidInFull, accountsInCredit };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const name = (acc.student_name || "").toLowerCase();
      const matchesSearch = !searchTerm.trim() || name.includes(searchTerm.toLowerCase());

      // Grade level filter
      let matchesGrade = true;
      if (gradeFilter !== "all") {
        matchesGrade = acc.grade_level === gradeFilter;
      }

      // Balance status filter
      let matchesBalance = true;
      const bal = Number(acc.open_balance) || 0;
      if (balanceFilter === "due") {
        matchesBalance = bal > 0.001;
      } else if (balanceFilter === "paid") {
        matchesBalance = Math.abs(bal) <= 0.001;
      } else if (balanceFilter === "credit") {
        matchesBalance = bal < -0.001;
      }

      return matchesSearch && matchesGrade && matchesBalance;
    });
  }, [accounts, searchTerm, gradeFilter, balanceFilter]);

  const hasActiveFilters = searchTerm !== "" || gradeFilter !== "all" || balanceFilter !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setGradeFilter("all");
    setBalanceFilter("all");
  };

  const renderBalanceBadge = (openBalance) => {
    const bal = Number(openBalance) || 0;
    if (bal > 0.001) {
      return (
        <span
          className="badge px-2 py-1 text-uppercase fw-semibold"
          style={{
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            fontSize: "0.75rem",
          }}
        >
          Balance Due
        </span>
      );
    }
    if (bal < -0.001) {
      return (
        <span
          className="badge px-2 py-1 text-uppercase fw-semibold"
          style={{
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid #bfdbfe",
            fontSize: "0.75rem",
          }}
        >
          Credit
        </span>
      );
    }
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
        Paid in Full
      </span>
    );
  };

  if (loading)
    return (
      <div>
        <h1 className="page-title">Accounting</h1>
        <AccountingNav />
        <CardSkeleton count={3} />
        <TableSkeleton rows={6} cols={6} />
      </div>
    );

  if (error)
    return (
      <div>
        <h1 className="page-title">Accounting</h1>
        <AccountingNav />
        <Alert variant="danger">{error}</Alert>
      </div>
    );

  return (
    <div>
      <h1 className="page-title">Accounting</h1>
      <AccountingNav />

      {/* Metric Highlights */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div
            className="card shadow-sm border p-3"
            style={{
              backgroundColor: "#fff",
              borderColor: "#cbd5e1",
              borderLeft: "4px solid #ef4444",
            }}
          >
            <div className="small text-uppercase text-muted fw-bold" style={{ fontSize: "11px" }}>
              Total Outstanding Balance
            </div>
            <div className="h4 fw-bold mb-0 text-danger mt-1">
              {formatCurrency(metrics.totalDueAmount)}
            </div>
            <div className="text-muted small mt-1">
              {metrics.accountsWithDue} student{metrics.accountsWithDue !== 1 ? "s" : ""} with balance due
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div
            className="card shadow-sm border p-3"
            style={{
              backgroundColor: "#fff",
              borderColor: "#cbd5e1",
              borderLeft: "4px solid #10b981",
            }}
          >
            <div className="small text-uppercase text-muted fw-bold" style={{ fontSize: "11px" }}>
              Paid in Full Accounts
            </div>
            <div className="h4 fw-bold mb-0 text-success mt-1">
              {metrics.accountsPaidInFull}
            </div>
            <div className="text-muted small mt-1">Zero balance due</div>
          </div>
        </div>

        <div className="col-md-4">
          <div
            className="card shadow-sm border p-3"
            style={{
              backgroundColor: "#fff",
              borderColor: "#cbd5e1",
              borderLeft: "4px solid #3b82f6",
            }}
          >
            <div className="small text-uppercase text-muted fw-bold" style={{ fontSize: "11px" }}>
              Total Student Accounts
            </div>
            <div className="h4 fw-bold mb-0 text-slate-800 mt-1">
              {accounts.length}
            </div>
            <div className="text-muted small mt-1">
              {metrics.accountsInCredit} account{metrics.accountsInCredit !== 1 ? "s" : ""} in credit
            </div>
          </div>
        </div>
      </div>

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
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control border-start-0 bg-white"
                  style={{ fontSize: "0.85rem", borderColor: "#cbd5e1" }}
                />
              </div>
            </div>

            {/* Balance Status Filter */}
            <div className="col-md-3">
              <label
                className="form-label small fw-bold text-slate-700 text-uppercase mb-1"
                style={{ fontSize: "11px", letterSpacing: "0.04em" }}
              >
                Balance Status
              </label>
              <select
                className="form-select bg-white"
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value)}
                style={{ fontSize: "0.85rem", borderColor: "#cbd5e1" }}
              >
                <option value="all">All Accounts ({accounts.length})</option>
                <option value="due">Balance Due ({metrics.accountsWithDue})</option>
                <option value="paid">Paid in Full ({metrics.accountsPaidInFull})</option>
                <option value="credit">In Credit ({metrics.accountsInCredit})</option>
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
              Showing <strong className="text-dark">{filteredAccounts.length}</strong> of{" "}
              <strong>{accounts.length}</strong> student ledgers
            </div>
            {hasActiveFilters && (
              <span className="badge bg-secondary-subtle text-secondary border">
                Active filters applied
              </span>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Accounts Table */}
      <div className="content-card shadow-sm border" style={{ borderColor: "#cbd5e1" }}>
        <Table responsive className="modern-table mb-0 align-middle">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th style={{ color: "#334155", fontWeight: "600" }}>Student Name</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Grade</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Last Invoice</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Last Payment</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Status</th>
              <th style={{ color: "#334155", fontWeight: "600" }}>Open Balance</th>
              <th style={{ color: "#334155", fontWeight: "600" }} className="text-end">Ledger</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((acc) => {
                const bal = Number(acc.open_balance) || 0;
                return (
                  <tr key={acc.student_id}>
                    <td>
                      <Link
                        to={`/admin/accounting/accounts/${acc.student_id}`}
                        className="fw-bold text-decoration-none text-primary d-inline-flex align-items-center gap-2"
                      >
                        <User size={15} className="text-muted" />
                        <span>{acc.student_name}</span>
                      </Link>
                    </td>
                    <td>
                      <span className="text-slate-600 small">{acc.grade_level || "—"}</span>
                    </td>
                    <td>
                      {acc.last_invoice_date ? (
                        <div>
                          <div className="fw-semibold text-slate-800">
                            {formatCurrency(acc.last_invoice_amount)}
                          </div>
                          <div className="text-muted small" style={{ fontSize: "11px" }}>
                            {new Date(acc.last_invoice_date).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted small">No invoices</span>
                      )}
                    </td>
                    <td>
                      {acc.last_payment_date ? (
                        <div>
                          <div className="fw-semibold text-slate-800">
                            {formatCurrency(acc.last_payment_amount)}
                          </div>
                          <div className="text-muted small" style={{ fontSize: "11px" }}>
                            {new Date(acc.last_payment_date).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted small">No payments</span>
                      )}
                    </td>
                    <td>{renderBalanceBadge(acc.open_balance)}</td>
                    <td>
                      <span
                        className={`fw-bold ${
                          bal > 0.001
                            ? "text-danger"
                            : bal < -0.001
                            ? "text-primary"
                            : "text-success"
                        }`}
                        style={{ fontSize: "0.95rem" }}
                      >
                        {formatCurrency(acc.open_balance)}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/admin/accounting/accounts/${acc.student_id}`}
                        className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                        style={{ fontSize: "0.8rem" }}
                      >
                        <span>View</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  <div className="py-3">
                    <DollarSign size={36} className="text-muted mb-2 opacity-50" />
                    <p className="mb-2 fw-medium">No student ledgers match your filter criteria.</p>
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

export default BillingDashboard;
