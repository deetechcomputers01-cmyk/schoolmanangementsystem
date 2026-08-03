import { requireRole } from "@backend/auth/page-guard";
import { listExpenses } from "@backend/services/expense.service";
import { ExpensesContent } from "./ExpensesContent";

export const dynamic = "force-dynamic";

export async function ExpensesScreen() {
  await requireRole("super_admin", "principal", "staff");

  const expenses = await listExpenses();

  return (
    <ExpensesContent
      expenses={expenses.map((e) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: Number(e.amount),
        vendor: e.vendor,
        date: e.date.toISOString(),
        status: e.status,
        recordedByName: e.recordedBy.name,
      }))}
    />
  );
}
