import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentTier } from "@/lib/pricing";
import { CheckoutForm, type CheckoutItem } from "./CheckoutForm";

export const dynamic = "force-dynamic";

// Paso 3: datos del comprador y de cada asistente (entradas nominativas).
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
  const items: CheckoutItem[] = (sel ?? "")
    .split(",")
    .map((pair) => {
      const [id, qtyRaw] = pair.split(":");
      const ticketType = event.ticketTypes.find((tt) => tt.id === id);
      const qty = Number(qtyRaw);
      if (!ticketType || !Number.isInteger(qty) || qty <= 0) return null;
      const tier = currentTier(ticketType.priceTiers, now);
      if (!tier) return null;
      return {
        ticketTypeId: ticketType.id,
        name: ticketType.name,
        quantity: Math.min(qty, 10),
        groupSize: ticketType.groupSize,
        unitPriceCents: tier.priceCents,
      };
    })
    .filter((i) => i !== null);

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold">Nada seleccionado</h1>
        <Link
          href={`/e/${slug}`}
          className="mt-4 inline-block underline underline-offset-4"
        >
          ← Volver al evento
        </Link>
      </main>
    );
  }

  const totalCents = items.reduce(
    (sum, i) => sum + i.unitPriceCents * i.quantity,
    0,
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold">Datos de los asistentes</h1>
      <p className="mt-1 text-sm text-neutral-500">{event.name}</p>

      <CheckoutForm eventSlug={slug} items={items} totalCents={totalCents} />

      <Link
        href={`/e/${slug}`}
        className="mt-6 inline-block text-sm underline underline-offset-4"
      >
        ← Cambiar mi selección
      </Link>
    </main>
  );
}
