"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/auth";
import { Button, FormMessage, Input, Label } from "@/components/ui";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="current">Actual</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="next">Nueva</Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={6} required />
      </div>
      <FormMessage state={state} />
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        Guardar
      </Button>
    </form>
  );
}
