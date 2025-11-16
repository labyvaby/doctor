import React, { createContext, useCallback, useMemo, useState } from "react";

export type LayoutContextType = {
  siderCollapsed: boolean;
  toggleSider: () => void;
  setSiderCollapsed: (v: boolean) => void;
};

export const LayoutContext = createContext<LayoutContextType>({
  siderCollapsed: false,
  toggleSider: () => void 0,
  setSiderCollapsed: () => void 0,
});

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const toggleSider = useCallback(() => setSiderCollapsed((c) => !c), []);

  const value = useMemo(
    () => ({ siderCollapsed, toggleSider, setSiderCollapsed }),
    [siderCollapsed, toggleSider]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
