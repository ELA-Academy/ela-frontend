import React, { useState, useEffect } from "react";
import { Table as BSTable, Button, Modal, Form, Card } from "react-bootstrap";
import { Download, Plus, Trash2, Calendar, User, DollarSign, Clock, Filter } from "lucide-react";
import api from "../../../utils/api";
import { toast } from "react-toastify";

// Formats seconds to e.g. "2h 45m" or "32s"
const formatHoursMinutes = (totalSeconds) => {
  if (!totalSeconds) return "0m";
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  let str = "";
  if (hrs > 0) str += `${hrs}h `;
  if (mins > 0) str += `${mins}m `;
  if (hrs === 0 && mins === 0) str += `${secs}s`;
  return str.trim();
};

const TimesheetsView = ({ boardId, groups }) => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search
  const [filterUser, setFilterUser] = useState("all");
  const [filterBillable, setFilterBillable] = useState("all"); // 'all' | 'billable' | 'non-billable'
  const [searchQuery, setSearchQuery] = useState("");
  
  // Manual Log Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [logMinutes, setLogMinutes] = useState("");
  const [logBillable, setLogBillable] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);

  // Flatten all tasks in the board
  const allTasks = groups ? groups.flatMap(g => g.tasks || []) : [];

  const fetchTimeEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/board-extensions/boards/${boardId}/time-entries`);
      setTimeEntries(res.data);
    } catch (err) {
      console.error("Failed to load time entries", err);
      toast.error("Failed to fetch timesheet records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, [boardId]);

  // Handle Delete Entry
  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this time log?")) return;
    try {
      await api.delete(`/boards/time-entries/${entryId}`);
      toast.success("Time log deleted successfully.");
      fetchTimeEntries();
    } catch (err) {
      console.error("Failed to delete entry", err);
      toast.error("Failed to delete time log.");
    }
  };

  // Handle Manual Log Submission
  const handleManualLog = async (e) => {
    e.preventDefault();
    if (!selectedTaskId) {
      toast.warn("Please select a task.");
      return;
    }
    if (!logMinutes || parseInt(logMinutes, 10) <= 0) {
      toast.warn("Please enter a valid duration.");
      return;
    }

    const durationSeconds = parseInt(logMinutes, 10) * 60;
    // Calculate start time based on selected date
    const start = new Date(logDate);
    const end = new Date(start.getTime() + durationSeconds * 1000);

    try {
      await api.post(`/boards/tasks/${selectedTaskId}/time-entries`, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_seconds: durationSeconds,
        description: logDescription,
        is_billable: logBillable
      });

      toast.success("Time log added manually.");
      setShowLogModal(false);
      
      // Reset form
      setSelectedTaskId("");
      setLogDescription("");
      setLogMinutes("");
      setLogBillable(false);
      setLogDate(new Date().toISOString().split("T")[0]);

      fetchTimeEntries();
    } catch (err) {
      console.error("Failed to log manual time", err);
      toast.error("Failed to create manual time log.");
    }
  };

  // Unique list of users who have logged time
  const loggedUsers = [...new Set(timeEntries.map(e => e.user_name))];

  // Filtering Logic
  const filteredEntries = timeEntries.filter((entry) => {
    if (filterUser !== "all" && entry.user_name !== filterUser) return false;
    
    if (filterBillable === "billable" && !entry.is_billable) return false;
    if (filterBillable === "non-billable" && entry.is_billable) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTask = entry.task_title?.toLowerCase().includes(q);
      const matchComment = entry.description?.toLowerCase().includes(q);
      if (!matchTask && !matchComment) return false;
    }
    
    return true;
  });

  // Aggregated Stats
  const totalSeconds = filteredEntries.reduce((sum, e) => sum + (e.duration_seconds || 0), 0);
  const billableSeconds = filteredEntries.reduce((sum, e) => sum + (e.is_billable ? (e.duration_seconds || 0) : 0), 0);
  const billablePercentage = totalSeconds > 0 ? ((billableSeconds / totalSeconds) * 100).toFixed(1) : "0.0";

  // CSV Export Helper
  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      toast.warn("No time entries to export.");
      return;
    }
    const headers = ["Date", "User", "Role", "Task Title", "Comment", "Billable", "Duration (Seconds)", "Duration (Readable)"];
    const rows = filteredEntries.map((e) => [
      new Date(e.start_time).toLocaleDateString(),
      e.user_name,
      e.user_role,
      e.task_title || "Unknown Task",
      e.description || "",
      e.is_billable ? "Yes" : "No",
      e.duration_seconds,
      formatHoursMinutes(e.duration_seconds)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timesheet_board_${boardId}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Overview Aggregated Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-slate-50/50 rounded-2xl p-4 flex flex-row items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Logged Time</div>
            <div className="text-xl font-bold text-slate-900 font-mono">{formatHoursMinutes(totalSeconds)}</div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm bg-slate-50/50 rounded-2xl p-4 flex flex-row items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Billable Time</div>
            <div className="text-xl font-bold text-slate-900 font-mono">{formatHoursMinutes(billableSeconds)}</div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm bg-slate-50/50 rounded-2xl p-4 flex flex-row items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Billable Percentage</div>
            <div className="text-xl font-bold text-slate-900 font-mono">{billablePercentage}%</div>
          </div>
        </Card>
      </div>

      {/* Control Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">User:</span>
            <Form.Select 
              value={filterUser} 
              onChange={(e) => setFilterUser(e.target.value)} 
              className="text-xs bg-slate-50 border-0 rounded-xl py-1.5 px-3 focus:ring-0 focus:outline-none"
              style={{ width: "140px" }}
            >
              <option value="all">All Users</option>
              {loggedUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Form.Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Billable:</span>
            <Form.Select 
              value={filterBillable} 
              onChange={(e) => setFilterBillable(e.target.value)} 
              className="text-xs bg-slate-50 border-0 rounded-xl py-1.5 px-3 focus:ring-0 focus:outline-none"
              style={{ width: "130px" }}
            >
              <option value="all">All Entries</option>
              <option value="billable">Billable</option>
              <option value="non-billable">Non-Billable</option>
            </Form.Select>
          </div>

          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-slate-50 border-0 rounded-xl py-1.5 px-3 focus:ring-0 focus:outline-none"
            style={{ width: "180px" }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="light" 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-colors border-0 bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button 
            onClick={() => setShowLogModal(true)}
            className="bg-slate-950 hover:bg-slate-900 border-0 text-white flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Time</span>
          </Button>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading time entries...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No time tracking logs match filters.</div>
        ) : (
          <BSTable responsive className="m-0 border-0 align-middle">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Date</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Member</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Task</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Comment</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3 text-center">Billable</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3 text-right">Duration</th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-800 font-medium">
                    {new Date(entry.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-850">{entry.user_name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mt-0.5">{entry.user_role}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 font-semibold max-w-[200px] truncate">
                    {entry.task_title}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 italic max-w-[240px] truncate">
                    {entry.description || <span className="text-slate-300">No comment</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.is_billable ? (
                      <span className="inline-block bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">Yes</span>
                    ) : (
                      <span className="inline-block bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono font-bold text-slate-900">
                    {formatHoursMinutes(entry.duration_seconds)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </BSTable>
        )}
      </div>

      {/* Manual Time Logging Modal */}
      <Modal show={showLogModal} onHide={() => setShowLogModal(false)} centered className="border-0">
        <Form onSubmit={handleManualLog}>
          <Modal.Header closeButton className="border-b border-slate-100 p-6 bg-slate-50/50">
            <Modal.Title className="font-bold text-base text-slate-950 flex items-center gap-2">
              <Plus className="w-5 h-5 text-slate-750" />
              <span>Log Manual Time</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6">
            <div className="flex flex-col gap-4">
              
              {/* Task Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Select Task
                </label>
                <Form.Select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all duration-200"
                  required
                >
                  <option value="">-- Choose Task --</option>
                  {allTasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </Form.Select>
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all duration-200"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  required
                />
              </div>

              {/* Duration in Minutes */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 60"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all duration-200"
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(e.target.value)}
                  min="1"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Work Done / Comment
                </label>
                <textarea
                  placeholder="What did you work on?"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all duration-200 resize-none"
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                />
              </div>

              {/* Billable */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800">Billable</span>
                  <span className="text-[10px] text-slate-400">Mark this entry as billable</span>
                </div>
                <Form.Check
                  type="checkbox"
                  checked={logBillable}
                  onChange={(e) => setLogBillable(e.target.checked)}
                  className="m-0 cursor-pointer"
                />
              </div>

            </div>
          </Modal.Body>
          <Modal.Footer className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-end gap-2">
            <Button
              variant="light"
              onClick={() => setShowLogModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors border-0"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-slate-950 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border-0"
            >
              Save time log
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default TimesheetsView;
