import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");    // Get transactions with their items and join with users table to get username
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(`
        *,
        users:user_id (
          username
        )
      `)
      .order("transaction_date", { ascending: false })
      .limit(limit);

    if (transactionsError) {
      throw transactionsError;
    }

    // For each transaction, get its items
    const transactionWithItems = await Promise.all(
      transactions.map(async (transaction) => {
        const { data: items, error: itemsError } = await supabase
          .from("transaction_items")
          .select("*")
          .eq("transaction_id", transaction.id);

        if (itemsError) {
          console.error(
            `Error fetching items for transaction ${transaction.id}:`,
            itemsError
          );
          return {
            ...transaction,
            items: [],
          };
        }

        // Format transaction data
        return {
          id: transaction.id,
          date: transaction.transaction_date,
          subtotal:
            Number(transaction.total_amount) +
            Number(transaction.discount_amount || 0),
          discount: transaction.discount_amount
            ? {
                type: "fixed", // We don't store type in DB, defaulting to fixed
                value: Number(transaction.discount_amount),
                amount: Number(transaction.discount_amount),
              }
            : undefined,          total: Number(transaction.total_amount),
          cashier: transaction.users?.username || "Admin",
          cashierId: transaction.user_id,
          status: "completed",
          items: items.map((item) => ({
            id: item.product_id,
            name: item.product_name,
            price: Number(item.price),
            quantity: item.quantity,
          })),
        };
      })
    );

    return NextResponse.json({ transactions: transactionWithItems });
  } catch (error: any) {
    console.error("Error fetching transaction history:", error);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat transaksi" },
      { status: 500 }
    );
  }
}
