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
  markRead,
} from "../services/notificationService";
import { getActiveTasksCount } from "../services/taskService";
import { getUnreadMessagesCount } from "../services/messagingService";
import { playNotificationChime } from "../utils/soundService";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadTasks, setUnreadTasks] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [vibrateBell, setVibrateBell] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    let activeSocket = null;

    import("socket.io-client").then(({ io }) => {
      if (!isAuthenticated) return;
      
      activeSocket = io(socketUrl, {
        transports: ["websocket", "polling"],
        withCredentials: true
      });

      activeSocket.on("connect", () => {
        console.log("Global notification socket connected");
        const roomName = `user_${user.role === 'superadmin' ? 'superadmin' : 'staff'}_${user.id}`;
        activeSocket.emit("join", { conversation_id: roomName });
      });

      activeSocket.on("new_inapp_notification", (notif) => {
        console.log("Real-time notification received:", notif);
        
        // Play premium double chime using unlocked sound service
        playNotificationChime();

        // Trigger visual vibration
        setVibrateBell(true);
        setTimeout(() => setVibrateBell(false), 800);

        // Prepend to notifications state
        setNotifications((prev) => {
          // Avoid duplicate items if also polling
          if (prev.some(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });

        // Increment unread count or refresh counts
        if (notif.category === "assignment") {
          setUnreadTasks((prev) => prev + 1);
        }
      });

      setSocket(activeSocket);
    });

    return () => {
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

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

  useEffect(() => {
    if (isAuthenticated) {
      import("../utils/push-notifications")
        .then(({ subscribeUser }) => {
          subscribeUser().catch((err) => console.error("Error subscribing to push notifications:", err));
        })
        .catch((err) => console.error("Failed to import push notifications module:", err));
    }
  }, [isAuthenticated]);

  const markAllNotificationsAsRead = async () => {
    try {
      await markAllAsRead();
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read.");
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read.", error);
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
    if (response.data && response.data.otp_required) {
      return response.data; // Return {"otp_required": true, "email": email, "role": role}
    }
    const { access_token } = response.data;
    localStorage.setItem("authToken", access_token);
    await loadUserFromToken();
    return { success: true };
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

  const verifyOtpLogin = async (email, otp, role) => {
    const endpoint = role === "superadmin" ? "/superadmin/verify-login-otp" : "/auth/verify-login-otp";
    const response = await api.post(endpoint, { email, otp });
    const { access_token } = response.data;
    localStorage.setItem("authToken", access_token);
    await loadUserFromToken();
    return { success: true };
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
    verifyOtpLogin,
    logout,
    notifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
    unreadTasks,
    unreadMessages,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    refreshCounts: fetchCounts,
    vibrateBell,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
