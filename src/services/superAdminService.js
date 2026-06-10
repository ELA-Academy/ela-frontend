import api from "../utils/api";

export const getSuperAdmins = async () => {
  const response = await api.get("/superadmin/admins");
  return response.data;
};

export const createSuperAdmin = async (payload) => {
  const response = await api.post("/superadmin/admins", payload);
  return response.data;
};

export const updateSuperAdmin = async (adminId, payload) => {
  const response = await api.put(`/superadmin/admins/${adminId}`, payload);
  return response.data;
};

export const deleteSuperAdmin = async (adminId) => {
  const response = await api.delete(`/superadmin/admins/${adminId}`);
  return response.data;
};
