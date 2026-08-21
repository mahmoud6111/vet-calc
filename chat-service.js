// Real-time Chat Service for Vet Community Q&A using Firebase Firestore
// Configured with real Firebase project: invet-dose-calculator

(function(window) {
  class ChatService {
    constructor() {
      this.db = null;
      this.auth = null;
      this.isFirebaseReady = false;
      this.currentUser = null;
      this.userProfile = null;
      this.initFirebase();
    }

    getFirebaseConfig() {
      // Real Firebase configuration for invet-dose-calculator
      return {
        apiKey: "AIzaSyCGAI7mv6J0uPwwqtPRJNbezS0abi2ko",
        authDomain: "invet-dose-calculator.firebaseapp.com",
        projectId: "invet-dose-calculator",
        storageBucket: "invet-dose-calculator.firebasestorage.app",
        messagingSenderId: "982882285595",
        appId: "1:982882285595:web:909ad812b4a196b320a0be",
        measurementId: "G-32JEBXYDZZ"
      };
    }

    initFirebase() {
      const config = this.getFirebaseConfig();
      try {
        if (window.firebase && window.firebase.apps) {
          if (!window.firebase.apps.length) {
            window.firebase.initializeApp(config);
          }
          if (window.firebase.firestore) {
            this.db = window.firebase.firestore();
            this.isFirebaseReady = true;
            console.log("✅ Firebase Firestore connected successfully to invet-dose-calculator.");
          }
          if (window.firebase.auth) {
            this.auth = window.firebase.auth();
            this.initAnonymousAuth();
          }
        }
      } catch (e) {
        console.warn("Firebase init fallback to local memory mode:", e);
        this.isFirebaseReady = false;
      }
    }

    // Initialize anonymous authentication
    async initAnonymousAuth() {
      if (!this.auth) return;
      
      try {
        // Check if user is already signed in
        if (this.auth.currentUser) {
          this.currentUser = this.auth.currentUser;
          await this.loadUserProfile();
          return;
        }
        
        // Sign in anonymously
        const result = await this.auth.signInAnonymously();
        this.currentUser = result.user;
        console.log("✅ Anonymous auth successful, UID:", result.user.uid);
        await this.createUserProfile();
      } catch (error) {
        console.warn("Anonymous auth failed, using local fallback:", error.code);
        // Generate a local UID for fallback
        this.currentUser = { uid: this.generateLocalUid() };
      }
    }

    // Generate a local UID for fallback mode
    generateLocalUid() {
      let localUid = localStorage.getItem('vetiDrugUserUid');
      if (!localUid) {
        localUid = 'anon_' + Math.random().toString(36).substr(2, 12);
        localStorage.setItem('vetiDrugUserUid', localUid);
      }
      return localUid;
    }

    // Create user profile in Firestore
    async createUserProfile() {
      if (!this.db || !this.currentUser) return;
      
      const userRef = this.db.collection('users').doc(this.currentUser.uid);
      const doc = await userRef.get();
      
      if (!doc.exists) {
        const profile = {
          uid: this.currentUser.uid,
          displayName: '',
          joinDate: new Date().toISOString(),
          postCount: 0,
          messageCount: 0
        };
        await userRef.set(profile);
        this.userProfile = profile;
      } else {
        this.userProfile = doc.data();
      }
    }

    // Load user profile from Firestore
    async loadUserProfile() {
      if (!this.db || !this.currentUser) return;
      
      try {
        const userRef = this.db.collection('users').doc(this.currentUser.uid);
        const doc = await userRef.get();
        if (doc.exists) {
          this.userProfile = doc.data();
        }
      } catch (e) {
        console.warn("Failed to load user profile:", e);
      }
    }

    // Get current user UID
    getCurrentUserUid() {
      if (this.currentUser) return this.currentUser.uid;
      return this.generateLocalUid();
    }

    // Update user display name
    async updateDisplayName(name) {
      if (!this.db || !this.currentUser) return false;
      
      try {
        const userRef = this.db.collection('users').doc(this.currentUser.uid);
        await userRef.update({ displayName: name });
        if (this.userProfile) {
          this.userProfile.displayName = name;
        }
        return true;
      } catch (e) {
        console.warn("Failed to update display name:", e);
        return false;
      }
    }

    // Subscribe to messages in a specific channel
    subscribeToChannel(channelId, callback) {
      if (this.isFirebaseReady && this.db) {
        try {
          return this.db.collection("chats")
            .where("channelId", "==", channelId)
            .limit(100)
            .onSnapshot(snapshot => {
              const messages = [];
              snapshot.forEach(doc => {
                const data = doc.data();
                if (data.deleted !== true) {
                  messages.push({ id: doc.id, ...data });
                }
              });
              messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
              callback(messages);
            }, err => {
              console.warn("Firestore snapshot error, falling back:", err);
              callback(this.getLocalChannelMessages(channelId));
            });
        } catch (e) {
          console.warn("Firestore subscription error:", e);
        }
      }

      // Fallback for local storage / offline test
      const messages = this.getLocalChannelMessages(channelId);
      callback(messages);
      return () => {};
    }

    // === Presence / Online Users Tracking ===
    startPresenceTracking() {
      if (this.presenceStarted) return;
      this.presenceStarted = true;
      this.presenceInterval = null;

      const begin = () => {
        if (!this.isFirebaseReady || !this.db || !this.currentUser) return;
        const uid = this.currentUser.uid;
        const ref = this.db.collection('presence').doc(uid);
        const beat = () => {
          ref.set({
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            displayName: (this.userProfile && this.userProfile.displayName) || ''
          }, { merge: true }).catch(() => {});
        };
        beat();
        this.presenceInterval = setInterval(beat, 20000);
      };

      begin();
      if (!this.currentUser) {
        this.presenceWaitTimer = setInterval(() => {
          if (this.currentUser) {
            clearInterval(this.presenceWaitTimer);
            begin();
          }
        }, 2000);
      }

      this._onVisibility = () => {
        if (document.hidden) {
          if (this.presenceInterval) clearInterval(this.presenceInterval);
          if (this.isFirebaseReady && this.db && this.currentUser) {
            const ref = this.db.collection('presence').doc(this.currentUser.uid);
            ref.set({ lastSeen: new Date(Date.now() - 600000) }, { merge: true }).catch(() => {});
          }
        } else {
          begin();
        }
      };
      this._onBeforeUnload = () => {
        if (this.isFirebaseReady && this.db && this.currentUser) {
          const ref = this.db.collection('presence').doc(this.currentUser.uid);
          ref.set({ lastSeen: new Date(Date.now() - 600000) }, { merge: true }).catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', this._onVisibility);
      window.addEventListener('beforeunload', this._onBeforeUnload);
    }

    stopPresenceTracking() {
      if (this.presenceInterval) clearInterval(this.presenceInterval);
      if (this.presenceWaitTimer) clearInterval(this.presenceWaitTimer);
      if (this._onVisibility) document.removeEventListener('visibilitychange', this._onVisibility);
      if (this._onBeforeUnload) window.removeEventListener('beforeunload', this._onBeforeUnload);
    }

    subscribeToPresence(callback) {
      if (!this.isFirebaseReady || !this.db) {
        callback(null);
        return () => {};
      }

      const ONLINE_WINDOW_MS = 90000;

      return this.db.collection('presence')
        .onSnapshot(snapshot => {
          let count = 0;
          const now = Date.now();
          snapshot.forEach(doc => {
            const data = doc.data();
            if (!data || !data.lastSeen) return;
            let ts = null;
            if (typeof data.lastSeen.toDate === 'function') {
              ts = data.lastSeen.toDate().getTime();
            } else if (data.lastSeen instanceof Date) {
              ts = data.lastSeen.getTime();
            } else {
              ts = new Date(data.lastSeen).getTime();
            }
            if (!isNaN(ts) && (now - ts) < ONLINE_WINDOW_MS) count++;
          });
          callback(count > 0 ? count : 1);
        }, err => {
          console.warn("Firestore presence snapshot error:", err);
          callback(null);
        });
    }

    // Send a new message or reply
    async sendMessage(channelId, user, text, tag = 'General', parentId = null, species = '') {
      const msgData = {
        channelId: channelId,
        author: user.name || "Anonymous Vet",
        title: user.title || "Veterinarian",
        avatar: user.avatar || "🩺",
        text: text.trim(),
        tag: tag,
        species: species || '',
        parentId: parentId || null,
        upvotes: 0,
        upvotedBy: [],
        downvotes: 0,
        downvotedBy: [],
        deleted: false,
        authorUid: this.getCurrentUserUid(),
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };

      if (this.isFirebaseReady && this.db) {
        try {
          await this.db.collection("chats").add(msgData);
          // Update user post count
          await this.incrementUserPostCount();
          return true;
        } catch (e) {
          console.warn("Failed to send message via Firebase, saving locally:", e);
        }
      }

      // Save locally
      this.saveLocalMessage(msgData);
      return true;
    }

    // Increment user post count
    async incrementUserPostCount() {
      if (!this.db || !this.currentUser) return;
      
      try {
        const userRef = this.db.collection('users').doc(this.currentUser.uid);
        await userRef.update({
          postCount: firebase.firestore.FieldValue.increment(1)
        });
      } catch (e) {
        console.warn("Failed to increment post count:", e);
      }
    }

    // Soft-delete a message
    async softDeleteMessage(channelId, messageId) {
      const uid = this.getCurrentUserUid();
      
      if (this.isFirebaseReady && this.db) {
        try {
          const docRef = this.db.collection("chats").doc(messageId);
          const doc = await docRef.get();
          
          if (doc.exists && doc.data().authorUid === uid) {
            await docRef.update({ deleted: true });
            return true;
          }
          return false;
        } catch (e) {
          console.warn("Firebase soft-delete error:", e);
        }
      }

      // Fallback: local storage
      const msgs = this.getLocalChannelMessages(channelId);
      const target = msgs.find(m => m.id === messageId);
      if (target && target.authorUid === uid) {
        target.deleted = true;
        localStorage.setItem('vetiDrugChatMessages_' + channelId, JSON.stringify(msgs));
        window.dispatchEvent(new CustomEvent('vetChatLocalUpdate', { detail: { channelId, messages: msgs } }));
        return true;
      }
      return false;
    }

    // Check if current user can delete a message
    canDeleteMessage(msg) {
      const uid = this.getCurrentUserUid();
      return msg.authorUid === uid;
    }

    // Upvote a message
    async upvoteMessage(channelId, msgId, userKey) {
      if (this.isFirebaseReady && this.db) {
        try {
          const docRef = this.db.collection("chats").doc(msgId);
          await this.db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists) return;
            const data = sfDoc.data();
            const upvotedBy = data.upvotedBy || [];
            if (!upvotedBy.includes(userKey)) {
              upvotedBy.push(userKey);
              transaction.update(docRef, {
                upvotes: (data.upvotes || 0) + 1,
                upvotedBy: upvotedBy
              });
            }
          });
          return true;
        } catch (e) {
          console.warn("Firebase upvote error, fallback to local:", e);
        }
      }

      // Fallback local upvote
      const msgs = this.getLocalChannelMessages(channelId);
      const target = msgs.find(m => m.id === msgId);
      if (target) {
        target.upvotedBy = target.upvotedBy || [];
        if (!target.upvotedBy.includes(userKey)) {
          target.upvotedBy.push(userKey);
          target.upvotes = (target.upvotes || 0) + 1;
          localStorage.setItem('vetiDrugChatMessages_' + channelId, JSON.stringify(msgs));
          window.dispatchEvent(new CustomEvent('vetChatLocalUpdate', { detail: { channelId, messages: msgs } }));
        }
      }
      return true;
    }

    // Downvote a message
    async downvoteMessage(channelId, msgId, userKey) {
      if (this.isFirebaseReady && this.db) {
        try {
          const docRef = this.db.collection("chats").doc(msgId);
          await this.db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists) return;
            const data = sfDoc.data();
            const downvotedBy = data.downvotedBy || [];
            if (!downvotedBy.includes(userKey)) {
              downvotedBy.push(userKey);
              transaction.update(docRef, {
                downvotes: (data.downvotes || 0) + 1,
                downvotedBy: downvotedBy
              });
            }
          });
          return true;
        } catch (e) {
          console.warn("Firebase downvote error, fallback to local:", e);
        }
      }

      const msgs = this.getLocalChannelMessages(channelId);
      const target = msgs.find(m => m.id === msgId);
      if (target) {
        target.downvotedBy = target.downvotedBy || [];
        if (!target.downvotedBy.includes(userKey)) {
          target.downvotedBy.push(userKey);
          target.downvotes = (target.downvotes || 0) + 1;
          localStorage.setItem('vetiDrugChatMessages_' + channelId, JSON.stringify(msgs));
          window.dispatchEvent(new CustomEvent('vetChatLocalUpdate', { detail: { channelId, messages: msgs } }));
        }
      }
      return true;
    }

    // Global search across all channels
    async globalSearch(query) {
      if (!query || query.trim().length === 0) return [];
      
      const searchQuery = query.toLowerCase().trim();
      
      if (this.isFirebaseReady && this.db) {
        try {
          const snapshot = await this.db.collection("chats")
            .limit(1000)
            .get();
          
          const results = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.deleted === true) return;
            const searchText = `${data.text || ''} ${data.author || ''} ${data.tag || ''}`.toLowerCase();
            if (searchText.includes(searchQuery)) {
              results.push({ id: doc.id, ...data });
            }
          });
          
          return results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } catch (e) {
          console.warn("Firebase global search error:", e);
        }
      }

      // Fallback: search local storage
      const allChannels = ['dosage_qa', 'small_animals', 'general'];
      const results = [];
      
      for (const channelId of allChannels) {
        const msgs = this.getLocalChannelMessages(channelId);
        for (const msg of msgs) {
          const searchText = `${msg.text || ''} ${msg.author || ''} ${msg.tag || ''}`.toLowerCase();
          if (searchText.includes(searchQuery)) {
            results.push(msg);
          }
        }
      }
      
      return results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    // Get user profile by UID
    async getUserProfile(uid) {
      if (this.isFirebaseReady && this.db) {
        try {
          const doc = await this.db.collection('users').doc(uid).get();
          if (doc.exists) {
            return doc.data();
          }
        } catch (e) {
          console.warn("Failed to fetch user profile:", e);
        }
      }
      return null;
    }

    // Local Storage Fallback Helpers
    getLocalChannelMessages(channelId) {
      try {
        const stored = localStorage.getItem('vetiDrugChatMessages_' + channelId);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {}

      const defaults = this.getDefaultSampleMessages(channelId);
      localStorage.setItem('vetiDrugChatMessages_' + channelId, JSON.stringify(defaults));
      return defaults;
    }

    saveLocalMessage(msgData) {
      const channelId = msgData.channelId;
      const current = this.getLocalChannelMessages(channelId);
      msgData.id = "local_" + Date.now();
      current.push(msgData);
      localStorage.setItem('vetiDrugChatMessages_' + channelId, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('vetChatLocalUpdate', { detail: { channelId, messages: current } }));
    }

    getDefaultSampleMessages(channelId) {
      const now = Date.now();
      if (channelId === 'dosage_qa') {
        return [
          {
            id: 'sample_1',
            channelId: 'dosage_qa',
            author: 'Dr. Mahmoud',
            title: 'Veterinary Pharmacologist',
            avatar: '🩺',
            text: 'Welcome to the Dosage & Pharmacotherapy Q&A! Post your dosage questions, dilution rates, or fluid therapy calculations here.',
            tag: 'Announcement',
            parentId: null,
            upvotes: 5,
            upvotedBy: ['demo1'],
            deleted: false,
            authorUid: 'sample_user_1',
            timestamp: now - 3600000
          },
          {
            id: 'sample_2',
            channelId: 'dosage_qa',
            author: 'Dr. Sarah',
            title: 'Small Animal Practitioner',
            avatar: '🐱',
            text: 'What is the recommended CRI rate for Metoclopramide in dogs with severe gastrointestinal motility disorders?',
            tag: 'Question',
            parentId: null,
            upvotes: 2,
            upvotedBy: ['demo2'],
            deleted: false,
            authorUid: 'sample_user_2',
            timestamp: now - 1800000
          },
          {
            id: 'sample_2_reply1',
            channelId: 'dosage_qa',
            author: 'Dr. Tarek',
            title: 'Internal Medicine Specialist',
            avatar: '🐕',
            text: 'Standard CRI for Metoclopramide in dogs is 1-2 mg/kg/24h IV continuous infusion (0.04-0.08 mg/kg/hr). Protect solution from light.',
            tag: 'Advice',
            parentId: 'sample_2',
            upvotes: 4,
            upvotedBy: ['demo1', 'demo3'],
            deleted: false,
            authorUid: 'sample_user_3',
            timestamp: now - 900000
          }
        ];
      } else if (channelId === 'small_animals') {
        return [
          {
            id: 'sample_3',
            channelId: 'small_animals',
            author: 'Dr. Youssef',
            title: 'Canine Specialist',
            avatar: '🐕',
            text: 'Share your clinical cases for dogs and cats here.',
            tag: 'Discussion',
            parentId: null,
            upvotes: 1,
            upvotedBy: [],
            deleted: false,
            authorUid: 'sample_user_4',
            timestamp: now - 2000000
          }
        ];
      }
      return [
        {
          id: 'sample_5',
          channelId: 'general',
          author: 'VetCalc Team',
          title: 'System Admin',
          avatar: '🐾',
          text: 'Welcome to the General Veterinary Lounge! Connect with fellow colleagues.',
          tag: 'Welcome',
          parentId: null,
          upvotes: 8,
          upvotedBy: [],
          deleted: false,
          authorUid: 'sample_user_6',
          timestamp: now - 4000000
        }
      ];
    }
  }

  window.VetChatService = new ChatService();
})(window);
