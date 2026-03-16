import { STORAGE_KEY, SETTINGS_KEY } from "./config.js";
import { fetchAllFirebaseRecords, isFirebaseConfigured, syncFirebaseRecords } from "./firebase.js";

let syncQueue = Promise.resolve();

export function normalizeRecord(record) {
  const parsedGenres = Array.isArray(record.genres)
    ? record.genres
    : String(record.genres || record.genre || "").split(",").map((g) => g.trim()).filter(Boolean);
  const genres = [...new Set(parsedGenres.map((genre) => String(genre || "").trim()).filter(Boolean))];

  return {
    ...record,
    id: record.id || `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    title: (record.title || "").trim(),
    creator: (record.creator || "").trim(),
    format: record.format || "Other",
    binding: record.binding || "",
    status: record.status || "Available",
    genre: record.genre || genres.join(", "),
    genres,
    subjects: record.subjects || "",
    location: record.location || "",
    seriesName: record.seriesName || "",
    seriesNumber: record.seriesNumber || "",
    source: record.source || "",
    pageCount: record.pageCount || "",
    pricePaid: record.pricePaid || "",
    dateAdded: record.dateAdded || new Date().toISOString().slice(0, 10),
    addedAt: Number(record.addedAt) || Date.now(),
    permalink: record.permalink || `record-${record.id || crypto.randomUUID()}`,
  };
}

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(normalizeRecord);
  } catch {
    return [];
  }
}

export async function loadRecordsFromRemote() {
  if (!isFirebaseConfigured()) return [];
  try {
    const records = await fetchAllFirebaseRecords();
    return records.map(normalizeRecord);
  } catch (error) {
    console.error("Unable to load Firebase records", error);
    return [];
  }
}

export function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  if (!isFirebaseConfigured()) return;

  syncQueue = syncQueue
    .then(() => syncFirebaseRecords(records))
    .catch((error) => {
      console.error("Unable to sync Firebase records", error);
    });
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { locations: [], genres: [], curatedShelves: [], formats: [], bindings: [] };
    const parsed = JSON.parse(raw);
    return {
      locations: parsed.locations || [],
      genres: parsed.genres || [],
      curatedShelves: parsed.curatedShelves || [],
      formats: parsed.formats || [],
      bindings: parsed.bindings || [],
    };
  } catch {
    return { locations: [], genres: [], curatedShelves: [], formats: [], bindings: [] };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportRecords(records) {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `catalog-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importRecords(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  if (!Array.isArray(payload)) throw new Error("Import file must be a JSON array of records.");
  return payload.map(normalizeRecord);
}
