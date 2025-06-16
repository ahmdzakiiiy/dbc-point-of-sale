import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface DashboardData {
  productCount: number;
  totalStock: number;
  totalSales: number;
  totalTransactions: number;
  avgTransaction: number;
}

interface SalesData {
  date: string;
  sales: number;
  transactions: number;
  avgTransaction: number;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const viewMode = url.searchParams.get("viewMode") || "daily";
    const monthParam = url.searchParams.get("month");
    const yearParam = url.searchParams.get("year");
    
    const currentDate = new Date();
    const month = monthParam ? parseInt(monthParam) : currentDate.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam) : currentDate.getFullYear();
    
    // Fetch product statistics
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, stock");
      
    if (productsError) {
      throw new Error("Gagal mengambil data produk");
    }
    
    const productCount = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    
    // Fetch transaction data
    let salesData: SalesData[] = [];
    let totalSales = 0;
    let totalTransactions = 0;
    
    if (viewMode === "daily") {
      // For daily view, get data for the specific month and year
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      
      // Calculate end date (first day of next month)
      let endMonth = month === 12 ? 1 : month + 1;
      let endYear = month === 12 ? year + 1 : year;
      const endDate = `${endYear}-${endMonth.toString().padStart(2, '0')}-01`;
      
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .gte("transaction_date", startDate)
        .lt("transaction_date", endDate)
        .order("transaction_date", { ascending: true });
      
      if (transactionsError) {
        throw new Error("Gagal mengambil data transaksi");
      }
      
      // Group transactions by day
      const dailyMap = new Map<string, { sales: number; transactions: number }>();
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
        const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
        
        const amount = Number(transaction.total_amount);
        totalSales += amount;
        totalTransactions++;
        
        if (dailyMap.has(dayKey)) {
          const day = dailyMap.get(dayKey)!;
          day.sales += amount;
          day.transactions += 1;
        } else {
          dailyMap.set(dayKey, {
            sales: amount,
            transactions: 1
          });
        }
      });
      
      // Convert map to array for response
      dailyMap.forEach((value, key) => {
        const date = new Date(key);
        const day = date.getDate();
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
        const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
        
        salesData.push({
          date: key,
          sales: value.sales,
          transactions: value.transactions,
          avgTransaction: Math.round(value.sales / value.transactions)
        });
      });
    } else {
      // For monthly view, get data for the whole year
      const startDate = `${year}-01-01`;
      const endDate = `${year + 1}-01-01`;
      
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .gte("transaction_date", startDate)
        .lt("transaction_date", endDate);
      
      if (transactionsError) {
        throw new Error("Gagal mengambil data transaksi");
      }
      
      // Group transactions by month
      const monthlyMap = new Map<number, { sales: number; transactions: number }>();
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const month = date.getMonth(); // 0-11
        
        const amount = Number(transaction.total_amount);
        totalSales += amount;
        totalTransactions++;
        
        if (monthlyMap.has(month)) {
          const monthData = monthlyMap.get(month)!;
          monthData.sales += amount;
          monthData.transactions += 1;
        } else {
          monthlyMap.set(month, {
            sales: amount,
            transactions: 1
          });
        }
      });
      
      // Convert map to array for response
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
      
      for (let i = 0; i < 12; i++) {
        const monthData = monthlyMap.get(i);
        
        if (monthData) {
          salesData.push({
            date: monthNames[i],
            sales: monthData.sales,
            transactions: monthData.transactions,
            avgTransaction: Math.round(monthData.sales / monthData.transactions)
          });
        } else {
          salesData.push({
            date: monthNames[i],
            sales: 0,
            transactions: 0,
            avgTransaction: 0
          });
        }
      }
    }
    
    // Calculate average transaction value
    const avgTransaction = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;
    
    const dashboardData: DashboardData = {
      productCount,
      totalStock,
      totalSales,
      totalTransactions,
      avgTransaction
    };
    
    return NextResponse.json({ 
      dashboardData,
      salesData
    });
    
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data dashboard" }, 
      { status: 500 }
    );
  }
}
