import React, { useState, useRef } from "react";
import { Modal, Button, Alert, Spinner, Form } from "react-bootstrap";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck
} from "lucide-react";
import { importFamilies } from "../../../services/administrationService";
import { toast } from "react-toastify";

const FamilyImportWizardModal = ({ show, onHide, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleReset = () => {
    setSelectedFile(null);
    setImporting(false);
    setResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleModalClose = () => {
    handleReset();
    onHide();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = [".xlsx", ".xls", ".csv"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!validExtensions.includes(ext)) {
        setError("Please upload an Excel spreadsheet (.xlsx, .xls) or CSV (.csv) file.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError("");
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError("");
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) {
      setError("Please select a file to import.");
      return;
    }

    setError("");
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("update_existing_students", "true");
      formData.append("create_missing_students", "true");
      formData.append("upgrade_dummy_parents", "true");
      formData.append("cleanup_unmatched_dummy_parents", "true");

      const res = await importFamilies(formData);
      const resData = res.results || res;
      setResult(resData);
      toast.success("Student and parent records successfully imported!");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Import error:", err);
      const msg =
        err.response?.data?.error ||
        "Failed to import file. Please check that the file format contains student and parent columns.";
      setError(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleModalClose}
      centered
      backdrop="static"
      keyboard={!importing}
    >
      <Modal.Header closeButton={!importing} className="border-bottom px-4 py-3">
        <div className="d-flex align-items-center gap-2">
          <FileSpreadsheet size={20} className="text-primary" />
          <Modal.Title className="h6 mb-0 fw-bold">
            Import Students & Families
          </Modal.Title>
        </div>
      </Modal.Header>

      <Modal.Body className="p-4">
        {error && (
          <Alert variant="danger" className="d-flex align-items-center gap-2 mb-3 py-2 px-3 small">
            <AlertCircle size={18} className="flex-shrink-0" />
            <div>{error}</div>
          </Alert>
        )}

        {result ? (
          /* Success Screen */
          <div className="text-center py-3">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success mb-3"
              style={{ width: "56px", height: "56px" }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h5 className="fw-bold text-dark mb-1">Import Completed!</h5>
            <p className="text-muted small mb-4">
              All students and parent records from <strong>{selectedFile?.name}</strong> have been imported.
            </p>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className="p-2.5 border rounded-3 bg-light text-center">
                  <div className="text-muted small" style={{ fontSize: "11px" }}>Students Updated</div>
                  <h5 className="fw-bold text-primary mb-0">{result.students_updated ?? 0}</h5>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2.5 border rounded-3 bg-light text-center">
                  <div className="text-muted small" style={{ fontSize: "11px" }}>Students Created</div>
                  <h5 className="fw-bold text-success mb-0">{result.students_created ?? 0}</h5>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2.5 border rounded-3 bg-light text-center">
                  <div className="text-muted small" style={{ fontSize: "11px" }}>Parents Linked / Updated</div>
                  <h5 className="fw-bold text-dark mb-0">
                    {(result.parents_upgraded ?? 0) + (result.parents_linked ?? 0) + (result.parents_created ?? 0)}
                  </h5>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2.5 border rounded-3 bg-light text-center">
                  <div className="text-muted small" style={{ fontSize: "11px" }}>Accounts Cleaned</div>
                  <h5 className="fw-bold text-secondary mb-0">{result.dummy_accounts_cleaned ?? 0}</h5>
                </div>
              </div>
            </div>

            <div className="text-muted small" style={{ fontSize: "12px" }}>
              Accounting and administration can view, search, and edit parent emails and details anytime.
            </div>
          </div>
        ) : (
          /* File Upload Screen */
          <div>
            <p className="text-muted small mb-3">
              Upload your school directory spreadsheet (<code>.xlsx</code> or <code>.csv</code>) to create or update student and parent accounts, map contact details, and link siblings.
            </p>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border border-2 border-dashed rounded-3 p-4 text-center cursor-pointer transition-all"
              style={{
                borderColor: selectedFile ? "#0d6efd" : "#cbd5e1",
                backgroundColor: selectedFile ? "rgba(13, 110, 253, 0.03)" : "#f8fafc",
                cursor: "pointer"
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              {selectedFile ? (
                <div>
                  <FileCheck size={40} className="text-primary mb-2" />
                  <div className="fw-bold text-dark">{selectedFile.name}</div>
                  <div className="text-muted small">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to replace
                  </div>
                </div>
              ) : (
                <div>
                  <UploadCloud size={40} className="text-muted mb-2" />
                  <div className="fw-semibold text-dark mb-1">
                    Click to browse or drag & drop file here
                  </div>
                  <div className="text-muted small">Supports Excel (.xlsx, .xls) and CSV (.csv)</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-top px-4 py-3 bg-light">
        {result ? (
          <Button variant="primary" onClick={handleModalClose} className="w-100">
            Done
          </Button>
        ) : (
          <div className="d-flex justify-content-between w-100 gap-2">
            <Button variant="secondary" onClick={handleModalClose} disabled={importing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteImport}
              disabled={importing || !selectedFile}
              className="d-flex align-items-center gap-2"
            >
              {importing ? (
                <>
                  <Spinner size="sm" animation="border" />
                  <span>Importing File...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Import File</span>
                </>
              )}
            </Button>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default FamilyImportWizardModal;
