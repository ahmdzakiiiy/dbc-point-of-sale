import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    // Extract query parameters
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");

    let query = supabase.from("transactions").select("*");

    // Filter by year and month if provided
    if (year && month) {
      const startDate = `${year}-${month.padStart(2, "0")}-01`;
      const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const endYear =
        parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

      query = query
        .gte("transaction_date", startDate)
        .lt("transaction_date", endDate);
    }

    const { data, error } = await query.order("transaction_date", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ transactions: data }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { total_amount, discount_amount, user_id, items } = body;

    // Start a transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        total_amount: Number(total_amount),
        discount_amount: Number(discount_amount || 0),
        user_id,
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Insert transaction items
    if (items && items.length > 0) {
      const transactionItems = items.map((item: any) => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: Number(item.quantity),
        price: Number(item.price),
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of items) {
        if (item.product_id) {
          // Get current stock
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();

          if (product) {
            // Update stock
            await supabase
              .from("products")
              .update({
                stock: product.stock - Number(item.quantity),
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.product_id);
          }
        }
      }
    }

    return NextResponse.json({ transaction: transaction }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi" },
      { status: 500 }
    );
  }
}
