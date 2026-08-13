# Data Model: Vet Community UI/UX Enhancement

**Feature**: 002-vet-community-ui  
**Date**: 2026-08-12  
**Phase**: 1 — Design & Contracts

## Entity Relationship Diagram

```
┌─────────────────┐
│      users      │
├─────────────────┤
│ uid (PK)        │
│ displayName     │
│ joinDate        │
│ postCount       │
│ messageCount    │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────┐
│      forumCategories        │
├─────────────────────────────┤
│ categoryId (PK)             │
│ name                        │
│ description                 │
│ icon                        │
│ postCount                   │
└────────┬────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────┐
│      forumPosts             │
├─────────────────────────────┤
│ postId (PK)                 │
│ categoryId (FK)             │
│ title                       │
│ body                        │
│ authorUid (FK → users)      │
│ authorName                  │
│ createdAt                   │
│ updatedAt                   │
│ lastActivityAt              │
│ replyCount                  │
│ deleted                     │
└────────┬────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────┐
│      forumReplies           │
├─────────────────────────────┤
│ replyId (PK)                │
│ postId (FK → forumPosts)    │
│ body                        │
│ authorUid (FK → users)      │
│ authorName                  │
│ createdAt                   │
│ deleted                     │
└─────────────────────────────┘

┌─────────────────────────────┐
│      chatMessages           │
├─────────────────────────────┤
│ messageId (PK)              │
│ body                        │
│ authorUid (FK → users)      │
│ authorName                  │
│ createdAt                   │
│ deleted                     │
└─────────────────────────────┘
```

## Entity Definitions

### 1. users

Represents a community user profile. Created on first anonymous sign-in.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| uid | string | Yes | — | Firebase Authentication UID (anonymous) |
| displayName | string | No | "VetUser{XXXX}" | User's chosen display name |
| joinDate | timestamp | Yes | serverTimestamp() | When the user first authenticated |
| postCount | number | Yes | 0 | Computed count of user's forum posts |
| messageCount | number | Yes | 0 | Computed count of user's chat messages |

**Validation Rules**:
- `displayName`: 1-50 characters, no special characters except spaces and hyphens
- `postCount`: Non-negative integer, incremented on post creation
- `messageCount`: Non-negative integer, incremented on message send

**State Transitions**:
- Created: On first anonymous sign-in
- Updated: When user sets display name, or when post/message counts change

---

### 2. forumCategories

Predefined forum category. Three categories seeded on first load.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| categoryId | string | Yes | — | Unique category identifier |
| name | string | Yes | — | Display name (e.g., "Dosage Q&A") |
| description | string | Yes | — | Brief description of category purpose |
| icon | string | Yes | — | Emoji or icon identifier |
| postCount | number | Yes | 0 | Computed count of non-deleted posts |

**Predefined Categories**:

| categoryId | name | description | icon |
|------------|------|-------------|------|
| dosage-qa | Dosage Q&A | Ask and answer drug dosage questions | 💊 |
| small-animals | Small Animals | Discussions about cats, dogs, and other small animals | 🐱 |
| large-animals | Large Animals | Discussions about horses, cattle, and other large animals | 🐴 |

**Validation Rules**:
- `name`: 1-100 characters
- `description`: 1-500 characters
- `postCount`: Non-negative integer, incremented/decremented on post create/soft-delete

---

### 3. forumPosts

A user-created discussion thread within a category.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| postId | string | Yes | auto-generated | Unique post identifier |
| categoryId | string | Yes | — | Parent category reference |
| title | string | Yes | — | Post title (1-200 characters) |
| body | string | Yes | — | Post content (1-10,000 characters) |
| authorUid | string | Yes | — | Firebase UID of post author |
| authorName | string | Yes | — | Display name at time of posting |
| createdAt | timestamp | Yes | serverTimestamp() | When the post was created |
| updatedAt | timestamp | No | — | When the post was last edited |
| lastActivityAt | timestamp | Yes | serverTimestamp() | Last reply or edit timestamp |
| replyCount | number | Yes | 0 | Computed count of non-deleted replies |
| deleted | boolean | Yes | false | Soft-delete flag |

**Validation Rules**:
- `title`: 1-200 characters, required
- `body`: 1-10,000 characters, required
- `replyCount`: Non-negative integer
- `deleted`: Boolean, default false

**State Transitions**:
- Created: When user submits new post
- Updated: When user edits post or receives reply (updates `lastActivityAt`)
- Soft-deleted: When author sets `deleted: true`

**Indexes**:
- Composite: `categoryId` + `lastActivityAt` (descending) — for category post list
- Composite: `deleted` + `lastActivityAt` — for filtering deleted posts
- Collection group: `posts` across all categories — for global search

---

### 4. forumReplies

A response to a forum post.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| replyId | string | Yes | auto-generated | Unique reply identifier |
| postId | string | Yes | — | Parent post reference |
| body | string | Yes | — | Reply content (1-10,000 characters) |
| authorUid | string | Yes | — | Firebase UID of reply author |
| authorName | string | Yes | — | Display name at time of posting |
| createdAt | timestamp | Yes | serverTimestamp() | When the reply was created |
| deleted | boolean | Yes | false | Soft-delete flag |

**Validation Rules**:
- `body`: 1-10,000 characters, required
- `deleted`: Boolean, default false

**State Transitions**:
- Created: When user submits reply
- Soft-deleted: When author sets `deleted: true`

**Side Effects**:
- On create: Update parent post's `lastActivityAt` and increment `replyCount`
- On soft-delete: Decrement parent post's `replyCount`

---

### 5. chatMessages

A single message in the global General Lounge chat.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| messageId | string | Yes | auto-generated | Unique message identifier |
| body | string | Yes | — | Message content (1-5,000 characters) |
| authorUid | string | Yes | — | Firebase UID of message author |
| authorName | string | Yes | — | Display name at time of posting |
| createdAt | timestamp | Yes | serverTimestamp() | When the message was sent |
| deleted | boolean | Yes | false | Soft-delete flag |

**Validation Rules**:
- `body`: 1-5,000 characters, required
- `deleted`: Boolean, default false

**State Transitions**:
- Created: When user sends message
- Soft-deleted: When author sets `deleted: true`

**Indexes**:
- Composite: `createdAt` (ascending) — for chronological chat display
- Composite: `deleted` + `createdAt` — for filtering deleted messages

---

## Query Patterns

### Forum Queries

1. **Get categories with post counts**:
   ```
   forumCategories collection, ordered by name
   ```

2. **Get posts in category** (sorted by most recent activity):
   ```
   forumCategories/{categoryId}/posts
   where deleted == false
   orderBy lastActivityAt desc
   ```

3. **Get post with replies**:
   ```
   forumCategories/{categoryId}/posts/{postId} (single read)
   forumCategories/{categoryId}/posts/{postId}/replies
   where deleted == false
   orderBy createdAt asc
   ```

4. **Global search** (client-side):
   ```
   collectionGroup('posts')
   where deleted == false
   limit 1000
   Filter client-side by title/body contains query
   ```

### Chat Queries

5. **Get chat messages** (real-time):
   ```
   chatMessages collection
   where deleted == false
   orderBy createdAt asc
   onSnapshot listener
   ```

### User Queries

6. **Get user profile**:
   ```
   users/{uid} (single read)
   ```

7. **Get user's posts**:
   ```
   collectionGroup('posts')
   where authorUid == {uid}
   where deleted == false
   orderBy createdAt desc
   ```

---

## Data Volume Assumptions

| Entity | Expected Volume | Growth Rate |
|--------|-----------------|-------------|
| users | 100-10,000 | Slow (new sign-ups) |
| forumCategories | 3 (fixed) | None |
| forumPosts | 100-10,000 | Medium (10-50/day) |
| forumReplies | 500-50,000 | Medium (50-200/day) |
| chatMessages | 1,000-100,000 | High (100-500/day) |

**Storage Estimates**:
- Average post: ~2KB (title + body + metadata)
- Average reply: ~1KB
- Average chat message: ~0.5KB
- 10,000 posts + 50,000 replies + 100,000 messages ≈ 170KB (well within Firebase free tier)

---

## Security Rules Summary

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read any profile, write only their own
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
    
    // Forum categories are public read, no write (seeded data)
    match /forumCategories/{categoryId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Forum posts: public read, author write, soft-delete only
    match /forumCategories/{categoryId}/posts/{postId} {
      allow read: if resource.data.deleted == false;
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == resource.data.authorUid
                    && request.resource.data.deleted == true;
      allow delete: if false;
    }
    
    // Forum replies: public read, author write, soft-delete only
    match /forumCategories/{categoryId}/posts/{postId}/replies/{replyId} {
      allow read: if resource.data.deleted == false;
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == resource.data.authorUid
                    && request.resource.data.deleted == true;
      allow delete: if false;
    }
    
    // Chat messages: public read, author write, soft-delete only
    match /chatMessages/{messageId} {
      allow read: if resource.data.deleted == false;
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == resource.data.authorUid
                    && request.resource.data.deleted == true;
      allow delete: if false;
    }
  }
}
```
