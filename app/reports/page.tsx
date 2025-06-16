"use client";

import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarIcon, FileText, Loader2 } from "lucide-react";
import DashboardNav from "@/components/dashboard-nav";
import { useAuth } from "@/context/auth-context";
import type { Transaction } from "@/lib/supabase";

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

  // Format transaction data for consistent display
  const formattedTransactions = transactions.map((transaction) => ({
    ...transaction,
    date: new Date(transaction.transaction_date),
    total: Number(transaction.total_amount),
    discount: Number(transaction.discount_amount),
  }));

  // Calculate totals for the selected month
  const totalAmount = formattedTransactions.reduce(
    (sum, transaction) => sum + transaction.total,
    0
  );
  const totalDiscount = formattedTransactions.reduce(
    (sum, transaction) => sum + transaction.discount,
    0
  );
  const grossAmount = totalAmount + totalDiscount;

  // Format date function (replacing date-fns)
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
    });
  };
  const generatePDFReport = () => {
    if (!date) return;

    const monthYear = formatMonth(date);

    // Create PDF document with A4 size
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set font
    doc.setFont("helvetica");

    // Add header
    doc.setFontSize(16);
    doc.text("LAPORAN TRANSAKSI BULANAN", 105, 15, { align: "center" });
    doc.text("DASTER BORDIR CANTIK", 105, 22, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Periode: ${monthYear}`, 20, 35);
    doc.text(`Tanggal Cetak: ${formatDate(new Date())}`, 20, 42);

    // Add separator
    doc.line(20, 45, 190, 45);

    // Add summary
    doc.setFontSize(14);
    doc.text(`RINGKASAN BULAN ${monthYear.toUpperCase()}`, 105, 55, {
      align: "center",
    });
    doc.line(20, 58, 190, 58);

    doc.setFontSize(12);
    doc.text(`Total Transaksi: ${formattedTransactions.length}`, 20, 65);
    doc.text(
      `Total Penjualan Kotor: Rp ${grossAmount.toLocaleString("id-ID")}`,
      20,
      72
    );
    doc.text(
      `Total Diskon: Rp ${totalDiscount.toLocaleString("id-ID")}`,
      20,
      79
    );
    doc.text(
      `Total Pendapatan Bersih: Rp ${totalAmount.toLocaleString("id-ID")}`,
      20,
      86
    );
    const avgPerTransaction =
      formattedTransactions.length > 0
        ? Math.round(totalAmount / formattedTransactions.length).toLocaleString(
            "id-ID"
          )
        : 0;
    doc.text(`Rata-rata per Transaksi: Rp ${avgPerTransaction}`, 20, 93);

    // Add transaction details
    doc.setFontSize(14);
    doc.text("DETAIL TRANSAKSI", 105, 107, { align: "center" });
    doc.line(20, 110, 190, 110);

    doc.setFontSize(12);
    let yPos = 118;
    if (formattedTransactions.length === 0) {
      doc.text("Tidak ada transaksi pada bulan yang dipilih", 20, yPos);
    } else {
      formattedTransactions.forEach((transaction, index) => {
        // Check if we need to add a new page
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(`${index + 1}. ${transaction.id}`, 20, yPos);
        yPos += 7;
        doc.text(`   Tanggal: ${formatDate(transaction.date)}`, 20, yPos);
        yPos += 7;
        doc.text(
          `   Total: Rp ${transaction.total.toLocaleString("id-ID")}`,
          20,
          yPos
        );

        if (transaction.discount > 0) {
          yPos += 7;
          doc.text(
            `   Diskon: Rp ${transaction.discount.toLocaleString("id-ID")}`,
            20,
            yPos
          );
        }

        yPos += 10; // Add space between transactions
      });
    }

    // Add footer on the last page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.text("INFORMASI TOKO", 105, yPos, { align: "center" });
    yPos += 3;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text("Nama Toko: Daster Bordir Cantik", 20, yPos);
    yPos += 7;
    doc.text(
      "Alamat: Jl. Perintis Kemerdekaan, Permata Regency Blok B No. 8,",
      20,
      yPos
    );
    yPos += 7;
    doc.text(
      "Karsamenak, Kec. Tamansari, Kota. Tasikmalaya, Jawa Barat 46182",
      20,
      yPos
    );
    yPos += 7;
    doc.text("Telepon: 0821-1931-5212", 20, yPos);
    yPos += 10;

    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Laporan ini dibuat secara otomatis oleh sistem POS`, 20, yPos);
    yPos += 7;
    doc.text(
      `Daster Bordir Cantik pada ${formatDate(
        new Date()
      )} ${new Date().toLocaleTimeString("id-ID")}`,
      20,
      yPos
    );
    yPos += 10;
    doc.text("© 2024 Daster Bordir Cantik. All rights reserved.", 105, yPos, {
      align: "center",
    });

    // Save the PDF with a proper filename
    doc.save(`laporan-${monthYear.toLowerCase().replace(" ", "-")}.pdf`);
  };

  const openPdfPreview = () => {
    setPdfPreviewOpen(true);
  };

  const confirmDownload = () => {
    generatePDFReport();
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
            </Popover>

            <div className="flex gap-2 w-full md:w-auto">
              <Button
                onClick={openPdfPreview}
                className="bg-violet-500 hover:bg-violet-600 text-xs sm:text-sm h-8 sm:h-10 w-full md:w-auto"
              >
                <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Cetak
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-3 sm:mb-4 md:mb-6 shadow-sm">
          <CardHeader className="p-2 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">
              Ringkasan Bulan {date ? formatMonth(date) : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <div className="p-2 sm:p-3 md:p-4 border rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Total Transaksi
                </div>{" "}
                <div className="text-lg sm:text-xl md:text-2xl font-bold">
                  {formattedTransactions.length}
                </div>
              </div>
              <div className="p-2 sm:p-3 md:p-4 border rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Penjualan Kotor
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold">
                  Rp {grossAmount.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="p-2 sm:p-3 md:p-4 border rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Total Diskon
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
                  Rp {totalDiscount.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="p-2 sm:p-3 md:p-4 border rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Pendapatan Bersih
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-2 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">
              Daftar Transaksi
            </CardTitle>
          </CardHeader>{" "}
          <CardContent className="p-1 sm:p-2 md:p-4">
            {formattedTransactions.length === 0 ? (
              <div className="text-center py-4 sm:py-6 md:py-8 text-xs sm:text-sm text-muted-foreground">
                Tidak ada transaksi pada bulan yang dipilih
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">
                      ID Transaksi
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm">
                      Tanggal
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm text-right">
                      Diskon
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm text-right">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      {" "}
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin inline-block mr-2 text-violet-500" />
                        Memuat transaksi...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-red-500"
                      >
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : formattedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-gray-500"
                      >
                        Tidak ada transaksi pada bulan ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    formattedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">
                          {transaction.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm py-2 sm:py-4">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-right py-2 sm:py-4">
                          {transaction.discount > 0 ? (
                            <span className="text-red-600">
                              Rp {transaction.discount.toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-right py-2 sm:py-4">
                          Rp {transaction.total.toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* PDF Preview Modal */}
        <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
          <DialogContent className="max-w-[95%] md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-2 sm:p-4">
              <DialogTitle className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                <FileText className="h-3 w-3 sm:h-5 sm:w-5" />
                Preview Laporan PDF
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Preview laporan sebelum mengunduh atau mencetak
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-6">
              {/* PDF Preview Content */}
              <div className="bg-white border rounded-lg p-3 sm:p-6 md:p-8 shadow-sm">
                {/* Header */}
                <div className="text-center border-b pb-3 sm:pb-6 mb-3 sm:mb-6">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
                    LAPORAN TRANSAKSI BULANAN
                  </h1>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-violet-600 mb-2 sm:mb-4">
                    DASTER BORDIR CANTIK
                  </h2>
                  <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <p>Periode: {date ? formatMonth(date) : ""}</p>
                    <p>Tanggal Cetak: {formatDate(new Date())}</p>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="mb-4 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-center">
                    RINGKASAN BULAN{" "}
                    {date ? formatMonth(date).toUpperCase() : ""}
                  </h3>
                  <div className="border rounded-lg p-2 sm:p-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span>Total Transaksi:</span>
                        <span className="font-medium">
                          {formattedTransactions.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rata-rata per Transaksi:</span>
                        <span className="font-medium">
                          Rp{" "}
                          {formattedTransactions.length > 0
                            ? Math.round(
                                totalAmount / formattedTransactions.length
                              ).toLocaleString("id-ID")
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Penjualan Kotor:</span>
                        <span className="font-medium">
                          Rp {grossAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Diskon:</span>
                        <span className="font-medium text-red-600">
                          Rp {totalDiscount.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between col-span-2 pt-2 border-t">
                        <span className="font-semibold">
                          Total Pendapatan Bersih:
                        </span>
                        <span className="font-bold text-green-600">
                          Rp {totalAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="mb-4 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-center">
                    DETAIL TRANSAKSI
                  </h3>
                  {formattedTransactions.length === 0 ? (
                    <div className="text-center py-4 sm:py-8 text-xs sm:text-sm text-muted-foreground border rounded-lg">
                      Tidak ada transaksi pada bulan yang dipilih
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-xs sm:text-sm p-1 sm:p-3 md:p-4">
                              No.
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm p-1 sm:p-3 md:p-4">
                              ID Transaksi
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm p-1 sm:p-3 md:p-4">
                              Tanggal
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm p-1 sm:p-3 md:p-4 text-right">
                              Diskon
                            </TableHead>
                            <TableHead className="font-semibold text-xs sm:text-sm p-1 sm:p-3 md:p-4 text-right">
                              Total
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formattedTransactions.map((transaction, index) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium text-xs sm:text-sm p-1 sm:p-3 md:p-4">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-mono text-xs sm:text-sm p-1 sm:p-3 md:p-4">
                                {transaction.id}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm p-1 sm:p-3 md:p-4">
                                {formatDate(transaction.date)}
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm p-1 sm:p-3 md:p-4">
                                {transaction.discount > 0 ? (
                                  <span className="text-red-600">
                                    Rp{" "}
                                    {transaction.discount.toLocaleString(
                                      "id-ID"
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium text-xs sm:text-sm p-1 sm:p-3 md:p-4">
                                Rp {transaction.total.toLocaleString("id-ID")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Store Information */}
                <div className="border-t pt-3 sm:pt-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-center">
                    INFORMASI TOKO
                  </h3>
                  <div className="text-center text-xs sm:text-sm space-y-1">
                    <p className="font-semibold">Daster Bordir Cantik</p>
                    <p>
                      Jl. Perintis Kemerdekaan, Permata Regency Blok B No. 8,
                      Karsamenak, Kec. Tamansari, Kota. Tasikmalaya, Jawa Barat
                      46182
                    </p>
                    <p>Telepon: 0821-1931-5212</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-2 sm:pt-4 mt-3 sm:mt-6">
                  <div className="text-[10px] sm:text-xs text-muted-foreground text-center space-y-1">
                    <p>
                      Laporan ini dibuat secara otomatis oleh sistem POS Daster
                      Bordir Cantik pada {formatDate(new Date())}{" "}
                      {new Date().toLocaleTimeString("id-ID")}
                    </p>
                    <p>© 2024 Daster Bordir Cantik. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={confirmDownload}
                className="bg-violet-500 hover:bg-violet-600 text-xs sm:text-sm h-8 sm:h-10"
              >
                <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Cetak
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
