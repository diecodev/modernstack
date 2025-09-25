import { headers } from "next/headers";
import { SidebarTrigger } from "@/components/animate-ui/components/radix/sidebar";
import { TypedLink } from "@/components/typed-link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { getProjects } from "@/server/get-projects";
import { AddFile } from "../../components/add-file";

export default async function OrganizationLayout({
  children,
  params,
}: LayoutProps<"/o/[org-slug]/p/[name]">) {
  const { name, "org-slug": orgSlug } = await params;
  const projects = await getProjects({ headers: await headers() });
  const parsedName = decodeURIComponent(name);
  const project = projects.find((p) => p.name.toLowerCase() === parsedName);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          className="mr-2 data-[orientation=vertical]:h-4"
          orientation="vertical"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="md:block">
              <BreadcrumbLink asChild>
                <TypedLink
                  href="/o/[org-slug]/p/[name]"
                  params={{
                    "org-slug": orgSlug,
                    name: project?.name.toLowerCase() ?? "",
                  }}
                >
                  {project?.name}
                </TypedLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {/* <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Data Fetching</BreadcrumbPage>
            </BreadcrumbItem> */}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <AddFile projectId={project?.id || ""} />
        </div>
      </header>
      {children}
    </>
  );
}
