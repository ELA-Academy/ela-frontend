import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";

const AccountingNav = () => {
  return (
    <Nav variant="tabs" className="mb-4">
      <Nav.Item>
        <Nav.Link as={NavLink} to="/admin/billing" end>
          Family Account
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link as={NavLink} to="/admin/billing/recurring-plans">
          Recurring Plans
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link as={NavLink} to="/admin/billing/subsidies">
          Subsidy Account
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

export default AccountingNav;
