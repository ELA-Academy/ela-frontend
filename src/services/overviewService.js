import api from "../utils/api";

export const getOverviewCards = (spaceId) => api.get(`/boards/${spaceId}/overview-cards`);
export const createOverviewCard = (spaceId, data) => api.post(`/boards/${spaceId}/overview-cards`, data);
export const updateOverviewCard = (spaceId, cardId, data) => api.put(`/boards/${spaceId}/overview-cards/${cardId}`, data);
export const deleteOverviewCard = (spaceId, cardId) => api.delete(`/boards/${spaceId}/overview-cards/${cardId}`);
export const getCardAggregate = (spaceId, cardId) => api.get(`/boards/${spaceId}/overview-cards/${cardId}/aggregate`);
export const getCardData = (spaceId, cardId) => api.get(`/boards/${spaceId}/overview-cards/${cardId}/data`);
export const getSpaceChildren = (spaceId) => api.get(`/boards/${spaceId}/overview/children`);
export const getSpaceRecent = (spaceId) => api.get(`/boards/${spaceId}/overview/recent`);
export const getSpaceDocs = (spaceId) => api.get(`/boards/${spaceId}/overview/docs`);
export const getBookmarks = (spaceId) => api.get(`/boards/${spaceId}/overview/bookmarks`);
export const createBookmark = (spaceId, data) => api.post(`/boards/${spaceId}/overview/bookmarks`, data);
export const deleteBookmark = (spaceId, bookmarkId) => api.delete(`/boards/${spaceId}/overview/bookmarks/${bookmarkId}`);
export const generateReport = (spaceId) => api.post(`/boards/${spaceId}/overview/generate-report`);
