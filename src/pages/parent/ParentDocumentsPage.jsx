import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  Plus,
  X,
  FileCheck,
  FolderOpen
} from "lucide-react";
import api from "../../utils/api";
import { toast } from "react-toastify";

const ParentDocumentsPage = () => {
  const { activeStudent, setActiveStudent, childrenList } = useOutletContext();
  const [docsData, setDocsData] = useState({ documents: [], document_requests: [] });
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Upload form state
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Document");
  const [targetStudentId, setTargetStudentId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [activeStudent]);

  const fetchDocuments = () => {
    setLoading(true);
    const url = activeStudent ? `/parent/documents?student_id=${activeStudent.id}` : "/parent/documents";
    api.get(url)
      .then((res) => {
        setDocsData(res.data);
      })
      .catch((err) => {
        console.error("Failed to load parent documents:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOpenUpload = (preselectedType = "Document") => {
    setDocType(preselectedType);
    setTargetStudentId(activeStudent?.id || childrenList?.[0]?.id || "");
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", docName || selectedFile.name);
    formData.append("document_type", docType);
    formData.append("student_id", targetStudentId);
    if (expiryDate) {
      formData.append("expiry_date", expiryDate);
    }

    try {
      await api.post("/parent/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Document uploaded successfully!");
      setUploadModalOpen(false);
      setDocName("");
      setSelectedFile(null);
      setExpiryDate("");
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const documents = docsData.documents || [];
  const documentRequests = docsData.document_requests || [];

  return (
    <div>
      <div className="parent-page-header">
        <h1 className="parent-page-title">Documents</h1>
        <button
          onClick={() => handleOpenUpload("Document")}
          className="btn-parent-primary"
          style={{ width: "auto", padding: "0.65rem 1.35rem" }}
        >
          <Upload size={16} />
          <span>UPLOAD DOCUMENT</span>
        </button>
      </div>

      {/* Child Selector Pills */}
      {childrenList.length > 0 && (
        <div className="parent-chip-group">
          <button
            onClick={() => setActiveStudent(null)}
            className={`parent-chip ${!activeStudent ? "active" : ""}`}
          >
            All Children
          </button>
          {childrenList.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveStudent(c)}
              className={`parent-chip ${activeStudent?.id === c.id ? "active" : ""}`}
            >
              {c.name || `${c.first_name} ${c.last_name}`}
            </button>
          ))}
        </div>
      )}

      {/* Section 1: Document Requests */}
      <div className="parent-card mb-4">
        <div className="parent-card-header">
          <div className="d-flex align-items-center gap-2">
            <Clock size={18} className="text-warning" />
            <h2 className="parent-card-title">Document Requests</h2>
          </div>
        </div>

        {documentRequests.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {documentRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-3"
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                    {req.title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                    {req.description}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${req.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'} px-2 py-1`}>
                    {req.status}
                  </span>
                  <button
                    onClick={() => handleOpenUpload(req.category === 'Medical' ? 'Immunization' : 'Document')}
                    className="btn btn-sm btn-outline-primary"
                    style={{ borderRadius: "8px", fontWeight: 600 }}
                  >
                    Upload Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted">
            <CheckCircle2 size={32} className="text-success mb-2" />
            <p className="mb-0" style={{ fontSize: "0.88rem" }}>You have no pending document requests.</p>
          </div>
        )}
      </div>

      {/* Section 2: Submitted Documents */}
      <div className="parent-card">
        <div className="parent-card-header">
          <div className="d-flex align-items-center gap-2">
            <FolderOpen size={18} className="text-primary" />
            <h2 className="parent-card-title">Submitted Documents</h2>
          </div>
        </div>

        {documents.length > 0 ? (
          <div className="table-responsive">
            <table className="parent-table">
              <thead>
                <tr>
                  <th>DOCUMENT NAME</th>
                  <th>STUDENT</th>
                  <th>CATEGORY</th>
                  <th>DATE UPLOADED</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>{doc.name}</span>
                      </div>
                    </td>

                    <td>{doc.student_name}</td>

                    <td>
                      <span className="badge bg-light text-dark border">
                        {doc.document_type || "Document"}
                      </span>
                    </td>

                    <td>
                      {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    <td>
                      <span className="badge bg-success-light text-success border border-success-subtle">
                        {doc.status}
                      </span>
                    </td>

                    <td>
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="parent-activity-empty">
            <div className="parent-activity-empty-icon">
              <FileCheck size={34} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
              You have no documents
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", maxWidth: "340px", margin: "0 0 1.25rem" }}>
              Upload immunization records, physical examination clearances, and emergency forms here.
            </p>
            <button
              onClick={() => handleOpenUpload("Document")}
              className="btn-parent-outline"
            >
              <Upload size={14} />
              <span>Upload your first document</span>
            </button>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="parent-modal-overlay">
          <div className="parent-modal-content">
            <div className="parent-modal-header">
              <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                Upload Document
              </span>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="btn p-0 border-0 text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="parent-modal-body">
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Select Child</label>
                  <select
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    required
                    className="form-select"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || `${c.first_name} ${c.last_name}`} ({c.grade_level || "Student"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Document Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-2027 Pediatric Immunization Clearance"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                    className="form-control"
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Category</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="form-select"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <option value="Document">General Document</option>
                    <option value="Immunization">Immunization & Health Record</option>
                    <option value="Emergency">Emergency Contact Release</option>
                    <option value="Consent">Consent & Policy Waiver</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="form-control"
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Attach File (PDF, PNG, JPG)</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="form-control"
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              <div className="parent-modal-footer">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="btn btn-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-parent-dark"
                >
                  {uploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDocumentsPage;
