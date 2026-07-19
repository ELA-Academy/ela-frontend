import React, { useState } from "react";
import { Modal, Button, Table, Form, Badge, Spinner, Alert } from "react-bootstrap";
import { Upload, FileText, CheckCircle2, ArrowRight, Table as TableIcon, AlertCircle } from "lucide-react";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const STANDARD_FIELDS = [
  { value: "title", label: "Name / Title (Default)" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "due_date", label: "Due Date" },
  { value: "notes", label: "Notes / Description" },
  { value: "skip", label: "-- Skip Column --" },
];

const CUSTOM_FIELD_TYPES = [
  { value: "text", label: "Custom Field: Text" },
  { value: "number", label: "Custom Field: Number" },
  { value: "date", label: "Custom Field: Date" },
  { value: "dropdown", label: "Custom Field: Dropdown" },
  { value: "currency", label: "Custom Field: Currency" },
];

const SpreadsheetImportModal = ({ show, onHide, boardId, groups = [], existingCustomFields = [], onImportComplete }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping & Preview
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMappings, setColumnMappings] = useState({}); // header -> field target or custom field creation
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const resetState = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setParsedRows([]);
    setColumnMappings({});
    setErrorMsg("");
    setSubmitting(false);
  };

  const parseCSVText = (text) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Helper to parse line handling quotes
    const parseLine = (line) => {
      const result = [];
      let cell = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cell.trim());
          cell = "";
        } else {
          cell += char;
        }
      }
      result.push(cell.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      if (vals.length > 0 && vals.some(v => v.length > 0)) {
        const rowObj = {};
        rawHeaders.forEach((h, idx) => {
          rowObj[h] = vals[idx] || "";
        });
        rows.push(rowObj);
      }
    }
    return { headers: rawHeaders, rows };
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target.result;
        const { headers: parsedHeaders, rows } = parseCSVText(content);

        if (parsedHeaders.length === 0 || rows.length === 0) {
          setErrorMsg("Could not read rows or headers from the uploaded file. Please ensure it is a valid CSV spreadsheet.");
          return;
        }

        setHeaders(parsedHeaders);
        setParsedRows(rows);

        // Auto-detect mappings
        const mappings = {};
        parsedHeaders.forEach((h) => {
          const lowerH = h.toLowerCase().trim();
          if (lowerH.includes("name") || lowerH.includes("task") || lowerH.includes("title")) {
            mappings[h] = { type: "standard", field: "title" };
          } else if (lowerH.includes("status")) {
            mappings[h] = { type: "standard", field: "status" };
          } else if (lowerH.includes("due") || lowerH.includes("date")) {
            mappings[h] = { type: "standard", field: "due_date" };
          } else if (lowerH.includes("prio")) {
            mappings[h] = { type: "standard", field: "priority" };
          } else if (lowerH.includes("note") || lowerH.includes("desc")) {
            mappings[h] = { type: "standard", field: "notes" };
          } else {
            // Check if existing custom field matches
            const matchedCf = existingCustomFields.find(cf => cf.name.toLowerCase() === lowerH);
            if (matchedCf) {
              mappings[h] = { type: "existing_cf", fieldId: matchedCf.id };
            } else {
              // Create new custom field automatically
              let suggestedType = "text";
              if (lowerH.includes("price") || lowerH.includes("cost") || lowerH.includes("amount") || lowerH.includes("budget")) suggestedType = "currency";
              else if (lowerH.includes("count") || lowerH.includes("num") || lowerH.includes("qty")) suggestedType = "number";
              mappings[h] = { type: "new_cf", fieldName: h, cfType: suggestedType };
            }
          }
        });

        setColumnMappings(mappings);
        setStep(2);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to parse spreadsheet file.");
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleMappingChange = (header, targetValue) => {
    setColumnMappings(prev => {
      const updated = { ...prev };
      if (targetValue === "skip") {
        updated[header] = { type: "skip" };
      } else if (["title", "status", "priority", "due_date", "notes"].includes(targetValue)) {
        updated[header] = { type: "standard", field: targetValue };
      } else if (targetValue.startsWith("existing_cf_")) {
        const fieldId = Number(targetValue.replace("existing_cf_", ""));
        updated[header] = { type: "existing_cf", fieldId };
      } else if (targetValue.startsWith("new_cf_")) {
        const cfType = targetValue.replace("new_cf_", "");
        updated[header] = { type: "new_cf", fieldName: header, cfType };
      }
      return updated;
    });
  };

  const handleExecuteImport = async () => {
    setSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Collect new custom fields to create
      const newCustomFieldsToCreate = [];
      Object.entries(columnMappings).forEach(([header, mapVal]) => {
        if (mapVal.type === "new_cf") {
          newCustomFieldsToCreate.push({
            name: mapVal.fieldName,
            type: mapVal.cfType,
            config: mapVal.cfType === "currency" ? { currencySymbol: "$" } : null
          });
        }
      });

      // 2. Format tasks for import
      const tasksToImport = parsedRows.map((row) => {
        const taskObj = { custom_fields: {} };
        Object.entries(columnMappings).forEach(([header, mapVal]) => {
          const val = row[header];
          if (!val || mapVal.type === "skip") return;

          if (mapVal.type === "standard") {
            taskObj[mapVal.field] = val;
          } else if (mapVal.type === "existing_cf") {
            taskObj.custom_fields[mapVal.fieldId] = val;
          } else if (mapVal.type === "new_cf") {
            taskObj.custom_fields[mapVal.fieldName] = val;
          }
        });
        return taskObj;
      });

      const payload = {
        group_id: selectedGroupId ? Number(selectedGroupId) : null,
        new_custom_fields: newCustomFieldsToCreate,
        tasks: tasksToImport
      };

      const res = await api.post(`/board-extensions/boards/${boardId}/import-tasks`, payload);
      showSuccess(res.data?.message || `Successfully imported ${tasksToImport.length} tasks!`);
      
      if (onImportComplete) onImportComplete();
      onHide();
      resetState();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to import tasks from spreadsheet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={() => { onHide(); resetState(); }} size="lg" centered>
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
          <TableIcon className="text-primary" size={20} />
          Import Spreadsheet into Space
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {errorMsg && (
          <Alert variant="danger" dismissible onClose={() => setErrorMsg("")} className="d-flex align-items-center gap-2">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </Alert>
        )}

        {step === 1 && (
          <div className="text-center py-4">
            <div className="p-4 bg-slate-50 rounded-3 border border-dashed text-slate-600 mb-3">
              <Upload size={40} className="text-slate-400 mb-2" />
              <h6 className="fw-bold text-slate-800 mb-1">Select a CSV or Excel Spreadsheet File</h6>
              <p className="small text-muted mb-3">Upload your spreadsheet to map columns directly into ClickUp-style fields.</p>
              
              <Form.Control
                type="file"
                accept=".csv, .txt, .xlsx, .xls"
                onChange={handleFileUpload}
                className="d-none"
                id="spreadsheet-file-input"
              />
              <Button variant="primary" size="sm" onClick={() => document.getElementById("spreadsheet-file-input")?.click()}>
                Choose File
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0">Map Spreadsheet Columns</h6>
                <span className="small text-muted">Review detected columns from <strong>{file?.name}</strong> ({parsedRows.length} rows found)</span>
              </div>
              
              {groups.length > 0 && (
                <Form.Group className="d-flex align-items-center gap-2">
                  <Form.Label className="small mb-0 text-nowrap fw-semibold">Target List:</Form.Label>
                  <Form.Select
                    size="sm"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    style={{ width: "180px" }}
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </div>

            <div className="table-responsive border rounded-3 mb-3" style={{ maxHeight: "320px" }}>
              <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light sticky-top">
                  <tr>
                    <th style={{ width: "25%" }}>Spreadsheet Header</th>
                    <th style={{ width: "25%" }}>Sample Data</th>
                    <th style={{ width: "50%" }}>Maps To Field</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header) => {
                    const sampleVal = parsedRows[0]?.[header] || "-";
                    const mapState = columnMappings[header];

                    let currentSelectVal = "skip";
                    if (mapState?.type === "standard") {
                      currentSelectVal = mapState.field;
                    } else if (mapState?.type === "existing_cf") {
                      currentSelectVal = `existing_cf_${mapState.fieldId}`;
                    } else if (mapState?.type === "new_cf") {
                      currentSelectVal = `new_cf_${mapState.cfType}`;
                    }

                    return (
                      <tr key={header}>
                        <td className="fw-semibold text-slate-800">{header}</td>
                        <td className="text-muted text-truncate" style={{ maxWidth: "150px" }}>
                          <code>{sampleVal}</code>
                        </td>
                        <td>
                          <Form.Select
                            size="sm"
                            value={currentSelectVal}
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                          >
                            <optgroup label="Standard Fields">
                              {STANDARD_FIELDS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </optgroup>
                            
                            {existingCustomFields.length > 0 && (
                              <optgroup label="Existing Custom Fields">
                                {existingCustomFields.map(cf => (
                                  <option key={cf.id} value={`existing_cf_${cf.id}`}>
                                    {cf.name} ({cf.type})
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            <optgroup label="Create New Custom Field">
                              {CUSTOM_FIELD_TYPES.map(cf => (
                                <option key={cf.value} value={`new_cf_${cf.value}`}>
                                  {cf.label}
                                </option>
                              ))}
                            </optgroup>
                          </Form.Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-top">
        {step === 2 && (
          <Button variant="light" size="sm" onClick={() => setStep(1)} disabled={submitting}>
            Back
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => { onHide(); resetState(); }} disabled={submitting}>
          Cancel
        </Button>
        {step === 2 && (
          <Button variant="primary" size="sm" onClick={handleExecuteImport} disabled={submitting}>
            {submitting ? <Spinner size="sm" animation="border" /> : `Import ${parsedRows.length} Task(s)`}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SpreadsheetImportModal;
