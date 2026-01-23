import { DEFAULT_CATEGORY, DEFAULT_PLATFORM } from "@/constants/product";

export class Product {
  id: string = "";
  slug: string = "";
  title: string = "";
  description: string | null = "";
  image: string | null = "";
  price: number = 0;
  rating: number | null = 0;
  tag: string | null = "";
  badge: string | null = "";
  category: string | null = DEFAULT_CATEGORY;
  platform: string | null = DEFAULT_PLATFORM;
  hidden: boolean = false;
  isDeleted: boolean = false;

  constructor(init?: Partial<Product>) {
    Object.assign(this, init);
  }
}
