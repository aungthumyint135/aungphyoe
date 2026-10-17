"use client";

import { useEffect, useLayoutEffect } from "react";

/** useLayoutEffect on the client (runs before paint), useEffect on the server (no warning). */
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
