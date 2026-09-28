import Link from "next/link";
import { requireOrganizer } from "@/lib/auth";
import { listStaff } from "@/lib/staffManagement";
import { StaffManager } from "./StaffManager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const user = await requireOrganizer();
  const staff = await listStaff(user.organizationId);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link
        href="/admin"
        className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        ← Panel del organizador
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        Cuentas de staff
      </h1>
      <p className="mt-1 text-sm text-muted">
        Quienes van a escanear entradas en la puerta. No se pueden borrar
        (para no perder el historial de qué escaneó cada uno) — se
        desactivan en su lugar.
      </p>

      <div className="mt-6">
        <StaffManager staff={staff} />
      </div>
    </main>
  );
}
