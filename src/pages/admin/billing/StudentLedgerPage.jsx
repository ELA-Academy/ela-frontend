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
} from "react-bootstrap";
import {
  ArrowLeft,
  CheckCircleFill,
  ExclamationTriangleFill,
  ThreeDotsVertical,
} from "react-bootstrap-icons";
import { getStudentLedger } from "../../../services/billingService";
import CreateInvoiceModal from "../../../components/admin/billing/CreateInvoiceModal";
import ReceivePaymentModal from "../../../components/admin/billing/ReceivePaymentModal";
import AddCreditModal from "../../../components/admin/billing/AddCreditModal";

const StudentLedgerPage = () => {
  const { studentId } = useParams();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0.00";
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    return amount < 0 ? `(${formatted})` : formatted;
  };

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link
            to="/admin/billing"
            className="d-flex align-items-center text-decoration-none text-muted mb-2"
          >
            <ArrowLeft size={20} className="me-2" />
            Back to All Accounts
          </Link>
          <h1 className="page-title mb-0">{ledger?.student_name}'s Ledger</h1>
        </div>
        <div>
          <Dropdown>
            <Dropdown.Toggle>New Transaction</Dropdown.Toggle>
            <Dropdown.Menu>
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
        </div>
      </div>

      <Card className="content-card mb-4">
        <Card.Body>
          <Row className="text-center">
            <Col>
              <div className="text-muted">Total Paid</div>
              <h4 className="text-success">
                {formatCurrency(ledger?.summary.paid || 0)}
              </h4>
            </Col>
            <Col>
              <div className="text-muted">Total Credited</div>
              <h4>{formatCurrency(ledger?.summary.credited || 0)}</h4>
            </Col>
            <Col>
              <div className="text-muted">Open Balance</div>
              <h4 className="text-danger">
                {formatCurrency(ledger?.summary.unpaid || 0)}
              </h4>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="content-card">
        <Table responsive className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
              <th className="text-end">Amount</th>
              <th className="text-end">Balance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ledger &&
              ledger.transactions.map((tx, index) => (
                <tr key={index}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>
                    <strong>{tx.type}</strong>
                  </td>
                  <td>{tx.description}</td>
                  <td>
                    {["Success", "Paid", "Applied"].includes(tx.status) ? (
                      <CheckCircleFill className="text-success me-2" />
                    ) : (
                      <ExclamationTriangleFill className="text-warning me-2" />
                    )}
                    {tx.status}
                  </td>
                  <td
                    className={`text-end ${
                      tx.amount < 0 ? "text-success" : ""
                    }`}
                  >
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="text-end fw-bold">
                    {formatCurrency(tx.balance)}
                  </td>
                  <td className="text-center">
                    {tx.type === "Invoice" && tx.status !== "Paid" && (
                      <Dropdown align="end">
                        <Dropdown.Toggle
                          as={Button}
                          variant="link"
                          className="p-0 text-muted"
                        >
                          <ThreeDotsVertical size={20} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={() => handleShowPaymentModal(tx)}
                          >
                            Receive Payment
                          </Dropdown.Item>
                          <Dropdown.Item>Send Invoice</Dropdown.Item>
                          <Dropdown.Item>Edit</Dropdown.Item>
                          <Dropdown.Item className="text-danger">
                            Void
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>

      <CreateInvoiceModal
        show={showInvoiceModal}
        handleClose={() => setShowInvoiceModal(false)}
        studentId={studentId}
        onInvoiceCreated={fetchLedger}
      />
      <ReceivePaymentModal
        show={showPaymentModal}
        handleClose={() => setShowPaymentModal(false)}
        studentId={studentId}
        invoice={selectedInvoice}
        onPaymentReceived={fetchLedger}
      />
      <AddCreditModal
        show={showCreditModal}
        handleClose={() => setShowCreditModal(false)}
        studentId={studentId}
        onCreditAdded={fetchLedger}
      />
    </>
  );
};

export default StudentLedgerPage;
