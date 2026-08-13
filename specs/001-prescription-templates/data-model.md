# Data Model: Prescription Templates

## Overview

The Prescription Templates feature introduces four entities:
1. **PrescriptionTemplate** — a reusable disease protocol
2. **TemplateDrug** — a single medication entry within a template
3. **SupportiveCareItem** — a supportive care instruction within a template
4. **AppliedPrescription** — a transient patient-specific view combining a template with weight and species

## Entity: PrescriptionTemplate

Represents a reusable disease treatment protocol that a veterinarian can browse, apply, or customize.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique identifier (timestamp-based or UUID) |
| `name` | string | yes | Display name of the template (e.g., "Feline Panleukopenia Virus (FPV)") |
| `category` | enum | yes | One of: `viral`, `bacterial`, `fungal`, `parasitic`, `other` |
| `species` | enum | yes | One of: `cat`, `dog`, `both` |
| `icon` | string | no | Emoji icon for visual identification (e.g., "🐱") |
| `description` | string | no | Short description of the protocol |
| `drugs` | TemplateDrug[] | yes | Array of medications in the protocol (min 1) |
| `supportive_care` | string[] | no | Array of supportive care instructions |
| `notes` | string | no | Clinical notes, warnings, or special instructions |
| `created_at` | ISO8601 string | yes | When the template was created |
| `is_builtin` | boolean | yes | `true` for built-in templates (non-deletable); `false` for user-created |

**Validation Rules**:
- `name` must be non-empty
- At least 1 drug required (warn on save if empty)
- `category` must be one of the allowed enum values
- `species` must be one of the allowed enum values
- Built-in templates cannot be deleted (UI hides delete action)

## Entity: TemplateDrug

A single drug entry within a template's treatment protocol.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `drug_id` | string | no | Reference to a drug ID in the existing drug database (optional — enables dose calculation) |
| `drug_name` | string | yes | Display name of the drug (stored as text for portability) |
| `dose_note` | string | yes | Free-text dosing instruction (e.g., "40-50 mg/kg IV q8h") |
| `purpose` | string | no | Clinical reason for including this drug (e.g., "Prevent secondary bacterial infection") |
| `duration` | string | no | Treatment duration (e.g., "5-7 days") |

**Validation Rules**:
- `drug_name` must be non-empty
- `dose_note` must be non-empty
- `drug_id` is optional — if provided, must match a valid drug in the database

## Entity: SupportiveCareItem

A single supportive care instruction within a template.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| (value) | string | no | Free-text instruction (e.g., "IV fluids (Lactated Ringer's or 0.9% NaCl)") |

Stored as a simple array of strings within the template.

## Entity: AppliedPrescription (Transient)

A temporary view generated when a user applies a template to a specific patient.

| Field | Type | Description |
|-------|------|-------------|
| `template` | PrescriptionTemplate | The source template |
| `patient_weight` | number | Patient weight in kg |
| `patient_species` | enum | `cat` or `dog` |
| `applied_drugs` | AppliedDrug[] | Array of drugs with calculated doses |
| `generated_at` | ISO8601 string | When the prescription was generated |

### AppliedDrug

| Field | Type | Description |
|-------|------|-------------|
| `drug_name` | string | Name of the drug |
| `dose_note` | string | Original dose note from template |
| `calculated_min_mg` | number or null | Calculated minimum dose in mg (if matched to database) |
| `calculated_max_mg` | number or null | Calculated maximum dose in mg (if matched to database) |
| `matched_drug_id` | string or null | Drug ID if matched to database |
| `purpose` | string or null | Purpose from template |
| `duration` | string or null | Duration from template |

## Relationships

```
PrescriptionTemplate
 ├── has many → TemplateDrug (ordered list)
 ├── has many → SupportiveCareItem (ordered list, optional)
 └── generates → AppliedPrescription (transient, via "Apply to Patient")
        └── references → Drug (from existing drug database, by drug_id)
```

## State Transitions

```
PrescriptionTemplate states:
  Draft (in editor) → Saved (in localStorage)
  Saved (built-in) → Cloned → Saved (user-created copy)
  Saved (user-created) → Edited → Saved (updated)
  Saved (user-created) → Deleted (removed from localStorage)
  Built-in → [no delete; only clone]
```

## localStorage Schema

Key: `vet_prescriptions_v1`
Value: `PrescriptionTemplate[]` (JSON array of template objects — only user-created + cloned. Built-in templates are hardcoded and merged on load.)

### Load Sequence
1. Load built-in templates from hardcoded array
2. Load user templates from `vet_prescriptions_v1` key
3. Merge: built-ins always present, user templates override by `id` if duplicate
4. Present combined list sorted by `name` (alphabetical)

### Save Sequence
1. Serialize user templates (excluding build-in references) to JSON
2. Write to `vet_prescriptions_v1` localStorage key
3. Handle storage quota errors: display user-friendly message, keep in-memory copy
