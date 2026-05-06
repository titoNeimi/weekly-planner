"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agenda", label: "Agenda" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-md px-3 py-1.5 text-sm transition ${
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
