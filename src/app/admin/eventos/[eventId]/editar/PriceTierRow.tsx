"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  updatePriceTierAction,
  deletePriceTierAction,
  type FormState,
} from "./actions";
import { toEcuadorDateTimeLocal } from "@/lib/datetime";
import { formatUSD } from "@/lib/pricing";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type PriceTierData = {
  id: string;
  name: string;
  priceCents: number;
  startsAt: Date | null;
  endsAt: Date | null;
};

export function PriceTierRow({
  eventId,
  tier,
}: {
  eventId: string;
  tier: PriceTierData;
}) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updating] = useActionState<
    FormState,
    FormData
  >(updatePriceTierAction.bind(null, eventId, tier.id), null);
  const [deleteState, deleteAction, deleting] = useActionState<
    FormState,
    FormData
  >(deletePriceTierAction.bind(null, eventId, tier.id), null);

  // Al guardar bien, volvemos a modo lectura.
  useEffect(() => {
    if (updateState && "ok" in updateState) setEditing(false);
  }, [updateState]);

  if (editing) {
    return (
      <form
        action={updateAction}
        className="rounded-xl border border-border bg-background-alt p-3"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <Input name="name" defaultValue={tier.name} required placeholder="Nombre de la tanda" />
          <Input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={(tier.priceCents / 100).toFixed(2)}
            required
            placeholder="Precio en USD"
          />
          <Input
            name="startsAt"
            type="datetime-local"
            defaultValue={tier.startsAt ? toEcuadorDateTimeLocal(tier.startsAt) : ""}
          />
          <Input
            name="endsAt"
            type="datetime-local"
            defaultValue={tier.endsAt ? toEcuadorDateTimeLocal(tier.endsAt) : ""}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Dejá las fechas vacías para que no tenga límite por ese lado.
        </p>
        {updateState && "error" in updateState && (
          <p className="mt-2 text-sm text-danger">{updateState.error}</p>
        )}
        <div className="mt-3 flex gap-2">
          <Button type="submit" size="sm" disabled={updating}>
            {updating ? "Guardando…" : "Guardar"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setEditing(false)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background-alt px-3 py-2">
      <div className="text-sm">
        <span className="font-medium">{tier.name}</span>{" "}
        <span className="text-muted">{formatUSD(tier.priceCents)}</span>
        {(tier.startsAt || tier.endsAt) && (
          <span className="ml-1.5 text-xs text-muted-2">
            {tier.startsAt ? `desde ${shortDate(tier.startsAt)}` : ""}
            {tier.startsAt && tier.endsAt ? " · " : ""}
            {tier.endsAt ? `hasta ${shortDate(tier.endsAt)}` : ""}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full p-1.5 text-muted transition hover:bg-surface-hover hover:text-foreground"
          aria-label="Editar tanda"
        >
          <Pencil size={14} />
        </button>
        <form action={deleteAction}>
          <button
            type="submit"
            disabled={deleting}
            className="rounded-full p-1.5 text-muted transition hover:bg-danger-bg hover:text-danger disabled:opacity-40"
            aria-label="Borrar tanda"
          >
            <Trash2 size={14} />
          </button>
        </form>
      </div>
      {deleteState && "error" in deleteState && (
        <p className="text-xs text-danger">{deleteState.error}</p>
      )}
    </div>
  );
}

function shortDate(d: Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "short",
    timeZone: "America/Guayaquil",
  }).format(d);
}
