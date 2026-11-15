import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Info,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Edit2
} from "lucide-react";
import { Button, Modal, Form } from "react-bootstrap";
import { getAllStaff } from "../../../services/staffService";
import "../../../styles/GustoTheme.css";

const PayrollContractorTimesheetDetailPage = () => {
  const { contractorId } = useParams();
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [allContractors, setAllContractors] = useState([
    { id: "dana-acosta", name: "Dana Acosta" },
    { id: "nikolth-acosta", name: "Nikolth Acosta" },
    { id: "moyinoluwa-adebola", name: "Moyinoluwa Adebola" },
    { id: "danna-alvarez", name: "Danna Alvarez" },
    { id: "christian-ayemidejor", name: "Christian Ayemidejor" },
    { id: "aldren-barboza", name: "Aldren Barboza" }
  ]);

  // Current contractor details
  const [contractorName, setContractorName] = useState("Moyinoluwa Adebola");

  // Daily shifts state matching Image 8
  const [daysShifts, setDaysShifts] = useState([
    { day: "Sun, Sep 20", shifts: [], totalHours: 0 },
    { day: "Mon, Sep 21", shifts: [{ id: "s-1", hours: 4, note: "8:00 AM - 12:00 PM" }], totalHours: 4 },
    { day: "Tue, Sep 22", shifts: [{ id: "s-2", hours: 4, note: "8:00 AM - 12:00 PM" }], totalHours: 4 },
    { day: "Wed, Sep 23", shifts: [{ id: "s-3", hours: 4, note: "8:00 AM - 12:00 PM" }], totalHours: 4 },
    { day: "Thu, Sep 24", shifts: [{ id: "s-4", hours: 4, note: "8:00 AM - 12:00 PM" }], totalHours: 4 },
    { day: "Fri, Sep 25", shifts: [], totalHours: 0 },
    { day: "Sat, Sep 26", shifts: [], totalHours: 0 }
  ]);

  // Overwrite Modal
  const [overwriteModalOpen, setOverwriteModalOpen] = useState(false);
  const [selectedDayForOverwrite, setSelectedDayForOverwrite] = useState(null);
  const [overwriteHours, setOverwriteHours] = useState("4");
  const [overwriteReason, setOverwriteReason] = useState("Manager manual adjustment");

  // Add Shift Modal
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState(null);
  const [newShiftStart, setNewShiftStart] = useState("09:00");
  const [newShiftEnd, setNewShiftEnd] = useState("13:00");
  const [newShiftBreak, setNewShiftBreak] = useState("0");

  useEffect(() => {
    const loadRoster = async () => {
      try {
        const res = await getAllStaff();
        const list = Array.isArray(res) ? res : res.staff || [];
        if (list.length > 0) {
          const mapped = list.map((s, idx) => ({
            id: s.id || `staff-${idx}`,
            name: s.name
          }));
          setAllContractors(mapped);
        }
      } catch (err) {
        console.error("Failed to load staff roster:", err);
      }
    };
    loadRoster();
  }, []);

  useEffect(() => {
    const found = allContractors.find(
      (c) => c.id === contractorId || c.name.toLowerCase().replace(/\s+/g, "-") === contractorId
    );
    if (found) {
      setContractorName(found.name);
    } else {
      // capitalize words if slug
      const fallback = contractorId
        ? contractorId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : "Moyinoluwa Adebola";
      setContractorName(fallback);
    }
  }, [contractorId, allContractors]);

  // Calculate current contractor index and prev/next
  const currentIndex = allContractors.findIndex(
    (c) => c.id === contractorId || c.name.toLowerCase().replace(/\s+/g, "-") === contractorId
  );
  const prevContractor = currentIndex > 0 ? allContractors[currentIndex - 1] : null;
  const nextContractor = currentIndex < allContractors.length - 1 ? allContractors[currentIndex + 1] : null;

  const totalWeeklyHours = daysShifts.reduce((sum, d) => sum + d.totalHours, 0);

  const handleSaveOverwrite = (e) => {
    e.preventDefault();
    if (!selectedDayForOverwrite) return;
    const hoursNum = parseFloat(overwriteHours) || 0;
    setDaysShifts((prev) =>
      prev.map((d) => {
        if (d.day === selectedDayForOverwrite.day) {
          return {
            ...d,
            shifts: [{ id: `s-${Date.now()}`, hours: hoursNum, note: overwriteReason }],
            totalHours: hoursNum
          };
        }
        return d;
      })
    );
    setOverwriteModalOpen(false);
    setToastMessage(`Hours updated for ${selectedDayForOverwrite.day}.`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleSaveAddShift = (e) => {
    e.preventDefault();
    if (!selectedDayForAdd) return;
    // Calculate difference between start and end
    const [startH, startM] = newShiftStart.split(":").map(Number);
    const [endH, endM] = newShiftEnd.split(":").map(Number);
    let diff = (endH + endM / 60) - (startH + startM / 60) - (parseFloat(newShiftBreak) || 0) / 60;
    if (diff < 0) diff = 4;
    const calculatedHours = Math.round(diff * 10) / 10;

    setDaysShifts((prev) =>
      prev.map((d) => {
        if (d.day === selectedDayForAdd.day) {
          const updatedShifts = [
            ...d.shifts,
            { id: `s-${Date.now()}`, hours: calculatedHours, note: `${newShiftStart} - ${newShiftEnd}` }
          ];
          return {
            ...d,
            shifts: updatedShifts,
            totalHours: d.totalHours + calculatedHours
          };
        }
        return d;
      })
    );
    setAddShiftModalOpen(false);
    setToastMessage(`Shift added for ${selectedDayForAdd.day} (${calculatedHours}h).`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#1e3a8a",
            color: "#ffffff",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            zIndex: 9999,
            fontSize: "0.875rem",
            fontWeight: 600
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Back Arrow & Top Right Pager (Image 8 replica) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.75rem"
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/payroll/time-attendance/time-tracking")}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: 0,
              marginBottom: "0.5rem"
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to timesheets
          </button>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            {contractorName}'s timesheet
          </h1>
          <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.25rem" }}>
            Sun, Sep 20 - Sat, Sep 26
          </div>
        </div>

        {/* Top Right Staff Pager (Image 8 replica: < Nikolth Acosta  3 of 69  Danna Alvarez >) */}
        {allContractors.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", fontSize: "0.875rem", color: "#4b5563" }}>
            {prevContractor && (
              <button
                type="button"
                onClick={() => navigate(`/admin/payroll/time-attendance/timesheets/${prevContractor.id}`)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                ‹ {prevContractor.name}
              </button>
            )}
            <span style={{ color: "#9ca3af", fontWeight: 500 }}>
              {currentIndex >= 0 ? currentIndex + 1 : 3} of {allContractors.length || 69}
            </span>
            {nextContractor && (
              <button
                type="button"
                onClick={() => navigate(`/admin/payroll/time-attendance/timesheets/${nextContractor.id}`)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {nextContractor.name} ›
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Card: Total 20h (Image 8 replica) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "1.5rem 2rem",
          marginBottom: "1.75rem"
        }}
      >
        <div style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: 500 }}>Total</div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginTop: "0.25rem" }}>
          {totalWeeklyHours}h
        </div>
      </div>

      {/* Shifts Breakdown Table (Image 8 replica) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          overflow: "hidden"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280", backgroundColor: "#f8fafc" }}>
              <th style={{ padding: "0.95rem 1.25rem", fontWeight: 600, width: "25%" }}>Day</th>
              <th style={{ padding: "0.95rem 1rem", fontWeight: 600, width: "55%" }}>Shifts</th>
              <th style={{ padding: "0.95rem 1.25rem", fontWeight: 600, textAlign: "right", width: "20%" }}>Hours</th>
            </tr>
          </thead>
          <tbody>
            {daysShifts.map((d, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                {/* Day */}
                <td style={{ padding: "1.25rem", color: "#111827", fontWeight: 500, verticalAlign: "middle" }}>
                  {d.day}
                </td>

                {/* Shifts */}
                <td style={{ padding: "1.25rem 1rem", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
                    {d.shifts.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "12px",
                          padding: "0.35rem 0.85rem",
                          backgroundColor: "#f9fafb"
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#111827", fontSize: "0.9rem" }}>{s.hours}h</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" title={s.note} />
                      </div>
                    ))}

                    {d.shifts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDayForOverwrite(d);
                          setOverwriteHours(String(d.totalHours));
                          setOverwriteModalOpen(true);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2563eb",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "underline",
                          padding: 0
                        }}
                      >
                        Overwrite
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayForAdd(d);
                        setAddShiftModalOpen(true);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: 0
                      }}
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </td>

                {/* Total Daily Hours */}
                <td style={{ padding: "1.25rem", textAlign: "right", color: "#111827", fontWeight: 600, verticalAlign: "middle" }}>
                  {d.totalHours > 0 ? `${d.totalHours}h` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* OVERWRITE SHIFT MODAL */}
      <Modal show={overwriteModalOpen} onHide={() => setOverwriteModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Overwrite Hours — {selectedDayForOverwrite?.day}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveOverwrite}>
          <Modal.Body className="p-4" style={{ fontSize: "0.875rem" }}>
            <p className="text-slate-600 mb-3">
              Directly adjust the recorded contractor hours for <strong>{contractorName}</strong> on {selectedDayForOverwrite?.day}.
            </p>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Total Hours</Form.Label>
              <Form.Control
                type="number"
                step="0.5"
                value={overwriteHours}
                onChange={(e) => setOverwriteHours(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Adjustment Note / Explanation</Form.Label>
              <Form.Control
                type="text"
                value={overwriteReason}
                onChange={(e) => setOverwriteReason(e.target.value)}
                placeholder="e.g. Approved overtime shift"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setOverwriteModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
              Apply Overwrite
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ADD SHIFT MODAL */}
      <Modal show={addShiftModalOpen} onHide={() => setAddShiftModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Add Shift — {selectedDayForAdd?.day}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveAddShift}>
          <Modal.Body className="p-4" style={{ fontSize: "0.875rem" }}>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <Form.Label className="small fw-semibold text-slate-700">Clock In Time</Form.Label>
                <Form.Control
                  type="time"
                  value={newShiftStart}
                  onChange={(e) => setNewShiftStart(e.target.value)}
                  required
                />
              </div>
              <div className="col-6">
                <Form.Label className="small fw-semibold text-slate-700">Clock Out Time</Form.Label>
                <Form.Control
                  type="time"
                  value={newShiftEnd}
                  onChange={(e) => setNewShiftEnd(e.target.value)}
                  required
                />
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-slate-700">Unpaid Break (minutes)</Form.Label>
              <Form.Control
                type="number"
                value={newShiftBreak}
                onChange={(e) => setNewShiftBreak(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setAddShiftModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
              Add Shift
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PayrollContractorTimesheetDetailPage;
