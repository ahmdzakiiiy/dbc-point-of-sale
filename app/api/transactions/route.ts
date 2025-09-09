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

    // For each transaction, fetch items to calculate profit
    const transactionsWithProfit = await Promise.all(data.map(async (transaction) => {
      const { data: items, error: itemsError } = await supabase
        .from("transaction_items")
        .select("*")
        .eq("transaction_id", transaction.id);
      
      if (itemsError || !items) {
        console.error("Error fetching transaction items:", itemsError);
        return transaction;
      }

      // Calculate profit as sum of (price - base_price) * quantity for each item
      let totalProfit = 0;
      
      // Process each item to calculate the profit
      for (const item of items) {
        let itemBasePrice = item.base_price;
        
        // If base_price is missing in transaction_items, try to get it from products table
        if (itemBasePrice === null || itemBasePrice === undefined) {
          if (item.product_id) {
            const { data: product } = await supabase
              .from("products")
              .select("base_price")
              .eq("id", item.product_id)
              .single();
              
            if (product && product.base_price) {
              itemBasePrice = product.base_price;
              console.log(`Retrieved base_price ${itemBasePrice} for product ${item.product_name} from products table`);
            }
          }
        }
        
        const itemProfit = itemBasePrice 
          ? (item.price - itemBasePrice) * item.quantity 
          : 0;
          
        console.log(`Item ${item.product_name}: price=${item.price}, base_price=${itemBasePrice}, quantity=${item.quantity}, profit=${itemProfit}`);
        
        totalProfit += itemProfit;
      }
      
      console.log(`Transaction ${transaction.id} - Total profit: ${totalProfit}`);

      return {
        ...transaction,
        profit: totalProfit,
      };
    }));

    return NextResponse.json({ transactions: transactionsWithProfit }, { status: 200 });
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
