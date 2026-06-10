import api from "../utils/api";

export const getSubsidies = async () => {
  try {
    const response = await api.get("/subsidies/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createSubsidy = async (subsidyData) => {
  try {
    const response = await api.post("/subsidies/", subsidyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSubsidyDetails = async (subsidyId) => {
  try {
    const response = await api.get(`/subsidies/${subsidyId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const receiveSubsidyPayment = async (subsidyId, paymentData) => {
  try {
    const response = await api.post(
      `/subsidies/${subsidyId}/transactions`,
      paymentData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
