import { Container, Row, Col } from "react-bootstrap";
import FeatureCard from "./FeatureCard";
import { FaChalkboardTeacher, FaUsers, FaCog } from "react-icons/fa";

const features = [
  {
    IconComponent: FaChalkboardTeacher,
    title: "For Teachers & Staff",
    text: "Manage class rosters, record daily attendance, enter grades, and communicate with parents efficiently.",
  },
  {
    IconComponent: FaUsers,
    title: "For Parents & Guardians",
    text: "Stay informed with secure access to your child's attendance records, academic progress, and school announcements.",
  },
  {
    IconComponent: FaCog,
    title: "For Administrators",
    text: "Oversee staff, students, and classes from a powerful dashboard. Manage enrollments and view school-wide reports.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="section features-section">
      <Container>
        <h2 className="section-title">A Hub for Our Entire Community</h2>
        <p className="section-subtitle">
          Everything you need is just a login away, tailored for your role
          within our school.
        </p>
        <Row className="g-5 justify-content-center">
          {features.map((feature, index) => (
            <Col md={6} lg={4} key={index}>
              <FeatureCard
                IconComponent={feature.IconComponent}
                title={feature.title}
                text={feature.text}
              />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
