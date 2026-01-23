import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Session } from "next-auth";
import {
  CATEGORY_BASE,
  DEFAULT_CATEGORY,
  DEFAULT_PLATFORM,
  PLATFORM_BASE,
} from "@/constants/product";
import ProductCreateForm from "./_components/ProductCreateForm";

export default async function AdminProductCreatePage() {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const categories = CATEGORY_BASE;
  const platforms = PLATFORM_BASE;

  return (
    <div className="flex flex-col gap-6">
      <ProductCreateForm
        categories={categories}
        platforms={platforms}
        defaultCategory={DEFAULT_CATEGORY}
        defaultPlatform={DEFAULT_PLATFORM}
      />
    </div>
  );
}
