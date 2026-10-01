<!-- TODO: tambahkan screenshot/banner app di sini sebelum submission -->

# Qerity

**Cek dulu, sebelum percaya**  
**Check first, before you trust**

## Disclaimer

> **Disclaimer:** Qerity adalah alat bantu screening awal, bukan bukti hukum dan bukan kepastian bahwa suatu konten merupakan penipuan. Hasil analisis harus selalu diverifikasi ulang melalui kanal resmi OJK dan pemeriksaan manual. Qerity tidak menggantikan verifikasi resmi.

## Overview

Qerity adalah aplikasi mobile berbasis React Native dan Expo yang membantu masyarakat melakukan pemeriksaan awal terhadap konten mencurigakan, seperti bukti transfer dan testimoni pinjaman online ilegal.

Aplikasi menggabungkan pemeriksaan forensik gambar ringan di perangkat dengan pengecekan nama lender terhadap snapshot daftar entitas legal OJK yang dibundel di aplikasi. Hasilnya berupa sinyal yang perlu ditinjau, bukan keputusan final.

## Core Features

### EXIF metadata check

Qerity memeriksa metadata EXIF yang tersedia dari gambar. Metadata kosong atau tidak adanya field `Software` diperlakukan sebagai sinyal netral, karena screenshot dan gambar yang dikirim ulang melalui aplikasi pesan atau media sosial sering kehilangan EXIF. Field `Software` yang terisi, termasuk pada lokasi bersarang seperti `TIFF.Software` atau `Exif.Software`, ditampilkan sebagai sinyal yang patut ditinjau.

Keberadaan EXIF tidak dianggap sebagai bukti bahwa gambar berasal dari kamera atau tidak pernah diedit.

### Error Level Analysis (ELA)

ELA dijalankan di WebView menggunakan Canvas API. Aplikasi menghitung rata-rata perbedaan kompresi (`avgDiff`) dan persentase piksel yang melewati ambang perbedaan tertentu. Gambar dengan sisi terpanjang lebih dari 1600 piksel diperkecil sebelum analisis untuk mengurangi risiko WebView gagal memproses gambar besar.

ELA memiliki timeout 12 detik. Jika WebView gagal mengirim hasil, pemeriksaan ditampilkan sebagai `error`, bukan sebagai hasil tanpa sinyal.

### Duplicate/similarity detection

Qerity menghitung perceptual dHash 64-bit di WebView, lalu membandingkannya menggunakan jarak Hamming. Kecocokan dengan jarak hingga 10 bit diperlakukan sebagai gambar yang mirip atau duplikat berdasarkan heuristic yang dapat dikalibrasi ulang.

Sumber pembandingnya adalah:

- Riwayat hash scan sebelumnya di AsyncStorage pada perangkat user.
- Dataset contoh scam yang dibundel di `data/knownScamHashes.js`.

Penyimpanan hash ke riwayat bersifat opsional. Tidak ditemukannya kecocokan bukan bukti bahwa gambar tersebut asli atau unik.

### OJK legality matching

Nama lender dinormalisasi lalu diperiksa terhadap `app` dan `company` pada daftar OJK yang dibundel:

- `legal`: nama sama persis setelah normalisasi.
- `similar`: nama cukup dekat berdasarkan Levenshtein distance dengan batas proporsional terhadap panjang string.
- `not_found`: tidak ditemukan kecocokan.
- `skipped`: user tidak memasukkan nama lender.

Input yang terlalu pendek ditolak untuk mengurangi false match. Hasil legalitas tetap harus diverifikasi ke kanal resmi OJK.

### Di luar scope versi ini

Deteksi gambar AI-generated dan model compression berbasis tensor-train/quantum-inspired **belum diimplementasikan** pada alur analisis versi ini. Keduanya adalah roadmap/future work, bukan fitur PoC yang sedang berjalan.

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| Mobile framework | Expo SDK 54 (`expo` `~54.0.34`) |
| UI runtime | React `19.1.0`, React Native `0.81.5` |
| Image input | `expo-image-picker` `~17.0.11` |
| Gradient/UI styling | `expo-linear-gradient` `~15.0.7` |
| Status bar | `expo-status-bar` `~3.0.8` |
| In-app image analysis | `react-native-webview` `13.15.0`, Canvas API, HTML/JavaScript |
| Local scan history | `@react-native-async-storage/async-storage` `^3.1.1` |
| Application entry point | `index.js` dengan `registerRootComponent` dari Expo |
| Package manager | npm, berdasarkan `package-lock.json` |

## Repository Structure

```text
qerity/
├── App.js                         # Root navigation antar splash, home, hasil, dan about
├── app.json                       # Konfigurasi aplikasi Expo
├── index.js                       # Entry point Expo
├── package.json                   # Dependency dan script npm
├── package-lock.json              # Lockfile dependency npm
├── .gitignore                     # File/folder lokal yang tidak dilacak Git
├── assets/
│   ├── elaHtml.js                 # HTML/JavaScript WebView untuk ELA dan dHash
│   └── tensorHtml.js              # Materi/roadmap tensor compression; bukan alur analisis aktif
├── data/
│   ├── ojkLegalList.js            # Snapshot daftar legalitas OJK
│   └── knownScamHashes.js         # Placeholder hash contoh scam
├── screens/
│   ├── SplashScreen.js             # Splash screen
│   ├── HomeScreen.js               # Input gambar, nama lender, dan lender-only check
│   ├── ResultScreen.js             # Status pemeriksaan, hasil, dan verdict
│   └── AboutScreen.js              # Informasi cara kerja aplikasi
└── utils/
    └── checkLegality.js            # Normalisasi dan pencocokan nama lender ke daftar OJK
```

## Local Setup

### Prerequisites

Sebelum mulai, siapkan:

1. **Node.js 20.x LTS** atau versi LTS yang kompatibel dengan Expo SDK 54.
2. **npm**, yang biasanya terpasang bersama Node.js.
3. **Expo Go** pada Android atau iPhone untuk menjalankan aplikasi melalui development server.
4. Laptop dan HP yang berada pada jaringan Wi-Fi yang sama ketika memakai koneksi LAN.
5. Kabel USB dan Android Studio hanya diperlukan jika ingin menjalankan emulator atau native Android secara lokal.

Periksa instalasi:

```bash
node --version
npm --version
```

Setelah dependency terpasang, pemeriksaan tambahan dapat dijalankan dengan:

```bash
npx expo-doctor
```

### Clone repository

```bash
git clone https://github.com/narazla/Qerity.git
cd Qerity
```

### Install dependencies

Jalankan dari folder yang berisi `package.json`:

```bash
npm install
```

### Jalankan development server

```bash
npx expo start
```

Expo akan menampilkan QR code di terminal atau membuka halaman Expo Dev Tools.

### Buka di HP menggunakan Expo Go

1. Install atau update Expo Go dari Google Play Store atau Apple App Store.
2. Pastikan HP dan laptop berada pada jaringan Wi-Fi yang sama.
3. Jalankan `npx expo start`.
4. Android: buka Expo Go lalu pilih **Scan QR code**.
5. iPhone: scan QR code menggunakan kamera iPhone, lalu buka link tersebut dengan Expo Go.
6. Tunggu Metro Bundler selesai memuat JavaScript.
7. Beri izin kamera atau galeri ketika diminta oleh aplikasi.
8. Pilih foto, atau masukkan nama lender lalu tekan **Check lender with OJK only** untuk melakukan pengecekan legalitas tanpa foto.

Jika jaringan kantor/kampus memblokir koneksi LAN, jalankan:

```bash
npx expo start --tunnel
```

Mode tunnel biasanya lebih lambat karena traffic melewati layanan tunnel Expo.

### Menjalankan melalui emulator Android

Repo ini menggunakan Expo managed workflow dan tidak menyertakan folder native `android/`. Untuk emulator, siapkan Android Studio, Android SDK, emulator yang aktif, serta environment variable Android yang diperlukan oleh React Native/Expo. Kemudian jalankan:

```bash
npx expo start
```

Tekan `a` pada terminal Expo untuk mencoba membuka aplikasi pada emulator Android yang aktif.

### APK standalone

**TODO sebelum submission:** repository ini belum memiliki `eas.json` atau konfigurasi EAS Build yang terverifikasi. Karena itu, belum ada perintah APK standalone yang dapat dijamin bekerja hanya dari konfigurasi repository saat ini.

Setelah tim menyiapkan akun Expo dan konfigurasi EAS, alur yang perlu diverifikasi adalah:

```bash
npx eas login
npx eas build:configure
npx eas build --platform android
```

Jangan mengandalkan bagian ini sebagai instruksi submission sebelum `eas.json`, package identifier, dan hasil build APK diuji pada perangkat nyata.

### Troubleshooting

#### QR code tidak dapat dibuka

- Pastikan laptop dan HP berada pada jaringan yang sama.
- Matikan VPN sementara jika VPN mengubah routing jaringan lokal.
- Coba `npx expo start --tunnel`.
- Pastikan firewall tidak memblokir proses Node.js atau Expo.

#### Expo Go menampilkan error versi

- Jalankan `npx expo-doctor`.
- Pastikan Expo Go sudah diperbarui.
- Pastikan dependency Expo menggunakan versi pada `package.json`, terutama Expo SDK `54.0.34`.
- Hapus instalasi dependency lalu pasang ulang bila diperlukan:

```bash
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

Pada Windows PowerShell, padanan penghapusan folder dependency adalah:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npx expo start -c
```

#### Kamera atau galeri tidak dapat digunakan

- Pastikan permission kamera atau media library diberikan.
- Tutup dan buka kembali Expo Go setelah mengubah permission.
- Coba menggunakan gambar dari galeri jika kamera perangkat tidak tersedia.

#### ELA tidak selesai

- Gambar yang sangat besar dapat membutuhkan waktu lebih lama.
- Gambar tanpa data base64 atau WebView yang gagal akan ditampilkan sebagai `error`/`unavailable`.
- Tunggu sampai batas timeout 12 detik sebelum mengulangi scan.
- Coba gambar dengan resolusi lebih kecil untuk pengujian lokal.

#### Lender tidak ditemukan

Daftar yang dipakai adalah snapshot terbatas. Nama yang dimasukkan harus merujuk pada nama aplikasi atau nama perusahaan yang tercantum pada snapshot. Verifikasi hasil langsung melalui kanal resmi OJK.

## Known Limitations

- Daftar OJK adalah snapshot per Juli 2026 dari sumber sekunder, bukan data yang di-fetch secara real-time dari `ojk.go.id`.
- ELA kurang efektif untuk gambar PNG dan gambar yang sudah mengalami screenshot atau kompresi berulang kali.
- Database duplicate detection masih terbatas. `data/knownScamHashes.js` adalah placeholder dan belum berisi dataset scam nyata yang telah dikurasi.
- Deteksi AI-generated image belum diimplementasikan dan masuk roadmap.
- Quantum-inspired atau tensor-train compression belum diimplementasikan dan masuk roadmap.
- Semua hasil analisis adalah sinyal probabilistik, bukan kepastian.
- Threshold ELA dan duplicate matching masih berupa heuristic dan perlu dikalibrasi dengan data uji nyata.
- Snapshot legalitas OJK dapat berubah; nama baru, pencabutan, atau perubahan nama belum otomatis tercermin.

## Roadmap / Future Work

- Menambahkan deteksi AI-generated image menggunakan model pretrained yang dapat divalidasi.
- Menambahkan quantum-inspired atau tensor-train model compression untuk pemrosesan on-device yang lebih ringan.
- Menambahkan integrasi share langsung dari WhatsApp.
- Memperbarui daftar OJK secara otomatis dari sumber resmi.
- Mengisi dan mengkurasi database hash scam berdasarkan contoh yang telah diverifikasi.
- Mengkalibrasi threshold ELA dan Hamming distance menggunakan dataset pengujian yang terdokumentasi.
- Menambahkan konfigurasi EAS dan pipeline APK standalone yang dapat direproduksi.

## Security & Privacy

- Qerity tidak mengirim gambar scan ke server aplikasi. Gambar diproses sementara di perangkat, termasuk melalui WebView lokal untuk ELA dan dHash.
- Metadata EXIF diproses secara lokal untuk pemeriksaan pada layar hasil.
- Hash gambar dapat disimpan secara opsional di `AsyncStorage` pada perangkat user untuk membantu membandingkan scan berikutnya.
- Riwayat hash tersebut tidak dikirim ke server melalui kode aplikasi saat ini.
- User tetap perlu memahami bahwa penyimpanan lokal dapat ikut terhapus ketika data aplikasi dibersihkan atau aplikasi dihapus.
- Jangan memasukkan data pribadi yang tidak diperlukan ke dalam nama lender atau gambar yang dibagikan saat demo.

## Meet the Team

<!-- TODO: ganti placeholder foto di bawah dengan foto asli sebelum submission. Upload ke Google Drive dengan akses "Anyone with the link", lalu ganti link id di src -->

<br>
<div align="left">
  <h2>Meet the Team</h2>
  <p>The people behind Qerity</p>
</div>

<a href="#"><img width="144px" height="180px" src="PLACEHOLDER_LINK_1" alt=""/></a> | <a href="#"><img width="144px" height="180px" src="PLACEHOLDER_LINK_2" alt=""/></a> | <a href="#"><img width="144px" height="180px" src="PLACEHOLDER_LINK_3" alt=""/></a> |
| --- | --- | --- |
| <div align="left"><h3><b>Muhammad Aris Maulana</b></h3></div> | <div align="left"><h3><b>Nazla Azzahra Hermana</b></h3></div> | <div align="left"><h3><b>Ladya Kalascha</b></h3></div> |

---

Built for **HackNusa 2026**  
**Telkom University x Kaspersky**
