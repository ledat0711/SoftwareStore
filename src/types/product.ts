export type Product = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  image?: string | null;
  price: number;
  rating?: number | null;
  category?: string | null;
  badge?: string | null;
  tag?: string | null;
  platform?: string | null;
  hidden?: boolean;
};
