import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Globe,
  Users,
  CheckCircle2,
  History,
  DollarSign,
  AlertTriangle,
  Filter
} from "lucide-react";
import { Modal, Button, Form, Table, Spinner } from "react-bootstrap";
import { previewPayrollRun, submitPayrollRun } from "../../../services/payrollService";

const PayrollPayPage = () => {
  const navigate = useNavigate();

  const today = new Date();
  const twoWeeksAgo = new Date(today.getTime() - 13 * 86400000);

  const [payPeriodStart, setPayPeriodStart] = useState(twoWeeksAgo.toISOString().slice(0, 10));
  const [payPeriodEnd, setPayPeriodEnd] = useState(today.toISOString().slice(0, 10));
  const [payDate, setPayDate] = useState(today.toISOString().slice(0, 10));
  const [workerGroup, setWorkerGroup] = useState("all"); // "all" | "us_contractor" | "non_us_contractor" | "employee"
  const [methodFilter, setMethodFilter] = useState("all"); // "all" | "Direct deposit" | "Check"
  const [rows, setRows] = useState([]);
  const [paidFrom, setPaidFrom] = useState("Cooper Galvis Checking •••• 4821");
  const [loading, setLoading] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const loadPreview = async (group = workerGroup) => {
    setLoading(true);
    try {
      const res = await previewPayrollRun({
        start_date: payPeriodStart,
        end_date: payPeriodEnd,
        worker_group: group,
        include_drafts: "true"
      });
      setRows(res.rows || []);
      if (res.paid_from) setPaidFrom(res.paid_from);
    } catch (err) {
      console.error("Failed to preview payroll:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview(workerGroup);
  }, [payPeriodStart, payPeriodEnd, workerGroup]);

  const updateRow = (staffId, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.staff_id === staffId ? { ...r, [field]: value } : r))
    );
  };

  const visibleRows = rows.filter((r) =>
    methodFilter === "all" ? true : (r.payment_method || "").toLowerCase() === methodFilter.toLowerCase()
  );

  const selectedRows = rows.filter((r) => r.selected);
  const totalAmount = selectedRows.reduce(
    (sum, r) =>
      sum +
      Number(r.hours_worked || 0) * Number(r.hourly_rate || 0) +
      Number(r.bonus || 0) +
      Number(r.reimbursement || 0),
    0
  );

  const handleSubmitPayroll = async () => {
    if (selectedRows.length === 0) return;
    setSubmitting(true);
    try {
      await submitPayrollRun({
        run_type: workerGroup,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        pay_date: payDate,
        paid_from: paidFrom,
        items: selectedRows
      });
      setRunModalOpen(false);
      showToast(`Payroll submitted for ${selectedRows.length} team member(s) ($${totalAmount.toFixed(2)}).`);
      loadPreview(workerGroup);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit payroll.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "4rem" }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>Pay</h1>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0.2rem 0 0" }}>
            Process US direct deposits, international Remitly/Check payouts (no minimum), reimbursements, and sequential invoices.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="outline-secondary" onClick={() => navigate("/admin/payroll/pay/history")}>
            <History className="w-4 h-4 me-1 inline" /> Pay History
          </Button>
          <Button
            onClick={() => setRunModalOpen(true)}
            style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}
          >
            <Send className="w-4 h-4 me-1 inline" /> Run Payroll
          </Button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          { id: "us_contractor", title: "Pay US Contractors", desc: "Direct deposit via Stripe/ACH for US-based contractors.", icon: Users },
          { id: "non_us_contractor", title: "Pay Non-US Contractors", desc: "International Check / Remitly / Brebe payouts — any amount, no $1,000 minimum.", icon: Globe },
          { id: "employee", title: "Run Employee Payroll", desc: "W-2 employee wages, bonuses, and reimbursements.", icon: DollarSign }
        ].map((card) => {
          const Icon = card.icon;
          const active = workerGroup === card.id;
          return (
            <div
              key={card.id}
              onClick={() => {
                setWorkerGroup(card.id);
                setRunModalOpen(true);
              }}
              style={{
                backgroundColor: active ? "#f0fdfa" : "#ffffff",
                border: active ? "1.5px solid #0f766e" : "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "1.25rem",
                cursor: "pointer"
              }}
            >
              <Icon className="w-6 h-6 text-teal-700 mb-2" />
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>{card.title}</div>
              <div style={{ fontSize: "0.84rem", color: "#4b5563", marginTop: "0.3rem" }}>{card.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Live Pay Period Preview Table */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Workers" },
              { id: "us_contractor", label: "US Contractors" },
              { id: "non_us_contractor", label: "Non-US Contractors" },
              { id: "employee", label: "Employees" }
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setWorkerGroup(g.id)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "6px",
                  border: workerGroup === g.id ? "1px solid #0f766e" : "1px solid #d1d5db",
                  backgroundColor: workerGroup === g.id ? "#f0fdfa" : "#ffffff",
                  color: workerGroup === g.id ? "#0f766e" : "#374151",
                  fontWeight: 600,
                  fontSize: "0.83rem",
                  cursor: "pointer"
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <Filter className="w-4 h-4 text-gray-500" />
            <Form.Select
              size="sm"
              style={{ width: "170px" }}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">All Payment Methods</option>
              <option value="Direct deposit">Direct deposit only</option>
              <option value="Check">Check only (Remitly)</option>
            </Form.Select>
            <input type="date" value={payPeriodStart} onChange={(e) => setPayPeriodStart(e.target.value)} style={{ padding: "0.35rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.83rem" }} />
            <span style={{ fontSize: "0.83rem" }}>to</span>
            <input type="date" value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)} style={{ padding: "0.35rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.83rem" }} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}><Spinner animation="border" size="sm" /> Loading payroll preview...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table hover responsive size="sm" style={{ fontSize: "0.85rem", marginBottom: 0 }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th>Pay</th>
                  <th>Team Member</th>
                  <th>Method</th>
                  <th>Invoice #</th>
                  <th>Rate</th>
                  <th>Hours</th>
                  <th>Bonus ($)</th>
                  <th>Reimb. ($)</th>
                  <th>Memo</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-4 text-muted">No team members match this filter.</td></tr>
                ) : (
                  visibleRows.map((r) => {
                    const rowTotal =
                      Number(r.hours_worked || 0) * Number(r.hourly_rate || 0) +
                      Number(r.bonus || 0) +
                      Number(r.reimbursement || 0);
                    return (
                      <tr key={r.staff_id}>
                        <td>
                          <Form.Check
                            checked={r.selected}
                            onChange={(e) => updateRow(r.staff_id, "selected", e.target.checked)}
                          />
                        </td>
                        <td>
                          <div className="fw-semibold">{r.staff_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{r.country}</div>
                          {r.is_dismissed_with_unpaid_hours && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", backgroundColor: "#fef3c7", color: "#92400e", padding: "0.1rem 0.45rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700 }}>
                              <AlertTriangle className="w-3 h-3" /> Dismissed • Unpaid Hours
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ backgroundColor: r.payment_method === "Check" ? "#fef3c7" : "#dbeafe", color: r.payment_method === "Check" ? "#92400e" : "#1e40af", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 }}>
                            {r.payment_method}
                          </span>
                        </td>
                        <td style={{ width: "85px" }}>
                          <Form.Control size="sm" value={r.invoice_number} onChange={(e) => updateRow(r.staff_id, "invoice_number", e.target.value)} />
                        </td>
                        <td>${Number(r.hourly_rate).toFixed(2)}</td>
                        <td style={{ width: "80px" }}>
                          <Form.Control size="sm" type="number" step="0.5" value={r.hours_worked} onChange={(e) => updateRow(r.staff_id, "hours_worked", e.target.value)} />
                        </td>
                        <td style={{ width: "85px" }}>
                          <Form.Control size="sm" type="number" step="1" value={r.bonus} onChange={(e) => updateRow(r.staff_id, "bonus", e.target.value)} />
                        </td>
                        <td style={{ width: "90px" }}>
                          <Form.Control size="sm" type="number" step="0.01" value={r.reimbursement} onChange={(e) => updateRow(r.staff_id, "reimbursement", e.target.value)} />
                        </td>
                        <td style={{ minWidth: "160px" }}>
                          <Form.Control size="sm" placeholder="e.g. Training / rate adj." value={r.memo} onChange={(e) => updateRow(r.staff_id, "memo", e.target.value)} />
                        </td>
                        <td className="text-end fw-bold">${rowTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>
            Paid from: <strong>{paidFrom}</strong> • Selected: <strong>{selectedRows.length}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
              Total: ${totalAmount.toFixed(2)}
            </div>
            <Button
              disabled={selectedRows.length === 0}
              onClick={() => setRunModalOpen(true)}
              style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}
            >
              Review &amp; Submit Payroll
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Payroll Modal */}
      <Modal show={runModalOpen} onHide={() => setRunModalOpen(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Payroll Submission</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Pay Date (e.g. Friday)</Form.Label>
            <Form.Control type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Paid From Account</Form.Label>
            <Form.Control value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} />
          </Form.Group>
          <div style={{ backgroundColor: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: "8px", padding: "1rem" }}>
            <div style={{ fontSize: "0.875rem", color: "#0f766e" }}>
              <strong>{selectedRows.length}</strong> team member(s) will be paid a total of <strong>${totalAmount.toFixed(2)}</strong>.
            </div>
            <div style={{ fontSize: "0.8rem", color: "#4b5563", marginTop: "0.35rem" }}>
              Matching timesheets will be marked as Paid and locked permanently.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setRunModalOpen(false)}>Cancel</Button>
          <Button disabled={submitting || selectedRows.length === 0} onClick={handleSubmitPayroll} style={{ backgroundColor: "#0f766e", border: "none" }}>
            {submitting ? "Submitting..." : "Submit Payroll"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PayrollPayPage;
