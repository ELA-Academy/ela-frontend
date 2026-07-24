import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Badge, Spinner, Alert, ProgressBar } from "react-bootstrap";
import {
  Upload,
  FileText,
  CheckCircle2,
  ArrowRight,
  Table as TableIcon,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  Layers,
  Check,
  X,
  Sparkles,
  Hash,
  DollarSign,
  Calendar,
  CheckSquare,
  ListPlus,
  Mail,
  Phone,
  Tag,
  Star,
  AlignLeft,
  Globe,
  BarChart2,
  FileSpreadsheet,
  Grid,
  Sliders,
  CheckCircle,
  Database
} from "lucide-react";
import * as XLSX from "xlsx";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const STANDARD_FIELDS = [
  { value: "title", label: "Task Name / Title" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "due_date", label: "Due Date" },
  { value: "notes", label: "Notes / Description" },
  { value: "skip", label: "-- Skip Column --" },
];

const CUSTOM_FIELD_DATA_TYPES = [
  { value: "text", label: "Text", icon: FileText, color: "#3b82f6" },
  { value: "number", label: "Number", icon: Hash, color: "#06b6d4" },
  { value: "currency", label: "Money", icon: DollarSign, color: "#10b981" },
  { value: "date", label: "Date", icon: Calendar, color: "#f59e0b" },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare, color: "#6366f1" },
  { value: "dropdown", label: "Dropdown", icon: ListPlus, color: "#14b8a6" },
  { value: "email", label: "Email", icon: Mail, color: "#8b5cf6" },
  { value: "phone", label: "Phone", icon: Phone, color: "#0284c7" },
  { value: "labels", label: "Labels", icon: Tag, color: "#ec4899" },
  { value: "rating", label: "Rating", icon: Star, color: "#eab308" },
  { value: "text_area", label: "Text area (Long text)", icon: AlignLeft, color: "#64748b" },
  { value: "website", label: "Website", icon: Globe, color: "#0891b2" },
  { value: "progress_manual", label: "Progress (Manual)", icon: BarChart2, color: "#059669" },
];

const SpreadsheetImportModal = ({
  show,
  onHide,
  boardId,
  groups = [],
  existingCustomFields = [],
  onImportComplete
}) => {
  // Wizard steps: 1 = Upload, 2 = Select Sheet, 3 = Map Fields, 4 = Data Preview, 5 = Custom Fields Data Types
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);

  // Sheet data
  const [sheetsList, setSheetsList] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);

  // Mapping state
  const [columnMappings, setColumnMappings] = useState({});
  const [newCustomFieldsMap, setNewCustomFieldsMap] = useState({});
  const [focusedHeader, setFocusedHeader] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || "");

  // Grid preview state
  const [previewFilterTab, setPreviewFilterTab] = useState("all");
  const [previewSearch, setPreviewSearch] = useState("");

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [importCompletedTasks, setImportCompletedTasks] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0]?.id || "");
    }
  }, [groups, selectedGroupId]);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setUploadProgress(0);
    setIsParsing(false);
    setSheetsList([]);
    setSelectedSheetName("");
    setHeaders([]);
    setParsedRows([]);
    setColumnMappings({});
    setNewCustomFieldsMap({});
    setFocusedHeader("");
    setPreviewFilterTab("all");
    setPreviewSearch("");
    setSubmitting(false);
    setImportCompletedTasks([]);
    setErrorMsg("");
  };

  // Step 1: Handle File Upload with Progress Bar
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrorMsg("");
    setIsParsing(true);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 15;
      });
    }, 120);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target.result;
        const workbook = XLSX.read(buffer, { type: "array" });

        const parsedSheets = workbook.SheetNames.map((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          let sheetHeaders = [];
          if (jsonRows.length > 0) {
            sheetHeaders = Object.keys(jsonRows[0]);
          }
          return {
            name: sheetName,
            columnsCount: sheetHeaders.length,
            rowsCount: jsonRows.length,
            headers: sheetHeaders,
            rows: jsonRows
          };
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        setTimeout(() => {
          setIsParsing(false);
          setSheetsList(parsedSheets);

          if (parsedSheets.length === 0) {
            setErrorMsg("No readable sheets found in the uploaded file.");
            return;
          }

          if (parsedSheets.length > 1) {
            setSelectedSheetName(parsedSheets[0].name);
            setStep(2);
          } else {
            selectSheetAndInitializeMapping(parsedSheets[0]);
          }
        }, 250);
      } catch (err) {
        clearInterval(progressInterval);
        setIsParsing(false);
        console.error(err);
        setErrorMsg("Failed to parse file. Please upload a valid .xlsx, .xls, or .csv file.");
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const selectSheetAndInitializeMapping = (sheetObj) => {
    const rawHeaders = sheetObj.headers || [];
    const rows = sheetObj.rows || [];

    setHeaders(rawHeaders);
    setParsedRows(rows);

    const mappings = {};
    const newCfMap = {};

    rawHeaders.forEach((h) => {
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
        const matchedCf = existingCustomFields.find(cf => cf.name.toLowerCase() === lowerH);
        if (matchedCf) {
          mappings[h] = { type: "existing_cf", fieldId: matchedCf.id };
        } else {
          mappings[h] = { type: "new_cf", fieldName: h };
          let suggestedType = "text";
          if (lowerH.includes("price") || lowerH.includes("cost") || lowerH.includes("amount") || lowerH.includes("fee") || lowerH.includes("paid")) suggestedType = "currency";
          else if (lowerH.includes("count") || lowerH.includes("num") || lowerH.includes("qty")) suggestedType = "number";
          newCfMap[h] = { fieldName: h, dataType: suggestedType };
        }
      }
    });

    setColumnMappings(mappings);
    setNewCustomFieldsMap(newCfMap);
    setFocusedHeader(rawHeaders[0] || "");
    setStep(3);
  };

  const handleConfirmSheetSelection = () => {
    const targetSheet = sheetsList.find(s => s.name === selectedSheetName) || sheetsList[0];
    if (targetSheet) {
      selectSheetAndInitializeMapping(targetSheet);
    }
  };

  const handleMappingChange = (header, selectValue) => {
    setColumnMappings((prev) => {
      const updated = { ...prev };
      if (selectValue === "skip") {
        updated[header] = { type: "skip" };
        const newCfCopy = { ...newCustomFieldsMap };
        delete newCfCopy[header];
        setNewCustomFieldsMap(newCfCopy);
      } else if (["title", "status", "priority", "due_date", "notes"].includes(selectValue)) {
        updated[header] = { type: "standard", field: selectValue };
        const newCfCopy = { ...newCustomFieldsMap };
        delete newCfCopy[header];
        setNewCustomFieldsMap(newCfCopy);
      } else if (selectValue.startsWith("existing_cf_")) {
        const fieldId = Number(selectValue.replace("existing_cf_", ""));
        updated[header] = { type: "existing_cf", fieldId };
        const newCfCopy = { ...newCustomFieldsMap };
        delete newCfCopy[header];
        setNewCustomFieldsMap(newCfCopy);
      } else if (selectValue === "add_new_cf") {
        updated[header] = { type: "new_cf", fieldName: header };
        setNewCustomFieldsMap((prevMap) => ({
          ...prevMap,
          [header]: { fieldName: header, dataType: "text" }
        }));
      }
      return updated;
    });
  };

  const missingMappingsCount = Object.values(columnMappings).filter(
    (m) => !m || !m.type || m.type === "skip"
  ).length;

  const handleExecuteImportData = async () => {
    setSubmitting(true);
    setErrorMsg("");

    try {
      const tasksToImport = parsedRows.map((row) => {
        const taskObj = { custom_fields: {} };
        Object.entries(columnMappings).forEach(([header, mapVal]) => {
          const val = row[header];
          if (val === undefined || val === null || val === "" || mapVal.type === "skip") return;

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

      const hasNewCustomFields = Object.values(columnMappings).some(m => m.type === "new_cf");

      if (hasNewCustomFields) {
        setImportCompletedTasks(tasksToImport);
        setStep(5);
        setSubmitting(false);
      } else {
        const payload = {
          group_id: selectedGroupId ? Number(selectedGroupId) : null,
          new_custom_fields: [],
          tasks: tasksToImport
        };

        const res = await api.post(`/board-extensions/boards/${boardId}/import-tasks`, payload);
        showSuccess(res.data?.message || `Successfully imported ${tasksToImport.length} tasks!`);
        if (onImportComplete) onImportComplete();
        onHide();
        resetState();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to process spreadsheet import.");
      setSubmitting(false);
    }
  };

  const handleFinalizeDataTypesAndComplete = async () => {
    setSubmitting(true);
    setErrorMsg("");

    try {
      const newCustomFieldsPayload = [];
      Object.entries(columnMappings).forEach(([header, mapVal]) => {
        if (mapVal.type === "new_cf") {
          const cfConfig = newCustomFieldsMap[header] || { dataType: "text" };
          const dataType = cfConfig.dataType || "text";
          newCustomFieldsPayload.push({
            name: mapVal.fieldName,
            type: dataType,
            config: dataType === "currency" ? { currencySymbol: "$" } : null
          });
        }
      });

      const payload = {
        group_id: selectedGroupId ? Number(selectedGroupId) : null,
        new_custom_fields: newCustomFieldsPayload,
        tasks: importCompletedTasks.length > 0 ? importCompletedTasks : parsedRows.map((row) => {
          const taskObj = { custom_fields: {} };
          Object.entries(columnMappings).forEach(([header, mapVal]) => {
            const val = row[header];
            if (val === undefined || val === null || val === "" || mapVal.type === "skip") return;

            if (mapVal.type === "standard") {
              taskObj[mapVal.field] = val;
            } else if (mapVal.type === "existing_cf") {
              taskObj.custom_fields[mapVal.fieldId] = val;
            } else if (mapVal.type === "new_cf") {
              taskObj.custom_fields[mapVal.fieldName] = val;
            }
          });
          return taskObj;
        })
      };

      const res = await api.post(`/board-extensions/boards/${boardId}/import-tasks`, payload);
      showSuccess(res.data?.message || `Successfully imported records into board!`);
      if (onImportComplete) onImportComplete();
      onHide();
      resetState();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to save custom fields and import records.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPreviewRows = parsedRows.filter((r) => {
    if (!previewSearch.trim()) return true;
    const query = previewSearch.toLowerCase().trim();
    return Object.values(r).some((val) => String(val).toLowerCase().includes(query));
  });

  const STEPS_NAV = [
    { num: 1, label: "Upload File", icon: Upload },
    { num: 2, label: "Select Sheet", icon: FileSpreadsheet },
    { num: 3, label: "Map Fields", icon: Sliders },
    { num: 4, label: "Data Preview", icon: Grid },
    { num: 5, label: "Field Types", icon: Database }
  ];

  return (
    <Modal
      show={show}
      onHide={() => {
        onHide();
        resetState();
      }}
      dialogClassName="modal-95w modal-vh-90 border-0"
      centered
      backdrop="static"
    >
      <div className="d-flex flex-column h-100 bg-white rounded-4 overflow-hidden shadow-2xl border">
        {/* Sleek Header Stepper Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 d-flex align-items-center justify-content-between border-bottom border-slate-800">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-3 d-flex align-items-center justify-content-center shadow-sm">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h5 className="fw-bold fs-6 mb-0 text-white tracking-wide">
                Spreadsheet Importer Studio
              </h5>
              <span className="text-slate-400" style={{ fontSize: "11.5px" }}>
                {file ? file.name : "Import Excel (.xlsx, .xls) & CSV files smoothly into your workspace"}
              </span>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="d-none d-md-flex align-items-center gap-2">
            {STEPS_NAV.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div
                  key={s.num}
                  className={`d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white font-bold shadow"
                      : isDone
                      ? "bg-slate-800 text-slate-300 font-semibold"
                      : "text-slate-500 font-medium opacity-60"
                  }`}
                  style={{ fontSize: "11.5px" }}
                >
                  {isDone ? <CheckCircle size={13} className="text-emerald-400" /> : <Icon size={13} />}
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="d-flex align-items-center gap-2">
            {step === 3 && (
              <>
                <Button variant="outline-light" size="sm" onClick={() => setStep(sheetsList.length > 1 ? 2 : 1)} className="border-slate-700 text-xs px-3">
                  Back
                </Button>
                <Button variant="primary" size="sm" onClick={() => setStep(4)} className="bg-indigo-600 border-0 fw-semibold text-xs px-3 shadow">
                  Continue <ArrowRight size={13} className="ms-1" />
                </Button>
              </>
            )}
            {step === 4 && (
              <>
                <Button variant="outline-light" size="sm" onClick={() => setStep(3)} className="border-slate-700 text-xs px-3">
                  Back to Mapping
                </Button>
                <Button variant="success" size="sm" onClick={handleExecuteImportData} disabled={submitting} className="bg-emerald-600 border-0 fw-semibold text-xs px-3 shadow">
                  {submitting ? <Spinner size="sm" animation="border" /> : "Import into App"}
                </Button>
              </>
            )}
            <button
              type="button"
              className="btn btn-link text-slate-400 hover-text-white p-1 ms-2 border-0"
              onClick={() => { onHide(); resetState(); }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-grow-1 overflow-auto p-4 bg-slate-50/50" style={{ minHeight: "480px" }}>
          {errorMsg && (
            <Alert variant="danger" dismissible onClose={() => setErrorMsg("")} className="d-flex align-items-center gap-2 text-xs mb-4 shadow-sm border-danger-subtle">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </Alert>
          )}

          {/* STAGE 1: UPLOAD FILE & PROGRESS BAR */}
          {step === 1 && (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center py-5">
              <div
                className="w-100 border-2 border-dashed rounded-4 p-5 bg-white shadow-sm d-flex flex-column align-items-center justify-content-center text-center transition-all hover:border-indigo-400"
                style={{ maxWidth: "680px", borderColor: "#cbd5e1" }}
              >
                <div className="bg-indigo-50 text-indigo-600 p-4 rounded-circle mb-3 shadow-inner">
                  <Upload size={42} />
                </div>
                <h4 className="fw-bold text-slate-800 mb-1">Upload Spreadsheet File</h4>
                <p className="text-slate-500 text-sm mb-4" style={{ maxWidth: "460px" }}>
                  Select or drag an `.xlsx`, `.xls`, or `.csv` spreadsheet file. We'll automatically inspect the columns and sheets for seamless mapping.
                </p>

                {isParsing ? (
                  <div className="w-100 px-4" style={{ maxWidth: "420px" }}>
                    <div className="d-flex justify-content-between text-xs font-bold text-slate-600 mb-2">
                      <span className="d-flex align-items-center gap-1.5">
                        <Spinner size="sm" animation="border" className="text-indigo-600" />
                        Reading spreadsheet...
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <ProgressBar animated now={uploadProgress} variant="primary" style={{ height: "8px", borderRadius: "4px" }} />
                  </div>
                ) : (
                  <>
                    <Form.Control
                      type="file"
                      accept=".xlsx, .xls, .csv, .txt"
                      onChange={handleFileUpload}
                      className="d-none"
                      id="spreadsheet-file-upload-input"
                    />
                    <Button
                      variant="primary"
                      className="px-5 py-2.5 fw-bold bg-indigo-600 border-0 rounded-3 shadow-sm hover:bg-indigo-700 transition-all text-sm"
                      onClick={() => document.getElementById("spreadsheet-file-upload-input")?.click()}
                    >
                      <Upload size={16} className="me-2" /> Upload File
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STAGE 2: SELECT SHEET */}
          {step === 2 && (
            <div className="max-w-3xl mx-auto py-3">
              <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                <h5 className="fw-bold text-slate-800 mb-1">Select a sheet to load data from</h5>
                <p className="text-slate-500 text-xs mb-3">
                  This workbook contains multiple sheets. Choose which sheet you want to import data from.
                </p>

                <div className="d-flex align-items-center gap-2 p-2.5 bg-slate-50 rounded-3 border text-slate-700 text-xs font-semibold mb-4">
                  <FileSpreadsheet size={16} className="text-indigo-600" />
                  <span>[file] {file?.name}</span>
                </div>

                <div className="d-flex flex-column gap-2 mb-2">
                  {sheetsList.map((s) => {
                    const isSelected = selectedSheetName === s.name;
                    return (
                      <div
                        key={s.name}
                        className={`d-flex align-items-center justify-content-between p-3.5 rounded-3 border cursor-pointer transition-all ${
                          isSelected ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "bg-white hover:bg-slate-50"
                        }`}
                        onClick={() => setSelectedSheetName(s.name)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <Form.Check
                            type="radio"
                            name="sheetSelectRadio"
                            checked={isSelected}
                            onChange={() => setSelectedSheetName(s.name)}
                            className="cursor-pointer mb-0"
                          />
                          <span className="fw-bold text-slate-800 text-sm">
                            {s.name}
                          </span>
                        </div>
                        <Badge bg="light" className="text-slate-600 border px-2.5 py-1 text-xs font-medium">
                          {s.columnsCount} columns ({s.rowsCount} rows)
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <Button variant="primary" className="px-4 py-2 fw-bold bg-indigo-600 border-0 shadow" onClick={handleConfirmSheetSelection}>
                  Continue <ArrowRight size={14} className="ms-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STAGE 3: MAP FIELDS */}
          {step === 3 && (
            <div className="h-100 d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between mb-3 bg-white p-3 rounded-3 border shadow-sm">
                <div>
                  <h6 className="fw-bold mb-0 text-slate-800">Review and confirm each mapping choice</h6>
                  <span className="text-slate-500 text-xs">
                    Map columns from <strong>{selectedSheetName || file?.name}</strong> to list fields or pick "+ Add Custom Field".
                  </span>
                </div>
                {groups.length > 0 && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Target List:</span>
                    <Form.Select
                      size="sm"
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="border-slate-300 text-xs fw-semibold"
                      style={{ width: "180px" }}
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </Form.Select>
                  </div>
                )}
              </div>

              <div className="row g-4 flex-grow-1">
                {/* Left Side: Fields list */}
                <div className="col-md-7 border-end pe-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      INCOMING FIELDS ({headers.length})
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">LIST FIELDS</span>
                      {missingMappingsCount > 0 && (
                        <Badge bg="danger-subtle" className="text-danger border border-danger-subtle font-semibold" style={{ fontSize: "10px" }}>
                          {missingMappingsCount} unmapped
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2 overflow-auto flex-grow-1 pe-1" style={{ maxHeight: "420px" }}>
                    {headers.map((header) => {
                      const mapState = columnMappings[header];
                      const isFocused = focusedHeader === header;

                      let selectVal = "skip";
                      if (mapState?.type === "standard") selectVal = mapState.field;
                      else if (mapState?.type === "existing_cf") selectVal = `existing_cf_${mapState.fieldId}`;
                      else if (mapState?.type === "new_cf") selectVal = "add_new_cf";

                      return (
                        <div
                          key={header}
                          className={`d-flex align-items-center justify-content-between p-3 rounded-3 border transition-all ${
                            isFocused ? "border-indigo-600 bg-indigo-50/40 shadow-sm" : "bg-white hover:bg-slate-50"
                          }`}
                          onMouseEnter={() => setFocusedHeader(header)}
                          onClick={() => setFocusedHeader(header)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex align-items-center gap-2 min-w-0 me-2">
                            <Sliders size={14} className="text-indigo-600 flex-shrink-0" />
                            <span className="fw-semibold text-slate-800 text-truncate text-sm">
                              {header}
                            </span>
                          </div>

                          <ChevronRight size={14} className="text-slate-300 mx-2 flex-shrink-0" />

                          <Form.Select
                            size="sm"
                            value={selectVal}
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                            className="border-slate-300 text-xs font-medium flex-shrink-0"
                            style={{ width: "220px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="skip">-- Select / Skip --</option>

                            <optgroup label="Standard Fields">
                              {STANDARD_FIELDS.filter(f => f.value !== "skip").map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </optgroup>

                            {existingCustomFields.length > 0 && (
                              <optgroup label="Existing Custom Fields">
                                {existingCustomFields.map((cf) => (
                                  <option key={cf.id} value={`existing_cf_${cf.id}`}>
                                    {cf.name} ({cf.type})
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            <optgroup label="Add Custom Field">
                              <option value="add_new_cf">+ Add Custom Field ({header})</option>
                            </optgroup>
                          </Form.Select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Data preview for focused header */}
                <div className="col-md-5 ps-3 d-flex flex-column">
                  <div className="card border shadow-sm rounded-3 overflow-hidden flex-grow-1 d-flex flex-column bg-white">
                    <div className="card-header bg-slate-900 text-white py-2.5 px-3 border-bottom d-flex align-items-center justify-content-between">
                      <span className="fw-bold text-xs">
                        Data preview for <span className="text-indigo-400">{focusedHeader || headers[0]}</span>
                      </span>
                      <Badge bg="secondary" className="text-xs">Top Sample Values</Badge>
                    </div>
                    <div className="card-body p-0 overflow-auto flex-grow-1" style={{ maxHeight: "390px" }}>
                      <Table hover striped borderless className="align-middle mb-0 text-xs">
                        <tbody>
                          {parsedRows.slice(0, 15).map((row, idx) => (
                            <tr key={idx} className="border-bottom border-slate-100">
                              <td className="py-2 px-3 text-slate-700">
                                {row[focusedHeader || headers[0]] !== undefined && row[focusedHeader || headers[0]] !== "" ? (
                                  String(row[focusedHeader || headers[0]])
                                ) : (
                                  <span className="text-slate-400 italic">(empty)</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: PREVIEW DATA GRID */}
          {step === 4 && (
            <div className="h-100 d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between mb-3 bg-white p-3 rounded-3 border shadow-sm">
                <div className="d-flex align-items-center gap-2">
                  <div className="input-group input-group-sm" style={{ width: "240px" }}>
                    <span className="input-group-text bg-white text-slate-400 border-end-0">
                      <Search size={13} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 text-xs"
                      placeholder="Filter records..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <span className="text-slate-700 font-bold text-xs">
                    {filteredPreviewRows.length} Records Detected
                  </span>

                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className={`btn btn-xs ${previewFilterTab === "all" ? "btn-dark font-bold" : "btn-outline-secondary"}`}
                      onClick={() => setPreviewFilterTab("all")}
                      style={{ fontSize: "11px" }}
                    >
                      All ({filteredPreviewRows.length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${previewFilterTab === "valid" ? "btn-dark font-bold" : "btn-outline-secondary"}`}
                      onClick={() => setPreviewFilterTab("valid")}
                      style={{ fontSize: "11px" }}
                    >
                      Valid {filteredPreviewRows.length}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${previewFilterTab === "invalid" ? "btn-dark font-bold" : "btn-outline-secondary"}`}
                      onClick={() => setPreviewFilterTab("invalid")}
                      style={{ fontSize: "11px" }}
                    >
                      Invalid 0
                    </button>
                  </div>
                </div>
              </div>

              <div className="table-responsive border rounded-3 bg-white shadow-sm flex-grow-1 overflow-auto" style={{ maxHeight: "420px" }}>
                <Table hover striped borderless className="align-middle mb-0 text-xs">
                  <thead className="bg-slate-900 text-white sticky-top">
                    <tr>
                      <th style={{ width: "40px" }} className="text-center text-slate-400 py-2">#</th>
                      {headers.filter(h => columnMappings[h]?.type !== "skip").map((h) => (
                        <th key={h} className="fw-bold text-slate-200 px-3 py-2 text-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreviewRows.map((row, idx) => (
                      <tr key={idx} className="border-bottom border-slate-100">
                        <td className="text-slate-400 text-center font-semibold py-2" style={{ fontSize: "11px" }}>
                          {idx + 1}
                        </td>
                        {headers.filter(h => columnMappings[h]?.type !== "skip").map((h) => (
                          <td key={h} className="px-3 py-2 text-slate-800 text-truncate" style={{ maxWidth: "200px" }}>
                            {row[h] !== undefined && row[h] !== null ? String(row[h]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {/* STAGE 5: CUSTOM FIELDS DATA TYPE MAPPING */}
          {step === 5 && (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center py-4">
              <div className="w-100 bg-white p-5 rounded-4 shadow-sm border text-center" style={{ maxWidth: "780px" }}>
                <div className="mb-4">
                  <Badge bg="indigo-subtle" className="text-indigo-600 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2">
                    STEP 3 - DATA TYPE DEFINITION
                  </Badge>
                  <h4 className="fw-bold text-slate-900 fs-5">Custom Fields Mapping</h4>
                  <p className="text-slate-500 text-xs" style={{ maxWidth: "520px", margin: "0 auto" }}>
                    Review and refine Custom Field mappings—set data types for newly created fields or map to existing values.
                  </p>
                </div>

                {submitting ? (
                  <div className="py-5 d-flex flex-column align-items-center justify-content-center">
                    <Spinner animation="border" variant="primary" className="mb-3" style={{ width: "2.5rem", height: "2.5rem" }} />
                    <h6 className="fw-bold text-slate-800 mb-1">Finalizing Custom Fields & Importing Records...</h6>
                    <p className="text-slate-400 text-xs">Please wait while your spreadsheet data is stored in your workspace.</p>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-between text-xs font-bold text-slate-400 mb-3 px-3">
                      <span>COLUMN:</span>
                      <span>DATA TYPE:</span>
                    </div>

                    <div className="d-flex flex-column gap-2 mb-4 overflow-auto pe-1" style={{ maxHeight: "300px" }}>
                      {Object.entries(columnMappings)
                        .filter(([_, mapVal]) => mapVal.type === "new_cf")
                        .map(([header, mapVal]) => {
                          const currentType = newCustomFieldsMap[header]?.dataType || "text";
                          return (
                            <div key={header} className="d-flex align-items-center justify-content-between p-3 bg-slate-50 rounded-3 border border-slate-200">
                              <div className="d-flex align-items-center gap-2">
                                <Database size={15} className="text-indigo-600" />
                                <span className="fw-bold text-slate-800 text-sm">
                                  {mapVal.fieldName} <span className="text-slate-400 font-normal text-xs">(new)</span>
                                </span>
                              </div>

                              <div className="d-flex align-items-center gap-2">
                                <ArrowRight size={16} className="text-slate-400 me-2" />
                                <Form.Select
                                  size="sm"
                                  value={currentType}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewCustomFieldsMap((prev) => ({
                                      ...prev,
                                      [header]: { fieldName: mapVal.fieldName, dataType: val }
                                    }));
                                  }}
                                  className="border-slate-300 text-xs font-semibold"
                                  style={{ width: "220px" }}
                                >
                                  {CUSTOM_FIELD_DATA_TYPES.map((dt) => {
                                    const IconComp = dt.icon;
                                    return (
                                      <option key={dt.value} value={dt.value}>
                                        {dt.label}
                                      </option>
                                    );
                                  })}
                                </Form.Select>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="d-flex justify-content-end gap-2 border-top pt-4">
                      <Button variant="light" onClick={() => setStep(4)} disabled={submitting} className="border-slate-200 text-xs font-semibold px-4">
                        Back to Preview
                      </Button>
                      <Button variant="primary" className="px-5 py-2 fw-bold bg-indigo-600 border-0 shadow text-xs" onClick={handleFinalizeDataTypesAndComplete} disabled={submitting}>
                        Complete Import
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SpreadsheetImportModal;
