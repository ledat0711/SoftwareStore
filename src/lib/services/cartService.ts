import prisma from "@/lib/prisma";
import { emailService } from "@/lib/email/emailService";

// ý chính là: Bao lâu cart được coi là bỏ (24h)
const ABANDON_THRESHOLD_HOURS = 24;

export const cartService = {
  async markCheckedOut(cartId: string) {
    return prisma.cart.update({
      where: { id: cartId },
      data: { checkedOut: true, checkedOutAt: new Date() },
    });
  },

  async sendAbandonedCartEmails(limit = 100) {
    // Tạo ra một mốc thời gian gọi là cutoff = thời điểm hiện tại trừ đi [...] giờ , ở đây là 24 giờ
    // Date.now(): Số milliseconds tính từ 01/01/1970 đến hiện tại
    // ABANDON_THRESHOLD_HOURS * 60 * 60 * 1000: Chuyển số giờ → số milliseconds
    // 24 giờ = 24 * 60 * 60 * 1000 ms = 86 400 000 ms
    const cutoff = new Date(
      Date.now() - ABANDON_THRESHOLD_HOURS * 60 * 60 * 1000,
    );

    const carts = await prisma.cart.findMany({
      where: {
        checkedOut: false,
        abandonedEmailSentAt: null,
        // Chỉ lấy cart có updatedAt nhỏ hơn hoặc bằng cutoff
        // Chỉ lấy cart không bị đụng tới trong ít nhất 24 giờ
        // chú ý ở đây dùng updatedAt không phải createdAt, tức là không thêm sửa xóa cart trong 24 giờ
        updatedAt: { lte: cutoff },
        OR: [{ email: { not: null } }, { user: { isNot: null } }],
      },
      // include: dữ liệu trả về có kèm theo thông tin user
      include: {
        user: { select: { id: true, email: true } },
      },
      take: limit,
    });

    let sent = 0;
    for (const cart of carts) {
      const recipient = cart.email ?? cart.user?.email;
      if (!recipient) continue;

      try {
        await emailService.sendCartAbandoned({
          cartId: cart.id,
          to: recipient,
          userId: cart.userId,
        });

        await prisma.cart.update({
          where: { id: cart.id },
          data: { abandonedEmailSentAt: new Date() },
        });
        sent += 1;
      } catch (error) {
        console.error("[cartService] cart-abandoned email failed", {
          cartId: cart.id,
          error,
        });
      }
    }

    return { processed: carts.length, sent };
  },
};
