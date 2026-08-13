# Tasks: Vet Community UI/UX Enhancement

**Feature**: 002-vet-community-ui  
**Date**: 2026-08-12  
**Spec**: [spec.md](spec.md)  
**Plan**: [plan.md](plan.md)

## Summary

Implementation tasks for the Vet Community UI/UX Enhancement feature. Organized by user story priority (P1 → P2 → P3) with independent test criteria for each story.

**Total Tasks**: 35  
**Parallel Opportunities**: 12 tasks  
**Estimated Phases**: 8

---

## Phase 1: Setup

> **Goal**: Initialize Firebase project and add SDK to the app

- [x] T001 Create Firebase project and enable Anonymous Authentication in Firebase console
- [x] T002 Create Firestore database in Firebase console with production mode rules
- [x] T003 Add Firebase SDK scripts (firebase-app, firebase-firestore, firebase-auth) to index.html `<head>`
- [x] T004 Add Firebase config object and initialization code in index.html `<script>` section
- [x] T005 Enable Firestore persistence for offline support

---

## Phase 2: Foundational

> **Goal**: Complete user authentication and seed forum categories

- [x] T006 Implement `signInAnonymously()` function and store user state
- [x] T007 Implement `createUserProfile()` to create user document in Firestore on first sign-in
- [x] T008 Define CATEGORIES constant array (dosage-qa, small-animals, large-animals) with name, description, icon
- [x] T009 Implement `seedCategories()` function to create forum category documents in Firestore
- [x] T010 Implement Firestore security rules for users, forumCategories, forumPosts, forumReplies, chatMessages collections
- [x] T011 Create CommunityTab component shell with activeView state ("forums" | "chat")
- [x] T012 Add "Community" tab button to main app navigation

---

## Phase 3: User Story 1 — Browse and Navigate Forum Categories

> **Goal**: Users can browse forum categories and view posts within each  
> **Independent Test**: Navigate to Community tab, view three category cards, click into each to see posts

- [x] T013 [P] [US1] Create `ForumsView` component with categories state and onSnapshot listener for forumCategories collection
- [x] T014 [P] [US1] Render category cards with name, description, icon, and postCount from Firestore
- [x] T015 [US1] Implement category selection handler to load posts for selected category
- [x] T016 [US1] Create post list view showing posts sorted by lastActivityAt (descending)
- [x] T017 [US1] Implement back button/breadcrumb navigation to return to categories view
- [x] T018 [P] [US1] Add empty state message when category has no posts

---

## Phase 4: User Story 2 — Create and View Forum Posts

> **Goal**: Users can create posts, view post details, and reply to posts  
> **Independent Test**: Create a new post, view it in list, open it, add a reply

- [x] T019 [US2] Create post creation form with title input (max 200 chars) and body textarea (max 10,000 chars)
- [x] T020 [US2] Implement character counter for post body field
- [x] T021 [US2] Implement form validation with inline error messages for required fields
- [x] T022 [US2] Implement `createPost()` function to add document to forumCategories/{categoryId}/posts subcollection
- [x] T023 [US2] Update category postCount atomically on post creation
- [x] T024 [US2] Create `ForumPostView` component to display single post with author, timestamp, title, body
- [x] T025 [US2] Implement reply form and `createReply()` function to add document to posts/{postId}/replies subcollection
- [x] T026 [US2] Update post lastActivityAt and replyCount atomically on reply creation
- [x] T027 [P] [US2] Implement soft-delete for posts and replies (author-only, sets deleted: true)

---

## Phase 5: User Story 3 — Access Live Chat Lounge

> **Goal**: Users can send and receive real-time messages in the General Lounge  
> **Independent Test**: Open Live Chat, send a message, verify it appears in chat history

- [x] T028 [US3] Create `LiveChatView` component with messages state and onSnapshot listener for chatMessages collection
- [x] T029 [US3] Render chat message history with authorName, body, and timestamp in chronological order
- [x] T030 [US3] Implement message input field and send button
- [x] T031 [US3] Implement `sendMessage()` function to add document to chatMessages collection
- [x] T032 [P] [US3] Implement offline indicator showing Firebase connection status
- [x] T033 [P] [US3] Add empty state message when chat has no messages

---

## Phase 6: User Story 4 — Switch Between Forum and Chat Modes

> **Goal**: Users can seamlessly switch between Forums and Live Chat views  
> **Independent Test**: Switch between views multiple times, verify no data loss

- [x] T034 [US4] Implement sub-navigation tabs ("Forums" | "Live Chat") in CommunityTab
- [x] T035 [US4] Preserve scroll position and selected category when switching between views

---

## Phase 7: User Story 5 — View User Profiles and Activity

> **Goal**: Users can view basic profile info by clicking a username  
> **Independent Test**: Click username in post or chat, verify profile card shows correct data

- [x] T036 [US5] Create `UserProfileCard` component with displayName, joinDate, postCount, messageCount
- [x] T037 [US5] Implement onSnapshot listener for user profile document
- [x] T038 [US5] Make usernames clickable in ForumPostView and LiveChatView to show profile card
- [x] T039 [US5] Implement profile card dismiss on outside click or close button

---

## Phase 8: Polish & Cross-Cutting Concerns

> **Goal**: Final polish, search, dark mode, and edge cases

- [x] T040 [P] Implement global forum search using collectionGroup query with client-side filtering
- [x] T041 [P] Ensure all Community views render correctly in dark mode (Tailwind dark: classes)
- [x] T042 [P] Implement Firebase error handling with user-friendly messages for common errors
- [x] T043 [P] Add loading states for async operations (category load, post load, chat load)
- [ ] T044 Verify all views work offline with read-only cached data
- [ ] T045 Test complete user flow: sign-in → browse categories → create post → reply → switch to chat → send message → view profile

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (US1) ──→ Phase 4 (US2)
    ↓
Phase 5 (US3)
    ↓
Phase 6 (US4) ← depends on US1 + US3
    ↓
Phase 7 (US5) ← depends on US2 + US3
    ↓
Phase 8 (Polish)
```

**Independent Stories**:
- US1 (Browse Categories) and US3 (Live Chat) can be developed in parallel after Phase 2
- US2 (Create Posts) depends on US1
- US4 (Mode Switching) depends on US1 + US3
- US5 (User Profiles) depends on US2 + US3

---

## Parallel Execution Examples

### Wave 1 (after Phase 2):
- T013 + T014 (US1 categories) — parallel with — T028 + T029 (US3 chat)

### Wave 2:
- T019-T023 (US2 post creation) — parallel with — T040 + T041 (search + dark mode)

### Wave 3:
- T036-T039 (US5 profiles) — parallel with — T042-T044 (polish)

---

## MVP Scope

**Minimum Viable Product**: Phase 1 + Phase 2 + Phase 3 (US1)

This delivers:
- Firebase integration with anonymous auth
- Forum categories with post counts
- Browse posts within categories
- Basic navigation

**Next Increment**: Phase 4 (US2) — create posts and replies

---

## Validation Checklist

- [x] All tasks have checkbox format: `- [ ] T### [P?] [Story?] Description`
- [x] All tasks have file path in description
- [x] User story tasks have [US1]-[US5] labels
- [x] Setup and Foundational phases have no story labels
- [x] Polish phase has no story labels
- [x] Dependencies clearly defined
- [x] Parallel opportunities identified
- [x] Independent test criteria for each story
