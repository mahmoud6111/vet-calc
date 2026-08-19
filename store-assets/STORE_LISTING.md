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
Accurate veterinary drug dosage calculator with 1000+ medications.
```
*(Character count: 66 / 80)*

---

### Full Description (Max 4000 characters)
```markdown
InVet-Dosage Calculator is a fast, accurate veterinary clinical calculator designed for practicing veterinarians, veterinary technicians, and vet students.

Calculate precise drug dosages, fluid therapy rates, constant rate infusions (CRI), and emergency resuscitation protocols in seconds for canine and feline patients.

KEY FEATURES:

• 1000+ Veterinary Medications & Formulations
Instantly search and calculate dosages across key therapeutic categories:
- Emergency & Resuscitation (Epinephrine, Atropine, Naloxone, Lidocaine)
- Analgesics & NSAIDs (Meloxicam, Carprofen, Buprenorphine, Gabapentin)
- Antimicrobials & Antibiotics (Amoxicillin-Clavulanate, Enrofloxacin, Metronidazole)
- Anesthesia & Sedatives (Propofol, Ketamine, Dexmedetomidine, Midazolam)
- Cardiovascular, Respiratory, Gastrointestinal, and Antidotes

• Smart Dose Range & Safety Warnings
- Automatically calculates Minimum, Average, and Maximum dosage tiers based on patient body weight.
- Displays species-specific contraindications, concentration options, and toxicity notes.

• Species Filters & Fast Search
- Filter by Dog or Cat with one tap.
- Instant search by Generic Name, Brand Name, or Therapeutic Class.
- Mark frequently used drugs as Favorites for rapid clinical access.

• Clinical Protocol & Prescription Templates
- Access standard treatment protocols (FPV, Canine Distemper, Post-Op Pain, Feline URI, and more).
- Generate structured prescription summaries.

• Offline Drug Calculation & Dark Mode
- Core drug database and dosage calculations function completely offline without internet.
- High-contrast Dark Mode optimized for low-light clinical environments.

• Veterinary Community Forum
- Connect with veterinary colleagues to discuss clinical cases and share professional insights.

CLINICAL DISCLAIMER:
InVet-Dosage Calculator is intended solely as an educational and clinical reference tool for licensed veterinarians, veterinary technicians, and veterinary healthcare professionals. It does not replace professional veterinary clinical judgment, diagnosis, or patient evaluation. Always verify drug dosages, concentrations, and manufacturer guidelines prior to administration.

Developed by Mahmoud Abdelnasser.
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
