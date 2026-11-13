import React, { useState } from "react";
import {
  FileText,
  Download,
  X,
  Printer,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import "../../styles/GustoTheme.css";

const GustoDocumentsPage = () => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const initialDocuments = [
    {
      id: "doc-1",
      title: "Leave Request Form-2026",
      subtitle: "Employer provided document",
      status: "Signed",
      statusDate: "Jul 9, 2026",
      type: "form",
      category: "Time Off & Leave",
      description: "Annual leave and absence acknowledgment policy for fiscal school year 2026."
    },
    {
      id: "doc-2",
      title: "Alternate Authorized Payment Form",
      subtitle: "Employer provided document",
      status: "Signed",
      statusDate: "Apr 14, 2026",
      type: "form",
      category: "Payroll & Payment",
      description: "Direct secondary Stripe deposit and automated disbursement authorization."
    },
    {
      id: "doc-3",
      title: "Form 1099: 2025",
      subtitle: "Form 1099 records your annual income as a contractor.",
      status: "Filed",
      statusDate: "Feb 2, 2026",
      type: "tax",
      category: "Tax Documents",
      description: "Official IRS 1099-NEC Miscellaneous Income Form for calendar year 2025."
    },
    {
      id: "doc-4",
      title: "Taxpayer Identification (Form W-9)",
      subtitle: "Employer provided document",
      status: "Signed",
      statusDate: "Sep 22, 2025",
      type: "tax",
      category: "Tax Documents",
      description: "Request for Taxpayer Identification Number and Certification."
    },
    {
      id: "doc-5",
      title: "ELA Academy Employee Handbook",
      subtitle: "Employer provided document",
      status: "Signed",
      statusDate: "Sep 22, 2025",
      type: "handbook",
      category: "Company Policies",
      description: "Staff standards of conduct, workplace safety policies, and operating procedures."
    },
    {
      id: "doc-6",
      title: "Alternate Deposit Form",
      subtitle: "Employer provided document",
      status: "Signed",
      statusDate: "Sep 22, 2025",
      type: "form",
      category: "Payroll & Payment",
      description: "Secondary checking/savings routing election for partial split deposits."
    },
    {
      id: "doc-7",
      title: "2027 Pay Schedule",
      subtitle: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Sep 22, 2025",
      type: "schedule",
      category: "Pay Schedules",
      description: "Bi-weekly and weekly pay dates, timecard approval deadlines, and bank holidays for 2027."
    },
    {
      id: "doc-8",
      title: "2028 Pay Schedule",
      subtitle: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Sep 22, 2025",
      type: "schedule",
      category: "Pay Schedules",
      description: "Bi-weekly and weekly pay dates, timecard approval deadlines, and bank holidays for 2028."
    },
    {
      id: "doc-9",
      title: "ELA Academy Student Handbook",
      subtitle: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Sep 22, 2025",
      type: "handbook",
      category: "Company Policies",
      description: "Institutional guidance regarding student conduct, grading, and classroom etiquette."
    },
    {
      id: "doc-10",
      title: "2026 Pay Schedule",
      subtitle: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Sep 22, 2025",
      type: "schedule",
      category: "Pay Schedules",
      description: "Weekly payment calendar, timesheet cut-off days, and scheduled school recesses for 2026."
    },
    {
      id: "doc-11",
      title: "2025 Pay Schedule",
      subtitle: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Sep 22, 2025",
      type: "schedule",
      category: "Pay Schedules",
      description: "Weekly payment calendar, timesheet cut-off days, and scheduled school recesses for 2025."
    },
    {
      id: "doc-12",
      title: "2030 Pay Schedule",
      subtitle: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Sep 22, 2025",
      type: "schedule",
      category: "Pay Schedules",
      description: "Projected long-range school calendar and payroll cycles for academic year 2030."
    },
    {
      id: "doc-13",
      title: "2029 Pay Schedule",
      subtitle: "Employer provided document",
      status: "Acknowledged",
      statusDate: "Sep 22, 2025",
      type: "schedule",
      category: "Pay Schedules",
      description: "Projected long-range school calendar and payroll cycles for academic year 2029."
    }
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Top Banner / Notice regarding onboarding docs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          padding: "0.25rem 0"
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: "0 0 0.25rem" }}>
            Documents
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0 }}>
            Official onboarding records, signed agreements, tax documents, and school pay schedules.
          </p>
        </div>
      </div>

      {/* Documents List Table (Image 1 replica) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {initialDocuments.map((doc, idx) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.5rem",
                borderBottom: idx === initialDocuments.length - 1 ? "none" : "1px solid #eef0f2",
                transition: "background-color 0.15s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
              onClick={() => setSelectedDoc(doc)}
            >
              {/* Document Info */}
              <div style={{ flex: 1, paddingRight: "1rem" }}>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: "0.15rem",
                    textDecoration: "underline",
                    textDecorationColor: "transparent",
                    transition: "text-decoration-color 0.15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "#0f172a")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "transparent")}
                >
                  {doc.title}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  {doc.subtitle}
                </div>
              </div>

              {/* Status and Date */}
              <div
                style={{
                  minWidth: "160px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem"
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#16a34a",
                    marginTop: "5px",
                    flexShrink: 0
                  }}
                />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1f2937" }}>
                    {doc.status}
                  </div>
                  <div style={{ fontSize: "0.775rem", color: "#6b7280" }}>
                    {doc.statusDate}
                  </div>
                </div>
              </div>

              {/* View Action */}
              <div style={{ minWidth: "60px", textAlign: "right" }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0f766e",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDoc(doc);
                  }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Pagination matching Image 1 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.85rem 1.5rem",
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e5e7eb"
          }}
        >
          {/* Items Per Page Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "0.3rem 0.6rem",
                fontSize: "0.85rem",
                color: "#374151",
                backgroundColor: "#ffffff"
              }}
            >
              <span>{itemsPerPage}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 ml-1.5" />
            </div>
            <span style={{ fontSize: "0.85rem", color: "#4b5563" }}>Items per page</span>
          </div>

          {/* Pager Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#9ca3af" }}>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}
              title="First page"
              disabled
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}
              title="Previous page"
              disabled
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}
              title="Next page"
              disabled
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}
              title="Last page"
              disabled
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div
          className="gusto-drawer-overlay"
          onClick={() => setSelectedDoc(null)}
          style={{ zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #e5e7eb"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#374151"
                  }}
                >
                  <FileText className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>
                    {selectedDoc.title}
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {selectedDoc.category} â€¢ {selectedDoc.status} on {selectedDoc.statusDate}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Document Preview Content */}
            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, backgroundColor: "#f9fafb" }}>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "2rem",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
              >
                {/* Official Header */}
                <div style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", letterSpacing: "1px", fontWeight: 700, textTransform: "uppercase", color: "#6b7280" }}>
                      ELA Academy & Cooper Galvis Enterprises LLC
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", marginTop: "0.25rem" }}>
                      {selectedDoc.title}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.6rem", borderRadius: "9999px", backgroundColor: "#ecfdf5", color: "#065f46", fontSize: "0.75rem", fontWeight: 600 }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedDoc.status}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                      Effective: {selectedDoc.statusDate}
                    </div>
                  </div>
                </div>

                {/* Body Text */}
                <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#374151", marginBottom: "1rem" }}>
                  {selectedDoc.description}
                </p>

                {selectedDoc.type === "schedule" ? (
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1f2937", marginBottom: "0.5rem" }}>
                      Payroll Schedule Breakdown
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", color: "#374151" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #d1d5db" }}>
                          <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" }}>Pay Period</th>
                          <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" }}>Timesheet Due</th>
                          <th style={{ padding: "0.5rem 0.75rem", textAlign: "left" }}>Pay Date (Direct Deposit)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "0.5rem 0.75rem" }}>Weekly Cycle #1</td>
                          <td style={{ padding: "0.5rem 0.75rem" }}>Every Sunday 11:59 PM</td>
                          <td style={{ padding: "0.5rem 0.75rem" }}>Every Friday (Stripe)</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "0.5rem 0.75rem" }}>Weekly Cycle #2</td>
                          <td style={{ padding: "0.5rem 0.75rem" }}>Every Sunday 11:59 PM</td>
                          <td style={{ padding: "0.5rem 0.75rem" }}>Every Friday (Stripe)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ marginTop: "1rem", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                      Signature & Compliance Details:
                    </div>
                    <div style={{ fontSize: "0.775rem", color: "#64748b", lineHeight: 1.5 }}>
                      Digitally acknowledged and stored in accordance with state and federal labor guidelines. Administered by Cooper Galvis Enterprises LLC HR & Onboarding.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                padding: "1rem 1.5rem",
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#ffffff"
              }}
            >
              <button
                type="button"
                className="gusto-btn-secondary"
                onClick={() => setSelectedDoc(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="gusto-btn-primary"
                onClick={() => alert(`Downloading copy of ${selectedDoc.title}...`)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Download className="w-4 h-4" /> Download copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GustoDocumentsPage;
