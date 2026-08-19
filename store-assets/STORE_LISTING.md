# Google Play Store Listing Package: InVet-Dosage Calculator

Use this document to copy and paste the required fields into the **Google Play Console** during app submission.

---

## 1. Core Listing Details

### App Name (Max 30 characters)
```
InVet-Dosage Calculator
```
*(Character count: 24 / 30)*

---

### Short Description (Max 80 characters)
```
Fast, offline veterinary drug dosage calculator with 83+ medications for pets.
```
*(Character count: 77 / 80)*

---

### Full Description (Max 4000 characters)
```markdown
InVet-Dosage Calculator is a fast, accurate, and offline-first veterinary clinical calculator designed for practicing veterinarians, vet technicians, and veterinary students. 

Calculate precise drug dosages, fluid therapy rates, constant rate infusions (CRI), and emergency resuscitation protocols in seconds for canine and feline patients.

🐾 KEY FEATURES:

✅ 83+ Essential Veterinary Medications
Instantly search and calculate dosages across key therapeutic categories:
• Emergency & Resuscitation (Epinephrine, Atropine, Naloxone, Lidocaine)
• Analgesics & NSAIDs (Meloxicam, Carprofen, Buprenorphine, Gabapentin)
• Antimicrobials & Antibiotics (Amoxicillin-Clavulanate, Enrofloxacin, Metronidazole)
• Anesthesia & Sedatives (Propofol, Ketamine, Dexmedetomidine, Midazolam)
• Cardiovascular, Respiratory, GI, and Antidotes

✅ Smart Dose Range & Safety Warnings
• Automatically calculates Minimum, Average, and Maximum dosage tiers based on patient body weight.
• Highlights high-risk medications, species-specific contraindications, and organ toxicity notes.

✅ Fast Search & Species Filters
• Filter by Dog 🐕 or Cat 🐱 with one tap.
• Instant search by Generic Name, Brand Name, or Therapeutic Class.
• Mark frequently used drugs as Favorites for rapid access in emergency triage.

✅ Customizable Prescription Templates
• Select standard protocol templates (Post-Op Pain, Canine Infectious Respiratory Disease, Feline URI, etc.).
• Generate printable prescription summaries with one click.

✅ 100% Offline Capability & Dark Mode
• Designed for exam rooms and emergency clinics with zero internet required.
• High-contrast Dark Mode optimized for night shifts and low-light environments.

✅ Veterinary Community Hub
• Connect with fellow veterinary professionals, share clinical advice, and discuss treatment cases.

⚕️ CLINICAL DISCLAIMER:
InVet-Dosage Calculator is intended solely as an educational and clinical reference tool for licensed veterinarians, veterinary technicians, and veterinary healthcare professionals. It does not replace professional veterinary clinical judgment, diagnosis, or patient evaluation. Always verify drug dosages, concentrations, and manufacturer guidelines prior to administration.

Created by Mahmoud Abdelnasser.
```

---

## 2. Store Categorization & Tags

- **Application Type**: App
- **Category**: Medical *(or Tools / Reference)*
- **Tags**: 
  - Medical
  - Veterinary
  - Health & Fitness
  - Calculator
  - Offline

---

## 3. Store Graphical Assets (Located in `store-assets/`)

| Asset Type | File Path | Specifications | Status |
| :--- | :--- | :--- | :--- |
| **App Icon** | `store-assets/google-play-icon-512.png` | 512 x 512 px, 32-bit PNG | ✅ Ready |
| **Feature Graphic** | `store-assets/feature-graphic-1024x500.png` | 1024 x 500 px, JPG or 24-bit PNG | ✅ Ready |
| **Phone Screenshots** | Capture 2-4 screens of the app (Medications list, Drug modal, Prescription print preview) | 16:9 / 9:16 aspect ratio (e.g. 1080 x 1920 or 1080 x 2400) | 📱 Recommended |

---

## 4. App Content Declarations (Google Play Console Checklist)

1. **Privacy Policy URL**:
   - Provide the URL where you host `privacy-policy.html` (e.g. `https://<your-subdomain>.vercel.app/privacy-policy.html` or GitHub Pages).
2. **Ads**:
   - Select: *"No, my app does not contain ads."*
3. **App Access**:
   - Select: *"All functionality is available without special access restrictions."*
4. **Target Audience and Content**:
   - Target age group: Select **18 and over**.
   - Not intentionally targeted to children.
5. **Government / Health Apps**:
   - Select: *"This is not a government app."*
   - Under Health/Medical apps: Declare as reference/educational tool for veterinary professionals.
6. **Data Safety**:
   - Data collection: **No user data is collected or shared with third parties** (all calculations are local).
   - Security practices: Data is stored securely on device.

---

## 5. Keystore Credentials (Keep Safe)

- **Keystore File**: `android/app/invet-release-key.jks`
- **Key Alias**: `invet-key`
- **Store Password**: `invet2026pass`
- **Key Password**: `invet2026pass`
