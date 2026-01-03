"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export type ViewType = "home" | "features";

interface NavbarProps {
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
}

const Navbar = ({ onNavigate, currentView }: NavbarProps) => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-6 bg-black/20 backdrop-blur-sm border-b border-white/10">
    <button
      onClick={() => onNavigate("home")}
      className="text-white text-xl md:text-2xl font-bold tracking-widest uppercase hover:text-neutral-300 transition-colors"
    >
      UNIRIVO
    </button>

    <div className="flex items-center gap-4 md:gap-8">
      {/* Navigation Links */}
      <div className="flex gap-6 md:gap-8">
        <button
          onClick={() => onNavigate("home")}
          className={`text-[10px] md:text-xs uppercase tracking-[0.2em] transition-colors ${
            currentView === "home"
              ? "text-white"
              : "text-neutral-500 hover:text-white"
          }`}
        >
          Home
        </button>
        {/* <button 
          onClick={() => onNavigate("features")}
          className={`text-[10px] md:text-xs uppercase tracking-[0.2em] transition-colors ${
            currentView === "features" ? "text-white" : "text-neutral-500 hover:text-white"
          }`}
        >
          Features
        </button> */}
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center gap-3 md:gap-4 ml-2 md:ml-4 pl-4 md:pl-6 border-l border-white/10">
        <Link
          href="/login"
          className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-white/10 text-white uppercase text-[9px] md:text-[10px] tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-300 border border-white/20 hover:border-white"
        >
          Sign Up
        </Link>
      </div>
    </div>
  </nav>
);

export default Navbar;
