"use client";

/**
 * MobileCanteenContent — bespoke mobile view for the Canteen screen.
 *
 * Every field/action traces back to CanteenContent.tsx (the real desktop
 * component) and the real /api/canteen endpoints — same saveMenuCell(),
 * markServed(), goToWeek() logic.
 *
 * The Stitch mockup (mobile_canteen_indigo_refined) depicts an entirely
 * different kind of canteen system than what this app has: a POS/inventory
 * screen with per-item pricing ("GHS 15.00"), stock counts ("45 left"),
 * "Mark Sold Out"/"Add Stock"/"Restock" actions, a student prepaid-balance
 * wallet, and a "Recent Sales" receipt log. None of that exists anywhere in
 * the schema — this app's real Canteen module is a weekly meal-menu
 * planner + serving/attendance tracker with dietary alerts. So this screen
 * keeps the mockup's visual chrome (KPI grid, colored session-selector
 * card, CTA row, search + filter chips, card-list sections, toast style)
 * but populates it entirely with real data:
 *   - KPI grid: Meals Served Today (+delta), Dietary Alerts, Students
 *     Served, Menu Items this week — real stats, not sales/stock figures.
 *   - "Meal Session Selector" → real Day + Breakfast/Lunch/Dinner picker
 *     driving the Weekly Menu / Serve views (mealTypes are Breakfast/
 *     Lunch/Dinner — the mockup's "Supper" doesn't exist in this schema).
 *   - "Record Sale"/"Update Stock" CTAs → real "Serve Meals" action.
 *   - Priced/stocked "Menu Items" list → a single reactive "{selectedDay}'s
 *     Menu" section scoped to whichever day chip is selected above it (tap a
 *     meal row to edit — opens the ported menu-cell sheet). Originally this
 *     was a static list of all 5 days shown at once, so tapping a day chip
 *     changed which day the header CTA/serve-tab targeted but nothing
 *     visibly changed on screen — fixed so the visible menu content itself
 *     is driven by `selectedDay`/`selectedMealType`. The redundant "Edit
 *     Menu" header button (openQuickAdd()'s ambiguous first-empty-slot
 *     target) was removed from desktop too — meal rows are directly
 *     tappable/specific on both platforms now.
 *   - Prepaid-balance "Student Meal Plan" card → no wallet/balance system
 *     exists; omitted. Real per-student dietary info lives in the Dietary
 *     Notes tab instead (real allergies/conditions).
 *   - "Recent Sales" receipt list → real "Serving Log" (today's servings).
 *   - Category filter chips (Meals/Snacks/Drinks) → real class filter
 *     (matches desktop's actual Serve/Dietary filters).
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Users, Receipt, Search,
  ChevronLeft, ChevronRight, Check, TrendingUp, TrendingDown,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { initials } from "@/screens/desktop/CanteenScreen/CanteenContent";
import type { CanteenContentProps } from "@/screens/desktop/CanteenScreen/CanteenContent";
import styles from "./MobileCanteenContent.module.css";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"] as const;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function MobileCanteenContent({ weekOf, weekLabel, menuGrid, students, servingLog, stats }: CanteenContentProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const defaultDay = menuGrid.some((d) => d.day === todayName) ? todayName : menuGrid[0]?.day ?? "Monday";
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selectedMealType, setSelectedMealType] = useState<string>("Lunch");
  const activeMenu = menuGrid.find((d) => d.day === selectedDay)?.meals.find((m) => m.mealType === selectedMealType) ?? null;

  const [subTab, setSubTab] = useState<"serve" | "dietary">("serve");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [servedIds, setServedIds] = useState<Set<string>>(new Set());
  const [serving, setServing] = useState(false);

  useEffect(() => {
    if (!activeMenu?.id) { setServedIds(new Set()); return; }
    fetch(`/api/canteen/serve?menuId=${activeMenu.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { studentId: string }[]) => setServedIds(new Set(rows.map((r) => r.studentId))))
      .catch(() => setServedIds(new Set()));
  }, [activeMenu?.id]);

  const uniqueClasses = useMemo(() => Array.from(new Set(students.map((s) => s.className))).sort(), [students]);
  const dietaryStudents = students.filter((s) => s.allergies);
  const displayStudents = (subTab === "dietary" ? dietaryStudents : students).filter((s) =>
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase())) &&
    (classFilter === "" || s.className === classFilter)
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function markServed() {
    if (!activeMenu?.id) { showToast("No menu set for this day/meal yet — add one first.", "error"); return; }
    if (selectedIds.size === 0) { showToast("Select at least one student.", "error"); return; }
    setServing(true);
    try {
      const res = await fetch("/api/canteen/serve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: activeMenu.id, studentIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Failed");
      setServedIds((prev) => new Set([...prev, ...selectedIds]));
      showToast(`${selectedIds.size} student${selectedIds.size !== 1 ? "s" : ""} marked served`);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      showToast("Failed to mark served", "error");
    } finally {
      setServing(false);
    }
  }

  function goToWeek(offsetDays: number) {
    const d = new Date(weekOf + "T00:00:00.000Z");
    d.setDate(d.getDate() + offsetDays);
    router.push(`/canteen?week=${d.toISOString().slice(0, 10)}`);
  }

  // ── Edit menu cell sheet ──────────────────────────────────────────────
  const [editingCell, setEditingCell] = useState<{ day: string; mealType: string } | null>(null);
  const [editItemsText, setEditItemsText] = useState("");
  const [savingMenu, setSavingMenu] = useState(false);

  function openEditCell(day: string, mealType: string, items: string[]) {
    setEditingCell({ day, mealType });
    setEditItemsText(items.join("\n"));
  }

  async function saveMenuCell() {
    if (!editingCell) return;
    setSavingMenu(true);
    try {
      const items = editItemsText.split("\n").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/canteen/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekOf, day: editingCell.day, mealType: editingCell.mealType, items }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Menu updated");
      setEditingCell(null);
      router.refresh();
    } catch {
      showToast("Failed to save menu", "error");
    } finally {
      setSavingMenu(false);
    }
  }

  const servedDelta = stats.servedYesterday > 0
    ? Math.round(((stats.servedToday - stats.servedYesterday) / stats.servedYesterday) * 100)
    : null;

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Served Today</span>
          <div className={styles.kpiBottom}>
            <strong className={styles.kpiValue}>{stats.servedToday}</strong>
            {servedDelta !== null && (
              <span className={`${styles.kpiDelta} ${servedDelta < 0 ? styles.kpiDeltaDown : ""}`}>
                {servedDelta < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}{servedDelta > 0 ? "+" : ""}{servedDelta}%
              </span>
            )}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Dietary Alerts</span>
          <div className={styles.kpiBottom}><strong className={stats.dietaryAlerts > 0 ? styles.kpiValueWarn : styles.kpiValue}>{stats.dietaryAlerts}</strong><AlertTriangle size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Students Served</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{stats.servedToday}/{stats.studentCount}</strong><Users size={18} className={styles.kpiIcon} /></div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Menu Items</span>
          <div className={styles.kpiBottom}><strong className={styles.kpiValue}>{stats.totalDishesThisWeek}</strong><Receipt size={18} className={styles.kpiIcon} /></div>
        </div>
      </div>

      <section className={styles.sessionCard}>
        <div className={styles.sessionTop}>
          <button type="button" className={styles.weekNavBtn} onClick={() => goToWeek(-7)}><ChevronLeft size={15} /></button>
          <span className={styles.sessionWeek}>Week of {weekLabel}</span>
          <button type="button" className={styles.weekNavBtn} onClick={() => goToWeek(7)}><ChevronRight size={15} /></button>
        </div>
        <div className={styles.dayRow}>
          {menuGrid.map((d) => (
            <button key={d.day} type="button" className={`${styles.dayChip} ${selectedDay === d.day ? styles.dayChipActive : ""}`} onClick={() => setSelectedDay(d.day)}>
              {d.day.slice(0, 3)}
            </button>
          ))}
        </div>
        <div className={styles.mealRow}>
          {MEAL_TYPES.map((m) => (
            <button key={m} type="button" className={`${styles.mealBtn} ${selectedMealType === m ? styles.mealBtnActive : ""}`} onClick={() => setSelectedMealType(m)}>{m}</button>
          ))}
        </div>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>{selectedDay}&apos;s Menu</h2>
        <div className={styles.list}>
          {(menuGrid.find((d) => d.day === selectedDay)?.meals ?? []).map((m) => (
            <button
              key={m.mealType}
              type="button"
              className={`${styles.menuMealChip} ${m.mealType === selectedMealType ? styles.menuMealChipActive : ""}`}
              onClick={() => { setSelectedMealType(m.mealType); openEditCell(selectedDay, m.mealType, m.items); }}
            >
              <span className={styles.menuMealType}>{m.mealType}</span>
              {m.items.length === 0 ? (
                <span className={styles.menuEmpty}>Tap to set menu</span>
              ) : (
                <span className={styles.menuItemsText}>{m.items.join(", ")}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <button type="button" className={styles.btnPrimary} disabled={serving || selectedIds.size === 0} onClick={markServed} style={{ width: "100%" }}>
        <Check size={14} /> Mark {selectedIds.size || ""} Served
      </button>

      <section>
        <h2 className={styles.sectionTitle}>Recent Servings</h2>
        <div className={styles.list}>
          {servingLog.length === 0 ? (
            <p className={kit.emptyText}>No meals served yet today.</p>
          ) : servingLog.slice(0, 8).map((r) => (
            <div key={r.id} className={styles.servingRow}>
              <span className={kit.pickAvatar}>{initials(r.studentName)}</span>
              <div className={styles.servingInfo}>
                <p className={styles.servingName}>{r.studentName}</p>
                <p className={styles.servingMeta}>{r.className} · {r.mealType}</p>
              </div>
              <div className={styles.servingRight}>
                <span className={styles.servingTime}>{fmtTime(r.servedAt)}</span>
                <span className={styles.servingBy}>by {r.servedByName}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={kit.segmented}>
        <button type="button" className={`${kit.segBtn} ${subTab === "serve" ? kit.segBtnActive : ""}`} onClick={() => setSubTab("serve")}>Serve Meals</button>
        <button type="button" className={`${kit.segBtn} ${subTab === "dietary" ? kit.segBtnActive : ""}`} onClick={() => setSubTab("dietary")}>
          Dietary Notes {stats.dietaryAlerts > 0 ? `(${stats.dietaryAlerts})` : ""}
        </button>
      </div>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search by student name" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        <button type="button" className={`${styles.chip} ${!classFilter ? styles.chipActive : ""}`} onClick={() => setClassFilter("")}>All Classes</button>
        {uniqueClasses.map((c) => (
          <button key={c} type="button" className={`${styles.chip} ${classFilter === c ? styles.chipActive : ""}`} onClick={() => setClassFilter(classFilter === c ? "" : c)}>{c}</button>
        ))}
      </div>

      <div className={styles.list}>
        {displayStudents.length === 0 ? (
          <p className={kit.emptyText}>No students match.</p>
        ) : displayStudents.map((s) => (
          <label key={s.id} className={styles.studentRow}>
            {subTab === "serve" && (
              <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} style={{ accentColor: "var(--clr-app-accent)" }} />
            )}
            <span className={kit.pickAvatar}>{initials(s.name)}</span>
            <div className={styles.studentInfo}>
              <p className={styles.studentName}>{s.name}</p>
              <p className={styles.studentMeta}>{s.className}{s.allergies ? ` • ${s.allergies}` : ""}</p>
            </div>
            {subTab === "serve" && (
              servedIds.has(s.id) ? (
                <span className={styles.statusServed}><Check size={11} /> Served</span>
              ) : (
                <span className={styles.statusPending}>Pending</span>
              )
            )}
          </label>
        ))}
      </div>

      <MobileSheet
        open={!!editingCell}
        onClose={() => !savingMenu && setEditingCell(null)}
        title={editingCell ? `${editingCell.day} · ${editingCell.mealType}` : ""}
        subtitle="One dish per line."
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setEditingCell(null)} disabled={savingMenu}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={saveMenuCell} disabled={savingMenu}>{savingMenu ? "Saving…" : "Save Menu"}</button>
        </>}
      >
        <div className={kit.field}>
          <textarea
            className={kit.textarea}
            value={editItemsText}
            onChange={(e) => setEditItemsText(e.target.value)}
            rows={6}
            placeholder={"e.g. Jollof Rice\nGrilled Chicken\nColeslaw"}
          />
        </div>
      </MobileSheet>
    </div>
  );
}
