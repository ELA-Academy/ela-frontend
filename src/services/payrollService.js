import api from "../utils/api";

// ==========================================
// Employee / Contractor Portal (/my/*)
// ==========================================

export const getMyTimeEntries = async (weekStart) => {
  const params = weekStart ? { week_start: weekStart } : {};
  const res = await api.get("/payroll/my/time-entries", { params });
  return res.data;
};

export const createMyTimeEntry = async (payload) => {
  const res = await api.post("/payroll/my/time-entries", payload);
  return res.data;
};

export const updateMyTimeEntry = async (entryId, payload) => {
  const res = await api.put(`/payroll/my/time-entries/${entryId}`, payload);
  return res.data;
};

export const deleteMyTimeEntry = async (entryId) => {
  const res = await api.delete(`/payroll/my/time-entries/${entryId}`);
  return res.data;
};

export const updateMyTimezone = async (timezone) => {
  const res = await api.put("/payroll/my/timezone", { timezone });
  return res.data;
};

export const getMyPayHistory = async () => {
  const res = await api.get("/payroll/my/pay-history");
  return res.data;
};

export const getMyPayrollAccess = async () => {
  const res = await api.get("/payroll/my-access");
  return res.data;
};

export const getMyDocuments = async () => {
  const res = await api.get("/payroll/my/documents");
  return res.data;
};

export const getMyDocumentDetail = async (assignmentId) => {
  const res = await api.get(`/payroll/my/documents/${assignmentId}`);
  return res.data;
};

export const signMyDocument = async (assignmentId, payload) => {
  const res = await api.post(`/payroll/my/documents/${assignmentId}/sign`, payload);
  return res.data;
};

export const getMyPerformance = async () => {
  const res = await api.get("/payroll/my/performance");
  return res.data;
};

export const submitMyReview = async (reviewId, payload) => {
  const res = await api.post(`/payroll/my/performance/reviews/${reviewId}/submit`, payload);
  return res.data;
};

// ==========================================
// Admin Time Tracking & Settings
// ==========================================

export const getAdminTimeSettings = async () => {
  const res = await api.get("/payroll/admin/settings");
  return res.data;
};

export const updateAdminTimeSettings = async (payload) => {
  const res = await api.put("/payroll/admin/settings", payload);
  return res.data;
};

export const getTimeAssignments = async () => {
  const res = await api.get("/payroll/admin/time-assignments");
  return res.data;
};

export const updateTimeAssignments = async (payload) => {
  const res = await api.put("/payroll/admin/time-assignments", payload);
  return res.data;
};

export const getAdminTimesheets = async (startDate, endDate) => {
  const res = await api.get("/payroll/admin/timesheets", {
    params: { start_date: startDate, end_date: endDate },
  });
  return res.data;
};

export const getAdminStaffTimesheet = async (staffId, startDate, endDate) => {
  const res = await api.get(`/payroll/admin/timesheets/${staffId}`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return res.data;
};

export const adminAddShift = async (staffId, payload) => {
  const res = await api.post(`/payroll/admin/timesheets/${staffId}/shifts`, payload);
  return res.data;
};

export const adminUpdateShift = async (shiftId, payload) => {
  const res = await api.put(`/payroll/admin/timesheets/shifts/${shiftId}`, payload);
  return res.data;
};

export const adminDeleteShift = async (shiftId) => {
  const res = await api.delete(`/payroll/admin/timesheets/shifts/${shiftId}`);
  return res.data;
};

export const adminSyncTimesheets = async (payload) => {
  const res = await api.post("/payroll/admin/timesheets/sync", payload);
  return res.data;
};

// ==========================================
// Admin Payroll Runs & History
// ==========================================

export const previewPayrollRun = async (params) => {
  const res = await api.get("/payroll/admin/pay/preview", { params });
  return res.data;
};

export const submitPayrollRun = async (payload) => {
  const res = await api.post("/payroll/admin/pay/run", payload);
  return res.data;
};

export const getPayrollHistory = async () => {
  const res = await api.get("/payroll/admin/pay/history");
  return res.data;
};

export const getPaymentItemDetail = async (itemId) => {
  const res = await api.get(`/payroll/admin/pay/items/${itemId}`);
  return res.data;
};

// ==========================================
// Admin People (Onboard / Dismiss / Reactivate)
// ==========================================

export const onboardStaffMember = async (payload) => {
  const res = await api.post("/payroll/admin/people/onboard", payload);
  return res.data;
};

export const dismissStaffMember = async (staffId, payload) => {
  const res = await api.post(`/payroll/admin/people/${staffId}/dismiss`, payload);
  return res.data;
};

export const reactivateStaffMember = async (staffId) => {
  const res = await api.post(`/payroll/admin/people/${staffId}/reactivate`);
  return res.data;
};

// ==========================================
// Admin Documents (Shared, Artifacts, Reminders)
// ==========================================

export const getAdminDocuments = async () => {
  const res = await api.get("/payroll/admin/documents");
  return res.data;
};

export const uploadPayrollDocumentPdf = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/payroll/admin/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const getPayrollDocumentFileUrl = (docId) => {
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const token = localStorage.getItem("authToken") || "";
  return `${base}/payroll/documents/${docId}/file?token=${encodeURIComponent(token)}`;
};

export const getAdminDocumentDetail = async (docId) => {
  const res = await api.get(`/payroll/admin/documents/${docId}`);
  return res.data;
};

export const getAdminAssignmentDetail = async (assignmentId) => {
  const res = await api.get(`/payroll/admin/documents/assignments/${assignmentId}`);
  return res.data;
};

export const getStaffDocumentsForAdmin = async (staffId) => {
  const res = await api.get(`/payroll/admin/documents/staff/${staffId}`);
  return res.data;
};

export const remindAllStaffDocuments = async (staffId) => {
  const res = await api.post(`/payroll/admin/documents/staff/${staffId}/remind-all`);
  return res.data;
};

export const createAdminDocument = async (payload) => {
  const res = await api.post("/payroll/admin/documents", payload);
  return res.data;
};

export const updateAdminDocument = async (docId, payload) => {
  const res = await api.put(`/payroll/admin/documents/${docId}`, payload);
  return res.data;
};

export const updateDocumentRecipients = async (docId, payload) => {
  const res = await api.post(`/payroll/admin/documents/${docId}/recipients`, payload);
  return res.data;
};

export const remindDocumentAssignment = async (assignmentId) => {
  const res = await api.post(`/payroll/admin/documents/assignments/${assignmentId}/remind`);
  return res.data;
};

// ==========================================
// Admin Reports & Performance
// ==========================================

export const getContractorPaymentsReport = async (params) => {
  const res = await api.get("/payroll/admin/reports/contractor-payments", { params });
  return res.data;
};

export const getAdminPerformance = async () => {
  const res = await api.get("/payroll/admin/performance");
  return res.data;
};

export const createPerformanceGoal = async (payload) => {
  const res = await api.post("/payroll/admin/performance/goals", payload);
  return res.data;
};

export const createPerformanceReview = async (payload) => {
  const res = await api.post("/payroll/admin/performance/reviews", payload);
  return res.data;
};

// ==========================================
// Super Admin Co-Admin Access & Feature Blocking
// ==========================================

export const getPayrollAccessList = async () => {
  const res = await api.get("/payroll/admin/access");
  return res.data;
};

export const grantPayrollAccess = async (payload) => {
  const res = await api.post("/payroll/admin/access", payload);
  return res.data;
};

export const updatePayrollAccess = async (accessId, payload) => {
  const res = await api.put(`/payroll/admin/access/${accessId}`, payload);
  return res.data;
};

export const revokePayrollAccess = async (accessId) => {
  const res = await api.delete(`/payroll/admin/access/${accessId}`);
  return res.data;
};

// ==========================================
// Payment Enumeration & Cumulative Pay
// ==========================================

export const getPaymentEnumeration = async () => {
  const res = await api.get("/payroll/admin/enumeration");
  return res.data;
};

export const updatePaymentEnumeration = async (staffId, payload) => {
  const res = await api.put(`/payroll/admin/enumeration/${staffId}`, payload);
  return res.data;
};

export const getCumulativePayReport = async (params) => {
  const res = await api.get("/payroll/admin/reports/cumulative-pay", { params });
  return res.data;
};
