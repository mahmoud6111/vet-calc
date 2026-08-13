# Quickstart: Vet Community UI/UX Enhancement

**Feature**: 002-vet-community-ui  
**Date**: 2026-08-12  
**Phase**: 1 — Design & Contracts

## Overview

This quickstart guide covers the essential steps to implement the Vet Community UI/UX Enhancement feature. It provides a high-level implementation order and key code snippets.

## Prerequisites

1. **Firebase Project Setup**:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Anonymous Authentication in Authentication > Sign-in method
   - Create a Firestore database in Firestore > Database
   - Enable Firestore persistence in Firestore > Settings

2. **Firebase Config**:
   - Copy Firebase config object from Project Settings > General > Your apps
   - Store in `firebaseConfig` variable in `index.html`

## Implementation Order

### Phase A: Firebase Integration (Day 1)

1. **Add Firebase SDK to `<head>`**:
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
   ```

2. **Initialize Firebase**:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   
   firebase.initializeApp(firebaseConfig);
   const db = firebase.firestore();
   const auth = firebase.auth();
   ```

3. **Enable Firestore Persistence**:
   ```javascript
   db.enablePersistence().catch((err) => {
     console.warn("Firestore persistence unavailable:", err.code);
   });
   ```

4. **Implement Anonymous Auth**:
   ```javascript
   const signInAnonymously = async () => {
     try {
       const result = await auth.signInAnonymously();
       return result.user;
     } catch (error) {
       console.error("Auth failed:", error);
       return null;
     }
   };
   ```

### Phase B: Seed Forum Categories (Day 1)

5. **Create Seed Function**:
   ```javascript
   const CATEGORIES = [
     { id: "dosage-qa", name: "Dosage Q&A", description: "Ask and answer drug dosage questions", icon: "💊" },
     { id: "small-animals", name: "Small Animals", description: "Discussions about cats, dogs, and other small animals", icon: "🐱" },
     { id: "large-animals", name: "Large Animals", description: "Discussions about horses, cattle, and other large animals", icon: "🐴" }
   ];
   
   const seedCategories = async () => {
     const batch = db.batch();
     CATEGORIES.forEach((cat) => {
       batch.set(db.collection("forumCategories").doc(cat.id), {
         name: cat.name,
         description: cat.description,
         icon: cat.icon,
         postCount: 0
       });
     });
     await batch.commit();
   };
   ```

### Phase C: CommunityTab Component (Day 2)

6. **Create CommunityTab**:
   ```javascript
   const CommunityTab = () => {
     const [activeView, setActiveView] = React.useState("forums");
     const [user, setUser] = React.useState(null);
     
     React.useEffect(() => {
       signInAnonymously().then(setUser);
     }, []);
     
     if (!user) return <div>Loading...</div>;
     
     return (
       <div className="community-tab">
         <div className="sub-nav">
           <button onClick={() => setActiveView("forums")}>Forums</button>
           <button onClick={() => setActiveView("chat")}>Live Chat</button>
         </div>
         {activeView === "forums" && <ForumsView user={user} />}
         {activeView === "chat" && <LiveChatView user={user} />}
       </div>
     );
   };
   ```

### Phase D: ForumsView Component (Day 2-3)

7. **Create ForumsView**:
   ```javascript
   const ForumsView = ({ user }) => {
     const [categories, setCategories] = React.useState([]);
     const [selectedCategory, setSelectedCategory] = React.useState(null);
     const [posts, setPosts] = React.useState([]);
     const [searchQuery, setSearchQuery] = React.useState("");
     const [searchResults, setSearchResults] = React.useState(null);
     
     // Load categories
     React.useEffect(() => {
       const unsub = db.collection("forumCategories").onSnapshot((snap) => {
         setCategories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
       });
       return unsub;
     }, []);
     
     // Load posts when category selected
     React.useEffect(() => {
       if (!selectedCategory) return setPosts([]);
       const unsub = db.collection("forumCategories").doc(selectedCategory)
         .collection("posts")
         .where("deleted", "==", false)
         .orderBy("lastActivityAt", "desc")
         .onSnapshot((snap) => {
           setPosts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
         });
       return unsub;
     }, [selectedCategory]);
     
     // Search across all categories
     const handleSearch = async (query) => {
       setSearchQuery(query);
       if (!query) return setSearchResults(null);
       const snap = await db.collectionGroup("posts")
         .where("deleted", "==", false)
         .limit(1000)
         .get();
       const results = snap.docs.filter((doc) => {
         const data = doc.data();
         return `${data.title} ${data.body}`.toLowerCase().includes(query.toLowerCase());
       });
       setSearchResults(results.map((doc) => ({ id: doc.id, ...doc.data() })));
     };
     
     // Render logic...
   };
   ```

### Phase E: LiveChatView Component (Day 3)

8. **Create LiveChatView**:
   ```javascript
   const LiveChatView = ({ user }) => {
     const [messages, setMessages] = React.useState([]);
     const [newMessage, setNewMessage] = React.useState("");
     
     // Real-time listener
     React.useEffect(() => {
       const unsub = db.collection("chatMessages")
         .where("deleted", "==", false)
         .orderBy("createdAt", "asc")
         .onSnapshot((snap) => {
           setMessages(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
         });
       return unsub;
     }, []);
     
     // Send message
     const handleSend = async () => {
       if (!newMessage.trim()) return;
       await db.collection("chatMessages").add({
         body: newMessage.trim(),
         authorUid: user.uid,
         authorName: user.displayName || `VetUser${user.uid.slice(0, 4)}`,
         createdAt: firebase.firestore.FieldValue.serverTimestamp(),
         deleted: false
       });
       setNewMessage("");
     };
     
     // Render logic...
   };
   ```

### Phase F: Soft-Delete Functionality (Day 4)

9. **Implement Soft-Delete**:
   ```javascript
   const softDeletePost = async (categoryId, postId, userUid) => {
     const postRef = db.collection("forumCategories").doc(categoryId)
       .collection("posts").doc(postId);
     const post = await postRef.get();
     if (post.data().authorUid !== userUid) throw new Error("Unauthorized");
     await postRef.update({ deleted: true });
   };
   
   const softDeleteMessage = async (messageId, userUid) => {
     const msgRef = db.collection("chatMessages").doc(messageId);
     const msg = await msgRef.get();
     if (msg.data().authorUid !== userUid) throw new Error("Unauthorized");
     await msgRef.update({ deleted: true });
   };
   ```

### Phase G: User Profile Card (Day 4)

10. **Create UserProfileCard**:
    ```javascript
    const UserProfileCard = ({ uid, onClose }) => {
      const [profile, setProfile] = React.useState(null);
      
      React.useEffect(() => {
        const unsub = db.collection("users").doc(uid)
          .onSnapshot((doc) => {
            setProfile(doc.data());
          });
        return unsub;
      }, [uid]);
      
      if (!profile) return null;
      
      return (
        <div className="profile-card" onClick={onClose}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3>{profile.displayName || "Anonymous Vet"}</h3>
            <p>Joined: {profile.joinDate?.toDate().toLocaleDateString()}</p>
            <p>Posts: {profile.postCount}</p>
            <p>Messages: {profile.messageCount}</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      );
    };
    ```

## Key Integration Points

1. **Add to existing navigation**:
   ```javascript
   // In main App component, add Community tab
   <button onClick={() => setActiveTab("community")}>Community</button>
   ```

2. **Dark mode support**:
   - All new components use Tailwind CSS classes
   - Existing dark mode toggle applies to Community views

3. **Offline indicator**:
   ```javascript
   const [isOnline, setIsOnline] = React.useState(navigator.onLine);
   React.useEffect(() => {
     const handleOnline = () => setIsOnline(true);
     const handleOffline = () => setIsOnline(false);
     window.addEventListener("online", handleOnline);
     window.addEventListener("offline", handleOffline);
     return () => {
       window.removeEventListener("online", handleOnline);
       window.removeEventListener("offline", handleOffline);
     };
   }, []);
   ```

## Testing Checklist

- [ ] Anonymous sign-in works
- [ ] Forum categories load with correct post counts
- [ ] Creating a post increments category post count
- [ ] Replies appear in correct chronological order
- [ ] Real-time chat updates across browser tabs
- [ ] Soft-delete hides content but retains in Firebase
- [ ] Search returns results from all categories
- [ ] Offline indicator shows when Firebase unreachable
- [ ] User profile card shows correct data
- [ ] Dark mode renders correctly

## Firebase Security Rules

Deploy the security rules from `data-model.md` to your Firebase project:
1. Go to Firestore > Rules
2. Paste the rules from the Security Rules Summary section
3. Click "Publish"
