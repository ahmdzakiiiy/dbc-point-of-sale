import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;

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
          { status: 404 }
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
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching transaction details:", error);
    return NextResponse.json(
      { error: "Gagal mengambil detail transaksi" },
      { status: 500 }
    );
  }
}
