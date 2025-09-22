export default async function OrgPage({ params }: PageProps<"/o/[org-slug]">) {
  const { "org-slug": orgSlug } = await params;

  return <div>Organization Page: {orgSlug}</div>;
}
