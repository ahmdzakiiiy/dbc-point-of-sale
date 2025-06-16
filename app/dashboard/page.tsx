"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import DashboardNav from "@/components/dashboard-nav";

// Sample daily sales data for the current month
const generateDailySalesData = (): DailySalesData[] => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const dailyData: DailySalesData[] = [];
  for (let day = 1; day <= Math.min(daysInMonth, 30); day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
    const dateStr = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
    });

    // Generate realistic sales data with some variation
    const baseAmount = 200000 + Math.random() * 300000;
    const weekendMultiplier =
      date.getDay() === 0 || date.getDay() === 6 ? 1.3 : 1;
    const sales = Math.round(baseAmount * weekendMultiplier);
    const transactions =
      Math.floor(sales / 150000) + Math.floor(Math.random() * 5) + 1;

    dailyData.push({
      day: day,
      date: dateStr,
      dayName: dayName,
      sales: sales,
      transactions: transactions,
      avgTransaction: Math.round(sales / transactions),
    });
  }

  return dailyData;
};

// Define interfaces for sales data
interface SalesDataItem {
  sales: number;
  transactions: number;
  avgTransaction: number;
}

interface DailySalesData extends SalesDataItem {
  day: number;
  date: string;
  dayName: string;
}

interface MonthlySalesData extends SalesDataItem {
  month: number;
  monthName: string;
  growth: number;
}

// Sample monthly sales data for the current year
const generateMonthlySalesData = (): MonthlySalesData[] => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const monthlyData: MonthlySalesData[] = [];
  for (let month = 0; month < 12; month++) {
    // Generate realistic monthly sales data
    const baseAmount = 5000000 + Math.random() * 3000000;
    const seasonalMultiplier = month >= 10 || month <= 1 ? 1.2 : 1; // Higher sales in holiday months
    const sales = Math.round(baseAmount * seasonalMultiplier);
    const transactions =
      Math.floor(sales / 150000) + Math.floor(Math.random() * 50) + 10;

    monthlyData.push({
      month: month + 1,
      monthName: monthNames[month],
      sales: sales,
      transactions: transactions,
      avgTransaction: Math.round(sales / transactions),
      growth:
        month > 0 && monthlyData[month - 1]
          ? Math.round(
              ((sales - monthlyData[month - 1].sales) /
                monthlyData[month - 1].sales) *
                100
            )
          : 0,
    });
  }

  return monthlyData;
};

// Custom tooltip component interface
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  viewMode: "daily" | "monthly";
}

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
  viewMode,
}: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
      <div className="font-semibold text-gray-800 mb-2">
        {viewMode === "daily"
          ? `${data.dayName}, ${data.date}`
          : `${data.monthName} ${new Date().getFullYear()}`}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between items-center gap-4">
          <span className="text-gray-600">Penjualan:</span>
          <span className="font-medium text-green-600">
            Rp {data.sales?.toLocaleString("id-ID") || "0"}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-gray-600">Transaksi:</span>
          <span className="font-medium text-blue-600">
            {data.transactions || 0}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-gray-600">Rata-rata:</span>
          <span className="font-medium text-purple-600">
            Rp {data.avgTransaction?.toLocaleString("id-ID") || "0"}
          </span>
        </div>
        {viewMode === "monthly" &&
          data.growth !== undefined &&
          data.growth !== 0 && (
            <div className="flex justify-between items-center gap-4 pt-1 border-t">
              <span className="text-gray-600">Pertumbuhan:</span>
              <span
                className={`font-medium ${
                  data.growth > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {data.growth > 0 ? "+" : ""}
                {data.growth}%
              </span>
            </div>
          )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [salesData, setSalesData] = useState<
    DailySalesData[] | MonthlySalesData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data fetching
  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const data =
          viewMode === "daily"
            ? generateDailySalesData()
            : generateMonthlySalesData();
        setSalesData(data);
      } catch (error) {
        console.error("Error fetching sales data:", error);
        setSalesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [viewMode]);

  // Calculate summary statistics with safety checks
  const totalSales = salesData.reduce(
    (sum, item) => sum + (item?.sales || 0),
    0
  );
  const totalTransactions = salesData.reduce(
    (sum, item) => sum + (item?.transactions || 0),
    0
  );
  const avgTransactionValue =
    totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;

  // Get current period growth (comparing last two periods)
  const currentPeriodGrowth =
    salesData.length >= 2 &&
    salesData[salesData.length - 1] &&
    salesData[salesData.length - 2]
      ? Math.round(
          ((salesData[salesData.length - 1].sales -
            salesData[salesData.length - 2].sales) /
            salesData[salesData.length - 2].sales) *
            100
        )
      : 0;

  // Sample product data for stats
  const products = [
    { id: 1, name: "Daster Anaya Pink", stock: 15, price: 120000 },
    { id: 2, name: "Daster Busui Kuning", stock: 8, price: 135000 },
    { id: 3, name: "Gamis Putih", stock: 3, price: 185000 },
    { id: 4, name: "Dress Hitam", stock: 12, price: 150000 },
    { id: 5, name: "Kemeja Navy", stock: 4, price: 110000 },
    { id: 6, name: "Kaftan Coklat", stock: 7, price: 165000 },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>{" "}
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4 md:mb-6">
          <Card className="p-2 sm:p-3 md:p-4">
            <CardHeader className="flex flex-row items-center justify-between p-2 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Total Produk
              </CardTitle>
              <Package className="h-3 w-3 md:h-4 md:w-4 text-violet-500" />
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-lg md:text-2xl font-bold">
                {products.length}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                6 jenis produk
              </p>
            </CardContent>
          </Card>{" "}
          <Card className="p-2 sm:p-3 md:p-4">
            <CardHeader className="flex flex-row items-center justify-between p-2 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Stok
              </CardTitle>
              <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-violet-500" />
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-lg md:text-2xl font-bold">
                {products.reduce((total, product) => total + product.stock, 0)}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                Total produk
              </p>
            </CardContent>
          </Card>
          <Card className="p-2 sm:p-3 md:p-4">
            <CardHeader className="flex flex-row items-center justify-between p-2 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium truncate">
                Penjualan {viewMode === "daily" ? "Bulan" : "Tahun"}
              </CardTitle>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-violet-500" />
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-lg md:text-2xl font-bold">
                Rp {totalSales.toLocaleString("id-ID")}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {totalTransactions} transaksi
              </p>
            </CardContent>
          </Card>
          <Card className="p-2 sm:p-3 md:p-4">
            <CardHeader className="flex flex-row items-center justify-between p-2 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Rata-rata
              </CardTitle>
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-violet-500" />
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-lg md:text-2xl font-bold">
                Rp {avgTransactionValue.toLocaleString("id-ID")}
              </div>
              <p
                className={`text-[10px] md:text-xs ${
                  currentPeriodGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {currentPeriodGrowth >= 0 ? "+" : ""}
                {currentPeriodGrowth}% periode
              </p>
            </CardContent>
          </Card>
        </div>{" "}
        {/* Sales Chart */}
        <Card className="p-2 sm:p-3 md:p-4">
          <CardHeader className="p-2 sm:p-3 md:p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
              <div>
                <CardTitle className="flex items-center gap-1 md:gap-2 text-sm md:text-base">
                  <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                  Tren Penjualan
                </CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Performa {viewMode === "daily" ? "harian" : "bulanan"}
                </p>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant={viewMode === "daily" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("daily")}
                  className={`text-xs px-2 py-1 h-7 sm:h-8 ${
                    viewMode === "daily"
                      ? "bg-violet-500 hover:bg-violet-600"
                      : ""
                  }`}
                >
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Harian
                </Button>
                <Button
                  variant={viewMode === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("monthly")}
                  className={`text-xs px-2 py-1 h-7 sm:h-8 ${
                    viewMode === "monthly"
                      ? "bg-violet-500 hover:bg-violet-600"
                      : ""
                  }`}
                >
                  <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Bulanan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-4">
            {isLoading ? (
              <div className="h-[250px] sm:h-[300px] md:h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-violet-500 mx-auto mb-2"></div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Memuat data...
                  </p>
                </div>
              </div>
            ) : salesData.length === 0 ? (
              <div className="h-[250px] sm:h-[300px] md:h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Tidak ada data tersedia
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[250px] sm:h-[300px] md:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey={viewMode === "daily" ? "day" : "monthName"}
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <Tooltip
                      content={(props) => (
                        <CustomTooltip {...props} viewMode={viewMode} />
                      )}
                      cursor={{ stroke: "#8b5cf6", strokeWidth: 1 }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="line"
                    />{" "}
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{
                        r: 6,
                        stroke: "#8b5cf6",
                        strokeWidth: 2,
                        fill: "#fff",
                      }}
                      name="Penjualan (Rp)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>{" "}
        {/* Quick Stats Summary */}
        {salesData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 md:mt-6">
            <Card className="p-2 sm:p-3 md:p-4">
              <CardHeader className="p-2 pb-1 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Penjualan Tertinggi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-base md:text-xl font-bold text-green-600">
                  Rp{" "}
                  {Math.max(
                    ...salesData.map((d) => d.sales || 0)
                  ).toLocaleString("id-ID")}
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  {viewMode === "daily" ? "Hari terbaik" : "Bulan terbaik"}
                </p>
              </CardContent>
            </Card>

            <Card className="p-2 sm:p-3 md:p-4">
              <CardHeader className="p-2 pb-1 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Transaksi Terbanyak
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-base md:text-xl font-bold text-blue-600">
                  {Math.max(...salesData.map((d) => d.transactions || 0))}{" "}
                  transaksi
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  Volume tertinggi
                </p>
              </CardContent>
            </Card>

            <Card className="p-2 sm:p-3 md:p-4">
              <CardHeader className="p-2 pb-1 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Rata-rata
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-base md:text-xl font-bold text-purple-600">
                  Rp{" "}
                  {Math.round(totalSales / salesData.length).toLocaleString(
                    "id-ID"
                  )}
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  {viewMode === "daily" ? "Per hari" : "Per bulan"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
