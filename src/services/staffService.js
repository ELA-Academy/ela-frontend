import api from "../utils/api";

export const getAllStaff = async () => {
  try {
    const response = await api.get("/staff");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching staff:",
      error.response?.data || error.message
    );
    throw error;
  }
};
