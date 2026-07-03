"use client";

import { Camera, Check, GraduationCap, ImagePlus, Loader2, Lock, Save, UserRound, UsersRound, X } from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function StudentForm({ classes }: { classes: { id: string; name: string }[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const admissionNo = useMemo(() => `GA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [relation, setRelation] = useState("Mother");

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");

    const fullName = String(formData.get("fullName") ?? "").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() ?? "";
    const lastName = nameParts.join(" ") || firstName;

    formData.set("admissionNo", admissionNo);
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("relation", relation);

    const response = await fetch("/api/students", { method: "POST", body: formData });
    setBusy(false);

    if (response.ok) {
      router.push("/students");
      router.refresh();
      return;
    }

    const result = await response.json().catch(() => null);
    setError(result?.error ?? "Unable to save student. Please check the details and try again.");
  }

  function updatePreview(file?: File) {
    if (!file) {
      setPreview("");
      return;
    }

    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={submit} className="relative pb-24 md:pb-0">
      <input name="admissionNo" type="hidden" value={admissionNo} />
      <input name="firstName" type="hidden" />
      <input name="lastName" type="hidden" />
      <input name="relation" type="hidden" value={relation} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-line bg-white p-5 shadow-soft">
          <div className="flex flex-col items-center text-center">
            <button className="group relative" onClick={() => fileInputRef.current?.click()} type="button">
              <span
                className="grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-slate-100 bg-cover bg-center text-muted transition group-hover:border-emerald"
                style={preview ? { backgroundImage: `url(${preview})` } : undefined}
              >
                {!preview && (
                  <span className="flex flex-col items-center gap-1">
                    <ImagePlus size={30} />
                    <span className="label-sm">Photo</span>
                  </span>
                )}
              </span>
              <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-lg bg-navy text-white shadow-soft transition group-hover:scale-105">
                <Camera size={15} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              name="photo"
              onChange={(event) => updatePreview(event.target.files?.[0])}
              type="file"
            />
            <h2 className="mt-5 font-heading text-xl font-semibold text-navy">Student Photo</h2>
            <p className="mt-1 text-sm text-muted">PNG, JPG, or WEBP up to 5MB. Used for student ID and profile records.</p>
            <div className="mt-4 flex gap-2">
              <button className="rounded-md bg-emerald/15 px-3 py-2 text-xs font-bold text-emerald transition hover:bg-emerald/25" onClick={() => fileInputRef.current?.click()} type="button">
                Upload New
              </button>
              <button
                className="rounded-md px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                onClick={() => {
                  setPreview("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                type="button"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-line bg-shell p-4">
            <p className="label-sm text-muted">Student ID</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-data font-semibold text-navy">{admissionNo}</span>
              <Lock size={16} className="text-muted" />
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <Section icon={<UserRound size={20} />} title="Personal Info">
            <Field className="md:col-span-2" label="Full Name">
              <input className={fieldClass} name="fullName" placeholder="e.g. Kofi Annan Mensah" required type="text" />
            </Field>
            <Field label="Gender">
              <select className={fieldClass} name="gender" required defaultValue="">
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Date of Birth">
              <input className={fieldClass} name="dateOfBirth" required type="date" />
            </Field>
            <Field className="md:col-span-2" label="Residential Address">
              <textarea className={`${fieldClass} min-h-24 py-3`} name="address" placeholder="Digital address or physical location" required />
            </Field>
          </Section>

          <Section icon={<GraduationCap size={20} />} title="Academic Details">
            <Field label="Class / Grade">
              <select className={fieldClass} name="classId" required defaultValue="">
                <option value="" disabled>Assign to Class</option>
                {classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </select>
            </Field>
            <Field label="Admission Date">
              <input className={fieldClass} defaultValue={new Date().toISOString().slice(0, 10)} type="date" />
            </Field>
          </Section>

          <Section icon={<UsersRound size={20} />} title="Guardian Info">
            <Field label="Guardian Name">
              <input className={fieldClass} name="guardianName" placeholder="Primary contact name" required type="text" />
            </Field>
            <Field label="Phone Number">
              <input className={fieldClass} name="guardianPhone" placeholder="+233 24 000 0000" required type="tel" />
            </Field>
            <Field className="md:col-span-2" label="Emergency Email">
              <input className={fieldClass} name="guardianEmail" placeholder="guardian@email.com" type="email" />
            </Field>
            <div className="md:col-span-2">
              <p className="label-sm mb-2 text-muted">Relationship</p>
              <div className="flex flex-wrap gap-2">
                {["Mother", "Father", "Legal Guardian"].map((item) => (
                  <button
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${relation === item ? "border-emerald bg-emerald/20 text-emerald" : "border-line text-muted hover:bg-shell"}`}
                    key={item}
                    onClick={() => setRelation(item)}
                    type="button"
                  >
                    {relation === item && <Check className="mr-1 inline" size={14} />}
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

          <div className="hidden justify-end gap-3 md:flex">
            <button className="rounded-lg bg-slate-100 px-6 py-3 font-heading font-semibold text-navy transition hover:bg-slate-200" onClick={() => router.back()} type="button">
              Cancel
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-emerald px-6 py-3 font-heading font-semibold text-white shadow-emerald transition hover:bg-emerald/90 disabled:opacity-60" disabled={busy} type="submit">
              {busy ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {busy ? "Saving..." : "Save Student"}
            </button>
          </div>
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-line bg-white/95 p-4 backdrop-blur md:hidden">
        <button className="h-14 flex-1 rounded-xl bg-slate-100 font-heading text-lg font-semibold text-navy active:scale-95" onClick={() => router.back()} type="button">
          <X className="mr-1 inline" size={18} /> Cancel
        </button>
        <button className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-xl bg-navy font-heading text-lg font-semibold text-white shadow-soft active:scale-95 disabled:opacity-60" disabled={busy} type="submit">
          {busy ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {busy ? "Saving..." : "Save Student"}
        </button>
      </footer>
    </form>
  );
}

const fieldClass = "focus-ring min-h-12 w-full rounded-lg border border-line bg-white px-4 text-base text-navy placeholder:text-muted/50";

function Section({ children, icon, title }: { children: React.ReactNode; icon: React.ReactNode; title: string }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center gap-2 border-b border-line pb-3">
        <span className="text-emerald">{icon}</span>
        <h2 className="font-heading text-xl font-semibold text-navy">{title}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ children, className = "", label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="label-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
