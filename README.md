<div align="center">
<img src="https://drive.google.com/uc?export=view&id=1PvaRARmRHdVh7cIkODWpcSwSu-7WDbLa" alt="Qerity logo" width="120"/>

### Qerity
*Verify before you trust.*
</div>

<br>

<img src="https://drive.google.com/uc?export=view&id=1bAvH1Jusn16nfovEDQZWsDypC_HzcP1Q" alt="Qerity banner" width="100%"/>
<br>

<div align="center">

**[Download Android APK (Pre-release)](https://github.com/narazla/Qerity/releases/latest)**

</div>

<br>

Qerity is a mobile app that helps people verify suspicious loan-related content before making a financial decision. Illegal online lending (*pinjol ilegal*) in Indonesia relies heavily on manipulated content like fake loan advertisements, fabricated transfer receipts, and staged testimonials to pressure victims into transferring money quickly. Victims in urgent need of funds rarely have time to verify what they're seeing before it's too late.

Rather than requiring users to navigate multiple separate channels (manual OJK lookups, basic image inspection, asking around for second opinions), Qerity consolidates these checks into a single scan. Users upload or photograph suspicious content, and within seconds receive a breakdown of findings across four independent signals: image metadata, visual editing patterns, duplicate/known-scam matching, and lender legality against OJK's official registry.

Qerity does not produce a final judgment of "real" or "fake." Each signal is reported on its own, with plain-language explanations, and the app consistently directs users to confirm further with OJK before making any financial decision. This is a deliberate design choice: in a track focused on human-centric security, the goal is to reduce the friction and delay that scammers exploit, not to replace a user's own judgment with false certainty.

## Problem Statement

> **951 illegal online lending (pinjol) entities** were found and shut down by Indonesia's Satgas PASTI in the first quarter of 2026 alone.
> **515,345 scam reports** reached the Indonesia Anti-Scam Centre between November 2024 and March 2026.
> Source: OJK / Satgas PASTI press release, 29 April 2026

Illegal online lenders rarely rely on a single trick. They spread **fake loan advertisements, fabricated transfer receipts, and staged testimonials** through social media, private messages, and group chats. Each piece of content is made to look real and to create **urgency**. Victims who need money fast are pushed to pay or share personal data before they have time to think.

Verifying today means **switching between several channels**. People must look up the lender on OJK's registry by hand, inspect the image, and ask friends for a second opinion. Under pressure, most people skip these steps. The result is **lost money, leaked personal data, and abusive collection practices**.

Qerity gives users a **fast, private, one-step check** before they pay. It reports each signal separately and keeps the final decision in the user's hands. This fits the Human-Centric Security track because it **reduces the time pressure that scammers rely on**.

Sources: [OJK Satgas PASTI press release (29 April 2026)](https://ojk.go.id/id/berita-dan-kegiatan/info-terkini/Documents/Pages/Satgas-PASTI-Hentikan-953-Entitas-Pinjol-Ilegal-dan-Penawaran-Investasi-Ilegal/Satgas%20PASTI%20Hentikan%20953%20Entitas%20Pinjol%20Ilegal%20dan%20Penawaran%20Investasi%20Ilegal.pdf)

## Core Features

Qerity provides two core features. The first, on-device image forensics, runs **three independent signals** together whenever a user submits an image; the second, lender legality check, can be used on its own with just a name, no image required.

### 1. On-Device Image Forensics

Given a photo or screenshot, Qerity runs three lightweight forensic signals locally on the device:

- **EXIF metadata inspection** — checks the file's embedded metadata for signs of prior editing (e.g. a populated `Software` field). Missing EXIF is treated as **neutral**, not suspicious, since screenshots and images re-sent through messaging or social apps routinely lose this metadata; its presence or absence alone is never treated as proof of authenticity.
- **Error Level Analysis (ELA)** — recompresses the image and visualizes compression-level differences as a heatmap, surfacing regions that may have been pasted in or edited. This runs in a WebView using the Canvas API, with a **12-second timeout**: if analysis doesn't complete in time, the check is reported as unavailable rather than silently treated as a clean result. ELA is less effective on PNG files or images that have been screenshotted and recompressed repeatedly.
- **Duplicate / similarity matching** — computes a 64-bit perceptual hash (dHash) of the image and compares it, via Hamming distance, against the user's own scan history and a small bundled sample set of known scam content. **Not finding a match is not evidence that the image is genuine or unique** — it only means nothing matched what Qerity has seen so far.

These three signals are combined into a single risk level (low / medium / high) with plain-language reasons, never a binary "real" or "fake" verdict.

### 2. Lender Legality Check (OJK)

Given a lender or company name — entered on its own or alongside an image — Qerity checks it against a snapshot of OJK's official list of licensed lending entities, using exact and fuzzy (similarity-based) matching:

- **Exact match** → reported as verified against the snapshot.
- **Similar but not exact** (e.g. a scam name imitating a real one, like "Danamas Cepat Cair" vs. "Danamas") → flagged explicitly as a near-match, not treated as verified.
- **No match found** → flagged as not found in the snapshot; this does not confirm the entity is illegal, only that it isn't in Qerity's current data.

This check does not require an image and can be used as a standalone, instant lookup.

---

**Out of scope for this version:** AI-generated image detection and quantum-inspired model compression are not part of the current analysis flow — see [Roadmap](#roadmap--future-work) below.

## ⚙️ Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile framework | Expo SDK 57 (`expo` `^57.0.26`) |
| UI runtime | React `19.2.3`, React Native `0.86.3` |
| Image input | `expo-image-picker` `~57.0.20` |
| Icons | `@expo/vector-icons` `^15.0.2` (Ionicons) |
| Custom fonts | `expo-font` `~57.0.4` |
| Status bar | `expo-status-bar` `~57.0.1` |
| In-app image analysis | `react-native-webview` `13.16.1` (Canvas API, HTML/JavaScript) — used for Error Level Analysis and perceptual hashing |
| Signed data pack verification | `tweetnacl` `1.0.3` Ed25519 verification |
| Local scan history | `@react-native-async-storage/async-storage` `2.2.0` |
| Pack tests | Node `node:test` and `node:assert` |
| Design system | `styles/theme.js` — shared color tokens, used across all screens |
| Application entry point | `index.js` with Expo's `registerRootComponent` |
| Package manager | npm, based on `package-lock.json` |

## 📁 Repository Structure

```text
qerity/
├── App.js                          # Root navigation across all screens (splash, home, result, lender, history, about)
├── app.json                        # Expo application configuration
├── eas.json                        # EAS Build configuration (Android APK profile)
├── index.js                        # Expo entry point
├── package.json                    # npm dependencies and scripts
├── package-lock.json               # npm dependency lockfile
├── .gitignore                      # Local files/folders excluded from Git
├── assets/
│   ├── elaHtml.js                  # WebView HTML/JS: Error Level Analysis + perceptual dHash
│   ├── icon.png, favicon.png,
│   │   splash-icon.png,
│   │   android-icon-*.png          # Default Expo-generated app icon assets
│   └── branding/
│       ├── qerity-icon.png         # Qerity logo, used in README and in-app headers
│       └── qerity-banner.png       # Qerity banner, used in README
├── data/
│   ├── ojkLegalList.js             # OJK-licensed lender snapshot (name, company, snapshot date)
│   ├── knownScamHashes.js          # Bundled sample scam-image hashes (placeholder, not yet populated)
│   └── publicKey.js                # Embedded Ed25519 public key for data packs
├── publish/                        # Published datapack.json and datapack.sig
├── scripts/                        # Data pack key, build, and signing scripts
├── screens/
│   ├── SplashScreen.js             # App splash screen
│   ├── HomeScreen.js               # Image input, lender name input, and entry point to all other screens
│   ├── ResultScreen.js             # Forensic signal results, OJK legality card, and combined verdict
│   ├── LenderScreen.js             # Standalone lender legality check (no image required)
│   ├── HistoryScreen.js            # Local scan history (metadata only, no images stored)
│   └── AboutScreen.js              # "How it Works" onboarding carousel
├── styles/
│   └── theme.js                    # Shared design tokens (colors, used across all screens)
└── utils/
    ├── checkLegality.js            # Name normalization, exact/similarity matching against the OJK list
    ├── dataPack.js                 # Cached data pack loading and update checks
    ├── scanHistory.js              # AsyncStorage read/write for local scan history
    └── verifyPack.js               # Pure JavaScript Ed25519 pack verification
├── tests/
│   └── verifyPack.test.js          # Signed pack verification tests
└── SECURITY.md                     # Threat model and security roadmap
```

## 🚀 Local Setup

### Quick Start (No Setup Required)

If you just want to try the app without setting up a development environment, download the standalone APK from [Releases](https://github.com/narazla/Qerity/releases/latest) and install it directly on an Android device (enable "Install from unknown sources" if prompted).

> **Note:** This build was tested on an Android Studio emulator (Pixel 6, API 37.2) and has not yet been tested on a physical Android device. Primary development and testing throughout this project was done via Expo Go, since the team develops on iOS devices.

The rest of this section covers running the project from source.

### Prerequisites

Before starting, prepare:

1. **Node.js 20.x LTS**, or another LTS version compatible with Expo SDK 57.
2. **npm**, normally installed together with Node.js.
3. **Expo Go**, installed on an Android or iPhone device, to run the app through the development server.
4. A laptop and phone connected to the same Wi-Fi network, when using a LAN connection.
5. **Android Studio**, with an emulator configured, only if you want to run a native Android emulator or test the standalone APK without a physical device.

Check your installations:

```bash
node --version
npm --version
```

### Clone the repository

```bash
git clone https://github.com/narazla/Qerity.git
cd Qerity
```

### Install dependencies

Run this from the folder containing `package.json`:

```bash
npm install
```

### Run tests

```bash
npm run test:pack
```

After installing, you can optionally run a project health check:

```bash
npx expo-doctor
```

### Run the development server

```bash
npx expo start
```

Expo will display a QR code in the terminal, and optionally open the Expo Dev Tools page in your browser.

### Open on a phone using Expo Go

1. Install or update **Expo Go** from the Google Play Store or Apple App Store.
2. Make sure the phone and laptop are on the same Wi-Fi network.
3. Run `npx expo start`.
4. **Android:** open Expo Go and choose **Scan QR code**.
5. **iPhone:** scan the QR code with the iPhone camera, then open the link with Expo Go.
6. Wait for Metro Bundler to finish loading the JavaScript bundle.
7. Grant camera or gallery permission when the app requests it.
8. Choose a photo, or enter a lender name and press **Check lender with OJK only** to check legality without a photo.

If an office or campus network blocks the LAN connection, use tunnel mode instead:

```bash
npx expo start --tunnel
```

Tunnel mode is usually slower, since traffic passes through Expo's tunnel service.

### Run through an Android emulator (development build)

This repository uses the Expo managed workflow and does not include a native `android/` folder. To use an emulator, set up Android Studio, the Android SDK, an active emulator, and the environment variables required by React Native/Expo. Then run:

```bash
npx expo start
```

Press `a` in the Expo terminal to open the app on the active Android emulator.

### Testing the standalone APK on an emulator

Instead of a physical device, you can also install the standalone APK (see [Standalone APK](#standalone-apk-no-expo-go-required) below) on an Android Studio emulator:

```bash
adb devices                    # confirm the emulator is listed with status "device"
adb install path\to\qerity.apk
```

### Standalone APK (No Expo Go Required)

A pre-built standalone APK is available and does not require Expo Go, a development server, or any setup — see [Releases](https://github.com/narazla/Qerity/releases/latest).

To build your own APK from this repository:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

This uses the `preview` profile defined in `eas.json`, configured to produce an installable `.apk` file rather than the Play Store `.aab` format. The build runs on Expo's servers and typically takes 10–20 minutes; once complete, a download link is provided in the terminal and on the [EAS dashboard](https://expo.dev/accounts/nazlaazzahra/projects/qerity).

> **Note:** iOS standalone builds require an active Apple Developer Program membership and are out of scope for this submission. iOS testing was done exclusively through Expo Go.

### Troubleshooting

#### "Port 8081 is being used by another process"

This usually means a previous Expo session is still running in the background. Either:
- Accept the prompt to use an alternative port (e.g. 8082), or
- Close any other terminal windows running `expo start`, then retry.

#### The QR code cannot be opened

- Make sure the laptop and phone are on the same network.
- Temporarily disable a VPN if it changes local network routing.
- Try `npx expo start --tunnel`.
- Make sure the firewall is not blocking Node.js or Expo.

#### Expo Go reports a version error

Expo Go updates automatically and may no longer match the SDK version this project uses. If you see a message like "Project is incompatible with this version of Expo Go":

```bash
npx expo install expo@^57.0.0
npx expo install --fix
npm install
npx expo start
```

This upgrades the project's dependencies to match the SDK version your installed Expo Go expects. Re-test all core features after upgrading, since dependency versions may shift slightly.

Other steps that can help:

- Run `npx expo-doctor` to check for dependency mismatches.
- Make sure Expo Go is up to date on your device.
- Remove and reinstall dependencies if the issue persists:

```bash
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

On Windows PowerShell, the equivalent commands are:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npx expo start -c
```

#### Expo Go requires sign-in

If you see a message like "You're signed in to Expo Go as [...], but not signed in to Expo CLI":

```bash
npx expo login
```

Sign in with the same account used in Expo Go, then retry `npx expo start`.

#### The camera or gallery cannot be used

- Make sure camera or media library permission has been granted.
- Close and reopen Expo Go after changing permissions.
- Try an image from the gallery if the device camera is unavailable.

#### ELA does not finish

- Very large images may take longer to process.
- An image without base64 data or a failed WebView is shown as `error`/`unavailable`.
- Wait for the 12-second timeout before repeating the scan.
- Try a lower-resolution image for local testing.

#### The lender is not found

The list is a limited snapshot. The input should match an application name or company name listed in the snapshot. Verify the result directly through official OJK channels.

## ⚠️ Known Limitations

- The OJK list is a **July 2026 snapshot** from a secondary source, not data fetched in real time from `ojk.go.id`.
- Refreshed signed data packs are published manually by the maintainer.
- ELA is **less effective for PNG images** and images that have been screenshotted or compressed repeatedly.
- The **duplicate detection database is limited**. `data/knownScamHashes.js` is a placeholder and does not yet contain a curated real-world scam dataset.
- The **duplicate detection scope is self-contained**: it only compares against the user's own scan history and the bundled sample set, not a broader external database.
- All analysis results are **probabilistic signals**, not certainty.
- ELA and duplicate matching thresholds are **heuristics** and require calibration with real test data.
- The **OJK legality snapshot can change**; new entities, revoked entities, or renamed entities are not automatically reflected.
- The app **does not use user accounts or login**; scan history is stored locally per device and is not synced or backed up.
- **iOS builds were not tested as standalone apps**; development and testing were done exclusively through Expo Go, since the team primarily uses iOS devices.
- The **standalone Android APK has only been tested on an emulator** (Android Studio, Pixel 6, API 37.2), not yet on a physical Android device.

## 🗺️ Roadmap / Future Work

- Add **AI-generated image detection** using a validated pretrained model.
- Add **quantum-inspired or tensor-train model compression** for lighter on-device processing.
- A signed update channel exists. Scheduled refresh from an official source remains future work.
- **Physical device testing** for the standalone Android APK, beyond the current emulator-only testing.

## 🔒 Security & Privacy

- Core analysis runs fully offline with bundled data. The app can optionally download a public, signed data file and uses it only if the signature is valid.
- Qerity never sends images, lender names, or scan history.
- **No accounts, no login.** There is no user registration, authentication, or server-side user data.
- Images are processed temporarily on the device and are not stored by the app. Opt-in scan history stores metadata locally.
- **Local-only storage.** Scan history is written to `AsyncStorage` on the device and is not transmitted.
- **No analytics or tracking.** The app does not integrate third-party analytics, crash reporting, or advertising SDKs.
- Automatic updates can be switched off in the About screen.
- **Demo hygiene:** when demonstrating the app, avoid entering real personal data in test images or lender name inputs.
- For the full threat model and security roadmap, see [SECURITY.md](SECURITY.md).

## 👥 Meet the Team

<table>
<tr>
<td align="center" width="33%">
<img src="https://drive.google.com/uc?export=view&id=17JzgCaF45gCTXnlIglXVKpq05sTQq5Vx" width="144" height="180"/><br/>
<a href="https://github.com/Arieslana01"><b>Muhammad Aris Maulana</b></a><br/>
<i>Universitas Diponegoro</i>
</td>
<td align="center" width="33%">
<img src="https://drive.google.com/uc?export=view&id=1rPzNkUuXtFebZFcrLa7c-ZtZlSnxa0jX" width="144" height="180"/><br/>
<a href="https://github.com/narazla"><b>Nazla Azzahra Hermana</b></a><br/>
<i>Universitas Diponegoro</i>
</td>
<td align="center" width="33%">
<img src="https://drive.google.com/uc?export=view&id=1kbe9CbYZBaLMgQ-PSwiz179-lZVjKZ9v" width="144" height="180"/><br/>
<a href="https://github.com/ladyfanning001"><b>Ladya Kalascha</b></a><br/>
<i>Universitas Diponegoro</i>
</td>
</tr>
</table>

---

Built for **HackNusa 2026**  
**Telkom University x Kaspersky**
