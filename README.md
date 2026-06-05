> *Note: to open other add /admin and /target, example /admin/kasir

# ☕ Sabar Coffee - Digital POS & Order System
> **ID:** Proyek pembelajaran sistem kasir dan pemesanan digital untuk kedai kopi lokal.  
> **EN:** A learning project for a digital POS and ordering system tailored for local coffee shops.

---

## 📌 Overview / Ringkasan
**Sabar Coffee** is a simplified web-based Point of Sale (POS) system designed to digitize the entire workflow of a coffee shop—from customer ordering to kitchen management and sales reporting.  
*Sabar Coffee adalah sistem POS berbasis web sederhana yang dirancang untuk mendigitalkan seluruh alur kerja kedai kopi—mulai dari pemesanan pelanggan hingga manajemen dapur dan laporan penjualan.*

---

## ✨ Key Features / Fitur Utama

### 1. 📱 Customer Interface / Layar Pelanggan (`index.html`)
* **EN:** Digital menu with categories and live stock validation.
* **ID:** Katalog menu digital dengan kategori dan validasi stok secara real-time.
* **EN:** Instant queue number generation after ordering.
* **ID:** Pembuatan nomor antrean instan setelah mengirim pesanan.

### 2. 💰 Cashier Station / Layar Kasir (`kasir.html`)
* **EN:** Focused queue management (shows top 2 active orders).
* **ID:** Manajemen antrean terfokus (menampilkan 2 antrean teratas).
* **EN:** Automatic change calculator with 58mm thermal receipt printing support.
* **ID:** Kalkulator kembalian otomatis dengan dukungan cetak struk thermal 58mm.

### 3. 🧑‍🍳 Barista Station / Layar Dapur (`barista.html`)
* **EN:** Order details for the kitchen team with FIFO (First-In-First-Out) priority.
* **ID:** Detail pesanan untuk tim dapur dengan prioritas FIFO.
* **EN:** Automated Text-to-Speech (TTS) to call customer queue numbers.
* **ID:** Panggilan suara otomatis (TTS) untuk memanggil nomor antrean pelanggan.

### 4. 📊 Admin Dashboard / Dasbor Manajemen (`admin.html`)
* **EN:** Transaction history logs and manual stock adjustment.
* **ID:** Log riwayat transaksi dan penyesuaian stok secara manual.
* **EN:** Visual sales reporting using line charts (Chart.js).
* **ID:** Laporan penjualan visual menggunakan grafik garis (Chart.js).

---

## 🚀 Tech Stack / Teknologi yang Digunakan
* **Frontend:** HTML5, CSS3 (Bootstrap 5.3), Vanilla JavaScript.
* **Icons:** Bootstrap Icons.
* **Charts:** Chart.js.
* **Backend API:** `own web-service`

---

## 🎨 UI Style Guide / Panduan Visual
* **Theme:** Warm & Classic Coffee Shop.
* **Colors:** Primary `#c85a2e`, Background `#fbf6eb`.
* **Vibe:** Clean, Rounded (20px), and User Friendly.

---

> Api Source Screenshot
<img width="1364" height="328" alt="Screenshot 2026-06-05 164035" src="https://github.com/user-attachments/assets/b0b6b963-7fb3-46b0-b8ee-2d637ee19070" />

---

### Dokumentasi API & Security

Berikut adalah cuplikan kode konfigurasi FastAPI dan keamanan (Authorization) yang digunakan dalam sistem ini:

<details>
<summary><b>Klik untuk melihat kode lengkap</b></summary>

```python
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import requests
import os
import json
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KONFIGURASI KEAMANAN FASTAPI (UNTUK ADMIN) ---
security = HTTPBearer()

# Token statis sementara (bisa diganti password yang lebih rumit)
SECRET_ADMIN_TOKEN = "rahasia-kopi-sabar-123"

def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != SECRET_ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau Anda tidak memiliki akses",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials

# --- KONFIGURASI SUPABASE ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Zona Waktu Indonesia Barat
WIB = timezone(timedelta(hours=7))

# --- MODEL DATA ---
class StockUpdate(BaseModel):
    stock: int

class OrderItem(BaseModel):
    id: int
    qty: int
    price: float

class OrderPayload(BaseModel):
    queue: str
    items: List[OrderItem]
    total: float
```

---

**👨‍💻 Developed by Fadhlullah Hanif Nur Caturangga** *Sidoarjo, Indonesia - 2026*
