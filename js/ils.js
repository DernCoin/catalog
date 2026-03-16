import { duplicateCandidates, PRELOADED_GENRES, asArray, getStats } from "./catalog.js";
import { normalizeRecord, loadRecords, saveRecords, loadSettings, saveSettings } from "./storage.js";
import { isFirebaseConfigured, loginWithFirebase, logoutFirebase, onFirebaseAuthStateChanged, subscribeToFirebaseRecords } from "./firebase.js";

const state = {
  records: loadRecords(),
  settings: loadSettings(),
  query: "",
  selectedIds: new Set(),
  ilsTab: "dashboard",
  activeSearchIndex: -1,
  unsubscribeRecords: null,
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

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
  coverUploadStatus: $("#coverUploadStatus"),
  searchInput: $("#searchInput"),
  searchResultsPopover: $("#searchResultsPopover"),
  recordsBody: $("#recordsBody"),
  selectAllRows: $("#selectAllRows"),
  bulkStatusSelect: $("#bulkStatusSelect"),
  applyBulkBtn: $("#applyBulkBtn"),
  bulkGenreSelect: $("#bulkGenreSelect"),
  bulkGenreAddBtn: $("#bulkGenreAddBtn"),
  formatSelect: $("#format"),
  bindingSelect: $("#binding"),
  locationSelect: $("#location"),
  curatedShelfSelect: $("#curatedShelf"),
  ilsTabButtons: $$(".admin-tab-btn[data-ils-tab]"),
  ilsTabPanels: $$(".admin-tab-panel[data-ils-panel]"),
  newGenreInput: $("#newGenreInput"),
  addGenreBtn: $("#addGenreBtn"),
  genreList: $("#genreList"),
  newFormatInput: $("#newFormatInput"),
  addFormatBtn: $("#addFormatBtn"),
  formatList: $("#formatList"),
  newLocationInput: $("#newLocationInput"),
  addLocationBtn: $("#addLocationBtn"),
  locationList: $("#locationList"),
  newCuratedShelfInput: $("#newCuratedShelfInput"),
  addCuratedShelfBtn: $("#addCuratedShelfBtn"),
  curatedShelfList: $("#curatedShelfList"),
  newBindingInput: $("#newBindingInput"),
  addBindingBtn: $("#addBindingBtn"),
  bindingList: $("#bindingList"),
  ilsStatsPage: $("#ilsStatsPage"),
  dashboardTiles: $$(".dashboard-tile"),
};

const FORM_FIELDS = [
  "recordId:id", "title", "subtitle", "creator", "contributors", "format", "edition", "year", "publisher", "identifier", "genre", "subjects", "description", "location", "callNumber", "accessionNumber", "status", "dateAcquired", "dateAdded", "source", "pricePaid", "notes", "coverUrl", "binding", "seriesName", "seriesNumber", "curatedShelf", "pageCount",
];

function switchIlsTab(tab) {
  state.ilsTab = tab;
  els.ilsTabButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.ilsTab === tab));
  els.ilsTabPanels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.ilsPanel !== tab));
  if (tab !== "catalog") hideSearchPopover();
}

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

function getManagedFormats() {
  const defaults = ["Book", "Vinyl", "Board Game", "CD", "Zine", "Magazine", "Other"];
  return [...new Set([...(state.settings.formats || []), ...defaults, ...state.records.map((r) => r.format).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
}

function getManagedBindings() {
  return [...new Set([...(state.settings.bindings || []), "Paperback", "Hardcover", ...state.records.map((r) => r.binding).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
}

function getManagedLocations() {
  return [...new Set([...(state.settings.locations || []), ...state.records.map((r) => r.location).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
}

function getManagedCuratedShelves() {
  return [...new Set([...(state.settings.curatedShelves || []), ...state.records.map((r) => r.curatedShelf).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
}

function fillGenres() {
  const managed = getManagedGenres();
  const options = managed.map((g) => `<option value="${g}">${g}</option>`).join("");
  $("#genres").innerHTML = options;
  els.bulkGenreSelect.innerHTML = options;
  renderManagedList(els.genreList, managed, "genre", renameGenre, deleteGenre);
}

function fillFormats() {
  const managed = getManagedFormats();
  const current = els.formatSelect.value || "";
  els.formatSelect.innerHTML = managed.map((format) => `<option value="${format}">${format}</option>`).join("");
  els.formatSelect.value = managed.includes(current) ? current : (managed[0] || "Other");
  renderManagedList(els.formatList, managed, "format", renameFormat, deleteFormat);
}

function fillBindings() {
  const managed = getManagedBindings();
  const current = els.bindingSelect.value || "";
  els.bindingSelect.innerHTML = ['<option value="">None</option>', ...managed.map((binding) => `<option value="${binding}">${binding}</option>`)].join("");
  els.bindingSelect.value = managed.includes(current) ? current : "";
  renderManagedList(els.bindingList, managed, "binding", renameBinding, deleteBinding);
}

function fillLocations() {
  const managed = getManagedLocations();
  const current = els.locationSelect.value || "";
  els.locationSelect.innerHTML = ['<option value="">Unspecified</option>', ...managed.map((location) => `<option value="${location}">${location}</option>`)].join("");
  els.locationSelect.value = managed.includes(current) ? current : "";
  renderManagedList(els.locationList, managed, "location", renameLocation, deleteLocation);
}

function fillCuratedShelves() {
  const managed = getManagedCuratedShelves();
  const current = els.curatedShelfSelect.value || "";
  els.curatedShelfSelect.innerHTML = ['<option value="">None</option>', ...managed.map((shelf) => `<option value="${shelf}">${shelf}</option>`)].join("");
  els.curatedShelfSelect.value = managed.includes(current) ? current : "";
  renderManagedList(els.curatedShelfList, managed, "curated shelf", renameCuratedShelf, deleteCuratedShelf);
}

function renderManagedList(listEl, values, label, onRename, onDelete) {
  if (!listEl) return;
  listEl.innerHTML = "";
  values.forEach((value) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${value}</span><div><button class="button button-secondary" data-act="rename" type="button">Edit</button> <button class="button button-secondary" data-act="delete" type="button">Delete</button></div>`;
    li.querySelector('[data-act="rename"]').addEventListener("click", () => {
      const next = window.prompt(`Rename ${label}`, value);
      if (!next || next.trim() === value) return;
      onRename(value, next.trim());
    });
    li.querySelector('[data-act="delete"]').addEventListener("click", () => onDelete(value));
    listEl.appendChild(li);
  });
}

function addToManagedList(key, inputEl, fillFn) {
  const value = inputEl.value.trim();
  if (!value) return;
  const set = new Set(state.settings[key] || []);
  set.add(value);
  state.settings[key] = [...set].sort((a, b) => a.localeCompare(b));
  saveSettings(state.settings);
  inputEl.value = "";
  fillFn();
}

function renameInRecords(recordKey, prev, next) {
  state.records = state.records.map((record) => (record[recordKey] === prev ? { ...record, [recordKey]: next } : record));
  saveRecords(state.records);
}

function renameInSettings(key, prev, next) {
  const set = new Set((state.settings[key] || []).map((value) => (value === prev ? next : value)));
  state.settings[key] = [...set].sort((a, b) => a.localeCompare(b));
  saveSettings(state.settings);
}

function removeFromSettings(key, target) {
  state.settings[key] = (state.settings[key] || []).filter((value) => value !== target);
  saveSettings(state.settings);
}

function addGenre() { addToManagedList("genres", els.newGenreInput, fillGenres); }
function addFormat() { addToManagedList("formats", els.newFormatInput, fillFormats); }
function addLocation() { addToManagedList("locations", els.newLocationInput, fillLocations); }
function addCuratedShelf() { addToManagedList("curatedShelves", els.newCuratedShelfInput, fillCuratedShelves); }
function addBinding() { addToManagedList("bindings", els.newBindingInput, fillBindings); }

function renameGenre(prev, next) {
  state.records = state.records.map((record) => {
    const genres = asArray(record.genres?.length ? record.genres : record.genre).map((g) => (g === prev ? next : g));
    const unique = [...new Set(genres)];
    return { ...record, genres: unique, genre: unique.join(", ") };
  });
  renameInSettings("genres", prev, next);
  saveRecords(state.records);
  render();
}

function deleteGenre(target) {
  state.records = state.records.map((record) => {
    const genres = asArray(record.genres?.length ? record.genres : record.genre).filter((g) => g !== target);
    return { ...record, genres, genre: genres.join(", ") };
  });
  removeFromSettings("genres", target);
  saveRecords(state.records);
  render();
}

function renameFormat(prev, next) {
  renameInRecords("format", prev, next);
  renameInSettings("formats", prev, next);
  render();
}

function deleteFormat(target) {
  removeFromSettings("formats", target);
  fillFormats();
}

function renameLocation(prev, next) {
  renameInRecords("location", prev, next);
  renameInSettings("locations", prev, next);
  render();
}

function deleteLocation(target) {
  removeFromSettings("locations", target);
  fillLocations();
}

function renameCuratedShelf(prev, next) {
  renameInRecords("curatedShelf", prev, next);
  renameInSettings("curatedShelves", prev, next);
  render();
}

function deleteCuratedShelf(target) {
  removeFromSettings("curatedShelves", target);
  fillCuratedShelves();
}

function renameBinding(prev, next) {
  renameInRecords("binding", prev, next);
  renameInSettings("bindings", prev, next);
  render();
}

function deleteBinding(target) {
  removeFromSettings("bindings", target);
  fillBindings();
}

function resetForm() {
  els.recordForm.reset();
  if (els.coverUploadStatus) els.coverUploadStatus.textContent = "";
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

function hideSearchPopover() {
  if (!els.searchResultsPopover) return;
  els.searchResultsPopover.classList.add("hidden");
  els.searchResultsPopover.innerHTML = "";
  state.activeSearchIndex = -1;
}

function renderSearchPopover() {
  if (!els.searchResultsPopover) return;
  const rows = getAdminFiltered().sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));
  if (!state.query.trim()) {
    hideSearchPopover();
    return;
  }

  if (!rows.length) {
    els.searchResultsPopover.innerHTML = '<p class="search-popover-empty">No matching records.</p>';
    els.searchResultsPopover.classList.remove("hidden");
    return;
  }

  state.activeSearchIndex = -1;
  els.searchResultsPopover.innerHTML = rows.slice(0, 12).map((record, index) => (
    `<button class="search-result-item" type="button" data-search-index="${index}" data-record-id="${record.id}"><strong>${record.title}</strong><span>${record.creator || "Unknown creator"}</span></button>`
  )).join("");
  els.searchResultsPopover.classList.remove("hidden");

  [...els.searchResultsPopover.querySelectorAll(".search-result-item")].forEach((button) => {
    button.addEventListener("click", () => {
      const found = state.records.find((entry) => entry.id === button.dataset.recordId);
      if (!found) return;
      populateForm(found);
      hideSearchPopover();
    });
  });
}

function renderTable() {
  const rows = state.records.slice().sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));

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

  const selected = [...new Set(asArray(record.genres?.length ? record.genres : record.genre))];
  [...$("#genres").options].forEach((option) => {
    option.selected = selected.includes(option.value);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
  checkDuplicateDraft();
  switchIlsTab("catalog");
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

  if (!file.type.startsWith("image/")) {
    if (els.coverUploadStatus) els.coverUploadStatus.textContent = "Please choose an image file.";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = typeof reader.result === "string" ? reader.result : "";
    if (!dataUrl) {
      if (els.coverUploadStatus) els.coverUploadStatus.textContent = "Could not read image. Please try another file.";
      return;
    }
    $("#coverUrl").value = dataUrl;
    if (els.coverUploadStatus) els.coverUploadStatus.textContent = "Cover image loaded. It will save as part of this record.";
  };
  reader.onerror = () => {
    if (els.coverUploadStatus) els.coverUploadStatus.textContent = "Could not read image. Please try another file.";
  };
  reader.readAsDataURL(file);
}


function renderStatsPanel() {
  if (!els.ilsStatsPage) return;
  const stats = getStats(state.records);
  const formats = Object.entries(stats.byFormat).map(([name, count]) => `${name} (${count})`).join(" • ") || "None";
  const years = Object.entries(stats.byYear).map(([year, count]) => `${year}: ${count}`).join(" • ") || "None";
  const topCreators = stats.mostOwnedAuthors.map((entry) => `${entry.author} (${entry.count})`).join(", ") || "None";
  const newest = stats.newest.map((record) => record.title).join(", ") || "None";

  els.ilsStatsPage.innerHTML = `<p>Total items: <strong>${stats.total}</strong></p><p>Formats: ${formats}</p><p>Most owned authors: ${topCreators}</p><p>Publication year distribution: ${years}</p><p>Newest additions: ${newest}</p>`;
}

function bindEvents() {
  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    els.loginError.textContent = "";

    try {
      await loginWithFirebase(els.email.value.trim(), els.password.value);
      els.loginForm.reset();
    } catch (error) {
      els.loginError.textContent = `Unable to log in. ${error?.message || "Check credentials and Firebase setup."}`;
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
    renderSearchPopover();
  });

  els.searchInput.addEventListener("focus", renderSearchPopover);
  els.searchInput.addEventListener("keydown", (event) => {
    const items = [...els.searchResultsPopover.querySelectorAll(".search-result-item")];
    if (!items.length || els.searchResultsPopover.classList.contains("hidden")) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.activeSearchIndex = Math.min(state.activeSearchIndex + 1, items.length - 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      state.activeSearchIndex = Math.max(state.activeSearchIndex - 1, 0);
    } else if (event.key === "Enter" && state.activeSearchIndex >= 0) {
      event.preventDefault();
      items[state.activeSearchIndex].click();
      return;
    } else if (event.key === "Escape") {
      hideSearchPopover();
      return;
    } else {
      return;
    }

    items.forEach((item, index) => item.classList.toggle("is-active", index === state.activeSearchIndex));
  });

  document.addEventListener("click", (event) => {
    if (event.target === els.searchInput || els.searchResultsPopover.contains(event.target)) return;
    hideSearchPopover();
  });

  els.selectAllRows.addEventListener("change", (event) => {
    state.selectedIds.clear();
    if (event.target.checked) state.records.forEach((record) => state.selectedIds.add(record.id));
    renderTable();
  });

  els.applyBulkBtn.addEventListener("click", applyBulkStatus);
  els.bulkGenreAddBtn.addEventListener("click", bulkAddGenres);
  els.ilsTabButtons.forEach((btn) => btn.addEventListener("click", () => switchIlsTab(btn.dataset.ilsTab)));
  els.dashboardTiles.forEach((tile) => tile.addEventListener("click", () => {
    const { ilsTarget, ilsEmpty } = tile.dataset;
    if (ilsEmpty === "true") return;
    if (!ilsTarget) return;
    switchIlsTab(ilsTarget);
  }));

  els.addGenreBtn.addEventListener("click", addGenre);
  els.addFormatBtn.addEventListener("click", addFormat);
  els.addLocationBtn.addEventListener("click", addLocation);
  els.addCuratedShelfBtn.addEventListener("click", addCuratedShelf);
  els.addBindingBtn.addEventListener("click", addBinding);
}

function render() {
  fillGenres();
  fillFormats();
  fillBindings();
  fillLocations();
  fillCuratedShelves();
  renderTable();
  renderStatsPanel();
}

function init() {
  bindEvents();

  if (!isFirebaseConfigured()) {
    els.loginError.textContent = "Add Firebase configuration in js/config.js to enable the ILS.";
    return;
  }

  onFirebaseAuthStateChanged((user) => {
    const isAuthed = Boolean(user);
    setAuthenticatedUI(isAuthed);

    if (state.unsubscribeRecords) {
      state.unsubscribeRecords();
      state.unsubscribeRecords = null;
    }

    if (!isAuthed) return;

    state.unsubscribeRecords = subscribeToFirebaseRecords((records) => {
      state.records = records.map(normalizeRecord);
      saveRecords(state.records);
      render();
    }, (error) => {
      els.loginError.textContent = `Could not load Firebase records. ${error?.message || "Check Firestore permissions."}`;
    });
  });

  switchIlsTab("dashboard");
  render();
}

init();
