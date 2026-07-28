import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.body.classList.remove("dark-mode");
    localStorage.setItem("app_theme", "light");
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme: "light", setTheme, toggleTheme, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
};
