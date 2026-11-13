import React, { useState } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  CircleDollarSign,
  BarChart2,
  Landmark,
  Clock,
  FileText,
  DollarSign,
  Plus,
  Compass,
  Building,
  Search,
  Bell,
  Menu
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "../../../styles/GustoTheme.css";

const PayrollLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Secondary sidebar links matching user requirement:
  // [Home, People, pay, report, taxes & compliance, time & attendance, Documents, Money]
  const navItems = [
    { path: "/admin/payroll", label: "Home", icon: Home, end: true },
    { path: "/admin/payroll/people", label: "People", icon: Users },
    { path: "/admin/payroll/pay", label: "Pay", icon: CircleDollarSign },
    { path: "/admin/payroll/reports", label: "Reports", icon: BarChart2 },
    { path: "/admin/payroll/taxes", label: "Taxes & compliance", icon: Landmark },
    { path: "/admin/payroll/time-attendance", label: "Time & attendance", icon: Clock },
    { path: "/admin/payroll/documents", label: "Documents", icon: FileText },
    { path: "/admin/payroll/money", label: "Money", icon: DollarSign },
  ];

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100%", backgroundColor: "#ffffff" }}>
      {/* Secondary Sidebar for Payroll (Image 2 & 3 replica) */}
      <aside
        style={{
          width: "220px",
          minWidth: "220px",
          borderRight: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1.25rem 0.75rem",
          boxSizing: "border-box"
        }}
      >
        <div>
          {/* Brand area */}
          <div style={{ padding: "0.25rem 0.5rem 1rem", borderBottom: "1px solid #f1f5f9", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ backgroundColor: "#0d5c46", color: "#ffffff", fontWeight: 800, fontSize: "0.75rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}>
              ELA
            </div>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Payroll
            </span>
          </div>

          {/* Navigation group */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#0d5c46" : "#4b5563",
                    backgroundColor: isActive ? "#e3f3eb" : "transparent",
                    borderRadius: "8px",
                    textDecoration: "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom shortcuts & Company pill */}
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 600 }}>Shortcuts</span>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "#0d5c46", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
              onClick={() => alert("Add custom shortcuts to frequently used payroll reports.")}
            >
              Add
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.45rem 0.5rem",
              borderRadius: "6px",
              backgroundColor: "#f8fafc",
              fontSize: "0.8rem",
              color: "#334155"
            }}
          >
            <div style={{ width: "22px", height: "22px", borderRadius: "4px", backgroundColor: "#c7d2fe", color: "#3730a3", fontWeight: 700, fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              Co
            </div>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
              Cooper Galvis Ent...
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main style={{ flex: 1, minWidth: 0, padding: "2rem 2.5rem", overflowY: "auto", backgroundColor: "#ffffff" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default PayrollLayout;
