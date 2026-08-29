import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  X,
  ShieldCheck,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Lock
} from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "../../utils/stripe";
import StripeCardSetupForm from "../../components/parent/StripeCardSetupForm";
import StripeCardPayForm from "../../components/parent/StripeCardPayForm";
import api from "../../utils/api";
import { toast } from "react-toastify";

const ParentPaymentsPage = () => {
  const { activeStudent, childrenList } = useOutletContext();
  const [paymentsData, setPaymentsData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState(null);

  // Modal States
  const [makePaymentModalOpen, setMakePaymentModalOpen] = useState(false);
  const [addPmModalOpen, setAddPmModalOpen] = useState(false);
  const [changePmModalOpen, setChangePmModalOpen] = useState(false);
  
  // Payment Form States
  const [payAmount, setPayAmount] = useState("");
  const [selectedPm, setSelectedPm] = useState(null);
  const [useSavedMethod, setUseSavedMethod] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    getStripe().then(setStripePromise);
  }, []);

  useEffect(() => {
    fetchPaymentsSummary();
    fetchPaymentMethods();
  }, [activeStudent]);

  const fetchPaymentsSummary = () => {
    setLoading(true);
    const url = activeStudent ? `/parent/payments?student_id=${activeStudent.id}` : "/parent/payments";
    api.get(url)
      .then((res) => {
        setPaymentsData(res.data);
      })
      .catch((err) => {
        console.error("Failed to load payments summary:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchPaymentMethods = () => {
    api.get("/parent/payment-methods")
      .then((res) => {
        setPaymentMethods(res.data || []);
        const defaultMethod = res.data.find((m) => m.is_default) || res.data[0];
        if (defaultMethod) {
          setSelectedPm(defaultMethod);
          setUseSavedMethod(true);
        } else {
          setUseSavedMethod(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load payment methods:", err);
      });
  };

  const handleOpenMakePayment = (invoice = null) => {
    setSelectedInvoice(invoice);
    if (invoice) {
      setPayAmount(invoice.amount.toString());
    } else {
      const defaultAmount = paymentsData?.summary?.current_balance > 0 ? paymentsData.summary.current_balance : 0;
      setPayAmount(defaultAmount.toString());
    }
    if (paymentMethods.length > 0) {
      setUseSavedMethod(true);
    } else {
      setUseSavedMethod(false);
    }
    setMakePaymentModalOpen(true);
  };

  const handleSetDefaultPm = async (pmId) => {
    try {
      await api.put(`/parent/payment-methods/${pmId}/default`);
      toast.success("Default payment method updated.");
      fetchPaymentMethods();
    } catch (err) {
      toast.error("Failed to update default payment method.");
    }
  };

  const handleDeletePm = async (pmId) => {
    if (!window.confirm("Are you sure you want to remove this payment method?")) return;
    try {
      await api.delete(`/parent/payment-methods/${pmId}`);
      toast.success("Payment method removed from Stripe.");
      fetchPaymentMethods();
    } catch (err) {
      toast.error("Failed to remove payment method.");
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(payAmount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than $0.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const payload = {
        amount: numAmount,
        student_id: activeStudent?.id,
        payment_method_id: selectedPm?.id,
      };

      await api.post("/parent/pay", payload);
      toast.success("Payment processed successfully!");
      setMakePaymentModalOpen(false);
      fetchPaymentsSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || "Payment submission failed.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const transactions = paymentsData?.transactions || [];
  const totalResults = transactions.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const paginatedTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const studentNameHeader = activeStudent
    ? `${activeStudent.name || `${activeStudent.first_name} ${activeStudent.last_name}`}`
    : paymentsData?.children?.[0]?.name || "Family";

  const currentBalance = paymentsData?.summary?.current_balance || 0;
  const amountInProcess = paymentsData?.summary?.amount_in_process || 0;
  const autoPayActive = paymentsData?.summary?.auto_pay_enabled || false;

  return (
    <div>
      <div className="parent-page-header">
        <h1 className="parent-page-title">Payments</h1>
      </div>

      {/* Account Summary Card */}
      <div className="parent-account-summary-card">
        <div className="parent-account-summary-header">
          <div className="parent-student-avatar" style={{ width: "36px", height: "36px", background: "#f0ebff", color: "#673de6", fontWeight: 700 }}>
            {studentNameHeader.charAt(0)}
          </div>
          <div>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
              {studentNameHeader} + Family
            </span>
          </div>
        </div>

        <div className="parent-account-summary-body">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            <div className="parent-summary-metric">
              <span className="parent-summary-metric-label">Current Balance</span>
              <span className="parent-summary-metric-value">
                ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="parent-summary-metric">
              <span className="parent-summary-metric-label">Amount In Process</span>
              <span className="parent-summary-metric-value" style={{ color: "#64748b" }}>
                ${amountInProcess.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="parent-autopay-pill">
                <CheckCircle2 size={13} />
                <span>Your Auto Pay mode is {autoPayActive ? "ON" : "OFF"}</span>
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenMakePayment}
            className="btn-parent-primary"
            style={{ width: "auto", padding: "0.75rem 1.75rem", fontSize: "0.92rem", letterSpacing: "0.02em" }}
          >
            <CreditCard size={17} />
            <span>MAKE PAYMENT</span>
          </button>
        </div>
      </div>

      {/* Billing Summary Table */}
      <div className="parent-table-container">
        <div className="parent-table-header-row">
          <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
            Billing Summary
          </span>

          <div className="d-flex align-items-center gap-3" style={{ fontSize: "0.78rem", color: "#64748b" }}>
            <span>
              SHOWING {totalResults === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalResults)} OF {totalResults} RESULTS
            </span>
            <div className="d-flex align-items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="btn btn-sm btn-light border p-1"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="btn btn-sm btn-light border p-1"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {totalResults > 0 ? (
          <div className="table-responsive">
            <table className="parent-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>STUDENT</th>
                  <th>TYPE</th>
                  <th>DESCRIPTION</th>
                  <th>AMOUNT</th>
                  <th>BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                        {new Date(tx.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </small>
                    </td>

                    <td>
                      <div className="parent-student-cell">
                        <div className="parent-student-avatar">
                          {(tx.student_name || "S").charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          {tx.student_name}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{tx.type}</div>
                      {tx.method && (
                        <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                          {tx.method}
                        </small>
                      )}
                    </td>

                    <td style={{ maxWidth: "300px" }}>
                      <div style={{ fontSize: "0.82rem", color: "#334155" }}>
                        {tx.description}
                      </div>
                    </td>

                    <td>
                      <span className={`parent-amount-badge ${tx.amount < 0 ? "negative" : "positive"}`}>
                        <CheckCircle2 size={13} />
                        <span>${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      </span>
                    </td>

                    <td style={{ fontWeight: 700, color: "#0f172a" }}>
                      ${tx.balance.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-5 text-center text-muted">
            <FileText size={36} className="mb-2 text-secondary opacity-50" />
            <p className="mb-0" style={{ fontSize: "0.88rem" }}>No billing history found.</p>
          </div>
        )}
      </div>

      {/* === MODAL 1: MAKE PAYMENT MODAL === */}
      {makePaymentModalOpen && (
        <div className="parent-modal-overlay">
          <div className="parent-modal-content">
            <div className="parent-modal-header">
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                Make Payment
              </span>
              <button
                onClick={() => setMakePaymentModalOpen(false)}
                className="btn p-0 border-0 text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="parent-modal-body">
              {/* Payment Amount Card */}
              <div className="bg-light p-3 rounded-3 border mb-3 text-center">
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>
                  Payment Amount ($)
                </label>
                <div className="d-flex justify-content-center">
                  <div className="input-group" style={{ maxWidth: "220px" }}>
                    <span className="input-group-text bg-white font-weight-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="form-control text-center font-weight-bold"
                      style={{ fontSize: "1.25rem" }}
                    />
                  </div>
                </div>
                {selectedInvoice && (
                  <div className="mt-2 text-muted" style={{ fontSize: "0.78rem" }}>
                    Paying for: <strong>{selectedInvoice.description || `Invoice #${selectedInvoice.raw_id}`}</strong>
                  </div>
                )}
              </div>

              {/* Payment Option Switcher */}
              {paymentMethods.length > 0 && (
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUseSavedMethod(true)}
                    className={`btn flex-fill py-2 border ${useSavedMethod ? 'btn-dark font-weight-bold' : 'btn-light'}`}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <CreditCard size={15} className="me-1.5" />
                    Saved Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSavedMethod(false)}
                    className={`btn flex-fill py-2 border ${!useSavedMethod ? 'btn-dark font-weight-bold' : 'btn-light'}`}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <Plus size={15} className="me-1.5" />
                    New Card
                  </button>
                </div>
              )}

              {/* Stripe Payment Form */}
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <StripeCardPayForm
                    amount={payAmount}
                    studentId={activeStudent?.id}
                    invoiceId={selectedInvoice?.raw_id}
                    selectedSavedPm={selectedPm}
                    useSavedPm={useSavedMethod}
                    onPaymentSuccess={() => {
                      setMakePaymentModalOpen(false);
                      fetchPaymentsSummary();
                    }}
                    onCancel={() => setMakePaymentModalOpen(false)}
                  />
                </Elements>
              ) : (
                <div className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                  <p className="mt-2 text-muted" style={{ fontSize: "0.85rem" }}>Initializing secure Stripe payment...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === MODAL 2: CHANGE / SELECT PAYMENT METHOD MODAL === */}
      {changePmModalOpen && (
        <div className="parent-modal-overlay">
          <div className="parent-modal-content">
            <div className="parent-modal-header">
              <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                Select Payment Method
              </span>
              <button
                onClick={() => setChangePmModalOpen(false)}
                className="btn p-0 border-0 text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="parent-modal-body">
              <div className="d-flex flex-column gap-2 mb-3">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    onClick={() => {
                      setSelectedPm(pm);
                      setUseSavedMethod(true);
                      setChangePmModalOpen(false);
                    }}
                    className={`parent-pm-card ${selectedPm?.id === pm.id ? "selected" : ""}`}
                  >
                    <div className="parent-pm-left">
                      <div className="parent-pm-icon">
                        {pm.method_type === 'bank_account' ? <Building2 size={20} /> : <CreditCard size={20} />}
                      </div>
                      <div>
                        <div className="parent-pm-title">
                          •••••••• {pm.last4}
                        </div>
                        <div className="parent-pm-subtitle text-muted">
                          {pm.card_brand || pm.bank_name || "Card"}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {pm.is_default ? (
                        <span className="parent-badge-default">DEFAULT</span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefaultPm(pm.id);
                          }}
                          className="btn btn-sm btn-link p-0 text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Set as default
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePm(pm.id);
                        }}
                        className="btn btn-sm btn-link p-0 text-danger ms-2"
                        title="Remove method"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setChangePmModalOpen(false);
                  setAddPmModalOpen(true);
                }}
                className="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600 }}
              >
                <Plus size={16} />
                <span>Add Another Payment Method</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL 3: ADD PAYMENT METHOD MODAL (PCI-Compliant Stripe SetupIntent) === */}
      {addPmModalOpen && (
        <div className="parent-modal-overlay">
          <div className="parent-modal-content">
            <div className="parent-modal-header">
              <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                Add Saved Payment Card
              </span>
              <button
                onClick={() => setAddPmModalOpen(false)}
                className="btn p-0 border-0 text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="parent-modal-body">
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <StripeCardSetupForm
                    isDefault={true}
                    onPaymentMethodSaved={() => {
                      setAddPmModalOpen(false);
                      fetchPaymentMethods();
                    }}
                    onCancel={() => setAddPmModalOpen(false)}
                  />
                </Elements>
              ) : (
                <div className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                  <p className="mt-2 text-muted" style={{ fontSize: "0.85rem" }}>Initializing secure card form...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPaymentsPage;
