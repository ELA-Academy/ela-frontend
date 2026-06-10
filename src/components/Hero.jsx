import { Container, Row, Col, Button } from "react-bootstrap";
import { motion } from "framer-motion";

// This is an SVG for the decorative background shape.
const HeroShape = () => (
  <svg
    className="hero-shape shape-1"
    width="535"
    height="430"
    viewBox="0 0 535 430"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M535 215C535 333.725 415.25 430 267.5 430C119.75 430 0 333.725 0 215C0 96.2751 119.75 0 267.5 0C415.25 0 535 96.2751 535 215Z"
      fill="url(#paint0_linear_101_2)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_101_2"
        x1="267.5"
        y1="0"
        x2="267.5"
        y2="430"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00B8D4" stopOpacity="0.1" />
        <stop offset="1" stopColor="#E0F7FF" stopOpacity="0.4" />
      </linearGradient>
    </defs>
  </svg>
);

// This SVG creates the curved divider effect.
const WaveDivider = () => (
  <div className="wave-divider">
    <svg
      data-name="Layer 1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
    >
      <path
        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
        className="shape-fill"
      ></path>
    </svg>
  </div>
);

export default function Hero({ handleShowLogin }) {
  return (
    <section className="hero-section">
      <Container>
        <Row className="align-items-center">
          <Col lg={6} className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="mb-4">Simplify your school operations</h1>
              <p className="lead">
                Empowering our school and families to focus on what’s important
                – nurturing children, with less paperwork.
              </p>
              <Button variant="primary" size="lg" onClick={handleShowLogin}>
                Login to Your Portal
              </Button>
            </motion.div>
          </Col>
          <Col lg={6} className="mt-5 mt-lg-0">
            <motion.div
              className="hero-image-container"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <HeroShape />
              <img
                src="/images/hero-image.jpeg"
                alt="Teacher and student"
                className="hero-image"
              />
            </motion.div>
          </Col>
        </Row>
      </Container>
      <WaveDivider />
    </section>
  );
}
