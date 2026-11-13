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

export const getStaffById = async (id) => {
  try {
    const response = await api.get(`/staff/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching staff ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateStaff = async (id, staffData) => {
  try {
    const response = await api.put(`/staff/${id}`, staffData);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating staff ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateStaffCompensation = async (id, compData) => {
  try {
    const response = await api.put(`/staff/${id}/compensation`, compData);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating compensation for staff ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
