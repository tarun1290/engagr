"use client";

import { createContext, useContext } from "react";
import { getDashboardConfig } from "@/lib/dashboardConfig";

const DashboardConfigContext = createContext(null);

/**
 * Wraps the dashboard with account-type-driven config.
 * Any child component can call useDashboardConfig() to access the config.
 */
export function DashboardConfigProvider({ accountType, children }) {
  const config = getDashboardConfig(accountType);
  return (
    <DashboardConfigContext.Provider value={{ config, accountType: accountType || "creator" }}>
      {children}
    </DashboardConfigContext.Provider>
  );
}

/**
 * Hook to access the current dashboard config.
 * Returns { config, accountType }.
 */
export function useDashboardConfig() {
  const ctx = useContext(DashboardConfigContext);
  if (!ctx) {
    // Fallback if used outside provider (shouldn't happen in normal flow)
    return { config: getDashboardConfig("creator"), accountType: "creator" };
  }
  return ctx;
}
