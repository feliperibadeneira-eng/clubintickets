import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, TimerOff, XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { Countdown } from "./Countdown";
import { TestPaymentButton } from "./TestPaymentButton";

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
      <p className="text-sm text-muted">{order.event.name}</p>

      {isExpired ? (
        <>
          <div className="mt-2 flex items-center gap-2.5">
            <TimerOff className="text-danger" size={26} />
            <h1 className="text-3xl font-bold tracking-tight">
              La reserva expiró
            </h1>
          </div>
          <p className="mt-3 text-muted">
            Pasaron más de 10 minutos sin completar el pago, así que las
            entradas volvieron a estar disponibles para otras personas. Podés
            empezar de nuevo cuando quieras.
          </p>
          <Link
            href={`/e/${order.event.slug}`}
            className={buttonClasses("primary", "lg", "mt-6")}
          >
            Volver al evento
          </Link>
        </>
      ) : order.status === "PENDING" ? (
        <>
          <div className="mt-2 flex items-center gap-2.5">
            <Clock className="text-accent" size={26} />
            <h1 className="text-3xl font-bold tracking-tight">
              ¡Entradas reservadas!
            </h1>
          </div>
          <p className="mt-3 text-muted">
            Tenés{" "}
            <span className="font-semibold text-foreground">
              <Countdown expiresAtMs={order.expiresAt.getTime()} />
            </span>{" "}
            para completar el pago. Pasado ese tiempo, la reserva se libera.
          </p>

          <ul className="mt-6 space-y-2">
            {order.items.map((item) => (
              <li key={item.id}>
                <Card className="flex justify-between py-3">
                  <span>
                    {item.quantity} × {item.ticketType.name}
                    {item.tierName && (
                      <span className="ml-2 text-xs text-muted">
                        {item.tierName}
                      </span>
                    )}
                  </span>
                  <span className="font-medium">
                    {formatUSD(item.unitPriceCents * item.quantity)}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-xl font-bold">
            Total: {formatUSD(order.totalCents)}
          </p>

          <Card className="mt-4">
            <h2 className="text-sm font-semibold text-muted">Asistentes</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {order.tickets.map((t) => (
                <li key={t.id} className="flex justify-between">
                  <span>{t.attendeeName}</span>
                  <span className="text-muted">
                    {t.ticketType.name} · {t.attendeeIdNumber}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {process.env.NODE_ENV === "production" ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-muted">
              El cobro con PayPhone todavía se está configurando. Mientras
              tanto, esta orden queda reservada — escribinos si necesitás
              completar el pago.
            </div>
          ) : (
            <TestPaymentButton orderId={order.id} />
          )}
        </>
      ) : order.status === "PAID" ? (
        <>
          <div className="mt-2 flex items-center gap-2.5">
            <CheckCircle2 className="text-success" size={26} />
            <h1 className="text-3xl font-bold tracking-tight">
              ¡Gracias por tu compra!
            </h1>
          </div>
          {order.emailSentAt ? (
            <p className="mt-3 text-muted">
              Tu pago está confirmado y te mandamos tus entradas a{" "}
              <strong className="text-foreground">{order.buyerEmail}</strong>.
            </p>
          ) : (
            <p className="mt-3 rounded-xl border border-warning/25 bg-warning-bg p-3 text-sm text-warning">
              Tu pago está confirmado, pero no pudimos enviarte el email con
              las entradas. No hay problema: podés verlas y guardarlas desde
              acá abajo.
            </p>
          )}

          <ul className="mt-6 space-y-2">
            {order.items.map((item) => (
              <li key={item.id}>
                <Card className="flex justify-between py-3">
                  <span>
                    {item.quantity} × {item.ticketType.name}
                  </span>
                  <span className="font-medium">
                    {formatUSD(item.unitPriceCents * item.quantity)}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-xl font-bold">
            Total: {formatUSD(order.totalCents)}
          </p>

          <Card className="mt-4">
            <h2 className="text-sm font-semibold text-muted">
              Tus entradas
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.tickets.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span>
                    {t.attendeeName}
                    <span className="ml-2 text-muted">
                      {t.ticketType.name} · {t.attendeeIdNumber}
                    </span>
                  </span>
                  <Link
                    href={`/t/${t.qrToken}`}
                    className={buttonClasses("secondary", "sm", "shrink-0")}
                  >
                    Ver entrada
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2.5">
            <XCircle className="text-danger" size={26} />
            <h1 className="text-3xl font-bold tracking-tight">
              Orden no disponible
            </h1>
          </div>
          <p className="mt-3 text-muted">
            Esta orden fue cancelada o reembolsada.
          </p>
        </>
      )}
    </main>
  );
}
