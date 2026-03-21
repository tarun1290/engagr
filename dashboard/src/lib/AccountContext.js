"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getInstagramAccounts } from "@/app/dashboard/actions";

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAccounts = useCallback(async () => {
    try {
      const data = await getInstagramAccounts();
      setAccounts(data);

      // Auto-select primary or first connected account if none selected
      if (!selectedAccountId || !data.find((a) => a._id === selectedAccountId)) {
        const primary = data.find((a) => a.isPrimary && a.isConnected);
        const first = data.find((a) => a.isConnected);
        setSelectedAccountId(primary?._id || first?._id || null);
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    refreshAccounts();
  }, []);

  const selectedAccount = accounts.find((a) => a._id === selectedAccountId) || null;

  return (
    <AccountContext.Provider
      value={{
        accounts,
        selectedAccountId,
        selectedAccount,
        setSelectedAccountId,
        refreshAccounts,
        loading,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
