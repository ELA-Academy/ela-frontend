import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // --- THIS IS THE FIX ---
    // Define the redirect path as the landing page for all users.
    const redirectPath = "/";

    // Call the logout function to clear tokens and state
    logout();

    // Now navigate to the landing page
    navigate(redirectPath, { replace: true });
  }, [logout, navigate]);

  // This component renders nothing
  return null;
};

export default Logout;
