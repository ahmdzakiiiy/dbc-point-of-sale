import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { formatCurrency, formatDate, FormattedTransaction } from "./report-utils";

interface TransactionListProps {
  transactions: FormattedTransaction[];
  loading: boolean;
  error: string | null;
}

export function TransactionList({ 
  transactions, 
  loading, 
  error 
}: TransactionListProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="p-2 sm:p-4 md:p-6">
        <CardTitle className="text-sm sm:text-base md:text-lg">
          Daftar Transaksi
        </CardTitle>
      </CardHeader>
      <CardContent className="p-1 sm:p-2 md:p-4">
        {transactions.length === 0 && !loading && !error ? (
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
                <TableHead className="text-xs sm:text-sm text-center">
                  Tanggal
                </TableHead>
                <TableHead className="text-xs sm:text-sm text-right">
                  Diskon
                </TableHead>
                <TableHead className="text-xs sm:text-sm text-center">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
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
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-500"
                  >
                    Tidak ada transaksi pada bulan ini.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">
                      {transaction.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm py-2 sm:py-4 text-center">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-right py-2 sm:py-4">
                      {transaction.discount > 0 ? (
                        <span className="text-red-600">
                          Rp {formatCurrency(transaction.discount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-right py-2 sm:py-4">
                      Rp {formatCurrency(transaction.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
