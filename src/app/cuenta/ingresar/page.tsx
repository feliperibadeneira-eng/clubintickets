import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { getCurrentBuyer } from "@/lib/buyerAuth";
import { Card } from "@/components/ui/Card";
import { LoginRequestForm } from "./LoginRequestForm";

export const dynamic = "force-dynamic";

export default async function BuyerLoginPage() {
  const buyer = await getCurrentBuyer();
  if (buyer) redirect("/cuenta");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card className="p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <UserRound size={20} />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Mi cuenta</h1>
        <p className="mt-1 text-sm text-muted">
          Escribí el email con el que compraste y te mandamos un link para
          entrar — no hace falta contraseña.
        </p>
        <LoginRequestForm />
      </Card>
    </main>
  );
}
