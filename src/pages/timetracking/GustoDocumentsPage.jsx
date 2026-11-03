import React from "react";
import { FileText, Download } from "lucide-react";
import "../../styles/GustoTheme.css";

const GustoDocumentsPage = () => {
  return (
    <div>
      <div className="gusto-page-header">
        <h1 className="gusto-page-title">Documents</h1>
        <p className="gusto-page-subtitle">W-2 forms, contracts, handbooks, and signed agreements.</p>
      </div>

      <div className="gusto-card">
        <div className="gusto-card-title">Tax and employment forms</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
          {[
            { title: "2025 Form W-2 (Wage and Tax Statement)", date: "Uploaded Jan 15, 2026" },
            { title: "Staff Handbook & Code of Conduct 2026-2027", date: "Signed Aug 20, 2026" },
            { title: "Direct Deposit Authorization Form", date: "Verified Aug 20, 2026" },
            { title: "Form W-4 (Employee Withholding Certificate)", date: "Verified Aug 20, 2026" }
          ].map((doc, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.85rem 1rem",
                border: "1px solid #e6e8eb",
                borderRadius: "8px",
                backgroundColor: "#ffffff"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#192024" }}>{doc.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{doc.date}</div>
                </div>
              </div>
              <button className="gusto-shift-edit-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GustoDocumentsPage;
