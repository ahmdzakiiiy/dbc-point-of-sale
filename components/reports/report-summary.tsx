import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, FormattedTransaction, formatMonth } from "./report-utils";

interface ReportSummaryProps {
  transactions: FormattedTransaction[];
  date: Date | undefined;
  totalAmount: number;
  totalDiscount: number;
  grossAmount: number;
}

export function ReportSummary({ 
  transactions, 
  date, 
  totalAmount, 
  totalDiscount, 
  grossAmount 
}: ReportSummaryProps) {
  return (
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
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {transactions.length}
            </div>
          </div>
          <div className="p-2 sm:p-3 md:p-4 border rounded-lg">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Penjualan Kotor
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              Rp {formatCurrency(grossAmount)}
            </div>
          </div>
          <div className="p-2 sm:p-3 md:p-4 border rounded-lg">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Total Diskon
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
              Rp {formatCurrency(totalDiscount)}
            </div>
          </div>
          <div className="p-2 sm:p-3 md:p-4 border rounded-lg">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Pendapatan Bersih
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
              Rp {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
