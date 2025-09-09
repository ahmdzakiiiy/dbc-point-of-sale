// Tipe metode pembayaran yang didukung
export type PaymentMethod = 
  | 'cash' 
  | 'qris' 
  | 'dana' 
  | 'gopay' 
  | 'transfer';

// Detail metode pembayaran
export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string; // Nama ikon dari Lucide (atau dari file lokal)
  showCashFields: boolean; // Apakah menampilkan field untuk input jumlah uang cash dan kembalian
  showReferenceField: boolean; // Apakah memerlukan nomor referensi/id transaksi
}

// Informasi tentang metode pembayaran
export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'cash',
    name: 'Cash / Tunai',
    description: 'Pembayaran tunai langsung',
    icon: 'banknote',
    showCashFields: true,
    showReferenceField: false
  },
  {
    id: 'qris',
    name: 'QRIS',
    description: 'Pembayaran menggunakan scan QR code',
    icon: 'qr-code',
    showCashFields: false,
    showReferenceField: true
  },
  {
    id: 'dana',
    name: 'DANA',
    description: 'Pembayaran melalui aplikasi DANA',
    icon: 'wallet',
    showCashFields: false,
    showReferenceField: true
  },
  {
    id: 'gopay',
    name: 'GOPAY',
    description: 'Pembayaran melalui aplikasi GOPAY',
    icon: 'wallet',
    showCashFields: false,
    showReferenceField: true
  },
  {
    id: 'transfer',
    name: 'Transfer Bank',
    description: 'Pembayaran melalui transfer bank',
    icon: 'credit-card',
    showCashFields: false,
    showReferenceField: true
  }
];

// Fungsi untuk mendapatkan informasi metode pembayaran berdasarkan ID
export function getPaymentMethodInfo(id: PaymentMethod): PaymentMethodInfo {
  return PAYMENT_METHODS.find(method => method.id === id) || PAYMENT_METHODS[0];
}

// Fungsi untuk menampilkan label metode pembayaran
export function getPaymentMethodLabel(id: PaymentMethod): string {
  const methodInfo = getPaymentMethodInfo(id);
  return methodInfo.name;
}
