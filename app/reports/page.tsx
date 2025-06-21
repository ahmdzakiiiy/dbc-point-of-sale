"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, FileText } from "lucide-react";
import DashboardNav from "@/components/dashboard-nav";
import { useAuth } from "@/context/auth-context";
import type { Transaction } from "@/lib/supabase";
import {
  ReportSummary,
  TransactionList,
  PDFPreview,
  generatePDFReport,
  formatTransactions,
  calculateTotals,
  formatMonth,
  FormattedTransaction,
} from "@/components/reports";

export default function ReportsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch transactions from the API
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!date) return;

      try {
        setLoading(true);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed

        const response = await fetch(
          `/api/transactions?year=${year}&month=${month}`
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil data transaksi");
        }

        const data = await response.json();
        setTransactions(data.transactions || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Gagal memuat transaksi. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [date]);

  // Format and calculate totals
  const formattedTransactions: FormattedTransaction[] = formatTransactions(transactions);
  const { totalAmount, totalDiscount, grossAmount } = calculateTotals(formattedTransactions);

  const openPdfPreview = () => {
    setPdfPreviewOpen(true);
  };

  const confirmDownload = () => {
    generatePDFReport({
      transactions: formattedTransactions,
      date,
      totalAmount,
      totalDiscount,
      grossAmount,
    });
    setPdfPreviewOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 sm:mb-4 md:mb-6 gap-2 sm:gap-3 md:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">Laporan Transaksi</h1>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 sm:gap-3 md:gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-[240px] justify-start text-left font-normal text-xs sm:text-sm h-8 sm:h-10"
                >
                  <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {date ? formatMonth(date) : <span>Pilih bulan</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>            <div className="flex gap-2 w-full md:w-auto">
              <Button
                onClick={openPdfPreview}
                className="text-xs sm:text-sm h-8 sm:h-10 w-full md:w-auto"
              >
                <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Cetak
              </Button>
            </div>
          </div>
        </div>

        {/* Report Summary Component */}
        <ReportSummary 
          transactions={formattedTransactions}
          date={date}
          totalAmount={totalAmount}
          totalDiscount={totalDiscount}
          grossAmount={grossAmount}
        />

        {/* Transaction List Component */}
        <TransactionList 
          transactions={formattedTransactions}
          loading={loading}
          error={error}
        />

        {/* PDF Preview Component */}
        <PDFPreview
          open={pdfPreviewOpen}
          onOpenChange={setPdfPreviewOpen}
          transactions={formattedTransactions}
          date={date}
          totalAmount={totalAmount}
          totalDiscount={totalDiscount}
          grossAmount={grossAmount}
          onConfirmDownload={confirmDownload}
        />
      </main>
    </div>
  );
}
