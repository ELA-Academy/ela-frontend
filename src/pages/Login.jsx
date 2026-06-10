import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthForms.css"; // Import the new styles

const Login = () => {
  const navigate = useNavigate();
  const { staffLogin, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
    }
  };

  // If loading is finished and user is authenticated, redirect them.
  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="login-page-container">
      <div className="login-form-card">
        <h2>Staff Portal Login</h2>
        <p>Please enter your credentials to access your dashboard.</p>
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
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-primary-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
