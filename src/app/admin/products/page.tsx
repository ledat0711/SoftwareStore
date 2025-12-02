"use client";

import { useEffect, useMemo, useState } from "react";
import { slugify } from "@/lib/helpers";
import { toggle } from "@/lib/helpers";
import {
  CATEGORY_BASE,
  PLATFORM_BASE,
  DEFAULT_CATEGORY,
  DEFAULT_PLATFORM,
} from "@/constants/product";
import { Product } from "@/types/product";

/* ----------------- Types ----------------- */

class ProductModel implements Product {
  id: string = "";
  slug: string = "";
  title: string = "";
  description: string | null = "";
  image: string | null = "";
  price: number = 0;
  rating: number | null = 0;
  tag: string | null = "";
  badge: string | null = "";
  category: string = DEFAULT_CATEGORY;
  platform: string = DEFAULT_PLATFORM;
  hidden: boolean = false;

  constructor(init?: Partial<Product>) {
    Object.assign(this, init);
  }
}

type ProductForm = Omit<Product, "id">;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  // load từ API
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  // ----- Form thêm mới-----
  const [newProd, setNewProd] = useState<ProductForm>(
    new ProductModel({ category: DEFAULT_CATEGORY, platform: DEFAULT_PLATFORM })
  );

  // ----- Filter -----
  const [filters, setFilters] = useState<{
    category: string[];
    platform: string[];
  }>({
    category: [],
    platform: [],
  });

  // option filter từ DB + giá trị mức mặc định
  const categoryOptions = useMemo(() => {
    const fromDb = products.map((p) => p.category);
    return Array.from(new Set([...CATEGORY_BASE, ...fromDb])).filter(Boolean);
  }, [products]);

  const platformOptions = useMemo(() => {
    const fromDb = products.map((p) => p.platform);
    return Array.from(new Set([...PLATFORM_BASE, ...fromDb])).filter(Boolean);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const categoryOk =
        filters.category.length > 0
          ? filters.category.includes(p.category ?? "")
          : true;
      const platOk =
        filters.platform.length > 0
          ? filters.platform.includes(p.platform ?? "")
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
    setEditDraft(new ProductModel(p));
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

  // ----- Submit thêm mới -----
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
    setProducts((prev) => [new ProductModel(created), ...prev]);
    setNewProd(
      new ProductModel({
        category: DEFAULT_CATEGORY,
        platform: DEFAULT_PLATFORM,
      })
    );
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
                placeholder="Rating"
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
                value={newProd.image ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProd, image: e.target.value })
                }
                required
              />

              <div className="row">
                <select
                  className="in"
                  value={newProd.category ?? ""}
                  onChange={(e) =>
                    setNewProd({ ...newProd, category: e.target.value })
                  }
                >
                  {categoryOptions.map((d) => (
                    <option key={d} value={d ?? ""}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  className="in"
                  value={newProd.platform ?? ""}
                  onChange={(e) =>
                    setNewProd({ ...newProd, platform: e.target.value })
                  }
                >
                  {platformOptions.map((p) => (
                    <option key={p} value={p ?? ""}>
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
                    checked={filters.category.includes(category ?? "")}
                    onChange={() =>
                      setFilters((f) => ({
                        ...f,
                        category: toggle(f.category, category ?? ""),
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
                    checked={filters.platform.includes(p ?? "")}
                    onChange={() =>
                      setFilters((f) => ({
                        ...f,
                        platform: toggle(f.platform, p ?? ""),
                      }))
                    }
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </aside>

          <section className="grid">
            {filtered.map((p) => {
              const isEditing = editingId === p.id;
              return (
                <article key={p.id} className="card">
                  <div className="card__top">
                    <div className="img">
                      <img
                        src={(isEditing && editDraft ? editDraft.image : p.image) ?? ""}
                        alt={p.title}
                      />
                    </div>
                    <div className="meta">
                      <a
                        className="title"
                        href={`/products/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
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
                      {p.rating !== null && p.rating !== undefined && (
                        <div
                          style={{
                            fontSize: 13,
                            color: "#f59e0b",
                            fontWeight: 700,
                          }}
                        >
                          ⭐ {p.rating.toFixed(1)}
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
                  </div>

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
                        placeholder="Rating"
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
                        value={editDraft.image ?? ""}
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
                          value={editDraft.category ?? ""}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              category: e.target.value,
                            })
                          }
                        >
                          {categoryOptions.map((d) => (
                            <option key={d} value={d ?? ""}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <select
                          className="in"
                          value={editDraft.platform ?? ""}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              platform: e.target.value,
                            })
                          }
                        >
                          {platformOptions.map((p) => (
                            <option key={p} value={p ?? ""}>
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
          padding: 32px;
          display: grid;
          gap: 20px;
        }
        .content {
          display: grid;
          gap: 20px;
        }
        .headline h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }
        .layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
        .sidebar {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          display: grid;
          gap: 16px;
        }
        .add-form {
          display: grid;
          gap: 10px;
        }
        .add-form h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }
        .filter-group {
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
        }
        .filter-group h3 {
          font-size: 14px;
          margin: 0 0 6px;
        }
        .chk {
          display: grid;
          grid-auto-flow: column;
          justify-content: start;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          padding: 4px 0;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          display: grid;
          background: #fff;
        }
        .card__top {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 12px;
          padding: 12px;
        }
        @media (max-width: 640px) {
          .card__top {
            grid-template-columns: 1fr;
          }
        }
        .img {
          background: #f3f4f6;
          border-radius: 8px;
          overflow: hidden;
          display: grid;
          place-items: center;
        }
        .img img {
          width: 100%;
          height: 120px;
          object-fit: contain;
        }
        .meta {
          display: grid;
          gap: 6px;
        }
        .title {
          font-weight: 700;
          color: #111827;
          text-decoration: none;
          font-size: 16px;
        }
        .price {
          font-weight: 800;
          color: #111827;
          font-size: 15px;
        }
        .actions {
          display: grid;
          grid-auto-flow: column;
          gap: 8px;
          align-items: start;
        }
        .body {
          border-top: 1px solid #e5e7eb;
          padding: 12px;
          display: grid;
          gap: 10px;
          background: #f9fafb;
        }
        .in {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 14px;
        }
        .row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 8px;
        }
        .btn {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 12px;
          background: #fff;
          font-weight: 600;
          cursor: pointer;
          color: #111827;
        }
        .btn.primary {
          background: #2563eb;
          color: #fff;
          border-color: #1d4ed8;
        }
        .btn.danger {
          background: #ef4444;
          border-color: #dc2626;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
