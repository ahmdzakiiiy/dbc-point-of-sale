import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Produk tidak ditemukan" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ product: data }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();

    // Log the received body for debugging
    console.log("Update product request body:", JSON.stringify(body));

    const { name, stock, price, base_price, image_url } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: "Nama produk tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Ensure all number fields are valid numbers
    const numericStock = Number(stock);
    const numericPrice = Number(price);
    const numericBasePrice = Number(base_price);

    if (isNaN(numericStock) || isNaN(numericPrice) || isNaN(numericBasePrice)) {
      return NextResponse.json(
        { error: "Nilai stok, harga jual, atau harga modal tidak valid" },
        { status: 400 }
      );
    }

    // Prepare the update payload with properly typed values
    const updatePayload = {
      name: name.trim(),
      stock: numericStock,
      price: numericPrice,
      base_price: numericBasePrice,
      image_url,
      updated_at: new Date().toISOString(),
    };

    console.log("Update payload:", JSON.stringify(updatePayload));

    const { data, error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating product:", error);
      
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Produk tidak ditemukan" },
          { status: 404 }
        );
      }
      
      // Return specific error with details
      return NextResponse.json(
        { error: `Database error: ${error.message}`, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: data }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: `Gagal mengubah data produk: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
