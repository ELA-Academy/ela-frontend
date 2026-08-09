import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import { ChevronLeft, ChevronRight, Calendar } from "react-bootstrap-icons";
import { addDays, subDays } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

const ProcareDatePicker = ({ selected, onChange, placeholderText = "Select Date" }) => {
  const handlePrev = (e) => {
    e.stopPropagation();
    const current = selected ? new Date(selected) : new Date();
    onChange(subDays(current, 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const current = selected ? new Date(selected) : new Date();
    onChange(addDays(current, 1));
  };

  // Custom Input for React Datepicker to replace the default textbox
  const CustomInput = forwardRef(({ value, onClick }, ref) => (
    <div
      onClick={onClick}
      ref={ref}
      className="d-flex align-items-center gap-2 px-2 cursor-pointer h-100"
      style={{ minWidth: "120px", cursor: "pointer", userSelect: "none" }}
    >
      <span style={{ fontSize: "12px", color: value ? "#0f172a" : "#94a3b8", fontWeight: "600" }}>
        {value || placeholderText}
      </span>
      <Calendar size={14} className="text-slate-500 ms-auto" />
    </div>
  ));

  const dateValue = selected ? new Date(selected) : null;

  return (
    <div
      className="d-inline-flex align-items-center border rounded-3 bg-white"
      style={{ borderColor: "#cbd5e1", height: "36px", overflow: "hidden" }}
    >
      {/* Left Arrow */}
      <button
        type="button"
        onClick={handlePrev}
        className="border-0 bg-transparent px-2 d-flex align-items-center justify-content-center text-slate-500 hover-bg-slate-50 h-100"
        style={{ borderRight: "1px solid #cbd5e1" }}
      >
        <ChevronLeft size={14} />
      </button>

      {/* Datepicker Wrapper */}
      <div className="h-100 d-flex align-items-center">
        <DatePicker
          selected={dateValue}
          onChange={(date) => onChange(date)}
          customInput={<CustomInput />}
          dateFormat="MMM d, yyyy"
        />
      </div>

      {/* Right Arrow */}
      <button
        type="button"
        onClick={handleNext}
        className="border-0 bg-transparent px-2 d-flex align-items-center justify-content-center text-slate-500 hover-bg-slate-50 h-100"
        style={{ borderLeft: "1px solid #cbd5e1" }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

export default ProcareDatePicker;
