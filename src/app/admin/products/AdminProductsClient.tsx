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
import {
  createProductAction,
  deleteProductAction,
  getAllProducts,
  toggleHiddenAction,
  updateProductAction,
} from "@/lib/prisma";
import Link from "next/link";
import { useMemo, useState } from "react";
import { slugify, toggle } from "@/lib/helpers";
import {
  CATEGORY_BASE,
  PLATFORM_BASE,
  DEFAULT_CATEGORY,
  DEFAULT_PLATFORM,
} from "@/constants/product";
import { Product } from "@/types/product";

// ProductForm: Khi tạo/sửa: Chưa có id, id do DB sinh.
// Omit = LOẠI BỎ THUỘC TÍNH
// Omit<T, K>
// T: kiểu gốc
// K: các field muốn loại bỏ
// id bị loại bỏ khi gửi dữ liệu cho server action, khi xuống db thì db tự sinh id
type ProductForm = Omit<Product, "id">;

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

type Props = {
  initialProducts: Product[];
  onCreate: (p: ProductForm) => Promise<Product>;
  onUpdate: (id: string, p: ProductForm) => Promise<Product>;
  onDelete: (id: string) => Promise<boolean>;
  onToggleHidden: (id: string, hidden: boolean) => Promise<Product>;
};

export default function AdminProductsClient({
  initialProducts,
  onCreate,
  onUpdate,
  onDelete,
  onToggleHidden,
}: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

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
  const filteredProducts: Product[] = useMemo(() => {
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

  const [editDraft, setEditDraft] = useState<ProductForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);

  // hàm startEdit: khi nhấn nút Edit ở mỗi sản phẩm
  function startEdit(p: Product) {
    setEditingProductId(p.id);

    // Dùng new Product(p) để: Tạo một bản sao hoàn toàn mới của p
    setEditDraft(new Product(p));
  }

  // hàm saveEdit: khi nhấn Save trong form edit
  async function saveEdit() {
    if (!editingProductId || !editDraft) return;
    setIsSaving(true);
    try {
      const payload: ProductForm = {
        ...editDraft,
        slug: editDraft.slug || slugify(editDraft.title),
      };

      // server đã update xong và trả về updatedProduct
      // Mục tiêu tiếp theo:
      //    Cập nhật lại UI ngay lập tức
      //    Không reload page
      //    Không fetch lại toàn bộ danh sách
      // => Ta chỉ cần thay đúng 1 product trong mảng products
      const updatedProduct: Product = await onUpdate(editingProductId, payload);

      // setProducts chuẩn react
      // prevProducts = danh sách products hiện tại trong state
      // "prevProducts.map((p) =>" : Duyệt từng sản phẩm cũ
      setProducts((prevProducts: Product[]) =>
        prevProducts.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product
        )
      );
      cancelEdit();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  // hàm cancelEdit: khi nhấn cancel trong form edit
  function cancelEdit() {
    setEditingProductId(null);
    setEditDraft(null);
  }

  async function deleteProduct(id: string) {
    // hiện lên hộp thoại xác nhận
    if (!confirm("Xoá sản phẩm này?")) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingProductId === id) cancelEdit();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleHidden(p: Product) {
    const nextHidden: boolean = !p.hidden;
    setHidingId(p.id);
    try {
      const updated: Product = await onToggleHidden(p.id, nextHidden);
      setProducts((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x))
      );
      if (editingProductId === p.id && nextHidden) cancelEdit();
    } catch (e) {
      console.error(e);
    } finally {
      setHidingId(null);
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
      const created: Product = await onCreate(payload);

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
          <Link
            href="/products"
            className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
          >
            Xem trang sản phẩm
          </Link>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-3">
            {/* ****************** Form thêm sản phẩm ****************** */}
            <form className="grid gap-2.5" onSubmit={handleCreate}>
              <h3 className="text-lg font-bold text-gray-900">Thêm sản phẩm</h3>

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tên sản phẩm"
                value={newProduct.title}
                onChange={(e) =>
                  // { ...newProduct, title: e.target.value }:
                  // Trải (copy) toàn bộ các thuộc tính cũ của object cũ sang object mới
                  //giữ nguyên tất cả thuộc tính cũ, chỉ update thuộc tính mình muốn
                  setNewProd({ ...newProduct, title: e.target.value })
                }
                required
              />

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Slug (để trống sẽ tự tạo)"
                value={newProduct.slug}
                onChange={(e) =>
                  setNewProd({ ...newProduct, slug: e.target.value })
                }
              />

              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description"
                rows={3}
                value={newProduct.description ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProduct, description: e.target.value })
                }
              />

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Giá"
                type="number"
                min="0"
                step="0.01"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProd({
                    ...newProduct,
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
                value={newProduct.rating ?? 0}
                onChange={(e) =>
                  setNewProd({
                    ...newProduct,
                    rating: parseFloat(e.target.value || "0"),
                  })
                }
              />

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Badge (optional)"
                value={newProduct.badge ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProduct, badge: e.target.value })
                }
              />

              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Image URL"
                value={newProduct.image ?? ""}
                onChange={(e) =>
                  setNewProd({ ...newProduct, image: e.target.value })
                }
                required
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.category ?? ""}
                  onChange={(e) =>
                    setNewProd({ ...newProduct, category: e.target.value })
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
                  value={newProduct.platform ?? ""}
                  onChange={(e) =>
                    setNewProd({ ...newProduct, platform: e.target.value })
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
                  checked={newProduct.hidden}
                  onChange={(e) =>
                    setNewProd({ ...newProduct, hidden: e.target.checked })
                  }
                />
                <span>Hidden</span>
              </label>

              {/* Khi bấm Add, handleCreate chạy */}
              <button
                className="inline-flex items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                type="submit"
              >
                Add
              </button>
            </form>

            <div className="border-t border-gray-200 pt-3">
              <h3 className="text-lg font-bold text-gray-900 pb-3">
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
                  className={`grid h-full min-h-[240px] self-stretch overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${
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
                    <div className="grid grid-flow-col items-start gap-2">
                      <button
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => startEdit(product)}
                        disabled={
                          deletingId === product.id || hidingId === product.id
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => toggleHidden(product)}
                        disabled={
                          deletingId === product.id || hidingId === product.id
                        }
                      >
                        {hidingId === product.id
                          ? "Updating..."
                          : product.hidden
                          ? "Unhide"
                          : "Hide"}
                      </button>
                      <button
                        className="rounded-lg border border-red-600 bg-red-500 px-3 py-2 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => deleteProduct(product.id)}
                        disabled={
                          deletingId === product.id || hidingId === product.id
                        }
                      >
                        {deletingId === product.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  {/* 
                  // CLICK Edit
                  //     ↓
                  //   startEdit(product)
                  //     ↓
                  //   setEditingProductId(product.id)
                  //   setEditDraft(copy(product))
                  //     ↓
                  //   React re-render
                  //     ↓
                  //   editingProductId === product.id ? true : false
                  //     ↓
                  //   isEditing = true
                  //     ↓
                  //   Form Edit xuất hiện (tuy không có thẻ <form> nhưng vẫn thể hiện chức năng của form)
                  // ***************** form edit ***************** */}
                  {isEditing && editDraft && (
                    <div className="grid gap-2.5 border-t border-gray-200 bg-gray-50 p-3">
                      <input
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tên sản phẩm"
                        value={editDraft.title}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, title: e.target.value })
                        }
                      />

                      <input
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Slug"
                        value={editDraft.slug}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, slug: e.target.value })
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
                        placeholder="Badge"
                        value={editDraft.badge ?? ""}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, badge: e.target.value })
                        }
                      />

                      <input
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Image URL"
                        value={editDraft.image ?? ""}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, image: e.target.value })
                        }
                      />

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {/* Click Edit
                          → setEditDraft(product)
                          → state đổi
                          → re-render
                          → select đọc value
                          → chọn option tương ứng
                        Giá trị (value) của <select> phải thuộc tập giá trị (value) của <option>
                        Nếu select.value không khớp option nào → chọn option đầu tiên */}
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
                          //isSaving: lúc nhấn vào saveEdit, chờ cập nhật server
                          disabled={isSaving}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                          onClick={cancelEdit}
                          disabled={isSaving}
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
