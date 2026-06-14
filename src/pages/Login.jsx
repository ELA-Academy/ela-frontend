import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, LayoutDashboard, FolderKanban, ClipboardCheck } from "lucide-react";
import "../styles/AuthForms.css"; // Import the new styles

const Login = () => {
  const navigate = useNavigate();
  const { staffLogin, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await staffLogin(email, password);
      // The redirect logic is now handled in AdminLayout,
      // so we just navigate to the base admin path.
      navigate("/admin");
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // If loading is finished and user is authenticated, redirect them.
  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="login-page-container">
      {/* Left side: Form */}
      <div className="login-form-side">
        <div /> {/* Top spacer */}
        
        <div className="login-form-wrapper">
          <div className="login-logo-container">
            <img src="/images/ELA-logo.png" alt="ELA Academy Logo" className="login-logo-img" />
          </div>
          <h2>Welcome back to ELA School Management App</h2>
          <p className="subtitle">Please enter your credentials to access your dashboard.</p>
          
          <form onSubmit={handleSubmit}>
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@elaaschool.org"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">
                <span>Password</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  style={{ paddingRight: "45px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    zIndex: 10,
                    boxShadow: "none",
                    outline: "none"
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn-primary-full" disabled={submitting}>
              {submitting ? <span className="login-spinner"></span> : "Login"}
            </button>
          </form>
          
          <div className="login-footer">
            Don't have an account? Contact school administration.
          </div>
        </div>

        {/* Small spacer footer at bottom left */}
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "left" }}>
          &copy; {new Date().getFullYear()} ELA Academy. All rights reserved.
        </div>
      </div>

      {/* Right side: Promo graphic side panel */}
      <div className="login-promo-side">
        <div className="promo-content-wrapper">
          <h1 className="login-promo-text">
            Enter the Future <br />
            of <span>School Management</span>, today
          </h1>
          
          {/* Mock Dashboard Widget */}
          <div className="dashboard-mock-widget">
            {/* Sidebar element */}
            <div className="mock-control-panel">
              <div className="mock-panel-icon active">
                <LayoutDashboard size={20} />
              </div>
              <div className="mock-panel-icon">
                <FolderKanban size={20} />
              </div>
              <div className="mock-panel-icon">
                <ClipboardCheck size={20} />
              </div>
              <div style={{ flexGrow: 1 }} />
              <div className="mock-logo-badge">
                E
              </div>
            </div>
            
            {/* Card element */}
            <div className="mock-stats-card">
              {/* Subtle watermark logo in background */}
              <div className="mock-card-watermark">
                <LayoutDashboard size={120} strokeWidth={0.5} />
              </div>
              
              <div className="mock-card-logo">
                <img src="/images/ELA-logo.png" alt="School logo" />
              </div>
              
              <div className="mock-stats-label">Total Enrollment</div>
              <div className="mock-stats-value">1,284</div>
              <div className="mock-stats-desc">
                <span /> Active this semester
              </div>
              
              <div className="mock-card-row">
                <div className="mock-row-title">Admission Leads</div>
                <div className="mock-row-value">2,546</div>
              </div>
              
              <a href="#" onClick={(e) => e.preventDefault()} className="mock-card-action">
                View All
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
