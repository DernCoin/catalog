import { duplicateCandidates, PRELOADED_GENRES, asArray, getStats } from "./catalog.js";
import { normalizeRecord, loadRecords, saveRecords, loadSettings, saveSettings, loadRecordsFromRemote } from "./storage.js";
import { FIREBASE_CONFIG, STORAGE_KEY } from "./config.js";

const state = {
  records: loadRecords(),
  settings: loadSettings(),
  query: "",
  selectedIds: new Set(),
  ilsTab: "dashboard",
  ilsSection: "dashboard",
  activeSearchIndex: -1,
  unsubscribeRecords: null,
  circulationTab: "checkout",
  queuedCheckoutItems: [],
  activeWorkspaceRecordId: "",
  editingPatronId: "",
  selectedPatronId: "",
  draftHoldings: [],
  recordTab: "basic",
  formDirty: false,
  acquisitionsStage: "orders",
  activeDonationBatchId: "",
  donationFilter: "incoming",
  illFilter: "active",
};


function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG?.apiKey && FIREBASE_CONFIG?.projectId);
}

async function loadFirebaseModule() {
  return import("./firebase.js");
}

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const els = {
  ilsCard: $("#ilsCard"),
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
  ilsSectionButtons: $$(".ils-section-btn[data-ils-section]"),
  ilsTabButtons: $$(".admin-tab-btn[data-ils-tab]"),
  ilsTabPanels: $$(".admin-tab-panel[data-ils-panel]"),
  ilsSectionTitle: $("#ilsSectionTitle"),
  ilsSectionDescription: $("#ilsSectionDescription"),
  newGenreInput: $("#newGenreInput"),
  addGenreBtn: $("#addGenreBtn"),
  genreList: $("#genreList"),
  materialTypeSelect: $("#materialType"),
  newMaterialTypeInput: $("#newMaterialTypeInput"),
  addMaterialTypeBtn: $("#addMaterialTypeBtn"),
  materialTypeList: $("#materialTypeList"),
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
  materialTypeError: $("#materialTypeError"),
  genreError: $("#genreError"),
  formatError: $("#formatError"),
  locationError: $("#locationError"),
  curatedShelfError: $("#curatedShelfError"),
  bindingError: $("#bindingError"),
  ilsStatsPage: $("#ilsStatsPage"),
  dashboardTileGrid: $("#dashboardTileGrid"),
  dashboardDate: $("#dashboardDate"),
  visitorCounterBtn: $("#visitorCounterBtn"),
  visitorCounterTotal: $("#visitorCounterTotal"),
  referenceCounterBtn: $("#referenceCounterBtn"),
  referenceCounterTotal: $("#referenceCounterTotal"),
  headerCounterFeedback: $("#headerCounterFeedback"),
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
  patronStatus: $("#patronStatus"),
  patronExpirationDate: $("#patronExpirationDate"),
  patronNotes: $("#patronNotes"),
  patronBlocks: $("#patronBlocks"),
  patronAlerts: $("#patronAlerts"),
  patronsBody: $("#patronsBody"),
  patronDetailPanel: $("#patronDetailPanel"),
  patronDetailBadge: $("#patronDetailBadge"),
  patronListSummary: $("#patronListSummary"),
  patronFeeForm: $("#patronFeeForm"),
  feeCategory: $("#feeCategory"),
  feeDateAssessed: $("#feeDateAssessed"),
  feeAmount: $("#feeAmount"),
  feeStatus: $("#feeStatus"),
  feeDescription: $("#feeDescription"),
  patronFeeMessage: $("#patronFeeMessage"),
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
  acquisitionMessage: $("#acquisitionMessage"),
  acquisitionsStatusLine: $("#acquisitionsStatusLine"),
  acquisitionSummaryCards: $("#acquisitionSummaryCards"),
  acquisitionsStageNav: $("#acquisitionsStageNav"),
  acquisitionsStageContent: $("#acquisitionsStageContent"),
  checkOutForm: $("#checkOutForm"),
  checkOutCardNumber: $("#checkOutCardNumber"),
  checkOutPatronPreview: $("#checkOutPatronPreview"),
  checkOutMaterialNumber: $("#checkOutMaterialNumber"),
  queueCheckoutItemBtn: $("#queueCheckoutItemBtn"),
  checkOutQueue: $("#checkOutQueue"),
  checkOutDueDate: $("#checkOutDueDate"),
  holdingRows: $("#holdingRows"),
  addHoldingBtn: $("#addHoldingBtn"),
  circulationRulesBody: $("#circulationRulesBody"),
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
  checkoutStatusBefore: $("#checkoutStatusBefore"),
  checkoutStatusAfter: $("#checkoutStatusAfter"),
  checkoutReceipt: $("#checkoutReceipt"),
  checkoutReceiptEmpty: $("#checkoutReceiptEmpty"),
  loansBody: $("#loansBody"),
  workspaceLookupInput: $("#workspaceLookupInput"),
  workspaceLookupBtn: $("#workspaceLookupBtn"),
  exportActiveMarcBtn: $("#exportActiveMarcBtn"),
  workspaceStatus: $("#workspaceStatus"),
  recordSaveMessage: $("#recordSaveMessage"),
  recordTabButtons: $$(".record-tab-btn"),
  recordTabPanels: $$(".record-tab-panel"),
  missingFieldSelect: $("#missingFieldSelect"),
  runMissingReportBtn: $("#runMissingReportBtn"),
  missingReportSummary: $("#missingReportSummary"),
  missingReportBody: $("#missingReportBody"),
  overdueReportSummary: $("#overdueReportSummary"),
  overdueReportBody: $("#overdueReportBody"),
  operationalReports: $("#operationalReports"),
  weedingPreset: $("#weedingPreset"),
  weedingCustomValue: $("#weedingCustomValue"),
  weedingCustomUnit: $("#weedingCustomUnit"),
  weedingLocationFilter: $("#weedingLocationFilter"),
  weedingMaterialTypeFilter: $("#weedingMaterialTypeFilter"),
  weedingStatusFilter: $("#weedingStatusFilter"),
  weedingAudienceFilter: $("#weedingAudienceFilter"),
  weedingSort: $("#weedingSort"),
  weedingSummary: $("#weedingSummary"),
  weedingReportWrap: $("#weedingReportWrap"),
  trafficRangePreset: $("#trafficRangePreset"),
  trafficStartDate: $("#trafficStartDate"),
  trafficEndDate: $("#trafficEndDate"),
  busiestHoursReport: $("#busiestHoursReport"),
  authorStartDate: $("#authorStartDate"),
  authorEndDate: $("#authorEndDate"),
  authorLocationFilter: $("#authorLocationFilter"),
  authorMaterialTypeFilter: $("#authorMaterialTypeFilter"),
  authorAudienceFilter: $("#authorAudienceFilter"),
  authorSort: $("#authorSort"),
  authorReportSummary: $("#authorReportSummary"),
  authorReportWrap: $("#authorReportWrap"),
  sectionSort: $("#sectionSort"),
  sectionUsageSummary: $("#sectionUsageSummary"),
  sectionUsageWrap: $("#sectionUsageWrap"),
  feeReportStatusFilter: $("#feeReportStatusFilter"),
  feeReportCategoryFilter: $("#feeReportCategoryFilter"),
  feeReportPatronFilter: $("#feeReportPatronFilter"),
  feeReportStartDate: $("#feeReportStartDate"),
  feeReportEndDate: $("#feeReportEndDate"),
  finesFeesReports: $("#finesFeesReports"),
  illOutgoingForm: $("#illOutgoingForm"),
  illOutgoingTitle: $("#illOutgoingTitle"),
  illOutgoingAuthor: $("#illOutgoingAuthor"),
  illOutgoingItemRef: $("#illOutgoingItemRef"),
  illOutgoingLibrary: $("#illOutgoingLibrary"),
  illOutgoingContact: $("#illOutgoingContact"),
  illOutgoingRequestedDate: $("#illOutgoingRequestedDate"),
  illOutgoingSentDate: $("#illOutgoingSentDate"),
  illOutgoingDueDate: $("#illOutgoingDueDate"),
  illOutgoingStatus: $("#illOutgoingStatus"),
  illOutgoingNotes: $("#illOutgoingNotes"),
  illOutgoingMessage: $("#illOutgoingMessage"),
  illOutgoingList: $("#illOutgoingList"),
  illOutgoingSummary: $("#illOutgoingSummary"),
  illIncomingForm: $("#illIncomingForm"),
  illIncomingPatronName: $("#illIncomingPatronName"),
  illIncomingPatronCard: $("#illIncomingPatronCard"),
  illIncomingTitle: $("#illIncomingTitle"),
  illIncomingAuthor: $("#illIncomingAuthor"),
  illIncomingFormat: $("#illIncomingFormat"),
  illIncomingLibrary: $("#illIncomingLibrary"),
  illIncomingRequestDate: $("#illIncomingRequestDate"),
  illIncomingReceivedDate: $("#illIncomingReceivedDate"),
  illIncomingDueDate: $("#illIncomingDueDate"),
  illIncomingStatus: $("#illIncomingStatus"),
  illIncomingPickupStatus: $("#illIncomingPickupStatus"),
  illIncomingNotes: $("#illIncomingNotes"),
  illIncomingMessage: $("#illIncomingMessage"),
  illIncomingList: $("#illIncomingList"),
  illIncomingSummary: $("#illIncomingSummary"),
  illStatusCards: $("#illStatusCards"),
  illCompletedList: $("#illCompletedList"),
  illReportsSummary: $("#illReportsSummary"),
  illReportsTableWrap: $("#illReportsTableWrap"),
  registerForm: $("#registerForm"),
  registerDate: $("#registerDate"),
  registerAmount: $("#registerAmount"),
  registerCategory: $("#registerCategory"),
  registerPaymentType: $("#registerPaymentType"),
  registerStaffInitials: $("#registerStaffInitials"),
  registerDonationPurposeLabel: $("#registerDonationPurposeLabel"),
  registerDonationPurpose: $("#registerDonationPurpose"),
  registerDonationOtherLabel: $("#registerDonationOtherLabel"),
  registerDonationOther: $("#registerDonationOther"),
  registerNotes: $("#registerNotes"),
  registerMessage: $("#registerMessage"),
  registerSummaryCards: $("#registerSummaryCards"),
  registerReportDate: $("#registerReportDate"),
  registerDailyTableWrap: $("#registerDailyTableWrap"),
};

const ILS_SECTIONS = {
  dashboard: { label: "Dashboard", description: "Overview of circulation, cataloging, acquisitions, and patron activity.", tabs: [{ id: "dashboard", label: "Overview" }] },
  circulation: { label: "Circulation", description: "Check out, check in, and manage holds from one circulation workspace.", tabs: [{ id: "circulation", label: "Desk" }] },
  cataloging: { label: "Cataloging", description: "Catalog maintenance and serials work grouped together for easier navigation.", tabs: [{ id: "records", label: "Edit Records" }, { id: "serials", label: "Serials" }] },
  acquisitions: { label: "Acquisitions", description: "Manage orders, receive incoming materials, and move items through pending processing into the catalog.", tabs: [{ id: "acquisitions", label: "Acquisitions Workspace" }] },
  patrons: { label: "Patrons", description: "Review patron accounts, contact data, and circulation activity.", tabs: [{ id: "patrons", label: "Accounts" }] },
  ill: { label: "Interlibrary Loan", description: "Manage outgoing loans, incoming patron requests, temporary ILL items, and monthly ILL activity.", tabs: [{ id: "ill-outgoing", label: "Outgoing ILL" }, { id: "ill-incoming", label: "Incoming Requests" }, { id: "ill-reports", label: "ILL Reports" }] },
  register: { label: "Daily Register", description: "Log staff-side cash intake, service transactions, and daily drawer totals.", tabs: [{ id: "register", label: "Register" }] },
  administration: { label: "Administration", description: "System settings and controlled list management for staff administration.", tabs: [{ id: "circulation-rules", label: "Circulation Rules" }, { id: "utilities", label: "Utilities" }] },
  reports: { label: "Reports", description: "Run statistics, operational activity, missing bibliography, and overdue reports from one reporting area.", tabs: [{ id: "stats", label: "Statistics" }] },
};

const TAB_TO_SECTION = Object.fromEntries(
  Object.entries(ILS_SECTIONS).flatMap(([section, config]) => config.tabs.map((tab) => [tab.id, section])),
);

const MANAGED_LIST_CONFIG = {
  materialTypes: { key: "materialTypes", label: "material type", errorEl: "materialTypeError", countId: "materialTypeCount" },
  genres: { key: "genres", label: "genre", errorEl: "genreError", countId: "genreCount" },
  formats: { key: "formats", label: "format", errorEl: "formatError", countId: "formatCount" },
  locations: { key: "locations", label: "shelf location", errorEl: "locationError", countId: "locationCount" },
  curatedShelves: { key: "curatedShelves", label: "curated shelf", errorEl: "curatedShelfError", countId: "curatedShelfCount" },
  bindings: { key: "bindings", label: "binding", errorEl: "bindingError", countId: "bindingCount" },
};


const MISSING_REPORT_FIELDS = {
  location: "Location",
  callNumber: "Call Number",
  identifier: "Identifier / ISBN",
  publisher: "Publisher",
  year: "Publication Year",
  description: "Description",
  subjects: "Subjects",
  materialNumbers: "Material Number",
};

const FORM_FIELDS = [
  "recordId:id", "title", "subtitle", "creator", "statementOfResponsibility", "contributors", "format", "edition", "year", "publicationPlace", "publisher", "languageCode", "lccn", "oclcNumber", "deweyNumber", "lcClassNumber", "identifier", "genre", "subjects", "description", "dateAdded", "notes", "coverUrl", "circulationHistory", "binding", "seriesName", "seriesNumber", "curatedShelf", "pageCount", "physicalDetails", "summaryNote", "targetAudience", "bibliographyNote", "marcLeader", "marc008", "materialType",
];

function renderIlsSubnav(section = state.ilsSection) {
  const config = ILS_SECTIONS[section] || ILS_SECTIONS.dashboard;
  if (els.ilsSectionTitle) els.ilsSectionTitle.textContent = config.label;
  if (els.ilsSectionDescription) els.ilsSectionDescription.textContent = config.description;

  Object.entries(ILS_SECTIONS).forEach(([sectionId, sectionConfig]) => {
    const subnav = document.querySelector(`#ilsSubnav-${sectionId}`);
    if (!subnav) return;

    if (sectionId !== section) {
      subnav.innerHTML = "";
      subnav.classList.add("hidden");
      return;
    }

    subnav.innerHTML = sectionConfig.tabs.map((tab) => `
      <button class="button button-secondary ils-subnav-btn ${state.ilsTab === tab.id ? "is-active" : ""}" data-ils-tab="${tab.id}" type="button">${tab.label}</button>
    `).join("");
    subnav.classList.toggle("hidden", !sectionConfig.tabs.length);
    [...subnav.querySelectorAll("[data-ils-tab]")].forEach((button) => button.addEventListener("click", () => switchIlsTab(button.dataset.ilsTab)));
  });
}

function switchIlsSection(section, preferredTab = "") {
  const resolvedSection = ILS_SECTIONS[section] ? section : "dashboard";
  state.ilsSection = resolvedSection;
  els.ilsSectionButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.ilsSection === resolvedSection));
  const tabs = ILS_SECTIONS[resolvedSection]?.tabs || [];
  const nextTab = tabs.some((tab) => tab.id === preferredTab) ? preferredTab : (tabs[0]?.id || "dashboard");
  renderIlsSubnav(resolvedSection);
  switchIlsTab(nextTab);
}

function switchIlsTab(tab) {
  state.ilsTab = tab;
  state.ilsSection = TAB_TO_SECTION[tab] || state.ilsSection || "dashboard";
  els.ilsSectionButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.ilsSection === state.ilsSection));
  els.ilsTabPanels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.ilsPanel !== tab));
  renderIlsSubnav(state.ilsSection);
  if (tab !== "records") hideSearchPopover();
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


const COUNTER_KEYS = {
  visitor: "visitorCounts",
  reference: "referenceCounts",
};
const COUNTER_LABELS = {
  visitor: "building visits",
  reference: "reference questions",
};
const ILL_OUTGOING_STATUSES = ["Requested", "Pulled", "In Transit", "Received by Borrowing Library", "Checked Out to Borrowing Library Patron", "Returning", "Returned", "Completed", "Cancelled"];
const ILL_INCOMING_STATUSES = ["Requested", "Submitted", "Located", "In Transit", "Received", "On Hold for Patron", "Checked Out to Patron", "Returned by Patron", "Returned to Lending Library", "Completed", "Cancelled"];
const ILL_COMPLETED_STATUSES = new Set(["Completed", "Cancelled"]);
const REGISTER_CATEGORIES = ["Copies", "Faxing", "New Cards", "Cash Donations", "Replacement Costs", "Fines / Fees"];
const DONATION_PURPOSES = ["Memorial", "Adopted Author", "State Funding", "General Donation", "Other"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthKey(dateString) {
  return String(dateString || "").slice(0, 7);
}

function formatMonthLabel(monthKey) {
  if (!monthKey) return "Unknown month";
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year || 0, (month || 1) - 1, 1)).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

function formatCurrency(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function getDailyCounterMap(type) {
  const key = COUNTER_KEYS[type];
  return state.settings[key] && typeof state.settings[key] === "object" ? state.settings[key] : {};
}

function saveDailyCounterMap(type, map) {
  state.settings[COUNTER_KEYS[type]] = map;
  saveSettings(state.settings);
}

function incrementDailyCounter(type) {
  const date = todayIso();
  const current = { ...getDailyCounterMap(type) };
  current[date] = Number(current[date] || 0) + 1;
  saveDailyCounterMap(type, current);
  const logEntries = [...getCounterLog(type), { id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`, timestamp: new Date().toISOString(), source: 'counterButton' }];
  saveCounterLog(type, logEntries);
  renderQuickCounters();
  renderDashboard();
  renderStatsPanel();
  flashCounterFeedback(type, current[date]);
}

function getDailyCounterTotal(type, date = todayIso()) {
  return Number(getDailyCounterMap(type)[date] || 0);
}

function summarizeCounterByMonth(type) {
  return Object.entries(getDailyCounterMap(type)).reduce((acc, [date, count]) => {
    const month = getMonthKey(date);
    acc[month] = Number(acc[month] || 0) + Number(count || 0);
    return acc;
  }, {});
}


function getCounterLog(type) {
  const key = type === "visitor" ? "visitorLog" : `${type}Log`;
  return Array.isArray(state.settings[key]) ? state.settings[key] : [];
}

function saveCounterLog(type, entries) {
  const key = type === "visitor" ? "visitorLog" : `${type}Log`;
  state.settings[key] = entries;
  saveSettings(state.settings);
}

function getFeeEntries() {
  return Array.isArray(state.settings.patronFees) ? state.settings.patronFees : [];
}

function saveFeeEntries(entries) {
  state.settings.patronFees = entries;
  saveSettings(state.settings);
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function parseCirculationLines(record) {
  return String(record.circulationHistory || "").split(/
+/).filter(Boolean).map((line) => {
    const match = line.match(/^\[(.+?)\]\s*(.*)$/);
    const rawDate = match?.[1] || "";
    const action = match?.[2] || line;
    return {
      line,
      action,
      timestamp: rawDate ? new Date(rawDate.replace(" ", "T")).getTime() : NaN,
      isCheckout: /checked out to/i.test(action),
      patronText: (action.match(/Checked out to (.+?) \(Card:/i) || [])[1] || "",
    };
  });
}

function getLifetimeCheckoutCount(record) {
  return parseCirculationLines(record).filter((entry) => entry.isCheckout).length;
}

function getLastCheckoutDate(record) {
  const checkoutLines = parseCirculationLines(record).filter((entry) => entry.isCheckout && Number.isFinite(entry.timestamp)).sort((a, b) => b.timestamp - a.timestamp);
  if (checkoutLines.length) return new Date(checkoutLines[0].timestamp).toISOString();
  const holdingsDate = (record.holdings || []).map((holding) => holding.checkedOutAt).filter(Boolean).sort().pop();
  return holdingsDate || "";
}

function formatDisplayDate(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
}

function normalizeAuthorGroupingKey(record = {}) {
  const authorityId = String(record.authorityId || record.authorId || record.creatorAuthorityId || "").trim();
  if (authorityId) return { key: `authority:${authorityId}`, display: record.creator || authorityId, source: "authorityId" };
  const normalized = String(record.creator || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return { key: `name:${normalized || 'unknown'}`, display: record.creator || "Unknown author", source: "normalizedName" };
}

function getPrimaryHolding(record) {
  return (record.holdings || [])[0] || {};
}

function getRecordShelfLocation(record) {
  return getPrimaryHolding(record).location || record.location || "Unassigned";
}

function getRecordCallNumber(record) {
  return getPrimaryHolding(record).callNumber || record.callNumber || "";
}

function getRecordBarcode(record) {
  return getPrimaryHolding(record).materialNumbers?.[0] || record.materialNumbers?.[0] || "";
}

function getRecordAudience(record) {
  return record.targetAudience || record.curatedShelf || "General";
}

function getRecordStatus(record) {
  return getPrimaryHolding(record).status || record.status || "Available";
}

function buildRecordCirculationSnapshot(record) {
  return {
    id: record.id,
    title: record.title || "Untitled",
    author: record.creator || "Unknown author",
    barcode: getRecordBarcode(record),
    callNumber: getRecordCallNumber(record),
    location: getRecordShelfLocation(record),
    materialType: record.materialType || record.format || "Other",
    audience: getRecordAudience(record),
    status: getRecordStatus(record),
    totalCheckouts: getLifetimeCheckoutCount(record),
    lastCheckoutDate: getLastCheckoutDate(record),
  };
}

function getManagedAudienceValues() {
  return [...new Set(state.records.map(getRecordAudience).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getManagedStatusValues() {
  return [...new Set(state.records.map(getRecordStatus).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function populateReportSelect(selectEl, values, allLabel) {
  if (!selectEl) return;
  const current = selectEl.value || "all";
  selectEl.innerHTML = [`<option value="all">${allLabel}</option>`, ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
  selectEl.value = values.includes(current) || current === "all" ? current : "all";
}

function getCutoffDateFromWeedingFilters() {
  const preset = els.weedingPreset?.value || "6-months";
  let amount = 6;
  let unit = "months";
  if (preset === "custom") {
    amount = Number.parseInt(els.weedingCustomValue?.value || "1", 10) || 1;
    unit = els.weedingCustomUnit?.value || "months";
  } else {
    const [rawAmount, rawUnit] = preset.split("-");
    amount = Number.parseInt(rawAmount || "6", 10) || 6;
    unit = rawUnit || "months";
  }
  const cutoff = new Date();
  if (unit === "years") cutoff.setFullYear(cutoff.getFullYear() - amount);
  else cutoff.setMonth(cutoff.getMonth() - amount);
  return cutoff;
}

function getFilteredWeedingRows() {
  const cutoff = getCutoffDateFromWeedingFilters();
  const locationFilter = els.weedingLocationFilter?.value || "all";
  const materialTypeFilter = els.weedingMaterialTypeFilter?.value || "all";
  const statusFilter = els.weedingStatusFilter?.value || "all";
  const audienceFilter = els.weedingAudienceFilter?.value || "all";
  const sort = els.weedingSort?.value || "oldest";
  const rows = state.records.map(buildRecordCirculationSnapshot).filter((row) => {
    if (locationFilter !== "all" && row.location !== locationFilter) return false;
    if (materialTypeFilter !== "all" && row.materialType !== materialTypeFilter) return false;
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    if (audienceFilter !== "all" && row.audience !== audienceFilter) return false;
    if (!row.lastCheckoutDate) return true;
    return new Date(row.lastCheckoutDate) < cutoff;
  });
  rows.sort((a, b) => {
    if (sort === "lowest-count") return a.totalCheckouts - b.totalCheckouts || a.title.localeCompare(b.title);
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "location") return a.location.localeCompare(b.location) || a.title.localeCompare(b.title);
    const timeA = a.lastCheckoutDate ? new Date(a.lastCheckoutDate).getTime() : -Infinity;
    const timeB = b.lastCheckoutDate ? new Date(b.lastCheckoutDate).getTime() : -Infinity;
    return timeA - timeB || a.totalCheckouts - b.totalCheckouts;
  });
  return { rows, cutoff };
}

function getTrafficDateRange() {
  const preset = els.trafficRangePreset?.value || "current-week";
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  if (preset === "current-week") {
    const weekday = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - weekday);
  } else if (preset === "current-month") {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  } else if (preset === "last-30-days") {
    start.setDate(now.getDate() - 29);
  } else {
    start = new Date((els.trafficStartDate?.value || todayIso()) + 'T00:00:00');
    end = new Date((els.trafficEndDate?.value || todayIso()) + 'T23:59:59');
  }
  start.setHours(0,0,0,0);
  end.setHours(23,59,59,999);
  return { start, end };
}

function ensureCounterLogBackfill(type) {
  if (type !== "visitor") return;
  const log = getCounterLog(type);
  if (log.length) return;
  const dailyMap = getDailyCounterMap(type);
  const synthetic = Object.entries(dailyMap).flatMap(([date, count]) => Array.from({ length: Number(count) || 0 }, (_, index) => ({ id: `${type}-${date}-${index}`, timestamp: `${date}T12:00:00.000Z`, source: "dailyBackfill" })));
  if (synthetic.length) saveCounterLog(type, synthetic);
}

function groupVisitsByHourAndDay(entries) {
  const byHour = new Map();
  const byDayHour = new Map();
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  entries.forEach((entry) => {
    const date = new Date(entry.timestamp);
    if (Number.isNaN(date.getTime())) return;
    const hour = date.getHours();
    const day = weekdayNames[date.getDay()];
    const hourBlock = `${formatHourBlock(hour)}`;
    byHour.set(hourBlock, Number(byHour.get(hourBlock) || 0) + 1);
    const key = `${day}||${hour}`;
    const current = byDayHour.get(key) || { day, hour, hourBlock, count: 0 };
    current.count += 1;
    byDayHour.set(key, current);
  });
  return {
    byHour: [...byHour.entries()].map(([hourBlock, count]) => ({ hourBlock, count })).sort((a, b) => b.count - a.count || a.hourBlock.localeCompare(b.hourBlock)),
    byDayHour: [...byDayHour.values()].sort((a, b) => b.count - a.count || a.day.localeCompare(b.day) || a.hour - b.hour),
  };
}

function formatHourBlock(hour) {
  const start = new Date();
  start.setHours(hour, 0, 0, 0);
  const end = new Date();
  end.setHours((hour + 1) % 24, 0, 0, 0);
  return `${start.toLocaleTimeString([], { hour: 'numeric' })} – ${end.toLocaleTimeString([], { hour: 'numeric' })}`;
}

function getBorrowedAuthorRows() {
  const start = els.authorStartDate?.value ? new Date(`${els.authorStartDate.value}T00:00:00`) : null;
  const end = els.authorEndDate?.value ? new Date(`${els.authorEndDate.value}T23:59:59`) : null;
  const locationFilter = els.authorLocationFilter?.value || 'all';
  const materialTypeFilter = els.authorMaterialTypeFilter?.value || 'all';
  const audienceFilter = els.authorAudienceFilter?.value || 'all';
  const rows = new Map();
  state.records.forEach((record) => {
    const location = getRecordShelfLocation(record);
    const materialType = record.materialType || record.format || 'Other';
    const audience = getRecordAudience(record);
    if (locationFilter !== 'all' && location !== locationFilter) return;
    if (materialTypeFilter !== 'all' && materialType !== materialTypeFilter) return;
    if (audienceFilter !== 'all' && audience !== audienceFilter) return;
    const authorKey = normalizeAuthorGroupingKey(record);
    const entry = rows.get(authorKey.key) || { key: authorKey.key, author: authorKey.display, totalCheckouts: 0, titleIds: new Set(), topTitle: '', topTitleCount: 0, mostRecentCheckout: '' };
    const checkoutLines = parseCirculationLines(record).filter((line) => line.isCheckout);
    let recordCount = 0;
    let recordMostRecent = '';
    checkoutLines.forEach((line) => {
      if (!Number.isFinite(line.timestamp)) return;
      const dt = new Date(line.timestamp);
      if (start && dt < start) return;
      if (end && dt > end) return;
      recordCount += 1;
      const iso = dt.toISOString();
      if (!recordMostRecent || iso > recordMostRecent) recordMostRecent = iso;
    });
    if (!recordCount) return;
    entry.totalCheckouts += recordCount;
    entry.titleIds.add(record.id);
    if (recordCount > entry.topTitleCount) {
      entry.topTitleCount = recordCount;
      entry.topTitle = record.title || 'Untitled';
    }
    if (recordMostRecent && (!entry.mostRecentCheckout || recordMostRecent > entry.mostRecentCheckout)) entry.mostRecentCheckout = recordMostRecent;
    rows.set(authorKey.key, entry);
  });
  const list = [...rows.values()].map((row) => ({ ...row, titleCount: row.titleIds.size }));
  const sort = els.authorSort?.value || 'checkouts';
  list.sort((a, b) => {
    if (sort === 'name') return a.author.localeCompare(b.author);
    if (sort === 'titles') return b.titleCount - a.titleCount || b.totalCheckouts - a.totalCheckouts;
    return b.totalCheckouts - a.totalCheckouts || a.author.localeCompare(b.author);
  });
  return list;
}

function getSectionUsageRows() {
  const sectionMap = new Map();
  state.records.forEach((record) => {
    const section = getRecordShelfLocation(record);
    const current = sectionMap.get(section) || { section, itemCount: 0, totalCheckouts: 0, lastActivity: '', items: [] };
    const lastCheckoutDate = getLastCheckoutDate(record);
    current.itemCount += 1;
    current.totalCheckouts += getLifetimeCheckoutCount(record);
    current.items.push(record.id);
    if (lastCheckoutDate && (!current.lastActivity || lastCheckoutDate > current.lastActivity)) current.lastActivity = lastCheckoutDate;
    sectionMap.set(section, current);
  });
  const totals = [...sectionMap.values()].reduce((acc, row) => ({ items: acc.items + row.itemCount, checkouts: acc.checkouts + row.totalCheckouts }), { items: 0, checkouts: 0 });
  const list = [...sectionMap.values()].map((row) => {
    const average = row.itemCount ? row.totalCheckouts / row.itemCount : 0;
    const collectionShare = totals.items ? (row.itemCount / totals.items) * 100 : 0;
    const circulationShare = totals.checkouts ? (row.totalCheckouts / totals.checkouts) * 100 : 0;
    const usageBand = average < 0.5 ? 'underused' : average < 2 ? 'moderate' : 'high use';
    return { ...row, averageCheckouts: average, collectionShare, circulationShare, usageBand };
  });
  const sort = els.sectionSort?.value || 'avg-asc';
  list.sort((a, b) => {
    if (sort === 'total-asc') return a.totalCheckouts - b.totalCheckouts || b.itemCount - a.itemCount;
    if (sort === 'large-underused') return (b.itemCount - a.itemCount) || (a.averageCheckouts - b.averageCheckouts);
    if (sort === 'name') return a.section.localeCompare(b.section);
    return a.averageCheckouts - b.averageCheckouts || b.itemCount - a.itemCount;
  });
  return { list, totals };
}

function normalizeFeeEntry(entry = {}) {
  const amount = Number.parseFloat(entry.amount || 0) || 0;
  const amountPaid = Number.parseFloat(entry.amountPaid || 0) || 0;
  const status = String(entry.status || 'Unpaid').trim() || 'Unpaid';
  return {
    id: entry.id || `FEE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    patronId: String(entry.patronId || '').trim(),
    patronName: String(entry.patronName || '').trim(),
    patronCardNumber: String(entry.patronCardNumber || '').trim(),
    dateAssessed: String(entry.dateAssessed || todayIso()).trim(),
    category: String(entry.category || 'Fine').trim(),
    amount,
    description: String(entry.description || '').trim(),
    status,
    amountPaid,
    remainingAmount: Math.max(0, amount - amountPaid),
    paymentHistory: Array.isArray(entry.paymentHistory) ? entry.paymentHistory : [],
    createdAt: Number(entry.createdAt) || Date.now(),
    updatedAt: Date.now(),
  };
}

function calculatePatronBalance(patronId) {
  const entries = getFeeEntries().filter((entry) => entry.patronId === patronId).map(normalizeFeeEntry);
  const totalBalance = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const unpaidAmount = entries.reduce((sum, entry) => sum + (entry.status === 'Paid' || entry.status === 'Waived' ? 0 : entry.remainingAmount), 0);
  const outstandingCharges = entries.filter((entry) => !['Paid', 'Waived'].includes(entry.status)).length;
  return { entries, totalBalance, unpaidAmount, outstandingCharges };
}

function summarizeFinesFees(filters = {}) {
  const patrons = new Map(getPatrons().map((patron) => [patron.id, patron]));
  const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null;
  const rows = getFeeEntries().map(normalizeFeeEntry).filter((entry) => {
    if (filters.status === 'unpaid-only' && ['Paid', 'Waived'].includes(entry.status)) return false;
    if (filters.category && filters.category !== 'all' && entry.category !== filters.category) return false;
    if (filters.patronId && filters.patronId !== 'all' && entry.patronId !== filters.patronId) return false;
    const assessedDate = new Date(`${entry.dateAssessed}T00:00:00`);
    if (start && assessedDate < start) return false;
    if (end && assessedDate > end) return false;
    return true;
  }).map((entry) => ({ ...entry, patron: patrons.get(entry.patronId) }));
  const byPatron = new Map();
  const byCategory = new Map();
  const monthly = new Map();
  rows.forEach((entry) => {
    const currentPatron = byPatron.get(entry.patronId) || { patronName: entry.patronName || entry.patron?.name || 'Unknown patron', cardNumber: entry.patronCardNumber || entry.patron?.cardNumber || '', totalBalance: 0, unpaidAmount: 0, outstandingCharges: 0 };
    currentPatron.totalBalance += entry.amount;
    if (!['Paid', 'Waived'].includes(entry.status)) {
      currentPatron.unpaidAmount += entry.remainingAmount;
      currentPatron.outstandingCharges += 1;
    }
    byPatron.set(entry.patronId, currentPatron);
    byCategory.set(entry.category, Number(byCategory.get(entry.category) || 0) + entry.amount);
    const month = getMonthKey(entry.dateAssessed);
    const monthRow = monthly.get(month) || { assessed: 0, paid: 0 };
    monthRow.assessed += entry.amount;
    monthRow.paid += entry.amountPaid;
    monthly.set(month, monthRow);
  });
  return { rows, byPatron: [...byPatron.values()].sort((a, b) => b.unpaidAmount - a.unpaidAmount || a.patronName.localeCompare(b.patronName)), byCategory: [...byCategory.entries()].sort((a, b) => b[1] - a[1]), monthly: [...monthly.entries()].sort((a, b) => b[0].localeCompare(a[0])) };
}

function getIllTransactions(type) {
  const key = type === "incoming" ? "incomingIllTransactions" : "outgoingIllTransactions";
  return Array.isArray(state.settings[key]) ? state.settings[key] : [];
}

function saveIllTransactions(type, transactions) {
  const key = type === "incoming" ? "incomingIllTransactions" : "outgoingIllTransactions";
  state.settings[key] = transactions;
  saveSettings(state.settings);
}

function getRegisterTransactions() {
  return Array.isArray(state.settings.registerTransactions) ? state.settings.registerTransactions : [];
}

function saveRegisterTransactions(transactions) {
  state.settings.registerTransactions = transactions;
  saveSettings(state.settings);
}

function setHeaderFeedback(message, type = "success") {
  if (!els.headerCounterFeedback) return;
  els.headerCounterFeedback.textContent = message;
  els.headerCounterFeedback.className = `quick-counter-feedback is-visible ${type === "error" ? "is-error" : ""}`.trim();
  window.clearTimeout(setHeaderFeedback.timeoutId);
  setHeaderFeedback.timeoutId = window.setTimeout(() => {
    if (!els.headerCounterFeedback) return;
    els.headerCounterFeedback.textContent = "";
    els.headerCounterFeedback.className = "quick-counter-feedback";
  }, 1200);
}

function flashCounterFeedback(type, total) {
  const btn = type === "visitor" ? els.visitorCounterBtn : els.referenceCounterBtn;
  if (btn) {
    btn.classList.remove("is-pulsing");
    void btn.offsetWidth;
    btn.classList.add("is-pulsing");
    window.setTimeout(() => btn.classList.remove("is-pulsing"), 350);
  }
  setHeaderFeedback(`Recorded ${type === "visitor" ? "visitor" : "reference question"}. Today's total: ${total}.`);
}

function renderQuickCounters() {
  if (els.visitorCounterTotal) els.visitorCounterTotal.textContent = `Today: ${getDailyCounterTotal("visitor")}`;
  if (els.referenceCounterTotal) els.referenceCounterTotal.textContent = `Today: ${getDailyCounterTotal("reference")}`;
}

function setIllMessage(type, message, isError = false) {
  const target = type === "incoming" ? els.illIncomingMessage : els.illOutgoingMessage;
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("warning", isError);
}

function populateStaticSelects() {
  if (els.illOutgoingStatus) els.illOutgoingStatus.innerHTML = ILL_OUTGOING_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("");
  if (els.illIncomingStatus) els.illIncomingStatus.innerHTML = ILL_INCOMING_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("");
  if (els.registerCategory) els.registerCategory.innerHTML = REGISTER_CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join("");
  if (els.registerDonationPurpose) els.registerDonationPurpose.innerHTML = DONATION_PURPOSES.map((purpose) => `<option value="${purpose}">${purpose}</option>`).join("");
  if (els.registerDate && !els.registerDate.value) els.registerDate.value = todayIso();
  if (els.registerReportDate && !els.registerReportDate.value) els.registerReportDate.value = todayIso();
  if (els.illOutgoingRequestedDate && !els.illOutgoingRequestedDate.value) els.illOutgoingRequestedDate.value = todayIso();
  if (els.illIncomingRequestDate && !els.illIncomingRequestDate.value) els.illIncomingRequestDate.value = todayIso();
  if (els.feeDateAssessed && !els.feeDateAssessed.value) els.feeDateAssessed.value = todayIso();
  if (els.trafficStartDate && !els.trafficStartDate.value) els.trafficStartDate.value = todayIso();
  if (els.trafficEndDate && !els.trafficEndDate.value) els.trafficEndDate.value = todayIso();
}

function normalizeIllTransaction(type, entry = {}) {
  const incoming = type === "incoming";
  const status = String(entry.status || (incoming ? "Requested" : "Requested")).trim() || "Requested";
  const base = {
    id: entry.id || `ILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    status,
    title: String(entry.title || "").trim(),
    author: String(entry.author || "").trim(),
    notes: String(entry.notes || "").trim(),
    createdAt: Number(entry.createdAt) || Date.now(),
    updatedAt: Date.now(),
  };
  if (incoming) {
    const receivedDate = String(entry.receivedDate || "").trim();
    return {
      ...base,
      patronName: String(entry.patronName || "").trim(),
      patronCardNumber: String(entry.patronCardNumber || "").trim(),
      format: String(entry.format || "").trim(),
      lendingLibrary: String(entry.lendingLibrary || "").trim(),
      requestDate: String(entry.requestDate || todayIso()).trim(),
      receivedDate,
      dueDate: String(entry.dueDate || "").trim(),
      pickupStatus: String(entry.pickupStatus || "Awaiting processing").trim(),
      temporaryItem: receivedDate || ["Received", "On Hold for Patron", "Checked Out to Patron", "Returned by Patron", "Returned to Lending Library", "Completed"].includes(status) ? {
        label: `TEMP-ILL-${String(base.id).slice(-6)}`,
        status,
        dueDate: String(entry.dueDate || "").trim(),
        isTemporary: true,
      } : null,
    };
  }
  return {
    ...base,
    itemRef: String(entry.itemRef || "").trim(),
    borrowingLibrary: String(entry.borrowingLibrary || "").trim(),
    contactInfo: String(entry.contactInfo || "").trim(),
    requestDate: String(entry.requestDate || todayIso()).trim(),
    sentDate: String(entry.sentDate || "").trim(),
    dueDate: String(entry.dueDate || "").trim(),
    returnStatus: String(entry.returnStatus || "").trim(),
  };
}

function saveOutgoingIll(event) {
  event.preventDefault();
  const entry = normalizeIllTransaction("outgoing", {
    title: els.illOutgoingTitle?.value,
    author: els.illOutgoingAuthor?.value,
    itemRef: els.illOutgoingItemRef?.value,
    borrowingLibrary: els.illOutgoingLibrary?.value,
    contactInfo: els.illOutgoingContact?.value,
    requestDate: els.illOutgoingRequestedDate?.value,
    sentDate: els.illOutgoingSentDate?.value,
    dueDate: els.illOutgoingDueDate?.value,
    status: els.illOutgoingStatus?.value,
    notes: els.illOutgoingNotes?.value,
  });
  saveIllTransactions("outgoing", [entry, ...getIllTransactions("outgoing")]);
  els.illOutgoingForm?.reset();
  populateStaticSelects();
  setIllMessage("outgoing", `Saved outgoing ILL ${entry.id}.`);
  renderIllWorkspace();
  renderStatsPanel();
  renderDashboard();
  renderQuickCounters();
  renderIllWorkspace();
  renderRegisterWorkspace();
}

function saveIncomingIll(event) {
  event.preventDefault();
  const entry = normalizeIllTransaction("incoming", {
    patronName: els.illIncomingPatronName?.value,
    patronCardNumber: els.illIncomingPatronCard?.value,
    title: els.illIncomingTitle?.value,
    author: els.illIncomingAuthor?.value,
    format: els.illIncomingFormat?.value,
    lendingLibrary: els.illIncomingLibrary?.value,
    requestDate: els.illIncomingRequestDate?.value,
    receivedDate: els.illIncomingReceivedDate?.value,
    dueDate: els.illIncomingDueDate?.value,
    status: els.illIncomingStatus?.value,
    pickupStatus: els.illIncomingPickupStatus?.value,
    notes: els.illIncomingNotes?.value,
  });
  saveIllTransactions("incoming", [entry, ...getIllTransactions("incoming")]);
  els.illIncomingForm?.reset();
  populateStaticSelects();
  setIllMessage("incoming", `Saved incoming ILL ${entry.id}.`);
  renderIllWorkspace();
  renderStatsPanel();
  renderDashboard();
}

function updateIllStatus(type, id, status) {
  const updated = getIllTransactions(type).map((entry) => entry.id === id ? normalizeIllTransaction(type, { ...entry, status, receivedDate: type === "incoming" && (entry.receivedDate || status === "Received" || status === "On Hold for Patron" || status === "Checked Out to Patron") ? (entry.receivedDate || todayIso()) : entry.receivedDate }) : entry);
  saveIllTransactions(type, updated);
  renderIllWorkspace();
  renderStatsPanel();
  renderDashboard();
}

function renderIllCards(target, entries, type) {
  if (!target) return;
  if (!entries.length) {
    target.innerHTML = `<div class="empty-state">${type === "incoming" ? "No active ILL requests yet. Incoming requests and temporary items will appear here." : "No active outgoing ILL transactions. Sent items and transit updates will appear here."}</div>`;
    return;
  }
  const statuses = type === "incoming" ? ILL_INCOMING_STATUSES : ILL_OUTGOING_STATUSES;
  target.innerHTML = entries.map((entry) => {
    const selectOptions = statuses.map((status) => `<option value="${status}" ${entry.status === status ? "selected" : ""}>${status}</option>`).join("");
    const meta = type === "incoming"
      ? `<div class="item-grid"><span><strong>Patron:</strong> ${escapeHtml(entry.patronName || "Unknown")}</span><span><strong>Lending library:</strong> ${escapeHtml(entry.lendingLibrary || "Unknown")}</span><span><strong>Received:</strong> ${escapeHtml(entry.receivedDate || "Not yet received")}</span><span><strong>Due:</strong> ${escapeHtml(entry.dueDate || "Not set")}</span></div>${entry.temporaryItem ? `<p class="muted">Temporary item: <strong>${escapeHtml(entry.temporaryItem.label)}</strong> · ${escapeHtml(entry.temporaryItem.status)} · Not part of permanent holdings.</p>` : `<p class="muted">Temporary item will be created automatically when the request is received.</p>`}`
      : `<div class="item-grid"><span><strong>Borrowing library:</strong> ${escapeHtml(entry.borrowingLibrary || "Unknown")}</span><span><strong>Sent:</strong> ${escapeHtml(entry.sentDate || "Not yet sent")}</span><span><strong>Due:</strong> ${escapeHtml(entry.dueDate || "Not set")}</span><span><strong>Item ref:</strong> ${escapeHtml(entry.itemRef || "Unlinked")}</span></div>`;
    return `<article class="stack-card"><div class="panel-header compact"><div><h4>${escapeHtml(entry.title || "Untitled")}</h4><p class="muted">${escapeHtml(entry.id)}${entry.author ? ` · ${escapeHtml(entry.author)}` : ""}</p></div><span class="badge badge-status ill-status-badge" data-status="${escapeHtml(entry.status.toLowerCase().replace(/\s+/g, "-"))}">${escapeHtml(entry.status)}</span></div>${meta}<p class="muted">${escapeHtml(entry.notes || "No notes recorded.")}</p><div class="row-actions"><label class="inline-select">Update status<select data-ill-status="${escapeHtml(entry.id)}">${selectOptions}</select></label></div></article>`;
  }).join("");
  [...target.querySelectorAll("[data-ill-status]")].forEach((select) => select.addEventListener("change", () => updateIllStatus(type, select.dataset.illStatus, select.value)));
}

function renderIllWorkspace() {
  const outgoing = getIllTransactions("outgoing").sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const incoming = getIllTransactions("incoming").sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const activeOutgoing = outgoing.filter((entry) => !ILL_COMPLETED_STATUSES.has(entry.status));
  const activeIncoming = incoming.filter((entry) => !ILL_COMPLETED_STATUSES.has(entry.status));
  const completed = [...outgoing, ...incoming].filter((entry) => ILL_COMPLETED_STATUSES.has(entry.status)).sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || 0));
  const overdue = [...outgoing, ...incoming].filter((entry) => entry.dueDate && !ILL_COMPLETED_STATUSES.has(entry.status) && new Date(entry.dueDate) < new Date(todayIso()));

  if (els.illOutgoingSummary) els.illOutgoingSummary.textContent = `${activeOutgoing.length} active`;
  if (els.illIncomingSummary) els.illIncomingSummary.textContent = `${activeIncoming.length} active`;
  renderIllCards(els.illOutgoingList, activeOutgoing, "outgoing");
  renderIllCards(els.illIncomingList, activeIncoming, "incoming");

  if (els.illStatusCards) {
    els.illStatusCards.innerHTML = [
      { label: "Active outgoing", value: activeOutgoing.length },
      { label: "Active incoming", value: activeIncoming.length },
      { label: "Completed", value: completed.length },
      { label: "Past due", value: overdue.length },
    ].map((card) => `<article class="summary-card"><span class="summary-card-label">${card.label}</span><strong class="summary-card-value">${card.value}</strong></article>`).join("");
  }

  if (els.illCompletedList) {
    if (!completed.length && !overdue.length) {
      els.illCompletedList.innerHTML = '<div class="empty-state">No completed or past due ILL activity yet.</div>';
    } else {
      const rows = [...overdue.map((entry) => ({ ...entry, flag: "Past due" })), ...completed.slice(0, 8).map((entry) => ({ ...entry, flag: "Completed" }))];
      els.illCompletedList.innerHTML = rows.map((entry) => `<article class="stack-card"><div class="panel-header compact"><div><h4>${escapeHtml(entry.title || "Untitled")}</h4><p class="muted">${escapeHtml(entry.id)} · ${escapeHtml(entry.flag)}</p></div><span class="badge badge-status">${escapeHtml(entry.status)}</span></div><p class="muted">${escapeHtml(entry.type === "incoming" ? `${entry.patronName} · ${entry.lendingLibrary}` : `${entry.borrowingLibrary}`)}</p></article>`).join("");
    }
  }

  renderIllReports();
  renderOperationalReports();
}

function renderIllReports() {
  const outgoing = getIllTransactions("outgoing");
  const incoming = getIllTransactions("incoming");
  const monthly = new Map();
  [...outgoing.map((entry) => ({ ...entry, kind: "outgoing" })), ...incoming.map((entry) => ({ ...entry, kind: "incoming" }))].forEach((entry) => {
    const month = getMonthKey(entry.requestDate || todayIso());
    const current = monthly.get(month) || { outgoing: 0, incoming: 0, completedOutgoing: 0, completedIncoming: 0 };
    current[entry.kind] += 1;
    if (entry.status === "Completed") current[entry.kind === "outgoing" ? "completedOutgoing" : "completedIncoming"] += 1;
    monthly.set(month, current);
  });
  const rows = [...monthly.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const currentMonth = monthly.get(getMonthKey(todayIso())) || { outgoing: 0, incoming: 0, completedOutgoing: 0, completedIncoming: 0 };
  if (els.illReportsSummary) {
    els.illReportsSummary.innerHTML = [
      { label: "Current month outgoing", value: currentMonth.outgoing },
      { label: "Current month incoming", value: currentMonth.incoming },
      { label: "Completed outgoing", value: currentMonth.completedOutgoing },
      { label: "Completed incoming", value: currentMonth.completedIncoming },
    ].map((card) => `<article class="summary-card"><span class="summary-card-label">${card.label}</span><strong class="summary-card-value">${card.value}</strong></article>`).join("");
  }
  if (els.illReportsTableWrap) {
    if (!rows.length) {
      els.illReportsTableWrap.innerHTML = '<div class="empty-state">No monthly ILL data available yet.</div>';
    } else {
      els.illReportsTableWrap.innerHTML = `<table class="serials-table"><thead><tr><th>Month</th><th>Outgoing</th><th>Incoming</th><th>Completed outgoing</th><th>Completed incoming</th><th>Combined total</th></tr></thead><tbody>${rows.map(([month, row]) => `<tr><td>${formatMonthLabel(month)}</td><td>${row.outgoing}</td><td>${row.incoming}</td><td>${row.completedOutgoing}</td><td>${row.completedIncoming}</td><td>${row.outgoing + row.incoming}</td></tr>`).join("")}</tbody></table>`;
    }
  }
}

function toggleDonationFields() {
  const donationSelected = els.registerCategory?.value === "Cash Donations";
  els.registerDonationPurposeLabel?.classList.toggle("hidden", !donationSelected);
  els.registerDonationOtherLabel?.classList.toggle("hidden", !donationSelected || els.registerDonationPurpose?.value !== "Other");
  if (els.registerDonationPurpose) els.registerDonationPurpose.required = donationSelected;
  if (els.registerDonationOther) els.registerDonationOther.required = donationSelected && els.registerDonationPurpose?.value === "Other";
}

function saveRegisterEntry(event) {
  event.preventDefault();
  const category = els.registerCategory?.value || REGISTER_CATEGORIES[0];
  const donationPurpose = category === "Cash Donations"
    ? (els.registerDonationPurpose?.value === "Other" ? els.registerDonationOther?.value : els.registerDonationPurpose?.value)
    : "";
  const entry = {
    id: `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: els.registerDate?.value || todayIso(),
    amount: Number.parseFloat(els.registerAmount?.value || "0") || 0,
    category,
    paymentType: String(els.registerPaymentType?.value || "").trim(),
    staffInitials: String(els.registerStaffInitials?.value || "").trim(),
    donationPurpose: String(donationPurpose || "").trim(),
    notes: String(els.registerNotes?.value || "").trim(),
    createdAt: Date.now(),
  };
  saveRegisterTransactions([entry, ...getRegisterTransactions()]);
  els.registerForm?.reset();
  populateStaticSelects();
  toggleDonationFields();
  if (els.registerReportDate && !els.registerReportDate.value) els.registerReportDate.value = entry.date;
  if (els.registerMessage) els.registerMessage.textContent = `Recorded register transaction ${entry.id}.`;
  renderRegisterWorkspace();
  renderStatsPanel();
  renderDashboard();
}

function summarizeRegisterDate(date = todayIso()) {
  const entries = getRegisterTransactions().filter((entry) => entry.date === date);
  const totalsByCategory = REGISTER_CATEGORIES.reduce((acc, category) => ({ ...acc, [category]: entries.filter((entry) => entry.category === category).reduce((sum, entry) => sum + Number(entry.amount || 0), 0) }), {});
  return { entries, total: entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0), totalsByCategory };
}

function summarizeRegisterByMonth() {
  return getRegisterTransactions().reduce((acc, entry) => {
    const month = getMonthKey(entry.date);
    if (!acc[month]) acc[month] = { total: 0, byCategory: Object.fromEntries(REGISTER_CATEGORIES.map((category) => [category, 0])) };
    acc[month].total += Number(entry.amount || 0);
    acc[month].byCategory[entry.category] = Number(acc[month].byCategory[entry.category] || 0) + Number(entry.amount || 0);
    return acc;
  }, {});
}

function renderRegisterWorkspace() {
  const date = els.registerReportDate?.value || todayIso();
  const summary = summarizeRegisterDate(date);
  if (els.registerSummaryCards) {
    const today = summarizeRegisterDate(todayIso());
    els.registerSummaryCards.innerHTML = [
      { label: "Today's total", value: formatCurrency(today.total) },
      { label: "Selected date", value: date },
      { label: "Transactions", value: summary.entries.length },
      { label: "Cash donations today", value: formatCurrency(today.totalsByCategory["Cash Donations"]) },
    ].map((card) => `<article class="summary-card"><span class="summary-card-label">${card.label}</span><strong class="summary-card-value">${card.value}</strong></article>`).join("");
  }
  if (els.registerDailyTableWrap) {
    const monthly = summarizeRegisterByMonth();
    const monthlyRows = Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0]));
    const dailyTable = summary.entries.length
      ? `<table class="serials-table"><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Donation purpose</th><th>Notes</th></tr></thead><tbody>${summary.entries.map((entry) => `<tr><td>${entry.date}</td><td>${escapeHtml(entry.category)}</td><td>${formatCurrency(entry.amount)}</td><td>${escapeHtml(entry.donationPurpose || "—")}</td><td>${escapeHtml(entry.notes || "—")}</td></tr>`).join("")}</tbody></table>`
      : '<div class="empty-state">No register transactions recorded for this date.</div>';
    const categoryList = Object.entries(summary.totalsByCategory).map(([category, total]) => `<li><span>${escapeHtml(category)}</span><strong>${formatCurrency(total)}</strong></li>`).join("");
    const monthlyTable = monthlyRows.length
      ? `<table class="serials-table"><thead><tr><th>Month</th>${REGISTER_CATEGORIES.map((category) => `<th>${escapeHtml(category)}</th>`).join("")}<th>Overall total</th></tr></thead><tbody>${monthlyRows.map(([month, row]) => `<tr><td>${formatMonthLabel(month)}</td>${REGISTER_CATEGORIES.map((category) => `<td>${formatCurrency(row.byCategory[category])}</td>`).join("")}<td>${formatCurrency(row.total)}</td></tr>`).join("")}</tbody></table>`
      : '<div class="empty-state">No monthly register data available yet.</div>';
    els.registerDailyTableWrap.innerHTML = `<div class="register-breakdown"><h4>Daily category totals</h4><ul class="totals-list">${categoryList}</ul></div><div class="register-table-stack"><h4>Transactions for ${date}</h4>${dailyTable}</div><div class="register-table-stack"><h4>Monthly totals</h4>${monthlyTable}</div>`;
  }
  renderOperationalReports();
}

function renderOperationalReports() {
  if (!els.operationalReports) return;
  const counterSections = ["visitor", "reference"].map((type) => {
    const dailyRows = Object.entries(getDailyCounterMap(type)).sort((a, b) => b[0].localeCompare(a[0]));
    const monthlyRows = Object.entries(summarizeCounterByMonth(type)).sort((a, b) => b[0].localeCompare(a[0]));
    return `<section class="report-card"><div class="panel-header compact"><div><h4>${type === "visitor" ? "Building Visits" : "Reference Questions"}</h4><p class="muted">Daily and monthly ${COUNTER_LABELS[type]}.</p></div></div><div class="summary-card-grid"><article class="summary-card"><span class="summary-card-label">Today</span><strong class="summary-card-value">${getDailyCounterTotal(type)}</strong></article><article class="summary-card"><span class="summary-card-label">Current month</span><strong class="summary-card-value">${Number(summarizeCounterByMonth(type)[getMonthKey(todayIso())] || 0)}</strong></article></div><div class="report-split-grid"><div>${dailyRows.length ? `<table class="serials-table"><thead><tr><th>Date</th><th>Count</th></tr></thead><tbody>${dailyRows.map(([date, count]) => `<tr><td>${date}</td><td>${count}</td></tr>`).join("")}</tbody></table>` : `<div class="empty-state">No ${type === "visitor" ? "building visits" : "reference questions"} recorded yet today.</div>`}</div><div>${monthlyRows.length ? `<table class="serials-table"><thead><tr><th>Month</th><th>Total</th></tr></thead><tbody>${monthlyRows.map(([month, total]) => `<tr><td>${formatMonthLabel(month)}</td><td>${total}</td></tr>`).join("")}</tbody></table>` : `<div class="empty-state">No monthly data available yet.</div>`}</div></div></section>`;
  }).join("");
  const illMonthly = els.illReportsTableWrap?.innerHTML || '<div class="empty-state">No monthly ILL data available yet.</div>';
  const registerMonthly = (() => {
    const monthlyRows = Object.entries(summarizeRegisterByMonth()).sort((a, b) => b[0].localeCompare(a[0]));
    return monthlyRows.length ? `<table class="serials-table"><thead><tr><th>Month</th>${REGISTER_CATEGORIES.map((category) => `<th>${escapeHtml(category)}</th>`).join("")}<th>Overall total</th></tr></thead><tbody>${monthlyRows.map(([month, row]) => `<tr><td>${formatMonthLabel(month)}</td>${REGISTER_CATEGORIES.map((category) => `<td>${formatCurrency(row.byCategory[category])}</td>`).join("")}<td>${formatCurrency(row.total)}</td></tr>`).join("")}</tbody></table>` : '<div class="empty-state">No monthly register data available yet.</div>';
  })();
  els.operationalReports.innerHTML = `${counterSections}<section class="report-card"><div class="panel-header compact"><div><h4>Interlibrary Loan</h4><p class="muted">Monthly outgoing and incoming ILL counts.</p></div></div>${illMonthly}</section><section class="report-card"><div class="panel-header compact"><div><h4>Daily Register</h4><p class="muted">Monthly totals by category and overall cash intake.</p></div></div>${registerMonthly}</section>`;
}

function switchCirculationTab(tab) {
  state.circulationTab = tab;
  els.circulationTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.circulationTab === tab));
  els.circulationPanels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.circulationPanel !== tab));
}

function parseMaterialNumbersInput(value) {
  return [...new Set(String(value || "").split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean))];
}

function sanitizeHolding(holding = {}) {
  return {
    id: holding.id || crypto.randomUUID(),
    status: String(holding.status || "Available").trim() || "Available",
    location: String(holding.location || "").trim(),
    callNumber: String(holding.callNumber || "").trim(),
    accessionNumber: String(holding.accessionNumber || "").trim(),
    materialNumbers: parseMaterialNumbersInput(holding.materialNumbers || []),
    dateAcquired: String(holding.dateAcquired || "").trim(),
    source: String(holding.source || "").trim(),
    pricePaid: String(holding.pricePaid || "").trim(),
    retailPrice: String(holding.retailPrice || "").trim(),
    checkedOutTo: String(holding.checkedOutTo || "").trim(),
    checkedOutToName: String(holding.checkedOutToName || "").trim(),
    checkedOutAt: String(holding.checkedOutAt || "").trim(),
    dueDate: String(holding.dueDate || "").trim(),
  };
}

function collectDraftHoldings() {
  const rows = [...document.querySelectorAll(".holding-row")];
  if (!rows.length) return [];
  return rows.map((row) => sanitizeHolding({
    id: row.dataset.holdingId,
    status: row.querySelector('[data-holding-field="status"]')?.value,
    location: row.querySelector('[data-holding-field="location"]')?.value,
    callNumber: row.querySelector('[data-holding-field="callNumber"]')?.value,
    accessionNumber: row.querySelector('[data-holding-field="accessionNumber"]')?.value,
    materialNumbers: row.querySelector('[data-holding-field="materialNumbers"]')?.value,
    dateAcquired: row.querySelector('[data-holding-field="dateAcquired"]')?.value,
    source: row.querySelector('[data-holding-field="source"]')?.value,
    pricePaid: row.querySelector('[data-holding-field="pricePaid"]')?.value,
    retailPrice: row.querySelector('[data-holding-field="retailPrice"]')?.value,
    checkedOutTo: row.dataset.checkedOutTo || "",
    checkedOutToName: row.dataset.checkedOutToName || "",
    checkedOutAt: row.dataset.checkedOutAt || "",
    dueDate: row.dataset.dueDate || "",
  }));
}

function renderHoldingsEditor(holdings = state.draftHoldings) {
  if (!els.holdingRows) return;
  state.draftHoldings = (holdings.length ? holdings : [sanitizeHolding()]).map((holding) => sanitizeHolding(holding));
  const locationOptions = ['<option value="">Unspecified</option>', ...getManagedLocations().map((location) => `<option value="${location}">${location}</option>`)].join("");
  els.holdingRows.innerHTML = "";
  state.draftHoldings.forEach((holding, index) => {
    const article = document.createElement("article");
    article.className = "holding-row";
    article.dataset.holdingId = holding.id;
    article.dataset.checkedOutTo = holding.checkedOutTo || "";
    article.dataset.checkedOutToName = holding.checkedOutToName || "";
    article.dataset.checkedOutAt = holding.checkedOutAt || "";
    article.dataset.dueDate = holding.dueDate || "";
    article.innerHTML = `
      <div class="holding-row-header">
        <strong>Holding ${index + 1}</strong>
        <button class="button button-secondary" type="button" data-act="remove-holding">Remove</button>
      </div>
      <div class="form-grid">
        <label>Status
          <select data-holding-field="status">
            <option ${holding.status === "Available" ? "selected" : ""}>Available</option>
            <option ${holding.status === "Checked In" ? "selected" : ""}>Checked In</option>
            <option ${holding.status === "On Loan" ? "selected" : ""}>On Loan</option>
            <option ${holding.status === "Pending Material" ? "selected" : ""}>Pending Material</option>
            <option ${holding.status === "On Order" ? "selected" : ""}>On Order</option>
            <option ${holding.status === "Reference Only" ? "selected" : ""}>Reference Only</option>
            <option ${holding.status === "Missing" ? "selected" : ""}>Missing</option>
          </select>
        </label>
        <label>Location <select data-holding-field="location">${locationOptions}</select></label>
        <label>Call Number <input data-holding-field="callNumber" value="${holding.callNumber || ""}" /></label>
        <label>Accession Number <input data-holding-field="accessionNumber" value="${holding.accessionNumber || ""}" /></label>
        <label>Material Number(s)<textarea data-holding-field="materialNumbers" rows="2" placeholder="One material number per line">${(holding.materialNumbers || []).join("\n")}</textarea></label>
        <label>Date Acquired <input data-holding-field="dateAcquired" type="date" value="${holding.dateAcquired || ""}" /></label>
        <label>Source <input data-holding-field="source" value="${holding.source || ""}" /></label>
        <label>Price Paid <input data-holding-field="pricePaid" type="number" min="0" step="0.01" value="${holding.pricePaid || ""}" /></label>
        <label>Retail Value <input data-holding-field="retailPrice" type="number" min="0" step="0.01" value="${holding.retailPrice || ""}" /></label>
      </div>
      <p class="muted holding-meta">${holding.checkedOutToName ? `Checked out to ${holding.checkedOutToName}${holding.dueDate ? ` · Due ${holding.dueDate}` : ""}` : "Not currently checked out."}</p>
    `;
    article.querySelector('[data-act="remove-holding"]').addEventListener("click", () => {
      if (state.draftHoldings.length <= 1) return;
      state.draftHoldings = collectDraftHoldings().filter((entry) => entry.id !== holding.id);
      renderHoldingsEditor(state.draftHoldings);
    });
    const locationSelect = article.querySelector('[data-holding-field="location"]');
    locationSelect.value = holding.location || "";
    [...article.querySelectorAll("input, textarea, select")].forEach((field) => {
      field.addEventListener("input", () => {
        state.draftHoldings = collectDraftHoldings();
      });
    });
    els.holdingRows.appendChild(article);
  });
}

function findPatronByCardNumber(cardNumber) {
  const normalized = String(cardNumber || "").trim().toLowerCase();
  if (!normalized) return null;
  return getPatrons().find((entry) => String(entry.cardNumber || "").trim().toLowerCase() === normalized) || null;
}

function setFormDirty(isDirty) {
  state.formDirty = Boolean(isDirty);
}

function setRecordSaveMessage(message = "", type = "") {
  if (!els.recordSaveMessage) return;
  els.recordSaveMessage.textContent = message;
  els.recordSaveMessage.className = "status-message";
  if (type) els.recordSaveMessage.classList.add(`is-${type}`);
}

function switchRecordTab(tab) {
  state.recordTab = tab;
  els.recordTabButtons.forEach((button) => {
    const active = button.dataset.recordTab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.recordTabPanels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.recordPanel !== tab));
}

function getHoldsReadyForPickupCount() {
  return getHolds().filter((entry) => String(entry.readyForPickup || "").toLowerCase() === "true" || String(entry.status || "").toLowerCase() === "ready for pickup").length;
}

function getOverdueLoans(minDays = 1) {
  const today = new Date().toISOString().slice(0, 10);
  return state.records.flatMap((record) => (record.holdings || []).flatMap((holding) => {
    if (String(holding.status) !== "On Loan" || !holding.dueDate || holding.dueDate >= today) return [];
    const overdueDays = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${holding.dueDate}T00:00:00Z`)) / 86400000);
    return overdueDays >= minDays ? [{ record, holding, overdueDays }] : [];
  }));
}

function getItemsCheckedOutTodayCount() {
  const today = new Date().toISOString().slice(0, 10);
  return state.records.reduce((count, record) => count + (record.holdings || []).filter((holding) => String(holding.checkedOutAt || "").slice(0, 10) === today).length, 0);
}

function getAllLoanEntries() {
  return state.records.flatMap((record) => (record.holdings || []).map((holding) => ({ record, holding })));
}

function getCurrentLoanEntries() {
  return getAllLoanEntries().filter(({ holding }) => String(holding.status) === "On Loan");
}

function getProblemItems() {
  return getAllLoanEntries().filter(({ holding }) => {
    const status = String(holding.status || "").toLowerCase();
    return ["missing", "lost", "damaged", "claims returned", "problem", "billing"].includes(status);
  });
}

function getMissingFieldRecords() {
  return state.records.filter((record) => !String(record.callNumber || "").trim() || !String(record.location || "").trim() || !String(record.description || "").trim());
}

function getPendingActivationMaterials() {
  return getAcquisitionMaterials().filter((entry) => entry.workflowStage === "pending");
}

function getOpenOrders() {
  return getAcquisitionWorkflowData().openOrders;
}

function getDonationBatches() {
  return Array.isArray(state.settings.donationBatches) ? state.settings.donationBatches : [];
}

function saveDonationBatches(batches) {
  state.settings.donationBatches = batches;
  saveSettings(state.settings);
}

function getPatronAlertsList() {
  return getPatrons().filter((patron) => String(patron.blocks || "").trim() || String(patron.alerts || "").trim() || String(patron.status || "").toLowerCase() === "blocked");
}

function getSerialsRenewalPreview() {
  const recentIssues = state.records
    .filter((record) => String(record.format || "").toLowerCase() === "magazine" && String(record.source || "").toLowerCase() === "serials")
    .sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0))
    .slice(0, 5)
    .map((record) => ({
      type: "issue",
      title: record.title.split(" — ")[0] || record.title || "Untitled magazine",
      frequency: "Recent issue",
      detail: String(record.notes || "").replace(/^Serial issue:\s*/, "") || "Issue added",
      date: record.dateAdded || "",
      timestamp: Number(record.addedAt || 0),
    }));
  const subscriptions = getSubscriptions()
    .filter((entry) => String(entry.status || "").toLowerCase() !== "cancelled")
    .sort((a, b) => {
      const aDate = Date.parse(`${a.renewalDate || '9999-12-31'}T00:00:00Z`);
      const bDate = Date.parse(`${b.renewalDate || '9999-12-31'}T00:00:00Z`);
      return aDate - bDate;
    })
    .slice(0, 5)
    .map((entry) => ({
      type: "renewal",
      title: entry.title || "Untitled subscription",
      frequency: entry.frequency || "Unknown frequency",
      detail: entry.renewalDate ? `Renews ${entry.renewalDate}` : "Renewal date not set",
      date: entry.renewalDate || "",
      timestamp: entry.renewalDate ? Date.parse(`${entry.renewalDate}T00:00:00Z`) : Number(entry.updatedAt || 0),
    }));
  return [...subscriptions, ...recentIssues].sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)).slice(0, 5);
}

function formatRelativeTime(value) {
  if (!value) return "No timestamp";
  const parsed = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(parsed)) return String(value);
  const diff = Date.now() - parsed;
  const future = diff < 0;
  const absoluteMinutes = Math.round(Math.abs(diff) / 60000);
  if (absoluteMinutes < 1) return "just now";
  if (absoluteMinutes < 60) return `${absoluteMinutes}m ${future ? 'from now' : 'ago'}`;
  const hours = Math.round(absoluteMinutes / 60);
  if (hours < 24) return `${hours}h ${future ? 'from now' : 'ago'}`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ${future ? 'from now' : 'ago'}`;
  return new Date(parsed).toLocaleString();
}

function getRecentActivityItems(limit = 10) {
  const activities = [];

  state.records.forEach((record) => {
    const title = record.title || "Untitled";
    if (record.updatedAt) activities.push({ type: "record", icon: "📚", text: `Record saved: ${title}`, timestamp: Number(record.updatedAt), target: "records" });
    if (String(record.format || "").toLowerCase() === "magazine" && String(record.source || "").toLowerCase() === "serials") {
      activities.push({ type: "serial", icon: "📰", text: `Magazine issue added: ${title}`, timestamp: Number(record.addedAt || 0), target: "serials" });
    }
    String(record.circulationHistory || "").split(/\n+/).filter(Boolean).forEach((line) => {
      const match = line.match(/^\[(.+?)\]\s*(.+)$/);
      if (!match) return;
      const [, stamp, action] = match;
      const normalizedStamp = String(stamp).replace(" ", "T") + ":00Z";
      let icon = "📘";
      let target = "circulation";
      if (/checked in/i.test(action)) icon = "↩️";
      else if (/checked out/i.test(action)) icon = "📤";
      else if (/hold|reserve/i.test(action)) icon = "📌";
      activities.push({ icon, text: `${title} — ${action}`, timestamp: Date.parse(normalizedStamp), target });
    });
  });

  getPatrons().forEach((patron) => {
    if (patron.updatedAt) activities.push({ type: "patron", icon: "👤", text: `Patron updated: ${patron.name || 'Unnamed patron'}`, timestamp: Number(patron.updatedAt), target: "patrons" });
    else if (patron.createdAt) activities.push({ type: "patron", icon: "👤", text: `Patron added: ${patron.name || 'Unnamed patron'}`, timestamp: Number(patron.createdAt), target: "patrons" });
  });

  getAcquisitionOrders().forEach((order) => {
    activities.push({ type: "order", icon: "🧾", text: `New open order created: ${order.name || 'Untitled order'}`, timestamp: Number(order.createdAt || 0), target: "acquisitions" });
  });

  getPendingMaterials().forEach((material) => {
    activities.push({ type: "pending", icon: material.activatedAt ? "✅" : "📦", text: material.activatedAt ? `Pending material activated: ${material.title}` : `Pending material added: ${material.title}`, timestamp: Number(material.activatedAt ? Date.parse(material.activatedAt) : material.createdAt || 0), target: "acquisitions" });
  });

  getDonationBatches().forEach((batch) => {
    activities.push({ type: "donation-batch", icon: "🎁", text: `Donation batch received: ${batch.name || batch.batchId || 'Untitled batch'}`, timestamp: Number(batch.createdAt || Date.parse(batch.dateReceived || '') || 0), target: "acquisitions" });
    (batch.items || []).forEach((item) => {
      if (item.sentToPendingAt) activities.push({ type: "donation-item", icon: "📥", text: `Donation sent to Pending Materials: ${item.title || 'Untitled item'}`, timestamp: Number(Date.parse(item.sentToPendingAt) || 0), target: "acquisitions" });
      if (item.activatedAt) activities.push({ type: "donation-item", icon: "✅", text: `Donation activated into catalog: ${item.title || 'Untitled item'}`, timestamp: Number(Date.parse(item.activatedAt) || 0), target: "acquisitions" });
    });
  });

  getSubscriptions().forEach((entry) => {
    activities.push({ type: "subscription", icon: "🗓️", text: `Subscription saved: ${entry.title || 'Untitled subscription'}`, timestamp: Number(entry.updatedAt || 0), target: "serials" });
  });

  return activities
    .filter((entry) => Number.isFinite(Number(entry.timestamp)) && Number(entry.timestamp) > 0)
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .slice(0, limit);
}

function openDashboardTarget(target = "dashboard", circulationTab = "", recordTab = "") {
  switchIlsTab(target);
  if (target === "circulation" && circulationTab) switchCirculationTab(circulationTab);
  if (target === "records" && recordTab) switchRecordTab(recordTab);
}

function renderDashboard() {
  if (!els.dashboardTileGrid) return;
  const currentLoans = getCurrentLoanEntries();
  const overdueLoans = getOverdueLoans(1);
  const holds = getHolds();
  const pendingMaterials = getPendingActivationMaterials();
  const openOrders = getOpenOrders();
  const donationWorkflow = getDonationWorkflowData();
  const problemItems = getProblemItems();
  const missingFieldRecords = getMissingFieldRecords();
  const serialPreview = getSerialsRenewalPreview();
  const patronAlerts = getPatronAlertsList();
  const recentActivity = getRecentActivityItems(10);
  const dashboardUpdatedLabel = `Updated ${formatRelativeTime(Date.now())}`;
  if (els.dashboardDate) els.dashboardDate.textContent = dashboardUpdatedLabel;

  const activeIllCount = getIllTransactions("outgoing").filter((entry) => !ILL_COMPLETED_STATUSES.has(entry.status)).length + getIllTransactions("incoming").filter((entry) => !ILL_COMPLETED_STATUSES.has(entry.status)).length;
  const todayRegisterTotal = summarizeRegisterDate(todayIso()).total;
  const weedingPreview = getFilteredWeedingRows().rows;
  const topAuthorMonth = (() => {
    const start = new Date();
    start.setDate(1);
    const originalStart = els.authorStartDate?.value;
    const originalEnd = els.authorEndDate?.value;
    if (els.authorStartDate) els.authorStartDate.value = toDateInputValue(start);
    if (els.authorEndDate) els.authorEndDate.value = todayIso();
    const rows = getBorrowedAuthorRows();
    if (els.authorStartDate) els.authorStartDate.value = originalStart || '';
    if (els.authorEndDate) els.authorEndDate.value = originalEnd || '';
    return rows[0] || null;
  })();
  const leastUsedSection = getSectionUsageRows().list[0] || null;
  const outstandingFinesTotal = getFeeEntries().map(normalizeFeeEntry).reduce((sum, entry) => sum + (!['Paid', 'Waived'].includes(entry.status) ? entry.remainingAmount : 0), 0);
  const stats = [
    { label: "Items Out", value: currentLoans.length, copy: "Currently on loan", target: "circulation" },
    { label: "Overdues", value: overdueLoans.length, copy: "Past due circulation items", target: "circulation" },
    { label: "Holds / Reserves", value: holds.length, copy: "Pending patron requests", target: "circulation", circulationTab: "holds" },
    { label: "Visitors Today", value: getDailyCounterTotal("visitor"), copy: "Building visits counted today", target: "stats" },
    { label: "Reference Today", value: getDailyCounterTotal("reference"), copy: "Reference questions counted today", target: "stats" },
    { label: "Active ILL", value: activeIllCount, copy: "Outgoing + incoming ILL in progress", target: "ill-outgoing" },
    { label: "Register Today", value: formatCurrency(todayRegisterTotal), copy: "Daily register intake", target: "register" },
    { label: "Weeding Flags", value: weedingPreview.length, copy: "Items inactive beyond current weeding threshold", target: "stats" },
    { label: "Top Author", value: topAuthorMonth ? topAuthorMonth.author : '—', copy: topAuthorMonth ? `${topAuthorMonth.totalCheckouts} checkouts this month` : 'No author circulation this month', target: "stats" },
    { label: "Least Used Section", value: leastUsedSection ? leastUsedSection.section : '—', copy: leastUsedSection ? `${leastUsedSection.averageCheckouts.toFixed(2)} avg circ/item` : 'No section usage data', target: "stats" },
    { label: "Outstanding Fines", value: formatCurrency(outstandingFinesTotal), copy: "Current unpaid patron account balances", target: "stats" },
    { label: "Pending Materials", value: pendingMaterials.length, copy: "Awaiting activation/cataloging", target: "acquisitions" },
    { label: "Open Orders", value: openOrders.length, copy: "Active vendor orders", target: "acquisitions" },
    { label: "Donations Awaiting Review", value: donationWorkflow.awaitingReviewCount, copy: "Donation items needing staff decision", target: "acquisitions" },
    { label: "Missing / Problem Items", value: problemItems.length, copy: "Needs review", target: "circulation" },
  ];

  const todaysWork = [
    { label: `${holds.length} holds/reserves waiting to be managed`, empty: "No holds or reserves waiting right now.", count: holds.length, target: "circulation", circulationTab: "holds", urgent: holds.length > 0 },
    { label: `${overdueLoans.length} overdue items need follow-up`, empty: "No overdue items right now.", count: overdueLoans.length, target: "circulation", urgent: overdueLoans.length > 0 },
    { label: `${pendingMaterials.length} pending materials need activation`, empty: "No pending materials awaiting action.", count: pendingMaterials.length, target: "acquisitions", urgent: pendingMaterials.length > 0 },
    { label: `${openOrders.length} open orders still in progress`, empty: "No open acquisition orders right now.", count: openOrders.length, target: "acquisitions" },
    { label: `${donationWorkflow.awaitingReviewCount} donation items await review`, empty: "No donation items are awaiting review.", count: donationWorkflow.awaitingReviewCount, target: "acquisitions", urgent: donationWorkflow.awaitingReviewCount > 0 },
    { label: `${donationWorkflow.awaitingProcessingCount} accepted donations await processing`, empty: "No accepted donation items are waiting for processing.", count: donationWorkflow.awaitingProcessingCount, target: "acquisitions" },
    { label: `${missingFieldRecords.length} missing-field records need cleanup`, empty: "No missing-field records need cleanup.", count: missingFieldRecords.length, target: "records" },
    { label: `${serialPreview.length} serial items need review`, empty: "No serial renewals or recent issues need attention.", count: serialPreview.length, target: "serials" },
  ];

  const quickActions = [
    { label: "Add Record", target: "records" },
    { label: "Check Out", target: "circulation", circulationTab: "checkout" },
    { label: "Check In", target: "circulation", circulationTab: "checkin" },
    { label: "Add Patron", target: "patrons" },
    { label: "Create Order", target: "acquisitions" },
    { label: "New Donation Batch", target: "acquisitions" },
  ];

  const actionPanel = [
    { label: "Add New Record", target: "records" },
    { label: "Add New Patron", target: "patrons" },
    { label: "Start Checkout", target: "circulation", circulationTab: "checkout" },
    { label: "Start Check-In", target: "circulation", circulationTab: "checkin" },
    { label: "Place Hold / Reserve", target: "circulation", circulationTab: "holds" },
    { label: "Create Acquisition Order", target: "acquisitions" },
    { label: "Start Donation Intake", target: "acquisitions" },
    { label: "Add Magazine Issue", target: "serials" },
    { label: "Run Reports", target: "stats" },
    { label: "New ILL Request", target: "ill-incoming" },
    { label: "Record Payment", target: "register" },
  ];

  const overduePreview = overdueLoans.slice().sort((a, b) => b.overdueDays - a.overdueDays).slice(0, 5);
  const pendingPreview = pendingMaterials.slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, 5);
  const patronPreview = patronAlerts.slice(0, 5);

  const renderList = (items, renderItem, emptyText) => items.length
    ? `<ul class="dashboard-list">${items.map(renderItem).join("")}</ul>`
    : `<div class="empty-state dashboard-empty">${emptyText}</div>`;

  els.dashboardTileGrid.innerHTML = `
    <section class="dashboard-home">
      <header class="dashboard-hero card-like">
        <div>
          <p class="eyebrow">Staff home</p>
          <h3>Dashboard</h3>
          <p class="dashboard-subheading">Overview of circulation, cataloging, acquisitions, and patron activity.</p>
          <p class="muted dashboard-welcome">Here’s what needs attention today.</p>
        </div>
        <div class="dashboard-hero-actions">
          <div class="dashboard-updated">${dashboardUpdatedLabel}</div>
          <div class="dashboard-action-row">
            ${quickActions.map((action) => `<button class="button button-secondary dashboard-chip" type="button" data-dashboard-target="${action.target}" ${action.circulationTab ? `data-dashboard-circulation="${action.circulationTab}"` : ""}>${action.label}</button>`).join("")}
          </div>
        </div>
      </header>

      <section class="dashboard-stats-grid" aria-label="Primary dashboard stats">
        ${stats.map((card) => `<button class="dashboard-stat-card ${card.label.includes('Overdues') || card.label.includes('Missing') ? 'is-urgent' : ''}" type="button" data-dashboard-target="${card.target}" ${card.circulationTab ? `data-dashboard-circulation="${card.circulationTab}"` : ""}><span class="dashboard-stat-label">${card.label}</span><strong class="dashboard-stat-value">${card.value}</strong><span class="dashboard-stat-copy">${card.copy}</span><span class="dashboard-stat-link">Open module →</span></button>`).join("")}
      </section>

      <section class="dashboard-work-row">
        <article class="dashboard-panel card-like dashboard-tasks-panel">
          <div class="dashboard-panel-header"><div><h4>Today’s Work</h4><p class="muted">Short task list built from live circulation, cataloging, acquisitions, and serials data.</p></div></div>
          <div class="dashboard-task-list">
            ${todaysWork.map((item) => item.count ? `<button class="dashboard-task-row ${item.urgent ? 'is-urgent' : ''}" type="button" data-dashboard-target="${item.target}" ${item.circulationTab ? `data-dashboard-circulation="${item.circulationTab}"` : ""}><span>${item.label}</span><span class="dashboard-task-arrow">Open →</span></button>` : `<div class="dashboard-task-row is-empty"><span>${item.empty}</span></div>`).join("")}
          </div>
        </article>
        <aside class="dashboard-panel card-like dashboard-actions-panel">
          <div class="dashboard-panel-header"><div><h4>Quick Actions</h4><p class="muted">Open the right workspace without wading into the full dashboard.</p></div></div>
          <div class="dashboard-action-grid">
            ${actionPanel.map((action) => `<button class="button dashboard-action-button" type="button" data-dashboard-target="${action.target}" ${action.circulationTab ? `data-dashboard-circulation="${action.circulationTab}"` : ""}>${action.label}</button>`).join("")}
          </div>
        </aside>
      </section>

      <section class="dashboard-panel card-like dashboard-activity-panel">
        <div class="dashboard-panel-header"><div><h4>Recent Activity</h4><p class="muted">Most recent staff actions across circulation, cataloging, acquisitions, patrons, and serials.</p></div><button class="button button-secondary dashboard-inline-action" type="button" data-dashboard-target="stats">View more</button></div>
        ${renderList(recentActivity, (entry) => `<li><button class="dashboard-activity-row" type="button" data-dashboard-target="${entry.target}" ${entry.target === 'circulation' ? 'data-dashboard-circulation="checkout"' : ''}><span class="dashboard-activity-icon">${entry.icon}</span><span class="dashboard-activity-copy"><strong>${entry.text}</strong><span class="muted">${formatRelativeTime(entry.timestamp)}</span></span></button></li>`, "No recent staff activity yet.")}
      </section>

      <section class="dashboard-preview-grid">
        <article class="dashboard-panel card-like">
          <div class="dashboard-panel-header"><div><h4>Overdue Preview</h4><p class="muted">Most overdue items needing follow-up.</p></div><button class="button button-secondary dashboard-inline-action" type="button" data-dashboard-target="circulation">Open Circulation</button></div>
          ${renderList(overduePreview, ({ record, holding, overdueDays }) => `<li><button class="dashboard-preview-row" type="button" data-dashboard-target="circulation"><strong>${record.title || 'Untitled'}</strong><span>${holding.checkedOutToName || 'Unknown patron'} · Due ${holding.dueDate || 'No due date'} · ${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue</span></button></li>`, "No items are currently overdue.")}
        </article>

        <article class="dashboard-panel card-like">
          <div class="dashboard-panel-header"><div><h4>Pending Cataloging / Materials</h4><p class="muted">Recently staged materials awaiting action.</p></div><button class="button button-secondary dashboard-inline-action" type="button" data-dashboard-target="acquisitions">Open Acquisitions</button></div>
          ${renderList(pendingPreview, (material) => `<li><button class="dashboard-preview-row" type="button" data-dashboard-target="acquisitions"><strong>${material.title}</strong><span>${material.orderName || 'No order'} · ${material.materialNumber || 'No material #'} · ${material.status || 'Pending Material'}</span></button></li>`, "No pending materials awaiting activation.")}
        </article>

        <article class="dashboard-panel card-like">
          <div class="dashboard-panel-header"><div><h4>Patron Alerts</h4><p class="muted">Patrons with alerts, blocks, or account issues.</p></div><button class="button button-secondary dashboard-inline-action" type="button" data-dashboard-target="patrons">Open Patrons</button></div>
          ${renderList(patronPreview, (patron) => `<li><button class="dashboard-preview-row" type="button" data-dashboard-target="patrons"><strong>${patron.name || 'Unnamed patron'}</strong><span>${patron.cardNumber || 'No card'} · ${patron.status || 'Active'}${patron.blocks ? ` · ${patron.blocks}` : patron.alerts ? ` · ${patron.alerts}` : ''}</span></button></li>`, "No patron alerts or account issues right now.")}
        </article>

        <article class="dashboard-panel card-like">
          <div class="dashboard-panel-header"><div><h4>Serials / Renewals</h4><p class="muted">Upcoming renewals and recently added issues.</p></div><button class="button button-secondary dashboard-inline-action" type="button" data-dashboard-target="serials">Open Serials</button></div>
          ${renderList(serialPreview, (entry) => `<li><button class="dashboard-preview-row" type="button" data-dashboard-target="serials"><strong>${entry.title}</strong><span>${entry.frequency} · ${entry.detail}</span></button></li>`, "No serial renewals or recent issues to show.")}
        </article>
      </section>
    </section>
  `;

  [...els.dashboardTileGrid.querySelectorAll('[data-dashboard-target]')].forEach((button) => button.addEventListener('click', () => openDashboardTarget(button.dataset.dashboardTarget, button.dataset.dashboardCirculation || '')));
}

function updateCheckoutStatus(before = "Awaiting item scan.", after = "Item will display updated status here.") {
  if (els.checkoutStatusBefore) els.checkoutStatusBefore.textContent = before;
  if (els.checkoutStatusAfter) els.checkoutStatusAfter.textContent = after;
}

function renderCheckoutReceipt(summary = null) {
  if (!els.checkoutReceipt || !els.checkoutReceiptEmpty) return;
  if (!summary) {
    els.checkoutReceipt.classList.add("hidden");
    els.checkoutReceiptEmpty.classList.remove("hidden");
    els.checkoutReceipt.innerHTML = "";
    return;
  }
  els.checkoutReceiptEmpty.classList.add("hidden");
  els.checkoutReceipt.classList.remove("hidden");
  els.checkoutReceipt.innerHTML = `<div class="receipt-card"><strong>${summary.patron}</strong><p class="muted">${summary.message}</p><ul class="receipt-list">${summary.items.map((item) => `<li><span>${item.title}</span><span>${item.dueDate}</span></li>`).join("")}</ul></div>`;
}

const DEFAULT_MATERIAL_TYPES = ["Fiction", "Young Adult", "Biography"];
const DEFAULT_CIRCULATION_RULES = [
  { materialType: "Fiction", loanDays: 21 },
  { materialType: "Young Adult", loanDays: 21 },
  { materialType: "Biography", loanDays: 21 },
];

function addDaysToDate(baseDate, days) {
  const result = new Date(baseDate);
  result.setUTCDate(result.getUTCDate() + Number(days || 0));
  return result.toISOString().slice(0, 10);
}

function getCirculationRules() {
  const rules = [...DEFAULT_CIRCULATION_RULES, ...(Array.isArray(state.settings.circulationRules) ? state.settings.circulationRules : [])];
  const deduped = new Map();
  rules.forEach((rule) => {
    const materialType = String(rule.materialType || "").trim();
    const loanDays = Number(rule.loanDays || 0);
    if (materialType && Number.isFinite(loanDays) && loanDays > 0) deduped.set(materialType, { materialType, loanDays });
  });
  return [...deduped.values()]
    .map((rule) => ({ materialType: String(rule.materialType || "").trim(), loanDays: Number(rule.loanDays || 0) }))
    .filter((rule) => rule.materialType && Number.isFinite(rule.loanDays) && rule.loanDays > 0);
}

function saveCirculationRules(rules) {
  state.settings.circulationRules = rules
    .map((rule) => ({ materialType: String(rule.materialType || "").trim(), loanDays: Number(rule.loanDays || 0) }))
    .filter((rule) => rule.materialType && Number.isFinite(rule.loanDays) && rule.loanDays > 0)
    .sort((a, b) => a.materialType.localeCompare(b.materialType));
  saveSettings(state.settings);
}

function getRuleForMaterialType(materialType) {
  return getCirculationRules().find((rule) => rule.materialType === materialType) || null;
}

function getAutoDueDate(record) {
  const rule = getRuleForMaterialType(record.materialType);
  if (!rule) return "";
  return addDaysToDate(new Date(), rule.loanDays);
}

function refreshQueuedDueDate() {
  if (!els.checkOutDueDate) return;
  const suggestions = state.queuedCheckoutItems.map((entry) => entry.autoDueDate).filter(Boolean).sort();
  if (!els.checkOutDueDate.value) els.checkOutDueDate.value = suggestions[0] || "";
}


function getRecordByMaterialNumber(materialNumber) {
  const normalized = String(materialNumber || "").trim();
  if (!normalized) return null;
  for (const record of state.records) {
    const holdingIndex = (record.holdings || []).findIndex((holding) => (holding.materialNumbers || []).includes(normalized));
    if (holdingIndex >= 0) {
      return { record, holding: record.holdings[holdingIndex], holdingIndex };
    }
  }
  return null;
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
    const dueText = entry.autoDueDate ? ` · Auto due ${entry.autoDueDate}` : "";
    const typeText = entry.materialType ? ` (${entry.materialType})` : "";
    li.classList.add("checkout-queue-item");
    li.innerHTML = `<div class="checkout-queue-main"><img class="checkout-thumb" src="${entry.coverUrl || ""}" alt="" /><span>${entry.materialNumber}: ${entry.title}${typeText}${dueText}</span></div> <button class="button button-secondary" type="button">Remove</button>`;
    const img = li.querySelector("img");
    if (!entry.coverUrl) img.classList.add("hidden");
    li.querySelector("button").addEventListener("click", () => {
      state.queuedCheckoutItems = state.queuedCheckoutItems.filter((item) => item.materialNumber !== entry.materialNumber);
      refreshQueuedDueDate();
      renderCheckoutQueue();
    });
    els.checkOutQueue.appendChild(li);
  });
}

function renderCheckoutPatronPreview(cardNumber = els.checkOutCardNumber?.value || "") {
  if (!els.checkOutPatronPreview) return;
  const patron = findPatronByCardNumber(cardNumber);
  els.checkOutPatronPreview.textContent = cardNumber.trim()
    ? (patron ? `Patron: ${patron.name} · Card #${patron.cardNumber}` : "No patron found for that card number.")
    : "Scan a card to show patron details.";
  els.checkOutPatronPreview.classList.toggle("warning", Boolean(cardNumber.trim()) && !patron);
}

function getPatronLoanEntries(patronId) {
  return state.records.flatMap((record) => (record.holdings || [])
    .filter((holding) => holding.checkedOutTo === patronId && String(holding.status) === "On Loan")
    .map((holding) => ({ record, holding })));
}

function getPatronHolds(patronId) {
  return getHolds().filter((hold) => hold.patronId === patronId);
}

function getPatronAccountSummary(patron) {
  const loans = getPatronLoanEntries(patron.id);
  const holds = getPatronHolds(patron.id);
  const overdue = loans.filter(({ holding }) => holding.dueDate && holding.dueDate < new Date().toISOString().slice(0, 10));
  const history = state.records.flatMap((record) => String(record.circulationHistory || "")
    .split("\n")
    .filter(Boolean)
    .filter((line) => line.includes(patron.name || "") || line.includes(patron.cardNumber || ""))
    .map((line) => ({ title: record.title || "Untitled", line })));
  return { loans, holds, overdue, history: history.slice(-5).reverse() };
}

function selectPatron(patronId = "") {
  state.selectedPatronId = patronId;
  renderPatronsTable();
  renderPatronDetail();
}

function renderPatronsTable() {
  if (!els.patronsBody) return;

  const patrons = getPatrons().slice().sort((a, b) => a.name.localeCompare(b.name));
  els.patronsBody.innerHTML = "";
  if (els.patronListSummary) els.patronListSummary.textContent = `${patrons.length} patron account${patrons.length === 1 ? "" : "s"}`;

  if (!patrons.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="7">No patrons added yet. Add a patron to open a full account view.</td>';
    els.patronsBody.appendChild(tr);
    state.selectedPatronId = "";
    return;
  }

  if (!patrons.some((patron) => patron.id === state.selectedPatronId)) state.selectedPatronId = patrons[0].id;

  patrons.forEach((patron) => {
    const summary = getPatronAccountSummary(patron);
    const tr = document.createElement("tr");
    tr.classList.toggle("is-selected-row", patron.id === state.selectedPatronId);
    tr.innerHTML = `<td><button class="text-button" type="button" data-act="select">${patron.name}</button></td><td>${patron.cardNumber || ""}</td><td>${patron.status || "Active"}</td><td>${summary.loans.length}</td><td>${summary.holds.length}</td><td>${formatCurrency(summary.unpaidAmount)}</td><td><button class="button button-secondary" type="button" data-act="edit">Edit</button> <button class="button button-secondary" type="button" data-act="delete">Delete</button></td>`;

    tr.querySelector('[data-act="select"]').addEventListener("click", () => selectPatron(patron.id));
    tr.querySelector('[data-act="edit"]').addEventListener("click", () => editPatron(patron.id));
    tr.querySelector('[data-act="delete"]').addEventListener("click", () => removePatron(patron.id));
    els.patronsBody.appendChild(tr);
  });
}

function renderPatronDetail() {
  if (!els.patronDetailPanel || !els.patronDetailBadge) return;
  const patron = getPatrons().find((entry) => entry.id === state.selectedPatronId);
  if (!patron) {
    els.patronDetailBadge.textContent = "No patron selected";
    els.patronDetailPanel.className = "patron-detail-panel empty-state";
    els.patronDetailPanel.textContent = "Select a patron from the list to view account details.";
    return;
  }

  const summary = getPatronAccountSummary(patron);
  const blocks = String(patron.blocks || "").split(/\s*,\s*/).filter(Boolean);
  const alerts = String(patron.alerts || "").split(/\s*,\s*/).filter(Boolean);
  const status = patron.status || "Active";

  els.patronDetailBadge.textContent = status;
  els.patronDetailPanel.className = "patron-detail-panel";
  els.patronDetailPanel.innerHTML = `
    <div class="patron-account-header">
      <div>
        <h4>${patron.name || "Unnamed patron"}</h4>
        <p class="muted">Card #${patron.cardNumber || "Not assigned"}</p>
      </div>
      <div class="patron-account-metrics">
        <div><strong>${summary.loans.length}</strong><span>Items out</span></div>
        <div><strong>${summary.holds.length}</strong><span>Holds</span></div>
        <div><strong>${summary.overdue.length}</strong><span>Overdue</span></div>
        <div><strong>${formatCurrency(summary.unpaidAmount)}</strong><span>Outstanding balance</span></div>
      </div>
    </div>
    <div class="patron-detail-grid">
      <div class="detail-card"><span class="detail-label">Email</span><strong>${patron.email || "No email"}</strong></div>
      <div class="detail-card"><span class="detail-label">Phone</span><strong>${patron.phone || "No phone number"}</strong></div>
      <div class="detail-card"><span class="detail-label">Expiration</span><strong>${patron.expirationDate || "No expiration date"}</strong></div>
      <div class="detail-card"><span class="detail-label">Account status</span><strong>${status}</strong></div>
    </div>
    <div class="patron-detail-columns">
      <section class="detail-section card-like"><h5>Notes</h5><p>${patron.notes || "No notes."}</p></section>
      <section class="detail-section card-like"><h5>Blocks & alerts</h5><p><strong>Blocks:</strong> ${blocks.length ? blocks.join(", ") : "No blocks."}</p><p><strong>Alerts:</strong> ${alerts.length ? alerts.join(", ") : "No alerts."}</p></section>
    </div>
    <section class="detail-section card-like"><h5>Fines and fees</h5>${summary.entries.length ? `<ul class="fee-entry-list">${summary.entries.sort((a, b) => String(b.dateAssessed).localeCompare(String(a.dateAssessed))).map((entry) => `<li><div class="fee-entry-meta"><strong>${escapeHtml(entry.category)}</strong><span>${formatCurrency(entry.amount)} · ${escapeHtml(entry.status)}</span></div><span>${escapeHtml(entry.dateAssessed)} · ${escapeHtml(entry.description || 'No description')}</span><p class="fee-entry-payments">Remaining: ${formatCurrency(entry.remainingAmount)}${entry.paymentHistory.length ? ` · Payments: ${entry.paymentHistory.map((payment) => `${payment.date} ${formatCurrency(payment.amount)}`).join(', ')}` : ''}</p>${['Paid', 'Waived'].includes(entry.status) ? '' : `<div class="patron-fee-actions"><button class="button button-secondary" type="button" data-fee-status="${entry.id}" data-next-status="Paid">Mark Paid</button><button class="button button-secondary" type="button" data-fee-status="${entry.id}" data-next-status="Waived">Waive</button></div>`}</li>`).join("")}</ul>` : "<p>No fines or fees have been assessed.</p>"}</section>
    <section class="detail-section card-like"><h5>Items currently out</h5>${summary.loans.length ? `<ul class="patron-activity-list">${summary.loans.map(({ record, holding }) => `<li><strong>${record.title || "Untitled"}</strong><span>${holding.materialNumbers?.[0] || "No barcode"} · Due ${holding.dueDate || "No due date"}</span></li>`).join("")}</ul>` : "<p>No items currently checked out.</p>"}</section>
    <section class="detail-section card-like"><h5>Recent activity</h5>${summary.history.length ? `<ul class="patron-activity-list">${summary.history.map((entry) => `<li><strong>${entry.title}</strong><span>${entry.line}</span></li>`).join("")}</ul>` : "<p>No recent activity.</p>"}</section>
  `;
  [...els.patronDetailPanel.querySelectorAll('[data-fee-status]')].forEach((button) => button.addEventListener('click', () => updateFeeStatus(button.dataset.feeStatus, button.dataset.nextStatus)));
}

function renderLoansTable() {
  if (!els.loansBody) return;
  const loans = state.records
    .flatMap((record) => (record.holdings || []).filter((holding) => String(holding.status) === "On Loan").map((holding) => ({ record, holding })))
    .sort((a, b) => String(a.holding.dueDate || "").localeCompare(String(b.holding.dueDate || "")));

  els.loansBody.innerHTML = "";
  if (!loans.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="4">No items are currently checked out.</td>';
    els.loansBody.appendChild(tr);
    return;
  }

  loans.forEach(({ record, holding }) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${record.title}</td><td>${holding.checkedOutToName || "Unknown patron"}</td><td>${holding.dueDate || ""}</td><td><button class="button button-secondary" type="button">Check In</button></td>`;
    tr.querySelector("button").addEventListener("click", () => checkInRecord(record.id, holding.id));
    els.loansBody.appendChild(tr);
  });
}

function setCirculationMessage(message, type = "info") {
  if (!els.circulationMessage) return;
  const normalizedType = type === true ? "error" : (type === false ? "info" : type);
  els.circulationMessage.textContent = message;
  els.circulationMessage.className = "status-message circulation-message-panel";
  if (normalizedType && normalizedType !== "info") els.circulationMessage.classList.add(`is-${normalizedType}`);
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
  if (els.patronStatus) els.patronStatus.value = "Active";
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
  const status = els.patronStatus?.value || "Active";
  const expirationDate = els.patronExpirationDate?.value || "";
  const notes = String(els.patronNotes?.value || "").trim();
  const blocks = String(els.patronBlocks?.value || "").trim();
  const alerts = String(els.patronAlerts?.value || "").trim();
  if (!name || !cardNumber) return;

  const patrons = getPatrons();
  const editingId = els.patronId?.value || "";
  const duplicate = patrons.some((patron) => patron.id !== editingId && patron.cardNumber?.toLowerCase() === cardNumber.toLowerCase());
  if (duplicate) {
    setCirculationMessage("That card number is already assigned to another patron.", true);
    return;
  }

  if (editingId) {
    savePatrons(patrons.map((patron) => (patron.id === editingId ? {
      ...patron, name, middleName, cardNumber, email, address, phone, birthDay, status, expirationDate, notes, blocks, alerts, updatedAt: Date.now(),
    } : patron)));
    setCirculationMessage(`Updated patron ${name}.`);
  } else {
    patrons.push({
      id: crypto.randomUUID(), name, middleName, cardNumber, email, address, phone, birthDay, status, expirationDate, notes, blocks, alerts, createdAt: Date.now(), updatedAt: Date.now(),
    });
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
  if (els.patronStatus) els.patronStatus.value = patron.status || "Active";
  if (els.patronExpirationDate) els.patronExpirationDate.value = patron.expirationDate || "";
  if (els.patronNotes) els.patronNotes.value = patron.notes || "";
  if (els.patronBlocks) els.patronBlocks.value = patron.blocks || "";
  if (els.patronAlerts) els.patronAlerts.value = patron.alerts || "";
  if (els.patronId) els.patronId.value = patron.id;
  state.editingPatronId = patron.id;
  if (els.patronSubmitBtn) els.patronSubmitBtn.textContent = "Update Patron";
  selectPatron(patron.id);
}

function removePatron(patronId) {
  const hasLoans = state.records.some((record) => (record.holdings || []).some((holding) => holding.checkedOutTo === patronId && String(holding.status) === "On Loan"));
  const hasOutstandingFees = calculatePatronBalance(patronId).unpaidAmount > 0;
  if (hasLoans) {
    setCirculationMessage("Cannot delete patron with checked out items.", true);
    return;
  }
  if (hasOutstandingFees) {
    setCirculationMessage("Cannot delete patron with outstanding fines or fees.", true);
    return;
  }

  if (!window.confirm("Delete this patron account?")) return;
  savePatrons(getPatrons().filter((patron) => patron.id !== patronId));
  if (state.selectedPatronId === patronId) state.selectedPatronId = "";
  render();
}

function queueCheckoutItem() {
  const materialNumber = els.checkOutMaterialNumber.value.trim();
  if (!materialNumber) return;
  const match = getRecordByMaterialNumber(materialNumber);
  if (!match) {
    setCirculationMessage(`Invalid barcode: ${materialNumber} was not found.`, "error");
    return;
  }
  const { record, holding } = match;
  updateCheckoutStatus(`Status: ${holding.status || "Available"} · ${record.title}`, `Ready to change to On Loan for ${record.title}.`);
  if (String(holding.status) === "On Loan") {
    setCirculationMessage(`Item already checked out: ${materialNumber}.`, "error");
    return;
  }
  if (state.queuedCheckoutItems.some((entry) => entry.materialNumber === materialNumber)) {
    setCirculationMessage(`Item ${materialNumber} is already queued.`, "error");
    return;
  }
  state.queuedCheckoutItems.push({ recordId: record.id, holdingId: holding.id, materialNumber, title: record.title, materialType: record.materialType || "", autoDueDate: getAutoDueDate(record), coverUrl: record.coverUrl || "" });
  els.checkOutMaterialNumber.value = "";
  refreshQueuedDueDate();
  const queuedRule = getRuleForMaterialType(record.materialType);
  setCirculationMessage(queuedRule ? `Queued ${record.title}. ${record.materialType} items default to ${queuedRule.loanDays} day loans.` : `Queued ${record.title}. No circulation rule is set for ${record.materialType || "this material type"}.`, "info");
  renderCheckoutQueue();
}

function checkOutRecord(event) {
  event.preventDefault();
  const cardNumber = els.checkOutCardNumber.value.trim();
  const dueDate = els.checkOutDueDate.value;

  if (!cardNumber || !state.queuedCheckoutItems.length) {
    setCirculationMessage("Scan a patron card and add at least one item.", "error");
    return;
  }

  const patron = findPatronByCardNumber(cardNumber);
  if (!patron) {
    setCirculationMessage("No patron found with that card number.", "error");
    return;
  }

  const skipped = state.queuedCheckoutItems.filter((entry) => !(dueDate || entry.autoDueDate));
  if (skipped.length) {
    setCirculationMessage(`Set a due date or add circulation rules for: ${skipped.map((entry) => entry.title).join(", ")}.`, "error");
    return;
  }

  const receiptItems = [];
  state.records = state.records.map((record) => {
    const queuedForRecord = state.queuedCheckoutItems.filter((entry) => entry.recordId === record.id);
    if (!queuedForRecord.length) return record;
    const nextHoldings = (record.holdings || []).map((holding) => {
      const queued = queuedForRecord.find((entry) => entry.holdingId === holding.id);
      if (!queued) return holding;
      const assignedDueDate = dueDate || queued.autoDueDate;
      receiptItems.push({ title: record.title || queued.materialNumber, dueDate: `Due ${assignedDueDate}` });
      return { ...holding, status: "On Loan", checkedOutTo: patron.id, checkedOutToName: patron.name, checkedOutAt: new Date().toISOString(), dueDate: assignedDueDate };
    });
    return normalizeRecord({
      ...record,
      holdings: nextHoldings,
      circulationHistory: appendCirculationHistory(record, `Checked out to ${patron.name} (Card: ${patron.cardNumber || "N/A"}) due ${dueDate || queuedForRecord[0].autoDueDate}`),
    });
  });

  saveRecords(state.records);
  state.queuedCheckoutItems = [];
  els.checkOutForm.reset();
  const finalDueDate = dueDate || receiptItems[0]?.dueDate.replace("Due ", "") || "";
  updateCheckoutStatus(`Status before: Available/Checked In`, `Status after: On Loan to ${patron.name}`);
  renderCheckoutReceipt({ patron: patron.name, message: `Checked out on ${new Date().toLocaleString()}`, items: receiptItems });
  setCirculationMessage(`Checked out to ${patron.name} – Due ${finalDueDate}`, "success");
  els.circulationMessage.classList.add("is-prominent");
  render();
}

function checkInRecord(recordId, holdingId = "") {
  const idx = state.records.findIndex((entry) => entry.id === recordId);
  if (idx < 0) return;
  const record = state.records[idx];
  const nextHoldings = (record.holdings || []).map((holding) => (
    !holdingId || holding.id === holdingId
      ? { ...holding, status: "Available", checkedOutTo: "", checkedOutToName: "", checkedOutAt: "", dueDate: "" }
      : holding
  ));
  state.records[idx] = normalizeRecord({
    ...record,
    holdings: nextHoldings,
    circulationHistory: appendCirculationHistory(record, "Checked in"),
  });

  saveRecords(state.records);
  setCirculationMessage(`Checked in "${state.records[idx].title}".`);
  render();
}

function checkInByMaterialNumber(event) {
  event.preventDefault();
  const materialNumber = els.checkInMaterialNumber.value.trim();
  if (!materialNumber) return;
  const match = getRecordByMaterialNumber(materialNumber);
  if (!match) {
    setCirculationMessage(`Invalid barcode: ${materialNumber} was not found.`, "error");
    return;
  }
  checkInRecord(match.record.id, match.holding.id);
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
  const patron = findPatronByCardNumber(cardNumber);
  if (!patron) return setCirculationMessage("No patron found with that card number.", true);
  const match = getRecordByMaterialNumber(materialNumber);
  if (!match) return setCirculationMessage(`Invalid barcode: ${materialNumber} was not found.`, "error");
  const { record } = match;

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

function normalizeAcquisitionMaterial(material = {}) {
  const quantityOrdered = Math.max(1, Number(material.quantityOrdered || 1) || 1);
  const receivedQuantity = Math.max(0, Number(material.receivedQuantity || 0) || 0);
  const workflowStage = ["orders", "receiving", "pending", "completed"].includes(material.workflowStage) ? material.workflowStage : "orders";
  const sourceType = material.sourceType === "donation" ? "donation" : "order";
  const sourceName = sourceType === "donation"
    ? (material.sourceName || material.donationBatchName || "Donation")
    : (material.sourceName || material.orderName || "Untitled order");
  const status = material.status || (workflowStage === "pending" ? "Pending Materials" : workflowStage === "completed" ? "Activated" : "Awaiting Receipt");
  return {
    id: material.id || crypto.randomUUID(),
    orderId: material.orderId || "",
    orderName: material.orderName || "",
    sourceType,
    sourceName,
    sourceLabel: material.sourceLabel || (sourceType === "donation" ? "Donation" : "Order"),
    donationBatchId: material.donationBatchId || "",
    donationBatchName: material.donationBatchName || "",
    donationItemId: material.donationItemId || "",
    donorName: material.donorName || "",
    title: material.title || "Untitled material",
    creator: material.creator || "",
    format: material.format || "Book",
    condition: material.condition || "",
    materialNumber: material.materialNumber || "",
    callNumber: material.callNumber || "",
    location: material.location || "",
    coverUrl: material.coverUrl || "",
    notes: material.notes || "",
    quantityOrdered,
    receivedQuantity: Math.min(quantityOrdered, Math.max(0, receivedQuantity)),
    receivedAt: material.receivedAt || "",
    sentToPendingAt: material.sentToPendingAt || (workflowStage === "pending" ? material.createdAt || Date.now() : ""),
    createdAt: Number(material.createdAt || Date.now()),
    activatedAt: material.activatedAt || "",
    linkedRecordId: material.linkedRecordId || "",
    workflowStage,
    status,
  };
}

function normalizeDonationItem(item = {}, batch = {}) {
  const reviewStatus = item.reviewStatus || "New";
  const statusToDisposition = {
    Rejected: "Rejected",
    "Sent to Sale": "Book Sale",
    Disposed: "Disposed",
    Returned: "Returned to Donor",
  };
  return {
    id: item.id || crypto.randomUUID(),
    batchId: item.batchId || batch.id || "",
    title: item.title || "",
    author: item.author || "",
    format: item.format || "Book",
    condition: item.condition || "",
    notes: item.notes || "",
    reviewStatus,
    disposition: item.disposition || statusToDisposition[reviewStatus] || "",
    linkedPendingMaterialId: item.linkedPendingMaterialId || "",
    linkedCatalogRecordId: item.linkedCatalogRecordId || "",
    createdAt: Number(item.createdAt || Date.now()),
    updatedAt: Number(item.updatedAt || item.createdAt || Date.now()),
    sentToPendingAt: item.sentToPendingAt || "",
    activatedAt: item.activatedAt || "",
  };
}

function normalizeDonationBatch(batch = {}) {
  const normalizedItems = Array.isArray(batch.items) ? batch.items.map((item) => normalizeDonationItem(item, batch)) : [];
  return {
    id: batch.id || crypto.randomUUID(),
    batchId: batch.batchId || batch.id || `DON-${new Date().toISOString().slice(0, 10)}`,
    name: batch.name || batch.batchLabel || "",
    donorName: batch.donorName || "",
    donorContact: batch.donorContact || "",
    dateReceived: batch.dateReceived || new Date().toISOString().slice(0, 10),
    notes: batch.notes || "",
    acknowledgmentSent: Boolean(batch.acknowledgmentSent),
    taxReceiptRequested: Boolean(batch.taxReceiptRequested),
    estimatedValue: batch.estimatedValue || "",
    overallStatus: batch.overallStatus || "New / Received",
    archivedAt: batch.archivedAt || "",
    createdAt: Number(batch.createdAt || Date.now()),
    updatedAt: Number(batch.updatedAt || batch.createdAt || Date.now()),
    items: normalizedItems,
  };
}

function getAcquisitionMaterials() {
  return getPendingMaterials().map(normalizeAcquisitionMaterial);
}

function saveAcquisitionMaterials(materials) {
  savePendingMaterials(materials.map(normalizeAcquisitionMaterial));
}

function getNormalizedDonationBatches() {
  return getDonationBatches().map(normalizeDonationBatch);
}

function saveNormalizedDonationBatches(batches) {
  saveDonationBatches(batches.map(normalizeDonationBatch));
}

function getAcquisitionStageMeta() {
  return {
    orders: { label: "Orders", copy: "Track what has been ordered and what is still outstanding." },
    receiving: { label: "Receiving", copy: "Acknowledge arrivals and move received materials into processing." },
    donations: { label: "Donations", copy: "Intake, review, disposition, and send accepted gifts into processing." },
    pending: { label: "Pending Materials", copy: "Finish setup work before items are activated in the catalog." },
    completed: { label: "Completed", copy: "Review recently activated materials and finished orders or donations." },
  };
}

function deriveOrderStatus(order, materials) {
  if (order.closedAt) return "Closed";
  const total = materials.length;
  const receivedCount = materials.filter((material) => material.receivedQuantity >= material.quantityOrdered).length;
  const partiallyReceived = materials.some((material) => material.receivedQuantity > 0 && material.receivedQuantity < material.quantityOrdered);
  if (!total) return "Open";
  if (receivedCount === total) return "Received";
  if (receivedCount > 0 || partiallyReceived) return "Partially Received";
  return "Open";
}

function getDonationCounts(items = []) {
  return items.reduce((counts, item) => {
    if (["New", "Received", "New / Received"].includes(item.reviewStatus)) counts.newCount += 1;
    if (item.reviewStatus === "Under Review") counts.reviewCount += 1;
    if (item.reviewStatus === "Accepted for Collection") counts.acceptedCount += 1;
    if (["Rejected", "Sent to Sale", "Disposed", "Returned"].includes(item.reviewStatus)) counts.dispositionCount += 1;
    if (item.reviewStatus === "Sent to Pending Materials") counts.awaitingProcessingCount += 1;
    if (item.reviewStatus === "Activated") counts.activatedCount += 1;
    return counts;
  }, { newCount: 0, reviewCount: 0, acceptedCount: 0, dispositionCount: 0, awaitingProcessingCount: 0, activatedCount: 0 });
}

function deriveDonationBatchStatus(batch) {
  const counts = getDonationCounts(batch.items || []);
  if ((batch.items || []).length && counts.activatedCount === batch.items.length) return "Activated / Added to Catalog";
  if (counts.awaitingProcessingCount > 0) return "Sent to Pending Materials";
  if (counts.acceptedCount > 0) return "Accepted for Collection";
  if (counts.reviewCount > 0) return "Under Review";
  if (counts.dispositionCount && counts.dispositionCount === (batch.items || []).length) return "Dispositioned";
  return batch.overallStatus || "New / Received";
}

function getDonationItemSourceLabel(batch, item) {
  return `${batch.name || batch.batchId || "Donation Batch"}${item?.title ? ` · ${item.title}` : ""}`;
}

function getDonationWorkflowData() {
  const batches = getNormalizedDonationBatches()
    .map((batch) => {
      const counts = getDonationCounts(batch.items || []);
      return { ...batch, counts, overallStatus: deriveDonationBatchStatus(batch) };
    })
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const items = batches.flatMap((batch) => batch.items.map((item) => ({ ...item, batch })));
  const filterGroups = {
    incoming: items.filter(({ reviewStatus }) => ["New", "Received", "New / Received"].includes(reviewStatus)),
    review: items.filter(({ reviewStatus }) => reviewStatus === "Under Review"),
    accepted: items.filter(({ reviewStatus }) => ["Accepted for Collection", "Sent to Pending Materials", "Activated"].includes(reviewStatus)),
    dispositioned: items.filter(({ reviewStatus }) => ["Rejected", "Sent to Sale", "Disposed", "Returned"].includes(reviewStatus)),
  };
  return {
    batches,
    items,
    filterGroups,
    newCount: filterGroups.incoming.length,
    underReviewCount: filterGroups.review.length,
    acceptedCount: items.filter(({ reviewStatus }) => reviewStatus === "Accepted for Collection").length,
    dispositionCount: filterGroups.dispositioned.length,
    awaitingProcessingCount: items.filter(({ reviewStatus }) => reviewStatus === "Sent to Pending Materials").length,
    awaitingReviewCount: filterGroups.incoming.length + filterGroups.review.length,
    activatedCount: items.filter(({ reviewStatus }) => reviewStatus === "Activated").length,
  };
}

function getAcquisitionWorkflowData() {
  const materials = getAcquisitionMaterials().slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const orders = getAcquisitionOrders().map((order) => {
    const orderMaterials = materials.filter((material) => material.orderId === order.id);
    const totalItems = orderMaterials.length;
    const receivedItems = orderMaterials.filter((material) => material.receivedQuantity >= material.quantityOrdered).length;
    const pendingItems = orderMaterials.filter((material) => material.workflowStage === "pending").length;
    const completedItems = orderMaterials.filter((material) => material.workflowStage === "completed").length;
    const status = deriveOrderStatus(order, orderMaterials);
    return { ...order, totalItems, receivedItems, pendingItems, completedItems, status, progressPercent: totalItems ? Math.round((receivedItems / totalItems) * 100) : 0, materials: orderMaterials };
  }).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  const donationWorkflow = getDonationWorkflowData();
  const openOrders = orders.filter((order) => order.status !== "Closed");
  const awaitingReceipt = materials.filter((material) => material.sourceType !== "donation" && material.workflowStage !== "completed" && material.workflowStage !== "pending");
  const pending = materials.filter((material) => material.workflowStage === "pending");
  const completedMaterials = materials.filter((material) => material.workflowStage === "completed");
  const completedOrders = orders.filter((order) => order.status === "Closed" || (order.totalItems > 0 && order.receivedItems === order.totalItems));
  return { materials, orders, openOrders, awaitingReceipt, pending, completedMaterials, completedOrders, donationWorkflow };
}

function getAcquisitionStatusBadge(status) {
  const slug = String(status || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `<span class="badge acquisition-badge" data-acq-status="${slug}">${status}</span>`;
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatRelativeAge(timestamp) {
  if (!timestamp) return "";
  const diffDays = Math.floor((Date.now() - Number(timestamp)) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function getOldPendingFlag(material) {
  const ageDays = Math.floor((Date.now() - Number(material.sentToPendingAt || material.createdAt || 0)) / (1000 * 60 * 60 * 24));
  return ageDays >= 14 ? `${ageDays} days in queue` : "";
}

function setAcquisitionStage(stage) {
  if (!getAcquisitionStageMeta()[stage]) return;
  state.acquisitionsStage = stage;
  renderAcquisitionsWorkspace();
}

function ensureUniquePendingMaterialNumber(materialNumber) {
  const value = String(materialNumber || "").trim();
  if (!value) return { ok: true };
  const duplicatePending = getAcquisitionMaterials().some((entry) => String(entry.materialNumber || "").toLowerCase() === value.toLowerCase());
  const duplicateCatalog = state.records.some((entry) => (entry.materialNumbers || []).some((existing) => String(existing).toLowerCase() === value.toLowerCase()));
  return duplicatePending || duplicateCatalog ? { ok: false, message: `Material number ${value} is already in use.` } : { ok: true };
}

function addAcquisitionItem(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const orderName = String(formData.get("acqOrderName") || "").trim();
  const title = String(formData.get("acqTitle") || "").trim();
  const materialNumber = String(formData.get("acqMaterialNumber") || "").trim();
  const creator = String(formData.get("acqCreator") || "").trim();
  const format = String(formData.get("acqFormat") || "Book").trim() || "Book";
  const vendor = String(formData.get("acqVendor") || "").trim();
  const orderDate = String(formData.get("acqOrderDate") || "").trim();
  const callNumber = String(formData.get("acqCallNumber") || "").trim();
  const location = String(formData.get("acqLocation") || "").trim();
  const coverUrl = String(formData.get("acqCoverUrl") || "").trim();
  const notes = String(formData.get("acqNotes") || "").trim();
  const quantityOrdered = Math.max(1, Number(formData.get("acqQuantityOrdered") || 1) || 1);

  if (!orderName || !title || !materialNumber) {
    setAcquisitionMessage("Order name, title, and material number are required.", true);
    return;
  }
  const materialNumberStatus = ensureUniquePendingMaterialNumber(materialNumber);
  if (!materialNumberStatus.ok) {
    setAcquisitionMessage(materialNumberStatus.message, true);
    return;
  }

  const orders = getAcquisitionOrders();
  let order = orders.find((entry) => String(entry.name || "").toLowerCase() === orderName.toLowerCase());
  if (!order) {
    order = { id: crypto.randomUUID(), name: orderName, vendor, orderDate, createdAt: Date.now(), closedAt: "" };
    orders.push(order);
  } else {
    order = { ...order, vendor: vendor || order.vendor || "", orderDate: orderDate || order.orderDate || "" };
    const index = orders.findIndex((entry) => entry.id === order.id);
    if (index >= 0) orders[index] = order;
  }
  saveAcquisitionOrders(orders);

  const materials = getAcquisitionMaterials();
  materials.push(normalizeAcquisitionMaterial({
    id: crypto.randomUUID(),
    orderId: order.id,
    orderName: order.name,
    sourceType: "order",
    sourceName: order.name,
    title,
    creator,
    format,
    materialNumber,
    callNumber,
    location,
    coverUrl,
    notes,
    quantityOrdered,
    receivedQuantity: 0,
    status: "Awaiting Receipt",
    workflowStage: "orders",
    createdAt: Date.now(),
  }));
  saveAcquisitionMaterials(materials);

  form.reset();
  if (els.acqCoverUpload) els.acqCoverUpload.value = "";
  setAcquisitionMessage(`${title} added to ${order.name} and is now awaiting receipt.`);
  state.acquisitionsStage = "orders";
  renderAcquisitionsWorkspace();
}

function updateAcquisitionMaterial(materialId, updater) {
  saveAcquisitionMaterials(getAcquisitionMaterials().map((material) => (material.id === materialId ? normalizeAcquisitionMaterial(updater(material)) : material)));
}

function updateDonationBatch(batchId, updater) {
  const updatedBatches = getNormalizedDonationBatches().map((batch) => (batch.id === batchId ? normalizeDonationBatch(updater(batch)) : batch));
  saveNormalizedDonationBatches(updatedBatches);
}

function updateDonationItem(itemId, updater) {
  const updatedBatches = getNormalizedDonationBatches().map((batch) => normalizeDonationBatch({
    ...batch,
    items: (batch.items || []).map((item) => (item.id === itemId ? normalizeDonationItem(updater(item, batch), batch) : item)),
    updatedAt: Date.now(),
  }));
  saveNormalizedDonationBatches(updatedBatches);
}

function markMaterialReceived(materialId, receiveAll = false) {
  const nowIso = new Date().toISOString();
  updateAcquisitionMaterial(materialId, (material) => {
    const nextReceived = receiveAll ? material.quantityOrdered : Math.min(material.quantityOrdered, material.receivedQuantity + 1);
    return { ...material, receivedQuantity: nextReceived, receivedAt: nowIso, status: nextReceived >= material.quantityOrdered ? "Received" : "Partially Received", workflowStage: "receiving" };
  });
  setAcquisitionMessage(receiveAll ? "All copies marked as received." : "Receipt recorded.");
  state.acquisitionsStage = "receiving";
  renderAcquisitionsWorkspace();
}

function undoReceipt(materialId) {
  updateAcquisitionMaterial(materialId, (material) => ({ ...material, receivedQuantity: 0, receivedAt: "", sentToPendingAt: "", status: "Awaiting Receipt", workflowStage: "orders" }));
  setAcquisitionMessage("Receipt was undone and the item moved back to Orders.");
  renderAcquisitionsWorkspace();
}

function sendMaterialToPending(materialId) {
  updateAcquisitionMaterial(materialId, (material) => ({ ...material, workflowStage: "pending", status: "Pending Materials", sentToPendingAt: Date.now() }));
  setAcquisitionMessage("Received material moved into Pending Materials.");
  state.acquisitionsStage = "pending";
  renderAcquisitionsWorkspace();
}

function addDonationBatch(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const donorName = String(formData.get("donorName") || "").trim();
  const donorContact = String(formData.get("donorContact") || "").trim();
  const name = String(formData.get("batchName") || "").trim();
  const dateReceived = String(formData.get("dateReceived") || "").trim() || new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("batchNotes") || "").trim();
  const estimatedValue = String(formData.get("estimatedValue") || "").trim();
  const overallStatus = String(formData.get("initialStatus") || "New / Received").trim();
  if (!donorName || !name) {
    setAcquisitionMessage("Donation batch name and donor name are required.", true);
    return;
  }
  const batch = normalizeDonationBatch({
    id: crypto.randomUUID(),
    batchId: `DON-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    name,
    donorName,
    donorContact,
    dateReceived,
    notes,
    acknowledgmentSent: formData.get("ackStatus") === "sent",
    taxReceiptRequested: formData.get("taxReceiptRequested") === "on",
    estimatedValue,
    overallStatus,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    items: [],
  });
  const batches = [batch, ...getNormalizedDonationBatches()];
  saveNormalizedDonationBatches(batches);
  state.activeDonationBatchId = batch.id;
  event.currentTarget.reset();
  setAcquisitionMessage(`Donation batch ${batch.name} created.`);
  renderAcquisitionsWorkspace();
}

function addDonationItem(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const batchId = String(formData.get("batchIdSelect") || formData.get("batchId") || state.activeDonationBatchId || "").trim();
  const title = String(formData.get("itemTitle") || "").trim();
  const author = String(formData.get("itemAuthor") || "").trim();
  const format = String(formData.get("itemFormat") || "Book").trim() || "Book";
  const condition = String(formData.get("itemCondition") || "").trim();
  const notes = String(formData.get("itemNotes") || "").trim();
  if (!batchId || !title) {
    setAcquisitionMessage("Select a donation batch and enter at least a title.", true);
    return;
  }
  updateDonationBatch(batchId, (batch) => ({
    ...batch,
    updatedAt: Date.now(),
    items: [...(batch.items || []), normalizeDonationItem({ id: crypto.randomUUID(), batchId, title, author, format, condition, notes, reviewStatus: "New", disposition: "", createdAt: Date.now(), updatedAt: Date.now() }, batch)],
  }));
  event.currentTarget.reset();
  setAcquisitionMessage(`Donation item ${title} added to the batch.`);
  renderAcquisitionsWorkspace();
}

function setDonationItemStatus(itemId, reviewStatus, disposition = "") {
  updateDonationItem(itemId, (item) => ({ ...item, reviewStatus, disposition, updatedAt: Date.now() }));
  setAcquisitionMessage(`Donation item updated to ${reviewStatus}.`);
  renderAcquisitionsWorkspace();
}

function sendDonationItemToPending(itemId) {
  const batches = getNormalizedDonationBatches();
  const match = batches.flatMap((batch) => (batch.items || []).map((item) => ({ batch, item }))).find(({ item }) => item.id === itemId);
  if (!match) return;
  if (match.item.reviewStatus !== "Accepted for Collection") {
    setAcquisitionMessage("Only accepted donation items can be sent to Pending Materials.", true);
    return;
  }
  const material = normalizeAcquisitionMaterial({
    id: crypto.randomUUID(),
    sourceType: "donation",
    sourceLabel: "Donation",
    sourceName: getDonationItemSourceLabel(match.batch, match.item),
    donationBatchId: match.batch.id,
    donationBatchName: match.batch.name || match.batch.batchId,
    donationItemId: match.item.id,
    donorName: match.batch.donorName,
    title: match.item.title || "Untitled donation item",
    creator: match.item.author || "",
    format: match.item.format || "Book",
    condition: match.item.condition || "",
    notes: match.item.notes || "",
    materialNumber: `DON-${Math.floor(Math.random() * 900000 + 100000)}`,
    quantityOrdered: 1,
    receivedQuantity: 1,
    receivedAt: new Date().toISOString(),
    sentToPendingAt: Date.now(),
    createdAt: Date.now(),
    workflowStage: "pending",
    status: "Pending Materials",
  });
  saveAcquisitionMaterials([...getAcquisitionMaterials(), material]);
  updateDonationItem(itemId, (item) => ({ ...item, reviewStatus: "Sent to Pending Materials", linkedPendingMaterialId: material.id, sentToPendingAt: new Date().toISOString(), updatedAt: Date.now() }));
  setAcquisitionMessage("Accepted donation item moved into Pending Materials.");
  state.acquisitionsStage = "pending";
  renderAcquisitionsWorkspace();
}

function editDonationBatch(batchId) {
  const batch = getNormalizedDonationBatches().find((entry) => entry.id === batchId);
  if (!batch) return;
  const donorName = window.prompt("Donor name", batch.donorName || "");
  if (donorName === null) return;
  const donorContact = window.prompt("Donor contact info", batch.donorContact || "");
  if (donorContact === null) return;
  const notes = window.prompt("Batch notes", batch.notes || "");
  if (notes === null) return;
  updateDonationBatch(batchId, (current) => ({ ...current, donorName: donorName.trim(), donorContact: donorContact.trim(), notes: notes.trim(), updatedAt: Date.now() }));
  setAcquisitionMessage("Donation batch updated.");
  renderAcquisitionsWorkspace();
}

function editDonationItem(itemId) {
  const match = getDonationWorkflowData().items.find((entry) => entry.id === itemId);
  if (!match) return;
  const title = window.prompt("Title", match.title || "");
  if (title === null) return;
  const author = window.prompt("Author / creator", match.author || "");
  if (author === null) return;
  const condition = window.prompt("Condition", match.condition || "");
  if (condition === null) return;
  const notes = window.prompt("Notes", match.notes || "");
  if (notes === null) return;
  updateDonationItem(itemId, (item) => ({ ...item, title: title.trim(), author: author.trim(), condition: condition.trim(), notes: notes.trim(), updatedAt: Date.now() }));
  setAcquisitionMessage("Donation item updated.");
  renderAcquisitionsWorkspace();
}

function markDonationAcknowledgmentSent(batchId) {
  updateDonationBatch(batchId, (batch) => ({ ...batch, acknowledgmentSent: true, updatedAt: Date.now() }));
  setAcquisitionMessage("Acknowledgment marked as sent.");
  renderAcquisitionsWorkspace();
}

function archiveDonationBatch(batchId) {
  updateDonationBatch(batchId, (batch) => ({ ...batch, archivedAt: new Date().toISOString(), updatedAt: Date.now() }));
  setAcquisitionMessage("Donation batch archived.");
  renderAcquisitionsWorkspace();
}

function activatePendingMaterial(materialId) {
  const materials = getAcquisitionMaterials();
  const material = materials.find((entry) => entry.id === materialId);
  if (!material) return;
  if (material.linkedRecordId) {
    setAcquisitionMessage("This pending material has already been activated.", true);
    return;
  }
  const now = new Date();
  const dateAdded = now.toISOString().slice(0, 10);
  const sourceNote = material.sourceType === "donation" ? `Donation · ${material.donationBatchName || material.sourceName}` : `Acquisitions · ${material.orderName}`;
  const newRecord = normalizeRecord({
    id: crypto.randomUUID(),
    title: material.title,
    creator: material.creator || "Unknown creator",
    format: material.format || "Book",
    status: "Available",
    source: sourceNote,
    materialNumbers: [material.materialNumber],
    callNumber: material.callNumber || "",
    location: material.location || "",
    coverUrl: material.coverUrl || "",
    notes: material.notes || `Activated from ${material.sourceType === "donation" ? "donation intake" : `order ${material.orderName}`}`,
    dateAdded,
    addedAt: now.getTime(),
  });
  state.records.unshift(newRecord);
  saveRecords(state.records);
  saveAcquisitionMaterials(materials.map((entry) => (entry.id === materialId ? normalizeAcquisitionMaterial({ ...entry, status: "Activated", workflowStage: "completed", activatedAt: now.toISOString(), linkedRecordId: newRecord.id }) : entry)));
  if (material.sourceType === "donation" && material.donationItemId) {
    updateDonationItem(material.donationItemId, (item) => ({ ...item, reviewStatus: "Activated", linkedCatalogRecordId: newRecord.id, activatedAt: now.toISOString(), updatedAt: Date.now() }));
  }
  setAcquisitionMessage(`${material.title} was activated and added to the catalog.`);
  state.acquisitionsStage = "completed";
  render();
}

function removePendingMaterial(materialId) {
  const material = getAcquisitionMaterials().find((entry) => entry.id === materialId);
  saveAcquisitionMaterials(getAcquisitionMaterials().filter((entry) => entry.id !== materialId));
  if (material?.sourceType === "donation" && material.donationItemId) {
    updateDonationItem(material.donationItemId, (item) => ({ ...item, reviewStatus: "Accepted for Collection", linkedPendingMaterialId: "", sentToPendingAt: "", updatedAt: Date.now() }));
  }
  setAcquisitionMessage(material?.workflowStage === "pending" ? "Pending material removed from the queue." : "Acquisition item removed.");
  renderAcquisitionsWorkspace();
}

function closeOrder(orderId) {
  const orders = getAcquisitionOrders();
  const materials = getAcquisitionMaterials().filter((material) => material.orderId === orderId);
  if (materials.some((material) => !["pending", "completed"].includes(material.workflowStage) && material.receivedQuantity < material.quantityOrdered)) {
    setAcquisitionMessage("Receive outstanding items before closing this order.", true);
    return;
  }
  saveAcquisitionOrders(orders.map((order) => (order.id === orderId ? { ...order, closedAt: new Date().toISOString() } : order)));
  setAcquisitionMessage("Order closed.");
  renderAcquisitionsWorkspace();
}

function reopenOrder(orderId) {
  saveAcquisitionOrders(getAcquisitionOrders().map((order) => (order.id === orderId ? { ...order, closedAt: "" } : order)));
  setAcquisitionMessage("Order reopened.");
  state.acquisitionsStage = "orders";
  renderAcquisitionsWorkspace();
}

function renderAcquisitionSummaryCards() {
  if (!els.acquisitionSummaryCards) return;
  const workflow = getAcquisitionWorkflowData();
  const donationWorkflow = workflow.donationWorkflow;
  const cards = [
    { label: "Open Orders", value: workflow.openOrders.length, copy: "Orders still moving through acquisitions.", stage: "orders" },
    { label: "Awaiting Receipt", value: workflow.awaitingReceipt.length, copy: "Ordered materials not yet acknowledged as arrived.", stage: "receiving" },
    { label: "New Donations", value: donationWorkflow.newCount + donationWorkflow.underReviewCount, copy: "Donation items still in intake or review.", stage: "donations" },
    { label: "Accepted for Collection", value: donationWorkflow.acceptedCount, copy: "Accepted donations not yet handed off to processing.", stage: "donations" },
    { label: "Rejected / Sale / Disposition", value: donationWorkflow.dispositionCount, copy: "Donation items resolved outside the collection.", stage: "donations" },
    { label: "Awaiting Processing", value: donationWorkflow.awaitingProcessingCount, copy: "Donation items already sent into Pending Materials.", stage: "pending" },
  ];
  els.acquisitionSummaryCards.innerHTML = cards.map((card) => `<button class="acquisition-summary-card" type="button" data-acq-nav-stage="${card.stage}"><span class="acquisition-summary-label">${card.label}</span><strong class="acquisition-summary-value">${card.value}</strong><span class="acquisition-summary-copy">${card.copy}</span></button>`).join("");
}

function renderAcquisitionStageNav() {
  if (!els.acquisitionsStageNav) return;
  const meta = getAcquisitionStageMeta();
  els.acquisitionsStageNav.innerHTML = Object.entries(meta).map(([id, config]) => `<button class="button button-secondary acquisition-stage-btn ${state.acquisitionsStage === id ? "is-active" : ""}" type="button" data-acq-nav-stage="${id}"><span>${config.label}</span><small>${config.copy}</small></button>`).join("");
}

function renderOrdersStage(workflow) {
  const rows = workflow.orders.filter((order) => order.status !== "Closed");
  const empty = `<div class="acquisition-empty-state"><h4>No open orders right now</h4><p class="muted">Start a new order to begin the acquisitions pipeline.</p><button class="button" type="button" data-acq-focus-form="true">Create Order</button></div>`;
  return `
    <div class="panel-header compact acquisitions-stage-header">
      <div><h3>Orders</h3><p class="muted">Materials selected and ordered, but not fully received yet.</p></div>
      <div class="row-actions"><button class="button" type="button" data-acq-focus-form="true">Create Order</button></div>
    </div>
    <div class="acquisitions-orders-layout">
      <section class="acquisition-form-panel">
        <div class="panel-header compact"><div><h4>Create order line</h4><p class="muted">Add a title to an order and keep it in the workflow until it arrives.</p></div></div>
        <form id="acquisitionItemForm" class="simple-form serials-form-grid acquisitions-order-form">
          <label><span>Order name<span class="required-indicator">*</span></span><input name="acqOrderName" id="acqOrderName" required placeholder="Spring 2026 Books" /></label>
          <label><span>Vendor / Source</span><input name="acqVendor" id="acqVendor" placeholder="Optional" /></label>
          <label><span>Order date</span><input name="acqOrderDate" id="acqOrderDate" type="date" /></label>
          <label><span>Title<span class="required-indicator">*</span></span><input name="acqTitle" id="acqTitle" required placeholder="Item title" /></label>
          <label><span>Creator / Author / Artist</span><input name="acqCreator" id="acqCreator" placeholder="Optional" /></label>
          <label><span>Format</span><select name="acqFormat" id="acqFormat"><option>Book</option><option>Vinyl</option><option>Board Game</option><option>CD</option><option>Zine</option><option>Magazine</option><option>Other</option></select></label>
          <label><span>Quantity ordered</span><input name="acqQuantityOrdered" id="acqQuantityOrdered" type="number" min="1" value="1" /></label>
          <label><span>Material number<span class="required-indicator">*</span></span><input name="acqMaterialNumber" id="acqMaterialNumber" required placeholder="Scan or type material number" /></label>
          <label><span>Call number</span><input name="acqCallNumber" id="acqCallNumber" /></label>
          <label><span>Shelf location</span><input name="acqLocation" id="acqLocation" placeholder="Optional" /></label>
          <label><span>Cover image URL</span><input name="acqCoverUrl" id="acqCoverUrl" type="url" placeholder="https://..." /></label>
          <label><span>Cover upload</span><input id="acqCoverUpload" type="file" accept="image/*" /></label>
          <label class="form-grid-span"><span>Order notes</span><input name="acqNotes" id="acqNotes" placeholder="Optional" /></label>
          <div class="row-actions form-grid-span"><button class="button" type="submit">Create Order</button></div>
        </form>
      </section>
      <section class="acquisition-list-panel">
        <div class="acquisition-data-table-wrap">
          <table class="serials-table acquisition-stage-table">
            <thead><tr><th>Order</th><th>Status</th><th>Vendor</th><th>Created</th><th>Progress</th><th>Actions</th></tr></thead>
            <tbody>${rows.length ? rows.map((order) => `<tr><td><strong>${order.name || "Untitled order"}</strong><div class="muted">${order.totalItems} item${order.totalItems === 1 ? "" : "s"}</div></td><td>${getAcquisitionStatusBadge(order.status)}</td><td>${order.vendor || "—"}</td><td>${formatShortDate(order.orderDate || order.createdAt)}</td><td><div class="acquisition-progress-meta"><strong>${order.receivedItems} of ${order.totalItems || 0} items received</strong></div><div class="acquisition-progress-bar"><span style="width:${order.progressPercent}%"></span></div></td><td><div class="row-actions"><button class="button button-secondary" type="button" data-acq-nav-stage="receiving">View order details</button><button class="button button-secondary" type="button" data-acq-nav-stage="receiving">Mark items as received</button>${order.receivedItems === order.totalItems && order.totalItems ? `<button class="button" type="button" data-acq-close-order="${order.id}">Close order</button>` : ``}</div></td></tr>`).join("") : `<tr><td colspan="6">${empty}</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>`;
}

function renderReceivingStage(workflow) {
  const rows = workflow.materials.filter((material) => material.sourceType !== "donation" && (material.workflowStage === "orders" || material.workflowStage === "receiving"));
  if (!rows.length) return `<div class="panel-header compact acquisitions-stage-header"><div><h3>Receiving</h3><p class="muted">Acknowledge incoming materials and hand them off to processing.</p></div></div><div class="acquisition-empty-state"><h4>No materials are awaiting receipt</h4><p class="muted">When ordered materials arrive, they will appear here for receiving.</p></div>`;
  return `<div class="panel-header compact acquisitions-stage-header"><div><h3>Receiving</h3><p class="muted">What just came in, what order it belongs to, and what still needs acknowledgment.</p></div></div><div class="acquisition-card-grid">${rows.map((material) => `<article class="acquisition-stage-card"><div class="acquisition-stage-card-top"><div><h4>${material.title}</h4><p class="muted">${material.orderName || "No order"} · ${material.materialNumber || "No material #"}</p></div>${getAcquisitionStatusBadge(material.status)}</div><div class="acquisition-detail-grid"><div><span class="status-label">Quantity ordered</span><strong>${material.quantityOrdered}</strong></div><div><span class="status-label">Quantity received</span><strong>${material.receivedQuantity}</strong></div><div><span class="status-label">Received date</span><strong>${formatShortDate(material.receivedAt)}</strong></div><div><span class="status-label">Format</span><strong>${material.format || "—"}</strong></div></div><div class="row-actions"><button class="button button-secondary" type="button" data-acq-receive="${material.id}">Mark as received</button><button class="button button-secondary" type="button" data-acq-receive-all="${material.id}">Receive all copies</button>${material.receivedQuantity > 0 ? `<button class="button button-secondary" type="button" data-acq-undo-receipt="${material.id}">Undo receipt</button>` : ``}${material.receivedQuantity > 0 ? `<button class="button" type="button" data-acq-send-pending="${material.id}">Send to Pending Materials</button>` : ``}</div></article>`).join("")}</div>`;
}

function renderDonationBatchOptions(batches) {
  return batches.map((batch) => `<option value="${batch.id}" ${state.activeDonationBatchId === batch.id ? "selected" : ""}>${batch.name || batch.batchId}</option>`).join("");
}

function renderDonationFilterButton(id, label, count) {
  return `<button class="button button-secondary ${state.donationFilter === id ? "is-active" : ""}" type="button" data-donation-filter="${id}">${label} <span class="donation-filter-count">${count}</span></button>`;
}

function renderDonationItemActions(item) {
  const actions = [["under-review", "Mark Under Review"], ["accepted", "Accept for Collection"], ["rejected", "Reject"], ["sale", "Mark for Sale"], ["disposed", "Mark Disposed"], ["returned", "Return to Donor"]];
  return actions.map(([action, label]) => `<button class="button button-secondary" type="button" data-donation-item-action="${action}" data-donation-item-id="${item.id}">${label}</button>`).join("") + (item.reviewStatus === "Accepted for Collection" ? `<button class="button" type="button" data-donation-send-pending="${item.id}">Send to Pending Materials</button>` : "") + `<button class="button button-secondary" type="button" data-donation-edit-item="${item.id}">Edit item details</button>`;
}

function renderDonationItemsTable(items, emptyTitle, emptyCopy) {
  if (!items.length) return `<div class="acquisition-empty-state"><h4>${emptyTitle}</h4><p class="muted">${emptyCopy}</p></div>`;
  return `<div class="acquisition-data-table-wrap"><table class="serials-table acquisition-stage-table"><thead><tr><th>Donation Item</th><th>Batch</th><th>Status</th><th>Disposition</th><th>Notes</th><th>Actions</th></tr></thead><tbody>${items.map(({ batch, ...item }) => `<tr><td><strong>${item.title || "Untitled item"}</strong><div class="muted">${item.author || "Unknown creator"} · ${item.format || "Other"}${item.condition ? ` · ${item.condition}` : ""}</div></td><td>${batch.name || batch.batchId}<div class="muted">${batch.donorName || "Unknown donor"}</div></td><td>${getAcquisitionStatusBadge(item.reviewStatus)}</td><td>${item.disposition || "—"}</td><td>${item.notes || "—"}</td><td><div class="row-actions">${renderDonationItemActions(item)}</div></td></tr>`).join("")}</tbody></table></div>`;
}

function renderDonationsStage(workflow) {
  const donationWorkflow = workflow.donationWorkflow;
  const activeBatch = donationWorkflow.batches.find((batch) => batch.id === state.activeDonationBatchId) || donationWorkflow.batches[0] || null;
  if (activeBatch && !state.activeDonationBatchId) state.activeDonationBatchId = activeBatch.id;
  const filterItems = donationWorkflow.filterGroups[state.donationFilter] || donationWorkflow.filterGroups.incoming;
  return `
    <div class="panel-header compact acquisitions-stage-header">
      <div><h3>Donations</h3><p class="muted">Track donated materials from intake through review and final disposition.</p></div>
      <div class="row-actions">
        <button class="button" type="button" data-acq-focus-donation-batch="true">New Donation Batch</button>
        <button class="button button-secondary" type="button" data-acq-focus-donation-item="true">Add Donation Item</button>
        <button class="button button-secondary" type="button" data-donation-filter="review">Review Donations</button>
        <button class="button button-secondary" type="button" data-donation-filter="accepted">View Accepted Items</button>
        <button class="button button-secondary" type="button" data-donation-filter="dispositioned">View Rejected / Dispositioned</button>
      </div>
    </div>
    <div class="acquisition-summary-grid donations-summary-grid">
      <article class="acquisition-summary-card donation-summary-card-static"><span class="acquisition-summary-label">New Donations</span><strong class="acquisition-summary-value">${donationWorkflow.newCount}</strong><span class="acquisition-summary-copy">Recently received or not yet reviewed.</span></article>
      <article class="acquisition-summary-card donation-summary-card-static"><span class="acquisition-summary-label">Under Review</span><strong class="acquisition-summary-value">${donationWorkflow.underReviewCount}</strong><span class="acquisition-summary-copy">Waiting on collection decision.</span></article>
      <article class="acquisition-summary-card donation-summary-card-static"><span class="acquisition-summary-label">Accepted for Collection</span><strong class="acquisition-summary-value">${donationWorkflow.acceptedCount}</strong><span class="acquisition-summary-copy">Approved but not yet sent to processing.</span></article>
      <article class="acquisition-summary-card donation-summary-card-static"><span class="acquisition-summary-label">Rejected / Sale / Disposition</span><strong class="acquisition-summary-value">${donationWorkflow.dispositionCount}</strong><span class="acquisition-summary-copy">Finalized outside the collection.</span></article>
      <article class="acquisition-summary-card donation-summary-card-static"><span class="acquisition-summary-label">Awaiting Processing</span><strong class="acquisition-summary-value">${donationWorkflow.awaitingProcessingCount}</strong><span class="acquisition-summary-copy">Accepted items already sent to Pending Materials.</span></article>
    </div>
    <div class="donations-workspace-grid">
      <section class="acquisition-form-panel">
        <div class="panel-header compact"><div><h4>New Donation Batch</h4><p class="muted">Create a batch for one donation event or dropoff.</p></div></div>
        <form id="donationBatchForm" class="simple-form serials-form-grid">
          <label><span>Batch name / label<span class="required-indicator">*</span></span><input name="batchName" id="donationBatchName" required placeholder="Smith Donation – March 2026" /></label>
          <label><span>Donor name<span class="required-indicator">*</span></span><input name="donorName" id="donationDonorName" required placeholder="Jane Smith" /></label>
          <label><span>Donor contact info</span><input name="donorContact" placeholder="Email, phone, or address" /></label>
          <label><span>Date received</span><input name="dateReceived" type="date" value="${new Date().toISOString().slice(0, 10)}" /></label>
          <label><span>Acknowledgment</span><select name="ackStatus"><option value="pending">Required / pending</option><option value="sent">Sent</option></select></label>
          <label><span>Tax receipt requested</span><input name="taxReceiptRequested" type="checkbox" /></label>
          <label><span>Estimated value</span><input name="estimatedValue" placeholder="Manual only" /></label>
          <label><span>Initial status</span><select name="initialStatus"><option>New / Received</option><option>Under Review</option></select></label>
          <label class="form-grid-span"><span>Staff notes</span><textarea name="batchNotes" rows="3" placeholder="Intake notes, donor request, appraisal notes, etc."></textarea></label>
          <div class="row-actions form-grid-span"><button class="button" type="submit">New Donation Batch</button></div>
        </form>
      </section>
      <section class="acquisition-list-panel">
        <div class="panel-header compact"><div><h4>Donation Batches</h4><p class="muted">Open a batch to review its items, acknowledgment status, and outcomes.</p></div></div>
        ${donationWorkflow.batches.length ? `<div class="acquisition-data-table-wrap"><table class="serials-table acquisition-stage-table"><thead><tr><th>Batch</th><th>Donor</th><th>Date received</th><th>Items</th><th>Summary status</th><th>Acknowledgment</th><th>Actions</th></tr></thead><tbody>${donationWorkflow.batches.map((batch) => `<tr class="${state.activeDonationBatchId === batch.id ? "donation-batch-row-active" : ""}"><td><strong>${batch.name || batch.batchId}</strong><div class="muted">${batch.batchId}</div></td><td>${batch.donorName || "—"}<div class="muted">${batch.donorContact || "No contact info"}</div></td><td>${formatShortDate(batch.dateReceived)}</td><td>${(batch.items || []).length}<div class="muted">${batch.counts.acceptedCount} accepted · ${batch.counts.dispositionCount} dispositioned</div></td><td>${getAcquisitionStatusBadge(batch.overallStatus)}</td><td>${batch.acknowledgmentSent ? getAcquisitionStatusBadge("Acknowledgment Sent") : getAcquisitionStatusBadge("Acknowledgment Needed")}</td><td><div class="row-actions"><button class="button button-secondary" type="button" data-donation-open-batch="${batch.id}">Open batch</button><button class="button button-secondary" type="button" data-donation-edit-batch="${batch.id}">Edit batch</button><button class="button button-secondary" type="button" data-donation-open-batch="${batch.id}" data-acq-focus-donation-item="true">Add item to batch</button>${!batch.acknowledgmentSent ? `<button class="button button-secondary" type="button" data-donation-ack="${batch.id}">Mark acknowledgment sent</button>` : ``}<button class="button" type="button" data-donation-archive-batch="${batch.id}">Archive batch</button></div></td></tr>`).join("")}</tbody></table></div>` : `<div class="acquisition-empty-state"><h4>No donation batches yet</h4><p class="muted">Start a donation batch to track intake, review, and disposition decisions.</p></div>`}
      </section>
    </div>
    <section class="acquisition-stage-card">
      <div class="panel-header compact"><div><h4>Donation review workspace</h4><p class="muted">Use the filters to move quickly between incoming, under-review, accepted, and rejected or dispositioned donation items.</p></div></div>
      <div class="row-actions donation-filter-row">
        ${renderDonationFilterButton("incoming", "Incoming / New", donationWorkflow.filterGroups.incoming.length)}
        ${renderDonationFilterButton("review", "Under Review", donationWorkflow.filterGroups.review.length)}
        ${renderDonationFilterButton("accepted", "Accepted", donationWorkflow.filterGroups.accepted.length)}
        ${renderDonationFilterButton("dispositioned", "Rejected / Dispositioned", donationWorkflow.filterGroups.dispositioned.length)}
      </div>
      ${renderDonationItemsTable(filterItems, state.donationFilter === "review" ? "No donation items are awaiting review" : state.donationFilter === "accepted" ? "No accepted donation items are waiting to be processed" : state.donationFilter === "dispositioned" ? "No donation items have been dispositioned" : "No incoming donation items right now", state.donationFilter === "incoming" ? "New donation items will appear here as soon as they are added to a batch." : "Try another filter or create a new donation batch.")}
    </section>
    <section class="acquisition-stage-card">
      <div class="panel-header compact"><div><h4>${activeBatch ? `${activeBatch.name || activeBatch.batchId}` : "Batch detail"}</h4><p class="muted">${activeBatch ? `Review donation items for ${activeBatch.donorName || "this donor"} and move accepted items into Pending Materials.` : "Open a donation batch to review and manage its items."}</p></div></div>
      ${activeBatch ? `
        <div class="acquisition-detail-grid">
          <div><span class="status-label">Donor</span><strong>${activeBatch.donorName || "—"}</strong></div>
          <div><span class="status-label">Date received</span><strong>${formatShortDate(activeBatch.dateReceived)}</strong></div>
          <div><span class="status-label">Acknowledgment</span><strong>${activeBatch.acknowledgmentSent ? "Sent" : "Pending"}</strong></div>
          <div><span class="status-label">Tax receipt</span><strong>${activeBatch.taxReceiptRequested ? "Requested" : "Not requested"}</strong></div>
          <div><span class="status-label">Estimated value</span><strong>${activeBatch.estimatedValue || "—"}</strong></div>
          <div><span class="status-label">Status</span><strong>${activeBatch.overallStatus}</strong></div>
        </div>
        <p class="muted">${activeBatch.notes || "No staff notes for this batch yet."}</p>
        <form id="donationItemForm" class="simple-form serials-form-grid">
          <input type="hidden" name="batchId" value="${activeBatch.id}" />
          <label><span>Donation Batch</span><select name="batchIdSelect">${renderDonationBatchOptions(donationWorkflow.batches)}</select></label>
          <label><span>Title<span class="required-indicator">*</span></span><input name="itemTitle" required placeholder="Lightweight title entry" /></label>
          <label><span>Author / creator</span><input name="itemAuthor" placeholder="Optional at intake" /></label>
          <label><span>Format / material type</span><select name="itemFormat"><option>Book</option><option>DVD</option><option>CD</option><option>Vinyl</option><option>Board Game</option><option>Magazine</option><option>Other</option></select></label>
          <label><span>Condition</span><input name="itemCondition" placeholder="Good, worn, etc." /></label>
          <label class="form-grid-span"><span>Notes</span><textarea name="itemNotes" rows="2" placeholder="Brief intake notes; full metadata can wait until later."></textarea></label>
          <div class="row-actions form-grid-span"><button class="button" type="submit">Add Donation Item</button></div>
        </form>
        ${renderDonationItemsTable((activeBatch.items || []).map((item) => ({ ...item, batch: activeBatch })), "This batch has no donation items yet", "Add a donation item to start review and disposition work for this batch.")}
      ` : `<div class="acquisition-empty-state"><h4>No batch selected</h4><p class="muted">Choose a batch from the list above to manage its items.</p></div>`}
    </section>`;
}

function renderPendingStage(workflow) {
  const rows = workflow.pending;
  if (!rows.length) return `<div class="panel-header compact acquisitions-stage-header"><div><h3>Pending Materials</h3><p class="muted">Received and accepted materials waiting for item setup, metadata review, and activation.</p></div></div><div class="acquisition-empty-state"><h4>No pending materials awaiting activation</h4><p class="muted">Received orders and accepted donation items move here once staff has acknowledged and routed them.</p></div>`;
  return `<div class="panel-header compact acquisitions-stage-header"><div><h3>Pending Materials</h3><p class="muted">Here are the materials that need finishing work before they become active catalog items.</p></div></div><div class="acquisition-data-table-wrap"><table class="serials-table acquisition-stage-table"><thead><tr><th>Title</th><th>Source</th><th>Material #</th><th>Format</th><th>Status</th><th>Date added</th><th>Location</th><th>Actions</th></tr></thead><tbody>${rows.map((material) => `<tr><td><strong>${material.title}</strong>${getOldPendingFlag(material) ? `<div class="acquisition-inline-flag">${getOldPendingFlag(material)}</div>` : ``}</td><td><strong>${material.sourceLabel || (material.sourceType === "donation" ? "Donation" : "Order")}</strong><div class="muted">${material.sourceType === "donation" ? `Batch: ${material.donationBatchName || "Donation"}${material.donorName ? ` · Donor: ${material.donorName}` : ""}` : material.orderName || "—"}</div></td><td>${material.materialNumber || "—"}</td><td>${material.format || "—"}</td><td>${getAcquisitionStatusBadge(material.status)}</td><td>${formatShortDate(material.sentToPendingAt || material.createdAt)}</td><td>${material.location || "Unassigned"}</td><td><div class="row-actions"><button class="button button-secondary" type="button" data-acq-activate="${material.id}">Activate item</button><button class="button button-secondary" type="button" data-acq-focus-form="true">Edit metadata</button><button class="button button-secondary" type="button" data-acq-focus-form="true">Assign location</button><button class="button" type="button" data-acq-remove="${material.id}">Remove / cancel</button></div></td></tr>`).join("")}</tbody></table></div>`;
}

function renderCompletedStage(workflow) {
  const donationCompleted = workflow.donationWorkflow.items.filter((item) => item.reviewStatus === "Activated").map((item) => ({ label: item.title || "Untitled donation item", type: "Donation activated into catalog", date: item.activatedAt, context: item.batch?.name || item.batch?.batchId || "Donation batch" }));
  const completedRows = [...workflow.completedMaterials.map((material) => ({ label: material.title, type: material.sourceType === "donation" ? "Donation item activated into catalog" : "Item activated into catalog", date: material.activatedAt, context: material.sourceType === "donation" ? material.donationBatchName || "Donation batch" : material.orderName || "No order" })), ...workflow.completedOrders.map((order) => ({ label: order.name || "Untitled order", type: order.closedAt ? "Order fully received and closed" : "Order fully received", date: order.closedAt || order.orderDate || order.createdAt, context: `${order.receivedItems}/${order.totalItems || 0} items received`, orderId: order.id, closed: Boolean(order.closedAt) })), ...donationCompleted].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 12);
  if (!completedRows.length) return `<div class="panel-header compact acquisitions-stage-header"><div><h3>Completed</h3><p class="muted">Recently activated materials and recently closed orders.</p></div></div><div class="acquisition-empty-state"><h4>No recently completed acquisitions activity</h4><p class="muted">Completed receiving, donation review, and activation work will appear here.</p></div>`;
  return `<div class="panel-header compact acquisitions-stage-header"><div><h3>Completed</h3><p class="muted">Closure for the workflow: activated items, finished receiving, donation outcomes, and closed orders.</p></div></div><div class="acquisition-card-grid acquisition-card-grid-compact">${completedRows.map((entry) => `<article class="acquisition-stage-card"><div class="acquisition-stage-card-top"><div><h4>${entry.label}</h4><p class="muted">${entry.context}</p></div>${getAcquisitionStatusBadge(entry.type.includes("Order") ? "Closed" : "Activated")}</div><div class="acquisition-detail-grid"><div><span class="status-label">Completed action</span><strong>${entry.type}</strong></div><div><span class="status-label">Date completed</span><strong>${formatShortDate(entry.date)}</strong></div><div><span class="status-label">Relative time</span><strong>${formatRelativeAge(new Date(entry.date || 0).getTime())}</strong></div></div>${entry.orderId && entry.closed ? `<div class="row-actions"><button class="button button-secondary" type="button" data-acq-reopen-order="${entry.orderId}">Reopen order</button></div>` : ``}</article>`).join("")}</div>`;
}

function renderAcquisitionsWorkspace() {
  renderAcquisitionSummaryCards();
  renderAcquisitionStageNav();
  if (!els.acquisitionsStageContent) return;
  const workflow = getAcquisitionWorkflowData();
  const meta = getAcquisitionStageMeta()[state.acquisitionsStage] || getAcquisitionStageMeta().orders;
  if (els.acquisitionsStatusLine) {
    els.acquisitionsStatusLine.textContent = `${workflow.openOrders.length} open orders · ${workflow.awaitingReceipt.length} awaiting receipt · ${workflow.donationWorkflow.awaitingReviewCount} donation items awaiting review · ${workflow.pending.length} pending materials · ${workflow.completedMaterials.length + workflow.donationWorkflow.activatedCount} activated`;
  }
  const stageContent = { orders: renderOrdersStage(workflow), receiving: renderReceivingStage(workflow), donations: renderDonationsStage(workflow), pending: renderPendingStage(workflow), completed: renderCompletedStage(workflow) };
  els.acquisitionsStageContent.innerHTML = `<div class="acquisition-stage-shell" data-stage="${state.acquisitionsStage}"><div class="sr-only">${meta.label}</div>${stageContent[state.acquisitionsStage] || stageContent.orders}</div>`;
  bindAcquisitionStageEvents();
}

function bindAcquisitionStageEvents() {
  document.querySelectorAll("[data-acq-nav-stage]").forEach((button) => button.addEventListener("click", () => setAcquisitionStage(button.dataset.acqNavStage)));
  document.querySelectorAll("[data-acq-focus-form]").forEach((button) => button.addEventListener("click", () => {
    setAcquisitionStage("orders");
    window.requestAnimationFrame(() => document.querySelector("#acqOrderName")?.focus());
  }));
  document.querySelectorAll("[data-acq-focus-donation-batch]").forEach((button) => button.addEventListener("click", () => {
    setAcquisitionStage("donations");
    window.requestAnimationFrame(() => document.querySelector("#donationBatchName")?.focus());
  }));
  document.querySelectorAll("[data-acq-focus-donation-item]").forEach((button) => button.addEventListener("click", () => {
    setAcquisitionStage("donations");
    window.requestAnimationFrame(() => document.querySelector('#donationItemForm [name="itemTitle"]')?.focus());
  }));
  document.querySelector("#acquisitionItemForm")?.addEventListener("submit", addAcquisitionItem);
  document.querySelector("#donationBatchForm")?.addEventListener("submit", addDonationBatch);
  document.querySelector("#donationItemForm")?.addEventListener("submit", addDonationItem);
  document.querySelectorAll("[data-acq-receive]").forEach((button) => button.addEventListener("click", () => markMaterialReceived(button.dataset.acqReceive)));
  document.querySelectorAll("[data-acq-receive-all]").forEach((button) => button.addEventListener("click", () => markMaterialReceived(button.dataset.acqReceiveAll, true)));
  document.querySelectorAll("[data-acq-undo-receipt]").forEach((button) => button.addEventListener("click", () => undoReceipt(button.dataset.acqUndoReceipt)));
  document.querySelectorAll("[data-acq-send-pending]").forEach((button) => button.addEventListener("click", () => sendMaterialToPending(button.dataset.acqSendPending)));
  document.querySelectorAll("[data-acq-activate]").forEach((button) => button.addEventListener("click", () => activatePendingMaterial(button.dataset.acqActivate)));
  document.querySelectorAll("[data-acq-remove]").forEach((button) => button.addEventListener("click", () => removePendingMaterial(button.dataset.acqRemove)));
  document.querySelectorAll("[data-acq-close-order]").forEach((button) => button.addEventListener("click", () => closeOrder(button.dataset.acqCloseOrder)));
  document.querySelectorAll("[data-acq-reopen-order]").forEach((button) => button.addEventListener("click", () => reopenOrder(button.dataset.acqReopenOrder)));
  document.querySelectorAll("[data-donation-open-batch]").forEach((button) => button.addEventListener("click", () => { state.activeDonationBatchId = button.dataset.donationOpenBatch; setAcquisitionStage("donations"); }));
  document.querySelectorAll("[data-donation-edit-batch]").forEach((button) => button.addEventListener("click", () => editDonationBatch(button.dataset.donationEditBatch)));
  document.querySelectorAll("[data-donation-edit-item]").forEach((button) => button.addEventListener("click", () => editDonationItem(button.dataset.donationEditItem)));
  document.querySelectorAll("[data-donation-ack]").forEach((button) => button.addEventListener("click", () => markDonationAcknowledgmentSent(button.dataset.donationAck)));
  document.querySelectorAll("[data-donation-archive-batch]").forEach((button) => button.addEventListener("click", () => archiveDonationBatch(button.dataset.donationArchiveBatch)));
  document.querySelectorAll("[data-donation-filter]").forEach((button) => button.addEventListener("click", () => { state.donationFilter = button.dataset.donationFilter; state.acquisitionsStage = "donations"; renderAcquisitionsWorkspace(); }));
  document.querySelectorAll("[data-donation-item-action]").forEach((button) => button.addEventListener("click", () => {
    const actions = { "under-review": ["Under Review", ""], accepted: ["Accepted for Collection", ""], rejected: ["Rejected", "Rejected"], sale: ["Sent to Sale", "Book Sale"], disposed: ["Disposed", "Disposed"], returned: ["Returned", "Returned to Donor"] };
    const [reviewStatus, disposition] = actions[button.dataset.donationItemAction] || ["Under Review", ""];
    setDonationItemStatus(button.dataset.donationItemId, reviewStatus, disposition);
  }));
  document.querySelectorAll("[data-donation-send-pending]").forEach((button) => button.addEventListener("click", () => sendDonationItemToPending(button.dataset.donationSendPending)));
  document.querySelector('select[name="batchIdSelect"]')?.addEventListener("change", (event) => { state.activeDonationBatchId = event.target.value; });
  els.acqCoverUpload = document.querySelector("#acqCoverUpload");
  els.acqCoverUrl = document.querySelector("#acqCoverUrl");
  if (els.acqCoverUpload) els.acqCoverUpload.addEventListener("change", handleAcquisitionCoverUpload);
}

function getManagedMaterialTypes() {
  return [...new Set([...(state.settings.materialTypes || []), ...DEFAULT_MATERIAL_TYPES, ...state.records.map((r) => r.materialType).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
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

function fillMaterialTypes() {
  const managed = getManagedMaterialTypes();
  const current = els.materialTypeSelect?.value || "";
  if (els.materialTypeSelect) {
    els.materialTypeSelect.innerHTML = ['<option value="">Unspecified</option>', ...managed.map((materialType) => `<option value="${materialType}">${materialType}</option>`)].join("");
    els.materialTypeSelect.value = managed.includes(current) ? current : "";
  }
  renderManagedList(els.materialTypeList, managed, MANAGED_LIST_CONFIG.materialTypes, renameMaterialType, deleteMaterialType);
}

function fillGenres() {
  const managed = getManagedGenres();
  const options = managed.map((g) => `<option value="${g}">${g}</option>`).join("");
  $("#genres").innerHTML = options;
  renderManagedList(els.genreList, managed, MANAGED_LIST_CONFIG.genres, renameGenre, deleteGenre);
}

function fillFormats() {
  const managed = getManagedFormats();
  const current = els.formatSelect.value || "";
  els.formatSelect.innerHTML = managed.map((format) => `<option value="${format}">${format}</option>`).join("");
  els.formatSelect.value = managed.includes(current) ? current : (managed[0] || "Other");
  renderManagedList(els.formatList, managed, MANAGED_LIST_CONFIG.formats, renameFormat, deleteFormat);
}

function fillBindings() {
  const managed = getManagedBindings();
  const current = els.bindingSelect.value || "";
  els.bindingSelect.innerHTML = ['<option value="">None</option>', ...managed.map((binding) => `<option value="${binding}">${binding}</option>`)].join("");
  els.bindingSelect.value = managed.includes(current) ? current : "";
  renderManagedList(els.bindingList, managed, MANAGED_LIST_CONFIG.bindings, renameBinding, deleteBinding);
}

function fillLocations() {
  const managed = getManagedLocations();
  const current = els.locationSelect?.value || "";
  if (els.locationSelect) {
    els.locationSelect.innerHTML = ['<option value="">Unspecified</option>', ...managed.map((location) => `<option value="${location}">${location}</option>`)].join("");
    els.locationSelect.value = managed.includes(current) ? current : "";
  }
  renderManagedList(els.locationList, managed, MANAGED_LIST_CONFIG.locations, renameLocation, deleteLocation);
}

function fillCuratedShelves() {
  const managed = getManagedCuratedShelves();
  const current = els.curatedShelfSelect.value || "";
  els.curatedShelfSelect.innerHTML = ['<option value="">None</option>', ...managed.map((shelf) => `<option value="${shelf}">${shelf}</option>`)].join("");
  els.curatedShelfSelect.value = managed.includes(current) ? current : "";
  renderManagedList(els.curatedShelfList, managed, MANAGED_LIST_CONFIG.curatedShelves, renameCuratedShelf, deleteCuratedShelf);
}

function setManagedMessage(config, message = "") {
  if (!config) return;
  const target = els[config.errorEl];
  if (target) target.textContent = message;
}

function getManagedUsageCount(key, value) {
  if (key === "materialTypes") return state.records.filter((record) => record.materialType === value).length;
  if (key === "genres") return state.records.filter((record) => asArray(record.genres?.length ? record.genres : record.genre).includes(value)).length;
  if (key === "formats") return state.records.filter((record) => record.format === value).length;
  if (key === "locations") return state.records.reduce((count, record) => count + (record.location === value ? 1 : 0) + (record.holdings || []).filter((holding) => holding.location === value).length, 0);
  if (key === "curatedShelves") return state.records.filter((record) => record.curatedShelf === value).length;
  if (key === "bindings") return state.records.filter((record) => record.binding === value).length;
  return 0;
}

function renderManagedList(listEl, values, config, onRename, onDelete) {
  if (!listEl) return;
  listEl.innerHTML = "";
  setManagedMessage(config, "");
  const countEl = document.getElementById(config.countId);
  if (countEl) countEl.textContent = `${values.length} value${values.length === 1 ? "" : "s"}`;
  if (!values.length) {
    listEl.innerHTML = `<li class="managed-empty">No ${config.label}s yet.</li>`;
    return;
  }
  values.forEach((value) => {
    const li = document.createElement("li");
    const usage = getManagedUsageCount(config.key, value);
    li.className = "managed-item";
    li.innerHTML = `
      <div class="managed-item-main">
        <div>
          <strong>${value}</strong>
          <p class="muted">Usage count: ${usage}</p>
        </div>
        <div class="managed-item-actions">
          <button class="button button-secondary" data-act="rename" type="button">Edit</button>
          <button class="button button-secondary" data-act="delete" type="button">Delete</button>
        </div>
      </div>
      <div class="managed-inline-edit hidden">
        <input type="text" value="${value}" aria-label="Edit ${config.label}" />
        <button class="button button-secondary" data-act="save" type="button">Save</button>
        <button class="button button-secondary" data-act="cancel" type="button">Cancel</button>
      </div>`;
    const inline = li.querySelector(".managed-inline-edit");
    li.querySelector('[data-act="rename"]').addEventListener("click", () => inline.classList.remove("hidden"));
    li.querySelector('[data-act="cancel"]').addEventListener("click", () => inline.classList.add("hidden"));
    li.querySelector('[data-act="save"]').addEventListener("click", () => {
      const next = inline.querySelector("input")?.value.trim() || "";
      if (!next || next === value) {
        inline.classList.add("hidden");
        return;
      }
      onRename(value, next);
    });
    li.querySelector('[data-act="delete"]').addEventListener("click", () => onDelete(value));
    listEl.appendChild(li);
  });
}

function addToManagedList(key, inputEl, fillFn) {
  const value = inputEl.value.trim();
  const config = MANAGED_LIST_CONFIG[key];
  if (!value) {
    setManagedMessage(config, `Enter a ${config.label} before saving.`);
    return false;
  }
  const existingValues = ({
    materialTypes: getManagedMaterialTypes,
    genres: getManagedGenres,
    formats: getManagedFormats,
    locations: getManagedLocations,
    curatedShelves: getManagedCuratedShelves,
    bindings: getManagedBindings,
  }[key] || (() => []))();
  if (existingValues.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
    setManagedMessage(config, `${value} already exists.`);
    return false;
  }
  const set = new Set(state.settings[key] || []);
  set.add(value);
  state.settings[key] = [...set].sort((a, b) => a.localeCompare(b));
  saveSettings(state.settings);
  inputEl.value = "";
  setManagedMessage(config, "");
  fillFn();
  return true;
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

function addMaterialType() {
  const value = els.newMaterialTypeInput.value.trim();
  if (!value) return;
  if (!addToManagedList("materialTypes", els.newMaterialTypeInput, fillMaterialTypes)) return;
  if (!getCirculationRules().some((rule) => rule.materialType === value)) {
    saveCirculationRules([...getCirculationRules(), { materialType: value, loanDays: 21 }]);
  }
  renderCirculationRulesTable();
}
function addGenre() { addToManagedList("genres", els.newGenreInput, fillGenres); }
function addFormat() { addToManagedList("formats", els.newFormatInput, fillFormats); }
function addLocation() { addToManagedList("locations", els.newLocationInput, fillLocations); }
function addCuratedShelf() { addToManagedList("curatedShelves", els.newCuratedShelfInput, fillCuratedShelves); }
function addBinding() { addToManagedList("bindings", els.newBindingInput, fillBindings); }

function renameMaterialType(prev, next) {
  if (!next) return setManagedMessage(MANAGED_LIST_CONFIG.materialTypes, "Material type name cannot be empty.");
  if (getManagedMaterialTypes().some((value) => value !== prev && value.toLowerCase() === next.toLowerCase())) return setManagedMessage(MANAGED_LIST_CONFIG.materialTypes, `${next} already exists.`);
  renameInRecords("materialType", prev, next);
  renameInSettings("materialTypes", prev, next);
  const rules = getCirculationRules().map((rule) => (rule.materialType === prev ? { ...rule, materialType: next } : rule));
  saveCirculationRules(rules);
  render();
}

function deleteMaterialType(target) {
  if (!window.confirm(`Delete material type "${target}"?`)) return;
  removeFromSettings("materialTypes", target);
  saveCirculationRules(getCirculationRules().filter((rule) => rule.materialType !== target));
  render();
}

function updateCirculationRule(materialType, loanDays) {
  const rules = getCirculationRules().filter((rule) => rule.materialType !== materialType);
  if (Number(loanDays) > 0) rules.push({ materialType, loanDays: Number(loanDays) });
  saveCirculationRules(rules);
  renderCirculationRulesTable();
}

function renderCirculationRulesTable() {
  if (!els.circulationRulesBody) return;
  const managed = getManagedMaterialTypes();
  const rulesByType = new Map(getCirculationRules().map((rule) => [rule.materialType, rule.loanDays]));
  els.circulationRulesBody.innerHTML = "";
  managed.forEach((materialType) => {
    const tr = document.createElement("tr");
    const loanDays = rulesByType.get(materialType) || "";
    tr.innerHTML = `<td>${materialType}</td><td><input type="number" min="1" step="1" value="${loanDays}" aria-label="${materialType} loan days" /></td><td><button class="button button-secondary" type="button">Save Rule</button></td>`;
    const input = tr.querySelector("input");
    tr.querySelector("button").addEventListener("click", () => updateCirculationRule(materialType, input.value));
    els.circulationRulesBody.appendChild(tr);
  });
}

function renameGenre(prev, next) {
  if (!next) return setManagedMessage(MANAGED_LIST_CONFIG.genres, "Genre name cannot be empty.");
  if (getManagedGenres().some((value) => value !== prev && value.toLowerCase() === next.toLowerCase())) return setManagedMessage(MANAGED_LIST_CONFIG.genres, `${next} already exists.`);
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
  if (!window.confirm(`Delete genre "${target}"?`)) return;
  state.records = state.records.map((record) => {
    const genres = asArray(record.genres?.length ? record.genres : record.genre).filter((g) => g !== target);
    return { ...record, genres, genre: genres.join(", ") };
  });
  removeFromSettings("genres", target);
  saveRecords(state.records);
  render();
}

function renameFormat(prev, next) {
  if (!next) return setManagedMessage(MANAGED_LIST_CONFIG.formats, "Format name cannot be empty.");
  if (getManagedFormats().some((value) => value !== prev && value.toLowerCase() === next.toLowerCase())) return setManagedMessage(MANAGED_LIST_CONFIG.formats, `${next} already exists.`);
  renameInRecords("format", prev, next);
  renameInSettings("formats", prev, next);
  render();
}

function deleteFormat(target) {
  if (!window.confirm(`Delete format "${target}"?`)) return;
  removeFromSettings("formats", target);
  fillFormats();
}

function renameLocation(prev, next) {
  if (!next) return setManagedMessage(MANAGED_LIST_CONFIG.locations, "Location name cannot be empty.");
  if (getManagedLocations().some((value) => value !== prev && value.toLowerCase() === next.toLowerCase())) return setManagedMessage(MANAGED_LIST_CONFIG.locations, `${next} already exists.`);
  renameInRecords("location", prev, next);
  renameInSettings("locations", prev, next);
  render();
}

function deleteLocation(target) {
  if (!window.confirm(`Delete location "${target}"?`)) return;
  removeFromSettings("locations", target);
  fillLocations();
}

function renameCuratedShelf(prev, next) {
  if (!next) return setManagedMessage(MANAGED_LIST_CONFIG.curatedShelves, "Curated shelf name cannot be empty.");
  if (getManagedCuratedShelves().some((value) => value !== prev && value.toLowerCase() === next.toLowerCase())) return setManagedMessage(MANAGED_LIST_CONFIG.curatedShelves, `${next} already exists.`);
  renameInRecords("curatedShelf", prev, next);
  renameInSettings("curatedShelves", prev, next);
  render();
}

function deleteCuratedShelf(target) {
  if (!window.confirm(`Delete curated shelf "${target}"?`)) return;
  removeFromSettings("curatedShelves", target);
  fillCuratedShelves();
}

function renameBinding(prev, next) {
  if (!next) return setManagedMessage(MANAGED_LIST_CONFIG.bindings, "Binding name cannot be empty.");
  if (getManagedBindings().some((value) => value !== prev && value.toLowerCase() === next.toLowerCase())) return setManagedMessage(MANAGED_LIST_CONFIG.bindings, `${next} already exists.`);
  renameInRecords("binding", prev, next);
  renameInSettings("bindings", prev, next);
  render();
}

function deleteBinding(target) {
  if (!window.confirm(`Delete binding "${target}"?`)) return;
  removeFromSettings("bindings", target);
  fillBindings();
}

function resetForm() {
  els.recordForm.reset();
  if (els.coverUploadStatus) els.coverUploadStatus.textContent = "";
  $("#recordId").value = "";
  $("#format").value = "Book";
  $("#binding").value = "";
  $("#curatedShelf").value = "";
  state.draftHoldings = [sanitizeHolding()];
  renderHoldingsEditor(state.draftHoldings);
  els.duplicateWarning.textContent = "";
  switchRecordTab("basic");
  setFormDirty(false);
  setRecordSaveMessage("");
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
  setRecordSaveMessage("");
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
  state.draftHoldings = (record.holdings || []).map((holding) => sanitizeHolding(holding));
  renderHoldingsEditor(state.draftHoldings);
  checkDuplicateDraft();
  setActiveWorkspaceRecord(record.id);
  switchIlsTab("records");
  switchRecordTab("basic");
  setFormDirty(false);
}

function saveFormRecord(event) {
  event.preventDefault();
  const id = $("#recordId").value || crypto.randomUUID();
  const dateAdded = $("#dateAdded").value || new Date().toISOString().slice(0, 10);
  const selectedGenres = [...$("#genres").selectedOptions].map((option) => option.value);
  const custom = $("#genre").value.trim();
  const genres = [...new Set([...selectedGenres, ...(custom ? [custom] : [])])];
  const holdings = collectDraftHoldings();
  const primaryHolding = holdings[0] || sanitizeHolding();

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
    materialType: $("#materialType").value.trim(),
    subjects: $("#subjects").value.trim(),
    summaryNote: $("#summaryNote").value.trim(),
    targetAudience: $("#targetAudience").value.trim(),
    bibliographyNote: $("#bibliographyNote").value.trim(),
    description: $("#description").value.trim(),
    location: primaryHolding.location,
    callNumber: primaryHolding.callNumber,
    accessionNumber: primaryHolding.accessionNumber,
    materialNumbers: holdings.flatMap((holding) => holding.materialNumbers || []),
    status: primaryHolding.status || "Available",
    dateAcquired: primaryHolding.dateAcquired,
    dateAdded,
    source: primaryHolding.source,
    pricePaid: primaryHolding.pricePaid,
    retailPrice: primaryHolding.retailPrice,
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
    updatedAt: Date.now(),
    holdings,
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
  setFormDirty(false);
  resetForm();
  setRecordSaveMessage(`Record saved for ${record.title || "Untitled record"}.`, "success");
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

function recordFieldIsMissing(record, field) {
  if (field === "materialNumbers") return !Array.isArray(record.materialNumbers) || !record.materialNumbers.some((value) => String(value || "").trim());
  return !String(record?.[field] || "").trim();
}


function setPatronFeeMessage(message, isError = false) {
  if (!els.patronFeeMessage) return;
  els.patronFeeMessage.textContent = message;
  els.patronFeeMessage.classList.toggle('warning', isError);
}

function addFeeToSelectedPatron(event) {
  event.preventDefault();
  const patron = getPatrons().find((entry) => entry.id === state.selectedPatronId);
  if (!patron) {
    setPatronFeeMessage('Select a patron before adding a fine or fee.', true);
    return;
  }
  const entry = normalizeFeeEntry({
    patronId: patron.id,
    patronName: patron.name,
    patronCardNumber: patron.cardNumber,
    category: els.feeCategory?.value,
    dateAssessed: els.feeDateAssessed?.value || todayIso(),
    amount: els.feeAmount?.value,
    description: els.feeDescription?.value,
    status: els.feeStatus?.value,
  });
  saveFeeEntries([entry, ...getFeeEntries()]);
  els.patronFeeForm?.reset();
  populateStaticSelects();
  setPatronFeeMessage(`Added ${entry.category.toLowerCase()} for ${patron.name}.`);
  renderPatronsTable();
  renderPatronDetail();
  renderStatsPanel();
  renderDashboard();
}

function updateFeeStatus(feeId, status) {
  const current = getFeeEntries().map((entry) => {
    if (entry.id !== feeId) return normalizeFeeEntry(entry);
    const normalized = normalizeFeeEntry(entry);
    let amountPaid = normalized.amountPaid;
    let paymentHistory = [...normalized.paymentHistory];
    if (status === 'Paid' && normalized.remainingAmount > 0) {
      amountPaid = normalized.amount;
      paymentHistory = [...paymentHistory, { date: todayIso(), amount: normalized.remainingAmount, method: 'Staff mark paid' }];
      const registerEntries = getRegisterTransactions();
      registerEntries.unshift({ id: `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, date: todayIso(), amount: normalized.remainingAmount, category: 'Fines / Fees', paymentType: 'Patron account', staffInitials: '', donationPurpose: '', notes: `Payment for fee ${normalized.id} (${normalized.patronName})`, linkedFeeId: normalized.id, createdAt: Date.now() });
      saveRegisterTransactions(registerEntries);
    }
    if (status === 'Waived') amountPaid = normalized.amountPaid;
    return normalizeFeeEntry({ ...normalized, status, amountPaid, paymentHistory, updatedAt: Date.now() });
  });
  saveFeeEntries(current);
  renderPatronsTable();
  renderPatronDetail();
  renderRegisterWorkspace();
  renderStatsPanel();
  renderDashboard();
}

function renderWeedingReport() {
  if (!els.weedingReportWrap || !els.weedingSummary) return;
  populateReportSelect(els.weedingLocationFilter, [...new Set(state.records.map(getRecordShelfLocation).filter(Boolean))].sort((a, b) => a.localeCompare(b)), 'All locations');
  populateReportSelect(els.weedingMaterialTypeFilter, [...new Set(state.records.map((record) => record.materialType || record.format || 'Other').filter(Boolean))].sort((a, b) => a.localeCompare(b)), 'All material types');
  populateReportSelect(els.weedingStatusFilter, getManagedStatusValues(), 'All statuses');
  populateReportSelect(els.weedingAudienceFilter, getManagedAudienceValues(), 'All audiences');
  const { rows, cutoff } = getFilteredWeedingRows();
  els.weedingSummary.textContent = rows.length
    ? `${rows.length} item${rows.length === 1 ? '' : 's'} have no circulation since ${cutoff.toLocaleDateString()}.`
    : 'No items match the selected inactivity period.';
  if (!state.records.length) {
    els.weedingReportWrap.innerHTML = '<div class="empty-state">No circulation data available yet.</div>';
    return;
  }
  if (!rows.length) {
    els.weedingReportWrap.innerHTML = '<div class="empty-state">No inactive items found for this period. Try a longer time frame or broader filters.</div>';
    return;
  }
  els.weedingReportWrap.innerHTML = `<div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Title</th><th>Author</th><th>Barcode / Item ID</th><th>Call Number</th><th>Shelf Location</th><th>Material Type</th><th>Lifetime Checkouts</th><th>Last Checkout</th><th>Status</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.title)}</td><td>${escapeHtml(row.author)}</td><td>${escapeHtml(row.barcode || '—')}</td><td>${escapeHtml(row.callNumber || '—')}</td><td>${escapeHtml(row.location)}</td><td>${escapeHtml(row.materialType)}</td><td>${row.totalCheckouts}</td><td>${escapeHtml(row.lastCheckoutDate ? formatDisplayDate(row.lastCheckoutDate) : 'Never')}</td><td>${escapeHtml(row.status)}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderBusiestHoursReport() {
  if (!els.busiestHoursReport) return;
  ensureCounterLogBackfill('visitor');
  const { start, end } = getTrafficDateRange();
  const entries = getCounterLog('visitor').filter((entry) => {
    const date = new Date(entry.timestamp);
    return Number.isFinite(date.getTime()) && date >= start && date <= end;
  });
  if (!entries.length) {
    els.busiestHoursReport.innerHTML = '<div class="empty-state">Not enough visitor activity has been recorded yet to generate this report.</div>';
    return;
  }
  const grouped = groupVisitsByHourAndDay(entries);
  const topHour = grouped.byHour[0];
  const topCombo = grouped.byDayHour[0];
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  const heatRows = weekdayOrder.map((day) => `<tr><th>${day}</th>${hours.map((hour) => {
    const hit = grouped.byDayHour.find((entry) => entry.day === day && entry.hour === hour);
    const count = hit?.count || 0;
    const max = topCombo?.count || 1;
    const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
    return `<td class="heat-${level}">${count || '—'}</td>`;
  }).join('')}</tr>`).join('');
  const barList = grouped.byHour.slice(0, 8).map((row) => `<li><span>${escapeHtml(row.hourBlock)}</span><div class="bar-track"><div class="bar-fill" style="width:${(row.count / topHour.count) * 100}%"></div></div><strong>${row.count}</strong></li>`).join('');
  els.busiestHoursReport.innerHTML = `
    <div class="mini-summary-grid">
      <article class="traffic-card"><span class="summary-card-label">Selected range</span><strong>${start.toLocaleDateString()} – ${end.toLocaleDateString()}</strong></article>
      <article class="traffic-card"><span class="summary-card-label">Busiest hour</span><strong>${escapeHtml(topHour.hourBlock)}</strong><span>${topHour.count} visits</span></article>
      <article class="traffic-card"><span class="summary-card-label">Busiest day/hour</span><strong>${escapeHtml(topCombo.day)} ${new Date(2000,0,1,topCombo.hour).toLocaleTimeString([], { hour: 'numeric' })}</strong><span>${topCombo.count} visits</span></article>
    </div>
    <section class="report-split-grid">
      <div class="report-card"><h4>Busiest Hour of Day</h4><ul class="bar-list">${barList}</ul></div>
      <div class="report-card"><h4>Busiest Day / Hour Combination</h4><div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Day</th><th>Hour Block</th><th>Visit Count</th></tr></thead><tbody>${grouped.byDayHour.slice(0, 12).map((row) => `<tr><td>${escapeHtml(row.day)}</td><td>${escapeHtml(row.hourBlock)}</td><td>${row.count}</td></tr>`).join('')}</tbody></table></div></div>
    </section>
    <section class="report-card heatmap-grid"><h4>Traffic by day and hour</h4><p class="report-note">Visitor clicks are stored with timestamps for this report; older daily-only counts are backfilled at noon for best-effort reporting.</p><table class="serials-table"><thead><tr><th>Day</th>${hours.map((hour) => `<th>${new Date(2000,0,1,hour).toLocaleTimeString([], { hour: 'numeric' })}</th>`).join('')}</tr></thead><tbody>${heatRows}</tbody></table></section>`;
}

function renderMostBorrowedAuthorsReport() {
  if (!els.authorReportWrap || !els.authorReportSummary) return;
  populateReportSelect(els.authorLocationFilter, [...new Set(state.records.map(getRecordShelfLocation).filter(Boolean))].sort((a, b) => a.localeCompare(b)), 'All locations');
  populateReportSelect(els.authorMaterialTypeFilter, [...new Set(state.records.map((record) => record.materialType || record.format || 'Other').filter(Boolean))].sort((a, b) => a.localeCompare(b)), 'All material types');
  populateReportSelect(els.authorAudienceFilter, getManagedAudienceValues(), 'All audiences');
  const rows = getBorrowedAuthorRows();
  els.authorReportSummary.textContent = rows.length ? `${rows.length} author group${rows.length === 1 ? '' : 's'} have circulation history in the selected filters.` : 'No circulation history is available to calculate author borrowing totals.';
  if (!rows.length) {
    els.authorReportWrap.innerHTML = '<div class="empty-state">No circulation history available for authors. Once items circulate, top authors will appear here.</div>';
    return;
  }
  els.authorReportWrap.innerHTML = `<div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Author</th><th>Total Checkouts</th><th>Titles / Items</th><th>Most Recent Checkout</th><th>Top Title</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.author)}</td><td>${row.totalCheckouts}</td><td>${row.titleCount}</td><td>${escapeHtml(row.mostRecentCheckout ? formatDisplayDate(row.mostRecentCheckout) : '—')}</td><td>${escapeHtml(row.topTitle || '—')}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderSectionUsageReport() {
  if (!els.sectionUsageWrap || !els.sectionUsageSummary) return;
  const { list, totals } = getSectionUsageRows();
  els.sectionUsageSummary.textContent = list.length ? `${list.length} section${list.length === 1 ? '' : 's'} compared against ${totals.items} total items.` : 'No section usage data is available yet.';
  if (!list.length) {
    els.sectionUsageWrap.innerHTML = '<div class="empty-state">No section usage data is available yet.</div>';
    return;
  }
  els.sectionUsageWrap.innerHTML = `<div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Section</th><th>Total Items</th><th>Total Checkouts</th><th>Average / Item</th><th>Last Activity</th><th>Collection %</th><th>Circulation %</th><th>Use Level</th></tr></thead><tbody>${list.map((row) => `<tr><td>${escapeHtml(row.section)}</td><td>${row.itemCount}</td><td>${row.totalCheckouts}</td><td>${row.averageCheckouts.toFixed(2)}</td><td>${escapeHtml(row.lastActivity ? formatDisplayDate(row.lastActivity) : 'No circulation yet')}</td><td>${row.collectionShare.toFixed(1)}%</td><td>${row.circulationShare.toFixed(1)}%</td><td><span class="usage-indicator ${row.usageBand === 'underused' ? 'low' : row.usageBand === 'moderate' ? 'medium' : 'high'}">${escapeHtml(row.usageBand)}</span></td></tr>`).join('')}</tbody></table></div>`;
}

function renderFinesFeesReport() {
  if (!els.finesFeesReports) return;
  populateReportSelect(els.feeReportPatronFilter, getPatrons().map((patron) => patron.id), 'All patrons');
  const patronOptions = getPatrons();
  if (els.feeReportPatronFilter) {
    const current = els.feeReportPatronFilter.value || 'all';
    els.feeReportPatronFilter.innerHTML = ['<option value="all">All patrons</option>', ...patronOptions.map((patron) => `<option value="${patron.id}">${escapeHtml(patron.name || patron.cardNumber || patron.id)}</option>`)].join('');
    els.feeReportPatronFilter.value = patronOptions.some((patron) => patron.id === current) || current === 'all' ? current : 'all';
  }
  const summary = summarizeFinesFees({
    status: els.feeReportStatusFilter?.value || 'unpaid-only',
    category: els.feeReportCategoryFilter?.value || 'all',
    patronId: els.feeReportPatronFilter?.value || 'all',
    startDate: els.feeReportStartDate?.value || '',
    endDate: els.feeReportEndDate?.value || '',
  });
  if (!summary.rows.length) {
    els.finesFeesReports.innerHTML = '<div class="empty-state">No fines or fees have been assessed for the selected filters.</div>';
    return;
  }
  const outstandingTotal = summary.byPatron.reduce((sum, row) => sum + row.unpaidAmount, 0);
  els.finesFeesReports.innerHTML = `
    <div class="mini-summary-grid">
      <article class="fee-balance-card"><span class="summary-card-label">Outstanding balances</span><strong>${summary.byPatron.filter((row) => row.unpaidAmount > 0).length}</strong><span>patron accounts</span></article>
      <article class="fee-balance-card"><span class="summary-card-label">Total unpaid amount</span><strong>${formatCurrency(outstandingTotal)}</strong><span>across filtered charges</span></article>
      <article class="fee-balance-card"><span class="summary-card-label">Fee entries</span><strong>${summary.rows.length}</strong><span>matching current filters</span></article>
    </div>
    <section class="report-card"><h4>Patrons with outstanding balances</h4>${summary.byPatron.length ? `<div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Patron Name</th><th>Card Number</th><th>Total Balance</th><th>Unpaid Amount</th><th>Outstanding Charges</th></tr></thead><tbody>${summary.byPatron.filter((row) => row.unpaidAmount > 0).map((row) => `<tr><td>${escapeHtml(row.patronName)}</td><td>${escapeHtml(row.cardNumber || '—')}</td><td>${formatCurrency(row.totalBalance)}</td><td>${formatCurrency(row.unpaidAmount)}</td><td>${row.outstandingCharges}</td></tr>`).join('') || '<tr><td colspan="5">No patrons currently have outstanding balances.</td></tr>'}</tbody></table></div>` : '<div class="empty-state">No patrons currently have outstanding balances.</div>'}</section>
    <section class="report-card"><h4>Fee detail</h4><div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Patron</th><th>Date Assessed</th><th>Category</th><th>Amount</th><th>Status</th><th>Description</th></tr></thead><tbody>${summary.rows.map((row) => `<tr><td>${escapeHtml(row.patronName || row.patron?.name || 'Unknown patron')}</td><td>${escapeHtml(row.dateAssessed)}</td><td>${escapeHtml(row.category)}</td><td>${formatCurrency(row.amount)}</td><td>${escapeHtml(row.status)}</td><td>${escapeHtml(row.description || '—')}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="report-split-grid"><div class="report-card"><h4>Fines / fees by category</h4>${summary.byCategory.length ? `<ul class="totals-list">${summary.byCategory.map(([category, amount]) => `<li><span>${escapeHtml(category)}</span><strong>${formatCurrency(amount)}</strong></li>`).join('')}</ul>` : '<div class="empty-state">No category totals available yet.</div>'}</div><div class="report-card"><h4>Monthly assessed / paid</h4>${summary.monthly.length ? `<div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Month</th><th>Assessed</th><th>Paid</th></tr></thead><tbody>${summary.monthly.map(([month, row]) => `<tr><td>${formatMonthLabel(month)}</td><td>${formatCurrency(row.assessed)}</td><td>${formatCurrency(row.paid)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">No monthly fines or fees data is available yet.</div>'}</div></section>`;
}

function renderEnhancedReports() {
  renderWeedingReport();
  renderBusiestHoursReport();
  renderMostBorrowedAuthorsReport();
  renderSectionUsageReport();
  renderFinesFeesReport();
}

function renderMissingBiblioReport() {
  if (!els.missingReportBody || !els.missingReportSummary || !els.missingFieldSelect) return;
  const field = els.missingFieldSelect.value || "location";
  const label = MISSING_REPORT_FIELDS[field] || field;
  const matches = state.records.filter((record) => recordFieldIsMissing(record, field));

  els.missingReportSummary.textContent = matches.length
    ? `${matches.length} material${matches.length === 1 ? " is" : "s are"} currently missing ${label}.`
    : `No materials are currently missing ${label}.`;

  els.missingReportBody.innerHTML = "";
  if (!matches.length) {
    els.missingReportBody.innerHTML = `<tr><td colspan="5">No materials found for this report option.</td></tr>`;
    return;
  }

  matches
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((record) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${record.title || "Untitled"}</td><td>${record.creator || "Unknown creator"}</td><td>${record.format || "Other"}</td><td>${label}</td><td>${record.status || "Available"}</td>`;
      els.missingReportBody.appendChild(tr);
    });
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
  renderEnhancedReports();
  renderMissingBiblioReport();
  renderOverdueReport();
  renderOperationalReports();
}

function renderOverdueReport() {
  if (!els.overdueReportBody || !els.overdueReportSummary) return;
  const overdueLoans = getOverdueLoans(60);
  els.overdueReportSummary.textContent = overdueLoans.length
    ? `${overdueLoans.length} item${overdueLoans.length === 1 ? " is" : "s are"} 60+ days overdue.`
    : "No items are currently 60+ days overdue.";
  els.overdueReportBody.innerHTML = "";
  if (!overdueLoans.length) {
    els.overdueReportBody.innerHTML = '<tr><td colspan="5">No long-overdue items found.</td></tr>';
    return;
  }
  overdueLoans.forEach(({ record, holding, overdueDays }) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${record.title}</td><td>${holding.checkedOutToName || "Unknown patron"}</td><td>${holding.materialNumbers?.[0] || ""}</td><td>${holding.dueDate || ""}</td><td>${overdueDays}</td>`;
    els.overdueReportBody.appendChild(tr);
  });
}

function bindEvents() {

  els.recordForm.addEventListener("submit", saveFormRecord);
  els.recordForm.addEventListener("input", () => {
    setFormDirty(true);
    setRecordSaveMessage("");
    checkDuplicateDraft();
  });
  els.cancelEditBtn.addEventListener("click", () => {
    if (state.formDirty && !window.confirm("Discard unsaved changes?")) return;
    resetForm();
    setFormDirty(false);
    setRecordSaveMessage("");
  });
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
  if (els.patronFeeForm) els.patronFeeForm.addEventListener("submit", addFeeToSelectedPatron);
  if (els.serialIssueForm) els.serialIssueForm.addEventListener("submit", addSerialIssue);
  if (els.serialSubscriptionForm) els.serialSubscriptionForm.addEventListener("submit", saveSubscription);
  if (els.illOutgoingForm) els.illOutgoingForm.addEventListener("submit", saveOutgoingIll);
  if (els.illIncomingForm) els.illIncomingForm.addEventListener("submit", saveIncomingIll);
  if (els.registerForm) els.registerForm.addEventListener("submit", saveRegisterEntry);
  if (els.registerCategory) els.registerCategory.addEventListener("change", toggleDonationFields);
  if (els.registerDonationPurpose) els.registerDonationPurpose.addEventListener("change", toggleDonationFields);
  if (els.registerReportDate) els.registerReportDate.addEventListener("change", renderRegisterWorkspace);
  if (els.visitorCounterBtn) els.visitorCounterBtn.addEventListener("click", () => incrementDailyCounter("visitor"));
  if (els.referenceCounterBtn) els.referenceCounterBtn.addEventListener("click", () => incrementDailyCounter("reference"));
  if (els.checkOutForm) els.checkOutForm.addEventListener("submit", checkOutRecord);
  if (els.checkOutCardNumber) els.checkOutCardNumber.addEventListener("input", () => renderCheckoutPatronPreview());
  if (els.runMissingReportBtn) els.runMissingReportBtn.addEventListener("click", renderMissingBiblioReport);
  [els.weedingPreset, els.weedingCustomValue, els.weedingCustomUnit, els.weedingLocationFilter, els.weedingMaterialTypeFilter, els.weedingStatusFilter, els.weedingAudienceFilter, els.weedingSort, els.trafficRangePreset, els.trafficStartDate, els.trafficEndDate, els.authorStartDate, els.authorEndDate, els.authorLocationFilter, els.authorMaterialTypeFilter, els.authorAudienceFilter, els.authorSort, els.sectionSort, els.feeReportStatusFilter, els.feeReportCategoryFilter, els.feeReportPatronFilter, els.feeReportStartDate, els.feeReportEndDate].filter(Boolean).forEach((el) => el.addEventListener('input', renderStatsPanel));
  [els.weedingPreset, els.weedingLocationFilter, els.weedingMaterialTypeFilter, els.weedingStatusFilter, els.weedingAudienceFilter, els.weedingSort, els.trafficRangePreset, els.authorLocationFilter, els.authorMaterialTypeFilter, els.authorAudienceFilter, els.authorSort, els.sectionSort, els.feeReportStatusFilter, els.feeReportCategoryFilter, els.feeReportPatronFilter].filter(Boolean).forEach((el) => el.addEventListener('change', renderStatsPanel));
  if (els.queueCheckoutItemBtn) els.queueCheckoutItemBtn.addEventListener("click", queueCheckoutItem);
  if (els.addHoldingBtn) els.addHoldingBtn.addEventListener("click", () => {
    state.draftHoldings = [...collectDraftHoldings(), sanitizeHolding()];
    renderHoldingsEditor(state.draftHoldings);
  });
  if (els.checkOutMaterialNumber) els.checkOutMaterialNumber.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); queueCheckoutItem(); } });
  if (els.checkInForm) els.checkInForm.addEventListener("submit", checkInByMaterialNumber);
  if (els.holdForm) els.holdForm.addEventListener("submit", placeHold);
  els.circulationTabButtons.forEach((button) => button.addEventListener("click", () => switchCirculationTab(button.dataset.circulationTab)));
  els.ilsSectionButtons.forEach((btn) => btn.addEventListener("click", () => switchIlsSection(btn.dataset.ilsSection)));
  els.recordTabButtons.forEach((button) => button.addEventListener("click", () => switchRecordTab(button.dataset.recordTab)));
  window.addEventListener("beforeunload", (event) => {
    if (!state.formDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  els.addMaterialTypeBtn.addEventListener("click", addMaterialType);
  els.addGenreBtn.addEventListener("click", addGenre);
  els.addFormatBtn.addEventListener("click", addFormat);
  els.addLocationBtn.addEventListener("click", addLocation);
  els.addCuratedShelfBtn.addEventListener("click", addCuratedShelf);
  els.addBindingBtn.addEventListener("click", addBinding);
}

function render() {
  fillMaterialTypes();
  fillGenres();
  fillFormats();
  fillBindings();
  fillLocations();
  fillCuratedShelves();
  renderHoldingsEditor(collectDraftHoldings().length ? collectDraftHoldings() : state.draftHoldings);
  renderTable();
  renderPatronsTable();
  renderPatronDetail();
  renderSubscriptionsTable();
  renderSerialIssuesTable();
  renderAcquisitionsWorkspace();
  renderCheckoutQueue();
  renderCirculationRulesTable();
  renderLoansTable();
  renderHoldsTable();
  renderStatsPanel();
  renderDashboard();
  renderQuickCounters();
  renderIllWorkspace();
  renderRegisterWorkspace();
}

function init() {
  populateStaticSelects();
  toggleDonationFields();
  bindEvents();
  state.draftHoldings = [sanitizeHolding()];

  switchIlsSection("dashboard");
  switchCirculationTab("checkout");
  switchRecordTab("basic");
  renderCheckoutReceipt(null);
  updateCheckoutStatus();
  render();
  hydrateRemoteRecords();
}

init();
