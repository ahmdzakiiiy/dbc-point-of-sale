import { supabase } from "@/lib/supabase";

// Sample static product data for when the database is unavailable
// This should match the static data in the main products route
const SAMPLE_PRODUCTS = [
  {
    id: "1",
    name: "Daster Bordir Bunga",
    stock: 25,
    price: 85000,
    image_url: "/placeholder.svg",
    created_at: "2025-06-01T00:00:00.000Z",
    updated_at: "2025-06-21T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Daster Bordir Kupu-kupu",
    stock: 15,
    price: 90000,
    image_url: "/placeholder.svg",
    created_at: "2025-06-02T00:00:00.000Z",
    updated_at: "2025-06-21T00:00:00.000Z",
  },
  {
    id: "3",
    name: "Daster Bordir Premium",
    stock: 10,
    price: 120000,
    image_url: "/placeholder.svg",
    created_at: "2025-06-03T00:00:00.000Z",
    updated_at: "2025-06-21T00:00:00.000Z",
  },
  {
    id: "4",
    name: "Daster Polos Casual",
    stock: 30,
    price: 65000,
    image_url: "/placeholder.svg",
    created_at: "2025-06-04T00:00:00.000Z",
    updated_at: "2025-06-21T00:00:00.000Z",
  },
  {
    id: "5",
    name: "Daster Bordir Anak",
    stock: 20,
    price: 55000,
    image_url: "/placeholder.svg",
    created_at: "2025-06-05T00:00:00.000Z",
    updated_at: "2025-06-21T00:00:00.000Z",
  },
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Try to fetch from Supabase first
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return new Response(
            JSON.stringify({ error: "Produk tidak ditemukan" }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
              },
            }
          );
        }
        throw error;
      }

      return new Response(JSON.stringify({ product: data }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    } catch (supabaseError) {
      // If Supabase fails, fall back to static data
      console.error("Error fetching product from Supabase:", supabaseError);
      console.log("Falling back to static product data");

      // Find the product in our static data
      const staticProduct = SAMPLE_PRODUCTS.find(
        (product) => product.id === id
      );

      if (!staticProduct) {
        return new Response(
          JSON.stringify({ error: "Produk tidak ditemukan" }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        );
      }

      return new Response(JSON.stringify({ product: staticProduct }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }
  } catch (error: any) {
    console.error("Critical error in product detail API:", error);
    return new Response(
      JSON.stringify({ error: "Gagal mengambil data produk" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204, // No content
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();

    const { name, stock, price, image_url } = body;
    const updateData = {
      name,
      stock: Number(stock),
      price: Number(price),
      image_url,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return new Response(
            JSON.stringify({ error: "Produk tidak ditemukan" }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
              },
            }
          );
        }
        throw error;
      }

      return new Response(JSON.stringify({ product: data }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    } catch (supabaseError) {
      console.error("Error updating product in Supabase:", supabaseError);

      // Find the product in our static data first
      const staticProductIndex = SAMPLE_PRODUCTS.findIndex(
        (product) => product.id === id
      );

      if (staticProductIndex === -1) {
        return new Response(
          JSON.stringify({ error: "Produk tidak ditemukan" }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        );
      }

      // Update the static product
      const updatedProduct = {
        ...SAMPLE_PRODUCTS[staticProductIndex],
        ...updateData,
      };

      // Replace the product in our array
      SAMPLE_PRODUCTS[staticProductIndex] = updatedProduct;

      return new Response(
        JSON.stringify({
          product: updatedProduct,
          warning: "Product updated locally only. Database unavailable.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Critical error in product update API:", error);
    return new Response(
      JSON.stringify({ error: "Gagal mengubah data produk" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
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
