import { PAGE_SIZE, PLACEHOLDER_COVER } from "./config.js";
import { loadRecords, saveRecords, exportRecords, importRecords, normalizeRecord } from "./storage.js";
import { login, logout, isAdminSessionActive } from "./auth.js";
import { sampleRecords } from "./seed.js";
import { buildFacets, queryRecords, getStats, duplicateCandidates, getRelated } from "./catalog.js";

const state = {
  isAdmin: isAdminSessionActive(),
  records: loadRecords(),
  shown: PAGE_SIZE,
  selectedIds: new Set(),
  currentDetail: null,
  arrivalsPage: 0,
};

const $ = (s) => document.querySelector(s);
const els = {
  adminToggleBtn: $("#adminToggleBtn"),
  adminSection: $("#adminSection"),
  loginModal: $("#loginModal"),
  closeLoginBtn: $("#closeLoginBtn"),
  loginForm: $("#loginForm"),
  loginError: $("#loginError"),
  keywordSearch: $("#keywordSearch"),
  toggleAdvancedBtn: $("#toggleAdvancedBtn"),
  advancedSearch: $("#advancedSearch"),
  sortFilter: $("#sortFilter"),
  resultsSummary: $("#resultsSummary"),
  publicResults: $("#publicResults"),
  emptyState: $("#emptyState"),
  loadMoreBtn: $("#loadMoreBtn"),
  template: $("#recordTemplate"),
  catalogStats: $("#catalogStats"),
  newArrivals: $("#newArrivals"),
  arrivalsPrevBtn: $("#arrivalsPrevBtn"),
  arrivalsNextBtn: $("#arrivalsNextBtn"),
  randomItemBtn: $("#randomItemBtn"),
  facets: {
    format: $("#facetFormat"), genre: $("#facetGenre"), year: $("#facetYear"), status: $("#facetStatus"), location: $("#facetLocation"),
  },
  clearFiltersBtn: $("#clearFiltersBtn"),
  adminSearch: $("#adminSearch"),
  adminTableBody: $("#adminTableBody"),
  selectAllRows: $("#selectAllRows"),
  applyBulkBtn: $("#applyBulkBtn"),
  bulkStatusSelect: $("#bulkStatusSelect"),
  recordForm: $("#recordForm"),
  cancelEditBtn: $("#cancelEditBtn"),
  duplicateWarning: $("#duplicateWarning"),
  adminMessage: $("#adminMessage"),
  exportBtn: $("#exportBtn"),
  importInput: $("#importInput"),
  seedDataBtn: $("#seedDataBtn"),
  recordDetailsModal: $("#recordDetailsModal"),
  closeRecordDetailsBtn: $("#closeRecordDetailsBtn"),
  recordDetailsBody: $("#recordDetailsBody"),
  copyCitationBtn: $("#copyCitationBtn"),
};

function q() {
  return {
    keyword: els.keywordSearch.value.trim(),
    title: $("#advTitle").value.trim(),
    creator: $("#advCreator").value.trim(),
    subject: $("#advSubject").value.trim(),
    advKeyword: $("#advKeyword").value.trim(),
    year: $("#advYear").value.trim(),
    advFormat: $("#advFormat").value,
    facetFormat: els.facets.format.value,
    facetGenre: els.facets.genre.value,
    facetYear: els.facets.year.value,
    facetStatus: els.facets.status.value,
    facetLocation: els.facets.location.value,
    sort: els.sortFilter.value,
  };
}

function bindEvents() {
  els.adminToggleBtn.addEventListener("click", () => {
    if (state.isAdmin) {
      state.isAdmin = false;
      logout();
      render();
      return;
    }
    els.loginModal.classList.remove("hidden");
    $("#username").focus();
  });

  els.closeLoginBtn.addEventListener("click", () => els.loginModal.classList.add("hidden"));

  els.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = login($("#username").value.trim(), $("#password").value);
    if (!ok) {
      els.loginError.textContent = "Login failed. Use the configured coded admin account.";
      return;
    }
    els.loginError.textContent = "";
    els.loginModal.classList.add("hidden");
    els.loginForm.reset();
    state.isAdmin = true;
    render();
  });

  [els.keywordSearch, els.sortFilter, $("#advTitle"), $("#advCreator"), $("#advSubject"), $("#advKeyword"), $("#advYear"), $("#advFormat")]
    .forEach((el) => el.addEventListener("input", () => { state.shown = PAGE_SIZE; renderPublic(); }));

  Object.values(els.facets).forEach((el) => el.addEventListener("change", () => { state.shown = PAGE_SIZE; renderPublic(); }));

  els.toggleAdvancedBtn.addEventListener("click", () => {
    const hidden = els.advancedSearch.classList.toggle("hidden");
    els.toggleAdvancedBtn.setAttribute("aria-expanded", String(!hidden));
  });

  els.clearFiltersBtn.addEventListener("click", () => {
    Object.values(els.facets).forEach((s) => { s.value = "all"; });
    state.shown = PAGE_SIZE;
    renderPublic();
  });

  els.loadMoreBtn.addEventListener("click", () => { state.shown += PAGE_SIZE; renderPublic(); });
  els.arrivalsPrevBtn.addEventListener("click", () => {
    state.arrivalsPage = Math.max(state.arrivalsPage - 1, 0);
    renderArrivals();
  });
  els.arrivalsNextBtn.addEventListener("click", () => {
    const maxPage = Math.max(Math.ceil(getRecentArrivals().length / 5) - 1, 0);
    state.arrivalsPage = Math.min(state.arrivalsPage + 1, maxPage);
    renderArrivals();
  });
  els.randomItemBtn.addEventListener("click", () => openDetail(state.records[Math.floor(Math.random() * state.records.length)]));

  els.recordForm.addEventListener("input", checkDuplicateDraft);
  els.recordForm.addEventListener("submit", saveFormRecord);
  els.cancelEditBtn.addEventListener("click", () => { els.recordForm.reset(); $("#recordId").value = ""; checkDuplicateDraft(); });

  els.adminSearch.addEventListener("input", renderAdminTable);
  els.selectAllRows.addEventListener("change", (e) => {
    state.selectedIds.clear();
    if (e.target.checked) getAdminFiltered().forEach((r) => state.selectedIds.add(r.id));
    renderAdminTable();
  });

  els.applyBulkBtn.addEventListener("click", () => {
    const status = els.bulkStatusSelect.value;
    if (!status || !state.selectedIds.size) return;
    state.records = state.records.map((r) => (state.selectedIds.has(r.id) ? { ...r, status } : r));
    saveRecords(state.records);
    flash("Bulk update applied.");
    render();
  });

  els.exportBtn.addEventListener("click", () => exportRecords(state.records));
  els.importInput.addEventListener("change", async (e) => {
    if (!e.target.files?.[0]) return;
    try {
      state.records = await importRecords(e.target.files[0]);
      saveRecords(state.records);
      flash("Catalog imported successfully.");
      render();
    } catch (err) {
      flash(err.message, true);
    }
  });

  els.seedDataBtn.addEventListener("click", () => {
    state.records = [...sampleRecords];
    saveRecords(state.records);
    flash("Sample data seeded.");
    render();
  });

  els.closeRecordDetailsBtn.addEventListener("click", () => els.recordDetailsModal.classList.add("hidden"));
  els.copyCitationBtn.addEventListener("click", async () => {
    if (!state.currentDetail) return;
    const r = state.currentDetail;
    const citation = `${r.creator}. (${r.year || "n.d."}). ${r.title}${r.subtitle ? `: ${r.subtitle}` : ""}. ${r.publisher || "Unknown publisher"}.`;
    await navigator.clipboard.writeText(citation);
    flash("Citation copied to clipboard.");
  });

  window.addEventListener("hashchange", openByHash);
}

function saveFormRecord(e) {
  e.preventDefault();
  const form = new FormData(els.recordForm);
  const id = $("#recordId").value.trim() || crypto.randomUUID();
  const dateAdded = form.get("dateAdded") || new Date().toISOString().slice(0, 10);
  const record = normalizeRecord({
    id,
    title: $("#title").value.trim(),
    subtitle: $("#subtitle").value.trim(),
    creator: $("#creator").value.trim(),
    contributors: $("#contributors").value.trim(),
    format: $("#format").value,
    edition: $("#edition").value.trim(),
    year: $("#year").value.trim() ? Number($("#year").value) : "",
    publisher: $("#publisher").value.trim(),
    identifier: $("#identifier").value.trim(),
    genre: $("#genre").value.trim(),
    subjects: $("#subjects").value.trim(),
    description: $("#description").value.trim(),
    location: $("#location").value.trim(),
    callNumber: $("#callNumber").value.trim(),
    accessionNumber: $("#accessionNumber").value.trim(),
    status: $("#status").value,
    dateAcquired: $("#dateAcquired").value,
    dateAdded,
    notes: $("#notes").value.trim(),
    coverUrl: $("#coverUrl").value.trim(),
    addedAt: new Date(dateAdded).getTime() || Date.now(),
  });

  if (!record.title || !record.creator || !record.format) {
    flash("Title, creator, and format are required.", true);
    return;
  }

  const idx = state.records.findIndex((r) => r.id === id);
  if (idx >= 0) state.records[idx] = record;
  else state.records.unshift(record);

  saveRecords(state.records);
  flash("Record saved.");
  els.recordForm.reset();
  $("#recordId").value = "";
  checkDuplicateDraft();
  render();
}

function checkDuplicateDraft() {
  const draft = {
    id: $("#recordId").value,
    title: $("#title").value.trim(),
    creator: $("#creator").value.trim(),
  };
  if (!draft.title || !draft.creator) {
    els.duplicateWarning.textContent = "";
    return;
  }
  const dupes = duplicateCandidates(state.records, draft);
  els.duplicateWarning.textContent = dupes.length ? `Possible duplicate: ${dupes[0].title} by ${dupes[0].creator}.` : "";
}

function render() {
  els.adminSection.classList.toggle("hidden", !state.isAdmin);
  els.adminToggleBtn.textContent = state.isAdmin ? "Logout Admin" : "Admin Login";
  renderPublic();
  renderAdminTable();
}

function renderPublic() {
  renderArrivals();

  const facets = buildFacets(state.records);
  fillFacet(els.facets.format, ["all", ...facets.format]);
  fillFacet(els.facets.genre, ["all", ...facets.genre]);
  fillFacet(els.facets.year, ["all", ...facets.year]);
  fillFacet(els.facets.status, ["all", ...facets.status]);
  fillFacet(els.facets.location, ["all", ...facets.location]);

  const criteria = q();
  const hasSearchInput = hasActiveSearch(criteria);
  const results = hasSearchInput ? queryRecords(state.records, criteria) : [];
  const visible = results.slice(0, state.shown);

  els.publicResults.innerHTML = "";
  visible.forEach((r) => els.publicResults.appendChild(renderCard(r)));

  els.resultsSummary.textContent = hasSearchInput ? `${results.length} results` : "Search to view catalog records.";
  els.emptyState.textContent = hasSearchInput
    ? "No records match your search. Try broadening your filters or searching by keyword."
    : "Start with a keyword, advanced search field, or a filter to explore the catalog.";
  els.emptyState.classList.toggle("hidden", results.length > 0 && hasSearchInput);
  els.loadMoreBtn.classList.toggle("hidden", !hasSearchInput || results.length <= visible.length);

  const stats = getStats(state.records);
  els.catalogStats.innerHTML = `
    <span>Total: <strong>${stats.total}</strong></span>
    <span>Recently added (30d): <strong>${stats.recentlyAdded}</strong></span>
    ${Object.entries(stats.byFormat).map(([k, v]) => `<span>${k}: <strong>${v}</strong></span>`).join("")}
  `;

}


function hasActiveSearch(criteria) {
  return Boolean(
    criteria.keyword ||
    criteria.title ||
    criteria.creator ||
    criteria.subject ||
    criteria.advKeyword ||
    criteria.year ||
    (criteria.advFormat && criteria.advFormat !== "all") ||
    criteria.facetFormat !== "all" ||
    criteria.facetGenre !== "all" ||
    criteria.facetYear !== "all" ||
    criteria.facetStatus !== "all" ||
    criteria.facetLocation !== "all"
  );
}

function getRecentArrivals() {
  return [...state.records].sort((a, b) => Number(b.addedAt) - Number(a.addedAt)).slice(0, 24);
}

function renderArrivals() {
  const recent = getRecentArrivals();
  const perPage = 5;
  const pages = Math.max(Math.ceil(recent.length / perPage), 1);
  state.arrivalsPage = Math.min(state.arrivalsPage, pages - 1);

  const start = state.arrivalsPage * perPage;
  const pageItems = recent.slice(start, start + perPage);

  els.newArrivals.innerHTML = "";
  pageItems.forEach((r) => {
    const b = document.createElement("button");
    b.className = "arrival-item";
    b.type = "button";
    b.innerHTML = `<img class="arrival-cover" src="${r.coverUrl || PLACEHOLDER_COVER}" alt="Cover for ${r.title}"><span class="arrival-title">${r.title}</span>`;
    b.addEventListener("click", () => openDetail(r));
    els.newArrivals.appendChild(b);
  });

  els.arrivalsPrevBtn.disabled = state.arrivalsPage === 0;
  els.arrivalsNextBtn.disabled = state.arrivalsPage >= pages - 1;
}

function fillFacet(select, values) {
  const current = select.value || "all";
  select.innerHTML = values.map((v) => `<option value="${v}">${v === "all" ? "All" : v}</option>`).join("");
  select.value = values.includes(current) ? current : "all";
}

function renderCard(r) {
  const node = els.template.content.firstElementChild.cloneNode(true);
  node.querySelector(".cover").src = r.coverUrl || PLACEHOLDER_COVER;
  node.querySelector(".cover").alt = `Cover for ${r.title}`;
  const formatBadge = node.querySelector(".badge-format");
  formatBadge.textContent = r.format;
  formatBadge.dataset.format = r.format.toLowerCase().replace(/\s+/g, "-");
  const statusBadge = node.querySelector(".badge-status");
  statusBadge.textContent = r.status;
  statusBadge.dataset.status = r.status.toLowerCase().replace(/\s+/g, "-");
  node.classList.toggle("status-on-order", r.status === "On Order");
  node.querySelector(".record-title").textContent = r.title;
  node.querySelector(".record-meta").textContent = `${r.creator}${r.year ? ` • ${r.year}` : ""}`;
  node.querySelector(".record-location").textContent = `${r.callNumber || "No call number"} • ${r.location || "No location"}`;

  const subjectWrap = node.querySelector(".record-subjects");
  const subjects = (r.subjects || r.genre || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  subjectWrap.innerHTML = subjects.map((s) => `<button class="subject-link" type="button">${s}</button>`).join(" ");
  subjectWrap.querySelectorAll(".subject-link").forEach((btn) => btn.addEventListener("click", () => {
    $("#advSubject").value = btn.textContent;
    state.shown = PAGE_SIZE;
    renderPublic();
  }));

  node.querySelector(".view-details-btn").addEventListener("click", () => openDetail(r));
  return node;
}

function openDetail(record) {
  if (!record) return;
  state.currentDetail = record;
  location.hash = `record-${record.id}`;
  const related = getRelated(state.records, record);

  els.recordDetailsBody.innerHTML = `
    <div class="details-grid">
      <img src="${record.coverUrl || PLACEHOLDER_COVER}" alt="Cover for ${record.title}" class="details-cover" />
      <div>
        <h4>${record.title}</h4>
        <p class="muted">${record.subtitle || ""}</p>
        <p><strong>${record.creator}</strong>${record.contributors ? `; ${record.contributors}` : ""}</p>
        <p>${record.format} • ${record.year || "n.d."} • ${record.status}</p>
        <p>${record.publisher || "Unknown publisher"}</p>
        <p>Location: ${record.location || "n/a"} | Call Number: ${record.callNumber || "n/a"}</p>
      </div>
    </div>
    <section class="full-record">
      <h5>Full Record (Catalog Data)</h5>
      <dl>
        <dt>Accession Number</dt><dd>${record.accessionNumber || "n/a"}</dd>
        <dt>Identifier</dt><dd>${record.identifier || "n/a"}</dd>
        <dt>Subjects</dt><dd>${record.subjects || "n/a"}</dd>
        <dt>Description</dt><dd>${record.description || "n/a"}</dd>
        <dt>Notes</dt><dd>${record.notes || "n/a"}</dd>
        <dt>Date Cataloged</dt><dd>${record.dateAdded || "n/a"}</dd>
      </dl>
    </section>
    <section>
      <h5>Related Items</h5>
      <p class="muted">More by this creator: ${related.byCreator.map((r) => r.title).join(", ") || "None"}</p>
      <p class="muted">More in this category: ${related.byCategory.map((r) => r.title).join(", ") || "None"}</p>
      <p class="muted">Virtual shelf (by call number): ${related.virtualShelf.map((r) => `${r.callNumber || "n/a"} — ${r.title}`).join(" • ") || "None"}</p>
    </section>
  `;

  els.recordDetailsModal.classList.remove("hidden");
}

function openByHash() {
  if (!location.hash.startsWith("#record-")) return;
  const id = location.hash.replace("#record-", "");
  const hit = state.records.find((r) => r.id === id);
  if (hit) openDetail(hit);
}

function getAdminFiltered() {
  const term = els.adminSearch.value.trim().toLowerCase();
  if (!term) return state.records;
  return state.records.filter((r) => `${r.title} ${r.creator} ${r.identifier || ""}`.toLowerCase().includes(term));
}

function renderAdminTable() {
  els.adminTableBody.innerHTML = "";
  if (!state.isAdmin) return;

  getAdminFiltered().forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" ${state.selectedIds.has(r.id) ? "checked" : ""}></td>
      <td>${r.title}</td>
      <td>${r.creator}</td>
      <td>${r.format}</td>
      <td>${r.year || ""}</td>
      <td>${r.status}</td>
      <td class="row-actions">
        <button class="button button-secondary" data-act="edit">Edit</button>
        <button class="button button-secondary" data-act="dup">Duplicate</button>
        <button class="button" data-act="del">Delete</button>
      </td>
    `;

    tr.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
      if (e.target.checked) state.selectedIds.add(r.id); else state.selectedIds.delete(r.id);
    });

    tr.querySelector('[data-act="edit"]').addEventListener("click", () => populateForm(r));
    tr.querySelector('[data-act="dup"]').addEventListener("click", () => {
      const copy = normalizeRecord({ ...r, id: crypto.randomUUID(), title: `${r.title} (Copy)`, accessionNumber: "" });
      state.records.unshift(copy);
      saveRecords(state.records);
      flash("Record duplicated.");
      render();
    });
    tr.querySelector('[data-act="del"]').addEventListener("click", () => {
      state.records = state.records.filter((x) => x.id !== r.id);
      saveRecords(state.records);
      flash("Record deleted.");
      render();
    });

    els.adminTableBody.appendChild(tr);
  });
}

function populateForm(r) {
  const fields = ["recordId:id", "title", "subtitle", "creator", "contributors", "format", "edition", "year", "publisher", "identifier", "genre", "subjects", "description", "location", "callNumber", "accessionNumber", "status", "dateAcquired", "dateAdded", "notes", "coverUrl"];
  fields.forEach((pair) => {
    const [elId, prop] = pair.includes(":") ? pair.split(":") : [pair, pair];
    $(`#${elId}`).value = r[prop] || "";
  });
  checkDuplicateDraft();
  window.scrollTo({ top: els.adminSection.offsetTop - 20, behavior: "smooth" });
}

function flash(msg, isError = false) {
  els.adminMessage.textContent = msg;
  els.adminMessage.classList.toggle("error", isError);
  setTimeout(() => { els.adminMessage.textContent = ""; }, 2400);
}

bindEvents();
render();
openByHash();
