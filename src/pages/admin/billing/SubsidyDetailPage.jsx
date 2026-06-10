import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Spinner,
  Alert,
  Tabs,
  Tab,
  Button,
  Row,
  Col,
  Card,
  Table,
  Dropdown,
} from "react-bootstrap";
import { ArrowLeft, ThreeDotsVertical } from "react-bootstrap-icons";
import { getSubsidyDetails } from "../../../services/subsidyService";
import ReceiveSubsidyPaymentModal from "../../../components/admin/billing/ReceiveSubsidyPaymentModal";

const formatCurrency = (amount) =>
  (amount != null ? amount : 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="text-muted"
  >
    {children}
  </a>
));

const SubsidyDetailPage = () => {
  const { subsidyId } = useParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSubsidyDetails(subsidyId);
      setDetails(data);
    } catch (err) {
      setError("Failed to load subsidy details.");
    } finally {
      setLoading(false);
    }
  }, [subsidyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!details) return null;

  const studentsWithBalances = details.student_summary.filter(
    (s) => s.balance > 0
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link
            to="/admin/billing/subsidies"
            className="d-flex align-items-center text-decoration-none text-muted mb-2"
          >
            <ArrowLeft size={20} className="me-2" />
            Back to Subsidy Accounts
          </Link>
          <h1 className="page-title mb-0">{details.name}</h1>
        </div>
        <div>
          <Dropdown>
            <Dropdown.Toggle variant="primary" id="new-transaction-dropdown">
              New Transaction
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setShowModal(true)}>
                Receive Payment
              </Dropdown.Item>
              <Dropdown.Item disabled>Add Invoice</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <Card className="content-card mb-4">
        <Card.Body>
          <Row className="text-center">
            <Col>
              <div className="text-muted">Total Invoiced/Applied</div>
              <h4>{formatCurrency(details.total_invoiced)}</h4>
            </Col>
            <Col>
              <div className="text-muted">Total Received</div>
              <h4 className="text-success">
                {formatCurrency(details.total_received)}
              </h4>
            </Col>
            <Col>
              <div className="text-muted">Outstanding Balance</div>
              <h4 className="text-danger">{formatCurrency(details.balance)}</h4>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs
        defaultActiveKey="student-summary"
        id="subsidy-details-tabs"
        className="mb-3"
      >
        <Tab eventKey="student-summary" title="Student Summary">
          <div className="content-card">
            <Table responsive className="modern-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th className="text-end">Invoiced/Applied</th>
                  <th className="text-end">Received</th>
                  <th className="text-end">Balance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {details.student_summary.map((s) => (
                  <tr key={s.student_id}>
                    <td>
                      <strong>{s.student_name}</strong>
                    </td>
                    <td className="text-end">{formatCurrency(s.invoiced)}</td>
                    <td className="text-end">{formatCurrency(s.received)}</td>
                    <td className="text-end fw-bold">
                      {formatCurrency(s.balance)}
                    </td>
                    <td className="text-center">
                      <Dropdown align="end">
                        <Dropdown.Toggle as={CustomToggle}>
                          <ThreeDotsVertical size={20} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            as={Link}
                            to={`/admin/billing/accounts/${s.student_id}`}
                          >
                            View Student Ledger
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
        <Tab eventKey="transaction-detail" title="Transaction Detail">
          <div className="content-card">
            <Table responsive className="modern-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Applied To</th>
                  <th>Notes/Ref #</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {details.transaction_detail.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      {new Date(tx.transaction_date).toLocaleDateString()}
                    </td>
                    <td>{tx.transaction_type}</td>
                    <td>{tx.student_names.join(", ")}</td>
                    <td>{tx.reference_number || tx.notes}</td>
                    <td className="text-end">{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>

      <ReceiveSubsidyPaymentModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        subsidyId={subsidyId}
        studentsWithBalances={studentsWithBalances}
        onUpdate={fetchData}
      />
    </>
  );
};

export default SubsidyDetailPage;
