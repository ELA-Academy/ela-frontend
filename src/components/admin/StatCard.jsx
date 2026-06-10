import React from "react";
import { Card } from "react-bootstrap";

/**
 * A reusable, modern stat card for dashboards.
 * @param {object} props
 * @param {React.ReactNode} props.icon - The icon component (e.g., <PeopleFill />).
 * @param {string} props.title - The title text for the card.
 * @param {string|number} props.value - The main value to display.
 * @param {string} props.colorTheme - The color theme (e.g., 'primary', 'success', 'info', 'warning').
 */
const StatCard = ({ icon, title, value, colorTheme = "primary" }) => {
  return (
    <Card className="stat-card shadow-sm h-100">
      <Card.Body>
        <div className={`stat-card-icon bg-${colorTheme}-light`}>
          {React.cloneElement(icon, {
            className: `text-${colorTheme}`,
            size: 24,
          })}
        </div>
        <div className="stat-card-info">
          <h3 className="stat-card-value">{value}</h3>
          <p className="stat-card-title">{title}</p>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatCard;
