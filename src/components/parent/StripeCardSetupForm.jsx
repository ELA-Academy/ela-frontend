import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ShieldCheck, Lock, Loader2 } from "lucide-react";
import { STRIPE_ELEMENT_OPTIONS } from "../../utils/stripe";
import api from "../../utils/api";
import { toast } from "react-toastify";

const StripeCardSetupForm = ({ onPaymentMethodSaved, onCancel, isDefault = true }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    if (!cardholderName.trim()) {
      setErrorMessage("Please enter the name on the card.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      // 1. Generate client-side idempotency key for SetupIntent
      const idempotencyKey = `setup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 2. Request SetupIntent from Backend
      const res = await api.post("/parent/create-setup-intent", {
        idempotency_key: idempotencyKey
      });

      const { client_secret } = res.data;
      if (!client_secret) {
        throw new Error("Could not initialize Stripe setup intent.");
      }

      // 3. Confirm Card Setup directly with Stripe (Zero card data reaches our backend)
      const setupResult = await stripe.confirmCardSetup(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName.trim(),
          },
        },
      });

      if (setupResult.error) {
        setErrorMessage(setupResult.error.message || "Card setup failed. Please check the details.");
        setSubmitting(false);
        return;
      }

      const paymentMethodId = setupResult.setupIntent.payment_method;

      // 4. Send ONLY the tokenized payment_method_id to our backend
      await api.post("/parent/payment-methods/save-stripe", {
        payment_method_id: paymentMethodId,
        is_default: isDefault
      });

      toast.success("Payment method saved securely!");
      if (onPaymentMethodSaved) {
        onPaymentMethodSaved();
      }
    } catch (err) {
      console.error("Setup card error:", err);
      setErrorMessage(err.response?.data?.error || err.message || "Failed to save card. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && (
        <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "0.85rem" }}>
          {errorMessage}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
          Name on Card <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. Jane Doe"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
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
          <span>Encrypted with 256-bit SSL. Card numbers never touch our servers.</span>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 pt-2 border-top">
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
              <span>Saving Securely...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Save Payment Method</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default StripeCardSetupForm;
