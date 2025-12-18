"use client";

import Link from "next/link";
import { FormEvent, useCallback, useRef, useState } from "react";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";

type Props = {
  initialQuery?: string;
  initialResults?: Product[];
  onSearch: (query: string, limit?: number) => Promise<Product[]>;
};

const RESULT_LIMIT = 12;

export default function ProductSearch({
  initialQuery = "",

  // initialResults: đến từ server
  // Trang load lần đầu: Đã có sẵn kết quả, Rất tốt cho + UX
  initialResults = [],
  onSearch,
}: Props) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  // results: Danh sách sản phẩm đang được hiển thị trên UI
  const [results, setResults] = useState<Product[]>(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);

  const hasSearch = activeQuery.trim().length > 0;

  const updateUrl = useCallback((nextQuery: string) => {
    const url = new URL(window.location.href);
    if (nextQuery) {
      url.searchParams.set("q", nextQuery);
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState(null, "", url.toString());
  }, []);

  // runSearch liên quan đến event handler vì vậy phải dùng useCallback
  const runSearch = useCallback(
    async (nextQuery: string) => {
      const trimmed = nextQuery.trim();
      setActiveQuery(trimmed);

      if (!trimmed) {
        requestIdRef.current += 1;
        setResults([]);
        setIsLoading(false);
        updateUrl("");
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setResults([]);
      updateUrl(trimmed);

      try {
        const items = await onSearch(trimmed, RESULT_LIMIT);
        if (requestId !== requestIdRef.current) return;
        setResults(items ?? []);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [onSearch, updateUrl]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // event.preventDefault(): không thực hiện hành động mặc định của trình duyệt:
    // - Không cho trình duyệt reload trang
    // - Không Gửi request (GET hoặc POST)
    event.preventDefault();
    void runSearch(inputValue);
  };

  const handleClear = () => {
    requestIdRef.current += 1;
    setInputValue("");
    setActiveQuery("");
    setResults([]);
    setIsLoading(false);
    updateUrl("");
  };

  const showCount = hasSearch && !isLoading;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold leading-tight">Tìm kiếm sản phẩm</h2>
          <p className="text-sm text-gray-500">
            Nhập tên sản phẩm hoặc từ khóa bạn muốn tìm.
          </p>
        </div>
        {showCount && (
          <span className="text-sm font-semibold text-gray-700">
            {results.length} kết quả cho &quot;{activeQuery}&quot;
          </span>
        )}
      </div>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        role="search"
        onSubmit={handleSubmit}
      >
        <input
          type="search"
          name="q"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Ví dụ: Slack, Figma, Postman..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        <div className="flex gap-2 sm:w-auto">
          <button
            type="submit"
            className="w-full sm:w-auto min-w-[93px] rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Tìm kiếm
          </button>
          {hasSearch && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full sm:w-auto rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Xóa
            </button>
          )}
        </div>
      </form>

      {hasSearch && (
        <div className="mt-4" aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            <p className="text-sm text-gray-500">Searching...</p>
          ) : results.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-600">
                Không tìm thấy kết quả. Thử từ khóa khác hoặc xem tất cả sản phẩm.
              </p>
              <Link
                href="/products"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Xem tất cả
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
