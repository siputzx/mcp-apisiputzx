# siputzx-mcp-server 🚀

MCP Server dinamis untuk API [siputzx.my.id](https://api.siputzx.my.id). Server ini **otomatis** membaca OpenAPI spec saat startup dan mengubah semua endpoint menjadi tools yang bisa digunakan oleh AI (Claude, Cursor, dll).

---

## 🛠️ Fitur Utama
- **Dynamic Tools:** Semua fitur API (Anime, Berita, Info Cuaca, Image Maker, dll) otomatis terdaftar.
- **Zero Configuration:** Tidak perlu install modul manual (sudah dibundel).
- **Auto Update:** Cukup restart server untuk mendapatkan tools baru jika API Siputzx diupdate.

---

## 🚀 Instalasi Cepat

### 1. Gemini CLI (Terminal)
Langsung install dan gunakan tanpa setup manual:
```bash
gemini extensions install https://github.com/siputzx/mcp-apisiputzx
```

### 2. Claude Desktop
Buka file konfigurasi Claude Desktop Anda:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Tambahkan ini:
```json
{
  "mcpServers": {
    "siputzx": {
      "command": "npx",
      "args": ["-y", "siputzx-mcp-server"]
    }
  }
}
```

### 3. Cursor / VS Code (Cline & Roo Code)
Pergi ke **Settings > MCP Servers** dan tambahkan server baru:
- **Name:** `siputzx`
- **Type:** `command`
- **Command:** `npx -y siputzx-mcp-server`

---

## 📖 Cara Kerja
Server ini menggunakan runtime discovery:
1. Fetch `https://api.siputzx.my.id/api/openapi.json`.
2. Parse semua endpoint `GET` & `POST`.
3. Generate skema `Zod` secara dinamis untuk validasi input.
4. Ekspos sebagai tools MCP dengan deskripsi lengkap dari OpenAPI.

---

## 👨‍💻 Pengembangan Lokal
Jika ingin berkontribusi atau modifikasi:
```bash
# Clone
git clone https://github.com/siputzx/mcp-apisiputzx
cd mcp-apisiputzx

# Install & Build
npm install
npm run build

# Run
npm start
```

---

## 📄 Lisensi
MIT License - Dibuat oleh [Siputzx](https://github.com/siputzx).
