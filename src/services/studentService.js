import api from "../utils/api";

export const getAllStudents = async () => {
  try {
    const response = await api.get("/students/");
    return response.data;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

export const getStudentById = async (studentId) => {
  try {
    const response = await api.get(`/students/${studentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching student ${studentId}:`, error);
    throw error;
  }
};
