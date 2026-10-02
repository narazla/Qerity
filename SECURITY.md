# Qerity security and threat model

## 1. Scope and assumptions

Qerity helps users review suspicious pinjol content. It checks image metadata, runs ELA and dHash analysis, and matches an optional lender name against an OJK list.

Qerity has no backend server of its own and no user accounts. Image analysis and lender matching run on the device. The optional data pack check contacts a public file host.

This document describes the current repository code. It does not treat a result as proof that content is safe or genuine.

## 2. Assets

- User images and their temporary base64 representation during analysis.
- Scan history metadata: timestamp, dHash, verdict level, lender name if entered, and legality status.
- Integrity and freshness of the OJK snapshot and known-scam hash set.
- Integrity of the application binary and its embedded public key.
- User trust in the displayed signals and warnings.

## 3. Trust boundaries

- **User device:** holds images during analysis and stores AsyncStorage data.
- **Local WebView:** receives generated HTML and a local image data URI for ELA and dHash.
- **Bundled data files:** provide the fallback OJK list and scam hashes.
- **Update channel:** the public GitHub raw file host serves `datapack.json` and `datapack.sig`.
- **Build and distribution pipeline:** npm dependencies, Expo/EAS configuration, and GitHub Releases or other APK distribution.

### 3a. Offline operation

EXIF analysis, ELA, dHash comparison, lender matching, and scan history work without internet access. The optional update check needs network access. If either pack request fails, times out, or verification fails, the app keeps bundled data and does not crash.

The app starts the update initialization in `App.js` without awaiting it. The normal splash timer still moves to the home screen after 1.8 seconds. Automatic updates can be disabled. When disabled, the update code makes no pack request.

Result and lender screens show the active data version and snapshot date. The UI has an expiry warning path, but expired packs are rejected before activation, so the bundled fallback is shown instead of an expired cached pack.

Expo Go development needs a local network connection to the Metro server. A standalone APK does not need Metro.

Verified on an Android Studio emulator (Pixel 6), 3 October 2026, in airplane mode: core analysis and lender check ran without a network connection. Not yet tested on a physical Android device.

## 4. Threat table

| ID | Threat | Attacker goal | Affected component | Current mitigation | Status | Planned improvement |
|---|---|---|---|---|---|---|
| T1 | An image is crafted to evade ELA by being re-saved, screenshotted, PNG, or repeatedly compressed. | Avoid an editing signal. | ELA in `assets/elaHtml.js`. | ELA is presented as a signal, has a timeout, and the UI warns that it is less effective for PNG and repeated screenshots. Missing EXIF is neutral by design. | Partially mitigated | Validate thresholds with a documented image corpus and add complementary analysis. |
| T2 | A lender impersonates a listed name. | Appear to match a legal entity. | `utils/checkLegality.js`. | Names are lowercased, `PT` is removed at the start, punctuation and whitespace are normalized, and exact app or company matches are marked legal. Similarity uses Levenshtein ratio `0.8`, length difference at most `2`, or containment for names of at least `5` characters. Near matches are marked similar, not legal. | Partially mitigated | Add reviewed aliases and stronger entity disambiguation. |
| T3 | The OJK snapshot is stale, incomplete, or tampered with. | Cause an incorrect legality signal. | Bundled list and update channel. | The bundled list is a secondary-source July 2026 snapshot. Updates require a valid Ed25519 signature, schema, date, expiry, and newer version. A refreshed pack is a manual maintainer step. | Partially mitigated | Refresh from an official source on a schedule and review changes. |
| T4 | The known-scam hash set is poisoned or empty. | Avoid duplicate detection or create false matches. | `data/knownScamHashes.js` and pack data. | The current bundled file is an empty placeholder, so it cannot provide a useful known-scam corpus. Signed updates protect transport integrity, not content correctness. | Not addressed | Curate and review a real-world hash set. |
| T5 | A dependency, build, or distributed APK is compromised, including a repackaged or unsigned APK from GitHub Releases. | Replace analysis logic or the embedded trust key. | npm, Expo/EAS, APK, and distribution. | The update channel exists in builds made from this source. Builds made before this feature do not contain it. Signed packs do not protect a repackaged APK because a rebuilt APK can replace the embedded public key. No release signing or published checksum is present in this repository. | Not addressed | Add release signing, a published SHA-256 checksum, dependency review, and CI checks. |
| T6 | WebView content is abused. | Run unexpected content or alter analysis messages. | `react-native-webview` in `ResultScreen.js`. | The WebView receives generated local HTML only, with an image data URI. The HTML posts JSON analysis messages, and the handler accepts only `analysis_done` and `ela_error` fields. There is no remote WebView source. `originWhitelist={['*']}` is broad. | Partially mitigated | Restrict the origin policy and keep the HTML source local and minimal. |
| T7 | Local scan history is exposed. | Read saved scan metadata from the device. | AsyncStorage. | History is optional and images are not stored. The code stores timestamp, dHash, verdict level, lender name if entered, and legality status. AsyncStorage is not encrypted by default. | Partially mitigated | Use protected storage if history ever contains more than this metadata. |
| T8 | A user treats a low-risk result as proof of safety. | Cause unsafe reliance on a heuristic result. | Result UI and lender UI. | The design uses signal levels rather than a binary safe verdict, shows data version and snapshot date, includes an expiry warning path, and tells users to confirm with OJK. | Partially mitigated | Improve education and add clearer source and freshness context. |
| T9 | The update check leaks privacy through the network. | Observe update activity or correlate a device. | `utils/dataPack.js` and public file host. | It sends two GET requests to `DATA_PACK_BASE_URL/datapack.json` and `/datapack.sig`, with no query parameters, custom headers, images, lender names, scan history, or other user data. It runs at startup at most once per 24 hours. The host can still observe the IP address and request timing. The user can disable automatic updates, after which no request is made. | Partially mitigated | Offer clearer network status and consider a host and delivery model with reduced observability. |

## 5. Data pack trust model

The pack consists of `publish/datapack.json` and a detached base64 `publish/datapack.sig`. The signature covers the exact raw bytes of `datapack.json`. Ed25519 verification provides authenticity and integrity for the signed bytes when the embedded public key is trusted. It does not prove that the content is correct, complete, current, or sourced officially.

The private key is supplied to `scripts/sign-pack.mjs` through `QERITY_PRIVATE_KEY_PATH` and should live outside the repository. The repository ignores private key patterns such as `*.pem`, `*.key`, and `keys/`. The public key is embedded in `data/publicKey.js`.

The client rejects a bad signature, malformed JSON, a schema mismatch, invalid pack shape, an expired pack, and a version that is not newer during an update. It stores `highestSeenVersion` and rejects rollback below or equal to that value. A cached pack is re-verified at startup. Any failure leaves the bundled data active.

The current published pack is:

- Version: `1`
- Issued: `2026-10-02T23:38:27.986Z`
- Expires: `2026-12-31T23:38:27.997Z`
- Source name: `OJK licensed lender list (secondary source)`
- Snapshot date: `2026-10-02`
- Source note: empty

## 6. Maintainer runbook

Use Windows PowerShell from the repository root:

```powershell
node scripts/gen-keys.mjs C:\Users\<you>\qerity-keys\data-pack-private.pem
node scripts/build-pack.mjs --version 1 --expiry-days 90 --source-name "OJK licensed lender list (secondary source)" --note "Reviewed snapshot"
$env:QERITY_PRIVATE_KEY_PATH = 'C:\Users\<you>\qerity-keys\data-pack-private.pem'
node scripts/sign-pack.mjs
npm run test:pack
```

Publish `publish/datapack.json` and `publish/datapack.sig` together. Back up the private key outside the repository. Never commit key files. If the private key leaks, rotate it and ship a new APK because the public key is embedded in the app.

## 7. Out of scope in this version

- AI-generated image detection.
- Quantum-inspired model compression.
- iOS standalone build.
- A backend service, user accounts, and server-side scan processing.
- Scheduled official OJK refresh.
- A curated known-scam hash corpus.
- Release signing and checksum publication.

## 8. Security roadmap

In priority order:

1. Schedule refresh from an official OJK source, for example with GitHub Actions.
2. Add release signing and publish a SHA-256 checksum.
3. Run `npm audit` in CI and review dependency changes.
4. Add key rotation support without requiring a new APK.
5. Curate and review a real-world scam-hash set.
6. Use protected storage for scan history if it ever holds more than metadata.

## 9. Reporting a vulnerability

Open a private GitHub security advisory for this repository or contact the maintainer through the repository profile.
