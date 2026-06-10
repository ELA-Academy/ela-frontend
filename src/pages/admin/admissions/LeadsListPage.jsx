import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dropdown, Button } from "react-bootstrap";
import { ThreeDotsVertical, PersonCheckFill } from "react-bootstrap-icons";
import {
  getAllLeads,
  convertLeadToStudent,
} from "../../../services/admissionsService";
import { showSuccess, showError } from "../../../utils/notificationService";
import PageHeader from "../../../components/admin/PageHeader";
import { TableSkeleton } from "../../../components/Skeleton";
import "../../../styles/AdminModern.css";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="text-muted"
  >
    {children}
  </a>
));

const LeadsListPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await getAllLeads();
      setLeads(data);
    } catch (err) {
      setError("Failed to fetch leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteTargetId, setPromoteTargetId] = useState(null);
  const [promoting, setPromoting] = useState(false);

  const handlePromoteClick = (leadId) => {
    setPromoteTargetId(leadId);
    setShowPromoteModal(true);
  };

  const handleConfirmPromote = async () => {
    setPromoting(true);
    try {
      await convertLeadToStudent(promoteTargetId);
      showSuccess("Lead successfully promoted to student!");
      setShowPromoteModal(false);
      setPromoteTargetId(null);
      fetchLeads();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to promote lead.");
    } finally {
      setPromoting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Date(dateString)
      .toLocaleString("en-US", options)
      .replace(",", "");
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Manage Leads" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <PageHeader title={`Manage Leads (${leads.length})`} />
      <div className="content-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Created Date</th>
              <th>Student Name(s)</th>
              <th>Parent(s)</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{formatDate(lead.created_at)}</td>
                  <td>
                    <Link
                      to={`/admin/admissions/leads/${lead.secure_token}`}
                      className="text-primary fw-bold"
                    >
                      {lead.students
                        .map((s) => `${s.first_name} ${s.last_name}`)
                        .join(", ")}
                    </Link>
                  </td>
                  <td>
                    {lead.parents
                      .map((p) => `${p.first_name} ${p.last_name}`)
                      .join(", ")}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${lead.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <Dropdown align="end">
                      <Dropdown.Toggle as={CustomToggle}>
                        <ThreeDotsVertical size={20} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          as={Link}
                          to={`/admin/admissions/leads/${lead.secure_token}`}
                        >
                          View Details
                        </Dropdown.Item>
                        {lead.status !== "Enrolled" && (
                          <Dropdown.Item onClick={() => handlePromoteClick(lead.id)}>
                            <PersonCheckFill className="me-2" /> Promote to
                            Student
                          </Dropdown.Item>
                        )}
                        <Dropdown.Divider />
                        <Dropdown.Item href="#" className="text-danger">
                          Archive Lead
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-5">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DeleteConfirmModal
        show={showPromoteModal}
        onHide={() => {
          setShowPromoteModal(false);
          setPromoteTargetId(null);
        }}
        onConfirm={handleConfirmPromote}
        title="Promote Lead to Student"
        message="Are you sure you want to promote this lead to a permanent student record? This is the final step before billing can begin."
        confirmText="Promote"
        loading={promoting}
      />
    </div>
  );
};

export default LeadsListPage;
