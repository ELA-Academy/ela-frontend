import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  Columns,
  Key,
  X,
  Plus,
  Info,
  CheckCircle2,
  Calendar,
  Building,
  DollarSign
} from "lucide-react";
import { Button, Modal, Form } from "react-bootstrap";
import "../../../styles/GustoTheme.css";

const PayrollPayHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "payrolls"; // "payrolls" | "contractors" | "non-us" | "other"
  const [activeTab, setActiveTab] = useState(initialTab);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Modals
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedPayrollToAdjust, setSelectedPayrollToAdjust] = useState(null);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [statusKeyModalOpen, setStatusKeyModalOpen] = useState(false);

  // New Payment State
  const [newPayDate, setNewPayDate] = useState("2026-10-16");
  const [newPayFunding, setNewPayFunding] = useState("BANK OF AMERICA, N.A. ending in 3042");

  // Sample data matching Image 3: Employee Payrolls (ELA has only 1 full employee)
  const employeePayrolls = [
    {
      id: "pr-1",
      payday: "Oct 2, 2026",
      type: "Regular",
      payPeriod: "Sep 13–Sep 26",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      status: "Complete",
      total: "$1,211.06",
      canAdjust: true
    },
    {
      id: "pr-2",
      payday: "Sep 18, 2026",
      type: "Regular",
      payPeriod: "Aug 30–Sep 12",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      status: "Complete",
      total: "$1,211.06",
      canAdjust: false
    },
    {
      id: "pr-3",
      payday: "Sep 4, 2026",
      type: "Regular",
      payPeriod: "Aug 16–Aug 29",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      status: "Complete",
      total: "$1,211.07",
      canAdjust: false
    },
    {
      id: "pr-4",
      payday: "Aug 21, 2026",
      type: "Regular",
      payPeriod: "Aug 2–Aug 15",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      status: "Complete",
      total: "$1,211.06",
      canAdjust: false
    },
    {
      id: "pr-5",
      payday: "Aug 7, 2026",
      type: "Regular",
      payPeriod: "Jul 19–Aug 1",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      status: "Complete",
      total: "$1,211.06",
      canAdjust: false
    },
    {
      id: "pr-6",
      payday: "Jul 24, 2026",
      type: "Regular",
      payPeriod: "Jul 5–Jul 18",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      status: "Complete",
      total: "$1,211.06",
      canAdjust: false
    },
    {
      id: "pr-7",
      payday: "Jul 10, 2026",
      type: "Regular",
      payPeriod: "Jun 21–Jul 4",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      status: "Complete",
      total: "$1,125.01",
      canAdjust: false
    },
    {
      id: "pr-8",
      payday: "Jun 26, 2026",
      type: "Regular",
      payPeriod: "Jun 7–Jun 20",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      status: "Complete",
      total: "$1,211.06",
      canAdjust: false
    },
    {
      id: "pr-9",
      payday: "Jun 12, 2026",
      type: "Regular",
      payPeriod: "May 24–Jun 6",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      status: "Complete",
      total: "$1,211.06",
      canAdjust: false
    }
  ];

  // Sample data matching Image 4: US Contractors (Everyone else at ELA)
  const contractorPayrolls = [
    {
      id: "cp-oct-2-2026",
      payday: "Oct 2, 2026",
      contractorsSummary: "Jalissa Kuykendall, Vanessa Simms and 68 more",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      total: "$24,745.00",
      canAdjust: true
    },
    {
      id: "cp-sep-18-2026",
      payday: "Sep 18, 2026",
      contractorsSummary: "Vanessa Simms, Araceli Galvis and 67 more",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      total: "$15,066.25",
      canAdjust: true
    },
    {
      id: "cp-sep-4-2026",
      payday: "Sep 4, 2026",
      contractorsSummary: "Jalissa Kuykendall, Vanessa Simms and 63 more",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      total: "$33,451.75",
      canAdjust: true
    },
    {
      id: "cp-aug-21-2026",
      payday: "Aug 21, 2026",
      contractorsSummary: "Jalissa Kuykendall, Vanessa Simms and 44 more",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      total: "$13,772.63",
      canAdjust: true
    },
    {
      id: "cp-aug-7-2026",
      payday: "Aug 7, 2026",
      contractorsSummary: "Jalissa Kuykendall, Vanessa Simms and 47 more",
      funding: "BANK OF AMERICA, N.A. ending in 3042",
      total: "$16,273.58",
      canAdjust: false
    }
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const filteredEmployeePayrolls = employeePayrolls.filter(
    (p) =>
      p.payday.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payPeriod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.total.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContractorPayrolls = contractorPayrolls.filter(
    (p) =>
      p.payday.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contractorsSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.total.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Toast Feedback */}
      {toastMessage && (
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
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner (Image 3 replica) */}
      {!bannerDismissed && (
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "14px",
            padding: "1rem 1.5rem",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1d4ed8",
                fontSize: "1.25rem"
              }}
            >
              🥁
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "0.95rem" }}>
                We've made it easier to track your payments
              </div>
              <div style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "0.15rem" }}>
                Understand how your money is moving with statuses, funding methods, and a new tab for miscellaneous transactions.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px" }}
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tabs Row (Image 3 & 4 replica) */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "1.5rem",
          gap: "2rem"
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange("payrolls")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "payrolls" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "payrolls" ? "#1d4ed8" : "#4b5563",
            fontWeight: activeTab === "payrolls" ? 700 : 500,
            fontSize: "0.95rem",
            padding: "0.5rem 0.25rem 0.85rem",
            cursor: "pointer"
          }}
        >
          Payrolls
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("contractors")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "contractors" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "contractors" ? "#1d4ed8" : "#4b5563",
            fontWeight: activeTab === "contractors" ? 700 : 500,
            fontSize: "0.95rem",
            padding: "0.5rem 0.25rem 0.85rem",
            cursor: "pointer"
          }}
        >
          US contractors
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("non-us")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "non-us" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "non-us" ? "#1d4ed8" : "#4b5563",
            fontWeight: activeTab === "non-us" ? 700 : 500,
            fontSize: "0.95rem",
            padding: "0.5rem 0.25rem 0.85rem",
            cursor: "pointer"
          }}
        >
          Non-US contractors
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("other")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "other" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "other" ? "#1d4ed8" : "#4b5563",
            fontWeight: activeTab === "other" ? 700 : 500,
            fontSize: "0.95rem",
            padding: "0.5rem 0.25rem 0.85rem",
            cursor: "pointer"
          }}
        >
          Other
        </button>
      </div>

      {/* TAB 1: US PAYROLLS (Image 3) */}
      {activeTab === "payrolls" && (
        <div>
          {/* Header & Controls Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem"
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                US payrolls
              </h2>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                Showing official employee payroll records (1 active employee).
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Button
                variant="light"
                size="sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: "0.825rem",
                  fontWeight: 600
                }}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </Button>

              <Button
                variant="light"
                size="sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: "0.825rem",
                  fontWeight: 600
                }}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Columns</span>
              </Button>

              <Button
                variant="light"
                size="sm"
                onClick={() => setStatusKeyModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: "0.825rem",
                  fontWeight: 600
                }}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Status key</span>
              </Button>
            </div>
          </div>

          {/* Table (Image 3 replica) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              overflow: "hidden"
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280", backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Payday ↕</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Type ↕</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Pay period ↕</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Funding</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Total ↕</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployeePayrolls.map((pr) => (
                  <tr key={pr.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.95rem 1rem" }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#1d4ed8",
                          textDecoration: "underline",
                          cursor: "pointer"
                        }}
                      >
                        {pr.payday}
                      </span>
                    </td>
                    <td style={{ padding: "0.95rem 1rem", color: "#374151" }}>
                      {pr.type}
                    </td>
                    <td style={{ padding: "0.95rem 1rem", color: "#374151" }}>
                      {pr.payPeriod}
                    </td>
                    <td style={{ padding: "0.95rem 1rem", color: "#6b7280", fontSize: "0.825rem" }}>
                      {pr.funding}
                    </td>
                    <td style={{ padding: "0.95rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#059669" }} />
                        <span style={{ fontWeight: 600, color: "#111827" }}>{pr.status}</span>
                      </div>
                      {pr.canAdjust && (
                        <div style={{ marginTop: "0.2rem" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayrollToAdjust(pr);
                              setAdjustModalOpen(true);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#2563eb",
                              fontSize: "0.775rem",
                              fontWeight: 600,
                              textDecoration: "underline",
                              cursor: "pointer",
                              padding: 0
                            }}
                          >
                            Adjust payroll
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.95rem 1rem", textAlign: "right", fontWeight: 600, color: "#111827" }}>
                      {pr.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: US CONTRACTORS (Image 4) */}
      {activeTab === "contractors" && (
        <div>
          {/* Header & Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem"
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: 0 }}>
              US contractors
            </h2>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddPaymentModalOpen(true)}
              style={{
                backgroundColor: "#2563eb",
                borderColor: "#2563eb",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "0.45rem 1rem"
              }}
            >
              Add payment
            </Button>
          </div>

          {/* Search Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.25rem"
            }}
          >
            <div style={{ position: "relative", flex: 1, maxWidth: "380px" }}>
              <Search className="w-4 h-4 text-slate-400" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search payments"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2.25rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.875rem",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Button
                variant="light"
                size="sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: "0.825rem",
                  fontWeight: 600
                }}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </Button>

              <Button
                variant="light"
                size="sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: "0.825rem",
                  fontWeight: 600
                }}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Columns</span>
              </Button>
            </div>
          </div>

          {/* Table (Image 4 replica) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              overflow: "hidden"
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280", backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Payday ↕</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Contractors</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Funding</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Total ↕</th>
                </tr>
              </thead>
              <tbody>
                {filteredContractorPayrolls.map((cp) => (
                  <tr
                    key={cp.id}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                    onClick={() => navigate(`/admin/payroll/pay/contractors/${cp.id}`)}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#1d4ed8",
                            textDecoration: "underline"
                          }}
                        >
                          {cp.payday}
                        </span>
                      </div>
                      {cp.canAdjust && (
                        <div style={{ marginTop: "0.35rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              border: "1px solid #d1d5db",
                              borderRadius: "14px",
                              padding: "0.15rem 0.6rem",
                              fontSize: "0.725rem",
                              color: "#4b5563",
                              backgroundColor: "#f9fafb"
                            }}
                          >
                            This payment can still be adjusted
                          </span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "1rem", color: "#374151" }}>
                      {cp.contractorsSummary}
                    </td>

                    <td style={{ padding: "1rem", color: "#6b7280", fontSize: "0.825rem" }}>
                      {cp.funding}
                    </td>

                    <td style={{ padding: "1rem", textAlign: "right", fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>
                      {cp.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: NON-US CONTRACTORS */}
      {activeTab === "non-us" && (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>No international contractors paid yet</h3>
          <p style={{ color: "#64748b", fontSize: "0.875rem", maxWidth: "420px", margin: "0.5rem auto 1.5rem" }}>
            When you process payroll for international contractors, their currency conversions, bank confirmations, and receipts will appear here.
          </p>
        </div>
      )}

      {/* TAB 4: OTHER */}
      {activeTab === "other" && (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
          <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>No other adjustments recorded</h3>
          <p style={{ color: "#64748b", fontSize: "0.875rem", maxWidth: "420px", margin: "0.5rem auto 1.5rem" }}>
            Miscellaneous payments, bonus reconciliations, and tax adjustments will be logged in this ledger.
          </p>
        </div>
      )}

      {/* ADJUST PAYROLL MODAL */}
      <Modal show={adjustModalOpen} onHide={() => setAdjustModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Adjust Payroll — {selectedPayrollToAdjust?.payday}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ fontSize: "0.875rem" }}>
          <p className="text-slate-600 mb-3">
            You can modify the payment amount or funding source for this period ({selectedPayrollToAdjust?.payPeriod}).
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Total Amount</Form.Label>
            <Form.Control type="text" defaultValue={selectedPayrollToAdjust?.total} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Adjustment Reason</Form.Label>
            <Form.Select>
              <option>Overtime correction</option>
              <option>Reimbursement adjustment</option>
              <option>Tax withholding revision</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setAdjustModalOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setAdjustModalOpen(false);
              setToastMessage(`Payroll for ${selectedPayrollToAdjust?.payday} adjusted successfully.`);
              setTimeout(() => setToastMessage(""), 4500);
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          >
            Save Adjustment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ADD PAYMENT MODAL */}
      <Modal show={addPaymentModalOpen} onHide={() => setAddPaymentModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Add Contractor Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ fontSize: "0.875rem" }}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Payment Date</Form.Label>
            <Form.Control
              type="date"
              value={newPayDate}
              onChange={(e) => setNewPayDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Funding Account</Form.Label>
            <Form.Select
              value={newPayFunding}
              onChange={(e) => setNewPayFunding(e.target.value)}
            >
              <option>BANK OF AMERICA, N.A. ending in 3042</option>
              <option>STRIPE TREASURY ending in 8891</option>
            </Form.Select>
          </Form.Group>
          <p className="text-xs text-slate-500 mb-0">
            Once created, contractors can be selected and calculated on the summary breakdown view.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setAddPaymentModalOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setAddPaymentModalOpen(false);
              setToastMessage("Contractor payment batch initiated.");
              setTimeout(() => setToastMessage(""), 4500);
              navigate("/admin/payroll/pay/contractors/cp-oct-2-2026");
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          >
            Continue to Summary
          </Button>
        </Modal.Footer>
      </Modal>

      {/* STATUS KEY MODAL */}
      <Modal show={statusKeyModalOpen} onHide={() => setStatusKeyModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Payroll Status Key
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-sm">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#059669" }} />
            <strong className="text-slate-800">Complete:</strong>
            <span className="text-slate-600">Funds transferred and direct deposits cleared.</span>
          </div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2563eb" }} />
            <strong className="text-slate-800">Processing:</strong>
            <span className="text-slate-600">Dispatched to bank, pending settlement.</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#d97706" }} />
            <strong className="text-slate-800">Adjusted:</strong>
            <span className="text-slate-600">Corrections or reversals applied after creation.</span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setStatusKeyModalOpen(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PayrollPayHistoryPage;
