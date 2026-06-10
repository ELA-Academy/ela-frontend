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
