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

export const getStudentDocuments = async (studentId) => {
  try {
    const response = await api.get(`/students/${studentId}/documents`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching student documents for ${studentId}:`, error);
    throw error;
  }
};

export const uploadStudentDocument = async (studentId, formData) => {
  try {
    const response = await api.post(`/students/${studentId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error uploading document for student ${studentId}:`, error);
    throw error;
  }
};

export const deleteStudentDocument = async (docId) => {
  try {
    const response = await api.delete(`/students/documents/${docId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting document ${docId}:`, error);
    throw error;
  }
};
