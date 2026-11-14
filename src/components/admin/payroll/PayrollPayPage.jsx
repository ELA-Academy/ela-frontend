import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Send,
  X,
  Calendar,
  ChevronRight,
  Mail,
  Globe,
  CalendarDays,
  Gift,
  Hammer,
  HelpCircle,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import { Modal, Button, Form, Spinner, Badge, Table } from "react-bootstrap";
import { getAllStaff } from "../../../services/staffService";

const PayrollPayPage = () => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "pay";

  // Data states
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Modals state (Popups instead of window.alert)
  const [runPayrollModal, setRunPayrollModal] = useState(false);
  const [skipPayrollModal, setSkipPayrollModal] = useState(false);
  const [contractorModal, setContractorModal] = useState(null); // 'us' | 'non-us'
  const [offCycleModal, setOffCycleModal] = useState(false);
  const [extraPayModal, setExtraPayModal] = useState(false);
  const [mistakeModal, setMistakeModal] = useState(false);
  const [autopilotModal, setAutopilotModal] = useState(false);
  const [payHistoryModal, setPayHistoryModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Run payroll form state
  const [payrollRows, setPayrollRows] = useState([]);
  const [processingRun, setProcessingRun] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await getAllStaff();
      const list = Array.isArray(res) ? res : res.staff || [];
      setStaffList(list);

      // Prepopulate payroll calculation rows
      const rows = list.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role || s.job_title || "Instructor",
        worker_type: s.worker_type || "Contractor",
        rate: s.hourly_rate || 30,
        hours: 40,
        bonus: 0,
        selected: true
      }));
      setPayrollRows(rows);
    } catch (err) {
      console.error("Failed to load staff for payroll:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (id, val) => {
    setPayrollRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, hours: parseFloat(val) || 0 } : r))
    );
  };

  const handleBonusChange = (id, val) => {
    setPayrollRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, bonus: parseFloat(val) || 0 } : r))
    );
  };

  const handleToggleSelect = (id) => {
    setPayrollRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const totalPayrollAmount = payrollRows
    .filter((r) => r.selected)
    .reduce((sum, r) => sum + r.hours * r.rate + r.bonus, 0);

  const handleProcessPayroll = () => {
    setProcessingRun(true);
    setTimeout(() => {
      setProcessingRun(false);
      setRunPayrollModal(false);
      setToastMessage("Payroll processed successfully! Direct deposit transactions dispatched.");
      setTimeout(() => setToastMessage(""), 5000);
    }, 1200);
  };

  // Sample history records for history modal
  const samplePayHistory = [
    { period: "Sep 13 - Sep 26, 2026", payday: "Fri Oct 2", total: "$24,745.00", people: 14, status: "Completed" },
    { period: "Aug 30 - Sep 12, 2026", payday: "Fri Sep 18", total: "$23,890.00", people: 14, status: "Completed" },
    { period: "Aug 16 - Aug 29, 2026", payday: "Fri Sep 4", total: "$22,410.00", people: 13, status: "Completed" },
    { period: "Aug 2 - Aug 15, 2026", payday: "Fri Aug 21", total: "$23,100.00", people: 13, status: "Completed" },
  ];

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            backgroundColor: "#1e3a8a",
            color: "#ffffff",
            padding: "0.85rem 1.4rem",
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

      {/* Page Title & Top Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem"
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          {currentTab === "expenses" ? "Expenses" : "Pay"}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={() => setAutopilotModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Settings
          </button>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setPayHistoryModal(true)}
            style={{
              borderColor: "#d1d5db",
              color: "#374151",
              backgroundColor: "#ffffff",
              fontWeight: 600,
              padding: "0.45rem 0.95rem",
              borderRadius: "8px",
              fontSize: "0.875rem"
            }}
          >
            View pay history
          </Button>
        </div>
      </div>

      {/* AutoPilot Banner (Image 1 replica) */}
      {!bannerDismissed && (
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "14px",
            padding: "1.1rem 1.4rem",
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            position: "relative"
          }}
        >
          <div style={{ display: "flex", gap: "1.1rem", alignItems: "flex-start" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1d4ed8",
                flexShrink: 0
              }}
            >
              <Send className="w-5 h-5 -rotate-12" />
            </div>

            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e3a8a", margin: "0 0 0.25rem" }}>
                Let payroll run itself
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#3b82f6", margin: "0 0 0.85rem" }}>
                With Payroll on AutoPilot®, you can run payroll automatically. Just set it up and you're done.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setAutopilotModal(true)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#bfdbfe",
                    color: "#1d4ed8",
                    fontWeight: 600,
                    fontSize: "0.825rem",
                    borderRadius: "6px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}
                >
                  Turn on AutoPilot
                </Button>

                <button
                  type="button"
                  onClick={() => setAutopilotModal(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Learn how it works
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Column (Up Next) & Right Column (More Options) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.8fr) minmax(320px, 1fr)",
          gap: "1.75rem",
          alignItems: "start"
        }}
      >
        {/* Left Column: Up next */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.85rem"
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
              Up next
            </h2>

            <button
              type="button"
              onClick={() => setPayHistoryModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                color: "#2563eb",
                fontSize: "0.85rem",
                fontWeight: 600,
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
            >
              <Calendar className="w-4 h-4" />
              <span>Payroll calendar</span>
            </button>
          </div>

          {/* Up Next Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "1.75rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            {/* Due Pill Badge */}
            <span
              style={{
                display: "inline-block",
                padding: "0.2rem 0.65rem",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#1d4ed8",
                backgroundColor: "#eff6ff",
                border: "1px solid #dbeafe",
                marginBottom: "0.85rem"
              }}
            >
              Due in 9 days
            </span>

            {/* Payroll Title & Dates */}
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: "0 0 0.35rem" }}>
              Every other Friday payroll
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#4b5563", margin: "0 0 0.2rem" }}>
              Sep 27–Oct 10, 2026
            </p>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 1.5rem" }}>
              Payday: Fri Oct 16
            </p>

            {/* Bottom Row: Staff Avatars & Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #f3f4f6",
                paddingTop: "1.25rem"
              }}
            >
              {/* Avatars Stack */}
              <div style={{ display: "flex", alignItems: "center" }}>
                {staffList.slice(0, 5).map((s, idx) => (
                  <div
                    key={s.id || idx}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: ["#dbeafe", "#e0e7ff", "#fce7f3", "#fef3c7", "#ccfbf1"][idx % 5],
                      color: ["#1e40af", "#3730a3", "#9d174d", "#92400e", "#115e59"][idx % 5],
                      border: "2px solid #ffffff",
                      marginLeft: idx > 0 ? "-8px" : 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700
                    }}
                    title={s.name}
                  >
                    {s.name ? s.name.charAt(0) : "S"}
                  </div>
                ))}
                {staffList.length > 5 && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#f3f4f6",
                      color: "#4b5563",
                      border: "2px solid #ffffff",
                      marginLeft: "-8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: 600
                    }}
                  >
                    +{staffList.length - 5}
                  </div>
                )}
              </div>

              {/* Actions: Skip & Run (Image 1 replica in ELA Blue) */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setSkipPayrollModal(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4b5563",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Skip
                </button>

                <Button
                  variant="primary"
                  onClick={() => setRunPayrollModal(true)}
                  style={{
                    backgroundColor: "#2563eb",
                    borderColor: "#2563eb",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    padding: "0.55rem 1.5rem",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(37,99,235,0.3)"
                  }}
                >
                  Run
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: More options (Image 1 replica) */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.85rem" }}>
            More options
          </h2>

          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            {[
              {
                id: "us-contractors",
                icon: Mail,
                title: "Pay US contractors",
                color: "#2563eb",
                bg: "#eff6ff",
                onClick: () => setContractorModal("us")
              },
              {
                id: "non-us-contractors",
                icon: Globe,
                title: "Pay non-US contractors",
                color: "#0891b2",
                bg: "#ecfeff",
                onClick: () => setContractorModal("non-us")
              },
              {
                id: "off-cycle",
                icon: CalendarDays,
                title: "Run an off-cycle payroll",
                color: "#7c3aed",
                bg: "#f5f3ff",
                onClick: () => setOffCycleModal(true)
              },
              {
                id: "extra-pay",
                icon: Gift,
                title: "Run an extra pay payroll",
                color: "#ea580c",
                bg: "#fff7ed",
                onClick: () => setExtraPayModal(true)
              },
              {
                id: "fix-mistake",
                icon: Hammer,
                title: "Fix a payroll mistake",
                color: "#dc2626",
                bg: "#fef2f2",
                onClick: () => setMistakeModal(true)
              }
            ].map((opt, idx) => {
              const IconComp = opt.icon;
              return (
                <div
                  key={opt.id}
                  onClick={opt.onClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease"
                  }}
                  className="hover:bg-slate-50"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: opt.bg,
                        color: opt.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>
                      {opt.title}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              );
            })}

            {/* Bottom option: See more options */}
            <div
              onClick={() => setPayHistoryModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.95rem 1.25rem",
                cursor: "pointer"
              }}
              className="hover:bg-slate-50"
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4b5563" }}>
                See more options
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Run Payroll Batch (No alert, fully dynamic)     */}
      {/* ======================================================== */}
      <Modal show={runPayrollModal} onHide={() => setRunPayrollModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-b border-slate-100">
          <Modal.Title style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            Run Regular Payroll: Sep 27–Oct 10, 2026
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#f8fafc",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              marginBottom: "1.25rem"
            }}
          >
            <div>
              <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                Selected Contractors
              </span>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                {payrollRows.filter((r) => r.selected).length} of {payrollRows.length}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                Total Estimated Payout
              </span>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1d4ed8" }}>
                ${totalPayrollAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            <Table hover responsive style={{ fontSize: "0.85rem" }}>
              <thead>
                <tr className="text-slate-500 bg-slate-50">
                  <th style={{ width: "40px" }}>Include</th>
                  <th>Contractor</th>
                  <th>Role</th>
                  <th>Rate ($/hr)</th>
                  <th style={{ width: "90px" }}>Hours</th>
                  <th style={{ width: "90px" }}>Bonus ($)</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {payrollRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => handleToggleSelect(row.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="fw-semibold text-slate-800">{row.name}</td>
                    <td className="text-slate-500">{row.role}</td>
                    <td>${parseFloat(row.rate || 0).toFixed(2)}</td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        value={row.hours}
                        onChange={(e) => handleHourChange(row.id, e.target.value)}
                        style={{ width: "70px", fontSize: "0.8rem" }}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        value={row.bonus}
                        onChange={(e) => handleBonusChange(row.id, e.target.value)}
                        style={{ width: "70px", fontSize: "0.8rem" }}
                      />
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                      ${(row.hours * row.rate + row.bonus).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-slate-100">
          <Button variant="light" size="sm" onClick={() => setRunPayrollModal(false)} disabled={processingRun}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleProcessPayroll}
            disabled={processingRun || totalPayrollAmount === 0}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb", fontWeight: 600 }}
          >
            {processingRun ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" />
                Processing Disbursals...
              </>
            ) : (
              `Approve & Pay $${totalPayrollAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: Skip Payroll Confirmation                       */}
      {/* ======================================================== */}
      <Modal show={skipPayrollModal} onHide={() => setSkipPayrollModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>
            Skip Sep 27–Oct 10, 2026 Payroll?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-slate-600" style={{ fontSize: "0.875rem" }}>
          Are you sure you want to skip this scheduled payroll run? No direct deposits or Stripe disbursements will be
          executed for this period. You can run an off-cycle payroll at any time later if needed.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setSkipPayrollModal(false)}>
            Back
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setSkipPayrollModal(false);
              setToastMessage("Payroll run was skipped for this cycle.");
              setTimeout(() => setToastMessage(""), 4000);
            }}
          >
            Yes, Skip Payroll
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: Pay US / Non-US Contractors Modal               */}
      {/* ======================================================== */}
      <Modal show={Boolean(contractorModal)} onHide={() => setContractorModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>
            {contractorModal === "us" ? "Pay US Contractors (Form 1099)" : "Pay International Contractors (W-8BEN)"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Select Contractor</Form.Label>
            <Form.Select size="sm">
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.job_title || s.role || "Contractor"})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Payment Amount ($ USD)</Form.Label>
            <Form.Control type="number" placeholder="500.00" size="sm" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Payment Method</Form.Label>
            <Form.Select size="sm">
              <option>Direct Deposit (ACH)</option>
              <option>Stripe Payout Connect</option>
              <option>Wire Transfer</option>
              <option>Check</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label className="small fw-semibold text-slate-700">Memo / Invoice Reference</Form.Label>
            <Form.Control type="text" placeholder="e.g. October curriculum design hours" size="sm" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setContractorModal(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setContractorModal(null);
              setToastMessage("Contractor payment initiated successfully.");
              setTimeout(() => setToastMessage(""), 4000);
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          >
            Submit Payment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: Off-Cycle / Extra Pay Modal                     */}
      {/* ======================================================== */}
      <Modal show={offCycleModal || extraPayModal} onHide={() => { setOffCycleModal(false); setExtraPayModal(false); }} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>
            {extraPayModal ? "Run Extra Pay / Bonus Payroll" : "Run Off-Cycle Payroll"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted small mb-3">
            Off-cycle and supplemental bonus payments can be executed anytime outside regular bi-weekly pay dates.
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Target Recipient Group</Form.Label>
            <Form.Select size="sm">
              <option>All Active Staff & Contractors</option>
              <option>Admissions Department</option>
              <option>Human Resources Department</option>
              <option>Teacher Department</option>
              <option>Specific Contractor Only</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Disbursement Date</Form.Label>
            <Form.Control type="date" defaultValue={new Date().toISOString().split("T")[0]} size="sm" />
          </Form.Group>
          <Form.Group>
            <Form.Label className="small fw-semibold text-slate-700">Reason</Form.Label>
            <Form.Control type="text" placeholder="e.g. Performance bonus or retro correction" size="sm" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => { setOffCycleModal(false); setExtraPayModal(false); }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setOffCycleModal(false);
              setExtraPayModal(false);
              setToastMessage("Supplemental off-cycle batch configured.");
              setTimeout(() => setToastMessage(""), 4000);
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          >
            Continue to Batch Entry
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 5: Fix Payroll Mistake Modal                       */}
      {/* ======================================================== */}
      <Modal show={mistakeModal} onHide={() => setMistakeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>
            Fix a Payroll Mistake
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted small mb-3">
            Select the prior completed payroll run you wish to adjust, claw back, or issue supplemental payment for.
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Select Prior Payroll</Form.Label>
            <Form.Select size="sm">
              <option>Sep 13–Sep 26, 2026 ($24,745.00)</option>
              <option>Aug 30–Sep 12, 2026 ($23,890.00)</option>
              <option>Aug 16–Aug 29, 2026 ($22,410.00)</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label className="small fw-semibold text-slate-700">Type of Correction</Form.Label>
            <Form.Select size="sm">
              <option>Underpayment (Pay additional owed hours)</option>
              <option>Overpayment (Deduct from next cycle)</option>
              <option>Tax withholding recalculation</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setMistakeModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setMistakeModal(false);
              setToastMessage("Correction adjustment recorded.");
              setTimeout(() => setToastMessage(""), 4000);
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          >
            Start Correction
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 6: AutoPilot Settings Modal                        */}
      {/* ======================================================== */}
      <Modal show={autopilotModal} onHide={() => setAutopilotModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700, color: "#1e3a8a" }}>
            Payroll AutoPilot® Configuration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="d-flex align-items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
            <Send className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div style={{ fontSize: "0.85rem", color: "#1e3a8a" }}>
              AutoPilot automatically calculates approved timesheets and executes direct deposit runs on the scheduled payday at 7:00 PM EDT.
            </div>
          </div>
          <Form.Check
            type="switch"
            id="autopilot-switch"
            label="Enable Automated Bi-Weekly Run"
            defaultChecked
            className="fw-semibold text-slate-800 mb-3"
          />
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Auto-Approval Deadline</Form.Label>
            <Form.Select size="sm" defaultValue="1">
              <option value="1">1 business day before payday</option>
              <option value="2">2 business days before payday</option>
              <option value="3">3 business days before payday</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setAutopilotModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setAutopilotModal(false);
              setToastMessage("AutoPilot preferences saved.");
              setTimeout(() => setToastMessage(""), 4000);
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          >
            Save Preferences
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 7: Pay History Modal                               */}
      {/* ======================================================== */}
      <Modal show={payHistoryModal} onHide={() => setPayHistoryModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            Payroll Disbursement History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Table hover responsive style={{ fontSize: "0.85rem" }}>
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th>Pay Period</th>
                <th>Payday</th>
                <th>People</th>
                <th>Total Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {samplePayHistory.map((item, idx) => (
                <tr key={idx}>
                  <td className="fw-semibold text-slate-800">{item.period}</td>
                  <td className="text-slate-600">{item.payday}</td>
                  <td>{item.people} contractors</td>
                  <td className="fw-bold text-slate-900">{item.total}</td>
                  <td>
                    <span className="badge bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                      ● {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setPayHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PayrollPayPage;
