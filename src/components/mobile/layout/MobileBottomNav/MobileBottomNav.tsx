"use client";

/**
 * MobileBottomNav — one file, one purpose.
 * 64px fixed bottom navigation bar. Up to 5 tab items.
 * Touch targets are minimum 44×44px.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Bell, Users, UserCheck, LogIn, ClipboardList,
  BookOpen, FileText, Calendar, Megaphone, Shield, Heart, Bus,
  Home, Wallet, Receipt, BarChart2, Package, UserCog, Wifi,
  Settings, GraduationCap, type LucideIcon,
} from "lucide-react";
import type { NavIconKey } from "@/lib/nav";
import styles from "./MobileBottomNav.module.css";

const ICON_MAP: Record<NavIconKey, LucideIcon> = {
  LayoutDashboard, Bell, Users, UserCheck, LogIn, ClipboardList,
  BookOpen, FileText, Calendar, Megaphone, Shield, Heart, Bus,
  Home, Wallet, Receipt, BarChart2, Package, UserCog, Wifi,
  Settings, GraduationCap,
};

export interface MobileNavTab {
  href: string;
  label: string;
  icon: NavIconKey;
}

interface MobileBottomNavProps {
  tabs: MobileNavTab[];
}

export function MobileBottomNav({ tabs }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Bottom navigation">
      {tabs.map((tab) => {
        const Icon = ICON_MAP[tab.icon];
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
  );
}
