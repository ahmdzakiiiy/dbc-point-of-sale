import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import path from "path";
import fs from "fs";

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Static fallback data for when Supabase is down
const getStaticTransactionData = (id: string) => {
  try {
    // Try to load specific transaction data
    const staticFilePath = path.join(
      process.cwd(),
      "public",
      "api-static",
      `transaction-${id}.json`
    );

    if (fs.existsSync(staticFilePath)) {
      const staticData = fs.readFileSync(staticFilePath, "utf8");
      return JSON.parse(staticData);
    }

    // If specific transaction not found, use default
    return {
      transaction: {
        id: id,
        transaction_date: "2023-05-15T08:30:00.000Z",
        total_amount: 125000,
        discount_amount: 0,
        user_id: "1",
        created_at: "2023-05-15T08:30:00.000Z",
      },
      items: [
        {
          id: "1",
          transaction_id: id,
          product_id: "1",
          product_name: "Daster Motif Bunga",
          quantity: 2,
          price: 50000,
          created_at: "2023-05-15T08:30:00.000Z",
        },
        {
          id: "2",
          transaction_id: id,
          product_id: "3",
          product_name: "Daster Premium",
          quantity: 1,
          price: 25000,
          created_at: "2023-05-15T08:30:00.000Z",
        },
      ],
    };
  } catch (error) {
    console.error(`Error loading static transaction data for ID ${id}:`, error);
    return {
      transaction: {
        id: id,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        discount_amount: 0,
        user_id: "1",
        created_at: new Date().toISOString(),
      },
      items: [],
    };
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const transactionId = params.id;

    try {
      // First try to get data from Supabase
      // Get transaction details
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (transactionError) {
        if (transactionError.code === "PGRST116") {
          return NextResponse.json(
            { error: "Transaksi tidak ditemukan" },
            {
              status: 404,
              headers: corsHeaders,
            }
          );
        }
        throw transactionError;
      }

      // Get transaction items
      const { data: items, error: itemsError } = await supabase
        .from("transaction_items")
        .select("*")
        .eq("transaction_id", transactionId);

      if (itemsError) throw itemsError;

      return NextResponse.json(
        {
          transaction,
          items: items || [],
        },
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    } catch (supabaseError) {
      console.error(
        "Supabase error, using static fallback data:",
        supabaseError
      );

      // If Supabase fails, use static data
      const staticData = getStaticTransactionData(transactionId);

      return NextResponse.json(
        {
          ...staticData,
          _staticFallback: true,
        },
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }
  } catch (error: any) {
    console.error("Error fetching transaction details:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil detail transaksi",
        message: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
