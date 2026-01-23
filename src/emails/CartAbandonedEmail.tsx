import { Heading, Section, Text } from "@react-email/components";
import { AppLayout, PrimaryButton } from "./components/AppLayout";

export type CartAbandonedEmailProps = {
  appUrl?: string | null;
};

export default function CartAbandonedEmail({ appUrl }: CartAbandonedEmailProps) {
  const safeAppUrl = appUrl || "https://software-store.local";
  const cartUrl = `${safeAppUrl}/cart`;

  return (
    <AppLayout previewText="Bạn còn sản phẩm trong giỏ hàng" appUrl={safeAppUrl}>
      <Heading style={{ margin: "0 0 12px", fontSize: 22 }}>
        Hoàn tất đơn hàng của bạn
      </Heading>
      <Text style={{ margin: "0 0 10px", color: "#0f172a" }}>
        Bạn vẫn còn sản phẩm trong giỏ. Hoàn tất thanh toán để nhận license ngay.
      </Text>
      <Section style={{ margin: "12px 0 20px" }}>
        <PrimaryButton href={cartUrl} label="Quay lại giỏ hàng" />
      </Section>
      <Text style={{ margin: 0, color: "#475569", fontSize: 14 }}>
        Nếu bạn đã hoàn tất ở thiết bị khác, hãy bỏ qua email này.
      </Text>
    </AppLayout>
  );
}
