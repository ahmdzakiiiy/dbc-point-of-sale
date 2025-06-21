import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatMonth, FormattedTransaction } from "./report-utils";

interface PDFPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: FormattedTransaction[];
  date: Date | undefined;
  totalAmount: number;
  totalDiscount: number;
  grossAmount: number;
  onConfirmDownload: () => void;
}

export function PDFPreview({
  open,
  onOpenChange,
  transactions,
  date,
  totalAmount,
  totalDiscount,
  grossAmount,
  onConfirmDownload,
}: PDFPreviewProps) {
  if (!date) return null;
  
  // Calculate average
  const averagePerTransaction =
    transactions.length > 0
      ? Math.round(totalAmount / transactions.length)
      : 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                <p>Periode: {formatMonth(date)}</p>
                <p>Tanggal Cetak: {formatDate(new Date())}</p>
              </div>
            </div>

            {/* Summary Section */}
            <div className="mb-4 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-center">
                RINGKASAN BULAN {formatMonth(date).toUpperCase()}
              </h3>
              <div className="border rounded-lg p-2 sm:p-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Total Transaksi:</span>
                    <span className="font-medium">
                      {transactions.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rata-rata per Transaksi:</span>
                    <span className="font-medium">
                      Rp {formatCurrency(averagePerTransaction)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Penjualan Kotor:</span>
                    <span className="font-medium">
                      Rp {formatCurrency(grossAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Diskon:</span>
                    <span className="font-medium text-red-600">
                      Rp {formatCurrency(totalDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span>Total Pendapatan Bersih:</span>
                    <span className="font-medium text-green-600">
                      Rp {formatCurrency(totalAmount)}
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
              <div className="border rounded-lg p-2 sm:p-4 overflow-x-auto">
                {transactions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-xs sm:text-sm">
                    Tidak ada transaksi pada bulan yang dipilih
                  </div>
                ) : (
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-1 sm:p-2 text-center">No.</th>
                        <th className="p-1 sm:p-2 text-center">ID Transaksi</th>
                        <th className="p-1 sm:p-2 text-center">Tanggal</th>
                        <th className="p-1 sm:p-2 text-center">Diskon</th>
                        <th className="p-1 sm:p-2 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 10).map((transaction, index) => (
                        <tr key={transaction.id} className="border-b">
                          <td className="p-1 sm:p-2 text-center">{index + 1}</td>
                          <td className="p-1 sm:p-2 text-center">
                            {transaction.id.substring(0, 8)}...
                          </td>
                          <td className="p-1 sm:p-2 text-center">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="p-1 sm:p-2 text-center">
                            {transaction.discount > 0 ? (
                              <span className="text-red-600">
                                Rp {formatCurrency(transaction.discount)}
                              </span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td className="p-1 sm:p-2 text-center">
                            Rp {formatCurrency(transaction.total)}
                          </td>
                        </tr>
                      ))}
                      {transactions.length > 10 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-1 sm:p-2 text-center text-muted-foreground"
                          >
                            ... dan {transactions.length - 10} transaksi lainnya
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Store Information */}
            <div className="border-t pt-3 sm:pt-6 text-center">
              <h3 className="text-base font-semibold mb-2 sm:mb-4">
                INFORMASI TOKO
              </h3>
              <div className="text-xs sm:text-sm space-y-1">
                <p>Daster Bordir Cantik</p>
                <p>Jl. Perintis Kemerdekaan, Permata Regency Blok B No. 8</p>
                <p>Karsamenak, Kec. Tamansari, Kota. Tasikmalaya, Jawa Barat 46182</p>
                <p>Telepon: 0821-1931-5212</p>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <p>
                  Laporan ini dibuat secara otomatis oleh sistem POS Daster Bordir Cantik
                </p>
                <p>
                  {formatDate(new Date())} {new Date().toLocaleTimeString("id-ID")}
                </p>
                <p className="mt-2">© 2024 Daster Bordir Cantik. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2 mt-3">
          <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            Unduh untuk melihat versi lengkap dengan semua transaksi
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Tutup
            </Button>
            <Button
              onClick={onConfirmDownload}
              variant="default"
              size="sm"
              className="text-xs sm:text-sm"
            >
              Unduh PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
