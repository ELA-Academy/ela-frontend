import api from "../utils/api";

// Fetch the current user's profile data
export const getMyProfile = async () => {
  try {
    const response = await api.get("/profile");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Update user direct deposit payment method
export const updatePaymentMethod = async (paymentData) => {
  try {
    const response = await api.put("/profile/payment-method", paymentData);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating payment method:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Update the current user's password
export const changePassword = async (passwordData) => {
  try {
    const response = await api.put("/profile/change-password", passwordData);
    return response.data;
  } catch (error) {
    console.error(
      "Error changing password:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Update personal details (staff/teacher self-service: pronouns, optional SSN, DOB, phone, address, emergency contact)
export const updateMyPersonalDetails = async (personalData) => {
  try {
    const response = await api.put("/profile/personal", personalData);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating personal details:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Update profile details
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put("/profile/update", profileData);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};
