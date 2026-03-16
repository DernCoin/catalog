import { duplicateCandidates, PRELOADED_GENRES, asArray } from "./catalog.js";
import { normalizeRecord, loadRecords, saveRecords, loadSettings } from "./storage.js";
import { isFirebaseConfigured, loginWithFirebase, logoutFirebase, onFirebaseAuthStateChanged, subscribeToFirebaseRecords } from "./firebase.js";

const state = {
  records: loadRecords(),
  settings: loadSettings(),
  query: "",
  selectedIds: new Set(),
};

const $ = (s) => document.querySelector(s);

const els = {
  loginCard: $("#loginCard"),
  ilsCard: $("#ilsCard"),
  logoutBtn: $("#logoutBtn"),
  loginForm: $("#loginForm"),
  loginError: $("#loginError"),
  email: $("#email"),
  password: $("#password"),
  recordForm: $("#recordForm"),
  cancelEditBtn: $("#cancelEditBtn"),
  duplicateWarning: $("#duplicateWarning"),
  fetchMetadataBtn: $("#fetchMetadataBtn"),
  coverUpload: $("#coverUpload"),
  searchInput: $("#searchInput"),
  recordsBody: $("#recordsBody"),
  recordCount: $("#recordCount"),
  selectAllRows: $("#selectAllRows"),
  bulkStatusSelect: $("#bulkStatusSelect"),
  applyBulkBtn: $("#applyBulkBtn"),
  bulkGenreSelect: $("#bulkGenreSelect"),
  bulkGenreAddBtn: $("#bulkGenreAddBtn"),
};

const FORM_FIELDS = [
  "recordId:id", "title", "subtitle", "creator", "contributors", "format", "edition", "year", "publisher", "identifier", "genre", "subjects", "description", "location", "callNumber", "accessionNumber", "status", "dateAcquired", "dateAdded", "source", "pricePaid", "notes", "coverUrl", "binding", "seriesName", "seriesNumber", "curatedShelf", "pageCount",
];

function setAuthenticatedUI(isAuthed) {
  els.loginCard.classList.toggle("hidden", isAuthed);
  els.ilsCard.classList.toggle("hidden", !isAuthed);
  els.logoutBtn.classList.toggle("hidden", !isAuthed);
}

function getManagedGenres() {
  return [...new Set([...(state.settings.genres || []), ...PRELOADED_GENRES, ...state.records.flatMap((r) => asArray(r.genres?.length ? r.genres : r.genre))])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function fillGenres() {
  const managed = getManagedGenres();
  const options = managed.map((g) => `<option value="${g}">${g}</option>`).join("");
  $("#genres").innerHTML = options;
  els.bulkGenreSelect.innerHTML = options;
}

function fillFormats() {
  const defaults = ["Book", "Vinyl", "Board Game", "CD", "Zine", "Magazine", "Other"];
  const managed = [...new Set([...(state.settings.formats || []), ...defaults, ...state.records.map((r) => r.format).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
  const current = $("#format").value || "";
  $("#format").innerHTML = managed.map((format) => `<option value="${format}">${format}</option>`).join("");
  $("#format").value = managed.includes(current) ? current : (managed[0] || "Other");
}

function fillBindings() {
  const managed = [...new Set([...(state.settings.bindings || []), "Paperback", "Hardcover", ...state.records.map((r) => r.binding).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
  const current = $("#binding").value || "";
  $("#binding").innerHTML = ['<option value="">None</option>', ...managed.map((binding) => `<option value="${binding}">${binding}</option>`)].join("");
  $("#binding").value = managed.includes(current) ? current : "";
}

function fillLocations() {
  const managed = [...new Set([...(state.settings.locations || []), ...state.records.map((r) => r.location).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
  const current = $("#location").value || "";
  $("#location").innerHTML = ['<option value="">Unspecified</option>', ...managed.map((location) => `<option value="${location}">${location}</option>`)].join("");
  $("#location").value = managed.includes(current) ? current : "";
}

function fillCuratedShelves() {
  const managed = [...new Set([...(state.settings.curatedShelves || []), ...state.records.map((r) => r.curatedShelf).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
  const current = $("#curatedShelf").value || "";
  $("#curatedShelf").innerHTML = ['<option value="">None</option>', ...managed.map((shelf) => `<option value="${shelf}">${shelf}</option>`)].join("");
  $("#curatedShelf").value = managed.includes(current) ? current : "";
}

function resetForm() {
  els.recordForm.reset();
  $("#recordId").value = "";
  $("#status").value = "Available";
  $("#format").value = "Book";
  $("#binding").value = "";
  $("#location").value = "";
  $("#curatedShelf").value = "";
  els.duplicateWarning.textContent = "";
}

function getAdminFiltered() {
  const term = state.query.trim().toLowerCase();
  if (!term) return state.records;
  return state.records.filter((r) => `${r.title} ${r.creator} ${r.identifier || ""}`.toLowerCase().includes(term));
}

function renderTable() {
  const rows = getAdminFiltered().sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));
  els.recordCount.textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;

  els.recordsBody.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><input type="checkbox" ${state.selectedIds.has(r.id) ? "checked" : ""}></td><td>${r.title}</td><td>${r.creator}</td><td>${r.format}</td><td>${r.year || ""}</td><td>${r.status || "Available"}</td><td><button class="button button-secondary" data-act="edit" type="button">Edit</button> <button class="button button-secondary" data-act="dup" type="button">Duplicate</button> <button class="button" data-act="del" type="button">Delete</button></td>`;

    tr.querySelector('input[type="checkbox"]').addEventListener("change", (event) => {
      if (event.target.checked) state.selectedIds.add(r.id);
      else state.selectedIds.delete(r.id);
    });

    tr.querySelector('[data-act="edit"]').addEventListener("click", () => populateForm(r));
    tr.querySelector('[data-act="dup"]').addEventListener("click", () => {
      const copy = normalizeRecord({ ...r, id: crypto.randomUUID(), title: `${r.title} (Copy)` });
      state.records.unshift(copy);
      saveRecords(state.records);
      render();
    });
    tr.querySelector('[data-act="del"]').addEventListener("click", () => {
      state.records = state.records.filter((entry) => entry.id !== r.id);
      state.selectedIds.delete(r.id);
      saveRecords(state.records);
      render();
    });

    els.recordsBody.appendChild(tr);
  });
}

function populateForm(record) {
  FORM_FIELDS.forEach((pair) => {
    const [elId, prop] = pair.includes(":") ? pair.split(":") : [pair, pair];
    $(`#${elId}`).value = record[prop] || "";
  });

  const selected = record.genres || asArray(record.genre);
  [...$("#genres").options].forEach((option) => {
    option.selected = selected.includes(option.value);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
  checkDuplicateDraft();
}

function saveFormRecord(event) {
  event.preventDefault();
  const id = $("#recordId").value || crypto.randomUUID();
  const dateAdded = $("#dateAdded").value || new Date().toISOString().slice(0, 10);
  const selectedGenres = [...$("#genres").selectedOptions].map((option) => option.value);
  const custom = $("#genre").value.trim();
  const genres = [...new Set([...selectedGenres, ...(custom ? [custom] : [])])];

  const record = normalizeRecord({
    id,
    permalink: `record-${id}`,
    title: $("#title").value.trim(),
    subtitle: $("#subtitle").value.trim(),
    creator: $("#creator").value.trim(),
    contributors: $("#contributors").value.trim(),
    format: $("#format").value || "Other",
    edition: $("#edition").value.trim(),
    year: $("#year").value.trim(),
    publisher: $("#publisher").value.trim(),
    identifier: $("#identifier").value.trim(),
    genre: genres.join(", "),
    genres,
    subjects: $("#subjects").value.trim(),
    description: $("#description").value.trim(),
    location: $("#location").value.trim(),
    callNumber: $("#callNumber").value.trim(),
    accessionNumber: $("#accessionNumber").value.trim(),
    status: $("#status").value || "Available",
    dateAcquired: $("#dateAcquired").value,
    dateAdded,
    source: $("#source").value.trim(),
    pricePaid: $("#pricePaid").value.trim(),
    notes: $("#notes").value.trim(),
    coverUrl: $("#coverUrl").value.trim(),
    binding: $("#binding").value.trim(),
    seriesName: $("#seriesName").value.trim(),
    seriesNumber: $("#seriesNumber").value.trim(),
    curatedShelf: $("#curatedShelf").value.trim(),
    pageCount: $("#pageCount").value.trim(),
    addedAt: new Date(dateAdded).getTime() || Date.now(),
  });

  const idx = state.records.findIndex((entry) => entry.id === id);
  if (idx >= 0) state.records[idx] = record;
  else state.records.unshift(record);

  saveRecords(state.records);
  resetForm();
  render();
}

function checkDuplicateDraft() {
  const draft = {
    id: $("#recordId").value,
    title: $("#title").value.trim(),
    creator: $("#creator").value.trim(),
    identifier: $("#identifier").value.trim(),
  };

  if (!draft.title || !draft.creator) {
    els.duplicateWarning.textContent = "";
    return;
  }

  const dupes = duplicateCandidates(state.records, draft);
  els.duplicateWarning.textContent = dupes.length ? `Possible duplicate found. Existing: ${dupes[0].title} by ${dupes[0].creator}. You may still save.` : "";
}

function applyBulkStatus() {
  const status = els.bulkStatusSelect.value;
  if (!status || !state.selectedIds.size) return;

  state.records = state.records.map((record) => (state.selectedIds.has(record.id) ? { ...record, status } : record));
  saveRecords(state.records);
  render();
}

function bulkAddGenres() {
  const selectedGenres = [...els.bulkGenreSelect.selectedOptions].map((option) => option.value);
  if (!selectedGenres.length || !state.selectedIds.size) return;

  state.records = state.records.map((record) => {
    if (!state.selectedIds.has(record.id)) return record;
    const merged = [...new Set([...(record.genres || asArray(record.genre)), ...selectedGenres])];
    return { ...record, genres: merged, genre: merged.join(", ") };
  });

  saveRecords(state.records);
  render();
}

async function fetchMetadata() {
  const isbn = $("#identifier").value.trim().replace(/[^0-9Xx]/g, "");
  if (!isbn) return;

  try {
    const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!response.ok) throw new Error("No metadata found");

    const data = await response.json();
    const map = { title: "#title", publishers: "#publisher", publish_date: "#year", notes: "#description" };
    Object.entries(map).forEach(([key, id]) => {
      if (!$(id).value && data[key]) {
        $(id).value = Array.isArray(data[key]) ? data[key][0] : String(data[key]).slice(0, 300);
      }
    });

    if (!$("#creator").value && Array.isArray(data.authors) && data.authors.length) {
      const names = await Promise.all(data.authors.map(async (authorRef) => {
        try {
          const authorRes = await fetch(`https://openlibrary.org${authorRef.key}.json`);
          if (!authorRes.ok) return "";
          const authorData = await authorRes.json();
          return String(authorData.name || "").trim();
        } catch {
          return "";
        }
      }));

      const normalized = names.filter(Boolean);
      if (normalized.length) $("#creator").value = normalized.join(", ");
    }

    if (!$("#coverUrl").value) $("#coverUrl").value = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  } catch (error) {
    els.duplicateWarning.textContent = `Metadata fetch failed: ${error.message}`;
  }
}

function handleCoverUpload() {
  const file = els.coverUpload.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    $("#coverUrl").value = reader.result;
  };
  reader.readAsDataURL(file);
}

function bindEvents() {
  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    els.loginError.textContent = "";

    try {
      await loginWithFirebase(els.email.value.trim(), els.password.value);
      els.loginForm.reset();
    } catch {
      els.loginError.textContent = "Unable to log in. Check credentials and Firebase setup.";
    }
  });

  els.logoutBtn.addEventListener("click", async () => {
    await logoutFirebase();
    setAuthenticatedUI(false);
  });

  els.recordForm.addEventListener("submit", saveFormRecord);
  els.recordForm.addEventListener("input", checkDuplicateDraft);
  els.cancelEditBtn.addEventListener("click", resetForm);
  els.fetchMetadataBtn.addEventListener("click", fetchMetadata);
  els.coverUpload.addEventListener("change", handleCoverUpload);

  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    renderTable();
  });

  els.selectAllRows.addEventListener("change", (event) => {
    state.selectedIds.clear();
    if (event.target.checked) {
      getAdminFiltered().forEach((record) => state.selectedIds.add(record.id));
    }
    renderTable();
  });

  els.applyBulkBtn.addEventListener("click", applyBulkStatus);
  els.bulkGenreAddBtn.addEventListener("click", bulkAddGenres);
}

function render() {
  fillGenres();
  fillFormats();
  fillBindings();
  fillLocations();
  fillCuratedShelves();
  renderTable();
}

function init() {
  bindEvents();

  if (!isFirebaseConfigured()) {
    els.loginError.textContent = "Add Firebase configuration in js/config.js to enable the ILS.";
    return;
  }

  onFirebaseAuthStateChanged((user) => {
    setAuthenticatedUI(Boolean(user));
  });

  subscribeToFirebaseRecords((records) => {
    state.records = records.map(normalizeRecord);
    saveRecords(state.records);
    render();
  });

  render();
}

init();
