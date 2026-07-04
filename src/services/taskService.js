import api from "../utils/api";

// Get tasks assigned to the current logged-in user or their department
export const getMyTasks = async () => {
  try {
    const response = await api.get("/tasks/my-tasks");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching assigned tasks:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getActiveTasksCount = async () => {
  try {
    const response = await api.get("/tasks/my-tasks/count");
    return response.data.count;
  } catch (error) {
    console.error("Error fetching active tasks count:", error);
    return 0; // Return 0 on error
  }
};

// Update the status of a specific task
export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await api.put(`/tasks/${taskId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(
      `Error updating task ${taskId} status:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Fully update a task's details, including assignments
export const updateTask = async (taskId, taskData) => {
  try {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating task ${taskId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getPersonalBoard = () => api.get('/tasks/personal-board').then(r => r.data);
export const createPersonalList = (data) => api.post('/tasks/personal-lists', data).then(r => r.data);
export const createPersonalTask = (data) => api.post('/tasks/personal-tasks', data).then(r => r.data);
export const updatePersonalList = (listId, data) => api.put(`/tasks/personal-lists/${listId}`, data).then(r => r.data);
export const deletePersonalList = (listId) => api.delete(`/tasks/personal-lists/${listId}`).then(r => r.data);
export const updatePersonalTask = (taskId, data) => api.put(`/tasks/personal-tasks/${taskId}`, data).then(r => r.data);
export const deletePersonalTask = (taskId) => api.delete(`/tasks/personal-tasks/${taskId}`).then(r => r.data);
