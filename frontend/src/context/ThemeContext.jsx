import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. Load saved theme or default to 'system' (Auto)
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'system'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // 2. Remove old classes to prevent conflicts
    root.classList.remove('light', 'dark');

    // 3. Logic: If "System", check the OS preference
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
      root.classList.add(systemTheme);
    } else {
      // Otherwise use the manual choice (light or dark)
      root.classList.add(theme);
    }

    // 4. Save choice to storage
    localStorage.setItem('theme', theme);

  }, [theme]);

  // 5. Listener: Update live if OS changes while in "System" mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);