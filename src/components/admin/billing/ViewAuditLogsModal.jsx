import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Spinner, Badge } from "react-bootstrap";
import { getFinancialAuditLogs } from "../../../services/billingService";
import { showError } from "../../../utils/notificationService";

const ViewAuditLogsModal = ({ show, handleClose, studentId, studentName }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show && studentId) {
      const fetchLogs = async () => {
        try {
          setLoading(true);
          const data = await getFinancialAuditLogs(studentId);
          setLogs(data);
        } catch (err) {
          showError("Failed to fetch financial audit logs.");
        } finally {
          setLoading(false);
        }
      };
      fetchLogs();
    }
  }, [show, studentId]);

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case "create":
        return "primary";
      case "update":
        return "info";
      case "void":
        return "danger";
      case "refund":
        return "warning";
      case "send":
        return "secondary";
      case "receive":
        return "success";
      default:
        return "dark";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
        return "success";
      case "pending":
        return "warning";
      case "voided":
        return "danger";
      case "failed":
        return "danger";
      default:
        return "secondary";
    }
  };

  const formatCurrency = (amount) => {
    const absVal = Math.abs(amount);
    const formatted = absVal.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    return amount < 0 ? `(${formatted})` : formatted;
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="modern-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "Prompt", fontWeight: "600", fontSize: "16px" }}>
          Financial Audit Log: {studentName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: "Prompt" }}>
        {loading ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
          </div>
        ) : logs.length > 0 ? (
          <Table responsive hover className="modern-table text-slate-800" style={{ fontSize: "11px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th>Date & Time</th>
                <th>Action</th>
                <th>Type</th>
                <th className="text-end">Amount</th>
                <th>Status</th>
                <th>Performed By</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const date = new Date(log.created_at);
                const dateString = date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                return (
                  <tr key={log.id}>
                    <td>{dateString}</td>
                    <td>
                      <Badge bg={getActionColor(log.action)} className="text-uppercase" style={{ fontSize: "8px" }}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="fw-semibold">{log.transaction_type}</td>
                    <td className={`text-end fw-semibold ${log.amount < 0 ? "text-success" : ""}`}>
                      {formatCurrency(log.amount)}
                    </td>
                    <td>
                      <Badge bg={getStatusColor(log.status)} style={{ fontSize: "8px" }}>
                        {log.status}
                      </Badge>
                    </td>
                    <td>{log.actor_name || "System"}</td>
                    <td className="text-muted" style={{ maxWidth: "250px" }}>{log.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="text-center p-5 text-muted" style={{ fontSize: "12px" }}>
            No audit records found on this account.
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} style={{ fontSize: "12px" }}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewAuditLogsModal;
