import React, { useState, useEffect } from "react";
import { Container, Modal, Form, Button, Spinner, Badge } from "react-bootstrap";
import { 
  Search, Heart, ChevronDown, ChevronUp, FileSpreadsheet, 
  FileText, Clock, Calendar, Download, RefreshCw, X
} from "lucide-react";
import api from "../../utils/api";
import { showSuccess, showError } from "../../utils/notificationService";

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("my_reports");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    sign_in_out: false,
    clock_in_out: false,
    billing: true, // Default expanded matching Image 2
  });

  // Modal States
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Form Parameters
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-06-30");
  const [reportFormat, setReportFormat] = useState("XLSX");

  // Dynamic Data
  const [libraryData, setLibraryData] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Favorites Simulation
  const [favorites, setFavorites] = useState([
    "student_attendance_summary",
    "categorized_transaction_summary"
  ]);

  // Load Library metadata and Recent reports
  const fetchLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const res = await api.get("/reports/library");
      setLibraryData(res.data || []);
    } catch (err) {
      console.error("Failed to load reports library", err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const fetchRecentReports = async () => {
    setLoadingRecent(true);
    try {
      const res = await api.get("/reports/recent");
      setRecentReports(res.data || []);
    } catch (err) {
      console.error("Failed to fetch recently generated reports", err);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
    fetchRecentReports();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFavorite = (reportId, e) => {
    e.stopPropagation();
    if (favorites.includes(reportId)) {
      setFavorites(favorites.filter(id => id !== reportId));
    } else {
      setFavorites([...favorites, reportId]);
    }
  };

  const handleOpenGenerate = (report) => {
    setSelectedReport(report);
    setShowGenerateModal(true);
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setGenerating(true);
    try {
      const payload = {
        report_id: selectedReport.id,
        start_date: startDate,
        end_date: endDate,
        format: reportFormat
      };
      const res = await api.post("/reports/generate", payload);
      showSuccess(`Successfully generated report: ${selectedReport.name}`);
      
      // Reload history and open recent modal
      await fetchRecentReports();
      setShowGenerateModal(false);
      setShowRecentModal(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to generate report.";
      showError(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReportFile = (report) => {
    // Navigate directly to download link
    const downloadUrl = `${api.defaults.baseURL.replace('/api', '')}${report.file_path}`;
    window.open(downloadUrl, "_blank");
  };

  // Static/Mock details for Tuition Express (Image 1)
  const tuitionExpressReports = [
    {
      id: "ach_returns",
      name: "ACH Returns / Credit Card Declines",
      description: "Summary of returned ACH items and declined credit card items.",
      lastGenerated: "06/30/2026",
    },
    {
      id: "bank_activity",
      name: "Bank Account Activity",
      description: "Provides reporting of transactions expected to be seen in your bank.",
      lastGenerated: "07/02/2026",
    },
    {
      id: "payout_expected",
      name: "Payout Expected Deposit",
      description: "Gives payout expected dates for credit card transactions.",
      lastGenerated: "07/02/2026",
    },
    {
      id: "batch_details",
      name: "Transaction Batch Details",
      description: "Gives all ACH transactions batched by date and sent for clearance.",
      lastGenerated: "07/02/2026",
    },
    {
      id: "batch_summary",
      name: "Transaction Batch Summary",
      description: "Summary of processed batches with itemized totals by ACH and credit cards.",
      lastGenerated: "06/15/2026",
    }
  ];

  // Helper to filter reports by search term
  const filterReports = (reports) => {
    if (!searchQuery) return reports;
    return reports.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Container fluid className="py-4 px-md-5 bg-slate-50 min-vh-100">
      {/* Styles Injection */}
      <style>{`
        .reports-tab-bar {
          border-bottom: 2px solid #E2E8F0;
          display: flex;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }
        .reports-tab-btn {
          background: none;
          border: none;
          color: #64748B;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.75rem 0.25rem;
          position: relative;
          transition: all 0.2s;
        }
        .reports-tab-btn:hover {
          color: #0F172A;
        }
        .reports-tab-btn.active {
          color: #0E7490; /* Teal 700 */
        }
        .reports-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #0E7490;
        }
        .accordion-header-btn {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #1E293B;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 500;
          font-size: 1.1rem;
          padding: 1rem 1.25rem;
          width: 100%;
          text-align: left;
          transition: all 0.2s;
        }
        .accordion-header-btn:hover {
          background: #F8FAFC;
        }
        .report-list-row {
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          transition: background 0.15s;
        }
        .report-list-row:hover {
          background: #F8FAFC;
        }
        .report-card-title {
          color: #0E7490;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.15s;
        }
        .report-card-title:hover {
          color: #0891B2;
          text-decoration: underline;
        }
        .fav-heart-btn {
          background: none;
          border: none;
          color: #CBD5E1;
          padding: 6px;
          border-radius: 50%;
          transition: all 0.15s;
        }
        .fav-heart-btn:hover {
          background: #F1F5F9;
          color: #0E7490;
        }
        .fav-heart-btn.active {
          color: #0E7490;
        }
        .search-reports-container {
          position: relative;
          max-width: 320px;
        }
        .search-reports-input {
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          font-size: 0.9rem;
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          width: 100%;
        }
        .search-reports-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }
        .recently-generated-btn {
          background: none;
          border: none;
          color: #0E7490;
          display: flex;
          align-items: center;
          font-weight: 600;
          font-size: 0.95rem;
          gap: 0.5rem;
          transition: color 0.15s;
        }
        .recently-generated-btn:hover {
          color: #0891B2;
        }
        .recent-report-item {
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
        }
        .file-format-badge {
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }
        .badge-xlsx {
          background-color: #E2FBF0;
          color: #10B981;
          border: 1px solid #A7F3D0;
        }
        .badge-pdf {
          background-color: #FEE2E2;
          color: #EF4444;
          border: 1px solid #FCA5A5;
        }
      `}</style>

      {/* Header Panel */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 no-print">
        <div>
          <h1 className="fw-bold text-slate-800 mb-0" style={{ fontSize: "28px" }}>Reports</h1>
          <p className="text-muted small mb-0">Select reports to generate financial ledger, tuition, and admissions data sheets.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* Recently Generated History Button */}
          <button className="recently-generated-btn" onClick={() => setShowRecentModal(true)}>
            <div className="position-relative d-inline-block">
              <Clock size={20} />
              {recentReports.length > 0 && (
                <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.65rem', padding: '0.25em 0.5em' }}>
                  {recentReports.length}
                </Badge>
              )}
            </div>
            RECENTLY GENERATED
          </button>
          
          <Button variant="primary" style={{ backgroundColor: '#0E7490', borderColor: '#0E7490' }} className="d-flex align-items-center gap-1">
            CREATE REPORT
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border border-slate-200 no-print">
        <div className="search-reports-container">
          <Search className="search-reports-icon" size={16} />
          <input 
            type="text" 
            placeholder="Search all reports" 
            className="search-reports-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="small text-muted">
          SHOWING {activeTab === 'my_reports' ? tuitionExpressReports.length : 'ALL'} RESULTS | Up to 10 favorites from each category will show here.
        </div>
      </div>

      {/* Tab Bar Section */}
      <div className="reports-tab-bar no-print">
        <button 
          className={`reports-tab-btn ${activeTab === 'my_reports' ? 'active' : ''}`}
          onClick={() => setActiveTab("my_reports")}
        >
          My Reports
        </button>
        <button 
          className={`reports-tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab("library")}
        >
          Reports Library
        </button>
        <button 
          className={`reports-tab-btn ${activeTab === 'created_by_me' ? 'active' : ''}`}
          onClick={() => setActiveTab("created_by_me")}
        >
          Created By Me
        </button>
      </div>

      {/* Active Tab Contents */}
      <div className="bg-white rounded-3 shadow-sm border border-slate-200 overflow-hidden no-print">
        {/* --- TAB A: MY REPORTS (Tuition Express / PSP) --- */}
        {activeTab === "my_reports" && (
          <div>
            {filterReports(tuitionExpressReports).map((report) => (
              <div key={report.id} className="report-list-row">
                <div style={{ flex: 1 }}>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handleOpenGenerate(report); }} 
                    className="report-card-title"
                  >
                    {report.name}
                  </a>
                  <div className="text-muted small mt-1">{report.description}</div>
                </div>
                <div className="d-flex align-items-center gap-4">
                  <div className="text-muted small">{report.lastGenerated}</div>
                  <button 
                    onClick={(e) => toggleFavorite(report.id, e)} 
                    className={`fav-heart-btn ${favorites.includes(report.id) ? 'active' : ''}`}
                  >
                    <Heart size={18} fill={favorites.includes(report.id) ? "#0E7490" : "none"} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB B: REPORTS LIBRARY --- */}
        {activeTab === "library" && (
          <div className="p-3">
            {loadingLibrary ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: '#0E7490' }} />
              </div>
            ) : libraryData.length === 0 ? (
              <div className="text-center py-5 text-muted">
                No reports configured in the library.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {/* Dynamically render Library Categories (expandable accordions) */}
                {libraryData.map((category) => {
                  const isExpanded = expandedSections[category.id];
                  const matchedReports = filterReports(category.reports);

                  return (
                    <div key={category.id} className="border border-slate-200 rounded-3 overflow-hidden">
                      <button 
                        className="accordion-header-btn" 
                        onClick={() => toggleSection(category.id)}
                      >
                        {category.name}
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {isExpanded && (
                        <div className="bg-white border-top">
                          {matchedReports.length === 0 ? (
                            <div className="text-center py-4 text-muted small">No reports found matching your query.</div>
                          ) : (
                            matchedReports.map((report) => (
                              <div key={report.id} className="report-list-row border-0 border-bottom">
                                <div style={{ flex: 1 }}>
                                  <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); handleOpenGenerate(report); }} 
                                    className="report-card-title"
                                  >
                                    {report.name}
                                  </a>
                                  <div className="text-muted small mt-1">{report.description}</div>
                                </div>
                                <button 
                                  onClick={(e) => toggleFavorite(report.id, e)} 
                                  className={`fav-heart-btn ${favorites.includes(report.id) ? 'active' : ''}`}
                                >
                                  <Heart size={18} fill={favorites.includes(report.id) ? "#0E7490" : "none"} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB C: CREATED BY ME --- */}
        {activeTab === "created_by_me" && (
          <div className="text-center py-5 text-muted">
            <Clock size={40} className="mb-2 text-slate-300" />
            <h5>No Custom Built Reports</h5>
            <p className="small mb-0">Custom query templates you design will be stored here.</p>
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* 🚀 MODAL A: PARAMETERS GENERATION INPUTS */}
      {/* ========================================= */}
      <Modal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: '1.2rem' }}>
            Generate {selectedReport?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGenerateSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Start Date</Form.Label>
              <div className="position-relative">
                <Form.Control 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">End Date</Form.Label>
              <Form.Control 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">File Output Format</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  label="Excel Sheet (.xlsx)"
                  name="reportFormat"
                  id="formatXLSX"
                  checked={reportFormat === "XLSX"}
                  onChange={() => setReportFormat("XLSX")}
                />
                <Form.Check
                  type="radio"
                  label="Adobe Document (.pdf)"
                  name="reportFormat"
                  id="formatPDF"
                  checked={reportFormat === "PDF"}
                  onChange={() => setReportFormat("PDF")}
                  disabled={selectedReport?.id === "categorized_transaction_summary"} // Ledger report is XLSX only
                />
              </div>
              {selectedReport?.id === "categorized_transaction_summary" && (
                <div className="text-muted small mt-1">Note: Multi-section ledger transaction reports are optimized for XLSX.</div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button 
              type="submit" 
              style={{ backgroundColor: '#0E7490', borderColor: '#0E7490' }}
              disabled={generating}
              className="d-flex align-items-center gap-1"
            >
              {generating ? <Spinner size="sm" animation="border" /> : <RefreshCw size={15} />}
              Generate Report
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================= */}
      {/* 🚀 MODAL B: RECENTLY GENERATED REPORTS    */}
      {/* ========================================= */}
      <Modal show={showRecentModal} onHide={() => setShowRecentModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-slate-800" style={{ fontSize: '1.25rem' }}>
            Recently Generated Reports
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {/* Internal Modal Tab Bar */}
          <div className="d-flex border-bottom bg-slate-50 px-3">
            <button className="reports-tab-btn active px-3" style={{ fontSize: '0.85rem' }}>
              REPORTS LIBRARY
            </button>
            <button className="reports-tab-btn px-3" style={{ fontSize: '0.85rem' }} disabled>
              CREATED BY ME
            </button>
          </div>

          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {loadingRecent ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: '#0E7490' }} />
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-5 text-muted">
                No reports generated yet. Click a report in the library to create one.
              </div>
            ) : (
              recentReports.map((report) => (
                <div key={report.id} className="recent-report-item">
                  <div>
                    <span className="fw-semibold text-slate-800 d-block">{report.name}</span>
                    <span className="text-muted small">
                      Generated by {report.creator_name} ({report.created_by_role}) • Range: {report.date_range}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span className={`file-format-badge ${report.format === 'XLSX' ? 'badge-xlsx' : 'badge-pdf'}`}>
                      {report.format}
                    </span>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => downloadReportFile(report)}
                      style={{ color: '#0E7490', borderColor: '#0E7490' }}
                      className="d-flex align-items-center gap-1"
                    >
                      <Download size={14} /> Download
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-slate-50">
          <Button variant="secondary" onClick={() => setShowRecentModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ReportsPage;
