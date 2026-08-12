import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Card, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import { Printer, ChevronLeft, FileText, CheckCircle } from "lucide-react";
import api from "../../utils/api";

const EnrollmentSubmissionViewer = () => {
  const { token } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/enrollment/public/submission/${token}/view`);
        setSubmission(response.data);
      } catch (err) {
        setError("Failed to load enrollment submission details. Link might be invalid.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <Spinner animation="border" style={{ color: "#007ba4" }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const { form_structure, responses, student_name, form_name, submitted_at } = submission;
  const sections = (form_structure?.sections || []).filter(s => s.id !== "pickup_info");

  return (
    <Container className="py-4 px-md-5 my-4 bg-white rounded-3 shadow-sm border border-slate-200" style={{ maxWidth: "850px" }}>
      {/* Dynamic print stylesheet */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .container {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Top action bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom no-print">
        <Link to="/admin/accounting/registration" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <Button onClick={handlePrint} className="d-flex align-items-center gap-1 btn-sm" style={{ backgroundColor: "#007ba4", borderColor: "#007ba4" }}>
          <Printer size={16} /> Print Document
        </Button>
      </div>

      {/* Header Info */}
      <div className="text-center mb-5">
        <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
          <FileText size={32} style={{ color: "#007ba4" }} />
          <h2 className="fw-bold mb-0 text-slate-800" style={{ fontSize: "22px" }}>Completed Enrollment Form</h2>
        </div>
        <p className="text-slate-500 mb-0">Exceptional Learning and Arts Academy</p>
      </div>

      {/* Meta details cards */}
      <Card className="bg-light border-0 p-3 mb-4 rounded-3">
        <Row className="gy-2 small">
          <Col sm={6}>
            <div className="text-slate-500 uppercase fw-bold" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>STUDENT NAME</div>
            <div className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>{student_name}</div>
          </Col>
          <Col sm={6}>
            <div className="text-slate-500 uppercase fw-bold" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>FORM TEMPLATE</div>
            <div className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>{form_name}</div>
          </Col>
          <Col sm={6}>
            <div className="text-slate-500 uppercase fw-bold" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>DATE SUBMITTED</div>
            <div className="fw-bold text-slate-800" style={{ fontSize: "14px" }}>{formatDate(submitted_at)}</div>
          </Col>
          <Col sm={6}>
            <div className="text-slate-500 uppercase fw-bold" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>SUBMISSION STATUS</div>
            <div className="d-flex align-items-center gap-1 fw-bold text-success" style={{ fontSize: "14px" }}>
              <CheckCircle size={14} /> Submitted & Enrolled
            </div>
          </Col>
        </Row>
      </Card>

      {/* Sections & Fields */}
      {sections.map((section, secIdx) => {
        // Only show sections that have fields or text content
        if (!section.visible) return null;
        return (
          <div key={section.id} className="mb-5">
            <h4 className="fw-bold text-slate-800 pb-2 border-bottom mb-3" style={{ fontSize: "16px", color: "#0E7490" }}>
              {section.title}
            </h4>
            <div className="ps-2">
              <Row className="gy-3">
                {section.fields?.map((field) => {
                  const val = responses?.[field.id];
                  if (field.type === "line_divider") {
                    return (
                      <Col xs={12} key={field.id} className="my-3">
                        <hr className="text-slate-200" />
                      </Col>
                    );
                  }
                  
                  return (
                    <Col xs={field.type === "paragraph" ? 12 : 6} key={field.id}>
                      <div className="text-slate-500 fw-semibold mb-1" style={{ fontSize: "11px", letterSpacing: "0.02em" }}>
                        {field.label.toUpperCase()}
                      </div>
                      <div className="p-2 border rounded bg-light text-slate-800" style={{ fontSize: "13px", minHeight: "36px" }}>
                        {field.type === "checkbox" ? (
                          val ? "☑ Checked / Agreed" : "☐ Unchecked"
                        ) : (
                          val || "—"
                        )}
                      </div>
                    </Col>
                  );
                })}
                {(!section.fields || section.fields.length === 0) && (
                  <Col xs={12}>
                    <p className="text-slate-400 italic small">No fields added to this section.</p>
                  </Col>
                )}
              </Row>
            </div>
          </div>
        );
      })}

      {/* Footer Branding */}
      <div className="text-center mt-5 pt-4 border-top text-slate-400 small">
        © {new Date().getFullYear()} Exceptional Learning and Arts Academy. All rights reserved.
      </div>
    </Container>
  );
};

export default EnrollmentSubmissionViewer;
