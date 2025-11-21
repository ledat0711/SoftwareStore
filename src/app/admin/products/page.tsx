"use client";

import { useEffect, useMemo, useState } from "react";
import { slugify } from "@/lib/helpers";
import { toggle } from "@/lib/helpers";
/* ----------------- Types ----------------- */

class Product {
  id: string = "";
  slug: string = "";
  title: string = "";
  description: string | null = "";
  image: string = "";
  price: number = 0;
  rating: number | null = 0;
  tag: string | null = "";
  badge: string | null = "";
  category: string = "Software";
  platform: string = "All";
  hidden: boolean = false;

  constructor(init?: Partial<Product>) {
    Object.assign(this, init);
  }
}

type ProductForm = Omit<Product, "id">;

/* ----------------- Component ----------------- */

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  // load từ DB
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  // ----- Form thêm mới -----
const [newProd, setNewProd] = useState<ProductForm>(new Product());

  // ----- Filter -----
  const [filters, setFilters] = useState<{
    category: string[];
    platform: string[];
  }>({
    category: [],
    platform: [],
  });

  // option filter động từ DB + giá trị mặc định
  const categoryOptions = useMemo(() => {
    const base = ["Software", "Apps", "Games"];
    const fromDb = products.map((p) => p.category);
    return Array.from(new Set([...base, ...fromDb])).filter(Boolean);
  }, [products]);

  const platformOptions = useMemo(() => {
    const base = ["All", "PC", "Mobile"];
    const fromDb = products.map((p) => p.platform);
    return Array.from(new Set([...base, ...fromDb])).filter(Boolean);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const categoryOk =
        filters.category.length > 0
          ? filters.category.includes(p.category)
          : true;
      const platOk =
        filters.platform.length > 0
          ? filters.platform.includes(p.platform)
          : true;
      return categoryOk && platOk;
    });
  }, [filters, products]);

  // ----- Edit state -----
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ProductForm | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditDraft(new Product(p));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  // ----- Save Edit -----
  async function saveEdit() {
    if (!editingId || !editDraft) return;
    setSaving(true);
    try {
      const payload: ProductForm = {
        ...editDraft,
        slug: editDraft.slug || slugify(editDraft.title),
      };

      const res = await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");

      const updated: Product = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      cancelEdit();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  // ----- Delete -----
  async function deleteProduct(id: string) {
    if (!confirm("Xóa sản phẩm này?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) cancelEdit();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  // ----- Toggle hidden -----
  async function toggleHidden(p: Product) {
    const nextHidden = !p.hidden;
    setHidingId(p.id);
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: nextHidden }),
      });
      if (!res.ok) throw new Error("Toggle hide failed");
      const updated: Product = await res.json();
      setProducts((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x))
      );
      if (editingId === p.id && nextHidden) cancelEdit();
    } catch (e) {
      console.error(e);
    } finally {
      setHidingId(null);
    }
  }

  // ----- Submit tạo mới -----
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    const payload: ProductForm = {
      ...newProd,
      slug: newProd.slug || slugify(newProd.title),
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;

    const created: Product = await res.json();
    setProducts((prev) => [created, ...prev]);
    setNewProd({
      slug: "",
      title: "",
      description: "",
      image: "",
      price: 0,
      rating: 0,
      tag: "",
      badge: "",
      category: "Software",
      platform: "All",
      hidden: false,
    });
  }

  /* ----------------- JSX ----------------- */

  return (
    <div className="page">
      <main className="content">
        <section className="headline">
          <h1>Admin: Product Management</h1>
        </section>

        <div className="layout">
          <aside className="sidebar">
            {/* Form thêm sản phẩm */}
            <form className="add-form" onSubmit={handleCreate}>
              <h3>Thêm sản phẩm</h3>

              <input
                className="in"
                placeholder="Tên sản phẩm"
                value={newProd.title}
                onChange={(e) =>
                  setNewProd({ ...newProd, title: e.target.value })
                }
                required
              />

              <input
                className="in"
                placeholder="Slug (nếu bỏ trống sẽ tự tạo)"
                value={newProd.slug}
                onChange={(e) =>
                  setNewProd({ ...newProd, slug: e.target.value })
                }
              />

              <textarea
                className="in"
                placeholder="Description"
                rows={3}
                value={newProd.description ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProd, description: e.target.value })
                }
              />

              <input
                className="in"
                placeholder="Giá"
                type="number"
                min="0"
                step="0.01"
                value={newProd.price}
                onChange={(e) =>
                  setNewProd({
                    ...newProd,
                    price: parseFloat(e.target.value || "0"),
                  })
                }
                required
              />

              <input
                className="in"
                placeholder="Rating (0–5)"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={newProd.rating ?? 0}
                onChange={(e) =>
                  setNewProd({
                    ...newProd,
                    rating: parseFloat(e.target.value || "0"),
                  })
                }
              />

              <input
                className="in"
                placeholder="Category"
                value={newProd.category ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProd, category: e.target.value })
                }
              />

              <input
                className="in"
                placeholder="Badge (optional)"
                value={newProd.badge ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProd, badge: e.target.value })
                }
              />

              <input
                className="in"
                placeholder="Image URL"
                value={newProd.image}
                onChange={(e) =>
                  setNewProd({ ...newProd, image: e.target.value })
                }
                required
              />

              <div className="row">
                <select
                  className="in"
                  value={newProd.category}
                  onChange={(e) =>
                    setNewProd({ ...newProd, category: e.target.value })
                  }
                >
                  {categoryOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  className="in"
                  value={newProd.platform}
                  onChange={(e) =>
                    setNewProd({ ...newProd, platform: e.target.value })
                  }
                >
                  {platformOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <label className="chk" style={{ marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={newProd.hidden}
                  onChange={(e) =>
                    setNewProd({ ...newProd, hidden: e.target.checked })
                  }
                />
                <span>Hidden</span>
              </label>

              <button className="btn primary" type="submit">
                Add
              </button>
            </form>

            {/* Filter */}
            <div className="filter-group">
              <h3>Categories</h3>
              {categoryOptions.map((category) => (
                <label key={category} className="chk">
                  <input
                    type="checkbox"
                    checked={filters.category.includes(category)}
                    onChange={() =>
                      setFilters((f) => ({
                        ...f,
                        category: toggle(f.category, category),
                      }))
                    }
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3>Available on</h3>
              {platformOptions.map((p) => (
                <label key={p} className="chk">
                  <input
                    type="checkbox"
                    checked={filters.platform.includes(p)}
                    onChange={() =>
                      setFilters((f) => ({
                        ...f,
                        platform: toggle(f.platform, p),
                      }))
                    }
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </aside>

          {/* GRID sản phẩm */}
          <section className="grid">
            {filtered.map((p) => {
              const isEditing = editingId === p.id;
              return (
                <article
                  key={p.id}
                  className={`card ${p.hidden ? "is-hidden" : ""}`}
                >
                  <div className="thumb">
                    <img
                      src={isEditing && editDraft ? editDraft.image : p.image}
                      alt={p.title}
                    />
                  </div>

                  {!isEditing && (
                    <>
                      <div className="body">
                        <a className="title" href="#">
                          {p.title}
                        </a>
                        <div className="price">
                          ${p.price.toFixed(2)}{" "}
                          {p.category && (
                            <span style={{ fontSize: 11, color: "#6b7280" }}>
                              ({p.category})
                            </span>
                          )}
                        </div>

                        {/* ⭐ Add rating display */}
                        {p.rating !== null && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#f59e0b",
                              fontWeight: 700,
                            }}
                          >
                            ★ {p.rating.toFixed(1)}
                          </div>
                        )}
                        
                        {p.badge && (
                          <small style={{ color: "#111827", fontSize: 11 }}>
                            Badge: {p.badge}
                          </small>
                        )}
                        <small style={{ fontSize: 11, color: "#6b7280" }}>
                          slug: {p.slug}
                        </small>
                        <small style={{ fontSize: 11, color: "#6b7280" }}>
                          Category: {p.category} | Platform: {p.platform}
                        </small>
                        {p.hidden && (
                          <small style={{ color: "#9ca3af" }}>Hidden</small>
                        )}
                      </div>
                      <div className="actions">
                        <button
                          className="btn"
                          onClick={() => startEdit(p)}
                          disabled={deletingId === p.id || hidingId === p.id}
                        >
                          Edit
                        </button>
                        <button
                          className="btn"
                          onClick={() => toggleHidden(p)}
                          disabled={deletingId === p.id || hidingId === p.id}
                        >
                          {hidingId === p.id
                            ? "Updating..."
                            : p.hidden
                            ? "Unhide"
                            : "Hide"}
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
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            title: e.target.value,
                          })
                        }
                      />

                      <input
                        className="in"
                        placeholder="Slug"
                        value={editDraft.slug}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            slug: e.target.value,
                          })
                        }
                      />

                      <textarea
                        className="in"
                        placeholder="Description"
                        rows={3}
                        value={editDraft.description ?? ""}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            description: e.target.value,
                          })
                        }
                      />

                      <input
                        className="in"
                        placeholder="Giá"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editDraft.price}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            price: parseFloat(e.target.value || "0"),
                          })
                        }
                      />

                      <input
                        className="in"
                        placeholder="Rating (0–5)"
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={editDraft.rating ?? 0}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            rating: parseFloat(e.target.value || "0"),
                          })
                        }
                      />

                      <input
                        className="in"
                        placeholder="Category"
                        value={editDraft.category ?? ""}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            category: e.target.value,
                          })
                        }
                      />

                      <input
                        className="in"
                        placeholder="Badge"
                        value={editDraft.badge ?? ""}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            badge: e.target.value,
                          })
                        }
                      />

                      <input
                        className="in"
                        placeholder="Image URL"
                        value={editDraft.image}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            image: e.target.value,
                          })
                        }
                      />

                      <div className="row">
                        <select
                          className="in"
                          value={editDraft.category}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              category: e.target.value,
                            })
                          }
                        >
                          {categoryOptions.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <select
                          className="in"
                          value={editDraft.platform}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              platform: e.target.value,
                            })
                          }
                        >
                          {platformOptions.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="chk">
                        <input
                          type="checkbox"
                          checked={editDraft.hidden}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              hidden: e.target.checked,
                            })
                          }
                        />
                        <span>Hidden</span>
                      </label>

                      <div className="actions">
                        <button
                          className="btn primary"
                          onClick={saveEdit}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="btn"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </div>
      </main>

      {/* ---- Styles ---- */}
      <style jsx>{`
        .page {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          width: 1400px;
          min-width: 1400px;
          max-width: 1400px;
          margin: 0 auto;
          box-sizing: border-box;
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
        .layout {
          display: grid;
          grid-template-columns: 280px 1fr;
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
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        @media (max-width: 1400px) {
          .grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 1200px) {
          .grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 800px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        .card {
          display: flex;
          flex-direction: column;
          border: 1px solid #1f2937;
          border-radius: 4px;
          background: #fff;
          overflow: hidden;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .card:hover {
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        .card.is-hidden {
          opacity: 0.6;
        }
        .thumb {
          width: 100%;
          height: 180px;
          overflow: hidden;
          background: #ffffff;
          display: block;
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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
        .title:hover {
          text-decoration: underline;
        }
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
        .btn:hover {
          background: #f3f4f6;
        }
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
        .add-form h3 {
          margin: 0;
          font-size: 14px;
        }
        .in {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          box-sizing: border-box;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .btn.primary {
          background: #10b981;
          border-color: #10b981;
          color: #fff;
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
