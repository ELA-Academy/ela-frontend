import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Alert, Spinner, Badge, Row, Col } from "react-bootstrap";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  Users,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check
} from "lucide-react";
import { previewProcarePlans, importProcarePlans } from "../../../services/billingService";
import { showSuccess, showError } from "../../../utils/notificationService";

const ProcareImportWizardModal = ({ show, handleClose, onImportSuccess }) => {
  const [step, setStep] = useState(1); // 1: Select/Preview, 2: Review & Options, 3: Completed
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [importResults, setImportResults] = useState(null);

  // Import options
  const [options, setOptions] = useState({
    create_missing_students: true,
    import_templates: true,
    import_presets: true,
    import_subscriptions: true,
    all_students: false
  });

  // Reset when modal opens
  useEffect(() => {
    if (show) {
      setStep(1);
      setFile(null);
      setError("");
      setPreviewData(null);
      setSearchTerm("");
      setImportResults(null);
      // Auto-preview default file if available
      loadDefaultWorkspaceFile();
    }
  }, [show]);

  const loadDefaultWorkspaceFile = async () => {
    try {
      setAnalyzing(true);
      setError("");
      const res = await previewProcarePlans({ use_default_file: true });
      if (res && res.total_students > 0) {
        setPreviewData(res);
      }
    } catch (err) {
      // Default file not found or error, user will select file manually
      console.log("No default workspace file auto-loaded:", err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");

    try {
      setAnalyzing(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await previewProcarePlans(formData);
      setPreviewData(res);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
        "Failed to parse the selected file. Please make sure it is a valid Procare Excel (.xlsx) or CSV file."
      );
      setPreviewData(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecuteImport = async () => {
    try {
      setImporting(true);
      setError("");

      let payload;
      if (file) {
        payload = new FormData();
        payload.append("file", file);
        Object.keys(options).forEach((k) => payload.append(k, options[k]));
      } else {
        payload = {
          use_default_file: true,
          ...options
        };
      }

      const res = await importProcarePlans(payload);
      setImportResults(res.results || {});
      setStep(3);
      showSuccess(res.message || "Procare plans imported successfully!");
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to import Procare plans.");
    } finally {
      setImporting(false);
    }
  };

  // Filter preview students
  const filteredStudents = (previewData?.preview_students || []).filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.first_name && s.first_name.toLowerCase().includes(term)) ||
      (s.last_name && s.last_name.toLowerCase().includes(term)) ||
      (s.raw_name && s.raw_name.toLowerCase().includes(term)) ||
      (s.plan_name && s.plan_name.toLowerCase().includes(term)) ||
      (s.room && s.room.toLowerCase().includes(term))
    );
  });

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      centered
      className="font-prompt"
      backdrop="static"
    >
      <Modal.Header closeButton className="border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center text-success rounded-3 p-2"
            style={{ background: "#ecfdf5" }}
          >
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <Modal.Title className="fs-6 fw-bold text-slate-800 m-0">
              Import Procare Tuition Plans
            </Modal.Title>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
              Seamlessly migrate tuition plans, templates, preset items & student subscriptions from Procare exports.
            </div>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="py-3 px-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
        {error && (
          <Alert variant="danger" className="py-2.5 px-3 small mb-3 d-flex align-items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{error}</div>
          </Alert>
        )}

        {/* STEP 1: Select / Analyze File */}
        {step === 1 && (
          <div>
            {/* File Upload Banner */}
            <div
              className="p-4 rounded-3 border mb-3 text-center position-relative"
              style={{
                background: "#f8fafc",
                borderColor: "#cbd5e1",
                borderStyle: "dashed",
                borderWidth: "2px"
              }}
            >
              <div className="mb-2">
                <FileSpreadsheet size={38} className="text-primary opacity-75" />
              </div>
              <h6 className="fw-bold text-slate-800 mb-1" style={{ fontSize: "0.95rem" }}>
                Select Procare Tuition Plan File
              </h6>
              <p className="text-muted small mb-3" style={{ maxWidth: "560px", margin: "0 auto" }}>
                Upload your <strong>BillingTuitionPlanDetailed_AllRooms.xlsx</strong> or exported CSV file.
                The system will automatically detect student names, active plans, line items, and cycle dates.
              </p>

              <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                <label className="btn btn-primary btn-sm px-4 fw-semibold d-inline-flex align-items-center gap-1.5 cursor-pointer shadow-sm">
                  <Upload size={14} /> Browse Excel / CSV File
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv, .txt"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>

                {previewData?.has_default_file && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
                    onClick={loadDefaultWorkspaceFile}
                    disabled={analyzing}
                  >
                    <Sparkles size={14} className="text-warning" /> Use Detected Workspace File
                  </Button>
                )}
              </div>

              {previewData?.file_name && (
                <div className="mt-3 text-secondary small fw-medium">
                  Active File: <code className="text-primary">{previewData.file_name}</code>
                </div>
              )}
            </div>

            {analyzing && (
              <div className="text-center py-4 text-muted">
                <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                Analyzing spreadsheet structure and matching students...
              </div>
            )}

            {/* Analysis Stats Overview */}
            {previewData && !analyzing && (
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold text-slate-800 small d-flex align-items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-success" />
                    File Analyzed Successfully
                  </span>
                  <span className="badge bg-light text-secondary border small">
                    {previewData.total_students} Total Students Found
                  </span>
                </div>

                <Row className="g-2 mb-3">
                  <Col md={3}>
                    <div className="p-3 bg-white border rounded-3 shadow-xs">
                      <div className="text-muted small fw-semibold">Active Tuition Plans</div>
                      <div className="fs-4 fw-bold text-success">
                        {previewData.students_with_plans}
                      </div>
                      <div className="text-secondary" style={{ fontSize: "0.72rem" }}>
                        Students ready for recurring plans
                      </div>
                    </div>
                  </Col>

                  <Col md={3}>
                    <div className="p-3 bg-white border rounded-3 shadow-xs">
                      <div className="text-muted small fw-semibold">Plan Templates</div>
                      <div className="fs-4 fw-bold text-primary">
                        {previewData.templates?.length || 0}
                      </div>
                      <div className="text-secondary" style={{ fontSize: "0.72rem" }}>
                        Unique reusable plan models
                      </div>
                    </div>
                  </Col>

                  <Col md={3}>
                    <div className="p-3 bg-white border rounded-3 shadow-xs">
                      <div className="text-muted small fw-semibold">Charge & Discount Presets</div>
                      <div className="fs-4 fw-bold text-info">
                        {(previewData.preset_charges?.length || 0) + (previewData.preset_discounts?.length || 0)}
                      </div>
                      <div className="text-secondary" style={{ fontSize: "0.72rem" }}>
                        {previewData.preset_charges?.length || 0} charges, {previewData.preset_discounts?.length || 0} discounts
                      </div>
                    </div>
                  </Col>

                  <Col md={3}>
                    <div className="p-3 bg-white border rounded-3 shadow-xs">
                      <div className="text-muted small fw-semibold">Student Profiles</div>
                      <div className="fs-4 fw-bold text-slate-800">
                        {previewData.new_students_to_create} New
                      </div>
                      <div className="text-secondary" style={{ fontSize: "0.72rem" }}>
                        {previewData.matched_existing_students} existing matched in DB
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Templates preview pills */}
                {previewData.templates?.length > 0 && (
                  <div className="p-2.5 bg-light border rounded-3 mb-3">
                    <div className="small fw-bold text-slate-700 mb-1.5 d-flex align-items-center gap-1">
                      <Layers size={13} className="text-primary" /> Templates Detected for Wizard:
                    </div>
                    <div className="d-flex flex-wrap gap-1.5">
                      {previewData.templates.map((t, idx) => (
                        <span key={idx} className="badge bg-white text-dark border px-2 py-1 small">
                          <strong>{t.name}</strong> ({t.items_json?.length || 0} items)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student search & quick table */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-bold text-slate-700">
                    Previewing Active Student Plans ({filteredStudents.length} shown)
                  </span>
                  <div className="position-relative" style={{ width: "240px" }}>
                    <Search
                      size={13}
                      className="position-absolute text-muted"
                      style={{ left: "8px", top: "50%", transform: "translateY(-50%)" }}
                    />
                    <Form.Control
                      type="text"
                      placeholder="Search student or plan..."
                      size="sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: "26px", fontSize: "0.78rem" }}
                    />
                  </div>
                </div>

                <div className="border rounded-3 overflow-hidden" style={{ maxHeight: "250px", overflowY: "auto" }}>
                  <Table hover size="sm" className="m-0" style={{ fontSize: "0.78rem" }}>
                    <thead style={{ background: "#f8fafc", position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Student Name</th>
                        <th>Grade / Room</th>
                        <th>Plan Name</th>
                        <th>Billing Cycle</th>
                        <th>Dates</th>
                        <th className="text-end">Line Items</th>
                        <th className="text-end">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.slice(0, 40).map((s, idx) => (
                        <tr key={idx}>
                          <td className="fw-semibold">
                            {s.first_name} {s.last_name}
                            {s.is_matched ? (
                              <Badge bg="info" className="ms-1.5 text-uppercase" style={{ fontSize: "0.62rem" }}>
                                Linked
                              </Badge>
                            ) : (
                              <Badge bg="secondary" className="ms-1.5 text-uppercase" style={{ fontSize: "0.62rem" }}>
                                Auto-Create
                              </Badge>
                            )}
                          </td>
                          <td className="text-muted">{s.grade_level || s.room}</td>
                          <td className="fw-medium text-slate-800">{s.plan_name || "No Plan"}</td>
                          <td>{s.cycle || "Monthly"}</td>
                          <td className="text-muted" style={{ fontSize: "0.72rem" }}>
                            {s.start_date || "N/A"} → {s.end_date || "Ongoing"}
                          </td>
                          <td className="text-end text-muted">{s.items?.length || 0} items</td>
                          <td className="text-end fw-bold text-success">
                            ${(s.header_total || s.calculated_total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Configure & Confirm Options */}
        {step === 2 && previewData && (
          <div>
            <h6 className="fw-bold text-slate-800 mb-2" style={{ fontSize: "0.9rem" }}>
              Confirm Import Configuration
            </h6>
            <p className="text-muted small mb-3">
              Review and select what you want to import into the school management system:
            </p>

            <div className="bg-light p-3 rounded-3 border mb-3">
              <Form.Check
                type="checkbox"
                id="opt-create-students"
                label={
                  <div>
                    <strong className="text-slate-800">
                      Auto-create Student Profiles & Financial Accounts ({previewData.new_students_to_create} students)
                    </strong>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Automatically provisions student profiles with their assigned grade levels, parent contact links, and financial accounts so they are fully ready for invoicing.
                    </div>
                  </div>
                }
                checked={options.create_missing_students}
                onChange={(e) => setOptions({ ...options, create_missing_students: e.target.checked })}
                className="mb-3"
              />

              <Form.Check
                type="checkbox"
                id="opt-import-templates"
                label={
                  <div>
                    <strong className="text-slate-800">
                      Import Billing Plan Templates ({previewData.templates?.length || 0} templates)
                    </strong>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Saves reusable templates (e.g., Monthly Tuition Fee, 12-month Plan) to appear in the "Pick Template" dropdown in the Create Plan Wizard.
                    </div>
                  </div>
                }
                checked={options.import_templates}
                onChange={(e) => setOptions({ ...options, import_templates: e.target.checked })}
                className="mb-3"
              />

              <Form.Check
                type="checkbox"
                id="opt-import-presets"
                label={
                  <div>
                    <strong className="text-slate-800">
                      Register Preset Charge & Discount Items ({(previewData.preset_charges?.length || 0) + (previewData.preset_discounts?.length || 0)} items)
                    </strong>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Registers standard tuition rates (Elementary, Middle, High School), Tech fees, and financial assistance options for easy reuse.
                    </div>
                  </div>
                }
                checked={options.import_presets}
                onChange={(e) => setOptions({ ...options, import_presets: e.target.checked })}
                className="mb-3"
              />

              <Form.Check
                type="checkbox"
                id="opt-import-subs"
                label={
                  <div>
                    <strong className="text-slate-800">
                      Activate Recurring Plan Subscriptions ({previewData.students_with_plans} active student plans)
                    </strong>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Establishes active recurring billing schedules with line items, next billing dates, and discounts for each student.
                    </div>
                  </div>
                }
                checked={options.import_subscriptions}
                onChange={(e) => setOptions({ ...options, import_subscriptions: e.target.checked })}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 3 && importResults && (
          <div className="text-center py-4">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-success-subtle text-success rounded-circle mb-3"
              style={{ width: "64px", height: "64px" }}
            >
              <Check size={32} />
            </div>

            <h5 className="fw-bold text-slate-800 mb-1">Procare Import Completed!</h5>
            <p className="text-muted small mb-4" style={{ maxWidth: "460px", margin: "0 auto" }}>
              The Procare tuition plans have been successfully imported into the system. All templates and active subscriptions are now live.
            </p>

            <Row className="g-2 justify-content-center mb-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <Col xs={4}>
                <div className="p-2.5 bg-light rounded-3 border">
                  <div className="fs-5 fw-bold text-primary">
                    {(importResults.templates_created || 0) + (importResults.templates_updated || 0)}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Templates Ready
                  </div>
                </div>
              </Col>
              <Col xs={4}>
                <div className="p-2.5 bg-light rounded-3 border">
                  <div className="fs-5 fw-bold text-slate-800">
                    {importResults.students_created || 0}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Students Created
                  </div>
                </div>
              </Col>
              <Col xs={4}>
                <div className="p-2.5 bg-light rounded-3 border">
                  <div className="fs-5 fw-bold text-success">
                    {(importResults.subscriptions_created || 0) + (importResults.subscriptions_updated || 0)}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                    Plans Active
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-top py-2.5 px-4 d-flex justify-content-between">
        {step === 1 && (
          <>
            <Button variant="light" size="sm" onClick={handleClose} disabled={analyzing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep(2)}
              disabled={analyzing || !previewData || previewData.students_with_plans === 0}
              className="d-flex align-items-center gap-1.5 px-3 fw-semibold"
            >
              Continue to Options <ArrowRight size={14} />
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Button
              variant="light"
              size="sm"
              onClick={() => setStep(1)}
              disabled={importing}
              className="d-flex align-items-center gap-1"
            >
              Back
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleExecuteImport}
              disabled={importing}
              className="d-flex align-items-center gap-1.5 px-4 fw-semibold shadow-sm"
            >
              {importing ? (
                <>
                  <Spinner animation="border" size="sm" /> Importing Data...
                </>
              ) : (
                <>
                  <Upload size={14} /> Execute Procare Import
                </>
              )}
            </Button>
          </>
        )}

        {step === 3 && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleClose}
            className="w-100 fw-semibold"
          >
            Done & View Recurring Plans
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ProcareImportWizardModal;
