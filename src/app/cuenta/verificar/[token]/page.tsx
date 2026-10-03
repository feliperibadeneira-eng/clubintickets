import Link from "next/link";
import { ShieldCheck, TimerOff } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { confirmBuyerLogin } from "./actions";

export const dynamic = "force-dynamic";

export default async function VerifyBuyerLoginPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const loginToken = await prisma.buyerLoginToken.findUnique({
    where: { id: token },
  });
  const valid =
    loginToken && !loginToken.usedAt && loginToken.expiresAt > new Date();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card className="p-7 text-center">
        {valid ? (
          <>
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <ShieldCheck size={20} />
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight">
              Confirmá tu ingreso
            </h1>
            <p className="mt-1 text-sm text-muted">
              Por tu seguridad, tocá el botón para entrar a tu cuenta.
            </p>
            <form action={confirmBuyerLogin.bind(null, token)} className="mt-5">
              <Button type="submit" className="w-full">
                Entrar a mi cuenta
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-danger-bg text-danger">
              <TimerOff size={20} />
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight">
              Este link ya no sirve
            </h1>
            <p className="mt-1 text-sm text-muted">
              O ya lo usaste antes, o pasaron más de 30 minutos. Pedí uno
              nuevo.
            </p>
            <Link
              href="/cuenta/ingresar"
              className={buttonClasses("primary", "md", "mt-5 w-full")}
            >
              Pedir un link nuevo
            </Link>
          </>
        )}
      </Card>
    </main>
  );
}
