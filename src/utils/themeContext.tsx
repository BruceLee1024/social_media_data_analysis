import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'blue' | 'green' | 'purple';

interface ThemeConfig {
  name: string;
  label: string;
  primary: string;          // Tailwind bg class for active nav/buttons
  primaryHover: string;
  primaryText: string;
  primaryLight: string;     // Tailwind bg class for light tints
  dot: string;              // CSS color for inline style dot
}

export const THEMES: Record<Theme, ThemeConfig> = {
  blue: {
    name: 'blue',
    label: '蓝',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primaryLight: 'bg-blue-50',
    dot: '#2563eb',
  },
  green: {
    name: 'green',
    label: '绿',
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-emerald-600',
    primaryLight: 'bg-emerald-50',
    dot: '#059669',
  },
  purple: {
    name: 'purple',
    label: '紫',
    primary: 'bg-violet-600',
    primaryHover: 'hover:bg-violet-700',
    primaryText: 'text-violet-600',
    primaryLight: 'bg-violet-50',
    dot: '#7c3aed',
  },
};

const STORAGE_KEY = 'social_media_theme';

interface ThemeContextValue {
  theme: Theme;
  config: ThemeConfig;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'blue',
  config: THEMES.blue,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as Theme) || 'blue';
  });

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  };

  // 将主题色注入 CSS 自定义属性，用于非 Tailwind 场景
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-primary', THEMES[theme].dot);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, config: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
