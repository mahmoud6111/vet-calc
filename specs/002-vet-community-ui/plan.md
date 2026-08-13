# Implementation Plan: Vet Community UI/UX Enhancement

**Branch**: `002-vet-community-ui` | **Date**: 2026-08-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/002-vet-community-ui/spec.md`

## Summary

Add a "Community" tab alongside the existing drug calculator and prescriptions, enabling vets to participate in Reddit-style forum discussions (Dosage Q&A, Small Animals, Large Animals) and WhatsApp-style real-time chat (General Lounge). Features include Firebase backend for cloud storage, anonymous authentication, global search, soft-delete, and real-time messaging.

## Technical Context

**Language/Version**: JavaScript (ES6+) via Babel standalone transpiler  
**Primary Dependencies**: React 18 (production UMD builds via vendor/react*.min.js), Tailwind CSS (vendor/tailwind.js), Babel standalone (vendor/babel.min.js), Firebase SDK (Firestore, Authentication)  
**Storage**: Firebase Firestore (cloud database) — collections: `users`, `forumCategories`, `forumPosts`, `forumReplies`, `chatMessages`  
**Testing**: Manual (single-file app, no test framework present)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) + Android via Capacitor  
**Project Type**: Single-page web application (single-file React SPA in `index.html`)  
**Performance Goals**: Forum search results in under 2 seconds for 1,000+ posts; live chat messages appear in under 1 second; mode switch under 500ms  
**Constraints**: Requires Firebase project setup; offline support via Firebase persistence; single-user per device (but multi-user via cloud)  
**Scale/Scope**: Unlimited forum posts and chat messages (Firebase scalable); single HTML file app with Firebase SDK additions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution file exists — all gates pass by default.

## Project Structure

### Documentation (this feature)

```text
specs/002-vet-community-ui/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This is a single-file React application. All code lives in `index.html`. The feature adds new React components, state, and CSS within the same file, plus Firebase SDK integration.

```text
index.html              # Single-file React SPA — all changes go here
├── <head>              # Meta tags, CSS styles, vendor scripts, Firebase SDK
└── <body>
    ├── <div id="root">
    └── <script type="text/babel">
        ├── DEFAULT_MEDICATIONS    # Existing drug database (83+ drugs)
        ├── BUILTIN_TEMPLATES      # Existing: 8 built-in prescription templates
        ├── Calculator component   # Existing drug calculator
        ├── PrescriptionsTab       # Existing: Templates list, editor, detail view
        ├── firebaseConfig         # NEW: Firebase initialization config
        ├── CommunityTab           # NEW: Main community container
        ├── ForumsView             # NEW: Forum categories and post lists
        ├── ForumPostView          # NEW: Single post with replies
        ├── LiveChatView           # NEW: Real-time General Lounge chat
        └── UserProfileCard        # NEW: User profile popup component
    </script>
```

**Structure Decision**: Single-file SPA — follow existing pattern of adding state, JSX, and CSS directly into `index.html` without additional files. Firebase SDK loaded via CDN. No project restructuring needed.

## Complexity Tracking

No constitution violations — not applicable.
