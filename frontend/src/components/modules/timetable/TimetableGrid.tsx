import { PeriodBlock } from "./PeriodBlock";

type Slot = { id: string; day: string; startsAt: string; endsAt: string; room: string; class: { name: string }; subject: { name: string } };
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function TimetableGrid({ slots }: { slots: Slot[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {days.map((day) => (
        <section key={day} className="rounded-xl border border-line bg-slate-50 p-3">
          <h2 className="font-heading mb-3 font-semibold text-navy">{day}</h2>
          <div className="grid gap-3">
            {slots.filter((slot) => slot.day === day).map((slot) => (
              <PeriodBlock key={slot.id} subject={slot.subject.name} className={slot.class.name} time={`${slot.startsAt} - ${slot.endsAt}`} room={slot.room} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
