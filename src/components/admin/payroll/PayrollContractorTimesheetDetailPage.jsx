import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, CheckCircle2, Edit2, Trash2 } from "lucide-react";
import { Button, Modal, Form } from "react-bootstrap";
import {
  getAdminStaffTimesheet,
  adminAddShift,
  adminUpdateShift,
  adminDeleteShift
} from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const formatMinutes = (mins) => {
  const h = Math.floor((mins || 0) / 60);
  const m = (mins || 0) % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const PayrollContractorTimesheetDetailPage = () => {
  const { contractorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const today = new Date();
  const defaultStart = searchParams.get("start") || new Date(today.getTime() - 13 * 86400000).toISOString().slice(0, 10);
  const defaultEnd = searchParams.get("end") || today.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [staff, setStaff] = useState(null);
  const [timezone, setTimezone] = useState("");
  const [shifts, setShifts] = useState([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  // Add Shift Modal
  const [addOpen, setAddOpen] = useState(false);
  const [newShift, setNewShift] = useState({
    work_date: today.toISOString().slice(0, 10),
    start_time: "09:00",
    end_time: "10:00",
    note: "",
    admin_override_note: "Added by Payroll Admin"
  });

  // Overwrite/Round Shift Modal
  const [editShift, setEditShift] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadTimesheet = async () => {
    setLoading(true);
    try {
      const res = await getAdminStaffTimesheet(contractorId, startDate, endDate);
      setStaff(res.staff);
      setTimezone(res.timezone);
      setShifts(res.shifts || []);
      setTotalMinutes(res.total_minutes || 0);
    } catch (err) {
      console.error("Failed to load contractor timesheet:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimesheet();
  }, [contractorId, startDate, endDate]);

  const handleAddShift = async (e) => {
    e.preventDefault();
    try {
      await adminAddShift(contractorId, newShift);
      setAddOpen(false);
      showToast("Shift added to timesheet.");
      loadTimesheet();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to add shift.");
    }
  };

  const handleUpdateShift = async (e) => {
    e.preventDefault();
    if (!editShift) return;
    try {
      await adminUpdateShift(editShift.id, {
        start_time: editShift.start_time,
        end_time: editShift.end_time,
        note: editShift.note,
        admin_override_note: editShift.admin_override_note
      });
      setEditShift(null);
      showToast("Shift updated with audit note.");
      loadTimesheet();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to update shift.");
    }
  };

  const handleDeleteShift = async (shiftId) => {
    try {
      await adminDeleteShift(shiftId);
      showToast("Shift deleted.");
      loadTimesheet();
    } catch (err) {
      showToast("Failed to delete shift.");
    }
  };

  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto", paddingBottom: "4rem" }}>
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

      <button
        type="button"
        onClick={() => navigate("/admin/payroll/time-attendance/time-tracking")}
        style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: 0, marginBottom: "1rem", cursor: "pointer" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Time Tracking
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            {staff?.name || "Loading..."} — Timesheet
          </h1>
          <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
            Timezone: <strong>{timezone}</strong> • Total: <strong>{formatMinutes(totalMinutes)}</strong>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "0.4rem 0.6rem", border: "1px solid #d1d5db", borderRadius: "6px" }} />
          <span>to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "0.4rem 0.6rem", border: "1px solid #d1d5db", borderRadius: "6px" }} />
          <Button onClick={() => setAddOpen(true)} style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}>
            <Plus className="w-4 h-4 me-1 inline" /> Add Shift
          </Button>
        </div>
      </div>

      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
              <th style={{ padding: "0.85rem 1rem", textAlign: "left" }}>Date</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "left" }}>Start – End Time</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "left" }}>Class / Note</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "left" }}>Duration</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "left" }}>Status</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading shifts...</td></tr>
            ) : shifts.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No shifts logged in this date range.</td></tr>
            ) : (
              shifts.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{s.work_date}</td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <strong>{s.start_time} – {s.end_time}</strong>
                    {s.updated_by_admin && s.admin_override_note && (
                      <div style={{ fontSize: "0.75rem", color: "#b45309" }}>{s.admin_override_note}</div>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#374151" }}>{s.note || "-"}</td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{formatMinutes(s.duration_minutes)}</td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span
                      style={{
                        backgroundColor: s.status === "paid" ? "#dcfce7" : s.status === "synced" ? "#dbeafe" : "#f3f4f6",
                        color: s.status === "paid" ? "#166534" : s.status === "synced" ? "#1e40af" : "#374151",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "capitalize"
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setEditShift({
                          ...s,
                          admin_override_note: s.admin_override_note || "Rounded up to nearest whole hour - CM"
                        })
                      }
                      style={{ background: "none", border: "none", color: "#0f766e", fontWeight: 600, cursor: "pointer", marginRight: "0.75rem" }}
                    >
                      <Edit2 className="w-4 h-4 inline me-1" /> Overwrite
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteShift(s.id)}
                      style={{ background: "none", border: "none", color: "#dc2626", fontWeight: 600, cursor: "pointer" }}
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Shift Modal */}
      <Modal show={addOpen} onHide={() => setAddOpen(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Shift for {staff?.name}</Modal.Title></Modal.Header>
        <Form onSubmit={handleAddShift}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" required value={newShift.work_date} onChange={(e) => setNewShift({ ...newShift, work_date: e.target.value })} />
            </Form.Group>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }} className="mb-3">
              <Form.Group>
                <Form.Label>Start time</Form.Label>
                <Form.Control type="time" required value={newShift.start_time} onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })} />
              </Form.Group>
              <Form.Group>
                <Form.Label>End time</Form.Label>
                <Form.Control type="time" required value={newShift.end_time} onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })} />
              </Form.Group>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Class / Note</Form.Label>
              <Form.Control value={newShift.note} onChange={(e) => setNewShift({ ...newShift, note: e.target.value })} placeholder="e.g. Math, 7th grade" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Admin override note</Form.Label>
              <Form.Control value={newShift.admin_override_note} onChange={(e) => setNewShift({ ...newShift, admin_override_note: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: "#0f766e", border: "none" }}>Save Shift</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Overwrite Shift Modal */}
      <Modal show={!!editShift} onHide={() => setEditShift(null)} centered>
        <Modal.Header closeButton><Modal.Title>Overwrite / Round Shift</Modal.Title></Modal.Header>
        <Form onSubmit={handleUpdateShift}>
          <Modal.Body>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }} className="mb-3">
              <Form.Group>
                <Form.Label>Start time</Form.Label>
                <Form.Control type="time" required value={editShift?.start_time || ""} onChange={(e) => setEditShift({ ...editShift, start_time: e.target.value })} />
              </Form.Group>
              <Form.Group>
                <Form.Label>End time</Form.Label>
                <Form.Control type="time" required value={editShift?.end_time || ""} onChange={(e) => setEditShift({ ...editShift, end_time: e.target.value })} />
              </Form.Group>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Class / Note</Form.Label>
              <Form.Control value={editShift?.note || ""} onChange={(e) => setEditShift({ ...editShift, note: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Reason for overwrite (visible to staff)</Form.Label>
              <Form.Control required value={editShift?.admin_override_note || ""} onChange={(e) => setEditShift({ ...editShift, admin_override_note: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setEditShift(null)}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: "#0f766e", border: "none" }}>Save Overwrite</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PayrollContractorTimesheetDetailPage;
