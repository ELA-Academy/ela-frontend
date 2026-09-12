import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock, ShieldCheck, CreditCard } from "lucide-react";
import { STRIPE_ELEMENT_OPTIONS } from "../../utils/stripe";
import api from "../../utils/api";
import { toast } from "react-toastify";

const StripeCardPayForm = ({
  amount,
  studentId,
  invoiceId,
  selectedSavedPm,
  useSavedPm = false,
  onPaymentSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe) return;

    setSubmitting(true);
    setErrorMessage("");

    // Generate client-side UUID idempotency key per submit action
    const idempotencyKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      if (useSavedPm && selectedSavedPm) {
        // 1. Pay with Saved Payment Method (1-click charge)
        const res = await api.post("/parent/create-payment-intent", {
          student_id: studentId,
          invoice_id: invoiceId,
          amount: amount,
          payment_method_id: selectedSavedPm.id,
          idempotency_key: idempotencyKey,
        });

        if (res.data.status === "succeeded") {
          toast.success("Payment processed successfully!");
          if (onPaymentSuccess) onPaymentSuccess();
          return;
        }

        // If Stripe requires 3D Secure / Customer Action
        if (res.data.client_secret) {
          const confirmResult = await stripe.confirmCardPayment(res.data.client_secret);
          if (confirmResult.error) {
            setErrorMessage(confirmResult.error.message || "Payment authentication failed.");
            setSubmitting(false);
            return;
          }

          // Reconcile on backend
          await api.post("/parent/pay", {
            payment_intent_id: confirmResult.paymentIntent.id,
            student_id: studentId,
            invoice_id: invoiceId,
            idempotency_key: idempotencyKey,
          });

          toast.success("Payment confirmed successfully!");
          if (onPaymentSuccess) onPaymentSuccess();
        }
      } else {
        // 2. Pay with New Card via Stripe Elements
        if (!elements) return;
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        // Step A: Request PaymentIntent client_secret with server-side amount calculation
        const res = await api.post("/parent/create-payment-intent", {
          student_id: studentId,
          invoice_id: invoiceId,
          amount: amount,
          idempotency_key: idempotencyKey,
        });

        const { client_secret, payment_intent_id } = res.data;
        if (!client_secret) {
          throw new Error("Could not initialize Stripe PaymentIntent.");
        }

        // Step B: Confirm payment directly with Stripe
        const confirmResult = await stripe.confirmCardPayment(client_secret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName.trim() || undefined,
            },
          },
          return_url: window.location.href,
        });

        if (confirmResult.error) {
          setErrorMessage(confirmResult.error.message || "Payment failed. Please check your card details.");
          setSubmitting(false);
          return;
        }

        // Step C: Confirm & Reconcile in Backend Ledger
        await api.post("/parent/pay", {
          payment_intent_id: confirmResult.paymentIntent.id,
          student_id: studentId,
          invoice_id: invoiceId,
          idempotency_key: idempotencyKey,
        });

        toast.success("Payment processed successfully!");
        if (onPaymentSuccess) onPaymentSuccess();
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMessage(
        err.response?.data?.error || err.message || "Payment submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePay}>
      {errorMessage && (
        <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "0.85rem" }}>
          {errorMessage}
        </div>
      )}

      {useSavedPm && selectedSavedPm ? (
        <div className="p-3 bg-light rounded-3 border mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
                  {selectedSavedPm.card_brand || "Card"} ending in •••• {selectedSavedPm.last4}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {selectedSavedPm.exp_month && selectedSavedPm.exp_year
                    ? `Expires ${String(selectedSavedPm.exp_month).padStart(2, "0")}/${selectedSavedPm.exp_year}`
                    : "Saved payment method"}
                </div>
              </div>
            </div>
            <span className="badge bg-primary px-2 py-1" style={{ fontSize: "11px" }}>
              Ready
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
              Name on Card (Optional)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              style={{ fontSize: "0.9rem" }}
            />
          </div>

          <div className="mb-4">
            <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
              Card Details <span className="text-danger">*</span>
            </label>
            <div
              className="p-3 border rounded-3 bg-white"
              style={{ borderColor: "#cbd5e1", transition: "border-color 0.2s ease" }}
            >
              <CardElement options={STRIPE_ELEMENT_OPTIONS} />
            </div>
            <div className="d-flex align-items-center gap-1 mt-2 text-muted" style={{ fontSize: "0.75rem" }}>
              <Lock size={12} className="text-success" />
              <span>Secured by Stripe 256-bit encryption. Card details are tokenized.</span>
            </div>
          </div>
        </>
      )}

      <div className="d-flex justify-content-end gap-2 pt-3 border-top">
        <button
          type="button"
          onClick={onCancel}
          className="btn-parent-outline"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-parent-primary d-flex align-items-center gap-2"
          disabled={!stripe || submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Pay ${parseFloat(amount || 0).toFixed(2)} Now</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default StripeCardPayForm;
