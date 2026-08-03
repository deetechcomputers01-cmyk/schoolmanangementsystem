"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, X, Receipt, Wallet, Search, ChevronDown, ChevronLeft, ChevronRight,
  ArrowDown, ArrowUp, ArrowRight, Download,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./ExpensesScreen.module.css";

type ExpenseStatus = "pending" | "approved" | "rejected";

interface ExpenseRow {
  id: string;
  category: string;
  description: string;
  amount: number;
  vendor: string | null;
  date: string;
  status: ExpenseStatus;
  recordedByName: string;
}

interface Props {
  expenses: ExpenseRow[];
}

// Validated categorical palette (dataviz skill reference palette, light mode)
const CATEGORY_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const TREND_COLOR = "#5b50f5";

function fmtGHS(n: number) {
  return `GHS ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function ExpensesContent({ expenses }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { showToast } = useToast();

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
  const approvedPct = thisMonthTotal > 0 ? Math.min(100, Math.round((approvedThisMonth / thisMonthTotal) * 100)) : 0;

  const categoryData = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    const sorted = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 7);
    const rest = sorted.slice(7).reduce((sum, [, v]) => sum + v, 0);
    const rows = top.map(([name, value]) => ({ name, value }));
    if (rest > 0) rows.push({ name: "Other", value: rest });
    return rows;
  }, [expenses]);

  const totalSpend = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const topCategory = categoryData[0] ?? null;
  const topCategoryPct = topCategory && totalSpend > 0 ? Math.round((topCategory.value / totalSpend) * 100) : 0;

  const monthlyData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const e of expenses) {
      const key = e.date.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + e.amount);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({ month, total }));
  }, [expenses]);

  const filteredExpenses = useMemo(() => expenses.filter((e) =>
    (categoryFilter === "" || e.category === categoryFilter) &&
    (statusFilter === "" || e.status === statusFilter) &&
    (search === "" || e.description.toLowerCase().includes(search.toLowerCase()) || (e.vendor ?? "").toLowerCase().includes(search.toLowerCase()))
  ), [expenses, categoryFilter, statusFilter, search]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const pageExpenses = filteredExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    const rows = [
      ["Date", "Description", "Category", "Vendor", "Amount (GHS)", "Status", "Recorded By"],
      ...filteredExpenses.map((e) => [fmtDate(e.date), e.description, e.category, e.vendor ?? "", String(e.amount), e.status, e.recordedByName]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "expenses.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function openModal() {
    setCategory(""); setDescription(""); setAmount(""); setVendor("");
    setDate(new Date().toISOString().slice(0, 10));
    setError("");
    setShowModal(true);
  }

  async function submitExpense() {
    if (!category.trim() || !description.trim() || !amount || Number(amount) <= 0) {
      setError("Category, description, and a valid amount are required.");
      return;
    }
    setSaving(true);
    setError("");
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
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.error?.message ?? err?.message ?? "Failed to record expense.");
        return;
      }
      setShowModal(false);
      showToast("Expense submitted for approval");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Expenses Management</h1>
          <p className={styles.subtitle}>Record school expenses and track them through approval.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={exportCsv} disabled={filteredExpenses.length === 0}>
            <Download size={15} /> Export
          </button>
          <button className={styles.btnPrimary} onClick={openModal}>
            <Plus size={15} /> Log Expense
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Expenses ({now.toLocaleDateString("en-US", { month: "short" })})</span>
          <span className={styles.statValue}>{fmtGHS(thisMonthTotal)}</span>
          {monthDelta !== null && (
            <div className={styles.statDeltaRow}>
              <span className={`${styles.statDelta} ${monthDelta > 0 ? styles.statDeltaUp : ""}`}>
                {monthDelta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(monthDelta)}% vs last month
              </span>
            </div>
          )}
        </div>
        <div className={`${styles.statCard} ${styles.statCardAmber}`}>
          <span className={styles.statLabel}>Pending Approval</span>
          <span className={styles.statValue}>{fmtGHS(pendingSum)}</span>
          <span className={styles.statSubAmber}>{pendingExpenses.length} request{pendingExpenses.length !== 1 ? "s" : ""} awaiting review</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <span className={styles.statLabel}>Approved This Month</span>
          <span className={styles.statValue}>{fmtGHS(approvedThisMonth)}</span>
          <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${approvedPct}%` }} /></div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Top Category</span>
          <span className={styles.statValue}>{topCategory?.name ?? "—"}</span>
          <span className={styles.statSub}>{topCategory ? `${topCategoryPct}% of total spend` : "No data yet"}</span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.mainCol}>
          <div className={styles.card}>
            <div className={styles.filterBar}>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input className={styles.searchInput} placeholder="Quick search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <div className={styles.filterRight}>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
                    <option value="">All Categories</option>
                    {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} className={styles.selectChevron} />
                </div>
                <div className={styles.selectWrap}>
                  <select className={styles.select} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown size={13} className={styles.selectChevron} />
                </div>
              </div>
            </div>

            {pageExpenses.length === 0 ? (
              <div className={styles.emptyState}>
                <Receipt size={32} className={styles.emptyIcon} />
                <p>{expenses.length === 0 ? "No expenses recorded yet." : "No expenses match your filters."}</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Vendor</th>
                      <th className={styles.right}>Amount (GHS)</th>
                      <th className={styles.center}>Status</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageExpenses.map((e) => (
                      <tr key={e.id} className={styles.dataRow}>
                        <td className={styles.tdMuted}>{fmtDate(e.date)}</td>
                        <td className={styles.descCell}>{e.description}</td>
                        <td><span className={styles.categoryPill}>{e.category}</span></td>
                        <td className={styles.tdMuted}>{e.vendor ?? "—"}</td>
                        <td className={`${styles.right} ${styles.tdMono}`}>{e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={styles.center}>
                          <span className={`${styles.badge} ${e.status === "approved" ? styles.badgeApproved : e.status === "rejected" ? styles.badgeRejected : styles.badgePending}`}>
                            {e.status}
                          </span>
                        </td>
                        <td className={styles.tdMuted}>{e.recordedByName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredExpenses.length > 0 && (
              <div className={styles.paginationBar}>
                <span>Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredExpenses.length)} of {filteredExpenses.length} records</span>
                <div className={styles.pageButtons}>
                  <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {expenses.length > 0 && (
            <div id="expenses-charts" className={styles.chartsRow}>
              <div className={`${styles.card} ${styles.chartCard}`}>
                <h3 className={styles.chartTitle}>Spend by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke="var(--clr-app-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: "var(--text-xs)", fill: "#858791" }} axisLine={{ stroke: "#e4e4ec" }} tickLine={false} />
                    <YAxis tick={{ fontSize: "var(--text-xs)", fill: "#858791" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip formatter={(v) => fmtGHS(Number(v))} contentStyle={{ fontSize: "var(--text-xs)", borderRadius: 4, border: "1px solid #e4e4ec" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={`${styles.card} ${styles.chartCard}`}>
                <h3 className={styles.chartTitle}>Monthly Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke="var(--clr-app-border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: "var(--text-xs)", fill: "#858791" }} axisLine={{ stroke: "#e4e4ec" }} tickLine={false} />
                    <YAxis tick={{ fontSize: "var(--text-xs)", fill: "#858791" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip formatter={(v) => fmtGHS(Number(v))} contentStyle={{ fontSize: "var(--text-xs)", borderRadius: 4, border: "1px solid #e4e4ec" }} />
                    <Line type="monotone" dataKey="total" name="Total spend" stroke={TREND_COLOR} strokeWidth={2} dot={{ r: 3, fill: TREND_COLOR }} />
                    <Legend wrapperStyle={{ fontSize: "var(--text-xs)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className={`${styles.card} ${styles.sidePanel}`}>
          <h3 className={styles.sidePanelTitle}>Category Breakdown</h3>
          {categoryData.length === 0 ? (
            <p className={styles.statSub}>No expenses recorded yet.</p>
          ) : (
            categoryData.slice(0, 3).map((c) => {
              const pct = totalSpend > 0 ? Math.round((c.value / totalSpend) * 100) : 0;
              return (
                <div key={c.name} className={styles.catRow}>
                  <div className={styles.catRowTop}>
                    <span className={styles.catName}>{c.name}</span>
                    <span className={styles.catValue}>{fmtGHS(c.value)}</span>
                  </div>
                  <div className={styles.catBar}><div className={styles.catBarFill} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })
          )}
          {categoryData.length > 0 && (
            <div className={styles.sideFooter}>
              <button className={styles.linkBtn} onClick={() => document.getElementById("expenses-charts")?.scrollIntoView({ behavior: "smooth" })}>
                View Full Report <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => !saving && setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}><Wallet size={16} style={{ marginRight: 6 }} />Record Expense</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {error && <p className={styles.errorText}>{error}</p>}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category *</label>
                <input className={styles.formInput} placeholder="e.g. Utilities, Maintenance, Supplies" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description *</label>
                <input className={styles.formInput} placeholder="What was this expense for?" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount (GHS) *</label>
                  <input className={styles.formInput} type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date *</label>
                  <input className={styles.formInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vendor</label>
                <input className={styles.formInput} placeholder="Optional" value={vendor} onChange={(e) => setVendor(e.target.value)} />
              </div>
              <p className={styles.hintText}>This will be sent to the Principal for approval before it counts as approved spend.</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className={styles.btnPrimary} onClick={submitExpense} disabled={saving}>
                {saving ? "Submitting…" : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
