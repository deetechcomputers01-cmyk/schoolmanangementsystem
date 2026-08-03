"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import {
  Bell,
  Check,
  Clock3,
  Loader2,
  Megaphone,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { DesktopFormModal } from "@/components/desktop/ui/DesktopFormModal/DesktopFormModal";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { useConfirm } from "@/components/desktop/ui/ConfirmDialog/ConfirmDialog";
import styles from "./AnnouncementsClient.module.css";

const ROLES = ["super_admin", "principal", "teacher", "staff", "student", "guardian"] as const;

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
  currentRole: string;
};

const AUDIENCE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  principal: "Principal",
  teacher: "Teacher",
  staff: "Staff",
  student: "Student",
  guardian: "Guardian",
};

const BLANK = { title: "", body: "", audience: [] as string[], isPinned: false, expiresAt: "" };

function sortAnnouncements(items: Announcement[]) {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AnnouncementsClient({ initialList, canManage, currentRole }: Props) {
  const [list, setList] = useState<Announcement[]>(initialList);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [busy, setBusy] = useState<string | null>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");

  const notify = (msg: string, ok = true) => {
    showToast(msg, ok ? "success" : "error");
  };

  const reload = async () => {
    const res = await fetch("/api/announcements");
    if (res.ok) setList(sortAnnouncements(await res.json()));
  };

  const toggleAudience = (role: string) => {
    setForm((f) => ({
      ...f,
      audience: f.audience.includes(role) ? f.audience.filter((r) => r !== role) : [...f.audience, role],
    }));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("create");
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
    setBusy(null);
    if (res.ok) {
      const created = await res.json();
      setShowForm(false);
      setForm({ ...BLANK });
      setList((current) => sortAnnouncements([created, ...current]));
      notify("Announcement published");
    } else {
      notify("Failed to publish", false);
    }
  };

  const togglePin = async (id: string, isPinned: boolean) => {
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
  };

  const remove = async (id: string) => {
    if (!(await confirm({ message: "Delete this announcement?", tone: "danger", confirmLabel: "Delete" }))) return;
    setBusy(`del-${id}`);
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setList((current) => current.filter((item) => item.id !== id));
      notify("Deleted");
    } else {
      const payload = await res.json().catch(() => null);
      notify(payload?.error ?? "Failed to delete", false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) return false;
      if (audienceFilter && a.audience.length > 0 && !a.audience.includes(audienceFilter)) return false;
      return true;
    });
  }, [list, search, audienceFilter]);

  const pinned = filtered.filter((a) => a.isPinned);
  const regular = filtered.filter((a) => !a.isPinned);
  const expiringSoon = list.filter((a) => {
    if (!a.expiresAt) return false;
    const expires = new Date(a.expiresAt);
    const diff = expires.getTime() - Date.now();
    return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 7;
  }).length;
  const targetedAnnouncements = list.filter((a) => a.audience.length > 0).length;
  const uniqueAudienceCount = new Set(list.flatMap((a) => a.audience)).size;
  const audienceInsights = list.reduce<Record<string, number>>((acc, ann) => {
    const audiences = ann.audience.length > 0 ? ann.audience : [currentRole || "school"];
    audiences.forEach((audience) => {
      acc[audience] = (acc[audience] ?? 0) + 1;
    });
    return acc;
  }, {});
  const topAudiences = Object.entries(audienceInsights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const coverageFor = (roles: string[]) => {
    if (list.length === 0) return 0;
    const matching = list.filter((a) => a.audience.length === 0 || a.audience.some((r) => roles.includes(r))).length;
    return Math.round((matching / list.length) * 100);
  };
  const reachInsights = [
    { label: "Students", value: coverageFor(["student"]) },
    { label: "Staff", value: coverageFor(["super_admin", "principal", "teacher", "staff"]) },
    { label: "Parents", value: coverageFor(["guardian"]) },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Communications</p>
          <h1 className={styles.title}>Announcements</h1>
          <p className={styles.subtitle}>
            Manage school-wide notices, role-based updates, and time-sensitive communications from one clear publishing space.
          </p>
        </div>
        <div className={styles.heroActions}>
          <select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)} className={styles.select}>
            <option value="">All Audiences</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {AUDIENCE_LABELS[r]}
              </option>
            ))}
          </select>
          {canManage && !showForm ? (
            <button onClick={() => setShowForm(true)} className={styles.newButton}>
              <Plus size={14} />
              New Announcement
            </button>
          ) : null}
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Announcement summary">
        <StatCard icon={<Megaphone size={15} />} label="Total Announcements" value={String(list.length)} meta="Published school communications" />
        <StatCard icon={<Pin size={15} />} label="Pinned" value={String(pinned.length)} meta="Priority notices shown first" />
        <StatCard icon={<Users size={15} />} label="Active Audiences" value={String(uniqueAudienceCount || 1)} meta={`${targetedAnnouncements} targeted announcement${targetedAnnouncements === 1 ? "" : "s"}`} />
        <StatCard icon={<Clock3 size={15} />} label="Expiring Soon" value={String(expiringSoon)} meta="Within the next 7 days" />
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.surface}>
            <div className={styles.surfaceHeader}>
              <div className={styles.surfaceTitleWrap}>
                <h2 className={styles.surfaceTitle}>Announcement Library</h2>
                <p className={styles.surfaceSubtitle}>Search, review, and manage school-wide communication records.</p>
              </div>
              <div className={styles.toolbar}>
                <label className={styles.searchWrap}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search announcements by title or content"
                    className={`${styles.input} ${styles.searchInput}`}
                  />
                </label>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={36} className="text-muted/40" />
                <p className={styles.emptyTitle}>No announcements found</p>
                <p className={styles.emptyText}>
                  {search || audienceFilter ? "Try adjusting the search term or audience filter." : "Announcements published by the school will appear here."}
                </p>
              </div>
            ) : (
              <>
                {pinned.length > 0 ? (
                  <AnnouncementSection
                    title="Pinned Announcements"
                    subtitle="Priority notices kept at the top of the communication feed."
                    items={pinned}
                    canManage={canManage}
                    busy={busy}
                    onPin={togglePin}
                    onDelete={remove}
                  />
                ) : null}
                {regular.length > 0 ? (
                  <AnnouncementSection
                    title="Recent Announcements"
                    subtitle="All other published notices in chronological order."
                    items={regular}
                    canManage={canManage}
                    busy={busy}
                    onPin={togglePin}
                    onDelete={remove}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>

        <aside className={styles.rail}>
          <div className={styles.surface}>
            <div className={styles.surfaceTitleWrap}>
              <h2 className={styles.surfaceTitle}>Reach Insights</h2>
              <p className={styles.surfaceSubtitle}>Audience coverage across your published announcements.</p>
            </div>
            <div className={styles.reachList}>
              {reachInsights.map((item) => (
                <div key={item.label} className={styles.reachItem}>
                  <div className={styles.reachLabelRow}>
                    <span>{item.label}</span>
                    <span className={styles.reachValue}>{item.value}% Coverage</span>
                  </div>
                  <div className={styles.reachTrack}>
                    <div className={styles.reachFill} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.surface}>
            <div className={styles.surfaceTitleWrap}>
              <h2 className={styles.surfaceTitle}>Announcement Insights</h2>
              <p className={styles.surfaceSubtitle}>Quick visibility into communication reach and activity.</p>
            </div>
            <div className={styles.railStatGrid}>
              <div className={styles.railStat}>
                <span className={styles.railStatLabel}>Pinned priority notices</span>
                <strong className={styles.railStatValue}>{pinned.length}</strong>
              </div>
              <div className={styles.railStat}>
                <span className={styles.railStatLabel}>Announcements for everyone</span>
                <strong className={styles.railStatValue}>{list.filter((a) => a.audience.length === 0).length}</strong>
              </div>
              <div className={styles.railStat}>
                <span className={styles.railStatLabel}>Role-targeted updates</span>
                <strong className={styles.railStatValue}>{targetedAnnouncements}</strong>
              </div>
            </div>
          </div>

          <div className={styles.surface}>
            <div className={styles.surfaceTitleWrap}>
              <h2 className={styles.surfaceTitle}>Top Audiences</h2>
              <p className={styles.surfaceSubtitle}>The most frequently targeted groups from your current records.</p>
            </div>
            <div className={styles.smallList}>
              {topAudiences.length > 0 ? (
                topAudiences.map(([audience, count]) => (
                  <div key={audience} className={styles.smallItem}>
                    <span className={styles.smallLabel}>{AUDIENCE_LABELS[audience] ?? audience.replace("_", " ")}</span>
                    <span className={styles.smallTitle}>{count} announcement{count === 1 ? "" : "s"}</span>
                    <span className={styles.smallText}>Used in recent communication targeting.</span>
                  </div>
                ))
              ) : (
                <div className={styles.smallItem}>
                  <span className={styles.smallLabel}>School-wide</span>
                  <span className={styles.smallTitle}>Everyone</span>
                  <span className={styles.smallText}>No targeted audience filters have been used yet.</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.surface}>
            <div className={styles.surfaceTitleWrap}>
              <h2 className={styles.surfaceTitle}>Publishing Checklist</h2>
              <p className={styles.surfaceSubtitle}>A quick guide to keep each school notice clear and actionable.</p>
            </div>
            <div className={styles.checklist}>
              <ChecklistItem title="Use a specific title" text="Lead with the event, activity, or deadline so the notice is easy to scan." />
              <ChecklistItem title="Target only the right audience" text="Use audience filters for staff, students, or guardians when the message is not school-wide." />
              <ChecklistItem title="Pin urgent notices" text="Pin exam schedules, closures, and payment deadlines so they remain visible on the dashboard." />
            </div>
          </div>
        </aside>
      </section>

      <DesktopFormModal
        open={showForm && canManage}
        title="Create Announcement"
        subtitle="Publish a clear school notice, target the right audience, and pin urgent updates so they remain visible on the dashboard."
        eyebrow="Announcement Publisher"
        width={760}
        onClose={() => { if (!busy) setShowForm(false); }}
        canClose={!busy}
        footer={
          <>
            <button type="button" onClick={() => setShowForm(false)} className={styles.textButton} disabled={!!busy}>
              Cancel
            </button>
            <button type="submit" form="announcement-form" disabled={!!busy} className={styles.primaryButton}>
              {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
              Publish Announcement
            </button>
          </>
        }
      >
        <form id="announcement-form" onSubmit={create} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Title</label>
            <input
              required
              placeholder="Announcement title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Message</label>
            <textarea
              required
              rows={6}
              placeholder="Write your announcement message"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className={styles.textarea}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Audience</label>
            <div className={styles.roleGrid}>
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleAudience(role)}
                  className={`${styles.roleButton} ${form.audience.includes(role) ? styles.roleButtonActive : ""}`}
                >
                  {AUDIENCE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Expires At</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className={styles.input}
              />
            </div>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              />
              Pin this announcement
            </label>
          </div>
        </form>
      </DesktopFormModal>
    </div>
  );
}

function StatCard({ icon, label, value, meta }: { icon: React.ReactNode; label: string; value: string; meta: string }) {
  return (
    <article className={styles.statCard}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statIcon}>{icon}</span>
      </div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statMeta}>{meta}</div>
      </div>
    </article>
  );
}

function AnnouncementSection({
  title,
  subtitle,
  items,
  canManage,
  busy,
  onPin,
  onDelete,
}: {
  title: string;
  subtitle: string;
  items: Announcement[];
  canManage: boolean;
  busy: string | null;
  onPin: (id: string, isPinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className={styles.cards}>
      <div className={styles.surfaceTitleWrap}>
        <h3 className={styles.surfaceTitle}>{title}</h3>
        <p className={styles.surfaceSubtitle}>{subtitle}</p>
      </div>
      {items.map((ann) => (
        <AnnouncementCard
          key={ann.id}
          ann={ann}
          canManage={canManage}
          busy={busy}
          onPin={() => onPin(ann.id, ann.isPinned)}
          onDelete={() => onDelete(ann.id)}
        />
      ))}
    </section>
  );
}

function AnnouncementCard({
  ann,
  canManage,
  busy,
  onPin,
  onDelete,
}: {
  ann: Announcement;
  canManage: boolean;
  busy: string | null;
  onPin: () => void;
  onDelete: () => void;
}) {
  const expired = ann.expiresAt ? new Date(ann.expiresAt) < new Date() : false;

  return (
    <article className={`${styles.announcementCard} ${ann.isPinned ? styles.announcementCardPinned : ""} ${expired ? styles.announcementCardExpired : ""}`}>
      <div className={styles.announcementTop}>
        <div className={styles.announcementCopy}>
          <div className={styles.announcementLabelRow}>
            {ann.isPinned ? (
              <span className={styles.pinnedLabel}>
                <Pin size={11} />
                Pinned
              </span>
            ) : null}
            {expired ? <Badge tone="danger">Expired</Badge> : null}
          </div>
          <h3 className={styles.cardTitle}>{ann.title}</h3>
          <p className={styles.cardBody}>{ann.body}</p>
          <div className={styles.metaRow}>
            <span>
              By <span className={styles.metaStrong}>{ann.author.name}</span>
            </span>
            <span>
              Published <span className={styles.metaStrong}>{fmt(ann.publishedAt)}</span>
            </span>
            {ann.expiresAt && !expired ? (
              <span>
                Expires <span className={styles.metaStrong}>{fmt(ann.expiresAt)}</span>
              </span>
            ) : null}
          </div>
          <div className={styles.chips}>
            {ann.audience.length > 0 ? (
              ann.audience.map((r) => (
                <span key={r} className={styles.chip}>
                  {AUDIENCE_LABELS[r] ?? r.replace("_", " ")}
                </span>
              ))
            ) : (
              <span className={`${styles.chip} ${styles.chipEveryone}`}>Everyone</span>
            )}
          </div>
        </div>
        {canManage ? (
          <div className={styles.cardActions}>
            <button onClick={onPin} disabled={!!busy} title={ann.isPinned ? "Unpin" : "Pin"} className={styles.iconButton}>
              {busy === `pin-${ann.id}` ? <Loader2 size={13} className="animate-spin" /> : ann.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button onClick={onDelete} disabled={!!busy} className={`${styles.iconButton} ${styles.iconButtonDanger}`}>
              {busy === `del-${ann.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ChecklistItem({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.checkItem}>
      <span className={styles.checkIcon}>
        <Check size={12} />
      </span>
      <div>
        <p className={styles.checkTitle}>{title}</p>
        <p className={styles.checkText}>{text}</p>
      </div>
    </div>
  );
}
