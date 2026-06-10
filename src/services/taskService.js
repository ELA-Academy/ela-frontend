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
