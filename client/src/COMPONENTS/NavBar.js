import React from "react";
import { NavLink } from "react-router-dom";

// Exact palette
const COLORS = {
  primary: "#5b73ff",
  white: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  shadow: "rgba(91, 108, 255, 0.35)",
  barShadow: "0 2px 6px rgba(0,0,0,0.06)",
};

const UserPlusIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
    <path d="M19 8v6M16 11h6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const LoginIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M10 17l5-5-5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 12H3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const Pill = ({ active, children }) => (
  <span
    className="inline-flex items-center gap-2 select-none"
    style={{
      padding: "8px 16px",
      borderRadius: 14,
      background: active ? COLORS.primary : COLORS.white,
      color: active ? COLORS.white : COLORS.muted,
      border: active ? `1px solid ${COLORS.primary}` : "1px solid transparent",
      boxShadow: active ? `0 6px 16px ${COLORS.shadow}` : "none",
      fontWeight: 600,
      lineHeight: 1,
      transition: "background 120ms ease, color 120ms ease, box-shadow 120ms ease",
    }}
  >
    {children}
  </span>
);

export default function NavBar() {
  return (
    <div
      className="w-full border-b sticky top-0 z-20"
      style={{ background: COLORS.bg, borderColor: COLORS.border, boxShadow: COLORS.barShadow }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-4">
        <div className="flex items-center" style={{ gap: 20 }}>
          <span style={{ color: COLORS.text, fontWeight: 600 }}>
            Digital ID System
          </span>

          {/* Registration pill */}
          <NavLink to="/" end style={{ textDecoration: "none" }}
            className={({ isActive }) => isActive ? undefined : "hover:opacity-90"}
          >
            {({ isActive }) => (
              <Pill active={isActive}>
                <UserPlusIcon color={isActive ? COLORS.white : COLORS.muted} />
                <span>Registration</span>
              </Pill>
            )}
          </NavLink>

          {/* Login pill */}
          <NavLink to="/login" style={{ textDecoration: "none" }}
            className={({ isActive }) => isActive ? undefined : "hover:opacity-90"}
          >
            {({ isActive }) => (
              <Pill active={isActive}>
                <LoginIcon color={isActive ? COLORS.white : COLORS.muted} />
                <span>Login</span>
              </Pill>
            )}
          </NavLink>
        </div>
      </div>
    </div>
  );
}
