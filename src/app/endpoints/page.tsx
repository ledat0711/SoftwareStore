import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/parts/breadcrumbs";
import { DataTable } from "@/components/data-table";
import { columns } from "@/components/groups/users/columns";
import { PageWrapper } from "@/components/parts/page-wrapper";
import { getUsers } from "./action";

const pageData = {
  name: "Endpoints",
  title: "Endpoints",
  description: "All your existing endpoints",
};

export default async function Page() {
  // const endpoints = await getUsers();
  // const { data: endpointsData, serverError } = endpoints || {};

  const users = await getUsers();
  const { data: usersData, serverError } = users || {};

  // check for errors
  if (!usersData || serverError) notFound();

  return (
      <>
        <PageWrapper>
          <DataTable columns={columns} data={usersData} createObject={true} />
        </PageWrapper>
      </>
  );
}
