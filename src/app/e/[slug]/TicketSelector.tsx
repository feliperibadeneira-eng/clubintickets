"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { formatUSD } from "@/lib/pricing";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
    <div className="mt-5">
      <ul className="space-y-3">
        {items.map((item) => {
          const qty = quantities[item.id] ?? 0;
          const onSale = item.priceCents !== null && !item.soldOut;
          return (
            <li key={item.id}>
              <Card
                className={`flex items-center justify-between gap-4 ${qty > 0 ? "border-accent/40 ring-1 ring-accent/20" : ""}`}
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {item.name}
                    {item.groupSize > 1 && (
                      <span className="ml-2 text-xs text-muted">
                        ({item.groupSize} personas)
                      </span>
                    )}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-muted">
                      {item.description}
                    </p>
                  )}
                  {onSale ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {formatUSD(item.priceCents!)}
                      </span>
                      {item.tierName && (
                        <Badge tone="neutral">{item.tierName}</Badge>
                      )}
                      {item.priceRiseNote && (
                        <Badge tone="warning">{item.priceRiseNote}</Badge>
                      )}
                      {item.lowStockNote && (
                        <Badge tone="danger">{item.lowStockNote}</Badge>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-muted">
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
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition enabled:hover:border-border-hover enabled:hover:bg-surface-hover disabled:opacity-30"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-5 text-center font-medium tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Agregar una entrada ${item.name}`}
                      onClick={() => setQty(item.id, qty + 1, item.maxPerOrder)}
                      disabled={qty >= item.maxPerOrder}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition enabled:hover:border-border-hover enabled:hover:bg-surface-hover disabled:opacity-30"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-2xl">
        <div>
          <p className="text-sm text-muted">
            {totalTickets === 0
              ? "Ninguna entrada seleccionada"
              : totalTickets === 1
                ? "1 persona"
                : `${totalTickets} personas`}
          </p>
          <p className="text-xl font-bold">{formatUSD(totalCents)}</p>
        </div>
        <Button
          size="lg"
          onClick={continueToCheckout}
          disabled={totalTickets === 0}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
