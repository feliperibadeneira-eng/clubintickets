import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { eventsForOrganization } from "@/lib/checkin";
import { Scanner } from "./Scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/staff/login");

  const events = await eventsForOrganization(user.organizationId);

  if (events.length === 0) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 text-center text-neutral-500">
        Todavía no hay ningún evento creado para escanear.
      </main>
    );
  }

  return <Scanner events={events} staffName={user.name} />;
}
