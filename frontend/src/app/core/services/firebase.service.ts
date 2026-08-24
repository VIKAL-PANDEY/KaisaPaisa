import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Firestore 
} from 'firebase/firestore';

// Configuration injected from AI Studio Firebase setup
export const firebaseConfig = {
  projectId: "earnest-principle-dfj47",
  appId: "1:670014374537:web:aca66785b40262662efc58",
  apiKey: "AIzaSyAkffqmAPk8VADkb-dnGhZRLS7Bx1VwRlE",
  authDomain: "earnest-principle-dfj47.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-kaisapaisa-a70b5773-2dc6-4fb3-b9fd-5a49c7e59822",
  storageBucket: "earnest-principle-dfj47.firebasestorage.app",
  messagingSenderId: "670014374537"
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;

  constructor() {
    this.app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    this.auth = getAuth(this.app);
    // Specify the provisioned custom Firestore database ID
    this.firestore = getFirestore(this.app, firebaseConfig.firestoreDatabaseId);
  }

  async signInWithGoogle(): Promise<FirebaseUser> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(this.auth, provider);
    const user = credential.user;

    // Save/sync user profile to Firestore
    if (user) {
      try {
        const userRef = doc(this.firestore, 'users', user.uid);
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL,
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore profile sync note:', err);
      }
    }
    return user;
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  async saveTransaction(transaction: any): Promise<string> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return '';
    try {
      const docRef = await addDoc(collection(this.firestore, 'transactions'), {
        ...transaction,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (e) {
      console.warn('Firestore record backup note:', e);
      return '';
    }
  }
}
