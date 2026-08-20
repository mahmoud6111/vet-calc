# InVet - App Launch & Development Memory Log

This document records the complete setup, configurations, credentials, live URLs, and Google Play Store publishing status for **InVet - Dosage Calculator**.

---

## 1. App Identity & Android Build Configuration

- **App Name**: InVet - Dosage Calculator
- **Package Name (Application ID)**: com.invet
- **Current Version**: 1.0.1
- **Current Version Code**: 3
- **Target SDK**: API Level 35 (Android 15)
- **Min SDK**: API Level 22 (Android 5.1)
- **Architecture**: Web App bundled with Capacitor 6 for Android & iOS.
- **Repository**: [github.com/mahmoud6111/vet-calc](https://github.com/mahmoud6111/vet-calc) (branch: main)

---

## 2. Release Bundles & Keystore Details

- **Release App Bundle (AAB)**: InVet-Dosage-Calculator-release.aab
- **Release APK**: InVet-Dosage-Calculator-release.apk
- **Keystore File**: ndroid/app/invet-release-key.jks *(Ignored in git for security)*
- **Key Alias**: invet-key
- **Key Password**: invet2026pass
- **Store Password**: invet2026pass

---

## 3. Live URLs & Public Endpoints

- **Live Privacy Policy (GitHub Pages)**: https://mahmoud6111.github.io/vet-calc/privacy-policy.html
- **Contact Email**: mahmoudmazen854@gmail.com
- **Web App (Vercel)**: https://vet-idrug.vercel.app/
- **Google Play Closed Testing Opt-in Link**: https://play.google.com/apps/testing/com.invet
- **Google Group for Testers**: https://groups.google.com/g/invet-testers

---

## 4. Google Play Store Listing & Assets

- **Category**: Medical / Productivity
- **Tags**: Medical, Veterinary, Tools, Calculator, Offline
- **Short Description**: Accurate veterinary drug dosage calculator with 1000+ medications.
- **Store Listing Copy**: Maintained in store-assets/STORE_LISTING.md
- **App Icon (512x512)**: store-assets/google-play-icon-512.png
- **Feature Graphic (1024x500)**: store-assets/feature-graphic-1024x500.png
- **Phone Screenshots**: Saved in store-assets/screenshots/
  1. screenshot_1_feline_panleukopenia.png
  2. screenshot_2_dosage_calculation.png
  3. screenshot_3_community_hub.png
  4. screenshot_4_prescription_summary.png
  5. screenshot_5_canine_distemper.png

---

## 5. Google Play Declarations Completed

- **Privacy Policy**: Verified & Live URL provided
- **App Access**: All functionality available without restrictions
- **Ads**: No ads
- **Content Rating**: Rated 3+ / Everyone (Utility & Reference)
- **Target Audience**: 18 and over
- **Data Safety**: No user data collected or shared (local calculations)
- **Government / Financial / News / COVID Apps**: Declared as "No"
- **Health Apps Declaration**: Declared under "Other" as a veterinary reference calculator for animals (pets)
- **Advertising ID**: Declared as "No"

---

## 6. Current Status & Next Steps

### Current Stage: 
- **Closed Testing (Alpha Track) is ACTIVE and LIVE on Google Play.**
- Testers who join the Google Group / Email list can download the app directly from Google Play.

### Next Steps:
1. Ensure at least **12 testers** opt in and download the app.
2. Keep the closed test running for **14 consecutive days**.
3. After 14 days, click **"Apply for production"** in the Google Play Console Dashboard to release **InVet** publicly worldwide.
