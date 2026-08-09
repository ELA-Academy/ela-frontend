import React, { useState } from "react";
import { Modal, Button, Table, Spinner } from "react-bootstrap";
import { getPaymentReceiptPdf } from "../../../services/billingService";
import { showError } from "../../../utils/notificationService";

const ViewReceiptModal = ({ show, handleClose, studentId, payment, studentName }) => {
  const [downloading, setDownloading] = useState(false);

  if (!payment) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await getPaymentReceiptPdf(studentId, payment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt_${payment.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showError("Failed to download receipt PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const receiptId = `#PYMT-${String(payment.id).padStart(8, '0')}`;
  const formattedDate = new Date(payment.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Modal show={show} onHide={handleClose} size="md" centered className="modern-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "Prompt", fontWeight: "600", fontSize: "16px" }}>
          View Payment Receipt
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: "Prompt" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button
            variant="link"
            onClick={handleDownload}
            disabled={downloading}
            className="text-decoration-none p-0 fw-bold d-flex align-items-center gap-1"
            style={{ color: "#0ea5e9", fontSize: "12px", border: "none" }}
          >
            {downloading ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" />
                DOWNLOADING...
              </>
            ) : (
              "DOWNLOAD PDF"
            )}
          </Button>
        </div>

        {/* Receipt Visual Container */}
        <div
          className="border p-4 rounded bg-white shadow-sm"
          style={{ position: "relative" }}
        >
          {/* Top Row */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div className="d-flex align-items-center gap-2">
              {/* Emblem Logo */}
              <div
                className="d-flex align-items-center justify-content-center text-white"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  backgroundColor: "#0ea5e9",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                E
              </div>
              <div>
                <h6 className="m-0 fw-bold text-slate-800" style={{ fontSize: "13px" }}>
                  Exceptional Learning and Arts Academy
                </h6>
                <span className="text-muted" style={{ fontSize: "10px" }}>
                  P.O. Box 29515, Jacksonville, FL, 32256
                </span>
              </div>
            </div>
            <div className="text-end">
              <span className="fw-bold text-slate-500" style={{ fontSize: "11px" }}>
                {receiptId}
              </span>
            </div>
          </div>

          <hr className="my-3" style={{ borderColor: "#cbd5e1" }} />

          {/* Student Info */}
          <div className="mb-4" style={{ fontSize: "12px" }}>
            <div className="d-flex mb-1">
              <span className="text-slate-400 fw-bold" style={{ width: "110px" }}>
                Payment For:
              </span>
              <span className="text-slate-800 fw-bold">{studentName}</span>
            </div>
            <div className="d-flex">
              <span className="text-slate-400 fw-bold" style={{ width: "110px" }}>
                PAYMENT DATE:
              </span>
              <span className="text-slate-800">{formattedDate}</span>
            </div>
          </div>

          {/* Details Table */}
          <Table responsive className="mb-3" style={{ fontSize: "11px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th className="py-2 border-bottom text-uppercase text-slate-500">
                  Description
                </th>
                <th className="py-2 border-bottom text-uppercase text-slate-500 text-end">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 text-slate-700">
                  Payment via {payment.method || "Debit Card"}
                  {payment.notes && <div className="text-muted mt-1" style={{ fontSize: "10px" }}>Note: {payment.notes}</div>}
                </td>
                <td className="py-3 text-slate-700 text-end fw-bold">
                  {/* Ledger amounts for payments are negative, show as positive in receipt details */}
                  ${Math.abs(payment.amount).toFixed(2)}
                </td>
              </tr>
              <tr style={{ backgroundColor: "#ecfdf5" }}>
                <td className="py-3 fw-bold text-success">TOTAL AMOUNT</td>
                <td className="py-3 text-end fw-bold text-success">
                  ${Math.abs(payment.amount).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ViewReceiptModal;
