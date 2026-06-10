import api from "../utils/api";

// Fetch all departments from the API
export const getAllDepartments = async () => {
  try {
    const response = await api.get("/departments");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching departments:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Create a new department
export const createDepartment = async (departmentData) => {
  try {
    const response = await api.post("/departments", departmentData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating department:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Update an existing department by its ID
export const updateDepartment = async (id, departmentData) => {
  try {
    const response = await api.put(`/departments/${id}`, departmentData);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating department ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Delete a department by its ID
export const deleteDepartment = async (id) => {
  try {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting department ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
