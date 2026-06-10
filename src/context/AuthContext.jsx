import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";
import api from "../utils/api";
import {
  getNotifications,
  markAllAsRead,
} from "../services/notificationService";
import { getActiveTasksCount } from "../services/taskService";
import { getUnreadMessagesCount } from "../services/messagingService";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadTasks, setUnreadTasks] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifData, tasksCount, messagesCount] = await Promise.all([
        getNotifications(),
        getActiveTasksCount(),
        getUnreadMessagesCount(),
      ]);
      setNotifications(notifData);
      setUnreadTasks(tasksCount);
      setUnreadMessages(messagesCount);
    } catch (error) {
      console.error("Failed to poll for counts and notifications.", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCounts(); // Fetch immediately on login
    const interval = setInterval(fetchCounts, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchCounts]);

  const markAllNotificationsAsRead = async () => {
    try {
      await markAllAsRead();
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read.");
    }
  };

  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            id: decoded.id,
            email: decoded.sub,
            name: decoded.name,
            role: decoded.role,
            departmentNames: decoded.departmentNames || [],
            dashboardRoutes: decoded.dashboardRoutes || [],
          });
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const loginUser = async (loginFunction, credentials) => {
    const response = await loginFunction(credentials);
    const { access_token } = response.data;
    localStorage.setItem("authToken", access_token);
    await loadUserFromToken();
  };

  const staffLogin = async (email, password) => {
    return loginUser((creds) => api.post("/auth/login", creds), {
      email,
      password,
    });
  };

  const superAdminLogin = async (email, password) => {
    return loginUser((creds) => api.post("/superadmin/login", creds), {
      email,
      password,
    });
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setIsAuthenticated(false);
    setNotifications([]);
    setUnreadTasks(0);
    setUnreadMessages(0);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    staffLogin,
    superAdminLogin,
    logout,
    notifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
    unreadTasks,
    unreadMessages,
    markAllNotificationsAsRead,
    refreshCounts: fetchCounts, // Expose a manual refresh function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
