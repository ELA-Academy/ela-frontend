import { loadStripe } from "@stripe/stripe-js";
import api from "./api";

let stripePromise = null;

export const getStripe = async () => {
  if (!stripePromise) {
    let pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!pubKey) {
      try {
        const res = await api.get("/parent/stripe-config");
        if (res.data && res.data.publishable_key) {
          pubKey = res.data.publishable_key;
        }
      } catch (err) {
        console.warn("Could not fetch publishable key from API:", err);
      }
    }

    if (pubKey) {
      stripePromise = loadStripe(pubKey);
    } else {
      console.error("Stripe Publishable Key is not configured.");
    }
  }
  return stripePromise;
};

export const STRIPE_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#0f172a",
      fontFamily: "'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "::placeholder": {
        color: "#94a3b8",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
};
