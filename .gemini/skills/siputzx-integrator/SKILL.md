---
name: siputzx-integrator
description: Wajib digunakan saat AI ingin mengintegrasikan fitur dari siputzx-mcp-server ke dalam aplikasi pengguna. Memastikan AI tidak menebak respons API dan selalu mengambil data terbaru dari server.
---

# Siputzx API Integrator Skill

Gunakan skill ini untuk memandu integrasi yang akurat dari fitur `siputzx-mcp-server`. Skill ini melarang keras penggunaan data "asumsi" atau "tebakan" mengenai struktur API.

## Mandat Utama: No Guessing!

1. **Selalu Fetch Terlebih Dahulu:** Sebelum menyarankan kode integrasi, Anda **WAJIB** memanggil tool terkait dari `siputzx-mcp-server` untuk melihat contoh respons nyata dan parameter yang dibutuhkan.
2. **Gunakan OpenAPI sebagai Sumber Kebenaran:** Karena MCP ini dinamis, struktur API bisa berubah. Jangan mengandalkan ingatan atau data lama.
3. **Verifikasi Tool:** Jika pengguna meminta fitur (misalnya "tambah pencarian anime"), cari tool yang sesuai menggunakan `list_tools` atau dengan mencoba tool yang relevan (seperti `get__anime_search`).

## Alur Kerja Integrasi (Workflow)

### Langkah 1: Penemuan & Verifikasi
- Panggil tool API yang diminta pengguna dengan parameter testing (misal: query "test" atau "naruto").
- Perhatikan struktur JSON yang dikembalikan. Fokus pada:
  - Nama field (apakah `results`, `data`, atau `items`?).
  - Tipe data (string, number, atau object?).
  - Status code atau pesan error yang mungkin muncul.

### Langkah 2: Perancangan Kode
- Tulis kode integrasi (JavaScript/Python/dll) hanya berdasarkan struktur data yang baru saja Anda terima di Langkah 1.
- Jika API mengembalikan `thumb` bukan `thumbnail`, pastikan kode Anda menggunakan `thumb`.

### Langkah 3: Penanganan Error
- Selalu sertakan blok `try-catch` atau penanganan error karena API eksternal bisa mengalami timeout atau perubahan mendadak.
- Berikan pesan error yang informatif berdasarkan respons `isError` dari MCP.

## Contoh Instruksi Internal
"Saya tidak akan menulis fungsi pencarian anime sebelum saya memanggil `get__anime_search` dan melihat persis apa yang dikembalikan oleh server siputzx saat ini."
