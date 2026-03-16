import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, onSnapshot, writeBatch } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { FIREBASE_CONFIG, FIREBASE_COLLECTION } from "./config.js";

let app;
let auth;
let db;

export function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG?.apiKey && FIREBASE_CONFIG?.projectId);
}

function initFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}

export function getFirebaseServices() {
  return initFirebase();
}

export function getRecordsCollectionRef() {
  const services = initFirebase();
  if (!services) return null;
  return collection(services.db, FIREBASE_COLLECTION);
}

export async function fetchAllFirebaseRecords() {
  const ref = getRecordsCollectionRef();
  if (!ref) return [];
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

export function subscribeToFirebaseRecords(onChange, onError = console.error) {
  const ref = getRecordsCollectionRef();
  if (!ref) return () => {};
  return onSnapshot(ref, (snapshot) => {
    const records = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    onChange(records);
  }, onError);
}

export async function syncFirebaseRecords(records) {
  const ref = getRecordsCollectionRef();
  if (!ref) return;
  const services = getFirebaseServices();
  const db = services.db;

  const batch = writeBatch(db);
  const existing = await getDocs(ref);
  const incomingIds = new Set(records.map((record) => record.id));

  existing.docs.forEach((entry) => {
    if (!incomingIds.has(entry.id)) {
      batch.delete(doc(db, FIREBASE_COLLECTION, entry.id));
    }
  });

  records.forEach((record) => {
    batch.set(doc(db, FIREBASE_COLLECTION, record.id), record, { merge: true });
  });

  await batch.commit();
}

export function onFirebaseAuthStateChanged(cb) {
  const services = getFirebaseServices();
  if (!services) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(services.auth, cb);
}

export async function loginWithFirebase(email, password) {
  const services = getFirebaseServices();
  if (!services) throw new Error("Firebase is not configured");
  return signInWithEmailAndPassword(services.auth, email, password);
}

export async function logoutFirebase() {
  const services = getFirebaseServices();
  if (!services) return;
  await signOut(services.auth);
}
