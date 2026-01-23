import { Heading, Section, Text } from "@react-email/components";
import { AppLayout, PrimaryButton } from "./components/AppLayout";

export type OrderSuccessEmailProps = {
  orderCode: string;
  orderId: string;
  total: number;
  appUrl?: string | null;
};

export default function OrderSuccessEmail({
  orderCode,
  orderId,
  total,
  appUrl,
}: OrderSuccessEmailProps) {
  const safeAppUrl = appUrl || "https://softwarestore.work.gd";
  const orderUrl = `${safeAppUrl}/orders/${orderId}`;
  const totalFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);

  return (
    <AppLayout
      previewText={`Đơn hàng ${orderCode} đã thanh toán thành công`}
      appUrl={safeAppUrl}
    >
      <Heading style={{ margin: "0 0 12px", fontSize: 22 }}>
        Cảm ơn bạn đã mua phần mềm!
      </Heading>
      <Text style={{ margin: "0 0 8px", color: "#0f172a" }}>
        Đơn hàng <strong>{orderCode}</strong> đã thanh toán thành công.
      </Text>
      <Text style={{ margin: "0 0 16px", color: "#0f172a" }}>
        Tổng thanh toán: <strong>{totalFormatted}</strong>.
      </Text>
      <Section style={{ margin: "12px 0 20px" }}>
        <PrimaryButton href={orderUrl} label="Xem chi tiết đơn hàng" />
      </Section>
      <Text style={{ margin: 0, color: "#475569", fontSize: 14 }}>
        Nếu bạn không thực hiện giao dịch này, hãy liên hệ chúng tôi ngay để
        được hỗ trợ.
      </Text>
    </AppLayout>
  );
}
