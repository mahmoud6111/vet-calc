# Research: Prescription Templates

## Tech Stack Overview

### Existing Architecture
- **Runtime**: React 18 via UMD production builds (`vendor/react.production.min.js`, `vendor/react-dom.production.min.js`)
- **Transpilation**: Babel standalone (`vendor/babel.min.js`) — JSX is transpiled in-browser on every page load. No build step for JSX. Templates with `type="text/babel"` are compiled at runtime.
- **Styling**: Tailwind CSS (`vendor/tailwind.js`) — utility-first CSS framework loaded via CDN copy. Dark mode via `.dark` class toggle on the container div.
- **State**: React hooks (`useState`, `useEffect`, `useMemo`) — all state is component-local or persisted to localStorage.
- **Persistence**: 3 localStorage keys — `vetiDrugMedications` (drug database), `vetiDrugFavorites` (favorite drug IDs), `vetiDrugDarkMode` (dark mode boolean).

### Dose Calculation Pattern
- Each drug has `dose_mg_per_kg_min` and `dose_mg_per_kg_max` fields
- Calculation: `minDose = dose_mg_per_kg_min * weight`, `maxDose = dose_mg_per_kg_max * weight`
- Some drugs have `dose_mg_per_kg_min: 0` and `dose_mg_per_kg_max: 0`, meaning the dose is per-animal (fixed amount)
- Optional concentration input allows volume calculation from mg/ml
- Route, frequency, notes displayed alongside calculated dose

### Drug Data Model
```js
{
  id: "string",
  brand_name: "string",       // e.g., "Augmentin / Curam"
  generic_name: "string",     // e.g., "Amoxicillin + Clavulanic acid"
  species: "both" | "dog" | "cat",
  dose_mg_per_kg_min: number,
  dose_mg_per_kg_max: number,
  concentration_value: number | null,
  concentration_unit: "string",
  dosage_form: "string",
  route: "string",            // e.g., "PO", "IV/IM"
  unit_description: "string",
  notes: "string",
  frequency: "string"         // e.g., "q8-12h"
}
```

### Categories
- antibiotic, nsaid, gi, probiotic, supplement, topical, other — derived via `getCategory()` based on drug name/notes matching
- Displayed as filter tabs with color badges

### Dark Mode
- Toggled by `darkMode` state variable; stored to `vetiDrugDarkMode` localStorage key
- Applied as class `dark` on wrapper div
- CSS uses `.dark` prefix selectors (e.g., `.dark body`, `.dark .glass`)

### RTL Support
- CSS class `.rtl` defined with `direction: rtl` — applied programmatically

## Key Decisions for Implementation

### Decision 1: New localStorage Key
- **Chosen**: `vet_prescriptions_v1` — following existing naming convention (`vetiDrug*` prefix would be `vetiDrugPrescriptions`, but the spec defined `vet_prescriptions_v1` so we use that)
- **Rationale**: Isolates prescription data from drug database for independent loading/saving
- **Alternatives**: Embedding templates in the existing `vetiDrugMedications` key — rejected because they're a different entity type

### Decision 2: Tab Navigation Pattern
- **Chosen**: New tab bar at the glass card level, above category filters
- **Rationale**: Follows existing tab-like pattern (category filter bar) but at a higher level since it switches the entire view
- **Implementation**: Two buttons ("Drug Calculator" / "Prescriptions") in the header area, toggling `activeTab` state

### Decision 3: Template-Drug Matching
- **Chosen**: Match by `drug_name` (case-insensitive) against both `brand_name` and `generic_name` in the drug database, with optional explicit `drug_id` reference
- **Rationale**: Templates are portable — if a drug changes ID or name slightly, the text fallback preserves the intent
- **Fallback**: If no match found, display dose_note text without calculated mg amount

### Decision 4: Edit Form Pattern
- **Chosen**: Full-screen modal (same pattern as existing Add Drug modal)
- **Rationale**: Consistent UX with existing app; avoids layout issues on mobile

### Decision 5: Built-in Template Loading
- **Chosen**: Hardcode as a JavaScript array in `index.html`, merged with localStorage data on load; built-in flag prevents deletion
- **Rationale**: No network needed; built-ins are always available as reference

### Decision 6: Apply-to-Patient Implementation
- **Chosen**: Single summary sheet — user enters weight, system iterates template drugs, calculates doses for matched drugs, displays all in one scrollable view with a Print button
- **Rationale**: User explicitly requested single summary sheet
- **Print**: Use `window.print()` with `@media print` CSS for formatting

## Technology Choices

| Area | Choice | Rationale |
|------|--------|-----------|
| **State management** | React useState + useMemo | Existing pattern; no need for external libraries |
| **Persistence** | localStorage | Offline-first; existing pattern |
| **ID generation** | Date.now() + Math.random() suffix | Existing pattern for user-created entities |
| **Emoji input** | Plain text input | Simple; existing emoji support on all platforms |
| **Drug autocomplete** | Filtered datalist from existing medications | No external dependencies; lightweight |
| **Print** | `window.print()` + `@media print` CSS | Zero dependencies; works offline |
