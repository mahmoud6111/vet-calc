# Contracts: Prescription Templates

## Overview

This is a single-page React application with no external API. The "contracts" are the UI component boundaries and the localStorage schema interface. Each component defines its expected props, state shape, and behavior.

## Component Contracts

### 1. Tab Navigation

```
Props:
  - activeTab: 'calculator' | 'prescriptions'
  - onTabChange: (tab: 'calculator' | 'prescriptions') => void

Behavior:
  - Renders two buttons: "Drug Calculator" and "Prescriptions"
  - Active tab is visually highlighted (same pattern as category filter tabs)
  - Clicking a tab calls onTabChange with the new tab value
  - Only one tab active at a time
```

### 2. PrescriptionsTab (Main Container)

```
Props: none (reads/writes localStorage directly)

Internal State:
  - prescriptions: PrescriptionTemplate[] (merged built-in + user)
  - searchTerm: string
  - categoryFilter: 'all' | 'viral' | 'bacterial' | 'fungal' | 'parasitic' | 'other'
  - speciesFilter: 'all' | 'cat' | 'dog' | 'both'
  - selectedTemplate: PrescriptionTemplate | null (for detail view)
  - showEditor: boolean
  - editingTemplate: PrescriptionTemplate | null (null = new template)
  - showApplyDialog: boolean
  - appliedWeight: string
  - appliedSpecies: 'cat' | 'dog' | ''

Lifecycle:
  - On mount: merge built-in templates with localStorage data
  - On save: serialize to localStorage under 'vet_prescriptions_v1'
```

### 3. TemplateCard

```
Props:
  - template: PrescriptionTemplate
  - onView: (template) => void
  - onEdit: (template) => void
  - onDelete: (template) => void
  - onClone: (template) => void

Behavior:
  - Displays: name, icon, species badge, category badge, drug count, description
  - Species badge: "Cat" | "Dog" | "Both" with appropriate color
  - Category badge: colored pill matching category (viral=red, bacterial=green, fungal=purple, etc.)
  - Action icons: 👁 (view) always shown; ✏️ (edit) shown for all; 🗑️ (delete) only for !is_builtin
  - Clicking the card body triggers onView
```

### 4. TemplateDetailView (Modal)

```
Props:
  - template: PrescriptionTemplate
  - onClose: () => void
  - onApply: (template) => void
  - onClone: (template) => void
  - onEdit: (template) => void

Sections:
  - Header: name, species badge, category badge
  - Drug List: each drug shows drug_name, dose_note, purpose, duration
  - Supportive Care: bulleted list (if any items)
  - Notes: warning block (if notes present)
  - Actions:
    - "Apply to Patient" button (primary)
    - "Clone & Customize" button
    - "Edit" button
    - Close button
```

### 5. TemplateEditor (Full-screen Modal)

```
Props:
  - template: PrescriptionTemplate | null (null = new, non-null = editing/cloning)
  - onSave: (template) => void
  - onCancel: () => void
  - medications: Drug[] (from existing database, for autocomplete)

Sections:
  1. Basic Info:
     - Name: text input (required)
     - Species: select (cat | dog | both) (required)
     - Category: select (viral | bacterial | fungal | parasitic | other) (required)
     - Icon: text input (emoji)
     - Description: textarea
  2. Drug List:
     - Dynamic rows, each with:
       - Drug name: text input with datalist autocomplete from medications
       - Dose note: textarea (required)
       - Purpose: text input
       - Duration: text input
     - "Add Drug" button appends new row
     - Each row has a "Remove" button
     - Validation: warn if drug_name or dose_note empty
  3. Supportive Care:
     - Dynamic list of text items
     - "Add Item" button
     - Each item has a "Remove" button
  4. Notes: textarea
  5. Actions: Save (primary), Cancel (secondary)
```

### 6. ApplyToPatientDialog

```
Props:
  - template: PrescriptionTemplate
  - medications: Drug[] (full database)
  - onClose: () => void

Behavior:
  - Step 1: Prompt for weight (number input) and species (cat/dog)
  - Step 2: Generate summary sheet:
    - For each drug in template.drugs:
      - Search medications for match (drug_id or drug_name)
      - If matched: calculate minDose = drug.dose_mg_per_kg_min * weight, maxDose = drug.dose_mg_per_kg_max * weight
      - If not matched: show "Dose note only (drug not found in database)"
    - Display as formatted list with drug names, calculated ranges, dose notes
  - "Print" button: triggers window.print()
  - Print styling: @media print CSS hides app chrome, shows only summary
```

## localStorage Contract

### Read Contract
```js
// On app load:
const userTemplates = JSON.parse(localStorage.getItem('vet_prescriptions_v1')) || [];
// Merge with built-ins (hardcoded):
const allTemplates = [...BUILTIN_TEMPLATES, ...userTemplates.filter(t => !t.is_builtin)];
```

### Write Contract
```js
// On save/delete:
const userOnly = allTemplates.filter(t => !t.is_builtin);
localStorage.setItem('vet_prescriptions_v1', JSON.stringify(userOnly));
```

### Error Contract
- `localStorage.setItem` can throw `QuotaExceededError`
- Catch and display: "Unable to save. Storage is full. Please remove some templates."
- Keep data in React state as fallback (no data loss for current session)

## Dose Calculation Contract

```js
function calculateTemplateDose(drug, medications, weight) {
  // 1. Try to match by drug_id (fastest, most reliable)
  let matched = medications.find(m => m.id === drug.drug_id);
  
  // 2. Fall back to name matching
  if (!matched) {
    const name = drug.drug_name.toLowerCase();
    matched = medications.find(m => 
      m.brand_name.toLowerCase().includes(name) ||
      m.generic_name.toLowerCase().includes(name) ||
      name.includes(m.generic_name.toLowerCase())
    );
  }
  
  // 3. Calculate if matched
  if (matched) {
    const minDose = matched.dose_mg_per_kg_min * weight;
    const maxDose = matched.dose_mg_per_kg_max * weight;
    return {
      matched: true,
      matchedDrug: matched,
      minMg: minDose,
      maxMg: maxDose,
      doseNote: drug.dose_note
    };
  }
  
  // 4. Fallback: no calculation
  return {
    matched: false,
    matchedDrug: null,
    minMg: null,
    maxMg: null,
    doseNote: drug.dose_note
  };
}
```
