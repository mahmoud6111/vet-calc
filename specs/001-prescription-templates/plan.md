# Implementation Plan: Prescription Templates

**Branch**: `001-prescription-templates` | **Date**: 2026-05-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-prescription-templates/spec.md`

## Summary

Add a "Prescriptions" tab alongside the existing drug calculator, enabling vets to browse, create, and apply multi-drug disease protocol templates. The feature includes 8 built-in templates (FPV, FCV, CPV, Ringworm, etc.) with a template editor, search/filter, "Apply to Patient" dose calculation, and print support — all stored in localStorage for fully offline operation.

## Technical Context

**Language/Version**: JavaScript (ES6+) via Babel standalone transpiler  
**Primary Dependencies**: React 18 (production UMD builds via vendor/react*.min.js), Tailwind CSS (vendor/tailwind.js), Babel standalone (vendor/babel.min.js)  
**Storage**: localStorage (JSON-serialized) — existing keys: `vetiDrugMedications`, `vetiDrugFavorites`, `vetiDrugDarkMode`  
**Testing**: Manual (single-file app, no test framework present)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) + Android via Capacitor  
**Project Type**: Single-page web application (single-file React SPA in `index.html`)  
**Performance Goals**: Template list filtering renders in under 1 second for 28+ templates; all interactions are instant since data is local  
**Constraints**: Fully offline-capable (service worker via sw.js); single-user; no network requests; localStorage quota (~5-10MB)  
**Scale/Scope**: ~8 built-in templates + unlimited user-created templates; single HTML file app

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The `.specify/memory/constitution.md` is a template with placeholder values — no actual constitutional constraints are defined. All gates pass by default.

## Project Structure

### Documentation (this feature)

```text
specs/001-prescription-templates/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This is a single-file React application. All code lives in `index.html`. The feature adds new React components, state, and CSS within the same file — no new files are created in the source tree.

```text
index.html              # Single-file React SPA — all changes go here
├── <head>              # Meta tags, CSS styles, vendor scripts
└── <body>
    ├── <div id="root">
    └── <script type="text/babel">
        ├── DEFAULT_MEDICATIONS    # Existing drug database (83+ drugs)
        ├── BUILTIN_TEMPLATES      # NEW: 8 built-in prescription templates
        ├── Calculator component   # Existing drug calculator
        └── PrescriptionsTab       # NEW: Templates list, editor, detail view
    </script>
```

**Structure Decision**: Single-file SPA — follow existing pattern of adding state, JSX, and CSS directly into `index.html` without additional files. No project restructuring needed.

## Complexity Tracking

No constitution violations — not applicable.
