import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('aura_theme') as Theme | null;
        if (saved === 'light' || saved === 'dark') return saved;
      }
    } catch (e) {
      console.warn('[ThemeContext] LocalStorage access blocked:', e);
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.remove('dark');
          root.classList.add('light');
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('aura_theme', theme);
      }
    } catch (e) {
      console.warn('[ThemeContext] Error applying theme:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return a safe fallback rather than throwing a fatal render exception
    return {
      theme: 'dark',
      toggleTheme: () => {},
      setTheme: () => {}
    };
  }
  return context;
};
