"use client";

import { useActionState } from "react";
import { refundOrderAction, type RefundState } from "./actions";
import { Button } from "@/components/ui/Button";

export function RefundButton({
  eventId,
  orderId,
}: {
  eventId: string;
  orderId: string;
}) {
  const [state, formAction, pending] = useActionState<RefundState, FormData>(
    refundOrderAction.bind(null, eventId, orderId),
    null,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Reembolsar esta orden? La entrada queda invalidada y ya no se va a poder escanear en la puerta. Esto no se puede deshacer desde acá.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? "Reembolsando…" : "Reembolsar"}
      </Button>
      {state && "error" in state && (
        <p className="mt-1 text-xs text-danger">{state.error}</p>
      )}
    </form>
  );
}
