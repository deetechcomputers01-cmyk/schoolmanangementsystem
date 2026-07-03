/**
 * TimetableScreen — desktop view for the Timetable.
 */
import Link from "next/link";
import { Settings } from "lucide-react";
import { TimetableGrid } from "@/components/modules/timetable/TimetableGrid";
import { Button } from "@/components/ui/Button";
import { listTimetable } from "@backend/services/timetable.service";
import styles from "./TimetableScreen.module.css";

export const dynamic = "force-dynamic";

export async function TimetableScreen() {
  const slots = await listTimetable();
  return (
    <div className={styles.root}>
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="label-sm text-emerald">Academic Planning</p>
          <h1 className="font-heading text-[32px] font-semibold leading-10 text-navy">Timetable</h1>
          <p className="text-muted">Weekly class schedule, rooms, and assigned subjects.</p>
        </div>
        <Link href="/timetable/manage"><Button variant="secondary"><Settings size={18} /> Manage Slots</Button></Link>
      </section>
      <TimetableGrid slots={slots} />
    </div>
  );
}