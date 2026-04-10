import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function Topbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href={user ? "/dashboard" : "/"} className="font-semibold text-gray-900 hover:text-gray-600 transition">
          Weekly Planner
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.user_metadata.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="h-7 w-7 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600">
                {user.user_metadata.full_name ?? user.email}
              </span>
            </div>
            <form action={signOut}>
              <button className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
