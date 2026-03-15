import { STORAGE_KEY } from "./config.js";
import { sampleRecords } from "./seed.js";

export function normalizeRecord(record) {
  return {
    ...record,
    id: record.id || `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    title: (record.title || "").trim(),
    creator: (record.creator || "").trim(),
    format: record.format || "Other",
    status: record.status || "Available",
    genre: record.genre || "",
    subjects: record.subjects || "",
    location: record.location || "",
    dateAdded: record.dateAdded || new Date().toISOString().slice(0, 10),
    addedAt: Number(record.addedAt) || Date.now(),
  };
}

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveRecords(sampleRecords);
      return sampleRecords.map(normalizeRecord);
    }
    return JSON.parse(raw).map(normalizeRecord);
  } catch {
    return sampleRecords.map(normalizeRecord);
  }
}

export function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
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
