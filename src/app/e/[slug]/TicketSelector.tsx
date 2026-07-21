"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUSD } from "@/lib/pricing";

export type SelectorItem = {
  id: string;
  name: string;
  description: string | null;
  groupSize: number;
  // null = no hay tanda vigente (fuera de venta)
  priceCents: number | null;
  tierName: string | null;
  priceRiseNote: string | null;
  soldOut: boolean;
  lowStockNote: string | null;
  maxPerOrder: number;
};

export function TicketSelector({
  eventSlug,
  items,
}: {
  eventSlug: string;
  items: SelectorItem[];
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const setQty = (id: string, qty: number, max: number) =>
    setQuantities((q) => ({ ...q, [id]: Math.max(0, Math.min(max, qty)) }));

  const totalCents = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (item.priceCents ?? 0) * (quantities[item.id] ?? 0),
        0,
      ),
    [items, quantities],
  );
  const totalTickets = items.reduce(
    (sum, item) => sum + (quantities[item.id] ?? 0) * item.groupSize,
    0,
  );

  const continueToCheckout = () => {
    const sel = items
      .filter((i) => (quantities[i.id] ?? 0) > 0)
      .map((i) => `${i.id}:${quantities[i.id]}`)
      .join(",");
    router.push(`/e/${eventSlug}/checkout?sel=${encodeURIComponent(sel)}`);
  };

  return (
    <div className="mt-4">
      <ul className="space-y-3">
        {items.map((item) => {
          const qty = quantities[item.id] ?? 0;
          const onSale = item.priceCents !== null && !item.soldOut;
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {item.name}
                  {item.groupSize > 1 && (
                    <span className="ml-2 text-xs text-neutral-500">
                      ({item.groupSize} personas)
                    </span>
                  )}
                </p>
                {item.description && (
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {item.description}
                  </p>
                )}
                {onSale ? (
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">
                      {formatUSD(item.priceCents!)}
                    </span>
                    {item.tierName && (
                      <span className="ml-2 text-xs text-neutral-500">
                        {item.tierName}
                      </span>
                    )}
                    {item.priceRiseNote && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-500">
                        {item.priceRiseNote}
                      </span>
                    )}
                    {item.lowStockNote && (
                      <span className="ml-2 text-xs font-medium text-red-600 dark:text-red-500">
                        {item.lowStockNote}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-500">
                    {item.soldOut ? "Agotada" : "No disponible en este momento"}
                  </p>
                )}
              </div>

              {onSale && (
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Quitar una entrada ${item.name}`}
                    onClick={() => setQty(item.id, qty - 1, item.maxPerOrder)}
                    disabled={qty === 0}
                    className="h-9 w-9 rounded-full border border-neutral-300 text-lg leading-none transition enabled:hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:enabled:hover:bg-neutral-800"
                  >
                    −
                  </button>
                  <span className="w-6 text-center tabular-nums">{qty}</span>
                  <button
                    type="button"
                    aria-label={`Agregar una entrada ${item.name}`}
                    onClick={() => setQty(item.id, qty + 1, item.maxPerOrder)}
                    disabled={qty >= item.maxPerOrder}
                    className="h-9 w-9 rounded-full border border-neutral-300 text-lg leading-none transition enabled:hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:enabled:hover:bg-neutral-800"
                  >
                    +
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
        <div>
          <p className="text-sm text-neutral-500">
            {totalTickets === 0
              ? "Ninguna entrada seleccionada"
              : totalTickets === 1
                ? "1 persona"
                : `${totalTickets} personas`}
          </p>
          <p className="text-xl font-bold">{formatUSD(totalCents)}</p>
        </div>
        <button
          type="button"
          onClick={continueToCheckout}
          disabled={totalTickets === 0}
          className="rounded-full bg-foreground px-6 py-3 font-medium text-background transition enabled:hover:opacity-85 disabled:opacity-40"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
