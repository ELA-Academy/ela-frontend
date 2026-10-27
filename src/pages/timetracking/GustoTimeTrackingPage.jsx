import React, { useState } from "react";
import { Plus, ChevronDown, Clock, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AddShiftModal from "../../components/timetracking/AddShiftModal";
import "../../styles/GustoTheme.css";

const GustoTimeTrackingPage = () => {
  const { user } = useAuth();
  const staffName = user?.name || "Team Member";

  const [activeTab, setActiveTab] = useState("hours"); // "hours" | "settings"
  const [selectedTimezone, setSelectedTimezone] = useState("Eastern Time (EDT)");
  const [timezoneSaved, setTimezoneSaved] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [activeDay, setActiveDay] = useState(null);

  // Sample schedule structure matching Picture 4
  const [daysSchedule, setDaysSchedule] = useState([
    {
      id: "sun",
      dayName: "Sun, Oct 4",
      shifts: [],
      hours: "",
      isFuture: false
    },
    {
      id: "mon",
      dayName: "Mon, Oct 5",
      shifts: [
        { id: 1, startTime: "08:30", endTime: "12:00", label: "8:30am – 12:00pm" },
        { id: 2, startTime: "13:00", endTime: "17:00", label: "1:00pm – 5:00pm" }
      ],
      hours: "7h 30m",
      isFuture: false
    },
    {
      id: "tue",
      dayName: "Tue, Oct 6",
      shifts: [
        { id: 3, startTime: "08:30", endTime: "12:00", label: "8:30am – 12:00pm" }
      ],
      hours: "3h 30m",
      isFuture: false
    },
    {
      id: "wed",
      dayName: "Wed, Oct 7",
      shifts: [],
      hours: "",
      isFuture: true
    },
    {
      id: "thu",
      dayName: "Thu, Oct 8",
      shifts: [],
      hours: "",
      isFuture: true
    },
    {
      id: "fri",
      dayName: "Fri, Oct 9",
      shifts: [],
      hours: "",
      isFuture: true
    },
    {
      id: "sat",
      dayName: "Sat, Oct 10",
      shifts: [],
      hours: "",
      isFuture: true
    }
  ]);

  const handleOpenAddShift = (day) => {
    setActiveDay(day.dayName);
    setEditingShift(null);
    setModalOpen(true);
  };

  const handleOpenEditShift = (day, shift) => {
    setActiveDay(day.dayName);
    setEditingShift(shift);
    setModalOpen(true);
  };

  const handleSaveShift = (newShiftData) => {
    // Format label for display
    const formatTimeLabel = (timeStr) => {
      if (!timeStr) return "";
      const [h, m] = timeStr.split(":").map(Number);
      const ampm = h >= 12 ? "pm" : "am";
      const formattedH = h % 12 || 12;
      return `${formattedH}:${String(m).padStart(2, "0")}${ampm}`;
    };

    const label = `${formatTimeLabel(newShiftData.startTime)} – ${formatTimeLabel(newShiftData.endTime)}`;

    setDaysSchedule((prev) =>
      prev.map((d) => {
        if (d.dayName === activeDay) {
          let updatedShifts;
          if (editingShift) {
            updatedShifts = d.shifts.map((s) =>
              s.id === editingShift.id
                ? { ...s, startTime: newShiftData.startTime, endTime: newShiftData.endTime, label }
                : s
            );
          } else {
            updatedShifts = [
              ...d.shifts,
              {
                id: Date.now(),
                startTime: newShiftData.startTime,
                endTime: newShiftData.endTime,
                label
              }
            ];
          }
          return {
            ...d,
            shifts: updatedShifts,
            hours: `${newShiftData.totalHours}h`
          };
        }
        return d;
      })
    );
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setTimezoneSaved(true);
    setTimeout(() => setTimezoneSaved(false), 3000);
  };

  const timezonesList = [
    "Eastern Time (EDT)",
    "Central Time (CDT)",
    "Mountain Time (MDT)",
    "Arizona (MST)",
    "Pacific Time (PDT)",
    "Alaska (AKDT)",
    "Hawaii (HST)",
    "Indiana (East) (EDT)",
    "American Samoa (GMT -11)",
    "Midway Island (GMT -11)",
    "Tijuana (GMT -7)",
    "Chihuahua (GMT -6)",
    "Central America (GMT -6)",
    "Mexico City (GMT -6)",
    "Bogota (GMT -5)",
    "Lima (GMT -5)",
    "Atlantic Time (Canada) (GMT -3)"
  ];

  return (
    <div>
      {/* Page Title */}
      <div className="gusto-page-header" style={{ marginBottom: "1.25rem" }}>
        <h1 className="gusto-page-title">Time tracking</h1>
      </div>

      {/* Tabs */}
      <div className="gusto-tabs-bar">
        <button
          className={`gusto-tab-item ${activeTab === "hours" ? "active" : ""}`}
          onClick={() => setActiveTab("hours")}
        >
          My hours
        </button>
        <button
          className={`gusto-tab-item ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      {/* TAB 1: MY HOURS (Picture 4) */}
      {activeTab === "hours" && (
        <div>
          {/* Week Selector Dropdown */}
          <div className="gusto-week-select-container">
            <div className="gusto-week-label">Week</div>
            <div className="gusto-week-dropdown">
              <span>Oct 4 – Oct 10, 2026 (In Progress)</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Total Box */}
          <div className="gusto-total-card">
            <div className="gusto-total-label">Total</div>
            <div className="gusto-total-number">11h</div>
          </div>

          {/* Schedule Table */}
          <table className="gusto-schedule-table">
            <thead>
              <tr>
                <th style={{ width: "160px" }}>Day</th>
                <th>Shifts</th>
                <th style={{ width: "120px", textAlign: "right" }}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {daysSchedule.map((row) => (
                <tr key={row.id} className="gusto-schedule-row">
                  <td className="gusto-day-col">{row.dayName}</td>
                  <td>
                    {row.isFuture ? (
                      <div className="gusto-future-text">
                        You can't edit days in the future
                      </div>
                    ) : (
                      <div className="gusto-shifts-col">
                        {row.shifts.map((shift) => (
                          <div key={shift.id} className="gusto-shift-pill">
                            <span>{shift.label}</span>
                            <button
                              type="button"
                              className="gusto-shift-edit-btn"
                              onClick={() => handleOpenEditShift(row, shift)}
                            >
                              Edit
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="gusto-add-shift-btn"
                          onClick={() => handleOpenAddShift(row)}
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="gusto-hours-col">{row.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: SETTINGS (Picture 5) */}
      {activeTab === "settings" && (
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#192024", marginBottom: "1.25rem" }}>
            Settings
          </h2>

          <div className="gusto-settings-box">
            <form onSubmit={handleSaveSettings}>
              <div className="gusto-form-group">
                <label className="gusto-form-label" style={{ marginBottom: "0.6rem" }}>
                  Current timezone
                </label>
                <select
                  className="gusto-select"
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                >
                  {timezonesList.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {timezoneSaved && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#16a34a", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: 500 }}>
                  <Check className="w-4 h-4" /> Timezone preference updated successfully!
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "2rem" }}>
                <button
                  type="button"
                  className="gusto-btn-secondary"
                  onClick={() => setActiveTab("hours")}
                >
                  Cancel
                </button>
                <button type="submit" className="gusto-btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Shift Modal */}
      <AddShiftModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        staffName={staffName}
        selectedDay={activeDay}
        initialData={editingShift}
        onSave={handleSaveShift}
      />
    </div>
  );
};

export default GustoTimeTrackingPage;
