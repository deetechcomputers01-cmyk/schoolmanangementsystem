"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/desktop/ui/Toast/Toast";
import styles from "./FeeStructurePanel.module.css";

export interface FeeStructureRow {
  id: string;
  classId: string;
  term: string;
  category: string;
  amount: number;
  class: { id: string; name: string };
}

interface Props {
  classes: { id: string; name: string }[];
  rows: FeeStructureRow[];
}

/** The standard fee amount a class is expected to pay per term/category —
 *  the real "school fees students/guardians pay for their ward" figure,
 *  editable here and used to prefill real invoices on the Fees screen
 *  instead of every invoice being typed from scratch with no reference
 *  value. Shared as-is between desktop Settings and the mobile Settings
 *  sheet, same as YearsTermsPanel. */
export function FeeStructurePanel({ classes, rows }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newTerm, setNewTerm] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const classRows = useMemo(
    () => rows.filter((r) => r.classId === selectedClassId).sort((a, b) => a.term.localeCompare(b.term) || a.category.localeCompare(b.category)),
    [rows, selectedClassId],
  );

  async function handleAddRow() {
    if (!selectedClassId || !newTerm.trim() || !newCategory.trim()) {
      showToast("Class, term, and category are required.", "error");
      return;
    }
    const amount = Number(newAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a valid amount.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/fee-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClassId, term: newTerm.trim(), category: newCategory.trim(), amount }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err?.error ?? "Failed to save fee.", "error");
        return;
      }
      showToast("Fee amount saved.", "success");
      setNewCategory(""); setNewAmount("");
      router.refresh();
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRow(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/fee-structure/${id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Failed to remove fee.", "error"); return; }
      showToast("Fee removed.", "success");
      router.refresh();
    } catch {
      showToast("Network error.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.classSelectRow}>
        <label className={styles.label}>Class</label>
        <select className={styles.select} value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
          {classes.length === 0 && <option value="">No classes yet</option>}
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Desktop: table. Mobile: card list — a 4-column table can't fit a
          phone width without horizontal scroll, so this is a genuinely
          different layout, not just a CSS reflow of the same markup. */}
      <div className={`${styles.tableWrap} desktopOnly`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Term</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Amount</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {classRows.length === 0 && (
              <tr><td colSpan={4} className={styles.emptyCell}>No fee amounts set for this class yet.</td></tr>
            )}
            {classRows.map((row) => (
              <tr key={row.id} className={styles.tr}>
                <td className={styles.td}>{row.term}</td>
                <td className={styles.td}>{row.category}</td>
                <td className={styles.td}>GHS {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className={styles.tdActions}>
                  <button type="button" className={styles.deleteBtn} onClick={() => handleDeleteRow(row.id)} disabled={deletingId === row.id} title="Remove">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`${styles.cardList} mobileOnly`}>
        {classRows.length === 0 && (
          <p className={styles.emptyCell}>No fee amounts set for this class yet.</p>
        )}
        {classRows.map((row) => (
          <div key={row.id} className={styles.feeCard}>
            <div className={styles.feeCardInfo}>
              <span className={styles.feeCardTerm}>{row.term}</span>
              <span className={styles.feeCardCategory}>{row.category}</span>
            </div>
            <span className={styles.feeCardAmount}>GHS {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <button type="button" className={styles.deleteBtn} onClick={() => handleDeleteRow(row.id)} disabled={deletingId === row.id} title="Remove">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className={styles.addRow}>
        <input className={styles.input} placeholder="Term (e.g. Term 1 2026/2027)" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} />
        <input className={styles.input} placeholder="Category (e.g. Tuition)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
        <input className={styles.inputAmount} type="number" min="0" step="0.01" placeholder="Amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
        <button type="button" className={styles.addBtn} onClick={handleAddRow} disabled={saving || !selectedClassId}>
          <Plus size={14} /> {saving ? "Saving…" : "Add"}
        </button>
      </div>
    </div>
  );
}
