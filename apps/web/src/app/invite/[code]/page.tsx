"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type State = "loading" | "ready" | "joining" | "success" | "expired" | "invalid" | "error";

interface InvitePreview {
  teamId: string;
  teamName: string;
}

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { t, tpl } = useLanguage();

  const [state, setState] = useState<State>("loading");
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const loadPreview = useCallback(() => {
    if (!code) {
      setState("invalid");
      return;
    }
    setState("loading");
    fetch(`/api/invitations/${code}`)
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return null; }
        if (r.status === 404) { setState("invalid"); return null; }
        if (r.status === 410) { setState("expired"); return null; }
        if (!r.ok) { setState("error"); return null; }
        return r.json();
      })
      .then((data: InvitePreview | null) => {
        if (!data) return;
        setPreview(data);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [code, router]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleJoin = async () => {
    setState("joining");
    setJoinError(null);
    try {
      const r = await fetch(`/api/invitations/${code}/use`, { method: "POST" });
      if (r.status === 401) { router.replace("/login"); return; }
      if (r.status === 404) { setState("invalid"); return; }
      if (r.status === 410) { setState("expired"); return; }
      if (r.status === 409) {
        router.replace("/dashboard");
        return;
      }
      if (!r.ok) {
        setState("ready");
        setJoinError(t("invite_error_join"));
        return;
      }
      setState("success");
      setTimeout(() => router.replace("/dashboard"), 1500);
    } catch {
      setState("ready");
      setJoinError(t("invite_error_join"));
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">

        {state === "loading" && (
          <>
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
            <p className="text-sm text-gray-500">{t("invite_loading")}</p>
          </>
        )}

        {(state === "ready" || state === "joining") && preview && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
              <Users className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {t("invite_invited_to")}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-gray-900">{preview.teamName}</h1>
            </div>

            {joinError && <p className="text-sm text-red-500">{joinError}</p>}

            <button
              onClick={handleJoin}
              disabled={state === "joining"}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-60 cursor-pointer"
            >
              {state === "joining" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("invite_joining")}
                </>
              ) : (
                t("invite_accept")
              )}
            </button>
          </>
        )}

        {state === "success" && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{tpl("invite_joined", { name: preview?.teamName ?? "" })}</p>
              <p className="mt-1 text-sm text-gray-500">{t("invite_redirecting")}</p>
            </div>
          </>
        )}

        {state === "expired" && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{t("invite_expired_title")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t("invite_expired_body")}
              </p>
            </div>
            <a
              href="/dashboard"
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              {t("invite_go_dashboard")}
            </a>
          </>
        )}

        {state === "invalid" && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{t("invite_invalid_title")}</p>
              <p className="mt-1 text-sm text-gray-500">{t("invite_invalid_body")}</p>
            </div>
            <a
              href="/dashboard"
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              {t("invite_go_dashboard")}
            </a>
          </>
        )}

        {state === "error" && (
          <>
            <p className="text-base font-semibold text-gray-900">{t("invite_error_title")}</p>
            <p className="text-sm text-gray-500">{t("invite_error_body")}</p>
            <button
              onClick={loadPreview}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-700 cursor-pointer"
            >
              {t("invite_retry")}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
