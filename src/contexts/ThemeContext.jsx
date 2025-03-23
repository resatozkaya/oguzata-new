import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarColor, setSidebarColor] = useState('#6a1b9a');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const themeData = JSON.parse(savedTheme);
      setDarkMode(themeData.darkMode);
      setSidebarColor(themeData.sidebarColor);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('theme', JSON.stringify({
        darkMode: newValue,
        sidebarColor
      }));
      return newValue;
    });
  };

  const changeSidebarColor = (color) => {
    setSidebarColor(color);
    localStorage.setItem('theme', JSON.stringify({
      darkMode,
      sidebarColor: color
    }));
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: sidebarColor,
      },
      secondary: {
        main: '#1a237e',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: sidebarColor,
            color: '#ffffff',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
          },
        },
      },
    },
  });

  const value = {
    darkMode,
    toggleDarkMode,
    sidebarColor,
    changeSidebarColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
