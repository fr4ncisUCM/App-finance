"use client";

import { useActionState, useEffect, useRef } from "react";
import { addPosition } from "@/app/actions/portfolio";
import { Button, FormMessage, Input, Label } from "@/components/ui";

export function PositionForm({ symbol, price, today }: { symbol?: string; price?: number | null; today: string }) {
  const [state, action, pending] = useActionState(addPosition, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-1">
        <Label htmlFor="symbol">Símbolo</Label>
        <Input id="symbol" name="symbol" defaultValue={symbol} placeholder="AAPL" autoCapitalize="characters" required />
      </div>
      <div>
        <Label htmlFor="shares">Cantidad</Label>
        <Input id="shares" name="shares" type="number" step="any" min="0" placeholder="10" required />
      </div>
      <div>
        <Label htmlFor="price">Precio por unidad</Label>
        <Input id="price" name="price" type="number" step="any" min="0" defaultValue={price ?? undefined} required />
      </div>
      <div>
        <Label htmlFor="fees">Comisiones</Label>
        <Input id="fees" name="fees" type="number" step="any" min="0" placeholder="0" />
      </div>
      <div>
        <Label htmlFor="boughtOn">Fecha</Label>
        <Input id="boughtOn" name="boughtOn" type="date" defaultValue={today} max={today} required />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Guardando…" : "Guardar compra"}
        </Button>
      </div>
      <div className="sm:col-span-2 lg:col-span-6">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Input id="notes" name="notes" placeholder="Por qué la compré, broker…" maxLength={300} />
      </div>
      <div className="sm:col-span-2 lg:col-span-6">
        <FormMessage state={state} />
        <p className="text-xs text-muted">El precio y las comisiones van en la moneda en la que cotiza el valor (dólares para EE. UU., euros para Madrid…).</p>
      </div>
    </form>
  );
}
