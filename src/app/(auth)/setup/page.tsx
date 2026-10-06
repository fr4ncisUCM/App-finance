import { redirect } from "next/navigation";
import { connection } from "next/server";
import { hasUsers } from "@/lib/users";
import { SetupForm } from "./setup-form";

export const metadata = { title: "Configuración inicial" };

export default async function SetupPage() {
  await connection(); // depende de la BD: no prerenderizar en el build
  if (await hasUsers()) redirect("/login");
  return (
    <>
      <p className="mb-6 text-center text-sm text-muted">
        Primera vez: crea la cuenta de administrador. Después podrás crear el resto de usuarios desde Ajustes.
      </p>
      <SetupForm />
    </>
  );
}
