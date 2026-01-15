"use client";

import Link from "next/link";
import { LucideProps } from "lucide-react";
// Icon Imports
import { BarChart, Contact, Layers, ShoppingCart, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { ROLES, Role } from "@/constants/role";

type AppUser = {
  role?: Role;
};

const userLinks = [
  { href: "/customer/profile", text: "Profile", icon: BarChart },
  { href: "/customer/orders", text: "Orders", icon: ShoppingCart },
  { href: "https://ninza.co/download", text: "ninZaFamily", icon: Layers },
  { href: "/customer/license-manager", text: "License Manager", icon: Contact },
];

const adminLinks = [
  { href: "/admin/users", text: "Users", icon: Users },
];

export default async function Nav() {
    // const { data: session } = useSession();
  
    // const role: Role | undefined = (session?.user as AppUser)?.role;
    // const isAdmin: boolean = role === ROLES.ADMIN;

  return (
    <nav className="p-4 flex flex-col gap-4 justify-between h-screen">
      <Link
        href="/"
        className="border bg-muted/50 flex items-center gap-2 rounded-lg p-6"
      >
      </Link>
      
      <div className="border bg-muted/50 rounded-lg flex flex-col justify-between p-6 h-full">
        <div className="flex flex-col gap-8">
          <div className="grid gap-2">
            {userLinks.map((link) => (
              <NavLink key={link.href} icon={link.icon} href={link.href}>
                {link.text}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ComponentType<LucideProps>;
  className?: string;
}

const NavLink = ({ href, children, icon: Icon, className }: NavLinkProps) => {
  return (
    <Link
      className={`flex items-center gap-2 group p-2 rounded-md -ml-2 transition-all ${className}`}
      href={href}
    >
      <Icon
        className="text-muted-foreground group-hover:text-foreground transition-all"
        size={20}
      />
      {children}
    </Link>
  );
};
