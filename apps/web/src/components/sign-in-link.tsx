"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SignInLink() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <Link
      href="/login"
      className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white transition hover:bg-primary-hover"
    >
      Sign in
    </Link>
  );
}
