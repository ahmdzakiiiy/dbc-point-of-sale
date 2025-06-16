import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { items, subtotal, discount, total, cashReceived, change, cashier } =
      body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Item transaksi tidak valid" },
        { status: 400 }
      );
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        total_amount: total,
        discount_amount: discount?.amount || 0,
        user_id: cashier,
      })
      .select()
      .single();

    if (transactionError) {
      throw transactionError;
    }

    // Create transaction items
    const transactionItems = items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("transaction_items")
      .insert(transactionItems);

    if (itemsError) {
      throw itemsError;
    }

    // Update product stock for each item
    for (const item of items) {
      // Get current stock
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.id)
        .single();

      if (productError) {
        console.error(`Error fetching product ${item.id}:`, productError);
        continue;
      }

      // Update stock
      const newStock = product.stock - item.quantity;

      if (newStock < 0) {
        console.warn(
          `Warning: Stock for product ${item.id} is now negative (${newStock})`
        );
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (updateError) {
        console.error(
          `Error updating stock for product ${item.id}:`,
          updateError
        );
      }
    }

    // Return transaction data
    return NextResponse.json(
      {
        success: true,
        transaction: {
          id: transaction.id,
          date: transaction.transaction_date,
          items,
          subtotal,
          discount,
          total,
          cashReceived,
          change,
          cashier,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi" },
      { status: 500 }
    );
  }
}
