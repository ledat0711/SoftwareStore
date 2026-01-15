import { notFound } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { columns } from "@/components/groups/user/columns";
import { PageWrapper } from "@/components/parts/page-wrapper";
import { getUsers } from "./action";

export default async function Page() {
  const users = await getUsers();
  const { data: usersData, serverError } = users || {};

  // check for errors
  if (!usersData || serverError) notFound();
  
  return (
      <>
        <PageWrapper>
          <DataTable columns={columns} data={usersData} filterColumn="name" createObject={true} />
        </PageWrapper>
      </>
  );
}
