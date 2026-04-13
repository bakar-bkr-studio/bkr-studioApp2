export type TransactionType = "income" | "expense";
export type TransactionStatus = "completed" | "planned";
export type PaymentMethod =
  | "transfer"
  | "cash"
  | "card"
  | "mobile_money"
  | "other";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  projectId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertTransactionInput {
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  projectId?: string | null;
  notes?: string | null;
}
