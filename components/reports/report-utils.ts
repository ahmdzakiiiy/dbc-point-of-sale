// Utility functions for reports
import { Transaction } from "@/lib/supabase";

export interface FormattedTransaction extends Transaction {
  date: Date;
  total: number;
  discount: number;
  profit?: number;
}

// Format raw transactions into a consistent format
export const formatTransactions = (transactions: Transaction[]): FormattedTransaction[] => {
  return transactions.map((transaction) => ({
    ...transaction,
    date: new Date(transaction.transaction_date),
    total: Number(transaction.total_amount),
    discount: Number(transaction.discount_amount),
    profit: transaction.profit !== undefined ? Number(transaction.profit) : undefined,
  }));
};

// Calculate totals from formatted transactions
export const calculateTotals = (transactions: FormattedTransaction[]) => {
  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.total, 0);
  const totalDiscount = transactions.reduce((sum, transaction) => sum + transaction.discount, 0);
  
  // Make sure profit is always a number before adding
  const totalProfit = transactions.reduce((sum, transaction) => {
    const profit = transaction.profit !== undefined && transaction.profit !== null 
      ? Number(transaction.profit) 
      : 0;
    return sum + profit;
  }, 0);
  
  const grossAmount = totalAmount + totalDiscount;
  const averagePerTransaction = transactions.length > 0 
    ? Math.round(totalAmount / transactions.length) 
    : 0;

  return {
    totalTransactions: transactions.length,
    totalAmount,
    totalDiscount,
    grossAmount,
    totalProfit,
    averagePerTransaction
  };
};

// Format date - replaces date-fns
export const formatDate = (date: Date) => {
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format month and year only
export const formatMonth = (date: Date) => {
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
  });
};

// Format currency
export const formatCurrency = (amount: number) => {
  return amount.toLocaleString("id-ID");
};
