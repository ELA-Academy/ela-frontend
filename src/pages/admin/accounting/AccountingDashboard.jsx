import React, { useState, useEffect } from "react";
import PageHeader from "../../../components/admin/PageHeader";
import TaskList from "../../../components/admin/TaskList";
import StatCard from "../../../components/admin/StatCard";
import { getAccountingOverview } from "../../../services/accountingService";
import { getMyTasks } from "../../../services/taskService";
import { Spinner, Alert } from "react-bootstrap";
import {
  DollarSign,
  FileText,
  History,
  TrendingDown
} from "lucide-react";

const AccountingDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAccountingData = async () => {
      try {
        setLoading(true);
        setError("");
        const [overviewData, tasksData] = await Promise.all([
          getAccountingOverview(),
          getMyTasks(),
        ]);

        setStats(overviewData);
        setTasks(tasksData);
      } catch (err) {
        setError("Failed to fetch accounting data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccountingData();
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
      <PageHeader title="Accounting Overview" />
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            title="Total Revenue"
            value={`$${stats.total_revenue}`}
            colorTheme="success"
          />
          <StatCard
            icon={<FileText className="w-5 h-5 text-sky-600" />}
            title="Pending Invoices"
            value={stats.pending_invoices}
            colorTheme="info"
          />
          <StatCard
            icon={<History className="w-5 h-5 text-amber-600" />}
            title="Overdue Payments"
            value={stats.overdue_payments}
            colorTheme="warning"
          />
          <StatCard
            icon={<TrendingDown className="w-5 h-5 text-slate-900" />}
            title="Total Expenses"
            value={`$${stats.total_expenses}`}
            colorTheme="primary"
          />
        </div>
      )}
      <TaskList tasks={tasks} title="My Accounting Tasks" />
    </div>
  );
};

export default AccountingDashboard;
