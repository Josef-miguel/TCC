import React, { createContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isOrganizerMode, setIsOrganizerMode] = useState(false);

  const toggleOrganizer = () => {
    setIsOrganizerMode((prev) => !prev);
  };

  return (
    <AppContext.Provider value={{ isOrganizerMode, toggleOrganizer }}>
      {children}
    </AppContext.Provider>
  );
};
