import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AddShiftModal from "../../components/timetracking/AddShiftModal";
import "../../styles/GustoTheme.css";

const GustoHomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState("");
  const [greeting, setGreeting] = useState("Good afternoon");
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTimestamp, setClockInTimestamp] = useState(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const staffName = user?.name || "Team Member";
  const firstName = staffName.split(" ")[0];

  // Update clock & dynamic greeting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      if (hours < 12) setGreeting("Good morning");
      else if (hours < 18) setGreeting("Good afternoon");
      else setGreeting("Good evening");

      let formattedHours = hours % 12 || 12;
      const formattedMins = String(now.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "pm" : "am";
      setCurrentTime(`${formattedHours}:${formattedMins}${ampm}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live timer when clocked in
  useEffect(() => {
    let interval = null;
    if (isClockedIn && clockInTimestamp) {
      interval = setInterval(() => {
        const diffMs = Date.now() - clockInTimestamp;
        setElapsedMinutes(Math.floor(diffMs / 60000));
      }, 1000);
    } else {
      setElapsedMinutes(0);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTimestamp]);

  const handleToggleClock = () => {
    if (!isClockedIn) {
      setIsClockedIn(true);
      setClockInTimestamp(Date.now());
    } else {
      setIsClockedIn(false);
      setClockInTimestamp(null);
    }
  };

  const formatElapsed = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="gusto-page-header">
        <h1 className="gusto-page-title">{greeting}, {firstName}</h1>
        <p className="gusto-page-subtitle">Here's what's going on with your team at ELA Academy.</p>
      </div>

      {/* Main Home Grid */}
      <div className="gusto-home-grid">
        {/* Left Card: Tasks */}
        <div className="gusto-card">
          <div className="gusto-card-title">Tasks</div>
          <div className="gusto-empty-tasks">
            <div className="gusto-empty-mug" role="img" aria-label="Coffee Mug">
              ☕
            </div>
            <h3 className="gusto-empty-heading">Nothing to see here</h3>
            <p className="gusto-empty-subtext">
              You finished all your tasks. Time to kick back and grab a cup?
            </p>
          </div>
        </div>

        {/* Right Card: Time tracking */}
        <div className="gusto-clock-card">
          <div className="gusto-clock-topbar">
            <span>Oh hey there, {firstName}</span>
            <span className="gusto-clock-time">{currentTime}</span>
          </div>

          <div className="gusto-clock-center">
            <div className="gusto-wave-hand">👋</div>
            <h2 className="gusto-clock-status">
              {isClockedIn ? "You're on the clock." : "You're off the clock."}
            </h2>

            <button
              onClick={handleToggleClock}
              className={`gusto-btn-clock ${isClockedIn ? "clocked-in" : ""}`}
            >
              {isClockedIn ? `Clock out (${formatElapsed(elapsedMinutes)})` : "Clock in"}
            </button>
          </div>

          {/* Stats Breakdown */}
          <div className="gusto-clock-stats">
            <div className="gusto-stat-block">
              <div className="gusto-stat-val">
                {isClockedIn ? formatElapsed(elapsedMinutes) : "—"}
              </div>
              <div className="gusto-stat-lbl">Today</div>
            </div>
            <div className="gusto-stat-block">
              <div className="gusto-stat-val">7h 30m</div>
              <div className="gusto-stat-lbl">This week</div>
            </div>
          </div>

          {/* Footer Navigation Links */}
          <div className="gusto-clock-links">
            <button
              type="button"
              className="gusto-link-btn"
              onClick={() => setIsShiftModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> Add hours
            </button>
            <Link to="/time-tracking/hours" className="gusto-link-btn">
              View pay period
            </Link>
          </div>
        </div>
      </div>

      {/* Add Shift Drawer */}
      <AddShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        staffName={staffName}
        onSave={(data) => {
          // Modal callback hook
        }}
      />
    </div>
  );
};

export default GustoHomePage;
