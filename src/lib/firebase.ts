import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore (using custom database ID if specified in config)
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Helper for Google Sign-In with popup
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Optionally save user profile doc
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

// Helper for Sign-Out
export const signOutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
};

export { onAuthStateChanged };
export type { User };
