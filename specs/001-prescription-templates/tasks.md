# Tasks: Prescription Templates

**Input**: Design documents from `specs/001-prescription-templates/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated tests requested in the feature specification. This is a single-file React SPA with no test framework.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different sections in the file, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single-file SPA**: All changes go into `index.html` at the repository root
- JavaScript state/variables added near line 612 (existing `useState` calls)
- CSS styles added near line 329 (existing style block)
- Component JSX added in the App component's return statement (near line 833)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for the prescription templates feature — no project setup needed (existing app). This phase provides the foundational data and state.

- [X] T001 [P] Add prescription template state variables in `index.html` near existing useState calls (line ~612): `prescriptions`, `activeTab`, `showPrescriptionModal`, `editingPrescription`, `viewingPrescription`, `prescriptionSearch`, `prescriptionCategory`, `prescriptionSpecies`, `showApplyDialog`, `appliedWeight`, `appliedSpecies`
- [X] T002 [P] Add `BUILTIN_TEMPLATES` array with 8 disease protocol templates after `DEFAULT_MEDICATIONS` in `index.html` (line ~688). Each template follows the PrescriptionTemplate data model: name, category, species, icon, description, drugs array (with drug_id referencing existing drug IDs), supportive_care array, notes, is_builtin: true
- [X] T003 Add template loading/merging logic in `index.html` useEffect (line ~632): load user templates from `vet_prescriptions_v1` localStorage key, merge with `BUILTIN_TEMPLATES`, handle missing/broken localStorage data gracefully
- [X] T004 [P] Add CSS styles for prescription UI in `index.html` style block (add near line ~329): `.template-card`, `.prescription-tab`, `.apply-summary`, `.prescription-detail`, `.editor-section`, `@media print` hide chrome styles, dark mode variants with `.dark` prefix

**Checkpoint**: Foundation ready — built-in template data exists, state is wired, styles are defined. User story implementation can now begin.

---

## Phase 2: User Story 1 — Browse and View Built-in Disease Protocols (Priority: P1) 🎯 MVP

**Goal**: Vets can navigate to a Prescriptions tab, see all 8 built-in disease protocol templates as cards, search/filter them, and click any card to view the full drug regimen.

**Independent Test**: Open the app, click the "Prescriptions" tab, confirm 8 built-in templates appear as cards. Use the search bar. Click a card — the detail view shows drug list, dose notes, supportive care, and notes.

### Implementation for User Story 1

- [X] T005 [P] [US1] Add tab navigation bar between "Drug Calculator" and "Prescriptions" in `index.html` JSX (above category filter tabs, line ~915). Conditionally render existing calculator content vs new prescription content based on `activeTab` state
- [X] T006 [P] [US1] Create template list view with TemplateCard components in `index.html`: display filtered templates as glass cards showing name, icon, species badge, category badge, drug count, description. Add species badge colors and category pill badges matching app design
- [X] T007 [P] [US1] Add search bar and filter controls in `index.html`: search input filtering by name/species/category, category tabs (All/Viral/Bacterial/Fungal/Parasitic/Other), species filter chips (All/Cat/Dog/Both). Wire to `prescriptionSearch`, `prescriptionCategory`, `prescriptionSpecies` state
- [X] T008 [US1] Create PrescriptionDetail modal in `index.html`: full-screen modal showing template name, species badge, category badge, complete drug list (drug_name, dose_note, purpose, duration), supportive care bullet list, notes/warnings block. Action buttons: "Apply to Patient", "Clone & Customize", "Edit", close

**Checkpoint**: User Story 1 is fully functional — vet can browse, search, filter, and view details of all built-in templates independently.

---

## Phase 3: User Story 2 — Apply Protocol to Patient and Generate Printable Summary (Priority: P1)

**Goal**: Vets can click "Apply to Patient" on any template, enter patient weight and species, see calculated doses for all matched drugs in a single summary sheet, and print the prescription.

**Independent Test**: Open a template detail, click "Apply to Patient", enter weight and species. Confirm a single summary sheet displays with calculated dose ranges for drugs that match the drug database, and dose notes for drugs without matches. Click Print — browser print dialog opens.

### Implementation for User Story 2

- [X] T009 [US2] Add ApplyToPatient dialog in `index.html`: step 1 prompts for patient weight (number input) and species (cat/dog selector). Step 2 generates the summary. Store in `appliedWeight` and `appliedSpecies` state. Controlled by `showApplyDialog` state
- [X] T010 [US2] Implement dose calculation logic for template drugs in `index.html`: for each drug in the applied template, search the existing `medications` array by `drug_id` then by `drug_name` (case-insensitive). If matched, compute `minDose = drug.dose_mg_per_kg_min * weight` and `maxDose = drug.dose_mg_per_kg_max * weight`. If unmatched, display dose note text with "Drug not found in database" fallback
- [X] T011 [US2] Create printable prescription summary sheet in `index.html`: formatted list showing patient info (weight, species), each drug with name, calculated dose range (when matched), dose note, purpose, duration. "Print" button calls `window.print()`. Uses `@media print` CSS from T004 to hide app chrome

**Checkpoint**: User Stories 1 and 2 work together — vet can browse protocols and generate patient-specific printable prescriptions.

---

## Phase 4: User Story 3 — Create, Edit, and Delete Custom Templates (Priority: P2)

**Goal**: Vets can create their own prescription templates, edit existing ones, and delete user-created templates.

**Independent Test**: Click "+ New Prescription", fill in name, drugs, supportive care, save. Confirm the new template appears in the list. Click Edit, modify a field, save — changes persist. Click Delete, confirm — template is removed. Built-in templates remain unaffected.

### Implementation for User Story 3

- [X] T012 [P] [US3] Create PrescriptionEditor modal (add new) in `index.html`: full-screen form with Basic Info section (name input, species select, category select, icon text input, description textarea), dynamic Drug List section (add/remove rows with drug name text+autocomplete, dose note, purpose, duration), dynamic Supportive Care section (add/remove text items), Notes textarea. "Save" and "Cancel" buttons
- [X] T013 [US3] Implement edit template flow in `index.html`: edit icon on template cards opens PrescriptionEditor pre-filled with that template's data. Save updates the template in state and localStorage. Built-in and user-created templates can both be edited
- [X] T014 [US3] Implement delete template with confirmation in `index.html`: delete icon shown only on user-created templates (!is_builtin). Click shows confirmation dialog. Confirm removes from state and localStorage. Built-in templates show no delete icon

**Checkpoint**: User Stories 1-3 work together — vet can use built-in protocols, create/edit/delete their own, and apply any template to a patient.

---

## Phase 5: User Story 4 — Clone and Customize Built-in Templates (Priority: P3)

**Goal**: Vets can clone any built-in template and save a customized copy under a new name.

**Independent Test**: View a built-in template, click "Clone & Customize". Editor opens pre-filled with built-in data. Change the name, modify a drug, save. Both the original built-in and the new customized version appear in the list.

### Implementation for User Story 4

- [X] T015 [US4] Add "Clone & Customize" button to PrescriptionDetail modal in `index.html` alongside "Apply to Patient" and "Edit" buttons. Visible on all templates
- [X] T016 [US4] Implement clone flow in `index.html`: clicking "Clone & Customize" opens PrescriptionEditor pre-filled with the template data. On save, generates a new `id` (Date.now()), sets `is_builtin: false`, suggests a modified name (e.g., "My FPV Protocol"). The original template remains unchanged

**Checkpoint**: All user stories are functional — full feature complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure all UI renders correctly in all modes, handle edge cases gracefully.

- [X] T017 [P] Verify and fix dark mode rendering for all new components in `index.html`: ensure TemplateCard, PrescriptionDetail, PrescriptionEditor, ApplyToPatient summary, tab navigation all use existing `.dark` CSS patterns and color variables
- [X] T018 Handle edge cases in `index.html`: empty drug list warning when saving in editor, localStorage `QuotaExceededError` with user-friendly message, duplicate template names allowed (show timestamps), unmatched drugs in Apply flow with clear fallback message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on Phase 1 (T001-T004 must be complete)
- **User Story 2 (Phase 3)**: Depends on Phase 1 + US1 (needs built-in templates + detail view to have "Apply" button context)
- **User Story 3 (Phase 4)**: Depends on Phase 1 (needs template state + localStorage logic). Independent of US1/US2 functionally but US1 list view provides visual validation context
- **User Story 4 (Phase 5)**: Depends on Phase 1 + US1 (needs built-in templates + detail view for the Clone button). Can be implemented independently once Phase 1 is done
- **Polish (Phase 6)**: Depends on Phase 2-5 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup. No dependencies on other stories.
- **User Story 2 (P1)**: Needs US1 detail view UI for the "Apply to Patient" button location. Core logic is independent.
- **User Story 3 (P2)**: Needs Phase 1 localStorage logic for persistence. UI is completely independent of US1/US2.
- **User Story 4 (P3)**: Needs US1 for the detail view, US3 for the editor (reuses PrescriptionEditor). Strongest coupling, implement last.

### Within Each Phase

- Tasks marked [P] can run in parallel within their phase
- Tasks without [P] should run sequentially

### Parallel Opportunities

- **Phase 1**: T001 and T002 and T004 can run in parallel (different sections: state, data, CSS)
- **Phase 2**: T005, T006, T007 can run in parallel (tab nav, cards, search/filter are independent UI)
- **Phase 4**: T012 can run independently (editor is self-contained)

---

## Parallel Example: Phase 1 Setup

```text
# Launch all parallel Setup tasks together:
Task: "T001 Add prescription template state variables in index.html"
Task: "T002 Add BUILTIN_TEMPLATES array in index.html"
Task: "T004 Add CSS styles for prescription UI in index.html"
```

## Parallel Example: Phase 2 (User Story 1)

```text
# Launch all parallel US1 tasks together:
Task: "T005 Add tab navigation bar in index.html JSX"
Task: "T006 Create template list view with cards in index.html"
Task: "T007 Add search bar and filter controls in index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 — both P1)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: User Story 1 (T005-T008) — built-in templates browsable
3. **STOP and VALIDATE**: Navigate to Prescriptions tab, see all 8 templates, view details
4. Complete Phase 3: User Story 2 (T009-T011) — apply to patient with dose calculation and print
5. **STOP and VALIDATE**: Apply a template to a patient, see calculated doses, print summary
6. Deploy/demo if ready — MVP delivers browse + apply features

### Incremental Delivery

1. Setup complete → Foundation ready
2. Add US1 (browse templates) → **MVP checkpoint A** — vet can see and study protocols
3. Add US2 (apply + print) → **MVP checkpoint B** — vet can generate patient prescriptions
4. Add US3 (create/edit/delete) → Powered user can create custom protocols
5. Add US4 (clone & customize) → Complete feature parity
6. Add Polish → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 Setup together
2. Once Setup is done:
   - Developer A: US1 (browse + view) + US2 (apply + print)
   - Developer B: US3 (create/edit/delete editor)
   - Developer C: US4 (clone) + Polish
3. Developer B and C can start their tasks immediately after Phase 1,
   but US4 needs US1's detail view and US3's editor to be complete

---

## Notes

- [P] tasks = different sections in the same file (`index.html`), no merge conflicts if edits are in separate areas
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All paths are `index.html` — the single file that holds the entire app
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
