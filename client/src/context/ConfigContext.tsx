"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ApiConfig } from "../types";

const Ctx = createContext<ApiConfig | null>(null);

export function ConfigProvider({ value, children }: { value: ApiConfig; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConfig() {
  const v = useContext(Ctx);
  if (!v) throw new Error("ConfigProvider missing");
  return v;
}
