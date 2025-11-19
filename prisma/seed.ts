// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* -------------------------------------------------------
   1. Hàm tạo slug tự động
------------------------------------------------------- */
function slugify(str: string) {
  return str
    .normalize("NFD")                           // remove dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")               // replace khoảng trắng, ký tự lạ
    .replace(/(^-|-$)+/g, "");                 // trim
}

/* -------------------------------------------------------
   2. Tất cả sản phẩm – GOM CHUNG 1 MẢNG
------------------------------------------------------- */
const allProducts = [
  // ======= SOFTWARE STORE PRODUCTS ======= //
  {
    id: "win11-pro",
    title: "Windows 11 Pro Key",
    description: "Key bản quyền kích hoạt online.",
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop",
    price: 96,
    rating: 4.8,
    category: "HĐH",
    badge: "Hot",
  },
  {
    id: "office-2021",
    title: "Microsoft Office 2021",
    description: "Word, Excel, PowerPoint vĩnh viễn.",
    image:
      "https://shop.winandoffice.com/australia/wp-content/uploads/2023/12/O21S.jpg",
    price: 196,
    rating: 4.7,
    category: "Văn phòng",
    badge: "Best Seller",
  },
  {
    id: "avast-premium",
    title: "Avast Premium Security",
    description: "Bảo vệ realtime chống malware.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRSvqy3R-fRwU0kHwuVvJsWz99bpfZAXhcVQ&s",
    price: 166,
    rating: 4.5,
    category: "Bảo mật",
    badge: "New",
  },
  {
    id: "vs-code-ext-pack",
    title: "VS Code Extensions Pack",
    description: "Tăng tốc phát triển với bộ extension.",
    image: "https://code.visualstudio.com/assets/branding/code-stable.png",
    price: 49,
    rating: 4.6,
    category: "Dev Tools",
  },
  {
    id: "figma-pro",
    title: "Figma Professional",
    description: "Thiết kế UI/UX cộng tác realtime.",
    image:
      "https://scontent.fdad3-1.fna.fbcdn.net/v/...jpg",
    price: 120,
    rating: 4.9,
    category: "Thiết kế",
  },
  {
    id: "adobe-ps",
    title: "Adobe Photoshop",
    description: "Chỉnh sửa ảnh chuyên nghiệp.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/2/20/Photoshop_CC_icon.png",
    price: 239,
    rating: 4.8,
    category: "Thiết kế",
  },
  {
    id: "jetbrains-idea",
    title: "IntelliJ IDEA Ultimate",
    description: "IDE mạnh mẽ cho Java & hơn thế.",
    image:
      "https://resources.jetbrains.com/.../IntelliJ_IDEA_icon.png",
    price: 299,
    rating: 4.7,
    category: "Dev Tools",
  },
  {
    id: "postman-pro",
    title: "Postman Pro",
    description: "Kiểm thử API cộng tác.",
    image: "https://voyager.postman.com/logo/postman-logo-icon-orange.svg",
    price: 89,
    rating: 4.6,
    category: "Dev Tools",
  },
  {
    id: "notion-plus",
    title: "Notion Plus",
    description: "Workspaces linh hoạt ghi chú & quản lý.",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg",
    price: 75,
    rating: 4.8,
    category: "Năng suất",
  },
  {
    id: "slack-premium",
    title: "Slack Premium",
    description: "Giao tiếp nhóm bảo mật & tìm kiếm tốt.",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/76/Slack_Icon.png",
    price: 130,
    rating: 4.4,
    category: "Năng suất",
  },
];

/* -------------------------------------------------------
   3. SEED FUNCTION
------------------------------------------------------- */
async function main() {
  console.log("🧹 Xóa dữ liệu cũ...");
  await prisma.$executeRaw`DELETE FROM "Product"`;

  console.log("🚀 Seed sản phẩm Software Store...");

  for (const p of allProducts) {
    const slug = slugify(p.title);

    await prisma.product.upsert({
      where: { slug },
      create: {
        id: p.id,
        slug,
        title: p.title,
        description: p.description,
        image: p.image,
        price: p.price,
        rating: p.rating,
        category: p.category,
        badge: p.badge ?? null,
        department: "Software",
        platform: "All",
      },
      update: {},
    });
  }

  console.log("🎉 Seed thành công!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
