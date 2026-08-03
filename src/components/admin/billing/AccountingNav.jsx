import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";

const AccountingNav = () => {
  return (
    <Nav variant="tabs" className="mb-4">
      <Nav.Item>
        <Nav.Link as={NavLink} to="/admin/accounting" end>
          Overview
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link as={NavLink} to="/admin/accounting/accounts">
          Family Accounts
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link as={NavLink} to="/admin/accounting/recurring-plans">
          Recurring Plans
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link as={NavLink} to="/admin/accounting/subsidies">
          Subsidy Accounts
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

export default AccountingNav;
