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
  circulationTab: "checkout",
  queuedCheckoutItems: [],
  activeWorkspaceRecordId: "",
  editingPatronId: "",
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
  bulkMarcExportBtn: $("#bulkMarcExportBtn"),
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
  patronForm: $("#patronForm"),
  patronName: $("#patronName"),
  patronMiddleName: $("#patronMiddleName"),
  patronCardNumber: $("#patronCardNumber"),
  patronEmail: $("#patronEmail"),
  patronAddress: $("#patronAddress"),
  patronPhone: $("#patronPhone"),
  patronBirthDay: $("#patronBirthDay"),
  patronId: $("#patronId"),
  patronSubmitBtn: $("#patronSubmitBtn"),
  patronsBody: $("#patronsBody"),
  serialIssueForm: $("#serialIssueForm"),
  serialTitle: $("#serialTitle"),
  serialIssueLabel: $("#serialIssueLabel"),
  serialIssueDate: $("#serialIssueDate"),
  serialPublisher: $("#serialPublisher"),
  serialIdentifier: $("#serialIdentifier"),
  serialMaterialNumber: $("#serialMaterialNumber"),
  serialLocation: $("#serialLocation"),
  serialCallNumber: $("#serialCallNumber"),
  serialCoverUrl: $("#serialCoverUrl"),
  serialCoverUpload: $("#serialCoverUpload"),
  serialIssueMessage: $("#serialIssueMessage"),
  serialSubscriptionForm: $("#serialSubscriptionForm"),
  subscriptionTitle: $("#subscriptionTitle"),
  subscriptionFrequency: $("#subscriptionFrequency"),
  subscriptionRenewalDate: $("#subscriptionRenewalDate"),
  subscriptionVendor: $("#subscriptionVendor"),
  subscriptionCost: $("#subscriptionCost"),
  subscriptionStatus: $("#subscriptionStatus"),
  serialSubscriptionMessage: $("#serialSubscriptionMessage"),
  subscriptionsBody: $("#subscriptionsBody"),
  serialIssuesBody: $("#serialIssuesBody"),
  acquisitionItemForm: $("#acquisitionItemForm"),
  acqOrderName: $("#acqOrderName"),
  acqVendor: $("#acqVendor"),
  acqOrderDate: $("#acqOrderDate"),
  acqTitle: $("#acqTitle"),
  acqCreator: $("#acqCreator"),
  acqFormat: $("#acqFormat"),
  acqMaterialNumber: $("#acqMaterialNumber"),
  acqCallNumber: $("#acqCallNumber"),
  acqLocation: $("#acqLocation"),
  acqCoverUrl: $("#acqCoverUrl"),
  acqCoverUpload: $("#acqCoverUpload"),
  acqNotes: $("#acqNotes"),
  acquisitionMessage: $("#acquisitionMessage"),
  acquisitionOrdersBody: $("#acquisitionOrdersBody"),
  pendingMaterialsBody: $("#pendingMaterialsBody"),
  checkOutForm: $("#checkOutForm"),
  checkOutCardNumber: $("#checkOutCardNumber"),
  checkOutMaterialNumber: $("#checkOutMaterialNumber"),
  queueCheckoutItemBtn: $("#queueCheckoutItemBtn"),
  checkOutQueue: $("#checkOutQueue"),
  checkOutDueDate: $("#checkOutDueDate"),
  checkInForm: $("#checkInForm"),
  checkInMaterialNumber: $("#checkInMaterialNumber"),
  holdForm: $("#holdForm"),
  holdCardNumber: $("#holdCardNumber"),
  holdMaterialNumber: $("#holdMaterialNumber"),
  holdType: $("#holdType"),
  holdsBody: $("#holdsBody"),
  circulationTabButtons: $$(".circulation-tab-btn"),
  circulationPanels: $$("[data-circulation-panel]"),
  circulationMessage: $("#circulationMessage"),
  loansBody: $("#loansBody"),
  workspaceLookupInput: $("#workspaceLookupInput"),
  workspaceLookupBtn: $("#workspaceLookupBtn"),
  exportActiveMarcBtn: $("#exportActiveMarcBtn"),
  workspaceStatus: $("#workspaceStatus"),
};

const FORM_FIELDS = [
  "recordId:id", "title", "subtitle", "creator", "statementOfResponsibility", "contributors", "format", "edition", "year", "publicationPlace", "publisher", "languageCode", "lccn", "oclcNumber", "deweyNumber", "lcClassNumber", "identifier", "genre", "subjects", "description", "location", "callNumber", "accessionNumber", "materialNumbers", "status", "dateAcquired", "dateAdded", "source", "pricePaid", "retailPrice", "notes", "coverUrl", "circulationHistory", "binding", "seriesName", "seriesNumber", "curatedShelf", "pageCount", "physicalDetails", "summaryNote", "targetAudience", "bibliographyNote", "marcLeader", "marc008",
];

function switchIlsTab(tab) {
  state.ilsTab = tab;
  els.ilsTabButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.ilsTab === tab));
  els.ilsTabPanels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.ilsPanel !== tab));
  if (tab !== "records") hideSearchPopover();
}

function setAuthenticatedUI(isAuthed) {
  els.loginCard.classList.toggle("hidden", isAuthed);
  els.ilsCard.classList.toggle("hidden", !isAuthed);
  els.logoutBtn.classList.toggle("hidden", !isAuthed);
}



function getPatrons() {
  return Array.isArray(state.settings.patrons) ? state.settings.patrons : [];
}

function savePatrons(patrons) {
  state.settings.patrons = patrons;
  saveSettings(state.settings);
}

function getSubscriptions() {
  return Array.isArray(state.settings.subscriptions) ? state.settings.subscriptions : [];
}

function saveSubscriptions(subscriptions) {
  state.settings.subscriptions = subscriptions;
  saveSettings(state.settings);
}

function setSerialIssueMessage(message, isError = false) {
  if (!els.serialIssueMessage) return;
  els.serialIssueMessage.textContent = message;
  els.serialIssueMessage.classList.toggle("warning", isError);
}

function setSubscriptionMessage(message, isError = false) {
  if (!els.serialSubscriptionMessage) return;
  els.serialSubscriptionMessage.textContent = message;
  els.serialSubscriptionMessage.classList.toggle("warning", isError);
}

function setAcquisitionMessage(message, isError = false) {
  if (!els.acquisitionMessage) return;
  els.acquisitionMessage.textContent = message;
  els.acquisitionMessage.classList.toggle("warning", isError);
}

function getAcquisitionOrders() {
  return Array.isArray(state.settings.acquisitionOrders) ? state.settings.acquisitionOrders : [];
}

function saveAcquisitionOrders(orders) {
  state.settings.acquisitionOrders = orders;
  saveSettings(state.settings);
}

function getPendingMaterials() {
  return Array.isArray(state.settings.pendingMaterials) ? state.settings.pendingMaterials : [];
}

function savePendingMaterials(materials) {
  state.settings.pendingMaterials = materials;
  saveSettings(state.settings);
}

function switchCirculationTab(tab) {
  state.circulationTab = tab;
  els.circulationTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.circulationTab === tab));
  els.circulationPanels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.circulationPanel !== tab));
}

function parseMaterialNumbersInput(value) {
  return [...new Set(String(value || "").split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean))];
}

function getRecordByMaterialNumber(materialNumber) {
  const normalized = String(materialNumber || "").trim();
  if (!normalized) return null;
  return state.records.find((record) => (record.materialNumbers || []).includes(normalized)) || null;
}

function renderCheckoutQueue() {
  if (!els.checkOutQueue) return;
  els.checkOutQueue.innerHTML = "";
  if (!state.queuedCheckoutItems.length) {
    els.checkOutQueue.innerHTML = "<li>No items scanned yet.</li>";
    return;
  }

  state.queuedCheckoutItems.forEach((entry) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${entry.materialNumber}: ${entry.title}</span> <button class="button button-secondary" type="button">Remove</button>`;
    li.querySelector("button").addEventListener("click", () => {
      state.queuedCheckoutItems = state.queuedCheckoutItems.filter((item) => item.materialNumber !== entry.materialNumber);
      renderCheckoutQueue();
    });
    els.checkOutQueue.appendChild(li);
  });
}

function renderPatronsTable() {
  if (!els.patronsBody) return;

  const patrons = getPatrons().slice().sort((a, b) => a.name.localeCompare(b.name));
  els.patronsBody.innerHTML = "";

  if (!patrons.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="5">No patrons added yet.</td>';
    els.patronsBody.appendChild(tr);
    return;
  }

  patrons.forEach((patron) => {
    const loansCount = state.records.filter((record) => record.checkedOutTo === patron.id && String(record.status) === "On Loan").length;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${patron.name}</td><td>${patron.cardNumber || ""}</td><td>${patron.email || ""}</td><td>${loansCount}</td><td><button class="button button-secondary" type="button" data-act="edit">Edit</button> <button class="button button-secondary" type="button" data-act="delete">Delete</button></td>`;

    tr.querySelector('[data-act="edit"]').addEventListener("click", () => editPatron(patron.id));
    tr.querySelector('[data-act="delete"]').addEventListener("click", () => removePatron(patron.id));
    els.patronsBody.appendChild(tr);
  });
}

function renderLoansTable() {
  if (!els.loansBody) return;
  const loans = state.records
    .filter((record) => String(record.status) === "On Loan")
    .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));

  els.loansBody.innerHTML = "";
  if (!loans.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="4">No items are currently checked out.</td>';
    els.loansBody.appendChild(tr);
    return;
  }

  loans.forEach((record) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${record.title}</td><td>${record.checkedOutToName || "Unknown patron"}</td><td>${record.dueDate || ""}</td><td><button class="button button-secondary" type="button" data-record-id="${record.id}">Check In</button></td>`;
    tr.querySelector("button").addEventListener("click", () => checkInRecord(record.id));
    els.loansBody.appendChild(tr);
  });
}

function setCirculationMessage(message, isError = false) {
  if (!els.circulationMessage) return;
  els.circulationMessage.textContent = message;
  els.circulationMessage.classList.toggle("warning", isError);
}


function appendCirculationHistory(record, action) {
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  const existing = String(record.circulationHistory || "").trim();
  const line = `[${stamp}] ${action}`;
  return existing ? `${existing}\n${line}` : line;
}

function resetPatronForm() {
  if (!els.patronForm) return;
  els.patronForm.reset();
  if (els.patronId) els.patronId.value = "";
  state.editingPatronId = "";
  if (els.patronSubmitBtn) els.patronSubmitBtn.textContent = "Add Patron";
}

function addPatron(event) {
  event.preventDefault();
  const name = els.patronName.value.trim();
  const middleName = els.patronMiddleName.value.trim();
  const cardNumber = els.patronCardNumber.value.trim();
  const email = els.patronEmail.value.trim();
  const address = els.patronAddress.value.trim();
  const phone = els.patronPhone.value.trim();
  const birthDay = els.patronBirthDay.value;
  if (!name || !cardNumber) return;

  const patrons = getPatrons();
  const editingId = els.patronId?.value || "";
  const duplicate = patrons.some((patron) => patron.id !== editingId && patron.cardNumber?.toLowerCase() === cardNumber.toLowerCase());
  if (duplicate) {
    setCirculationMessage("That card number is already assigned to another patron.", true);
    return;
  }

  if (editingId) {
    savePatrons(patrons.map((patron) => (patron.id === editingId ? { ...patron, name, middleName, cardNumber, email, address, phone, birthDay } : patron)));
    setCirculationMessage(`Updated patron ${name}.`);
  } else {
    patrons.push({ id: crypto.randomUUID(), name, middleName, cardNumber, email, address, phone, birthDay });
    savePatrons(patrons);
    setCirculationMessage(`Added patron ${name}.`);
  }

  resetPatronForm();
  render();
}

function editPatron(patronId) {
  const patron = getPatrons().find((entry) => entry.id === patronId);
  if (!patron) return;
  els.patronName.value = patron.name || "";
  els.patronMiddleName.value = patron.middleName || "";
  els.patronCardNumber.value = patron.cardNumber || "";
  els.patronEmail.value = patron.email || "";
  els.patronAddress.value = patron.address || "";
  els.patronPhone.value = patron.phone || "";
  els.patronBirthDay.value = patron.birthDay || "";
  if (els.patronId) els.patronId.value = patron.id;
  state.editingPatronId = patron.id;
  if (els.patronSubmitBtn) els.patronSubmitBtn.textContent = "Update Patron";
}

function removePatron(patronId) {
  const hasLoans = state.records.some((record) => record.checkedOutTo === patronId && String(record.status) === "On Loan");
  if (hasLoans) {
    setCirculationMessage("Cannot delete patron with checked out items.", true);
    return;
  }

  savePatrons(getPatrons().filter((patron) => patron.id !== patronId));
  render();
}

function queueCheckoutItem() {
  const materialNumber = els.checkOutMaterialNumber.value.trim();
  if (!materialNumber) return;
  const record = getRecordByMaterialNumber(materialNumber);
  if (!record) {
    setCirculationMessage(`No item found with material number ${materialNumber}.`, true);
    return;
  }
  if (String(record.status) === "On Loan") {
    setCirculationMessage(`Item ${materialNumber} is already checked out.`, true);
    return;
  }
  if (state.queuedCheckoutItems.some((entry) => entry.materialNumber === materialNumber)) {
    setCirculationMessage(`Item ${materialNumber} is already queued.`, true);
    return;
  }

  state.queuedCheckoutItems.push({ recordId: record.id, materialNumber, title: record.title });
  els.checkOutMaterialNumber.value = "";
  setCirculationMessage(`Queued ${record.title}.`);
  renderCheckoutQueue();
}

function checkOutRecord(event) {
  event.preventDefault();
  const cardNumber = els.checkOutCardNumber.value.trim();
  const dueDate = els.checkOutDueDate.value;

  if (!cardNumber || !dueDate || !state.queuedCheckoutItems.length) {
    setCirculationMessage("Scan a patron card, add items, and choose a due date.", true);
    return;
  }

  const patron = getPatrons().find((entry) => String(entry.cardNumber || "").toLowerCase() === cardNumber.toLowerCase());
  if (!patron) {
    setCirculationMessage("No patron found with that card number.", true);
    return;
  }

  state.records = state.records.map((record) => {
    const queued = state.queuedCheckoutItems.find((entry) => entry.recordId === record.id);
    if (!queued) return record;
    return {
      ...record,
      status: "On Loan",
      checkedOutTo: patron.id,
      checkedOutToName: patron.name,
      checkedOutAt: new Date().toISOString(),
      dueDate,
      circulationHistory: appendCirculationHistory(record, `Checked out to ${patron.name} (Card: ${patron.cardNumber || "N/A"}) due ${dueDate}`),
    };
  });

  saveRecords(state.records);
  state.queuedCheckoutItems = [];
  els.checkOutForm.reset();
  setCirculationMessage(`Checked out items to ${patron.name} until ${dueDate}.`);
  render();
}

function checkInRecord(recordId) {
  const idx = state.records.findIndex((entry) => entry.id === recordId);
  if (idx < 0) return;

  state.records[idx] = {
    ...state.records[idx],
    status: "Available",
    checkedOutTo: "",
    checkedOutToName: "",
    checkedOutAt: "",
    dueDate: "",
    circulationHistory: appendCirculationHistory(state.records[idx], "Checked in"),
  };

  saveRecords(state.records);
  setCirculationMessage(`Checked in "${state.records[idx].title}".`);
  render();
}

function checkInByMaterialNumber(event) {
  event.preventDefault();
  const materialNumber = els.checkInMaterialNumber.value.trim();
  if (!materialNumber) return;
  const record = getRecordByMaterialNumber(materialNumber);
  if (!record) {
    setCirculationMessage(`No item found with material number ${materialNumber}.`, true);
    return;
  }
  checkInRecord(record.id);
  els.checkInMaterialNumber.value = "";
}


function getHolds() {
  return Array.isArray(state.settings.holds) ? state.settings.holds : [];
}

function saveHolds(holds) {
  state.settings.holds = holds;
  saveSettings(state.settings);
}

function placeHold(event) {
  event.preventDefault();
  const cardNumber = String(els.holdCardNumber?.value || "").trim();
  const materialNumber = String(els.holdMaterialNumber?.value || "").trim();
  const type = String(els.holdType?.value || "Hold");
  const patron = getPatrons().find((entry) => String(entry.cardNumber || "").toLowerCase() === cardNumber.toLowerCase());
  if (!patron) return setCirculationMessage("No patron found with that card number.", true);
  const record = getRecordByMaterialNumber(materialNumber);
  if (!record) return setCirculationMessage(`No item found with material number ${materialNumber}.`, true);

  const holds = getHolds();
  holds.push({ id: crypto.randomUUID(), recordId: record.id, materialNumber, title: record.title, patronId: patron.id, patronName: patron.name, type, placedAt: new Date().toISOString() });
  saveHolds(holds);
  state.records = state.records.map((entry) => entry.id === record.id ? { ...entry, circulationHistory: appendCirculationHistory(entry, `${type} placed for ${patron.name}`) } : entry);
  saveRecords(state.records);
  if (els.holdForm) els.holdForm.reset();
  setCirculationMessage(`${type} placed for ${patron.name}.`);
  render();
}

function cancelHold(holdId) {
  saveHolds(getHolds().filter((hold) => hold.id !== holdId));
  renderHoldsTable();
}

function renderHoldsTable() {
  if (!els.holdsBody) return;
  const holds = getHolds().slice().sort((a,b)=>String(b.placedAt||"").localeCompare(String(a.placedAt||"")));
  els.holdsBody.innerHTML = "";
  if (!holds.length) {
    const tr=document.createElement("tr");
    tr.innerHTML='<td colspan="5">No holds or reserves.</td>';
    els.holdsBody.appendChild(tr);
    return;
  }
  holds.forEach((hold)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${hold.title}</td><td>${hold.patronName}</td><td>${hold.type}</td><td>${String(hold.placedAt||"").slice(0,10)}</td><td><button class="button button-secondary" type="button">Cancel</button></td>`;
    tr.querySelector("button").addEventListener("click",()=>cancelHold(hold.id));
    els.holdsBody.appendChild(tr);
  });
}

function addSerialIssue(event) {
  event.preventDefault();
  const title = String(els.serialTitle?.value || "").trim();
  const issueLabel = String(els.serialIssueLabel?.value || "").trim();
  const issueDate = els.serialIssueDate?.value || "";
  const publisher = String(els.serialPublisher?.value || "").trim();
  const identifier = String(els.serialIdentifier?.value || "").trim();
  const materialNumber = String(els.serialMaterialNumber?.value || "").trim();
  const location = String(els.serialLocation?.value || "Periodicals").trim();
  const callNumber = String(els.serialCallNumber?.value || "").trim();
  const coverUrl = String(els.serialCoverUrl?.value || "").trim();

  if (!title || !issueLabel || !materialNumber) {
    setSerialIssueMessage("Title, issue label, and material number are required.", true);
    return;
  }

  const duplicateMaterial = state.records.some((entry) => (entry.materialNumbers || []).includes(materialNumber));
  if (duplicateMaterial) {
    setSerialIssueMessage(`Material number ${materialNumber} is already in use.`, true);
    return;
  }

  const now = new Date();
  const dateAdded = now.toISOString().slice(0, 10);
  const newRecord = normalizeRecord({
    id: crypto.randomUUID(),
    title: `${title} — ${issueLabel}`,
    creator: publisher || title,
    format: "Magazine",
    identifier,
    publisher,
    source: "Serials",
    materialNumbers: [materialNumber],
    location: location || "Periodicals",
    callNumber,
    dateAdded,
    year: issueDate ? issueDate.slice(0, 4) : "",
    notes: `Serial issue: ${issueLabel}${issueDate ? ` (${issueDate})` : ""}`,
    summaryNote: `Magazine issue: ${issueLabel}`,
    status: "Available",
    coverUrl,
    circulationHistory: "",
    addedAt: now.getTime(),
  });

  state.records.unshift(newRecord);
  saveRecords(state.records);
  if (els.serialIssueForm) els.serialIssueForm.reset();
  setSerialIssueMessage(`Added ${newRecord.title} to catalog records.`);
  render();
}

function saveSubscription(event) {
  event.preventDefault();
  const title = String(els.subscriptionTitle?.value || "").trim();
  if (!title) {
    setSubscriptionMessage("Magazine title is required.", true);
    return;
  }

  const subscriptions = getSubscriptions();
  const existing = subscriptions.find((entry) => String(entry.title || "").toLowerCase() === title.toLowerCase());
  const payload = {
    id: existing?.id || crypto.randomUUID(),
    title,
    frequency: els.subscriptionFrequency?.value || "Monthly",
    renewalDate: els.subscriptionRenewalDate?.value || "",
    vendor: String(els.subscriptionVendor?.value || "").trim(),
    annualCost: String(els.subscriptionCost?.value || "").trim(),
    status: els.subscriptionStatus?.value || "Active",
    updatedAt: Date.now(),
  };

  const next = existing
    ? subscriptions.map((entry) => (entry.id === existing.id ? payload : entry))
    : [...subscriptions, payload];

  saveSubscriptions(next);
  if (els.serialSubscriptionForm) els.serialSubscriptionForm.reset();
  setSubscriptionMessage(existing ? `Updated subscription for ${title}.` : `Saved subscription for ${title}.`);
  renderSubscriptionsTable();
}

function deleteSubscription(subscriptionId) {
  const remaining = getSubscriptions().filter((entry) => entry.id !== subscriptionId);
  saveSubscriptions(remaining);
  setSubscriptionMessage("Subscription removed.");
  renderSubscriptionsTable();
}

function renderSubscriptionsTable() {
  if (!els.subscriptionsBody) return;
  const subscriptions = getSubscriptions().slice().sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  els.subscriptionsBody.innerHTML = "";

  if (!subscriptions.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="7">No subscriptions tracked yet.</td>';
    els.subscriptionsBody.appendChild(tr);
    return;
  }

  subscriptions.forEach((subscription) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${subscription.title}</td><td>${subscription.frequency || ""}</td><td>${subscription.renewalDate || ""}</td><td>${subscription.status || ""}</td><td>${subscription.annualCost ? `$${subscription.annualCost}` : ""}</td><td>${subscription.vendor || ""}</td><td><button class="button button-secondary" type="button">Delete</button></td>`;
    tr.querySelector("button").addEventListener("click", () => deleteSubscription(subscription.id));
    els.subscriptionsBody.appendChild(tr);
  });
}

function renderSerialIssuesTable() {
  if (!els.serialIssuesBody) return;
  const issues = state.records
    .filter((record) => String(record.format || "").toLowerCase() === "magazine" && String(record.source || "").toLowerCase() === "serials")
    .sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0))
    .slice(0, 12);

  els.serialIssuesBody.innerHTML = "";
  if (!issues.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="5">No serial issues added yet.</td>';
    els.serialIssuesBody.appendChild(tr);
    return;
  }

  issues.forEach((issue) => {
    const material = (issue.materialNumbers || [""])[0] || "";
    const issueLabel = String(issue.notes || "").replace(/^Serial issue:\s*/, "") || "—";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${issue.title.split(" — ")[0]}</td><td>${issueLabel}</td><td>${issue.dateAdded || ""}</td><td>${material}</td><td>${issue.location || ""}</td>`;
    els.serialIssuesBody.appendChild(tr);
  });
}

function addAcquisitionItem(event) {
  event.preventDefault();
  const orderName = String(els.acqOrderName?.value || "").trim();
  const title = String(els.acqTitle?.value || "").trim();
  const materialNumber = String(els.acqMaterialNumber?.value || "").trim();
  const creator = String(els.acqCreator?.value || "").trim();
  const format = String(els.acqFormat?.value || "Book").trim() || "Book";
  const vendor = String(els.acqVendor?.value || "").trim();
  const orderDate = els.acqOrderDate?.value || "";
  const callNumber = String(els.acqCallNumber?.value || "").trim();
  const location = String(els.acqLocation?.value || "").trim();
  const coverUrl = String(els.acqCoverUrl?.value || "").trim();
  const notes = String(els.acqNotes?.value || "").trim();

  if (!orderName || !title || !materialNumber) {
    setAcquisitionMessage("Order name, title, and material number are required.", true);
    return;
  }

  const duplicatePending = getPendingMaterials().some((entry) => String(entry.materialNumber || "").toLowerCase() === materialNumber.toLowerCase());
  const duplicateCatalog = state.records.some((entry) => (entry.materialNumbers || []).some((value) => String(value).toLowerCase() === materialNumber.toLowerCase()));
  if (duplicatePending || duplicateCatalog) {
    setAcquisitionMessage(`Material number ${materialNumber} is already in use.`, true);
    return;
  }

  const orders = getAcquisitionOrders();
  let order = orders.find((entry) => String(entry.name || "").toLowerCase() === orderName.toLowerCase());
  if (!order) {
    order = { id: crypto.randomUUID(), name: orderName, vendor, orderDate, createdAt: Date.now() };
    orders.push(order);
    saveAcquisitionOrders(orders);
  }

  const pendingMaterials = getPendingMaterials();
  pendingMaterials.push({
    id: crypto.randomUUID(),
    orderId: order.id,
    orderName,
    title,
    creator,
    format,
    materialNumber,
    callNumber,
    location,
    coverUrl,
    notes,
    status: "Pending Material",
    createdAt: Date.now(),
    activatedAt: "",
    linkedRecordId: "",
  });
  savePendingMaterials(pendingMaterials);

  if (els.acquisitionItemForm) els.acquisitionItemForm.reset();
  setAcquisitionMessage(`${title} added to ${orderName} as a pending material.`);
  renderAcquisitionOrdersTable();
  renderPendingMaterialsTable();
}

function activatePendingMaterial(materialId) {
  const pendingMaterials = getPendingMaterials();
  const material = pendingMaterials.find((entry) => entry.id === materialId);
  if (!material) return;
  if (material.linkedRecordId) {
    setAcquisitionMessage("This pending material has already been activated.", true);
    return;
  }

  const now = new Date();
  const dateAdded = now.toISOString().slice(0, 10);
  const newRecord = normalizeRecord({
    id: crypto.randomUUID(),
    title: material.title,
    creator: material.creator || "Unknown creator",
    format: material.format || "Book",
    status: "On Order",
    source: "Acquisitions",
    materialNumbers: [material.materialNumber],
    callNumber: material.callNumber || "",
    location: material.location || "",
    coverUrl: material.coverUrl || "",
    notes: material.notes || `Activated from order ${material.orderName}`,
    dateAdded,
    addedAt: now.getTime(),
  });

  state.records.unshift(newRecord);
  saveRecords(state.records);

  const updatedPending = pendingMaterials.map((entry) => (
    entry.id === materialId
      ? { ...entry, status: "Active", activatedAt: now.toISOString(), linkedRecordId: newRecord.id }
      : entry
  ));
  savePendingMaterials(updatedPending);

  setAcquisitionMessage(`${material.title} is now active and was added to the catalog as On Order.`);
  render();
}

function removePendingMaterial(materialId) {
  savePendingMaterials(getPendingMaterials().filter((entry) => entry.id !== materialId));
  setAcquisitionMessage("Pending material removed.");
  renderPendingMaterialsTable();
}

function renderAcquisitionOrdersTable() {
  if (!els.acquisitionOrdersBody) return;
  const orders = getAcquisitionOrders().slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  const pendingMaterials = getPendingMaterials();
  els.acquisitionOrdersBody.innerHTML = "";

  if (!orders.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="4">No acquisition orders yet.</td>';
    els.acquisitionOrdersBody.appendChild(tr);
    return;
  }

  orders.forEach((order) => {
    const tr = document.createElement("tr");
    const count = pendingMaterials.filter((entry) => entry.orderId === order.id).length;
    tr.innerHTML = `<td>${order.name}</td><td>${order.vendor || ""}</td><td>${order.orderDate || ""}</td><td>${count}</td>`;
    els.acquisitionOrdersBody.appendChild(tr);
  });
}

function renderPendingMaterialsTable() {
  if (!els.pendingMaterialsBody) return;
  const pending = getPendingMaterials().slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  els.pendingMaterialsBody.innerHTML = "";

  if (!pending.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="6">No pending materials yet.</td>';
    els.pendingMaterialsBody.appendChild(tr);
    return;
  }

  pending.forEach((material) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${material.title}</td><td>${material.orderName || ""}</td><td>${material.materialNumber || ""}</td><td>${material.status || "Pending Material"}</td><td>${material.coverUrl ? "Yes" : "No"}</td><td><button class="button button-secondary" data-act="activate" type="button">Set Active</button> <button class="button" data-act="remove" type="button">Remove</button></td>`;
    const activateBtn = tr.querySelector('[data-act="activate"]');
    const removeBtn = tr.querySelector('[data-act="remove"]');
    if (material.linkedRecordId) activateBtn.disabled = true;
    activateBtn.addEventListener("click", () => activatePendingMaterial(material.id));
    removeBtn.addEventListener("click", () => removePendingMaterial(material.id));
    els.pendingMaterialsBody.appendChild(tr);
  });
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

function fillWorkspace(record) {
  if (!els.workspaceStatus) return;
  els.workspaceStatus.textContent = record?.status || "Available";
}

function lookupWorkspaceRecord() {
  const modeSelect = document.querySelector('.workspace-toolbar-row select');
  const mode = modeSelect?.value || "Material Number";
  const query = String(els.workspaceLookupInput?.value || "").trim().toLowerCase();
  if (!query) {
    setCirculationMessage("Enter a lookup value first.", true);
    return;
  }

  const found = state.records.find((record) => {
    if (mode === "Title") return String(record.title || "").toLowerCase().includes(query);
    if (mode === "Creator") return String(record.creator || "").toLowerCase().includes(query);
    return (record.materialNumbers || []).some((value) => String(value).toLowerCase() == query);
  });

  if (!found) {
    setCirculationMessage("No matching record was found.", true);
    return;
  }

  populateForm(found);
  setCirculationMessage(`Loaded ${found.title} in the workspace.`);
}

function setActiveWorkspaceRecord(recordId) {
  state.activeWorkspaceRecordId = recordId || "";
  const record = state.records.find((entry) => entry.id === state.activeWorkspaceRecordId);
  fillWorkspace(record || null);
}

function renderTable() {
  const rows = state.records.slice().sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));

  els.recordsBody.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><input type="checkbox" ${state.selectedIds.has(r.id) ? "checked" : ""}></td><td>${r.title}</td><td>${r.creator}</td><td>${r.format}</td><td>${r.year || ""}</td><td>${r.curatedShelf || "—"}</td><td>${r.status || "Available"}</td><td><button class="button button-secondary" data-act="edit" type="button">Edit</button> <button class="button button-secondary" data-act="dup" type="button">Duplicate</button> <button class="button" data-act="del" type="button">Delete</button></td>`;

    tr.querySelector('input[type="checkbox"]').addEventListener("change", (event) => {
      if (event.target.checked) state.selectedIds.add(r.id);
      else state.selectedIds.delete(r.id);
    });

    tr.querySelector('[data-act="edit"]').addEventListener("click", () => {
      setActiveWorkspaceRecord(r.id);
      populateForm(r);
    });
    tr.querySelector('[data-act="dup"]').addEventListener("click", () => {
      const copy = normalizeRecord({ ...r, id: crypto.randomUUID(), title: `${r.title} (Copy)` });
      state.records.unshift(copy);
      saveRecords(state.records);
      render();
    });
    tr.querySelector('[data-act="del"]').addEventListener("click", () => {
      state.records = state.records.filter((entry) => entry.id !== r.id);
      state.selectedIds.delete(r.id);
      if (state.activeWorkspaceRecordId === r.id) state.activeWorkspaceRecordId = state.records[0]?.id || "";
      saveRecords(state.records);
      render();
    });

    els.recordsBody.appendChild(tr);
  });

  if (!rows.length) setActiveWorkspaceRecord("");
  else if (!state.activeWorkspaceRecordId || !rows.some((row) => row.id === state.activeWorkspaceRecordId)) setActiveWorkspaceRecord(rows[0].id);
  else fillWorkspace(rows.find((row) => row.id === state.activeWorkspaceRecordId));
}

function populateForm(record) {
  FORM_FIELDS.forEach((pair) => {
    const [elId, prop] = pair.includes(":") ? pair.split(":") : [pair, pair];
    const value = prop === "materialNumbers" ? (record.materialNumbers || []).join("\n") : (record[prop] || "");
    $(`#${elId}`).value = value;
  });

  const selected = [...new Set(asArray(record.genres?.length ? record.genres : record.genre))];
  [...$("#genres").options].forEach((option) => {
    option.selected = selected.includes(option.value);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
  checkDuplicateDraft();
  setActiveWorkspaceRecord(record.id);
  switchIlsTab("records");
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
    statementOfResponsibility: $("#statementOfResponsibility").value.trim(),
    contributors: $("#contributors").value.trim(),
    format: $("#format").value || "Other",
    edition: $("#edition").value.trim(),
    year: $("#year").value.trim(),
    publicationPlace: $("#publicationPlace").value.trim(),
    publisher: $("#publisher").value.trim(),
    languageCode: $("#languageCode").value.trim(),
    lccn: $("#lccn").value.trim(),
    oclcNumber: $("#oclcNumber").value.trim(),
    deweyNumber: $("#deweyNumber").value.trim(),
    lcClassNumber: $("#lcClassNumber").value.trim(),
    identifier: $("#identifier").value.trim(),
    genre: genres.join(", "),
    genres,
    subjects: $("#subjects").value.trim(),
    summaryNote: $("#summaryNote").value.trim(),
    targetAudience: $("#targetAudience").value.trim(),
    bibliographyNote: $("#bibliographyNote").value.trim(),
    description: $("#description").value.trim(),
    location: $("#location").value.trim(),
    callNumber: $("#callNumber").value.trim(),
    accessionNumber: $("#accessionNumber").value.trim(),
    materialNumbers: parseMaterialNumbersInput($("#materialNumbers").value),
    status: $("#status").value || "Available",
    dateAcquired: $("#dateAcquired").value,
    dateAdded,
    source: $("#source").value.trim(),
    pricePaid: $("#pricePaid").value.trim(),
    retailPrice: $("#retailPrice").value.trim(),
    notes: $("#notes").value.trim(),
    circulationHistory: $("#circulationHistory").value.trim(),
    coverUrl: $("#coverUrl").value.trim(),
    binding: $("#binding").value.trim(),
    seriesName: $("#seriesName").value.trim(),
    seriesNumber: $("#seriesNumber").value.trim(),
    curatedShelf: $("#curatedShelf").value.trim(),
    pageCount: $("#pageCount").value.trim(),
    physicalDetails: $("#physicalDetails").value.trim(),
    marcLeader: $("#marcLeader").value.trim(),
    marc008: $("#marc008").value.trim(),
    addedAt: new Date(dateAdded).getTime() || Date.now(),
  });

  const duplicateMaterial = (record.materialNumbers || []).find((materialNumber) => state.records.some((entry) => entry.id !== id && (entry.materialNumbers || []).includes(materialNumber)));
  if (duplicateMaterial) {
    setCirculationMessage(`Material number ${duplicateMaterial} is already assigned to another item.`, true);
    return;
  }

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

function marcSafe(value) {
  return String(value || "").replaceAll("\n", " ").replaceAll("|", "\u01c0").trim();
}

function toMarcMrk(record) {
  const stamp = new Date();
  const year = String(record.year || "").trim();
  const yearField = year ? year.slice(0, 4).padEnd(4, " ") : "    ";
  const languageCode = String(record.languageCode || "eng").trim().slice(0, 3).padEnd(3, "\\");
  const lines = [
    `=LDR  ${marcSafe(record.marcLeader || "00000nam a2200000 i 4500")}`,
    `=001  ${marcSafe(record.id || record.permalink || crypto.randomUUID())}`,
    `=005  ${stamp.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}.0`,
    `=008  ${marcSafe(record.marc008 || `${stamp.toISOString().slice(2, 10).replaceAll("-", "")}s${yearField}\\xx\\\\\\${languageCode}\\d`)}`,
  ];

  if (record.lccn) lines.push(`=010  \\$a${marcSafe(record.lccn)}`);
  if (record.identifier) lines.push(`=020  \\$a${marcSafe(record.identifier)}`);
  if (record.oclcNumber) lines.push(`=035  \\$a(OCoLC)${marcSafe(record.oclcNumber)}`);
  if (record.creator) lines.push(`=100  1\\$a${marcSafe(record.creator)}`);
  lines.push(`=245  10$a${marcSafe(record.title)}${record.subtitle ? `$b${marcSafe(record.subtitle)}` : ""}${record.statementOfResponsibility ? `$c${marcSafe(record.statementOfResponsibility)}` : ""}`);
  if (record.edition) lines.push(`=250  \\$a${marcSafe(record.edition)}`);
  if (record.publicationPlace || record.publisher || record.year) lines.push(`=264  \\1$a${marcSafe(record.publicationPlace)}$b${marcSafe(record.publisher)}${record.year ? `$c${marcSafe(record.year)}` : ""}`);
  lines.push(`=300  \\$a${record.pageCount ? `${marcSafe(record.pageCount)} pages` : "1 item"}${record.physicalDetails ? `$b${marcSafe(record.physicalDetails)}` : ""}`);
  if (record.bibliographyNote) lines.push(`=504  \\$a${marcSafe(record.bibliographyNote)}`);
  if (record.summaryNote) lines.push(`=520  \\$a${marcSafe(record.summaryNote)}`);
  if (record.targetAudience) lines.push(`=521  \\$a${marcSafe(record.targetAudience)}`);
  if (record.notes) lines.push(`=500  \\$a${marcSafe(record.notes)}`);
  if (record.lcClassNumber) lines.push(`=050  00$a${marcSafe(record.lcClassNumber)}`);
  if (record.deweyNumber) lines.push(`=082  04$a${marcSafe(record.deweyNumber)}`);
  if (record.genre || (record.genres || []).length) lines.push(`=650  \\0$a${marcSafe(record.genre || (record.genres || []).join(", "))}`);
  if (record.subjects) lines.push(`=650  \\0$a${marcSafe(record.subjects)}`);
  if (record.callNumber || record.location || record.curatedShelf) {
    lines.push(`=852  \\$h${marcSafe(record.callNumber)}$b${marcSafe(record.location)}$x${marcSafe(record.curatedShelf)}`);
  }

  return lines;
}


function exportSelectedMarc() {
  const selected = state.records.filter((record) => state.selectedIds.has(record.id));
  if (!selected.length) {
    setCirculationMessage("Select at least one record to export as MARC.", true);
    return;
  }

  const marcText = selected.map((record) => {
    const required = {
      ...record,
      title: record.title || "Untitled",
      creator: record.creator || "Unknown creator",
    };
    return toMarcMrk(required).join("\n");
  }).join("\n\n");

  const blob = new Blob([marcText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `catalog-marc-export-${new Date().toISOString().slice(0, 10)}.mrk`;
  link.click();
  URL.revokeObjectURL(url);
  setCirculationMessage(`Exported ${selected.length} record(s) as MARC (.mrk).`);
}


function exportActiveMarc() {
  const record = state.records.find((entry) => entry.id === state.activeWorkspaceRecordId);
  if (!record) {
    setCirculationMessage("Load a record first to export MARC.", true);
    return;
  }

  const marcText = toMarcMrk({
    ...record,
    title: record.title || "Untitled",
    creator: record.creator || "Unknown creator",
  }).join("\n");

  const blob = new Blob([marcText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(record.title || "record").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${record.id}.mrk`;
  link.click();
  URL.revokeObjectURL(url);
  setCirculationMessage(`Exported MARC for ${record.title || "record"}.`);
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



function handleSerialCoverUpload() {
  const file = els.serialCoverUpload?.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => { if (els.serialCoverUrl) els.serialCoverUrl.value = typeof reader.result === "string" ? reader.result : ""; };
  reader.readAsDataURL(file);
}

function handleAcquisitionCoverUpload() {
  const file = els.acqCoverUpload?.files?.[0];
  if (!file || !els.acqCoverUrl) return;
  const reader = new FileReader();
  reader.onload = () => { els.acqCoverUrl.value = typeof reader.result === "string" ? reader.result : ""; };
  reader.readAsDataURL(file);
}

function renderStatsPanel() {
  if (!els.ilsStatsPage) return;
  const stats = getStats(state.records);
  const formats = Object.entries(stats.byFormat).map(([name, count]) => `${name} (${count})`).join(" • ") || "None";
  const years = Object.entries(stats.byYear).map(([year, count]) => `${year}: ${count}`).join(" • ") || "None";
  const topCreators = stats.mostOwnedAuthors.map((entry) => `${entry.author} (${entry.count})`).join(", ") || "None";
  const newest = stats.newest.map((record) => record.title).join(", ") || "None";
  const paidTotal = state.records.reduce((sum, record) => sum + (Number.parseFloat(record.pricePaid) || 0), 0);
  const retailTotal = state.records.reduce((sum, record) => sum + (Number.parseFloat(record.retailPrice) || 0), 0);

  els.ilsStatsPage.innerHTML = `<p>Total items: <strong>${stats.total}</strong></p><p>Formats: ${formats}</p><p>Most owned authors: ${topCreators}</p><p>Publication year distribution: ${years}</p><p>Newest additions: ${newest}</p><p>Collection value (price paid): <strong>$${paidTotal.toFixed(2)}</strong></p><p>Collection value (retail): <strong>$${retailTotal.toFixed(2)}</strong></p>`;
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
  if (els.serialCoverUpload) els.serialCoverUpload.addEventListener("change", handleSerialCoverUpload);
  if (els.acqCoverUpload) els.acqCoverUpload.addEventListener("change", handleAcquisitionCoverUpload);

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
  if (els.bulkMarcExportBtn) els.bulkMarcExportBtn.addEventListener("click", exportSelectedMarc);
  if (els.workspaceLookupBtn) els.workspaceLookupBtn.addEventListener("click", lookupWorkspaceRecord);
  if (els.workspaceLookupInput) els.workspaceLookupInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      lookupWorkspaceRecord();
    }
  });
  if (els.exportActiveMarcBtn) els.exportActiveMarcBtn.addEventListener("click", exportActiveMarc);
  if (els.patronForm) els.patronForm.addEventListener("submit", addPatron);
  if (els.serialIssueForm) els.serialIssueForm.addEventListener("submit", addSerialIssue);
  if (els.serialSubscriptionForm) els.serialSubscriptionForm.addEventListener("submit", saveSubscription);
  if (els.acquisitionItemForm) els.acquisitionItemForm.addEventListener("submit", addAcquisitionItem);
  if (els.checkOutForm) els.checkOutForm.addEventListener("submit", checkOutRecord);
  if (els.queueCheckoutItemBtn) els.queueCheckoutItemBtn.addEventListener("click", queueCheckoutItem);
  if (els.checkOutMaterialNumber) els.checkOutMaterialNumber.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); queueCheckoutItem(); } });
  if (els.checkInForm) els.checkInForm.addEventListener("submit", checkInByMaterialNumber);
  if (els.holdForm) els.holdForm.addEventListener("submit", placeHold);
  els.circulationTabButtons.forEach((button) => button.addEventListener("click", () => switchCirculationTab(button.dataset.circulationTab)));
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
  renderPatronsTable();
  renderSubscriptionsTable();
  renderSerialIssuesTable();
  renderAcquisitionOrdersTable();
  renderPendingMaterialsTable();
  renderCheckoutQueue();
  renderLoansTable();
  renderHoldsTable();
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
  switchCirculationTab("checkout");
  render();
}

init();
