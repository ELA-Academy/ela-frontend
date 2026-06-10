import { Container, Row, Col, Card, Image } from "react-bootstrap";

const testimonials = [
  {
    quote:
      "Schoolify has transformed how we communicate with parents. It's intuitive, reliable, and has saved our admin team countless hours.",
    author: "Jane Doe",
    title: "Principal, Bright Future Academy",
  },
  {
    quote:
      "As a teacher, having student information, attendance, and grading in one place is a game-changer. The mobile app is fantastic!",
    author: "John Smith",
    title: "Lead Teacher, Oakwood Elementary",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="section">
      <Container>
        <h2 className="section-title">Trusted by Schools Nationwide</h2>
        <Row className="g-4 mb-5">
          {testimonials.map((testimonial, index) => (
            <Col md={6} key={index}>
              <Card className="h-100 testimonial-card">
                <Card.Body>
                  <blockquote className="blockquote mb-0">
                    <p>"{testimonial.quote}"</p>
                    <footer className="blockquote-footer">
                      {testimonial.author},{" "}
                      <cite title="Source Title">{testimonial.title}</cite>
                    </footer>
                  </blockquote>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <Row className="justify-content-center align-items-center g-5 mt-4">
          {/* Placeholder for school logos */}
          <Col xs="auto">
            <Image
              src="https://via.placeholder.com/120x40.png?text=School+Logo+1"
              alt="School Logo 1"
              className="school-logos"
            />
          </Col>
          <Col xs="auto">
            <Image
              src="https://via.placeholder.com/120x40.png?text=School+Logo+2"
              alt="School Logo 2"
              className="school-logos"
            />
          </Col>
          <Col xs="auto">
            <Image
              src="https://via.placeholder.com/120x40.png?text=School+Logo+3"
              alt="School Logo 3"
              className="school-logos"
            />
          </Col>
          <Col xs="auto">
            <Image
              src="https://via.placeholder.com/120x40.png?text=School+Logo+4"
              alt="School Logo 4"
              className="school-logos"
            />
          </Col>
        </Row>
      </Container>
    </section>
  );
}
