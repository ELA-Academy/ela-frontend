import React, { useState } from "react";
import {
  Search,
  MoreVertical,
  ChevronDown,
  ArrowUpDown,
  Download,
  X,
  FileText,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import "../../styles/GustoTheme.css";

const GustoPayPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStub, setSelectedStub] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Exact dataset from Gusto Image 5
  const payRecords = [
    { id: 1, payday: "Oct 2, 2026", method: "Direct deposit", status: "Complete", total: "$1,140.00", hours: "60h", gross: "$1,350.00", deductions: "$210.00" },
    { id: 2, payday: "Sep 18, 2026", method: "Direct deposit", status: "Complete", total: "$570.00", hours: "30h", gross: "$675.00", deductions: "$105.00" },
    { id: 3, payday: "Sep 4, 2026", method: "Direct deposit", status: "Complete", total: "$670.00", hours: "35h", gross: "$790.00", deductions: "$120.00" },
    { id: 4, payday: "Aug 21, 2026", method: "Direct deposit", status: "Complete", total: "$544.38", hours: "28.5h", gross: "$645.00", deductions: "$100.62" },
    { id: 5, payday: "Aug 7, 2026", method: "Direct deposit", status: "Complete", total: "$552.75", hours: "29h", gross: "$655.00", deductions: "$102.25" },
    { id: 6, payday: "Jul 24, 2026", method: "Direct deposit", status: "Complete", total: "$653.25", hours: "34h", gross: "$770.00", deductions: "$116.75" },
    { id: 7, payday: "Jul 10, 2026", method: "Direct deposit", status: "Complete", total: "$670.00", hours: "35h", gross: "$790.00", deductions: "$120.00" },
    { id: 8, payday: "Jun 26, 2026", method: "Direct deposit", status: "Complete", total: "$695.13", hours: "36.5h", gross: "$820.00", deductions: "$124.87" },
    { id: 9, payday: "Jun 12, 2026", method: "Direct deposit", status: "Complete", total: "$318.25", hours: "16.5h", gross: "$375.00", deductions: "$56.75" },
    { id: 10, payday: "May 29, 2026", method: "Direct deposit", status: "Complete", total: "$670.00", hours: "35h", gross: "$790.00", deductions: "$120.00" },
    { id: 11, payday: "May 15, 2026", method: "Direct deposit", status: "Complete", total: "$661.63", hours: "34.5h", gross: "$780.00", deductions: "$118.37" }
  ];

  const filteredRecords = payRecords.filter((rec) => {
    const q = searchQuery.toLowerCase();
    return (
      rec.payday.toLowerCase().includes(q) ||
      rec.total.toLowerCase().includes(q) ||
      rec.method.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Title */}
      <div className="gusto-page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="gusto-page-title">Pay</h1>
      </div>

      {/* Search & Actions Bar (Image 5) */}
      <div className="gusto-pay-search-bar">
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search className="w-4 h-4 text-slate-400" style={{ position: "absolute", left: "0.85rem", pointerEvents: "none" }} />
          <input
            type="text"
            className="gusto-pay-search-input"
            placeholder="Search Payments"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button type="button" className="gusto-columns-btn">
          Columns
        </button>
      </div>

      {/* Pay Table (Image 5) */}
      <table className="gusto-pay-table">
        <thead>
          <tr>
            <th style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>Payday</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>Payment method</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>Status</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>Total</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th style={{ width: "60px", textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((item) => (
            <tr key={item.id}>
              <td>
                <span
                  className="gusto-payday-link"
                  onClick={() => setSelectedStub(item)}
                >
                  {item.payday}
                </span>
              </td>
              <td>{item.method}</td>
              <td>
                <span className="gusto-status-complete">
                  <span className="gusto-status-dot" />
                  <span>{item.status}</span>
                </span>
              </td>
              <td style={{ fontWeight: 600 }}>{item.total}</td>
              <td style={{ textAlign: "right", position: "relative" }}>
                <button
                  className="gusto-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === item.id ? null : item.id);
                  }}
                >
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>

                {activeMenuId === item.id && (
                  <div
                    style={{
                      position: "absolute",
                      right: "1.5rem",
                      top: "2.5rem",
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                      border: "1px solid #e2e8f0",
                      zIndex: 50,
                      width: "160px",
                      textAlign: "left",
                      padding: "0.35rem 0"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setSelectedStub(item);
                        setActiveMenuId(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "0.5rem 1rem",
                        fontSize: "0.85rem",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        color: "#0f172a"
                      }}
                    >
                      View pay stub
                    </button>
                    <button
                      onClick={() => {
                        alert(`Downloading pay stub PDF for ${item.payday}...`);
                        setActiveMenuId(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "0.5rem 1rem",
                        fontSize: "0.85rem",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        color: "#673de6"
                      }}
                    >
                      Download PDF
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Footer (Image 5) */}
      <div className="gusto-pay-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <select
            style={{
              padding: "0.35rem 0.65rem",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              fontSize: "0.85rem",
              background: "#ffffff",
              cursor: "pointer"
            }}
            defaultValue="25"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>Items per page</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="gusto-icon-btn" disabled style={{ opacity: 0.4 }}>
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button className="gusto-icon-btn" disabled style={{ opacity: 0.4 }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="gusto-icon-btn" disabled style={{ opacity: 0.4 }}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="gusto-icon-btn" disabled style={{ opacity: 0.4 }}>
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pay Stub Details Modal */}
      {selectedStub && (
        <div className="gusto-drawer-overlay" onClick={() => setSelectedStub(null)}>
          <div className="gusto-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="gusto-drawer-header">
              <h2 className="gusto-drawer-title">Pay stub: {selectedStub.payday}</h2>
              <button className="gusto-drawer-close" onClick={() => setSelectedStub(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1 }}>
              <div style={{ padding: "1.25rem", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Take-home net pay</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#16a34a", marginTop: "0.25rem" }}>
                  {selectedStub.total}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Disbursed via {selectedStub.method} on {selectedStub.payday}
                </div>
              </div>

              <div className="gusto-card" style={{ padding: "1.25rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#192024", marginBottom: "0.75rem" }}>
                  Earnings breakdown
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", padding: "0.4rem 0" }}>
                  <span style={{ color: "#64748b" }}>Total hours worked</span>
                  <span style={{ fontWeight: 600 }}>{selectedStub.hours}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", padding: "0.4rem 0" }}>
                  <span style={{ color: "#64748b" }}>Gross pay</span>
                  <span style={{ fontWeight: 600 }}>{selectedStub.gross}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", padding: "0.4rem 0" }}>
                  <span style={{ color: "#64748b" }}>Taxes & deductions</span>
                  <span style={{ fontWeight: 600, color: "#dc2626" }}>-{selectedStub.deductions}</span>
                </div>
              </div>

              <div className="gusto-drawer-footer">
                <button
                  type="button"
                  className="gusto-btn-secondary"
                  onClick={() => setSelectedStub(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="gusto-btn-primary"
                  onClick={() => alert(`Downloading PDF for ${selectedStub.payday}`)}
                >
                  <Download className="w-4 h-4 inline me-1" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GustoPayPage;
