import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

const saveUserProfile = async (firebaseUser) => {
  if (!firebaseUser?.uid) {
    return false;
  }

  try {
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      {
        uid: firebaseUser.uid,
        email: firebaseUser?.email || "",
        name: firebaseUser?.displayName || "",
        picture: firebaseUser?.photoURL || "",
        provider: "google",
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    if (error?.code === "permission-denied") {
      console.warn("Profile sync skipped due to Firestore rules.");
      return false;
    }
    throw error;
  }
};

export const useGoogleAuth = ({ onSuccess, onError }) => {
  return async () => {
    try {
      const provider = new GoogleAuthProvider();
      const authResult = await signInWithPopup(auth, provider);
      const firebaseUser = authResult?.user;

      if (!firebaseUser?.uid) {
        throw new Error("FIREBASE_AUTH_SYNC_FAILED");
      }

      const profileSynced = await saveUserProfile(firebaseUser);

      const userData = {
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "Traveler",
        picture: firebaseUser.photoURL || "",
        uid: firebaseUser.uid,
        firebaseSynced: true,
        profileSynced,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      if (onSuccess) {
        onSuccess(userData);
      }
    } catch (error) {
      localStorage.removeItem("user");
      if (onError) {
        onError(error);
      }
      console.error("Google sign-in error:", error);
    }
  };
};
