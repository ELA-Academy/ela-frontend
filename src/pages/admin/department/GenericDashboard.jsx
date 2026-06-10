import React, { useState, useEffect } from "react";
import PageHeader from "../../../components/admin/PageHeader";
import TaskList from "../../../components/admin/TaskList";
import StatCard from "../../../components/admin/StatCard";
import { getMyTasks } from "../../../services/taskService";
import { useAuth } from "../../../context/AuthContext";
import { Spinner, Alert } from "react-bootstrap";
import { ClipboardList } from "lucide-react";

const GenericDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const departmentName = user?.departmentNames?.[0] || "Department";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const tasksData = await getMyTasks();
        setTasks(tasksData);
      } catch (err) {
        setError("Failed to fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader title={`${departmentName} Overview`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-slate-950" />}
          title="My Active Tasks"
          value={tasks.filter((t) => t.status !== "Completed" && t.status !== "Done").length}
          colorTheme="primary"
        />
      </div>

      <TaskList tasks={tasks} title={`My ${departmentName} Tasks`} />
    </div>
  );
};

export default GenericDashboard;
