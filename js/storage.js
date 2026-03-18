import { STORAGE_KEY, SETTINGS_KEY, FIREBASE_CONFIG } from "./config.js";

let syncQueue = Promise.resolve();

function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG?.apiKey && FIREBASE_CONFIG?.projectId);
}

async function loadFirebaseModule() {
  return import("./firebase.js");
}

const DEFAULT_SETTINGS = { locations: [], genres: [], materialTypes: [], curatedShelves: [], formats: [], bindings: [], patrons: [], subscriptions: [], holds: [], circulationRules: [], acquisitionOrders: [], pendingMaterials: [] };

function normalizeHolding(holding = {}, fallback = {}) {
  const parsedMaterialNumbers = Array.isArray(holding.materialNumbers)
    ? holding.materialNumbers
    : String(holding.materialNumbers || fallback.materialNumber || "").split(/[\n,]/).map((value) => value.trim()).filter(Boolean);
  const materialNumbers = [...new Set(parsedMaterialNumbers.map((value) => String(value || "").trim()).filter(Boolean))];
  return {
    id: holding.id || `holding-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    status: holding.status || fallback.status || "Available",
    location: holding.location || fallback.location || "",
    callNumber: holding.callNumber || fallback.callNumber || "",
    accessionNumber: holding.accessionNumber || fallback.accessionNumber || "",
    materialNumbers,
    dateAcquired: holding.dateAcquired || fallback.dateAcquired || "",
    source: holding.source || fallback.source || "",
    pricePaid: holding.pricePaid || fallback.pricePaid || "",
    retailPrice: holding.retailPrice || fallback.retailPrice || "",
    checkedOutTo: holding.checkedOutTo || "",
    checkedOutToName: holding.checkedOutToName || "",
    checkedOutAt: holding.checkedOutAt || "",
    dueDate: holding.dueDate || "",
  };
}

function deriveRecordFromHoldings(record, holdings) {
  const primary = holdings[0] || normalizeHolding({}, record);
  return {
    ...record,
    holdings,
    status: primary.status || record.status || "Available",
    location: primary.location || record.location || "",
    callNumber: primary.callNumber || record.callNumber || "",
    accessionNumber: primary.accessionNumber || record.accessionNumber || "",
    materialNumbers: [...new Set(holdings.flatMap((holding) => holding.materialNumbers || []))],
    dateAcquired: primary.dateAcquired || record.dateAcquired || "",
    source: primary.source || record.source || "",
    pricePaid: primary.pricePaid || record.pricePaid || "",
    retailPrice: primary.retailPrice || record.retailPrice || "",
    checkedOutTo: primary.checkedOutTo || record.checkedOutTo || "",
    checkedOutToName: primary.checkedOutToName || record.checkedOutToName || "",
    checkedOutAt: primary.checkedOutAt || record.checkedOutAt || "",
    dueDate: primary.dueDate || record.dueDate || "",
  };
}

export function normalizeRecord(record) {
  const parsedGenres = Array.isArray(record.genres)
    ? record.genres
    : String(record.genres || record.genre || "").split(",").map((g) => g.trim()).filter(Boolean);
  const genres = [...new Set(parsedGenres.map((genre) => String(genre || "").trim()).filter(Boolean))];

  const parsedMaterialNumbers = Array.isArray(record.materialNumbers)
    ? record.materialNumbers
    : String(record.materialNumbers || record.materialNumber || "").split(/[\n,]/).map((value) => value.trim()).filter(Boolean);
  const materialNumbers = [...new Set(parsedMaterialNumbers.map((value) => String(value || "").trim()).filter(Boolean))];
  const rawHoldings = Array.isArray(record.holdings) && record.holdings.length
    ? record.holdings
    : [{ status: record.status, location: record.location, callNumber: record.callNumber, accessionNumber: record.accessionNumber, materialNumbers, dateAcquired: record.dateAcquired, source: record.source, pricePaid: record.pricePaid, retailPrice: record.retailPrice, checkedOutTo: record.checkedOutTo, checkedOutToName: record.checkedOutToName, checkedOutAt: record.checkedOutAt, dueDate: record.dueDate }];
  const holdings = rawHoldings.map((holding) => normalizeHolding(holding, record));

  return deriveRecordFromHoldings({
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
    materialType: record.materialType || "",
    publicationPlace: record.publicationPlace || "",
    languageCode: record.languageCode || "",
    statementOfResponsibility: record.statementOfResponsibility || "",
    lccn: record.lccn || "",
    oclcNumber: record.oclcNumber || "",
    deweyNumber: record.deweyNumber || "",
    lcClassNumber: record.lcClassNumber || "",
    seriesName: record.seriesName || "",
    seriesNumber: record.seriesNumber || "",
    physicalDetails: record.physicalDetails || "",
    summaryNote: record.summaryNote || "",
    targetAudience: record.targetAudience || "",
    bibliographyNote: record.bibliographyNote || "",
    marcLeader: record.marcLeader || "",
    marc008: record.marc008 || "",
    source: record.source || "",
    checkedOutTo: record.checkedOutTo || "",
    checkedOutToName: record.checkedOutToName || "",
    checkedOutAt: record.checkedOutAt || "",
    dueDate: record.dueDate || "",
    pageCount: record.pageCount || "",
    pricePaid: record.pricePaid || "",
    retailPrice: record.retailPrice || "",
    circulationHistory: record.circulationHistory || "",
    dateAdded: record.dateAdded || new Date().toISOString().slice(0, 10),
    addedAt: Number(record.addedAt) || Date.now(),
    permalink: record.permalink || `record-${record.id || crypto.randomUUID()}`,
  }, holdings);
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
    const { fetchAllFirebaseRecords, isFirebaseAuthActive } = await loadFirebaseModule();
    if (!isFirebaseAuthActive()) return [];
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
    .then(async () => {
      const { syncFirebaseRecords, isFirebaseAuthActive } = await loadFirebaseModule();
      if (!isFirebaseAuthActive()) return null;
      return syncFirebaseRecords(records);
    })
    .catch((error) => {
      console.error("Unable to sync Firebase records", error);
    });
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
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
