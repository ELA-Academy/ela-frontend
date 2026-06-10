import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Table, Spinner, Alert, Form } from "react-bootstrap";
import AccountingNav from "../../../components/admin/billing/AccountingNav";
import { getBillingAccounts } from "../../../services/billingService";

const BillingDashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const data = await getBillingAccounts();
        setAccounts(data);
      } catch (err) {
        setError("Failed to load billing accounts.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter((acc) =>
    acc.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0.00";
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h1 className="page-title">Accounting</h1>
      <AccountingNav />

      <div className="content-card">
        <div className="p-3 border-bottom">
          <Form.Control
            type="text"
            placeholder="Search Students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Table responsive className="modern-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Last Invoice</th>
              <th>Last Payment</th>
              <th>Open Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc) => (
              <tr key={acc.student_id}>
                <td>
                  <Link
                    to={`/admin/billing/accounts/${acc.student_id}`}
                    className="fw-bold"
                  >
                    {acc.student_name}
                  </Link>
                </td>
                <td>
                  {acc.last_invoice_date
                    ? `${formatCurrency(acc.last_invoice_amount)} on ${new Date(
                        acc.last_invoice_date
                      ).toLocaleDateString()}`
                    : "N/A"}
                </td>
                <td>
                  {acc.last_payment_date
                    ? `${formatCurrency(acc.last_payment_amount)} on ${new Date(
                        acc.last_payment_date
                      ).toLocaleDateString()}`
                    : "N/A"}
                </td>
                <td className="fw-bold">{formatCurrency(acc.open_balance)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default BillingDashboard;
