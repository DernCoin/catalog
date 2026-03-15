const STORAGE_KEY = "catalogRecords";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "catalog123";

const starterRecords = [
  {
    id: createId(),
    title: "The Hobbit",
    creator: "J.R.R. Tolkien",
    format: "Book",
    year: 1937,
    genre: "Fantasy",
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

const opacSection = document.querySelector("#opacSection");
const adminSection = document.querySelector("#adminSection");
const publicResults = document.querySelector("#publicResults");
const adminResults = document.querySelector("#adminResults");
const template = document.querySelector("#recordTemplate");

const searchInput = document.querySelector("#searchInput");
const formatFilter = document.querySelector("#formatFilter");

const recordForm = document.querySelector("#recordForm");
const cancelEditBtn = document.querySelector("#cancelEditBtn");

adminToggleBtn.addEventListener("click", () => {
  if (state.isAdmin) {
    state.isAdmin = false;
    updateAdminView();
    return;
  }
  loginError.textContent = "";
  openLoginModal();
});

closeLoginBtn.addEventListener("click", closeLoginModal);

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.querySelector("#username").value.trim();
  const password = document.querySelector("#password").value;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    state.isAdmin = true;
    closeLoginModal();
    loginForm.reset();
    updateAdminView();
    return;
  }

  loginError.textContent = "Invalid credentials. Try admin / catalog123.";
});

searchInput.addEventListener("input", renderPublicCatalog);
formatFilter.addEventListener("change", renderPublicCatalog);


function openLoginModal() {
  loginModal.classList.remove("hidden");
  document.querySelector("#username").focus();
}

function closeLoginModal() {
  loginModal.classList.add("hidden");
}

loginModal.addEventListener("click", (event) => {
  if (event.target === loginModal) closeLoginModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLoginModal();
});

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
  renderAll();
});

cancelEditBtn.addEventListener("click", () => {
  recordForm.reset();
  document.querySelector("#recordId").value = "";
});

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
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse catalog records from localStorage:", error);
    return starterRecords;
  }
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
    const haystack = `${item.title} ${item.creator} ${item.genre} ${item.notes}`.toLowerCase();
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
  const notes = node.querySelector(".record-notes");
  const actions = node.querySelector(".record-actions");

  cover.src = record.coverUrl || "https://placehold.co/90x130?text=No+Cover";
  cover.alt = `${record.title} cover`;
  title.textContent = record.title;
  meta.textContent = `${record.creator} • ${record.format}${record.year ? ` • ${record.year}` : ""}${record.genre ? ` • ${record.genre}` : ""}`;
  notes.textContent = record.notes || "";

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

function populateForm(record) {
  document.querySelector("#recordId").value = record.id;
  document.querySelector("#title").value = record.title;
  document.querySelector("#creator").value = record.creator;
  document.querySelector("#format").value = record.format;
  document.querySelector("#year").value = record.year || "";
  document.querySelector("#genre").value = record.genre || "";
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
    genre: document.querySelector("#genre").value.trim(),
    coverUrl: document.querySelector("#coverUrl").value.trim(),
    notes: document.querySelector("#notes").value.trim(),
  };
}

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
