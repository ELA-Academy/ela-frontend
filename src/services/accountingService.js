import api from "../utils/api";

// Get overview stats for the accounting dashboard
export const getAccountingOverview = async () => {
  try {
    const response = await api.get("/accounting/overview");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching accounting overview:",
      error.response?.data || error.message
    );
    throw error;
  }
};
