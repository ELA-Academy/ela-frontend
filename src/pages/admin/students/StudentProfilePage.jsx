import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Spinner,
  Alert,
  Card,
  Row,
  Col,
  Tabs,
  Tab,
  Button,
} from "react-bootstrap";
import { getStudentById } from "../../../services/studentService";
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
  Edit2
} from "lucide-react";
import "../../../styles/StudentProfile.css";
import "../../../styles/AdminModern.css";

const StudentProfilePage = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await getStudentById(studentId);
        setStudent(data);
      } catch (err) {
        setError("Failed to load student profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
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

  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

      {/* Rebuilt Tabs */}
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
          Documents <span className="badge bg-secondary rounded-pill" style={{ fontSize: "10px" }}>0</span>
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
                      className="text-decoration-none d-flex align-items-center justify-content-center gap-2 fw-bold"
                      style={{ color: "#0ea5e9", fontSize: "11px" }}
                    >
                      <User size={14} /> VIEW LEAD DETAILS
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Details Panel */}
        <Col md={9}>
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Details List */}
              <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                      <tbody>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4" style={{ width: "200px" }}>STATUS</td>
                          <td className="py-3">
                            <span className="d-flex align-items-center gap-2 fw-bold" style={{ color: student.status === "Active" ? "#22c55e" : "#ef4444" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: student.status === "Active" ? "#22c55e" : "#ef4444" }} />
                              {student.status?.toUpperCase() || "ACTIVE"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">PRIMARY ROOM</td>
                          <td className="py-3 fw-bold text-slate-800">{student.home_room || `Home Room ${student.grade_level}`}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">UPCOMING TRANSITIONS</td>
                          <td className="py-3 text-slate-400">No upcoming transitions</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">STUDENT ID</td>
                          <td className="py-3 text-slate-800">{student.student_id_number || "No External Student ID"}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">DOB</td>
                          <td className="py-3 text-slate-800 fw-bold">
                            {formatDate(student.date_of_birth)} ({calculateAge(student.date_of_birth)})
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">TAGS</td>
                          <td className="py-3 text-slate-400">No tags on record</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">SCHEDULE</td>
                          <td className="py-3">
                            <div className="d-flex gap-1">
                              {["MON", "TUE", "WED", "THU", "FRI"].map(day => (
                                <span key={day} className="badge bg-light text-slate-600 px-2 py-1 border" style={{ fontSize: "10px" }}>{day}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">ALLERGIES</td>
                          <td className="py-3 text-slate-800 fw-bold">NA</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">MEDICATION</td>
                          <td className="py-3 text-slate-800 fw-bold">NA</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">DIET RESTRICTION</td>
                          <td className="py-3 text-slate-400">No diet restrictions on record</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">FOOD PROGRAM</td>
                          <td className="py-3 text-slate-400">No food program on record</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">ADDRESS</td>
                          <td className="py-3 text-slate-800">{student.address || "No address on record"}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">NOTES</td>
                          <td className="py-3 text-slate-700" style={{ whiteSpace: "pre-line" }}>
                            {student.notes || "No notes on record"}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">SIBLINGS</td>
                          <td className="py-3 text-slate-800">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-slate-400">No siblings for {student.first_name} {student.last_name}</span>
                              <button className="btn btn-link text-decoration-none p-0 fw-bold" style={{ color: "#0ea5e9", fontSize: "12px" }}>ADD SIBLING</button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">ENROLL DATE</td>
                          <td className="py-3 text-slate-800 fw-bold">{formatDate(student.enrollment_date)}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">GRADUATION DATE</td>
                          <td className="py-3 text-slate-400">No date set</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-slate-500 py-3 ps-4">GRADE LEVEL</td>
                          <td className="py-3 text-slate-800 fw-bold">{student.grade_level}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>

              {/* Parents / Guardians Section */}
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold text-slate-800 m-0" style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Shield size={18} className="text-slate-500" /> Parent / Guardians
                  </h4>
                  <div className="d-flex gap-3">
                    <button className="btn btn-link text-decoration-none p-0 fw-bold" style={{ color: "#0ea5e9", fontSize: "12px" }}>EMAIL SIGN-IN PIN</button>
                    <button className="btn btn-link text-decoration-none p-0 fw-bold" style={{ color: "#0ea5e9", fontSize: "12px" }}>ADD PARENT</button>
                  </div>
                </div>

                <Row>
                  {student.parents && student.parents.map(parent => (
                    <Col md={6} key={parent.id} className="mb-3">
                      <Card className="shadow-sm border border-light" style={{ borderRadius: "10px" }}>
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center gap-2">
                              <div 
                                className="d-flex align-items-center justify-content-center fw-bold text-white" 
                                style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#94a3b8", fontSize: "12px" }}
                              >
                                {`${parent.first_name?.charAt(0) || ""}${parent.last_name?.charAt(0) || ""}`.toUpperCase()}
                              </div>
                              <div>
                                <h6 className="fw-bold m-0 text-slate-800">{parent.first_name} {parent.last_name}</h6>
                                <span className="badge bg-success-light text-success px-2 py-0.5 rounded-pill" style={{ fontSize: "9px" }}>
                                  ✓ Signed up
                                </span>
                              </div>
                            </div>
                            <button className="btn btn-link text-muted p-0"><Edit2 size={14} /></button>
                          </div>

                          <div className="space-y-2 text-slate-600" style={{ fontSize: "12px" }}>
                            <div className="d-flex">
                              <span className="fw-bold text-slate-400" style={{ width: "120px" }}>EMAIL</span>
                              <span className="text-slate-800 text-truncate">{parent.email}</span>
                            </div>
                            <div className="d-flex">
                              <span className="fw-bold text-slate-400" style={{ width: "120px" }}>PHONE</span>
                              <span className="text-slate-800">{parent.phone}</span>
                            </div>
                            <div className="d-flex">
                              <span className="fw-bold text-slate-400" style={{ width: "120px" }}>RELATION</span>
                              <span className="text-slate-800">—</span>
                            </div>
                            <div className="d-flex">
                              <span className="fw-bold text-slate-400" style={{ width: "120px" }}>SIGN IN PIN</span>
                              <span className="text-slate-800 fw-bold">6154</span>
                            </div>
                            <div className="d-flex align-items-center">
                              <span className="fw-bold text-slate-400" style={{ width: "120px" }}>EMERGENCY</span>
                              <span style={{ width: "24px", height: "14px", borderRadius: "99px", backgroundColor: "#0284c7", display: "inline-block", position: "relative" }}>
                                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#fff", display: "inline-block", position: "absolute", right: "2px", top: "2px" }} />
                              </span>
                            </div>
                            <div className="d-flex">
                              <span className="fw-bold text-slate-400" style={{ width: "120px" }}>2-STEP VERIFICATION</span>
                              <span className="text-slate-400 text-uppercase fw-bold" style={{ fontSize: "10px" }}>Not set up</span>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                  {(!student.parents || student.parents.length === 0) && (
                    <Col>
                      <p className="text-muted text-center py-3">No parents associated with this student profile.</p>
                    </Col>
                  )}
                </Row>
              </div>

              {/* Additional Authorized Pickup Section */}
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold text-slate-800 m-0" style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={18} className="text-slate-500" /> Additional Authorized Pickup
                  </h4>
                  <button className="btn btn-link text-decoration-none p-0 fw-bold" style={{ color: "#0ea5e9", fontSize: "12px" }}>ADD PICKUP</button>
                </div>
                <Card className="shadow-sm border-0 py-3 px-4">
                  <span className="text-slate-400" style={{ fontSize: "13px" }}>There are no additional authorized pickups added.</span>
                </Card>
              </div>

              {/* Replaced Activity timeline section */}
              {student.activity_logs && student.activity_logs.length > 0 && (
                <div className="mt-4">
                  <h4 className="fw-bold text-slate-800 mb-3" style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={18} className="text-slate-500" /> Student History & Activity
                  </h4>
                  <Card className="shadow-sm border-0 p-4">
                    <div className="timeline">
                      {student.activity_logs.map((log) => (
                        <div key={log.id} className="timeline-item mb-3">
                          <p className="mb-1">
                            <strong>{log.action}</strong>
                          </p>
                          <small className="text-slate-400">
                            Performed by {log.actor_name} on {new Date(log.created_at).toLocaleString()}
                          </small>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
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
              <h5 className="fw-bold text-slate-800 mb-3">Student Documents</h5>
              <p className="text-muted">Upload and manage documents for this student.</p>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfilePage;
