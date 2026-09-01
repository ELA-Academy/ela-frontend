import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Spinner,
  Alert,
  Table,
  Button,
  Dropdown,
  Row,
  Col,
  Card,
  Modal,
  Form
} from "react-bootstrap";
import {
  ArrowLeft,
  CheckCircleFill,
  ExclamationTriangleFill,
  ThreeDotsVertical,
  Calendar,
  InfoCircleFill,
} from "react-bootstrap-icons";
import {
  getStudentLedger,
  getStudentStatementPdf,
  cancelInvoice,
  sendInvoice
} from "../../../services/billingService";
import CreateInvoiceModal from "../../../components/admin/billing/CreateInvoiceModal";
import ReceivePaymentModal from "../../../components/admin/billing/ReceivePaymentModal";
import AddCreditModal from "../../../components/admin/billing/AddCreditModal";
import ViewReceiptModal from "../../../components/admin/billing/ViewReceiptModal";
import IssueRefundModal from "../../../components/admin/billing/IssueRefundModal";
import ViewInvoiceModal from "../../../components/admin/billing/ViewInvoiceModal";
import EditInvoiceModal from "../../../components/admin/billing/EditInvoiceModal";
import ViewAuditLogsModal from "../../../components/admin/billing/ViewAuditLogsModal";
import { showError, showSuccess } from "../../../utils/notificationService";

const StudentLedgerPage = () => {
  const { studentId } = useParams();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // New Invoice action modals state
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [showAuditLogsModal, setShowAuditLogsModal] = useState(false);
  
  // Date Range for Statement
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloadingStatement, setDownloadingStatement] = useState(false);

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStudentLedger(studentId);
      setLedger(data);
    } catch (err) {
      setError("Failed to load student ledger.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleShowPaymentModal = (invoice = null) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleShowReceiptModal = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handleShowRefundModal = (payment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
  };

  const handleShowViewInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewInvoiceModal(true);
  };

  const handleShowEditInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowEditInvoiceModal(true);
  };

  const handleCancelInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to cancel/void this invoice? Parents will not be charged.")) {
      return;
    }
    try {
      await cancelInvoice(invoiceId);
      showSuccess("Invoice canceled successfully.");
      fetchLedger();
    } catch (err) {
      showError("Failed to cancel invoice.");
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await sendInvoice(invoiceId);
      showSuccess("Invoice sent to parents successfully.");
      fetchLedger();
    } catch (err) {
      showError("Failed to send invoice.");
    }
  };

  const handleDownloadStatement = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      showError("Please select both start and end dates.");
      return;
    }

    try {
      setDownloadingStatement(true);
      const blob = await getStudentStatementPdf(studentId, startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `statement_${ledger?.student_name.replace(/\s+/g, "_")}_${startDate}_to_${endDate}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowStatementModal(false);
      showSuccess("Statement downloaded successfully!");
    } catch (err) {
      showError("Failed to download statement PDF.");
    } finally {
      setDownloadingStatement(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0.00";
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    return amount < 0 ? `(${formatted})` : formatted;
  };

  // Helper for two-line Date format
  const formatTxDate = (dateStr) => {
    const d = new Date(dateStr);
    const dateLine = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeLine = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { dateLine, timeLine };
  };

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  const initialLetter = ledger?.student_name?.charAt(0) || "S";
  const parentNamesString = ledger?.parent_names?.join(", ").toUpperCase() || "N/A";
  
  // Calculate payments in process status if any
  const inProgressAmount = ledger?.transactions
    ?.filter((tx) => tx.type === "Payment" && tx.status === "In Process")
    ?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

  return (
    <div style={{ fontFamily: "Prompt", padding: "10px 20px" }}>
      {/* Top Breadcrumb header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div style={{ fontSize: "12px", color: "#64748b" }} className="mb-1">
            <Link to="/admin/accounting" className="text-decoration-none" style={{ color: "#0ea5e9" }}>
              Accounting
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: "500" }}>{ledger?.student_name} Family Transactions</span>
          </div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {/* Audit Log Button */}
          <button
            type="button"
            className="btn btn-outline-info rounded-pill bg-white px-3"
            onClick={() => setShowAuditLogsModal(true)}
            style={{ fontSize: "11px", fontWeight: "600" }}
          >
            AUDIT LOG
          </button>

          <button
            className="btn btn-outline-secondary rounded-pill bg-white px-3"
            style={{ fontSize: "11px", fontWeight: "600", borderColor: "#cbd5e1" }}
          >
            MULTIFAMILY
          </button>
          
          <Dropdown>
            <Dropdown.Toggle
              as={Button}
              style={{
                backgroundColor: "#00b8d4",
                borderColor: "#00b8d4",
                borderRadius: "50px",
                fontSize: "11px",
                fontWeight: "600",
                color: "#ffffff",
                padding: "6px 20px"
              }}
            >
              NEW TRANSACTION
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" style={{ fontSize: "12px" }}>
              <Dropdown.Item onClick={() => setShowInvoiceModal(true)}>
                Create Invoice
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowCreditModal(true)}>
                Add Credit
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleShowPaymentModal()}>
                Receive Payment
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Three Dots Dropdown for Statements */}
          <Dropdown align="end">
            <Dropdown.Toggle as={Button} variant="link" className="p-0 text-muted border-0">
              <ThreeDotsVertical size={20} />
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ fontSize: "12px" }}>
              <Dropdown.Item onClick={() => setShowStatementModal(true)}>
                Download Statement
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Student Badge Card */}
      <Card className="border-0 mb-4 p-3 bg-light rounded-3" style={{ border: "1px solid #e2e8f0" }}>
        <div className="d-flex align-items-start gap-3">
          <div
            className="d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#94a3b8",
              fontSize: "18px",
            }}
          >
            {initialLetter}
          </div>
          <div>
            <Link
              to={`/admin/students/${studentId}`}
              className="fw-bold text-decoration-none text-uppercase"
              style={{ fontSize: "13px", color: "#0ea5e9" }}
            >
              {ledger?.student_name}
            </Link>
            <div className="mt-1" style={{ fontSize: "10px", color: "#64748b", fontWeight: "600" }}>
              PARENTS: {parentNamesString}
            </div>

            <div className="d-flex gap-4 mt-3" style={{ fontSize: "12px" }}>
              <div>
                <span className="text-muted">Paid/CRM: </span>
                <span className="fw-bold text-success" style={{ fontSize: "13px" }}>
                  {formatCurrency(ledger?.summary.paid || 0)} / {formatCurrency(ledger?.summary.credited || 0)}
                </span>
              </div>
              <div>
                <span className="text-muted">In Progress: </span>
                <span className="fw-bold text-dark" style={{ fontSize: "13px" }}>
                  {formatCurrency(inProgressAmount)}
                </span>
              </div>
              <div>
                {(() => {
                  const unpaidVal = ledger?.summary?.unpaid || 0;
                  if (unpaidVal < 0) {
                    return (
                      <>
                        <span className="text-muted">Account Credit: </span>
                        <span className="fw-bold text-success" style={{ fontSize: "13px" }}>
                          ${Math.abs(unpaidVal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </>
                    );
                  } else if (unpaidVal > 0) {
                    return (
                      <>
                        <span className="text-muted">Un-Paid: </span>
                        <span className="fw-bold text-danger" style={{ fontSize: "13px" }}>
                          ${unpaidVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <span className="text-muted">Un-Paid: </span>
                        <span className="fw-bold text-dark" style={{ fontSize: "13px" }}>
                          $0.00
                        </span>
                      </>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions Table Container */}
      <div className="content-card p-0 border" style={{ borderColor: "#cbd5e1", borderRadius: "8px" }}>
        {/* Table Subheader */}
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom" style={{ backgroundColor: "#fcfcfc" }}>
          <span style={{ fontSize: "10px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Showing {ledger?.transactions.length || 0} of {ledger?.transactions.length || 0} Results
          </span>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            1 - {ledger?.transactions.length || 0} of {ledger?.transactions.length || 0}
          </span>
        </div>

        <Table responsive className="modern-table mb-0" style={{ fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Date</th>
              <th style={{ width: "15%" }}>Type</th>
              <th style={{ width: "35%" }}>Description</th>
              <th style={{ width: "12%" }}>Status</th>
              <th className="text-end" style={{ width: "11%" }}>Amount</th>
              <th className="text-end" style={{ width: "11%" }}>Balance</th>
              <th style={{ width: "6%" }}></th>
            </tr>
          </thead>
          <tbody>
            {ledger && ledger.transactions.length > 0 ? (
              ledger.transactions.map((tx, index) => {
                const { dateLine, timeLine } = formatTxDate(tx.date);
                return (
                  <tr key={index}>
                    <td>
                      <div>{dateLine}</div>
                      <div className="text-muted" style={{ fontSize: "10px" }}>{timeLine}</div>
                    </td>
                    <td>
                      <div className="fw-bold">{tx.type}</div>
                      <div className="text-muted" style={{ fontSize: "10px" }}>
                        {tx.type === "Payment" && (tx.method || "Debit Card")}
                        {tx.type === "Invoice" && tx.due_date && `Due ${new Date(tx.due_date).toLocaleDateString()}`}
                        {tx.type === "Credit" && "Credit"}
                      </div>
                    </td>
                    <td>{tx.description}</td>
                    <td>
                      {["Success", "Paid", "Applied"].includes(tx.status) ? (
                        <span className="d-flex align-items-center text-success fw-bold">
                          <CheckCircleFill className="me-1" size={13} />
                          {tx.status}
                        </span>
                      ) : (
                        <span className="d-flex align-items-center text-warning fw-bold">
                          <ExclamationTriangleFill className="me-1" size={13} />
                          {tx.status}
                        </span>
                      )}
                    </td>
                    <td className={`text-end fw-semibold ${tx.amount < 0 ? "text-success" : "text-dark"}`}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="text-end fw-bold text-dark">
                      {formatCurrency(tx.balance)}
                    </td>
                    <td className="text-center">
                      {/* For invoice transaction - modified with Procare options */}
                      {tx.type === "Invoice" && tx.status !== "Paid" && (
                        <Dropdown align="end">
                          <Dropdown.Toggle as={Button} variant="link" className="p-0 text-muted border-0">
                            <ThreeDotsVertical size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu popperConfig={{ strategy: "fixed" }} style={{ fontSize: "12px" }}>
                            <Dropdown.Item onClick={() => handleShowViewInvoiceModal(tx)}>
                              View
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleShowEditInvoiceModal(tx)}>
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleCancelInvoice(tx.id)}>
                              Cancel
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleSendInvoice(tx.id)}>
                              Send Invoice
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleShowPaymentModal(tx)}>
                              Receive Payment
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      )}

                      {/* For successful payment transaction */}
                      {tx.type === "Payment" && tx.method !== "Refund" && tx.status === "Success" && (
                        <Dropdown align="end">
                          <Dropdown.Toggle as={Button} variant="link" className="p-0 text-muted border-0">
                            <ThreeDotsVertical size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu popperConfig={{ strategy: "fixed" }} style={{ fontSize: "12px" }}>
                            <Dropdown.Item onClick={() => handleShowReceiptModal(tx)}>
                              View Receipt
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleShowRefundModal(tx)}>
                              Issue Refund
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  No transactions recorded on this profile.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Date Range Modal for Statement Generation */}
      <Modal show={showStatementModal} onHide={() => setShowStatementModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: "Prompt", fontWeight: "600", fontSize: "15px" }}>
            Generate Account Statement
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDownloadStatement} style={{ fontFamily: "Prompt" }}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "12px" }}>Start Date</Form.Label>
              <Form.Control
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ fontSize: "12px" }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "12px" }}>End Date</Form.Label>
              <Form.Control
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ fontSize: "12px" }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowStatementModal(false)}
              style={{ fontSize: "12px" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={downloadingStatement}
              style={{
                backgroundColor: "#0ea5e9",
                borderColor: "#0ea5e9",
                borderRadius: "50px",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              {downloadingStatement ? <Spinner size="sm" animation="border" /> : "Download Statement"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Invoice Modals */}
      <CreateInvoiceModal
        show={showInvoiceModal}
        handleClose={() => setShowInvoiceModal(false)}
        studentId={studentId}
        studentName={ledger?.student_name}
        onInvoiceCreated={fetchLedger}
      />

      <ViewInvoiceModal
        show={showViewInvoiceModal}
        handleClose={() => setShowViewInvoiceModal(false)}
        invoice={selectedInvoice}
        studentName={ledger?.student_name}
      />

      <EditInvoiceModal
        show={showEditInvoiceModal}
        handleClose={() => setShowEditInvoiceModal(false)}
        studentId={studentId}
        studentName={ledger?.student_name}
        invoice={selectedInvoice}
        onInvoiceEdited={fetchLedger}
      />

      {/* Receive Payment Modal */}
      <ReceivePaymentModal
        show={showPaymentModal}
        handleClose={() => setShowPaymentModal(false)}
        studentId={studentId}
        invoice={selectedInvoice}
        accountBalance={ledger?.summary.unpaid || 0}
        studentName={ledger?.student_name}
        onPaymentReceived={fetchLedger}
      />

      {/* Add Credit Modal */}
      <AddCreditModal
        show={showCreditModal}
        handleClose={() => setShowCreditModal(false)}
        studentId={studentId}
        onCreditAdded={fetchLedger}
      />

      {/* View Receipt Modal */}
      <ViewReceiptModal
        show={showReceiptModal}
        handleClose={() => setShowReceiptModal(false)}
        studentId={studentId}
        payment={selectedPayment}
        studentName={ledger?.student_name}
      />

      {/* Issue Refund Modal */}
      <IssueRefundModal
        show={showRefundModal}
        handleClose={() => setShowRefundModal(false)}
        studentId={studentId}
        payment={selectedPayment}
        studentName={ledger?.student_name}
        accountBalance={ledger?.summary.unpaid || 0}
        transactions={ledger?.transactions || []}
        onRefundIssued={fetchLedger}
      />

      {/* Financial Audit Logs Modal */}
      <ViewAuditLogsModal
        show={showAuditLogsModal}
        handleClose={() => setShowAuditLogsModal(false)}
        studentId={studentId}
        studentName={ledger?.student_name}
      />
    </div>
  );
};

export default StudentLedgerPage;
