import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {  try {
    const body = await req.json();
    
    console.log("Data yang diterima dari client:", body);

    const { items, subtotal, discount, total, cashReceived, change, cashierId, cashierName } =
      body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Item transaksi tidak valid" },
        { status: 400 }
      );
    }
    
    // Validasi data
    if (typeof total !== 'number' || isNaN(total)) {
      return NextResponse.json(
        { error: "Total transaksi tidak valid" },
        { status: 400 }
      );
    }    // Create transaction record
    console.log("Membuat record transaksi dengan total:", total, "discount:", discount?.amount);
      const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        total_amount: total,
        discount_amount: discount?.amount || 0,
        user_id: cashierId, // Gunakan UUID user id
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error saat membuat transaksi:", transactionError);
      return NextResponse.json(
        { error: "Gagal membuat transaksi: " + transactionError.message },
        { status: 500 }
      );
    }
    
    if (!transaction) {
      console.error("Transaksi berhasil dibuat tetapi tidak ada data yang dikembalikan");
      return NextResponse.json(
        { error: "Gagal mendapatkan data transaksi yang dibuat" },
        { status: 500 }
      );
    }    // Create transaction items
    const transactionItems = items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));
    
    console.log("Membuat item transaksi:", transactionItems);

    const { data: insertedItems, error: itemsError } = await supabase
      .from("transaction_items")
      .insert(transactionItems)
      .select();

    if (itemsError) {
      console.error("Error saat menambahkan item transaksi:", itemsError);
      return NextResponse.json(
        { error: "Gagal menambahkan item transaksi: " + itemsError.message },
        { status: 500 }
      );
    }
    
    console.log("Item transaksi berhasil dibuat:", insertedItems?.length || 0, "item");    // Update product stock for each item
    let stockUpdateErrors = 0;
    
    for (const item of items) {
      try {
        console.log(`Memperbarui stok untuk produk ${item.id}, kuantitas: ${item.quantity}`);
        
        // Get current stock
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("stock, name")
          .eq("id", item.id)
          .single();

        if (productError) {
          console.error(`Error mengambil data produk ${item.id}:`, productError);
          stockUpdateErrors++;
          continue;
        }

        if (!product) {
          console.error(`Produk dengan ID ${item.id} tidak ditemukan`);
          stockUpdateErrors++;
          continue;
        }

        console.log(`Produk ${product.name} (ID: ${item.id}) stok saat ini: ${product.stock}`);
        
        // Update stock
        const newStock = Math.max(0, product.stock - item.quantity); // Pastikan tidak negatif

        if (product.stock < item.quantity) {
          console.warn(
            `Peringatan: Stok produk ${item.id} (${product.name}) tidak cukup. Meminta: ${item.quantity}, Tersedia: ${product.stock}`
          );
        }

        const { data: updatedProduct, error: updateError } = await supabase
          .from("products")
          .update({
            stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id)
          .select();

        if (updateError) {
          console.error(
            `Error memperbarui stok untuk produk ${item.id}:`,
            updateError
          );
          stockUpdateErrors++;
        } else {
          console.log(`Stok produk ${item.id} berhasil diperbarui menjadi ${newStock}`);
        }
      } catch (err) {
        console.error(`Terjadi kesalahan saat memperbarui stok produk ${item.id}:`, err);
        stockUpdateErrors++;
      }
    }
    
    // Report stock update issues but don't fail the transaction
    if (stockUpdateErrors > 0) {
      console.warn(`${stockUpdateErrors} produk gagal diperbarui stoknya.`);
    }    // Return transaction data
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
          cashier: cashierName, // Gunakan nama kasir untuk display
          cashierId // Juga kembalikan ID untuk referensi
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
