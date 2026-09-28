"use client";

import { useActionState } from "react";
import { KeyRound, UserX, UserCheck as UserCheckIcon } from "lucide-react";
import {
  setStaffActiveAction,
  resetPasswordAction,
  type SimpleState,
  type ResetPasswordState,
} from "./actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type StaffData = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

export function StaffRow({ staff }: { staff: StaffData }) {
  const [toggleState, toggleAction, toggling] = useActionState<
    SimpleState,
    FormData
  >(setStaffActiveAction.bind(null, staff.id, !staff.active), null);
  const [resetState, resetAction, resetting] = useActionState<
    ResetPasswordState,
    FormData
  >(resetPasswordAction.bind(null, staff.id), null);

  return (
    <div className="rounded-xl border border-border bg-background-alt p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {staff.name}
            {!staff.active && (
              <span className="ml-2">
                <Badge tone="neutral">Desactivada</Badge>
              </span>
            )}
          </p>
          <p className="text-sm text-muted">{staff.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={resetAction}>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={resetting}
            >
              <KeyRound size={14} />
              Nueva contraseña
            </Button>
          </form>
          <form action={toggleAction}>
            <Button
              type="submit"
              size="sm"
              variant={staff.active ? "danger" : "secondary"}
              disabled={toggling}
            >
              {staff.active ? <UserX size={14} /> : <UserCheckIcon size={14} />}
              {staff.active ? "Desactivar" : "Reactivar"}
            </Button>
          </form>
        </div>
      </div>

      {toggleState && "error" in toggleState && (
        <p className="mt-2 text-sm text-danger">{toggleState.error}</p>
      )}

      {resetState && "error" in resetState && (
        <p className="mt-2 text-sm text-danger">{resetState.error}</p>
      )}
      {resetState && "ok" in resetState && (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">
          <p className="text-accent">
            Nueva contraseña — pasásela ahora, no se vuelve a mostrar:
          </p>
          <p className="mt-1 font-mono text-base tracking-wide">
            {resetState.password}
          </p>
        </div>
      )}
    </div>
  );
}
