"use client";

import Link from "next/link";
import { auth } from "@/auth";
import { useEffect, useMemo, useState } from "react";
import { redirect } from "next/navigation";

type Product = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  image: string;
  price: number;
  rating?: number;
  category?: string;
  badge?: string;
  department: "Apps" | "Games";
  platform: "PC" | "Mobile";
  hidden?: boolean;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])  // start empty

  // load từ DB
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => setProducts([]))
  }, [])

  // NEW: state form thêm mới
  const [newProd, setNewProd] = useState<Omit<Product, "id">>({
    slug: "",
    title: "",
    description: "",
    image: "",
    price: 0,
    rating: 0,
    category: "",
    badge: "",
    department: "Apps",
    platform: "PC",
    hidden: false,
  })

  const [filters, setFilters] = useState<{
    department: ("Apps" | "Games")[];
    platform: ("PC" | "Mobile")[];
  }>({
    department: [],
    platform: [],
  })

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const depOk = filters.department.length ? filters.department.includes(p.department) : true
      const platOk = filters.platform.length ? filters.platform.includes(p.platform) : true
      return depOk && platOk
    })
  }, [filters, products])

  function toggle<T extends string>(arr: T[], val: T) {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  // NEW: Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<Product, "id"> | null>(null)
  const [saving, setSaving] = useState(false)
  // NEW: trạng thái xoá
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hidingId, setHidingId] = useState<string | null>(null)

  function startEdit(p: Product) {
    setEditingId(p.id)
    setEditDraft({
      slug: p.slug,
      title: p.title,
      price: p.price,
      image: p.image,
      department: p.department,
      platform: p.platform,
    })
  }
  
  function cancelEdit() {
    setEditingId(null)
    setEditDraft(null)
  }

  async function saveEdit() {
    if (!editingId || !editDraft) return
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${editingId}`, {
        method: "PUT", // change to PATCH if your API uses it
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      })
      if (!res.ok) throw new Error("Update failed")
      const updated: Product = await res.json()
      setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)))
      cancelEdit()
    } catch (e) {
      // noop or show a toast
    } finally {
      setSaving(false)
    }
  }

  // NEW: hàm xoá sản phẩm
  async function deleteProduct(id: string) {
    if (!confirm("Xóa sản phẩm này?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setProducts(prev => prev.filter(p => p.id !== id))
      if (editingId === id) cancelEdit()
    } catch (e) {
      // có thể hiển thị toast
    } finally {
      setDeletingId(null)
    }
  }

  // NEW: Toggle ẩn/hiện
  async function toggleHidden(p: Product) {
    const nextHidden = !p.hidden
    setHidingId(p.id)
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: nextHidden }),
      })
      if (!res.ok) throw new Error("Toggle hide failed")
      const updated: Product = await res.json()
      setProducts(prev => prev.map(x => (x.id === updated.id ? updated : x)))
      if (editingId === p.id && nextHidden) cancelEdit()
    } finally {
      setHidingId(null)
    }
  }

  return (
    <div className="page">
      <main className="content">
        <section className="headline">
          <h1>Apps & Games</h1>
        </section>

        <div className="layout">
          <aside className="sidebar">
            {/* NEW: Form thêm sản phẩm */}
            <form
              className="add-form"
              onSubmit={async (e) => {
                e.preventDefault()
                const payload = { ...newProd }
                const res = await fetch("/api/products", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                })
                if (!res.ok) return
                const created: Product = await res.json()
                setProducts((prev) => [created, ...prev])   // prepend newly created product
                setNewProd({ slug: "", title: "", description: "", image: "", price: 0, rating: 0, category: "", badge: "", department: "Apps", platform: "PC", hidden: false })
              }}
            >
              <h3>Thêm sản phẩm</h3>
              <input
                className="in"
                placeholder="Tên sản phẩm"
                value={newProd.title}
                onChange={(e) => setNewProd({ ...newProd, title: e.target.value })}
                required
              />
              <input
                className="in"
                placeholder="Giá"
                type="number"
                min="0"
                step="0.01"
                value={newProd.price}
                onChange={(e) => setNewProd({ ...newProd, price: parseFloat(e.target.value || "0") })}
                required
              />
              <input
                className="in"
                placeholder="Image URL"
                value={newProd.image}
                onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                required
              />
              <div className="row">
                <select
                  className="in"
                  value={newProd.department}
                  onChange={(e) =>
                    setNewProd({ ...newProd, department: e.target.value as Product["department"] })
                  }
                >
                  <option value="Apps">Apps</option>
                  <option value="Games">Games</option>
                </select>
                <select
                  className="in"
                  value={newProd.platform}
                  onChange={(e) =>
                    setNewProd({ ...newProd, platform: e.target.value as Product["platform"] })
                  }
                >
                  <option value="PC">PC</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
              <button className="btn primary" type="submit">Add</button>
            </form>

            {/* ...existing code... bộ lọc */}
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
            {filtered.map((p) => {
              const isEditing = editingId === p.id
              return (
                <article key={p.id} className={`card ${p.hidden ? "is-hidden" : ""}`}>
                  <div className="thumb">
                    <img src={isEditing && editDraft ? editDraft.image : p.image} alt={p.title} />
                  </div>

                  {!isEditing && (
                    <>
                      <div className="body">
                        <a className="title" href="#">{p.title}</a>
                        <div className="price">${p.price.toFixed(2)}</div>
                        {p.hidden && <small style={{color:"#9ca3af"}}>Hidden</small>}
                      </div>
                      <div className="actions">
                        <button className="btn" onClick={() => startEdit(p)} disabled={deletingId === p.id || hidingId === p.id}>Edit</button>
                        <button
                          className="btn"
                          onClick={() => toggleHidden(p)}
                          disabled={deletingId === p.id || hidingId === p.id}
                        >
                          {hidingId === p.id ? "Updating..." : p.hidden ? "Unhide" : "Hide"}
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => deleteProduct(p.id)}
                          disabled={deletingId === p.id || hidingId === p.id}
                        >
                          {deletingId === p.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </>
                  )}

                  {isEditing && editDraft && (
                    <div className="body">
                      <input
                        className="in"
                        placeholder="Tên sản phẩm"
                        value={editDraft.title}
                        onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                      />
                      <input
                        className="in"
                        placeholder="Giá"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editDraft.price}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, price: parseFloat(e.target.value || "0") })
                        }
                      />
                      <input
                        className="in"
                        placeholder="Image URL"
                        value={editDraft.image}
                        onChange={(e) => setEditDraft({ ...editDraft, image: e.target.value })}
                      />
                      <div className="row">
                        <select
                          className="in"
                          value={editDraft.department}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              department: e.target.value as Product["department"],
                            })
                          }
                        >
                          <option value="Apps">Apps</option>
                          <option value="Games">Games</option>
                        </select>
                        <select
                          className="in"
                          value={editDraft.platform}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              platform: e.target.value as Product["platform"],
                            })
                          }
                        >
                          <option value="PC">PC</option>
                          <option value="Mobile">Mobile</option>
                        </select>
                      </div>
                      <div className="actions">
                        <button className="btn primary" onClick={saveEdit} disabled={saving}>
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button className="btn" onClick={cancelEdit} disabled={saving}>Cancel</button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
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
        .card.is-hidden { opacity: .6; }
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
        .add-form {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .add-form h3 { margin: 0; font-size: 14px; }
        .in {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          box-sizing: border-box;
        }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .btn.primary { background: #10b981; border-color: #10b981; color: #fff; }
        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
