import React, { useState } from "react";
import { Plus, ChevronDown, Clock, Check, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AddShiftModal from "../../components/timetracking/AddShiftModal";
import "../../styles/GustoTheme.css";

const GustoTimeTrackingPage = () => {
  const { user } = useAuth();
  const staffName = user?.name || "Team Member";

  const [activeTab, setActiveTab] = useState("hours"); // "hours" | "settings"
  const [selectedTimezone, setSelectedTimezone] = useState("Eastern Time (US & Canada) (EDT, GMT-4)");
  const [timezoneSaved, setTimezoneSaved] = useState(false);

  // Selected week key
  const [selectedWeek, setSelectedWeek] = useState("in_progress");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [activeDay, setActiveDay] = useState(null);

  // Weekly options matching Gusto Image 1
  const weekOptions = [
    { id: "in_progress", label: "Oct 4 – Oct 10, 2026 (In Progress)", isCurrent: true, total: "11h" },
    { id: "sep27", label: "Sep 27 – Oct 3, 2026", isCurrent: false, total: "35h" },
    { id: "sep20", label: "Sep 20 – Sep 26, 2026", isCurrent: false, total: "30h" },
    { id: "sep13", label: "Sep 13 – Sep 19, 2026", isCurrent: false, total: "32h 30m" },
    { id: "sep6", label: "Sep 6 – Sep 12, 2026", isCurrent: false, total: "28h" },
    { id: "aug30", label: "Aug 30 – Sep 5, 2026", isCurrent: false, total: "30h" },
    { id: "aug23", label: "Aug 23 – Aug 29, 2026", isCurrent: false, total: "34h" },
    { id: "aug16", label: "Aug 16 – Aug 22, 2026", isCurrent: false, total: "30h" },
    { id: "aug9", label: "Aug 9 – Aug 15, 2026", isCurrent: false, total: "31h 15m" },
    { id: "aug2", label: "Aug 2 – Aug 8, 2026", isCurrent: false, total: "30h" },
    { id: "jul26", label: "Jul 26 – Aug 1, 2026", isCurrent: false, total: "35h" },
    { id: "jul19", label: "Jul 19 – Jul 25, 2026", isCurrent: false, total: "30h" },
    { id: "jul12", label: "Jul 12 – Jul 18, 2026", isCurrent: false, total: "30h" },
    { id: "jul5", label: "Jul 5 – Jul 11, 2026", isCurrent: false, total: "25h" },
    { id: "jun28", label: "Jun 28 – Jul 4, 2026", isCurrent: false, total: "30h" }
  ];

  // Current editable week schedule (Image 4)
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState([
    { id: "sun", dayName: "Sun, Oct 4", shifts: [], hours: "", isFuture: false },
    {
      id: "mon",
      dayName: "Mon, Oct 5",
      shifts: [
        { id: 1, startTime: "08:30", endTime: "12:00", label: "8:30am – 12:00pm", note: "" },
        { id: 2, startTime: "13:00", endTime: "17:00", label: "1:00pm – 5:00pm", note: "" }
      ],
      hours: "7h 30m",
      isFuture: false
    },
    {
      id: "tue",
      dayName: "Tue, Oct 6",
      shifts: [
        { id: 3, startTime: "08:30", endTime: "12:00", label: "8:30am – 12:00pm", note: "" }
      ],
      hours: "3h 30m",
      isFuture: false
    },
    { id: "wed", dayName: "Wed, Oct 7", shifts: [], hours: "", isFuture: true },
    { id: "thu", dayName: "Thu, Oct 8", shifts: [], hours: "", isFuture: true },
    { id: "fri", dayName: "Fri, Oct 9", shifts: [], hours: "", isFuture: true },
    { id: "sat", dayName: "Sat, Oct 10", shifts: [], hours: "", isFuture: true }
  ]);

  // Past synced week schedule (Images 2 & 3)
  const syncedWeekSchedule = [
    {
      id: "sun20",
      dayName: "Sun, Sep 20",
      syncedNote: "Hours from this day have been synced.",
      shifts: [],
      hours: ""
    },
    {
      id: "mon21",
      dayName: "Mon, Sep 21",
      shifts: [
        { id: 101, label: "8:30am – 12:00pm", note: "" },
        { id: 102, label: "1:00pm – 5:00pm", note: "" },
        { id: 103, label: "8:30pm – 9:30pm", note: `"Open house meeting" – ${staffName}` }
      ],
      hours: "8h 30m"
    },
    {
      id: "tue22",
      dayName: "Tue, Sep 22",
      shifts: [
        { id: 104, label: "8:30am – 12:00pm", note: "" },
        { id: 105, label: "1:00pm – 4:00pm", note: "" }
      ],
      hours: "6h 30m"
    },
    {
      id: "wed23",
      dayName: "Wed, Sep 23",
      shifts: [
        { id: 106, label: "8:30am – 12:00pm", note: "" },
        { id: 107, label: "1:00pm – 5:00pm", note: "" }
      ],
      hours: "7h 30m"
    },
    {
      id: "thu24",
      dayName: "Thu, Sep 24",
      shifts: [
        { id: 108, label: "8:30am – 12:00pm", note: "" }
      ],
      hours: "7h 30m"
    },
    {
      id: "fri25",
      dayName: "Fri, Sep 25",
      shifts: [],
      hours: ""
    },
    {
      id: "sat26",
      dayName: "Sat, Sep 26",
      shifts: [],
      hours: ""
    }
  ];

  const currentSelectedWeekObj = weekOptions.find((w) => w.id === selectedWeek) || weekOptions[0];
  const isCurrentWeek = currentSelectedWeekObj.isCurrent;

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
    const formatTimeLabel = (timeStr) => {
      if (!timeStr) return "";
      const [h, m] = timeStr.split(":").map(Number);
      const ampm = h >= 12 ? "pm" : "am";
      const formattedH = h % 12 || 12;
      return `${formattedH}:${String(m).padStart(2, "0")}${ampm}`;
    };

    const label = `${formatTimeLabel(newShiftData.startTime)} – ${formatTimeLabel(newShiftData.endTime)}`;

    setCurrentWeekSchedule((prev) =>
      prev.map((d) => {
        if (d.dayName === activeDay) {
          let updatedShifts;
          if (editingShift) {
            updatedShifts = d.shifts.map((s) =>
              s.id === editingShift.id
                ? {
                    ...s,
                    startTime: newShiftData.startTime,
                    endTime: newShiftData.endTime,
                    label,
                    note: newShiftData.notes
                  }
                : s
            );
          } else {
            updatedShifts = [
              ...d.shifts,
              {
                id: Date.now(),
                startTime: newShiftData.startTime,
                endTime: newShiftData.endTime,
                label,
                note: newShiftData.notes
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

  // Comprehensive global timezones list
  const expandedTimezonesList = [
    // US & Canada
    "Eastern Time (US & Canada) (EDT, GMT-4)",
    "Central Time (US & Canada) (CDT, GMT-5)",
    "Mountain Time (US & Canada) (MDT, GMT-6)",
    "Arizona (MST, GMT-7)",
    "Pacific Time (US & Canada) (PDT, GMT-7)",
    "Alaska (AKDT, GMT-8)",
    "Hawaii (HST, GMT-10)",
    "Indiana (East) (EDT, GMT-4)",
    "Newfoundland (NDT, GMT-2:30)",
    "Atlantic Time (Canada) (ADT, GMT-3)",
    // Latin America
    "Mexico City (CST, GMT-6)",
    "Central America (GMT-6)",
    "Bogota, Lima, Quito (GMT-5)",
    "Caracas (VET, GMT-4)",
    "Santiago (CLST, GMT-3)",
    "Buenos Aires, Georgetown (GMT-3)",
    "Brasilia (BRT, GMT-3)",
    // Europe
    "London, Edinburgh, Dublin (GMT / BST)",
    "Greenwich Mean Time (UTC / GMT)",
    "Amsterdam, Berlin, Rome, Paris, Madrid (CET / CEST, GMT+1/2)",
    "Athens, Bucharest, Istanbul, Helsinki (EET / EEST, GMT+2/3)",
    "Moscow, St. Petersburg, Volgograd (MSK, GMT+3)",
    // Middle East & Africa
    "Cairo (EEST, GMT+3)",
    "Kuwait, Riyadh, Baghdad (AST, GMT+3)",
    "Abu Dhabi, Muscat, Dubai (GST, GMT+4)",
    "West Central Africa (WAT, GMT+1)",
    "South Africa Standard Time (SAST, GMT+2)",
    "Nairobi, East Africa (EAT, GMT+3)",
    // Asia & Pacific
    "Islamabad, Karachi (PKT, GMT+5)",
    "Mumbai, New Delhi, Kolkata, Chennai (IST, GMT+5:30)",
    "Dhaka (BST, GMT+6)",
    "Bangkok, Hanoi, Jakarta (ICT, GMT+7)",
    "Beijing, Shanghai, Hong Kong, Singapore (CST / SGT, GMT+8)",
    "Perth, Western Australia (AWST, GMT+8)",
    "Tokyo, Osaka, Seoul (JST / KST, GMT+9)",
    "Adelaide, Darwin (ACST, GMT+9:30)",
    "Sydney, Melbourne, Brisbane (AEST / AEDT, GMT+10/11)",
    "Auckland, Wellington (NZST / NZDT, GMT+12/13)",
    "American Samoa (SST, GMT-11)"
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

      {/* TAB 1: MY HOURS */}
      {activeTab === "hours" && (
        <div>
          {/* Week Selector Dropdown (Image 1) */}
          <div className="gusto-week-select-container">
            <div className="gusto-week-label">Week</div>
            <select
              className="gusto-week-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              {weekOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Synced Week Banner for Past Weeks (Image 2) */}
          {!isCurrentWeek && (
            <div className="gusto-sync-banner">
              <Info className="gusto-sync-banner-icon" />
              <div>
                <div className="gusto-sync-banner-title">
                  Some of your hours have already been synced and can't be edited
                </div>
                <p className="gusto-sync-banner-sub">
                  If you need to make changes, contact your admin.
                </p>
              </div>
            </div>
          )}

          {/* Total Box */}
          <div className="gusto-total-card">
            <div className="gusto-total-label">Total</div>
            <div className="gusto-total-number">{currentSelectedWeekObj.total}</div>
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
              {/* CURRENT WEEK (Active / Editable) */}
              {isCurrentWeek ? (
                currentWeekSchedule.map((row) => (
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
                              <div className="gusto-shift-pill-header">
                                <span>{shift.label}</span>
                                <button
                                  type="button"
                                  className="gusto-shift-edit-btn"
                                  onClick={() => handleOpenEditShift(row, shift)}
                                >
                                  Edit
                                </button>
                              </div>
                              {shift.note && (
                                <div className="gusto-shift-note-line">
                                  "{shift.note}"
                                </div>
                              )}
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
                ))
              ) : (
                /* PAST SYNCED WEEK (Images 2 & 3: Locked with notes & sync messages) */
                syncedWeekSchedule.map((row) => (
                  <tr key={row.id} className="gusto-schedule-row">
                    <td className="gusto-day-col">{row.dayName}</td>
                    <td>
                      {row.syncedNote ? (
                        <div className="gusto-synced-day-text">{row.syncedNote}</div>
                      ) : (
                        <div className="gusto-shifts-col">
                          {row.shifts.map((shift) => (
                            <div key={shift.id} className="gusto-shift-pill" style={{ maxWidth: "380px" }}>
                              <div className="gusto-shift-pill-header">
                                <span>{shift.label}</span>
                              </div>
                              {shift.note && (
                                <div className="gusto-shift-note-line">
                                  {shift.note}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="gusto-hours-col">{row.hours}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: SETTINGS */}
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
                  {expandedTimezonesList.map((tz) => (
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
