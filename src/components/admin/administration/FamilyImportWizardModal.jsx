import React, { useState } from "react";
import { Modal, Button, Alert, Spinner, Table, Form, Badge, Card, Row, Col } from "react-bootstrap";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Users,
  UserCheck,
  UserPlus,
  Mail,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
  FileCheck
} from "lucide-react";
import { previewFamilyImport, importFamilies } from "../../../services/administrationService";
import { toast } from "react-toastify";

const FamilyImportWizardModal = ({ show, onHide, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: File, 2: Preview, 3: Options & Run, 4: Results
  const [selectedFile, setSelectedFile] = useState(null);
  const [useDefaultFile, setUseDefaultFile] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Options
  const [options, setOptions] = useState({
    update_existing_students: true,
    create_missing_students: true,
    upgrade_dummy_parents: true,
    cleanup_unmatched_dummy_parents: true,
  });

  const handleReset = () => {
    setStep(1);
    setSelectedFile(null);
    setUseDefaultFile(true);
    setLoadingPreview(false);
    setImporting(false);
    setPreviewData(null);
    setImportResults(null);
    setError("");
    setSearchTerm("");
  };

  const handleModalClose = () => {
    handleReset();
    onHide();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUseDefaultFile(false);
      setError("");
    }
  };

  const handleLoadPreview = async () => {
    setError("");
    setLoadingPreview(true);
    try {
      let data;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        data = await previewFamilyImport(formData);
      } else {
        data = await previewFamilyImport({ use_default_file: true });
      }
      setPreviewData(data);
      setStep(2);
    } catch (err) {
      console.error("Preview error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to process and preview the spreadsheet. Please check the file format."
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteImport = async () => {
    setError("");
    setImporting(true);
    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        Object.keys(options).forEach((key) => {
          formData.append(key, options[key]);
        });
        res = await importFamilies(formData);
      } else {
        res = await importFamilies({
          use_default_file: true,
          ...options,
        });
      }

      setImportResults(res.results || res);
      setStep(4);
      toast.success("Student & Family Directory successfully reconciled!");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Import execution error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to execute family import. Please try again or check the server logs."
      );
    } finally {
      setImporting(false);
    }
  };

  const filteredPreviewStudents = (previewData?.preview_students || []).filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const emails = (s.parent_emails || "").toLowerCase();
    const parents = (s.parent_names || "").toLowerCase();
    return fullName.includes(term) || emails.includes(term) || parents.includes(term);
  });

  return (
    <Modal
      show={show}
      onHide={handleModalClose}
      size="xl"
      centered
      backdrop="static"
      keyboard={!importing}
    >
      <Modal.Header closeButton={!importing} className="border-bottom bg-light px-4 py-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
            style={{ width: "42px", height: "42px" }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <Modal.Title className="h5 mb-0 fw-bold">
              Student & Family Directory Reconciliation
            </Modal.Title>
            <small className="text-muted">
              Map real parent emails, phones, and PINs to students, upgrade placeholder accounts, and link siblings
            </small>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* Step Indicator */}
        <div className="d-flex align-items-center justify-content-between mb-4 px-2">
          {[
            { num: 1, label: "Select Spreadsheet" },
            { num: 2, label: "Reconciliation Preview" },
            { num: 3, label: "Import Options" },
            { num: 4, label: "Results" },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="d-flex align-items-center gap-2">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                    step === s.num
                      ? "bg-primary text-white"
                      : step > s.num
                      ? "bg-success text-white"
                      : "bg-light text-muted border"
                  }`}
                  style={{ width: "32px", height: "32px", fontSize: "14px" }}
                >
                  {step > s.num ? <Check size={16} /> : s.num}
                </div>
                <span
                  className={`fw-semibold d-none d-md-inline ${
                    step === s.num
                      ? "text-primary"
                      : step > s.num
                      ? "text-dark"
                      : "text-muted"
                  }`}
                  style={{ fontSize: "13px" }}
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className="flex-grow-1 mx-2"
                  style={{
                    height: "2px",
                    backgroundColor: step > idx + 1 ? "#198754" : "#e2e8f0",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <Alert variant="danger" className="d-flex align-items-center gap-2 mb-4 py-2 px-3">
            <AlertCircle size={18} className="flex-shrink-0" />
            <div style={{ fontSize: "13.5px" }}>{error}</div>
          </Alert>
        )}

        {/* STEP 1: Select File */}
        {step === 1 && (
          <div>
            <div className="bg-light p-3 rounded-3 border mb-4">
              <div className="d-flex align-items-start gap-3">
                <FileCheck size={26} className="text-primary mt-1 flex-shrink-0" />
                <div>
                  <h6 className="fw-bold mb-1">Master Student & Family Directory Detected</h6>
                  <p className="text-muted small mb-0">
                    The master school directory <code>Students_and_Family_-_Active_-_All_Rooms.xlsx</code> is ready to be parsed.
                    It contains all 524 active student entries, real parent emails, phone numbers, family IDs, and security PINs.
                  </p>
                </div>
              </div>
            </div>

            <Row className="g-3 mb-4">
              <Col md={6}>
                <div
                  className={`p-3 rounded-3 border cursor-pointer h-100 transition-all ${
                    useDefaultFile ? "border-primary bg-primary bg-opacity-10 shadow-sm" : "bg-white"
                  }`}
                  onClick={() => {
                    setUseDefaultFile(true);
                    setSelectedFile(null);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Form.Check
                      type="radio"
                      id="opt-default-file"
                      checked={useDefaultFile}
                      onChange={() => {
                        setUseDefaultFile(true);
                        setSelectedFile(null);
                      }}
                    />
                    <label htmlFor="opt-default-file" className="fw-bold mb-0 cursor-pointer">
                      Use School Master Directory File
                    </label>
                  </div>
                  <div className="text-muted small ps-4">
                    <code>Students_and_Family_-_Active_-_All_Rooms.xlsx</code>
                    <div className="text-success mt-1 fw-medium">
                      ✓ Pre-verified (524 active entries, 544 real parent emails)
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div
                  className={`p-3 rounded-3 border cursor-pointer h-100 transition-all ${
                    !useDefaultFile ? "border-primary bg-primary bg-opacity-10 shadow-sm" : "bg-white"
                  }`}
                  onClick={() => setUseDefaultFile(false)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Form.Check
                      type="radio"
                      id="opt-custom-file"
                      checked={!useDefaultFile}
                      onChange={() => setUseDefaultFile(false)}
                    />
                    <label htmlFor="opt-custom-file" className="fw-bold mb-0 cursor-pointer">
                      Upload Custom / Updated File
                    </label>
                  </div>
                  <div className="ps-4">
                    <Form.Control
                      type="file"
                      size="sm"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {selectedFile && (
                      <div className="small text-primary mt-1 fw-medium">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            <div className="p-3 border rounded-3 bg-white">
              <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-success" />
                What this reconciliation does:
              </h6>
              <ul className="text-muted small mb-0 ps-3">
                <li className="mb-1">
                  <strong>Replaces Dummy Accounts:</strong> Placeholder parent emails (<code>@parent.elaaschool.org</code>) will be upgraded in-place to real parent emails and verified phone numbers.
                </li>
                <li className="mb-1">
                  <strong>Links Siblings:</strong> When parents have multiple children enrolled, siblings are linked automatically under a single shared parent account.
                </li>
                <li className="mb-1">
                  <strong>Updates Student Records:</strong> Verifies and applies real Date of Birth, Grade/Room, and student ID numbers.
                </li>
                <li>
                  <strong>Provisions Missing Students:</strong> Creates the remaining active students with financial accounts so your enrollment database is 100% complete.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: Reconciliation Preview */}
        {step === 2 && previewData && (
          <div>
            {/* Stats Overview */}
            <Row className="g-3 mb-4">
              <Col md={3} sm={6}>
                <Card className="border-0 shadow-sm bg-primary bg-opacity-10 p-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-primary small fw-semibold text-uppercase">Total in File</span>
                    <FileSpreadsheet size={18} className="text-primary" />
                  </div>
                  <h3 className="fw-bold mb-0 text-primary">{previewData.total_students_in_file}</h3>
                  <small className="text-muted">Student rows detected</small>
                </Card>
              </Col>

              <Col md={3} sm={6}>
                <Card className="border-0 shadow-sm bg-success bg-opacity-10 p-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-success small fw-semibold text-uppercase">Existing Matched</span>
                    <UserCheck size={18} className="text-success" />
                  </div>
                  <h3 className="fw-bold mb-0 text-success">{previewData.matched_students_count}</h3>
                  <small className="text-muted">Already in database</small>
                </Card>
              </Col>

              <Col md={3} sm={6}>
                <Card className="border-0 shadow-sm bg-info bg-opacity-10 p-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-info small fw-semibold text-uppercase">New to Provision</span>
                    <UserPlus size={18} className="text-info" />
                  </div>
                  <h3 className="fw-bold mb-0 text-info">{previewData.new_students_count}</h3>
                  <small className="text-muted">To be added with ledger</small>
                </Card>
              </Col>

              <Col md={3} sm={6}>
                <Card className="border-0 shadow-sm bg-warning bg-opacity-10 p-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-warning small fw-semibold text-uppercase">Real Parent Emails</span>
                    <Mail size={18} className="text-warning" />
                  </div>
                  <h3 className="fw-bold mb-0 text-warning">{previewData.unique_real_parent_emails}</h3>
                  <small className="text-muted">
                    {previewData.dummy_parents_in_system} dummy accounts to upgrade
                  </small>
                </Card>
              </Col>
            </Row>

            {/* Filter & Preview Table */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0">Reconciliation Data Preview (Sample of 150)</h6>
              <div style={{ maxWidth: "260px" }}>
                <Form.Control
                  type="text"
                  placeholder="Filter student or parent..."
                  size="sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="border rounded-3 overflow-hidden shadow-sm mb-3" style={{ maxHeight: "320px", overflowY: "auto" }}>
              <Table hover responsive size="sm" className="mb-0 text-nowrap" style={{ fontSize: "12.5px" }}>
                <thead className="bg-light sticky-top">
                  <tr>
                    <th>Student Name</th>
                    <th>Grade / Room</th>
                    <th>Date of Birth</th>
                    <th>Database Match</th>
                    <th>Associated Parent(s)</th>
                    <th>Real Parent Email(s)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPreviewStudents.map((st, i) => (
                    <tr key={i}>
                      <td className="fw-semibold text-dark">
                        {st.first_name} {st.last_name}
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {st.grade_level}
                        </Badge>
                      </td>
                      <td className="text-muted">{st.date_of_birth || "N/A"}</td>
                      <td>
                        {st.is_matched ? (
                          <Badge bg="success-subtle" className="text-success border border-success-subtle">
                            Matched #{st.matched_student_id}
                          </Badge>
                        ) : (
                          <Badge bg="primary-subtle" className="text-primary border border-primary-subtle">
                            + New Student
                          </Badge>
                        )}
                      </td>
                      <td className="text-muted">{st.parent_names || "None"}</td>
                      <td>
                        <span className="font-monospace text-primary" style={{ fontSize: "11.5px" }}>
                          {st.parent_emails}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredPreviewStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No students match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {/* STEP 3: Options & Confirmation */}
        {step === 3 && (
          <div>
            <h6 className="fw-bold mb-3">Configure Import & Reconciliation Actions</h6>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="p-3 border rounded-3 bg-light">
                <Form.Check
                  type="checkbox"
                  id="opt-upgrade"
                  checked={options.upgrade_dummy_parents}
                  onChange={(e) =>
                    setOptions({ ...options, upgrade_dummy_parents: e.target.checked })
                  }
                  label={
                    <div>
                      <span className="fw-bold text-dark">Upgrade Dummy Parent Accounts In-Place</span>
                      <div className="text-muted small">
                        Replaces temporary <code>@parent.elaaschool.org</code> email addresses with actual verified parent emails, real phone numbers, and sign-in PINs while preserving student links.
                      </div>
                    </div>
                  }
                />
              </div>

              <div className="p-3 border rounded-3 bg-light">
                <Form.Check
                  type="checkbox"
                  id="opt-update-students"
                  checked={options.update_existing_students}
                  onChange={(e) =>
                    setOptions({ ...options, update_existing_students: e.target.checked })
                  }
                  label={
                    <div>
                      <span className="fw-bold text-dark">Update Existing Student Demographics</span>
                      <div className="text-muted small">
                        Applies official Date of Birth, Grade Level, Room, and Student ID numbers to existing student records.
                      </div>
                    </div>
                  }
                />
              </div>

              <div className="p-3 border rounded-3 bg-light">
                <Form.Check
                  type="checkbox"
                  id="opt-create-missing"
                  checked={options.create_missing_students}
                  onChange={(e) =>
                    setOptions({ ...options, create_missing_students: e.target.checked })
                  }
                  label={
                    <div>
                      <span className="fw-bold text-dark">Provision Missing Students ({previewData?.new_students_count || 0})</span>
                      <div className="text-muted small">
                        Creates records and initializes financial accounts for active students who did not have recurring tuition billing plans.
                      </div>
                    </div>
                  }
                />
              </div>

              <div className="p-3 border rounded-3 bg-light">
                <Form.Check
                  type="checkbox"
                  id="opt-cleanup"
                  checked={options.cleanup_unmatched_dummy_parents}
                  onChange={(e) =>
                    setOptions({ ...options, cleanup_unmatched_dummy_parents: e.target.checked })
                  }
                  label={
                    <div>
                      <span className="fw-bold text-dark">Purge Unlinked / Orphaned Dummy Accounts</span>
                      <div className="text-muted small">
                        Deletes any leftover placeholder accounts that have 0 linked students once all real parents are assigned.
                      </div>
                    </div>
                  }
                />
              </div>
            </div>

            <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-0">
              <ShieldCheck size={18} className="flex-shrink-0" />
              <span>
                Parents will be able to log in using their real email. Their sign-in PIN will match their Procare PIN (or default 2963). Password setup invitations can be triggered from the Parent Accounts table anytime.
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: Results */}
        {step === 4 && importResults && (
          <div className="py-2">
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success mb-2"
                style={{ width: "54px", height: "54px" }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h5 className="fw-bold text-dark mb-1">Reconciliation Completed Successfully!</h5>
              <p className="text-muted small mb-0">
                All student records and parent accounts have been updated and synchronized with the master directory.
              </p>
            </div>

            <Row className="g-3 mb-4">
              <Col md={4} sm={6}>
                <div className="p-3 border rounded-3 bg-light text-center">
                  <div className="text-muted small fw-medium">Students Updated</div>
                  <h4 className="fw-bold text-primary mb-0">{importResults.students_updated}</h4>
                </div>
              </Col>
              <Col md={4} sm={6}>
                <div className="p-3 border rounded-3 bg-light text-center">
                  <div className="text-muted small fw-medium">Students Created</div>
                  <h4 className="fw-bold text-success mb-0">{importResults.students_created}</h4>
                </div>
              </Col>
              <Col md={4} sm={6}>
                <div className="p-3 border rounded-3 bg-light text-center">
                  <div className="text-muted small fw-medium">Dummy Parents Upgraded</div>
                  <h4 className="fw-bold text-warning mb-0">{importResults.parents_upgraded}</h4>
                </div>
              </Col>
              <Col md={4} sm={6}>
                <div className="p-3 border rounded-3 bg-light text-center">
                  <div className="text-muted small fw-medium">New Parents Created</div>
                  <h4 className="fw-bold text-info mb-0">{importResults.parents_created}</h4>
                </div>
              </Col>
              <Col md={4} sm={6}>
                <div className="p-3 border rounded-3 bg-light text-center">
                  <div className="text-muted small fw-medium">Sibling Links Made</div>
                  <h4 className="fw-bold text-dark mb-0">{importResults.parents_linked}</h4>
                </div>
              </Col>
              <Col md={4} sm={6}>
                <div className="p-3 border rounded-3 bg-light text-center">
                  <div className="text-muted small fw-medium">Orphan Dummies Cleaned</div>
                  <h4 className="fw-bold text-danger mb-0">{importResults.dummy_accounts_cleaned}</h4>
                </div>
              </Col>
            </Row>

            <div className="p-3 border rounded-3 bg-success bg-opacity-10 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <CheckCircle2 size={18} className="text-success" />
                <span className="small text-success fw-medium">
                  Parents are now mapped with their real contact details. You can now send portal setup invitations.
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-top bg-light px-4 py-3">
        {step === 1 && (
          <div className="d-flex justify-content-between w-100">
            <Button variant="secondary" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleLoadPreview}
              disabled={loadingPreview || (!useDefaultFile && !selectedFile)}
              className="d-flex align-items-center gap-2"
            >
              {loadingPreview ? (
                <>
                  <Spinner size="sm" animation="border" />
                  <span>Processing File...</span>
                </>
              ) : (
                <>
                  <span>Next: Preview Matches</span>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="d-flex justify-content-between w-100">
            <Button
              variant="outline-secondary"
              onClick={() => setStep(1)}
              className="d-flex align-items-center gap-1"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(3)}
              className="d-flex align-items-center gap-2"
            >
              <span>Next: Import Options</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="d-flex justify-content-between w-100">
            <Button
              variant="outline-secondary"
              onClick={() => setStep(2)}
              disabled={importing}
              className="d-flex align-items-center gap-1"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Button>
            <Button
              variant="success"
              onClick={handleExecuteImport}
              disabled={importing}
              className="d-flex align-items-center gap-2"
            >
              {importing ? (
                <>
                  <Spinner size="sm" animation="border" />
                  <span>Reconciling & Importing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Run Reconciliation & Import</span>
                </>
              )}
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="d-flex justify-content-end w-100">
            <Button variant="primary" onClick={handleModalClose}>
              Done & View Parents
            </Button>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default FamilyImportWizardModal;
