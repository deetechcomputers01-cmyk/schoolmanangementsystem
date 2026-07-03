import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { getCurrentUser } from "@backend/auth/cookies";

export async function PageShell({
  title,
  action,
  hidePageHeader = false,
  children
}: {
  title: string;
  action?: React.ReactNode;
  hidePageHeader?: boolean;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-shell">
      <div className="flex">
        <Sidebar role={user?.role ?? null} />
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <Topbar user={user} />
          <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
            {!hidePageHeader && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="label-sm text-emerald">Academic year 2026</p>
                  <h1 className="font-heading text-2xl font-semibold text-navy md:text-[32px] md:leading-10">{title}</h1>
                </div>
                {action}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
      <MobileNav role={user?.role ?? null} />
    </div>
  );
}
