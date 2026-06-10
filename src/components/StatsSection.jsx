import { Container, Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";

const stats = [
  { number: "1,500+", label: "Students" },
  { number: "30+", label: "Teachers" },
  { number: "40+", label: "Courses" },
  { number: "1", label: "Unified Platform" },
];

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.5,
    },
  }),
};

export default function StatsSection() {
  return (
    <section className="stats-section">
      <Container>
        <p className="section-subtitle mb-4">THE TRUSTED SCHOOL PLATFORM</p>
        <h2 className="section-title">Serving Our Community With Excellence</h2>
        <Row className="mt-5">
          {stats.map((stat, i) => (
            <Col md={3} key={i}>
              <motion.div
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                variants={variants}
              >
                <div className="stats-number">{stat.number}</div>
                <div className="stats-label">{stat.label}</div>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
