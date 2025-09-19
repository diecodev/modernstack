import { headers as _headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/utils/auth";
import SignInForm from "./components/form";

export default async function SignInPage() {
  const headers = await _headers();

  const session = await auth.api.getSession({
    headers,
  });

  if (!session) {
    return <SignInForm />;
  }

  const org = await auth.api.getFullOrganization({ headers });

  if (org) {
    redirect(`/o/${org.slug}`);
  }

  redirect("/new");
}
