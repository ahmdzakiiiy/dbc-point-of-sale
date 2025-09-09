-- SQL untuk menambahkan kolom metode pembayaran dan informasi terkait ke tabel transaksi

-- Tambahkan kolom payment_method
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';

-- Tambahkan kolom cash_received dan cash_change (untuk pembayaran tunai)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS cash_received DECIMAL(12, 2) NULL;

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS cash_change DECIMAL(12, 2) NULL;

-- Tambahkan kolom reference_id (untuk pembayaran non-tunai)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS reference_id TEXT NULL;

-- Tambahkan komentar ke kolom
COMMENT ON COLUMN public.transactions.payment_method IS 'Metode pembayaran: cash, qris, dana, gopay, transfer';
COMMENT ON COLUMN public.transactions.cash_received IS 'Jumlah uang tunai yang diterima (hanya untuk metode cash)';
COMMENT ON COLUMN public.transactions.cash_change IS 'Jumlah kembalian (hanya untuk metode cash)';
COMMENT ON COLUMN public.transactions.reference_id IS 'ID referensi atau nomor transaksi untuk pembayaran non-tunai';
