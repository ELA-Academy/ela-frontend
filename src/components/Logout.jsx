import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Logout = () => {
  const { logout } = useAuth();

  useEffect(() => {
    // Call the logout function to clear tokens and state
    logout();

    // Perform a full page reload to the login page to completely clear memory, 
    // active sockets, and prevent any concurrent React Router redirect crashes.
    window.location.href = "/login";
  }, [logout]);

  // Render a clean UI while the redirection is happening
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f0f2f5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#333"
    }}>
      <div style={{
        background: "#fff",
        padding: "2.5rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        textAlign: "center",
        maxWidth: "360px",
        width: "90%"
      }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontWeight: 600, fontSize: "1.25rem" }}>Logging out...</h3>
        <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>Clearing your session securely.</p>
      </div>
    </div>
  );
};

export default Logout;
