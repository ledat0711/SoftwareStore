import EditForm from "@/components/groups/user/edit-form";
import { PageWrapper } from "@/components/parts/page-wrapper";
import { getUserById } from "../../action";
import { notFound } from "next/navigation";


export default async function Page(props: { params: Promise<{ id: string }> }) {
  // fetch endpoint data
  const params = await props.params
  const user = await getUserById({ id: params.id });
  const { data: userData, serverError } = user || {};

  // check for errors
  if (!userData || serverError) notFound();

  return (
    <>
      <PageWrapper>
          <div className="max-w-2xl">
            <EditForm id={params.id} user={userData} />
          </div>
      </PageWrapper>
    </>
  );
}
