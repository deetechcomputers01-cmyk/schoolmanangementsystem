"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed, AlertTriangle, Check, Search, Pencil,
  CalendarRange, ChevronLeft, ChevronRight, Receipt, Users,
  TrendingUp, TrendingDown, ChevronDown, X,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./CanteenScreen.module.css";

export type MealCell = { mealType: string; id: string | null; items: string[] };
export type MenuDay = { day: string; meals: MealCell[] };
export type Student = {
  id: string; name: string; className: string;
  allergies: string | null; conditions: string | null;
  guardian: { name: string; phone: string; relation: string } | null;
};
export type ServingLogRow = {
  id: string; studentName: string; className: string; mealType: string;
  servedAt: string; servedByName: string;
};
export type Stats = {
  servedToday: number; servedYesterday: number; dietaryAlerts: number; studentCount: number;
  totalDishesThisWeek: number;
  coverage: { Breakfast: boolean; Lunch: boolean; Dinner: boolean };
};

export interface CanteenContentProps {
  weekOf: string;
  weekLabel: string;
  menuGrid: MenuDay[];
  students: Student[];
  servingLog: ServingLogRow[];
  stats: Stats;
}
type Props = CanteenContentProps;

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function CanteenContent({ weekOf, weekLabel, menuGrid, students, servingLog, stats }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"menu" | "serve" | "dietary">("menu");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [servedIds, setServedIds] = useState<Set<string>>(new Set());
  const [serving, setServing] = useState(false);
  const { showToast } = useToast();

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const defaultDay = menuGrid.some((d) => d.day === todayName) ? todayName : menuGrid[0]?.day ?? "Monday";
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selectedMealType, setSelectedMealType] = useState("Lunch");

  const activeMenu = menuGrid.find((d) => d.day === selectedDay)?.meals.find((m) => m.mealType === selectedMealType) ?? null;

  const [editingCell, setEditingCell] = useState<{ day: string; mealType: string } | null>(null);
  const [editItemsText, setEditItemsText] = useState("");
  const [savingMenu, setSavingMenu] = useState(false);

  useEffect(() => {
    if (!activeMenu?.id) { setServedIds(new Set()); return; }
    fetch(`/api/canteen/serve?menuId=${activeMenu.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((rows: { studentId: string }[]) => setServedIds(new Set(rows.map((r) => r.studentId))))
      .catch(() => setServedIds(new Set()));
  }, [activeMenu?.id]);

  const uniqueClasses = useMemo(() => Array.from(new Set(students.map((s) => s.className))).sort(), [students]);
  const dietaryStudents = students.filter((s) => s.allergies);
  const displayStudents = (activeTab === "dietary" ? dietaryStudents : students).filter((s) =>
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase())) &&
    (classFilter === "" || s.className === classFilter)
  );

  const allOnPageSelected = displayStudents.length > 0 && displayStudents.every((s) => selectedIds.has(s.id));

  function toggleSelectAll() {
    const next = new Set(selectedIds);
    if (allOnPageSelected) displayStudents.forEach((s) => next.delete(s.id));
    else displayStudents.forEach((s) => next.add(s.id));
    setSelectedIds(next);
  }
  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  }

  async function markServed() {
    if (!activeMenu?.id) { showToast("No menu set for this day/meal yet — add one on the Weekly Menu tab first."); return; }
    if (selectedIds.size === 0) { showToast("Select at least one student."); return; }
    setServing(true);
    try {
      const res = await fetch("/api/canteen/serve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: activeMenu.id, studentIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setServedIds((prev) => new Set([...prev, ...selectedIds]));
        showToast(`Marked ${selectedIds.size} student${selectedIds.size !== 1 ? "s" : ""} served.`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        showToast("Failed to mark served.");
      }
    } finally {
      setServing(false);
    }
  }

  function openEditCell(day: string, mealType: string, items: string[]) {
    setEditingCell({ day, mealType });
    setEditItemsText(items.join("\n"));
  }

  function openQuickAdd() {
    for (const d of menuGrid) {
      for (const m of d.meals) {
        if (m.items.length === 0) { openEditCell(d.day, m.mealType, []); return; }
      }
    }
    openEditCell(defaultDay, "Lunch", menuGrid.find((d) => d.day === defaultDay)?.meals.find((m) => m.mealType === "Lunch")?.items ?? []);
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
      if (res.ok) {
        setEditingCell(null);
        router.refresh();
      } else {
        showToast("Failed to save menu.");
      }
    } finally {
      setSavingMenu(false);
    }
  }

  function goToWeek(offsetDays: number) {
    const d = new Date(weekOf + "T00:00:00.000Z");
    d.setDate(d.getDate() + offsetDays);
    router.push(`/canteen?week=${d.toISOString().slice(0, 10)}`);
  }

  const servedDelta = stats.servedYesterday > 0
    ? Math.round(((stats.servedToday - stats.servedYesterday) / stats.servedYesterday) * 100)
    : null;
  const servedPct = stats.studentCount > 0 ? Math.min(100, Math.round((stats.servedToday / stats.studentCount) * 100)) : 0;

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Canteen Management</h1>
          <p className={styles.subtitle}>Manage weekly menus, track servings, and monitor canteen operations.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={openQuickAdd}>
            <Pencil size={14} /> Edit Menu
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Meals Served Today</p>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{stats.servedToday}</span>
              {servedDelta !== null && (
                <span className={`${styles.statDelta} ${servedDelta < 0 ? styles.statDeltaDown : ""}`}>
                  {servedDelta < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                  {servedDelta > 0 ? "+" : ""}{servedDelta}%
                </span>
              )}
            </div>
          </div>
          <div className={styles.statIconBox}><UtensilsCrossed size={18} /></div>
        </div>

        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Menu Items</p>
            <div className={styles.statValueRow}><span className={styles.statValue}>{stats.totalDishesThisWeek}</span></div>
            <p className={styles.statSub}>Dishes this week</p>
          </div>
          <div className={styles.statIconBox}><Receipt size={18} /></div>
        </div>

        <div className={styles.statCard} style={{ display: "block" }}>
          <p className={styles.statLabel}>Coverage</p>
          <div className={styles.coverageList}>
            {(["Breakfast", "Lunch", "Dinner"] as const).map((m) => (
              <div key={m} className={styles.coverageRow}>
                <span className={`${styles.coverageDot} ${stats.coverage[m] ? styles.coverageDotOn : ""}`} />
                <span className={stats.coverage[m] ? "" : styles.coverageOff}>
                  {m}{!stats.coverage[m] ? " (Not Set)" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.statCard} style={{ display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p className={styles.statLabel}>Students Served</p>
            <div className={styles.statIconBox}><Users size={18} /></div>
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{stats.servedToday}</span>
            <span className={styles.statSub}>/ {stats.studentCount} total</span>
          </div>
          <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${servedPct}%` }} /></div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitleRow}>
              <CalendarRange size={17} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Weekly Menu Planner</h2>
            </div>
            <div className={styles.weekNav}>
              <button className={styles.weekNavBtn} onClick={() => goToWeek(-7)} title="Previous week"><ChevronLeft size={15} /></button>
              <span className={styles.weekNavLabel}>Week of {weekLabel}</span>
              <button className={styles.weekNavBtn} onClick={() => goToWeek(7)} title="Next week"><ChevronRight size={15} /></button>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.dayHeaderCol}>Day</th>
                  <th>Breakfast</th>
                  <th>Lunch</th>
                  <th>Dinner</th>
                </tr>
              </thead>
              <tbody>
                {menuGrid.map((dayRow) => (
                  <tr key={dayRow.day}>
                    <td className={styles.dayCell}>{dayRow.day}</td>
                    {dayRow.meals.map((meal) => (
                      <td key={meal.mealType}>
                        <div className={styles.menuCell} onClick={() => openEditCell(dayRow.day, meal.mealType, meal.items)} title="Click to edit">
                          {meal.items.length === 0 ? (
                            <span className={styles.menuEmpty}><Pencil size={11} />Not set</span>
                          ) : (
                            <ul className={styles.menuItems}>
                              {meal.items.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitleRow}>
              <Receipt size={17} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Serving Log</h2>
            </div>
            <span className={styles.cardBadge}>TODAY</span>
          </div>
          <div className={styles.servingLogBody}>
            {servingLog.length === 0 ? (
              <div className={styles.emptyHint}>No meals served yet today.</div>
            ) : (
              servingLog.map((r) => (
                <div key={r.id} className={styles.servingRow}>
                  <div className={styles.servingLeft}>
                    <div className={styles.avatar}>{initials(r.studentName)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.servingName}>{r.studentName}</div>
                      <div className={styles.servingMeta}>{r.className} · {r.mealType}</div>
                    </div>
                  </div>
                  <div className={styles.servingRight}>
                    <div className={styles.servingTime}>{fmtTime(r.servedAt)}</div>
                    <div className={styles.servingBy}>by {r.servedByName}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={styles.servingLogFooter}>
            <button className={styles.linkBtn} onClick={() => setActiveTab("serve")}>View Full Log</button>
          </div>
        </section>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs} style={{ padding: "0 20px" }}>
          {([["serve", "Serve Meals"], ["dietary", "Dietary Notes"]] as const).map(([key, label]) => (
            <button key={key} className={`${styles.tab} ${activeTab === key ? styles.tabActive : ""}`} onClick={() => setActiveTab(key)}>
              {label}
              {key === "dietary" && stats.dietaryAlerts > 0 && <span className={styles.tabBadge}>{stats.dietaryAlerts}</span>}
            </button>
          ))}
        </div>

        {activeTab === "serve" && (
          <div className={styles.toolbar} style={{ padding: "14px 20px 0" }}>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                {menuGrid.map((d) => <option key={d.day} value={d.day}>{d.day}</option>)}
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value)}>
                {["Breakfast", "Lunch", "Dinner"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>
            <button className={styles.btnPrimary} disabled={serving || selectedIds.size === 0} onClick={markServed}>
              <Check size={14} /> Mark {selectedIds.size || ""} Served
            </button>
          </div>
        )}

        <div className={styles.filterBar} style={{ padding: "14px 20px" }}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search by student name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className={styles.filterRight}>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="">All Classes</option>
                {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>
            <span className={styles.filterCount}>{displayStudents.length} student{displayStudents.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                {activeTab === "serve" && (
                  <th style={{ width: 36 }}><input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} /></th>
                )}
                <th>Student</th>
                <th>Class</th>
                <th>Dietary</th>
                {activeTab === "serve" && <th>Status</th>}
              </tr>
            </thead>
            <tbody>
              {displayStudents.map((s) => (
                <tr key={s.id} className={`${styles.dataRow} ${selectedIds.has(s.id) ? styles.dataRowSelected : ""}`}>
                  {activeTab === "serve" && (
                    <td><input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                  )}
                  <td>
                    <div className={styles.studentCell}>
                      <div className={styles.avatar}>{initials(s.name)}</div>
                      <span className={styles.studentName}>{s.name}</span>
                    </div>
                  </td>
                  <td>{s.className}</td>
                  <td>{s.allergies ? <span className={styles.allergyBadge}>{s.allergies}</span> : <span className={styles.noDietary}>—</span>}</td>
                  {activeTab === "serve" && (
                    <td>
                      {servedIds.has(s.id) ? (
                        <span className={styles.statusServed}><Check size={12} /> Served</span>
                      ) : (
                        <span className={styles.statusPending}><span className={styles.pendingDot} /> Pending</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {displayStudents.length === 0 && (
                <tr><td colSpan={5}>
                  <div className={styles.emptyHint}>
                    <UtensilsCrossed size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
                    No students match.
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingCell && (
        <div className={styles.modalOverlay} onClick={() => !savingMenu && setEditingCell(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{editingCell.day} · {editingCell.mealType}</h2>
                <p className={styles.modalSub}>One dish per line.</p>
              </div>
              <button className={styles.modalClose} onClick={() => setEditingCell(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <textarea
                className={styles.formTextarea}
                value={editItemsText}
                onChange={(e) => setEditItemsText(e.target.value)}
                rows={6}
                placeholder={"e.g. Jollof Rice\nGrilled Chicken\nColeslaw"}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setEditingCell(null)} disabled={savingMenu}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveMenuCell} disabled={savingMenu}>{savingMenu ? "Saving…" : "Save Menu"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
