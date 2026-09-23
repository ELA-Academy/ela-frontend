import React, { useState, useEffect, useCallback, forwardRef } from "react";
import {
  Table,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
  Dropdown,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { MoreHorizontal, DollarSign, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import AccountingNav from "../../../components/admin/billing/AccountingNav";
import { TableSkeleton } from "../../../components/Skeleton";
import {
  getSubsidies,
  createSubsidy,
  receiveSubsidyPayment,
} from "../../../services/subsidyService";
import { showSuccess, showError } from "../../../utils/notificationService";

const CustomToggle = forwardRef(({ children, onClick }, ref) => (
  <button
    type="button"
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="btn btn-sm btn-link text-slate-500 hover:text-slate-800 p-1 border-0 shadow-none"
    style={{ textDecoration: "none" }}
  >
    {children}
  </button>
));
CustomToggle.displayName = "CustomToggle";

const SubsidyAccountsPage = () => {
  const [subsidies, setSubsidies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Subsidy modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubsidyName, setNewSubsidyName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Receive Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSubsidyForPayment, setSelectedSubsidyForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Write-Off modal state
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [selectedSubsidyForWriteOff, setSelectedSubsidyForWriteOff] = useState(null);
  const [writeOffAmount, setWriteOffAmount] = useState("");
  const [writeOffDate, setWriteOffDate] = useState(new Date().toISOString().split("T")[0]);
  const [writeOffNotes, setWriteOffNotes] = useState("");
  const [isSubmittingWriteOff, setIsSubmittingWriteOff] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSubsidies();
      setSubsidies(data);
    } catch (err) {
      setError("Failed to load subsidy accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createSubsidy({ name: newSubsidyName });
      setShowCreateModal(false);
      setNewSubsidyName("");
      showSuccess("Subsidy account created successfully.");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to create subsidy.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPaymentModal = (sub) => {
    setSelectedSubsidyForPayment(sub);
    setPaymentAmount(sub.balance > 0 ? sub.balance.toFixed(2) : "");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentRef("");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedSubsidyForPayment) return;
    const amountVal = parseFloat(paymentAmount);
    if (!amountVal || amountVal <= 0) {
      showError("Please enter a valid payment amount greater than zero.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await receiveSubsidyPayment(selectedSubsidyForPayment.id, {
        transaction_type: "Payment",
        amount: amountVal,
        transaction_date: paymentDate,
        reference_number: paymentRef || null,
        notes: paymentNotes || null,
      });
      showSuccess(`Payment of $${amountVal.toFixed(2)} recorded for ${selectedSubsidyForPayment.name}.`);
      setShowPaymentModal(false);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to record payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleOpenWriteOffModal = (sub) => {
    setSelectedSubsidyForWriteOff(sub);
    setWriteOffAmount(sub.balance > 0 ? sub.balance.toFixed(2) : "0.00");
    setWriteOffDate(new Date().toISOString().split("T")[0]);
    setWriteOffNotes("");
    setShowWriteOffModal(true);
  };

  const handleRecordWriteOff = async (e) => {
    e.preventDefault();
    if (!selectedSubsidyForWriteOff) return;
    const amountVal = parseFloat(writeOffAmount);
    if (!amountVal || amountVal <= 0) {
      showError("Please enter a valid write-off amount greater than zero.");
      return;
    }

    setIsSubmittingWriteOff(true);
    try {
      await receiveSubsidyPayment(selectedSubsidyForWriteOff.id, {
        transaction_type: "Write-Off",
        amount: amountVal,
        transaction_date: writeOffDate,
        notes: writeOffNotes || "Subsidy balance write-off",
      });
      showSuccess(`Balance write-off of $${amountVal.toFixed(2)} recorded for ${selectedSubsidyForWriteOff.name}.`);
      setShowWriteOffModal(false);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to record write-off.");
    } finally {
      setIsSubmittingWriteOff(false);
    }
  };

  const formatCurrency = (amount) =>
    (amount != null ? amount : 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  if (loading)
    return (
      <>
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="page-title">Accounting</h1>
          <Button disabled>Create Subsidy</Button>
        </div>
        <AccountingNav />
        <TableSkeleton rows={5} cols={5} />
      </>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h1 className="page-title">Accounting</h1>
        <Button onClick={() => setShowCreateModal(true)}>Create Subsidy</Button>
      </div>
      <AccountingNav />
      <div className="content-card">
        <Table responsive className="modern-table align-middle">
          <thead>
            <tr>
              <th>Subsidy</th>
              <th className="text-end">Invoiced</th>
              <th className="text-end">Received</th>
              <th className="text-end">Balance</th>
              <th className="text-end" style={{ width: "80px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subsidies.map((sub) => (
              <tr key={sub.id}>
                <td>
                  <Link
                    to={`/admin/accounting/subsidies/${sub.id}`}
                    className="fw-bold text-decoration-none text-slate-800 hover:text-indigo-600"
                  >
                    {sub.name}
                  </Link>
                  {sub.written_off > 0 && (
                    <div className="text-muted small" style={{ fontSize: "11px" }}>
                      Written-off: {formatCurrency(sub.written_off)}
                    </div>
                  )}
                </td>
                <td className="text-end">{formatCurrency(sub.invoiced)}</td>
                <td className="text-end text-success">{formatCurrency(sub.received)}</td>
                <td className="text-end fw-bold">
                  {sub.balance <= 0 && sub.invoiced > 0 ? (
                    <span className="text-success d-inline-flex align-items-center gap-1">
                      <CheckCircle2 size={14} /> $0.00
                    </span>
                  ) : (
                    <span className={sub.balance > 0 ? "text-danger" : ""}>
                      {formatCurrency(sub.balance)}
                    </span>
                  )}
                </td>
                <td className="text-end">
                  <Dropdown align="end">
                    <Dropdown.Toggle as={CustomToggle}>
                      <MoreHorizontal size={18} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      renderOnMount
                      popperConfig={{ strategy: "fixed" }}
                      className="shadow border-slate-200 py-1"
                      style={{ zIndex: 1050, minWidth: "170px" }}
                    >
                      <Dropdown.Item
                        onClick={() => handleOpenPaymentModal(sub)}
                        className="d-flex align-items-center gap-2 py-2 text-slate-700"
                      >
                        <DollarSign size={15} className="text-success" />
                        <span>Receive Payment</span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => handleOpenWriteOffModal(sub)}
                        className="d-flex align-items-center gap-2 py-2 text-slate-700"
                      >
                        <FileText size={15} className="text-warning" />
                        <span>Write-Off Balance</span>
                      </Dropdown.Item>
                      <Dropdown.Divider className="my-1" />
                      <Dropdown.Item
                        as={Link}
                        to={`/admin/accounting/subsidies/${sub.id}`}
                        className="d-flex align-items-center gap-2 py-2 text-slate-700"
                      >
                        <ArrowRight size={15} className="text-primary" />
                        <span>View Details</span>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </tr>
            ))}
            {subsidies.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  No subsidy accounts found. Click "Create Subsidy" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Create Subsidy Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Subsidy Account</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="fw-semibold">Subsidy Name</Form.Label>
              <Form.Control
                type="text"
                value={newSubsidyName}
                onChange={(e) => setNewSubsidyName(e.target.value)}
                placeholder="e.g., Arizona ESA, Step Up For Students"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSaving}>
              {isSaving ? <Spinner as="span" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Receive Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            Receive Payment - {selectedSubsidyForPayment?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRecordPayment}>
          <Modal.Body>
            <div className="p-3 bg-slate-50 rounded-3 mb-3 border d-flex justify-content-between align-items-center">
              <div>
                <div className="small text-muted">Outstanding Balance</div>
                <div className="fw-bold text-danger fs-6">
                  {formatCurrency(selectedSubsidyForPayment?.balance)}
                </div>
              </div>
              <div className="text-end">
                <div className="small text-muted">Total Invoiced</div>
                <div className="fw-semibold text-slate-700 fs-6">
                  {formatCurrency(selectedSubsidyForPayment?.invoiced)}
                </div>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Payment Amount ($) *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Payment Date *</Form.Label>
              <Form.Control
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Reference / Check #</Form.Label>
              <Form.Control
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. Check #4092, Wire Ref"
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="fw-semibold">Notes / Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional notes regarding this payment receipt"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={isSubmittingPayment}>
              {isSubmittingPayment ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Recording...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Write-Off Balance Modal */}
      <Modal show={showWriteOffModal} onHide={() => setShowWriteOffModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            Write-Off Balance - {selectedSubsidyForWriteOff?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRecordWriteOff}>
          <Modal.Body>
            <Alert variant="warning" className="small py-2 px-3 mb-3">
              <strong>Notice:</strong> Writing off this balance will clear the remaining subsidy balance without altering family accounting transactions or student ledger charges.
            </Alert>

            <div className="p-3 bg-slate-50 rounded-3 mb-3 border d-flex justify-content-between align-items-center">
              <div>
                <div className="small text-muted">Current Balance</div>
                <div className="fw-bold text-danger fs-6">
                  {formatCurrency(selectedSubsidyForWriteOff?.balance)}
                </div>
              </div>
              <div className="text-end">
                <div className="small text-muted">Total Received So Far</div>
                <div className="fw-semibold text-success fs-6">
                  {formatCurrency(selectedSubsidyForWriteOff?.received)}
                </div>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Amount to Write Off ($) *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0.01"
                value={writeOffAmount}
                onChange={(e) => setWriteOffAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <Form.Text className="text-muted small">
                Defaults to the current outstanding balance.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Write-Off Date *</Form.Label>
              <Form.Control
                type="date"
                value={writeOffDate}
                onChange={(e) => setWriteOffDate(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="fw-semibold">Reason / Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={writeOffNotes}
                onChange={(e) => setWriteOffNotes(e.target.value)}
                placeholder="e.g. Non-reimbursable rate adjustment, grant closure write-off"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWriteOffModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" disabled={isSubmittingWriteOff}>
              {isSubmittingWriteOff ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Writing Off...
                </>
              ) : (
                "Confirm Write-Off"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default SubsidyAccountsPage;
