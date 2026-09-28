import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function StaffLoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/staff/scan");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold">Ingreso de staff</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Usá el usuario y la contraseña que te dio el organizador.
      </p>
      <LoginForm />
    </main>
  );
}
