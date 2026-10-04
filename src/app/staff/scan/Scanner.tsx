"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode as Html5QrcodeType } from "html5-qrcode";
import { CheckCircle2, XCircle, CameraOff } from "lucide-react";
import { scanTicket } from "./actions";
import { logout } from "@/lib/session-actions";
import type { EventOption, CheckInResult } from "@/lib/checkin";
import { Button } from "@/components/ui/Button";

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">Conectado como</p>
          <p className="break-words font-medium">{staffName}</p>
        </div>
        <form action={logout} className="shrink-0">
          <Button type="submit" variant="secondary" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </div>

      <label className="mt-5 block text-sm font-medium text-muted">
        Evento
      </label>
      <select
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-background-alt px-3.5 py-2.5 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
      >
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        <div id={READER_ID} className="w-full" />
        {cameraError && (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-danger">
            <CameraOff size={22} />
            No pudimos acceder a la cámara: {cameraError}. Revisa los
            permisos de cámara del navegador para este sitio.
          </div>
        )}
      </div>

      {result && <ResultPanel result={result} onDismiss={resumeScanning} />}

      {paused && !result && (
        <p className="mt-4 text-center text-sm text-muted">Procesando…</p>
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
      <div className="mt-4 rounded-2xl border border-success/25 bg-success-bg p-6 text-center">
        <CheckCircle2 className="mx-auto text-success" size={34} />
        <p className="mt-2 text-lg font-bold text-success">Entrada válida</p>
        <p className="mt-1 font-medium">{result.attendeeName}</p>
        <p className="text-sm text-muted">{result.ticketTypeName}</p>
        <DismissButton onDismiss={onDismiss} />
      </div>
    );
  }

  if (result.result === "ALREADY_USED") {
    return (
      <div className="mt-4 rounded-2xl border border-danger/25 bg-danger-bg p-6 text-center">
        <XCircle className="mx-auto text-danger" size={34} />
        <p className="mt-2 text-lg font-bold text-danger">Entrada ya usada</p>
        <p className="mt-1 font-medium">
          {result.attendeeName} · {result.ticketTypeName}
        </p>
        <p className="text-sm text-muted">
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
    <div className="mt-4 rounded-2xl border border-danger/25 bg-danger-bg p-6 text-center">
      <XCircle className="mx-auto text-danger" size={34} />
      <p className="mt-2 text-lg font-bold text-danger">No válida</p>
      <p className="mt-1 text-sm text-muted">{result.reason}</p>
      <DismissButton onDismiss={onDismiss} />
    </div>
  );
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Button onClick={onDismiss} className="mt-4">
      Escanear siguiente
    </Button>
  );
}
