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

// Preview family directory import
export const previewFamilyImport = async (payloadOrFormData) => {
  try {
    let response;
    if (payloadOrFormData instanceof FormData) {
      response = await api.post("/parent/admin/preview-family-import", payloadOrFormData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } else {
      response = await api.post("/parent/admin/preview-family-import", payloadOrFormData || { use_default_file: true });
    }
    return response.data;
  } catch (error) {
    console.error("Error previewing family import:", error.response?.data || error.message);
    throw error;
  }
};

// Execute family directory import
export const importFamilies = async (payloadOrFormData) => {
  try {
    let response;
    if (payloadOrFormData instanceof FormData) {
      response = await api.post("/parent/admin/import-families", payloadOrFormData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } else {
      response = await api.post("/parent/admin/import-families", payloadOrFormData || { use_default_file: true });
    }
    return response.data;
  } catch (error) {
    console.error("Error executing family import:", error.response?.data || error.message);
    throw error;
  }
};

