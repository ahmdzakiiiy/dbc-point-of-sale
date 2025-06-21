import { jsPDF } from "jspdf";
import { formatCurrency, formatDate, formatMonth, FormattedTransaction } from "./report-utils";

interface GeneratePDFProps {
  transactions: FormattedTransaction[];
  date: Date | undefined;
  totalAmount: number;
  totalDiscount: number;
  grossAmount: number;
}

export function generatePDFReport({
  transactions,
  date,
  totalAmount,
  totalDiscount,
  grossAmount,
}: GeneratePDFProps) {
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

  // Add header with center alignment
  doc.setFontSize(16);
  doc.text("LAPORAN TRANSAKSI BULANAN", 105, 15, { align: "center" });
  doc.text("DASTER BORDIR CANTIK", 105, 22, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Periode: ${monthYear}`, 105, 35, { align: "center" });
  doc.text(`Tanggal Cetak: ${formatDate(new Date())}`, 105, 42, { align: "center" });

  // Add separator
  doc.line(20, 45, 190, 45);

  // Add summary
  doc.setFontSize(14);
  doc.text(`RINGKASAN BULAN ${monthYear.toUpperCase()}`, 105, 55, {
    align: "center",
  });
  doc.line(20, 58, 190, 58);

  // Create two columns for summary data
  doc.setFontSize(12);
  
  // Left column labels
  doc.text("Total Transaksi:", 40, 65, { align: "right" });
  doc.text("Total Penjualan Kotor:", 40, 72, { align: "right" });
  doc.text("Total Diskon:", 40, 79, { align: "right" });
  doc.text("Total Pendapatan Bersih:", 40, 86, { align: "right" });
  doc.text("Rata-rata per Transaksi:", 40, 93, { align: "right" });
  
  // Right column values with center alignment
  doc.text(`${transactions.length}`, 45, 65, { align: "left" });
  doc.text(`Rp ${formatCurrency(grossAmount)}`, 45, 72, { align: "left" });
  doc.text(`Rp ${formatCurrency(totalDiscount)}`, 45, 79, { align: "left" });
  doc.text(`Rp ${formatCurrency(totalAmount)}`, 45, 86, { align: "left" });
  
  const avgPerTransaction =
    transactions.length > 0
      ? Math.round(totalAmount / transactions.length)
      : 0;
      
  doc.text(`Rp ${formatCurrency(avgPerTransaction)}`, 45, 93, { align: "left" });

  // Add transaction details
  doc.setFontSize(14);
  doc.text("DETAIL TRANSAKSI", 105, 107, { align: "center" });
  doc.line(20, 110, 190, 110);

  doc.setFontSize(12);
  let yPos = 118;
  
  if (transactions.length === 0) {
    doc.text("Tidak ada transaksi pada bulan yang dipilih", 105, yPos, { align: "center" });
  } else {
    // Header for transaction details table
    doc.text("No.", 25, yPos, { align: "center" });
    doc.text("ID Transaksi", 60, yPos, { align: "center" });
    doc.text("Tanggal", 105, yPos, { align: "center" });
    doc.text("Diskon", 150, yPos, { align: "center" });
    doc.text("Total", 180, yPos, { align: "center" });
    
    yPos += 7;
    doc.line(20, yPos, 190, yPos);
    yPos += 7;
    
    transactions.forEach((transaction, index) => {
      // Check if we need to add a new page
      if (yPos > 270) {
        doc.addPage();
        
        // Add header to new page
        yPos = 20;
        doc.text("No.", 25, yPos, { align: "center" });
        doc.text("ID Transaksi", 60, yPos, { align: "center" });
        doc.text("Tanggal", 105, yPos, { align: "center" });
        doc.text("Diskon", 150, yPos, { align: "center" });
        doc.text("Total", 180, yPos, { align: "center" });
        
        yPos += 7;
        doc.line(20, yPos, 190, yPos);
        yPos += 7;
      }

      // Row for each transaction
      doc.text(`${index + 1}`, 25, yPos, { align: "center" });
      doc.text(`${transaction.id.substring(0, 8)}...`, 60, yPos, { align: "center" });
      doc.text(`${formatDate(transaction.date)}`, 105, yPos, { align: "center" });
      
      if (transaction.discount > 0) {
        doc.text(`Rp ${formatCurrency(transaction.discount)}`, 150, yPos, { align: "center" });
      } else {
        doc.text("-", 150, yPos, { align: "center" });
      }
      
      doc.text(`Rp ${formatCurrency(transaction.total)}`, 180, yPos, { align: "center" });

      yPos += 7; // Move to next row
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
  doc.text("Nama Toko: Daster Bordir Cantik", 105, yPos, { align: "center" });
  yPos += 7;
  doc.text(
    "Alamat: Jl. Perintis Kemerdekaan, Permata Regency Blok B No. 8,",
    105,
    yPos,
    { align: "center" }
  );
  yPos += 7;
  doc.text(
    "Karsamenak, Kec. Tamansari, Kota. Tasikmalaya, Jawa Barat 46182",
    105,
    yPos,
    { align: "center" }
  );
  yPos += 7;
  doc.text("Telepon: 0821-1931-5212", 105, yPos, { align: "center" });
  yPos += 10;

  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Laporan ini dibuat secara otomatis oleh sistem POS`, 105, yPos, { align: "center" });
  yPos += 7;
  doc.text(
    `Daster Bordir Cantik pada ${formatDate(new Date())} ${new Date().toLocaleTimeString("id-ID")}`,
    105,
    yPos,
    { align: "center" }
  );
  yPos += 10;
  doc.text("© 2024 Daster Bordir Cantik. All rights reserved.", 105, yPos, {
    align: "center",
  });

  // Save the PDF with a proper filename
  doc.save(`laporan-${monthYear.toLowerCase().replace(" ", "-")}.pdf`);
  
  return doc;
}
