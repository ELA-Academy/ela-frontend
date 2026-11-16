import React, { useState, useEffect } from "react";
import { CircleDollarSign, Printer, FileText } from "lucide-react";
import { Modal, Button, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getMyPayHistory } from "../../services/payrollService";
import "../../styles/GustoTheme.css";

const GustoPayPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPay, setSelectedPay] = useState(null);

  useEffect(() => {
    getMyPayHistory()
      .then((res) => setPayments(res.payments || []))
      .catch((err) => console.error("Failed to load pay history:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", paddingBottom: "4rem" }}>
      <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", marginBottom: "0.4rem" }}>
        Pay
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        View your past payments. To see upcoming pay dates, check your signed{" "}
        <button
          type="button"
          onClick={() => navigate("/time-tracking/documents")}
          style={{ background: "none", border: "none", padding: 0, color: "#0f766e", textDecoration: "underline", fontWeight: 600, cursor: "pointer" }}
        >
          2026 Pay Schedule
        </button>{" "}
        in Documents.
      </p>

      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
        <Table hover responsive style={{ fontSize: "0.875rem", marginBottom: 0 }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th>Pay Date</th>
              <th>Invoice #</th>
              <th>Method</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Bonus / Reimb.</th>
              <th className="text-end">Net Pay</th>
              <th className="text-end">Stub</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-4 text-muted">Loading payments...</td></tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">
                  <CircleDollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  No processed payments yet. Payments appear here once payroll is finalized.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td className="fw-semibold">{p.pay_date}</td>
                  <td>#{p.invoice_number}</td>
                  <td>{p.payment_method}</td>
                  <td>{p.hours_worked}h</td>
                  <td>${Number(p.hourly_rate).toFixed(2)}/hr</td>
                  <td>${(Number(p.bonus || 0) + Number(p.reimbursement || 0)).toFixed(2)}</td>
                  <td className="text-end fw-bold" style={{ color: "#0f766e" }}>${Number(p.net_pay).toFixed(2)}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      onClick={() => setSelectedPay(p)}
                      style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, cursor: "pointer" }}
                    >
                      <FileText className="w-4 h-4 inline me-1" /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={!!selectedPay} onHide={() => setSelectedPay(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            Payment Receipt — Invoice #{selectedPay?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPay && (
            <div style={{ fontSize: "0.9rem" }}>
              <div className="d-flex justify-content-between mb-2"><span>Pay Date:</span><strong>{selectedPay.pay_date}</strong></div>
              <div className="d-flex justify-content-between mb-2"><span>Payment Method:</span><strong>{selectedPay.payment_method}</strong></div>
              <div className="d-flex justify-content-between mb-2"><span>Hours Worked:</span><strong>{selectedPay.hours_worked}h @ ${Number(selectedPay.hourly_rate).toFixed(2)}/hr</strong></div>
              <div className="d-flex justify-content-between mb-2"><span>Regular Pay:</span><strong>${Number(selectedPay.regular_pay).toFixed(2)}</strong></div>
              <div className="d-flex justify-content-between mb-2"><span>Bonus:</span><strong>${Number(selectedPay.bonus).toFixed(2)}</strong></div>
              <div className="d-flex justify-content-between mb-2"><span>Reimbursement:</span><strong>${Number(selectedPay.reimbursement).toFixed(2)}</strong></div>
              {selectedPay.memo && (
                <div className="p-2 bg-light rounded mb-2 small">
                  <strong>Memo:</strong> {selectedPay.memo}
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between fs-5 fw-bold" style={{ color: "#0f766e" }}>
                <span>Total Net Pay:</span>
                <span>${Number(selectedPay.net_pay).toFixed(2)}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4 me-1 inline" /> Print
          </Button>
          <Button variant="secondary" onClick={() => setSelectedPay(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GustoPayPage;
