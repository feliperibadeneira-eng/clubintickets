"use client";

import { useActionState, useState } from "react";
import { createEventAction, type NewEventState } from "./actions";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type VenueOption = { id: string; name: string; city: string };

export function NewEventForm({ venues }: { venues: VenueOption[] }) {
  const [state, formAction, pending] = useActionState<NewEventState, FormData>(
    createEventAction,
    null,
  );
  const [venueMode, setVenueMode] = useState<"existing" | "new">(
    venues.length > 0 ? "existing" : "new",
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Card>
        <Label htmlFor="name">Nombre del evento</Label>
        <Input id="name" name="name" required placeholder="Ej: Noche de Verano" />

        <div className="mt-4">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Lo que va a ver el comprador en la página del evento."
            className="w-full rounded-xl border border-border bg-background-alt px-3.5 py-2.5 text-foreground placeholder:text-muted-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startsAt">Empieza</Label>
            <Input id="startsAt" name="startsAt" type="datetime-local" required />
          </div>
          <div>
            <Label htmlFor="endsAt">Termina (opcional)</Label>
            <Input id="endsAt" name="endsAt" type="datetime-local" />
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-medium">Sede</p>
        {venues.length > 0 && (
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setVenueMode("existing")}
              className={`rounded-full px-3 py-1.5 text-sm transition ${venueMode === "existing" ? "bg-accent text-accent-foreground" : "bg-surface-hover text-muted"}`}
            >
              Usar una sede existente
            </button>
            <button
              type="button"
              onClick={() => setVenueMode("new")}
              className={`rounded-full px-3 py-1.5 text-sm transition ${venueMode === "new" ? "bg-accent text-accent-foreground" : "bg-surface-hover text-muted"}`}
            >
              Crear una sede nueva
            </button>
          </div>
        )}
        <input type="hidden" name="venueMode" value={venueMode} />

        {venueMode === "existing" ? (
          <div className="mt-4">
            <Label htmlFor="venueId">Sede</Label>
            <select
              id="venueId"
              name="venueId"
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
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="newVenueName">Nombre de la sede</Label>
              <Input
                id="newVenueName"
                name="newVenueName"
                required={venueMode === "new"}
                placeholder="Ej: Discoteca La Central"
              />
            </div>
            <div>
              <Label htmlFor="newVenueCity">Ciudad</Label>
              <Input
                id="newVenueCity"
                name="newVenueCity"
                required={venueMode === "new"}
                placeholder="Ej: Quito"
              />
            </div>
            <div>
              <Label htmlFor="newVenueAddress">Dirección (opcional)</Label>
              <Input id="newVenueAddress" name="newVenueAddress" />
            </div>
          </div>
        )}
      </Card>

      {state?.error && (
        <p className="rounded-xl border border-danger/25 bg-danger-bg p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creando…" : "Crear evento"}
      </Button>
    </form>
  );
}
