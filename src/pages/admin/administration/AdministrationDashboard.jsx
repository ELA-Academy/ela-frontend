import React, { useState, useEffect } from "react";
import PageHeader from "../../../components/admin/PageHeader";
import TaskList from "../../../components/admin/TaskList";
import StatCard from "../../../components/admin/StatCard";
import { getAdministrationOverview } from "../../../services/administrationService";
import { getMyTasks } from "../../../services/taskService";
import { Spinner, Alert } from "react-bootstrap";
import {
  UserCheck,
  Calendar,
  Building2,
  Headphones
} from "lucide-react";

const AdministrationDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [overviewData, tasksData] = await Promise.all([
          getAdministrationOverview(),
          getMyTasks(),
        ]);

        setStats(overviewData);
        setTasks(tasksData);
      } catch (err) {
        setError(
          "Failed to fetch administration data. Please try again later."
        );
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
      <PageHeader title="Administration Overview" />
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<UserCheck className="w-5 h-5 text-slate-900" />}
            title="Staff Onboarded"
            value={stats.total_staff_onboarded}
            colorTheme="primary"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-emerald-600" />}
            title="Upcoming Events"
            value={stats.upcoming_events}
            colorTheme="success"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5 text-sky-600" />}
            title="Facility Requests"
            value={stats.facility_requests}
            colorTheme="info"
          />
          <StatCard
            icon={<Headphones className="w-5 h-5 text-amber-600" />}
            title="Open Support Tickets"
            value={stats.open_support_tickets}
            colorTheme="warning"
          />
        </div>
      )}
      <TaskList tasks={tasks} title="My Administration Tasks" />
    </div>
  );
};

export default AdministrationDashboard;
