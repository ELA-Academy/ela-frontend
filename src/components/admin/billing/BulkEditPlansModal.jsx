import React, { useState, useMemo } from "react";
import { Modal, Button, Form, Alert, Row, Col, Badge } from "react-bootstrap";
import { Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, Layers } from "lucide-react";
import { bulkUpdateSubscriptions } from "../../../services/billingService";

const BulkEditPlansModal = ({ show, onHide, selectedPlans = [], onSuccess }) => {
  const [schedulePreset, setSchedulePreset] = useState("1st"); // '1st', '15th', 'custom'
  const [customDueDay, setCustomDueDay] = useState(1);
  const [customGenDay, setCustomGenDay] = useState(26);

  const [updateNextInvoice, setUpdateNextInvoice] = useState(true);
  const [nextInvoiceDate, setNextInvoiceDate] = useState("2026-10-26");

  const [updateStartDate, setUpdateStartDate] = useState(false);
  const [startDate, setStartDate] = useState("2026-09-01");

  const [updateEndDate, setUpdateEndDate] = useState(false);
  const [endDate, setEndDate] = useState("2027-06-30");

  const [updateStatus, setUpdateStatus] = useState(false);
  const [planStatus, setPlanStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-switch default nextInvoiceDate when schedule preset toggles
  const handleScheduleChange = (preset) => {
    setSchedulePreset(preset);
    if (preset === "1st") {
      setNextInvoiceDate("2026-10-26");
    } else if (preset === "15th") {
      setNextInvoiceDate("2026-10-10");
    }
  };

  // Calculate projected Next Due Date for preview
  const calculatedNextDue = useMemo(() => {
    if (!nextInvoiceDate) return "N/A";
    const [y, m, d] = nextInvoiceDate.split("-").map(Number);
    if (!y || !m || !d) return "N/A";

    const dueDay = schedulePreset === "1st" ? 1 : schedulePreset === "15th" ? 15 : Number(customDueDay || 1);
    
    // If invoice generates at the end of the month for 1st (e.g. 26th), due date is 1st of next month
    let dueYear = y;
    let dueMonth = m; // in 1-based index, if invoice day > due day, rolls over to next month
    if (d > dueDay) {
      dueMonth = m + 1;
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear += 1;
      }
    }
    const dueObj = new Date(dueYear, dueMonth - 1, dueDay);
    return dueObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [nextInvoiceDate, schedulePreset, customDueDay]);

  const handleApplyPresetContract = (presetType) => {
    if (presetType === "school_year") {
      setUpdateStartDate(true);
      setStartDate("2026-09-01");
      setUpdateEndDate(true);
      setEndDate("2027-06-30");
    } else if (presetType === "august_may") {
      setUpdateStartDate(true);
      setStartDate("2026-08-01");
      setUpdateEndDate(true);
      setEndDate("2027-05-31");
    } else if (presetType === "ongoing") {
      setUpdateEndDate(true);
      setEndDate("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlans.length) {
      setError("No plans selected.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        subscription_ids: selectedPlans.map((p) => p.id),
        schedule_preset: schedulePreset,
        due_day: schedulePreset === "1st" ? 1 : schedulePreset === "15th" ? 15 : Number(customDueDay),
        invoice_generation_day:
          schedulePreset === "1st" ? 26 : schedulePreset === "15th" ? 10 : Number(customGenDay)
      };

      if (updateNextInvoice && nextInvoiceDate) {
        payload.next_invoice_date = nextInvoiceDate;
      }
      if (updateStartDate && startDate) {
        payload.start_date = startDate;
      }
      if (updateEndDate) {
        payload.update_end_date = true;
        payload.end_date = endDate || null;
      }
      if (updateStatus && planStatus) {
        payload.status = planStatus;
      }

      await bulkUpdateSubscriptions(payload);
      if (onSuccess) onSuccess();
      onHide();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to bulk update recurring plans.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="border-bottom pb-3">
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold text-slate-800" style={{ fontSize: "1.15rem" }}>
          <Layers className="text-primary" size={22} />
          <span>Bulk Edit Recurring Plan Dates & Schedule</span>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}

          {/* Banner summary */}
          <div
            className="p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between"
            style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div className="d-flex align-items-center gap-2">
              <Badge bg="primary" className="px-2.5 py-1.5 fs-7 fw-semibold">
                {selectedPlans.length} Selected
              </Badge>
              <span className="small text-slate-600">
                You are editing dates and billing rules for <strong>{selectedPlans.length} recurring tuition plans</strong>.
              </span>
            </div>
            <div className="small text-muted fst-italic">Changes apply instantly</div>
          </div>

          {/* 1. Due Date & Billing Schedule */}
          <div className="mb-4">
            <label className="fw-bold text-slate-800 d-flex align-items-center gap-1.5 mb-2" style={{ fontSize: "0.92rem" }}>
              <Clock size={16} className="text-primary" />
              <span>1. Billing Due Date & Invoice Generation Schedule</span>
            </label>
            <p className="text-muted small mb-2.5">
              Choose the standard billing rule. Invoices generate <strong>5 days prior</strong> to the due date.
            </p>

            <Row className="g-2.5 mb-2">
              <Col md={6}>
                <div
                  onClick={() => handleScheduleChange("1st")}
                  className={`p-3 rounded-3 cursor-pointer border transition-all ${
                    schedulePreset === "1st" ? "border-primary bg-primary bg-opacity-10 shadow-sm" : "bg-white hover-bg-light"
                  }`}
                  style={{ borderWidth: schedulePreset === "1st" ? "2px" : "1px" }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-slate-800">1st of the Month Due Date</span>
                    {schedulePreset === "1st" && <CheckCircle2 size={16} className="text-primary" />}
                  </div>
                  <div className="small text-slate-600">
                    Invoice generates <strong>5 days before</strong> on the <strong>26th</strong> of previous month.
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div
                  onClick={() => handleScheduleChange("15th")}
                  className={`p-3 rounded-3 cursor-pointer border transition-all ${
                    schedulePreset === "15th" ? "border-primary bg-primary bg-opacity-10 shadow-sm" : "bg-white hover-bg-light"
                  }`}
                  style={{ borderWidth: schedulePreset === "15th" ? "2px" : "1px" }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-slate-800">15th of the Month Due Date</span>
                    {schedulePreset === "15th" && <CheckCircle2 size={16} className="text-primary" />}
                  </div>
                  <div className="small text-slate-600">
                    Invoice generates <strong>5 days before</strong> on the <strong>10th</strong> of the month.
                  </div>
                </div>
              </Col>
            </Row>

            {/* Custom schedule expansion */}
            <div className="d-flex align-items-center gap-2 mt-2">
              <Form.Check
                type="checkbox"
                id="custom-schedule-check"
                label="Use custom day numbers"
                checked={schedulePreset === "custom"}
                onChange={(e) => setSchedulePreset(e.target.checked ? "custom" : "1st")}
                className="small text-slate-700"
              />
            </div>

            {schedulePreset === "custom" && (
              <Row className="g-3 mt-1 p-3 bg-light rounded-3 border">
                <Col md={6}>
                  <Form.Label className="small fw-semibold text-slate-700">Invoice Generation Day of Month</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="31"
                    value={customGenDay}
                    onChange={(e) => setCustomGenDay(e.target.value)}
                    size="sm"
                  />
                  <Form.Text className="text-muted small">E.g., 26 (generates on 26th)</Form.Text>
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-semibold text-slate-700">Due Day of Month</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="31"
                    value={customDueDay}
                    onChange={(e) => setCustomDueDay(e.target.value)}
                    size="sm"
                  />
                  <Form.Text className="text-muted small">E.g., 1 (due on 1st)</Form.Text>
                </Col>
              </Row>
            )}
          </div>

          <hr className="my-3 text-slate-200" />

          {/* 2. Next Invoice Date & Due Date */}
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="fw-bold text-slate-800 d-flex align-items-center gap-1.5 m-0" style={{ fontSize: "0.92rem" }}>
                <Calendar size={16} className="text-primary" />
                <span>2. Next Invoice Generation Date</span>
              </label>
              <Form.Check
                type="checkbox"
                id="toggle-next-invoice"
                label="Update Next Invoice Date"
                checked={updateNextInvoice}
                onChange={(e) => setUpdateNextInvoice(e.target.checked)}
                className="small text-primary fw-semibold"
              />
            </div>

            {updateNextInvoice ? (
              <div className="p-3 bg-light rounded-3 border">
                <Row className="align-items-center g-3">
                  <Col md={6}>
                    <Form.Label className="small fw-semibold text-slate-700 mb-1">
                      Target Invoice Generation Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={nextInvoiceDate}
                      onChange={(e) => setNextInvoiceDate(e.target.value)}
                      required={updateNextInvoice}
                    />
                    <Form.Text className="text-muted small">
                      The automated system will generate the invoice on this date.
                    </Form.Text>
                  </Col>
                  <Col md={6}>
                    <div className="p-2.5 bg-white rounded-2 border d-flex flex-column gap-1">
                      <span className="small text-muted text-uppercase fw-bold" style={{ fontSize: "10.5px" }}>
                        Projected Due Date
                      </span>
                      <span className="fw-bold text-success fs-6">{calculatedNextDue}</span>
                      <span className="small text-muted" style={{ fontSize: "11px" }}>
                        Based on {schedulePreset === "1st" ? "1st of month" : schedulePreset === "15th" ? "15th of month" : `Day ${customDueDay}`} schedule
                      </span>
                    </div>
                  </Col>
                </Row>
              </div>
            ) : (
              <p className="text-muted small mb-0 fst-italic">Next invoice generation dates will remain unchanged.</p>
            )}
          </div>

          <hr className="my-3 text-slate-200" />

          {/* 3. Contract Plan Period (Start / End Date) */}
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="fw-bold text-slate-800 d-flex align-items-center gap-1.5 m-0" style={{ fontSize: "0.92rem" }}>
                <Sparkles size={16} className="text-primary" />
                <span>3. Contract Plan Period (Length)</span>
              </label>
              <div className="d-flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPresetContract("school_year")}
                  className="btn btn-outline-secondary btn-sm py-0.5 px-2 text-xs"
                >
                  Sep 1 – Jun 30
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetContract("august_may")}
                  className="btn btn-outline-secondary btn-sm py-0.5 px-2 text-xs"
                >
                  Aug 1 – May 31
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetContract("ongoing")}
                  className="btn btn-outline-secondary btn-sm py-0.5 px-2 text-xs"
                >
                  Ongoing
                </button>
              </div>
            </div>

            <Row className="g-3">
              <Col md={6}>
                <div className="p-3 bg-light rounded-3 border h-100">
                  <Form.Check
                    type="checkbox"
                    id="update-start-date"
                    label="Update Contract Start Date"
                    checked={updateStartDate}
                    onChange={(e) => setUpdateStartDate(e.target.checked)}
                    className="small fw-semibold text-slate-700 mb-2"
                  />
                  {updateStartDate && (
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      size="sm"
                    />
                  )}
                </div>
              </Col>

              <Col md={6}>
                <div className="p-3 bg-light rounded-3 border h-100">
                  <Form.Check
                    type="checkbox"
                    id="update-end-date"
                    label="Update Contract End Date"
                    checked={updateEndDate}
                    onChange={(e) => setUpdateEndDate(e.target.checked)}
                    className="small fw-semibold text-slate-700 mb-2"
                  />
                  {updateEndDate && (
                    <>
                      <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        size="sm"
                        placeholder="Leave blank for ongoing"
                      />
                      <Form.Text className="text-muted small" style={{ fontSize: "11px" }}>
                        Leave blank or clear date for no end date (ongoing).
                      </Form.Text>
                    </>
                  )}
                </div>
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
              <span>Updating {selectedPlans.length} Plans...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Apply Changes ({selectedPlans.length})</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default BulkEditPlansModal;
