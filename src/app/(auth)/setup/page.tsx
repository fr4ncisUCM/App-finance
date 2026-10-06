import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SetupProblemCard } from "@/components/setup-problem";
import { findSetupProblem } from "@/lib/setup-check";
import { hasUsers } from "@/lib/users";
import { SetupForm } from "./setup-form";

export const metadata = { title: "Configuración inicial" };

export default async function SetupPage() {
  await connection(); // depende de la BD: no prerenderizar en el build
  const problem = await findSetupProblem();
  if (problem) return <SetupProblemCard problem={problem} />;
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
