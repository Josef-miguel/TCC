import React, { createContext, useState } from "react";
import { lightTheme, darkTheme } from "../styles/colors";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Dentro do seu toggleTheme no ThemeContext.js
  const toggleTheme = () => {
    console.log("Antes da alteração:", isDarkTheme);
    setIsDarkTheme((prev) => {
      console.log("Depois da alteração:", !prev);
      return !prev;
    });
  };

  const theme = isDarkTheme ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
