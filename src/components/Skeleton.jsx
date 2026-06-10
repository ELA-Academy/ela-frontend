import React from "react";
import { Card, Row, Col } from "react-bootstrap";

/**
 * Reusable premium Skeleton Loader component
 */
export const Skeleton = ({
  width,
  height,
  circle = false,
  className = "",
  style = {},
}) => {
  const customStyle = {
    width: width || (circle ? "40px" : "100%"),
    height: height || (circle ? "40px" : "16px"),
    ...style,
  };

  return (
    <div
      className={`skeleton ${circle ? "skeleton-circle" : ""} ${className}`}
      style={customStyle}
    />
  );
};

/**
 * A skeleton block that mimics dashboard metric stat cards
 */
export const CardSkeleton = ({ count = 4 }) => {
  return (
    <Row className="mb-4">
      {Array.from({ length: count }).map((_, index) => (
        <Col md={6} xl={3} className="mb-4" key={index}>
          <Card className="stat-card shadow-sm h-100 border-0" style={{ minHeight: "92px" }}>
            <Card.Body className="d-flex align-items-center p-3">
              <Skeleton circle width="44px" height="44px" className="me-3" />
              <div className="flex-grow-1">
                <Skeleton width="40%" height="22px" className="mb-2" />
                <Skeleton width="75%" height="13px" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

/**
 * A skeleton block that mimics a list of items (e.g. sidebar list or simple tasks)
 */
export const ListSkeleton = ({ count = 4, height = "48px" }) => {
  return (
    <div className="d-flex flex-column gap-2 p-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="d-flex align-items-center gap-3 p-2 border-bottom" style={{ height }}>
          <Skeleton circle width="36px" height="36px" />
          <div className="flex-grow-1">
            <Skeleton width="45%" height="14px" className="mb-2" />
            <Skeleton width="25%" height="10px" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * A skeleton block that mimics table lists
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="content-card overflow-hidden">
      <div className="p-3 bg-light border-bottom d-flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${90 / cols}%`} height="14px" />
        ))}
      </div>
      <div className="p-3 d-flex flex-column gap-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="d-flex align-items-center gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} style={{ width: `${100 / cols}%` }}>
                <Skeleton
                  width={c === 0 ? "80%" : c === cols - 1 ? "40%" : "60%"}
                  height="12px"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * A skeleton block that mimics a chat messenger loading feed
 */
export const ChatSkeleton = ({ count = 4 }) => {
  return (
    <div className="d-flex flex-column gap-4 p-4 h-100 overflow-hidden" style={{ minHeight: "350px" }}>
      {Array.from({ length: count }).map((_, index) => {
        const isSent = index % 2 === 0;
        return (
          <div
            key={index}
            className={`d-flex ${isSent ? "justify-content-end" : "justify-content-start"}`}
          >
            <div className="d-flex gap-2" style={{ maxWidth: "70%", width: "100%" }}>
              {!isSent && <Skeleton circle width="32px" height="32px" className="mt-1" />}
              <div className="flex-grow-1">
                <Card className={`border-0 p-3 ${isSent ? "bg-primary-light" : "bg-light"}`} style={{ borderRadius: "12px" }}>
                  <Skeleton width="90%" height="12px" className="mb-2" />
                  <Skeleton width="60%" height="12px" />
                </Card>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
