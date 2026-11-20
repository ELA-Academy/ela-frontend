import React, { useState, useEffect } from "react";
import { Search, Download, Save, CheckCircle2, Table as TableIcon } from "lucide-react";
import { getPaymentEnumeration, updatePaymentEnumeration } from "../../../services/payrollService";
import "../../../styles/GustoTheme.css";

const PayrollEnumerationPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [dirtyIds, setDirtyIds] = useState({});
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  useEffect(() => {
    setLoading(true);
    getPaymentEnumeration()
      .then((res) => setRows(res.rows || []))
      .catch((err) => console.error("Failed to load payment enumeration:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (staffId, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.staff_id === staffId ? { ...r, [field]: value } : r))
    );
    setDirtyIds((prev) => ({ ...prev, [staffId]: true }));
  };

  const handleSaveRow = async (row) => {
    setSavingId(row.staff_id);
    try {
      await updatePaymentEnumeration(row.staff_id, {
        expected_hours: row.expected_hours,
        hourly_rate: row.hourly_rate,
        substituting_pay: row.substituting_pay,
        tutoring_pay: row.tutoring_pay,
        training_pay: row.training_pay,
        us_holiday_bonuses: row.us_holiday_bonuses,
        winter_break_bonuses: row.winter_break_bonuses,
        spring_break_bonuses: row.spring_break_bonuses
      });
      setDirtyIds((prev) => {
        const copy = { ...prev };
        delete copy[row.staff_id];
        return copy;
      });
      showToast(`Saved payment enumeration for ${row.staff_name}.`);
    } catch (err) {
      showToast("Failed to save changes.");
    } finally {
      setSavingId(null);
    }
  };

  const exportCSV = () => {
    const header = [
      "STAFF NAME",
      "EXPECTED HOURS",
      "RATE OF PAY",
      "SUBSTITUTING PAY",
      "TUTORING PAY",
      "TRAINING PAY",
      "U.S. HOLIDAY BONUSES",
      "WINTER BREAK BONUSES",
      "SPRING BREAK BONUSES"
    ].join(",");
    const body = rows
      .map((r) =>
        [
          `"${r.staff_name || ""}"`,
          `"${r.expected_hours || ""}"`,
          r.hourly_rate != null ? `"$${Number(r.hourly_rate).toFixed(2)}/hr."` : `""`,
          r.substituting_pay != null && r.substituting_pay !== "" ? `"$${Number(r.substituting_pay).toFixed(2)}/hr."` : `""`,
          r.tutoring_pay != null && r.tutoring_pay !== "" ? `"$${Number(r.tutoring_pay).toFixed(2)}/hr."` : `""`,
          r.training_pay != null && r.training_pay !== "" ? `"$${Number(r.training_pay).toFixed(2)}/hr."` : `""`,
          `"${r.us_holiday_bonuses || "0"}"`,
          `"${r.winter_break_bonuses || "0"}"`,
          `"${r.spring_break_bonuses || "0"}"`
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ELA_Payment_Enumeration.csv";
    a.click();
  };

  const filtered = rows.filter((r) =>
    (r.staff_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.department || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cellInputStyle = {
    width: "100%",
    padding: "0.32rem 0.45rem",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    fontSize: "0.82rem",
    backgroundColor: "#ffffff"
  };

  return (
    <div style={{ maxWidth: "1360px", margin: "0 auto", paddingBottom: "4rem" }}>
      {toastMsg && (
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
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <TableIcon size={24} color="#0f766e" />
            Payment Enumeration
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem", marginBottom: 0 }}>
            Staff expected hours, pay rates (regular, substituting, tutoring, training), and holiday/break bonuses.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          style={{
            backgroundColor: "#0f766e",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem"
          }}
        >
          <Download size={15} /> Export Spreadsheet (CSV)
        </button>
      </div>

      <div style={{ position: "relative", width: "320px", marginBottom: "1rem" }}>
        <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "11px", top: "10px" }} />
        <input
          type="text"
          placeholder="Search staff name or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "0.45rem 0.75rem 0.45rem 2.1rem",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "0.875rem"
          }}
        />
      </div>

      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", minWidth: "1120px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#0f172a", textTransform: "uppercase", fontSize: "0.73rem", letterSpacing: "0.03em" }}>
              <th style={{ padding: "0.75rem 0.75rem", textAlign: "left", fontWeight: 700, minWidth: "170px" }}>STAFF NAME</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: 700, width: "115px" }}>EXPECTED HOURS</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: 700, width: "105px" }}>RATE OF PAY ($/hr)</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: 700, width: "115px" }}>SUBSTITUTING PAY ($/hr)</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: 700, width: "110px" }}>TUTORING PAY ($/hr)</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: 700, width: "110px" }}>TRAINING PAY ($/hr)</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: 700, width: "130px" }}>U.S. HOLIDAY BONUSES</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: 700, width: "120px" }}>WINTER BREAK BONUSES</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: 700, width: "120px" }}>SPRING BREAK BONUSES</th>
              <th style={{ padding: "0.75rem 0.65rem", textAlign: "right", fontWeight: 700, width: "80px" }}>SAVE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading payment enumeration...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No staff found.</td></tr>
            ) : (
              filtered.map((row) => {
                const isDirty = Boolean(dirtyIds[row.staff_id]);
                return (
                  <tr key={row.staff_id} style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: isDirty ? "#f0fdfa" : "#ffffff" }}>
                    <td style={{ padding: "0.55rem 0.75rem", fontWeight: 600, color: "#111827" }}>
                      {row.staff_name}
                      {row.department && <div style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 400 }}>{row.department}</div>}
                    </td>
                    <td style={{ padding: "0.45rem 0.45rem" }}>
                      <input
                        type="text"
                        placeholder="e.g. 15 - 20"
                        value={row.expected_hours || ""}
                        onChange={(e) => handleFieldChange(row.staff_id, "expected_hours", e.target.value)}
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={{ padding: "0.45rem 0.45rem" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.hourly_rate ?? ""}
                        onChange={(e) => handleFieldChange(row.staff_id, "hourly_rate", e.target.value)}
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={{ padding: "0.45rem 0.45rem" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.substituting_pay ?? ""}
                        onChange={(e) => handleFieldChange(row.staff_id, "substituting_pay", e.target.value)}
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={{ padding: "0.45rem 0.45rem" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.tutoring_pay ?? ""}
                        onChange={(e) => handleFieldChange(row.staff_id, "tutoring_pay", e.target.value)}
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={{ padding: "0.45rem 0.45rem" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.training_pay ?? ""}
                        onChange={(e) => handleFieldChange(row.staff_id, "training_pay", e.target.value)}
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={{ padding: "0.45rem 0.45rem" }}>
                      <input
                        type="text"
                        placeholder="Eight Holidays / 0"
                        value={row.us_holiday_bonuses || ""}
                        onChange={(e) => handleFieldChange(row.staff_id, "us_holiday_bonuses", e.target.value)}
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={{ padding: "0.45rem 0.45rem" }}>
                      <input
                        type="text"
                        placeholder="1 week / 0"
                        value={row.winter_break_bonuses || ""}
                        onChange={(e) => handleFieldChange(row.staff_id, "winter_break_bonuses", e.target.value)}
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={{ padding: "0.45rem 0.45rem" }}>
                      <input
                        type="text"
                        placeholder="1 week / 0"
                        value={row.spring_break_bonuses || ""}
                        onChange={(e) => handleFieldChange(row.staff_id, "spring_break_bonuses", e.target.value)}
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={{ padding: "0.45rem 0.65rem", textAlign: "right" }}>
                      <button
                        type="button"
                        disabled={savingId === row.staff_id}
                        onClick={() => handleSaveRow(row)}
                        style={{
                          backgroundColor: isDirty ? "#0f766e" : "#f1f5f9",
                          color: isDirty ? "#ffffff" : "#475569",
                          border: "none",
                          borderRadius: "5px",
                          padding: "0.32rem 0.6rem",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        <Save size={12} />
                        {savingId === row.staff_id ? "..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollEnumerationPage;
