import api from "../utils/api";

export const getBoards = async () => {
  const response = await api.get("/boards");
  return response.data;
};

export const getAllBoardTasks = async () => {
  const response = await api.get("/boards/all-tasks");
  return response.data;
};

export const createBoard = async (boardData) => {
  const response = await api.post("/boards", boardData);
  return response.data;
};

export const getBoard = async (boardId) => {
  const response = await api.get(`/boards/${boardId}`);
  return response.data;
};

export const updateBoard = async (boardId, boardData) => {
  const response = await api.put(`/boards/${boardId}`, boardData);
  return response.data;
};

export const deleteBoard = async (boardId) => {
  const response = await api.delete(`/boards/${boardId}`);
  return response.data;
};

export const createGroup = async (boardId, groupData) => {
  const response = await api.post(`/boards/${boardId}/groups`, groupData);
  return response.data;
};

export const updateGroup = async (groupId, groupData) => {
  const response = await api.put(`/boards/groups/${groupId}`, groupData);
  return response.data;
};

export const deleteGroup = async (groupId) => {
  const response = await api.delete(`/boards/groups/${groupId}`);
  return response.data;
};

export const createTask = async (groupId, taskData) => {
  const response = await api.post(`/boards/groups/${groupId}/tasks`, taskData);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await api.put(`/boards/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/boards/tasks/${taskId}`);
  return response.data;
};

export const getTaskUpdates = async (taskId) => {
  const response = await api.get(`/boards/tasks/${taskId}/updates`);
  return response.data;
};

export const createTaskUpdate = async (taskId, updateData) => {
  const response = await api.post(`/boards/tasks/${taskId}/updates`, updateData);
  return response.data;
};

export const toggleLike = async (updateId) => {
  const response = await api.post(`/boards/updates/${updateId}/like`);
  return response.data;
};

export const createReply = async (updateId, replyData) => {
  const response = await api.post(`/boards/updates/${updateId}/reply`, replyData);
  return response.data;
};

export const addTaskChecklistItem = async (taskId, title) => {
  const response = await api.post(`/boards/tasks/${taskId}/checklists`, { title });
  return response.data;
};

export const updateChecklistItem = async (itemId, data) => {
  const response = await api.put(`/boards/tasks/checklists/${itemId}`, data);
  return response.data;
};

export const deleteChecklistItem = async (itemId) => {
  const response = await api.delete(`/boards/tasks/checklists/${itemId}`);
  return response.data;
};

export const addTaskWatcher = async (taskId, watcherId, watcherRole) => {
  const response = await api.post(`/boards/tasks/${taskId}/watchers`, { watcher_id: watcherId, watcher_role: watcherRole });
  return response.data;
};

export const removeTaskWatcher = async (taskId, watcherId, watcherRole) => {
  const response = await api.delete(`/boards/tasks/${taskId}/watchers`, {
    params: { watcher_id: watcherId, watcher_role: watcherRole }
  });
  return response.data;
};

export const uploadTaskAttachment = async (taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/boards/tasks/${taskId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const deleteTaskAttachment = async (attachmentId) => {
  const response = await api.delete(`/boards/tasks/attachments/${attachmentId}`);
  return response.data;
};

export const getTaskHistory = async (taskId) => {
  const response = await api.get(`/boards/tasks/${taskId}/history`);
  return response.data;
};

export const getTaskTemplates = async () => {
  const response = await api.get("/boards/task-templates");
  return response.data;
};

export const createTaskTemplate = async (templateData) => {
  const response = await api.post("/boards/task-templates", templateData);
  return response.data;
};

export const deleteTaskTemplate = async (templateId) => {
  const response = await api.delete(`/boards/task-templates/${templateId}`);
  return response.data;
};

export const getCalendarEvents = async (params) => {
  const response = await api.get("/boards/calendar-events", { params });
  return response.data;
};

export const createCalendarEvent = async (eventData) => {
  const response = await api.post("/boards/calendar-events", eventData);
  return response.data;
};

export const updateCalendarEvent = async (eventId, eventData) => {
  const response = await api.put(`/boards/calendar-events/${eventId}`, eventData);
  return response.data;
};

export const deleteCalendarEvent = async (eventId) => {
  const response = await api.delete(`/boards/calendar-events/${eventId}`);
  return response.data;
};

export const getCalendarTasks = async (params) => {
  const response = await api.get("/boards/calendar-tasks", { params });
  return response.data;
};

export const getTaskTimeEntries = async (taskId) => {
  const response = await api.get(`/boards/tasks/${taskId}/time-entries`);
  return response.data;
};

export const createTaskTimeEntry = async (taskId, data) => {
  const response = await api.post(`/boards/tasks/${taskId}/time-entries`, data);
  return response.data;
};

export const deleteTaskTimeEntry = async (entryId) => {
  const response = await api.delete(`/boards/time-entries/${entryId}`);
  return response.data;
};

export const updateTaskTimeEstimate = async (taskId, timeEstimateMinutes) => {
  const response = await api.put(`/boards/tasks/${taskId}/time-estimate`, {
    time_estimate_minutes: timeEstimateMinutes,
  });
  return response.data;
};

export const getWorkspaceDocs = async (boardId) => {
  const response = await api.get(`/boards/${boardId}/docs`);
  return response.data;
};

export const createWorkspaceDoc = async (boardId, docData) => {
  const response = await api.post(`/boards/${boardId}/docs`, docData);
  return response.data;
};

export const updateWorkspaceDoc = async (docId, docData) => {
  const response = await api.put(`/boards/docs/${docId}`, docData);
  return response.data;
};

export const deleteWorkspaceDoc = async (docId) => {
  const response = await api.delete(`/boards/docs/${docId}`);
  return response.data;
};

export const getAllWorkspaceDocs = async () => {
  const response = await api.get("/boards/docs");
  return response.data;
};

