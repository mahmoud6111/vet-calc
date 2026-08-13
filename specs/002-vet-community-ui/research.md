# Research: Vet Community UI/UX Enhancement

**Feature**: 002-vet-community-ui  
**Date**: 2026-08-12  
**Phase**: 0 — Outline & Research

## Research Tasks

### 1. Firebase SDK Integration for Single-File React Apps

**Decision**: Use Firebase JS SDK via CDN (compatibility mode)

**Rationale**: 
- The existing app uses vendor scripts loaded via `<script>` tags (React, Tailwind, Babel)
- Firebase SDK can be loaded the same way via CDN
- Compatibility mode (`firebase/compat`) allows simpler API similar to v8, reducing code complexity
- No build tools required (matches existing architecture)

**Alternatives Considered**:
- Modular Firebase v9+ API: Rejected — requires tree-shaking and build tools not present in this project
- Firebase Admin SDK: Rejected — server-side only, not suitable for client app
- Other backends (Supabase, Appwrite): Rejected — Firebase is most mature for real-time chat and anonymous auth

**Implementation Notes**:
```html
<!-- Add to <head> -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
```

---

### 2. Firebase Anonymous Authentication

**Decision**: Use Firebase Anonymous Auth with optional display name upgrade

**Rationale**:
- Matches spec requirement: "Anonymous auth + optional display name"
- Zero-friction onboarding — users can immediately participate
- Anonymous users get a Firebase UID for soft-delete ownership tracking
- Can upgrade to named profile later without losing data

**Alternatives Considered**:
- Email/password auth: Rejected — too much friction for casual community participation
- Social sign-in only: Rejected — requires third-party account, excludes some users
- No auth (public): Rejected — need UID for soft-delete ownership and user profiles

**Implementation Notes**:
```javascript
firebase.auth().signInAnonymously()
  .then((result) => {
    // result.user.uid available
    // Optional: set display name via updateProfile()
  });
```

---

### 3. Firestore Data Structure for Forums

**Decision**: Use Firestore with flat collection structure

**Rationale**:
- Firestore excels at rapid reads of subcollections
- Forum posts subcollection under each category enables efficient per-category queries
- Chat messages as top-level collection with timestamp ordering for chronological display
- Soft-delete via `deleted: true` flag (not actual deletion) preserves data for audit

**Alternatives Considered**:
- Realtime Database: Rejected — Firestore has better querying, offline support, and scalability
- Nested subcollections (categories > posts > replies): Accepted — replies as subcollection of posts
- Single flat collection with category field: Rejected — less efficient per-category queries

**Data Structure**:
```
users/{uid}
  - displayName: string
  - joinDate: timestamp
  - postCount: number (computed)
  - messageCount: number (computed)

forumCategories/{categoryId}
  - name: string
  - description: string
  - icon: string
  - postCount: number (computed)

forumCategories/{categoryId}/posts/{postId}
  - title: string
  - body: string
  - authorUid: string
  - authorName: string
  - createdAt: timestamp
  - updatedAt: timestamp
  - lastActivityAt: timestamp
  - replyCount: number (computed)
  - deleted: boolean

forumCategories/{categoryId}/posts/{postId}/replies/{replyId}
  - body: string
  - authorUid: string
  - authorName: string
  - createdAt: timestamp
  - deleted: boolean

chatMessages/{messageId}
  - body: string
  - authorUid: string
  - authorName: string
  - createdAt: timestamp
  - deleted: boolean
```

---

### 4. Real-time Chat Implementation

**Decision**: Use Firestore `onSnapshot` listener for real-time chat

**Rationale**:
- Firestore provides real-time listeners that automatically update when data changes
- Simpler than WebSockets or polling
- Built-in offline support — messages queued when offline, synced when online
- Works across devices — all users see same chat

**Alternatives Considered**:
- Realtime Database: Rejected — Firestore preferred for querying and offline support
- Polling: Rejected — not truly real-time, wastes bandwidth
- WebSockets (Socket.io): Rejected — requires separate server, overkill for Firebase project

**Implementation Notes**:
```javascript
const unsubscribe = firebase.firestore()
  .collection('chatMessages')
  .orderBy('createdAt', 'asc')
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        // New message received
      }
    });
  });
```

---

### 5. Forum Search Implementation

**Decision**: Use Firestore composite index + client-side filtering for search

**Rationale**:
- Firestore full-text search is limited — no native full-text indexing
- For 1,000 posts (spec target), client-side filtering is acceptable (< 2 seconds)
- Composite index on `title` + `body` enables prefix matching
- Future enhancement: Algolia or Typesense for true full-text search at scale

**Alternatives Considered**:
- Algolia integration: Rejected — adds external dependency and cost, not needed for current scale
- Elasticsearch: Rejected — overkill, requires separate service
- Firebase Extensions (Search): Rejected — adds complexity, not needed for MVP

**Implementation Notes**:
```javascript
// Load all posts (capped at 1000) and filter client-side
const searchPosts = async (query) => {
  const snapshot = await firebase.firestore()
    .collectionGroup('posts')
    .where('deleted', '==', false)
    .limit(1000)
    .get();
  
  return snapshot.docs.filter(doc => {
    const data = doc.data();
    const searchStr = `${data.title} ${data.body}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });
};
```

---

### 6. Offline Support Strategy

**Decision**: Enable Firebase Firestore persistence for offline caching

**Rationale**:
- Firebase provides built-in offline persistence for web apps
- Enables read-only access to cached data when offline
- Messages queued offline are synced automatically when online
- Matches spec requirement: "offline indicator when Firebase is unreachable"

**Alternatives Considered**:
- Service Worker caching: Rejected — Firebase SDK handles its own caching
- localStorage fallback: Rejected — redundant with Firebase persistence
- No offline support: Rejected — spec requires offline indicator and cached data access

**Implementation Notes**:
```javascript
firebase.firestore().enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open — persistence only works in one tab
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
    }
  });
```

---

### 7. Soft-Delete Implementation

**Decision**: Use `deleted: boolean` flag with filtered queries

**Rationale**:
- Matches spec requirement: "soft-delete (hidden from view, retained in backend)"
- Simple to implement — add flag to documents
- All queries filter by `deleted == false` to hide deleted content
- Data retained for audit purposes

**Alternatives Considered**:
- Hard delete (remove document): Rejected — spec requires retention for audit
- Tombstone documents: Rejected — overkill for this use case
- archiving to separate collection: Rejected — adds complexity, not needed

**Implementation Notes**:
```javascript
// Soft-delete a post
const softDeletePost = async (categoryId, postId) => {
  await firebase.firestore()
    .collection('forumCategories')
    .doc(categoryId)
    .collection('posts')
    .doc(postId)
    .update({ deleted: true });
};

// Query excludes deleted posts
const getPosts = async (categoryId) => {
  return firebase.firestore()
    .collection('forumCategories')
    .doc(categoryId)
    .collection('posts')
    .where('deleted', '==', false)
    .orderBy('lastActivityAt', 'desc')
    .get();
};
```

---

## Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Firebase SDK | CDN + compat mode | Matches existing vendor script pattern |
| Authentication | Anonymous Auth | Zero-friction, UID for ownership |
| Database | Firestore | Better querying, offline support, scalability |
| Real-time | Firestore onSnapshot | Built-in, no separate server |
| Search | Client-side filtering | Sufficient for 1,000 post scale |
| Offline | Firestore persistence | Built-in, handles queuing |
| Deletion | Soft-delete flag | Audit trail, matches spec |

All technical unknowns resolved. Ready for Phase 1 design.
