"use client";

import { useState } from "react";
import {
  CreditCard, Download, MessageSquare, TrendingUp,
  CalendarDays, Wallet, ChevronRight, CheckCircle,
} from "lucide-react";
import styles from "./ParentPortalScreen.module.css";

type PortalData = {
  children?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    className: string;
    house?: string | null;
    attendance?: number;
    classAverage?: number;
    feeBalance?: number;
  }>;
  guardian?: {
    name: string;
    relation?: string | null;
    phone?: string | null;
  } | null;
};

interface Props {
  data: PortalData;
  guardianName: string;
}

const TABS = ["Overview", "Academics", "Financials"] as const;

export function ParentPortalContent({ data, guardianName }: Props) {
  const children = data.children ?? [];
  const guardian = data.guardian;
  const [activeChildIdx, setActiveChildIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");

  const child = children[activeChildIdx];

  const attendance = child?.attendance ?? 0;
  const classAvg = child?.classAverage ?? 0;
  const feeBalance = child?.feeBalance ?? 0;

  return (
    <div className={styles.root}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span>Parent Portal</span>
          <ChevronRight size={14} className={styles.breadcrumbSep} />
          <span className={styles.breadcrumbActive}>Overview</span>
        </nav>
        <h1 className={styles.pageTitle}>Overview</h1>
        <p className={styles.pageSubtitle}>View student progress, attendance, fees, messages, and school updates.</p>
      </div>

      {/* ── Main grid ── */}
      <div className={styles.mainGrid}>

        {/* Center panel */}
        <div className={styles.center}>

          {/* Child selector card */}
          <div className={styles.childCard}>
            <div className={styles.childInfo}>
              <div className={styles.childAvatar}>
                {child ? `${child.firstName[0]}${child.lastName[0]}` : "?"}
              </div>
              <div>
                <h2 className={styles.childName}>
                  {child ? `${child.firstName} ${child.lastName}` : guardianName}
                  {child && (
                    <span className={styles.classBadge}>{child.className}</span>
                  )}
                </h2>
                <p className={styles.childMeta}>
                  {child?.admissionNo ?? "—"} {child?.house ? `• ${child.house}` : ""}
                </p>
              </div>
            </div>
            {children.length > 1 && (
              <div className={styles.childTabs}>
                {children.map((c, i) => (
                  <button
                    key={c.id}
                    className={`${styles.childTab} ${i === activeChildIdx ? styles.childTabActive : ""}`}
                    onClick={() => setActiveChildIdx(i)}
                  >
                    {c.firstName} ({c.className})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <CalendarDays size={18} style={{ color: "#c1c7cb" }} />
                <span className={styles.statBadgeGreen}>
                  <TrendingUp size={12} /> {attendance}%
                </span>
              </div>
              <p className={styles.statLabel}>Attendance</p>
              <p className={styles.statValue}>Present</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <TrendingUp size={18} style={{ color: "#c1c7cb" }} />
                {classAvg > 0 && <span className={styles.statBadgeGreen}>{classAvg}%</span>}
              </div>
              <p className={styles.statLabel}>Class Average</p>
              <p className={styles.statValue}>{classAvg}%</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <Wallet size={18} style={{ color: "#c1c7cb" }} />
                {feeBalance > 0 && <span className={styles.statBadgeDue}>Due</span>}
              </div>
              <p className={styles.statLabel}>Fee Balance</p>
              <p className={`${styles.statValue} ${feeBalance > 0 ? styles.statValueRed : ""}`}>
                GHS {feeBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map((t) => (
              <button
                key={t}
                className={`${styles.tab} ${activeTab === t ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content — Overview */}
          {activeTab === "Overview" && (
            <div className={styles.overviewGrid}>
              {/* Fee Summary */}
              <div className={styles.infoCard}>
                <div className={styles.infoCardHead}>
                  <span className={styles.infoCardTitle}>Fee Summary</span>
                </div>
                <div className={styles.invoiceDivider} />
                <div className={styles.invoiceBalance}>
                  <span>Outstanding Balance</span>
                  <span style={{ color: feeBalance > 0 ? "#ba1a1a" : "#486647", fontWeight: 700 }}>
                    GHS {feeBalance.toLocaleString()}
                  </span>
                </div>
                {feeBalance > 0 && (
                  <button className={styles.payBtn}>
                    <CreditCard size={15} /> Pay Fees Now
                  </button>
                )}
              </div>

              {/* Recent Notes */}
              <div className={styles.infoCard}>
                <div className={styles.infoCardHead}>
                  <span className={styles.infoCardTitle}>Recent Notes</span>
                </div>
                <p style={{ fontSize: "var(--text-xs)", color: "#71787b", marginTop: 8 }}>No notes from teachers yet.</p>
              </div>
            </div>
          )}

          {activeTab === "Academics" && (
            <div className={styles.infoCard}>
              <p className={styles.infoCardTitle}>Academic Progress</p>
              <div style={{ padding: "24px", textAlign: "center", color: "#41484b" }}>
                Academic detail view — report cards and grade history.
              </div>
            </div>
          )}

          {activeTab === "Financials" && (
            <div className={styles.infoCard}>
              <p className={styles.infoCardTitle}>Fee & Payment History</p>
              <div style={{ padding: "24px", textAlign: "center", color: "#41484b" }}>
                Full payment history and invoices for all terms.
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className={styles.rightPanel}>

          {/* Quick Actions */}
          <div className={styles.panelCard}>
            <h3 className={styles.panelTitle}>Quick Actions</h3>
            <div className={styles.quickActions}>
              <button className={styles.actionBtn}>
                <CreditCard size={16} /> Pay Fees
              </button>
              <button className={styles.actionBtnOutline}>
                <Download size={16} /> Download Report Card
              </button>
              <button className={styles.actionBtnOutline}>
                <MessageSquare size={16} /> Message Class Teacher
              </button>
            </div>
          </div>

          {/* Guardian Profile */}
          <div className={styles.panelCard}>
            <h3 className={styles.panelTitle}>Guardian Profile</h3>
            <div className={styles.profileRows}>
              <div className={styles.profileRow}>
                <span className={styles.profileKey}>Name</span>
                <span className={styles.profileVal}>{guardian?.name ?? guardianName}</span>
              </div>
              <div className={styles.profileRow}>
                <span className={styles.profileKey}>Relation</span>
                <span className={styles.profileVal}>{guardian?.relation ?? "Parent"}</span>
              </div>
              <div className={styles.profileRow}>
                <span className={styles.profileKey}>Contact</span>
                <span className={styles.profileVal}>{guardian?.phone ?? "+233 24 000 1111"}</span>
              </div>
              <div className={styles.profileRow}>
                <span className={styles.profileKey}>Status</span>
                <span className={styles.statusBadge}>
                  <CheckCircle size={12} /> Active
                </span>
              </div>
            </div>
            <button className={styles.updateLink}>Update Contact Details</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
