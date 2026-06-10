import React, { useState, useEffect } from "react";
import PageHeader from "../../../components/admin/PageHeader";
import TaskList from "../../../components/admin/TaskList";
import StatCard from "../../../components/admin/StatCard";
import { getAllLeads } from "../../../services/admissionsService";
import { getMyTasks } from "../../../services/taskService";
import { Alert } from "react-bootstrap";
import { CardSkeleton } from "../../../components/Skeleton";
import {
  BookOpen,
  UserPlus,
  RefreshCw,
  UserCheck
} from "lucide-react";

const AdmissionsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [leadsData, tasksData] = await Promise.all([
          getAllLeads(),
          getMyTasks(),
        ]);

        const total = leadsData.length;
        const waitlisted = leadsData.filter(
          (l) => l.status === "Waitlisted"
        ).length;
        const inProgress = leadsData.filter(
          (l) =>
            l.status === "Interested" ||
            l.status === "Toured" ||
            l.status === "Admitted"
        ).length;
        const enrolled = leadsData.filter(
          (l) => l.status === "Enrolled"
        ).length;

        setStats({ total, waitlisted, inProgress, enrolled });
        setTasks(tasksData);
      } catch (err) {
        setError(
          "Failed to fetch admissions overview data. Please try again later."
        );
        console.error("Admissions dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Admissions Overview" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader title="Admissions Overview" />

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-slate-900" />}
            title="Total Leads"
            value={stats.total}
            colorTheme="primary"
          />
          <StatCard
            icon={<UserPlus className="w-5 h-5 text-sky-600" />}
            title="New Leads (Waitlisted)"
            value={stats.waitlisted}
            colorTheme="info"
          />
          <StatCard
            icon={<RefreshCw className="w-5 h-5 text-amber-600" />}
            title="In Progress"
            value={stats.inProgress}
            colorTheme="warning"
          />
          <StatCard
            icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
            title="Enrolled"
            value={stats.enrolled}
            colorTheme="success"
          />
        </div>
      )}

      <TaskList tasks={tasks} title="My Admissions Tasks" />
    </div>
  );
};

export default AdmissionsDashboard;
