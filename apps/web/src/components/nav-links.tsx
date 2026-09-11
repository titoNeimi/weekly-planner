"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function NavLinks() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const LINKS = [
    { href: "/dashboard", label: t("nav_dashboard") },
    { href: "/agenda", label: t("nav_agenda") },
    { href: "/teams", label: t("nav_teams") },
  ];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition ${
            pathname === href
              ? "bg-gray-100 font-medium text-gray-900"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
