"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "./ui";

/** Botón de envío que se desactiva y muestra un spinner mientras el formulario se procesa. */
export function SubmitButton({
  children,
  confirmMessage,
  ...props
}: ComponentProps<typeof Button> & { confirmMessage?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || props.disabled}
      onClick={(e) => {
        if (confirmMessage && !confirm(confirmMessage)) e.preventDefault();
      }}
      {...props}
    >
      {pending ? <Loader2 size={18} className="animate-spin" /> : children}
    </Button>
  );
}
