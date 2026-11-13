import React from "react";
import { ArrowDown, ArrowUp, Circle, PieChart, ChevronRight } from "lucide-react";
import "../../styles/GustoTheme.css";

const GustoPerformancePage = () => {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Page Title */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Performance
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Card 1: Your goals (Image 4 replica) */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "1.5rem 1.75rem"
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem"
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
              Your goals
            </h2>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#0f766e",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center"
              }}
              onClick={() => alert("Navigating to Performance Goals dashboard")}
            >
              Go to dashboard &gt;
            </button>
          </div>

          {/* Goals Content Area: Total Goals Box + Donut Chart + Legend */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3rem",
              flexWrap: "wrap"
            }}
          >
            {/* Total Goals Pink Box */}
            <div
              style={{
                backgroundColor: "#fff5f5",
                borderRadius: "8px",
                padding: "1.5rem 2.25rem",
                textAlign: "center",
                minWidth: "120px"
              }}
            >
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                0
              </div>
              <div style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "0.5rem", fontWeight: 500 }}>
                Total goals
              </div>
            </div>

            {/* Donut Chart SVG */}
            <div style={{ width: "130px", height: "130px", flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                {/* Empty / Zero-state donut ring matching screenshot */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="16"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="#ffffff"
                />
              </svg>
            </div>

            {/* Legend (2 columns exactly as in Image 4) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto auto",
                columnGap: "2.5rem",
                rowGap: "0.75rem",
                fontSize: "0.875rem",
                color: "#374151"
              }}
            >
              {/* Row 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#9ca3af" }} />
                <span>0 Not started</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#1f2937" }} />
                <span>0 Completed</span>
              </div>

              {/* Row 2 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#059669" }} />
                <span>0 On track</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#d97706" }} />
                <span>0 Progressing</span>
              </div>

              {/* Row 3 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#dc2626" }} />
                <span>0 Off track</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4b5563" }} />
                <span>0 Incomplete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Feedback (Image 4 replica) */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "1.5rem 1.75rem"
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem"
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
              Feedback
            </h2>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#0f766e",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center"
              }}
              onClick={() => alert("Navigating to 360 Feedback dashboard")}
            >
              Go to dashboard &gt;
            </button>
          </div>

          {/* Feedback Split View */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem"
            }}
          >
            {/* Left Box: Received & Requested */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem"
              }}
            >
              {/* Received */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <ArrowDown className="w-4 h-4 text-emerald-700 mt-0.5" />
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#065f46" }}>
                      Received
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      In last 30 days
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827" }}>
                  0
                </div>
              </div>

              {/* Requested */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: "2px solid #0f766e",
                      background: "linear-gradient(90deg, #0f766e 50%, transparent 50%)"
                    }}
                  />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f766e" }}>
                    Requested
                  </span>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827" }}>
                  0
                </div>
              </div>
            </div>

            {/* Right Box: Given & Pending */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem"
              }}
            >
              {/* Given */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <ArrowUp className="w-4 h-4 text-emerald-700 mt-0.5" />
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#065f46" }}>
                      Given
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      In last 30 days
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827" }}>
                  0
                </div>
              </div>

              {/* Pending */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: "2px solid #0f766e",
                      background: "linear-gradient(90deg, #0f766e 50%, transparent 50%)"
                    }}
                  />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f766e" }}>
                    Pending
                  </span>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827" }}>
                  0
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GustoPerformancePage;
