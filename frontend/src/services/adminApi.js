import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { dispatchAuthUserChanged } from "../lib/authEvents";

const ADMIN_SEED_SECRET = import.meta.env.VITE_ADMIN_SEED_SECRET;

/**
 * @param {string} email
 * @param {string} password
 */
export const loginAdmin = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;

  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists() || userSnap.data().isAdmin !== true) {
    await signOut(auth);
    throw new Error(
      "Access Denied: You are not authorized as an Administrator.",
    );
  }

  const userData = {
    uid: user.uid,
    email: user.email,
    name: userSnap.data().name || "Administrator",
    picture: userSnap.data().picture || "",
    isAdmin: true,
  };

  localStorage.setItem("admin_user", JSON.stringify(userData));
  localStorage.setItem("user", JSON.stringify(userData));
  dispatchAuthUserChanged();
  return userData;
};

/**
 * @param {string} email
 * @param {string} password
 * @param {string} secretKey
 * @param {string} name
 */
export const seedAdminUser = async (email, password, secretKey, name) => {
  if (secretKey !== ADMIN_SEED_SECRET) {
    throw new Error("Invalid Administrator Secret Key.");
  }

  let user;
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    user = result.user;
  } catch (err) {
    // @ts-ignore
    if (err.code === "auth/email-already-in-use") {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
      } catch (signInErr) {
        if (
          // @ts-ignore
          signInErr.code === "auth/wrong-password" ||
          // @ts-ignore
          signInErr.code === "auth/invalid-credential"
        ) {
          throw new Error(
            "This email is already registered. Please provide the correct password to promote this account to Admin.",
          );
        }
        throw signInErr;
      }
    } else {
      throw err;
    }
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      name: name || "Admin",
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "admin")}`,
      provider: "email",
      isAdmin: true,
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  const userData = {
    uid: user.uid,
    email: user.email,
    name: name || "Admin",
    picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "admin")}`,
    isAdmin: true,
  };

  localStorage.setItem("admin_user", JSON.stringify(userData));
  localStorage.setItem("user", JSON.stringify(userData));
  dispatchAuthUserChanged();
  return userData;
};

export const logoutAdmin = async () => {
  await signOut(auth);
  localStorage.removeItem("admin_user");
  localStorage.removeItem("user");
  dispatchAuthUserChanged();
};

export const getStoredAdminUser = () => {
  const raw = localStorage.getItem("admin_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// @ts-ignore
export const subscribeToUsers = (onData, onError) => {
  const q = collection(db, "users");
  return onSnapshot(
    q,
    (snapshot) => {
      /** @type {any[]} */
      const users = [];
      snapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...docSnap.data() });
      });
      onData(users);
    },
    (err) => {
      if (onError) onError(err);
    },
  );
};

// @ts-ignore
export const subscribeToTrips = (callback) => {
  const q = collection(db, "Trips");
  return onSnapshot(q, (snapshot) => {
    /** @type {any[]} */
    const trips = [];
    snapshot.forEach((docSnap) => {
      trips.push({ id: docSnap.id, ...docSnap.data() });
    });
    trips.reverse();
    callback(trips);
  });
};

// @ts-ignore
export const subscribeToAiLogs = (callback) => {
  const q = query(collection(db, "ai_logs"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      /** @type {any[]} */
      const logs = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(logs);
    },
    () => {
      const plainQ = collection(db, "ai_logs");
      onSnapshot(plainQ, (snap) => {
        /** @type {any[]} */
        const logs = [];
        snap.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...docSnap.data() });
        });
        logs.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });
        callback(logs);
      });
    },
  );
};

// @ts-ignore
export const toggleUserAdminStatus = async (userId, currentStatus) => {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, {
    isAdmin: !currentStatus,
  });
};

// @ts-ignore
export const deleteTrip = async (tripId) => {
  const ref = doc(db, "Trips", tripId);
  await deleteDoc(ref);
};

/**
 * @param {string} userId
 * @param {string} newPicture
 */
export const updateAdminPicture = async (userId, newPicture) => {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { picture: newPicture, photoURL: newPicture });

  const admin = getStoredAdminUser();
  if (admin && admin.uid === userId) {
    admin.picture = newPicture;
    admin.photoURL = newPicture;
    localStorage.setItem("admin_user", JSON.stringify(admin));
    localStorage.setItem("user", JSON.stringify(admin));
    dispatchAuthUserChanged();
    window.dispatchEvent(new Event("storage"));
  }
};
/**
 * @param {string} userId
 * @param {string} newName
 */
export const updateAdminName = async (userId, newName) => {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { name: newName });

  const admin = getStoredAdminUser();
  if (admin && admin.uid === userId) {
    admin.name = newName;
    localStorage.setItem("admin_user", JSON.stringify(admin));
    localStorage.setItem("user", JSON.stringify(admin));
    dispatchAuthUserChanged();
    window.dispatchEvent(new Event("storage"));
  }
};
