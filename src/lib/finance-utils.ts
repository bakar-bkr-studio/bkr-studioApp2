import type { Transaction } from "@/features/finances/types";

export interface FinanceSummary {
  totalIncomeCompleted: number;
  totalExpenseCompleted: number;
  netCompleted: number;
  totalIncomePlanned: number;
  totalExpensePlanned: number;
  netPlanned: number;
}

export interface MonthlyFinanceDataPoint {
  month: string;
  incomeCompleted: number;
  expenseCompleted: number;
  incomePlanned: number;
  expensePlanned: number;
}

function getMonthKey(date: string): string {
  const datePart = date.split("T")[0] ?? "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart.slice(0, 7);
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "invalid-date";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getFinanceSummary(transactions: Transaction[]): FinanceSummary {
  const summary = transactions.reduce(
    (acc, transaction) => {
      const isIncome = transaction.type === "income";
      const isCompleted = transaction.status === "completed";

      if (isCompleted) {
        if (isIncome) {
          acc.totalIncomeCompleted += transaction.amount;
        } else {
          acc.totalExpenseCompleted += transaction.amount;
        }
      } else if (isIncome) {
        acc.totalIncomePlanned += transaction.amount;
      } else {
        acc.totalExpensePlanned += transaction.amount;
      }

      return acc;
    },
    {
      totalIncomeCompleted: 0,
      totalExpenseCompleted: 0,
      totalIncomePlanned: 0,
      totalExpensePlanned: 0,
    }
  );

  return {
    ...summary,
    netCompleted: summary.totalIncomeCompleted - summary.totalExpenseCompleted,
    netPlanned: summary.totalIncomePlanned - summary.totalExpensePlanned,
  };
}

export function getMonthlyFinanceData(
  transactions: Transaction[]
): MonthlyFinanceDataPoint[] {
  const groupedByMonth = transactions.reduce<Record<string, MonthlyFinanceDataPoint>>(
    (acc, transaction) => {
      const monthKey = getMonthKey(transaction.date);

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          incomeCompleted: 0,
          expenseCompleted: 0,
          incomePlanned: 0,
          expensePlanned: 0,
        };
      }

      const monthData = acc[monthKey];

      if (transaction.type === "income") {
        if (transaction.status === "completed") {
          monthData.incomeCompleted += transaction.amount;
        } else {
          monthData.incomePlanned += transaction.amount;
        }
      } else if (transaction.status === "completed") {
        monthData.expenseCompleted += transaction.amount;
      } else {
        monthData.expensePlanned += transaction.amount;
      }

      return acc;
    },
    {}
  );

  return Object.values(groupedByMonth).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
}

export function getRecentTransactions(
  transactions: Transaction[],
  limit = 5
): Transaction[] {
  return [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
