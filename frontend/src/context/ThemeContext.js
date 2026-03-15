// [AI] ThemeContext - theme, accentColor, fontSize, toggleTheme, setAccentColor, setFontSize
// Persists to localStorage.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  theme: 'portfolio_theme',
  accentColor: 'portfolio_accent_color',
  fontSize: 'portfolio_font_size',
};

const ThemeContext = createContext(null);

/**
 * ThemeProvider - Wraps app with theme state.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.theme) || 'dark'
  );
  const [accentColor, setAccentColorState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.accentColor) || '#00FF88'
  );
  const [fontSize, setFontSizeState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.fontSize) || 'normal'
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.accentColor, accentColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fontSize, fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setAccentColor = useCallback((color) => {
    setAccentColorState(color);
  }, []);

  const setFontSize = useCallback((size) => {
    setFontSizeState(size);
  }, []);

  const value = {
    theme,
    accentColor,
    fontSize,
    toggleTheme,
    setAccentColor,
    setFontSize,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme - Hook to access theme context.
 * @returns {object} Theme context value
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
