// Lógica de tandas de precio (ver SPEC.md sección 4).

export type TierLike = {
  id: string;
  name: string;
  priceCents: number;
  startsAt: Date | null;
  endsAt: Date | null;
};

// La tanda vigente es la que cumple startsAt <= ahora < endsAt
// (null = sin límite por ese lado). Si varias aplican, gana la que
// empezó más tarde — así "Tanda 2" pisa a una "Tanda 1" sin fecha de cierre.
export function currentTier(tiers: TierLike[], now: Date): TierLike | null {
  const active = tiers.filter(
    (t) => (!t.startsAt || t.startsAt <= now) && (!t.endsAt || t.endsAt > now),
  );
  if (active.length === 0) return null;
  return active.reduce((a, b) => {
    const aStart = a.startsAt?.getTime() ?? -Infinity;
    const bStart = b.startsAt?.getTime() ?? -Infinity;
    return bStart > aStart ? b : a;
  });
}

// La próxima tanda que todavía no empezó (para avisar "el precio sube el ...").
export function nextTier(tiers: TierLike[], now: Date): TierLike | null {
  const future = tiers
    .filter((t) => t.startsAt && t.startsAt > now)
    .sort((a, b) => a.startsAt!.getTime() - b.startsAt!.getTime());
  return future[0] ?? null;
}

export function formatUSD(cents: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Guayaquil",
  }).format(date);
}
