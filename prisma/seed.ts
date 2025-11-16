// dùng để tự động thêm dữ liệu khởi tạo vào database sau khi chạy migration

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  department: "Apps" | "Games";
  platform: "PC" | "Mobile";
};

const originProducts: Product[] = [
  {
    id: "1",
    title: "HEVC Video Extensions",
    price: 0.99,
    image: "https://store-images.s-microsoft.com/image/apps.45904.13748617810036542.da613a45-e095-4f0f-89c6-c62a954ef739.d2043d21-bf63-4ac8-b3b3-ed78dfd7f21b?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, 
  {
    id: "2",
    title: "Crosshair X",
    price: 4.99,
    image: "https://store-images.s-microsoft.com/image/apps.59474.14083481012137053.8dd52c3f-852b-4b54-a82f-7927fdfb0143.0abe2b61-f53a-4bd0-8617-7b2f06edcb92?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, 
  {
    id: "3",
    title: "Console Remote",
    price: 2.99,
    image: "https://store-images.s-microsoft.com/image/apps.33094.14234910285708481.a0876a35-0be1-479b-84c2-9f6c2c59444c.f4339c38-dd1d-4b37-97d7-f7c94102c754?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, 
  {
    id: "4",
    title: "Sketchbook Pro",
    price: 24.99,
    image: "https://store-images.s-microsoft.com/image/apps.3040.13784310836114466.5a27e793-6945-4bf0-ac54-edf49c480153.1cf3eccf-63ff-4c7e-85a3-27f162f05473?q=90&w=256&h=256&mode=crop&format=jpg&background=%23e55932",
    department: "Apps",
    platform: "PC",
  }, 
  {
    id: "5",
    title: "Movie Maker PRO",
    price: 19.99,
    image: "https://store-images.s-microsoft.com/image/apps.33814.13535614984864253.bb480d78-6f4e-4b98-a765-e5d92add2349.132d8023-d50f-44c7-b015-3ee7b42f69a3?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, 
  {
    id: "6",
    title: "FL Studio Mobile",
    price: 14.99,
    image: "https://store-images.s-microsoft.com/image/apps.26481.13510798886194062.a8723b4e-10eb-4a60-9e90-9eea5522dc22.04b25d44-e17f-4cb3-9f5b-2f0c443eb124?q=90&w=256&h=256&mode=crop&format=jpg&background=%23000000",
    department: "Apps",
    platform: "Mobile",
  },
  {
    id: "7",
    title: "KDL Reader",
    price: 4.99,
    image: "https://store-images.s-microsoft.com/image/apps.37792.13617369643691955.418a2184-adf9-4d84-a416-fe12b96c757a.aa3c8e7f-5613-4906-b530-cb457810f936?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, 
  {
    id: "8",
    title: "paint.net",
    price: 14.99,
    image: "https://store-images.s-microsoft.com/image/apps.55350.13517568566615301.c4a23598-9da0-403a-8afb-ffae9aaa8b09.028037dd-816c-4341-ad30-c452bbd5c377?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, {
    id: "9",
    title: "AMD Control Panel",
    price: 1.89,
    image: "https://store-images.s-microsoft.com/image/apps.32168.13579921092032955.ff7b7461-1b03-4b95-9e1e-998b4d64214f.78f6669e-9cb6-4125-8d60-1007d22097b7?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, {
    id: "10",
    title: "Files App",
    price: 9.99,
    image: "https://store-images.s-microsoft.com/image/apps.47586.13649428968955623.bcfc493a-7fd6-4231-9ddd-1c511b1330ad.ec1252e4-8d49-4736-9280-6b53752cb9dc?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, {
    id: "11",
    title: "MagicPods",
    price: 1.99,
    image: "https://store-images.s-microsoft.com/image/apps.53303.14618260366605914.2a7c8e5b-2e7b-44d4-b57c-332c38e866f5.4c813c43-f2cd-47ec-b3ca-3c795fe5711e?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, {
    id: "12",
    title: "Diarium: Journal & Diary",
    price: 19.99,
    image: "https://store-images.s-microsoft.com/image/apps.54913.13510798887514892.b120a9af-a4c0-4320-be23-10113a787ed6.d393aafc-5e3e-4db4-bc28-55d1267d53b7?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  }, {
    id: "13",
    title: "Call of Duty®: Warzone™",
    price: 21.75,
    image: "https://store-images.s-microsoft.com/image/apps.703.13739535057760905.34778648-088c-45a3-9d45-1117ca041901.c4d90513-3be4-4a22-9cd6-85a7ffa8df7f?q=90&w=540&h=810&mode=crop&format=jpg&background=%23FFFFFF",
    department: "Games",
    platform: "PC",
  }, {
    id: "14",
    title: "Diarium: Journal & Diary",
    price: 19.99,
    image: "https://store-images.s-microsoft.com/image/apps.54913.13510798887514892.b120a9af-a4c0-4320-be23-10113a787ed6.d393aafc-5e3e-4db4-bc28-55d1267d53b7?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  },
];

// Kết nối tới database (SQLite hoặc PostgreSQL, tùy .env).
const prisma = new PrismaClient();

// Đây là nơi bạn sẽ viết các lệnh thêm dữ liệu (insert).
async function main() {
  // Xóa dữ liệu cũ (nếu có)
  await prisma.product.deleteMany()
  console.log("🧹 Old products removed.")

  // Thêm dữ liệu mới
  await prisma.product.createMany({
    data: originProducts.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      image: p.image,
      department: p.department,
      platform: p.platform,
    })),
  })

  console.log(`✅ Seeded ${originProducts.length} products successfully.`)
}

// Đảm bảo sau khi chạy seed xong (hoặc lỗi) thì Prisma tự ngắt kết nối ($disconnect()).
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })