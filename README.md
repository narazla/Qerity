<!-- TODO: add an app screenshot/banner here before submission -->

# Qerity

**Check first, before you trust**

## Disclaimer

> **Disclaimer:** Qerity is an early screening aid, not legal evidence and not proof that content is fraudulent. All analysis results must be verified through official OJK channels and manual review. Qerity does not replace official verification.

## Overview

Qerity is a React Native and Expo mobile application that helps people perform an initial review of suspicious content, such as transfer receipts and illegal online lending testimonials.

The application combines lightweight on-device image forensics with a lender-name check against a bundled snapshot of OJK-listed legal entities. Results are signals for review, not final determinations.

## Core Features

### EXIF metadata check

Qerity checks the EXIF metadata available in the image. Empty metadata or a missing `Software` field is treated as neutral because screenshots and images re-sent through messaging or social media apps often lose EXIF. A populated `Software` field, including nested locations such as `TIFF.Software` or `Exif.Software`, is shown as a signal that deserves review.

The presence of EXIF is not treated as evidence that an image came directly from a camera or was never edited.

### Error Level Analysis (ELA)

ELA runs in a WebView using the Canvas API. The application calculates the average compression difference (`avgDiff`) and the percentage of pixels that exceed a difference threshold. Images with a longest side above 1600 pixels are resized before analysis to reduce the risk of WebView failure on large images.

ELA has a 12-second timeout. If the WebView fails to return a result, the check is shown as `error` rather than as a result with no signal.

### Duplicate/similarity detection

Qerity calculates a 64-bit perceptual dHash in the WebView and compares it using Hamming distance. A distance of up to 10 bits is treated as a similar or duplicate image using a heuristic that can be recalibrated.

The comparison sources are:

- Previous scan hash history stored in AsyncStorage on the user's device.
- The bundled example scam dataset in `data/knownScamHashes.js`.

Saving a hash to history is optional. Not finding a match is not evidence that the image is genuine or unique.

### OJK legality matching

The lender name is normalized and checked against the `app` and `company` fields in the bundled OJK list:

- `legal`: exact name match after normalization.
- `similar`: sufficiently close name based on Levenshtein distance with a limit proportional to string length.
- `not_found`: no match found.
- `skipped`: the user did not enter a lender name.

Inputs that are too short are rejected to reduce false matches. Legality results must still be verified through official OJK channels.

### Out of scope for this version

AI-generated image detection and tensor-train/quantum-inspired compression models are **not implemented** in this version's analysis flow. Both are roadmap/future work, not running PoC features.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile framework | Expo SDK 54 (`expo` `~54.0.34`) |
| UI runtime | React `19.1.0`, React Native `0.81.5` |
| Image input | `expo-image-picker` `~17.0.11` |
| Gradient/UI styling | `expo-linear-gradient` `~15.0.7` |
| Status bar | `expo-status-bar` `~3.0.8` |
| In-app image analysis | `react-native-webview` `13.15.0`, Canvas API, HTML/JavaScript |
| Local scan history | `@react-native-async-storage/async-storage` `^3.1.1` |
| Application entry point | `index.js` with Expo's `registerRootComponent` |
| Package manager | npm, based on `package-lock.json` |

## Repository Structure

```text
qerity/
├── App.js                         # Root navigation between splash, home, result, and about
├── app.json                       # Expo application configuration
├── index.js                       # Entry point Expo
├── package.json                   # npm dependencies and scripts
├── package-lock.json              # npm dependency lockfile
├── .gitignore                     # Local files/folders excluded from Git
├── assets/
│   ├── elaHtml.js                 # WebView HTML/JavaScript for ELA and dHash
│   └── tensorHtml.js              # Tensor compression material/roadmap; not an active analysis flow
├── data/
│   ├── ojkLegalList.js             # OJK legality list snapshot
│   └── knownScamHashes.js          # Placeholder example scam hashes
├── screens/
│   ├── SplashScreen.js             # Splash screen
│   ├── HomeScreen.js               # Image input, lender name, and lender-only check
│   ├── ResultScreen.js             # Check statuses, results, and verdict
│   └── AboutScreen.js              # How the application works
└── utils/
    └── checkLegality.js            # Normalization and lender-name matching against the OJK list
```

## Local Setup

### Prerequisites

Before starting, prepare:

1. **Node.js 20.x LTS** or another LTS version compatible with Expo SDK 54.
2. **npm**, normally installed with Node.js.
3. **Expo Go** on Android or iPhone to run the application through the development server.
4. A laptop and phone on the same Wi-Fi network when using a LAN connection.
5. A USB cable and Android Studio only if you want to run an emulator or native Android locally.

Check the installations:

```bash
node --version
npm --version
```

After installing dependencies, run an additional project check with:

```bash
npx expo-doctor
```

### Clone repository

```bash
git clone https://github.com/narazla/Qerity.git
cd Qerity
```

### Install dependencies

Run this from the folder containing `package.json`:

```bash
npm install
```

### Run the development server

```bash
npx expo start
```

Expo will display a QR code in the terminal or open the Expo Dev Tools page.

### Open on a phone using Expo Go

1. Install or update Expo Go from Google Play Store or the Apple App Store.
2. Make sure the phone and laptop are on the same Wi-Fi network.
3. Run `npx expo start`.
4. Android: open Expo Go and choose **Scan QR code**.
5. iPhone: scan the QR code with the iPhone camera, then open the link with Expo Go.
6. Wait for Metro Bundler to finish loading the JavaScript bundle.
7. Grant camera or gallery permission when the application requests it.
8. Choose a photo, or enter a lender name and press **Check lender with OJK only** to check legality without a photo.

If an office or campus network blocks the LAN connection, run:

```bash
npx expo start --tunnel
```

Tunnel mode is usually slower because traffic passes through Expo's tunnel service.

### Run through an Android emulator

This repository uses the Expo managed workflow and does not include a native `android/` folder. For an emulator, prepare Android Studio, the Android SDK, an active emulator, and the Android environment variables required by React Native/Expo. Then run:

```bash
npx expo start
```

Press `a` in the Expo terminal to try opening the application on the active Android emulator.

### APK standalone

**TODO before submission:** this repository does not yet contain a verified `eas.json` or EAS Build configuration. Therefore, there is no standalone APK command that can be guaranteed to work using the current repository configuration alone.

After the team prepares an Expo account and EAS configuration, the following flow must be verified:

```bash
npx eas login
npx eas build:configure
npx eas build --platform android
```

Do not rely on this section as submission instructions until `eas.json`, the package identifier, and the APK build have been tested on a real device.

### Troubleshooting

#### The QR code cannot be opened

- Make sure the laptop and phone are on the same network.
- Temporarily disable a VPN if it changes local network routing.
- Try `npx expo start --tunnel`.
- Make sure the firewall is not blocking Node.js or Expo.

#### Expo Go reports a version error

- Run `npx expo-doctor`.
- Make sure Expo Go is up to date.
- Make sure the Expo dependencies use the versions in `package.json`, especially Expo SDK `54.0.34`.
- Remove and reinstall dependencies if necessary:

```bash
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

On Windows PowerShell, the equivalent dependency removal commands are:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npx expo start -c
```

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

## Known Limitations

- The OJK list is a July 2026 snapshot from a secondary source, not data fetched in real time from `ojk.go.id`.
- ELA is less effective for PNG images and images that have been screenshotted or compressed repeatedly.
- The duplicate detection database is limited. `data/knownScamHashes.js` is a placeholder and does not yet contain a curated real-world scam dataset.
- AI-generated image detection is not implemented and is on the roadmap.
- Quantum-inspired or tensor-train compression is not implemented and is on the roadmap.
- All analysis results are probabilistic signals, not certainty.
- ELA and duplicate matching thresholds are heuristics and require calibration with real test data.
- The OJK legality snapshot can change; new entities, revoked entities, or renamed entities are not automatically reflected.

## Roadmap / Future Work

- Add AI-generated image detection using a validated pretrained model.
- Add quantum-inspired or tensor-train model compression for lighter on-device processing.
- Add direct sharing integration from WhatsApp.
- Automatically update the OJK list from an official source.
- Populate and curate the scam hash database using verified examples.
- Calibrate ELA and Hamming distance thresholds using a documented test dataset.
- Add reproducible EAS configuration and a standalone APK pipeline.

## Security & Privacy

- Qerity does not send scanned images to an application server. Images are processed temporarily on the device, including through the local WebView for ELA and dHash.
- EXIF metadata is processed locally for the result-screen check.
- Image hashes can optionally be stored in `AsyncStorage` on the user's device to compare future scans.
- The hash history is not sent to a server by the current application code.
- Local storage may be deleted when application data is cleared or the application is uninstalled.
- Do not include unnecessary personal data in lender names or images shared during a demo.

## Meet the Team

<a href="#"><img width="144px" height="180px" src="https://drive.google.com/uc?export=view&id=17JzgCaF45gCTXnlIglXVKpq05sTQq5Vx" alt=""/></a> | <a href="#"><img width="144px" height="180px" src="https://drive.google.com/uc?export=view&id=1m_6xGOwyi8lrIhjr2Q3pqw9OhHdjtyOq" alt=""/></a> | <a href="#"><img width="144px" height="180px" src="https://drive.google.com/uc?export=view&id=1kbe9CbYZBaLMgQ-PSwiz179-lZVjKZ9v" alt=""/></a> |
| --- | --- | --- |
| <div align="left"><h3><b>Muhammad Aris Maulana</b></h3></div> | <div align="left"><h3><b>Nazla Azzahra Hermana</b></h3></div> | <div align="left"><h3><b>Ladya Kalascha</b></h3></div> |

---

Built for **HackNusa 2026**  
**Telkom University x Kaspersky**
