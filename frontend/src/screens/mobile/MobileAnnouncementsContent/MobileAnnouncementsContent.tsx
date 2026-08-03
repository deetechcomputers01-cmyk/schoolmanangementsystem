"use client";

/**
 * MobileAnnouncementsContent — bespoke mobile view for Announcements.
 *
 * Every field/action here traces back to AnnouncementsClient.tsx (the real
 * desktop component) and announcement.service.ts (the real backend):
 *   - title, body, audience[], isPinned, publishedAt, expiresAt, author — real Announcement fields
 *   - create -> POST /api/announcements (same payload as desktop)
 *   - pin/unpin -> PATCH /api/announcements/:id { isPinned } (same as desktop togglePin)
 *   - delete -> DELETE /api/announcements/:id (same as desktop remove, same confirm copy)
 *
 * There is NO draft/scheduled/status field and NO comment/view/reach-count
 * tracking anywhere in the schema or service layer, so those parts of the
 * Stitch mockup are intentionally not reproduced here — see the "Published /
 * Pinned / Expiring Soon" stat pills (real counts, same as the desktop stat
 * cards) and the absence of Edit/Send now/Schedule buttons (desktop itself
 * has no edit/send/schedule UI — only Pin and Delete are real actions).
 */

import { useMemo, useState } from "react";
import {
  Bell, Search, Plus, Megaphone, Pin, PinOff, MoreVertical, Trash2, Loader2,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import styles from "./MobileAnnouncementsContent.module.css";

const ROLES = ["super_admin", "principal", "teacher", "staff", "student", "guardian"] as const;

const AUDIENCE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  principal: "Principal",
  teacher: "Teacher",
  staff: "Staff",
  student: "Student",
  guardian: "Guardian",
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string[];
  isPinned: boolean;
  publishedAt: string | Date;
  expiresAt: string | Date | null;
  author: { name: string; role: string };
};

type Props = {
  initialList: Announcement[];
  canManage: boolean;
};

const BLANK = { title: "", body: "", audience: [] as string[], isPinned: false, expiresAt: "" };

function sortAnnouncements(items: Announcement[]) {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

function isToday(d: string | Date) {
  const date = new Date(d);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function timeAgo(d: string | Date) {
  const date = new Date(d);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (isToday(date)) return `${hours}h ago`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === yesterday.getDate()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function audienceLabel(audience: string[]) {
  if (audience.length === 0) return "Everyone";
  if (audience.length <= 2) return audience.map((r) => AUDIENCE_LABELS[r] ?? r.replace("_", " ")).join(", ");
  return `${audience.length} groups`;
}

export function MobileAnnouncementsContent({ initialList, canManage }: Props) {
  const [list, setList] = useState<Announcement[]>(() => sortAnnouncements(initialList));
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [formError, setFormError] = useState<string | null>(null);

  const notify = (msg: string, ok = true) => showToast(msg, ok ? "success" : "error");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) return false;
      if (audienceFilter && a.audience.length > 0 && !a.audience.includes(audienceFilter)) return false;
      return true;
    });
  }, [list, search, audienceFilter]);

  const todayItems = filtered.filter((a) => isToday(a.publishedAt));
  const earlierItems = filtered.filter((a) => !isToday(a.publishedAt));

  const pinnedCount = list.filter((a) => a.isPinned).length;
  const expiringSoon = list.filter((a) => {
    if (!a.expiresAt) return false;
    const expires = new Date(a.expiresAt);
    const diff = expires.getTime() - Date.now();
    return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 7;
  }).length;

  function openCreateSheet() {
    setForm({ ...BLANK });
    setFormError(null);
    setShowCreate(true);
  }

  function toggleAudience(role: string) {
    setForm((f) => ({
      ...f,
      audience: f.audience.includes(role) ? f.audience.filter((r) => r !== role) : [...f.audience, role],
    }));
  }

  async function submitCreate() {
    if (!form.title.trim() || !form.body.trim()) {
      setFormError("Title and message are required.");
      return;
    }
    setFormError(null);
    setBusy("create");
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          audience: form.audience,
          isPinned: form.isPinned,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setFormError(payload?.message ?? payload?.error ?? "Failed to publish. Please check all fields.");
        setBusy(null);
        return;
      }
      const created = await res.json();
      setBusy(null);
      setShowCreate(false);
      setForm({ ...BLANK });
      setList((current) => sortAnnouncements([created, ...current]));
      notify("Announcement published");
    } catch {
      setFormError("Network error. Please try again.");
      setBusy(null);
    }
  }

  async function togglePin(id: string, isPinned: boolean) {
    setBusy(`pin-${id}`);
    const res = await fetch(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !isPinned }),
    });
    setBusy(null);
    if (res.ok) {
      const updated = await res.json();
      setList((current) => sortAnnouncements(current.map((item) => (item.id === id ? updated : item))));
      notify(isPinned ? "Unpinned" : "Pinned");
    } else {
      notify("Failed", false);
    }
  }

  async function remove(id: string) {
    const ok = await confirm({ message: "Delete this announcement?", tone: "danger", confirmLabel: "Delete" });
    if (!ok) return;
    setBusy(`del-${id}`);
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setList((current) => current.filter((item) => item.id !== id));
      setOpenId(null);
      notify("Deleted");
    } else {
      const payload = await res.json().catch(() => null);
      notify(payload?.error ?? "Failed to delete", false);
    }
  }

  function renderCard(ann: Announcement) {
    const expired = ann.expiresAt ? new Date(ann.expiresAt) < new Date() : false;
    const isOpen = openId === ann.id;
    return (
      <article
        key={ann.id}
        className={`${styles.card} ${ann.isPinned ? styles.cardPinned : ""} ${expired ? styles.cardExpired : ""}`}
      >
        <div className={styles.cardTop} onClick={() => setOpenId(isOpen ? null : ann.id)} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenId(isOpen ? null : ann.id); } }}
        >
          <div className={styles.badgeRow}>
            {ann.isPinned ? <span className={`${styles.badge} ${styles.badgePinned}`}><Pin size={11} /> Pinned</span> : null}
            {expired ? <span className={`${styles.badge} ${styles.badgeExpired}`}>Expired</span> : null}
            <span className={styles.badge}>{audienceLabel(ann.audience)}</span>
            <span className={styles.time}>{timeAgo(ann.publishedAt)}</span>
          </div>
          <h4 className={styles.cardTitle}>{ann.title}</h4>
          <p className={styles.cardSnippet}>{ann.body}</p>
          <div className={styles.authorRow}>
            <span className={styles.avatar}>{initials(ann.author.name)}</span>
            <span className={styles.authorName}>{ann.author.name}</span>
            {canManage ? (
              <button
                type="button"
                className={styles.moreBtn}
                onClick={(e) => { e.stopPropagation(); setOpenId(isOpen ? null : ann.id); }}
                aria-label="More actions"
              >
                <MoreVertical size={18} />
              </button>
            ) : null}
          </div>
        </div>

        {isOpen && canManage ? (
          <div className={styles.cardActionRow} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.cardActionBtn} onClick={() => togglePin(ann.id, ann.isPinned)} disabled={!!busy}>
              {busy === `pin-${ann.id}` ? <Loader2 size={15} className="animate-spin" /> : ann.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
              {ann.isPinned ? "Unpin" : "Pin"}
            </button>
            <button type="button" className={styles.cardActionBtnDanger} onClick={() => remove(ann.id)} disabled={!!busy}>
              {busy === `del-${ann.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Delete
            </button>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.statsRow}>
        <div className={styles.statPill}>
          <strong className={styles.statValue}>{list.length}</strong>
          <span className={styles.statLabel}>Published</span>
        </div>
        <div className={styles.statPill}>
          <strong className={styles.statValue}>{pinnedCount}</strong>
          <span className={styles.statLabel}>Pinned</span>
        </div>
        <div className={styles.statPill}>
          <strong className={`${styles.statValue} ${styles.statValueWarn}`}>{expiringSoon}</strong>
          <span className={styles.statLabel}>Expiring Soon</span>
        </div>
      </div>

      <label className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Search announcements…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${audienceFilter === "" ? styles.chipActive : ""}`} onClick={() => setAudienceFilter("")}>
          All active
        </button>
        {ROLES.map((r) => (
          <button key={r} type="button" className={`${styles.chip} ${audienceFilter === r ? styles.chipActive : ""}`} onClick={() => setAudienceFilter(r)}>
            {AUDIENCE_LABELS[r]}
          </button>
        ))}
      </div>

      {canManage ? (
        <button type="button" className={styles.newBtn} onClick={openCreateSheet}>
          <Plus size={18} /> New Announcement
        </button>
      ) : null}

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <Megaphone size={32} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            {search || audienceFilter ? "No announcements match your search or filter." : "Announcements published by the school will appear here."}
          </p>
        </div>
      ) : (
        <>
          {todayItems.length > 0 ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Today</h3>
              <div className={styles.list}>{todayItems.map(renderCard)}</div>
            </section>
          ) : null}
          {earlierItems.length > 0 ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Earlier</h3>
              <div className={styles.list}>{earlierItems.map(renderCard)}</div>
            </section>
          ) : null}
        </>
      )}

      <MobileSheet
        open={showCreate}
        onClose={() => { if (busy !== "create") setShowCreate(false); }}
        canClose={busy !== "create"}
        eyebrow="Announcement Publisher"
        title="New Announcement"
        subtitle="Publish a clear school notice and target the right audience."
        footer={
          <>
            <button type="button" className={kit.btnOutline} onClick={() => setShowCreate(false)} disabled={busy === "create"}>Cancel</button>
            <button type="button" className={kit.btnPrimary} onClick={submitCreate} disabled={busy === "create"}>
              {busy === "create" ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
              {busy === "create" ? "Publishing…" : "Publish"}
            </button>
          </>
        }
      >
        {formError ? <p className={`${kit.banner} ${kit.bannerDanger}`}>{formError}</p> : null}
        <div className={kit.field}>
          <label>Title *</label>
          <input className={kit.input} placeholder="Announcement title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className={kit.field}>
          <label>Message *</label>
          <textarea className={kit.textarea} rows={5} placeholder="Write your announcement message" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>
        <div className={kit.field}>
          <label>Audience</label>
          <div className={kit.chipRow}>
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                className={`${kit.chip} ${form.audience.includes(role) ? kit.chipActive : ""}`}
                onClick={() => toggleAudience(role)}
              >
                {AUDIENCE_LABELS[role]}
              </button>
            ))}
          </div>
          <p className={kit.helperText}>Leave all unselected to publish to everyone.</p>
        </div>
        <div className={kit.field}>
          <label>Expires At</label>
          <input className={kit.input} type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        </div>
        <label className={kit.checkboxRow}>
          <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
          <span>
            <span className={kit.checkboxLabel}>Pin this announcement</span>
            <span className={kit.checkboxSub}>Priority notices are kept at the top of the feed.</span>
          </span>
        </label>
      </MobileSheet>
    </div>
  );
}
