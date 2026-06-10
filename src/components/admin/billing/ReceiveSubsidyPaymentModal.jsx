import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Spinner,
  Table,
  InputGroup,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { receiveSubsidyPayment } from "../../../services/subsidyService";
import { showSuccess, showError } from "../../../utils/notificationService";

const ReceiveSubsidyPaymentModal = ({
  show,
  handleClose,
  subsidyId,
  studentsWithBalances,
  onUpdate,
}) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [totalReceived, setTotalReceived] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [distributions, setDistributions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const resetState = () => {
    setStep(1);
    setTotalReceived("");
    setReferenceNumber("");
    setSelectedStudentIds(new Set());
    setDistributions([]);
    setSearchTerm("");
  };

  const handleNext = () => {
    if (step === 1) {
      const selectedStudents = studentsWithBalances.filter((s) =>
        selectedStudentIds.has(s.student_id)
      );
      setDistributions(
        selectedStudents.map((s) => ({
          student_id: s.student_id,
          student_name: s.student_name,
          invoiced: s.invoiced,
          received: "",
        }))
      );
      setStep(2);
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleDistributionChange = (studentId, amount) => {
    setDistributions(
      distributions.map((d) =>
        d.student_id === studentId
          ? { ...d, received: parseFloat(amount) || 0 }
          : d
      )
    );
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const payload = {
        transaction_type: "Payment",
        amount: parseFloat(totalReceived),
        transaction_date: new Date().toISOString().split("T")[0],
        reference_number: referenceNumber,
        distributions: distributions.map(({ student_id, received }) => ({
          student_id,
          amount: received,
        })),
      };
      await receiveSubsidyPayment(subsidyId, payload);
      showSuccess("Subsidy payment recorded and distributed successfully!");
      onUpdate();
      handleClose();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to record payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = studentsWithBalances.filter((s) =>
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const distributedTotal = distributions.reduce(
    (sum, d) => sum + (d.received || 0),
    0
  );
  const remainingToDistribute =
    (parseFloat(totalReceived) || 0) - distributedTotal;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      onExited={resetState}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Receive Payment - Step {step}/2</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {step === 1 && (
          <div>
            <Form.Control
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Check
                type="checkbox"
                label="Select All"
                onChange={(e) => {
                  const allIds = new Set(
                    filteredStudents.map((s) => s.student_id)
                  );
                  setSelectedStudentIds(e.target.checked ? allIds : new Set());
                }}
                checked={
                  filteredStudents.length > 0 &&
                  selectedStudentIds.size === filteredStudents.length
                }
              />
              <span>{selectedStudentIds.size} student(s) selected</span>
            </div>
            <div
              style={{ maxHeight: "400px", overflowY: "auto" }}
              className="border rounded p-2"
            >
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <Form.Check
                    key={student.student_id}
                    type="checkbox"
                    id={`student-check-${student.student_id}`}
                    label={`${student.student_name} (Balance: $${student.balance})`}
                    checked={selectedStudentIds.has(student.student_id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedStudentIds);
                      if (e.target.checked) {
                        newSet.add(student.student_id);
                      } else {
                        newSet.delete(student.student_id);
                      }
                      setSelectedStudentIds(newSet);
                    }}
                    className="p-2"
                  />
                ))
              ) : (
                <p className="text-muted text-center p-3">
                  No students with outstanding subsidy balances.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount Received</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={totalReceived}
                      onChange={(e) => setTotalReceived(e.target.value)}
                      placeholder="e.g. 5000.00"
                      required
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Alert
              variant={
                Math.abs(remainingToDistribute) < 0.01 ? "success" : "warning"
              }
            >
              Remaining to Distribute:{" "}
              <strong>${remainingToDistribute.toFixed(2)}</strong>
            </Alert>
            <Table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th className="text-end">Invoiced</th>
                  <th style={{ width: "150px" }} className="text-end">
                    Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((dist) => (
                  <tr key={dist.student_id}>
                    <td>{dist.student_name}</td>
                    <td className="text-end">${dist.invoiced.toFixed(2)}</td>
                    <td>
                      <InputGroup>
                        <InputGroup.Text>$</InputGroup.Text>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={dist.received}
                          onChange={(e) =>
                            handleDistributionChange(
                              dist.student_id,
                              e.target.value
                            )
                          }
                        />
                      </InputGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Form.Group>
              <Form.Label>Optional Note (e.g., ACH/Check Number)</Form.Label>
              <Form.Control
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </Form.Group>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={step === 1 ? handleClose : handleBack}
        >
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < 2 ? (
          <Button onClick={handleNext} disabled={selectedStudentIds.size === 0}>
            Continue
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={
              isSaving ||
              Math.abs(remainingToDistribute) > 0.01 ||
              !totalReceived
            }
          >
            {isSaving ? <Spinner size="sm" /> : "Continue"}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ReceiveSubsidyPaymentModal;
