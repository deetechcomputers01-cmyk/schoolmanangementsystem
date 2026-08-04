import { requireRole } from "@backend/auth/page-guard";
import { listExpenses } from "@backend/services/expense.service";
import { ExpensesContent } from "./ExpensesContent";
import { MobileExpensesContent } from "@/screens/mobile/MobileExpensesContent/MobileExpensesContent";

export const dynamic = "force-dynamic";

export async function ExpensesScreen() {
  await requireRole("super_admin", "principal", "staff");

  const expenses = await listExpenses();
  const expenseRows = expenses.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
    vendor: e.vendor,
    date: e.date.toISOString(),
    status: e.status,
    recordedByName: e.recordedBy.name,
  }));

  return (
    <>
      <div className="mobileOnly">
        <MobileExpensesContent expenses={expenseRows} />
      </div>
      <div className="desktopOnly">
        <ExpensesContent expenses={expenseRows} />
      </div>
    </>
  );
}
