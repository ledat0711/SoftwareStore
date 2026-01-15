import { notFound } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { columns } from "@/components/groups/order/columns";
import { PageWrapper } from "@/components/parts/page-wrapper";
import { getOrders } from "../action";

export default async function Page() {
      const orders = await getOrders();
      const { data: ordersData, serverError } = orders || {};

       if (!ordersData || serverError) notFound();

  return (
      <>
        <PageWrapper>
          <DataTable columns={columns} data={ordersData} filterColumn="totalAmount" createObject={false} isActive={true} onHandleActive={() => {}} />
        </PageWrapper>
      </>
  );
}
