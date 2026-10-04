import Link from "next/link";
import { CalendarDays, LogOut, Ticket as TicketIcon, UserRound } from "lucide-react";
import { requireBuyer } from "@/lib/buyerAuth";
import { getBuyerOrders } from "@/lib/buyers";
import { formatEventDate, formatUSD } from "@/lib/pricing";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { buyerLogout } from "./actions";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

const statusLabel: Record<
  string,
  { text: string; tone: "success" | "neutral" | "warning" | "danger" }
> = {
  PAID: { text: "Pagada", tone: "success" },
  PENDING: { text: "Pago pendiente", tone: "warning" },
  EXPIRED: { text: "Expirada", tone: "neutral" },
  CANCELLED: { text: "Cancelada", tone: "danger" },
  REFUNDED: { text: "Reembolsada", tone: "danger" },
};

export default async function BuyerAccountPage() {
  const buyer = await requireBuyer();
  const orders = await getBuyerOrders(buyer.email);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mi cuenta</h1>
        <form action={buyerLogout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <LogOut size={15} />
            Salir
          </button>
        </form>
      </div>

      <Card className="mt-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <UserRound size={16} />
          Tu perfil
        </div>
        <ProfileForm name={buyer.name} email={buyer.email} />
      </Card>

      <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold text-muted">
        <TicketIcon size={16} />
        Tus compras
      </h2>

      {orders.length === 0 ? (
        <Card className="mt-3 text-center text-sm text-muted">
          Todavía no tienes compras con este email.
        </Card>
      ) : (
        <ul className="mt-3 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Card className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{o.eventName}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted">
                    <CalendarDays size={13} />
                    {formatEventDate(o.eventStartsAt)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge tone={statusLabel[o.status]?.tone ?? "neutral"}>
                      {statusLabel[o.status]?.text ?? o.status}
                    </Badge>
                    <span className="text-xs text-muted">
                      {o.ticketCount} entrada{o.ticketCount === 1 ? "" : "s"} ·{" "}
                      {formatUSD(o.totalCents)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/orden/${o.id}`}
                  className={buttonClasses("secondary", "sm", "shrink-0")}
                >
                  Ver
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
