"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 10_000;

// Refresca la página sola cada 10s (sin perder el scroll) para que las
// ventas y el control de acceso se vean "en tiempo real" sin que el
// organizador tenga que estar recargando a mano. Se pausa si la pestaña
// no está a la vista, para no gastar de más.
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = setInterval(tick, REFRESH_MS);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
