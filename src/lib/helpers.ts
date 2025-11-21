// src/lib/helpers.ts
export function slugify(str: string) {
  return str
    .normalize("NFD")                           // remove dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")               // replace khoảng trắng, ký tự lạ
    .replace(/(^-|-$)+/g, "");                 // trim
}

export function toggle<T extends string>(arr: T[], val: T) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}
