import { normalizeRecord, loadRecords, saveRecords } from "./storage.js";
import { isFirebaseConfigured, loginWithFirebase, logoutFirebase, onFirebaseAuthStateChanged, subscribeToFirebaseRecords } from "./firebase.js";

const state = {
  records: loadRecords(),
  query: "",
};

const els = {
  loginCard: document.querySelector("#loginCard"),
  ilsCard: document.querySelector("#ilsCard"),
  logoutBtn: document.querySelector("#logoutBtn"),
  loginForm: document.querySelector("#loginForm"),
  loginError: document.querySelector("#loginError"),
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  recordForm: document.querySelector("#recordForm"),
  recordId: document.querySelector("#recordId"),
  title: document.querySelector("#title"),
  creator: document.querySelector("#creator"),
  format: document.querySelector("#format"),
  year: document.querySelector("#year"),
  genre: document.querySelector("#genre"),
  status: document.querySelector("#status"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  searchInput: document.querySelector("#searchInput"),
  recordsBody: document.querySelector("#recordsBody"),
  recordCount: document.querySelector("#recordCount"),
};

function setAuthenticatedUI(isAuthed) {
  els.loginCard.classList.toggle("hidden", isAuthed);
  els.ilsCard.classList.toggle("hidden", !isAuthed);
  els.logoutBtn.classList.toggle("hidden", !isAuthed);
}

function resetForm() {
  els.recordForm.reset();
  els.recordId.value = "";
  els.status.value = "Available";
}

function renderTable() {
  const term = state.query.trim().toLowerCase();
  const rows = state.records
    .filter((record) => !term || [record.title, record.creator, record.format, String(record.year || "")].join(" ").toLowerCase().includes(term))
    .sort((a, b) => String(b.addedAt || 0).localeCompare(String(a.addedAt || 0)));

  els.recordCount.textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;
  els.recordsBody.innerHTML = rows.map((record) => `
    <tr>
      <td>${record.title || ""}</td>
      <td>${record.creator || ""}</td>
      <td>${record.format || ""}</td>
      <td>${record.year || ""}</td>
      <td>
        <button class="button button-secondary" data-action="edit" data-id="${record.id}" type="button">Edit</button>
        <button class="button button-secondary" data-action="delete" data-id="${record.id}" type="button">Delete</button>
      </td>
    </tr>
  `).join("");
}

function upsertRecord(event) {
  event.preventDefault();
  const payload = normalizeRecord({
    id: els.recordId.value || undefined,
    title: els.title.value,
    creator: els.creator.value,
    format: els.format.value || "Other",
    year: els.year.value,
    genre: els.genre.value,
    status: els.status.value || "Available",
    addedAt: Date.now(),
  });

  const idx = state.records.findIndex((record) => record.id === payload.id);
  if (idx === -1) state.records.unshift(payload);
  else state.records[idx] = { ...state.records[idx], ...payload };

  saveRecords(state.records);
  resetForm();
  renderTable();
}

function wireRowActions(event) {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const record = state.records.find((entry) => entry.id === btn.dataset.id);
  if (!record) return;

  if (btn.dataset.action === "delete") {
    state.records = state.records.filter((entry) => entry.id !== record.id);
    saveRecords(state.records);
    renderTable();
    return;
  }

  els.recordId.value = record.id;
  els.title.value = record.title || "";
  els.creator.value = record.creator || "";
  els.format.value = record.format || "";
  els.year.value = record.year || "";
  els.genre.value = record.genre || "";
  els.status.value = record.status || "Available";
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

  els.recordForm.addEventListener("submit", upsertRecord);
  els.cancelEditBtn.addEventListener("click", resetForm);
  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    renderTable();
  });
  els.recordsBody.addEventListener("click", wireRowActions);
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
    renderTable();
  });

  renderTable();
}

init();
