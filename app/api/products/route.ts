// Import needed, but we'll add a fallback for when Supabase fails
import { supabase } from "@/lib/supabase";
import path from "path";
import fs from "fs";

// Sample static product data for when the database is unavailable
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

// Function to get products from static JSON file
const getStaticProducts = () => {
  try {
    // In production, use an absolute path to the static file
    const staticFilePath = path.join(
      process.cwd(),
      "public",
      "api-static",
      "products.json"
    );

    if (fs.existsSync(staticFilePath)) {
      const staticData = fs.readFileSync(staticFilePath, "utf8");
      return JSON.parse(staticData).products;
    }

    // Fallback to hardcoded data if file not found
    return SAMPLE_PRODUCTS;
  } catch (error) {
    console.error("Error loading static product data:", error);
    return SAMPLE_PRODUCTS;
  }
};

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

export async function GET() {
  try {
    // Try to fetch from Supabase first
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      // Return the data from Supabase if successful
      return new Response(JSON.stringify({ products: data }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    } catch (supabaseError) {
      // If Supabase fails, fall back to static data
      console.error("Error fetching products from Supabase:", supabaseError);
      console.log("Falling back to static product data");

      // Try to get products from static JSON file
      const staticProducts = getStaticProducts();

      return new Response(
        JSON.stringify({
          products: staticProducts,
          _staticFallback: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Critical error in products API:", error);
    return new Response(
      JSON.stringify({ error: "Gagal mengambil data produk" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const product = await request.json();

    // Validate required fields
    if (
      !product.name ||
      product.price === undefined ||
      product.stock === undefined
    ) {
      return new Response(
        JSON.stringify({
          error: "Nama produk, harga, dan stok harus diisi",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    try {
      // Try to save to Supabase
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: product.name,
          price: Number(product.price),
          stock: Number(product.stock),
          image_url: product.image_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ product: data }), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    } catch (supabaseError) {
      console.error("Error saving product to Supabase:", supabaseError);

      // For POST requests, we can't use static data as a complete fallback
      // But we can still provide a helpful response with temporary ID
      return new Response(
        JSON.stringify({
          error: "Gagal menyimpan produk ke database. Coba lagi nanti.",
          _offline: true,
          _tempProduct: {
            id: `temp_${Date.now()}`,
            name: product.name,
            price: Number(product.price),
            stock: Number(product.stock),
            image_url: product.image_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
        {
          status: 503, // Service Unavailable
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Critical error in product creation:", error);
    return new Response(
      JSON.stringify({ error: "Gagal membuat produk baru: " + error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
