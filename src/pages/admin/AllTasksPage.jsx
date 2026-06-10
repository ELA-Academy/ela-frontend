import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "../../components/admin/PageHeader";
import TaskList from "../../components/admin/TaskList";
import EditTaskModal from "../../components/admin/EditTaskModal";
import { getMyTasks } from "../../services/taskService";
import { Spinner, Alert } from "react-bootstrap";

const AllTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyTasks();
      setTasks(data);
    } catch (err) {
      setError("Failed to fetch tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleEditTask = (task) => {
    setCurrentTask(task);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setCurrentTask(null);
    setShowEditModal(false);
  };

  const handleTaskUpdated = () => {
    fetchTasks(); // Refetch all tasks to get the latest data
  };

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <PageHeader title="My Tasks" />
      <TaskList
        tasks={tasks}
        title="All Assigned Tasks"
        onEditTask={handleEditTask}
        onTaskUpdated={handleTaskUpdated}
      />
      {currentTask && (
        <EditTaskModal
          show={showEditModal}
          handleClose={handleCloseModal}
          task={currentTask}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </>
  );
};

export default AllTasksPage;
