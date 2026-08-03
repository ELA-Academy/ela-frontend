import React from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../../../components/admin/PageHeader";
import StatCard from "../../../components/admin/StatCard";
import { useAdmissions } from "../../../components/admin/admissions/AdmissionsLayout";
import { Table } from "react-bootstrap";
import { CardSkeleton } from "../../../components/Skeleton";
import {
  BookOpen,
  UserPlus,
  RefreshCw,
  UserCheck
} from "lucide-react";

const AdmissionsDashboard = () => {
  const navigate = useNavigate();
  const { leads, loading: leadsLoading } = useAdmissions();

  if (leadsLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Admissions Overview" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  const total = leads.length;
  const waitlisted = leads.filter((l) => l.status === "Waitlisted").length;
  const inProgress = leads.filter(
    (l) =>
      l.status === "Interested" ||
      l.status === "Toured" ||
      l.status === "Admitted"
  ).length;
  const enrolled = leads.filter((l) => l.status === "Enrolled").length;

  const stats = { total, waitlisted, inProgress, enrolled };

  const getLeadName = (lead) => {
    if (lead.students && lead.students.length > 0) {
      return lead.students.map((s) => `${s.first_name} ${s.last_name}`).join(", ");
    }
    return "Unknown Student";
  };

  const getParentName = (lead) => {
    if (lead.parents && lead.parents.length > 0) {
      return lead.parents.map((p) => `${p.first_name} ${p.last_name}`).join(", ");
    }
    return "N/A";
  };

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
            onClick={() => navigate("/admin/admissions/leads")}
          />
          <StatCard
            icon={<UserPlus className="w-5 h-5 text-sky-600" />}
            title="New Leads (Waitlisted)"
            value={stats.waitlisted}
            colorTheme="info"
            onClick={() => navigate("/admin/admissions/leads")}
          />
          <StatCard
            icon={<RefreshCw className="w-5 h-5 text-amber-600" />}
            title="In Progress"
            value={stats.inProgress}
            colorTheme="warning"
            onClick={() => navigate("/admin/admissions/leads")}
          />
          <StatCard
            icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
            title="Enrolled"
            value={stats.enrolled}
            colorTheme="success"
            onClick={() => navigate("/admin/admissions/leads")}
          />
        </div>
      )}

      {/* New Leads Visibility Section */}
      <div className="content-card mt-4">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h3 className="h6 fw-bold mb-0 text-slate-800">Recent Applications / Leads</h3>
          <Link to="/admin/admissions/leads" className="text-primary fw-bold text-decoration-none" style={{ fontSize: '0.85rem' }}>
            View All Leads →
          </Link>
        </div>
        <Table responsive className="modern-table mb-0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student Name(s)</th>
              <th>Parent(s)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 5).map((lead) => (
              <tr key={lead.id} onClick={() => navigate(`/admin/admissions/leads/${lead.secure_token}`)} style={{ cursor: "pointer" }}>
                <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                <td className="fw-bold text-primary">{getLeadName(lead)}</td>
                <td>{getParentName(lead)}</td>
                <td>
                  <span className={`status-badge status-${lead.status.toLowerCase().replace(" ", "-")}`}>
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-muted">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default AdmissionsDashboard;
