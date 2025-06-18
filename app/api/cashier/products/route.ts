import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get("search") || "";

    // Get products with stock information
    let query = supabase.from("products").select("*");

    // Apply search filter if provided
    if (searchTerm) {
      query = query.ilike("name", `%${searchTerm}%`);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      throw error;
    }

    // Format products for the client-side
    const formattedProducts = data.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      price: product.price,
      image_url: product.image_url,
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error: any) {
    console.error("Error fetching products for cashier:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}
