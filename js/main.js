import { PAGE_SIZE, PLACEHOLDER_COVER } from "./config.js";
import { loadRecords, saveRecords, exportRecords, importRecords, normalizeRecord, loadSettings, saveSettings, loadRecordsFromRemote } from "./storage.js";
import { login, logout, isAdminSessionActive } from "./auth.js";
import { isFirebaseConfigured, subscribeToFirebaseRecords } from "./firebase.js";
import { buildFacets, queryRecords, getStats, duplicateCandidates, getRelated, PRELOADED_GENRES, didYouMean, asArray, normalizeAuthor } from "./catalog.js";

const state = {
  isAdmin: isAdminSessionActive(),
  records: loadRecords(),
  settings: loadSettings(),
  shown: PAGE_SIZE,
  selectedIds: new Set(),
  arrivalsPage: 0,
  view: "search",
  adminTab: "catalog",
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const els = {
  adminToggleBtn: $("#adminToggleBtn"), adminPageBtn: $("#adminPageBtn"), adminSection: $("#adminSection"), loginModal: $("#loginModal"), closeLoginBtn: $("#closeLoginBtn"), loginForm: $("#loginForm"), loginError: $("#loginError"),
  keywordSearch: $("#keywordSearch"), searchSuggestions: $("#searchSuggestions"), didYouMean: $("#didYouMean"),
  toggleAdvancedBtn: $("#toggleAdvancedBtn"), advancedSearch: $("#advancedSearch"), sortFilter: $("#sortFilter"), resultsSummary: $("#resultsSummary"), publicResults: $("#publicResults"), emptyState: $("#emptyState"),
  loadMoreBtn: $("#loadMoreBtn"), template: $("#recordTemplate"), catalogStats: $("#catalogStats"), newArrivals: $("#newArrivals"), arrivalsPrevBtn: $("#arrivalsPrevBtn"), arrivalsNextBtn: $("#arrivalsNextBtn"), randomItemBtn: $("#randomItemBtn"),
  facets: { format: $("#facetFormat"), genre: $("#facetGenre"), year: $("#facetYear"), status: $("#facetStatus"), location: $("#facetLocation"), binding: $("#facetBinding") },
  clearFiltersBtn: $("#clearFiltersBtn"), adminSearch: $("#adminSearch"), adminTableBody: $("#adminTableBody"), selectAllRows: $("#selectAllRows"), applyBulkBtn: $("#applyBulkBtn"), bulkStatusSelect: $("#bulkStatusSelect"),
  bulkGenreSelect: $("#bulkGenreSelect"), bulkGenreAddBtn: $("#bulkGenreAddBtn"),
  recordForm: $("#recordForm"), cancelEditBtn: $("#cancelEditBtn"), duplicateWarning: $("#duplicateWarning"), adminMessage: $("#adminMessage"), exportBtn: $("#exportBtn"), importInput: $("#importInput"),
  recordDetailsModal: $("#recordDetailsModal"), closeRecordDetailsBtn: $("#closeRecordDetailsBtn"), recordDetailsBody: $("#recordDetailsBody"), copyCitationBtn: $("#copyCitationBtn"),
  fetchMetadataBtn: $("#fetchMetadataBtn"), genres: $("#genres"), coverUpload: $("#coverUpload"), locationSelect: $("#location"),
  newLocationInput: $("#newLocationInput"), addLocationBtn: $("#addLocationBtn"), locationList: $("#locationList"), newGenreInput: $("#newGenreInput"), addGenreBtn: $("#addGenreBtn"), genreList: $("#genreList"),
  recentBuckets: $("#recentBuckets"), coverWall: $("#coverWall"), statsPage: $("#statsPage"), shelfPages: $("#shelfPages"),
  adminTabButtons: $$(".admin-tab-btn"), adminTabPanels: $$(".admin-tab-panel"), curatedShelfSelect: $("#curatedShelf"),
  newCuratedShelfInput: $("#newCuratedShelfInput"), addCuratedShelfBtn: $("#addCuratedShelfBtn"), curatedShelfList: $("#curatedShelfList"),
  formatSelect: $("#format"), bindingSelect: $("#binding"),
};

function q() {
  const out = {
    keyword: els.keywordSearch.value.trim(), title: $("#advTitle").value.trim(), creator: $("#advCreator").value.trim(), subject: $("#advSubject").value.trim(),
    advKeyword: $("#advKeyword").value.trim(), year: $("#advYear").value.trim(), advFormat: $("#advFormat").value,
    facetFormat: els.facets.format.value, facetGenre: els.facets.genre.value, facetYear: els.facets.year.value, facetStatus: els.facets.status.value, facetLocation: els.facets.location.value,
    facetBinding: els.facets.binding.value, sort: els.sortFilter.value,
  };
  history.replaceState(null, "", `#search?${new URLSearchParams(out).toString()}`);
  return out;
}

function bindEvents() {
  $$(".nav-btn").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
  els.adminToggleBtn.addEventListener("click", () => { if (state.isAdmin) { state.isAdmin = false; logout(); if (state.view === "admin") switchView("search"); render(); return; } els.loginModal.classList.remove("hidden"); $("#username").focus(); });
  els.adminPageBtn.addEventListener("click", () => { window.location.href = "./ils.html"; });
  els.closeLoginBtn.addEventListener("click", () => els.loginModal.classList.add("hidden"));
  els.loginForm.addEventListener("submit", (e) => { e.preventDefault(); const ok = login($("#username").value.trim(), $("#password").value); if (!ok) { els.loginError.textContent = "Login failed."; return; } els.loginError.textContent = ""; els.loginModal.classList.add("hidden"); els.loginForm.reset(); state.isAdmin = true; render(); if (location.hash === "#admin") switchView("admin"); });

  [els.keywordSearch, els.sortFilter, $("#advTitle"), $("#advCreator"), $("#advSubject"), $("#advKeyword"), $("#advYear"), $("#advFormat")].forEach((el) => el.addEventListener("input", () => { state.shown = PAGE_SIZE; renderPublic(); }));
  els.keywordSearch.addEventListener("input", renderSuggestions);
  Object.values(els.facets).forEach((el) => el.addEventListener("change", () => { state.shown = PAGE_SIZE; renderPublic(); }));
  els.toggleAdvancedBtn.addEventListener("click", () => { const hidden = els.advancedSearch.classList.toggle("hidden"); els.toggleAdvancedBtn.setAttribute("aria-expanded", String(!hidden)); });
  els.clearFiltersBtn.addEventListener("click", () => { Object.values(els.facets).forEach((s) => { s.value = "all"; }); ["#advTitle", "#advCreator", "#advSubject", "#advKeyword", "#advYear"].forEach((id)=>$(id).value=""); $("#advFormat").value="all"; els.keywordSearch.value=""; renderPublic(); });
  els.loadMoreBtn.addEventListener("click", () => { state.shown += PAGE_SIZE; renderPublic(); });
  els.arrivalsPrevBtn.addEventListener("click", () => { state.arrivalsPage = Math.max(state.arrivalsPage - 1, 0); renderArrivals(); });
  els.arrivalsNextBtn.addEventListener("click", () => { const maxPage = Math.max(Math.ceil(getRecentArrivals().length / 5) - 1, 0); state.arrivalsPage = Math.min(state.arrivalsPage + 1, maxPage); renderArrivals(); });
  els.randomItemBtn.addEventListener("click", () => openDetail(state.records[Math.floor(Math.random() * state.records.length)]));

  els.recordForm.addEventListener("input", checkDuplicateDraft);
  els.recordForm.addEventListener("submit", saveFormRecord);
  els.cancelEditBtn.addEventListener("click", () => { els.recordForm.reset(); $("#recordId").value = ""; checkDuplicateDraft(); });
  els.fetchMetadataBtn.addEventListener("click", fetchMetadata);
  els.coverUpload.addEventListener("change", handleCoverUpload);
  els.recordForm.addEventListener("dragover", (e) => e.preventDefault());
  els.recordForm.addEventListener("drop", handleCoverDrop);

  els.adminSearch.addEventListener("input", renderAdminTable);
  els.selectAllRows.addEventListener("change", (e) => { state.selectedIds.clear(); if (e.target.checked) getAdminFiltered().forEach((r) => state.selectedIds.add(r.id)); renderAdminTable(); });
  els.applyBulkBtn.addEventListener("click", () => { const status = els.bulkStatusSelect.value; if (!status || !state.selectedIds.size) return; state.records = state.records.map((r) => (state.selectedIds.has(r.id) ? { ...r, status } : r)); saveRecords(state.records); render(); });
  els.bulkGenreAddBtn.addEventListener("click", bulkAddGenres);

  els.addLocationBtn.addEventListener("click", addLocation);
  els.addGenreBtn.addEventListener("click", addGenre);
  els.addCuratedShelfBtn.addEventListener("click", addCuratedShelf);
  els.adminTabButtons.forEach((btn) => btn.addEventListener("click", () => switchAdminTab(btn.dataset.adminTab)));
  els.exportBtn.addEventListener("click", () => exportRecords(state.records));
  els.importInput.addEventListener("change", async (e) => { if (!e.target.files?.[0]) return; state.records = await importRecords(e.target.files[0]); saveRecords(state.records); render(); });
  els.closeRecordDetailsBtn.addEventListener("click", () => els.recordDetailsModal.classList.add("hidden"));
}

function switchView(view) {
  state.view = view;
  if (view === "admin") history.replaceState(null, "", "#admin");
  ["Search", "Recent", "Covers", "Stats", "Shelves"].forEach((v) => $(`#view${v}`).classList.toggle("hidden", view !== v.toLowerCase()));
  if (view === "admin" && !state.isAdmin) { location.hash = "#admin"; els.loginModal.classList.remove("hidden"); $("#username").focus(); state.view = "search"; view = "search"; }
  els.adminSection.classList.toggle("hidden", view !== "admin" || !state.isAdmin);
  if (view !== "admin" && location.hash === "#admin") history.replaceState(null, "", "#search");
  if (view === "recent") renderRecentPage();
  if (view === "covers") renderCoverWall();
  if (view === "stats") renderStatsPage();
  if (view === "shelves") renderShelfPages();
  if (view === "admin") switchAdminTab(state.adminTab);
}

function switchAdminTab(tab) {
  state.adminTab = tab;
  els.adminTabButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.adminTab === tab));
  els.adminTabPanels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.adminPanel !== tab));
}

function getManagedGenres() {
  return [...new Set([...(state.settings.genres || []), ...PRELOADED_GENRES, ...state.records.flatMap((r) => asArray(r.genres?.length ? r.genres : r.genre))])].filter(Boolean).sort((a,b)=>a.localeCompare(b));
}

function fillGenres() {
  const managed = getManagedGenres();
  els.genres.innerHTML = managed.map((g) => `<option value="${g}">${g}</option>`).join("");
  els.bulkGenreSelect.innerHTML = managed.map((g) => `<option value="${g}">${g}</option>`).join("");
  renderGenreList(managed);
}

function fillLocations() {
  const locations = [...new Set([...state.settings.locations, ...state.records.map((r)=>r.location).filter(Boolean)])].sort((a,b)=>a.localeCompare(b));
  els.locationSelect.innerHTML = ['<option value="">Unspecified</option>', ...locations.map((loc) => `<option>${loc}</option>`)].join("");
  renderLocationList(locations);
}

function getManagedCuratedShelves() {
  return [...new Set([...(state.settings.curatedShelves || []), ...state.records.map((r) => r.curatedShelf).filter(Boolean)])].sort((a,b)=>a.localeCompare(b));
}

function fillCuratedShelves() {
  const shelves = getManagedCuratedShelves();
  const current = els.curatedShelfSelect.value || "";
  els.curatedShelfSelect.innerHTML = ['<option value="">None</option>', ...shelves.map((shelf) => `<option value="${shelf}">${shelf}</option>`)].join("");
  els.curatedShelfSelect.value = shelves.includes(current) ? current : "";
  renderCuratedShelfList(shelves);
}

function getManagedFormats() {
  const defaults = ["Book", "Vinyl", "Board Game", "CD", "Zine", "Magazine", "Other"];
  return [...new Set([...(state.settings.formats || []), ...defaults, ...state.records.map((r) => r.format).filter(Boolean)])].sort((a,b)=>a.localeCompare(b));
}

function fillFormats() {
  const formats = getManagedFormats();
  const current = els.formatSelect.value || "";
  els.formatSelect.innerHTML = formats.map((format) => `<option value="${format}">${format}</option>`).join("");
  els.formatSelect.value = formats.includes(current) ? current : (formats[0] || "Other");
}

function getManagedBindings() {
  return [...new Set([...(state.settings.bindings || []), "Paperback", "Hardcover", ...state.records.map((r) => r.binding).filter(Boolean)])].sort((a,b)=>a.localeCompare(b));
}

function fillBindings() {
  const bindings = getManagedBindings();
  const current = els.bindingSelect.value || "";
  els.bindingSelect.innerHTML = ['<option value="">None</option>', ...bindings.map((binding) => `<option value="${binding}">${binding}</option>`)].join("");
  els.bindingSelect.value = bindings.includes(current) ? current : "";
}

function renderLocationList(locations) {
  els.locationList.innerHTML = "";
  locations.forEach((loc) => {
    const li = document.createElement("li");
    li.innerHTML = `${loc} <button class="button button-secondary" type="button">Delete</button>`;
    li.querySelector("button").addEventListener("click", () => { state.settings.locations = state.settings.locations.filter((l) => l !== loc); saveSettings(state.settings); fillLocations(); renderPublic(); });
    els.locationList.appendChild(li);
  });
}


function renderGenreList(genres) {
  els.genreList.innerHTML = "";
  genres.forEach((genre) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${genre}</span><div><button class="button button-secondary" data-act="rename" type="button">Edit</button> <button class="button button-secondary" data-act="delete" type="button">Delete</button></div>`;
    li.querySelector('[data-act="rename"]').addEventListener("click", () => {
      const next = window.prompt("Rename genre", genre);
      if (!next || next.trim() === genre) return;
      renameGenre(genre, next.trim());
    });
    li.querySelector('[data-act="delete"]').addEventListener("click", () => {
      deleteGenre(genre);
    });
    els.genreList.appendChild(li);
  });
}

function addGenre() {
  const value = els.newGenreInput.value.trim();
  if (!value) return;
  const set = new Set(state.settings.genres || []);
  set.add(value);
  state.settings.genres = [...set].sort((a,b)=>a.localeCompare(b));
  saveSettings(state.settings);
  els.newGenreInput.value = "";
  fillGenres();
}

function renameGenre(prev, next) {
  const replace = (record) => {
    const genres = asArray(record.genres?.length ? record.genres : record.genre).map((g) => (g === prev ? next : g));
    const unique = [...new Set(genres)];
    return { ...record, genres: unique, genre: unique.join(", ") };
  };
  state.records = state.records.map(replace);
  const set = new Set((state.settings.genres || []).map((g) => (g === prev ? next : g)));
  state.settings.genres = [...set].sort((a,b)=>a.localeCompare(b));
  saveSettings(state.settings);
  saveRecords(state.records);
  render();
}

function deleteGenre(target) {
  state.records = state.records.map((record) => {
    const genres = asArray(record.genres?.length ? record.genres : record.genre).filter((g) => g !== target);
    return { ...record, genres, genre: genres.join(", ") };
  });
  state.settings.genres = (state.settings.genres || []).filter((g) => g !== target);
  saveSettings(state.settings);
  saveRecords(state.records);
  render();
}
function renderCuratedShelfList(shelves) {
  els.curatedShelfList.innerHTML = "";
  shelves.forEach((shelf) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${shelf}</span><div><button class="button button-secondary" data-act="rename" type="button">Edit</button> <button class="button button-secondary" data-act="delete" type="button">Delete</button></div>`;
    li.querySelector('[data-act="rename"]').addEventListener("click", () => {
      const next = window.prompt("Rename curated shelf", shelf);
      if (!next || next.trim() === shelf) return;
      renameCuratedShelf(shelf, next.trim());
    });
    li.querySelector('[data-act="delete"]').addEventListener("click", () => deleteCuratedShelf(shelf));
    els.curatedShelfList.appendChild(li);
  });
}

function addCuratedShelf() {
  const value = els.newCuratedShelfInput.value.trim();
  if (!value) return;
  const set = new Set(state.settings.curatedShelves || []);
  set.add(value);
  state.settings.curatedShelves = [...set].sort((a,b)=>a.localeCompare(b));
  saveSettings(state.settings);
  els.newCuratedShelfInput.value = "";
  fillCuratedShelves();
}

function renameCuratedShelf(prev, next) {
  state.records = state.records.map((record) => (record.curatedShelf === prev ? { ...record, curatedShelf: next } : record));
  const set = new Set((state.settings.curatedShelves || []).map((shelf) => shelf === prev ? next : shelf));
  state.settings.curatedShelves = [...set].sort((a,b)=>a.localeCompare(b));
  saveSettings(state.settings);
  saveRecords(state.records);
  render();
}

function deleteCuratedShelf(target) {
  state.settings.curatedShelves = (state.settings.curatedShelves || []).filter((shelf) => shelf !== target);
  saveSettings(state.settings);
  fillCuratedShelves();
}




function addLocation() {
  const value = els.newLocationInput.value.trim();
  if (!value) return;
  if (!state.settings.locations.includes(value)) state.settings.locations.push(value);
  saveSettings(state.settings);
  els.newLocationInput.value = "";
  fillLocations();
}

async function fetchMetadata() {
  const isbn = $("#identifier").value.trim().replace(/[^0-9Xx]/g, "");
  if (!isbn) return;
  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!res.ok) throw new Error("No metadata found");
    const data = await res.json();
    const map = { title: "#title", publishers: "#publisher", publish_date: "#year", notes: "#description" };
    Object.entries(map).forEach(([k, id]) => { if (!$(id).value && data[k]) $(id).value = Array.isArray(data[k]) ? data[k][0] : String(data[k]).slice(0, 300); });
    if (!$("#creator").value && Array.isArray(data.authors) && data.authors.length) {
      const authorNames = await Promise.all(data.authors.map(async (authorRef) => {
        try {
          const resAuthor = await fetch(`https://openlibrary.org${authorRef.key}.json`);
          if (!resAuthor.ok) return "";
          const authorData = await resAuthor.json();
          return String(authorData.name || "").trim();
        } catch {
          return "";
        }
      }));
      const normalized = authorNames.filter(Boolean);
      if (normalized.length) $("#creator").value = normalized.join(", ");
    }
    if (!$("#coverUrl").value) $("#coverUrl").value = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    flash("Metadata fetched.");
  } catch (error) {
    flash(`Metadata fetch failed: ${error.message}`, true);
  }
}

function handleCoverUpload() {
  const file = els.coverUpload.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { $("#coverUrl").value = reader.result; };
  reader.readAsDataURL(file);
}

function handleCoverDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => { $("#coverUrl").value = reader.result; flash("Cover dropped and loaded."); };
  reader.readAsDataURL(file);
}

function saveFormRecord(e) {
  e.preventDefault();
  const id = $("#recordId").value || crypto.randomUUID();
  const dateAdded = $("#dateAdded").value || new Date().toISOString().slice(0, 10);
  const selectedGenres = [...els.genres.selectedOptions].map((o) => o.value);
  const custom = $("#genre").value.trim();
  const genres = [...new Set([...selectedGenres, ...(custom ? [custom] : [])])];

  const record = normalizeRecord({
    id,
    permalink: `record-${id}`,
    title: $("#title").value.trim(), subtitle: $("#subtitle").value.trim(), creator: $("#creator").value.trim(), contributors: $("#contributors").value.trim(),
    format: $("#format").value, edition: $("#edition").value.trim(), year: $("#year").value.trim(), publisher: $("#publisher").value.trim(), identifier: $("#identifier").value.trim(),
    genre: genres.join(", "), genres, subjects: $("#subjects").value.trim(), description: $("#description").value.trim(),
    location: $("#location").value, callNumber: $("#callNumber").value.trim(), accessionNumber: $("#accessionNumber").value.trim(), status: $("#status").value,
    dateAcquired: $("#dateAcquired").value, dateAdded, source: $("#source").value.trim(), pricePaid: $("#pricePaid").value.trim(), notes: $("#notes").value.trim(), coverUrl: $("#coverUrl").value.trim(),
    binding: $("#binding").value, seriesName: $("#seriesName").value.trim(), seriesNumber: $("#seriesNumber").value.trim(), curatedShelf: $("#curatedShelf").value,
    pageCount: $("#pageCount").value.trim(), addedAt: new Date(dateAdded).getTime() || Date.now(),
  });

  const idx = state.records.findIndex((r) => r.id === id);
  if (idx >= 0) state.records[idx] = record; else state.records.unshift(record);
  saveRecords(state.records);
  flash("Record saved.");
  els.recordForm.reset();
  $("#recordId").value = "";
  render();
}

function checkDuplicateDraft() {
  const draft = { id: $("#recordId").value, title: $("#title").value.trim(), creator: $("#creator").value.trim(), identifier: $("#identifier").value.trim() };
  if (!draft.title || !draft.creator) { els.duplicateWarning.textContent = ""; return; }
  const dupes = duplicateCandidates(state.records, draft);
  els.duplicateWarning.textContent = dupes.length ? `Possible duplicate found. Existing: ${dupes[0].title} by ${dupes[0].creator}. You may still save.` : "";
}

function render() {
  els.adminToggleBtn.textContent = state.isAdmin ? "Logout Admin" : "Admin Login";
  els.adminPageBtn.classList.remove("hidden");
  fillGenres();
  fillLocations();
  fillCuratedShelves();
  fillFormats();
  fillBindings();
  renderPublic();
  renderAdminTable();
}

function renderPublic() {
  renderArrivals();
  const facets = buildFacets(state.records);
  fillFacet(els.facets.format, ["all", ...facets.format]); fillFacet(els.facets.genre, ["all", ...facets.genre]); fillFacet(els.facets.year, ["all", ...facets.year]); fillFacet(els.facets.status, ["all", ...facets.status]); fillFacet(els.facets.location, ["all", ...facets.location]); fillFacet(els.facets.binding, ["all", ...facets.binding]);
  const criteria = q();
  const hasSearchInput = hasActiveSearch(criteria);
  const results = hasSearchInput ? queryRecords(state.records, criteria) : [];
  const visible = results.slice(0, state.shown);
  els.publicResults.innerHTML = "";
  visible.forEach((r) => els.publicResults.appendChild(renderCard(r, criteria.keyword || criteria.advKeyword)));
  const suggestion = didYouMean(state.records, criteria.keyword);
  els.didYouMean.innerHTML = suggestion && hasSearchInput ? `Did you mean <button class="subject-link" type="button" id="dymBtn">${suggestion}</button>?` : "";
  $("#dymBtn")?.addEventListener("click", ()=>{els.keywordSearch.value=suggestion; renderPublic();});
  els.resultsSummary.textContent = hasSearchInput ? `${results.length} results` : "Search to view catalog records.";
  els.emptyState.classList.toggle("hidden", results.length > 0 && hasSearchInput);
  els.loadMoreBtn.classList.toggle("hidden", !hasSearchInput || results.length <= visible.length);
  const stats = getStats(state.records);
  els.catalogStats.innerHTML = `<span>Total: <strong>${stats.total}</strong></span><span>Recently added (30d): <strong>${stats.recentlyAdded}</strong></span>${Object.entries(stats.byFormat).map(([k, v]) => `<span>${k}: <strong>${v}</strong></span>`).join("")}`;
}

function renderSuggestions() {
  const term = els.keywordSearch.value.trim().toLowerCase();
  if (term.length < 2) { els.searchSuggestions.classList.add("hidden"); els.searchSuggestions.innerHTML = ""; return; }
  const suggestions = [...new Set(state.records.flatMap((r) => [r.title, r.creator, ...asArray(r.genres?.length ? r.genres : r.genre)]).filter((s) => s && s.toLowerCase().includes(term)).slice(0, 8))];
  els.searchSuggestions.innerHTML = suggestions.map((s) => `<button type="button" class="suggestion-item">${s}</button>`).join("");
  els.searchSuggestions.classList.toggle("hidden", !suggestions.length);
  els.searchSuggestions.querySelectorAll(".suggestion-item").forEach((btn) => btn.addEventListener("click", () => { els.keywordSearch.value = btn.textContent; els.searchSuggestions.classList.add("hidden"); renderPublic(); }));
}

function hasActiveSearch(c) { return Boolean(c.keyword || c.title || c.creator || c.subject || c.advKeyword || c.year || (c.advFormat && c.advFormat !== "all") || Object.entries(c).some(([k,v])=>k.startsWith("facet") && v !== "all")); }
function getRecentArrivals() { return [...state.records].sort((a, b) => Number(b.addedAt) - Number(a.addedAt)).slice(0, 24); }

function renderArrivals() {
  const recent = getRecentArrivals(); const perPage = 5; const pages = Math.max(Math.ceil(recent.length / perPage), 1); state.arrivalsPage = Math.min(state.arrivalsPage, pages - 1);
  const pageItems = recent.slice(state.arrivalsPage * perPage, state.arrivalsPage * perPage + perPage);
  els.newArrivals.innerHTML = "";
  pageItems.forEach((r) => { const b = document.createElement("button"); b.className = "arrival-item"; b.type = "button"; b.innerHTML = `<img class="arrival-cover" src="${r.coverUrl || PLACEHOLDER_COVER}" alt="Cover for ${r.title}"><span class="arrival-title">${r.title}</span>`; b.classList.toggle("status-on-order", String(r.status||"").toLowerCase()==="on order"); b.addEventListener("click", () => openDetail(r)); els.newArrivals.appendChild(b); });
  els.arrivalsPrevBtn.disabled = state.arrivalsPage === 0; els.arrivalsNextBtn.disabled = state.arrivalsPage >= pages - 1;
}

function fillFacet(select, values) { const current = select.value || "all"; select.innerHTML = values.map((v) => `<option value="${v}">${v === "all" ? "All" : `${v} (${facetCount(select.id, v)})`}</option>`).join(""); select.value = values.includes(current) ? current : "all"; }
function facetCount(id, value) { if (value === "all") return state.records.length; const map={facetFormat:"format",facetGenre:"genre",facetYear:"year",facetStatus:"status",facetLocation:"location",facetBinding:"binding"}; const k=map[id]; return state.records.filter((r)=> k==="genre" ? asArray(r.genres?.length?r.genres:r.genre).includes(value) : String(r[k]||"")===value).length; }

function highlight(text, term) { if (!term) return text; const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"); return String(text||"").replace(re, "<mark>$1</mark>"); }
function renderCard(r, term) {
  const node = els.template.content.firstElementChild.cloneNode(true);
  node.classList.toggle("status-on-order", String(r.status || "").toLowerCase() === "on order");
  node.querySelector(".cover").src = r.coverUrl || PLACEHOLDER_COVER; node.querySelector(".cover").alt = `Cover for ${r.title}`;
  const formatBadge = node.querySelector(".badge-format");
  const statusBadge = node.querySelector(".badge-status");
  formatBadge.textContent = r.format; statusBadge.textContent = r.status;
  formatBadge.dataset.format = String(r.format || "other").toLowerCase().replace(/\s+/g, "-");
  statusBadge.dataset.status = String(r.status || "").toLowerCase().replace(/\s+/g, "-");
  node.querySelector(".record-title").innerHTML = highlight(r.title, term);
  node.querySelector(".record-meta").innerHTML = highlight(`${r.creator}${r.year ? ` • ${r.year}` : ""}${r.binding ? ` • ${r.binding}` : ""}`, term);
  node.querySelector(".record-location").textContent = `${r.callNumber || "No call number"} • ${r.location || "No location"}`;
  const subjectWrap = node.querySelector(".record-subjects"); const subjects = asArray(r.genres?.length ? r.genres : (r.subjects || r.genre)).slice(0, 4);
  subjectWrap.innerHTML = subjects.map((s) => `<button class="subject-link" type="button">${s}</button>`).join(" ");
  subjectWrap.querySelectorAll(".subject-link").forEach((btn) => btn.addEventListener("click", () => { $("#advSubject").value = btn.textContent; renderPublic(); }));
  node.querySelector(".expand-btn").addEventListener("click", () => { const detail=node.querySelector('.inline-details'); detail.classList.toggle('hidden'); detail.innerHTML=`<p class="muted">${r.description || "No description"}</p><p class="muted">Series: ${r.seriesName || "n/a"}${r.seriesNumber ? ` #${r.seriesNumber}` : ""}</p>`; });
  node.querySelector(".view-details-btn").addEventListener("click", () => openDetail(r));
  return node;
}

function openDetail(record) {
  if (!record) return;
  location.hash = `record-${record.id}`;
  const related = getRelated(state.records, record);
  const genres = asArray(record.genres?.length ? record.genres : record.genre);
  const decade = record.year ? `${Math.floor(Number(record.year) / 10) * 10}s` : "";
  els.recordDetailsBody.innerHTML = `<article class="opac-record-layout"><div class="record-columns"><div class="record-image-column"><img src="${record.coverUrl || PLACEHOLDER_COVER}" alt="Cover for ${record.title}" class="details-cover" /></div><section class="record-main-column"><h4>${record.title}</h4><p class="muted">${record.subtitle || ""}</p><dl class="metadata-grid"><dt>Author / Creator</dt><dd><button class="subject-link" id="authorPageBtn" type="button">${record.creator}</button></dd><dt>Publisher</dt><dd>${record.publisher || "Unknown"}</dd><dt>Published</dt><dd>${record.year || "n.d."}</dd><dt>Genres</dt><dd>${genres.join(", ") || "n/a"}</dd><dt>Binding</dt><dd>${record.binding || "n/a"}</dd><dt>Series</dt><dd>${record.seriesName ? `${record.seriesName}${record.seriesNumber ? ` #${record.seriesNumber}` : ""}` : "n/a"}</dd><dt>Identifier</dt><dd>${record.identifier || "n/a"}</dd>${record.pageCount ? `<dt>Pages</dt><dd>${record.pageCount}</dd>` : ""}<dt>Date acquired</dt><dd>${record.dateAcquired || "n/a"}${record.pricePaid ? ` • $${record.pricePaid}` : ""}</dd></dl></section><aside class="record-availability-column"><div class="availability-card ${String(record.status||"").toLowerCase()==="on order"?"status-on-order":""}"><h5>Availability</h5><p><strong>Status:</strong> ${record.status}</p><p><strong>Location:</strong> ${record.location || "n/a"}</p><p><strong>Call Number:</strong> ${record.callNumber || "n/a"}</p><p><strong>Format:</strong> ${record.format}</p></div></aside></div><section class="detail-section"><h5>Description</h5><p>${record.description || "No description"}</p></section><section class="detail-section"><h5>Collection Pathways</h5><p class="muted"><button class="subject-link" id="decadeBtn" type="button">More from ${decade || "this era"}</button> <button class="subject-link" id="genreBtn" type="button">More ${genres[0] || "in this category"}</button></p></section><section class="detail-section"><h5>Series & Related</h5><p class="muted">Series items: ${related.bySeries.map((r)=>r.title).join(", ") || "None"}</p><p class="muted">By creator: ${related.byCreator.map((r)=>r.title).join(", ") || "None"}</p></section><section class="detail-section nearby-section"><h5>Browse a Shelf</h5><div class="nearby-spines" role="list">${related.virtualShelf.map((item)=>`<button class="book-spine ${item.id===record.id?"selected":""}" data-record-id="${item.id}" style="--spine-width:${getSpineWidth(item)}px" type="button"><span class="spine-title"><span>${item.title}</span><span>${item.creator || "Unknown"}</span></span><span class="spine-call">${item.callNumber || "No call #"}</span></button>`).join("")}</div></section></article>`;
  els.recordDetailsBody.querySelectorAll(".book-spine").forEach((spine) => spine.addEventListener("click", () => openDetail(state.records.find((r) => r.id === spine.dataset.recordId))));
  $("#authorPageBtn")?.addEventListener("click", ()=>renderAuthorPage(record.creator));
  $("#decadeBtn")?.addEventListener("click", ()=>{els.keywordSearch.value=decade.slice(0,4); switchView('search'); renderPublic();});
  $("#genreBtn")?.addEventListener("click", ()=>{$("#advSubject").value=genres[0]||""; switchView('search'); renderPublic();});
  els.recordDetailsModal.classList.remove("hidden");
}

function renderAuthorPage(author) {
  const normalized = normalizeAuthor(author);
  const items = state.records.filter((r)=>normalizeAuthor(r.creator)===normalized);
  switchView("covers");
  els.coverWall.innerHTML = `<h4>${author}</h4>` + items.map((r, i)=>`<button class="wall-item ${i%2?'stacked':''}" type="button" data-id="${r.id}"><img src="${r.coverUrl || PLACEHOLDER_COVER}" alt="${r.title}" /><span>${r.title}</span></button>`).join("");
  els.coverWall.querySelectorAll(".wall-item").forEach((b)=>b.addEventListener("click", ()=>openDetail(state.records.find((r)=>r.id===b.dataset.id))));
}

function renderRecentPage() {
  const now = Date.now();
  const week = state.records.filter((r)=>Number(r.addedAt)>now-1000*60*60*24*7);
  const weekIds = new Set(week.map((r)=>r.id));
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);
  const month = state.records.filter((r)=>Number(r.addedAt)>=monthStart.getTime() && !weekIds.has(r.id));
  els.recentBuckets.innerHTML = `<h4>This week</h4>${week.map((r)=>`<p><button class="subject-link recent-open" data-id="${r.id}" type="button">${r.title}</button> — ${r.creator}</p>`).join("") || '<p class="muted">No additions.</p>'}<h4>This month</h4>${month.map((r)=>`<p><button class="subject-link recent-open" data-id="${r.id}" type="button">${r.title}</button> — ${r.creator}</p>`).join("")}`;
  els.recentBuckets.querySelectorAll('.recent-open').forEach((b)=>b.addEventListener('click',()=>openDetail(state.records.find((r)=>r.id===b.dataset.id))));
}
function renderCoverWall() {
  const shuffled = [...state.records].sort(() => Math.random() - 0.5);
  els.coverWall.innerHTML = shuffled.map((r)=>`<button class="wall-item ${String(r.status||"").toLowerCase()==="on order"?"status-on-order":""}" data-id="${r.id}" type="button"><img src="${r.coverUrl || PLACEHOLDER_COVER}" alt="${r.title}" /><span>${r.title}</span></button>`).join("");
  els.coverWall.querySelectorAll(".wall-item").forEach((b)=>b.addEventListener("click",()=>openDetail(state.records.find((r)=>r.id===b.dataset.id))));
}
function renderStatsPage() {
  const s = getStats(state.records);
  els.statsPage.innerHTML = `<p>Total items: <strong>${s.total}</strong></p><p>Formats: ${Object.entries(s.byFormat).map(([k,v])=>`${k} (${v})`).join(' • ')}</p><p>Most owned authors: ${s.mostOwnedAuthors.map((a)=>`${a.author} (${a.count})`).join(', ')}</p><p>Publication year distribution: ${Object.entries(s.byYear).map(([k,v])=>`${k}: ${v}`).join(' • ')}</p><p>Newest additions: ${s.newest.map((r)=>r.title).join(', ')}</p>`;
}
function renderShelfPages() {
  const map = state.records.reduce((acc, r)=>{ if (!r.curatedShelf) return acc; (acc[r.curatedShelf] ||= []).push(r); return acc; }, {});
  els.shelfPages.innerHTML = Object.entries(map).map(([name, items])=>`<section><h4>${name}</h4><div class="cover-wall">${items.map((r,i)=>`<button class="wall-item ${i%3===0?'stacked':''}" data-id="${r.id}" type="button"><img src="${r.coverUrl || PLACEHOLDER_COVER}" alt="${r.title}" /><span>${r.title}</span></button>`).join('')}</div></section>`).join('') || '<p class="muted">No curated shelves yet.</p>';
  els.shelfPages.querySelectorAll('.wall-item').forEach((b)=>b.addEventListener('click',()=>openDetail(state.records.find((r)=>r.id===b.dataset.id))));
}

function getAdminFiltered() { const term = els.adminSearch.value.trim().toLowerCase(); if (!term) return state.records; return state.records.filter((r) => `${r.title} ${r.creator} ${r.identifier || ""}`.toLowerCase().includes(term)); }

function getSpineWidth(record) {
  const pageCount = Number(record.pageCount);
  if (Number.isFinite(pageCount) && pageCount > 0) return Math.min(72, Math.max(48, Math.round(44 + (pageCount / 900) * 28)));
  const seed = [...String(record.id || `${record.title}-${record.creator}`)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 52 + (seed % 9);
}
function renderAdminTable() {
  els.adminTableBody.innerHTML = ""; if (!state.isAdmin) return;
  getAdminFiltered().forEach((r) => { const tr = document.createElement("tr"); tr.innerHTML = `<td><input type="checkbox" ${state.selectedIds.has(r.id) ? "checked" : ""}></td><td>${r.title}</td><td>${r.creator}</td><td>${r.format}</td><td>${r.year || ""}</td><td>${r.status}</td><td class="row-actions"><button class="button button-secondary" data-act="edit">Edit</button><button class="button button-secondary" data-act="dup">Duplicate</button><button class="button" data-act="del">Delete</button></td>`;
    tr.querySelector('input[type="checkbox"]').addEventListener("change", (e) => { if (e.target.checked) state.selectedIds.add(r.id); else state.selectedIds.delete(r.id); });
    tr.querySelector('[data-act="edit"]').addEventListener("click", () => populateForm(r));
    tr.querySelector('[data-act="dup"]').addEventListener("click", () => { const copy = normalizeRecord({ ...r, id: crypto.randomUUID(), title: `${r.title} (Copy)` }); state.records.unshift(copy); saveRecords(state.records); render(); });
    tr.querySelector('[data-act="del"]').addEventListener("click", () => { state.records = state.records.filter((x) => x.id !== r.id); saveRecords(state.records); render(); });
    els.adminTableBody.appendChild(tr); });
}

function bulkAddGenres() {
  const selectedGenres = [...els.bulkGenreSelect.selectedOptions].map((o)=>o.value);
  if (!selectedGenres.length || !state.selectedIds.size) return;
  state.records = state.records.map((r)=>{
    if (!state.selectedIds.has(r.id)) return r;
    const merged = [...new Set([...(r.genres || asArray(r.genre)), ...selectedGenres])];
    return { ...r, genres: merged, genre: merged.join(', ') };
  });
  saveRecords(state.records);
  render();
}

function populateForm(r) {
  const fields = ["recordId:id", "title", "subtitle", "creator", "contributors", "format", "edition", "year", "publisher", "identifier", "genre", "subjects", "description", "location", "callNumber", "accessionNumber", "status", "dateAcquired", "dateAdded", "source", "pricePaid", "notes", "coverUrl", "binding", "seriesName", "seriesNumber", "curatedShelf", "pageCount"];
  fields.forEach((pair) => { const [elId, prop] = pair.includes(":") ? pair.split(":") : [pair, pair]; $(`#${elId}`).value = r[prop] || ""; });
  [...els.genres.options].forEach((option)=>{ option.selected = (r.genres || asArray(r.genre)).includes(option.value); });
  switchAdminTab("catalog");
  window.scrollTo({ top: els.adminSection.offsetTop - 20, behavior: "smooth" });
}
function flash(msg, isError = false) { els.adminMessage.textContent = msg; els.adminMessage.classList.toggle("error", isError); setTimeout(() => { els.adminMessage.textContent = ""; }, 2400); }


async function hydrateRemoteRecords() {
  if (!isFirebaseConfigured()) return;
  const remoteRecords = await loadRecordsFromRemote();
  if (remoteRecords.length) {
    state.records = remoteRecords;
    saveRecords(state.records);
    render();
  }

  subscribeToFirebaseRecords((records) => {
    state.records = records.map(normalizeRecord);
    localStorage.setItem("catalogRecordsV2", JSON.stringify(state.records));
    render();
  });
}

bindEvents();
render();
hydrateRemoteRecords();
switchView("search");
if (location.hash === "#admin") switchView("admin");
if (location.hash.startsWith("#record-")) { const id = location.hash.replace("#record-", ""); const hit = state.records.find((r) => r.id === id); if (hit) openDetail(hit); }
