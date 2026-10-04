"use client";

import { useActionState } from "react";
import { submitOrder, type CheckoutFormState } from "./actions";
import type { SelectionInput } from "@/lib/orders";
import { formatUSD } from "@/lib/pricing";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type CheckoutItem = {
  ticketTypeId: string;
  name: string;
  quantity: number;
  groupSize: number;
  unitPriceCents: number;
};

export function CheckoutForm({
  eventSlug,
  items,
  totalCents,
}: {
  eventSlug: string;
  items: CheckoutItem[];
  totalCents: number;
}) {
  const selections: SelectionInput[] = items.map((i) => ({
    ticketTypeId: i.ticketTypeId,
    quantity: i.quantity,
    // Solo importa el largo (cuántos asistentes); los datos van por FormData.
    attendees: Array.from({ length: i.quantity * i.groupSize }, () => ({
      fullName: "",
      idNumber: "",
    })),
  }));

  const [state, formAction, pending] = useActionState<
    CheckoutFormState,
    FormData
  >(submitOrder.bind(null, eventSlug, selections), null);

  return (
    <form action={formAction} className="mt-6">
      <Card>
        <h2 className="font-semibold">Tus datos (comprador)</h2>
        <p className="mt-1 text-sm text-muted">
          Acá te enviaremos las entradas.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="buyerName">Nombre completo</Label>
            <Input
              id="buyerName"
              name="buyerName"
              required
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <Label htmlFor="buyerEmail">Email</Label>
            <Input
              id="buyerEmail"
              name="buyerEmail"
              type="email"
              required
              placeholder="tu@email.com"
            />
          </div>
        </div>
      </Card>

      {items.map((item) => (
        <Card key={item.ticketTypeId} className="mt-4">
          <h2 className="font-semibold">
            {item.name}{" "}
            <span className="text-sm font-normal text-muted">
              — {item.quantity} × {formatUSD(item.unitPriceCents)}
              {item.groupSize > 1 && ` (${item.groupSize} personas c/u)`}
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Las entradas son nominativas: nombre y cédula/pasaporte de cada
            persona, tal como figura en su documento.
          </p>
          <div className="mt-4 space-y-3">
            {Array.from({ length: item.quantity * item.groupSize }, (_, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                <Input
                  name={`attendee-${item.ticketTypeId}-${i}-name`}
                  required
                  minLength={3}
                  placeholder={`Asistente ${i + 1}: nombre completo`}
                />
                <Input
                  name={`attendee-${item.ticketTypeId}-${i}-id`}
                  required
                  pattern="[0-9A-Za-z\-]{5,20}"
                  title="Cédula o pasaporte: 5 a 20 letras o números"
                  placeholder="Cédula o pasaporte"
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      {state?.error && (
        <p className="mt-4 rounded-xl border border-danger/25 bg-danger-bg p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <p className="text-xl font-bold">Total: {formatUSD(totalCents)}</p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Reservando…" : "Continuar al pago"}
        </Button>
      </div>
      <p className="mt-2 text-right text-xs text-muted">
        Al continuar, tus entradas quedan reservadas por 10 minutos mientras
        completas el pago.
      </p>
    </form>
  );
}
