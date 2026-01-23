"use client";
// là Client Component (có "use client")
// Quản lý toàn bộ UI + state + logic thao tác cho trang
// Admin – Product Management
// Không gọi DB trực tiếp
// Nhận hàm xử lý từ bên ngoài (props)
// Luồng dữ liệu chính:
// Server Component
//    │
//    ├─ fetch products từ DB
//    │
//    └─ truyền xuống:
//         - initialProducts
//         - onCreate
//         - onUpdate
//         - onDelete
//         - onToggleHidden
//               │
//               ▼
// AdminProductsClient (file này)
//    │
//    ├─ useState(products)
//    ├─ UI form / list / edit
//    ├─ gọi onCreate / onUpdate / onDelete
//    │
//    └─ setProducts() → cập nhật UI

// *********** Luồng xử lý sửa sản phẩm (edit) ***********
// Khi admin sửa sản phẩm thì chuyện gì xảy ra?
// admin đang ở client component, khi submit form thì gọi server action. Server action chạy trên server, validate data rồi gọi Prisma update vào DB. Sau khi xong thì trả dữ liệu mới về để cập nhật state.

// Luồng xử lý khi admin sửa sản phẩm
// 1. Admin đang ở Client Component
// •	Nhập form
// •	Bấm Save
// 2. Client gọi Server Action
// •	Không gọi API /api/...
// •	Gọi thẳng 1 hàm server
// 3. Server Action chạy trên server
// •	Nhận dữ liệu từ client
// •	Validate (slug…)
// •	Gọi Prisma update DB
// 4. Server trả kết quả về client
// •	Trả product đã được cập nhật
// 5. Client cập nhật state
// •	setProducts(...)
// •	UI render lại
// ***************************************************************************

// *********** Luồng xử lý lọc sản phẩm (filter) ***********
// Chức năng lọc sản phẩm hoạt động trên client không gọi xuống server
// USER CLICK CHECKBOX
//         ↓
// onChange()
//         ↓
// setFilters(prev => newFilters)
//         ↓
// filters STATE ĐỔI
//         ↓
// React re-render
//         ↓
// useMemo(filteredProducts) chạy lại
//         ↓
// products.filter(...)
//         ↓
// filteredProducts mới
//         ↓
// UI render danh sách mới
// ***************************************************************************

// *********** Luồng xử lý thêm sản phẩm ***********
// 1. Admin nhập thông tin sản phẩm mới vào form
// 2. Admin bấm nút Add
// 3. Client Component gọi onCreate (Server Action)
// 4. Server Action chạy trên server
// •	Nhận dữ liệu từ client
// •	Validate (slug…)
// •	Gọi Prisma tạo mới sản phẩm trong DB
// 5. Server trả kết quả về client
// •	Trả về product mới tạo
// 6. Client cập nhật state
// •	setProducts(...)
// •	UI render lại
// filteredProducts cũng tự động cập nhật do products thay đổi
// ***************************************************************************
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { slugify, toggle } from "@/lib/helpers";
import {
  CATEGORY_BASE,
  PLATFORM_BASE,
  DEFAULT_CATEGORY,
  DEFAULT_PLATFORM,
} from "@/constants/product";
import { Product } from "@/types/product";
import { FiEdit2, FiMoreVertical, FiTrash2, FiEyeOff } from "react-icons/fi";

// ProductForm: Khi tạo/sửa: Chưa có id, id do DB sinh.
// Omit = LOẠI BỎ THUỘC TÍNH
// Omit<T, K>
// T: kiểu gốc
// K: các field muốn loại bỏ
// id bị loại bỏ khi gửi dữ liệu cho server action, khi xuống db thì db tự sinh id
type ProductForm = Omit<Product, "id" | "isDeleted">;

const createEmptyProduct = (): ProductForm => ({
  slug: "",
  title: "",
  description: "",
  image: "",
  price: 0,
  rating: 0,
  tag: "",
  badge: "",
  category: DEFAULT_CATEGORY,
  platform: DEFAULT_PLATFORM,
  hidden: false,
});

const ADMIN_PRODUCTS_API = "/api/admin/products";

type ProductListResponse = {
  products?: Product[];
  error?: string;
};

type ProductResponse = {
  product?: Product;
  error?: string;
};

type DeleteResponse = {
  ok?: boolean;
  error?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    const message = (data as { error?: string }).error || "Request failed";
    throw new Error(message);
  }
  return data;
}

async function fetchAdminProducts(): Promise<Product[]> {
  const response = await fetch(ADMIN_PRODUCTS_API, { cache: "no-store" });
  const data = await parseResponse<ProductListResponse>(response);
  return Array.isArray(data.products) ? data.products : [];
}

async function createAdminProduct(payload: ProductForm): Promise<Product> {
  const response = await fetch(ADMIN_PRODUCTS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<ProductResponse>(response);
  if (!data.product) throw new Error("Missing product");
  return data.product;
}

async function updateAdminProduct(
  id: string,
  payload: Partial<ProductForm>,
): Promise<Product> {
  const response = await fetch(`${ADMIN_PRODUCTS_API}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<ProductResponse>(response);
  if (!data.product) throw new Error("Missing product");
  return data.product;
}

async function deleteAdminProduct(id: string): Promise<boolean> {
  const response = await fetch(`${ADMIN_PRODUCTS_API}/${id}`, {
    method: "DELETE",
  });
  const data = await parseResponse<DeleteResponse>(response);
  return Boolean(data.ok);
}

type Props = {
  initialProducts?: Product[];
};

export default function AdminProductsPage({ initialProducts = [] }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  async function toggleHidden(product: Product) {
    const newHidden = !product.hidden;

    // 1. Optimistic update: đổi UI ngay
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, hidden: newHidden } : p)),
    );

    setHidingId(product.id);

    try {
      // 2. Gửi server update
      await updateAdminProduct(product.id, {
        hidden: newHidden,
      });
    } catch (err) {
      console.error(err);

      // 3. Rollback nếu lỗi
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, hidden: product.hidden } : p,
        ),
      );
    } finally {
      setHidingId(null);
    }
  }

  useEffect(() => {
    let active = true;
    fetchAdminProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((err) => {
        console.error(err);
      });
    return () => {
      active = false;
    };
  }, []);

  // newProd chính là dữ liệu đang gõ trong form "Thêm sản phẩm"
  const [newProduct, setNewProd] = useState<ProductForm>(createEmptyProduct);

  console.log(newProduct);

  const [filters, setFilters] = useState<{
    category: string[];
    platform: string[];
  }>({
    category: [],
    platform: [],
  });

  // Tạo ra danh sách category duy nhất (không trùng) để dùng cho:
  // <select> chọn Category
  // danh sách checkbox filter Category
  // Danh sách này được tổng hợp từ 2 nguồn:
  // Category cố định khai báo sẵn (CATEGORY_BASE)
  // Category đang tồn tại trong database (products)
  // Và tự động cập nhật khi products thay đổi.

  // ý nghĩa khi dùng useMemo:
  // Chỉ tính lại categoryOptions khi products thay đổi
  // Không cần tính lại mỗi lần gõ input / click / re-render UI
  const categoryOptions: (string | null)[] = useMemo(() => {
    // diễn giải:
    // const fromDb: (string | null)[] = [];

    // for (let i = 0; i < products.length; i++) {
    //   const p = products[i];
    //   fromDb.push(p.category);
    // }
    const fromDb: (string | null)[] = products.map((p) => p.category);

    // diễn giải:
    // // Bước 1: Gộp category cố định + category lấy từ database
    // const mergedCategories = [
    //   ...CATEGORY_BASE,
    //   ...fromDb,
    // ];

    // // Bước 2: Dùng Set để loại bỏ các giá trị bị trùng
    // const uniqueCategorySet = new Set(mergedCategories);

    // // Bước 3: Chuyển Set → Array để có thể map / filter
    // const uniqueCategoryArray = Array.from(uniqueCategorySet);

    // // Bước 4: Loại bỏ các giá trị không hợp lệ (falsy) (null, undefined, "")
    // const cleanedCategories = uniqueCategoryArray.filter(
    //   (category) => category !== null && category !== undefined && category !== ""
    // );
    // có thể viết là .filter((value) => Boolean(value)) => rút gọn: .filter(Boolean)

    // // Bước 5: Trả kết quả cuối cùng
    // return cleanedCategories;

    // gộp mảng → bỏ trùng → chuyển về array → loại giá trị không hợp lệ (null, undefined, "")
    return Array.from(new Set([...CATEGORY_BASE, ...fromDb])).filter(Boolean);
  }, [products]);

  const platformOptions: (string | null)[] = useMemo(() => {
    const fromDb: (string | null)[] = products.map((p) => p.platform);
    return Array.from(new Set([...PLATFORM_BASE, ...fromDb])).filter(Boolean);
  }, [products]);

  // useMemo(...): chỉ tính toán lại khi filters hoặc products thay đổi
  // Tạo ra danh sách sản phẩm đã được lọc (filteredProducts).
  // Lọc theo category và platform mà admin tick checkbox
  // Phân tích useMemo(() => { ... }, [filters, products])
  // React chỉ tính lại filteredProducts khi:
  // filters thay đổi (tick / bỏ tick checkbox)
  // products thay đổi (thêm / sửa / xoá sản phẩm)
  const filteredProducts: Product[] = useMemo(() => {
    // products.filter((product) => { ... }): Lặp qua từng sản phẩm trong danh sách gốc products
    // Logic lọc CATEGORY:
    //    Nếu admin có chọn category để lọc
    //    → sản phẩm phải thuộc 1 trong các category đã chọn
    //    Nếu admin chưa chọn gì
    //    → coi như sản phẩm nào cũng hợp lệ
    // Logic lọc PLATFORM: Ý nghĩa 100% giống category, chỉ khác field platform
    return products.filter((product: Product) => {
      const categoryOk: boolean =
        filters.category.length > 0
          ? filters.category.includes(product.category ?? "")
          : true;
      const platformOk: boolean =
        filters.platform.length > 0
          ? filters.platform.includes(product.platform ?? "")
          : true;
      return categoryOk && platformOk;
    });
  }, [filters, products]);

  // editingId, setEditingId: Đánh dấu sản phẩm nào đang ở chế độ chỉnh sửa
  // editingId: Lưu lại id của sản phẩm đang được edit.
  // Đây là “cờ” để UI biết card nào đang ở chế độ chỉnh sửa.
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ProductForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);

  async function deleteProduct(id: string) {
    // hiện lên hộp thoại xác nhận
    if (!confirm("Xoá sản phẩm này?")) return;
    setDeletingId(id);
    try {
      const deleted = await deleteAdminProduct(id);
      if (!deleted) return;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreate(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    try {
      const payload: ProductForm = {
        ...newProduct,
        slug: newProduct.slug || slugify(newProduct.title),
      };

      // Server tạo sản phẩm mới trong DB
      const created: Product = await createAdminProduct(payload);

      // Server trả về created (Product mới)
      setProducts((prev) => [new Product(created), ...prev]);
      setNewProd(createEmptyProduct());
    } catch (err) {
      console.error(err);
    }
  }

  function handleNewProductTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const copiedProduct = { ...newProduct };
    copiedProduct.title = e.target.value;
    setNewProd(copiedProduct);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="mx-auto grid max-w-[2000px] gap-5">
        <section className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Admin: Product Management
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Thêm sản phẩm
            </Link>
            <Link
              href="/products"
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
            >
              Xem trang sản phẩm
            </Link>
          </div>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-3">
            <div className="border-gray-200 pt-1">
              <h3 className="text-lg font-bold text-gray-900 pb-2">
                Lọc sản phẩm
              </h3>
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
                    // state filters: có chứa category này hiển thị tick
                    checked={filters.category.includes(category ?? "")}
                    onChange={() =>
                      // toggle là hàm bật / tắt (toggle) một phần tử trong mảng.
                      // Nếu val đã tồn tại trong mảng arr → loại bỏ nó: arr.filter((x) => x !== val)
                      // Nếu val chưa tồn tại → thêm nó vào mảng: [...arr, val]
                      // + Trạng thái filter hiện tại
                      // filters.category = ["Apps"]
                      // + TH1: Admin click checkbox "Apps"
                      // toggle(["Apps"], "Apps") → ["Apps"] có "Apps" → bỏ ra → Kết quả: []
                      // + TH2: Admin click checkbox "Windows"
                      // toggle(["Office"], "Windows") => "Windows" chưa có => được thêm ["Office", "Windows"]
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
            {/* render từng sản phẩm và form edit cho từng sản phẩm  */}
            {filteredProducts.map((product) => {
              const isEditing: boolean = editingProductId === product.id;
              return (
                // article: Đây là khung “card sản phẩm”
                <article
                  // key:
                  // Phân biệt các phần tử trong .map(...)
                  // So sánh trước / sau khi re-render
                  // Update đúng card bị thay đổi
                  key={product.id}
                  // className:
                  className={`grid h-full min-h-[240px] self-stretch overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm ${
                    product.hidden ? "opacity-50" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-[120px_1fr]">
                    <div className="grid place-items-center overflow-hidden rounded-xl bg-gray-100">
                      <img
                        src={
                          (isEditing && editDraft
                            ? editDraft.image
                            : product.image) ?? ""
                        }
                        alt={product.title}
                        className="h-[120px] w-full object-contain"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <a
                        className="text-base font-bold text-gray-900 transition hover:text-blue-600"
                        href={`/products/${product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {product.title}
                      </a>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-gray-900">
                          ${product.price.toFixed(2)}
                        </span>{" "}
                        {product.category && (
                          <span className="text-[11px] text-gray-500">
                            ({product.category})
                          </span>
                        )}
                      </div>
                      {product.rating !== null &&
                        product.rating !== undefined && (
                          <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                            ★ {product.rating.toFixed(1)}
                          </div>
                        )}
                      {product.badge && (
                        <small className="text-[11px] text-gray-900">
                          Badge:{" "}
                          <span className="font-semibold text-blue-600">
                            {product.badge}
                          </span>
                        </small>
                      )}
                      <small className="text-[11px] text-gray-500">
                        slug: {product.slug}
                      </small>
                      <small className="text-[11px] text-gray-500">
                        Category: {product.category}
                        <br />
                        Platform: {product.platform}
                      </small>
                      {product.hidden && (
                        <small className="text-xs text-gray-400">Hidden</small>
                      )}
                    </div>
                    <div className="flex justify-end items-center gap-2 pt-2">
                      {/* Primary Edit */}
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
                        title="Edit product"
                      >
                        <FiEdit2 className="h-4 w-4" />
                        Edit
                      </Link>

                      {/* More menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((prev) =>
                              prev === product.id ? null : product.id,
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                          title="More actions"
                        >
                          <FiMoreVertical className="h-4 w-4" />
                        </button>

                        {openMenuId === product.id && (
                          <div className="absolute right-0 z-20 mt-2 min-w-[160px] rounded-xl border border-gray-200 bg-white shadow-lg">
                            <button
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setOpenMenuId(null);
                                toggleHidden(product);
                              }}
                            >
                              <FiEyeOff className="h-4 w-4" />
                              {product.hidden ? "Unhide" : "Hide"}
                            </button>

                            <button
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                              onClick={() => {
                                setOpenMenuId(null);
                                deleteProduct(product.id);
                              }}
                              disabled={deletingId === product.id}
                            >
                              <FiTrash2 className="h-4 w-4" />
                              {deletingId === product.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}
