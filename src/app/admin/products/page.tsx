"use client";

import Link from "next/link";
import { auth } from "@/auth";
import { useMemo, useState } from "react";
import { redirect } from "next/navigation";

type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  department: "Apps" | "Games";
  platform: "PC" | "Mobile";
};

const mockProducts: Product[] = [
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
  },
  {
    id: "9",
    title: "AMD Control Panel",
    price: 1.89,
    image: "https://store-images.s-microsoft.com/image/apps.32168.13579921092032955.ff7b7461-1b03-4b95-9e1e-998b4d64214f.78f6669e-9cb6-4125-8d60-1007d22097b7?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  },
  {
    id: "10",
    title: "Files App",
    price: 9.99,
    image: "https://store-images.s-microsoft.com/image/apps.47586.13649428968955623.bcfc493a-7fd6-4231-9ddd-1c511b1330ad.ec1252e4-8d49-4736-9280-6b53752cb9dc?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  },
  {
    id: "11",
    title: "MagicPods",
    price: 1.99,
    image: "https://store-images.s-microsoft.com/image/apps.53303.14618260366605914.2a7c8e5b-2e7b-44d4-b57c-332c38e866f5.4c813c43-f2cd-47ec-b3ca-3c795fe5711e?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  },
  {
    id: "12",
    title: "Diarium: Journal & Diary",
    price: 19.99,
    image: "https://store-images.s-microsoft.com/image/apps.54913.13510798887514892.b120a9af-a4c0-4320-be23-10113a787ed6.d393aafc-5e3e-4db4-bc28-55d1267d53b7?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  },
  {
    id: "13",
    title: "Call of Duty®: Warzone™",
    price: 21.75,
    image: "https://store-images.s-microsoft.com/image/apps.703.13739535057760905.34778648-088c-45a3-9d45-1117ca041901.c4d90513-3be4-4a22-9cd6-85a7ffa8df7f?q=90&w=540&h=810&mode=crop&format=jpg&background=%23FFFFFF",
    department: "Games",
    platform: "PC",
  },
  {
    id: "14",
    title: "Diarium: Journal & Diary",
    price: 19.99,
    image: "https://store-images.s-microsoft.com/image/apps.54913.13510798887514892.b120a9af-a4c0-4320-be23-10113a787ed6.d393aafc-5e3e-4db4-bc28-55d1267d53b7?q=90&w=256&h=256&mode=crop&format=jpg&background=%230078D7",
    department: "Apps",
    platform: "PC",
  },
];

export default function AdminProductsPage() {
  const [filters, setFilters] = useState<{
    department: ("Apps" | "Games")[];
    platform: ("PC" | "Mobile")[];
  }>({
    department: [],
    platform: [],
  });

  const filtered = useMemo(() => {
    return mockProducts.filter((p) => {
      const depOk =
        filters.department.length ? filters.department.includes(p.department) : true;
      const platOk =
        filters.platform.length ? filters.platform.includes(p.platform) : true;
      return depOk && platOk;
    });
  }, [filters]);

  function toggle<T extends string>(arr: T[], val: T) {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  return (
    <div className="page">
      <main className="content">
        <section className="headline">
          <h1>Apps & Games</h1>
        </section>

        <div className="layout">
          <aside className="sidebar">
            <div className="filter-group">
              <h3>Departments</h3>
              {(["Apps", "Games"] as const).map((dep) => (
                <label key={dep} className="chk">
                  <input
                    type="checkbox"
                    checked={filters.department.includes(dep)}
                    onChange={() =>
                      setFilters((f) => ({ ...f, department: toggle(f.department, dep) }))
                    }
                  />
                  <span>{dep}</span>
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3>Available on</h3>
              {(["PC", "Mobile"] as const).map((p) => (
                <label key={p} className="chk">
                  <input
                    type="checkbox"
                    checked={filters.platform.includes(p)}
                    onChange={() =>
                      setFilters((f) => ({ ...f, platform: toggle(f.platform, p) }))
                    }
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </aside>

          <section className="grid">
            {filtered.map((p) => (
              <article key={p.id} className="card">
                <div className="thumb">
                  <img src={p.image} alt={p.title} />
                </div>
                <div className="body">
                  <a className="title" href="#">{p.title}</a>
                  <div className="price">${p.price.toFixed(2)}</div>
                </div>
                <div className="actions">
                  <button className="btn">Edit</button>
                  <button className="btn">Hide</button>
                  <button className="btn danger">Delete</button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>

      <style jsx>{`
        .page {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          width: 1400px;          /* cố định 1400px */
          min-width: 1400px;      /* giữ nguyên khi cửa sổ nhỏ -> có thể cuộn ngang */
          max-width: 1400px;
          margin: 0 auto;         /* canh giữa */
          box-sizing: border-box;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tab {
          padding: 10px 14px;
          border-radius: 8px;
          background: #eaf6ee;
          color: #0a7a34;
          text-decoration: none;
          font-weight: 600;
        }
        .tab.active {
          background: #1ecf67;
          color: white;
        }
        .userbox {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .signout {
          padding: 8px 12px;
          border-radius: 8px;
          background: #ef4444;
          color: #fff;
          border: none;
          cursor: pointer;
        }
        .content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .headline {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .headline h1 {
          margin: 0;
          font-size: 28px;
        }
        .pills {
          display: flex;
          gap: 8px;
        }
        .pill {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
        }
        .pill-active {
          background: #f3f4f6;
        }
        .layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 16px;
        }
        .sidebar {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          background: #fff;
        }
        .filter-group {
          margin-bottom: 16px;
        }
        .filter-group h3 {
          margin: 0 0 8px;
          font-size: 14px;
          color: #374151;
        }
        .chk {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0;
          font-size: 14px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr); /* tối đa 5 sản phẩm mỗi hàng */
          gap: 12px;
        }
        @media (max-width: 1400px) { .grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 1200px) { .grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 800px)  { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px)  { .grid { grid-template-columns: 1fr; } }
        .card {
          display: flex;
          flex-direction: column;
          border: 1px solid #1f2937; /* viền đậm hơn */
          border-radius: 4px;
          background: #fff;
          overflow: hidden;
          transition: box-shadow .15s, transform .15s;
        }
        .card:hover {
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }
        .thumb {
          width: 100%;
          height: 180px;          /* cao hơn để ảnh lớn */
          overflow: hidden;
          background: #0078d7;    /* fallback nếu ảnh chưa load */
          display: block;
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;      /* ảnh phủ đầy khung */
          display: block;
        }
        .body {
          padding: 10px 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .title {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          line-height: 1.3;
        }
        .title:hover { text-decoration: underline; }
        .price {
          color: #111827;
          font-weight: 700;
          font-size: 14px;
        }
        .actions {
          display: flex;
          gap: 6px;
          padding: 8px 10px 10px;
        }
        .btn {
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid #d1d5db;
          background: #fff;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
        }
        .btn:hover { background:#f3f4f6; }
        .btn.danger {
          border-color: #ef4444;
          color: #ef4444;
        }
        .btn.danger:hover {
          background: #fef2f2;
        }
        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
