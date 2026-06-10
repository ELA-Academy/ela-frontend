import api from "../utils/api";

// Get overview stats for the administration dashboard
export const getAdministrationOverview = async () => {
  try {
    const response = await api.get("/administration/overview");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching administration overview:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Get all message logs for the administration department
export const getMessageLogs = async () => {
  try {
    const response = await api.get("/administration/message-log");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching message logs:",
      error.response?.data || error.message
    );
    throw error;
  }
};
