import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function AppNavbar({ handleShowLogin }) {
  return (
    <Navbar bg="white" variant="light" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand href="/" className="fs-4">
          ELA Academy
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Button variant="primary" onClick={handleShowLogin}>
              Community Login
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
