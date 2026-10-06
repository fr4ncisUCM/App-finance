import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SetupProblemCard } from "@/components/setup-problem";
import { findSetupProblem } from "@/lib/setup-check";
import { hasUsers } from "@/lib/users";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  await connection(); // depende de la BD: no prerenderizar en el build
  const problem = await findSetupProblem();
  if (problem) return <SetupProblemCard problem={problem} />;
  if (!(await hasUsers())) redirect("/setup");
  return <LoginForm />;
}
