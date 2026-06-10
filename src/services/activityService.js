import api from "../utils/api";

export const getActivityLogs = async () => {
  try {
    const response = await api.get("/activity/logs");
    return response.data;
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    throw error;
  }
};
