// During the early development stage, seed data is useful for quickly generating test records.
// Once all CRUD features are fully implemented, seeding should no longer be used, as it may
// introduce inconsistencies or break relational links within the dataset.
import type { Product } from "@/types/product";
import {
  deleteAllProducts,
  disconnectPrisma,
  upsertProductFromSeed,
} from "../src/lib/prisma";

type SeedProduct = Omit<Product, "category" | "platform">;

/* -------------------------------------------------------
   1. Tạo ra mảng danh sách sản phẩm mẫu
------------------------------------------------------- */
const allProducts: SeedProduct[] = [
  // ======= SOFTWARE STORE PRODUCTS ======= //
  {
    id: "win11-pro",
    title: "Windows 11 Pro Key",
    slug: "windows-11-pro-key",
    description: "Key bản quyền kích hoạt online.",
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop",
    price: 96,
    rating: 4.8,
    tag: "HĐH",
    badge: "Hot",
    hidden: false,
  },
  {
    id: "office-2021",
    title: "Microsoft Office 2021",
    slug: "microsoft-office-2021",
    description: "Word, Excel, PowerPoint vĩnh viễn.",
    image:
      "https://duhung.vn/wp-content/uploads/2024/01/Microsoft-Office-2021-Professional-Plus.jpg",
    price: 196,
    rating: 4.7,
    tag: "Văn phòng",
    badge: "Best Seller",
    hidden: false,
  },
  {
    id: "avast-premium",
    title: "Avast Premium Security",
    slug: "avast-premium-security",
    description: "Bảo vệ realtime chống malware.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRSvqy3R-fRwU0kHwuVvJsWz99bpfZAXhcVQ&s",
    price: 166,
    rating: 4.5,
    tag: "Bảo mật",
    badge: "New",
    hidden: false,
  },
  {
    id: "vs-code-ext-pack",
    title: "VS Code Extensions Pack",
    slug: "vs-code-extensions-pack",
    description: "Tăng tốc phát triển với bộ extension.",
    image: "https://code.visualstudio.com/assets/branding/code-stable.png",
    price: 49,
    rating: 4.6,
    tag: "Dev Tools",
    badge: "Featured",
    hidden: false,
  },
  {
    id: "figma-pro",
    title: "Figma Professional",
    slug: "figma-professional",
    description: "Thiết kế UI/UX.",
    image:
      "https://digimarket.com.vn/wp-content/uploads/2024/08/figma-professional.webp",
    price: 120,
    rating: 4.9,
    tag: "Thiết kế",
    badge: "Featured",
    hidden: false,
  },
  {
    id: "adobe-ps",
    title: "Adobe Photoshop",
    slug: "adobe-photoshop",
    description: "Chỉnh sửa ảnh chuyên nghiệp.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/2/20/Photoshop_CC_icon.png",
    price: 239,
    rating: 4.8,
    tag: "Thiết kế",
    badge: "Popular",
    hidden: false,
  },
  {
    id: "jetbrains-idea",
    title: "IntelliJ IDEA Ultimate",
    slug: "intellij-idea-ultimate",
    description: "IDE mạnh mẽ cho Java & hơn thế.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/IntelliJ_IDEA_Icon.svg/768px-IntelliJ_IDEA_Icon.svg.png?20200803071016",
    price: 299,
    rating: 4.7,
    tag: "Dev Tools",
    badge: "Featured",
    hidden: false,
  },
  {
    id: "postman-pro",
    title: "Postman Pro",
    slug: "postman-pro",
    description: "Kiểm thử API.",
    image: "https://voyager.postman.com/logo/postman-logo-icon-orange.svg",
    price: 89,
    rating: 4.6,
    tag: "Dev Tools",
    badge: "Featured",
    hidden: false,
  },
  {
    id: "notion-plus",
    title: "Notion Plus",
    slug: "notion-plus",
    description: "Workspaces linh hoạt ghi chú & quản lý.",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg",
    price: 75,
    rating: 4.8,
    tag: "Năng suất",
    badge: "Featured",
    hidden: false,
  },
  {
    id: "slack-premium",
    title: "Slack Premium",
    slug: "slack-premium",
    description: "Giao tiếp nhóm bảo mật & tìm kiếm tốt.",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/76/Slack_Icon.png",
    price: 130,
    rating: 4.4,
    tag: "Năng suất",
    badge: "Popular",
    hidden: false,
  },
];

/* -------------------------------------------------------
   2. SEED FUNCTION
------------------------------------------------------- */
async function main() {
  console.log("🧹 Xóa dữ liệu cũ...");
  await deleteAllProducts();

  console.log("🚀 Seed sản phẩm Software Store...");

  for (const p of allProducts) {
    await upsertProductFromSeed({
      ...p,
      badge: p.badge ?? null,
      category: "Software",
      platform: "All",
    });
  }

  console.log("🎉 Seed thành công!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
