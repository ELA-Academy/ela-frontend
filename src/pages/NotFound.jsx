import React from "react";
import { Link } from "react-router-dom";
import { Button, Container } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";

const NotFound = () => {
  return (
    <Container
      className="d-flex flex-column align-items-center justify-content-center text-center"
      style={{ minHeight: "80vh" }}
    >
      <img
        src="/not-found-illustration.svg"
        alt="Page Not Found"
        style={{ maxWidth: "400px", width: "100%", marginBottom: "2rem" }}
      />
      <h1 className="display-4 fw-bold">Page Not Found</h1>
      <p className="lead text-muted mb-4">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Button as={Link} to="/admin" variant="primary">
        <ArrowLeft className="me-2" /> Go Back to Dashboard
      </Button>
    </Container>
  );
};

export default NotFound;
