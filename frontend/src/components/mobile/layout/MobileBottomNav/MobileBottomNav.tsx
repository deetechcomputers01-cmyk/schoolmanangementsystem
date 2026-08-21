"use client";

/**
 * MobileBottomNav — fixed 5-tab bottom navigation. The last tab (href="#more")
 * opens a full-screen sheet listing every remaining nav item, grouped by section.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut, Menu } from "lucide-react";
import { NAV_ICON_MAP, type NavIconKey } from "@/lib/nav";
import styles from "./MobileBottomNav.module.css";

export interface MobileNavTab {
  href: string;
  label: string;
  icon: NavIconKey;
}

export interface MobileMoreItem {
  href: string;
  label: string;
  icon: NavIconKey;
  group: string;
}

const GROUP_LABELS: Record<string, string> = {
  main: "General",
  academics: "Academics",
  campus: "Campus",
  finance: "Finance",
  management: "Management",
  communication: "Communication",
  system: "System",
  portals: "My Portal",
};

interface MobileBottomNavProps {
  tabs: MobileNavTab[];
  moreItems?: MobileMoreItem[];
  userName?: string;
  userRole?: string;
}

export function MobileBottomNav({ tabs, moreItems = [], userName = "User", userRole = "" }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Settings' inner section pages (/settings/<section>) replace this bar with
  // their own fixed Apply/Discard bar (see MobileSettingsSectionPage) — the
  // list page itself (/settings) keeps the normal tab bar.
  if (/^\/settings\/[^/]+$/.test(pathname)) return null;

  const groups = moreItems.reduce<Record<string, MobileMoreItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/login";
  }

  return (
    <>
      <nav className={styles.nav} aria-label="Bottom navigation">
        {tabs.map((tab) => {
          const Icon = NAV_ICON_MAP[tab.icon] ?? Menu;
          if (tab.href === "#more") {
            return (
              <button key="more" type="button" className={styles.tab} onClick={() => setMoreOpen(true)}>
                <Icon size={22} className={styles.tabIcon} aria-hidden />
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            );
          }
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} className={styles.tabIcon} aria-hidden />
              <span className={styles.tabLabel}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {moreOpen && (
        <div className={styles.sheetBackdrop} onClick={() => setMoreOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <div>
                <p className={styles.sheetUserName}>{userName}</p>
                <p className={styles.sheetUserRole}>{userRole || "Administrator"}</p>
              </div>
              <button type="button" className={styles.sheetClose} onClick={() => setMoreOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className={styles.sheetBody}>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className={styles.sheetGroup}>
                  <p className={styles.sheetGroupLabel}>{GROUP_LABELS[group] ?? group}</p>
                  {items.map((item) => {
                    const Icon = NAV_ICON_MAP[item.icon] ?? Menu;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={styles.sheetItem}
                        onClick={() => setMoreOpen(false)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
              <button type="button" className={styles.sheetLogout} onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
