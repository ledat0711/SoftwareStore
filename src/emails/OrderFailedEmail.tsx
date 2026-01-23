import { Heading, Section, Text } from "@react-email/components";
import { AppLayout, PrimaryButton } from "./components/AppLayout";

export type OrderFailedEmailProps = {
  orderCode: string;
  orderId: string;
  total: number;
  appUrl?: string | null;
};

export default function OrderFailedEmail({
  orderCode,
  orderId,
  total,
  appUrl,
}: OrderFailedEmailProps) {
  const safeAppUrl = appUrl || "https://softwarestore.work.gd";
  const orderUrl = `${safeAppUrl}/orders/${orderId}`;
  const totalFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);

  return (
    <AppLayout previewText={`Thanh toán đơn ${orderCode} thất bại`} appUrl={safeAppUrl}>
      <Heading style={{ margin: "0 0 12px", fontSize: 22 }}>Thanh toán thất bại</Heading>
      <Text style={{ margin: "0 0 10px", color: "#0f172a" }}>
        Chúng tôi không thể xử lý thanh toán cho đơn <strong>{orderCode}</strong>.
      </Text>
      <Text style={{ margin: "0 0 12px", color: "#0f172a" }}>
        Giá trị đơn: <strong>{totalFormatted}</strong>. Vui lòng thử lại bằng phương thức khác
        hoặc kiểm tra số dư.
      </Text>
      <Section style={{ margin: "12px 0 20px" }}>
        <PrimaryButton href={orderUrl} label="Thử thanh toán lại" />
      </Section>
      <Text style={{ margin: 0, color: "#475569", fontSize: 14 }}>
        Nếu bạn cần hỗ trợ thêm, hãy trả lời email này hoặc vào trang hỗ trợ của chúng tôi.
      </Text>
    </AppLayout>
  );
}
