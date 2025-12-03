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

  // option filter từ DB + giá trị mặc định
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
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="mx-auto grid max-w-[2000px] gap-5">
        <section>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Admin: Product Management
          </h1>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-3">
            {/* Form thêm sản phẩm */}
            <form className="grid gap-2.5" onSubmit={handleCreate}>
              <h3 className="text-lg font-bold text-gray-900">Thêm sản phẩm</h3>

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tên sản phẩm"
                value={newProd.title}
                onChange={(e) =>
                  setNewProd({ ...newProd, title: e.target.value })
                }
                required
              />

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Slug (nếu bỏ trống sẽ tự tạo)"
                value={newProd.slug}
                onChange={(e) =>
                  setNewProd({ ...newProd, slug: e.target.value })
                }
              />

              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description"
                rows={3}
                value={newProd.description ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProd, description: e.target.value })
                }
              />

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Category"
                value={newProd.category ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProd, category: e.target.value })
                }
              />

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Badge (optional)"
                value={newProd.badge ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProd, badge: e.target.value })
                }
              />

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Image URL"
                value={newProd.image ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProd, image: e.target.value })
                }
                required
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <label className="mt-1.5 flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={newProd.hidden}
                  onChange={(e) =>
                    setNewProd({ ...newProd, hidden: e.target.checked })
                  }
                />
                <span>Hidden</span>
              </label>

              <button
                className="inline-flex items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                type="submit"
              >
                Add
              </button>
            </form>

            {/* Filter */}
            <div className="border-t border-gray-200 pt-3">
              <h3 className="mb-1.5 text-sm font-semibold text-gray-900">
                Categories
              </h3>
              {categoryOptions.map((category) => (
                <label
                  key={category}
                  className="grid grid-flow-col items-center justify-start gap-2 py-1 text-sm text-gray-800"
                >
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
            <div className="border-t border-gray-200 pt-3">
              <h3 className="mb-1.5 text-sm font-semibold text-gray-900">
                Available on
              </h3>
              {platformOptions.map((p) => (
                <label
                  key={p}
                  className="grid grid-flow-col items-center justify-start gap-2 py-1 text-sm text-gray-800"
                >
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

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p) => {
              const isEditing = editingId === p.id;
              return (
                <article
                  key={p.id}
                  className={`grid h-full min-h-[360px] self-stretch overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${
                    p.hidden ? "opacity-50" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-[120px_1fr]">
                    <div className="grid place-items-center overflow-hidden rounded-xl bg-gray-100">
                      <img
                        src={
                          (isEditing && editDraft
                            ? editDraft.image
                            : p.image) ?? ""
                        }
                        alt={p.title}
                        className="h-[120px] w-full object-contain"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <a
                        className="text-base font-bold text-gray-900 transition hover:text-blue-600"
                        href={`/products/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {p.title}
                      </a>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-gray-900">
                          ${p.price.toFixed(2)}
                        </span>{" "}
                        {p.category && (
                          <span className="text-[11px] text-gray-500">
                            ({p.category})
                          </span>
                        )}
                      </div>

                      {/* ⭐ Add rating display */}
                      {p.rating !== null && p.rating !== undefined && (
                        <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                          ⭐ {p.rating.toFixed(1)}
                        </div>
                      )}

                      {p.badge && (
                        <small className="text-[11px] text-gray-900">
                          Badge:{" "}
                          <span className="font-semibold text-blue-600">
                            {p.badge}
                          </span>
                        </small>
                      )}
                      <small className="text-[11px] text-gray-500">
                        slug: {p.slug}
                      </small>
                      <small className="text-[11px] text-gray-500">
                        Category: {p.category} | Platform: {p.platform}
                      </small>
                      {p.hidden && (
                        <small className="text-xs text-gray-400">Hidden</small>
                      )}
                    </div>
                    <div className="grid grid-flow-col items-start gap-2">
                      <button
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => startEdit(p)}
                        disabled={deletingId === p.id || hidingId === p.id}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
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
                        className="rounded-lg border border-red-600 bg-red-500 px-3 py-2 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => deleteProduct(p.id)}
                        disabled={deletingId === p.id || hidingId === p.id}
                      >
                        {deletingId === p.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  {isEditing && editDraft && (
                    <div className="grid gap-2.5 border-t border-gray-200 bg-gray-50 p-3">
                      <input
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Image URL"
                        value={editDraft.image ?? ""}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            image: e.target.value,
                          })
                        }
                      />

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <select
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                      <label className="flex items-center gap-2 text-sm text-gray-800">
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

                      <div className="grid grid-flow-col items-start gap-2">
                        <button
                          className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                          onClick={saveEdit}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
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
    </div>
  );
}
