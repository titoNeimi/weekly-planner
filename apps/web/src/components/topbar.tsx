import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavLinks from "@/components/nav-links";
import SignInLink from "@/components/sign-in-link";
import SearchButton from "@/components/search-button";
import AccountMenu from "@/components/account-menu";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function Topbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { weekStartsOn: true },
      })
    : null;
  const weekStartsOn = profile?.weekStartsOn === 0 ? 0 : 1;

  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href={user ? "/dashboard" : "/"}
            className="shrink-0 font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            Weekly Planner
          </Link>
          {user && (
            <div className="hidden sm:block">
              <NavLinks />
            </div>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-1">
            <SearchButton />
            <AccountMenu
              avatarUrl={user.user_metadata.avatar_url}
              name={user.user_metadata.full_name}
              email={user.email}
              initialWeekStartsOn={weekStartsOn}
              onSignOut={signOut}
            />
          </div>
        ) : (
          <SignInLink />
        )}

        {user && (
          <div className="order-last w-full sm:hidden">
            <NavLinks />
          </div>
        )}
      </div>
    </header>
  );
}
