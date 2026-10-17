import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RequestResetForm } from "./RequestResetForm";

export const dynamic = "force-dynamic";

export default function RequestResetPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card className="p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <KeyRound size={20} />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Recuperar contraseña
        </h1>
        <p className="mt-1 text-sm text-muted">
          Escribe el email de tu cuenta de organizador o de staff.
        </p>
        <RequestResetForm />
        <p className="mt-5 text-center text-sm text-muted">
          <Link href="/login" className="text-accent hover:underline">
            Volver a ingresar
          </Link>
        </p>
      </Card>
    </main>
  );
}
