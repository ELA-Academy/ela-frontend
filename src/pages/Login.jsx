import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, LayoutDashboard, FolderKanban, ClipboardCheck } from "lucide-react";
import api from "../utils/api";
import "../styles/AuthForms.css"; // Import the new styles

const Login = () => {
  const navigate = useNavigate();
  const { staffLogin, verifyOtpLogin, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // OTP Verification states
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("staff");
  
  // Forgot Password states
  const [forgotPassword, setForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSuccessMessage(res.data.message || "Password reset link sent successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to request password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await staffLogin(email, password);
      if (res && res.otp_required) {
        setOtpRequired(true);
        setRole(res.role || "staff");
      } else {
        // The redirect logic is now handled in AdminLayout,
        // so we just navigate to the base admin path.
        navigate("/admin");
      }
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await verifyOtpLogin(email, otp, role);
      navigate("/admin");
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "Invalid or expired verification code."
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
          {otpRequired ? (
            <>
              <h2>Two-Factor Authentication</h2>
              <p className="subtitle">Please enter the 6-digit code sent to your email to verify your identity.</p>
              
              <form onSubmit={handleOtpSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                  <label htmlFor="otp">Verification Code</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                  />
                </div>
                
                <button type="submit" className="btn-primary-full" disabled={submitting}>
                  {submitting ? <span className="login-spinner"></span> : "Verify & Login"}
                </button>

                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setOtpRequired(false);
                    setOtp("");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#673de6",
                    textDecoration: "underline",
                    cursor: "pointer",
                    marginTop: "15px",
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    boxShadow: "none"
                  }}
                >
                  Back to Login
                </button>
              </form>
            </>
          ) : forgotPassword ? (
            <>
              <h2>Forgot Password?</h2>
              <p className="subtitle">Enter your email address and we'll send you a password reset link.</p>

              <form onSubmit={handleForgotPasswordSubmit}>
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message" style={{color: "green", fontSize: "0.875rem", marginBottom: "1rem", textAlign: "center"}}>{successMessage}</p>}
                
                <div className="form-group">
                  <label htmlFor="forgot-email">Email Address</label>
                  <input
                    type="email"
                    id="forgot-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@elaaschool.org"
                  />
                </div>
                
                <button type="submit" className="btn-primary-full" disabled={submitting}>
                  {submitting ? <span className="login-spinner"></span> : "Send Reset Link"}
                </button>

                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setForgotPassword(false);
                    setError("");
                    setSuccessMessage("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#673de6",
                    textDecoration: "underline",
                    cursor: "pointer",
                    marginTop: "15px",
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    boxShadow: "none"
                  }}
                >
                  Back to Login
                </button>
              </form>
            </>
          ) : (
            <>
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
                <div className="form-group" style={{ marginBottom: "5px" }}>
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
                
                <div style={{ textAlign: "right", marginBottom: "20px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPassword(true);
                      setError("");
                      setSuccessMessage("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#673de6",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      padding: 0,
                      boxShadow: "none"
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                
                <button type="submit" className="btn-primary-full" disabled={submitting}>
                  {submitting ? <span className="login-spinner"></span> : "Login"}
                </button>
              </form>
            </>
          )}
          
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
