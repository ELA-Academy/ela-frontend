import React, { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useOutletContext, NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Users, RefreshCw, Landmark, ClipboardCheck } from "lucide-react";
import { getAccountingOverview } from "../../../services/accountingService";
import { getBillingAccounts } from "../../../services/billingService";
import "../../../styles/WorkspaceShell.css";

const AccountingLayout = () => {
  const [overview, setOverview] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Secondary sidebar resizer states & logic
  const shellRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(255);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (!shellRef.current) return;
      const shellRect = shellRef.current.getBoundingClientRect();
      const newWidth = e.clientX - shellRect.left;
      if (newWidth >= 180 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewData, accountsData] = await Promise.all([
        getAccountingOverview(),
        getBillingAccounts()
      ]);
      setOverview(overviewData);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      console.error("Failed to load accounting data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const outletContext = {
    overview,
    accounts,
    loading,
    refreshAccounting: fetchData
  };

  const recentAccounts = accounts.slice(0, 8);

  return (
    <div
      ref={shellRef}
      className="workspace-shell"
      style={{ "--sidebar-width": `${sidebarWidth}px` }}
    >
      <div className="workspace-secondary-sidebar">
        <div className="workspace-secondary-header">
          <div className="workspace-secondary-eyebrow">DEPARTMENT</div>
          <h2>Accounting</h2>
        </div>
        
        <div className="workspace-secondary-body">
          <div className="workspace-secondary-section">
            <div className="workspace-secondary-section-header">NAVIGATION</div>
            <div className="workspace-secondary-links">
              <NavLink 
                to="/admin/accounting" 
                end
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard className="workspace-secondary-link-icon" />
                <span className="workspace-secondary-link-title">Overview</span>
              </NavLink>
              <NavLink 
                to="/admin/accounting/accounts" 
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <Users className="workspace-secondary-link-icon" />
                <span className="workspace-secondary-link-title">Family Accounts</span>
              </NavLink>
              <NavLink 
                to="/admin/accounting/recurring-plans" 
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <RefreshCw className="workspace-secondary-link-icon" />
                <span className="workspace-secondary-link-title">Recurring Plans</span>
              </NavLink>
              <NavLink 
                to="/admin/accounting/subsidies" 
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <Landmark className="workspace-secondary-link-icon" />
                <span className="workspace-secondary-link-title">Subsidies</span>
              </NavLink>
              <NavLink 
                to="/admin/accounting/registration" 
                className={({ isActive }) => `workspace-secondary-link ${isActive ? 'active' : ''}`}
              >
                <ClipboardCheck className="workspace-secondary-link-icon" />
                <span className="workspace-secondary-link-title">Registration</span>
              </NavLink>
            </div>
          </div>

          <div className="workspace-secondary-section mt-4">
            <div className="workspace-secondary-section-header">RECENT ACCOUNTS</div>
            <div className="workspace-secondary-links">
              {recentAccounts.map(account => {
                const balance = parseFloat(account.open_balance || 0);
                const hasPositiveBalance = balance > 0;
                
                return (
                  <Link 
                    key={account.student_id} 
                    to={`/admin/accounting/accounts/${account.student_id}`}
                    className="workspace-secondary-link"
                  >
                    <div className="d-flex align-items-center justify-content-center me-2" style={{ width: '16px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: hasPositiveBalance ? '#ef4444' : '#22c55e'
                      }} />
                    </div>
                    <div className="d-flex flex-column overflow-hidden">
                      <span className="workspace-secondary-link-title text-truncate">
                        {account.student_name}
                      </span>
                      <span className="workspace-secondary-link-meta text-truncate">
                        Balance: ${balance.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {recentAccounts.length === 0 && !loading && (
                <div className="workspace-secondary-link-meta px-3 mt-2">No recent accounts</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div 
        className={`sidebar-resizer ${isResizing ? "resizing" : ""}`}
        onMouseDown={startResizing}
      />

      <div className="workspace-content-pane">
        <Outlet context={outletContext} />
      </div>
    </div>
  );
};

export default AccountingLayout;

export const useAccounting = () => {
  return useOutletContext();
};
