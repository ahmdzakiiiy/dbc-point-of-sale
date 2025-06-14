"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarIcon, FileText } from "lucide-react"
import DashboardNav from "@/components/dashboard-nav"

// Sample transaction data
const transactions = [
  { id: "TRX-001", date: new Date(2024, 3, 5), total: 255000, discount: 0 },
  { id: "TRX-002", date: new Date(2024, 3, 7), total: 120000, discount: 0 },
  { id: "TRX-003", date: new Date(2024, 3, 10), total: 185000, discount: 15000 },
  { id: "TRX-004", date: new Date(2024, 3, 12), total: 300000, discount: 30000 },
  { id: "TRX-005", date: new Date(2024, 3, 15), total: 135000, discount: 0 },
  { id: "TRX-006", date: new Date(2024, 3, 18), total: 275000, discount: 25000 },
  { id: "TRX-007", date: new Date(2024, 3, 20), total: 165000, discount: 0 },
  { id: "TRX-008", date: new Date(2024, 3, 22), total: 220000, discount: 20000 },
  { id: "TRX-009", date: new Date(2024, 3, 25), total: 195000, discount: 0 },
  { id: "TRX-010", date: new Date(2024, 3, 28), total: 310000, discount: 31000 },
]

export default function ReportsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)

  // Filter transactions for the selected month
  const filteredTransactions = transactions.filter(
    (transaction) =>
      date && transaction.date.getMonth() === date.getMonth() && transaction.date.getFullYear() === date.getFullYear(),
  )

  // Calculate totals for the selected month
  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.total, 0)
  const totalDiscount = filteredTransactions.reduce((sum, transaction) => sum + transaction.discount, 0)
  const grossAmount = totalAmount + totalDiscount

  // Format date function (replacing date-fns)
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
    })
  }

  const generatePDFReport = () => {
    if (!date) return

    const monthYear = formatMonth(date)
    const reportContent = `
LAPORAN TRANSAKSI BULANAN
DASTER BORDIR CANTIK

Periode: ${monthYear}
Tanggal Cetak: ${formatDate(new Date())}

===========================================

RINGKASAN BULAN ${monthYear.toUpperCase()}
===========================================

Total Transaksi: ${filteredTransactions.length}
Total Penjualan Kotor: Rp ${grossAmount.toLocaleString("id-ID")}
Total Diskon: Rp ${totalDiscount.toLocaleString("id-ID")}
Total Pendapatan Bersih: Rp ${totalAmount.toLocaleString("id-ID")}
Rata-rata per Transaksi: Rp ${filteredTransactions.length > 0 ? Math.round(totalAmount / filteredTransactions.length).toLocaleString("id-ID") : 0}

===========================================

DETAIL TRANSAKSI
===========================================

${
  filteredTransactions.length === 0
    ? "Tidak ada transaksi pada bulan yang dipilih"
    : filteredTransactions
        .map(
          (transaction, index) =>
            `${index + 1}. ${transaction.id}
   Tanggal: ${formatDate(transaction.date)}
   Total: Rp ${transaction.total.toLocaleString("id-ID")}${
     transaction.discount > 0 ? `\n   Diskon: Rp ${transaction.discount.toLocaleString("id-ID")}` : ""
   }
   `,
        )
        .join("\n")
}

===========================================

INFORMASI TOKO
===========================================

Nama Toko: Daster Bordir Cantik
Alamat: Jl. Perintis Kemerdekaan, Permata Regency Blok B No. 8, Karsamenak, Kec. Kawalu, Kab. Tasikmalaya, Jawa Barat 46182
Telepon: 0821-1931-5212

===========================================

Laporan ini dibuat secara otomatis oleh sistem POS
Daster Bordir Cantik pada ${formatDate(new Date())} ${new Date().toLocaleTimeString("id-ID")}

© 2024 Daster Bordir Cantik. All rights reserved.
    `

    // Create and download the report as a text file (simulating PDF)
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `laporan-${monthYear.toLowerCase().replace(" ", "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const openPdfPreview = () => {
    setPdfPreviewOpen(true)
  }

  const confirmDownload = () => {
    generatePDFReport()
    setPdfPreviewOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Laporan Transaksi</h1>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? formatMonth(date) : <span>Pilih bulan</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              <Button onClick={openPdfPreview} className="bg-violet-500 hover:bg-violet-600">
                <FileText className="mr-2 h-4 w-4" />
                Cetak
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ringkasan Bulan {date ? formatMonth(date) : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Total Transaksi</div>
                <div className="text-2xl font-bold">{filteredTransactions.length}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Penjualan Kotor</div>
                <div className="text-2xl font-bold">Rp {grossAmount.toLocaleString("id-ID")}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Total Diskon</div>
                <div className="text-2xl font-bold text-red-600">Rp {totalDiscount.toLocaleString("id-ID")}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Pendapatan Bersih</div>
                <div className="text-2xl font-bold text-green-600">Rp {totalAmount.toLocaleString("id-ID")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Tidak ada transaksi pada bulan yang dipilih</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Diskon</TableHead>
                    <TableHead className="text-right">Total Pembayaran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell className="text-right">
                        {transaction.discount > 0 ? (
                          <span className="text-red-600">Rp {transaction.discount.toLocaleString("id-ID")}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">Rp {transaction.total.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* PDF Preview Modal */}
        <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview Laporan PDF
              </DialogTitle>
              <DialogDescription>Preview laporan sebelum mengunduh atau mencetak</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* PDF Preview Content */}
              <div className="bg-white border rounded-lg p-8 shadow-sm">
                {/* Header */}
                <div className="text-center border-b pb-6 mb-6">
                  <h1 className="text-2xl font-bold mb-2">LAPORAN TRANSAKSI BULANAN</h1>
                  <h2 className="text-xl font-semibold text-violet-600 mb-4">DASTER BORDIR CANTIK</h2>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Periode: {date ? formatMonth(date) : ""}</p>
                    <p>Tanggal Cetak: {formatDate(new Date())}</p>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-center">
                    RINGKASAN BULAN {date ? formatMonth(date).toUpperCase() : ""}
                  </h3>
                  <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Total Transaksi:</span>
                        <span className="font-medium">{filteredTransactions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rata-rata per Transaksi:</span>
                        <span className="font-medium">
                          Rp{" "}
                          {filteredTransactions.length > 0
                            ? Math.round(totalAmount / filteredTransactions.length).toLocaleString("id-ID")
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Penjualan Kotor:</span>
                        <span className="font-medium">Rp {grossAmount.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Diskon:</span>
                        <span className="font-medium text-red-600">Rp {totalDiscount.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between col-span-2 pt-2 border-t">
                        <span className="font-semibold">Total Pendapatan Bersih:</span>
                        <span className="font-bold text-green-600">Rp {totalAmount.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-center">DETAIL TRANSAKSI</h3>
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      Tidak ada transaksi pada bulan yang dipilih
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">No.</TableHead>
                            <TableHead className="font-semibold">ID Transaksi</TableHead>
                            <TableHead className="font-semibold">Tanggal</TableHead>
                            <TableHead className="font-semibold text-right">Diskon</TableHead>
                            <TableHead className="font-semibold text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((transaction, index) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell className="font-mono">{transaction.id}</TableCell>
                              <TableCell>{formatDate(transaction.date)}</TableCell>
                              <TableCell className="text-right">
                                {transaction.discount > 0 ? (
                                  <span className="text-red-600">
                                    Rp {transaction.discount.toLocaleString("id-ID")}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
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
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-center">INFORMASI TOKO</h3>
                  <div className="text-center text-sm space-y-1">
                    <p className="font-semibold">Daster Bordir Cantik</p>
                    <p>
                      Jl. Perintis Kemerdekaan, Permata Regency Blok B No. 8, Karsamenak, Kec. Kawalu, Kab. Tasikmalaya,
                      Jawa Barat 46182
                    </p>
                    <p>Telepon: 0821-1931-5212</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-4 mt-6">
                  <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p>
                      Laporan ini dibuat secara otomatis oleh sistem POS Daster Bordir Cantik pada{" "}
                      {formatDate(new Date())} {new Date().toLocaleTimeString("id-ID")}
                    </p>
                    <p>© 2024 Daster Bordir Cantik. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={confirmDownload} className="bg-violet-500 hover:bg-violet-600">
                <FileText className="mr-2 h-4 w-4" />
                Cetak
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
