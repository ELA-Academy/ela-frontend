import { Card } from "react-bootstrap";
import { motion } from "framer-motion";

export default function FeatureCard({ IconComponent, title, text }) {
  return (
    <motion.div whileHover={{ y: -8 }} className="h-100">
      <Card className="feature-card">
        <Card.Body className="text-center">
          <div className="feature-card-icon">
            <IconComponent />
          </div>
          <Card.Title as="h4">{title}</Card.Title>
          <Card.Text>{text}</Card.Text>
        </Card.Body>
      </Card>
    </motion.div>
  );
}
