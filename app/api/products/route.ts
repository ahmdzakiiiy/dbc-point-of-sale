import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ products: data }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, stock, price, image_url } = body;

    if (!name || isNaN(stock) || isNaN(price)) {
      return NextResponse.json(
        { error: "Data produk tidak lengkap atau tidak valid" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        stock: Number(stock),
        price: Number(price),
        image_url,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan produk" },
      { status: 500 }
    );
  }
}
