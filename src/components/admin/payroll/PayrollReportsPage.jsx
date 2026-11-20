import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Printer,
  FileSpreadsheet,
  Users,
  Clock,
  DollarSign,
  BookOpen
} from "lucide-react";
import { Button, Form } from "react-bootstrap";
import {
  getContractorPaymentsReport,
  getAdminTimesheets,
  getCumulativePayReport
} from "../../../services/payrollService";
import { getAllStaff } from "../../../services/staffService";
import { getAllDepartments } from "../../../services/departmentService";
import "../../../styles/GustoTheme.css";

const PayrollReportsPage = () => {
  const [activeTab, setActiveTab] = useState("new"); // "new" | "history"
  const [selectedReport, setSelectedReport] = useState(null); // null | "cumulative_pay" | "contractor_payments" | "contractor_info" | "time_hours"
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [cumulativeSummary, setCumulativeSummary] = useState(null);
  const [cumulativePreset, setCumulativePreset] = useState("6_months");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [loading, setLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);

  // Contractor Payments Report Builder State (Image 9)
  const [columns, setColumns] = useState({
    contractor_name: true,
    payment_method: true,
    net_pay: true,
    hours: true,
    bonus: false,
    invoice: true,
    memo: false,
    reimbursement: true
  });
  const [dateRangeMode, setDateRangeMode] = useState("annually");
  const [year, setYear] = useState("2026");
  const [customStart, setCustomStart] = useState("2026-01-01");
  const [customEnd, setCustomEnd] = useState("2026-12-31");
  const [selectedContractor, setSelectedContractor] = useState("all");
  const [groupBy, setGroupBy] = useState("none");

  useEffect(() => {
    getAllStaff()
      .then((res) => setStaffList(Array.isArray(res) ? res : res.staff || []))
      .catch(() => {});
    getAllDepartments()
      .then((res) => setDepartments(Array.isArray(res) ? res : res.departments || []))
      .catch(() => {});
  }, []);

  const computeDateBounds = () => {
    if (dateRangeMode === "annually") return { start_date: `${year}-01-01`, end_date: `${year}-12-31` };
    if (dateRangeMode === "monthly") {
      const now = new Date();
      const y = year;
      const m = String(now.getMonth() + 1).padStart(2, "0");
      return { start_date: `${y}-${m}-01`, end_date: `${y}-${m}-31` };
    }
    if (dateRangeMode === "quarterly") return { start_date: `${year}-10-01`, end_date: `${year}-12-31` };
    return { start_date: customStart, end_date: customEnd };
  };

  const runReport = async (type, presetOverride) => {
    setLoading(true);
    try {
      const bounds = computeDateBounds();
      if (type === "cumulative_pay") {
        const activePreset = presetOverride || cumulativePreset;
        const params = {
          preset: activePreset,
          staff_id: selectedContractor,
          department_id: selectedDepartment
        };
        if (activePreset === "custom") {
          params.start_date = customStart;
          params.end_date = customEnd;
        }
        const res = await getCumulativePayReport(params);
        setReportRows(res.rows || []);
        setCumulativeSummary(res);
        setReportHistory((prev) => [
          {
            id: Date.now(),
            name: "Cumulative pay tracking",
            generatedAt: new Date().toLocaleString(),
            range: `${res.start_date} to ${res.end_date}`
          },
          ...prev
        ]);
        return;
      } else if (type === "contractor_payments") {
        const res = await getContractorPaymentsReport({
          ...bounds,
          staff_id: selectedContractor
        });
        setReportRows(res.rows || []);
      } else if (type === "time_hours") {
        const res = await getAdminTimesheets(bounds.start_date, bounds.end_date);
        setReportRows(res.timesheets || []);
      } else if (type === "contractor_info") {
        setReportRows(staffList);
      }
      setReportHistory((prev) => [
        {
          id: Date.now(),
          name:
            type === "contractor_payments"
              ? "Contractor payments"
              : type === "time_hours"
              ? "Time tracking hours"
              : "Contractor information",
          generatedAt: new Date().toLocaleString(),
          range: `${bounds.start_date} to ${bounds.end_date}`
        },
        ...prev
      ]);
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (selectedReport === "cumulative_pay") {
      const header = "Staff Name,Department,Pay Runs,Total Hours,Regular Pay,Bonus,Reimbursement,Avg Per Run,Cumulative Total Paid,Last Pay Date";
      const body = reportRows
        .map((r) => `"${r.staff_name}","${r.department}",${r.pay_runs_count},${r.total_hours},${r.total_regular_pay},${r.total_bonus},${r.total_reimbursement},${r.avg_per_run},${r.total_net_pay},"${r.last_pay_date || ""}"`)
        .join("\n");
      const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cumulative_pay_${cumulativePreset}.csv`;
      a.click();
    } else if (selectedReport === "contractor_payments") {
      const activeCols = [
        columns.contractor_name && { key: "staff_name", label: "Contractor name" },
        columns.payment_method && { key: "payment_method", label: "Payment method" },
        columns.hours && { key: "hours_worked", label: "Hours" },
        columns.bonus && { key: "bonus", label: "Bonus" },
        columns.reimbursement && { key: "reimbursement", label: "Reimbursement" },
        columns.invoice && { key: "invoice_number", label: "Invoice" },
        columns.memo && { key: "memo", label: "Memo" },
        columns.net_pay && { key: "net_pay", label: "Net pay" }
      ].filter(Boolean);

      const header = activeCols.map((c) => `"${c.label}"`).join(",");
      const body = reportRows
        .map((r) => activeCols.map((c) => `"${r[c.key] ?? ""}"`).join(","))
        .join("\n");
      const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contractor_payments_${year}.csv`;
      a.click();
    } else if (selectedReport === "time_hours") {
      const header = "Name,Department,Worker Type,Total Hours,Shifts,Status";
      const body = reportRows
        .map((r) => `"${r.name}","${r.department}","${r.worker_type}",${r.total_hours},${r.shift_count},"${r.paid_count > 0 ? "Paid" : r.synced_count > 0 ? "Synced" : "Draft"}"`)
        .join("\n");
      const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `time_tracking_hours_${year}.csv`;
      a.click();
    } else if (selectedReport === "contractor_info") {
      const header = "Name,Email,Worker Type,Country,Payment Method,Hourly Rate,Status";
      const body = reportRows
        .map((r) => `"${r.name}","${r.email}","${r.worker_type}","${r.country}","${r.payment_method}",${r.hourly_rate},"${r.worker_status}"`)
        .join("\n");
      const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contractor_information.csv`;
      a.click();
    }
  };

  if (selectedReport) {
    return (
      <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "4rem" }}>
        <button
          type="button"
          onClick={() => {
            setSelectedReport(null);
            setReportRows([]);
          }}
          style={{
            background: "none",
            border: "none",
            color: "#2563eb",
            fontWeight: 600,
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            cursor: "pointer",
            marginBottom: "1rem"
          }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </button>

        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: "1.5rem" }}>
          {selectedReport === "cumulative_pay"
            ? "Cumulative pay tracking"
            : selectedReport === "contractor_payments"
            ? "Contractor payments"
            : selectedReport === "time_hours"
            ? "Time tracking hours"
            : "Contractor information"}
        </h1>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.75rem", marginBottom: "1.5rem" }}>
          {selectedReport === "cumulative_pay" && (
            <>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Track cumulative staff pay over any timeframe
              </h2>
              <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                View total cumulative compensation paid per team member across the last 4 weeks, 3 months, 6 months, 12 months, or any custom window.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {[
                  { id: "4_weeks", label: "Last 4 weeks" },
                  { id: "3_months", label: "Last 3 months" },
                  { id: "6_months", label: "Last 6 months" },
                  { id: "12_months", label: "Last 12 months" },
                  { id: "ytd", label: "Year to date" },
                  { id: "custom", label: "Custom range" }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCumulativePreset(p.id);
                      if (p.id !== "custom") runReport("cumulative_pay", p.id);
                    }}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "6px",
                      border: cumulativePreset === p.id ? "1px solid #2563eb" : "1px solid #d1d5db",
                      backgroundColor: cumulativePreset === p.id ? "#eff6ff" : "#ffffff",
                      color: cumulativePreset === p.id ? "#2563eb" : "#374151",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                {cumulativePreset === "custom" && (
                  <>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Start date</Form.Label>
                      <Form.Control type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">End date</Form.Label>
                      <Form.Control type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                    </Form.Group>
                  </>
                )}
                <Form.Group>
                  <Form.Label className="small fw-semibold">Department</Form.Label>
                  <Form.Select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                    <option value="all">All departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Team member</Form.Label>
                  <Form.Select value={selectedContractor} onChange={(e) => setSelectedContractor(e.target.value)}>
                    <option value="all">All team members</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              {cumulativeSummary && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "0.9rem 1.1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#2563eb", textTransform: "uppercase" }}>Total Cumulative Paid</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", marginTop: "0.2rem" }}>
                      ${Number(cumulativeSummary.grand_total_net_pay || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{cumulativeSummary.start_date} to {cumulativeSummary.end_date}</div>
                  </div>
                  <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.9rem 1.1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>Total Hours Paid</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", marginTop: "0.2rem" }}>
                      {Number(cumulativeSummary.grand_total_hours || 0).toFixed(2)} hrs
                    </div>
                  </div>
                  <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.9rem 1.1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>Staff Paid</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", marginTop: "0.2rem" }}>
                      {cumulativeSummary.staff_paid_count || 0}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {selectedReport === "contractor_payments" && (
            <>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Generate contractor payments report
              </h2>
              <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                View a history of payments made to your contractors, including amount, method, date, and hours worked.
              </p>

              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                What would you like this report to contain?
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", maxWidth: "460px", marginBottom: "1.5rem" }}>
                <Form.Check type="checkbox" label="Contractor name" checked={columns.contractor_name} disabled />
                <Form.Check type="checkbox" label="Hours" checked={columns.hours} onChange={(e) => setColumns({ ...columns, hours: e.target.checked })} />
                <Form.Check type="checkbox" label="Payment method" checked={columns.payment_method} disabled />
                <Form.Check type="checkbox" label="Bonus" checked={columns.bonus} onChange={(e) => setColumns({ ...columns, bonus: e.target.checked })} />
                <Form.Check type="checkbox" label="Net pay" checked={columns.net_pay} disabled />
                <Form.Check type="checkbox" label="Invoice" checked={columns.invoice} onChange={(e) => setColumns({ ...columns, invoice: e.target.checked })} />
                <div />
                <Form.Check type="checkbox" label="Memo" checked={columns.memo} onChange={(e) => setColumns({ ...columns, memo: e.target.checked })} />
                <div />
                <Form.Check type="checkbox" label="Reimbursement" checked={columns.reimbursement} onChange={(e) => setColumns({ ...columns, reimbursement: e.target.checked })} />
              </div>

              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                When and who should be included?
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: "560px", marginBottom: "1.5rem" }}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Date range</Form.Label>
                  <Form.Select value={dateRangeMode} onChange={(e) => setDateRangeMode(e.target.value)}>
                    <option value="annually">Annually</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom date range</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Year</Form.Label>
                  <Form.Select value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2027">2027</option>
                  </Form.Select>
                </Form.Group>
                {dateRangeMode === "custom" && (
                  <>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Start date</Form.Label>
                      <Form.Control type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">End date</Form.Label>
                      <Form.Control type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                    </Form.Group>
                  </>
                )}
                <Form.Group>
                  <Form.Label className="small fw-semibold">Select contractors</Form.Label>
                  <Form.Select value={selectedContractor} onChange={(e) => setSelectedContractor(e.target.value)}>
                    <option value="all">All contractors</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small fw-semibold">How would you like this data grouped?</Form.Label>
                  <Form.Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                    <option value="none">No grouping (line by line)</option>
                    <option value="method">By payment method (Check vs Direct deposit)</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button
              onClick={() => runReport(selectedReport)}
              style={{ backgroundColor: "#2563eb", border: "none", fontWeight: 600 }}
            >
              {loading ? "Generating..." : "Generate report"}
            </Button>
            {reportRows.length > 0 && (
              <>
                <Button variant="outline-secondary" onClick={exportCSV}>
                  <Download className="w-4 h-4 me-1 inline" /> Export CSV
                </Button>
                <Button variant="outline-secondary" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 me-1 inline" /> Print / PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Report Results Table */}
        {reportRows.length > 0 && (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                  {selectedReport === "cumulative_pay" && (
                    <>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Team member</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Department</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Pay runs</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Total hours</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Regular pay</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Bonuses</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Reimb.</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Cumulative total</th>
                    </>
                  )}
                  {selectedReport === "contractor_payments" && (
                    <>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Contractor</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Method</th>
                      {columns.hours && <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Hours</th>}
                      {columns.bonus && <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Bonus</th>}
                      {columns.reimbursement && <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Reimbursement</th>}
                      {columns.invoice && <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Invoice</th>}
                      {columns.memo && <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Memo</th>}
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Net pay</th>
                    </>
                  )}
                  {selectedReport === "time_hours" && (
                    <>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Team member</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Department</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Total Hours</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Shifts</th>
                    </>
                  )}
                  {selectedReport === "contractor_info" && (
                    <>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Name</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Country</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Method</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Rate</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {reportRows.map((r, idx) => (
                  <tr key={r.id || r.staff_id || idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    {selectedReport === "cumulative_pay" && (
                      <>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{r.staff_name}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{r.department}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{r.pay_runs_count}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{r.total_hours}h</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>${Number(r.total_regular_pay || 0).toFixed(2)}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>${Number(r.total_bonus || 0).toFixed(2)}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>${Number(r.total_reimbursement || 0).toFixed(2)}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: "#2563eb" }}>${Number(r.total_net_pay || 0).toFixed(2)}</td>
                      </>
                    )}
                    {selectedReport === "contractor_payments" && (
                      <>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{r.staff_name}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{r.payment_method}</td>
                        {columns.hours && <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{r.hours_worked}h</td>}
                        {columns.bonus && <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>${Number(r.bonus || 0).toFixed(2)}</td>}
                        {columns.reimbursement && <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>${Number(r.reimbursement || 0).toFixed(2)}</td>}
                        {columns.invoice && <td style={{ padding: "0.75rem 1rem" }}>#{r.invoice_number}</td>}
                        {columns.memo && <td style={{ padding: "0.75rem 1rem", color: "#6b7280" }}>{r.memo || "-"}</td>}
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700 }}>${Number(r.net_pay || 0).toFixed(2)}</td>
                      </>
                    )}
                    {selectedReport === "time_hours" && (
                      <>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{r.name}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{r.department}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 600 }}>{r.total_hours}h</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{r.shift_count}</td>
                      </>
                    )}
                    {selectedReport === "contractor_info" && (
                      <>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{r.name}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{r.country}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{r.payment_method}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>${Number(r.hourly_rate || 0).toFixed(2)}/hr</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{r.worker_status}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>Reports</h1>
        <Button
          onClick={() => {
            setSelectedReport("contractor_payments");
            runReport("contractor_payments");
          }}
          style={{ backgroundColor: "#2563eb", border: "none", fontWeight: 600 }}
        >
          New custom report
        </Button>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
        {[
          { id: "new", label: "New reports" },
          { id: "history", label: "Report history" }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              background: "none",
              border: "none",
              padding: "0.65rem 0.25rem",
              fontSize: "0.9rem",
              fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? "#111827" : "#6b7280",
              borderBottom: activeTab === t.id ? "2px solid #7c3aed" : "2px solid transparent",
              cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "new" ? (
        <>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>Recently used</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1.25rem" }}>
            {[
              {
                id: "cumulative_pay",
                title: "Cumulative pay tracking",
                desc: "Track how much each staff member has been paid across the last 4 weeks, 3 months, 6 months, 12 months, or any custom range.",
                icon: DollarSign
              },
              {
                id: "contractor_payments",
                title: "Contractor payments",
                desc: "View a history of payments made to your contractors, including amount, method, date, and hours worked.",
                icon: DollarSign
              },
              {
                id: "contractor_info",
                title: "Contractor information",
                desc: "View your full contractor directory with personal details, pay type, and payment method.",
                icon: Users
              },
              {
                id: "time_hours",
                title: "Time tracking hours",
                desc: "View your employees' and contractors' tracked hours, including totals, daily breakdowns, and approval status.",
                icon: Clock
              },
              {
                id: "contractor_payments",
                title: "Custom report",
                desc: "Build a report with the exact columns and filters you need across payroll, HR, and reimbursements.",
                icon: FileSpreadsheet
              },
              {
                id: "contractor_payments",
                title: "General ledger report",
                desc: "View payroll journal entries with invoice numbers, memos, and account details for accounting.",
                icon: BookOpen
              }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "1.35rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "0.4rem" }}>{card.title}</h3>
                    <p style={{ fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.45, marginBottom: "1rem" }}>{card.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport(card.id);
                      runReport(card.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#2563eb",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    View report <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem" }}>
          {reportHistory.length === 0 ? (
            <p style={{ color: "#6b7280", margin: 0 }}>No reports generated in this session yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {reportHistory.map((h) => (
                <li key={h.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600 }}>{h.name} ({h.range})</span>
                  <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>{h.generatedAt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default PayrollReportsPage;
