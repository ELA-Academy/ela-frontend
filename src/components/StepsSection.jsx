import { Container, Row, Col, Image } from "react-bootstrap";

export default function StepsSection() {
  return (
    <section id="how-it-works" className="section bg-light">
      <Container>
        <h2 className="section-title">Get Up and Running in Minutes</h2>
        <Row className="g-4 align-items-center text-center text-md-start">
          <Col md={4}>
            <div className="step-card">
              <div className="step-number mx-auto mx-md-0">1</div>
              <h4 className="fw-bold">Sign Up & Onboard</h4>
              <p>
                Create your school's account in just a few clicks. Our guided
                setup will help you import your existing data effortlessly.
              </p>
            </div>
          </Col>
          <Col md={4}>
            <div className="step-card">
              <div className="step-number mx-auto mx-md-0">2</div>
              <h4 className="fw-bold">Invite Staff & Parents</h4>
              <p>
                Send out secure invitations to your teachers, administrators,
                and parents to join your school's new digital hub.
              </p>
            </div>
          </Col>
          <Col md={4}>
            <div className="step-card">
              <div className="step-number mx-auto mx-md-0">3</div>
              <h4 className="fw-bold">Go Live & Simplify</h4>
              <p>
                Start managing attendance, communicating with parents, and
                streamlining your daily operations from one simple dashboard.
              </p>
            </div>
          </Col>
        </Row>
        <Row className="mt-5">
          <Col className="text-center">
            {/* Placeholder for a dashboard preview image */}
            <Image
              src="https://via.placeholder.com/800x450.png?text=Dashboard+Preview"
              rounded
              fluid
              alt="Dashboard Preview"
            />
          </Col>
        </Row>
      </Container>
    </section>
  );
}
