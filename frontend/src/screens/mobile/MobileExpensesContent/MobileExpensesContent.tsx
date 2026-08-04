"use client";

/**
 * MobileExpensesContent — bespoke mobile view for the Expenses screen.
 *
 * Every field/action traces back to ExpensesContent.tsx (the real desktop
 * component) and the real /api/expenses endpoint — same submitExpense()
 * handler, same KPI math.
 *
 * Deviations from the Stitch mockup (mobile_expenses_scholarsphere_pro),
 * because the mockup depicts a workflow this app's Expense model doesn't
 * support (verified against the schema and /api/expenses/route.ts, which
 * only has GET + POST — no PATCH/approve/reject route exists):
 *   - "Budget Period Selector" (month + Dept/Cat) and the "Maintenance
 *     budget 92% used" warning card — no budget or department model
 *     exists anywhere. Omitted entirely; kept a real category filter.
 *   - Status filter chips: real `status` is only pending/approved/rejected
 *     — there is no "Paid" or "Over Budget" status. Using the real 3-state
 *     filter instead of the mockup's 5 fabricated ones.
 *   - Expanded-card action grid (Approve/Reject/Req Info/View Receipt) —
 *     no approve/reject endpoint and no receipt-image field exist. Omitted;
 *     tapping a card just shows its full detail (vendor, recorded by).
 *   - "Upload Receipt" CTA — no receipt field on the Expense model. Omitted.
 *   - KPI cards map to the real 4: Total Expenses this month (+delta),
 *     Pending Approval (sum+count), Approved This Month, Top Category
 *     (not "Over Budget", which doesn't exist).
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, ArrowUp, ArrowDown, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import { MobileSheet } from "@/components/mobile/ui/MobileSheet/MobileSheet";
import kit from "@/components/mobile/ui/MobileFormKit/MobileFormKit.module.css";
import { fmtGHS, fmtDate } from "@/screens/desktop/ExpensesScreen/ExpensesContent";
import type { ExpensesContentProps, ExpenseStatus } from "@/screens/desktop/ExpensesScreen/ExpensesContent";
import styles from "./MobileExpensesContent.module.css";

const STATUS_FILTERS: { value: ExpenseStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function MobileExpensesContent({ expenses }: ExpensesContentProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "">("");
  const [openId, setOpenId] = useState<string | null>(null);

  const uniqueCategories = useMemo(() => Array.from(new Set(expenses.map((e) => e.category))).sort(), [expenses]);

  const now = new Date();
  const thisMonthKey = now.toISOString().slice(0, 7);
  const lastMonthKey = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
  const thisMonthExpenses = useMemo(() => expenses.filter((e) => e.date.slice(0, 7) === thisMonthKey), [expenses, thisMonthKey]);
  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const lastMonthTotal = useMemo(
    () => expenses.filter((e) => e.date.slice(0, 7) === lastMonthKey).reduce((s, e) => s + e.amount, 0),
    [expenses, lastMonthKey]
  );
  const monthDelta = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 1000) / 10 : null;

  const pendingExpenses = expenses.filter((e) => e.status === "pending");
  const pendingSum = pendingExpenses.reduce((s, e) => s + e.amount, 0);
  const approvedThisMonth = thisMonthExpenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0);

  const categoryTotals = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    return Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);
  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const topCategory = categoryTotals[0] ?? null;
  const topCategoryPct = topCategory && totalSpend > 0 ? Math.round((topCategory[1] / totalSpend) * 100) : 0;

  const filteredExpenses = useMemo(() => expenses.filter((e) =>
    (categoryFilter === "" || e.category === categoryFilter) &&
    (statusFilter === "" || e.status === statusFilter) &&
    (search === "" || e.description.toLowerCase().includes(search.toLowerCase()) || (e.vendor ?? "").toLowerCase().includes(search.toLowerCase()))
  ), [expenses, categoryFilter, statusFilter, search]);

  // ── Log Expense sheet ──────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  function openSheet() {
    setCategory(""); setDescription(""); setAmount(""); setVendor("");
    setDate(new Date().toISOString().slice(0, 10));
    setSheetOpen(true);
  }

  async function submitExpense() {
    if (!category.trim() || !description.trim() || !amount || Number(amount) <= 0) {
      showToast("Category, description, and a valid amount are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category.trim(),
          description: description.trim(),
          amount: Number(amount),
          vendor: vendor.trim() || undefined,
          date,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSheetOpen(false);
      showToast("Expense logged");
      router.refresh();
    } catch {
      showToast("Failed to record expense", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{now.toLocaleDateString("en-US", { month: "short" })} Spend</span>
          <span className={styles.kpiValue}>{fmtGHS(thisMonthTotal)}</span>
          {monthDelta !== null && (
            <span className={`${styles.kpiDelta} ${monthDelta > 0 ? styles.kpiDeltaUp : ""}`}>
              {monthDelta > 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{Math.abs(monthDelta)}% vs last month
            </span>
          )}
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardAmber}`}>
          <span className={styles.kpiLabel}>Pending</span>
          <span className={styles.kpiValue}>{fmtGHS(pendingSum)}</span>
          <span className={styles.kpiSub}>{pendingExpenses.length} awaiting review</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardGreen}`}>
          <span className={styles.kpiLabel}>Approved</span>
          <span className={styles.kpiValue}>{fmtGHS(approvedThisMonth)}</span>
          <span className={styles.kpiSub}>this month</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Top Category</span>
          <span className={styles.kpiValue}>{topCategory?.[0] ?? "—"}</span>
          <span className={styles.kpiSub}>{topCategory ? `${topCategoryPct}% of spend` : "No data yet"}</span>
        </div>
      </div>

      <button type="button" className={styles.addBtn} onClick={openSheet}><Plus size={16} /> Log Expense</button>

      <label className={kit.searchWrap}>
        <Search size={16} className={kit.searchIcon} />
        <input className={`${kit.input} ${kit.searchInput}`} placeholder="Search vendor or description" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <div className={styles.chipRow}>
        {STATUS_FILTERS.map((f) => (
          <button key={f.value} type="button" className={`${styles.chip} ${statusFilter === f.value ? styles.chipActive : ""}`} onClick={() => setStatusFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      {uniqueCategories.length > 0 && (
        <div className={styles.chipRow}>
          <button type="button" className={`${styles.chip} ${!categoryFilter ? styles.chipActive : ""}`} onClick={() => setCategoryFilter("")}>All Categories</button>
          {uniqueCategories.map((c) => (
            <button key={c} type="button" className={`${styles.chip} ${categoryFilter === c ? styles.chipActive : ""}`} onClick={() => setCategoryFilter(categoryFilter === c ? "" : c)}>{c}</button>
          ))}
        </div>
      )}

      <div className={styles.list}>
        {filteredExpenses.length === 0 ? (
          <p className={kit.emptyText}>{expenses.length === 0 ? "No expenses recorded yet." : "No expenses match your filters."}</p>
        ) : filteredExpenses.map((e) => {
          const isOpen = openId === e.id;
          return (
            <article key={e.id} className={styles.card}>
              <button type="button" className={styles.cardHeader} onClick={() => setOpenId(isOpen ? null : e.id)}>
                <div className={styles.cardHeaderText}>
                  <span className={styles.expDesc}>{e.description}</span>
                  <span className={styles.expMeta}>{e.category} • {fmtDate(e.date)}</span>
                </div>
                <div className={styles.cardHeaderRight}>
                  <span className={styles.expAmount}>{fmtGHS(e.amount)}</span>
                  <span className={`${styles.statusPill} ${styles[`status_${e.status}`]}`}>{e.status}</span>
                </div>
                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {isOpen && (
                <div className={styles.cardDetail}>
                  <div className={styles.detailRow}><span>Vendor</span><strong>{e.vendor ?? "—"}</strong></div>
                  <div className={styles.detailRow}><span>Recorded By</span><strong>{e.recordedByName}</strong></div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <MobileSheet
        open={sheetOpen}
        onClose={() => !saving && setSheetOpen(false)}
        title="Record Expense"
        footer={<>
          <button type="button" className={kit.btnOutline} onClick={() => setSheetOpen(false)} disabled={saving}>Cancel</button>
          <button type="button" className={kit.btnPrimary} onClick={submitExpense} disabled={saving}>{saving ? "Saving…" : "Save Expense"}</button>
        </>}
      >
        <div className={kit.field}>
          <label>Category *</label>
          <input className={kit.input} placeholder="e.g. Utilities, Maintenance, Supplies" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Description *</label>
          <input className={kit.input} placeholder="What was this expense for?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Amount (GHS) *</label>
          <input className={kit.input} type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Date *</label>
          <input className={kit.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className={kit.field}>
          <label>Vendor</label>
          <input className={kit.input} placeholder="Optional" value={vendor} onChange={(e) => setVendor(e.target.value)} />
        </div>
        <p className={kit.helperText}>This expense will be submitted for approval.</p>
      </MobileSheet>
    </div>
  );
}
