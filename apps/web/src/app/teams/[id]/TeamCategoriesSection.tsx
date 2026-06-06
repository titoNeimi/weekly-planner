"use client";

import { useState, useEffect } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORY_COLORS,
  SWATCH_CLASSES,
  type CategoryColor,
} from "@/lib/category-colors";
import { useLanguage } from "@/context/LanguageContext";

type DiscordChannel = { id: string; name: string };

export type TeamCategoryData = {
  id: string;
  name: string;
  color: string;
  discordChannel: string | null;
  reminderHours: number | null;
};

type FormState = {
  name: string;
  color: CategoryColor;
  discordChannel: string;
  reminderHours: string;
};

function defaultForm(cat?: TeamCategoryData): FormState {
  return {
    name: cat?.name ?? "",
    color: (cat?.color as CategoryColor) ?? "blue",
    discordChannel: cat?.discordChannel ?? "",
    reminderHours: cat?.reminderHours?.toString() ?? "",
  };
}

function CategoryForm({
  form,
  onChange,
  saving,
  onCancel,
  onSubmit,
  submitLabel,
  channels,
  loadingChannels,
  hasDiscord,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  saving: boolean;
  onCancel: () => void;
  onSubmit?: () => void;
  submitLabel: string;
  channels: DiscordChannel[];
  loadingChannels: boolean;
  hasDiscord: boolean;
}) {
  const { t } = useLanguage();

  const reminderOptions = [
    { label: t("team_cat_no_reminder"), value: "" },
    { label: t("team_cat_1h"), value: "1" },
    { label: t("team_cat_24h"), value: "24" },
    { label: t("team_cat_72h"), value: "72" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-32 flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">{t("team_cat_label_name")}</label>
          <input
            autoFocus
            required
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder={t("team_cat_label_name")}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">
            {t("team_cat_discord_channel")}
          </label>
          {hasDiscord ? (
            <select
              value={form.discordChannel}
              onChange={(e) => onChange({ ...form, discordChannel: e.target.value })}
              disabled={loadingChannels}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-gray-400 disabled:opacity-60"
            >
              <option value="">{t("team_cat_no_channel")}</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              disabled
              placeholder={t("team_cat_connect_discord")}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-400 outline-none opacity-60 cursor-not-allowed"
            />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">{t("team_cat_label_reminder")}</label>
          <select
            value={form.reminderHours}
            onChange={(e) => onChange({ ...form, reminderHours: e.target.value })}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-gray-400"
          >
            {reminderOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange({ ...form, color: c })}
            className={`h-5 w-5 rounded-full transition ${SWATCH_CLASSES[c]} ring-offset-1 ${
              form.color === c
                ? "ring-2 ring-gray-500"
                : "hover:ring-1 hover:ring-gray-300"
            }`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-white"
        >
          {t("cancel")}
        </button>
        <button
          type={onSubmit ? "button" : "submit"}
          onClick={onSubmit}
          disabled={saving}
          className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? t("saving") : submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function TeamCategoriesSection({
  teamId,
  canManage,
  discordGuildId,
  categories,
  onCategoriesChange,
}: {
  teamId: string;
  canManage: boolean;
  discordGuildId: string | null;
  categories: TeamCategoryData[];
  onCategoriesChange: (cats: TeamCategoryData[]) => void;
}) {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(defaultForm());
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    if (!discordGuildId) return;
    setLoadingChannels(true);
    fetch(`/api/discord/${discordGuildId}/channels`)
      .then((r) => (r.ok ? r.json() : Promise.resolve([])))
      .then((data) => setChannels(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingChannels(false));
  }, [discordGuildId]);

  function startEdit(cat: TeamCategoryData) {
    setEditingId(cat.id);
    setEditForm(defaultForm(cat));
    setShowCreate(false);
  }

  async function saveEdit(catId: string) {
    if (!editForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/team/${teamId}/categories/${catId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          color: editForm.color,
          discordChannel: editForm.discordChannel.trim() || null,
          reminderHours: editForm.reminderHours
            ? Number(editForm.reminderHours)
            : null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: TeamCategoryData = await res.json();
      onCategoriesChange(
        categories.map((c) => (c.id === catId ? updated : c)),
      );
      setEditingId(null);
      toast.success(t("cat_renamed"));
    } catch {
      toast.error("Failed to update category");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(catId: string) {
    setDeletingId(catId);
    try {
      const res = await fetch(`/api/team/${teamId}/categories/${catId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      onCategoriesChange(categories.filter((c) => c.id !== catId));
      toast.success(t("cat_deleted"));
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/team/${teamId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          color: createForm.color,
          discordChannel: createForm.discordChannel.trim() || null,
          reminderHours: createForm.reminderHours
            ? Number(createForm.reminderHours)
            : null,
        }),
      });
      if (!res.ok) throw new Error();
      const created: TeamCategoryData = await res.json();
      onCategoriesChange(
        [...categories, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setShowCreate(false);
      setCreateForm(defaultForm());
      toast.success(t("cat_created"));
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900">{t("team_cat_title")}</h2>
        {canManage && (
          <button
            onClick={() => {
              setShowCreate((v) => !v);
              setEditingId(null);
              setCreateForm(defaultForm());
            }}
            className="flex cursor-pointer items-center gap-1 text-sm text-gray-500 transition hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
            {t("team_cat_new")}
          </button>
        )}
      </div>

      {showCreate && canManage && (
        <form
          onSubmit={createCategory}
          className="border-b border-gray-100 bg-gray-50 px-5 py-4"
        >
          <CategoryForm
            form={createForm}
            onChange={setCreateForm}
            saving={saving}
            onCancel={() => setShowCreate(false)}
            submitLabel={t("create")}
            channels={channels}
            loadingChannels={loadingChannels}
            hasDiscord={!!discordGuildId}
          />
        </form>
      )}

      {categories.length === 0 && !showCreate ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400">
          {canManage ? t("team_cat_empty") : t("team_cat_empty_short")}
        </p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {categories.map((cat) => (
            <li key={cat.id}>
              {editingId === cat.id ? (
                <div className="bg-gray-50 px-5 py-4">
                  <CategoryForm
                    form={editForm}
                    onChange={setEditForm}
                    saving={saving}
                    onCancel={() => setEditingId(null)}
                    onSubmit={() => saveEdit(cat.id)}
                    submitLabel={t("save")}
                    channels={channels}
                    loadingChannels={loadingChannels}
                    hasDiscord={!!discordGuildId}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      SWATCH_CLASSES[cat.color as CategoryColor] ?? "bg-gray-300"
                    }`}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-800">
                    {cat.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    {cat.discordChannel ? (
                      <span className="hidden max-w-32 truncate text-xs text-gray-400 sm:block">
                        #{channels.find((c) => c.id === cat.discordChannel)?.name ?? "channel"}
                      </span>
                    ) : (
                      <span className="hidden text-xs text-gray-300 sm:block">
                        {t("team_cat_no_channel")}
                      </span>
                    )}
                    {cat.reminderHours ? (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                        {cat.reminderHours}h
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                        {t("team_cat_no_reminder")}
                      </span>
                    )}
                    {canManage && (
                      <>
                        <button
                          onClick={() => startEdit(cat)}
                          className="cursor-pointer text-gray-300 transition hover:text-gray-500"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          disabled={deletingId === cat.id}
                          className="cursor-pointer text-gray-300 transition hover:text-red-500 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
