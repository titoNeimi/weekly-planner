"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function SignOutButton({ action }: { action: () => Promise<void> }) {
  const { t } = useLanguage();

  return (
    <form action={action}>
      <button className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer">
        {t("topbar_sign_out")}
      </button>
    </form>
  );
}
