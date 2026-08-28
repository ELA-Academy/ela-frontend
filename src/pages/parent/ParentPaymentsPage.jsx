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
  ArrowUpRight
} from "lucide-react";
import api from "../../utils/api";
import { toast } from "react-toastify";

const ParentPaymentsPage = () => {
  const { activeStudent, childrenList } = useOutletContext();
  const [paymentsData, setPaymentsData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [makePaymentModalOpen, setMakePaymentModalOpen] = useState(false);
  const [addPmModalOpen, setAddPmModalOpen] = useState(false);
  const [changePmModalOpen, setChangePmModalOpen] = useState(false);
  
  // Payment Form States
  const [payAmount, setPayAmount] = useState("");
  const [selectedPm, setSelectedPm] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Add PM Form States
  const [pmType, setPmType] = useState("bank_account"); // 'bank_account' or 'card'
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [cardBrand, setCardBrand] = useState("Visa");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("2028");
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [savingPm, setSavingPm] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
        }
      })
      .catch((err) => {
        console.error("Failed to load payment methods:", err);
      });
  };

  const handleOpenMakePayment = () => {
    const defaultAmount = paymentsData?.summary?.current_balance > 0 ? paymentsData.summary.current_balance : 0;
    setPayAmount(defaultAmount.toString());
    setMakePaymentModalOpen(true);
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    setSavingPm(true);
    try {
      const payload = {
        method_type: pmType,
        is_default: setAsDefault,
        last4: pmType === 'card' ? cardNumber.slice(-4) : accountNumber.slice(-4),
        card_brand: pmType === 'card' ? cardBrand : null,
        exp_month: pmType === 'card' ? parseInt(expMonth) : null,
        exp_year: pmType === 'card' ? parseInt(expYear) : null,
        bank_name: pmType === 'bank_account' ? (bankName || "Verified Bank") : null,
        account_type: 'checking',
        account_holder_name: accountHolder
      };

      const res = await api.post("/parent/payment-methods", payload);
      toast.success("Payment method added successfully!");
      setAddPmModalOpen(false);
      
      // Reset form
      setAccountNumber("");
      setRoutingNumber("");
      setCardNumber("");
      
      // Refresh list & select newly created method
      await fetchPaymentMethods();
      setSelectedPm(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add payment method.");
    } finally {
      setSavingPm(false);
    }
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
      toast.success("Payment method removed.");
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

            <form onSubmit={handleSubmitPayment}>
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
                </div>

                {/* Selected Payment Method Header */}
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                    Payment Method
                  </span>
                  <button
                    type="button"
                    onClick={() => setChangePmModalOpen(true)}
                    className="btn p-0 border-0 text-primary"
                    style={{ fontSize: "0.8rem", fontWeight: 700 }}
                  >
                    CHANGE PAYMENT
                  </button>
                </div>

                {/* Selected Payment Method Box */}
                {selectedPm ? (
                  <div className="parent-pm-card selected mb-3">
                    <div className="parent-pm-left">
                      <div className="parent-pm-icon">
                        {selectedPm.method_type === 'bank_account' ? <Building2 size={20} /> : <CreditCard size={20} />}
                      </div>
                      <div>
                        <div className="parent-pm-title">
                          •••••••• {selectedPm.last4}
                        </div>
                        <div className="parent-pm-subtitle text-success">
                          <ShieldCheck size={13} />
                          <span>{selectedPm.method_type === 'bank_account' ? "Verified Bank" : selectedPm.card_brand || "Card"}</span>
                        </div>
                      </div>
                    </div>

                    {selectedPm.is_default && (
                      <span className="parent-badge-default">DEFAULT</span>
                    )}
                  </div>
                ) : (
                  <div className="p-3 border rounded-3 bg-light text-center mb-3">
                    <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                      No payment method saved yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAddPmModalOpen(true)}
                      className="btn btn-sm btn-outline-primary mt-2"
                    >
                      <Plus size={14} className="me-1" /> Add Payment Method
                    </button>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center py-2 px-1 border-top" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  <span>Total Amount to Pay:</span>
                  <span style={{ fontSize: "1.15rem", color: "#0284c7" }}>
                    ${parseFloat(payAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="parent-modal-footer">
                <button
                  type="button"
                  onClick={() => setMakePaymentModalOpen(false)}
                  className="btn btn-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || !selectedPm}
                  className="btn-parent-primary"
                  style={{ width: "auto" }}
                >
                  {submittingPayment ? "Processing..." : "SUBMIT PAYMENT"}
                </button>
              </div>
            </form>
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
                          {pm.bank_name || pm.card_brand || "Account"} ({pm.method_type === 'bank_account' ? 'ACH Bank' : 'Card'})
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

      {/* === MODAL 3: ADD PAYMENT METHOD MODAL === */}
      {addPmModalOpen && (
        <div className="parent-modal-overlay">
          <div className="parent-modal-content">
            <div className="parent-modal-header">
              <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                Add Payment Method
              </span>
              <button
                onClick={() => setAddPmModalOpen(false)}
                className="btn p-0 border-0 text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPaymentMethod}>
              <div className="parent-modal-body">
                {/* Method Type Pills */}
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPmType("bank_account")}
                    className={`btn flex-fill py-2 border ${pmType === 'bank_account' ? 'btn-dark font-weight-bold' : 'btn-light'}`}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <Building2 size={16} className="me-2" />
                    Bank Account (ACH)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPmType("card")}
                    className={`btn flex-fill py-2 border ${pmType === 'card' ? 'btn-dark font-weight-bold' : 'btn-light'}`}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <CreditCard size={16} className="me-2" />
                    Credit / Debit Card
                  </button>
                </div>

                {pmType === 'bank_account' ? (
                  <>
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Chase, Wells Fargo, Bank of America"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        required
                        className="form-control"
                        style={{ fontSize: "0.85rem" }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Routing Number (9 digits)</label>
                      <input
                        type="text"
                        placeholder="123456789"
                        maxLength="9"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        required
                        className="form-control"
                        style={{ fontSize: "0.85rem" }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Account Number</label>
                      <input
                        type="text"
                        placeholder="Enter full account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                        className="form-control"
                        style={{ fontSize: "0.85rem" }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Account Holder Name</label>
                      <input
                        type="text"
                        placeholder="Full Name as on Account"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        required
                        className="form-control"
                        style={{ fontSize: "0.85rem" }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Card Brand</label>
                      <select
                        value={cardBrand}
                        onChange={(e) => setCardBrand(e.target.value)}
                        className="form-select"
                        style={{ fontSize: "0.85rem" }}
                      >
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="American Express">American Express</option>
                        <option value="Discover">Discover</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Card Number</label>
                      <input
                        type="text"
                        placeholder="16-digit card number"
                        maxLength="19"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        className="form-control"
                        style={{ fontSize: "0.85rem" }}
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Exp Month</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={expMonth}
                          onChange={(e) => setExpMonth(e.target.value)}
                          required
                          className="form-control"
                          style={{ fontSize: "0.85rem" }}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Exp Year</label>
                        <input
                          type="number"
                          min="2025"
                          max="2040"
                          value={expYear}
                          onChange={(e) => setExpYear(e.target.value)}
                          required
                          className="form-control"
                          style={{ fontSize: "0.85rem" }}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="form-check mt-3">
                  <input
                    type="checkbox"
                    id="setDefaultCheckbox"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="form-check-input"
                  />
                  <label htmlFor="setDefaultCheckbox" className="form-check-label" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                    Set as default payment method
                  </label>
                </div>
              </div>

              <div className="parent-modal-footer">
                <button
                  type="button"
                  onClick={() => setAddPmModalOpen(false)}
                  className="btn btn-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPm}
                  className="btn-parent-dark"
                >
                  {savingPm ? "Saving..." : "Save Payment Method"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPaymentsPage;
