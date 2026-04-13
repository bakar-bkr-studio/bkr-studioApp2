import { apiRequest } from "@/lib/api-client";
import type {
  Transaction,
  UpsertTransactionInput,
} from "@/features/finances/types";

interface TransactionsListResponse {
  items: Transaction[];
}

interface TransactionItemResponse {
  item: Transaction;
}

export async function listUserTransactions(): Promise<Transaction[]> {
  const response = await apiRequest<TransactionsListResponse>(
    "/api/v1/transactions",
    {
      method: "GET",
    }
  );

  return response.items;
}

export async function createTransaction(
  data: UpsertTransactionInput
): Promise<Transaction> {
  const response = await apiRequest<TransactionItemResponse>(
    "/api/v1/transactions",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  return response.item;
}

export async function updateTransaction(
  transactionId: string,
  data: Partial<UpsertTransactionInput>
): Promise<Transaction> {
  const normalizedTransactionId = transactionId.trim();

  if (!normalizedTransactionId) {
    throw new Error("Transaction invalide: id manquant.");
  }

  const response = await apiRequest<TransactionItemResponse>(
    `/api/v1/transactions/${encodeURIComponent(normalizedTransactionId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return response.item;
}

export async function deleteTransaction(
  transactionId: string
): Promise<void> {
  const normalizedTransactionId = transactionId.trim();

  if (!normalizedTransactionId) {
    throw new Error("Transaction invalide: id manquant.");
  }

  await apiRequest<{ success: boolean }>(
    `/api/v1/transactions/${encodeURIComponent(normalizedTransactionId)}`,
    {
      method: "DELETE",
    }
  );
}
