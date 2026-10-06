import { redirect } from "next/navigation";
import { connection } from "next/server";
import { hasUsers } from "@/lib/users";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  await connection(); // depende de la BD: no prerenderizar en el build
  if (!(await hasUsers())) redirect("/setup");
  return <LoginForm />;
}
