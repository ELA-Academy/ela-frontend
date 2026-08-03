import React from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../../../components/admin/PageHeader";
import StatCard from "../../../components/admin/StatCard";
import { useAccounting } from "../../../components/admin/accounting/AccountingLayout";
import { Spinner, Table } from "react-bootstrap";
import {
  DollarSign,
  FileText,
  History,
  TrendingDown
} from "lucide-react";

const AccountingDashboard = () => {
  const navigate = useNavigate();
  const { overview: stats, accounts, loading: accountingLoading } = useAccounting();

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0.00";
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  if (accountingLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Accounting Overview" />
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            title="Total Revenue"
            value={`$${stats.total_revenue}`}
            colorTheme="success"
            onClick={() => navigate("/admin/accounting/accounts")}
          />
          <StatCard
            icon={<FileText className="w-5 h-5 text-sky-600" />}
            title="Pending Invoices"
            value={stats.pending_invoices}
            colorTheme="info"
            onClick={() => navigate("/admin/accounting/accounts")}
          />
          <StatCard
            icon={<History className="w-5 h-5 text-amber-600" />}
            title="Overdue Payments"
            value={stats.overdue_payments}
            colorTheme="warning"
            onClick={() => navigate("/admin/accounting/accounts")}
          />
          <StatCard
            icon={<TrendingDown className="w-5 h-5 text-slate-900" />}
            title="Total Expenses"
            value={`$${stats.total_expenses}`}
            colorTheme="primary"
            onClick={() => navigate("/admin/accounting/accounts")}
          />
        </div>
      )}

      {/* Recent Accounts Visibility Section */}
      <div className="content-card mt-4">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h3 className="h6 fw-bold mb-0 text-slate-800">Recent Family Accounts</h3>
          <Link to="/admin/accounting/accounts" className="text-primary fw-bold text-decoration-none" style={{ fontSize: '0.85rem' }}>
            View All Accounts →
          </Link>
        </div>
        <Table responsive className="modern-table mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Last Invoice</th>
              <th>Last Payment</th>
              <th>Open Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.slice(0, 5).map((acc) => (
              <tr key={acc.student_id} onClick={() => navigate(`/admin/accounting/accounts/${acc.student_id}`)} style={{ cursor: "pointer" }}>
                <td className="fw-bold text-primary">{acc.student_name}</td>
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
                <td className="fw-bold text-danger">{formatCurrency(acc.open_balance)}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-muted">
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default AccountingDashboard;
