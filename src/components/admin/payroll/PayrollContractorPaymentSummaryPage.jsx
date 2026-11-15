import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Info,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building,
  CreditCard
} from "lucide-react";
import { Button, Modal, Form } from "react-bootstrap";
import { getAllStaff } from "../../../services/staffService";
import "../../../styles/GustoTheme.css";

const PayrollContractorPaymentSummaryPage = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [memoModalContractor, setMemoModalContractor] = useState(null);
  const [viewPaymentModalContractor, setViewPaymentModalContractor] = useState(null);

  // Default contractor rows matching Image 5 & Image 6
  const defaultContractors = [
    {
      id: "c-1",
      name: "Christian Ayemidejor",
      invoice: "N/A",
      rate: 5.0,
      hours: 41.0,
      flatAmount: "None",
      bonus: 0.0,
      reimbursement: 0.0,
      tips: 0.0,
      cashTips: 0.0,
      paymentMethod: "Check",
      paidFrom: "XXXX3042",
      total: 205.0,
      memo: "Bi-weekly contractor hours"
    },
    {
      id: "c-2",
      name: "Alberto Sanchez",
      invoice: "N/A",
      rate: 3.5,
      hours: 7.0,
      flatAmount: "None",
      bonus: 0.0,
      reimbursement: 0.0,
      tips: 0.0,
      cashTips: 0.0,
      paymentMethod: "Check",
      paidFrom: "XXXX3042",
      total: 24.5,
      memo: "Substitute instructional support"
    },
    {
      id: "c-3",
      name: "Luisa Gonzalez",
      invoice: "N/A",
      rate: 3.5,
      hours: 44.5,
      flatAmount: "None",
      bonus: 0.0,
      reimbursement: 0.0,
      tips: 0.0,
      cashTips: 0.0,
      paymentMethod: "Check",
      paidFrom: "XXXX3042",
      total: 155.75,
      memo: "Regular classroom assistance"
    },
    {
      id: "c-4",
      name: "Nitzia Morales",
      invoice: "N/A",
      rate: 10.0,
      hours: 28.0,
      flatAmount: "None",
      bonus: 0.0,
      reimbursement: 0.0,
      tips: 0.0,
      cashTips: 0.0,
      paymentMethod: "Check",
      paidFrom: "XXXX3042",
      total: 280.0,
      memo: "Tutoring hours"
    },
    {
      id: "c-5",
      name: "Brenda Nekyesa",
      invoice: "N/A",
      rate: 7.5,
      hours: 47.0,
      flatAmount: "None",
      bonus: 0.0,
      reimbursement: 0.0,
      tips: 0.0,
      cashTips: 0.0,
      paymentMethod: "Check",
      paidFrom: "XXXX3042",
      total: 352.5,
      memo: "Lab preparation and grading"
    },
    {
      id: "c-6",
      name: "Kaleb Dunlap",
      invoice: "N/A",
      rate: 14.0,
      hours: 40.0,
      flatAmount: "None",
      bonus: 0.0,
      reimbursement: 0.0,
      tips: 0.0,
      cashTips: 0.0,
      paymentMethod: "Deposit",
      paidFrom: "XXXX3042",
      total: 560.0,
      memo: "Direct deposit contractor payment"
    },
    {
      id: "c-7",
      name: "Ruben Franco",
      invoice: "N/A",
      rate: 5.0,
      hours: 40.0,
      flatAmount: "None",
      bonus: 0.0,
      reimbursement: 0.0,
      tips: 0.0,
      cashTips: 0.0,
      paymentMethod: "Check",
      paidFrom: "XXXX3042",
      total: 200.0,
      memo: "Classroom technician support"
    },
    {
      id: "c-8",
      name: "Laura Carrillo",
      invoice: "N/A",
      rate: 12.5,
      hours: 41.0,
      flatAmount: "None",
      bonus: 0.0,
      reimbursement: 0.0,
      tips: 0.0,
      cashTips: 0.0,
      paymentMethod: "Check",
      paidFrom: "XXXX3042",
      total: 512.5,
      memo: "Curriculum development"
    }
  ];

  const [contractorsList, setContractorsList] = useState(defaultContractors);

  useEffect(() => {
    // Attempt to merge or append database staff who are contractors
    const loadStaff = async () => {
      try {
        const res = await getAllStaff();
        const list = Array.isArray(res) ? res : res.staff || [];
        if (list.length > 0) {
          const mapped = list.slice(0, 15).map((s, idx) => ({
            id: s.id || `staff-${idx}`,
            name: s.name,
            invoice: "N/A",
            rate: parseFloat(s.hourly_rate || (idx % 2 === 0 ? 10.0 : 7.5)),
            hours: 40.0,
            flatAmount: "None",
            bonus: 0.0,
            reimbursement: 0.0,
            tips: 0.0,
            cashTips: 0.0,
            paymentMethod: idx % 3 === 0 ? "Deposit" : "Check",
            paidFrom: "XXXX3042",
            total: parseFloat(s.hourly_rate || (idx % 2 === 0 ? 10.0 : 7.5)) * 40.0,
            memo: "Standard contractor disbursement"
          }));

          // Keep default image rows on top, append database staff
          const existingNames = new Set(defaultContractors.map((c) => c.name.toLowerCase()));
          const extra = mapped.filter((m) => !existingNames.has(m.name.toLowerCase()));
          setContractorsList([...defaultContractors, ...extra]);
        }
      } catch (err) {
        console.error("Failed to load staff for summary:", err);
      }
    };
    loadStaff();
  }, []);

  const totalDebited = "$24,745.00";

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Toast */}
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

      {/* Header with Back Arrow (Image 5 replica) */}
      <div style={{ marginBottom: "1.75rem" }}>
        <button
          type="button"
          onClick={() => navigate("/admin/payroll/pay/history?tab=contractors")}
          style={{
            background: "none",
            border: "none",
            color: "#2563eb",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: 0,
            marginBottom: "0.5rem"
          }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to pay history
        </button>

        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Contractor payments summary
        </h1>
        <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.2rem" }}>
          Oct 2, 2026
        </div>
      </div>

      {/* Top 2 Cards: Payment Receipt & Payment Details / Adjustments (Image 5 replica) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Payment Receipt Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "1.75rem"
          }}
        >
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>
            Payment receipt
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            <span style={{ color: "#6b7280" }}>From:</span>
            <span style={{ fontWeight: 600, color: "#111827" }}>Cooper Galvis Enterprises LLC (ELA Academy)</span>

            <span style={{ color: "#6b7280" }}>To:</span>
            <span style={{ color: "#111827", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              Payment recipients <Info className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>

          <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1.25rem" }}>
            For funds debited on October 1, 2026
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>Total</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{totalDebited}</span>
          </div>

          <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#9ca3af", lineHeight: 1.4 }}>
            These amounts may not represent all monies due to government tax authorities from you, and do not include any amounts transmitted outside the platform. If this amount includes money we've already paid an agency but that's owed to you as a refund, you must work directly with the agency to get refunded.
          </div>
        </div>

        {/* Payment Details & Adjustments Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Details */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "1.5rem"
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>
              Payment details
            </h3>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Pay day</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827", marginTop: "0.15rem" }}>
              Oct 2, 2026
            </div>
          </div>

          {/* Adjustments */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "1.5rem",
              flex: 1
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
              Adjustments
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.5, marginBottom: "1rem" }}>
              Adjustments include reversing, correcting under or overpayments, changing payment methods, etc.
            </p>
            <button
              type="button"
              onClick={() => setAdjustmentModalOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0
              }}
            >
              ✎ Make an adjustment
            </button>
          </div>
        </div>
      </div>

      {/* Main Contractor Breakdown Table (Image 5 & Image 6 replica) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          overflow: "hidden"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280", backgroundColor: "#f8fafc" }}>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600, minWidth: "180px" }}>Contractor</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Invoice</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Rate</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Hours</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Flat amount</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Bonus</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Reimbursement</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Tips</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Cash tips</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Payment Method</th>
                <th style={{ padding: "0.85rem 0.75rem", fontWeight: 600 }}>Paid From</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {contractorsList.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{c.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                      Payment:{" "}
                      <span
                        style={{ color: "#2563eb", textDecoration: "underline", cursor: "pointer" }}
                        onClick={() => setViewPaymentModalContractor(c)}
                      >
                        View
                      </span>{" "}
                      |{" "}
                      <span
                        style={{ color: "#2563eb", textDecoration: "underline", cursor: "pointer" }}
                        onClick={() => {
                          setToastMessage(`Downloading pay stub PDF for ${c.name}...`);
                          setTimeout(() => setToastMessage(""), 4000);
                        }}
                      >
                        PDF
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: "1rem 0.75rem", color: "#6b7280" }}>{c.invoice}</td>

                  <td style={{ padding: "1rem 0.75rem", color: "#374151" }}>${c.rate.toFixed(2)}</td>

                  <td style={{ padding: "1rem 0.75rem", color: "#374151" }}>{c.hours.toFixed(1)}</td>

                  <td style={{ padding: "1rem 0.75rem", color: "#6b7280" }}>{c.flatAmount}</td>

                  <td style={{ padding: "1rem 0.75rem", color: "#374151" }}>${c.bonus.toFixed(2)}</td>

                  <td style={{ padding: "1rem 0.75rem", color: "#374151" }}>${c.reimbursement.toFixed(2)}</td>

                  <td style={{ padding: "1rem 0.75rem", color: "#374151" }}>${c.tips.toFixed(2)}</td>

                  <td style={{ padding: "1rem 0.75rem", color: "#374151" }}>${c.cashTips.toFixed(2)}</td>

                  <td style={{ padding: "1rem 0.75rem", color: "#374151" }}>{c.paymentMethod}</td>

                  <td style={{ padding: "1rem 0.75rem", color: "#6b7280", fontSize: "0.8rem" }}>{c.paidFrom}</td>

                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: "#111827" }}>${c.total.toFixed(2)}</div>
                    <div style={{ marginTop: "0.2rem" }}>
                      <button
                        type="button"
                        onClick={() => setMemoModalContractor(c)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2563eb",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: 0
                        }}
                      >
                        <Info className="w-3 h-3 text-slate-400" /> memo
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MAKE ADJUSTMENT MODAL */}
      <Modal show={adjustmentModalOpen} onHide={() => setAdjustmentModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Make Payment Adjustment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ fontSize: "0.875rem" }}>
          <p className="text-slate-600 mb-3">
            Adjustments can reverse payments, apply corrections, or modify payout destinations for this disbursement.
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Contractor</Form.Label>
            <Form.Select>
              {contractorsList.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (${c.total.toFixed(2)})</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Adjustment Type</Form.Label>
            <Form.Select>
              <option>Reimbursement Addition</option>
              <option>Overpayment Deduction</option>
              <option>Shift Hours Correction</option>
              <option>Payment Method Change</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-slate-700">Amount ($)</Form.Label>
            <Form.Control type="number" step="0.01" placeholder="e.g. 50.00" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setAdjustmentModalOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setAdjustmentModalOpen(false);
              setToastMessage("Payment adjustment recorded successfully.");
              setTimeout(() => setToastMessage(""), 4500);
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          >
            Record Adjustment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MEMO MODAL */}
      <Modal show={Boolean(memoModalContractor)} onHide={() => setMemoModalContractor(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Payment Memo — {memoModalContractor?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-sm">
          <p className="text-slate-700 mb-2">
            <strong>Internal Note:</strong> {memoModalContractor?.memo || "Bi-weekly contractor hours disbursement"}
          </p>
          <div className="text-xs text-slate-500">
            Debited from {memoModalContractor?.paidFrom} on Oct 1, 2026. Processed via {memoModalContractor?.paymentMethod}.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setMemoModalContractor(null)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* VIEW PAYMENT / STUB MODAL */}
      <Modal show={Boolean(viewPaymentModalContractor)} onHide={() => setViewPaymentModalContractor(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Contractor Pay Receipt — {viewPaymentModalContractor?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-sm">
          <div className="p-3 bg-slate-50 rounded border mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-slate-900">{viewPaymentModalContractor?.name}</span>
              <span className="badge bg-primary text-white">Disbursed</span>
            </div>
            <div className="text-xs text-slate-600">Rate: ${viewPaymentModalContractor?.rate.toFixed(2)}/hr • Hours: {viewPaymentModalContractor?.hours} • Method: {viewPaymentModalContractor?.paymentMethod}</div>
          </div>
          <div className="d-flex justify-content-between py-2 border-bottom">
            <span>Gross Pay ({viewPaymentModalContractor?.hours} hrs @ ${viewPaymentModalContractor?.rate.toFixed(2)})</span>
            <span className="fw-semibold">${viewPaymentModalContractor?.total.toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between py-2 border-bottom text-muted">
            <span>Taxes Withheld (1099 Contractor)</span>
            <span>$0.00</span>
          </div>
          <div className="d-flex justify-content-between py-2 fw-bold text-slate-900 fs-6">
            <span>Net Paid</span>
            <span>${viewPaymentModalContractor?.total.toFixed(2)}</span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => {
              setToastMessage(`Downloading pay receipt for ${viewPaymentModalContractor?.name}...`);
              setTimeout(() => setToastMessage(""), 4000);
            }}
          >
            <Download className="w-3.5 h-3.5 me-1" /> Download PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setViewPaymentModalContractor(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PayrollContractorPaymentSummaryPage;
