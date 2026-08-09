import React from "react";
import { Modal, Button, Table } from "react-bootstrap";

const ViewInvoiceModal = ({ show, handleClose, invoice, studentName }) => {
  if (!invoice) return null;

  const formattedDueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  const initialLetter = studentName?.charAt(0) || "S";

  return (
    <Modal show={show} onHide={handleClose} size="md" centered className="modern-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "Prompt", fontWeight: "600", fontSize: "16px" }}>
          View Invoice Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: "Prompt" }}>
        <div className="border rounded p-4 bg-white shadow-sm" style={{ position: "relative" }}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div className="d-flex align-items-center gap-2">
              {/* Blue Emblem */}
              <div
                className="d-flex align-items-center justify-content-center text-white"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#0ea5e9",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                E
              </div>
              <div>
                <h6 className="m-0 fw-bold text-slate-800" style={{ fontSize: "12px" }}>
                  Exceptional Learning and Arts Academy
                </h6>
                <span className="text-muted" style={{ fontSize: "9px" }}>
                  P.O. Box 29515, Jacksonville, FL, 32256
                </span>
              </div>
            </div>
            <div className="text-end">
              <span className="fw-bold text-slate-500" style={{ fontSize: "11px" }}>
                #INV-{invoice.id}
              </span>
            </div>
          </div>

          <hr className="my-3" style={{ borderColor: "#cbd5e1" }} />

          {/* Metadata */}
          <div className="mb-4" style={{ fontSize: "12px" }}>
            <div className="d-flex mb-1">
              <span className="text-slate-400 fw-bold" style={{ width: "110px" }}>
                Invoice For:
              </span>
              <span className="text-slate-800 fw-bold">{studentName}</span>
            </div>
            <div className="d-flex mb-1">
              <span className="text-slate-400 fw-bold" style={{ width: "110px" }}>
                DUE DATE:
              </span>
              <span className="text-slate-800 fw-bold">{formattedDueDate}</span>
            </div>
            <div className="d-flex">
              <span className="text-slate-400 fw-bold" style={{ width: "110px" }}>
                Status:
              </span>
              <span
                className={`fw-bold text-uppercase ${
                  invoice.status === "Paid" ? "text-success" : "text-warning"
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <Table responsive className="mb-2" style={{ fontSize: "11px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th className="py-2 border-bottom text-slate-500 text-uppercase">Description</th>
                <th className="py-2 border-bottom text-slate-500 text-uppercase text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 text-slate-700">{item.description}</td>
                  <td className="py-3 text-slate-700 text-end fw-semibold">
                    {item.amount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <td className="py-3 fw-bold text-slate-800">Total Amount</td>
                <td className="py-3 text-end fw-bold text-slate-800">
                  {invoice.total_amount?.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  }) || "$0.00"}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} style={{ fontSize: "12px" }}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewInvoiceModal;
