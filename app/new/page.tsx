import { headers } from "next/headers";
import { Suspense } from "react";
import { LogoIcon } from "@/components/icons/logo";
import { auth } from "@/utils/auth";
import { NewOrganizationForm } from "./components/form";

function Pending() {
  return (
    <div className="flex min-h-svh min-w-svw flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <LogoIcon className="size-14 animate-pulse" />
      </div>
    </div>
  );
}
export const getUser = async () => {
  "use server";
  const _data = auth.api.getSession({
    headers: await headers(),
  });
  const _organization = auth.api.getFullOrganization({
    headers: await headers(),
  });

  const [data, organization] = await Promise.all([_data, _organization]);

  return { data: { ...data, organization } };
};

export default function NewOrganizationPage() {
  const user = getUser();

  return (
    <Suspense fallback={<Pending />}>
      <NewOrganizationForm user={user} />
    </Suspense>
  );
}
