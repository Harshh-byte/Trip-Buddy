import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { dispatchAuthUserChanged } from "../lib/authEvents";

/**
 * @param {import("firebase/auth").User | null | undefined} firebaseUser
 * @param {string} [provider]
 * @returns {Promise<boolean>}
 */
const saveUserProfile = async (firebaseUser, provider = "google") => {
  if (!firebaseUser?.uid) {
    return false;
  }

  try {
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      {
        uid: firebaseUser.uid,
        email: firebaseUser?.email || "",
        name: firebaseUser?.displayName || "Traveler",
        picture: 
          provider === "google" 
            ? (firebaseUser?.photoURL || "") 
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || firebaseUser.uid)}`,
        provider: provider,
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    const firebaseError = /** @type {{ code?: string }} */ (error);
    if (firebaseError?.code === "permission-denied") {
      return false;
    }
    throw error;
  }
};

/**
 * @param {import("firebase/auth").User} firebaseUser
 * @param {boolean} profileSynced
 * @param {string} provider
 * @param {Function} [onSuccess]
 */
const finalizeLogin = (firebaseUser, profileSynced, provider, onSuccess) => {
  const userData = {
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || "Traveler",
    picture: 
      provider === "google" 
        ? (firebaseUser.photoURL || "") 
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || firebaseUser.uid)}`,
    uid: firebaseUser.uid,
    firebaseSynced: true,
    profileSynced,
  };

  localStorage.setItem("user", JSON.stringify(userData));
  dispatchAuthUserChanged();

  if (onSuccess) {
    onSuccess(userData);
  }
};

/**
 * @param {{
 *  onSuccess?: (user: any) => void,
 *  onError?: (error: unknown) => void
 * }} params
 */
export const useGoogleAuth = ({ onSuccess, onError }) => {
  return async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (!firebaseUser?.uid) {
        throw new Error("FIREBASE_AUTH_FAILED");
      }

      const profileSynced = await saveUserProfile(firebaseUser, "google");
      finalizeLogin(firebaseUser, profileSynced, "google", onSuccess);
    } catch (error) {
      if (onError) onError(error);
    }
  };
};

/**
 * @param {{
 *  onSuccess?: (user: any) => void,
 *  onError?: (error: unknown) => void
 * }} params
 */
export const useEmailAuth = ({ onSuccess, onError }) => {
  return {
    // @ts-ignore
    login: async (email, password) => {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const profileSynced = await saveUserProfile(result.user, "email");
        finalizeLogin(result.user, profileSynced, "email", onSuccess);
      } catch (error) {
        if (onError) onError(error);
      }
    },
    // @ts-ignore
    signup: async (email, password, name) => {
      try {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(result.user, {
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        });
        const profileSynced = await saveUserProfile(result.user, "email");
        finalizeLogin(result.user, profileSynced, "email", onSuccess);
      } catch (error) {
        if (onError) onError(error);
      }
    },
  };
};
