const STORAGE_KEY = "catalogRecords";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "catalog123";

const GENRES_BY_FORMAT = {
  Book: ["Fantasy", "Science Fiction", "Mystery", "Romance", "Nonfiction", "Historical", "Biography", "Poetry", "Other"],
  Vinyl: ["Jazz", "Rock", "Pop", "Hip-Hop", "Classical", "Soul", "Blues", "Electronic", "Country", "Other"],
  "Board Game": ["Strategy", "Family", "Party", "Cooperative", "Deck Building", "Abstract", "Thematic", "Other"],
  Other: ["Collectible", "Reference", "Educational", "Other"],
};

const starterRecords = [
  {
    id: createId(),
    title: "The Hobbit",
    creator: "J.R.R. Tolkien",
    format: "Book",
    year: 1937,
    genre: "Fantasy",
    publisher: "George Allen & Unwin",
    location: "Living Room Shelf A",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/I/81t2CVWEsUL.jpg",
    notes: "Classic adventure fantasy.",
  },
  {
    id: createId(),
    title: "Kind of Blue",
    creator: "Miles Davis",
    format: "Vinyl",
    year: 1959,
    genre: "Jazz",
    publisher: "Columbia Records",
    location: "Media Cabinet 2",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/9/9c/MilesDavisKindofBlue.jpg",
    notes: "Essential jazz LP.",
  },
  {
    id: createId(),
    title: "Catan",
    creator: "Klaus Teuber",
    format: "Board Game",
    year: 1995,
    genre: "Strategy",
    publisher: "Kosmos",
    location: "Game Closet",
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/b/b0/Catan-2015-boxart.jpg",
    notes: "Great gateway strategy game.",
  },
];

const state = {
  isAdmin: false,
  records: loadRecords(),
};

const adminToggleBtn = document.querySelector("#adminToggleBtn");
const loginModal = document.querySelector("#loginModal");
const closeLoginBtn = document.querySelector("#closeLoginBtn");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");

const adminSection = document.querySelector("#adminSection");
const publicResults = document.querySelector("#publicResults");
const adminResults = document.querySelector("#adminResults");
const template = document.querySelector("#recordTemplate");

const searchInput = document.querySelector("#searchInput");
const formatFilter = document.querySelector("#formatFilter");

const recordForm = document.querySelector("#recordForm");
const cancelEditBtn = document.querySelector("#cancelEditBtn");
const formatField = document.querySelector("#format");
const genreField = document.querySelector("#genre");

const recordDetailsModal = document.querySelector("#recordDetailsModal");
const closeRecordDetailsBtn = document.querySelector("#closeRecordDetailsBtn");
const recordDetailsTitle = document.querySelector("#recordDetailsTitle");
const recordDetailsMeta = document.querySelector("#recordDetailsMeta");
const recordDetailsPublisher = document.querySelector("#recordDetailsPublisher");
const recordDetailsLocation = document.querySelector("#recordDetailsLocation");
const recordDetailsNotes = document.querySelector("#recordDetailsNotes");

if (adminToggleBtn) {
  adminToggleBtn.addEventListener("click", () => {
    if (state.isAdmin) {
      state.isAdmin = false;
      updateAdminView();
      return;
    }

    if (loginError) loginError.textContent = "";
    openLoginModal();
  });
}

if (closeLoginBtn) closeLoginBtn.addEventListener("click", closeLoginModal);
if (closeRecordDetailsBtn) closeRecordDetailsBtn.addEventListener("click", closeRecordDetailsModal);

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const usernameField = document.querySelector("#username");
    const passwordField = document.querySelector("#password");
    const username = usernameField ? usernameField.value.trim() : "";
    const password = passwordField ? passwordField.value : "";

    if (attemptAdminLogin(username, password)) {
      closeLoginModal();
      loginForm.reset();
      return;
    }

    if (loginError) loginError.textContent = "Invalid credentials. Try admin / catalog123.";
  });
}

if (searchInput) searchInput.addEventListener("input", renderPublicCatalog);
if (formatFilter) formatFilter.addEventListener("change", renderPublicCatalog);
if (formatField) formatField.addEventListener("change", () => populateGenreOptions(formatField.value));

function attemptAdminLogin(username, password) {
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return false;

  state.isAdmin = true;
  updateAdminView();
  return true;
}

function openLoginModal() {
  if (!loginModal || !loginForm) {
    const username = window.prompt("Admin username:", "");
    if (username === null) return;

    const password = window.prompt("Admin password:", "");
    if (password === null) return;

    if (!attemptAdminLogin(username.trim(), password) && loginError) {
      loginError.textContent = "Invalid credentials. Try admin / catalog123.";
    }
    return;
  }

  loginModal.classList.remove("hidden");
  const usernameField = document.querySelector("#username");
  if (usernameField) usernameField.focus();
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.classList.add("hidden");
}

function openRecordDetailsModal(record) {
  if (!recordDetailsModal) return;

  recordDetailsTitle.textContent = record.title || "Record Details";
  recordDetailsMeta.textContent = `${record.creator} • ${record.format}${record.year ? ` • ${record.year}` : ""}${record.genre ? ` • ${record.genre}` : ""}`;
  recordDetailsPublisher.textContent = `Publisher: ${record.publisher || "Not specified"}`;
  recordDetailsLocation.textContent = `Location: ${record.location || "Not specified"}`;
  recordDetailsNotes.textContent = record.notes || "No notes provided.";

  recordDetailsModal.classList.remove("hidden");
}

function closeRecordDetailsModal() {
  if (!recordDetailsModal) return;
  recordDetailsModal.classList.add("hidden");
}

if (loginModal) {
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) closeLoginModal();
  });
}

if (recordDetailsModal) {
  recordDetailsModal.addEventListener("click", (event) => {
    if (event.target === recordDetailsModal) closeRecordDetailsModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (loginModal && !loginModal.classList.contains("hidden")) closeLoginModal();
    if (recordDetailsModal && !recordDetailsModal.classList.contains("hidden")) closeRecordDetailsModal();
  }
});

if (recordForm) {
  recordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = getFormData();

    if (!payload.id) {
      payload.id = createId();
      state.records.unshift(payload);
    } else {
      const idx = state.records.findIndex((item) => item.id === payload.id);
      if (idx >= 0) state.records[idx] = payload;
    }

    persistRecords();
    recordForm.reset();
    document.querySelector("#recordId").value = "";
    populateGenreOptions(formatField ? formatField.value : "Book");
    renderAll();
  });
}

if (cancelEditBtn && recordForm) {
  cancelEditBtn.addEventListener("click", () => {
    recordForm.reset();
    document.querySelector("#recordId").value = "";
    populateGenreOptions(formatField ? formatField.value : "Book");
  });
}

function loadRecords() {
  let raw = null;

  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("localStorage is unavailable, using in-memory starter records:", error);
    return starterRecords;
  }

  if (!raw) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starterRecords));
    } catch (error) {
      console.warn("Could not seed starter records in localStorage:", error);
    }
    return starterRecords;
  }

  try {
    return JSON.parse(raw).map((record) => normalizeRecord(record));
  } catch (error) {
    console.error("Failed to parse catalog records from localStorage:", error);
    return starterRecords;
  }
}

function normalizeRecord(record) {
  return {
    ...record,
    publisher: record.publisher || "",
    location: record.location || "",
    genre: record.genre || "",
    notes: record.notes || "",
  };
}

function persistRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  } catch (error) {
    console.warn("Could not save catalog records to localStorage:", error);
  }
}

function updateAdminView() {
  adminSection.classList.toggle("hidden", !state.isAdmin);
  adminToggleBtn.textContent = state.isAdmin ? "Logout Admin" : "Admin Login";
  renderAll();
}

function renderAll() {
  renderPublicCatalog();
  renderAdminCatalog();
}

function renderPublicCatalog() {
  publicResults.innerHTML = "";

  const term = searchInput.value.trim().toLowerCase();
  const format = formatFilter.value;

  const filtered = state.records.filter((item) => {
    const haystack = `${item.title} ${item.creator} ${item.genre} ${item.notes} ${item.publisher || ""} ${item.location || ""}`.toLowerCase();
    const matchesTerm = !term || haystack.includes(term);
    const matchesFormat = format === "all" || item.format === format;
    return matchesTerm && matchesFormat;
  });

  filtered.forEach((record) => {
    publicResults.appendChild(renderRecord(record, false));
  });
}

function renderAdminCatalog() {
  adminResults.innerHTML = "";
  state.records.forEach((record) => {
    adminResults.appendChild(renderRecord(record, true));
  });
}

function renderRecord(record, withActions) {
  const node = template.content.firstElementChild.cloneNode(true);
  const cover = node.querySelector(".cover");
  const title = node.querySelector(".record-title");
  const meta = node.querySelector(".record-meta");
  const detailsBtn = node.querySelector(".view-details-btn");
  const actions = node.querySelector(".record-actions");

  cover.src = record.coverUrl || "https://placehold.co/90x130?text=No+Cover";
  cover.alt = `${record.title} cover`;
  title.textContent = record.title;
  meta.textContent = `${record.creator} • ${record.format}${record.year ? ` • ${record.year}` : ""}${record.genre ? ` • ${record.genre}` : ""}${record.location ? ` • ${record.location}` : ""}`;

  if (detailsBtn) {
    detailsBtn.addEventListener("click", () => openRecordDetailsModal(record));
  }

  if (withActions) {
    actions.classList.remove("hidden");

    const editBtn = document.createElement("button");
    editBtn.className = "button button-secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => populateForm(record));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      state.records = state.records.filter((item) => item.id !== record.id);
      persistRecords();
      renderAll();
    });

    actions.append(editBtn, deleteBtn);
  }

  return node;
}

function populateGenreOptions(formatValue, selectedGenre = "") {
  if (!genreField) return;

  const options = GENRES_BY_FORMAT[formatValue] || GENRES_BY_FORMAT.Other;
  genreField.innerHTML = "";

  options.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreField.appendChild(option);
  });

  if (selectedGenre && options.includes(selectedGenre)) {
    genreField.value = selectedGenre;
  } else {
    genreField.value = options[0];
  }
}

function populateForm(record) {
  document.querySelector("#recordId").value = record.id;
  document.querySelector("#title").value = record.title;
  document.querySelector("#creator").value = record.creator;
  document.querySelector("#format").value = record.format;
  document.querySelector("#year").value = record.year || "";
  populateGenreOptions(record.format, record.genre || "");
  document.querySelector("#publisher").value = record.publisher || "";
  document.querySelector("#location").value = record.location || "";
  document.querySelector("#coverUrl").value = record.coverUrl || "";
  document.querySelector("#notes").value = record.notes || "";
  adminSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getFormData() {
  const yearValue = document.querySelector("#year").value.trim();
  return {
    id: document.querySelector("#recordId").value.trim(),
    title: document.querySelector("#title").value.trim(),
    creator: document.querySelector("#creator").value.trim(),
    format: document.querySelector("#format").value,
    year: yearValue ? Number(yearValue) : null,
    genre: document.querySelector("#genre").value,
    publisher: document.querySelector("#publisher").value.trim(),
    location: document.querySelector("#location").value.trim(),
    coverUrl: document.querySelector("#coverUrl").value.trim(),
    notes: document.querySelector("#notes").value.trim(),
  };
}

populateGenreOptions(formatField ? formatField.value : "Book");
renderAll();

function createId() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  if (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}
