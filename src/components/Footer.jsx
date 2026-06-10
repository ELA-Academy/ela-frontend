import { Container, Row, Col } from "react-bootstrap";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">
      <Container>
        <Row className="gy-4">
          <Col lg={4} md={12}>
            <h5 className="fs-4">ELA Academy</h5>
            <p className="pe-lg-5">
              Empowering our school community through technology.
            </p>
            <div className="d-flex mt-4">
              <a href="#" className="me-3 fs-5">
                <FaFacebook />
              </a>
              <a href="#" className="me-3 fs-5">
                <FaInstagram />
              </a>
              <a href="#" className="fs-5">
                <FaLinkedin />
              </a>
            </div>
          </Col>

          <Col lg={2} md={4} xs={6}>
            <h5>Quick Links</h5>
            <ul className="footer-links">
              <li>
                <a href="#">Home</a>
              </li>
              <li>
                <a href="#">About Us</a>
              </li>
              <li>
                <a href="#">Events</a>
              </li>
              <li>
                <a href="#">News</a>
              </li>
            </ul>
          </Col>

          <Col lg={3} md={4} xs={6}>
            <h5>Support</h5>
            <ul className="footer-links">
              <li>
                <a href="#">Contact School Office</a>
              </li>
              <li>
                <a href="#">Technical Support</a>
              </li>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
              <li>
                <a href="#">Terms of Service</a>
              </li>
            </ul>
          </Col>

          <Col lg={3} md={4}>
            <h5>Contact Info</h5>
            <ul className="footer-links">
              <li>123 Education Lane,</li>
              <li>Knowledge City, 12345</li>
              <li>Email: contact@school.edu</li>
              <li>Phone: (123) 456-7890</li>
            </ul>
          </Col>
        </Row>

        <Row className="bottom-bar">
          <Col className="text-center">
            <p className="mb-0 small">
              &copy; {new Date().getFullYear()} ELA Academy. All Rights
              Reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
