// src/lib/helpers.ts
export function slugify(str: string) {
  return str
    .normalize("NFD") // remove dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // replace khoảng trắng, ký tự lạ
    .replace(/(^-|-$)+/g, ""); // trim
}

// T phải là string hoặc kiểu con của string
// Tham số
// arr: T[]   // mảng hiện tại
// val: T    // giá trị cần bật/tắt
// arr.includes(val): Kiểm tra: val đã có trong mảng hay chưa
// Trường hợp 1: ĐÃ CÓ → BỎ RA
// arr.filter((x) => x !== val)
// Ví dụ:
// arr = ["Windows", "Mac"]
// val = "Windows"
// → ["Mac"]
// Trường hợp 2: CHƯA CÓ → THÊM VÀO
// [...arr, val]
// Ví dụ:
// arr = ["Windows"]
// val = "Mac"
// → ["Windows", "Mac"]
export function toggle<T extends string>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export function currency(n: number) {
  return `$${n}`;
}
