import { notFound } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { columns } from "@/components/groups/order-detail/columns";
import { PageWrapper } from "@/components/parts/page-wrapper";
import { getOrderItems } from "@/app/customer/action";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const orderItems = await getOrderItems({ id: params.id });

  const { data: orderItemsData, serverError } = orderItems || {};

  if (!orderItemsData || serverError) notFound();

  return (
      <>
        <PageWrapper>
          <DataTable columns={columns} data={orderItemsData} filterColumn="title" createObject={false} />
        </PageWrapper>
      </>
  );
}
