import { Modal, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUserShield,
} from "react-icons/fa";

export default function LoginModal({ show, handleClose }) {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      className="login-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title as="h5">Select Your Role to Login</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row className="g-4">
            <Col xs={12} md={4}>
              <Link
                to="/login" // This is the existing Staff login page
                className="role-selection-card"
                onClick={handleClose}
              >
                <div className="role-selection-icon">
                  <FaChalkboardTeacher />
                </div>
                <h5 className="role-selection-title">Teacher / Staff</h5>
              </Link>
            </Col>
            <Col xs={12} md={4}>
              {/* --- FUTURE PROOFING --- */}
              {/* This now points to a future parent login page */}
              <Link
                to="/parent/login"
                className="role-selection-card"
                onClick={handleClose}
              >
                <div className="role-selection-icon">
                  <FaUserShield />
                </div>
                <h5 className="role-selection-title">Parent</h5>
              </Link>
            </Col>
            <Col xs={12} md={4}>
              {/* --- FUTURE PROOFING --- */}
              {/* This now points to a future student login page */}
              <Link
                to="/student/login"
                className="role-selection-card"
                onClick={handleClose}
              >
                <div className="role-selection-icon">
                  <FaUserGraduate />
                </div>
                <h5 className="role-selection-title">Student</h5>
              </Link>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
    </Modal>
  );
}
