import React, { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import "../../styles/GustoTheme.css";

const AddShiftModal = ({ isOpen, onClose, staffName, onSave, initialData, selectedDay }) => {
  const [startTime, setStartTime] = useState(initialData?.startTime || "08:30");
  const [endTime, setEndTime] = useState(initialData?.endTime || "12:00");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [totalHours, setTotalHours] = useState("--");

  useEffect(() => {
    if (initialData) {
      setStartTime(initialData.startTime || "08:30");
      setEndTime(initialData.endTime || "12:00");
      setNotes(initialData.notes || "");
    } else {
      setStartTime("08:30");
      setEndTime("12:00");
      setNotes("");
    }
  }, [initialData, isOpen]);

  // Compute shift duration
  useEffect(() => {
    if (!startTime || !endTime) {
      setTotalHours("--");
      return;
    }
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    if (isNaN(startH) || isNaN(endH)) {
      setTotalHours("--");
      return;
    }

    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // overnight handling
    const hours = (diffMinutes / 60).toFixed(1);
    setTotalHours(hours.endsWith(".0") ? hours.slice(0, -2) : hours);
  }, [startTime, endTime]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        startTime,
        endTime,
        notes,
        totalHours,
        day: selectedDay
      });
    }
    onClose();
  };

  return (
    <div className="gusto-drawer-overlay" onClick={onClose}>
      <div className="gusto-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="gusto-drawer-header">
          <h2 className="gusto-drawer-title">
            {initialData ? "Edit shift for" : "Add shift for"} {staffName || "Staff"}
          </h2>
          <button className="gusto-drawer-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {selectedDay && (
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem", fontWeight: 500 }}>
              Shift for <strong style={{ color: "#0f172a" }}>{selectedDay}</strong>
            </div>
          )}

          {/* Start Time */}
          <div className="gusto-form-group">
            <label className="gusto-form-label">Start time</label>
            <div className="gusto-input-with-icon">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Clock className="input-icon w-4 h-4" />
            </div>
          </div>

          {/* End Time */}
          <div className="gusto-form-group">
            <label className="gusto-form-label">End time</label>
            <div className="gusto-input-with-icon">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              <Clock className="input-icon w-4 h-4" />
            </div>
          </div>

          {/* Total Duration */}
          <div className="gusto-calculated-total">
            Total: {totalHours} hrs
          </div>

          {/* Notes Section */}
          <div className="gusto-section-subtitle">Other shift details</div>
          <div className="gusto-form-group">
            <label className="gusto-form-label">Notes</label>
            <textarea
              className="gusto-textarea"
              placeholder="e.g. Covered morning classroom duty or lesson prep"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Drawer Footer Actions */}
          <div className="gusto-drawer-footer">
            <button type="button" className="gusto-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="gusto-btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShiftModal;
