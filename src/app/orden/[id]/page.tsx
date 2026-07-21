import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";
import { Countdown } from "./Countdown";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      event: true,
      items: { include: { ticketType: true } },
      tickets: { include: { ticketType: true } },
    },
  });
  if (!order) notFound();

  // Si la reserva venció y nadie la marcó todavía, mostrarla como expirada.
  const isExpired =
    order.status === "EXPIRED" ||
    (order.status === "PENDING" && order.expiresAt <= new Date());

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <p className="text-sm text-neutral-500">{order.event.name}</p>

      {isExpired ? (
        <>
          <h1 className="text-3xl font-bold">La reserva expiró</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Pasaron más de 10 minutos sin completar el pago, así que las
            entradas volvieron a estar disponibles para otras personas. Podés
            empezar de nuevo cuando quieras.
          </p>
          <Link
            href={`/e/${order.event.slug}`}
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-85"
          >
            Volver al evento
          </Link>
        </>
      ) : order.status === "PENDING" ? (
        <>
          <h1 className="text-3xl font-bold">¡Entradas reservadas!</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Tenés{" "}
            <Countdown expiresAtMs={order.expiresAt.getTime()} /> para
            completar el pago. Pasado ese tiempo, la reserva se libera.
          </p>

          <ul className="mt-6 space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
              >
                <span>
                  {item.quantity} × {item.ticketType.name}
                  {item.tierName && (
                    <span className="ml-2 text-xs text-neutral-500">
                      {item.tierName}
                    </span>
                  )}
                </span>
                <span className="font-medium">
                  {formatUSD(item.unitPriceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-xl font-bold">
            Total: {formatUSD(order.totalCents)}
          </p>

          <section className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-500">
              Asistentes
            </h2>
            <ul className="mt-2 space-y-1 text-sm">
              {order.tickets.map((t) => (
                <li key={t.id} className="flex justify-between">
                  <span>{t.attendeeName}</span>
                  <span className="text-neutral-500">
                    {t.ticketType.name} · {t.attendeeIdNumber}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-8 rounded-xl border border-dashed border-neutral-300 p-6 text-center text-neutral-500 dark:border-neutral-700">
            Próximo paso en construcción: pago con PayPhone (sandbox).
          </div>
        </>
      ) : order.status === "PAID" ? (
        <>
          <h1 className="text-3xl font-bold">¡Gracias por tu compra!</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Tu pago está confirmado. Pronto vas a recibir tus entradas en{" "}
            <strong>{order.buyerEmail}</strong>.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold">Orden no disponible</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Esta orden fue cancelada o reembolsada.
          </p>
        </>
      )}
    </main>
  );
}
