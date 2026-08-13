# Feature Specification: Prescription Templates

**Feature Branch**: `001-prescription-templates`
**Created**: 2026-05-26
**Status**: Draft
**Input**: User description: "Prescription Templates Feature for vet clinic app - multi-drug protocol templates with built-in disease regimens, search/filter, apply-to-patient with dose calculation, and print support"

## User Scenarios & Testing

### User Story 1 - Browse and View Built-in Disease Protocols (Priority: P1)

As a veterinarian, I can browse pre-loaded disease protocol templates (such as FPV, Calicivirus, Ringworm) and view the full drug regimen for each, so I don't have to look up each drug individually when treating common conditions.

**Why this priority**: This is the core value proposition — immediate time savings and error reduction on the most common treatments.

**Independent Test**: Can be fully tested by navigating to the Prescriptions tab and confirming all 8 built-in templates are visible, and clicking any template shows its full drug list, dose notes, supportive care, and warnings.

**Acceptance Scenarios**:

1. **Given** the app is opened for the first time, **When** the user navigates to the "Prescriptions" tab, **Then** all 8 built-in disease protocol templates are displayed as cards with name, species badge, category badge, drug count, and description.
2. **Given** the template list is displayed, **When** the user clicks a template card, **Then** a detail view shows the template name, species, category, complete drug list (each with drug name, dose note, purpose, duration), supportive care bullet list, and notes/warnings block.
3. **Given** the template list has many templates, **When** the user types in the search bar, **Then** the list filters to show only templates whose name, species, or category match the search text.

---

### User Story 2 - Apply a Protocol to a Patient and Generate a Printable Summary (Priority: P1)

As a veterinarian, I can apply a disease protocol to a specific patient by entering their weight, see all calculated drug doses in a single summary view, and print the complete prescription, so I can quickly generate and share treatment plans.

**Why this priority**: This is the primary workflow — taking a template and producing actionable patient-specific output.

**Independent Test**: Can be fully tested by selecting a template, clicking "Apply to Patient", entering a weight, and seeing a single summary sheet with calculated doses for all drugs that have matching entries in the drug database.

**Acceptance Scenarios**:

1. **Given** the user is viewing a template detail, **When** they click "Apply to Patient", **Then** a prompt appears asking for patient weight and species.
2. **Given** the user has entered patient weight and species, **When** they confirm, **Then** a single summary sheet displays all drugs from the protocol: calculated dose in mg for drugs that match the database, and dose note text for all drugs regardless of match.
3. **Given** the summary sheet is displayed, **When** the user clicks "Print", **Then** a browser print dialog opens with a properly formatted prescription document.

---

### User Story 3 - Create, Edit, and Delete Custom Templates (Priority: P2)

As a veterinarian, I can create my own prescription templates for protocols I use frequently, edit them later, and delete the ones I no longer need, so I can tailor the system to my specific practice patterns.

**Why this priority**: Customization empowers users to adapt the tool beyond the built-in protocols, significantly increasing long-term value.

**Independent Test**: Can be fully tested by creating a new template with name, drugs, and supportive care, verifying it appears in the list, editing it, and deleting it — all without affecting built-in templates.

**Acceptance Scenarios**:

1. **Given** the user is on the Prescriptions tab, **When** they click "+ New Prescription", **Then** a full-screen edit form opens with sections for Basic Info (name, species, category, icon, description), Drug List (add/remove rows with drug name, dose note, purpose, duration), Supportive Care (add/remove text items), and Notes.
2. **Given** the user has filled in the edit form, **When** they click "Save", **Then** the template is saved to local storage and appears in the template list.
3. **Given** a user-created template exists, **When** the user clicks the edit icon on its card, **Then** the edit form opens pre-filled with the template's current data.
4. **Given** a user-created template exists, **When** the user clicks the delete icon, **Then** the template is permanently removed after a confirmation prompt.
5. **Given** a built-in template exists, **When** the user views it, **Then** no delete icon is shown; instead a "Clone & Customize" button is provided.

---

### User Story 4 - Clone and Customize Built-in Templates (Priority: P3)

As a veterinarian, I can clone a built-in protocol template and customize it to match my clinic's preferred dosing or add my own notes, so I can adapt standard protocols without losing the original.

**Why this priority**: This enables personalization while preserving the authoritative built-in templates as reference.

**Independent Test**: Can be fully tested by clicking "Clone & Customize" on a built-in template, verifying the edit form opens pre-filled with the built-in data, saving under a new name, and confirming the original built-in template remains unchanged.

**Acceptance Scenarios**:

1. **Given** the user is viewing a built-in template, **When** they click "Clone & Customize", **Then** the edit form opens pre-filled with all data from the built-in template, with a new name suggested.
2. **Given** the user saves a cloned template, **When** they return to the template list, **Then** both the original built-in template and the new customized version appear.

---

### Edge Cases

- What happens when a drug name in a template does not match any entry in the drug database? The summary sheet shows the dose note text as a fallback and clearly indicates no calculation was available.
- How does the system handle an empty drug list in a template? Templates with zero drugs should warn the user before saving, and the detail view should show an empty state message.
- What happens when local storage is full or unavailable? The system should display a clear error message when saving fails and preserve the existing data in memory for the current session.
- How are duplicate template names handled? The system should allow duplicate names (vets may want multiple versions of the same protocol with different notes), but the list should sort by name and show timestamps to differentiate.
- What happens when a built-in template's drug database references are removed (if drugs are deleted)? The template should still display the stored drug_name text; the dose calculation for that drug simply falls back to showing the dose_note without a computed mg amount.

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a top-level tab navigation allowing users to switch between the existing Drug Calculator and the new Prescriptions view.
- **FR-002**: System MUST pre-load 8 built-in prescription templates (FPV, FCV, Feline Herpesvirus, CPV, Ringworm, Canine Distemper, Otitis Externa, URI – Dog) on first launch.
- **FR-003**: Built-in templates MUST be marked as non-deletable and MUST display a "Clone & Customize" action instead of a delete action.
- **FR-004**: Users MUST be able to view a template's full details including name, species, category, drug list (with dose notes, purpose, duration for each), supportive care items, and notes/warnings.
- **FR-005**: Users MUST be able to create new prescription templates by providing name, species, category, icon, description, a dynamic list of drugs (each with drug name, dose note, purpose, duration), a dynamic list of supportive care items, and notes.
- **FR-006**: Users MUST be able to edit existing templates (both built-in and user-created) via a pre-filled form.
- **FR-007**: Users MUST be able to delete user-created templates permanently after a confirmation step.
- **FR-008**: Users MUST be able to filter the template list by category (All, Viral, Bacterial, Fungal, Parasitic, Other).
- **FR-009**: Users MUST be able to filter the template list by species (All, Cat, Dog, Both).
- **FR-010**: Users MUST be able to search templates by name, species, or category using a text search bar.
- **FR-011**: System MUST provide a patient weight/species input when "Apply to Patient" is clicked.
- **FR-012**: System MUST generate a single summary sheet displaying all drugs from the template with calculated doses (in mg) for drugs that have matching entries in the drug database, and dose notes for all drugs.
- **FR-013**: System MUST provide a "Print" function on the summary sheet that opens a browser print dialog with a properly formatted prescription document.
- **FR-014**: When a drug in a template has no matching entry in the drug database, the summary MUST display the dose note text and clearly indicate that a calculated dose is unavailable.
- **FR-015**: All template data MUST persist in local storage and be available offline across browser sessions.
- **FR-016**: Templates with zero drugs MUST warn the user before saving and display an empty state in the detail view.
- **FR-017**: The Prescriptions tab and all its modals MUST render correctly in both light and dark mode.

### Key Entities

- **PrescriptionTemplate**: A reusable disease protocol containing metadata (name, species, category, icon, description, notes, creation timestamp, built-in flag) and two collections: a drug list and a supportive care list.
- **TemplateDrug**: A single medication entry within a template, storing the drug display name, an optional reference to the drug database, the dose instruction (free text), the clinical purpose, and the treatment duration.
- **SupportiveCareItem**: A single supportive care instruction (free text) within a template, such as "IV fluids" or "Keep patient warm".
- **AppliedPrescription**: A transient patient-specific view generated when a template is applied, combining the template drugs with patient weight and species to produce calculated doses where possible.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A veterinarian can navigate to the Prescriptions tab, find a specific disease protocol, and view its full drug regimen in under 30 seconds with no training.
- **SC-002**: Users can complete the "create a new custom template" workflow (open form, fill all fields, save) in under 3 minutes.
- **SC-003**: All 8 built-in templates appear correctly on first launch without any user configuration or setup.
- **SC-004**: Templates persist across browser sessions — closing and reopening the app shows all saved templates unchanged.
- **SC-005**: The "Apply to Patient" feature produces a complete summary with calculated doses for every drug that has a matching database entry, shown in a single view without requiring the user to open individual drug calculators.
- **SC-006**: Printed prescription summaries contain all drug names, dose notes, calculated amounts (where available), and patient information in a readable format.
- **SC-007**: Template search filtering returns results in under 1 second for the full built-in set plus 20 user-created templates.
- **SC-008**: Users can delete a user-created template in under 2 clicks and receive visible confirmation before permanent removal.

## Assumptions

- **Language**: The UI for the Prescriptions tab will be in English. If the app already supports RTL/Arabic in other sections, the Prescriptions tab will follow the same pattern; no separate Arabic translations are required for built-in template content.
- **Frequency field**: The free-text "Dose note" field in each template drug row is sufficient to express dosing frequency (e.g., "40-50 mg/kg IV q8h"). No separate structured frequency field is needed.
- **Icon selection**: A simple emoji text input field is sufficient for choosing a template icon; a full emoji picker is not required.
- **Drug autocomplete**: When adding drugs to a template, the drug name field will offer suggestions from the existing drug database but will also accept free-text entries for drugs not in the database.
- **Drug reordering**: Drug rows in the edit form do not require drag-and-drop reordering; up/down arrow buttons are sufficient if ordering is desired, but it is acceptable to save drugs in the order they were added.
- **Offline operation**: The feature requires no network connectivity; all data is stored and retrieved from local storage.
- **Concurrent usage**: The app is single-user; no data conflict resolution is needed.
- **Existing drug database**: The app already has a drug database with known drug IDs and dose calculation formulas; template drugs reference this database by drug ID where possible.
