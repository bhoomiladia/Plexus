"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ColorTheme = "green" | "blue" | "purple" | "orange" | "rose" | "teal";

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

// Color palettes maintaining the same shade structure as the original green theme
export const colorThemes: Record<ColorTheme, {
  sidebar: string;       // #2D3E40 equivalent - sidebar bg
  accent: string;        // #88AB8E equivalent - primary accent
  background: string;    // #141C1C equivalent - page bg
  accentLight: string;   // #88AB8E equivalent - light accent
  muted: string;         // #3E5C58 equivalent - muted/secondary
  card: string;          // #1A2323 equivalent - card bg
  cardAlt: string;       // #243131 equivalent - alternate card bg
  buttonBg: string;      // #2D4340 equivalent - button bg
}> = {
  green: {
    sidebar: "#2D3E40",
    accent: "#88AB8E",
    background: "#141C1C",
    accentLight: "#88AB8E",
    muted: "#3E5C58",
    card: "#1A2323",
    cardAlt: "#243131",
    buttonBg: "#2D4340",
  },
  blue: {
    sidebar: "#2D3A4E",
    accent: "#7BA3C9",
    background: "#141820",
    accentLight: "#7BA3C9",
    muted: "#3E4F6E",
    card: "#1A2030",
    cardAlt: "#243040",
    buttonBg: "#2D4055",
  },
  purple: {
    sidebar: "#3D2D4E",
    accent: "#A388C9",
    background: "#1A1420",
    accentLight: "#A388C9",
    muted: "#5E3E6E",
    card: "#251A30",
    cardAlt: "#352440",
    buttonBg: "#402D55",
  },
  orange: {
    sidebar: "#4E3D2D",
    accent: "#C9A388",
    background: "#201A14",
    accentLight: "#C9A388",
    muted: "#6E5E3E",
    card: "#302518",
    cardAlt: "#403524",
    buttonBg: "#55402D",
  },
  rose: {
    sidebar: "#4E2D3D",
    accent: "#C988A3",
    background: "#201418",
    accentLight: "#C988A3",
    muted: "#6E3E4E",
    card: "#301A22",
    cardAlt: "#402432",
    buttonBg: "#552D40",
  },
  teal: {
    sidebar: "#2D4E4A",
    accent: "#88C9BF",
    background: "#14201E",
    accentLight: "#88C9BF",
    muted: "#3E6E68",
    card: "#1A302C",
    cardAlt: "#24403A",
    buttonBg: "#2D5550",
  },
};

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("green");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("color-theme") as ColorTheme;
    if (saved && colorThemes[saved]) {
      setColorTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("color-theme", colorTheme);
      // Apply CSS variables to root for global access
      const theme = colorThemes[colorTheme];
      const root = document.documentElement;
      root.style.setProperty("--theme-sidebar", theme.sidebar);
      root.style.setProperty("--theme-accent", theme.accent);
      root.style.setProperty("--theme-background", theme.background);
      root.style.setProperty("--theme-accent-light", theme.accentLight);
      root.style.setProperty("--theme-muted", theme.muted);
      root.style.setProperty("--theme-card", theme.card);
      root.style.setProperty("--theme-card-alt", theme.cardAlt);
      root.style.setProperty("--theme-button-bg", theme.buttonBg);
      
      // Also update scrollbar colors
      root.style.setProperty("--scrollbar-thumb", theme.muted);
      root.style.setProperty("--scrollbar-thumb-hover", theme.accent);
    }
  }, [colorTheme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    // Return default values when outside provider (during initial render)
    return {
      colorTheme: "green" as ColorTheme,
      setColorTheme: () => {},
    };
  }
  return context;
}
