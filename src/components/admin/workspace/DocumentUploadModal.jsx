import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import { Upload, FileText, CheckCircle2, AlertCircle, Folder, File, X } from "lucide-react";
import api from "../../../utils/api";
import { toast } from "react-toastify";

const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx", "txt", "png", "jpg", "jpeg", "svg"
];

const DocumentUploadModal = ({ show, onHide, boardId, onUploadSuccess, onViewFiles }) => {
  const [file, setFile] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show && boardId) {
      setFile(null);
      setUploadSuccess(false);
      setUploadedFile(null);
      setErrorMsg("");
      fetchFolders();
    }
  }, [show, boardId]);

  const fetchFolders = async () => {
    try {
      const res = await api.get(`/board-extensions/boards/${boardId}/files`);
      if (res.data && res.data.folders) {
        setFolders(res.data.folders);
      }
    } catch (err) {
      console.error("Failed to load folders:", err);
    }
  };

  const handleFileSelect = (selected) => {
    if (!selected) return;
    const ext = selected.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg(`Unsupported file type (.${ext}). Supported formats: PDF, Word, Excel, CSV, PPT, Text, Images.`);
      return;
    }
    setErrorMsg("");
    setFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a document or PDF file to upload.");
      return;
    }

    try {
      setUploading(true);
      setErrorMsg("");

      const formData = new FormData();
      formData.append("file", file);
      if (selectedFolderId) {
        formData.append("folder_id", selectedFolderId);
      }

      const res = await api.post(`/board-extensions/boards/${boardId}/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success(`"${file.name}" uploaded to Board Reference Center!`);
      setUploadSuccess(true);
      setUploadedFile(res.data);
      if (onUploadSuccess) {
        onUploadSuccess(res.data);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg(err.response?.data?.error || "Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="document-upload-modal">
      <Modal.Header closeButton className="border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle p-2 bg-indigo-50 text-indigo-600 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
            <Upload size={18} />
          </div>
          <div>
            <Modal.Title className="fs-6 fw-bold mb-0 text-slate-800">
              Upload Reference Document / PDF
            </Modal.Title>
            <p className="text-muted small mb-0">
              Share reference sheets, guides, PDFs, or docs directly to this workspace
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="p-4">
        {errorMsg && (
          <Alert variant="danger" className="py-2 px-3 d-flex align-items-center gap-2 small">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </Alert>
        )}

        {uploadSuccess ? (
          <div className="text-center py-4">
            <div className="text-success mb-3">
              <CheckCircle2 size={48} className="mx-auto" />
            </div>
            <h5 className="fw-bold text-slate-800 mb-1">Document Uploaded Successfully!</h5>
            <p className="text-muted small mb-4">
              <strong>{file?.name}</strong> is now accessible to the whole team in the Doc & File Center.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setUploadSuccess(false);
                }}
              >
                Upload Another
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onHide();
                  if (onViewFiles) onViewFiles();
                }}
              >
                View in Doc & File Center
              </Button>
            </div>
          </div>
        ) : (
          <Form onSubmit={handleUpload}>
            {/* Drag & Drop Zone */}
            <div
              className={`upload-drop-zone rounded-3 p-4 text-center mb-3 cursor-pointer transition-all ${
                isDragging ? "border-primary bg-primary-subtle" : "border-2 border-dashed bg-slate-50 hover:bg-slate-100"
              }`}
              style={{
                border: "2px dashed #cbd5e1",
                backgroundColor: isDragging ? "#eef2ff" : "#f8fafc",
                transition: "all 0.2s ease"
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.svg"
              />

              {file ? (
                <div className="d-flex align-items-center justify-content-between p-3 bg-white border rounded-2">
                  <div className="d-flex align-items-center gap-3 text-start">
                    <FileText size={32} className="text-indigo-600 shrink-0" />
                    <div>
                      <div className="fw-semibold text-slate-800 text-truncate" style={{ maxWidth: "340px" }}>
                        {file.name}
                      </div>
                      <div className="text-muted small">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <Button
                    variant="link"
                    className="p-1 text-slate-400 hover:text-slate-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X size={18} />
                  </Button>
                </div>
              ) : (
                <div className="py-2">
                  <div className="d-inline-flex p-3 rounded-circle bg-white shadow-sm text-indigo-600 mb-2">
                    <Upload size={24} />
                  </div>
                  <div className="fw-semibold text-slate-700 mb-1">
                    Click to select or drag and drop document
                  </div>
                  <div className="text-muted small mb-2">
                    PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Images, Text
                  </div>
                  <span className="badge bg-slate-200 text-slate-700 font-monospace small">
                    Max size: 50MB
                  </span>
                </div>
              )}
            </div>

            {/* Destination Folder */}
            {folders.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-slate-700 d-flex align-items-center gap-1">
                  <Folder size={14} className="text-slate-500" />
                  Destination Folder (Optional)
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                >
                  <option value="">Root / Main Directory</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <div className="d-flex justify-content-between align-items-center pt-3 border-top">
              <span className="text-muted small">
                Shared automatically with everyone on this board
              </span>
              <div className="d-flex gap-2">
                <Button variant="light" size="sm" onClick={onHide} disabled={uploading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!file || uploading}
                  className="d-flex align-items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload Document</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default DocumentUploadModal;
