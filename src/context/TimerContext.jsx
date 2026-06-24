import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import api from "../utils/api";

const TimerContext = createContext(null);

export const useTimer = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
  const [activeTimer, setActiveTimer] = useState(null); // { task, elapsedSeconds, isRunning, description, isBillable }
  const [showLogModal, setShowLogModal] = useState(false);
  const [modalTask, setModalTask] = useState(null);
  
  const timerIntervalRef = useRef(null);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedTaskId = localStorage.getItem("timer_task_id");
    const savedTaskTitle = localStorage.getItem("timer_task_title");
    const savedStartTime = localStorage.getItem("timer_start_time");
    const savedIsRunning = localStorage.getItem("timer_is_running") === "true";
    const savedAccumulated = parseInt(localStorage.getItem("timer_accumulated_seconds") || "0", 10);
    const savedDescription = localStorage.getItem("timer_description") || "";
    const savedIsBillable = localStorage.getItem("timer_is_billable") === "true";

    if (savedTaskId && savedStartTime) {
      const task = { id: parseInt(savedTaskId, 10), title: savedTaskTitle };
      let elapsed = savedAccumulated;

      if (savedIsRunning) {
        const start = new Date(savedStartTime).getTime();
        const now = Date.now();
        elapsed += Math.floor((now - start) / 1000);
      }

      setActiveTimer({
        task,
        startTime: savedStartTime,
        elapsedSeconds: elapsed,
        isRunning: savedIsRunning,
        description: savedDescription,
        isBillable: savedIsBillable,
      });
    }
  }, []);

  // Update timer seconds in interval
  useEffect(() => {
    if (activeTimer && activeTimer.isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev || !prev.isRunning) return prev;
          return {
            ...prev,
            elapsedSeconds: prev.elapsedSeconds + 1,
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeTimer?.isRunning]);

  const startTimer = (task) => {
    // If there's an existing active timer running, prompt or stop it first
    if (activeTimer && activeTimer.task.id !== task.id) {
      // Auto-stop previous timer and save it, or just cancel it? Let's save it!
      stopTimerDirect(true); 
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem("timer_task_id", task.id);
    localStorage.setItem("timer_task_title", task.title);
    localStorage.setItem("timer_start_time", nowIso);
    localStorage.setItem("timer_is_running", "true");
    localStorage.setItem("timer_accumulated_seconds", "0");
    localStorage.setItem("timer_description", "");
    localStorage.setItem("timer_is_billable", "false");

    setActiveTimer({
      task,
      startTime: nowIso,
      elapsedSeconds: 0,
      isRunning: true,
      description: "",
      isBillable: false,
    });
  };

  const pauseTimer = () => {
    if (!activeTimer || !activeTimer.isRunning) return;

    const start = new Date(activeTimer.startTime).getTime();
    const now = Date.now();
    const currentRunSeconds = Math.floor((now - start) / 1000);
    const totalAccumulated = activeTimer.elapsedSeconds;

    localStorage.setItem("timer_is_running", "false");
    localStorage.setItem("timer_accumulated_seconds", totalAccumulated.toString());

    setActiveTimer((prev) => ({
      ...prev,
      isRunning: false,
    }));
  };

  const resumeTimer = () => {
    if (!activeTimer || activeTimer.isRunning) return;

    const nowIso = new Date().toISOString();
    localStorage.setItem("timer_start_time", nowIso);
    localStorage.setItem("timer_is_running", "true");

    setActiveTimer((prev) => ({
      ...prev,
      startTime: nowIso,
      isRunning: true,
    }));
  };

  const cancelTimer = () => {
    localStorage.removeItem("timer_task_id");
    localStorage.removeItem("timer_task_title");
    localStorage.removeItem("timer_start_time");
    localStorage.removeItem("timer_is_running");
    localStorage.removeItem("timer_accumulated_seconds");
    localStorage.removeItem("timer_description");
    localStorage.removeItem("timer_is_billable");
    setActiveTimer(null);
  };

  const stopTimer = () => {
    if (!activeTimer) return;
    // Open the manual log detail modal before sending to backend to allow adding comments & billable flag
    setModalTask(activeTimer.task);
    setShowLogModal(true);
    pauseTimer();
  };

  const stopTimerDirect = async (autoSave = false) => {
    if (!activeTimer) return;
    const duration = activeTimer.elapsedSeconds;
    const taskId = activeTimer.task.id;
    const desc = activeTimer.description || (autoSave ? "Auto-saved entry" : "");
    const billable = activeTimer.isBillable;

    // Remove from localStorage
    localStorage.removeItem("timer_task_id");
    localStorage.removeItem("timer_task_title");
    localStorage.removeItem("timer_start_time");
    localStorage.removeItem("timer_is_running");
    localStorage.removeItem("timer_accumulated_seconds");
    localStorage.removeItem("timer_description");
    localStorage.removeItem("timer_is_billable");

    setActiveTimer(null);

    if (duration > 0) {
      try {
        const start = new Date(Date.now() - duration * 1000).toISOString();
        await api.post(`/boards/tasks/${taskId}/time-entries`, {
          start_time: start,
          end_time: new Date().toISOString(),
          duration_seconds: duration,
          description: desc,
          is_billable: billable,
        });
      } catch (err) {
        console.error("Failed to log time entry:", err);
      }
    }
  };

  const saveLoggedTime = async (description, isBillable, manualDuration = null) => {
    const taskToLog = modalTask || activeTimer?.task;
    if (!taskToLog) return;

    let duration = activeTimer ? activeTimer.elapsedSeconds : 0;
    if (manualDuration !== null) {
      duration = manualDuration;
    }

    if (duration > 0) {
      try {
        const start = new Date(Date.now() - duration * 1000).toISOString();
        await api.post(`/boards/tasks/${taskToLog.id}/time-entries`, {
          start_time: start,
          end_time: new Date().toISOString(),
          duration_seconds: duration,
          description,
          is_billable: isBillable,
        });
      } catch (err) {
        console.error("Failed to log time entry:", err);
      }
    }

    setShowLogModal(false);
    setModalTask(null);
    cancelTimer();
  };

  const updateDescription = (desc) => {
    localStorage.setItem("timer_description", desc);
    setActiveTimer((prev) => prev ? { ...prev, description: desc } : null);
  };

  const updateBillable = (billable) => {
    localStorage.setItem("timer_is_billable", billable ? "true" : "false");
    setActiveTimer((prev) => prev ? { ...prev, isBillable: billable } : null);
  };

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        startTimer,
        stopTimer,
        pauseTimer,
        resumeTimer,
        cancelTimer,
        updateDescription,
        updateBillable,
        showLogModal,
        setShowLogModal,
        modalTask,
        saveLoggedTime,
        elapsedSeconds: activeTimer ? activeTimer.elapsedSeconds : 0,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};
