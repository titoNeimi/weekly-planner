"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function SignOutButton({ action }: { action: () => Promise<void> }) {
  const { t } = useLanguage();

  return (
    <form action={action}>
      <button className="rounded-md px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100 transition cursor-pointer">
        {t("topbar_sign_out")}
      </button>
    </form>
  );
}
