import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { FIREBASE_CONFIG, FIREBASE_COLLECTION, getMissingFirebaseConfigFields, isFirebaseConfigReady } from "./config.js";

let app;
let auth;
let db;

export function isFirebaseConfigured() {
  return isFirebaseConfigReady(FIREBASE_CONFIG);
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

const FIREBASE_SETTINGS_COLLECTION = "system";
const FIREBASE_SETTINGS_DOC = "settings";

export function getSettingsDocRef() {
  const services = initFirebase();
  if (!services) return null;
  return doc(services.db, FIREBASE_SETTINGS_COLLECTION, FIREBASE_SETTINGS_DOC);
}

export async function fetchFirebaseSettings() {
  const ref = getSettingsDocRef();
  if (!ref) return null;
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
}

export function subscribeToFirebaseSettings(onChange, onError = console.error) {
  const ref = getSettingsDocRef();
  if (!ref) return () => {};
  return onSnapshot(ref, (snapshot) => {
    onChange(snapshot.exists() ? snapshot.data() : null);
  }, onError);
}

export async function syncFirebaseSettings(settings) {
  const ref = getSettingsDocRef();
  if (!ref) return;
  await setDoc(ref, settings, { merge: true });
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
  if (!services) {
    const missing = getMissingFirebaseConfigFields(FIREBASE_CONFIG);
    throw new Error(missing.length ? `Firebase config is incomplete: missing ${missing.join(", ")}.` : "Firebase is not configured");
  }
  return signInWithEmailAndPassword(services.auth, email, password);
}

export function isFirebaseAuthActive() {
  const services = getFirebaseServices();
  return Boolean(services?.auth?.currentUser);
}

export async function logoutFirebase() {
  const services = getFirebaseServices();
  if (!services) return;
  await signOut(services.auth);
}
