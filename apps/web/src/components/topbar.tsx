import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/avatar";
import NavLinks from "@/components/nav-links";
import SignInLink from "@/components/sign-in-link";
import LangToggle from "@/components/lang-toggle";
import SignOutButton from "@/components/sign-out-button";

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

  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href={user ? "/dashboard" : "/"}
            className="shrink-0 font-semibold text-gray-900 hover:text-gray-600 transition"
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
          <div className="flex items-center gap-1 sm:gap-4">
            <div className="flex items-center gap-2">
              <Avatar
                avatarUrl={user.user_metadata.avatar_url}
                name={user.user_metadata.full_name}
                email={user.email}
              />
              <span className="hidden sm:inline text-sm text-gray-600">
                {user.user_metadata.full_name ?? user.email}
              </span>
            </div>
            <LangToggle />
            <SignOutButton action={signOut} />
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
