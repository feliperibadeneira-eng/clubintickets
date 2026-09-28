"use client";

import { useActionState } from "react";
import { setStatusAction, type FormState } from "./actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const statusTone = {
  DRAFT: "warning",
  PUBLISHED: "accent",
  ARCHIVED: "neutral",
} as const;
const statusLabel = {
  DRAFT: "Borrador — todavía no lo ve nadie",
  PUBLISHED: "Publicado — en venta",
  ARCHIVED: "Archivado",
};

export function StatusControl({
  eventId,
  status,
}: {
  eventId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5">
      <div>
        <p className="text-sm text-muted">Estado</p>
        <div className="mt-1">
          <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
        </div>
      </div>
      <div className="flex gap-2">
        {status !== "PUBLISHED" && (
          <StatusButton eventId={eventId} target="PUBLISHED" label="Publicar" />
        )}
        {status === "PUBLISHED" && (
          <StatusButton
            eventId={eventId}
            target="DRAFT"
            label="Pasar a borrador"
            variant="secondary"
          />
        )}
        {status !== "ARCHIVED" && (
          <StatusButton
            eventId={eventId}
            target="ARCHIVED"
            label="Archivar"
            variant="secondary"
          />
        )}
      </div>
    </div>
  );
}

function StatusButton({
  eventId,
  target,
  label,
  variant = "primary",
}: {
  eventId: string;
  target: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  label: string;
  variant?: "primary" | "secondary";
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    setStatusAction.bind(null, eventId, target),
    null,
  );
  return (
    <form action={formAction}>
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {label}
      </Button>
      {state && "error" in state && (
        <p className="mt-2 max-w-[220px] text-xs text-danger">{state.error}</p>
      )}
    </form>
  );
}
