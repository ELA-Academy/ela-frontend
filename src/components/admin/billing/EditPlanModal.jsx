import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Alert, Row, Col, Badge } from "react-bootstrap";
import { Calendar, Clock, CheckCircle2, FileText, User } from "lucide-react";
import { updateSubscription } from "../../../services/billingService";

const EditPlanModal = ({ show, onHide, plan, onSuccess }) => {
  const [planName, setPlanName] = useState("");
  const [status, setStatus] = useState("Active");
  const [cycle, setCycle] = useState("Monthly");
  
  const [schedulePreset, setSchedulePreset] = useState("1st");
  const [dueDay, setDueDay] = useState(1);
  const [invoiceGenDay, setInvoiceGenDay] = useState(26);

  const [nextInvoiceDate, setNextInvoiceDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync state whenever plan changes
  useEffect(() => {
    if (plan) {
      setPlanName(plan.plan_name || "Monthly Tuition Fee");
      setStatus(plan.status || "Active");
      setCycle(plan.cycle || "Monthly");

      const dDay = plan.due_day != null ? Number(plan.due_day) : 1;
      const gDay = plan.invoice_generation_day != null ? Number(plan.invoice_generation_day) : 26;

      setDueDay(dDay);
      setInvoiceGenDay(gDay);

      if (dDay === 1 && (gDay === 26 || gDay === 27)) {
        setSchedulePreset("1st");
      } else if (dDay === 15 && gDay === 10) {
        setSchedulePreset("15th");
      } else {
        setSchedulePreset("custom");
      }

      setNextInvoiceDate(plan.next_invoice_date ? plan.next_invoice_date.split("T")[0] : "");
      setStartDate(plan.start_date ? plan.start_date.split("T")[0] : "");
      setEndDate(plan.end_date ? plan.end_date.split("T")[0] : "");
      setError("");
    }
  }, [plan]);

  const handleSchedulePresetChange = (preset) => {
    setSchedulePreset(preset);
    if (preset === "1st") {
      setDueDay(1);
      setInvoiceGenDay(26);
    } else if (preset === "15th") {
      setDueDay(15);
      setInvoiceGenDay(10);
    }
  };

  // Calculate projected Next Due Date for preview
  const calculatedNextDue = useMemo(() => {
    if (!nextInvoiceDate) return "N/A";
    const [y, m, d] = nextInvoiceDate.split("-").map(Number);
    if (!y || !m || !d) return "N/A";

    const targetDueDay = schedulePreset === "1st" ? 1 : schedulePreset === "15th" ? 15 : Number(dueDay || 1);
    
    let dueYear = y;
    let dueMonth = m;
    if (d > targetDueDay) {
      dueMonth = m + 1;
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear += 1;
      }
    }
    const dueObj = new Date(dueYear, dueMonth - 1, targetDueDay);
    return dueObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [nextInvoiceDate, schedulePreset, dueDay]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plan) return;

    try {
      setLoading(true);
      setError("");

      const payload = {
        plan_name: planName,
        status: status,
        cycle: cycle,
        schedule_preset: schedulePreset,
        due_day: schedulePreset === "1st" ? 1 : schedulePreset === "15th" ? 15 : Number(dueDay),
        invoice_generation_day:
          schedulePreset === "1st" ? 26 : schedulePreset === "15th" ? 10 : Number(invoiceGenDay),
        next_invoice_date: nextInvoiceDate || null,
        start_date: startDate || null,
        end_date: endDate || null
      };

      await updateSubscription(plan.id, payload);
      if (onSuccess) onSuccess();
      onHide();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to update recurring plan.");
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="border-bottom pb-3">
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold text-slate-800" style={{ fontSize: "1.15rem" }}>
          <FileText className="text-primary" size={20} />
          <span>Edit Recurring Tuition Plan</span>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}

          {/* Student Banner */}
          <div className="p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between bg-light border">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center bg-primary text-white fw-bold rounded-circle"
                style={{ width: "42px", height: "42px", fontSize: "14px" }}
              >
                <User size={20} />
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-slate-800">{plan.student_name}</h6>
                <span className="small text-muted">{plan.grade_level || "Student"} • Plan ID #{plan.id}</span>
              </div>
            </div>

            <div className="text-end">
              <span className="small text-muted d-block">Monthly Total</span>
              <span className="fw-bold text-slate-900 fs-6">
                ${(plan.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label className="small fw-semibold text-slate-700">Plan Name</Form.Label>
              <Form.Control
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                required
              />
            </Col>

            <Col md={3}>
              <Form.Label className="small fw-semibold text-slate-700">Billing Cycle</Form.Label>
              <Form.Select value={cycle} onChange={(e) => setCycle(e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
                <option value="Quarterly">Quarterly</option>
              </Form.Select>
            </Col>

            <Col md={3}>
              <Form.Label className="small fw-semibold text-slate-700">Plan Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Cancelled">Cancelled</option>
              </Form.Select>
            </Col>
          </Row>

          <hr className="my-3 text-slate-200" />

          {/* Schedule Rules */}
          <div className="mb-3">
            <label className="fw-bold text-slate-800 d-flex align-items-center gap-1.5 mb-2" style={{ fontSize: "0.92rem" }}>
              <Clock size={16} className="text-primary" />
              <span>Billing Due Date Schedule</span>
            </label>

            <Row className="g-2.5 mb-2">
              <Col md={6}>
                <div
                  onClick={() => handleSchedulePresetChange("1st")}
                  className={`p-3 rounded-3 cursor-pointer border transition-all ${
                    schedulePreset === "1st" ? "border-primary bg-primary bg-opacity-10 shadow-sm" : "bg-white"
                  }`}
                  style={{ borderWidth: schedulePreset === "1st" ? "2px" : "1px" }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-slate-800">1st of the Month Due</span>
                    {schedulePreset === "1st" && <CheckCircle2 size={16} className="text-primary" />}
                  </div>
                  <div className="small text-slate-600">
                    Invoice generates <strong>5 days prior</strong> on the <strong>26th</strong>.
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div
                  onClick={() => handleSchedulePresetChange("15th")}
                  className={`p-3 rounded-3 cursor-pointer border transition-all ${
                    schedulePreset === "15th" ? "border-primary bg-primary bg-opacity-10 shadow-sm" : "bg-white"
                  }`}
                  style={{ borderWidth: schedulePreset === "15th" ? "2px" : "1px" }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-slate-800">15th of the Month Due</span>
                    {schedulePreset === "15th" && <CheckCircle2 size={16} className="text-primary" />}
                  </div>
                  <div className="small text-slate-600">
                    Invoice generates <strong>5 days prior</strong> on the <strong>10th</strong>.
                  </div>
                </div>
              </Col>
            </Row>

            <div className="d-flex align-items-center gap-2 mt-2">
              <Form.Check
                type="checkbox"
                id="single-custom-schedule"
                label="Custom day schedule"
                checked={schedulePreset === "custom"}
                onChange={(e) => setSchedulePreset(e.target.checked ? "custom" : "1st")}
                className="small text-slate-700"
              />
            </div>

            {schedulePreset === "custom" && (
              <Row className="g-3 mt-1 p-3 bg-light rounded-3 border">
                <Col md={6}>
                  <Form.Label className="small fw-semibold text-slate-700">Invoice Gen Day</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="31"
                    value={invoiceGenDay}
                    onChange={(e) => setInvoiceGenDay(e.target.value)}
                    size="sm"
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-semibold text-slate-700">Due Day</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    size="sm"
                  />
                </Col>
              </Row>
            )}
          </div>

          <hr className="my-3 text-slate-200" />

          {/* Next Invoice & Due Date */}
          <div className="mb-3">
            <label className="fw-bold text-slate-800 d-flex align-items-center gap-1.5 mb-2" style={{ fontSize: "0.92rem" }}>
              <Calendar size={16} className="text-primary" />
              <span>Next Invoice & Due Dates</span>
            </label>

            <Row className="g-3 align-items-center">
              <Col md={6}>
                <Form.Label className="small fw-semibold text-slate-700">Next Invoice Date</Form.Label>
                <Form.Control
                  type="date"
                  value={nextInvoiceDate}
                  onChange={(e) => setNextInvoiceDate(e.target.value)}
                  required
                />
              </Col>
              <Col md={6}>
                <div className="p-2.5 bg-light rounded-2 border">
                  <span className="small text-muted text-uppercase fw-bold d-block" style={{ fontSize: "10.5px" }}>
                    Projected Next Due Date
                  </span>
                  <span className="fw-bold text-success fs-6">{calculatedNextDue}</span>
                </div>
              </Col>
            </Row>
          </div>

          <hr className="my-3 text-slate-200" />

          {/* Plan Period */}
          <div className="mb-2">
            <label className="fw-bold text-slate-800 mb-2" style={{ fontSize: "0.92rem" }}>
              Contract Plan Period
            </label>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label className="small fw-semibold text-slate-700">Contract Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-semibold text-slate-700">Contract End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Ongoing (no end date)"
                />
                <Form.Text className="text-muted small">Clear date for ongoing plan.</Form.Text>
              </Col>
            </Row>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top bg-light px-4 py-3">
          <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading} className="d-flex align-items-center gap-1.5 px-3">
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditPlanModal;
