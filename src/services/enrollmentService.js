import api from "../utils/api";
import axios from "axios";

// This creates a separate axios instance for public routes
const publicApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

export const getPublicEnrollmentForm = async (token) => {
  try {
    const response = await publicApi.get(
      `/enrollment/public/submission/${token}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching public enrollment form:", error);
    throw error;
  }
};

export const submitEnrollmentForm = async (token, responses) => {
  try {
    const response = await publicApi.post(
      `/enrollment/public/submission/${token}`,
      { responses }
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting enrollment form:", error);
    throw error;
  }
};

export const getEnrollmentForms = async () => {
  try {
    const response = await api.get("/enrollment/forms");
    return response.data;
  } catch (error) {
    console.error("Error fetching enrollment forms:", error);
    throw error;
  }
};

export const getEnrollmentSubmissions = async () => {
  try {
    const response = await api.get("/enrollment/submissions");
    return response.data;
  } catch (error) {
    console.error("Error fetching enrollment submissions:", error);
    throw error;
  }
};

export const deleteEnrollmentSubmission = async (submissionId) => {
  try {
    const response = await api.delete(
      `/enrollment/submissions/${submissionId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting submission ${submissionId}:`, error);
    throw error;
  }
};

export const resendSubmissionEmail = async (submissionId) => {
  try {
    const response = await api.post(
      `/enrollment/submissions/${submissionId}/resend`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error resending email for submission ${submissionId}:`,
      error
    );
    throw error;
  }
};

export const getFormById = async (formId) => {
  try {
    const response = await api.get(`/enrollment/forms/${formId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching form ${formId}:`, error);
    throw error;
  }
};

export const updateForm = async (formId, formData) => {
  try {
    const response = await api.put(`/enrollment/forms/${formId}`, formData);
    return response.data;
  } catch (error) {
    console.error(`Error updating form ${formId}:`, error);
    throw error;
  }
};

export const createEnrollmentForm = async () => {
  try {
    const response = await api.post("/enrollment/forms");
    return response.data;
  } catch (error) {
    console.error("Error creating enrollment form:", error);
    throw error;
  }
};

export const deleteEnrollmentForm = async (formId) => {
  try {
    const response = await api.delete(`/enrollment/forms/${formId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting form ${formId}:`, error);
    throw error;
  }
};

export const copyEnrollmentForm = async (formId) => {
  try {
    const response = await api.post(`/enrollment/forms/${formId}/copy`);
    return response.data;
  } catch (error) {
    console.error(`Error copying form ${formId}:`, error);
    throw error;
  }
};

export const getPotentialRecipients = async (recipientType) => {
  try {
    const response = await api.get(
      `/enrollment/potential-recipients?type=${recipientType}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching potential recipients:", error);
    throw error;
  }
};

export const sendFormToRecipients = async (formId, leadIds) => {
  try {
    const response = await api.post(`/enrollment/forms/${formId}/send`, {
      lead_ids: leadIds,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending form:", error);
    throw error;
  }
};
