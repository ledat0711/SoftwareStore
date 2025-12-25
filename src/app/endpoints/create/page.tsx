import CreateForm from "@/components/groups/users/create-form";
import { PageWrapper } from "@/components/parts/page-wrapper";

export default async function Page() {
  return (
    <>
      <PageWrapper>
        <div className="max-w-2xl">
          <CreateForm />
        </div>
      </PageWrapper>
    </>
  );
}
