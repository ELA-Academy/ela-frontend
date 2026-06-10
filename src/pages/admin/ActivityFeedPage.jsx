import React, { useState, useEffect } from "react";
import PageHeader from "../../components/admin/PageHeader";
import { getActivityLogs } from "../../services/activityService";
import { Spinner, Alert, Card } from "react-bootstrap";
import {
  PersonCircle,
  ClockHistory,
  Dot,
  Diagram3,
} from "react-bootstrap-icons";
import "../../styles/AdminModern.css";

// --- NEW, ROBUST timeAgo FUNCTION ---
const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.round(hours / 24);
  return `${days} days ago`;
};

const ActivityFeedPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await getActivityLogs();
        setLogs(data);
      } catch (err) {
        setError("Could not load activity feed.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <PageHeader title="Global Activity Feed" />
      <Card className="content-card">
        <Card.Body>
          <div className="activity-feed">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div className="activity-item" key={log.id}>
                  <div className="activity-icon">
                    {log.actor_name === "System" ? (
                      <Diagram3 />
                    ) : (
                      <PersonCircle />
                    )}
                  </div>
                  <div className="activity-content">
                    <p>
                      <strong>{log.actor_name}</strong> {log.action}
                      {log.target_name && (
                        <span className="target-info">
                          <Dot />
                          {log.target_type}: {log.target_name}
                        </span>
                      )}
                    </p>
                    <small className="timestamp">
                      <ClockHistory size={14} className="me-1" />{" "}
                      {timeAgo(log.created_at)}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-5 text-muted">
                No activity has been recorded yet.
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ActivityFeedPage;
