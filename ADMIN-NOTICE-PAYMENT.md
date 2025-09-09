# ADMIN NOTICE: Database Update Required for Payment Methods

## Overview

Fitur baru telah ditambahkan ke sistem untuk mendukung beberapa metode pembayaran:

- Cash / Tunai
- QRIS
- DANA
- GOPAY
- Transfer Bank

## Required Database Migration

Sebelum fitur baru ini dapat berfungsi dengan baik, beberapa kolom perlu ditambahkan ke tabel `transactions` pada database. 

Silakan jalankan SQL berikut di SQL Editor Supabase:

```sql
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
```

## Verifikasi Hasil

Setelah menjalankan SQL di atas, pastikan kolom baru telah ditambahkan dengan benar:

1. Buka panel Database di Supabase
2. Pilih tabel `transactions`
3. Verifikasi bahwa kolom berikut telah ditambahkan:
   - `payment_method` (TEXT, NOT NULL, DEFAULT 'cash')
   - `cash_received` (DECIMAL)
   - `cash_change` (DECIMAL)
   - `reference_id` (TEXT)

## Fitur yang Ditambahkan

Dengan penambahan kolom-kolom di atas, sistem sekarang mendukung:

1. Pencatatan metode pembayaran untuk setiap transaksi
2. Tampilan opsi pembayaran pada halaman checkout
3. Informasi metode pembayaran pada struk dan detail transaksi
4. Laporan transaksi dengan breakdown berdasarkan metode pembayaran

## Jika Anda Mengalami Masalah

Jika Anda mengalami masalah setelah menjalankan migrasi ini, pastikan:

1. Semua kolom baru telah ditambahkan dengan benar
2. Tidak ada transaksi yang terganggu selama proses migrasi
3. Aplikasi telah di-restart setelah migrasi

Jika masalah berlanjut, hubungi developer untuk mendapatkan bantuan.
