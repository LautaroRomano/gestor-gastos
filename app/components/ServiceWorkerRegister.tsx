"use client";

import { useEffect } from "react";

/**
 * Registra el service worker para habilitar la instalación (PWA)
 * y el soporte offline básico. Sólo corre en producción para no
 * interferir con el hot-reload de desarrollo.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignorar: la app funciona igual sin SW */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
