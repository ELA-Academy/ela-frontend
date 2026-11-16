import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter } from "lucide-react";
import { Table, Form } from "react-bootstrap";
import { getPayrollHistory } from "../../../services/payrollService";

const PayrollPayHistoryPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [methodFilter, setMethodFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayrollHistory()
      .then((res) => setItems(res.items || []))
      .catch((err) => console.error("Failed to load pay history:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((i) =>
    methodFilter === "all" ? true : (i.payment_method || "").toLowerCase() === methodFilter.toLowerCase()
  );

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "4rem" }}>
      <button
        type="button"
        onClick={() => navigate("/admin/payroll/pay")}
        style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: 0, marginBottom: "1rem", cursor: "pointer" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pay
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>Pay History</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Filter className="w-4 h-4 text-gray-500" />
          <Form.Select size="sm" style={{ width: "200px" }} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
            <option value="all">All Payment Methods</option>
            <option value="Direct deposit">Direct deposit</option>
            <option value="Check">Check (Remitly / Non-US)</option>
          </Form.Select>
        </div>
      </div>

      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
        <Table hover responsive style={{ fontSize: "0.875rem", marginBottom: 0 }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th>Pay Date</th>
              <th>Invoice #</th>
              <th>Contractor / Employee</th>
              <th>Method</th>
              <th>Rate</th>
              <th>Hours</th>
              <th>Reimbursement</th>
              <th>Bonus</th>
              <th>Memo</th>
              <th className="text-end">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-4 text-muted">Loading pay history...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-4 text-muted">No payment records yet. Submit a payroll run from the Pay tab.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.pay_date}</td>
                  <td className="fw-semibold">#{item.invoice_number}</td>
                  <td className="fw-semibold" style={{ color: "#0f766e" }}>{item.staff_name}</td>
                  <td>{item.payment_method}</td>
                  <td>${Number(item.hourly_rate).toFixed(2)}</td>
                  <td>{item.hours_worked}h</td>
                  <td>${Number(item.reimbursement).toFixed(2)}</td>
                  <td>${Number(item.bonus).toFixed(2)}</td>
                  <td style={{ color: "#6b7280" }}>{item.memo || "-"}</td>
                  <td className="text-end fw-bold">${Number(item.net_pay).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default PayrollPayHistoryPage;
