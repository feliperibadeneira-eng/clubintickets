"use client";

import { useActionState } from "react";
import { submitOrder, type CheckoutFormState } from "./actions";
import type { SelectionInput } from "@/lib/orders";
import { formatUSD } from "@/lib/pricing";

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
      <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="font-semibold">Tus datos (comprador)</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Acá te enviaremos las entradas.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            name="buyerName"
            required
            placeholder="Tu nombre completo"
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
          />
          <input
            name="buyerEmail"
            type="email"
            required
            placeholder="tu@email.com"
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
          />
        </div>
      </section>

      {items.map((item) => (
        <section
          key={item.ticketTypeId}
          className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <h2 className="font-semibold">
            {item.name}{" "}
            <span className="text-sm font-normal text-neutral-500">
              — {item.quantity} × {formatUSD(item.unitPriceCents)}
              {item.groupSize > 1 && ` (${item.groupSize} personas c/u)`}
            </span>
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Las entradas son nominativas: nombre y cédula/pasaporte de cada
            persona, tal como figura en su documento.
          </p>
          <div className="mt-3 space-y-2">
            {Array.from({ length: item.quantity * item.groupSize }, (_, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <input
                  name={`attendee-${item.ticketTypeId}-${i}-name`}
                  required
                  minLength={3}
                  placeholder={`Asistente ${i + 1}: nombre completo`}
                  className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
                />
                <input
                  name={`attendee-${item.ticketTypeId}-${i}-id`}
                  required
                  pattern="[-0-9A-Za-z]{5,20}"
                  title="Cédula o pasaporte: 5 a 20 letras o números"
                  placeholder="Cédula o pasaporte"
                  className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {state?.error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
        <p className="text-xl font-bold">Total: {formatUSD(totalCents)}</p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-6 py-3 font-medium text-background transition enabled:hover:opacity-85 disabled:opacity-40"
        >
          {pending ? "Reservando…" : "Continuar al pago"}
        </button>
      </div>
      <p className="mt-2 text-right text-xs text-neutral-500">
        Al continuar, tus entradas quedan reservadas por 10 minutos mientras
        completás el pago.
      </p>
    </form>
  );
}
