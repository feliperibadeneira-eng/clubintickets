import Link from "next/link";
import { KeyRound, TimerOff } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { id: token },
  });
  const valid =
    resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card className="p-7">
        {valid ? (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <KeyRound size={20} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              Elige tu contraseña nueva
            </h1>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-bg text-danger">
              <TimerOff size={20} />
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight">
              Este link ya no sirve
            </h1>
            <p className="mt-1 text-sm text-muted">
              O ya lo usaste antes, o pasaron más de 30 minutos. Pide uno
              nuevo.
            </p>
            <Link
              href="/login/recuperar"
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
