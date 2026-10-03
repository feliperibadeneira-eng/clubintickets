import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { getCurrentBuyer } from "@/lib/buyerAuth";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function BuyerRegisterPage() {
  const buyer = await getCurrentBuyer();
  if (buyer) redirect("/cuenta");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card className="p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <UserPlus size={20} />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Creá tu cuenta
        </h1>
        <p className="mt-1 text-sm text-muted">
          No hace falta haber comprado una entrada todavía.
        </p>
        <RegisterForm />
        <p className="mt-5 text-center text-sm text-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/cuenta/ingresar" className="text-accent hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </Card>
    </main>
  );
}
