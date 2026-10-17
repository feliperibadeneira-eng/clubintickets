"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card className="p-7 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-danger-bg text-danger">
          <AlertTriangle size={20} />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight">
          Algo salió mal
        </h1>
        <p className="mt-1 text-sm text-muted">
          No es nada que hayas hecho tú — ya quedó registrado. Prueba de
          nuevo.
        </p>
        <Button onClick={reset} className="mt-5 w-full">
          Reintentar
        </Button>
      </Card>
    </main>
  );
}
