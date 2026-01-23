import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  previewText?: string;
  appUrl?: string | null;
};

const baseStyles = {
  body: {
    backgroundColor: "#f5f7fb",
    margin: 0,
    padding: "24px 0",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#0f172a",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    maxWidth: 640,
    padding: "28px 28px 16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
  },
  header: {
    marginBottom: 20,
  },
  footer: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: "18px",
  },
  strong: { fontWeight: 700 },
};

export function AppLayout({ children, previewText, appUrl }: Props) {
  const safeAppUrl = appUrl || "https://software-store.local";

  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.header}>
            <Text style={{ fontSize: 18, margin: 0, color: "#0f172a" }}>
              <span style={baseStyles.strong}>Software Store</span>
            </Text>
            <Text style={{ fontSize: 13, margin: "4px 0 0", color: "#475569" }}>
              Bán phần mềm bản quyền | {safeAppUrl}
            </Text>
          </Section>

          <Section>{children}</Section>

          <Hr style={{ borderColor: "#e2e8f0", margin: "20px 0" }} />
          <Section style={baseStyles.footer}>
            <Text style={{ margin: "0 0 6px" }}>
              Cần hỗ trợ?{" "}
              <Link href={`${safeAppUrl}/support`} style={{ color: "#2563eb" }}>
                Liên hệ đội ngũ Software Store
              </Link>
            </Text>
            <Text style={{ margin: 0 }}>
              Bạn nhận được email này vì đã tạo tài khoản hoặc đặt hàng tại Software Store.
              Nếu không phải bạn, hãy bỏ qua email này.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

type ButtonProps = {
  href: string;
  label: string;
};

export function PrimaryButton({ href, label }: ButtonProps) {
  return (
    <Link
      href={href}
      style={{
        backgroundColor: "#2563eb",
        color: "#ffffff",
        padding: "12px 18px",
        borderRadius: 10,
        textDecoration: "none",
        display: "inline-block",
        fontWeight: 600,
      }}
    >
      {label}
    </Link>
  );
}
