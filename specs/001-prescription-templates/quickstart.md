# Quickstart: Prescription Templates Implementation

## Where to Start

All code lives in `index.html`. Find the `<script type="text/babel">` section and follow these steps:

### 1. Add State Variables

Near the existing `useState` calls (around line 612), add:

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `activeTab` | `'calculator' \| 'prescriptions'` | `'calculator'` | Which tab is shown |
| `prescriptions` | `PrescriptionTemplate[]` | `[]` | All templates (built-in + user) |
| `showPrescriptionModal` | boolean | `false` | Show editor modal |
| `editingPrescription` | `PrescriptionTemplate \| null` | `null` | Template being edited (null=new) |
| `viewingPrescription` | `PrescriptionTemplate \| null` | `null` | Template being viewed |
| `prescriptionSearch` | string | `''` | Search text |
| `prescriptionCategory` | `'all' \| 'viral' \| ...` | `'all'` | Category filter |
| `prescriptionSpecies` | `'all' \| 'cat' \| 'dog' \| 'both'` | `'all'` | Species filter |
| `showApplyDialog` | boolean | `false` | Show Apply to Patient UI |
| `appliedWeight` | string | `''` | Patient weight input |
| `appliedSpecies` | `'cat' \| 'dog' \| ''` | `''` | Patient species input |

### 2. Add Built-in Templates Array

After `DEFAULT_MEDICATIONS` (around line 688), add the `BUILTIN_TEMPLATES` array with the 8 protocol templates. Each template follows the data model in `data-model.md`.

### 3. Add localStorage Load/Save Functions

Add a load function in `useEffect` (alongside existing localStorage loading, around line 632) and a save wrapper similar to `saveMedications`.

### 4. Add Tab Navigation UI

In the return JSX (around line 915, above the Category Filter Tabs), add a tab bar with two buttons controlled by `activeTab`.

### 5. Build the PrescriptionsTab Component

Add these sub-components (inside the App function or as new component functions):

```
- PrescriptionsTab       → main container (conditional render based on activeTab)
- PrescriptionCard       → template card in list view
- PrescriptionDetail     → modal detail view
- PrescriptionEditor     → full-screen add/edit form
- ApplyToPatientDialog   → weight input + calculated summary
```

### 6. CSS Additions

Add styles for:
- `.prescription-tab-bar` — tab navigation styling
- `.template-card` — card styles matching existing glass design
- `.apply-summary` — print-friendly summary sheet
- `@media print` — hide chrome, show only prescription content

## Implementation Order (Recommended)

1. **State + built-in data** — add state variables and `BUILTIN_TEMPLATES` array
2. **Tab navigation** — add the tab UI and conditional rendering
3. **Template list view** — render cards from built-in templates, add search/filter
4. **Template detail modal** — show full template details on card click
5. **Template editor** — add/edit/create template forms (share with detail modal)
6. **localStorage persistence** — save/load user templates
7. **Apply to Patient** — weight prompt, dose calculation, summary sheet
8. **Print support** — `window.print()` with `@media print` CSS
9. **Dark mode polish** — verify all new UI renders with `.dark` class

## Key Functions to Reuse

| Existing Function | How to Reuse |
|------------------|--------------|
| `getCategory(med)` | For template category display |
| `calculateDosage()` | Logic for dose calculation (extract to a shared `calcDose(drug, weight)` helper) |
| `toggleDarkMode` | Dark mode already works; ensure new components use `darkMode` state |
| Modal patterns | Follow existing `showAddModal` / `showDeleteConfirm` patterns for template modals |
| Button styles | Use same glass/emerald button classes from header |
| Search/filter logic | Copy pattern from `filteredMeds` useMemo (line 731) for template filtering |

## Built-in Template Data (8 protocols)

Define these as a `const BUILTIN_TEMPLATES = [...]` array. Each has `is_builtin: true` and includes:
- FPV (cat, viral)
- FCV (cat, viral)
- Feline Herpesvirus (cat, viral)
- CPV (dog, viral)
- Ringworm (both, fungal)
- Canine Distemper (dog, viral)
- Otitis Externa (both, bacterial)
- URI – Dog (dog, bacterial)

Each should reference existing drug IDs where possible (Cefotaxime=id:2, Metoclopramide=id:25, etc.) for dose calculation support.
