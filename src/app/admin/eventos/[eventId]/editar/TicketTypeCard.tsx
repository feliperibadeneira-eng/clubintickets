"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  updateTicketTypeAction,
  deleteTicketTypeAction,
  createPriceTierAction,
  type FormState,
} from "./actions";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PriceTierRow, type PriceTierData } from "./PriceTierRow";

export type TicketTypeData = {
  id: string;
  name: string;
  description: string | null;
  groupSize: number;
  totalStock: number;
  priceTiers: PriceTierData[];
};

export function TicketTypeCard({
  eventId,
  ticketType,
}: {
  eventId: string;
  ticketType: TicketTypeData;
}) {
  const [editing, setEditing] = useState(false);
  const [addingTier, setAddingTier] = useState(false);

  const [updateState, updateAction, updating] = useActionState<
    FormState,
    FormData
  >(updateTicketTypeAction.bind(null, eventId, ticketType.id), null);
  const [deleteState, deleteAction, deleting] = useActionState<
    FormState,
    FormData
  >(deleteTicketTypeAction.bind(null, eventId, ticketType.id), null);
  const [tierState, tierAction, addingTierPending] = useActionState<
    FormState,
    FormData
  >(createPriceTierAction.bind(null, eventId, ticketType.id), null);

  // Al guardar bien, volvemos a modo lectura — si no, el formulario se
  // queda abierto con los datos ya guardados, como si no hubiera pasado
  // nada.
  useEffect(() => {
    if (updateState && "ok" in updateState) setEditing(false);
  }, [updateState]);
  useEffect(() => {
    if (tierState && "ok" in tierState) setAddingTier(false);
  }, [tierState]);

  return (
    <Card>
      {editing ? (
        <form action={updateAction} className="space-y-3">
          <Input name="name" defaultValue={ticketType.name} required />
          <textarea
            name="description"
            rows={2}
            defaultValue={ticketType.description ?? ""}
            placeholder="Descripción (opcional)"
            className="w-full rounded-xl border border-border bg-background-alt px-3.5 py-2.5 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`groupSize-${ticketType.id}`}>
                Personas por unidad
              </Label>
              <Input
                id={`groupSize-${ticketType.id}`}
                name="groupSize"
                type="number"
                min={1}
                defaultValue={ticketType.groupSize}
                required
              />
            </div>
            <div>
              <Label htmlFor={`totalStock-${ticketType.id}`}>Stock total</Label>
              <Input
                id={`totalStock-${ticketType.id}`}
                name="totalStock"
                type="number"
                min={0}
                defaultValue={ticketType.totalStock}
                required
              />
            </div>
          </div>
          {updateState && "error" in updateState && (
            <p className="text-sm text-danger">{updateState.error}</p>
          )}
          <div className="flex gap-2">
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
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">
              {ticketType.name}
              {ticketType.groupSize > 1 && (
                <span className="ml-2 text-xs font-normal text-muted">
                  ({ticketType.groupSize} personas por unidad)
                </span>
              )}
            </h3>
            {ticketType.description && (
              <p className="mt-0.5 text-sm text-muted">
                {ticketType.description}
              </p>
            )}
            <p className="mt-0.5 text-sm text-muted">
              Stock: {ticketType.totalStock}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full p-1.5 text-muted transition hover:bg-surface-hover hover:text-foreground"
              aria-label="Editar tipo de entrada"
            >
              <Pencil size={15} />
            </button>
            <form action={deleteAction}>
              <button
                type="submit"
                disabled={deleting}
                className="rounded-full p-1.5 text-muted transition hover:bg-danger-bg hover:text-danger disabled:opacity-40"
                aria-label="Borrar tipo de entrada"
              >
                <Trash2 size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
      {deleteState && "error" in deleteState && (
        <p className="mt-2 text-sm text-danger">{deleteState.error}</p>
      )}

      <div className="mt-4 space-y-2">
        {ticketType.priceTiers.map((tier) => (
          <PriceTierRow key={tier.id} eventId={eventId} tier={tier} />
        ))}
        {ticketType.priceTiers.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted">
            Sin tandas de precio todavía — no se puede vender hasta que
            agregues al menos una.
          </p>
        )}
      </div>

      {addingTier ? (
        <form
          action={tierAction}
          className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-3"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Input name="name" required placeholder="Nombre (ej: Tanda 1)" />
            <Input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="Precio en USD"
            />
            <Input name="startsAt" type="datetime-local" />
            <Input name="endsAt" type="datetime-local" />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Deja las fechas vacías para que no tenga límite por ese lado.
          </p>
          {tierState && "error" in tierState && (
            <p className="mt-2 text-sm text-danger">{tierState.error}</p>
          )}
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" disabled={addingTierPending}>
              {addingTierPending ? "Agregando…" : "Agregar tanda"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setAddingTier(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddingTier(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <Plus size={14} />
          Agregar tanda de precio
        </button>
      )}
    </Card>
  );
}
