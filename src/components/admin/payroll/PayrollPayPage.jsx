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
  Filter,
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Gift,
  Hammer
} from "lucide-react";
import { Modal, Button, Form, Table, Spinner } from "react-bootstrap";
import { previewPayrollRun, submitPayrollRun } from "../../../services/payrollService";

const fmtMoney = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PayrollPayPage = () => {
  const navigate = useNavigate();

  const today = new Date();
  const twoWeeksAgo = new Date(today.getTime() - 13 * 86400000);
  const nextFriday = new Date(today.getTime() + ((5 - today.getDay() + 7) % 7 || 7) * 86400000);

  const [view, setView] = useState("home"); // "home" | "employee_step1" | "employee_step2" | "employee_done" | "contractor"
  const [payPeriodStart, setPayPeriodStart] = useState(twoWeeksAgo.toISOString().slice(0, 10));
  const [payPeriodEnd, setPayPeriodEnd] = useState(today.toISOString().slice(0, 10));
  const [payDate, setPayDate] = useState(nextFriday.toISOString().slice(0, 10));
  const [workerGroup, setWorkerGroup] = useState("us_contractor");
  const [methodFilter, setMethodFilter] = useState("all");
  const [contractorSearch, setContractorSearch] = useState("");
  const [bulkInvoice, setBulkInvoice] = useState("072");
  const [rows, setRows] = useState([]);
  const [paidFrom, setPaidFrom] = useState("Checking XXXX3042");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastRunResult, setLastRunResult] = useState(null);
  const [skipNotice, setSkipNotice] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Step 2 collapsible sections
  const [openTaxSection, setOpenTaxSection] = useState(false);
  const [openTakeHomeSection, setOpenTakeHomeSection] = useState(false);
  const [openCompanySection, setOpenCompanySection] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const loadPreview = async (group) => {
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

  const openEmployeePayroll = () => {
    setWorkerGroup("employee");
    setView("employee_step1");
    loadPreview("employee");
  };

  const openContractorPayroll = (group = "us_contractor") => {
    setWorkerGroup(group);
    setMethodFilter("all");
    setView("contractor");
    loadPreview(group);
  };

  const updateRow = (staffId, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.staff_id === staffId ? { ...r, [field]: value } : r))
    );
  };

  // Calculations
  const selectedRows = rows.filter((r) => r.selected);

  const empTotals = selectedRows.reduce(
    (acc, r) => {
      const regular = Number(r.hours_worked || 0) * Number(r.hourly_rate || 0);
      const bonus = Number(r.bonus || 0);
      const reimb = Number(r.reimbursement || 0);
      const gross = regular + bonus;
      const empTax = Number((gross * 0.13396).toFixed(2));
      const compTax = Number((gross * 0.0765).toFixed(2));
      const net = gross - empTax + reimb;
      acc.hours += Number(r.hours_worked || 0);
      acc.gross += gross;
      acc.reimb += reimb;
      acc.empTax += empTax;
      acc.compTax += compTax;
      acc.net += net;
      acc.totalDebit += gross + reimb + compTax;
      return acc;
    },
    { hours: 0, gross: 0, reimb: 0, empTax: 0, compTax: 0, net: 0, totalDebit: 0 }
  );

  const contractorTotal = selectedRows.reduce(
    (sum, r) =>
      sum +
      Number(r.hours_worked || 0) * Number(r.hourly_rate || 0) +
      Number(r.bonus || 0) +
      Number(r.reimbursement || 0),
    0
  );

  const handleSubmitPayroll = async (runType) => {
    if (selectedRows.length === 0) return;
    setSubmitting(true);
    try {
      const res = await submitPayrollRun({
        run_type: runType,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        pay_date: payDate,
        paid_from: paidFrom,
        items: selectedRows
      });
      setLastRunResult(res);
      if (runType === "employee") {
        setView("employee_done");
      } else {
        showToast(`Contractor payroll submitted (${selectedRows.length} paid, ${fmtMoney(contractorTotal)}).`);
        setView("home");
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit payroll.");
    } finally {
      setSubmitting(false);
    }
  };

  // Withdrawal date = 1 day before payDate
  const withdrawalDate = (() => {
    const d = new Date(`${payDate}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  // =========================================================================
  // VIEW 1: PAY LANDING PAGE (Matches Image 1)
  // =========================================================================
  if (view === "home") {
    return (
      <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "4rem" }}>
        {toastMessage && (
          <div style={{ position: "fixed", bottom: "24px", right: "24px", backgroundColor: "#1e3a8a", color: "#fff", padding: "0.85rem 1.25rem", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: "0.6rem", zIndex: 9999, fontSize: "0.875rem", fontWeight: 600 }}>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>Pay</h1>
          <Button variant="outline-secondary" onClick={() => navigate("/admin/payroll/pay/history")}>
            <History className="w-4 h-4 me-1 inline" /> View pay history
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>
          {/* Left: Up next & Upcoming */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Up next</h2>
              <span style={{ fontSize: "0.85rem", color: "#0f766e", fontWeight: 600 }}>
                <Calendar className="w-4 h-4 inline me-1" /> Bi-weekly Friday schedule
              </span>
            </div>

            {!skipNotice ? (
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.35rem", marginBottom: "1.75rem" }}>
                <span style={{ display: "inline-block", backgroundColor: "#fef3c7", color: "#92400e", padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.65rem" }}>
                  Employee Payroll • Taxes Auto-Calculated
                </span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                  Every other Friday payroll
                </div>
                <div style={{ fontSize: "0.875rem", color: "#4b5563", marginTop: "0.25rem" }}>
                  {payPeriodStart} – {payPeriodEnd}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "1rem" }}>
                  Payday: <strong>{payDate}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", alignItems: "center" }}>
                  <button type="button" onClick={() => setSkipNotice(true)} style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, cursor: "pointer" }}>
                    Skip
                  </button>
                  <Button onClick={openEmployeePayroll} style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600, padding: "0.45rem 1.25rem" }}>
                    Run
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1rem", marginBottom: "1.75rem", fontSize: "0.875rem", color: "#6b7280", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Current employee payroll cycle skipped.</span>
                <button type="button" onClick={() => setSkipNotice(false)} style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, cursor: "pointer" }}>Undo</button>
              </div>
            )}

            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.75rem" }}>Contractor Payrolls (No Taxes Withheld)</h2>
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.35rem" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
                Synced Contractor Timesheets
              </div>
              <div style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "0.25rem", marginBottom: "1rem" }}>
                Contractors receive 100% of hours worked + reimbursements/bonuses with zero tax withholding. Review &amp; lock shifts in Time Tracking before paying.
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button onClick={() => openContractorPayroll("us_contractor")} style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}>
                  Pay US Contractors
                </Button>
                <Button variant="outline-primary" onClick={() => openContractorPayroll("non_us_contractor")}>
                  Pay Non-US Contractors
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate("/admin/payroll/time-attendance/time-tracking")}>
                  Review &amp; Sync Timesheets
                </Button>
              </div>
            </div>
          </div>

          {/* Right: More options */}
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.75rem" }}>More options</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { label: "Pay US contractors", icon: Users, action: () => openContractorPayroll("us_contractor") },
                { label: "Pay non-US contractors", icon: Globe, action: () => openContractorPayroll("non_us_contractor") },
                { label: "Pay all contractors", icon: DollarSign, action: () => openContractorPayroll("all") },
                { label: "Run an off-cycle payroll", icon: Calendar, action: openEmployeePayroll },
                { label: "Run an extra pay payroll", icon: Gift, action: openEmployeePayroll },
                { label: "Fix a payroll mistake", icon: Hammer, action: () => navigate("/admin/payroll/pay/history") }
              ].map((opt, idx) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={opt.action}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "1rem 1.15rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 600, fontSize: "0.92rem", color: "#111827" }}>
                      <Icon className="w-5 h-5 text-teal-700" />
                      {opt.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: EMPLOYEE PAYROLL STEP 1 OF 2 (Matches Image 2)
  // =========================================================================
  if (view === "employee_step1") {
    return (
      <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "4rem" }}>
        <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          <button type="button" onClick={() => setView("home")} style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, padding: 0, cursor: "pointer" }}>
            Pay
          </button>{" "}
          / <span style={{ color: "#4b5563" }}>Every other Friday payroll</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0, display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
              Every other Friday payroll
              <span style={{ fontSize: "0.75rem", backgroundColor: "#f3f4f6", color: "#374151", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>Draft</span>
            </h1>
            <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.2rem" }}>
              {payPeriodStart} – {payPeriodEnd} • Step 1 of 2 (Edit payroll)
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.15rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Payday on</div>
            <Form.Control type="date" size="sm" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Total time off</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.25rem" }}>0.00 hrs</div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Total worked</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.25rem" }}>{empTotals.hours.toFixed(2)} hrs</div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Total gross earnings</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.25rem" }}>{fmtMoney(empTotals.gross)}</div>
          </div>
        </div>

        <div style={{ marginBottom: "1.25rem", maxWidth: "340px" }}>
          <Form.Label className="small fw-semibold">Bank account</Form.Label>
          <Form.Control value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} />
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", marginBottom: "1.5rem" }}>
          {loading ? (
            <div className="p-4 text-center"><Spinner animation="border" size="sm" /> Loading employee payroll...</div>
          ) : (
            <Table hover responsive style={{ fontSize: "0.875rem", marginBottom: 0 }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th>Pay</th>
                  <th>Employee</th>
                  <th>Pay (Gross / Net)</th>
                  <th>Regular hrs</th>
                  <th>Bonus ($)</th>
                  <th>Reimbursement ($)</th>
                  <th>Memo</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No team members with Worker Type = &quot;Employee&quot; found. Set Marcus Cooper&apos;s worker type to Employee in People.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const gross = Number(r.hours_worked || 0) * Number(r.hourly_rate || 0) + Number(r.bonus || 0);
                    const empTax = Number((gross * 0.13396).toFixed(2));
                    const net = gross - empTax + Number(r.reimbursement || 0);
                    return (
                      <tr key={r.staff_id}>
                        <td><Form.Check checked={r.selected} onChange={(e) => updateRow(r.staff_id, "selected", e.target.checked)} /></td>
                        <td>
                          <div className="fw-bold">{r.staff_name}</div>
                          <div className="small text-muted">{fmtMoney(r.hourly_rate)}/hr</div>
                        </td>
                        <td>
                          <div className="fw-bold" style={{ color: "#0f766e" }}>{fmtMoney(gross)}</div>
                          <div className="small text-muted">{fmtMoney(net)} net</div>
                        </td>
                        <td style={{ width: "110px" }}>
                          <Form.Control size="sm" type="number" step="0.5" value={r.hours_worked} onChange={(e) => updateRow(r.staff_id, "hours_worked", e.target.value)} />
                        </td>
                        <td style={{ width: "110px" }}>
                          <Form.Control size="sm" type="number" step="1" value={r.bonus} onChange={(e) => updateRow(r.staff_id, "bonus", e.target.value)} />
                        </td>
                        <td style={{ width: "120px" }}>
                          <Form.Control size="sm" type="number" step="0.01" value={r.reimbursement} onChange={(e) => updateRow(r.staff_id, "reimbursement", e.target.value)} />
                        </td>
                        <td>
                          <Form.Control size="sm" placeholder="Optional memo" value={r.memo} onChange={(e) => updateRow(r.staff_id, "memo", e.target.value)} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button variant="light" onClick={() => setView("home")}>Cancel</Button>
          <Button
            disabled={selectedRows.length === 0}
            onClick={() => setView("employee_step2")}
            style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}
          >
            Review summary
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: EMPLOYEE PAYROLL STEP 2 OF 2 (Matches Images 3 & 4)
  // =========================================================================
  if (view === "employee_step2") {
    return (
      <div style={{ maxWidth: "1050px", margin: "0 auto", paddingBottom: "4rem" }}>
        <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          <button type="button" onClick={() => setView("home")} style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, padding: 0, cursor: "pointer" }}>
            Pay
          </button>{" "}
          / <span style={{ color: "#4b5563" }}>Every other Friday payroll</span>
        </div>

        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
          Take one last look and finish up
        </h1>
        <p style={{ color: "#4b5563", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Once you&apos;re done, we&apos;ll debit <strong>{fmtMoney(empTotals.totalDebit)}</strong>. Step 2 of 2 (Review and submit).
        </p>

        {/* Payroll details box */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          <div><div className="small text-muted">Total payroll</div><div className="fw-bold fs-5">{fmtMoney(empTotals.totalDebit)}</div></div>
          <div><div className="small text-muted">Withdrawal amount</div><div className="fw-bold fs-5">{fmtMoney(empTotals.totalDebit)}</div></div>
          <div><div className="small text-muted">Bank account</div><div className="fw-semibold">{paidFrom}</div></div>
          <div><div className="small text-muted">Withdrawal date</div><div className="fw-semibold">{withdrawalDate}</div></div>
          <div><div className="small text-muted">Payday</div><div className="fw-semibold">{payDate}</div></div>
        </div>

        {/* Collapsible 1: Taxes */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", marginBottom: "0.75rem" }}>
          <button type="button" onClick={() => setOpenTaxSection(!openTaxSection)} style={{ width: "100%", background: "none", border: "none", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, cursor: "pointer" }}>
            <span>What will get taxed and debited</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {openTaxSection && (
            <div style={{ padding: "0 1.25rem 1rem", fontSize: "0.875rem", color: "#374151" }}>
              <div>Employee taxes withheld: <strong>{fmtMoney(empTotals.empTax)}</strong></div>
              <div>Employer/Company FICA &amp; payroll taxes: <strong>{fmtMoney(empTotals.compTax)}</strong></div>
            </div>
          )}
        </div>

        {/* Collapsible 2: Take home */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", marginBottom: "0.75rem" }}>
          <button type="button" onClick={() => setOpenTakeHomeSection(!openTakeHomeSection)} style={{ width: "100%", background: "none", border: "none", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, cursor: "pointer" }}>
            <span>What your employees worked and take home</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {openTakeHomeSection && (
            <div style={{ padding: "0 1.25rem 1rem", fontSize: "0.875rem", color: "#374151" }}>
              <div>Gross wages: <strong>{fmtMoney(empTotals.gross)}</strong> • Employee taxes: <strong>-{fmtMoney(empTotals.empTax)}</strong> • Net take-home pay: <strong>{fmtMoney(empTotals.net)}</strong></div>
            </div>
          )}
        </div>

        {/* Collapsible 3: What your company will pay */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", marginBottom: "1.5rem" }}>
          <button type="button" onClick={() => setOpenCompanySection(!openCompanySection)} style={{ width: "100%", background: "none", border: "none", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, cursor: "pointer" }}>
            <span>What your company will pay</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {openCompanySection && (
            <div style={{ padding: "0 1.25rem 1rem" }}>
              <Table size="sm" style={{ fontSize: "0.875rem", marginBottom: 0 }}>
                <thead>
                  <tr><th>Team member</th><th>Gross pay</th><th>Reimbursements</th><th>Company taxes</th><th className="text-end">Subtotal</th></tr>
                </thead>
                <tbody>
                  {selectedRows.map((r) => {
                    const gross = Number(r.hours_worked || 0) * Number(r.hourly_rate || 0) + Number(r.bonus || 0);
                    const reimb = Number(r.reimbursement || 0);
                    const compTax = Number((gross * 0.0765).toFixed(2));
                    const sub = gross + reimb + compTax;
                    return (
                      <tr key={r.staff_id}>
                        <td>{r.staff_name}</td>
                        <td>{fmtMoney(gross)}</td>
                        <td>{fmtMoney(reimb)}</td>
                        <td>{fmtMoney(compTax)}</td>
                        <td className="text-end fw-bold">{fmtMoney(sub)}</td>
                      </tr>
                    );
                  })}
                  <tr className="fw-bold" style={{ backgroundColor: "#f9fafb" }}>
                    <td>Grand totals</td>
                    <td>{fmtMoney(empTotals.gross)}</td>
                    <td>{fmtMoney(empTotals.reimb)}</td>
                    <td>{fmtMoney(empTotals.compTax)}</td>
                    <td className="text-end">{fmtMoney(empTotals.totalDebit)}</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button variant="outline-secondary" onClick={() => setView("employee_step1")}>Go back</Button>
          <Button
            disabled={submitting}
            onClick={() => handleSubmitPayroll("employee")}
            style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}
          >
            {submitting ? "Submitting..." : "Submit payroll"}
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: EMPLOYEE PAYROLL DONE (Matches Image 5)
  // =========================================================================
  if (view === "employee_done") {
    return (
      <div style={{ maxWidth: "850px", margin: "2rem auto", paddingBottom: "4rem" }}>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
            You&apos;re all set
          </h1>
          <p style={{ color: "#4b5563", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            Payroll submitted for {payDate}. Total withdrawal: <strong>{fmtMoney(lastRunResult?.total_amount ?? empTotals.totalDebit)}</strong> from {paidFrom}.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
            <Button onClick={() => setView("home")} style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}>
              Go to Pay dashboard
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/admin/payroll/pay/history")}>
              See the full summary
            </Button>
          </div>
          <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "1.25rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            <div><div className="small text-muted">Total payroll</div><div className="fw-bold">{fmtMoney(lastRunResult?.total_amount ?? empTotals.totalDebit)}</div></div>
            <div><div className="small text-muted">Bank account</div><div className="fw-semibold">{paidFrom}</div></div>
            <div><div className="small text-muted">Withdrawal date</div><div className="fw-semibold">{withdrawalDate}</div></div>
            <div><div className="small text-muted">Payday</div><div className="fw-semibold">{payDate}</div></div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 5B: CONTRACTOR PAYROLL STEP 2 OF 2 (Matches Image 6)
  // =========================================================================
  const directDepositWithdrawal = selectedRows
    .filter((r) => (r.payment_method || "").toLowerCase() !== "check")
    .reduce(
      (sum, r) =>
        sum +
        Number(r.hours_worked || 0) * Number(r.hourly_rate || 0) +
        Number(r.bonus || 0) +
        Number(r.reimbursement || 0),
      0
    );

  if (view === "contractor_step2") {
    return (
      <div style={{ maxWidth: "1050px", margin: "0 auto", paddingBottom: "4rem" }}>
        <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          <button type="button" onClick={() => setView("home")} style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, padding: 0, cursor: "pointer" }}>
            Pay
          </button>{" "}
          / <span style={{ color: "#4b5563" }}>Pay contractors</span>
        </div>

        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
          Pay contractors
        </h1>
        <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
          Review and submit • Step 2 of 2
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <div className="small text-muted">Total payments</div>
            <div className="fw-bold fs-5">{fmtMoney(contractorTotal)}</div>
          </div>
          <div>
            <div className="small text-muted">Withdrawal amount (Direct Deposit)</div>
            <div className="fw-bold fs-5" style={{ color: "#0f766e" }}>{fmtMoney(directDepositWithdrawal)}</div>
          </div>
          <div><div className="small text-muted">Bank account</div><div className="fw-semibold">{paidFrom}</div></div>
          <div><div className="small text-muted">Withdrawal date</div><div className="fw-semibold">{withdrawalDate}</div></div>
          <div><div className="small text-muted">Payday</div><div className="fw-semibold">{payDate}</div></div>
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>
            What your contractors worked ({selectedRows.length} contractors)
          </div>
          <Table size="sm" style={{ fontSize: "0.875rem", marginBottom: 0 }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th>Contractor</th>
                <th>Method</th>
                <th>Invoice #</th>
                <th>Hours</th>
                <th>Reimbursements</th>
                <th>Bonus</th>
                <th className="text-end">Total Pay</th>
              </tr>
            </thead>
            <tbody>
              {selectedRows.map((r) => {
                const rowTotal =
                  Number(r.hours_worked || 0) * Number(r.hourly_rate || 0) +
                  Number(r.bonus || 0) +
                  Number(r.reimbursement || 0);
                return (
                  <tr key={r.staff_id}>
                    <td className="fw-semibold">{r.staff_name}</td>
                    <td>{r.payment_method}</td>
                    <td>#{r.invoice_number}</td>
                    <td>{Number(r.hours_worked || 0).toFixed(2)}</td>
                    <td>{Number(r.reimbursement || 0) > 0 ? fmtMoney(r.reimbursement) : "--"}</td>
                    <td>{Number(r.bonus || 0) > 0 ? fmtMoney(r.bonus) : "--"}</td>
                    <td className="text-end fw-bold">{fmtMoney(rowTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button variant="outline-secondary" onClick={() => setView("contractor")}>Back</Button>
          <Button
            disabled={submitting}
            onClick={() => handleSubmitPayroll(workerGroup)}
            style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}
          >
            {submitting ? "Submitting..." : "Submit payments"}
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 5A: CONTRACTOR PAYROLL STEP 1 OF 2 (Matches Images 1-4)
  // =========================================================================
  const visibleRows = rows.filter((r) => {
    const methodMatch = methodFilter === "all" ? true : (r.payment_method || "").toLowerCase() === methodFilter.toLowerCase();
    const searchMatch = !contractorSearch.trim() || (r.staff_name || "").toLowerCase().includes(contractorSearch.trim().toLowerCase());
    return methodMatch && searchMatch;
  });

  const contractorTotals = visibleRows.reduce(
    (acc, r) => {
      const hrs = Number(r.hours_worked || 0);
      const bon = Number(r.bonus || 0);
      const reimb = Number(r.reimbursement || 0);
      const pay = hrs * Number(r.hourly_rate || 0) + bon + reimb;
      acc.hours += hrs;
      acc.bonus += bon;
      acc.reimb += reimb;
      acc.pay += pay;
      return acc;
    },
    { hours: 0, bonus: 0, reimb: 0, pay: 0 }
  );

  const applyInvoiceToAll = () => {
    if (!bulkInvoice.trim()) return;
    setRows((prev) => prev.map((r) => ({ ...r, invoice_number: bulkInvoice.trim() })));
    showToast(`Applied invoice #${bulkInvoice.trim()} to all rows.`);
  };

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "4rem" }}>
      <button type="button" onClick={() => setView("home")} style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: 0, marginBottom: "1rem", cursor: "pointer" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Pay
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            Pay contractors
          </h1>
          <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Edit payments • Step 1 of 2 (No taxes or fees withheld)
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <Form.Label className="small fw-semibold mb-0">Payday:</Form.Label>
          <Form.Control type="date" size="sm" style={{ width: "150px" }} value={payDate} onChange={(e) => setPayDate(e.target.value)} />
        </div>
      </div>

      {/* Summary Strip + Synced Banner matching Image 1 */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1rem 1.25rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "0.85rem" }}>
        <div><div className="small text-muted">Debit date</div><div className="fw-bold">{withdrawalDate}</div></div>
        <div><div className="small text-muted">Contractors paid</div><div className="fw-bold">{selectedRows.length}</div></div>
        <div><div className="small text-muted">Total worked</div><div className="fw-bold">{contractorTotals.hours.toFixed(2)} hrs</div></div>
        <div><div className="small text-muted">Total payments</div><div className="fw-bold" style={{ color: "#0f766e" }}>{fmtMoney(contractorTotal)}</div></div>
      </div>

      <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#065f46", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Below are the hours you synced for <strong>{payPeriodStart}</strong> – <strong>{payPeriodEnd}</strong>.</span>
      </div>

      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <Form.Control
              size="sm"
              placeholder="Search people (e.g. denis, moses)..."
              value={contractorSearch}
              onChange={(e) => setContractorSearch(e.target.value)}
              style={{ width: "220px" }}
            />
            {[
              { id: "us_contractor", label: "US Contractors" },
              { id: "non_us_contractor", label: "Non-US Contractors" },
              { id: "all", label: "All Workers" }
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => openContractorPayroll(g.id)}
                style={{
                  padding: "0.38rem 0.75rem",
                  borderRadius: "6px",
                  border: workerGroup === g.id ? "1px solid #0f766e" : "1px solid #d1d5db",
                  backgroundColor: workerGroup === g.id ? "#f0fdfa" : "#ffffff",
                  color: workerGroup === g.id ? "#0f766e" : "#374151",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  cursor: "pointer"
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <Form.Control
              size="sm"
              style={{ width: "80px" }}
              value={bulkInvoice}
              onChange={(e) => setBulkInvoice(e.target.value)}
              placeholder="072"
            />
            <Button size="sm" variant="outline-secondary" onClick={applyInvoiceToAll}>
              Apply Invoice # to All
            </Button>
            <Filter className="w-4 h-4 text-gray-500 ms-1" />
            <Form.Select size="sm" style={{ width: "165px" }} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
              <option value="all">All Methods</option>
              <option value="Direct deposit">Direct deposit only</option>
              <option value="Check">Check only (Remitly)</option>
            </Form.Select>
            <input type="date" value={payPeriodStart} onChange={(e) => setPayPeriodStart(e.target.value)} style={{ padding: "0.35rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.83rem" }} />
            <span>to</span>
            <input type="date" value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)} style={{ padding: "0.35rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.83rem" }} />
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-center"><Spinner animation="border" size="sm" /> Loading contractors...</div>
        ) : (
          <Table hover responsive size="sm" style={{ fontSize: "0.85rem", marginBottom: 0 }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th>Pay</th>
                <th>Contractors</th>
                <th>Total pay</th>
                <th>Rate</th>
                <th>Hours</th>
                <th>Bonus ($)</th>
                <th>Reimbursements ($)</th>
                <th>Invoice</th>
                <th>Note</th>
                <th>Payment type</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-4 text-muted">No contractors in this filter.</td></tr>
              ) : (
                visibleRows.map((r) => {
                  const rowTotal =
                    Number(r.hours_worked || 0) * Number(r.hourly_rate || 0) +
                    Number(r.bonus || 0) +
                    Number(r.reimbursement || 0);
                  return (
                    <tr key={r.staff_id}>
                      <td><Form.Check checked={r.selected} onChange={(e) => updateRow(r.staff_id, "selected", e.target.checked)} /></td>
                      <td>
                        <div className="fw-semibold">{r.staff_name}</div>
                        <div className="small text-muted">{r.country}</div>
                        {r.is_dismissed_with_unpaid_hours && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", backgroundColor: "#fef3c7", color: "#92400e", padding: "0.1rem 0.45rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700 }}>
                            <AlertTriangle className="w-3 h-3" /> Dismissed • Unpaid Hours
                          </span>
                        )}
                      </td>
                      <td className="fw-bold">{fmtMoney(rowTotal)}</td>
                      <td>{fmtMoney(r.hourly_rate)}/hr</td>
                      <td style={{ width: "85px" }}><Form.Control size="sm" type="number" step="0.5" value={r.hours_worked} onChange={(e) => updateRow(r.staff_id, "hours_worked", e.target.value)} /></td>
                      <td style={{ width: "85px" }}><Form.Control size="sm" type="number" step="1" value={r.bonus} onChange={(e) => updateRow(r.staff_id, "bonus", e.target.value)} /></td>
                      <td style={{ width: "100px" }}><Form.Control size="sm" type="number" step="0.01" value={r.reimbursement} onChange={(e) => updateRow(r.staff_id, "reimbursement", e.target.value)} /></td>
                      <td style={{ width: "80px" }}><Form.Control size="sm" value={r.invoice_number} onChange={(e) => updateRow(r.staff_id, "invoice_number", e.target.value)} /></td>
                      <td style={{ minWidth: "160px" }}><Form.Control size="sm" placeholder="Tutor / sub / training note" value={r.memo} onChange={(e) => updateRow(r.staff_id, "memo", e.target.value)} /></td>
                      <td>
                        <span style={{ backgroundColor: r.payment_method === "Check" ? "#fef3c7" : "#dbeafe", color: r.payment_method === "Check" ? "#92400e" : "#1e40af", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 }}>
                          {r.payment_method}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
              {visibleRows.length > 0 && (
                <tr className="fw-bold" style={{ backgroundColor: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                  <td></td>
                  <td>Total ({visibleRows.length})</td>
                  <td>{fmtMoney(contractorTotals.pay)}</td>
                  <td></td>
                  <td>{contractorTotals.hours.toFixed(2)} hrs</td>
                  <td>{fmtMoney(contractorTotals.bonus)}</td>
                  <td>{fmtMoney(contractorTotals.reimb)}</td>
                  <td colSpan={3}></td>
                </tr>
              )}
            </tbody>
          </Table>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>Selected: <strong>{selectedRows.length}</strong></div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Button variant="light" onClick={() => setView("home")}>Cancel</Button>
            <Button
              disabled={selectedRows.length === 0}
              onClick={() => setView("contractor_step2")}
              style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}
            >
              Review summary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollPayPage;
