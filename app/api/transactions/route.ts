import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import path from "path";
import fs from "fs";

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Static fallback data for when Supabase is down
const getStaticTransactions = () => {
  try {
    // In production, use an absolute path to the static file
    const staticFilePath = path.join(
      process.cwd(),
      "public",
      "api-static",
      "transactions.json"
    );

    if (fs.existsSync(staticFilePath)) {
      const staticData = fs.readFileSync(staticFilePath, "utf8");
      return JSON.parse(staticData);
    }

    // Fallback static data if file can't be read
    return {
      transactions: [
        {
          id: "1",
          transaction_date: "2023-05-15T08:30:00.000Z",
          total_amount: 125000,
          discount_amount: 0,
          user_id: "1",
          created_at: "2023-05-15T08:30:00.000Z",
        },
        {
          id: "2",
          transaction_date: "2023-05-15T10:45:00.000Z",
          total_amount: 75000,
          discount_amount: 5000,
          user_id: "2",
          created_at: "2023-05-15T10:45:00.000Z",
        },
      ],
    };
  } catch (error) {
    console.error("Error loading static transaction data:", error);
    return { transactions: [] };
  }
};

export async function GET(req: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    // Extract query parameters
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");

    try {
      // First try to get data from Supabase
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

      return NextResponse.json(
        { transactions: data },
        { status: 200, headers: corsHeaders }
      );
    } catch (supabaseError) {
      console.error(
        "Supabase error, using static fallback data:",
        supabaseError
      );

      // If Supabase fails, use static data
      const staticData = getStaticTransactions();

      // Filter by year and month if provided
      if (year && month) {
        const filteredTransactions = staticData.transactions.filter(
          (transaction: any) => {
            const transDate = new Date(transaction.transaction_date);
            return (
              transDate.getFullYear() === parseInt(year) &&
              transDate.getMonth() === parseInt(month) - 1
            );
          }
        );

        return NextResponse.json(
          { transactions: filteredTransactions, _staticFallback: true },
          { status: 200, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { transactions: staticData.transactions, _staticFallback: true },
        { status: 200, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data transaksi",
        message: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const body = await req.json();
    const { total_amount, discount_amount, user_id, items } = body;

    try {
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

      return NextResponse.json(
        { transaction: transaction },
        { status: 201, headers: corsHeaders }
      );
    } catch (supabaseError) {
      console.error("Error during Supabase operations:", supabaseError);

      // For POST requests, we can't use static data as a fallback for data creation
      // But we can still provide a helpful response
      return NextResponse.json(
        {
          error:
            "Transaksi gagal dicatat di database. Harap simpan informasi transaksi dan coba lagi nanti.",
          _offline: true,
          _tempTransaction: {
            id: `temp_${Date.now()}`,
            total_amount,
            discount_amount: discount_amount || 0,
            user_id,
            created_at: new Date().toISOString(),
            items,
          },
        },
        { status: 503, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("Transaction creation error:", error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
