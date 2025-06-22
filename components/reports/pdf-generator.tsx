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
  // Create summary data in table format
  doc.setFontSize(12);
  
  // Column positions
  const leftCol = 70;    // Label column position (center of column)
  const rightCol = 140;  // Value column position (center of column)
  const rowHeight = 7;   // Height between rows
  
  // Table headers with center alignment
  doc.text("Informasi", leftCol, 65, { align: "center" });
  doc.text("Nilai", rightCol, 65, { align: "center" });
  
  // Draw a line below headers
  doc.line(20, 68, 190, 68);
  
  // Table data rows
  let rowY = 75;  // Starting Y position for data rows
  
  // Row 1: Total Transaksi
  doc.text("Total Transaksi", leftCol, rowY, { align: "center" });
  doc.text(`${transactions.length}`, rightCol, rowY, { align: "center" });
  rowY += rowHeight;
  
  // Row 2: Total Penjualan Kotor
  doc.text("Total Penjualan Kotor", leftCol, rowY, { align: "center" });
  doc.text(`Rp ${formatCurrency(grossAmount)}`, rightCol, rowY, { align: "center" });
  rowY += rowHeight;
  
  // Row 3: Total Diskon
  doc.text("Total Diskon", leftCol, rowY, { align: "center" });
  doc.text(`Rp ${formatCurrency(totalDiscount)}`, rightCol, rowY, { align: "center" });
  rowY += rowHeight;
  
  // Row 4: Total Pendapatan Bersih
  doc.text("Total Pendapatan Bersih", leftCol, rowY, { align: "center" });
  doc.text(`Rp ${formatCurrency(totalAmount)}`, rightCol, rowY, { align: "center" });
  rowY += rowHeight;
  
  // Row 5: Rata-rata per Transaksi
  const avgPerTransaction =
    transactions.length > 0
      ? Math.round(totalAmount / transactions.length)
      : 0;
  
  doc.text("Rata-rata per Transaksi", leftCol, rowY, { align: "center" });
  doc.text(`Rp ${formatCurrency(avgPerTransaction)}`, rightCol, rowY, { align: "center" });
  rowY += rowHeight;
  
  // Draw a line below the table
  doc.line(20, rowY, 190, rowY);
  // Add transaction details - with extra spacing
  doc.setFontSize(14);
  doc.text("DETAIL TRANSAKSI", 105, 115, { align: "center" }); // Increased Y position from 107 to 115
  doc.line(20, 118, 190, 118); // Increased Y position from 110 to 118
  doc.setFontSize(12);
  let yPos = 126; // Increased from 118 to 126 to match the new line position
  
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
