"use client";

import type { ComponentProps } from "react";
import { SubmitButton } from "./submit-button";
import type { Button } from "./ui";

/** Botón de envío que pide confirmación antes de mandar el formulario. */
export function ConfirmButton({ message, ...props }: { message: string } & ComponentProps<typeof Button>) {
  return <SubmitButton confirmMessage={message} {...props} />;
}
