"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Cuenta regresiva de la reserva. Al llegar a cero recarga la página,
// que ya mostrará la orden como expirada.
export function Countdown({ expiresAtMs }: { expiresAtMs: number }) {
  const router = useRouter();
  const [msLeft, setMsLeft] = useState(expiresAtMs - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const left = expiresAtMs - Date.now();
      setMsLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAtMs, router]);

  if (msLeft <= 0) return null;
  const totalSeconds = Math.floor(msLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return (
    <span className="font-mono tabular-nums">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
