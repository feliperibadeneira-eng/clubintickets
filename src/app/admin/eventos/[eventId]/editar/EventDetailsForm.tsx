"use client";

import { useActionState } from "react";
import { updateEventAction, type FormState } from "./actions";
import { toEcuadorDateTimeLocal } from "@/lib/datetime";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type VenueOption = { id: string; name: string; city: string };

export function EventDetailsForm({
  eventId,
  name,
  description,
  venueId,
  venues,
  startsAt,
  endsAt,
}: {
  eventId: string;
  name: string;
  description: string;
  venueId: string;
  venues: VenueOption[];
  startsAt: Date;
  endsAt: Date | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateEventAction.bind(null, eventId),
    null,
  );

  return (
    <Card>
      <h2 className="font-semibold">Datos del evento</h2>
      <form action={formAction} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" defaultValue={name} required />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={description}
            className="w-full rounded-xl border border-border bg-background-alt px-3.5 py-2.5 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
        </div>
        <div>
          <Label htmlFor="venueId">Sede</Label>
          <select
            id="venueId"
            name="venueId"
            defaultValue={venueId}
            required
            className="w-full rounded-xl border border-border bg-background-alt px-3.5 py-2.5 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.city}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startsAt">Empieza</Label>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={toEcuadorDateTimeLocal(startsAt)}
              required
            />
          </div>
          <div>
            <Label htmlFor="endsAt">Termina (opcional)</Label>
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={endsAt ? toEcuadorDateTimeLocal(endsAt) : ""}
            />
          </div>
        </div>

        {state && "error" in state && (
          <p className="rounded-xl border border-danger/25 bg-danger-bg p-3 text-sm text-danger">
            {state.error}
          </p>
        )}
        {state && "ok" in state && (
          <p className="text-sm text-success">Guardado.</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </Card>
  );
}
