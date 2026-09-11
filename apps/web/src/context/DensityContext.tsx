"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Density = "comfortable" | "compact";

interface DensityContextValue {
  density: Density;
  setDensity: (d: Density) => void;
}

const DensityContext = createContext<DensityContextValue>({
  density: "comfortable",
  setDensity: () => {},
});

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<Density>("comfortable");

  useEffect(() => {
    const match = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("density="));
    if (match) {
      const val = match.split("=")[1]?.trim();
      if (val === "compact" || val === "comfortable") setDensityState(val);
    }
  }, []);

  function setDensity(d: Density) {
    setDensityState(d);
    document.cookie = `density=${d}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  return useContext(DensityContext);
}
