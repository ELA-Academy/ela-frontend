import React, { useState, useEffect } from "react";
import { Plus, Clock, Check, Info, Trash2, Edit2 } from "lucide-react";
import { Modal, Button, Form } from "react-bootstrap";
import {
  getMyTimeEntries,
  createMyTimeEntry,
  updateMyTimeEntry,
  deleteMyTimeEntry,
  updateMyTimezone
} from "../../services/payrollService";
import "../../styles/GustoTheme.css";

const formatMinutes = (mins) => {
  const h = Math.floor((mins || 0) / 60);
  const m = (mins || 0) % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const buildWeekDays = (weekStartIso) => {
  if (!weekStartIso) return [];
  const base = new Date(`${weekStartIso}T00:00:00`);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const abbrev = dayNames[d.getDay()];
    days.push({
      iso,
      abbrev,
      label: `${abbrev}, ${monthNames[d.getMonth()]} ${d.getDate()}`
    });
  }
  return days;
};

const GustoTimeTrackingPage = () => {
  const [activeTab, setActiveTab] = useState("hours"); // "hours" | "settings"
  const [selectedWeekStart, setSelectedWeekStart] = useState("");
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState("Eastern Time (US & Canada) (EDT, GMT-4)");
  const [timezoneSaved, setTimezoneSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Add / Edit Shift Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    work_date: "",
    start_time: "09:00",
    end_time: "10:00",
    note: ""
  });

  const loadWeek = async (ws = selectedWeekStart) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await getMyTimeEntries(ws || undefined);
      setWeekData(res);
      if (!ws && res.week_start) setSelectedWeekStart(res.week_start);
      if (res.timezone) setTimezone(res.timezone);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to load timesheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeek(selectedWeekStart);
  }, [selectedWeekStart]);

  const openAddModal = (dayIso) => {
    setEditingShift(null);
    setShiftForm({ work_date: dayIso, start_time: "09:00", end_time: "10:00", note: "" });
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (shift) => {
    setEditingShift(shift);
    setShiftForm({
      work_date: shift.work_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      note: shift.note || ""
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (editingShift) {
        await updateMyTimeEntry(editingShift.id, {
          start_time: shiftForm.start_time,
          end_time: shiftForm.end_time,
          note: shiftForm.note
        });
      } else {
        await createMyTimeEntry({
          ...shiftForm,
          timezone
        });
      }
      setModalOpen(false);
      loadWeek(selectedWeekStart);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Could not save shift.");
    }
  };

  const handleDeleteShift = async (id) => {
    try {
      await deleteMyTimeEntry(id);
      loadWeek(selectedWeekStart);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Could not delete shift.");
    }
  };

  const handleSaveTimezone = async () => {
    try {
      await updateMyTimezone(timezone);
      setTimezoneSaved(true);
      setTimeout(() => setTimezoneSaved(false), 3000);
    } catch (err) {
      setErrorMsg("Failed to save timezone.");
    }
  };

  const days = buildWeekDays(weekData?.week_start);
  const allowedDays = weekData?.settings?.allowed_days || ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const isLocked = weekData?.is_locked;
  const entries = weekData?.entries || [];
  const totalWeekMinutes = entries.reduce((s, e) => s + (e.duration_minutes || 0), 0);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>Time tracking</h1>
          <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.2rem" }}>
            Timezone: <strong>{timezone}</strong> • Add whole-hour blocks &amp; class notes (e.g. Math, 7th grade).
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
        {[
          { id: "hours", label: "Hours" },
          { id: "settings", label: "Settings" }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              background: "none",
              border: "none",
              padding: "0.6rem 0.25rem",
              fontSize: "0.9rem",
              fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? "#111827" : "#6b7280",
              borderBottom: activeTab === t.id ? "2px solid #0f766e" : "2px solid transparent",
              cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "hours" ? (
        <>
          {/* Week Dropdown + Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <Form.Select
              style={{ maxWidth: "360px", fontWeight: 600 }}
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
            >
              {(weekData?.weeks_summary || []).map((w) => (
                <option key={w.week_start} value={w.week_start}>
                  {w.week_start} – {w.week_end} {w.is_current ? "(In Progress)" : w.is_paid ? "(Paid)" : w.is_locked ? "(Synced)" : ""} — {formatMinutes(w.total_minutes)}
                </option>
              ))}
            </Form.Select>

            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
              Week Total: <span style={{ color: "#0f766e" }}>{formatMinutes(totalWeekMinutes)}</span>
            </div>
          </div>

          {isLocked && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "0.9rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem", color: "#1e3a8a" }}>
              <Info className="w-5 h-5 shrink-0" />
              <span>
                Some of your hours have already been synced and can&apos;t be edited because this sheet has been locked or paid already.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-danger py-2 px-3 small mb-3">{errorMsg}</div>
          )}

          {loading ? (
            <p style={{ color: "#6b7280" }}>Loading timesheet...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {days.map((day) => {
                const dayEntries = entries.filter((e) => e.work_date === day.iso);
                const dayMins = dayEntries.reduce((s, e) => s + (e.duration_minutes || 0), 0);
                const isAllowed = allowedDays.includes(day.abbrev);

                return (
                  <div
                    key={day.iso}
                    style={{
                      backgroundColor: isAllowed ? "#ffffff" : "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "1rem 1.25rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: dayEntries.length > 0 ? "0.75rem" : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: isAllowed ? "#111827" : "#9ca3af" }}>
                          {day.label}
                        </span>
                        {!isAllowed && (
                          <span style={{ fontSize: "0.75rem", color: "#9ca3af", backgroundColor: "#f3f4f6", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                            Non-working day
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        {dayMins > 0 && (
                          <span style={{ fontWeight: 700, color: "#0f766e", fontSize: "0.9rem" }}>
                            {formatMinutes(dayMins)}
                          </span>
                        )}
                        {isAllowed && !isLocked && (
                          <button
                            type="button"
                            onClick={() => openAddModal(day.iso)}
                            style={{
                              backgroundColor: "#f0fdfa",
                              color: "#0f766e",
                              border: "1px solid #99f6e4",
                              borderRadius: "6px",
                              padding: "0.3rem 0.7rem",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem"
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" /> Add hours
                          </button>
                        )}
                      </div>
                    </div>

                    {dayEntries.map((shift) => (
                      <div
                        key={shift.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.55rem 0.75rem",
                          backgroundColor: "#f9fafb",
                          borderRadius: "6px",
                          marginTop: "0.4rem",
                          fontSize: "0.85rem"
                        }}
                      >
                        <div>
                          <Clock className="w-3.5 h-3.5 inline me-1 text-gray-500" />
                          <strong>{shift.start_time} – {shift.end_time}</strong>{" "}
                          <span style={{ color: "#6b7280" }}>({formatMinutes(shift.duration_minutes)})</span>
                          {shift.note && <span style={{ marginLeft: "0.6rem", color: "#111827" }}>• {shift.note}</span>}
                          {shift.updated_by_admin && shift.admin_override_note && (
                            <div style={{ fontSize: "0.75rem", color: "#b45309", marginTop: "0.15rem" }}>
                              Admin note: {shift.admin_override_note}
                            </div>
                          )}
                        </div>
                        {!isLocked && shift.status === "draft" && (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button type="button" onClick={() => openEditModal(shift)} style={{ background: "none", border: "none", color: "#0f766e", cursor: "pointer" }}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDeleteShift(shift.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1.5rem", maxWidth: "560px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Time Zone</h2>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1rem" }}>
            Everyone enters hours in their own time zone, and admins see your hours in your time zone.
          </p>
          <Form.Select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mb-3">
            <option value="Eastern Time (US & Canada) (EDT, GMT-4)">Eastern Time (US & Canada) (EDT, GMT-4)</option>
            <option value="Central Time (US & Canada) (CDT, GMT-5)">Central Time (US & Canada) (CDT, GMT-5)</option>
            <option value="Mountain Time (US & Canada) (MDT, GMT-6)">Mountain Time (US & Canada) (MDT, GMT-6)</option>
            <option value="Pacific Time (US & Canada) (PDT, GMT-7)">Pacific Time (US & Canada) (PDT, GMT-7)</option>
            <option value="America/Bogota (COT, GMT-5)">Colombia Time (COT, GMT-5)</option>
            <option value="Africa/Lagos (WAT, GMT+1)">West Africa Time (WAT, GMT+1)</option>
            <option value="Africa/Nairobi (EAT, GMT+3)">East Africa Time (EAT, GMT+3)</option>
          </Form.Select>
          <Button onClick={handleSaveTimezone} style={{ backgroundColor: "#0f766e", border: "none", fontWeight: 600 }}>
            Save Timezone
          </Button>
          {timezoneSaved && (
            <span style={{ marginLeft: "0.75rem", color: "#059669", fontWeight: 600, fontSize: "0.875rem" }}>
              <Check className="w-4 h-4 inline" /> Saved!
            </span>
          )}
        </div>
      )}

      {/* Add/Edit Shift Modal */}
      <Modal show={modalOpen} onHide={() => setModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            {editingShift ? "Edit Hours" : "Add Hours"} — {shiftForm.work_date}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveShift}>
          <Modal.Body>
            {errorMsg && <div className="alert alert-danger py-2 px-3 small">{errorMsg}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">Start time</Form.Label>
                <Form.Control type="time" required value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} />
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-semibold">End time</Form.Label>
                <Form.Control type="time" required value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} />
              </Form.Group>
            </div>
            <Form.Group>
              <Form.Label className="small fw-semibold">Class / Note (Required for teachers)</Form.Label>
              <Form.Control
                value={shiftForm.note}
                onChange={(e) => setShiftForm({ ...shiftForm, note: e.target.value })}
                placeholder="e.g. Math, 7th grade"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: "#0f766e", border: "none" }}>Save Hours</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default GustoTimeTrackingPage;
