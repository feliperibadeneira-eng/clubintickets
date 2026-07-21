import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentTier, formatUSD } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Placeholder del paso 3 (datos del comprador) — todavía en construcción.
// Por ahora solo muestra el resumen de lo seleccionado.
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sel?: string }>;
}) {
  const { slug } = await params;
  const { sel } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { ticketTypes: { include: { priceTiers: true } } },
  });
  if (!event) notFound();

  const now = new Date();
  const selection = (sel ?? "")
    .split(",")
    .map((pair) => {
      const [id, qtyRaw] = pair.split(":");
      const ticketType = event.ticketTypes.find((tt) => tt.id === id);
      const qty = Number(qtyRaw);
      if (!ticketType || !Number.isInteger(qty) || qty <= 0) return null;
      const tier = currentTier(ticketType.priceTiers, now);
      if (!tier) return null;
      return { ticketType, qty: Math.min(qty, 10), tier };
    })
    .filter((s) => s !== null);

  const totalCents = selection.reduce(
    (sum, s) => sum + s.tier.priceCents * s.qty,
    0,
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Tu selección</h1>
      <p className="mt-1 text-sm text-neutral-500">{event.name}</p>

      <ul className="mt-6 space-y-2">
        {selection.map((s) => (
          <li
            key={s.ticketType.id}
            className="flex justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <span>
              {s.qty} × {s.ticketType.name}
            </span>
            <span className="font-medium">
              {formatUSD(s.tier.priceCents * s.qty)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-right text-xl font-bold">
        Total: {formatUSD(totalCents)}
      </p>

      <div className="mt-8 rounded-xl border border-dashed border-neutral-300 p-6 text-center text-neutral-500 dark:border-neutral-700">
        Próximo paso en construcción: datos de los asistentes (nombre y
        cédula) y pago con PayPhone.
      </div>

      <Link
        href={`/e/${slug}`}
        className="mt-6 inline-block text-sm underline underline-offset-4"
      >
        ← Volver al evento
      </Link>
    </main>
  );
}
