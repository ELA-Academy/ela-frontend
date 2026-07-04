import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Card, Button, Form, Spinner, Modal, Table, Badge } from "react-bootstrap";
import { Folder, File, Plus, Upload, Trash2, ArrowLeft, Download, Share2, Eye, GitBranch } from "lucide-react";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";

const FilesView = ({ boardId }) => {
  const [items, setItems] = useState({ folders: [], files: [] });
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  
  // Modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  // Preview / Version Detail
  const [activeFile, setActiveFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [versionSubmitting, setVersionSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const newVersionInputRef = useRef(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/board-extensions/boards/${boardId}/files`);
      setItems(res.data);
    } catch (err) {
      showError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boardId) {
      fetchItems();
    }
  }, [boardId]);

  // Current directory filter
  const currentFolders = items.folders.filter(f => f.parent_id === currentFolderId);
  const currentFiles = items.files.filter(f => f.folder_id === currentFolderId);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setFolderSubmitting(true);
    try {
      await api.post(`/board-extensions/boards/${boardId}/folders`, {
        name: folderName.trim(),
        parent_id: currentFolderId
      });
      showSuccess("Folder created.");
      setFolderName("");
      setShowFolderModal(false);
      fetchItems();
    } catch (err) {
      showError("Failed to create folder.");
    } finally {
      setFolderSubmitting(false);
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploadSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (currentFolderId) {
        formData.append("folder_id", currentFolderId);
      }
      await api.post(`/board-extensions/boards/${boardId}/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      showSuccess("File uploaded successfully.");
      setSelectedFile(null);
      setShowUploadModal(false);
      fetchItems();
    } catch (err) {
      showError("Failed to upload file.");
    } finally {
      setUploadSubmitting(false);
    }
  };

  const handleUploadNewVersion = async (e) => {
    e.preventDefault();
    if (!newVersionFile || !activeFile) return;
    setVersionSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", newVersionFile);
      const res = await api.post(`/board-extensions/files/${activeFile.id}/new-version`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      showSuccess("New version uploaded.");
      setActiveFile(res.data);
      setNewVersionFile(null);
      fetchItems();
    } catch (err) {
      showError("Failed to upload new version.");
    } finally {
      setVersionSubmitting(false);
    }
  };

  const handleToggleShare = async () => {
    if (!activeFile) return;
    try {
      const nextShare = !activeFile.is_shared;
      const res = await api.put(`/board-extensions/files/${activeFile.id}/share`, {
        is_shared: nextShare
      });
      setActiveFile(res.data);
      showSuccess(nextShare ? "Document is now shared." : "Document sharing disabled.");
      fetchItems();
    } catch (err) {
      showError("Failed to update sharing permissions.");
    }
  };

  const handleDownload = (fileId, versionNum = null) => {
    let url = `${api.defaults.baseURL}/board-extensions/files/download/${fileId}`;
    if (versionNum) {
      url += `?version=${versionNum}`;
    }
    window.open(url, "_blank");
  };

  const currentFolderPath = () => {
    const path = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = items.folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parent_id;
      } else {
        break;
      }
    }
    return path;
  };

  return (
    <div className="p-3 bg-white rounded shadow-sm border mt-3">
      {/* Top Header Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
        <div>
          <h4 className="fw-bold text-slate-800 mb-1">Doc & File Center</h4>
          <div className="d-flex align-items-center gap-1 text-muted small">
            <span style={{ cursor: "pointer" }} onClick={() => setCurrentFolderId(null)}>Root</span>
            {currentFolderPath().map((folder, idx) => (
              <React.Fragment key={folder.id}>
                <span>/</span>
                <span style={{ cursor: "pointer" }} onClick={() => setCurrentFolderId(folder.id)}>{folder.name}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="d-flex gap-2">
          {currentFolderId && (
            <Button variant="light" size="sm" onClick={() => {
              const current = items.folders.find(f => f.id === currentFolderId);
              setCurrentFolderId(current ? current.parent_id : null);
            }} className="d-flex align-items-center gap-1">
              <ArrowLeft size={15} /> Back
            </Button>
          )}
          <Button variant="outline-primary" size="sm" onClick={() => setShowFolderModal(true)} className="d-flex align-items-center gap-1">
            <Plus size={16} /> New Folder
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)} className="d-flex align-items-center gap-1">
            <Upload size={15} /> Upload File
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : currentFolders.length === 0 && currentFiles.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <File size={48} className="text-slate-300 mb-3" />
          <h5>This folder is empty</h5>
          <p className="small mb-0">Upload documents or create folders to get started.</p>
        </div>
      ) : (
        <Row className="g-3">
          {/* Folders List */}
          {currentFolders.map((f) => (
            <Col key={f.id} xs={6} md={3} lg={2}>
              <Card className="border-0 shadow-sm bg-light text-center h-100" style={{ cursor: "pointer" }} onClick={() => setCurrentFolderId(f.id)}>
                <Card.Body className="py-4">
                  <Folder size={42} className="text-warning mb-2 mx-auto" />
                  <div className="fw-semibold text-slate-800 text-truncate small">{f.name}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}

          {/* Files List */}
          {currentFiles.map((file) => (
            <Col key={file.id} xs={6} md={3} lg={2}>
              <Card className="shadow-sm h-100 border text-center" style={{ cursor: "pointer" }} onClick={() => {
                setActiveFile(file);
                setShowPreviewModal(true);
              }}>
                <Card.Body className="py-4 position-relative">
                  <File size={42} className="text-primary mb-2 mx-auto" />
                  <div className="fw-semibold text-slate-800 text-truncate small">{file.filename}</div>
                  <Badge bg="secondary" className="mt-2" style={{ fontSize: "10px" }}>v{file.version}</Badge>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create Folder Modal */}
      <Modal show={showFolderModal} onHide={() => setShowFolderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Create New Folder</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateFolder}>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="small fw-semibold">Folder Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Design Assets, Requirements"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowFolderModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={folderSubmitting}>
              {folderSubmitting ? <Spinner animation="border" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Upload File Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Upload Document File</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUploadFile}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Select Document</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                required
              />
              <Form.Text className="text-muted small">Supported files: PDF, Word, Excel, PPT, Images, Videos.</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={uploadSubmitting}>
              {uploadSubmitting ? <Spinner animation="border" size="sm" /> : "Upload"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* File Preview and Version Control Modal */}
      {activeFile && (
        <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold text-slate-800">{activeFile.filename}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={7}>
                <h6 className="fw-bold text-slate-700 mb-3"><Eye size={16} className="me-1" /> File Preview</h6>
                
                {/* Previews based on file type */}
                <div className="preview-container border rounded bg-light d-flex align-items-center justify-content-center p-3 mb-3" style={{ minHeight: "280px" }}>
                  {activeFile.file_type === "image" ? (
                    <img
                      src={`${api.defaults.baseURL}${activeFile.file_path}`}
                      alt={activeFile.filename}
                      className="img-fluid rounded"
                      style={{ maxHeight: "260px" }}
                    />
                  ) : activeFile.file_type === "video" ? (
                    <video
                      src={`${api.defaults.baseURL}${activeFile.file_path}`}
                      controls
                      className="w-100 rounded"
                      style={{ maxHeight: "260px" }}
                    />
                  ) : activeFile.file_type === "pdf" ? (
                    <iframe
                      src={`${api.defaults.baseURL}${activeFile.file_path}`}
                      width="100%"
                      height="260px"
                      title={activeFile.filename}
                      className="border-0"
                    />
                  ) : (
                    <div className="text-center">
                      <File size={64} className="text-muted mb-3 mx-auto" />
                      <p className="mb-0 text-slate-600">No preview available for this file type.</p>
                      <Button variant="outline-primary" size="sm" className="mt-3" onClick={() => handleDownload(activeFile.id)}>
                        <Download size={14} /> Download File
                      </Button>
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border">
                  <div>
                    <div className="small fw-semibold text-slate-700">Uploaded By</div>
                    <div className="small text-muted">{activeFile.uploaded_by_name}</div>
                  </div>
                  <div>
                    <div className="small fw-semibold text-slate-700">Upload Date</div>
                    <div className="small text-muted">{new Date(activeFile.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </Col>

              <Col md={5} className="border-start">
                {/* Version Control */}
                <div className="mb-4">
                  <h6 className="fw-bold text-slate-700 d-flex align-items-center gap-1 mb-3">
                    <GitBranch size={16} /> Version Control
                  </h6>
                  <div className="d-flex gap-2 mb-3">
                    <Button variant="outline-primary" size="sm" onClick={() => newVersionInputRef.current.click()} disabled={versionSubmitting}>
                      {versionSubmitting ? <Spinner animation="border" size="sm" /> : "Upload New Version"}
                    </Button>
                    <input
                      type="file"
                      ref={newVersionInputRef}
                      onChange={handleUploadNewVersion}
                      style={{ display: "none" }}
                    />
                  </div>
                  <div className="version-logs small border rounded p-2" style={{ maxHeight: "150px", overflowY: "auto" }}>
                    <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                      <strong>Current Version (v{activeFile.version})</strong>
                      <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => handleDownload(activeFile.id)}>
                        Download
                      </Button>
                    </div>
                    {/* Previous Versions list can be loaded from DB, we also support general download */}
                  </div>
                </div>

                {/* Sharing & Controls */}
                <div>
                  <h6 className="fw-bold text-slate-700 d-flex align-items-center gap-1 mb-3">
                    <Share2 size={16} /> Document Sharing
                  </h6>
                  <Form.Check
                    type="switch"
                    id="share-switch"
                    label={activeFile.is_shared ? "Shared (Public inside Board)" : "Private (Uploaders Only)"}
                    checked={activeFile.is_shared}
                    onChange={handleToggleShare}
                    className="fw-semibold text-slate-800 small mb-3"
                  />
                  {activeFile.is_shared && (
                    <div className="p-2 border bg-light rounded text-break small">
                      <strong>Link:</strong> <br />
                      <a href={`${api.defaults.baseURL}${activeFile.file_path}`} target="_blank" rel="noopener noreferrer">
                        Open Shared Link
                      </a>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default FilesView;
