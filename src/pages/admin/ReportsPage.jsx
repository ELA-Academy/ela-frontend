import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Spinner, Tabs, Tab, Alert } from "react-bootstrap";
import { BarChart3, Download, Printer, Filter, Calendar, Users, Briefcase, FileText } from "lucide-react";
import api from "../../utils/api";
import { showSuccess, showError } from "../../utils/notificationService";

const ReportsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [boards, setBoards] = useState([]);
  
  // Department Report State
  const [selectedDept, setSelectedDept] = useState("");
  const [deptReport, setDeptReport] = useState(null);
  const [loadingDept, setLoadingDept] = useState(false);

  // Custom Report State
  const [customFilters, setCustomFilters] = useState({
    board_id: "",
    department_id: "",
    status: "",
    priority: "",
    start_date: "",
    end_date: "",
  });
  const [customReport, setCustomReport] = useState(null);
  const [loadingCustom, setLoadingCustom] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptsRes, boardsRes] = await Promise.all([
          api.get("/departments"),
          api.get("/boards")
        ]);
        setDepartments(deptsRes.data || []);
        setBoards(boardsRes.data || []);
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Department Report
  const handleDeptChange = async (deptId) => {
    setSelectedDept(deptId);
    if (!deptId) {
      setDeptReport(null);
      return;
    }
    setLoadingDept(true);
    try {
      const res = await api.get(`/dashboard/reports?department_id=${deptId}`);
      setDeptReport(res.data);
    } catch (err) {
      showError("Failed to generate department report.");
    } finally {
      setLoadingDept(false);
    }
  };

  // Fetch Custom Report
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setLoadingCustom(true);
    try {
      const params = new URLSearchParams();
      Object.entries(customFilters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
      const res = await api.get(`/dashboard/reports?${params.toString()}`);
      setCustomReport(res.data);
      showSuccess("Custom report generated!");
    } catch (err) {
      showError("Failed to generate custom report.");
    } finally {
      setLoadingCustom(false);
    }
  };

  // Export to CSV (Excel compatible)
  const handleExportCSV = (reportData, title) => {
    if (!reportData || !reportData.tasks.length) return;
    
    const headers = ["Task ID", "Title", "Status", "Priority", "Due Date", "Type", "Assigned Staff", "Billable Hours"];
    const rows = reportData.tasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.due_date || "",
      t.task_type,
      `"${(t.assigned_staff || []).join(", ")}"`,
      t.billable_hours
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF (Print view)
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h1 className="fw-bold text-slate-800 d-flex align-items-center gap-2 mb-1" style={{ fontSize: "24px" }}>
            <BarChart3 className="text-primary" size={26} /> Reports Center
          </h1>
          <p className="text-muted mb-0 small">Analyze department workloads, custom workspace tasks, and billable hour metrics.</p>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={handlePrintPDF} className="d-flex align-items-center gap-1">
          <Printer size={15} /> Print to PDF
        </Button>
      </div>

      <div className="print-header d-none d-print-block mb-4">
        <h2 className="fw-bold">ZBot Enterprise Report</h2>
        <p className="text-muted">Generated on {new Date().toLocaleString()}</p>
        <hr />
      </div>

      <Card className="border-0 shadow-sm rounded-4 no-print">
        <Card.Body className="p-4">
          <Tabs defaultActiveKey="dept" id="reports-tabs" className="mb-4">
            {/* Department Reports Tab */}
            <Tab eventKey="dept" title="Department Reports">
              <Row className="mb-4">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-slate-700">Select Department</Form.Label>
                    <Form.Select 
                      value={selectedDept} 
                      onChange={(e) => handleDeptChange(e.target.value)}
                      className="border-slate-200"
                    >
                      <option value="">-- Choose Department --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {loadingDept ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : deptReport ? (
                <div>
                  {/* Aggregated Stats Row */}
                  <Row className="g-3 mb-4">
                    <Col md={3}>
                      <Card className="bg-light border-0 rounded-3 p-3">
                        <span className="text-muted small d-block mb-1">TOTAL DEPT TASKS</span>
                        <h3 className="fw-bold text-slate-800 mb-0">{deptReport.summary.total_tasks}</h3>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="bg-light border-0 rounded-3 p-3">
                        <span className="text-muted small d-block mb-1">COMPLETED TASKS</span>
                        <h3 className="fw-bold text-success mb-0">{deptReport.summary.completed_tasks}</h3>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="bg-light border-0 rounded-3 p-3">
                        <span className="text-muted small d-block mb-1">COMPLETION RATE</span>
                        <h3 className="fw-bold text-primary mb-0">{deptReport.summary.completion_rate}%</h3>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="bg-light border-0 rounded-3 p-3">
                        <span className="text-muted small d-block mb-1">TOTAL BILLABLE HOURS</span>
                        <h3 className="fw-bold text-slate-800 mb-0">{deptReport.summary.total_billable_hours} hrs</h3>
                      </Card>
                    </Col>
                  </Row>

                  {/* Actions & Tasks Table */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-slate-800 mb-0">Department Tasks List</h5>
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      onClick={() => handleExportCSV(deptReport, `${departments.find(d => String(d.id) === String(selectedDept))?.name || 'Dept'}`)}
                      className="d-flex align-items-center gap-1"
                    >
                      <Download size={14} /> Export to Excel
                    </Button>
                  </div>

                  <div className="table-responsive border rounded-3">
                    <Table hover className="align-middle mb-0">
                      <thead className="bg-slate-50">
                        <tr>
                          <th>Task ID</th>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Type</th>
                          <th>Billable Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptReport.tasks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-muted">No tasks found for this department.</td>
                          </tr>
                        ) : (
                          deptReport.tasks.map(t => (
                            <tr key={t.id}>
                              <td className="small text-muted">{t.id}</td>
                              <td className="fw-semibold text-slate-800">{t.title}</td>
                              <td><span className={`badge ${t.status === 'Done' || t.status === 'Completed' ? 'bg-success' : 'bg-secondary'}`}>{t.status}</span></td>
                              <td><span className="badge bg-light text-dark border">{t.priority}</span></td>
                              <td className="small text-muted">{t.task_type}</td>
                              <td>{t.billable_hours} hrs</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted bg-light rounded-3">
                  <Users size={48} className="text-slate-300 mb-3" />
                  <h5>No Department Selected</h5>
                  <p className="small mb-0">Select a department above to generate workload and billable hour reports.</p>
                </div>
              )}
            </Tab>

            {/* Custom Reports Tab */}
            <Tab eventKey="custom" title="Custom Reports Builder">
              <Form onSubmit={handleCustomSubmit} className="bg-light p-3 rounded-3 mb-4">
                <Row className="g-3">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Workspace / Board</Form.Label>
                      <Form.Select 
                        value={customFilters.board_id} 
                        onChange={(e) => setCustomFilters({ ...customFilters, board_id: e.target.value })}
                      >
                        <option value="">All Workspaces</option>
                        {boards.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Department</Form.Label>
                      <Form.Select 
                        value={customFilters.department_id} 
                        onChange={(e) => setCustomFilters({ ...customFilters, department_id: e.target.value })}
                      >
                        <option value="">All Departments</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Status</Form.Label>
                      <Form.Select 
                        value={customFilters.status} 
                        onChange={(e) => setCustomFilters({ ...customFilters, status: e.target.value })}
                      >
                        <option value="">All Statuses</option>
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                        <option value="Completed">Completed</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Priority</Form.Label>
                      <Form.Select 
                        value={customFilters.priority} 
                        onChange={(e) => setCustomFilters({ ...customFilters, priority: e.target.value })}
                      >
                        <option value="">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button variant="primary" type="submit" className="w-100 d-flex align-items-center justify-content-center gap-1">
                      <Filter size={15} /> Run Report
                    </Button>
                  </Col>
                </Row>
              </Form>

              {loadingCustom ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : customReport ? (
                <div>
                  {/* Aggregated Stats Row */}
                  <Row className="g-3 mb-4">
                    <Col md={3}>
                      <Card className="bg-light border-0 rounded-3 p-3">
                        <span className="text-muted small d-block mb-1">TOTAL FILTERED TASKS</span>
                        <h3 className="fw-bold text-slate-800 mb-0">{customReport.summary.total_tasks}</h3>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="bg-light border-0 rounded-3 p-3">
                        <span className="text-muted small d-block mb-1">COMPLETED TASKS</span>
                        <h3 className="fw-bold text-success mb-0">{customReport.summary.completed_tasks}</h3>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="bg-light border-0 rounded-3 p-3">
                        <span className="text-muted small d-block mb-1">COMPLETION RATE</span>
                        <h3 className="fw-bold text-primary mb-0">{customReport.summary.completion_rate}%</h3>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="bg-light border-0 rounded-3 p-3">
                        <span className="text-muted small d-block mb-1">TOTAL BILLABLE HOURS</span>
                        <h3 className="fw-bold text-slate-800 mb-0">{customReport.summary.total_billable_hours} hrs</h3>
                      </Card>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-slate-800 mb-0">Custom Filtered Tasks</h5>
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      onClick={() => handleExportCSV(customReport, "Custom_Filters")}
                      className="d-flex align-items-center gap-1"
                    >
                      <Download size={14} /> Export to Excel
                    </Button>
                  </div>

                  <div className="table-responsive border rounded-3">
                    <Table hover className="align-middle mb-0">
                      <thead className="bg-slate-50">
                        <tr>
                          <th>Task ID</th>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Type</th>
                          <th>Assigned Staff</th>
                          <th>Billable Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customReport.tasks.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">No tasks matching the selected filters.</td>
                          </tr>
                        ) : (
                          customReport.tasks.map(t => (
                            <tr key={t.id}>
                              <td className="small text-muted">{t.id}</td>
                              <td className="fw-semibold text-slate-800">{t.title}</td>
                              <td><span className={`badge ${t.status === 'Done' || t.status === 'Completed' ? 'bg-success' : 'bg-secondary'}`}>{t.status}</span></td>
                              <td><span className="badge bg-light text-dark border">{t.priority}</span></td>
                              <td className="small text-muted">{t.task_type}</td>
                              <td className="small text-slate-700">{t.assigned_staff?.join(", ") || "Unassigned"}</td>
                              <td>{t.billable_hours} hrs</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted bg-light rounded-3">
                  <FileText size={48} className="text-slate-300 mb-3" />
                  <h5>No Custom Report Generated</h5>
                  <p className="small mb-0">Configure filters above and click 'Run Report' to generate custom lists.</p>
                </div>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Printable Report Layout (shown only in print mode) */}
      <div className="d-none d-print-block">
        {selectedDept && deptReport && (
          <div>
            <h3>Department Report: {departments.find(d => String(d.id) === String(selectedDept))?.name}</h3>
            <div className="mb-4 mt-3">
              <div><strong>Total Tasks:</strong> {deptReport.summary.total_tasks}</div>
              <div><strong>Completed Tasks:</strong> {deptReport.summary.completed_tasks}</div>
              <div><strong>Completion Rate:</strong> {deptReport.summary.completion_rate}%</div>
              <div><strong>Total Billable Hours:</strong> {deptReport.summary.total_billable_hours} hrs</div>
            </div>
            <Table bordered className="align-middle">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Billable Hours</th>
                </tr>
              </thead>
              <tbody>
                {deptReport.tasks.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.title}</td>
                    <td>{t.status}</td>
                    <td>{t.priority}</td>
                    <td>{t.billable_hours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {!selectedDept && customReport && (
          <div>
            <h3>Custom Filters Report</h3>
            <div className="mb-4 mt-3">
              <div><strong>Total Tasks:</strong> {customReport.summary.total_tasks}</div>
              <div><strong>Completed Tasks:</strong> {customReport.summary.completed_tasks}</div>
              <div><strong>Completion Rate:</strong> {customReport.summary.completion_rate}%</div>
              <div><strong>Total Billable Hours:</strong> {customReport.summary.total_billable_hours} hrs</div>
            </div>
            <Table bordered className="align-middle">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned Staff</th>
                  <th>Billable Hours</th>
                </tr>
              </thead>
              <tbody>
                {customReport.tasks.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.title}</td>
                    <td>{t.status}</td>
                    <td>{t.priority}</td>
                    <td>{t.assigned_staff?.join(", ")}</td>
                    <td>{t.billable_hours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </Container>
  );
};

export default ReportsPage;
