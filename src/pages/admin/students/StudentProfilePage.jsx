import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Spinner,
  Alert,
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Table,
  Badge,
  Dropdown
} from "react-bootstrap";
import {
  getStudentById,
  getStudentDocuments,
  uploadStudentDocument,
  updateStudentDocument,
  deleteStudentDocument
} from "../../../services/studentService";
import {
  DollarSign,
  Calendar,
  Settings,
  User,
  Plus,
  Shield,
  FileText,
  Mail,
  Phone,
  UserCheck,
  CheckCircle,
  Clock,
  Printer,
  Edit2,
  Trash2,
  Download,
  Upload,
  MoreHorizontal,
  Eye
} from "lucide-react";
import api from "../../../utils/api";
import { showSuccess, showError } from "../../../utils/notificationService";
import "../../../styles/StudentProfile.css";
import "../../../styles/AdminModern.css";

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="text-muted p-1"
  >
    {children}
  </a>
));

const StudentProfilePage = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Document Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDocName, setUploadDocName] = useState("");
  const [uploadDocType, setUploadDocType] = useState("Document");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");

  // Document Edit States
  const [editingDoc, setEditingDoc] = useState(null);
  const [editDocName, setEditDocName] = useState("");
  const [editDocType, setEditDocType] = useState("Document");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [updatingDoc, setUpdatingDoc] = useState(false);

  // Document Preview State
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const [studentData, docsData] = await Promise.all([
          getStudentById(studentId),
          getStudentDocuments(studentId).catch(() => [])
        ]);
        setStudent(studentData);
        setDocuments(docsData || []);
      } catch (err) {
        setError("Failed to load student profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [studentId]);

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const dob = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
      years--;
      months += 12;
    }
    return `${years} years and ${months} months`;
  };

  const formatDate = (dateString, fallback = "No date set") => {
    if (!dateString) return fallback;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadDocName || uploadFile.name);
      formData.append("document_type", uploadDocType);
      if (uploadExpiryDate) {
        formData.append("expiry_date", uploadExpiryDate);
      }

      await uploadStudentDocument(studentId, formData);
      showSuccess("Document uploaded successfully!");
      setShowUploadModal(false);
      
      setUploadFile(null);
      setUploadDocName("");
      setUploadExpiryDate("");
      
      const docsData = await getStudentDocuments(studentId);
      setDocuments(docsData || []);
    } catch (err) {
      showError("Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditDocSubmit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;

    try {
      setUpdatingDoc(true);
      await updateStudentDocument(editingDoc.id, {
        name: editDocName,
        document_type: editDocType,
        expiry_date: editExpiryDate || null
      });
      showSuccess("Document updated successfully!");
      setEditingDoc(null);

      const docsData = await getStudentDocuments(studentId);
      setDocuments(docsData || []);
    } catch (err) {
      showError("Failed to update document.");
    } finally {
      setUpdatingDoc(false);
    }
  };

  const handleDeleteDocClick = async (docId) => {
    if (!window.confirm("Are you sure you want to permanently delete this document?")) return;
    try {
      await deleteStudentDocument(docId);
      showSuccess("Document deleted successfully.");
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (err) {
      showError("Failed to delete document.");
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!student) return <Alert variant="warning">Student not found.</Alert>;

  const initials = `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.toUpperCase();
  const baseURL = api.defaults.baseURL || "";
  const baseStaticURL = baseURL.endsWith("/api") ? baseURL.slice(0, -4) : baseURL;

  return (
    <div className="student-profile-rebuild" style={{ padding: "20px" }}>
      {/* Top Breadcrumb Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div style={{ fontSize: "14px", color: "#64748b" }}>
          <Link to="/admin/students" className="text-decoration-none" style={{ color: "#0ea5e9" }}>Students</Link>
          <span className="mx-2">/</span>
          <span style={{ fontWeight: "600", color: "#0f172a" }}>{student.first_name} {student.last_name} profile</span>
        </div>
        <button 
          onClick={() => window.print()} 
          className="btn btn-link text-decoration-none d-flex align-items-center gap-1 p-0 fw-bold"
          style={{ color: "#0ea5e9", fontSize: "12px" }}
        >
          <Printer size={14} /> PRINT
        </button>
      </div>

      {/* Tabs */}
      <div className="d-flex border-bottom mb-4">
        <button
          onClick={() => setActiveTab("profile")}
          className={`py-2 px-3 border-0 bg-transparent fw-bold`}
          style={{
            fontSize: "14px",
            color: activeTab === "profile" ? "#0ea5e9" : "#64748b",
            borderBottom: activeTab === "profile" ? "2px solid #0ea5e9" : "none"
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("immunizations")}
          className="py-2 px-3 border-0 bg-transparent fw-bold"
          style={{
            fontSize: "14px",
            color: activeTab === "immunizations" ? "#0ea5e9" : "#64748b",
            borderBottom: activeTab === "immunizations" ? "2px solid #0ea5e9" : "none"
          }}
        >
          Immunizations
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className="py-2 px-3 border-0 bg-transparent fw-bold d-flex align-items-center gap-1"
          style={{
            fontSize: "14px",
            color: activeTab === "documents" ? "#0ea5e9" : "#64748b",
            borderBottom: activeTab === "documents" ? "2px solid #0ea5e9" : "none"
          }}
        >
          Documents <span className="badge bg-secondary rounded-pill" style={{ fontSize: "10px" }}>{documents.length}</span>
        </button>
      </div>

      <Row>
        {/* Left Sidebar Panel */}
        <Col md={3} className="mb-4">
          <Card className="shadow-sm border-0 py-4 px-3 text-center" style={{ backgroundColor: "#f8fafc", borderRadius: "12px" }}>
            <div 
              className="mx-auto mb-3 d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                backgroundColor: "#e2e8f0",
                color: "#64748b",
                fontSize: "28px"
              }}
            >
              {initials}
            </div>
            <h5 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "16px" }}>
              {student.last_name},<br />{student.first_name}
            </h5>
            
            <hr className="my-3" style={{ borderTop: "1px solid #cbd5e1" }} />

            <div className="text-start">
              <span className="text-uppercase fw-bold text-slate-400" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>More Info</span>
              <div className="d-flex justify-content-start gap-3 mt-2 mb-4">
                <Link 
                  to={`/admin/accounting/accounts/${student.id}`} 
                  className="d-flex align-items-center justify-content-center"
                  style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e0f2fe", color: "#0284c7" }}
                  title="View Ledger"
                >
                  <DollarSign size={16} />
                </Link>
                <button 
                  className="border-0 d-flex align-items-center justify-content-center"
                  style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#fef3c7", color: "#d97706" }}
                  title="Attendance Calendar"
                >
                  <Calendar size={16} />
                </button>
                <button 
                  className="border-0 d-flex align-items-center justify-content-center"
                  style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#f1f5f9", color: "#64748b" }}
                  title="Settings"
                >
                  <Settings size={16} />
                </button>
              </div>

              {student.lead_id && (
                <div>
                  <hr className="my-3" style={{ borderTop: "1px solid #cbd5e1" }} />
                  <div className="text-center">
                    <Link 
                      to={`/admin/admissions`}
                      className="btn btn-outline-info w-100 btn-sm text-uppercase fw-bold"
                      style={{ fontSize: "11px", letterSpacing: "0.05em" }}
                    >
                      View Admission Lead
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Tab Content Panel */}
        <Col md={9}>
          {activeTab === "profile" && (
            <div>
              <Card className="shadow-sm border-0 p-4 mb-4">
                <h4 className="fw-bold text-slate-800 mb-3" style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <User size={18} className="text-slate-500" /> Student Profile Details
                </h4>
                
                <Row className="g-3">
                  <Col md={4}>
                    <label className="text-uppercase fw-bold text-slate-400 d-block" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>First Name</label>
                    <span className="text-slate-800 fw-semibold" style={{ fontSize: "14px" }}>{student.first_name || "—"}</span>
                  </Col>
                  <Col md={4}>
                    <label className="text-uppercase fw-bold text-slate-400 d-block" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>Last Name</label>
                    <span className="text-slate-800 fw-semibold" style={{ fontSize: "14px" }}>{student.last_name || "—"}</span>
                  </Col>
                  <Col md={4}>
                    <label className="text-uppercase fw-bold text-slate-400 d-block" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>Status</label>
                    <span className="badge bg-success-light text-success" style={{ fontSize: "11px", padding: "0.35em 0.65em" }}>ACTIVE</span>
                  </Col>
                  <Col md={4}>
                    <label className="text-uppercase fw-bold text-slate-400 d-block" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>Date of Birth</label>
                    <span className="text-slate-800" style={{ fontSize: "14px" }}>{formatDate(student.date_of_birth)}</span>
                  </Col>
                  <Col md={4}>
                    <label className="text-uppercase fw-bold text-slate-400 d-block" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>Age</label>
                    <span className="text-slate-800" style={{ fontSize: "14px" }}>{calculateAge(student.date_of_birth)}</span>
                  </Col>
                  <Col md={4}>
                    <label className="text-uppercase fw-bold text-slate-400 d-block" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>Grade Level</label>
                    <span className="text-slate-800" style={{ fontSize: "14px" }}>{student.grade_level || "—"}</span>
                  </Col>
                </Row>
              </Card>

              {/* Parents Section */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold text-slate-800 m-0" style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <UserCheck size={18} className="text-slate-500" /> Associated Parents / Guardians
                  </h4>
                  <Link
                    to="/admin/administration/parents"
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    <Plus size={13} /> Manage / Add Parents
                  </Link>
                </div>

                <Row className="g-3">
                  {student.parents?.map((parent) => (
                    <Col md={6} key={parent.id}>
                      <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                            <span className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>{parent.first_name} {parent.last_name}</span>
                            <span className="badge bg-light text-dark border" style={{ fontSize: "10px" }}>Primary Contact</span>
                          </div>

                          <div className="space-y-2 text-slate-600" style={{ fontSize: "12px" }}>
                            <div className="d-flex">
                              <span className="fw-bold text-slate-400" style={{ width: "120px" }}>EMAIL</span>
                              <span className="text-slate-800 text-truncate">{parent.email}</span>
                            </div>
                            <div className="d-flex">
                              <span className="fw-bold text-slate-400" style={{ width: "120px" }}>PHONE</span>
                              <span className="text-slate-800">{parent.phone || "—"}</span>
                            </div>
                            <div className="d-flex">
                              <span className="fw-bold text-slate-400" style={{ width: "120px" }}>PORTAL ACCESS</span>
                              {parent.is_active ? (
                                <span className="text-success fw-bold">Active</span>
                              ) : (
                                <span className="text-warning fw-bold">Pending</span>
                              )}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          )}

          {activeTab === "immunizations" && (
            <Card className="shadow-sm border-0 p-4">
              <h5 className="fw-bold text-slate-800 mb-3">Immunization Records</h5>
              <p className="text-muted">Immunization record management and tracking features will be displayed here.</p>
            </Card>
          )}

          {activeTab === "documents" && (
            <Card className="shadow-sm border-0 p-4">
              {/* Card Header with UPLOAD FILE button */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-slate-800 m-0">Student Documents</h5>
                <Button 
                  onClick={() => setShowUploadModal(true)} 
                  style={{ backgroundColor: "#007ba4", borderColor: "#007ba4", fontSize: "12px", fontWeight: "600" }}
                  className="d-flex align-items-center gap-1 text-uppercase"
                >
                  <Upload size={14} /> Upload File
                </Button>
              </div>

              {/* Documents Directory Table (Matching Image 3) */}
              <Table responsive className="align-middle mb-0" style={{ borderCollapse: "separate", borderSpacing: "0 10px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <th className="text-slate-500 uppercase fw-bold pb-2" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>NAME</th>
                    <th className="text-slate-500 uppercase fw-bold pb-2" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>EXPIRY DATE</th>
                    <th className="text-slate-500 uppercase fw-bold pb-2" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>DOCUMENT TYPE</th>
                    <th className="text-slate-500 uppercase fw-bold pb-2" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>STATUS</th>
                    <th className="text-slate-500 uppercase fw-bold pb-2" style={{ fontSize: "11px", letterSpacing: "0.05em" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length > 0 ? (
                    documents.map((doc) => {
                      const isAbsoluteUrl = doc.file_path.startsWith("http") || doc.file_path.startsWith("/api");
                      const downloadUrl = isAbsoluteUrl ? `${baseStaticURL}${doc.file_path.replace('/api', '')}` : `${baseStaticURL}${doc.file_path}`;

                      return (
                        <tr key={doc.id} className="bg-light shadow-sm rounded">
                          <td className="p-3" style={{ borderTopLeftRadius: "6px", borderBottomLeftRadius: "6px" }}>
                            <button 
                              onClick={() => setPreviewDoc(doc)}
                              className="fw-semibold text-decoration-none bg-transparent border-0 p-0 text-start"
                              style={{ color: "#007ba4" }}
                            >
                              {doc.name}
                            </button>
                          </td>
                          <td className="p-3 text-slate-600">
                            {formatDate(doc.expiry_date, "No Date")}
                          </td>
                          <td className="p-3 text-slate-600">
                            {doc.document_type || "Document"}
                          </td>
                          <td className="p-3">
                            <Badge 
                              bg={doc.status === "UPLOADED" ? "success" : "warning"}
                              style={{ fontSize: "10px", padding: "0.4em 0.7em" }}
                              className="text-uppercase"
                            >
                              {doc.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-end" style={{ borderTopRightRadius: "6px", borderBottomRightRadius: "6px" }}>
                            <Dropdown align="end">
                              <Dropdown.Toggle as={CustomToggle}>
                                <MoreHorizontal size={18} className="text-slate-400 hover-slate-800" />
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="shadow border-slate-200">
                                <Dropdown.Item 
                                  onClick={() => {
                                    setEditingDoc(doc);
                                    setEditDocName(doc.name);
                                    setEditDocType(doc.document_type || "Document");
                                    setEditExpiryDate(doc.expiry_date ? doc.expiry_date.split("T")[0] : "");
                                  }}
                                >
                                  <Edit2 size={14} className="me-2 text-slate-500" /> Edit
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => setPreviewDoc(doc)}>
                                  <Eye size={14} className="me-2 text-slate-500" /> Preview
                                </Dropdown.Item>
                                <Dropdown.Item href={downloadUrl} target="_blank" rel="noopener noreferrer" download>
                                  <Download size={14} className="me-2 text-slate-500" /> Download
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => handleDeleteDocClick(doc.id)} className="text-danger">
                                  <Trash2 size={14} className="me-2" /> Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-slate-400">
                        There are no documents uploaded for this student profile.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card>
          )}
        </Col>
      </Row>

      {/* Upload Document Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Form onSubmit={handleUploadSubmit}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: "18px", fontWeight: "700" }}>Upload Student Document</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-600 mb-1">SELECT FILE *</Form.Label>
              <Form.Control 
                type="file" 
                required 
                onChange={(e) => {
                  const file = e.target.files[0];
                  setUploadFile(file);
                  if (file && !uploadDocName) {
                    setUploadDocName(file.name.split('.').slice(0, -1).join('.'));
                  }
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-600 mb-1">DOCUMENT NAME *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter document name"
                required 
                value={uploadDocName}
                onChange={(e) => setUploadDocName(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-600 mb-1">DOCUMENT TYPE</Form.Label>
              <Form.Select 
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
              >
                <option value="Document">Document</option>
                <option value="Immunization">Immunization</option>
                <option value="ID Card">ID Card</option>
                <option value="Medical Report">Medical Report</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-600 mb-1">EXPIRY DATE (OPTIONAL)</Form.Label>
              <Form.Control 
                type="date" 
                value={uploadExpiryDate}
                onChange={(e) => setUploadExpiryDate(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowUploadModal(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" style={{ backgroundColor: "#007ba4", borderColor: "#007ba4" }} disabled={uploading || !uploadFile}>
              {uploading ? <Spinner animation="border" size="sm" /> : "Upload Document"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Document Modal */}
      {editingDoc && (
        <Modal show={true} onHide={() => setEditingDoc(null)} centered>
          <Form onSubmit={handleEditDocSubmit}>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: "18px", fontWeight: "700" }}>Edit Student Document</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-slate-600 mb-1">DOCUMENT NAME *</Form.Label>
                <Form.Control 
                  type="text" 
                  required 
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-slate-600 mb-1">DOCUMENT TYPE</Form.Label>
                <Form.Select 
                  value={editDocType}
                  onChange={(e) => setEditDocType(e.target.value)}
                >
                  <option value="Document">Document</option>
                  <option value="Immunization">Immunization</option>
                  <option value="ID Card">ID Card</option>
                  <option value="Medical Report">Medical Report</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-slate-600 mb-1">EXPIRY DATE (OPTIONAL)</Form.Label>
                <Form.Control 
                  type="date" 
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" size="sm" onClick={() => setEditingDoc(null)} disabled={updatingDoc}>
                Cancel
              </Button>
              <Button type="submit" size="sm" style={{ backgroundColor: "#007ba4", borderColor: "#007ba4" }} disabled={updatingDoc}>
                {updatingDoc ? <Spinner animation="border" size="sm" /> : "Save Changes"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* Preview Document Modal */}
      {previewDoc && (
        <Modal show={true} onHide={() => setPreviewDoc(null)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: "18px", fontWeight: "700" }}>
              📄 Preview Document: {previewDoc.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0 text-center" style={{ minHeight: "500px" }}>
            <iframe 
              src={`${baseStaticURL}${previewDoc.file_path.replace('/api', '')}`} 
              title={previewDoc.name}
              style={{ width: "100%", height: "550px", border: "none" }}
            />
          </Modal.Body>
          <Modal.Footer>
            <a 
              href={`${baseStaticURL}${previewDoc.file_path.replace('/api', '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary btn-sm"
              download
            >
              <Download size={14} className="me-1" /> Download File
            </a>
            <Button variant="secondary" size="sm" onClick={() => setPreviewDoc(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default StudentProfilePage;
