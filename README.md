# BulkMate – Asisten Bulking Personal Indonesia

> Aplikasi web modern untuk membantu menaikkan berat badan secara sehat dan terkontrol.

## 🚀 Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Charts**: Recharts
- **AI**: Google Gemini 2.5 Flash (Vision & Text)
- **Backend**: Supabase (PostgreSQL + Auth)
- **State**: React Context + localStorage (offline-first)

## 📦 Instalasi

```bash
# Clone repo
git clone <repo-url>
cd MyBulking

# Install dependencies
npm install

# Salin dan isi environment variables
cp .env.example .env
# Edit .env dengan credentials kamu

# Jalankan dev server
npm run dev
```

## ⚙️ Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_OPENAI_API_KEY=         # opsional
```

## 🗄️ Setup Database (Supabase)

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard)
2. Masuk ke project kamu
3. Buka **SQL Editor**
4. Copy-paste seluruh isi file `supabase/schema.sql`
5. Klik **Run**

## 🎯 Fitur Utama

| # | Fitur | Deskripsi |
|---|-------|-----------|
| 1 | Dashboard | Kalori harian, makro, progress berat |
| 2 | Kalkulator Kalori | BMR/TDEE + surplus otomatis |
| 3 | Food Tracker | Log makanan dari database 35+ item |
| 4 | Makanan Favorit | Quick-add makanan favorit |
| 5 | Tracker Jajan | Log jajan harian Indonesia |
| 6 | Berat Badan | Chart progress + history |
| 7 | Pengingat Makan | Notifikasi waktu makan |
| 8 | Prediksi Target | Estimasi waktu capai target |
| 9 | Budget Tracker | Kontrol pengeluaran makanan |
| 10 | AI Meal Planner | Generate menu via Gemini AI |
| 11 | AI Food Scanner | Scan foto makanan via Gemini Vision |
| 12 | Progress Photo | Galeri foto before/after |
| 13 | Nutrition Warning | Peringatan pola makan |
| 14 | Analytics | Dashboard grafik lengkap |
| 15 | Settings | Profil, tema, export data |

## 🚢 Deploy

### Vercel (Recommended)
```bash
npm run build
# Upload folder dist ke Vercel, atau gunakan Vercel CLI:
npx vercel --prod
```

### Cloudflare Pages
```bash
npm run build
# Upload folder dist ke Cloudflare Pages
```

> **Penting**: Tambahkan environment variables di dashboard Vercel/Cloudflare sesuai file `.env`

## 📱 PWA

Aplikasi bisa diinstall sebagai PWA di Android/iOS:
- Buka di browser mobile
- Tap "Add to Home Screen"

## 🔑 Mendapatkan API Keys

- **Gemini API**: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **Supabase**: [supabase.com/dashboard](https://supabase.com/dashboard) → New Project

## 📝 License

MIT License – Dibuat untuk mahasiswa & pekerja Indonesia yang ingin bulking sehat 💪
