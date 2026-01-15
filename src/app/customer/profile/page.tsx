import EditForm from "@/components/groups/user/edit-form";
import { PageWrapper } from "@/components/parts/page-wrapper";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { Session } from "next-auth";
import { getUserById } from "@/app/admin/users/action";

export default async function Page() {
    const session: Session | null = await auth();

    const idUser = session?.user.id || "";
    const user = await getUserById({ id: idUser });
    const { data: userData, serverError } = user || {};

  // check for errors
  if (!userData || serverError) notFound();

  return (
    <>
      <PageWrapper>
        <dl className="max-w-md text-heading divide-y divide-default">
            <div className="flex flex-col pb-3">
                <dt className="mb-1 text-body">Name</dt>
                <dd className="text-lg font-medium">{userData.name}</dd>
            </div>
            <div className="flex flex-col py-3">
                <dt className="mb-1 text-body">Email</dt>
                <dd className="text-lg font-medium">{userData.email}</dd>
            </div>
        </dl>
      </PageWrapper>
    </>
  );
}
