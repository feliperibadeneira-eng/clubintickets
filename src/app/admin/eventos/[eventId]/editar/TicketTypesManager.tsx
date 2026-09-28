"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createTicketTypeAction, type FormState } from "./actions";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TicketTypeCard, type TicketTypeData } from "./TicketTypeCard";

export function TicketTypesManager({
  eventId,
  ticketTypes,
}: {
  eventId: string;
  ticketTypes: TicketTypeData[];
}) {
  const [adding, setAdding] = useState(ticketTypes.length === 0);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createTicketTypeAction.bind(null, eventId),
    null,
  );

  // Cerramos el formulario recién cuando el servidor confirma que se creó
  // bien — si hay un error, se queda abierto para que se vea el mensaje.
  useEffect(() => {
    if (state && "ok" in state) setAdding(false);
  }, [state]);

  return (
    <div>
      <h2 className="font-semibold">Tipos de entrada</h2>
      <div className="mt-3 space-y-3">
        {ticketTypes.map((tt) => (
          <TicketTypeCard key={tt.id} eventId={eventId} ticketType={tt} />
        ))}
      </div>

      {adding ? (
        <Card className="mt-3">
          <form action={formAction} className="space-y-3">
            <div>
              <Label htmlFor="new-tt-name">Nombre</Label>
              <Input
                id="new-tt-name"
                name="name"
                required
                placeholder="Ej: General, VIP, Combo 4 amigos…"
              />
            </div>
            <div>
              <Label htmlFor="new-tt-desc">Descripción (opcional)</Label>
              <textarea
                id="new-tt-desc"
                name="description"
                rows={2}
                className="w-full rounded-xl border border-border bg-background-alt px-3.5 py-2.5 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-tt-group">Personas por unidad</Label>
                <Input
                  id="new-tt-group"
                  name="groupSize"
                  type="number"
                  min={1}
                  defaultValue={1}
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-tt-stock">Stock total</Label>
                <Input
                  id="new-tt-stock"
                  name="totalStock"
                  type="number"
                  min={0}
                  required
                  placeholder="Ej: 200"
                />
              </div>
            </div>
            {state && "error" in state && (
              <p className="text-sm text-danger">{state.error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Agregando…" : "Agregar tipo de entrada"}
              </Button>
              {ticketTypes.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setAdding(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <Plus size={14} />
          Agregar tipo de entrada
        </button>
      )}
    </div>
  );
}
