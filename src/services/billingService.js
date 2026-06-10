import api from "../utils/api";

export const getBillingPlans = async () => {
  try {
    const response = await api.get("/billing/plans");
    return response.data;
  } catch (error) {
    console.error("Error fetching billing plans:", error);
    throw error;
  }
};

export const saveBillingPlan = async (planData) => {
  try {
    const response = await api.post("/billing/plans", planData);
    return response.data;
  } catch (error) {
    console.error("Error saving billing plan:", error);
    throw error;
  }
};

export const getPresetItems = async () => {
  try {
    const response = await api.get("/billing/preset-items");
    return response.data;
  } catch (error) {
    console.error("Error fetching preset items:", error);
    throw error;
  }
};

export const createPresetItem = async (itemData) => {
  const response = await api.post("/billing/preset-items", itemData);
  return response.data;
};

export const updatePresetItem = async (itemId, itemData) => {
  const response = await api.put(`/billing/preset-items/${itemId}`, itemData);
  return response.data;
};

export const deletePresetItem = async (itemId) => {
  const response = await api.delete(`/billing/preset-items/${itemId}`);
  return response.data;
};

export const getPresetDiscounts = async () => {
  const response = await api.get("/billing/discounts");
  return response.data;
};

export const createPresetDiscount = async (discountData) => {
  const response = await api.post("/billing/discounts", discountData);
  return response.data;
};

export const updatePresetDiscount = async (discountId, discountData) => {
  const response = await api.put(
    `/billing/discounts/${discountId}`,
    discountData
  );
  return response.data;
};

export const deletePresetDiscount = async (discountId) => {
  const response = await api.delete(`/billing/discounts/${discountId}`);
  return response.data;
};

export const getSubscriptions = async () => {
  try {
    const response = await api.get("/billing/subscriptions");
    return response.data;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw error;
  }
};

export const createSubscriptions = async (subscriptionData) => {
  try {
    const response = await api.post("/billing/subscriptions", subscriptionData);
    return response.data;
  } catch (error) {
    console.error("Error creating subscriptions:", error);
    throw error;
  }
};

export const receivePayment = async (studentId, paymentData) => {
  try {
    const response = await api.post(
      `/billing/accounts/${studentId}/payments`,
      paymentData
    );
    return response.data;
  } catch (error) {
    console.error(`Error receiving payment for student ${studentId}:`, error);
    throw error;
  }
};

export const addCredit = async (studentId, creditData) => {
  try {
    const response = await api.post(
      `/billing/accounts/${studentId}/credits`,
      creditData
    );
    return response.data;
  } catch (error) {
    console.error(`Error adding credit for student ${studentId}:`, error);
    throw error;
  }
};

export const createInvoice = async (studentId, invoiceData) => {
  try {
    const response = await api.post(
      `/billing/accounts/${studentId}/invoices`,
      invoiceData
    );
    return response.data;
  } catch (error) {
    console.error(`Error creating invoice for student ${studentId}:`, error);
    throw error;
  }
};

export const getBillingAccounts = async () => {
  try {
    const response = await api.get("/billing/accounts");
    return response.data;
  } catch (error) {
    console.error("Error fetching billing accounts:", error);
    throw error;
  }
};

export const getStudentLedger = async (studentId) => {
  try {
    const response = await api.get(`/billing/accounts/${studentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ledger for student ${studentId}:`, error);
    throw error;
  }
};
