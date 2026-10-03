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

Result and lender screens show the active data version and snapshot date. The UI has an expiry warning path, but expired packs are rejected before activation, so the bundled fallback is shown instead of an expired cached pack. This is a deliberate fail-safe: if a cached pack expires while the device is offline, the app falls back to the older bundled snapshot rather than using expired data.

Expo Go development needs a local network connection to the Metro server. A standalone APK does not need Metro.

Verified on an Android Studio emulator (Pixel 6), 3 October 2026, in airplane mode: core analysis and lender check ran without a network connection. Not yet tested on a physical Android device.

## 4. Threat table

| ID | Threat | Attacker goal | Affected component | Current mitigation | Status | Planned improvement |
|---|---|---|---|---|---|---|
| T1 | An image is crafted to evade ELA by being re-saved, screenshotted, PNG, or repeatedly compressed. | Avoid an editing signal. | ELA in `assets/elaHtml.js`; EXIF check in `ResultScreen.js`. | ELA is presented as a signal, has a timeout, and the UI warns that it is less effective for PNG and repeated screenshots. Missing EXIF is neutral by design. The EXIF `Software` field is flagged only if it matches a list of known editing tools; device or OS version strings (for example an iOS version number) are ignored to avoid false positives, so editors not on the list are not flagged. | Partially mitigated | Validate thresholds with a documented image corpus and add complementary analysis. |
| T2 | A lender impersonates a listed name. | Appear to match a legal entity. | `utils/checkLegality.js`. | Names are lowercased, `PT` is removed at the start, punctuation and whitespace are normalized, and exact app or company matches are marked legal. Similarity uses Levenshtein ratio `0.8`, length difference at most `2`, or containment for names of at least `5` characters. Near matches are marked similar, not legal. | Partially mitigated | Add reviewed aliases and stronger entity disambiguation. |
| T3 | The OJK snapshot is stale, incomplete, or tampered with. | Cause an incorrect legality signal. | Bundled list and update channel. | The bundled list is a secondary-source July 2026 snapshot. Updates require a valid Ed25519 signature, schema, date, expiry, and newer version. A refreshed pack is a manual maintainer step: the maintainer builds, reviews, and signs it. The published pack bytes were checked to be identical to the signed file (see section 5). | Partially mitigated | Refresh from an official source on a schedule and review changes. |
| T4 | The known-scam hash set is poisoned or empty. | Avoid duplicate detection or create false matches. | `data/knownScamHashes.js` and pack data. | The current bundled file and published pack contain an empty list, so they cannot provide a useful known-scam corpus. Signed updates protect transport integrity, not content correctness. | Not addressed | Curate and review a real-world hash set; accept community-reported hashes only after multiple independent reports. |
| T5 | A dependency, build, or distributed APK is compromised, including a repackaged or unsigned APK distributed outside GitHub Releases. | Replace analysis logic or the embedded trust key. | npm, Expo/EAS, APK, and distribution. | **Repackaging cannot be prevented for a sideloaded APK**, because a rebuilt APK can replace the embedded public key, and signed packs do not protect against that. We make it detectable by users who verify: each release publishes the APK SHA-256 and the signing-certificate fingerprint (a re-signed APK shows a different certificate), plus a CycloneDX SBOM. Android also refuses to update an installed app with an APK signed by a different certificate. Dependencies are pinned by `package-lock.json` and installed with `npm ci`; CI runs the pack tests, an `npm audit` report, and SBOM generation on every push; Dependabot proposes dependency and GitHub Actions updates. See section 6. There is no automatic detection, most users will not verify, and a hash published on the same page as the APK is weaker if that page is compromised. `npm audit` is report-only and no build provenance is published. | Partially mitigated (detection only, by users who verify) | Distribute through Google Play (Play App Signing); build provenance with GitHub artifact attestations; make `npm audit` a gating check after triage; republish the fingerprint in a second channel (project report and slides); key rotation without a new APK. |
| T6 | WebView content is abused. | Run unexpected content or alter analysis messages. | `react-native-webview` in `ResultScreen.js`. | The WebView receives generated local HTML only, with an image data URI. The HTML posts JSON analysis messages, and the handler accepts only `analysis_done` and `ela_error` fields. There is no remote WebView source. `originWhitelist={['*']}` is broad. | Partially mitigated | Restrict the origin policy and keep the HTML source local and minimal. |
| T7 | Local scan history is exposed. | Read saved scan metadata from the device. | AsyncStorage. | History is optional and images are not stored. The code stores timestamp, dHash, verdict level, lender name if entered, and legality status. AsyncStorage is not encrypted by default. A cached data pack stored in AsyncStorage is re-verified at every startup, so altering it does not change what the app trusts. | Partially mitigated | Use protected storage if history ever contains more than this metadata. |
| T8 | A user treats a low-risk result as proof of safety. | Cause unsafe reliance on a heuristic result. | Result UI and lender UI. | The design uses signal levels rather than a binary safe verdict, shows data version and snapshot date, includes an expiry warning path, and tells users to confirm with OJK. | Partially mitigated | Improve education and add clearer source and freshness context. |
| T9 | The update check leaks privacy through the network. | Observe update activity or correlate a device. | `utils/dataPack.js` and public file host. | It sends two GET requests to `DATA_PACK_BASE_URL/datapack.json` and `/datapack.sig`, with no query parameters, custom headers, images, lender names, scan history, or other user data. It runs at startup at most once per 24 hours. The host can still observe the IP address and request timing. The user can disable automatic updates, after which no request is made. | Partially mitigated | Offer clearer network status and consider a host and delivery model with reduced observability. |

## 5. Data pack trust model

The pack consists of `publish/datapack.json` and a detached base64 `publish/datapack.sig`. The signature covers the exact raw bytes of `datapack.json`. Ed25519 verification provides authenticity and integrity for the signed bytes when the embedded public key is trusted. It does not prove that the content is correct, complete, current, or sourced officially.

The private key is supplied to `scripts/sign-pack.mjs` through `QERITY_PRIVATE_KEY_PATH` and should live outside the repository. The repository ignores private key patterns such as `*.pem`, `*.key`, and `keys/`. The public key is embedded in `data/publicKey.js`.

The client rejects a bad signature, malformed JSON, a schema mismatch, invalid pack shape, an expired pack, and a version that is not newer during an update. It stores `highestSeenVersion` and rejects rollback below or equal to that value. A cached pack is re-verified at startup. Any failure leaves the bundled data active.

The signature covers raw bytes, so line-ending conversion by Git would invalidate it. The repository sets `publish/* -text` in `.gitattributes` to prevent this. On 3 October 2026 the files served by GitHub raw were compared with the local signed files and their SHA-256 hashes matched.

The current published pack is:

- Version: `2`
- Issued: `2026-10-03T00:02:13.266Z`
- Expires: `2027-01-01T00:02:13.266Z`
- Source name: `OJK licensed lender list (secondary source)`
- Snapshot date: `2026-07-01`
- Source note: `July 2026 snapshot from a secondary source, not fetched from ojk.go.id`
- SHA-256 `datapack.json`: `7C9ECDB7748AC79FE549C10A66E8DA27CE312F6AFDF025D7F439664B9665CE78`
- SHA-256 `datapack.sig`: `A2CBA88DC6128BDD5116E6F9398209BDB80F4F1A804395B794C46DD45F34D2AC`

A changed pack must use a higher version number. Never overwrite a published version, because installed apps reject the same or a lower version.

## 6. Release integrity and supply chain (T5)

### 6a. Chain of trust and its weak point

```
public key (embedded in APK) -> verifies signature -> data pack -> lender legality result
```

The signed pack protects data in transit, but its trust ends at the APK. An attacker can unpack the APK, replace `data/publicKey.js` with their own key, publish a pack that marks scam lenders as legal, re-sign the APK with their own certificate, and distribute it. The modified app would verify its own packs successfully. Qerity is distributed as a sideloaded APK, so this cannot be prevented by the app itself. An in-app self-check would not help because a repackaged app can remove it.

### 6b. What each release publishes

| Item | Purpose | Where |
|---|---|---|
| APK SHA-256 | Detect a modified or corrupted file | Release notes, `README.md` |
| Signing-certificate SHA-256 | Detect an APK re-signed by someone else | Release notes, `README.md` |
| `sbom.json` (CycloneDX, production dependencies) | Record exactly which packages are shipped | Release assets |

Current release (`qerity-v2.apk`, 3 October 2026, built with EAS preview profile):

- APK SHA-256: `4777C692F8BB9A6FA55F14C110BCF60EFF57B9313A78D88A4F1696B1F1A8871A`
- Signing certificate SHA-256: `4cf678e76265efef3227a3afc25ca4072a0414db00ba6a7095d00098839bbc55` (the certificate subject is empty because the keystore was generated by EAS, so the fingerprint is the only identity)

Verify with `Get-FileHash .\qerity-v2.apk -Algorithm SHA256` and `apksigner verify --print-certs qerity-v2.apk`. The fingerprint should stay the same across releases while the same keystore is used. A change is a warning sign unless the keystore was deliberately replaced. The keystore must be backed up and never deleted from EAS without reason.

Limits: these checks detect problems only for users who perform them. Publishing values next to the APK is weaker if that page is compromised, which is why they are also in the README and planned for the report and slides.

### 6c. Dependency hygiene

- `package-lock.json` pins versions; builds and CI use `npm ci`, which fails if the lockfile and `package.json` disagree.
- `.github/workflows/ci.yml` runs on every push and pull request: install from lockfile, run `npm run test:pack`, produce an `npm audit` report, and generate the SBOM as a build artifact.
- `.github/dependabot.yml` proposes weekly npm and GitHub Actions updates.
- `tweetnacl` (pack signature verification) is pinned to an exact version. Any change to it should be reviewed by hand.
- The project does not use `expo-updates`; the only update mechanism is the signed data pack described in section 5.

### 6d. `npm audit` triage (3 October 2026)

`npm audit --omit=dev` reported 23 findings (16 high, 7 moderate) from three root advisories:

| Advisory | Severity | Reached through | Role of that path |
|---|---|---|---|
| `braces` (stack-exhaustion DoS on deeply nested patterns) | High | `expo` > `@expo/cli` > `@expo/metro-file-map` > `micromatch` | Bundler and file watcher |
| `node-forge` (RSA PKCS#1 v1.5 signature verification) | High | `expo` > `@expo/cli` > `@expo/code-signing-certificates` | Expo CLI code signing |
| `uuid` (missing buffer bounds check) | Moderate | `expo` > `@expo/config-plugins` > `xcode` | iOS project prebuild |

`npm ls braces node-forge uuid` shows these packages are reached only through Expo build tooling (`@expo/cli`, `@expo/config-plugins`), not through the application's own code or its runtime libraries. Pack signature verification in Qerity uses `tweetnacl` (Ed25519), not `node-forge`. This is a dependency-path analysis; it is not a proof of what is inside the APK bundle.

The suggested fix, `npm audit fix --force`, would install `expo@44.0.6`, a breaking change far below the SDK used here, and was not applied. The residual risk is in the build environment (developer machine and EAS), not on the installed app, which is another reason to protect the maintainer accounts. Findings are tracked by Dependabot and the CI audit report until Expo releases updated dependencies.

## 7. Maintainer runbook

Use Windows PowerShell from the repository root.

First-time key generation (once):

```powershell
node scripts/gen-keys.mjs C:\Users\<you>\qerity-keys\data-pack-private.pem
```

Publishing a new pack (increase the version every time):

```powershell
node scripts/build-pack.mjs --version <next number> --expiry-days 90 --source-name "OJK licensed lender list (secondary source)" --note "<what changed and where it came from>"
$env:QERITY_PRIVATE_KEY_PATH = 'C:\Users\<you>\qerity-keys\data-pack-private.pem'
node scripts/sign-pack.mjs
npm run test:pack
```

Publish `publish/datapack.json` and `publish/datapack.sig` together, then compare the SHA-256 of the files served by GitHub raw with the local files. Update the pack block in section 5 and `README.md`.

Publishing a new APK:

```powershell
eas build --platform android --profile preview
Get-FileHash .\qerity-v2.apk -Algorithm SHA256
apksigner verify --print-certs .\qerity-v2.apk
npx @cyclonedx/cyclonedx-npm --omit dev --output-file sbom.json
```

Attach the APK and `sbom.json` to the GitHub Release and write both hashes in the notes. Do not rebuild or replace the file after publishing the hash.

Back up the private key outside the repository. Never commit key files. If the private key leaks, rotate it and ship a new APK because the public key is embedded in the app.

## 8. Out of scope in this version

- AI-generated image detection.
- Quantum-inspired model compression.
- iOS standalone build.
- A backend service, user accounts, and server-side scan processing.
- Scheduled official OJK refresh.
- A curated known-scam hash corpus.
- Google Play distribution and build provenance attestations.

## 9. Security roadmap

In priority order:

1. Google Play distribution (Play App Signing) and build provenance, the real mitigation for repackaged APKs (T5).
2. Make `npm audit` a gating CI check after triaging findings, and review Dependabot updates.
3. Schedule refresh from an official OJK source, for example with GitHub Actions, with human review before signing.
4. Add key rotation support (old key signs the new key) without requiring a new APK.
5. Curate and review a real-world scam-hash set, and accept community-reported hashes only after multiple independent reports.
6. Use protected storage for scan history if it ever holds more than metadata.
7. Restrict the WebView origin policy (T6).

## 10. Reporting a vulnerability

Open a private GitHub security advisory for this repository or contact the maintainer through the repository profile.
