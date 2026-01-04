"use client";

import { Palette } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useColorTheme, ColorTheme, colorThemes } from "@/hooks/useColorTheme";

const themeOptions: { name: string; value: ColorTheme }[] = [
  { name: "Forest", value: "green" },
  { name: "Ocean", value: "blue" },
  { name: "Lavender", value: "purple" },
  { name: "Sunset", value: "orange" },
  { name: "Rose", value: "rose" },
  { name: "Teal", value: "teal" },
];

interface ColorThemePickerProps {
  isCollapsed: boolean;
}

export default function ColorThemePicker({ isCollapsed }: ColorThemePickerProps) {
  const { colorTheme, setColorTheme } = useColorTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 py-4 text-sm font-bold rounded-2xl transition-all text-[#F0F4F2]/50 hover:bg-white/5 hover:text-[#F0F4F2] ${
          isCollapsed ? "px-0 justify-center" : "px-6"
        }`}
      >
        <Palette size={20} className="shrink-0" />
        {!isCollapsed && <span>Theme</span>}
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 bg-[var(--theme-sidebar)] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100] ${
            isCollapsed ? "left-full ml-2" : "left-0"
          }`}
          style={{ minWidth: "160px" }}
        >
          <div className="p-2 space-y-1">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setColorTheme(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  colorTheme === option.value
                    ? "bg-white/10 text-[#F0F4F2]"
                    : "text-[#F0F4F2]/60 hover:bg-white/5 hover:text-[#F0F4F2]"
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: colorThemes[option.value].accent }}
                />
                <span>{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
