import React, { useState, useEffect } from "react";
import PageHeader from "../../components/admin/PageHeader";
import { getActivityLogs } from "../../services/activityService";
import { Spinner, Alert, Card, Form, Row, Col, Button, Table } from "react-bootstrap";
import {
  PersonCircle,
  ClockHistory,
  Dot,
  Diagram3,
} from "react-bootstrap-icons";
import { Search, Download, Filter, RefreshCw } from "lucide-react";
import "../../styles/AdminModern.css";

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const ActivityFeedPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'create' | 'update' | 'delete' | 'other'

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

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportLogsCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["Timestamp", "Actor", "Action", "Target Type", "Target Name"];
    const rows = filteredLogs.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.actor_name,
      log.action,
      log.target_type || "",
      log.target_name || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "system_audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchActor = log.actor_name?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q);
      const matchTarget = log.target_name?.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchTarget) return false;
    }

    // 2. Type Filter
    if (filterType !== "all") {
      const actionLower = log.action?.toLowerCase() || "";
      if (filterType === "create" && !actionLower.includes("create")) return false;
      if (filterType === "update" && !actionLower.includes("update") && !actionLower.includes("edit") && !actionLower.includes("change")) return false;
      if (filterType === "delete" && !actionLower.includes("delete") && !actionLower.includes("remove")) return false;
      if (filterType === "other") {
        if (actionLower.includes("create") || actionLower.includes("update") || actionLower.includes("edit") || actionLower.includes("change") || actionLower.includes("delete") || actionLower.includes("remove")) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <PageHeader title="Global Audit Logs & Activity Feed" />
        
        <div className="d-flex gap-2">
          <Button 
            variant="light" 
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button 
            variant="light" 
            onClick={handleExportLogsCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Modern Filter Strip */}
      <Card className="border-0 shadow-sm mb-4 rounded-2xl bg-white border-slate-100">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={5}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Search logs by actor, action, or target..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border-0 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-950 focus:outline-none transition-all duration-200"
                />
              </div>
            </Col>

            <Col md={3}>
              <div className="d-flex align-items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Action Type:
                </span>
                <Form.Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-50 border-0 rounded-xl py-1.5 px-3 text-xs focus:ring-0 focus:outline-none"
                >
                  <option value="all">All Actions</option>
                  <option value="create">Creations</option>
                  <option value="update">Updates & Edits</option>
                  <option value="delete">Deletions</option>
                  <option value="other">Others</option>
                </Form.Select>
              </div>
            </Col>

            <Col md={4} className="text-end">
              <span className="text-xs text-slate-400 font-medium">
                Showing <strong>{filteredLogs.length}</strong> activity logs
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="rounded-2xl border-0 shadow-sm">{error}</Alert>}

      {loading ? (
        <div className="text-center py-20">
          <Spinner animation="border" variant="dark" />
          <div className="text-xs text-slate-400 mt-2 font-medium">Loading audit history...</div>
        </div>
      ) : (
        <Card className="border-0 shadow-sm rounded-2xl bg-white border-slate-100 overflow-hidden">
          <Card.Body className="p-0">
            {filteredLogs.length > 0 ? (
              <div className="activity-feed p-4 flex flex-col gap-4">
                {filteredLogs.map((log) => (
                  <div className="activity-item d-flex gap-3 align-items-start border-bottom border-slate-50 pb-3 last:border-0 last:pb-0" key={log.id}>
                    <div className="activity-icon flex-shrink-0 mt-0.5">
                      {log.actor_name === "System" ? (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                          <Diagram3 size={15} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center border border-indigo-100 font-bold uppercase text-[10px] tracking-wider">
                          {log.actor_name ? log.actor_name.substring(0, 2) : "US"}
                        </div>
                      )}
                    </div>
                    <div className="activity-content flex-grow-1 min-w-0">
                      <p className="text-xs text-slate-800 m-0 leading-relaxed font-medium">
                        <strong className="text-slate-950 font-semibold">{log.actor_name}</strong> {log.action}
                        {log.target_name && (
                          <span className="target-info inline-flex align-items-center bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide ms-2 mt-0.5">
                            {log.target_type}: {log.target_name}
                          </span>
                        )}
                      </p>
                      <small className="timestamp text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 d-flex align-items-center gap-1">
                        <ClockHistory size={11} />
                        {new Date(log.created_at).toLocaleString()} ({timeAgo(log.created_at)})
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                No activity logs match your search parameters.
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ActivityFeedPage;
