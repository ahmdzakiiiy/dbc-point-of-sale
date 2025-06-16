"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Search,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  Download,
  ChevronUp,
  ChevronDown,
  History,
  Eye,
  Calendar,
  Tag,
  Loader2,
} from "lucide-react";
import DashboardNav from "@/components/dashboard-nav";
import ProductImagePlaceholder from "@/components/product-image-placeholder";

// Product data will be fetched from API
const initialProducts: Product[] = [];

type Product = {
  id: string;
  name: string;
  stock: number;
  price: number;
  image_url?: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type Discount = {
  type: "percentage" | "fixed";
  value: number;
  amount: number;
};

type Transaction = {
  id: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  discount?: Discount;
  total: number;
  cashReceived: number;
  change: number;
  cashier: string;
  status: "completed" | "refunded";
};

// Transaction history will be fetched from API
const initialTransactions: Transaction[] = [];

export default function CashierPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [transactionDetailModalOpen, setTransactionDetailModalOpen] =
    useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(
    null
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Discount states
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);

  // Enhanced discount input handling
  const formatDiscountValue = (amount: number | string) => {
    const numAmount =
      typeof amount === "string"
        ? Number.parseFloat(amount.replace(/\./g, "")) || 0
        : amount;
    return numAmount.toLocaleString("id-ID");
  };

  const handleDiscountValueChange = (value: string) => {
    if (discountType === "percentage") {
      // For percentage, allow decimal values but no formatting
      const numericValue = value.replace(/[^\d.]/g, "");
      if (numericValue === "" || Number.parseFloat(numericValue) <= 100) {
        setDiscountValue(numericValue);
      }
    } else {
      // For fixed amount, format with thousands separator
      const numericValue = value.replace(/[^\d]/g, "");
      if (numericValue === "") {
        setDiscountValue("");
        return;
      }
      const numberValue = Number.parseInt(numericValue);
      const maxValue = calculateSubtotal();
      if (numberValue <= maxValue) {
        setDiscountValue(formatDiscountValue(numberValue));
      }
    }
  };

  const getDiscountNumericValue = (formattedValue: string) => {
    if (discountType === "percentage") {
      return Number.parseFloat(formattedValue) || 0;
    }
    return Number.parseInt(formattedValue.replace(/\./g, "")) || 0;
  };

  const adjustDiscountValue = (increment: boolean) => {
    const currentValue = getDiscountNumericValue(discountValue);

    if (discountType === "percentage") {
      const step = 1; // Increment by 1%
      const newValue = increment
        ? Math.min(100, currentValue + step)
        : Math.max(0, currentValue - step);
      setDiscountValue(newValue.toString());
    } else {
      const step = 1000; // Increment by 1000 for fixed amount
      const maxValue = calculateSubtotal();
      const newValue = increment
        ? Math.min(maxValue, currentValue + step)
        : Math.max(0, currentValue - step);
      setDiscountValue(formatDiscountValue(newValue));
    }
  };

  const handleDiscountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent scrolling with arrow keys
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      adjustDiscountValue(e.key === "ArrowUp");
    }

    // Allow only numeric keys, decimal point (for percentage), backspace, delete, and arrow keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ];
    const isNumeric = /^[0-9]$/.test(e.key);
    const isDecimal =
      e.key === "." &&
      discountType === "percentage" &&
      !discountValue.includes(".");

    if (!isNumeric && !isDecimal && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  // Prevent wheel/scroll events on discount input
  const handleDiscountWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.currentTarget.blur(); // Remove focus to prevent any scroll behavior
  };
  // Fetch products and transaction history from API on component mount
  useEffect(() => {
    async function fetchInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch products
        const productsResponse = await fetch("/api/cashier/products");
        if (!productsResponse.ok) {
          throw new Error("Gagal mengambil data produk");
        }
        const productsData = await productsResponse.json();
        setProducts(productsData.products);

        // Fetch transaction history
        const historyResponse = await fetch("/api/cashier/history");
        if (!historyResponse.ok) {
          throw new Error("Gagal mengambil riwayat transaksi");
        }
        const historyData = await historyResponse.json();

        // Convert date strings to Date objects
        const formattedTransactions = historyData.transactions.map(
          (t: any) => ({
            ...t,
            date: new Date(t.date),
            // Ensure these fields are properly formatted as numbers
            subtotal: Number(t.subtotal),
            total: Number(t.total),
            cashReceived: Number(t.cashReceived || 0),
            change: Number(t.change || 0),
          })
        );

        setTransactions(formattedTransactions);
      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError(err.message || "Terjadi kesalahan saat memuat data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialData();
  }, []);
  // Search products from API when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      // If search term is empty, load all products
      const fetchAllProducts = async () => {
        setIsLoading(true);
        try {
          const response = await fetch("/api/cashier/products");
          if (!response.ok) {
            throw new Error("Gagal mengambil data produk");
          }
          const data = await response.json();
          setProducts(data.products);
        } catch (err: any) {
          console.error("Error searching products:", err);
          setError(err.message || "Terjadi kesalahan saat mencari produk");
        } finally {
          setIsLoading(false);
        }
      };

      fetchAllProducts();
      return;
    }

    // Debounce search requests
    const timer = setTimeout(() => {
      async function searchProducts() {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/cashier/products?search=${encodeURIComponent(searchTerm)}`
          );
          if (!response.ok) {
            throw new Error("Gagal mencari produk");
          }
          const data = await response.json();
          setProducts(data.products);
        } catch (err: any) {
          console.error("Error searching products:", err);
          setError(err.message || "Terjadi kesalahan saat mencari produk");
        } finally {
          setIsLoading(false);
        }
      }

      searchProducts();
    }, 500); // Wait 500ms after typing stops

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // No need for client-side filtering as API does the filtering
  const filteredProducts = products;

  // Filter transactions based on search term
  const filteredTransactions = transactions
    .filter(
      (transaction) =>
        transaction.id
          .toLowerCase()
          .includes(transactionSearchTerm.toLowerCase()) ||
        transaction.items.some((item) =>
          item.name.toLowerCase().includes(transactionSearchTerm.toLowerCase())
        ) ||
        transaction.cashier
          .toLowerCase()
          .includes(transactionSearchTerm.toLowerCase())
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date, newest first

  // Format number with thousands separator
  const formatCurrency = (amount: number | string) => {
    const numAmount =
      typeof amount === "string"
        ? Number.parseFloat(amount.replace(/\./g, "")) || 0
        : amount;
    return numAmount.toLocaleString("id-ID");
  };

  // Handle cash amount input with formatting
  const handleCashAmountChange = (value: string) => {
    // Remove all non-numeric characters except decimal points
    const numericValue = value.replace(/[^\d]/g, "");

    if (numericValue === "") {
      setCashAmount("");
      return;
    }

    // Convert to number and format with thousands separator
    const numberValue = Number.parseInt(numericValue);
    setCashAmount(formatCurrency(numberValue));
  };

  // Get numeric value from formatted string
  const getNumericValue = (formattedValue: string) => {
    return Number.parseInt(formattedValue.replace(/\./g, "")) || 0;
  };

  // Handle increment/decrement for cash amount
  const adjustCashAmount = (increment: boolean) => {
    const currentValue = getNumericValue(cashAmount);
    const step = 1000; // Increment by 1000
    const newValue = increment
      ? currentValue + step
      : Math.max(0, currentValue - step);
    setCashAmount(formatCurrency(newValue));
  };

  // Handle keyboard events for cash input
  const handleCashKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent scrolling with arrow keys
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      adjustCashAmount(e.key === "ArrowUp");
    }

    // Allow only numeric keys, backspace, delete, and arrow keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
    ];
    const isNumeric = /^[0-9]$/.test(e.key);

    if (!isNumeric && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const addToCart = (product: (typeof products)[0]) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.id !== id));
    } else {
      setCart(
        cart.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  const calculateDiscount = (): Discount => {
    if (!discountApplied || !discountValue)
      return { type: discountType, value: 0, amount: 0 };

    const subtotal = calculateSubtotal();
    const value = getDiscountNumericValue(discountValue);

    if (discountType === "percentage") {
      const amount = Math.round((subtotal * value) / 100);
      return { type: "percentage", value, amount };
    } else {
      const amount = Math.min(value, subtotal); // Don't allow discount greater than subtotal
      return { type: "fixed", value, amount };
    }
  };
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = discountApplied
      ? calculateDiscount()
      : { type: "fixed", value: 0, amount: 0 };
    return Math.max(0, subtotal - discount.amount);
  };

  const calculateItemSubtotal = (item: CartItem) => {
    return item.price * item.quantity;
  };
  // ID will be generated on the server

  const applyDiscount = () => {
    if (discountValue && getDiscountNumericValue(discountValue) > 0) {
      setDiscountApplied(true);
    }
  };

  const removeDiscount = () => {
    setDiscountApplied(false);
    setDiscountValue("");
  };

  const resetPaymentForm = () => {
    setCashAmount("");
    setDiscountType("percentage");
    setDiscountValue("");
    setDiscountApplied(false);
  };
  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const subtotal = calculateSubtotal();
      const discount = discountApplied ? calculateDiscount() : undefined;
      const total = calculateTotal();
      const cashAmountValue = getNumericValue(cashAmount);
      const change = cashAmountValue - total;
      const cashier = localStorage.getItem("username") || "Admin";

      // Send transaction data to API
      const response = await fetch("/api/cashier/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [...cart],
          subtotal,
          discount,
          total,
          cashReceived: cashAmountValue,
          change,
          cashier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memproses pembayaran");
      }

      const result = await response.json();

      // Use the transaction data returned from API
      setLastTransaction(result.transaction);

      // Update local transactions list with the new transaction
      setTransactions((prev) => [result.transaction, ...prev]);

      // Reset form
      setCart([]);
      setPaymentModalOpen(false);
      resetPaymentForm();

      // Show receipt
      setReceiptModalOpen(true);
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat memproses pembayaran");
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const viewTransactionDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionDetailModalOpen(true);
  };

  const reprintReceipt = (transaction: Transaction) => {
    setLastTransaction(transaction);
    setReceiptModalOpen(true);
  };
  const downloadReceipt = (transaction?: Transaction) => {
    const receiptTransaction = transaction || lastTransaction;
    if (!receiptTransaction) return;

    // Create PDF document in receipt/thermal printer format (narrower than A4)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200], // Width: 80mm (typical receipt width)
    });

    // Initial y position for content
    let y = 10;
    const margin = 5;
    const width = 70; // Content width

    // Set font
    doc.setFont("helvetica");
    doc.setFontSize(10);

    // Store original textAlign
    const textAlign = doc.getTextWidth("M");

    // Helper function to add text centered
    const addCenteredText = (text: string, y: number) => {
      doc.text(text, 40, y, { align: "center" });
      return y + 5;
    };

    // Add header
    y = addCenteredText("DASTER BORDIR CANTIK", y);

    // Set smaller font for address
    doc.setFontSize(7);
    y = addCenteredText(
      "Jl. Perintis Kemerdekaan, Permata Regency Blok B No. 8,",
      y
    );
    y = addCenteredText("Karsamenak, Kec. Tamansari, Kota. Tasikmalaya", y);
    y = addCenteredText("Telp: 0821-1931-5212", y);
    y += 3;

    // Add separator
    doc.line(margin, y, 80 - margin, y);
    y += 5;

    // Restore font size for title
    doc.setFontSize(9);
    y = addCenteredText("STRUK PEMBAYARAN", y);
    y += 2;

    // Add separator
    doc.line(margin, y, 80 - margin, y);
    y += 5;

    // Transaction details
    doc.setFontSize(8);
    doc.text(`ID Transaksi: ${receiptTransaction.id}`, margin, y);
    y += 4;
    doc.text(
      `Tanggal: ${receiptTransaction.date.toLocaleDateString("id-ID")}`,
      margin,
      y
    );
    y += 4;
    doc.text(
      `Waktu: ${receiptTransaction.date.toLocaleTimeString("id-ID")}`,
      margin,
      y
    );
    y += 4;
    doc.text(`Kasir: ${receiptTransaction.cashier}`, margin, y);
    y += 6;

    // Add separator for items
    doc.setFontSize(7);
    doc.text("DETAIL PEMBELIAN:", margin, y);
    y += 2;
    doc.line(margin, y, 80 - margin, y);
    y += 4;

    // Items
    receiptTransaction.items.forEach((item: CartItem) => {
      // Check if we need more space
      if (y > 180) {
        doc.addPage([80, 200]);
        y = 10;
      }

      doc.setFontSize(8);
      doc.text(item.name, margin, y);
      y += 4;

      doc.setFontSize(7);
      const qtyText = `${item.quantity} x Rp ${item.price.toLocaleString(
        "id-ID"
      )}`;
      doc.text(qtyText, margin + 2, y);

      const totalText = `Rp ${(item.price * item.quantity).toLocaleString(
        "id-ID"
      )}`;
      const totalWidth = doc.getTextWidth(totalText);
      doc.text(totalText, 80 - margin - totalWidth, y);

      y += 5;
    });

    // Add separator for summary
    y += 2;
    doc.line(margin, y, 80 - margin, y);
    y += 5;

    // Payment details
    doc.setFontSize(8);

    // Subtotal
    const subtotalText = `SUBTOTAL:`;
    doc.text(subtotalText, margin, y);
    const subtotalValueText = `Rp ${receiptTransaction.subtotal.toLocaleString(
      "id-ID"
    )}`;
    const subtotalValueWidth = doc.getTextWidth(subtotalValueText);
    doc.text(subtotalValueText, 80 - margin - subtotalValueWidth, y);
    y += 4;

    // Discount if applicable
    if (receiptTransaction.discount) {
      const discountLabel = `DISKON (${
        receiptTransaction.discount.type === "percentage"
          ? `${receiptTransaction.discount.value}%`
          : `Rp ${receiptTransaction.discount.value.toLocaleString("id-ID")}`
      }):`;
      doc.text(discountLabel, margin, y);

      const discountValueText = `-Rp ${receiptTransaction.discount.amount.toLocaleString(
        "id-ID"
      )}`;
      const discountValueWidth = doc.getTextWidth(discountValueText);
      doc.text(discountValueText, 80 - margin - discountValueWidth, y);
      y += 4;
    }

    // Total
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const totalText = `TOTAL:`;
    doc.text(totalText, margin, y);
    const totalValueText = `Rp ${receiptTransaction.total.toLocaleString(
      "id-ID"
    )}`;
    const totalValueWidth = doc.getTextWidth(totalValueText);
    doc.text(totalValueText, 80 - margin - totalValueWidth, y);
    y += 5;

    // Cash and change
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const cashText = `TUNAI:`;
    doc.text(cashText, margin, y);
    const cashValueText = `Rp ${receiptTransaction.cashReceived.toLocaleString(
      "id-ID"
    )}`;
    const cashValueWidth = doc.getTextWidth(cashValueText);
    doc.text(cashValueText, 80 - margin - cashValueWidth, y);
    y += 4;

    const changeText = `KEMBALI:`;
    doc.text(changeText, margin, y);
    const changeValueText = `Rp ${receiptTransaction.change.toLocaleString(
      "id-ID"
    )}`;
    const changeValueWidth = doc.getTextWidth(changeValueText);
    doc.text(changeValueText, 80 - margin - changeValueWidth, y);
    y += 4;

    // Add separator
    doc.line(margin, y, 80 - margin, y);
    y += 5;

    // Footer
    doc.setFontSize(7);
    y = addCenteredText("Terima kasih atas kunjungan Anda!", y);
    y = addCenteredText(
      "Barang yang sudah dibeli tidak dapat dikembalikan.",
      y
    );
    y += 2;

    // Add final separator
    doc.line(margin, y, 80 - margin, y);

    // Save the PDF
    doc.save(`struk-${receiptTransaction.id}.pdf`);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1 p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Kasir</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Produk & Transaksi
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Riwayat Transaksi
            </TabsTrigger>
          </TabsList>{" "}
          <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product List */}
              <div className="space-y-4 order-2 lg:order-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Cari produk..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Vertical 3-column grid layout */}{" "}
                <div className="grid grid-cols-3 gap-3">
                  {isLoading ? (
                    // Loading state - show 6 loading placeholders
                    Array.from({ length: 6 }).map((_, index) => (
                      <Card
                        key={index}
                        className="overflow-hidden flex flex-col h-full animate-pulse"
                      >
                        <CardHeader className="p-0">
                          <div className="aspect-square w-full bg-gray-200"></div>
                        </CardHeader>
                        <CardContent className="p-3 flex-1 flex flex-col">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                        </CardContent>
                        <CardFooter className="p-3 pt-0">
                          <div className="h-9 bg-gray-200 rounded w-full"></div>
                        </CardFooter>
                      </Card>
                    ))
                  ) : error ? (
                    // Error state
                    <div className="col-span-3 flex flex-col items-center justify-center p-8 text-center">
                      <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                      <h3 className="font-medium text-lg">
                        Gagal Memuat Produk
                      </h3>
                      <p className="text-muted-foreground mb-4">{error}</p>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                      >
                        Coba Lagi
                      </Button>
                    </div>
                  ) : (
                    // Products loaded successfully
                    filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="overflow-hidden flex flex-col h-full"
                      >
                        {/* Product Image */}
                        <CardHeader className="p-0">
                          <div className="aspect-square w-full overflow-hidden bg-gray-100">
                            <Image
                              src={
                                product.image_url ||
                                "/placeholder.svg?height=150&width=150"
                              }
                              alt={product.name}
                              width={150}
                              height={150}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        </CardHeader>

                        {/* Product Information */}
                        <CardContent className="p-3 flex-1 flex flex-col">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-medium leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                              {product.name}
                            </CardTitle>

                            {/* Stock Information with Visual Indicator */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  Stok:
                                </span>
                                <span
                                  className={`text-xs font-medium ${
                                    product.stock < 5
                                      ? "text-red-500"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {product.stock}
                                </span>{" "}
                              </div>
                            </div>

                            <p className="font-semibold text-sm text-violet-600 mb-3">
                              Rp {product.price.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </CardContent>

                        {/* Add Button */}
                        <CardFooter className="p-3 pt-0">
                          <Button
                            onClick={() => addToCart(product)}
                            className="w-full bg-violet-500 hover:bg-violet-600 text-sm py-2"
                            disabled={product.stock === 0}
                          >
                            {product.stock === 0 ? "Habis" : "Tambah"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}

                  {!isLoading && !error && filteredProducts.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-muted-foreground">
                      {searchTerm
                        ? "Tidak ada produk yang ditemukan"
                        : "Tidak ada produk tersedia"}
                    </div>
                  )}
                </div>
              </div>{" "}
              {/* Transaction Form */}
              <Card className="order-1 lg:order-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Transaksi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Belum ada produk ditambahkan
                    </div>
                  ) : (
                    <Table>
                      {" "}
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
                                >
                                  -
                                </Button>
                                <span>{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              Rp {item.price.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-right">
                              Rp{" "}
                              {calculateItemSubtotal(item).toLocaleString(
                                "id-ID"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>
                        Rp {calculateSubtotal().toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full bg-violet-500 hover:bg-violet-600"
                    disabled={cart.length === 0}
                  >
                    Bayar
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Riwayat Transaksi
                  </CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Cari transaksi..."
                      className="pl-8"
                      value={transactionSearchTerm}
                      onChange={(e) => setTransactionSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>{" "}
              <CardContent>
                {isLoading ? (
                  // Loading state
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Card
                        key={index}
                        className="animate-pulse border-l-4 border-l-gray-200"
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="h-8 bg-gray-200 rounded w-24"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : error ? (
                  // Error state
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="font-medium text-lg mb-2">
                      Gagal memuat riwayat transaksi
                    </h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                    >
                      Coba Lagi
                    </Button>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {transactionSearchTerm
                      ? "Tidak ada transaksi yang ditemukan"
                      : "Belum ada transaksi"}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTransactions.map((transaction) => (
                      <Card
                        key={transaction.id}
                        className="border-l-4 border-l-violet-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {transaction.id}
                                </h3>
                                <Badge
                                  variant={
                                    transaction.status === "completed"
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {transaction.status === "completed"
                                    ? "Selesai"
                                    : "Dikembalikan"}
                                </Badge>
                                {transaction.discount && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-800"
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    Diskon
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDateTime(transaction.date)}
                                </div>
                                <div>Kasir: {transaction.cashier}</div>
                                <div>{transaction.items.length} item(s)</div>
                              </div>
                              <div className="mt-2">
                                <span className="text-sm text-muted-foreground">
                                  Items:{" "}
                                </span>
                                <span className="text-sm">
                                  {transaction.items
                                    .map(
                                      (item) =>
                                        `${item.name} (${item.quantity}x)`
                                    )
                                    .join(", ")}
                                </span>
                              </div>
                              {transaction.discount && (
                                <div className="mt-1 text-sm text-green-600">
                                  Diskon{" "}
                                  {transaction.discount.type === "percentage"
                                    ? `${transaction.discount.value}%`
                                    : `Rp ${transaction.discount.value.toLocaleString(
                                        "id-ID"
                                      )}`}
                                  : -Rp{" "}
                                  {transaction.discount.amount.toLocaleString(
                                    "id-ID"
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-violet-600">
                                  Rp {transaction.total.toLocaleString("id-ID")}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Kembalian: Rp{" "}
                                  {transaction.change.toLocaleString("id-ID")}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    viewTransactionDetail(transaction)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Detail
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => reprintReceipt(transaction)}
                                >
                                  <Receipt className="h-4 w-4 mr-1" />
                                  Cetak
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Confirmation Modal */}
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              {" "}
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Konfirmasi Pembayaran
              </DialogTitle>
              <DialogDescription>
                Periksa dan konfirmasi detail pembayaran
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Transaction Details */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tanggal & Waktu:
                  </span>
                  <span className="font-medium">{currentDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kasir:</span>
                  <span className="font-medium">Admin</span>
                </div>
              </div>

              <Separator />

              {/* Product Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Detail Produk</h3>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} x Rp{" "}
                          {item.price.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="font-medium">
                        Rp {calculateItemSubtotal(item).toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Discount Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Diskon
                  </h3>
                  {discountApplied && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeDiscount}
                    >
                      Hapus Diskon
                    </Button>
                  )}
                </div>

                {!discountApplied ? (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-3">
                      <Label>Jenis Diskon</Label>
                      <RadioGroup
                        value={discountType}
                        onValueChange={(value: "percentage" | "fixed") => {
                          setDiscountType(value);
                          setDiscountValue(""); // Reset value when changing type
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="percentage" id="percentage" />
                          <Label htmlFor="percentage">Persentase (%)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="fixed" />
                          <Label htmlFor="fixed">Nominal Tetap (Rp)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount-value">
                        Nilai Diskon{" "}
                        {discountType === "percentage" ? "(%)" : "(Rp)"}
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          {discountType === "fixed" && (
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                              Rp
                            </div>
                          )}
                          <Input
                            id="discount-value"
                            type="text"
                            placeholder={
                              discountType === "percentage"
                                ? "Contoh: 10"
                                : "Contoh: 25.000"
                            }
                            value={discountValue}
                            onChange={(e) =>
                              handleDiscountValueChange(e.target.value)
                            }
                            onKeyDown={handleDiscountKeyDown}
                            onWheel={handleDiscountWheel}
                            className={`${
                              discountType === "fixed" ? "pl-10 pr-16" : "pr-16"
                            }`}
                            style={{
                              MozAppearance: "textfield",
                              WebkitAppearance: "none",
                            }}
                            min="0"
                            max={
                              discountType === "percentage"
                                ? "100"
                                : calculateSubtotal().toString()
                            }
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-6 p-0 hover:bg-gray-100"
                              onClick={() => adjustDiscountValue(true)}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-6 p-0 hover:bg-gray-100"
                              onClick={() => adjustDiscountValue(false)}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          {discountType === "percentage" && (
                            <div className="absolute right-16 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                              %
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={applyDiscount}
                          disabled={
                            !discountValue ||
                            getDiscountNumericValue(discountValue) <= 0
                          }
                        >
                          Terapkan
                        </Button>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {discountType === "percentage"
                            ? "Gunakan ↑↓ atau klik panah untuk +/-1%"
                            : "Gunakan ↑↓ atau klik panah untuk +/-Rp 1.000"}
                        </span>
                        <span>
                          {discountType === "percentage"
                            ? "Maksimal 100%"
                            : `Maksimal Rp ${calculateSubtotal().toLocaleString(
                                "id-ID"
                              )}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-800">
                          Diskon{" "}
                          {discountType === "percentage"
                            ? `${discountValue}%`
                            : `Rp ${discountValue}`}
                        </div>
                        <div className="text-sm text-green-600">
                          Hemat: Rp{" "}
                          {calculateDiscount().amount.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <Tag className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Payment Summary */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>
                    Subtotal (
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} item)
                  </span>
                  <span>Rp {calculateSubtotal().toLocaleString("id-ID")}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Diskon{" "}
                      {discountType === "percentage"
                        ? `(${discountValue}%)`
                        : `(Rp ${Number.parseFloat(
                            discountValue
                          ).toLocaleString("id-ID")})`}
                    </span>
                    <span>
                      -Rp {calculateDiscount().amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Pembayaran</span>
                  <span>Rp {calculateTotal().toLocaleString("id-ID")}</span>
                </div>
              </div>

              <Separator />

              {/* Enhanced Cash Payment Input */}
              <div className="space-y-4">
                <h3 className="font-semibold">Pembayaran Cash</h3>
                <div className="space-y-2">
                  <Label htmlFor="cash">Jumlah Uang Diterima</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      Rp
                    </div>
                    <Input
                      id="cash"
                      type="text"
                      placeholder="0"
                      value={cashAmount}
                      onChange={(e) => handleCashAmountChange(e.target.value)}
                      onKeyDown={handleCashKeyDown}
                      className="text-lg pl-10 pr-16"
                      style={{
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                      }}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-6 p-0 hover:bg-gray-100"
                        onClick={() => adjustCashAmount(true)}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-6 p-0 hover:bg-gray-100"
                        onClick={() => adjustCashAmount(false)}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gunakan tombol ↑↓ atau klik panah untuk menambah/mengurangi
                    Rp 1.000
                  </p>
                </div>

                {cashAmount &&
                  getNumericValue(cashAmount) >= calculateTotal() && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-700">
                          Kembalian:
                        </span>
                        <span className="text-xl font-bold text-green-800">
                          Rp{" "}
                          {(
                            getNumericValue(cashAmount) - calculateTotal()
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  )}

                {cashAmount &&
                  getNumericValue(cashAmount) < calculateTotal() && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-red-700 text-sm">
                        Uang yang diterima kurang dari total pembayaran
                      </div>
                    </div>
                  )}
              </div>
            </div>{" "}
            {error && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <div className="text-red-700">{error}</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={handlePayment}
                className="bg-violet-500 hover:bg-violet-600"
                disabled={
                  !cashAmount ||
                  getNumericValue(cashAmount) < calculateTotal() ||
                  isProcessing
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Konfirmasi Pembayaran"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transaction Detail Modal */}
        <Dialog
          open={transactionDetailModalOpen}
          onOpenChange={setTransactionDetailModalOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Detail Transaksi
              </DialogTitle>
              <DialogDescription>
                ID Transaksi:{" "}
                <span className="font-mono font-medium">
                  {selectedTransaction?.id}
                </span>
              </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-6">
                {/* Transaction Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Tanggal & Waktu:
                    </span>
                    <div className="font-medium">
                      {formatDateTime(selectedTransaction.date)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kasir:</span>
                    <div className="font-medium">
                      {selectedTransaction.cashier}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div>
                      <Badge
                        variant={
                          selectedTransaction.status === "completed"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {selectedTransaction.status === "completed"
                          ? "Selesai"
                          : "Dikembalikan"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Item:</span>
                    <div className="font-medium">
                      {selectedTransaction.items.length} item(s)
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Detail Produk</h3>
                  <Table>
                    {" "}
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransaction.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell>
                            Rp {item.price.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right">
                            Rp{" "}
                            {(item.price * item.quantity).toLocaleString(
                              "id-ID"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Payment Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      Rp {selectedTransaction.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                  {selectedTransaction.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Diskon{" "}
                        {selectedTransaction.discount.type === "percentage"
                          ? `(${selectedTransaction.discount.value}%)`
                          : `(Rp ${selectedTransaction.discount.value.toLocaleString(
                              "id-ID"
                            )})`}
                        :
                      </span>
                      <span>
                        -Rp{" "}
                        {selectedTransaction.discount.amount.toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total Pembayaran:</span>
                    <span className="font-bold">
                      Rp {selectedTransaction.total.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uang Diterima:</span>
                    <span>
                      Rp{" "}
                      {selectedTransaction.cashReceived.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembalian:</span>
                    <span>
                      Rp {selectedTransaction.change.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() =>
                  selectedTransaction && downloadReceipt(selectedTransaction)
                }
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Struk
              </Button>
              <Button
                onClick={() =>
                  selectedTransaction && reprintReceipt(selectedTransaction)
                }
                className="bg-violet-500 hover:bg-violet-600"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Cetak Ulang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt Modal */}
        <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                Struk Pembayaran
              </DialogTitle>
            </DialogHeader>

            {lastTransaction && (
              <div className="space-y-4 text-sm">
                <div className="text-center border-b pb-4">
                  <h2 className="font-bold text-lg">DASTER BORDIR CANTIK</h2>
                  <p>
                    Jl. Perintis Kemerdekaan, Permata Regency Blok B No. 8,
                    Karsamenak, Kec. Tamansari, Kota. Tasikmalaya, Jawa Barat
                    46182
                  </p>
                  <p>0821-1931-5212</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>ID Transaksi:</span>
                    <span className="font-mono">{lastTransaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>
                      {lastTransaction.date.toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span>
                      {lastTransaction.date.toLocaleTimeString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{lastTransaction.cashier}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {lastTransaction.items.map((item: CartItem) => (
                    <div key={item.id} className="space-y-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {item.quantity} x Rp{" "}
                          {item.price.toLocaleString("id-ID")}
                        </span>
                        <span>
                          Rp{" "}
                          {(item.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>
                      Rp {lastTransaction.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                  {lastTransaction.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        DISKON{" "}
                        {lastTransaction.discount.type === "percentage"
                          ? `(${lastTransaction.discount.value}%)`
                          : `(Rp ${lastTransaction.discount.value.toLocaleString(
                              "id-ID"
                            )})`}
                        :
                      </span>
                      <span>
                        -Rp{" "}
                        {lastTransaction.discount.amount.toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>TOTAL:</span>
                    <span>
                      Rp {lastTransaction.total.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TUNAI:</span>
                    <span>
                      Rp {lastTransaction.cashReceived.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>KEMBALI:</span>
                    <span>
                      Rp {lastTransaction.change.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground border-t pt-4">
                  <p>Terima kasih atas kunjungan Anda!</p>
                  <p>Barang yang sudah dibeli tidak dapat dikembalikan.</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => downloadReceipt()}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Struk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
