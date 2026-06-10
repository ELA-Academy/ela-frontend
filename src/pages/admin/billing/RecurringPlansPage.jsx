import React, { useState, useEffect, useCallback } from "react";
import { Table, Spinner, Alert } from "react-bootstrap";
import AccountingNav from "../../../components/admin/billing/AccountingNav";
import PageHeader from "../../../components/admin/PageHeader";
import CreatePlanWizard from "../../../components/admin/billing/CreatePlanWizard";
import { getSubscriptions } from "../../../services/billingService";

const RecurringPlansPage = () => {
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWizard, setShowWizard] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const subs = await getSubscriptions();
      setActivePlans(subs);
    } catch (err) {
      setError("Failed to load recurring plan data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlanCreated = () => {
    setShowWizard(false);
    fetchData();
  };

  const formatCurrency = (amount) =>
    amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h1 className="page-title">Accounting</h1>
        <PageHeader
          buttonText="Create Recurring Plan"
          onButtonClick={() => setShowWizard(true)}
        />
      </div>
      <AccountingNav />

      <div className="content-card mt-3">
        <Table responsive className="modern-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Plan Name</th>
              <th>Plan Period</th>
              <th>Next Invoice Date</th>
              <th className="text-end">Amount</th>
            </tr>
          </thead>
          <tbody>
            {activePlans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <strong>{plan.student_name}</strong>
                </td>
                <td>{plan.plan_name}</td>
                <td>
                  {new Date(plan.start_date).toLocaleDateString()} -{" "}
                  {plan.end_date
                    ? new Date(plan.end_date).toLocaleDateString()
                    : "Ongoing"}
                </td>
                <td>{new Date(plan.next_invoice_date).toLocaleDateString()}</td>
                <td className="text-end">
                  {formatCurrency(plan.total_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <CreatePlanWizard
        show={showWizard}
        handleClose={() => setShowWizard(false)}
        onPlanCreated={handlePlanCreated}
      />
    </>
  );
};

export default RecurringPlansPage;
