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
import { Bank } from "react-bootstrap-icons";
import "../../../styles/StudentProfile.css";

const StudentProfilePage = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!student) return <Alert variant="warning">Student not found.</Alert>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {student.first_name} {student.last_name}'s Profile
        </h1>
      </div>
      <Row>
        <Col md={4} lg={3}>
          <Card className="profile-sidebar-card">
            <Card.Body className="text-center">
              <div className="profile-avatar mb-3">
                {student.first_name.charAt(0)}
                {student.last_name.charAt(0)}
              </div>
              <h5>
                {student.first_name} {student.last_name}
              </h5>
              <p className="text-muted">{student.grade_level}</p>
              <hr />
              <div className="d-grid gap-2">
                <Button
                  as={Link}
                  to={`/admin/billing/accounts/${student.id}`}
                  variant="outline-primary"
                  size="sm"
                  className="d-flex align-items-center justify-content-center"
                >
                  <Bank className="me-2" /> View Billing
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8} lg={9}>
          <Tabs
            defaultActiveKey="profile"
            id="student-profile-tabs"
            className="mb-3"
          >
            <Tab eventKey="profile" title="Profile">
              <Card className="content-card">
                <Card.Body>
                  {/* Details will be fleshed out here */}
                  <p>
                    <strong>Status:</strong> {student.status}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {new Date(student.date_of_birth).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Enrollment Date:</strong>{" "}
                    {student.enrollment_date
                      ? new Date(student.enrollment_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </Card.Body>
              </Card>
            </Tab>
            <Tab eventKey="immunizations" title="Immunizations" disabled>
              <p>Immunization records will be here.</p>
            </Tab>
            <Tab eventKey="documents" title="Documents" disabled>
              <p>Document management will be here.</p>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfilePage;
