# Contracts: Vet Community UI/UX Enhancement

**Feature**: 002-vet-community-ui  
**Date**: 2026-08-12  
**Phase**: 1 — Design & Contracts

## Contract Type

This is a single-file React SPA with Firebase backend. Contracts define:
1. Firebase Firestore data schemas (document structures)
2. Firebase Authentication flow
3. React component interfaces (props/state)

---

## 1. Firebase Authentication Contract

### Anonymous Sign-In

**Request**: User opens Community tab for first time
**Response**: Firebase anonymous credential

```javascript
// Input
firebase.auth().signInAnonymously()

// Success Response
{
  user: {
    uid: "string",           // Firebase UID
    isAnonymous: true,
    displayName: null        // Until user sets it
  }
}

// Error Response
{
  code: "auth/operation-not-allowed",
  message: "Anonymous auth not enabled in Firebase project"
}
```

**Preconditions**:
- Anonymous auth enabled in Firebase console
- Firebase initialized with valid config

**Postconditions**:
- User document created in `users/{uid}`
- User can read/write community data

---

## 2. Firebase Firestore Data Contracts

### 2.1 Forum Category Document

**Collection**: `forumCategories`

```javascript
// Read: GET /forumCategories/{categoryId}
{
  "name": "string",           // Required, 1-100 chars
  "description": "string",    // Required, 1-500 chars
  "icon": "string",           // Required, emoji or icon name
  "postCount": "number"       // Computed, non-negative integer
}

// Write: N/A (categories are seeded, not user-writable)
```

**Validation**:
- `name`: Required, 1-100 characters
- `description`: Required, 1-500 characters
- `icon`: Required, non-empty string
- `postCount`: Non-negative integer

---

### 2.2 Forum Post Document

**Collection**: `forumCategories/{categoryId}/posts`

```javascript
// Create: POST /forumCategories/{categoryId}/posts
{
  "title": "string",          // Required, 1-200 chars
  "body": "string",           // Required, 1-10,000 chars
  "authorUid": "string",      // Required, Firebase UID
  "authorName": "string",     // Required, display name
  "createdAt": "timestamp",   // Server timestamp
  "lastActivityAt": "timestamp", // Server timestamp
  "replyCount": 0,            // Computed, default 0
  "deleted": false            // Soft-delete flag, default false
}

// Read: GET /forumCategories/{categoryId}/posts/{postId}
{
  "postId": "string",         // Auto-generated ID
  "categoryId": "string",     // Parent category
  "title": "string",
  "body": "string",
  "authorUid": "string",
  "authorName": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp|null",
  "lastActivityAt": "timestamp",
  "replyCount": "number",
  "deleted": "boolean"
}

// Update (soft-delete): PATCH /forumCategories/{categoryId}/posts/{postId}
{
  "deleted": true             // Only field that can be updated by user
}
```

**Validation**:
- `title`: Required, 1-200 characters
- `body`: Required, 1-10,000 characters
- `authorUid`: Required, must match authenticated user
- `deleted`: Boolean, only true→false transition allowed by user

**Side Effects**:
- On create: Increment `forumCategories/{categoryId}.postCount`
- On soft-delete: Decrement `forumCategories/{categoryId}.postCount`

---

### 2.3 Forum Reply Document

**Collection**: `forumCategories/{categoryId}/posts/{postId}/replies`

```javascript
// Create: POST /forumCategories/{categoryId}/posts/{postId}/replies
{
  "body": "string",           // Required, 1-10,000 chars
  "authorUid": "string",      // Required, Firebase UID
  "authorName": "string",     // Required, display name
  "createdAt": "timestamp",   // Server timestamp
  "deleted": false            // Soft-delete flag, default false
}

// Read: GET /forumCategories/{categoryId}/posts/{postId}/replies/{replyId}
{
  "replyId": "string",        // Auto-generated ID
  "postId": "string",         // Parent post
  "body": "string",
  "authorUid": "string",
  "authorName": "string",
  "createdAt": "timestamp",
  "deleted": "boolean"
}

// Update (soft-delete): PATCH /forumCategories/{categoryId}/posts/{postId}/replies/{replyId}
{
  "deleted": true             // Only field that can be updated by user
}
```

**Validation**:
- `body`: Required, 1-10,000 characters
- `authorUid`: Required, must match authenticated user

**Side Effects**:
- On create: Update parent post's `lastActivityAt`, increment `replyCount`
- On soft-delete: Decrement parent post's `replyCount`

---

### 2.4 Chat Message Document

**Collection**: `chatMessages`

```javascript
// Create: POST /chatMessages
{
  "body": "string",           // Required, 1-5,000 chars
  "authorUid": "string",      // Required, Firebase UID
  "authorName": "string",     // Required, display name
  "createdAt": "timestamp",   // Server timestamp
  "deleted": false            // Soft-delete flag, default false
}

// Read: GET /chatMessages/{messageId}
{
  "messageId": "string",      // Auto-generated ID
  "body": "string",
  "authorUid": "string",
  "authorName": "string",
  "createdAt": "timestamp",
  "deleted": "boolean"
}

// Update (soft-delete): PATCH /chatMessages/{messageId}
{
  "deleted": true             // Only field that can be updated by user
}
```

**Validation**:
- `body`: Required, 1-5,000 characters
- `authorUid`: Required, must match authenticated user

**Real-time Listener**:
```javascript
// Subscribe to chat messages
firebase.firestore()
  .collection('chatMessages')
  .where('deleted', '==', false)
  .orderBy('createdAt', 'asc')
  .onSnapshot(callback)

// Callback receives:
{
  docs: [
    {
      id: "string",
      data: () => ({ body, authorUid, authorName, createdAt, deleted })
    }
  ]
}
```

---

### 2.5 User Profile Document

**Collection**: `users`

```javascript
// Read: GET /users/{uid}
{
  "uid": "string",            // Firebase UID (document ID)
  "displayName": "string",    // Optional, 1-50 chars
  "joinDate": "timestamp",    // Server timestamp
  "postCount": "number",      // Computed
  "messageCount": "number"    // Computed
}

// Update: PATCH /users/{uid}
{
  "displayName": "string"     // Only displayName can be updated
}
```

**Validation**:
- `displayName`: Optional, 1-50 characters, alphanumeric + spaces + hyphens
- `postCount`: Non-negative integer, system-managed
- `messageCount`: Non-negative integer, system-managed

---

## 3. React Component Contracts

### 3.1 CommunityTab (Main Container)

**Props**: None (top-level component)

**State**:
```javascript
{
  activeView: "forums" | "chat",  // Current sub-navigation
  user: Firebase.User | null,      // Authenticated user
  userProfile: UserProfile | null  // User profile from Firestore
}
```

**Children**:
- ForumsView (when activeView === "forums")
- LiveChatView (when activeView === "chat")

---

### 3.2 ForumsView

**Props**:
```javascript
{
  user: Firebase.User,           // Authenticated user
  onSelectPost: (postId) => void // Callback when post selected
}
```

**State**:
```javascript
{
  categories: ForumCategory[],   // List of forum categories
  selectedCategory: string|null, // Selected category ID
  posts: ForumPost[],            // Posts in selected category
  searchQuery: string,           // Current search query
  searchResults: ForumPost[]|null // Search results (null = not searching)
}
```

---

### 3.3 ForumPostView

**Props**:
```javascript
{
  user: Firebase.User,           // Authenticated user
  postId: string,                // Post ID
  categoryId: string,            // Category ID
  onBack: () => void            // Callback to return to list
}
```

**State**:
```javascript
{
  post: ForumPost | null,        // Loaded post data
  replies: ForumReply[],         // Loaded replies
  newReply: string,              // Draft reply text
  isLoading: boolean             // Loading state
}
```

---

### 3.4 LiveChatView

**Props**:
```javascript
{
  user: Firebase.User            // Authenticated user
}
```

**State**:
```javascript
{
  messages: ChatMessage[],       // Chat message history
  newMessage: string,            // Draft message text
  isLoading: boolean,            // Loading state
  isOnline: boolean              // Firebase connection status
}
```

---

### 3.5 UserProfileCard

**Props**:
```javascript
{
  user: {
    displayName: string,
    joinDate: Timestamp,
    postCount: number,
    messageCount: number
  },
  onClose: () => void           // Callback to dismiss card
}
```

**State**: None (pure display component)

---

## 4. Error Response Contract

### Firebase Errors

| Error Code | User-Facing Message |
|------------|---------------------|
| `auth/network-request-failed` | "Connection lost. Check your internet and try again." |
| `permission-denied` | "You don't have permission to perform this action." |
| `not-found` | "The content you're looking for doesn't exist." |
| `already-exists` | "This content already exists." |
| `resource-exhausted` | "Too many requests. Please wait a moment." |
| `failed-precondition` | "Operation failed. Please try again." |
| `unavailable` | "Service temporarily unavailable. Please try again." |

### Validation Errors

| Field Error | User-Facing Message |
|-------------|---------------------|
| Title required | "Please enter a post title." |
| Body required | "Please enter content." |
| Title too long | "Title must be 200 characters or fewer." |
| Body too long | "Content must be 10,000 characters or fewer." |
| Display name invalid | "Display name can only contain letters, numbers, spaces, and hyphens." |
