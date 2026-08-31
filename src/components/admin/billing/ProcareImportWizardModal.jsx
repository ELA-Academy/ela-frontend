import React, { useState } from "react";
import { Modal, Button, Form, Table, Alert, Spinner } from "react-bootstrap";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const ProcareImportWizardModal = ({ show, handleClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedPlans, setParsedPlans] = useState([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError("");

    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/);
        const headers = lines[0]?.split(",").map(h => h.trim().toLowerCase());

        const items = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const row = lines[i].split(",").map(cell => cell.trim());
          if (row.length === 0) continue;

          // Map CSV columns: Plan Name, Cycle, Amount, Description
          const planName = row[0] || `Tuition Plan ${i}`;
          const cycle = row[1] || "Monthly";
          const amount = parseFloat(row[2] || 0);
          const description = row[3] || "Tuition Fee";

          items.push({
            plan_name: planName,
            cycle: cycle,
            amount: amount,
            description: description,
            items: [
              {
                description: description,
                amount: amount,
                type: "New Item"
              }
            ]
          });
        }

        if (items.length === 0) {
          setError("No valid plan data rows found in CSV. Please use format: Plan Name, Cycle, Amount, Description");
        } else {
          setParsedPlans(items);
        }
      } catch (err) {
        setError("Error parsing CSV file. Please ensure it is formatted as plain text CSV.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleExecuteImport = async () => {
    if (parsedPlans.length === 0) {
      showError("No parsed plan data to import.");
      return;
    }

    try {
      setImporting(true);
      setError("");
      const res = await api.post("/billing/import-procare-plans", { plans: parsedPlans });
      showSuccess(res.data?.message || "Procare plans imported successfully!");
      if (onImportSuccess) onImportSuccess();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to import Procare plans.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="font-prompt">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold text-slate-800 d-flex align-items-center gap-2">
          <FileSpreadsheet className="text-success" size={20} />
          Import Procare Tuition Plans
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="bg-light p-3 rounded-3 border mb-3">
          <h6 className="fw-bold mb-1 style-slate-800" style={{ fontSize: "0.85rem" }}>
            Data Import Instructions
          </h6>
          <p className="text-muted mb-2" style={{ fontSize: "0.78rem" }}>
            Export your current tuition plans or billing roster from Procare as a CSV spreadsheet file. Upload the CSV file below to automatically import all plan templates into the ELA app.
          </p>
          <div className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>
            Expected CSV Format Columns: <code>Plan Name, Cycle, Amount, Description</code>
          </div>
        </div>

        {error && <Alert variant="danger" className="py-2 px-3 small mb-3">{error}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold small text-slate-700">Select Procare CSV File</Form.Label>
          <Form.Control type="file" accept=".csv, .txt" onChange={handleFileChange} />
        </Form.Group>

        {parsedPlans.length > 0 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-success small d-flex align-items-center gap-1">
                <CheckCircle2 size={15} /> Preview Parsed Plans ({parsedPlans.length} plans ready)
              </span>
            </div>

            <div className="border rounded-3 overflow-hidden" style={{ maxHeight: "220px", overflowY: "auto" }}>
              <Table hover size="sm" className="m-0" style={{ fontSize: "0.8rem" }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th>Plan Name</th>
                    <th>Cycle</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedPlans.map((plan, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{plan.plan_name}</td>
                      <td>{plan.cycle}</td>
                      <td className="fw-bold text-primary">${plan.amount?.toFixed(2)}</td>
                      <td>{plan.description}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={handleExecuteImport}
          disabled={importing || parsedPlans.length === 0}
          className="d-flex align-items-center gap-1 px-3 fw-bold"
        >
          {importing ? (
            <>
              <Spinner animation="border" size="sm" /> Importing...
            </>
          ) : (
            <>
              <Upload size={14} /> Import {parsedPlans.length} Plans
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProcareImportWizardModal;
