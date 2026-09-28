"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode as Html5QrcodeType } from "html5-qrcode";
import { scanTicket } from "./actions";
import { logout } from "@/lib/session-actions";
import type { EventOption, CheckInResult } from "@/lib/checkin";

const READER_ID = "qr-reader";

export function Scanner({
  events,
  staffName,
}: {
  events: EventOption[];
  staffName: string;
}) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [paused, setPaused] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const processingRef = useRef(false);
  const eventIdRef = useRef(eventId);
  eventIdRef.current = eventId;

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          async (decodedText) => {
            if (processingRef.current) return;
            processingRef.current = true;
            // Pausa la cámara de verdad (no solo ignoramos el callback):
            // si no, mientras el QR sigue en cuadro, html5-qrcode lo vuelve
            // a leer y el resultado se actualiza solo, tapando lo que el
            // staff está viendo.
            scannerRef.current?.pause(true);
            setPaused(true);
            try {
              const res = await scanTicket(decodedText, eventIdRef.current);
              setResult(res);
            } finally {
              processingRef.current = false;
            }
          },
          () => {
            // Se llama constantemente mientras no encuentra QR; lo ignoramos.
          },
        )
        .catch((err: unknown) => {
          setCameraError(
            err instanceof Error ? err.message : String(err),
          );
        });
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        // Si la cámara nunca llegó a iniciarse (permiso denegado, sin
        // cámara, etc.) .stop() puede tirar un error sincrónico en vez de
        // devolver una promesa rechazada — sin este try/catch, salir de
        // esta pantalla en ese caso rompía la navegación.
        try {
          scanner.stop()?.catch(() => {});
        } catch {
          // No había nada corriendo; no hay nada que detener.
        }
      }
    };
  }, []);

  const resumeScanning = () => {
    setResult(null);
    setPaused(false);
    scannerRef.current?.resume();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Conectado como</p>
          <p className="font-medium">{staffName}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <label className="mt-4 block text-sm font-medium">Evento</label>
      <select
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      >
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      <div className="relative mt-4 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div id={READER_ID} className="w-full" />
        {cameraError && (
          <div className="p-4 text-center text-sm text-red-600 dark:text-red-400">
            No pudimos acceder a la cámara: {cameraError}. Revisá los
            permisos de cámara del navegador para este sitio.
          </div>
        )}
      </div>

      {result && (
        <ResultPanel result={result} onDismiss={resumeScanning} />
      )}

      {paused && !result && (
        <p className="mt-4 text-center text-sm text-neutral-500">
          Procesando…
        </p>
      )}
    </div>
  );
}

function ResultPanel({
  result,
  onDismiss,
}: {
  result: CheckInResult;
  onDismiss: () => void;
}) {
  if (result.result === "GRANTED") {
    return (
      <div className="mt-4 rounded-xl bg-green-100 p-5 text-center dark:bg-green-950">
        <p className="text-lg font-bold text-green-800 dark:text-green-300">
          ✓ Entrada válida
        </p>
        <p className="mt-1 text-green-900 dark:text-green-200">
          {result.attendeeName}
        </p>
        <p className="text-sm text-green-700 dark:text-green-400">
          {result.ticketTypeName}
        </p>
        <DismissButton onDismiss={onDismiss} />
      </div>
    );
  }

  if (result.result === "ALREADY_USED") {
    return (
      <div className="mt-4 rounded-xl bg-red-100 p-5 text-center dark:bg-red-950">
        <p className="text-lg font-bold text-red-800 dark:text-red-300">
          ✕ Entrada ya usada
        </p>
        <p className="mt-1 text-red-900 dark:text-red-200">
          {result.attendeeName} · {result.ticketTypeName}
        </p>
        <p className="text-sm text-red-700 dark:text-red-400">
          Ingresó a las{" "}
          {new Intl.DateTimeFormat("es-EC", {
            timeStyle: "medium",
            timeZone: "America/Guayaquil",
          }).format(new Date(result.usedAt))}{" "}
          · escaneada por {result.usedByName}
        </p>
        <DismissButton onDismiss={onDismiss} />
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl bg-red-100 p-5 text-center dark:bg-red-950">
      <p className="text-lg font-bold text-red-800 dark:text-red-300">
        ✕ No válida
      </p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-400">
        {result.reason}
      </p>
      <DismissButton onDismiss={onDismiss} />
    </div>
  );
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      className="mt-4 rounded-full bg-foreground px-6 py-2 font-medium text-background transition hover:opacity-85"
    >
      Escanear siguiente
    </button>
  );
}
