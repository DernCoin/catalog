import { duplicateCandidates, PRELOADED_GENRES, FORMAT_OPTIONS, BINDING_OPTIONS, asArray, getStats } from "./catalog.js";
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
  holdFilter: "all-pending",
  queuedCheckoutItems: [],
  checkoutPatronId: "",
  lastCheckInResult: null,
  lastCheckoutReceipt: null,
  activeWorkspaceRecordId: "",
  editingPatronId: "",
  selectedPatronId: "",
  patronSearchQuery: "",
  patronSearchIndex: -1,
  activePatronModal: "",
  activeNoticePatronId: "",
  activeNoticeRecordId: "",
  illModalMode: "create",
  illModalType: "incoming",
  activeIllFilter: "",
  illPatronSearchQuery: "",
  draftHoldings: [],
  formDirty: false,
  acquisitionsStage: "orders",
  activeDonationBatchId: "",
  donationFilter: "incoming",
  illFilter: "active",
  authorityListKey: "creators",
  authoritySearch: "",
  authorityEntrySearch: "",
  authorityStatusFilter: "all",
  authoritySort: "alpha",
  authorityEditingId: "",
  reportsView: "landing",
  reportsCategory: "collection",
  activeReportId: "monthly-circulation",
  editingRegisterId: "",
};

function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG?.apiKey && FIREBASE_CONFIG?.projectId);
}

async function loadFirebaseModule() {
  return import("./firebase.js");
}

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const on = (element, eventName, handler, options) => {
  if (!element) return;
  element.addEventListener(eventName, handler, options);
};

const els = {
  ilsCard: $("#ilsCard"),
  recordForm: $("#recordForm"),
  cancelEditBtn: $("#cancelEditBtn"),
  duplicateWarning: $("#duplicateWarning"),
  fetchMetadataBtn: $("#fetchMetadataBtn"),
  createBlankRecordBtn: $("#createBlankRecordBtn"),
  saveAndNewBtn: $("#saveAndNewBtn"),
  copyRecordBtn: $("#copyRecordBtn"),
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
  workspaceLookupMode: $("#workspaceLookupMode"),
  curatedShelfSelect: $("#curatedShelf"),
  ilsSectionButtons: $$(".ils-section-btn[data-ils-section]"),
  ilsTabButtons: $$(".admin-tab-btn[data-ils-tab]"),
  ilsTabPanels: $$(".admin-tab-panel[data-ils-panel]"),
  ilsSectionTitle: $("#ilsSectionTitle"),
  ilsSectionDescription: $("#ilsSectionDescription"),
  materialTypeSelect: $("#materialType"),
  authorityHomeView: $("#authorityHomeView"),
  authoritySearchInput: $("#authoritySearchInput"),
  authorityClearSearchBtn: $("#authorityClearSearchBtn"),
  authorityCategoryGroups: $("#authorityCategoryGroups"),
  authorityAddEntryBtn: $("#authorityAddEntryBtn"),
  authorityWorkspaceAddBtn: $("#authorityWorkspaceAddBtn"),
  authorityCategoryModal: $("#authorityCategoryModal"),
  closeAuthorityCategoryModalBtn: $("#closeAuthorityCategoryModalBtn"),
  authorityCategoryModalTitle: $("#authorityCategoryModalTitle"),
  authorityCategoryModalSubtitle: $("#authorityCategoryModalSubtitle"),
  authorityCategoryStatusLine: $("#authorityCategoryStatusLine"),
  authorityEntrySearchInput: $("#authorityEntrySearchInput"),
  authorityStatusFilter: $("#authorityStatusFilter"),
  authoritySortSelect: $("#authoritySortSelect"),
  authorityWorkspaceStatus: $("#authorityWorkspaceStatus"),
  authorityEntriesBody: $("#authorityEntriesBody"),
  authorityEntryModal: $("#authorityEntryModal"),
  closeAuthorityModalBtn: $("#closeAuthorityModalBtn"),
  authorityEntryForm: $("#authorityEntryForm"),
  authorityEntryId: $("#authorityEntryId"),
  authorityModalTitle: $("#authorityModalTitle"),
  authorityModalSubtitle: $("#authorityModalSubtitle"),
  authorityCategorySelect: $("#authorityCategorySelect"),
  authorityPreferredLabel: $("#authorityPreferredLabel"),
  authorityDisplayLabel: $("#authorityDisplayLabel"),
  authorityEntryStatus: $("#authorityEntryStatus"),
  authorityAltLabels: $("#authorityAltLabels"),
  authorityEntryNotes: $("#authorityEntryNotes"),
  authoritySortOrder: $("#authoritySortOrder"),
  authorityMergeTarget: $("#authorityMergeTarget"),
  authorityUsagePreview: $("#authorityUsagePreview"),
  authorityModalMessage: $("#authorityModalMessage"),
  authorityRetireBtn: $("#authorityRetireBtn"),
  authorityDeleteBtn: $("#authorityDeleteBtn"),
  reportsLandingView: $("#reportsLandingView"),
  reportsCategoryView: $("#reportsCategoryView"),
  reportsWorkspaceView: $("#reportsWorkspaceView"),
  reportsCategoryGrid: $("#reportsCategoryGrid"),
  reportsCategoryList: $("#reportsCategoryList"),
  reportsCategoryTitle: $("#reportsCategoryTitle"),
  reportsCategoryDescription: $("#reportsCategoryDescription"),
  reportsWorkspaceEyebrow: $("#reportsWorkspaceEyebrow"),
  reportsWorkspaceTitle: $("#reportsWorkspaceTitle"),
  reportsWorkspaceDescription: $("#reportsWorkspaceDescription"),
  reportsBackToLandingBtn: $("#reportsBackToLandingBtn"),
  reportsBackToCategoryBtn: $("#reportsBackToCategoryBtn"),
  reportsBackToLandingFromWorkspaceBtn: $("#reportsBackToLandingFromWorkspaceBtn"),
  reportWorkspacePanels: $$(".report-workspace-panel"),
  monthlyCirculationMonth: $("#monthlyCirculationMonth"),
  monthlyCirculationStartDate: $("#monthlyCirculationStartDate"),
  monthlyCirculationEndDate: $("#monthlyCirculationEndDate"),
  monthlyCirculationSummary: $("#monthlyCirculationSummary"),
  monthlyCirculationReport: $("#monthlyCirculationReport"),
  monthlyCirculationExportBtn: $("#monthlyCirculationExportBtn"),
  ilsStatsPage: $("#ilsStatsPage"),
  dashboardTileGrid: $("#dashboardTileGrid"),
  dashboardDate: $("#dashboardDate"),
  visitorCounterBtn: $("#visitorCounterBtn"),
  visitorCounterTotal: $("#visitorCounterTotal"),
  referenceCounterBtn: $("#referenceCounterBtn"),
  referenceCounterTotal: $("#referenceCounterTotal"),
  headerCounterFeedback: $("#headerCounterFeedback"),
  heroSectionJumpButtons: $$(".ils-hero-quick-actions [data-ils-section]"),
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
  patronSearchInput: $("#patronSearchInput"),
  patronSearchResults: $("#patronSearchResults"),
  openPatronCreateModalBtn: $("#openPatronCreateModalBtn"),
  patronDetailPanel: $("#patronDetailPanel"),
  patronDetailBadge: $("#patronDetailBadge"),
  patronListSummary: $("#patronListSummary"),
  patronAccountModal: $("#patronAccountModal"),
  closePatronModalBtn: $("#closePatronModalBtn"),
  patronModalTitle: $("#patronModalTitle"),
  patronModalSubtitle: $("#patronModalSubtitle"),
  patronModalBody: $("#patronModalBody"),
  patronEditorModal: $("#patronEditorModal"),
  closePatronEditorModalBtn: $("#closePatronEditorModalBtn"),
  patronEditorTitle: $("#patronEditorTitle"),
  patronEditorSubtitle: $("#patronEditorSubtitle"),
  noticeSummaryCards: $("#noticeSummaryCards"),
  noticeAgeFilter: $("#noticeAgeFilter"),
  noticePatronFilter: $("#noticePatronFilter"),
  noticeCardFilter: $("#noticeCardFilter"),
  noticeMaterialTypeFilter: $("#noticeMaterialTypeFilter"),
  noticeAccountStatusFilter: $("#noticeAccountStatusFilter"),
  clearNoticeFiltersBtn: $("#clearNoticeFiltersBtn"),
  noticeResultsSummary: $("#noticeResultsSummary"),
  noticePatronResults: $("#noticePatronResults"),
  noticePreviewPanel: $("#noticePreviewPanel"),
  noticeHistorySummary: $("#noticeHistorySummary"),
  noticeHistoryBody: $("#noticeHistoryBody"),
  noticeTemplateList: $("#noticeTemplateList"),
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
  checkoutPatronCard: $("#checkoutPatronCard"),
  checkoutPatronItems: $("#checkoutPatronItems"),
  loadCheckoutPatronBtn: $("#loadCheckoutPatronBtn"),
  clearCheckoutPatronBtn: $("#clearCheckoutPatronBtn"),
  checkoutGateBadge: $("#checkoutGateBadge"),
  checkoutGateMessage: $("#checkoutGateMessage"),
  checkOutMaterialNumber: $("#checkOutMaterialNumber"),
  queueCheckoutItemBtn: $("#queueCheckoutItemBtn"),
  checkOutQueue: $("#checkOutQueue"),
  checkOutDueDate: $("#checkOutDueDate"),
  holdingRows: $("#holdingRows"),
  addHoldingBtn: $("#addHoldingBtn"),
  circulationRulesBody: $("#circulationRulesBody"),
  checkInForm: $("#checkInForm"),
  checkInMaterialNumber: $("#checkInMaterialNumber"),
  checkInResult: $("#checkInResult"),
  holdForm: $("#holdForm"),
  holdCardNumber: $("#holdCardNumber"),
  holdPatronSelect: $("#holdPatronSelect"),
  holdMaterialNumber: $("#holdMaterialNumber"),
  holdType: $("#holdType"),
  holdShelfDays: $("#holdShelfDays"),
  holdShelfDurationBadge: $("#holdShelfDurationBadge"),
  holdStaffNote: $("#holdStaffNote"),
  holdRequestSummary: $("#holdRequestSummary"),
  runHoldExpirationBtn: $("#runHoldExpirationBtn"),
  holdQuickFilters: $$("[data-hold-filter]"),
  holdsPendingCount: $("#holdsPendingCount"),
  holdsReadyCount: $("#holdsReadyCount"),
  holdsClosedCount: $("#holdsClosedCount"),
  holdsReadySort: $("#holdsReadySort"),
  holdsActiveBody: $("#holdsActiveBody"),
  holdsReadyBody: $("#holdsReadyBody"),
  holdsClosedBody: $("#holdsClosedBody"),
  holdQueueModal: $("#holdQueueModal"),
  closeHoldQueueModalBtn: $("#closeHoldQueueModalBtn"),
  holdQueueModalTitle: $("#holdQueueModalTitle"),
  holdQueueModalSubtitle: $("#holdQueueModalSubtitle"),
  holdQueueModalBody: $("#holdQueueModalBody"),
  circulationTabButtons: $$(".circulation-tab-btn"),
  circulationPanels: $$("[data-circulation-panel]"),
  circulationMessage: $("#circulationMessage"),
  checkoutStatusBefore: $("#checkoutStatusBefore"),
  checkoutStatusAfter: $("#checkoutStatusAfter"),
  checkoutReceipt: $("#checkoutReceipt"),
  checkoutReceiptEmpty: $("#checkoutReceiptEmpty"),
  printCheckoutReceiptBtn: $("#printCheckoutReceiptBtn"),
  receiptSettingsForm: $("#receiptSettingsForm"),
  receiptLogoEnabled: $("#receiptLogoEnabled"),
  receiptLogoUrl: $("#receiptLogoUrl"),
  receiptLogoUpload: $("#receiptLogoUpload"),
  receiptContactInfo: $("#receiptContactInfo"),
  receiptFooterMessage: $("#receiptFooterMessage"),
  receiptSettingsMessage: $("#receiptSettingsMessage"),
  recentCheckoutTransactions: $("#recentCheckoutTransactions"),
  recentCheckinTransactions: $("#recentCheckinTransactions"),
  workspaceLookupInput: $("#workspaceLookupInput"),
  workspaceLookupBtn: $("#workspaceLookupBtn"),
  exportActiveMarcBtn: $("#exportActiveMarcBtn"),
  workspaceStatus: $("#workspaceStatus"),
  recordSaveMessage: $("#recordSaveMessage"),
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
  openIncomingIllModalBtn: $("#openIncomingIllModalBtn"),
  openOutgoingIllModalBtn: $("#openOutgoingIllModalBtn"),
  illDashboardStatus: $("#illDashboardStatus"),
  illWorkflowTiles: $("#illWorkflowTiles"),
  illFilteredViewTitle: $("#illFilteredViewTitle"),
  illFilteredViewSubtitle: $("#illFilteredViewSubtitle"),
  illFilteredSummaryCards: $("#illFilteredSummaryCards"),
  illFilteredResults: $("#illFilteredResults"),
  clearIllFilterBtn: $("#clearIllFilterBtn"),
  illRecordModal: $("#illRecordModal"),
  closeIllModalBtn: $("#closeIllModalBtn"),
  illRecordForm: $("#illRecordForm"),
  illRecordType: $("#illRecordType"),
  illRecordId: $("#illRecordId"),
  illModalTitle: $("#illModalTitle"),
  illModalSubtitle: $("#illModalSubtitle"),
  illRecordSubmitBtn: $("#illRecordSubmitBtn"),
  illRecordMessage: $("#illRecordMessage"),
  illPatronLookupLabel: $("#illPatronLookupLabel"),
  illPatronLookup: $("#illPatronLookup"),
  illPatronLookupResults: $("#illPatronLookupResults"),
  illIncomingPatronId: $("#illIncomingPatronId"),
  illIncomingPatronName: $("#illIncomingPatronName"),
  illIncomingTitle: $("#illIncomingTitle"),
  illOutgoingTitle: $("#illOutgoingTitle"),
  illIncomingAuthor: $("#illIncomingAuthor"),
  illOutgoingAuthor: $("#illOutgoingAuthor"),
  illIncomingFormat: $("#illIncomingFormat"),
  illOutgoingItemRef: $("#illOutgoingItemRef"),
  illIncomingLibrary: $("#illIncomingLibrary"),
  illOutgoingLibrary: $("#illOutgoingLibrary"),
  illOutgoingContact: $("#illOutgoingContact"),
  illIncomingRequestDate: $("#illIncomingRequestDate"),
  illOutgoingRequestedDate: $("#illOutgoingRequestedDate"),
  illIncomingReceivedDate: $("#illIncomingReceivedDate"),
  illOutgoingSentDate: $("#illOutgoingSentDate"),
  illIncomingDueDate: $("#illIncomingDueDate"),
  illOutgoingDueDate: $("#illOutgoingDueDate"),
  illIncomingStatus: $("#illIncomingStatus"),
  illOutgoingStatus: $("#illOutgoingStatus"),
  illIncomingPickupStatus: $("#illIncomingPickupStatus"),
  illIncomingNotes: $("#illIncomingNotes"),
  illOutgoingNotes: $("#illOutgoingNotes"),
  illIncomingPatronNameLabel: $("#illIncomingPatronNameLabel"),
  illOutgoingItemRefLabel: $("#illOutgoingItemRefLabel"),
  illIncomingTitleLabel: $("#illIncomingTitleLabel"),
  illOutgoingTitleLabel: $("#illOutgoingTitleLabel"),
  illIncomingAuthorLabel: $("#illIncomingAuthorLabel"),
  illOutgoingAuthorLabel: $("#illOutgoingAuthorLabel"),
  illIncomingFormatLabel: $("#illIncomingFormatLabel"),
  illIncomingLibraryLabel: $("#illIncomingLibraryLabel"),
  illOutgoingLibraryLabel: $("#illOutgoingLibraryLabel"),
  illOutgoingContactLabel: $("#illOutgoingContactLabel"),
  illIncomingRequestDateLabel: $("#illIncomingRequestDateLabel"),
  illOutgoingRequestedDateLabel: $("#illOutgoingRequestedDateLabel"),
  illIncomingReceivedDateLabel: $("#illIncomingReceivedDateLabel"),
  illOutgoingSentDateLabel: $("#illOutgoingSentDateLabel"),
  illIncomingDueDateLabel: $("#illIncomingDueDateLabel"),
  illOutgoingDueDateLabel: $("#illOutgoingDueDateLabel"),
  illIncomingStatusLabel: $("#illIncomingStatusLabel"),
  illOutgoingStatusLabel: $("#illOutgoingStatusLabel"),
  illIncomingPickupStatusLabel: $("#illIncomingPickupStatusLabel"),
  illIncomingNotesLabel: $("#illIncomingNotesLabel"),
  illOutgoingNotesLabel: $("#illOutgoingNotesLabel"),
  illReportsSummary: $("#illReportsSummary"),
  illReportsTableWrap: $("#illReportsTableWrap"),
  registerForm: $("#registerForm"),
  registerDate: $("#registerDate"),
  registerAmount: $("#registerAmount"),
  registerCategory: $("#registerCategory"),
  registerPaymentType: $("#registerPaymentType"),
  registerStaffInitials: $("#registerStaffInitials"),
  registerFormTitle: $("#registerFormTitle"),
  registerSubmitBtn: $("#registerSubmitBtn"),
  cancelRegisterEditBtn: $("#cancelRegisterEditBtn"),
  registerDonationPurposeLabel: $("#registerDonationPurposeLabel"),
  registerDonationPurpose: $("#registerDonationPurpose"),
  registerDonationOtherLabel: $("#registerDonationOtherLabel"),
  registerDonationOther: $("#registerDonationOther"),
  registerNotes: $("#registerNotes"),
  registerMessage: $("#registerMessage"),
  registerSummaryCards: $("#registerSummaryCards"),
  registerReportDate: $("#registerReportDate"),
  registerDailyTableWrap: $("#registerDailyTableWrap"),
  viewRegisterTransactionsBtn: $("#viewRegisterTransactionsBtn"),
  registerTransactionsModal: $("#registerTransactionsModal"),
  closeRegisterTransactionsModalBtn: $("#closeRegisterTransactionsModalBtn"),
  registerTransactionsModalTitle: $("#registerTransactionsModalTitle"),
  registerTransactionsModalSubtitle: $("#registerTransactionsModalSubtitle"),
  registerTransactionsModalBody: $("#registerTransactionsModalBody"),
};

const ILS_SECTIONS = {
  dashboard: { label: "Dashboard", description: "Operational overview.", tabs: [{ id: "dashboard", label: "Overview" }] },
  circulation: { label: "Circulation", description: "Checkout, check-in, and holds.", tabs: [{ id: "circulation", label: "Desk" }] },
  cataloging: { label: "Cataloging", description: "Record editing and serials.", tabs: [{ id: "records", label: "Edit Records" }, { id: "serials", label: "Serials" }] },
  acquisitions: { label: "Acquisitions", description: "Orders, receiving, and pending processing.", tabs: [{ id: "acquisitions", label: "Acquisitions Workspace" }] },
  patrons: { label: "Patrons", description: "Accounts and overdue notices.", tabs: [{ id: "patrons", label: "Accounts" }, { id: "patron-notices", label: "Notices" }] },
  ill: { label: "Interlibrary Loan", description: "Incoming, outgoing, and ILL reports.", tabs: [{ id: "ill-outgoing", label: "Outgoing ILL" }, { id: "ill-incoming", label: "Incoming Requests" }, { id: "ill-reports", label: "ILL Reports" }] },
  register: { label: "Daily Register", description: "Daily transaction log.", tabs: [{ id: "register", label: "Register" }] },
  administration: { label: "Administration", description: "Rules, receipts, and authority tools.", tabs: [{ id: "circulation-rules", label: "Circulation Rules" }, { id: "receipt-settings", label: "Receipt Settings" }, { id: "utilities", label: "Authority Control" }] },
  reports: { label: "Reports", description: "Focused report workspaces.", tabs: [{ id: "stats", label: "Reports Home" }] },
};

const REPORT_CATEGORIES = {
  collection: { label: "Collection Reports", description: "Collection health, metadata quality, and circulation-driven collection insights.", reports: ["collection-stats", "weeding", "authors", "sections", "missing-biblio"] },
  circulation: { label: "Circulation Reports", description: "Checkout trends and overdue lending activity.", reports: ["monthly-circulation", "overdue"] },
  service: { label: "Service Desk / Usage Reports", description: "Desk activity, traffic, and operational service reporting.", reports: ["busiest-hours", "operational"] },
  financial: { label: "Financial Reports", description: "Fine and fee balances, assessments, and payment trends.", reports: ["fines-fees"] },
};

const REPORT_DEFINITIONS = {
  "collection-stats": { title: "Collection Stats", description: "High-level collection counts, format mix, and value snapshots.", category: "collection", panelId: "report-collection-stats" },
  weeding: { title: "Weeding Report", description: "Identify inactive and never-circulated items for review.", category: "collection", panelId: "report-weeding" },
  authors: { title: "Most Borrowed Authors", description: "See top-circulating authors within the selected filters.", category: "collection", panelId: "report-authors" },
  sections: { title: "Least Used Sections", description: "Compare section size against circulation to spot underused areas.", category: "collection", panelId: "report-sections" },
  "missing-biblio": { title: "Missing Biblio Report", description: "Find records missing required bibliographic details.", category: "collection", panelId: "report-missing-biblio" },
  "monthly-circulation": { title: "Monthly Circulation Report", description: "View monthly checkout totals and material type breakdowns.", category: "circulation", panelId: "report-monthly-circulation" },
  overdue: { title: "60+ Days Past Due Report", description: "Review items that have been overdue for at least 60 days.", category: "circulation", panelId: "report-overdue" },
  "busiest-hours": { title: "Busiest Hours Report", description: "Use visitor timestamps to spot high-traffic service windows.", category: "service", panelId: "report-busiest-hours" },
  operational: { title: "Operational Reports", description: "Review building use, reference, ILL, and register activity together.", category: "service", panelId: "report-operational" },
  "fines-fees": { title: "Fines and Fees", description: "Track balances, fee detail, and monthly assessed versus paid totals.", category: "financial", panelId: "report-fines-fees" },
};

const TAB_TO_SECTION = Object.fromEntries(
  Object.entries(ILS_SECTIONS).flatMap(([section, config]) => config.tabs.map((tab) => [tab.id, section])),
);

const AUTHORITY_LIST_CONFIG = {
  creators: { key: "creators", label: "Authors / Creators", singular: "creator", description: "Preferred creator names and alternate local forms used in records.", legacyKey: "creators", recordKey: "creator", rich: true, group: "access" },
  subjects: { key: "subjects", label: "Subjects", singular: "subject heading", description: "Browse and maintain topical terms without needing to know the exact list first.", legacyKey: "subjects", recordKey: "subjects", rich: true, group: "access" },
  genres: { key: "genres", label: "Genres", singular: "genre", description: "Standard genre terms used in catalog records.", legacyKey: "genres", recordKey: "genre", rich: true, group: "access" },
  series: { key: "series", label: "Series", singular: "series", description: "Series names and sequence-friendly labels used across records.", legacyKey: "series", recordKey: "seriesName", rich: true, group: "access" },
  publishers: { key: "publishers", label: "Publishers", singular: "publisher", description: "Normalized publisher names and local display wording.", legacyKey: "publishers", recordKey: "publisher", rich: true, group: "access" },
  locations: { key: "locations", label: "Shelf Locations", singular: "shelf location", description: "Physical shelving locations and collections.", legacyKey: "locations", recordKey: "location", rich: true, group: "local" },
  curatedShelves: { key: "curatedShelves", label: "Curated Shelves", singular: "curated shelf", description: "Featured shelves and local collection names.", legacyKey: "curatedShelves", recordKey: "curatedShelf", rich: true, group: "local" },
  formats: { key: "formats", label: "Formats", singular: "format", description: "Public-facing format labels shown in records.", legacyKey: "formats", recordKey: "format", rich: false, group: "local" },
  materialTypes: { key: "materialTypes", label: "Formats / Material Types", singular: "material type", description: "Loan rule categories and item-type labels.", legacyKey: "materialTypes", recordKey: "materialType", rich: false, group: "local" },
  audience: { key: "audience", label: "Audience", singular: "audience term", description: "Standard audience labels used for reader guidance.", legacyKey: "audience", recordKey: "targetAudience", rich: false, group: "local" },
  bindings: { key: "bindings", label: "Bindings", singular: "binding", description: "Physical binding and carrier details for holdings.", legacyKey: "bindings", recordKey: "binding", rich: false, group: "local" },
  libraries: { key: "libraries", label: "Libraries", singular: "library", description: "Preferred lending and borrowing library names for ILL workflows.", legacyKey: "libraries", recordKey: "", rich: true, group: "local" },
  languages: { key: "languages", label: "Languages", singular: "language", description: "Preferred language labels and alternate forms.", legacyKey: "languages", recordKey: "languageCode", rich: true, group: "local" },
  noteTemplates: { key: "noteTemplates", label: "Standard Notes / Reusable Phrases", singular: "note template", description: "Reusable cataloging notes and staff text snippets.", legacyKey: "noteTemplates", recordKey: "", rich: true, group: "admin" },
  statusPresets: { key: "statusPresets", label: "Status Presets", singular: "status preset", description: "Reusable item status labels for holdings and circulation.", legacyKey: "statusPresets", recordKey: "status", rich: true, group: "admin" },
};

const AUTHORITY_GROUPS = {
  access: { label: "Bibliographic Access", description: "Names, subjects, and descriptive access points staff browse most often." },
  local: { label: "Local Cataloging", description: "Shelving, formats, and other house standards for local workflows." },
  admin: { label: "Administrative / Reusable Text", description: "Reusable text, presets, and supporting administrative standards." },
};

const DEFAULT_AUTHORITY_SEEDS = {
  genres: PRELOADED_GENRES,
  formats: FORMAT_OPTIONS,
  bindings: BINDING_OPTIONS.filter(Boolean),
  materialTypes: [...new Set([...FORMAT_OPTIONS, "Periodical"])],
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
  "recordId:id", "title", "subtitle", "creator", "statementOfResponsibility", "contributors", "format", "materialType", "edition", "publisher", "publicationPlace", "year", "languageCode", "identifier", "isbn", "upc", "lccn", "oclcNumber", "localRecordId", "pageCount", "physicalDetails", "binding", "dimensions", "seriesName", "seriesNumber", "subjects", "genre", "audience", "curatedShelf", "summaryNote", "targetAudience", "bibliographyNote", "notes", "deweyNumber", "lcClassNumber", "callNumber", "location", "primaryMaterialNumber:materialNumbers", "copyNumber", "recordStatus:status", "dateAdded", "coverUrl", "circulationHistory", "marcLeader", "marc008", "marcText",
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
  if (tab === "patrons") {
    window.requestAnimationFrame(() => els.patronSearchInput?.focus());
  }
  if (tab === "patron-notices") {
    window.requestAnimationFrame(() => els.noticePatronFilter?.focus());
  }
}

function getPatrons() {
  return Array.isArray(state.settings.patrons) ? state.settings.patrons : [];
}

function savePatrons(patrons) {
  state.settings.patrons = patrons;
  saveSettings(state.settings);
}

function resetPatronForm() {
  if (!els.patronForm) return;
  els.patronForm.reset();
  if (els.patronId) els.patronId.value = "";
  if (els.patronStatus) els.patronStatus.value = "Active";
  if (els.patronSubmitBtn) els.patronSubmitBtn.textContent = "Add Patron";
  if (els.patronEditorTitle) els.patronEditorTitle.textContent = "Add Patron";
  if (els.patronEditorSubtitle) els.patronEditorSubtitle.textContent = "Create a new patron account or update an existing one.";
  state.editingPatronId = "";
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function openPatronEditorModal(mode = "add") {
  if (els.patronEditorTitle) els.patronEditorTitle.textContent = mode === "edit" ? "Edit Patron" : "Add Patron";
  if (els.patronEditorSubtitle) els.patronEditorSubtitle.textContent = mode === "edit" ? "Update patron contact and account information." : "Create a new patron account or update an existing one.";
  openModal(els.patronEditorModal);
  window.requestAnimationFrame(() => els.patronName?.focus());
}

function closePatronEditorModal() {
  closeModal(els.patronEditorModal);
}

function openPatronAccountModal(view, patron = getPatrons().find((entry) => entry.id === state.selectedPatronId)) {
  if (!patron || !els.patronModalBody) return;
  state.activePatronModal = view;
  const summary = getPatronAccountSummary(patron);
  const holdHistory = getPatronHoldHistory(patron.id);
  const blocks = String(patron.blocks || "").split(/\s*,\s*/).filter(Boolean);
  const alerts = String(patron.alerts || "").split(/\s*,\s*/).filter(Boolean);
  const views = {
    checkouts: {
      title: "Current checkouts",
      subtitle: `${summary.loans.length} item${summary.loans.length === 1 ? "" : "s"} currently checked out.`,
      body: summary.loans.length
        ? `<ul class="patron-modal-list">${summary.loans.map(({ record, holding }) => `<li><div class="patron-modal-list-header"><strong>${escapeHtml(record.title || "Untitled")}</strong><span>${escapeHtml(holding.materialNumbers?.[0] || "No barcode")}</span></div><span>Due ${escapeHtml(holding.dueDate || "No due date")}</span></li>`).join("")}</ul>`
        : '<div class="empty-state">No items are currently checked out.</div>',
    },
    holds: {
      title: "Active holds",
      subtitle: `${summary.holds.length} active hold${summary.holds.length === 1 ? "" : "s"} on this account.`,
      body: summary.holds.length
        ? `<ul class="patron-modal-list">${summary.holds.map((hold) => `<li><div class="patron-modal-list-header"><strong>${escapeHtml(hold.itemTitle || "Untitled")}</strong><span>Queue #${escapeHtml(String(hold.queuePosition || "—"))}</span></div><span>${escapeHtml(hold.status)}${hold.pickupExpirationDate ? ` · Pickup by ${escapeHtml(hold.pickupExpirationDate)}` : ""}</span></li>`).join("")}</ul>`
        : '<div class="empty-state">No active holds or reserves.</div>',
    },
    fines: {
      title: "Fines / Fees",
      subtitle: `${formatCurrency(summary.unpaidAmount)} outstanding on this account.`,
      body: `<section class="patron-modal-section"><form id="patronFeeForm" class="simple-form patron-form-grid">
          <label>Fee category
            <select id="feeCategory"><option>Fine</option><option>Replacement Cost</option><option>Card Replacement</option><option>Fee</option><option>Other</option></select>
          </label>
          <label>Date assessed
            <input id="feeDateAssessed" type="date" />
          </label>
          <label>Amount
            <input id="feeAmount" type="number" min="0" step="0.01" required />
          </label>
          <label>Status
            <select id="feeStatus"><option>Unpaid</option><option>Partially Paid</option><option>Paid</option><option>Waived</option></select>
          </label>
          <label class="form-grid-span">Description / reason
            <textarea id="feeDescription" rows="2" placeholder="Overdue fine, replacement copy, card replacement, etc."></textarea>
          </label>
          <div class="form-grid-span patron-fee-actions"><button id="addFeeBtn" class="button" type="submit">Add payment / charge</button></div>
        </form><p id="patronFeeMessage" class="status-message" aria-live="polite"></p></section>
        <section class="patron-modal-section">${summary.entries.length ? `<ul class="patron-modal-list">${summary.entries.sort((a, b) => String(b.dateAssessed).localeCompare(String(a.dateAssessed))).map((entry) => `<li class="patron-fee-entry"><div class="patron-modal-list-header"><strong>${escapeHtml(entry.category)}</strong><span>${formatCurrency(entry.amount)} · ${escapeHtml(entry.status)}</span></div><span>${escapeHtml(entry.dateAssessed)} · ${escapeHtml(entry.description || "No description")}</span><span>Remaining: ${formatCurrency(entry.remainingAmount)}</span>${["Paid", "Waived"].includes(entry.status) ? "" : `<div class="patron-fee-actions"><button class="button button-secondary" type="button" data-fee-status="${entry.id}" data-next-status="Paid">Mark Paid</button><button class="button button-secondary" type="button" data-fee-status="${entry.id}" data-next-status="Waived">Waive</button></div>`}</li>`).join("")}</ul>` : '<div class="empty-state">No fines or fees have been assessed.</div>'}</section>`,
    },
    history: {
      title: "Checkout history",
      subtitle: `${summary.history.length} recent circulation entr${summary.history.length === 1 ? "y" : "ies"}.`,
      body: summary.history.length
        ? `<ul class="patron-modal-list">${summary.history.map((entry) => `<li><strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.line)}</span></li>`).join("")}</ul>`
        : '<div class="empty-state">No recent checkout history.</div>',
    },
    notes: {
      title: "Notes / Alerts",
      subtitle: "Staff-only account context and alerts.",
      body: `<div class="patron-detail-grid"><div class="detail-card"><span class="detail-label">Notes</span><strong>${escapeHtml(patron.notes || "No notes")}</strong></div><div class="detail-card"><span class="detail-label">Blocks</span><strong>${escapeHtml(blocks.join(", ") || "No blocks")}</strong></div><div class="detail-card"><span class="detail-label">Alerts</span><strong>${escapeHtml(alerts.join(", ") || "No alerts")}</strong></div><div class="detail-card"><span class="detail-label">Recent hold history</span><strong>${holdHistory.length ? `${holdHistory.length} recent item(s)` : "No closed holds"}</strong></div></div>${holdHistory.length ? `<ul class="patron-modal-list">${holdHistory.map((hold) => `<li><strong>${escapeHtml(hold.itemTitle || "Untitled")}</strong><span>${escapeHtml(hold.status)} · ${escapeHtml(isoDateFromTimestamp(hold.completedCancelledExpiredDate) || "No close date")}</span></li>`).join("")}</ul>` : ""}`,
    },
  };
  const currentView = views[view];
  if (!currentView) return;
  if (els.patronModalTitle) els.patronModalTitle.textContent = `${patron.name || "Patron"} — ${currentView.title}`;
  if (els.patronModalSubtitle) els.patronModalSubtitle.textContent = currentView.subtitle;
  els.patronModalBody.className = "patron-modal-body";
  els.patronModalBody.innerHTML = currentView.body;
  if (view === "fines") {
    populateStaticSelects();
    const feeForm = $("#patronFeeForm");
    if (feeForm) feeForm.addEventListener("submit", addFeeToSelectedPatron);
    [...els.patronModalBody.querySelectorAll("[data-fee-status]")].forEach((button) => button.addEventListener("click", () => updateFeeStatus(button.dataset.feeStatus, button.dataset.nextStatus)));
  }
  openModal(els.patronAccountModal);
}

function closePatronAccountModal() {
  state.activePatronModal = "";
  closeModal(els.patronAccountModal);
}

function addPatron(event) {
  event.preventDefault();
  const patrons = getPatrons();
  const patronId = (els.patronId?.value || "").trim();
  const now = Date.now();
  const payload = {
    id: patronId || `patron-${now}-${Math.floor(Math.random() * 1000)}`,
    name: els.patronName?.value.trim() || "",
    middleName: els.patronMiddleName?.value.trim() || "",
    cardNumber: els.patronCardNumber?.value.trim() || "",
    email: els.patronEmail?.value.trim() || "",
    address: els.patronAddress?.value.trim() || "",
    phone: els.patronPhone?.value.trim() || "",
    birthDay: els.patronBirthDay?.value || "",
    status: els.patronStatus?.value || "Active",
    expirationDate: els.patronExpirationDate?.value || "",
    notes: els.patronNotes?.value.trim() || "",
    blocks: els.patronBlocks?.value.trim() || "",
    alerts: els.patronAlerts?.value.trim() || "",
    createdAt: patronId ? patrons.find((entry) => entry.id === patronId)?.createdAt || now : now,
    updatedAt: now,
  };

  if (!payload.name || !payload.cardNumber) return;

  const nextPatrons = patronId
    ? patrons.map((entry) => (entry.id === patronId ? { ...entry, ...payload } : entry))
    : [...patrons, payload];

  savePatrons(nextPatrons);
  state.selectedPatronId = payload.id;
  state.patronSearchQuery = payload.name || payload.cardNumber || "";
  if (els.patronSearchInput) els.patronSearchInput.value = state.patronSearchQuery;
  resetPatronForm();
  closePatronEditorModal();
  populateHoldPatronPicker();
  buildHoldPlacementPreview();
  renderPatronSearchResults();
  renderPatronDetail();
  renderCheckoutPatronPreview();
  renderCheckoutPatronContext();
  renderDashboard();
}

function editPatron(patronId) {
  const patron = getPatrons().find((entry) => entry.id === patronId);
  if (!patron) return;
  state.editingPatronId = patronId;
  if (els.patronId) els.patronId.value = patron.id || "";
  if (els.patronName) els.patronName.value = patron.name || "";
  if (els.patronMiddleName) els.patronMiddleName.value = patron.middleName || "";
  if (els.patronCardNumber) els.patronCardNumber.value = patron.cardNumber || "";
  if (els.patronEmail) els.patronEmail.value = patron.email || "";
  if (els.patronAddress) els.patronAddress.value = patron.address || "";
  if (els.patronPhone) els.patronPhone.value = patron.phone || "";
  if (els.patronBirthDay) els.patronBirthDay.value = patron.birthDay || "";
  if (els.patronStatus) els.patronStatus.value = patron.status || "Active";
  if (els.patronExpirationDate) els.patronExpirationDate.value = patron.expirationDate || "";
  if (els.patronNotes) els.patronNotes.value = patron.notes || "";
  if (els.patronBlocks) els.patronBlocks.value = patron.blocks || "";
  if (els.patronAlerts) els.patronAlerts.value = patron.alerts || "";
  if (els.patronSubmitBtn) els.patronSubmitBtn.textContent = "Update Patron";
  openPatronEditorModal("edit");
}

function removePatron(patronId) {
  const patron = getPatrons().find((entry) => entry.id === patronId);
  if (!patron || !window.confirm(`Delete patron account for ${patron.name || "this patron"}?`)) return;
  savePatrons(getPatrons().filter((entry) => entry.id !== patronId));
  if (state.selectedPatronId === patronId) state.selectedPatronId = "";
  if (state.editingPatronId === patronId) resetPatronForm();
  renderPatronSearchResults();
  renderPatronDetail();
  renderCheckoutPatronPreview();
  renderCheckoutPatronContext();
  renderDashboard();
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
const ILL_OUTGOING_SENT_STATUSES = new Set(["In Transit", "Received by Borrowing Library", "Checked Out to Borrowing Library Patron", "Returning", "Returned", "Completed"]);
const ILL_WORKFLOW_TILES = [
  { key: "incoming-requested", label: "Incoming Requested", type: "incoming", filter: (entry) => ["Requested", "Submitted", "Located"].includes(entry.status), copy: "New patron requests awaiting lender work." },
  { key: "incoming-progress", label: "Incoming In Progress", type: "incoming", filter: (entry) => ["In Transit", "Received"].includes(entry.status), copy: "Requests already located or moving between libraries." },
  { key: "incoming-ready", label: "Incoming Ready for Pickup", type: "incoming", filter: (entry) => entry.status === "On Hold for Patron" || /ready/i.test(String(entry.pickupStatus || "")), copy: "Items ready to contact patrons and stage for pickup." },
  { key: "incoming-return", label: "Incoming Return / Overdue", type: "incoming", filter: (entry) => ["Checked Out to Patron", "Returned by Patron", "Returned to Lending Library"].includes(entry.status) || (entry.dueDate && !ILL_COMPLETED_STATUSES.has(entry.status) && new Date(entry.dueDate) < new Date(todayIso())), copy: "Checked out, returning, or overdue inbound requests." },
  { key: "outgoing-requested", label: "Outgoing Requested", type: "outgoing", filter: (entry) => ["Requested", "Pulled"].includes(entry.status), copy: "Items requested by partner libraries and not yet sent." },
  { key: "outgoing-sent", label: "Outgoing Sent", type: "outgoing", filter: (entry) => ["In Transit", "Received by Borrowing Library", "Checked Out to Borrowing Library Patron"].includes(entry.status), copy: "Materials shipped and still in borrowing workflow." },
  { key: "outgoing-awaiting-return", label: "Outgoing Awaiting Return", type: "outgoing", filter: (entry) => ["Returning", "Returned"].includes(entry.status) || (entry.dueDate && !ILL_COMPLETED_STATUSES.has(entry.status) && new Date(entry.dueDate) < new Date(todayIso())), copy: "Items due back, returning, or overdue from borrowers." },
  { key: "outgoing-completed", label: "Outgoing Completed", type: "outgoing", filter: (entry) => ILL_COMPLETED_STATUSES.has(entry.status), copy: "Closed outbound ILL work for recent shipments." },
];
const REGISTER_CATEGORIES = ["Copies", "Faxing", "New Cards", "Cash Donations", "Replacement Costs", "Fines / Fees"];
const REGISTER_PAYMENT_TYPES = ["Cash", "Card", "Check"];
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

const DEFAULT_NOTICE_TEMPLATES = [
  {
    id: "notice-template-first",
    name: "First Overdue Notice",
    subject: "First overdue reminder",
    body: "Our records show the following library items are now overdue. Please return or renew them as soon as possible.",
    closing: "Please contact the library if you need help renewing or discussing your account.",
  },
  {
    id: "notice-template-second",
    name: "Second Overdue Notice",
    subject: "Second overdue reminder",
    body: "This is a second reminder that the following items remain overdue on your account.",
    closing: "Please contact staff promptly to avoid additional account issues.",
  },
  {
    id: "notice-template-final",
    name: "Final Notice",
    subject: "Final overdue notice",
    body: "This is a final overdue notice for materials still charged to your account.",
    closing: "Please return these items or speak with staff immediately regarding next steps.",
  },
];

function getNoticeTemplates() {
  const stored = Array.isArray(state.settings.noticeTemplates) ? state.settings.noticeTemplates : [];
  if (stored.length) return stored;
  return DEFAULT_NOTICE_TEMPLATES.map((template) => ({ ...template }));
}

function saveNoticeTemplates(templates) {
  state.settings.noticeTemplates = templates;
  saveSettings(state.settings);
}

function ensureNoticeTemplatesSeeded() {
  if (!Array.isArray(state.settings.noticeTemplates) || !state.settings.noticeTemplates.length) {
    saveNoticeTemplates(DEFAULT_NOTICE_TEMPLATES.map((template) => ({ ...template })));
  }
}

function getNoticeHistory() {
  return Array.isArray(state.settings.noticeHistory) ? state.settings.noticeHistory : [];
}

function saveNoticeHistory(entries) {
  state.settings.noticeHistory = entries;
  saveSettings(state.settings);
}

function getNoticeSettings() {
  return {
    closingMessage: String(state.settings.noticeSettings?.closingMessage || "").trim(),
  };
}

function saveNoticeSettings(settings = {}) {
  state.settings.noticeSettings = {
    ...getNoticeSettings(),
    ...settings,
  };
  saveSettings(state.settings);
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function parseCirculationLines(record) {
  return String(record.circulationHistory || "").split(/\n+/).filter(Boolean).map((line) => {
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
  return record.audience || record.targetAudience || record.curatedShelf || "General";
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
  const feedback = $("#headerCounterFeedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = `quick-counter-feedback is-visible ${type === "error" ? "is-error" : ""}`.trim();
  window.clearTimeout(setHeaderFeedback.timeoutId);
  setHeaderFeedback.timeoutId = window.setTimeout(() => {
    const activeFeedback = $("#headerCounterFeedback");
    if (!activeFeedback) return;
    activeFeedback.textContent = "";
    activeFeedback.className = "quick-counter-feedback";
  }, 1200);
}

function flashCounterFeedback(type, total) {
  const btn = type === "visitor" ? $("#visitorCounterBtn") : $("#referenceCounterBtn");
  if (btn) {
    btn.classList.remove("is-pulsing");
    void btn.offsetWidth;
    btn.classList.add("is-pulsing");
    window.setTimeout(() => btn.classList.remove("is-pulsing"), 350);
  }
  setHeaderFeedback(`Recorded ${type === "visitor" ? "visitor" : "reference question"}. Today's total: ${total}.`);
}

function renderQuickCounters() {
  const visitorTotal = $("#visitorCounterTotal");
  const referenceTotal = $("#referenceCounterTotal");
  if (visitorTotal) visitorTotal.textContent = `Today: ${getDailyCounterTotal("visitor")}`;
  if (referenceTotal) referenceTotal.textContent = `Today: ${getDailyCounterTotal("reference")}`;
}

function setIllMessage(_type, message, isError = false) {
  const target = els.illDashboardStatus;
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("warning", isError);
}

function setIllRecordMessage(message, isError = false) {
  if (!els.illRecordMessage) return;
  els.illRecordMessage.textContent = message;
  els.illRecordMessage.classList.toggle('warning', isError);
}

function populateStaticSelects() {
  if (els.illOutgoingStatus) els.illOutgoingStatus.innerHTML = ILL_OUTGOING_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("");
  if (els.illIncomingStatus) els.illIncomingStatus.innerHTML = ILL_INCOMING_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("");
  if (els.registerCategory) els.registerCategory.innerHTML = REGISTER_CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join("");
  if (els.registerPaymentType) els.registerPaymentType.innerHTML = REGISTER_PAYMENT_TYPES.map((type) => `<option value="${type}">${type}</option>`).join("");
  if (els.registerDonationPurpose) els.registerDonationPurpose.innerHTML = DONATION_PURPOSES.map((purpose) => `<option value="${purpose}">${purpose}</option>`).join("");
  if (els.registerDate && !els.registerDate.value) els.registerDate.value = todayIso();
  if (els.holdShelfDays && !els.holdShelfDays.value) els.holdShelfDays.value = String(getHoldShelfDuration());
  if (els.holdShelfDurationBadge) els.holdShelfDurationBadge.textContent = `${getHoldShelfDuration()}-day shelf`;
  if (els.registerReportDate && !els.registerReportDate.value) els.registerReportDate.value = todayIso();
  if (els.illOutgoingRequestedDate && !els.illOutgoingRequestedDate.value) els.illOutgoingRequestedDate.value = todayIso();
  if (els.illIncomingRequestDate && !els.illIncomingRequestDate.value) els.illIncomingRequestDate.value = todayIso();
  const feeDateAssessed = $("#feeDateAssessed");
  if (feeDateAssessed && !feeDateAssessed.value) feeDateAssessed.value = todayIso();
  if (els.trafficStartDate && !els.trafficStartDate.value) els.trafficStartDate.value = todayIso();
  if (els.trafficEndDate && !els.trafficEndDate.value) els.trafficEndDate.value = todayIso();
  if (els.monthlyCirculationMonth && !els.monthlyCirculationMonth.value) els.monthlyCirculationMonth.value = getMonthKey(todayIso());
}

function normalizeIllTransaction(type, entry = {}) {
  const incoming = type === "incoming";
  const status = String(entry.status || "Requested").trim() || "Requested";
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
      patronId: String(entry.patronId || "").trim(),
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
    linkedRecordId: String(entry.linkedRecordId || "").trim(),
    linkedHoldingId: String(entry.linkedHoldingId || "").trim(),
  };
}

function resetIllRecordForm() {
  els.illRecordForm?.reset();
  if (els.illRecordType) els.illRecordType.value = 'incoming';
  if (els.illRecordId) els.illRecordId.value = '';
  if (els.illIncomingPatronId) els.illIncomingPatronId.value = '';
  state.illPatronSearchQuery = '';
  setIllRecordMessage('');
  populateStaticSelects();
}

function toggleIllField(label, visible, required = false) {
  if (!label) return;
  label.classList.toggle('hidden', !visible);
  const input = label.querySelector('input, select, textarea');
  if (input) input.required = visible && required;
}

function configureIllModal(type, mode = 'create', entry = null) {
  state.illModalType = type;
  state.illModalMode = mode;
  if (els.illRecordType) els.illRecordType.value = type;
  if (els.illRecordId) els.illRecordId.value = entry?.id || '';
  if (els.illModalTitle) els.illModalTitle.textContent = `${mode === 'edit' ? 'Edit' : 'Add New'} ${type === 'incoming' ? 'Incoming ILL Request' : 'Outgoing ILL'}`;
  if (els.illModalSubtitle) els.illModalSubtitle.textContent = type === 'incoming'
    ? (mode === 'edit' ? 'Update the patron-linked incoming request and workflow fields.' : 'Create a patron-linked incoming request without assigning a lending library yet.')
    : (mode === 'edit' ? 'Update borrowing library workflow details and shipment status.' : 'Create an outgoing loan request for another library.');
  if (els.illRecordSubmitBtn) els.illRecordSubmitBtn.textContent = mode === 'edit' ? 'Save Changes' : 'Create ILL Request';

  const incoming = type === 'incoming';
  toggleIllField(els.illPatronLookupLabel, incoming, incoming);
  toggleIllField(els.illIncomingPatronNameLabel, incoming, incoming);
  toggleIllField(els.illIncomingTitleLabel, incoming, true);
  toggleIllField(els.illOutgoingTitleLabel, !incoming && mode === 'create', false);
  toggleIllField(els.illIncomingAuthorLabel, incoming, false);
  toggleIllField(els.illOutgoingAuthorLabel, !incoming && mode === 'create', false);
  toggleIllField(els.illIncomingFormatLabel, incoming, false);
  toggleIllField(els.illOutgoingItemRefLabel, !incoming && mode === 'create', true);
  toggleIllField(els.illIncomingLibraryLabel, incoming && mode === 'edit', false);
  toggleIllField(els.illOutgoingLibraryLabel, !incoming, true);
  toggleIllField(els.illOutgoingContactLabel, !incoming, false);
  toggleIllField(els.illIncomingRequestDateLabel, incoming && mode === 'create', false);
  toggleIllField(els.illOutgoingRequestedDateLabel, !incoming && mode === 'create', false);
  toggleIllField(els.illIncomingReceivedDateLabel, false, false);
  toggleIllField(els.illOutgoingSentDateLabel, !incoming && mode === 'create', false);
  toggleIllField(els.illIncomingDueDateLabel, false, false);
  toggleIllField(els.illOutgoingDueDateLabel, !incoming, false);
  toggleIllField(els.illIncomingStatusLabel, incoming, true);
  toggleIllField(els.illOutgoingStatusLabel, !incoming, true);
  toggleIllField(els.illIncomingPickupStatusLabel, incoming && mode === 'edit', false);
  toggleIllField(els.illIncomingNotesLabel, incoming, false);
  toggleIllField(els.illOutgoingNotesLabel, !incoming, false);

  if (incoming) {
    const patron = entry?.patronId ? getPatrons().find((item) => item.id === entry.patronId) : null;
    if (els.illIncomingPatronId) els.illIncomingPatronId.value = entry?.patronId || '';
    if (els.illPatronLookup) els.illPatronLookup.value = patron ? `${patron.name} (${patron.cardNumber || 'No card'})` : (entry?.patronName || '');
    if (els.illIncomingPatronName) els.illIncomingPatronName.value = entry?.patronName || '';
    if (els.illIncomingTitle) els.illIncomingTitle.value = entry?.title || '';
    if (els.illIncomingAuthor) els.illIncomingAuthor.value = entry?.author || '';
    if (els.illIncomingFormat) els.illIncomingFormat.value = entry?.format || '';
    if (els.illIncomingLibrary) els.illIncomingLibrary.value = entry?.lendingLibrary || '';
    if (els.illIncomingRequestDate) els.illIncomingRequestDate.value = entry?.requestDate || todayIso();
    if (els.illIncomingReceivedDate) els.illIncomingReceivedDate.value = entry?.receivedDate || '';
    if (els.illIncomingDueDate) els.illIncomingDueDate.value = entry?.dueDate || '';
    if (els.illIncomingStatus) els.illIncomingStatus.value = entry?.status || 'Requested';
    if (els.illIncomingPickupStatus) els.illIncomingPickupStatus.value = entry?.pickupStatus || 'Awaiting processing';
    if (els.illIncomingNotes) els.illIncomingNotes.value = entry?.notes || '';
  } else {
    if (els.illOutgoingItemRef) els.illOutgoingItemRef.value = entry?.itemRef || '';
    if (els.illOutgoingTitle) els.illOutgoingTitle.value = entry?.title || '';
    if (els.illOutgoingAuthor) els.illOutgoingAuthor.value = entry?.author || '';
    if (els.illOutgoingLibrary) els.illOutgoingLibrary.value = entry?.borrowingLibrary || '';
    if (els.illOutgoingContact) els.illOutgoingContact.value = entry?.contactInfo || '';
    if (els.illOutgoingRequestedDate) els.illOutgoingRequestedDate.value = entry?.requestDate || todayIso();
    if (els.illOutgoingSentDate) els.illOutgoingSentDate.value = entry?.sentDate || '';
    if (els.illOutgoingDueDate) els.illOutgoingDueDate.value = entry?.dueDate || '';
    if (els.illOutgoingStatus) els.illOutgoingStatus.value = entry?.status || 'Requested';
    if (els.illOutgoingNotes) els.illOutgoingNotes.value = entry?.notes || '';
  }
}

function openIllRecordModal(type, mode = 'create', entry = null) {
  resetIllRecordForm();
  configureIllModal(type, mode, entry);
  openModal(els.illRecordModal);
  window.requestAnimationFrame(() => (type === 'incoming' ? els.illPatronLookup : els.illOutgoingItemRef)?.focus());
}

function closeIllRecordModal() {
  closeModal(els.illRecordModal);
  if (els.illPatronLookupResults) {
    els.illPatronLookupResults.innerHTML = '';
    els.illPatronLookupResults.classList.add('hidden');
  }
}

function selectIllPatron(patron) {
  if (!patron) return;
  if (els.illIncomingPatronId) els.illIncomingPatronId.value = patron.id;
  if (els.illIncomingPatronName) els.illIncomingPatronName.value = patron.name || '';
  if (els.illPatronLookup) els.illPatronLookup.value = `${patron.name || 'Unnamed patron'} (${patron.cardNumber || 'No card'})`;
  if (els.illPatronLookupResults) {
    els.illPatronLookupResults.innerHTML = '';
    els.illPatronLookupResults.classList.add('hidden');
  }
}

function renderIllPatronLookupResults() {
  if (!els.illPatronLookupResults) return;
  const query = String(els.illPatronLookup?.value || '').trim().toLowerCase();
  if (!query) {
    els.illPatronLookupResults.innerHTML = '';
    els.illPatronLookupResults.classList.add('hidden');
    return;
  }
  const matches = getPatrons().filter((patron) => [patron.name, patron.cardNumber, patron.email].some((value) => String(value || '').toLowerCase().includes(query))).slice(0, 8);
  if (!matches.length) {
    els.illPatronLookupResults.innerHTML = '<div class="ill-patron-result muted">No matching patrons found.</div>';
    els.illPatronLookupResults.classList.remove('hidden');
    return;
  }
  els.illPatronLookupResults.innerHTML = matches.map((patron) => `<button class="ill-patron-result" type="button" data-ill-patron-id="${escapeHtml(patron.id)}"><strong>${escapeHtml(patron.name || 'Unnamed patron')}</strong><span>${escapeHtml(patron.cardNumber || 'No card number')}</span></button>`).join('');
  els.illPatronLookupResults.classList.remove('hidden');
  els.illPatronLookupResults.querySelectorAll('[data-ill-patron-id]').forEach((button) => button.addEventListener('click', () => selectIllPatron(getPatrons().find((patron) => patron.id === button.dataset.illPatronId))));
}

function ensureOutgoingIllCheckout(entry) {
  if (!entry?.itemRef) return { ok: false, message: 'Item barcode / material number is required.' };
  const match = getRecordByMaterialNumber(entry.itemRef);
  if (!match) return { ok: false, message: `Material number ${entry.itemRef} was not found.` };
  const { record, holding } = match;
  const shouldCheckOut = entry.sentDate || ILL_OUTGOING_SENT_STATUSES.has(entry.status);
  const alreadyLinked = entry.linkedHoldingId && entry.linkedHoldingId === holding.id;
  if (!shouldCheckOut) return { ok: true, recordId: record.id, holdingId: holding.id, title: record.title || entry.title, author: record.creator || entry.author };
  if (String(holding.status) === 'On Loan' && !alreadyLinked) {
    return { ok: false, message: `${record.title || 'This item'} is already checked out.` };
  }
  state.records = state.records.map((current) => {
    if (current.id !== record.id) return current;
    const holdings = (current.holdings || []).map((candidate) => {
      if (candidate.id !== holding.id) return candidate;
      return {
        ...candidate,
        status: 'On Loan',
        checkedOutTo: 'ill-outgoing',
        checkedOutToName: entry.borrowingLibrary || 'Borrowing Library',
        checkedOutAt: candidate.checkedOutAt || new Date().toISOString(),
        dueDate: entry.dueDate || candidate.dueDate || '',
      };
    });
    return normalizeRecord({
      ...current,
      holdings,
      circulationHistory: appendCirculationHistory(current, `ILL outgoing sent to ${entry.borrowingLibrary || 'Borrowing Library'} (${entry.itemRef})`),
    });
  });
  saveRecords(state.records);
  return { ok: true, recordId: record.id, holdingId: holding.id, title: record.title || entry.title, author: record.creator || entry.author };
}

function saveIllRecord(event) {
  event.preventDefault();
  const type = els.illRecordType?.value || 'incoming';
  const editingId = String(els.illRecordId?.value || '').trim();
  const existing = editingId ? getIllTransactions(type).find((entry) => entry.id === editingId) : null;
  if (type === 'incoming') {
    const patronId = String(els.illIncomingPatronId?.value || '').trim();
    const patron = getPatrons().find((entry) => entry.id === patronId) || null;
    const patronName = String(els.illIncomingPatronName?.value || '').trim();
    if (!patron || !patronName) {
      setIllRecordMessage('Select a valid patron record for this incoming ILL request.', true);
      return;
    }
    const entry = normalizeIllTransaction('incoming', {
      ...existing,
      id: editingId || undefined,
      patronId: patron.id,
      patronName,
      patronCardNumber: patron.cardNumber || '',
      title: els.illIncomingTitle?.value,
      author: els.illIncomingAuthor?.value,
      format: els.illIncomingFormat?.value,
      lendingLibrary: els.illIncomingLibrary?.value,
      requestDate: els.illIncomingRequestDate?.value,
      receivedDate: els.illIncomingReceivedDate?.value,
      dueDate: els.illIncomingDueDate?.value,
      status: els.illIncomingStatus?.value || 'Requested',
      pickupStatus: els.illIncomingPickupStatus?.value,
      notes: els.illIncomingNotes?.value,
      createdAt: existing?.createdAt,
    });
    const next = editingId ? getIllTransactions('incoming').map((item) => item.id === editingId ? entry : item) : [entry, ...getIllTransactions('incoming')];
    saveIllTransactions('incoming', next);
    setIllMessage('incoming', `${editingId ? 'Updated' : 'Created'} incoming ILL ${entry.id}.`);
  } else {
    const provisional = normalizeIllTransaction('outgoing', {
      ...existing,
      id: editingId || undefined,
      itemRef: els.illOutgoingItemRef?.value,
      title: els.illOutgoingTitle?.value,
      author: els.illOutgoingAuthor?.value,
      borrowingLibrary: els.illOutgoingLibrary?.value,
      contactInfo: els.illOutgoingContact?.value,
      requestDate: els.illOutgoingRequestedDate?.value,
      sentDate: els.illOutgoingSentDate?.value,
      dueDate: els.illOutgoingDueDate?.value,
      status: els.illOutgoingStatus?.value,
      notes: els.illOutgoingNotes?.value,
      createdAt: existing?.createdAt,
    });
    const linkResult = ensureOutgoingIllCheckout(provisional);
    if (!linkResult.ok) {
      setIllRecordMessage(linkResult.message, true);
      return;
    }
    const entry = normalizeIllTransaction('outgoing', {
      ...provisional,
      linkedRecordId: linkResult.recordId || existing?.linkedRecordId,
      linkedHoldingId: linkResult.holdingId || existing?.linkedHoldingId,
      title: provisional.title || linkResult.title || '',
      author: provisional.author || linkResult.author || '',
    });
    const next = editingId ? getIllTransactions('outgoing').map((item) => item.id === editingId ? entry : item) : [entry, ...getIllTransactions('outgoing')];
    saveIllTransactions('outgoing', next);
    setIllMessage('outgoing', `${editingId ? 'Updated' : 'Created'} outgoing ILL ${entry.id}.`);
  }
  closeIllRecordModal();
  renderIllWorkspace();
  renderStatsPanel();
  renderDashboard();
  renderRegisterWorkspace();
}

function getIllWorkflowCounts() {
  const incoming = getIllTransactions('incoming');
  const outgoing = getIllTransactions('outgoing');
  return ILL_WORKFLOW_TILES.map((tile) => {
    const source = tile.type === 'incoming' ? incoming : outgoing;
    const entries = source.filter((entry) => tile.filter(entry));
    return { ...tile, count: entries.length, entries };
  });
}

function updateIllStatus(type, id, status) {
  const updated = getIllTransactions(type).map((entry) => {
    if (entry.id !== id) return entry;
    const next = normalizeIllTransaction(type, {
      ...entry,
      status,
      sentDate: type === 'outgoing' && (entry.sentDate || ILL_OUTGOING_SENT_STATUSES.has(status)) ? (entry.sentDate || todayIso()) : entry.sentDate,
      receivedDate: type === 'incoming' && (entry.receivedDate || status === 'Received' || status === 'On Hold for Patron' || status === 'Checked Out to Patron') ? (entry.receivedDate || todayIso()) : entry.receivedDate,
    });
    if (type === 'outgoing') ensureOutgoingIllCheckout(next);
    return next;
  });
  saveIllTransactions(type, updated);
  renderIllWorkspace();
  renderStatsPanel();
  renderDashboard();
}

function renderIllWorkflowTiles() {
  if (!els.illWorkflowTiles) return;
  const cards = getIllWorkflowCounts();
  els.illWorkflowTiles.innerHTML = cards.map((tile) => `<button class="dashboard-tile ill-dashboard-tile is-shortcut ${state.activeIllFilter === tile.key ? 'is-active' : ''}" type="button" data-ill-filter="${tile.key}"><span class="dashboard-tile-label">${escapeHtml(tile.label)}</span><strong class="dashboard-tile-value">${tile.count}</strong><p class="dashboard-tile-copy">${escapeHtml(tile.copy)}</p><span class="dashboard-tile-footer"><span>Open queue</span><span>${tile.type === 'incoming' ? 'Incoming' : 'Outgoing'}</span></span></button>`).join('');
  els.illWorkflowTiles.querySelectorAll('[data-ill-filter]').forEach((button) => button.addEventListener('click', () => {
    state.activeIllFilter = button.dataset.illFilter;
    renderIllWorkspace();
  }));
}

function renderIllFilteredView() {
  if (!els.illFilteredResults || !els.illFilteredViewTitle || !els.illFilteredViewSubtitle || !els.illFilteredSummaryCards) return;
  const activeTile = ILL_WORKFLOW_TILES.find((tile) => tile.key === state.activeIllFilter);
  if (!activeTile) {
    els.illFilteredViewTitle.textContent = 'Select a workflow tile';
    els.illFilteredViewSubtitle.textContent = 'Choose a dashboard tile to open a clean, filtered transaction view.';
    els.illFilteredSummaryCards.innerHTML = '';
    els.illFilteredResults.className = 'ill-filtered-results empty-state';
    els.illFilteredResults.textContent = 'Select a workflow tile to review matching interlibrary loan requests.';
    els.clearIllFilterBtn?.classList.add('hidden');
    return;
  }
  const entries = getIllTransactions(activeTile.type).filter((entry) => activeTile.filter(entry)).sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')) || Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
  els.illFilteredViewTitle.textContent = activeTile.label;
  els.illFilteredViewSubtitle.textContent = `${entries.length} ${activeTile.type} transaction${entries.length === 1 ? '' : 's'} currently match this workflow category.`;
  els.clearIllFilterBtn?.classList.remove('hidden');
  const overdueCount = entries.filter((entry) => entry.dueDate && new Date(entry.dueDate) < new Date(todayIso()) && !ILL_COMPLETED_STATUSES.has(entry.status)).length;
  els.illFilteredSummaryCards.innerHTML = [
    { label: 'Queue count', value: entries.length },
    { label: 'Overdue / urgent', value: overdueCount },
    { label: 'With notes', value: entries.filter((entry) => entry.notes).length },
  ].map((card) => `<article class="summary-card"><span class="summary-card-label">${card.label}</span><strong class="summary-card-value">${card.value}</strong></article>`).join('');
  if (!entries.length) {
    els.illFilteredResults.className = 'ill-filtered-results empty-state';
    els.illFilteredResults.textContent = 'No ILL transactions are currently in this workflow category.';
    return;
  }
  els.illFilteredResults.className = 'ill-filtered-results';
  els.illFilteredResults.innerHTML = `<div class="ill-filter-results-grid">${entries.map((entry) => {
    const selectOptions = (entry.type === 'incoming' ? ILL_INCOMING_STATUSES : ILL_OUTGOING_STATUSES).map((status) => `<option value="${status}" ${entry.status === status ? 'selected' : ''}>${status}</option>`).join('');
    const meta = entry.type === 'incoming'
      ? [
        `<span><strong>Patron:</strong> ${escapeHtml(entry.patronName || 'Unknown')}</span>`,
        `<span><strong>Library:</strong> ${escapeHtml(entry.lendingLibrary || 'Not assigned')}</span>`,
        `<span><strong>Pickup:</strong> ${escapeHtml(entry.pickupStatus || 'Awaiting processing')}</span>`,
        `<span><strong>Due:</strong> ${escapeHtml(entry.dueDate || 'Not set')}</span>`,
      ].join('')
      : [
        `<span><strong>Borrower:</strong> ${escapeHtml(entry.borrowingLibrary || 'Unknown')}</span>`,
        `<span><strong>Contact:</strong> ${escapeHtml(entry.contactInfo || 'Not provided')}</span>`,
        `<span><strong>Sent:</strong> ${escapeHtml(entry.sentDate || 'Not sent')}</span>`,
        `<span><strong>Item:</strong> ${escapeHtml(entry.itemRef || 'Unlinked')}</span>`,
      ].join('');
    return `<article class="ill-queue-card"><div class="panel-header compact"><div><h4>${escapeHtml(entry.title || 'Untitled')}</h4><p class="muted">${escapeHtml(entry.id)}${entry.author ? ` · ${escapeHtml(entry.author)}` : ''}</p></div><span class="badge badge-status ill-status-badge" data-status="${escapeHtml(entry.status.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(entry.status)}</span></div><div class="ill-queue-card-meta">${meta}</div><p class="muted ill-queue-card-notes">${escapeHtml(entry.notes || 'No notes recorded.')}</p><div class="row-actions"><label class="inline-select">Update status<select data-ill-status="${escapeHtml(entry.id)}" data-ill-type="${entry.type}">${selectOptions}</select></label><button class="button button-secondary" type="button" data-edit-ill="${escapeHtml(entry.id)}" data-edit-type="${entry.type}">Edit</button></div></article>`;
  }).join('')}</div>`;
  els.illFilteredResults.querySelectorAll('[data-ill-status]').forEach((select) => select.addEventListener('change', () => updateIllStatus(select.dataset.illType, select.dataset.illStatus, select.value)));
  els.illFilteredResults.querySelectorAll('[data-edit-ill]').forEach((button) => button.addEventListener('click', () => {
    const entry = getIllTransactions(button.dataset.editType).find((item) => item.id === button.dataset.editIll);
    if (entry) openIllRecordModal(button.dataset.editType, 'edit', entry);
  }));
}

function renderIllWorkspace() {
  renderIllWorkflowTiles();
  renderIllFilteredView();
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

function resetRegisterForm() {
  state.editingRegisterId = "";
  els.registerForm?.reset();
  populateStaticSelects();
  if (els.registerDate) els.registerDate.value = els.registerReportDate?.value || todayIso();
  if (els.registerFormTitle) els.registerFormTitle.textContent = "Add register transaction";
  if (els.registerSubmitBtn) els.registerSubmitBtn.textContent = "Record transaction";
  els.cancelRegisterEditBtn?.classList.add("hidden");
  toggleDonationFields();
}

function prefillRegisterForm({ amount = "", category = REGISTER_CATEGORIES[0] } = {}) {
  if (els.registerAmount && amount !== "") els.registerAmount.value = Number(amount).toFixed(2);
  if (els.registerCategory) els.registerCategory.value = category;
  if (els.registerDate) els.registerDate.value = els.registerReportDate?.value || els.registerDate.value || todayIso();
  toggleDonationFields();
}

function editRegisterEntry(entryId) {
  const entry = getRegisterTransactions().find((item) => item.id === entryId);
  if (!entry) return;
  state.editingRegisterId = entryId;
  populateStaticSelects();
  if (els.registerDate) els.registerDate.value = entry.date || todayIso();
  if (els.registerAmount) els.registerAmount.value = Number(entry.amount || 0).toFixed(2);
  if (els.registerCategory) els.registerCategory.value = entry.category || REGISTER_CATEGORIES[0];
  if (els.registerPaymentType) els.registerPaymentType.value = REGISTER_PAYMENT_TYPES.includes(entry.paymentType) ? entry.paymentType : REGISTER_PAYMENT_TYPES[0];
  if (els.registerStaffInitials) els.registerStaffInitials.value = entry.staffInitials || "";
  if (els.registerNotes) els.registerNotes.value = entry.notes || "";
  if (els.registerDonationPurpose) els.registerDonationPurpose.value = DONATION_PURPOSES.includes(entry.donationPurpose) ? entry.donationPurpose : "Other";
  if (els.registerDonationOther) els.registerDonationOther.value = DONATION_PURPOSES.includes(entry.donationPurpose) ? "" : (entry.donationPurpose || "");
  if (els.registerFormTitle) els.registerFormTitle.textContent = `Edit register transaction ${entry.id}`;
  if (els.registerSubmitBtn) els.registerSubmitBtn.textContent = "Save changes";
  els.cancelRegisterEditBtn?.classList.remove("hidden");
  toggleDonationFields();
  els.registerAmount?.focus();
}

function deleteRegisterEntry(entryId) {
  const entry = getRegisterTransactions().find((item) => item.id === entryId);
  if (!entry || entry.linkedFeeId) return;
  saveRegisterTransactions(getRegisterTransactions().filter((item) => item.id !== entryId));
  if (state.editingRegisterId === entryId) resetRegisterForm();
  if (els.registerMessage) els.registerMessage.textContent = `Deleted register transaction ${entry.id}.`;
  renderRegisterWorkspace();
  renderStatsPanel();
  renderDashboard();
}

function formatRegisterTimestamp(entry) {
  const stamp = Number(entry.createdAt || 0);
  if (!stamp) return formatDisplayDate(entry.date, entry.date || "—");
  const date = new Date(stamp);
  if (Number.isNaN(date.getTime())) return formatDisplayDate(entry.date, entry.date || "—");
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function renderRegisterTransactionsModal() {
  if (!els.registerTransactionsModalBody) return;
  const date = els.registerReportDate?.value || todayIso();
  const summary = summarizeRegisterDate(date);
  if (els.registerTransactionsModalTitle) els.registerTransactionsModalTitle.textContent = `Transactions for ${date}`;
  if (els.registerTransactionsModalSubtitle) els.registerTransactionsModalSubtitle.textContent = `${summary.entries.length} transaction${summary.entries.length === 1 ? "" : "s"} recorded for the selected day.`;
  els.registerTransactionsModalBody.innerHTML = summary.entries.length
    ? `<div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Time / date</th><th>Amount</th><th>Category</th><th>Payment type</th><th>Staff initials</th><th>Notes</th><th>Actions</th></tr></thead><tbody>${summary.entries.map((entry) => `<tr><td>${escapeHtml(formatRegisterTimestamp(entry))}</td><td>${formatCurrency(entry.amount)}</td><td>${escapeHtml(entry.category)}</td><td>${escapeHtml(entry.paymentType || "—")}</td><td>${escapeHtml(entry.staffInitials || "—")}</td><td>${escapeHtml([entry.donationPurpose, entry.notes].filter(Boolean).join(" · ") || "—")}</td><td><div class="table-actions">${entry.linkedFeeId ? '<span class="muted">Managed with fees</span>' : `<button class="button button-secondary" type="button" data-register-edit="${entry.id}">Edit</button><button class="button button-secondary" type="button" data-register-delete="${entry.id}">Delete</button>`}</div></td></tr>`).join("")}</tbody></table></div>`
    : '<div class="empty-state">No register transactions recorded for this date.</div>';
  els.registerTransactionsModalBody.querySelectorAll('[data-register-edit]').forEach((button) => button.addEventListener('click', () => {
    editRegisterEntry(button.dataset.registerEdit);
    closeModal(els.registerTransactionsModal);
  }));
  els.registerTransactionsModalBody.querySelectorAll('[data-register-delete]').forEach((button) => button.addEventListener('click', () => deleteRegisterEntry(button.dataset.registerDelete)));
}

function openRegisterTransactionsModal() {
  renderRegisterTransactionsModal();
  openModal(els.registerTransactionsModal);
}

function closeRegisterTransactionsModal() {
  closeModal(els.registerTransactionsModal);
}

function saveRegisterEntry(event) {
  event.preventDefault();
  const category = els.registerCategory?.value || REGISTER_CATEGORIES[0];
  const donationPurpose = category === "Cash Donations"
    ? (els.registerDonationPurpose?.value === "Other" ? els.registerDonationOther?.value : els.registerDonationPurpose?.value)
    : "";
  const existingEntry = getRegisterTransactions().find((item) => item.id === state.editingRegisterId);
  const paymentType = REGISTER_PAYMENT_TYPES.includes(els.registerPaymentType?.value || "") ? els.registerPaymentType.value : REGISTER_PAYMENT_TYPES[0];
  const entry = {
    id: existingEntry?.id || `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: els.registerDate?.value || todayIso(),
    amount: Number.parseFloat(els.registerAmount?.value || "0") || 0,
    category,
    paymentType,
    staffInitials: String(els.registerStaffInitials?.value || "").trim(),
    donationPurpose: String(donationPurpose || "").trim(),
    notes: String(els.registerNotes?.value || "").trim(),
    createdAt: existingEntry?.createdAt || Date.now(),
    linkedFeeId: existingEntry?.linkedFeeId || "",
  };
  const transactions = existingEntry
    ? getRegisterTransactions().map((item) => (item.id === existingEntry.id ? entry : item))
    : [entry, ...getRegisterTransactions()];
  saveRegisterTransactions(transactions);
  if (els.registerReportDate) els.registerReportDate.value = entry.date;
  if (els.registerMessage) els.registerMessage.textContent = `${existingEntry ? "Updated" : "Recorded"} register transaction ${entry.id}.`;
  resetRegisterForm();
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
  if (els.registerDate && !state.editingRegisterId) els.registerDate.value = date;
  if (els.registerSummaryCards) {
    els.registerSummaryCards.innerHTML = [
      { label: "Selected day total", value: formatCurrency(summary.total) },
      { label: "Selected date", value: date },
      { label: "Transactions", value: summary.entries.length },
      { label: "Cash donations", value: formatCurrency(summary.totalsByCategory["Cash Donations"]) },
    ].map((card) => `<article class="summary-card"><span class="summary-card-label">${card.label}</span><strong class="summary-card-value">${card.value}</strong></article>`).join("");
  }
  if (els.registerDailyTableWrap) {
    const recentList = summary.entries.length
      ? `<ul class="register-transaction-preview">${summary.entries.slice(0, 5).map((entry) => `<li><span><strong>${formatCurrency(entry.amount)}</strong> · ${escapeHtml(entry.category)}</span><span class="muted">${escapeHtml(formatRegisterTimestamp(entry))}</span></li>`).join("")}</ul>`
      : '<div class="empty-state">No register transactions recorded for this date.</div>';
    const categoryList = Object.entries(summary.totalsByCategory).map(([category, total]) => `<li><span>${escapeHtml(category)}</span><strong>${formatCurrency(total)}</strong></li>`).join("");
    els.registerDailyTableWrap.innerHTML = `<div class="register-breakdown"><h4>Daily category totals</h4><ul class="totals-list">${categoryList}</ul></div><div class="register-table-stack"><h4>Recent activity</h4><p class="muted">Use the transactions modal for the full daily list and edit/delete actions.</p>${recentList}</div>`;
  }
  renderRegisterTransactionsModal();
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
      <p class="muted holding-meta">${(() => { const summary = getItemHoldSummary(holding.materialNumbers?.[0] || ''); return summary.active ? `${summary.active} active hold request${summary.active === 1 ? '' : 's'} · ${summary.waiting} waiting · ${summary.ready} trapped/ready${summary.trapped ? ` · Shelf for ${summary.trapped.patronName}` : ''}` : 'No active holds for this item.'; })()}</p>
    `;
    article.querySelector('[data-act="remove-holding"]').addEventListener("click", () => {
      if (state.draftHoldings.length <= 1) return;
      state.draftHoldings = collectDraftHoldings().filter((entry) => entry.id !== holding.id);
      renderHoldingsEditor(state.draftHoldings);
      syncPrimaryHoldingFields();
    });
    const locationSelect = article.querySelector('[data-holding-field="location"]');
    locationSelect.value = holding.location || "";
    [...article.querySelectorAll("input, textarea, select")].forEach((field) => {
      field.addEventListener("input", () => {
        state.draftHoldings = collectDraftHoldings();
        syncPrimaryHoldingFields();
      });
    });
    els.holdingRows.appendChild(article);
  });
  syncPrimaryHoldingFields();
}

function syncPrimaryHoldingFields() {
  const primaryHolding = collectDraftHoldings()[0] || state.draftHoldings[0] || sanitizeHolding();
  const statusField = $("#recordStatus");
  if ($("#primaryMaterialNumber")) $("#primaryMaterialNumber").value = (primaryHolding.materialNumbers || []).join("\n");
  if ($("#callNumber") && !$("#callNumber").matches(":focus")) $("#callNumber").value = primaryHolding.callNumber || $("#callNumber").value || "";
  if ($("#location") && !$("#location").matches(":focus")) $("#location").value = primaryHolding.location || $("#location").value || "";
  if (statusField && !statusField.matches(":focus")) statusField.value = primaryHolding.status || "Available";
  fillWorkspace({ status: statusField?.value || primaryHolding.status || "Available" });
}

function syncHoldingDraftFromPrimary(renderEditor = true) {
  const holdings = collectDraftHoldings();
  const primary = sanitizeHolding({
    ...(holdings[0] || {}),
    status: $("#recordStatus").value,
    location: $("#location").value,
    callNumber: $("#callNumber").value,
    materialNumbers: $("#primaryMaterialNumber").value,
  });
  state.draftHoldings = [primary, ...holdings.slice(1)];
  if (renderEditor) renderHoldingsEditor(state.draftHoldings);
}

function buildCurrentFormRecord() {
  const selectedGenres = [...$("#genres").selectedOptions].map((option) => option.value);
  const custom = $("#genre").value.trim();
  const genres = [...new Set([...selectedGenres, ...(custom ? [custom] : [])])];
  syncHoldingDraftFromPrimary(false);
  const holdings = state.draftHoldings.map((holding) => sanitizeHolding(holding));
  const primaryHolding = holdings[0] || sanitizeHolding();
  return normalizeRecord({
    id: $("#recordId").value.trim() || crypto.randomUUID(),
    title: $("#title").value.trim(),
    subtitle: $("#subtitle").value.trim(),
    creator: $("#creator").value.trim(),
    statementOfResponsibility: $("#statementOfResponsibility").value.trim(),
    contributors: $("#contributors").value.trim(),
    format: $("#format").value || "Other",
    materialType: $("#materialType").value.trim(),
    edition: $("#edition").value.trim(),
    publisher: $("#publisher").value.trim(),
    publicationPlace: $("#publicationPlace").value.trim(),
    year: $("#year").value.trim(),
    languageCode: $("#languageCode").value.trim(),
    identifier: $("#identifier").value.trim() || $("#isbn").value.trim() || $("#upc").value.trim() || $("#oclcNumber").value.trim() || $("#lccn").value.trim(),
    isbn: $("#isbn").value.trim(),
    upc: $("#upc").value.trim(),
    lccn: $("#lccn").value.trim(),
    oclcNumber: $("#oclcNumber").value.trim(),
    localRecordId: $("#localRecordId").value.trim(),
    pageCount: $("#pageCount").value.trim(),
    physicalDetails: $("#physicalDetails").value.trim(),
    binding: $("#binding").value.trim(),
    dimensions: $("#dimensions").value.trim(),
    seriesName: $("#seriesName").value.trim(),
    seriesNumber: $("#seriesNumber").value.trim(),
    subjects: $("#subjects").value.trim(),
    genre: genres.join(", "),
    genres,
    audience: $("#audience").value.trim(),
    curatedShelf: $("#curatedShelf").value.trim(),
    summaryNote: $("#summaryNote").value.trim(),
    targetAudience: $("#targetAudience").value.trim(),
    bibliographyNote: $("#bibliographyNote").value.trim(),
    notes: $("#notes").value.trim(),
    deweyNumber: $("#deweyNumber").value.trim(),
    lcClassNumber: $("#lcClassNumber").value.trim(),
    callNumber: $("#callNumber").value.trim() || primaryHolding.callNumber,
    location: $("#location").value.trim() || primaryHolding.location,
    status: $("#recordStatus").value || primaryHolding.status || "Available",
    materialNumbers: holdings.flatMap((holding) => holding.materialNumbers || []),
    dateAdded: $("#dateAdded").value || new Date().toISOString().slice(0, 10),
    coverUrl: $("#coverUrl").value.trim(),
    circulationHistory: $("#circulationHistory").value.trim(),
    marcLeader: $("#marcLeader").value.trim(),
    marc008: $("#marc008").value.trim(),
    marcText: $("#marcText").value.trim(),
    description: $("#summaryNote").value.trim(),
    holdings,
  });
}

function updateMarcPreview() {
  const marcTextField = $("#marcText");
  if (!marcTextField || marcTextField.dataset.edited === "true") return;
  const draftRecord = buildCurrentFormRecord();
  marcTextField.value = toMarcMrk({
    ...draftRecord,
    title: draftRecord.title || "Untitled",
    creator: draftRecord.creator || "Unknown creator",
  }).join("\n");
}

function findPatronByCardNumber(cardNumber) {
  const normalized = String(cardNumber || "").trim().toLowerCase();
  if (!normalized) return null;
  return getPatrons().find((entry) => String(entry.cardNumber || "").trim().toLowerCase() === normalized) || null;
}

const HOLD_STATUS = {
  PENDING: 'Pending',
  TRAPPED: 'Trapped',
  READY: 'Ready for Pickup',
  PICKED_UP: 'Picked Up',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

const HOLD_CLOSED_STATUSES = [HOLD_STATUS.PICKED_UP, HOLD_STATUS.CANCELLED, HOLD_STATUS.EXPIRED];

function getHoldShelfDuration() {
  const configured = Number(state.settings.holdShelfDays || els.holdShelfDays?.value || 7);
  return Number.isFinite(configured) && configured > 0 ? configured : 7;
}

function addDays(isoDate, days) {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isoDateFromTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : '';
}

function normalizeHoldRecord(hold = {}) {
  const statusMap = { Active: HOLD_STATUS.PENDING, Ready: HOLD_STATUS.READY, Trapped: HOLD_STATUS.TRAPPED, 'Ready for pickup': HOLD_STATUS.READY, 'Ready for Pickup': HOLD_STATUS.READY };
  const normalizedStatus = statusMap[String(hold.status || '').trim()] || (Object.values(HOLD_STATUS).includes(hold.status) ? hold.status : HOLD_STATUS.PENDING);
  const placedAt = hold.placedAt || hold.datePlaced || new Date().toISOString();
  const stableId = hold.holdId || hold.id || crypto.randomUUID();
  return {
    holdId: stableId,
    id: stableId,
    recordId: hold.recordId || '',
    holdingId: hold.holdingId || '',
    itemId: hold.itemId || hold.materialNumber || '',
    materialNumber: hold.materialNumber || hold.itemId || '',
    itemTitle: hold.itemTitle || hold.title || 'Untitled',
    title: hold.itemTitle || hold.title || 'Untitled',
    patronId: hold.patronId || '',
    patronCardNumber: hold.patronCardNumber || '',
    patronName: hold.patronName || 'Unknown patron',
    type: hold.type || hold.requestType || 'Hold',
    requestType: hold.type || hold.requestType || 'Hold',
    status: normalizedStatus,
    queuePosition: Number(hold.queuePosition || 0) || 0,
    datePlaced: hold.datePlaced || placedAt,
    placedAt,
    trappedDate: hold.trappedDate || hold.trappedAt || '',
    readyForPickupDate: hold.readyForPickupDate || hold.readyAt || '',
    pickupExpirationDate: hold.pickupExpirationDate || hold.expiresAt || '',
    completedCancelledExpiredDate: hold.completedCancelledExpiredDate || hold.closedAt || hold.cancelledAt || hold.expiredAt || hold.pickedUpAt || '',
    pickedUpAt: hold.pickedUpAt || '',
    cancelledAt: hold.cancelledAt || '',
    expiredAt: hold.expiredAt || '',
    staffNotes: hold.staffNotes || hold.note || '',
    notificationStatus: hold.notificationStatus || 'Not Yet Notified',
    updatedAt: hold.updatedAt || placedAt,
  };
}

function compareHoldsByQueue(a, b) {
  const queueDiff = Number(a.queuePosition || 0) - Number(b.queuePosition || 0);
  if (queueDiff) return queueDiff;
  return String(a.datePlaced || a.placedAt || '').localeCompare(String(b.datePlaced || b.placedAt || ''));
}

function isHoldWaitingStatus(status = '') {
  return [HOLD_STATUS.PENDING, HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(status);
}

function isHoldClosedStatus(status = '') {
  return HOLD_CLOSED_STATUSES.includes(status);
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

function switchRecordTab() {}

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

function getPatronAccountStanding(patron) {
  const status = String(patron?.status || "Active");
  const expirationDate = String(patron?.expirationDate || "").trim();
  if (expirationDate && expirationDate < todayIso()) return "Expired";
  return status || "Active";
}

function getOverduePatronGroups(minDays = 1) {
  const patronsById = new Map(getPatrons().map((patron) => [patron.id, patron]));
  const groups = new Map();
  getOverdueLoans(minDays).forEach((entry) => {
    const patronId = entry.holding.checkedOutTo || "";
    const patron = patronsById.get(patronId) || null;
    const groupKey = patronId || `unknown-${entry.holding.checkedOutToName || entry.record.id}`;
    const existing = groups.get(groupKey) || {
      patronId,
      patron,
      patronName: patron?.name || entry.holding.checkedOutToName || "Unknown patron",
      cardNumber: patron?.cardNumber || "",
      accountStatus: getPatronAccountStanding(patron),
      items: [],
      totalFees: 0,
      lastNotice: null,
    };
    const balance = patron ? calculatePatronBalance(patron.id) : { unpaidAmount: 0 };
    existing.items.push({
      recordId: entry.record.id,
      holdingId: entry.holding.id,
      title: entry.record.title || "Untitled",
      materialType: entry.record.materialType || entry.record.format || "Other",
      materialNumber: entry.holding.materialNumbers?.[0] || "",
      dueDate: entry.holding.dueDate || "",
      overdueDays: entry.overdueDays,
    });
    existing.totalFees = balance.unpaidAmount;
    groups.set(groupKey, existing);
  });
  const history = getNoticeHistory();
  return [...groups.values()].map((group) => {
    const relevantHistory = history
      .filter((entry) => entry.patronId && entry.patronId === group.patronId)
      .sort((a, b) => String(b.dateGenerated || "").localeCompare(String(a.dateGenerated || "")));
    return {
      ...group,
      itemCount: group.items.length,
      maxOverdueDays: Math.max(...group.items.map((item) => item.overdueDays), 0),
      materialTypes: [...new Set(group.items.map((item) => item.materialType).filter(Boolean))],
      lastNotice: relevantHistory[0] || null,
    };
  }).sort((a, b) => b.maxOverdueDays - a.maxOverdueDays || a.patronName.localeCompare(b.patronName));
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
      <section class="dashboard-section">
        <div class="dashboard-section-heading">
          <div>
            <p class="dashboard-label">Key metrics</p>
            <h3>Operational overview</h3>
          </div>
          <p class="dashboard-section-note">A compact summary of live service, circulation, and collection activity.</p>
        </div>
        <div class="dashboard-stats-grid" aria-label="Primary dashboard stats">
          ${stats.slice(0, 8).map((card) => `<button class="dashboard-stat-card ${card.label.includes('Overdues') || card.label.includes('Missing') ? 'is-urgent' : ''}" type="button" data-dashboard-target="${card.target}" ${card.circulationTab ? `data-dashboard-circulation="${card.circulationTab}"` : ""}><span class="dashboard-stat-label">${card.label}</span><strong class="dashboard-stat-value">${card.value}</strong><span class="dashboard-stat-copy">${card.copy}</span></button>`).join("")}
        </div>
      </section>

      <section class="dashboard-layout-grid">
        <article class="dashboard-panel card-like dashboard-actions-panel">
          <div class="dashboard-panel-header">
            <div>
              <p class="dashboard-label">Quick actions</p>
              <h4>Start a task</h4>
            </div>
            <p class="muted">Common actions for service desk and catalog work.</p>
          </div>
          <div class="dashboard-actions-grid">
            ${actionPanel.slice(0, 8).map((action) => `<button class="dashboard-action-button" type="button" data-dashboard-target="${action.target}" ${action.circulationTab ? `data-dashboard-circulation="${action.circulationTab}"` : ""}>${action.label}</button>`).join("")}
          </div>
        </article>

        <article class="dashboard-panel card-like dashboard-tasks-panel">
          <div class="dashboard-panel-header">
            <div>
              <p class="dashboard-label">Task list</p>
              <h4>Needs attention</h4>
            </div>
            <p class="muted">Priority queues assembled from current system activity.</p>
          </div>
          <div class="dashboard-task-list">
            ${todaysWork.map((item) => item.count ? `<button class="dashboard-task-row ${item.urgent ? 'is-urgent' : ''}" type="button" data-dashboard-target="${item.target}" ${item.circulationTab ? `data-dashboard-circulation="${item.circulationTab}"` : ""}><span>${item.label}</span><span class="dashboard-task-count">${item.count}</span></button>` : `<div class="dashboard-task-row is-empty"><span>${item.empty}</span></div>`).join("")}
          </div>
        </article>

        <article class="dashboard-panel card-like dashboard-activity-panel">
          <div class="dashboard-panel-header">
            <div>
              <p class="dashboard-label">Recent activity</p>
              <h4>Latest updates</h4>
            </div>
            <button class="dashboard-inline-link" type="button" data-dashboard-target="stats">Open reports</button>
          </div>
          ${renderList(recentActivity, (entry) => `<li><button class="dashboard-activity-row" type="button" data-dashboard-target="${entry.target}" ${entry.target === 'circulation' ? 'data-dashboard-circulation="checkout"' : ''}><span class="dashboard-activity-copy"><strong>${entry.text}</strong><span class="muted">${formatRelativeTime(entry.timestamp)}</span></span></button></li>`, "No recent staff activity yet.")}
        </article>

        <article class="dashboard-panel card-like dashboard-preview-panel">
          <div class="dashboard-panel-header">
            <div>
              <p class="dashboard-label">Service watch</p>
              <h4>Follow-up preview</h4>
            </div>
            <p class="muted">Selected items that need quick review.</p>
          </div>
          <div class="dashboard-preview-stack">
            <section>
              <h5>Overdues</h5>
              ${renderList(overduePreview, ({ record, holding, overdueDays }) => `<li><button class="dashboard-preview-row" type="button" data-dashboard-target="circulation"><strong>${record.title || 'Untitled'}</strong><span>${holding.checkedOutToName || 'Unknown patron'} · Due ${holding.dueDate || 'No due date'} · ${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue</span></button></li>`, "No items are currently overdue.")}
            </section>
            <section>
              <h5>Pending materials</h5>
              ${renderList(pendingPreview, (material) => `<li><button class="dashboard-preview-row" type="button" data-dashboard-target="acquisitions"><strong>${material.title}</strong><span>${material.orderName || 'No order'} · ${material.materialNumber || 'No material #'} · ${material.status || 'Pending Material'}</span></button></li>`, "No pending materials awaiting activation.")}
            </section>
            <section>
              <h5>Patron alerts</h5>
              ${renderList(patronPreview, (patron) => `<li><button class="dashboard-preview-row" type="button" data-dashboard-target="patrons"><strong>${patron.name || 'Unnamed patron'}</strong><span>${patron.cardNumber || 'No card'} · ${patron.status || 'Active'}${patron.blocks ? ` · ${patron.blocks}` : patron.alerts ? ` · ${patron.alerts}` : ''}</span></button></li>`, "No patron alerts or account issues right now.")}
            </section>
          </div>
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

function getReceiptSettings() {
  const receiptSettings = state.settings.receiptSettings && typeof state.settings.receiptSettings === "object" ? state.settings.receiptSettings : {};
  return {
    showLogo: Boolean(receiptSettings.showLogo),
    logoUrl: String(receiptSettings.logoUrl || "").trim(),
    contactInfo: String(receiptSettings.contactInfo || "").trim(),
    footerMessage: String(receiptSettings.footerMessage || "").trim(),
  };
}

function saveReceiptSettings(nextSettings = {}) {
  state.settings.receiptSettings = { ...getReceiptSettings(), ...nextSettings };
  saveSettings(state.settings);
}

function formatReceiptMultiline(text = "") {
  return escapeHtml(String(text || "").trim()).replace(/\n/g, "<br>");
}

function buildReceiptMarkup(summary, { printMode = false } = {}) {
  const settings = getReceiptSettings();
  return `
    <article class="receipt-card${printMode ? " receipt-card-print" : ""}">
      ${settings.showLogo && settings.logoUrl ? `<div class="receipt-logo-wrap"><img class="receipt-logo" src="${escapeHtml(settings.logoUrl)}" alt="Library logo" /></div>` : ""}
      ${settings.contactInfo ? `<div class="receipt-contact">${formatReceiptMultiline(settings.contactInfo)}</div>` : ""}
      <div class="receipt-summary-grid">
        <div><span class="receipt-label">Patron</span><strong>${escapeHtml(summary.patron)}</strong></div>
        <div><span class="receipt-label">Checked out</span><strong>${escapeHtml(summary.checkedOutAt)}</strong></div>
        <div><span class="receipt-label">Items this checkout</span><strong>${summary.items.length}</strong></div>
        <div><span class="receipt-label">Items currently out</span><strong>${summary.itemsCurrentlyOut}</strong></div>
      </div>
      <div class="receipt-due-callout">${escapeHtml(summary.dueHeadline)}</div>
      <ul class="receipt-list">
        ${summary.items.map((item) => `
          <li class="receipt-line-item">
            <div class="receipt-line-copy">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.author || "Author unavailable")}</span>
            </div>
            <div class="receipt-line-due">${escapeHtml(item.dueDateLabel)}</div>
          </li>`).join("")}
      </ul>
      ${settings.footerMessage ? `<div class="receipt-footer-message">${formatReceiptMultiline(settings.footerMessage)}</div>` : ""}
    </article>`;
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
  els.checkoutReceipt.innerHTML = buildReceiptMarkup(summary);
}

function printCheckoutReceipt() {
  if (!state.lastCheckoutReceipt) {
    setCirculationMessage("Complete a checkout before printing a receipt.", "error");
    return;
  }
  const printWindow = window.open("", "checkout-receipt-print", "width=420,height=720");
  if (!printWindow) {
    setCirculationMessage("Unable to open the print dialog. Check browser pop-up settings.", "error");
    return;
  }
  printWindow.document.write(`<!doctype html><html><head><title>Checkout Receipt</title><style>
    body{margin:0;background:#fff;color:#000;font-family:Arial,sans-serif;}
    .receipt-card{width:80mm;box-sizing:border-box;margin:0 auto;padding:12px 14px;display:grid;gap:10px;}
    .receipt-logo-wrap{text-align:center;}.receipt-logo{max-width:100%;max-height:72px;object-fit:contain;}
    .receipt-contact,.receipt-footer-message{text-align:center;font-size:12px;line-height:1.4;word-break:break-word;}
    .receipt-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;}
    .receipt-label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;}
    .receipt-due-callout,.receipt-line-due{border:2px solid #000;font-weight:700;text-align:center;}
    .receipt-due-callout{padding:8px;font-size:16px;}
    .receipt-list{list-style:none;padding:0;margin:0;display:grid;gap:8px;}
    .receipt-line-item{display:grid;gap:4px;padding-bottom:8px;border-bottom:1px dashed #000;}
    .receipt-line-copy strong,.receipt-line-copy span{display:block;word-break:break-word;}
    .receipt-line-copy span{font-size:12px;}.receipt-line-due{padding:5px 6px;font-size:15px;}
    @page{size:80mm auto;margin:4mm;}
  </style></head><body>${buildReceiptMarkup(state.lastCheckoutReceipt, { printMode: true })}<script>window.onload=()=>{window.print();window.close();};</script></body></html>`);
  printWindow.document.close();
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

function renderReceiptSettings() {
  const settings = getReceiptSettings();
  if (els.receiptLogoEnabled) els.receiptLogoEnabled.checked = settings.showLogo;
  if (els.receiptLogoUrl) els.receiptLogoUrl.value = settings.logoUrl;
  if (els.receiptContactInfo) els.receiptContactInfo.value = settings.contactInfo;
  if (els.receiptFooterMessage) els.receiptFooterMessage.value = settings.footerMessage;
}

function saveReceiptSettingsFromForm(event) {
  event.preventDefault();
  saveReceiptSettings({
    showLogo: Boolean(els.receiptLogoEnabled?.checked),
    logoUrl: String(els.receiptLogoUrl?.value || "").trim(),
    contactInfo: String(els.receiptContactInfo?.value || "").trim(),
    footerMessage: String(els.receiptFooterMessage?.value || "").trim(),
  });
  renderReceiptSettings();
  if (state.lastCheckoutReceipt) renderCheckoutReceipt(state.lastCheckoutReceipt);
  if (els.receiptSettingsMessage) {
    els.receiptSettingsMessage.textContent = "Receipt settings saved.";
    els.receiptSettingsMessage.className = "status-message is-success";
  }
}

function handleReceiptLogoUpload(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (els.receiptLogoUrl) els.receiptLogoUrl.value = String(reader.result || "");
  };
  reader.readAsDataURL(file);
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
  return state.queuedCheckoutItems.map((entry) => entry.overrideDueDate || entry.autoDueDate).filter(Boolean).sort()[0] || "";
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

function getCheckoutPatron() {
  return getPatrons().find((entry) => entry.id === state.checkoutPatronId) || null;
}

function getPatronWarnings(patron, summary = getPatronAccountSummary(patron)) {
  if (!patron) return [];
  const warnings = [];
  const status = String(patron.status || 'Active');
  const expirationDate = String(patron.expirationDate || '').trim();
  const today = todayIso();
  if (status && status !== 'Active') warnings.push({ type: 'error', label: status, detail: 'Patron account is not in normal active standing.' });
  if (expirationDate && expirationDate < today) warnings.push({ type: 'error', label: 'Expired account', detail: `Expired ${expirationDate}.` });
  if (summary.unpaidAmount > 0) warnings.push({ type: 'warning', label: 'Balance due', detail: `${formatCurrency(summary.unpaidAmount)} in unpaid fines / fees.` });
  if (summary.overdue.length) warnings.push({ type: 'warning', label: 'Overdue items', detail: `${summary.overdue.length} item${summary.overdue.length === 1 ? '' : 's'} already overdue.` });
  String(patron.blocks || '').split(/\s*,\s*/).filter(Boolean).forEach((block) => warnings.push({ type: 'error', label: 'Block', detail: block }));
  String(patron.alerts || '').split(/\s*,\s*/).filter(Boolean).forEach((alert) => warnings.push({ type: 'warning', label: 'Alert', detail: alert }));
  return warnings;
}

function renderCheckoutQueue() {
  if (!els.checkOutQueue) return;
  els.checkOutQueue.innerHTML = '';
  if (!state.queuedCheckoutItems.length) return;

  state.queuedCheckoutItems.forEach((entry) => {
    const li = document.createElement('li');
    const dueDate = entry.overrideDueDate || entry.autoDueDate || '';
    li.classList.add('checkout-queue-item');
    li.innerHTML = `<div class="checkout-queue-main"><img class="checkout-thumb" src="${entry.coverUrl || ''}" alt="" /><div class="checkout-queue-copy"><strong>${entry.title}</strong><span class="muted">${entry.materialNumber}${entry.materialType ? ` · ${entry.materialType}` : ''}</span><span class="checkout-due-emphasis">${dueDate ? `Due ${dueDate}` : 'No due date available'}</span></div><label class="checkout-inline-due-date"><span>Due date override</span><input type="date" value="${dueDate}" /></label></div><div class="checkout-queue-actions"><button class="button button-secondary" type="button">Remove</button></div>`;
    const img = li.querySelector('img');
    if (!entry.coverUrl) img.classList.add('hidden');
    li.querySelector('input').addEventListener('input', (event) => {
      entry.overrideDueDate = event.target.value;
      renderCheckoutQueue();
    });
    li.querySelector('button').addEventListener('click', () => {
      state.queuedCheckoutItems = state.queuedCheckoutItems.filter((item) => item.materialNumber !== entry.materialNumber);
      refreshQueuedDueDate();
      renderCheckoutQueue();
      renderCheckoutGateState();
    });
    els.checkOutQueue.appendChild(li);
  });
}

function renderCheckoutGateState() {
  const patron = getCheckoutPatron();
  const locked = !patron;
  if (els.checkOutMaterialNumber) els.checkOutMaterialNumber.disabled = locked;
  if (els.queueCheckoutItemBtn) els.queueCheckoutItemBtn.disabled = locked;
    if (els.checkoutGateBadge) {
    els.checkoutGateBadge.textContent = locked ? 'Patron required' : `Patron loaded: ${patron.name}`;
    els.checkoutGateBadge.className = `circulation-gate-badge ${locked ? 'is-locked' : 'is-ready'}`;
  }
  if (els.checkoutGateMessage) {
    els.checkoutGateMessage.textContent = locked
      ? 'Scan patron card before scanning items.'
      : 'Patron verified. Scan items into the queue below.';
  }
}

function renderCheckoutPatronPreview(cardNumber = els.checkOutCardNumber?.value || '') {
  if (!els.checkOutPatronPreview) return;
  const patron = findPatronByCardNumber(cardNumber);
  if (getCheckoutPatron() && patron && patron.id === state.checkoutPatronId) {
    els.checkOutPatronPreview.textContent = '';
    els.checkOutPatronPreview.className = 'status-message hidden';
    return;
  }
  els.checkOutPatronPreview.textContent = cardNumber.trim()
    ? (patron ? `Ready to load ${patron.name} · Card #${patron.cardNumber}` : 'No patron found for that card number.')
    : '';
  els.checkOutPatronPreview.className = `status-message${cardNumber.trim() ? '' : ' hidden'}`;
  if (cardNumber.trim() && !patron) els.checkOutPatronPreview.classList.add('is-error');
  if (cardNumber.trim()) els.checkOutPatronPreview.classList.remove('hidden');
}

function renderCheckoutPatronContext() {
  const patron = getCheckoutPatron();
  if (!els.checkoutPatronCard || !els.checkoutPatronItems) return;
  if (!patron) {
    els.checkoutPatronCard.className = 'checkout-patron-card empty-state';
    els.checkoutPatronCard.innerHTML = 'Ready for patron details.';
    els.checkoutPatronItems.className = 'card-like checkout-context-panel empty-state';
    els.checkoutPatronItems.innerHTML = '';
    renderCheckoutGateState();
    return;
  }
  const summary = getPatronAccountSummary(patron);
  const warnings = getPatronWarnings(patron, summary);
  els.checkoutPatronCard.className = 'checkout-patron-card';
  els.checkoutPatronCard.innerHTML = `
    <div class="checkout-card-chip-row"><span class="checkout-card-chip checkout-card-chip-status">${escapeHtml(patron.status || 'Active')}</span></div>
    <div class="checkout-card-identity"><div><p class="checkout-card-label">Patron</p><h4>${escapeHtml(patron.name || 'Unnamed patron')}</h4></div><div><p class="checkout-card-label">Card number</p><strong>${escapeHtml(patron.cardNumber || 'Not assigned')}</strong></div></div>
    <div class="checkout-card-grid">
      <div><span>Expiration</span><strong>${escapeHtml(patron.expirationDate || 'Not set')}</strong></div>
      <div><span>Items out</span><strong>${summary.loans.length}</strong></div>
      <div><span>Holds</span><strong>${summary.holds.length}</strong></div>
      <div><span>Balance</span><strong>${formatCurrency(summary.unpaidAmount)}</strong></div>
    </div>
    <div class="checkout-card-warnings">${warnings.length ? warnings.map((warning) => `<div class="checkout-warning-row is-${warning.type}"><strong>${escapeHtml(warning.label)}</strong><span>${escapeHtml(warning.detail)}</span></div>`).join('') : '<div class="checkout-warning-row is-clear"><strong>Account clear</strong><span>No blocks or urgent patron alerts.</span></div>'}</div>
    <div class="checkout-card-actions"><button class="button button-secondary" type="button" id="openPatronAccountBtn">Open Patron Account</button></div>`;
  els.checkoutPatronCard.querySelector('#openPatronAccountBtn')?.addEventListener('click', () => {
    selectPatron(patron.id);
    switchIlsSection('patrons');
  });

  els.checkoutPatronItems.className = 'card-like checkout-context-panel';
  els.checkoutPatronItems.innerHTML = `
    <div class="panel-header compact"><div><h4>Items currently out</h4><p class="muted">Current account context for renewal or review.</p></div></div>
    ${summary.loans.length ? `<ul class="patron-activity-list checkout-current-items-list">${summary.loans.map(({ record, holding }) => {
      const overdue = holding.dueDate && holding.dueDate < todayIso();
      return `<li class="checkout-queue-item"><div class="checkout-queue-main"><img class="checkout-thumb ${record.coverUrl ? '' : 'hidden'}" src="${record.coverUrl || ''}" alt="" /><div class="checkout-queue-copy"><strong>${escapeHtml(record.title || 'Untitled')}</strong><span class="muted">${escapeHtml(holding.materialNumbers?.[0] || 'No barcode')}</span><span class="checkout-due-emphasis">${escapeHtml(holding.dueDate ? `Due ${holding.dueDate}` : 'No due date')}</span></div></div><div class="checkout-current-item-meta">${overdue ? '<span class="badge badge-danger">Overdue</span>' : ''}<button class="button button-secondary checkout-renew-btn" type="button" data-record-id="${escapeHtml(record.id)}" data-holding-id="${escapeHtml(holding.id)}">Renew</button></div></li>`;
    }).join('')}</ul>` : ''}`;
  els.checkoutPatronItems.querySelectorAll('.checkout-renew-btn').forEach((button) => {
    button.addEventListener('click', () => renewPatronLoan(button.dataset.recordId, button.dataset.holdingId));
  });
  renderCheckoutGateState();
}

function setCirculationMessage(message = "", type = "info") {
  if (!els.circulationMessage) return;
  els.circulationMessage.textContent = message;
  els.circulationMessage.className = "status-message circulation-message-panel";
  els.circulationMessage.classList.toggle("warning", type === "error");
  els.circulationMessage.classList.toggle("is-error", type === "error");
}

function appendCirculationHistory(record, message = "") {
  const entry = String(message || "").trim();
  if (!entry) return String(record?.circulationHistory || "").trim();
  const stamped = `${new Date().toISOString()} — ${entry}`;
  return [stamped, String(record?.circulationHistory || "").trim()].filter(Boolean).join("\n");
}

function getCheckoutDueDate(days = 14) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString().slice(0, 10);
}

function clearCheckoutSession() {
  state.checkoutPatronId = "";
  state.queuedCheckoutItems = [];
  if (els.checkOutForm) els.checkOutForm.reset();
  renderCheckoutQueue();
  renderCheckoutPatronPreview();
  renderCheckoutPatronContext();
  renderCheckoutGateState();
  updateCheckoutStatus("Awaiting patron load.", "Items will display updated status here.");
  setCirculationMessage("Checkout session cleared.", "info");
}

function loadCheckoutPatron() {
  const cardNumber = String(els.checkOutCardNumber?.value || "").trim();
  if (!cardNumber) {
    setCirculationMessage("Scan or enter a patron card number first.", "error");
    return null;
  }
  const patron = findPatronByCardNumber(cardNumber);
  if (!patron) {
    state.checkoutPatronId = "";
    renderCheckoutPatronPreview(cardNumber);
    renderCheckoutPatronContext();
    renderCheckoutGateState();
    setCirculationMessage("No patron found with that card number.", "error");
    return null;
  }
  state.checkoutPatronId = patron.id;
  renderCheckoutPatronPreview(cardNumber);
  renderCheckoutPatronContext();
  renderCheckoutGateState();
  updateCheckoutStatus(`Ready to scan items for ${patron.name}.`, "Queue items, then submit checkout.");
  setCirculationMessage(`Loaded ${patron.name} for checkout.`, "success");
  return patron;
}

function queueCheckoutItem() {
  const patron = getCheckoutPatron() || loadCheckoutPatron();
  if (!patron) return null;
  const materialNumber = String(els.checkOutMaterialNumber?.value || "").trim();
  if (!materialNumber) {
    setCirculationMessage("Scan an item material number first.", "error");
    return null;
  }
  const match = getRecordByMaterialNumber(materialNumber);
  if (!match) {
    setCirculationMessage(`Material number ${materialNumber} was not found.`, "error");
    return null;
  }
  const { record, holding } = match;
  if (String(holding.status) === "On Loan") {
    setCirculationMessage(`${record.title || "This item"} is already checked out.`, "error");
    return null;
  }
  if (state.queuedCheckoutItems.some((entry) => entry.materialNumber === materialNumber)) {
    setCirculationMessage(`${record.title || "This item"} is already in the checkout queue.`, "error");
    return null;
  }

  state.queuedCheckoutItems.push({
    recordId: record.id,
    holdingId: holding.id,
    materialNumber,
    title: record.title || "Untitled",
    author: record.creator || "",
    materialType: record.materialType || record.format || "",
    coverUrl: record.coverUrl || "",
    autoDueDate: getCheckoutDueDate(),
    overrideDueDate: "",
  });

  if (els.checkOutMaterialNumber) els.checkOutMaterialNumber.value = "";
  renderCheckoutQueue();
  renderCheckoutGateState();
  updateCheckoutStatus(`Queued ${record.title || "item"}.`, `Queue now has ${state.queuedCheckoutItems.length} item${state.queuedCheckoutItems.length === 1 ? "" : "s"}.`);
  setCirculationMessage(`Queued ${record.title || "item"} for checkout.`, "success");
  return match;
}

function checkOutRecord(event) {
  event?.preventDefault();
  const patron = getCheckoutPatron() || loadCheckoutPatron();
  if (!patron) return false;
  if (!state.queuedCheckoutItems.length) {
    setCirculationMessage("Queue at least one item before completing checkout.", "error");
    return false;
  }

  const checkedOutItems = [];
  state.records = state.records.map((record) => {
    const queuedForRecord = state.queuedCheckoutItems.filter((entry) => entry.recordId === record.id);
    if (!queuedForRecord.length) return record;
    const holdings = (record.holdings || []).map((holding) => {
      const queued = queuedForRecord.find((entry) => entry.holdingId === holding.id);
      if (!queued) return holding;
      const dueDate = queued.overrideDueDate || queued.autoDueDate || getCheckoutDueDate();
      checkedOutItems.push({
        title: record.title || "Untitled",
        author: record.creator || "",
        materialNumber: queued.materialNumber,
        dueDateLabel: dueDate,
      });
      return {
        ...holding,
        status: "On Loan",
        checkedOutTo: patron.id,
        checkedOutToName: patron.name || "",
        checkedOutAt: new Date().toISOString(),
        dueDate,
      };
    });

    return normalizeRecord({
      ...record,
      holdings,
      circulationHistory: appendCirculationHistory(record, `Checked out to ${patron.name || "Unknown patron"} (${patron.cardNumber || "No card"})`),
    });
  });

  saveRecords(state.records);
  state.lastCheckoutReceipt = {
    patron: patron.name || "Unnamed patron",
    checkedOutAt: new Date().toLocaleString(),
    items: checkedOutItems,
    itemsCurrentlyOut: getPatronLoanEntries(patron.id).length,
    dueHeadline: checkedOutItems.map((item) => item.dueDateLabel).filter(Boolean).sort()[0] || "See item list for due dates",
  };
  renderCheckoutReceipt(state.lastCheckoutReceipt);
  state.queuedCheckoutItems = [];
  if (els.checkOutMaterialNumber) els.checkOutMaterialNumber.value = "";
  renderCheckoutQueue();
  renderCheckoutPatronContext();
  renderCheckoutGateState();
  renderRecentTransactions(els.recentCheckoutTransactions, "checkout");
  renderDashboard();
  renderStatsPanel();
  updateCheckoutStatus(`Checked out ${checkedOutItems.length} item${checkedOutItems.length === 1 ? "" : "s"}.`, "Checkout complete.");
  setCirculationMessage(`Checked out ${checkedOutItems.length} item${checkedOutItems.length === 1 ? "" : "s"} to ${patron.name}.`, "success");
  return true;
}

function checkInByMaterialNumber(event) {
  event?.preventDefault();
  const materialNumber = String(els.checkInMaterialNumber?.value || "").trim();
  if (!materialNumber) {
    setCirculationMessage("Scan an item material number first.", "error");
    return null;
  }
  const match = getRecordByMaterialNumber(materialNumber);
  if (!match) {
    setCirculationMessage(`Material number ${materialNumber} was not found.`, "error");
    return null;
  }
  if (els.checkInForm) els.checkInForm.reset();
  return checkInRecord(match.record.id, match.holding.id);
}

async function hydrateRemoteRecords() {
  if (!isFirebaseConfigured()) return;
  try {
    const remoteRecords = await loadRecordsFromRemote();
    if (!remoteRecords.length) return;
    state.records = remoteRecords.map(normalizeRecord);
    saveRecords(state.records);
    render();
  } catch (error) {
    console.error("Unable to hydrate remote records.", error);
  }
}

function getPatronLoanEntries(patronId) {
  return state.records.flatMap((record) => (record.holdings || [])
    .filter((holding) => holding.checkedOutTo === patronId && String(holding.status) === 'On Loan')
    .map((holding) => ({ record, holding })));
}

function getPatronAccountSummary(patron) {
  const loans = getPatronLoanEntries(patron.id);
  const holds = getPatronHolds(patron.id);
  const overdue = loans.filter(({ holding }) => holding.dueDate && holding.dueDate < todayIso());
  const history = state.records.flatMap((record) => String(record.circulationHistory || '')
    .split(/\n+/)
    .filter(Boolean)
    .filter((line) => line.includes(patron.name || '') || line.includes(patron.cardNumber || ''))
    .map((line) => ({ title: record.title || 'Untitled', line })));
  const balance = calculatePatronBalance(patron.id);
  return { loans, holds, overdue, history: history.slice(-5).reverse(), ...balance };
}

function selectPatron(patronId = '') {
  state.selectedPatronId = patronId;
  const patron = getPatrons().find((entry) => entry.id === patronId);
  if (patron && els.patronSearchInput) {
    state.patronSearchQuery = `${patron.name || ""}`.trim() || patron.cardNumber || "";
    els.patronSearchInput.value = state.patronSearchQuery;
  }
  hidePatronSearchResults();
  renderPatronDetail();
}

function getFilteredPatronResults() {
  const query = String(state.patronSearchQuery || "").trim().toLowerCase();
  const patrons = getPatrons().slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  if (!query) return patrons.slice(0, 8);
  return patrons.filter((patron) => [patron.name, patron.cardNumber].some((value) => String(value || "").toLowerCase().includes(query))).slice(0, 8);
}

function hidePatronSearchResults() {
  if (!els.patronSearchResults) return;
  els.patronSearchResults.classList.add("hidden");
}

function renderPatronSearchResults() {
  if (!els.patronSearchResults) return;
  const patrons = getPatrons();
  if (els.patronListSummary) els.patronListSummary.textContent = `${patrons.length} patron account${patrons.length === 1 ? "" : "s"}`;
  const results = getFilteredPatronResults();
  if (!patrons.length) {
    els.patronSearchResults.classList.remove("hidden");
    els.patronSearchResults.innerHTML = '<div class="empty-state">No patron accounts yet. Add a new patron to get started.</div>';
    state.selectedPatronId = "";
    state.patronSearchIndex = -1;
    return;
  }
  if (!results.length && state.patronSearchQuery.trim()) {
    els.patronSearchResults.classList.remove("hidden");
    els.patronSearchResults.innerHTML = '<div class="empty-state">No patrons match that search.</div>';
    state.patronSearchIndex = -1;
    return;
  }
  if (!state.patronSearchQuery.trim()) {
    hidePatronSearchResults();
    return;
  }
  state.patronSearchIndex = Math.min(Math.max(state.patronSearchIndex, 0), Math.max(results.length - 1, 0));
  els.patronSearchResults.classList.remove("hidden");
  els.patronSearchResults.innerHTML = results.map((patron, index) => `<button class="patron-search-result ${index === state.patronSearchIndex ? "is-active" : ""}" type="button" role="option" aria-selected="${index === state.patronSearchIndex}" data-patron-result="${patron.id}"><strong>${escapeHtml(patron.name || "Unnamed patron")}</strong><span>Card #${escapeHtml(patron.cardNumber || "Not assigned")}</span></button>`).join("");
  [...els.patronSearchResults.querySelectorAll("[data-patron-result]")].forEach((button) => button.addEventListener("click", () => selectPatron(button.dataset.patronResult)));
}

function getFilteredNoticeGroups() {
  const age = Number(els.noticeAgeFilter?.value || 1);
  const patronQuery = String(els.noticePatronFilter?.value || "").trim().toLowerCase();
  const cardQuery = String(els.noticeCardFilter?.value || "").trim().toLowerCase();
  const materialTypeFilter = String(els.noticeMaterialTypeFilter?.value || "all");
  const statusFilter = String(els.noticeAccountStatusFilter?.value || "all");
  return getOverduePatronGroups(age).filter((group) => {
    if (patronQuery && !String(group.patronName || "").toLowerCase().includes(patronQuery)) return false;
    if (cardQuery && !String(group.cardNumber || "").toLowerCase().includes(cardQuery)) return false;
    if (materialTypeFilter !== "all" && !group.materialTypes.includes(materialTypeFilter)) return false;
    if (statusFilter !== "all" && group.accountStatus !== statusFilter) return false;
    return true;
  });
}

function populateNoticeMaterialTypeFilter() {
  if (!els.noticeMaterialTypeFilter) return;
  const types = [...new Set(getOverduePatronGroups(1).flatMap((group) => group.materialTypes))].sort((a, b) => a.localeCompare(b));
  const current = els.noticeMaterialTypeFilter.value || "all";
  els.noticeMaterialTypeFilter.innerHTML = `<option value="all">All material types</option>${types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}`;
  els.noticeMaterialTypeFilter.value = types.includes(current) || current === "all" ? current : "all";
}

function openNoticesForPatron(patronId = "") {
  state.activeNoticePatronId = patronId;
  switchIlsSection("patrons", "patron-notices");
  if (patronId) {
    const patron = getPatrons().find((entry) => entry.id === patronId);
    if (els.noticePatronFilter) els.noticePatronFilter.value = patron?.name || "";
  }
  renderNoticesWorkspace();
}

function generateNoticeRecord(patronId, templateId) {
  const group = getOverduePatronGroups(1).find((entry) => entry.patronId === patronId);
  const template = getNoticeTemplates().find((entry) => entry.id === templateId) || getNoticeTemplates()[0];
  if (!group || !template) return null;
  const settings = getNoticeSettings();
  const record = {
    id: `notice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    patronId: group.patronId,
    patronName: group.patronName,
    cardNumber: group.cardNumber,
    noticeType: template.name,
    templateId: template.id,
    dateGenerated: new Date().toISOString(),
    dateSent: "",
    deliveryMethod: "Print",
    staffUser: "STAFF",
    accountStatus: group.accountStatus,
    closingMessage: settings.closingMessage || template.closing || "",
    snapshotItems: group.items.map((item) => ({ ...item })),
    balanceSummary: group.totalFees,
    subject: template.subject,
    body: template.body,
  };
  const history = [record, ...getNoticeHistory()];
  saveNoticeHistory(history);
  state.activeNoticeRecordId = record.id;
  state.activeNoticePatronId = patronId;
  renderNoticesWorkspace();
  renderDashboard();
  return record;
}

function updateNoticeRecord(noticeId, updates = {}) {
  const next = getNoticeHistory().map((entry) => entry.id === noticeId ? { ...entry, ...updates } : entry);
  saveNoticeHistory(next);
  renderNoticesWorkspace();
}

function buildNoticePreviewMarkup(notice) {
  if (!notice) return '<div class="empty-state">Select a patron and generate a notice to preview it here.</div>';
  const libraryHeader = (getReceiptSettings().contactInfo || "Catalog Staff Workspace").split("\n").filter(Boolean);
  return `
    <article class="notice-print-sheet" data-notice-id="${escapeHtml(notice.id)}">
      <header class="notice-print-header">
        <div><h4>${escapeHtml(libraryHeader[0] || "Library")}</h4><p>${escapeHtml(libraryHeader.slice(1).join(" · ") || "Overdue notice")}</p></div>
        <div class="notice-print-meta"><strong>${escapeHtml(notice.noticeType)}</strong><span>${formatDisplayDate(notice.dateGenerated)}</span></div>
      </header>
      <div class="notice-print-address">
        <p><strong>${escapeHtml(notice.patronName)}</strong></p>
        <p>Card #: ${escapeHtml(notice.cardNumber || "Not assigned")}</p>
        <p>Date: ${formatDisplayDate(notice.dateGenerated)}</p>
      </div>
      <p>${escapeHtml(notice.body || "")}</p>
      <table class="serials-table notice-print-table"><thead><tr><th>Title</th><th>Due date</th><th>Days overdue</th><th>Material type</th></tr></thead><tbody>${notice.snapshotItems.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.dueDate || "—")}</td><td>${escapeHtml(String(item.overdueDays || 0))}</td><td>${escapeHtml(item.materialType || "—")}</td></tr>`).join("")}</tbody></table>
      <p><strong>Balance / fines:</strong> ${formatCurrency(notice.balanceSummary || 0)}</p>
      <label><span>Closing message</span><textarea id="noticeClosingMessageInput" rows="3">${escapeHtml(notice.closingMessage || "")}</textarea></label>
      <p>${escapeHtml(notice.closingMessage || "")}</p>
      <div class="row-actions">
        <label><span>Delivery method</span><select id="noticeDeliveryMethodSelect"><option ${notice.deliveryMethod === "Print" ? "selected" : ""}>Print</option><option ${notice.deliveryMethod === "Email" ? "selected" : ""}>Email</option><option ${notice.deliveryMethod === "SMS" ? "selected" : ""}>SMS</option><option ${notice.deliveryMethod === "Manual" ? "selected" : ""}>Manual</option></select></label>
        <button class="button" type="button" data-notice-mark-sent="${escapeHtml(notice.id)}">Mark as Sent</button>
        <button class="button button-secondary" type="button" data-notice-print="${escapeHtml(notice.id)}">Print Notice</button>
      </div>
      <p class="muted">Email and SMS are placeholders only for a future communications center. No messages are sent from this screen.</p>
    </article>
  `;
}

function printNotice(noticeId) {
  const notice = getNoticeHistory().find((entry) => entry.id === noticeId);
  if (!notice) return;
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>${notice.noticeType}</title><link rel="stylesheet" href="ils.css"></head><body class="notice-print-window">${buildNoticePreviewMarkup(notice)}</body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

function renderNoticePreview() {
  if (!els.noticePreviewPanel) return;
  const notice = getNoticeHistory().find((entry) => entry.id === state.activeNoticeRecordId) || null;
  els.noticePreviewPanel.className = notice ? "" : "empty-state";
  els.noticePreviewPanel.innerHTML = buildNoticePreviewMarkup(notice);
  const closingMessageInput = $("#noticeClosingMessageInput");
  closingMessageInput?.addEventListener("change", (event) => {
    const nextMessage = String(event.target.value || "");
    saveNoticeSettings({ closingMessage: nextMessage });
    updateNoticeRecord(notice.id, { closingMessage: nextMessage, deliveryMethod: $("#noticeDeliveryMethodSelect")?.value || notice.deliveryMethod });
  });
  $("#noticeDeliveryMethodSelect")?.addEventListener("change", (event) => updateNoticeRecord(notice.id, { deliveryMethod: event.target.value }));
  els.noticePreviewPanel.querySelector("[data-notice-mark-sent]")?.addEventListener("click", () => updateNoticeRecord(notice.id, { dateSent: new Date().toISOString() }));
  els.noticePreviewPanel.querySelector("[data-notice-print]")?.addEventListener("click", () => printNotice(notice.id));
}

function renderNoticeHistory() {
  if (!els.noticeHistoryBody || !els.noticeHistorySummary) return;
  const history = getNoticeHistory().slice().sort((a, b) => String(b.dateGenerated || "").localeCompare(String(a.dateGenerated || "")));
  els.noticeHistorySummary.textContent = history.length ? `${history.length} stored notice record${history.length === 1 ? "" : "s"}.` : "No notice history yet.";
  if (!history.length) {
    els.noticeHistoryBody.innerHTML = '<tr><td colspan="8">No overdue notices have been generated yet.</td></tr>';
    return;
  }
  els.noticeHistoryBody.innerHTML = history.map((entry) => `<tr class="${entry.dateSent ? "" : "notice-history-row-pending"}"><td>${escapeHtml(entry.patronName)}</td><td>${escapeHtml(entry.noticeType)}</td><td>${formatDisplayDate(entry.dateGenerated)}</td><td>${entry.dateSent ? formatDisplayDate(entry.dateSent) : "Not sent"}</td><td>${escapeHtml(entry.deliveryMethod || "Print")}</td><td>${escapeHtml(entry.staffUser || "STAFF")}</td><td>${entry.dateSent ? "Sent" : "Pending"}</td><td><div class="row-actions"><button class="button button-secondary" type="button" data-notice-history-view="${escapeHtml(entry.id)}">View</button>${entry.dateSent ? "" : `<button class="button button-secondary" type="button" data-notice-history-send="${escapeHtml(entry.id)}">Mark Sent</button>`}</div></td></tr>`).join("");
  els.noticeHistoryBody.querySelectorAll("[data-notice-history-view]").forEach((button) => button.addEventListener("click", () => {
    state.activeNoticeRecordId = button.dataset.noticeHistoryView;
    renderNoticePreview();
  }));
  els.noticeHistoryBody.querySelectorAll("[data-notice-history-send]").forEach((button) => button.addEventListener("click", () => updateNoticeRecord(button.dataset.noticeHistorySend, { dateSent: new Date().toISOString() })));
}

function renderNoticeTemplates() {
  if (!els.noticeTemplateList) return;
  const templates = getNoticeTemplates();
  els.noticeTemplateList.innerHTML = templates.map((template) => `<form class="patron-notice-template-card" data-notice-template-form="${escapeHtml(template.id)}">
      <label><span>Template name</span><input name="name" value="${escapeHtml(template.name)}" /></label>
      <label><span>Subject</span><input name="subject" value="${escapeHtml(template.subject || "")}" /></label>
      <label><span>Body</span><textarea name="body" rows="4">${escapeHtml(template.body || "")}</textarea></label>
      <label><span>Closing</span><textarea name="closing" rows="3">${escapeHtml(template.closing || "")}</textarea></label>
      <div class="row-actions"><button class="button button-secondary" type="submit">Save Template</button></div>
    </form>`).join("");
  els.noticeTemplateList.querySelectorAll("[data-notice-template-form]").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    saveNoticeTemplates(getNoticeTemplates().map((template) => template.id === form.dataset.noticeTemplateForm ? {
      ...template,
      name: String(formData.get("name") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      body: String(formData.get("body") || "").trim(),
      closing: String(formData.get("closing") || "").trim(),
    } : template));
    renderNoticeTemplates();
    renderNoticesWorkspace();
  }));
}

function renderNoticesWorkspace() {
  if (!els.noticePatronResults) return;
  populateNoticeMaterialTypeFilter();
  const groups = getFilteredNoticeGroups();
  const allGroups = getOverduePatronGroups(1);
  const history = getNoticeHistory();
  const today = todayIso();
  const finalPending = history.filter((entry) => entry.noticeType === "Final Notice" && !entry.dateSent).length;
  if (els.noticeSummaryCards) {
    els.noticeSummaryCards.innerHTML = [
      { label: "Patrons with overdues", value: allGroups.length },
      { label: "Items overdue", value: getOverdueLoans(1).length },
      { label: "Notices generated today", value: history.filter((entry) => String(entry.dateGenerated || "").slice(0, 10) === today).length },
      { label: "Final notices pending", value: finalPending },
    ].map((card) => `<article class="summary-card"><span class="summary-card-label">${card.label}</span><strong>${card.value}</strong></article>`).join("");
  }
  if (els.noticeResultsSummary) els.noticeResultsSummary.textContent = groups.length ? `${groups.length} patron account${groups.length === 1 ? "" : "s"} match the current overdue filters.` : "No overdue patrons match the current filters.";
  if (!groups.length) {
    els.noticePatronResults.className = "patron-notice-results empty-state";
    els.noticePatronResults.innerHTML = "No overdue patrons match the current filters.";
  } else {
    els.noticePatronResults.className = "patron-notice-results";
    els.noticePatronResults.innerHTML = groups.map((group) => `
      <article class="patron-notice-group ${["Blocked", "Expired"].includes(group.accountStatus) ? "is-attention" : ""}">
        <div class="patron-notice-group-header">
          <div><h4>${escapeHtml(group.patronName)}</h4><p class="muted">Card #${escapeHtml(group.cardNumber || "Not assigned")} · ${escapeHtml(group.accountStatus)} · ${group.itemCount} overdue item${group.itemCount === 1 ? "" : "s"} · max ${group.maxOverdueDays} days</p></div>
          <div class="row-actions">
            <select data-notice-template-pick="${escapeHtml(group.patronId)}">${getNoticeTemplates().map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`).join("")}</select>
            <button class="button" type="button" data-notice-generate="${escapeHtml(group.patronId)}">Generate Notice</button>
            <button class="button button-secondary" type="button" data-notice-open-history="${escapeHtml(group.patronId)}">View Notice History</button>
          </div>
        </div>
        <div class="patron-notice-group-meta">
          <span class="badge badge-status">${escapeHtml(group.materialTypes.join(", ") || "Mixed materials")}</span>
          <span class="badge badge-status">${formatCurrency(group.totalFees)} balance</span>
          <span class="badge badge-status">${group.lastNotice ? `Last notice: ${escapeHtml(group.lastNotice.noticeType)} on ${formatDisplayDate(group.lastNotice.dateGenerated)}` : "No prior notices"}</span>
        </div>
        <details ${state.activeNoticePatronId === group.patronId ? "open" : ""}>
          <summary>Expand overdue items</summary>
          <table class="serials-table"><thead><tr><th>Title</th><th>Due date</th><th>Days overdue</th><th>Material type</th><th>Barcode</th></tr></thead><tbody>${group.items.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.dueDate)}</td><td>${item.overdueDays}</td><td>${escapeHtml(item.materialType)}</td><td>${escapeHtml(item.materialNumber || "—")}</td></tr>`).join("")}</tbody></table>
        </details>
      </article>
    `).join("");
    els.noticePatronResults.querySelectorAll("[data-notice-generate]").forEach((button) => button.addEventListener("click", () => {
      const templateId = els.noticePatronResults.querySelector(`[data-notice-template-pick="${button.dataset.noticeGenerate}"]`)?.value;
      generateNoticeRecord(button.dataset.noticeGenerate, templateId);
    }));
    els.noticePatronResults.querySelectorAll("[data-notice-open-history]").forEach((button) => button.addEventListener("click", () => {
      const latest = getNoticeHistory().find((entry) => entry.patronId === button.dataset.noticeOpenHistory);
      if (latest) state.activeNoticeRecordId = latest.id;
      state.activeNoticePatronId = button.dataset.noticeOpenHistory;
      renderNoticePreview();
    }));
  }
  renderNoticePreview();
  renderNoticeHistory();
  renderNoticeTemplates();
}

function renderPatronDetail() {
  if (!els.patronDetailPanel || !els.patronDetailBadge) return;
  const patron = getPatrons().find((entry) => entry.id === state.selectedPatronId);
  if (!patron) {
    els.patronDetailBadge.textContent = 'No patron selected';
    els.patronDetailPanel.className = 'patron-detail-panel empty-state';
    els.patronDetailPanel.textContent = 'Select a patron from the list to view account details.';
    return;
  }

  const summary = getPatronAccountSummary(patron);
  const holdHistory = getPatronHoldHistory(patron.id);
  const blocks = String(patron.blocks || '').split(/\s*,\s*/).filter(Boolean);
  const alerts = String(patron.alerts || '').split(/\s*,\s*/).filter(Boolean);
  const status = patron.status || 'Active';

  els.patronDetailBadge.textContent = status;
  els.patronDetailPanel.className = 'patron-detail-panel';
  els.patronDetailPanel.innerHTML = `
    <div class="patron-account-top">
      <div class="patron-account-card">
        <h4 class="patron-account-title">${escapeHtml(patron.name || 'Unnamed patron')}</h4>
        <span class="patron-account-card-number">Card #${escapeHtml(patron.cardNumber || 'Not assigned')}</span>
        <span class="patron-account-status"><strong>Status:</strong> ${escapeHtml(status)}</span>
      </div>
      <div class="patron-account-contact-row">
        <div class="patron-summary-chip"><span class="detail-label">Phone</span><strong>${escapeHtml(patron.phone || 'No phone number')}</strong></div>
        <div class="patron-summary-chip"><span class="detail-label">Email</span><strong>${escapeHtml(patron.email || 'No email')}</strong></div>
      </div>
    </div>
    <div class="patron-detail-grid">
      <div class="detail-card"><span class="detail-label">Expiration</span><strong>${escapeHtml(patron.expirationDate || 'No expiration date')}</strong></div>
      <div class="detail-card"><span class="detail-label">Items out</span><strong>${summary.loans.length}</strong></div>
      <div class="detail-card"><span class="detail-label">Holds</span><strong>${summary.holds.length}</strong></div>
      <div class="detail-card"><span class="detail-label">Fines / fees</span><strong>${formatCurrency(summary.unpaidAmount)}</strong></div>
    </div>
    <div class="patron-detail-address">
      <span class="detail-label">Address</span>
      <strong>${escapeHtml(patron.address || 'No address on file')}</strong>
    </div>
    <div class="patron-account-actions">
      <button class="button button-secondary" type="button" data-patron-modal="checkouts">Checkouts</button>
      <button class="button button-secondary" type="button" data-patron-modal="holds">Holds</button>
      <button class="button button-secondary" type="button" data-patron-modal="fines">Fines / Fees</button>
      <button class="button button-secondary" type="button" data-patron-modal="history">History</button>
      <button class="button button-secondary" type="button" data-patron-modal="notes">Notes / Alerts</button>
      <button class="button button-secondary" type="button" data-patron-open-notices="${escapeHtml(patron.id)}">Open in Notices</button>
      <button class="button" type="button" data-patron-edit="${escapeHtml(patron.id)}">Edit Info</button>
    </div>
    ${(blocks.length || alerts.length || holdHistory.length) ? `<div class="detail-card"><span class="detail-label">At a glance</span><strong>${escapeHtml(blocks.join(", ") || alerts.join(", ") || "Recent account notes available")}</strong></div>` : ""}
  `;
  [...els.patronDetailPanel.querySelectorAll("[data-patron-modal]")].forEach((button) => button.addEventListener("click", () => openPatronAccountModal(button.dataset.patronModal, patron)));
  els.patronDetailPanel.querySelector("[data-patron-open-notices]")?.addEventListener("click", () => openNoticesForPatron(patron.id));
  els.patronDetailPanel.querySelector("[data-patron-edit]")?.addEventListener("click", () => editPatron(patron.id));
}

function getPatronHolds(patronId) {
  return getHolds().filter((hold) => hold.patronId === patronId && !isHoldClosedStatus(hold.status));
}

function getPatronHoldHistory(patronId) {
  return getHolds().filter((hold) => hold.patronId === patronId && isHoldClosedStatus(hold.status)).sort((a, b) => String(b.completedCancelledExpiredDate || '').localeCompare(String(a.completedCancelledExpiredDate || ''))).slice(0, 5);
}

function getItemHoldQueue(materialNumber) {
  const normalized = String(materialNumber || '').trim().toLowerCase();
  return getHolds().filter((hold) => String(hold.materialNumber || '').trim().toLowerCase() === normalized).sort(compareHoldsByQueue);
}

function getItemHoldSummary(materialNumber) {
  const queue = getItemHoldQueue(materialNumber);
  return {
    total: queue.length,
    active: queue.filter((hold) => !isHoldClosedStatus(hold.status)).length,
    waiting: queue.filter((hold) => hold.status === HOLD_STATUS.PENDING).length,
    ready: queue.filter((hold) => [HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(hold.status)).length,
    trapped: queue.find((hold) => [HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(hold.status)) || null,
  };
}

function reindexHoldQueue(holds) {
  const grouped = new Map();
  holds.forEach((hold) => {
    const key = String(hold.materialNumber || '').trim().toLowerCase();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ ...hold });
  });
  return [...grouped.values()].flatMap((queue) => {
    const ordered = queue.sort((a, b) => String(a.datePlaced || '').localeCompare(String(b.datePlaced || '')));
    let position = 1;
    return ordered.map((hold) => {
      if (isHoldClosedStatus(hold.status)) return { ...hold, queuePosition: 0 };
      return { ...hold, queuePosition: position++ };
    });
  });
}

function getHolds() {
  return reindexHoldQueue((Array.isArray(state.settings.holds) ? state.settings.holds : []).map((hold) => normalizeHoldRecord(hold)));
}

function saveHolds(holds) {
  state.settings.holds = reindexHoldQueue(holds.map((hold) => normalizeHoldRecord(hold)));
  state.settings.holdShelfDays = getHoldShelfDuration();
  saveSettings(state.settings);
}

function promoteNextHoldIfPossible(materialNumber, records = state.records) {
  const queue = getItemHoldQueue(materialNumber).filter((hold) => !isHoldClosedStatus(hold.status)).sort(compareHoldsByQueue);
  const activeTrap = queue.find((hold) => [HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(hold.status));
  if (activeTrap) return null;
  const nextPending = queue.find((hold) => hold.status === HOLD_STATUS.PENDING);
  if (!nextPending) return null;
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const expiration = addDays(today, getHoldShelfDuration());
  const updated = getHolds().map((hold) => hold.holdId === nextPending.holdId ? { ...hold, status: HOLD_STATUS.TRAPPED, trappedDate: now, readyForPickupDate: today, pickupExpirationDate: expiration, updatedAt: now } : hold);
  saveHolds(updated);
  const match = getRecordByMaterialNumber(materialNumber);
  if (match) {
    state.records = records.map((record) => record.id !== match.record.id ? record : normalizeRecord({
      ...record,
      holdings: (record.holdings || []).map((holding) => holding.id !== match.holding.id ? holding : { ...holding, status: 'Ready for pickup', checkedOutTo: '', checkedOutToName: '', checkedOutAt: '', dueDate: '' }),
      circulationHistory: appendCirculationHistory(record, `Hold trapped for ${nextPending.patronName} until ${expiration}`),
    }));
    saveRecords(state.records);
  }
  return { ...nextPending, status: HOLD_STATUS.TRAPPED, trappedDate: now, readyForPickupDate: today, pickupExpirationDate: expiration };
}

function expireReadyHolds({ silent = false } = {}) {
  const today = todayIso();
  let changed = false;
  let holds = getHolds().map((hold) => {
    if ([HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(hold.status) && hold.pickupExpirationDate && hold.pickupExpirationDate < today) {
      changed = true;
      return { ...hold, status: HOLD_STATUS.EXPIRED, completedCancelledExpiredDate: new Date().toISOString(), expiredAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }
    return hold;
  });
  if (!changed) {
    if (!silent) setCirculationMessage('No hold shelf items needed expiration cleanup.', 'info');
    return 0;
  }
  saveHolds(holds);
  const expiredMaterialNumbers = [...new Set(holds.filter((hold) => hold.status === HOLD_STATUS.EXPIRED && isoDateFromTimestamp(hold.expiredAt) === today).map((hold) => hold.materialNumber))];
  expiredMaterialNumbers.forEach((materialNumber) => {
    const promoted = promoteNextHoldIfPossible(materialNumber);
    if (!promoted) {
      const match = getRecordByMaterialNumber(materialNumber);
      if (match) {
        state.records = state.records.map((record) => record.id !== match.record.id ? record : normalizeRecord({
          ...record,
          holdings: (record.holdings || []).map((holding) => holding.id !== match.holding.id ? holding : { ...holding, status: 'Available' }),
          circulationHistory: appendCirculationHistory(record, 'Hold expired and item returned to available status'),
        }));
      }
    }
  });
  saveRecords(state.records);
  if (!silent) setCirculationMessage(`Expired ${expiredMaterialNumbers.length} hold shelf item${expiredMaterialNumbers.length === 1 ? '' : 's'} and refreshed queues.`, 'success');
  return expiredMaterialNumbers.length;
}

function buildHoldPlacementPreview() {
  const cardNumber = String(els.holdCardNumber?.value || els.holdPatronSelect?.value || '').trim();
  const materialNumber = String(els.holdMaterialNumber?.value || '').trim();
  const type = String(els.holdType?.value || 'Hold');
  const patron = findPatronByCardNumber(cardNumber);
  const match = materialNumber ? getRecordByMaterialNumber(materialNumber) : null;
  const invalidPatron = cardNumber && !patron;
  const invalidItem = materialNumber && !match;
  if (!els.holdRequestSummary) return { patron, match, queuePosition: 0 };
  if (!cardNumber && !materialNumber) {
    els.holdRequestSummary.className = 'holds-request-summary empty-state form-grid-span';
    els.holdRequestSummary.textContent = 'Scan a patron and item to preview the request and queue position.';
    return { patron, match, queuePosition: 0 };
  }
  if (invalidPatron || invalidItem) {
    els.holdRequestSummary.className = 'holds-request-summary form-grid-span';
    els.holdRequestSummary.innerHTML = `<strong>Cannot place request yet.</strong><span>${invalidPatron ? 'Patron card number was not found.' : ''} ${invalidItem ? 'Item material number was not found.' : ''}</span>`;
    return { patron, match, queuePosition: 0 };
  }
  const queuePosition = getItemHoldQueue(materialNumber).filter((hold) => !isHoldClosedStatus(hold.status)).length + 1;
  els.holdRequestSummary.className = 'holds-request-summary form-grid-span';
  els.holdRequestSummary.innerHTML = `<div><strong>Confirmation summary</strong><span>${escapeHtml(patron.name)} · Card ${escapeHtml(patron.cardNumber || 'N/A')}</span></div><div><strong>${escapeHtml(match.record.title || 'Untitled')}</strong><span>${escapeHtml(materialNumber)} · ${escapeHtml(type)}</span></div><div><strong>Queue position</strong><span>This request will enter as #${queuePosition}.</span></div>`;
  return { patron, match, queuePosition };
}

function populateHoldPatronPicker() {
  if (!els.holdPatronSelect) return;
  const patrons = getPatrons().slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  const current = els.holdPatronSelect.value;
  els.holdPatronSelect.innerHTML = '<option value="">Choose a patron</option>' + patrons.map((patron) => `<option value="${escapeHtml(patron.cardNumber || '')}">${escapeHtml(patron.name || 'Unnamed patron')} · ${escapeHtml(patron.cardNumber || 'No card')}</option>`).join('');
  els.holdPatronSelect.value = patrons.some((patron) => patron.cardNumber === current) ? current : '';
}

function placeHold(event) {
  event.preventDefault();
  const cardNumber = String(els.holdCardNumber?.value || els.holdPatronSelect?.value || '').trim();
  const materialNumber = String(els.holdMaterialNumber?.value || '').trim();
  const type = String(els.holdType?.value || 'Hold');
  const note = String(els.holdStaffNote?.value || '').trim();
  const patron = findPatronByCardNumber(cardNumber);
  if (!patron) return setCirculationMessage('No patron found with that card number. Use the picker if needed.', 'error');
  const match = getRecordByMaterialNumber(materialNumber);
  if (!match) return setCirculationMessage(`Invalid material number: ${materialNumber} was not found.`, 'error');
  const queue = getItemHoldQueue(materialNumber);
  const openQueue = queue.filter((hold) => !isHoldClosedStatus(hold.status));
  const existingActiveForPatron = openQueue.find((hold) => hold.patronId === patron.id);
  if (existingActiveForPatron) return setCirculationMessage(`${patron.name} already has an active request for this item.`, 'error');
  const trappedForAnother = openQueue.find((hold) => [HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(hold.status) && hold.patronId !== patron.id);
  const now = new Date().toISOString();
  const hold = normalizeHoldRecord({
    holdId: crypto.randomUUID(),
    recordId: match.record.id,
    holdingId: match.holding.id,
    itemId: materialNumber,
    materialNumber,
    itemTitle: match.record.title,
    patronId: patron.id,
    patronCardNumber: patron.cardNumber || '',
    patronName: patron.name,
    type,
    status: trappedForAnother || String(match.holding.status) !== 'Available' || openQueue.length ? HOLD_STATUS.PENDING : HOLD_STATUS.TRAPPED,
    queuePosition: openQueue.length + 1,
    datePlaced: now,
    placedAt: now,
    trappedDate: trappedForAnother || String(match.holding.status) !== 'Available' || openQueue.length ? '' : now,
    readyForPickupDate: trappedForAnother || String(match.holding.status) !== 'Available' || openQueue.length ? '' : now.slice(0, 10),
    pickupExpirationDate: trappedForAnother || String(match.holding.status) !== 'Available' || openQueue.length ? '' : addDays(now.slice(0, 10), getHoldShelfDuration()),
    staffNotes: note,
  });
  if ([HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(hold.status) && openQueue.some((entry) => [HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(entry.status))) {
    return setCirculationMessage('This item is already trapped for another patron. Resolve that hold before assigning another ready-for-pickup item.', 'error');
  }
  const holds = [...getHolds(), hold];
  saveHolds(holds);
  state.records = state.records.map((entry) => entry.id === match.record.id ? normalizeRecord({
    ...entry,
    holdings: (entry.holdings || []).map((holding) => holding.id !== match.holding.id ? holding : { ...holding, status: hold.status === HOLD_STATUS.PENDING ? holding.status : 'Ready for pickup' }),
    circulationHistory: appendCirculationHistory(entry, `${type} placed for ${patron.name}${hold.status === HOLD_STATUS.PENDING ? ` · queue #${hold.queuePosition}` : ' · trapped for pickup'}`),
  }) : entry);
  saveRecords(state.records);
  if (els.holdForm) els.holdForm.reset();
  if (els.holdShelfDays) els.holdShelfDays.value = String(getHoldShelfDuration());
  buildHoldPlacementPreview();
  setCirculationMessage(`${type} placed. ${patron.name} is now #${hold.queuePosition} in queue.`, 'success');
  render();
}

function updateHoldStatus(holdId, nextStatus, options = {}) {
  const now = new Date().toISOString();
  let affectedMaterialNumber = '';
  const holds = getHolds().map((hold) => {
    if (hold.holdId !== holdId) return hold;
    affectedMaterialNumber = hold.materialNumber;
    const next = { ...hold, status: nextStatus, updatedAt: now };
    if (nextStatus === HOLD_STATUS.READY) next.readyForPickupDate = now.slice(0, 10);
    if (nextStatus === HOLD_STATUS.TRAPPED && !next.trappedDate) next.trappedDate = now;
    if ([HOLD_STATUS.CANCELLED, HOLD_STATUS.EXPIRED, HOLD_STATUS.PICKED_UP].includes(nextStatus)) next.completedCancelledExpiredDate = now;
    if (nextStatus === HOLD_STATUS.CANCELLED) next.cancelledAt = now;
    if (nextStatus === HOLD_STATUS.EXPIRED) next.expiredAt = now;
    if (nextStatus === HOLD_STATUS.PICKED_UP) next.pickedUpAt = now;
    if (nextStatus === HOLD_STATUS.READY && !next.pickupExpirationDate) next.pickupExpirationDate = addDays(now.slice(0, 10), getHoldShelfDuration());
    return next;
  });
  saveHolds(holds);
  if ([HOLD_STATUS.CANCELLED, HOLD_STATUS.EXPIRED, HOLD_STATUS.PICKED_UP].includes(nextStatus) && affectedMaterialNumber) {
    const promoted = promoteNextHoldIfPossible(affectedMaterialNumber);
    if (!promoted) {
      const match = getRecordByMaterialNumber(affectedMaterialNumber);
      if (match) {
        state.records = state.records.map((record) => record.id !== match.record.id ? record : normalizeRecord({
          ...record,
          holdings: (record.holdings || []).map((holding) => holding.id !== match.holding.id ? holding : { ...holding, status: nextStatus === HOLD_STATUS.PICKED_UP ? 'On Loan' : 'Available' }),
        }));
        saveRecords(state.records);
      }
    }
  }
  if (options.message) setCirculationMessage(options.message, 'success');
  render();
}

function cancelHold(holdId) {
  if (!window.confirm('Cancel this hold request?')) return;
  updateHoldStatus(holdId, HOLD_STATUS.CANCELLED, { message: 'Hold cancelled.' });
}

function getHoldBucket(hold) {
  if (isHoldClosedStatus(hold.status)) return 'closed';
  if ([HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(hold.status)) return 'ready';
  return 'active';
}

function getReadyHoldDaysLeft(hold) {
  if (!hold.pickupExpirationDate) return null;
  const diff = Math.ceil((Date.parse(`${hold.pickupExpirationDate}T00:00:00Z`) - Date.parse(`${todayIso()}T00:00:00Z`)) / 86400000);
  return Number.isFinite(diff) ? diff : null;
}

function openHoldQueueModal(materialNumber) {
  if (!els.holdQueueModal || !els.holdQueueModalBody) return;
  const queue = getItemHoldQueue(materialNumber);
  const match = getRecordByMaterialNumber(materialNumber);
  els.holdQueueModalTitle.textContent = match?.record?.title || materialNumber;
  els.holdQueueModalSubtitle.textContent = `${queue.filter((hold) => !isHoldClosedStatus(hold.status)).length} active request(s) for material #${materialNumber}.`;
  if (!queue.length) {
    els.holdQueueModalBody.className = 'hold-queue-modal-body empty-state';
    els.holdQueueModalBody.textContent = 'No queue entries for this item.';
  } else {
    els.holdQueueModalBody.className = 'hold-queue-modal-body';
    els.holdQueueModalBody.innerHTML = `<table class="serials-table holds-table"><thead><tr><th>Order</th><th>Patron</th><th>Date placed</th><th>Status</th><th>Override</th></tr></thead><tbody>${queue.map((hold) => `<tr><td>${hold.queuePosition || '—'}</td><td>${escapeHtml(hold.patronName)}</td><td>${escapeHtml(String(hold.datePlaced || '').slice(0, 10))}</td><td><span class="hold-status-badge status-${String(hold.status).toLowerCase().replace(/[^a-z]+/g, '-')}">${escapeHtml(hold.status)}</span></td><td>${isHoldClosedStatus(hold.status) ? '<span class="muted">Closed</span>' : `<button class="button button-secondary" type="button" data-override-trap="${hold.holdId}">Move to front</button>`}</td></tr>`).join('')}</tbody></table>`;
    els.holdQueueModalBody.querySelectorAll('[data-override-trap]').forEach((button) => button.addEventListener('click', () => {
      const targetId = button.dataset.overrideTrap;
      const now = new Date().toISOString();
      saveHolds(getHolds().map((hold) => {
        if (hold.holdId === targetId) return { ...hold, datePlaced: '0000-01-01T00:00:00.000Z', updatedAt: now };
        return hold;
      }));
      render();
      openHoldQueueModal(materialNumber);
    }));
  }
  els.holdQueueModal.classList.remove('hidden');
  els.holdQueueModal.setAttribute('aria-hidden', 'false');
}

function closeHoldQueueModal() {
  if (!els.holdQueueModal) return;
  els.holdQueueModal.classList.add('hidden');
  els.holdQueueModal.setAttribute('aria-hidden', 'true');
}

function buildHoldRoutingResult(record, materialNumber) {
  expireReadyHolds({ silent: true });
  const queue = getItemHoldQueue(materialNumber).filter((hold) => !isHoldClosedStatus(hold.status)).sort(compareHoldsByQueue);
  const readyExisting = queue.find((hold) => [HOLD_STATUS.TRAPPED, HOLD_STATUS.READY].includes(hold.status));
  if (readyExisting) return { hold: readyExisting, message: 'Hold already trapped', route: `Keep on hold shelf for ${readyExisting.patronName}` };
  const nextHold = queue.find((hold) => hold.status === HOLD_STATUS.PENDING);
  if (!nextHold) return { hold: null, message: 'Checked in successfully', route: 'Return to shelf' };
  const now = new Date().toISOString();
  const expiration = addDays(now.slice(0, 10), getHoldShelfDuration());
  const updatedHolds = getHolds().map((hold) => hold.holdId === nextHold.holdId ? { ...hold, status: HOLD_STATUS.TRAPPED, trappedDate: now, readyForPickupDate: now.slice(0, 10), pickupExpirationDate: expiration, updatedAt: now } : hold);
  saveHolds(updatedHolds);
  return { hold: { ...nextHold, status: HOLD_STATUS.TRAPPED, trappedDate: now, readyForPickupDate: now.slice(0, 10), pickupExpirationDate: expiration }, message: 'HOLD FOUND — PLACE ON HOLD SHELF', route: `Trap for ${nextHold.patronName} until ${expiration}` };
}

function renderCheckInResult() {
  if (!els.checkInResult) return;
  const result = state.lastCheckInResult;
  if (!result) {
    els.checkInResult.className = 'checkin-result-panel empty-state';
    els.checkInResult.innerHTML = 'Scan an item to begin check-in.';
    return;
  }
  els.checkInResult.className = `checkin-result-panel${result.holdAlert ? ' has-hold-alert' : ''}`;
  els.checkInResult.innerHTML = `
    <div class="panel-header compact"><div><h4>${escapeHtml(result.message)}</h4><p class="muted">${escapeHtml(result.title)}</p></div><span class="transaction-badge is-checkin">Checked In</span></div>
    <div class="checkin-result-grid">
      <div><span>Material number</span><strong>${escapeHtml(result.materialNumber)}</strong></div>
      <div><span>Previous patron</span><strong>${escapeHtml(result.previousPatron || 'Not previously checked out')}</strong></div>
      <div><span>Due / return context</span><strong>${escapeHtml(result.dueDate || result.returnedDate)}</strong></div>
      <div><span>Status after check-in</span><strong>${escapeHtml(result.status)}</strong></div>
    </div>
    <div class="checkout-card-warnings">
      ${result.holdAlert ? `<div class="checkout-warning-row is-warning is-large-alert"><strong>HOLD FOUND</strong><span>${escapeHtml(result.holdAlert)}</span></div>` : '<div class="checkout-warning-row is-clear"><strong>No hold waiting</strong><span>Item can return to regular shelving.</span></div>'}
      <div class="checkout-warning-row is-clear"><strong>Routing</strong><span>${escapeHtml(result.routeMessage)}</span></div>
    </div>`;
}

function checkInRecord(recordId, holdingId = '') {
  const idx = state.records.findIndex((entry) => entry.id === recordId);
  if (idx < 0) return null;
  const record = state.records[idx];
  let result = null;
  const nextHoldings = (record.holdings || []).map((holding) => {
    if (holdingId && holding.id !== holdingId) return holding;
    const materialNumber = holding.materialNumbers?.[0] || '';
    const routing = buildHoldRoutingResult(record, materialNumber);
    result = {
      title: record.title || 'Untitled',
      materialNumber: materialNumber || 'No barcode',
      previousPatron: holding.checkedOutToName || 'Unknown patron',
      dueDate: holding.dueDate ? `Due ${holding.dueDate}` : 'No due date recorded',
      returnedDate: `Returned ${new Date().toLocaleString()}`,
      status: routing.hold ? 'Trapped for hold shelf' : 'Available',
      holdAlert: routing.hold ? `${routing.hold.patronName} is next in queue. Pickup by ${routing.hold.pickupExpirationDate}.` : '',
      routeMessage: routing.route,
      message: routing.message,
    };
    return { ...holding, status: routing.hold ? 'Ready for pickup' : 'Available', checkedOutTo: '', checkedOutToName: '', checkedOutAt: '', dueDate: '' };
  });
  state.records[idx] = normalizeRecord({
    ...record,
    holdings: nextHoldings,
    circulationHistory: appendCirculationHistory(record, `Checked in${result?.holdAlert ? ` · ${result.holdAlert}` : ''}`),
  });

  saveRecords(state.records);
  state.lastCheckInResult = result;
  renderCheckInResult();
  setCirculationMessage(result ? `${result.message}: ${result.title}.` : `Checked in "${state.records[idx].title}".`, result?.holdAlert ? 'success' : 'info');
  render();
  return result;
}

function renderHoldRows(target, holds, bucket, emptyMessage) {
  if (!target) return;
  target.innerHTML = '';
  if (!holds.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7">${emptyMessage}</td>`;
    target.appendChild(tr);
    return;
  }
  holds.forEach((hold) => {
    const tr = document.createElement('tr');
    const daysLeft = getReadyHoldDaysLeft(hold);
    const expiringSoon = daysLeft !== null && daysLeft <= 2;
    const statusClass = `status-${String(hold.status || '').toLowerCase().replace(/[^a-z]+/g, '-')}`;
    let actions = [`<button class="button button-secondary" type="button" data-action="queue">View Queue</button>`, `<button class="button button-secondary" type="button" data-action="note">${hold.staffNotes ? 'Edit Note' : 'Add Note'}</button>`];
    if (bucket === 'active') actions.unshift('<button class="button button-secondary" type="button" data-action="ready">Mark Ready for Pickup</button>');
    if (bucket === 'ready') actions.unshift('<button class="button button-secondary" type="button" data-action="pickedup">Mark Picked Up</button>', '<button class="button button-secondary" type="button" data-action="slip">Print Slip</button>');
    if (bucket !== 'closed') actions.push('<button class="button button-secondary" type="button" data-action="cancel">Cancel Hold</button>', '<button class="button button-secondary" type="button" data-action="expire">Expire Hold</button>');
    if (bucket === 'active') tr.innerHTML = `<td><strong>${escapeHtml(hold.itemTitle)}</strong><div class="muted">${escapeHtml(hold.materialNumber)}</div></td><td>${escapeHtml(hold.patronName)}<div class="muted">Card ${escapeHtml(hold.patronCardNumber || 'N/A')}</div></td><td>${escapeHtml(hold.type)}</td><td>#${hold.queuePosition}</td><td>${escapeHtml(String(hold.datePlaced || '').slice(0,10))}</td><td><span class="hold-status-badge ${statusClass}">${escapeHtml(hold.status)}</span></td><td>${actions.join(' ')}</td>`;
    else if (bucket === 'ready') tr.innerHTML = `<td><strong>${escapeHtml(hold.itemTitle)}</strong><div class="muted">${escapeHtml(hold.materialNumber)}</div></td><td>${escapeHtml(hold.patronName)}</td><td>${escapeHtml(isoDateFromTimestamp(hold.trappedDate) || '—')}</td><td>${escapeHtml(hold.pickupExpirationDate || '—')}</td><td><span class="${expiringSoon ? 'badge-danger' : 'muted'}">${daysLeft === null ? '—' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}</span></td><td><span class="hold-status-badge ${statusClass}">${escapeHtml(hold.status)}</span></td><td>${actions.join(' ')}</td>`;
    else tr.innerHTML = `<td><strong>${escapeHtml(hold.itemTitle)}</strong><div class="muted">${escapeHtml(hold.materialNumber)}</div></td><td>${escapeHtml(hold.patronName)}</td><td>${escapeHtml(hold.type)}</td><td><span class="hold-status-badge ${statusClass}">${escapeHtml(hold.status)}</span></td><td>${escapeHtml(isoDateFromTimestamp(hold.completedCancelledExpiredDate) || '—')}</td><td><div>${actions.filter((action) => /queue|note/.test(action)).join(' ')}</div><div class="muted top-space">${escapeHtml(hold.staffNotes || 'No staff note')}</div></td>`;
    tr.querySelector('[data-action="ready"]')?.addEventListener('click', () => updateHoldStatus(hold.holdId, HOLD_STATUS.READY, { message: 'Hold marked ready for pickup.' }));
    tr.querySelector('[data-action="pickedup"]')?.addEventListener('click', () => updateHoldStatus(hold.holdId, HOLD_STATUS.PICKED_UP, { message: 'Hold marked picked up.' }));
    tr.querySelector('[data-action="cancel"]')?.addEventListener('click', () => cancelHold(hold.holdId));
    tr.querySelector('[data-action="expire"]')?.addEventListener('click', () => { if (window.confirm('Expire this hold and advance the queue?')) updateHoldStatus(hold.holdId, HOLD_STATUS.EXPIRED, { message: 'Hold expired.' }); });
    tr.querySelector('[data-action="queue"]')?.addEventListener('click', () => openHoldQueueModal(hold.materialNumber));
    tr.querySelector('[data-action="note"]')?.addEventListener('click', () => {
      const note = window.prompt('Staff note', hold.staffNotes || '');
      if (note === null) return;
      saveHolds(getHolds().map((entry) => entry.holdId === hold.holdId ? { ...entry, staffNotes: note, updatedAt: new Date().toISOString() } : entry));
      render();
    });
    tr.querySelector('[data-action="slip"]')?.addEventListener('click', () => window.alert(`Hold slip

Patron: ${hold.patronName}
Item: ${hold.itemTitle}
Pickup by: ${hold.pickupExpirationDate || 'Not set'}`));
    target.appendChild(tr);
  });
}

function renderHoldsTable() {
  expireReadyHolds({ silent: true });
  const holds = getHolds().slice();
  const pending = holds.filter((hold) => getHoldBucket(hold) === 'active').sort(compareHoldsByQueue);
  let ready = holds.filter((hold) => getHoldBucket(hold) === 'ready');
  const closed = holds.filter((hold) => getHoldBucket(hold) === 'closed').sort((a, b) => String(b.completedCancelledExpiredDate || '').localeCompare(String(a.completedCancelledExpiredDate || '')));
  const readySort = String(els.holdsReadySort?.value || 'expiration');
  ready = ready.sort((a, b) => {
    if (readySort === 'patron') return String(a.patronName || '').split(/\s+/).slice(-1)[0].localeCompare(String(b.patronName || '').split(/\s+/).slice(-1)[0]);
    if (readySort === 'trapped') return String(a.trappedDate || '').localeCompare(String(b.trappedDate || ''));
    return String(a.pickupExpirationDate || '').localeCompare(String(b.pickupExpirationDate || ''));
  });
  const filter = state.holdFilter;
  const filteredPending = filter === 'all-pending' ? pending : pending;
  const filteredReady = filter === 'ready-today' ? ready.filter((hold) => hold.readyForPickupDate === todayIso()) : filter === 'expiring-soon' ? ready.filter((hold) => (getReadyHoldDaysLeft(hold) ?? 99) <= 2) : ready;
  const filteredClosed = filter === 'closed-recent' ? closed.filter((hold) => (isoDateFromTimestamp(hold.completedCancelledExpiredDate) || '') >= addDays(todayIso(), -14)) : closed;
  if (els.holdsPendingCount) els.holdsPendingCount.textContent = `${pending.length} pending`;
  if (els.holdsReadyCount) els.holdsReadyCount.textContent = `${ready.length} ready`;
  if (els.holdsClosedCount) els.holdsClosedCount.textContent = `${closed.length} closed`;
  renderHoldRows(els.holdsActiveBody, filteredPending, 'active', 'No pending hold requests right now.');
  renderHoldRows(els.holdsReadyBody, filteredReady, 'ready', 'No items are currently waiting on the hold shelf.');
  renderHoldRows(els.holdsClosedBody, filteredClosed, 'closed', 'No closed hold activity yet.');
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

function editPendingMaterial(materialId) {
  const material = getAcquisitionMaterials().find((entry) => entry.id === materialId);
  if (!material) return;
  const title = window.prompt("Title", material.title || "");
  if (title === null) return;
  const creator = window.prompt("Author / creator", material.creator || "");
  if (creator === null) return;
  const format = window.prompt("Format", material.format || "");
  if (format === null) return;
  const callNumber = window.prompt("Call number", material.callNumber || "");
  if (callNumber === null) return;
  const notes = window.prompt("Notes", material.notes || "");
  if (notes === null) return;
  saveAcquisitionMaterials(getAcquisitionMaterials().map((entry) => (entry.id === materialId ? normalizeAcquisitionMaterial({ ...entry, title: title.trim(), creator: creator.trim(), format: format.trim(), callNumber: callNumber.trim(), notes: notes.trim() }) : entry)));
  setAcquisitionMessage("Pending material metadata updated.");
  renderAcquisitionsWorkspace();
}

function assignPendingMaterialLocation(materialId) {
  const material = getAcquisitionMaterials().find((entry) => entry.id === materialId);
  if (!material) return;
  const suggested = getManagedLocations();
  const promptText = suggested.length ? `Assign location\nAvailable: ${suggested.join(", ")}` : "Assign location";
  const location = window.prompt(promptText, material.location || "");
  if (location === null) return;
  saveAcquisitionMaterials(getAcquisitionMaterials().map((entry) => (entry.id === materialId ? normalizeAcquisitionMaterial({ ...entry, location: location.trim() }) : entry)));
  setAcquisitionMessage(location.trim() ? `Assigned ${location.trim()} to pending material.` : "Cleared pending material location.");
  renderAcquisitionsWorkspace();
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
  return `<div class="panel-header compact acquisitions-stage-header"><div><h3>Pending Materials</h3><p class="muted">Here are the materials that need finishing work before they become active catalog items.</p></div></div><div class="acquisition-data-table-wrap"><table class="serials-table acquisition-stage-table"><thead><tr><th>Title</th><th>Source</th><th>Material #</th><th>Format</th><th>Status</th><th>Date added</th><th>Location</th><th>Actions</th></tr></thead><tbody>${rows.map((material) => `<tr><td><strong>${material.title}</strong>${getOldPendingFlag(material) ? `<div class="acquisition-inline-flag">${getOldPendingFlag(material)}</div>` : ``}</td><td><strong>${material.sourceLabel || (material.sourceType === "donation" ? "Donation" : "Order")}</strong><div class="muted">${material.sourceType === "donation" ? `Batch: ${material.donationBatchName || "Donation"}${material.donorName ? ` · Donor: ${material.donorName}` : ""}` : material.orderName || "—"}</div></td><td>${material.materialNumber || "—"}</td><td>${material.format || "—"}</td><td>${getAcquisitionStatusBadge(material.status)}</td><td>${formatShortDate(material.sentToPendingAt || material.createdAt)}</td><td>${material.location || "Unassigned"}</td><td><div class="row-actions"><button class="button button-secondary" type="button" data-acq-activate="${material.id}">Activate item</button><button class="button button-secondary" type="button" data-acq-edit-pending="${material.id}">Edit metadata</button><button class="button button-secondary" type="button" data-acq-assign-location="${material.id}">Assign location</button><button class="button" type="button" data-acq-remove="${material.id}">Remove / cancel</button></div></td></tr>`).join("")}</tbody></table></div>`;
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
  document.querySelectorAll("[data-acq-edit-pending]").forEach((button) => button.addEventListener("click", () => editPendingMaterial(button.dataset.acqEditPending)));
  document.querySelectorAll("[data-acq-assign-location]").forEach((button) => button.addEventListener("click", () => assignPendingMaterialLocation(button.dataset.acqAssignLocation)));
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

function getAuthorityStore() {
  if (!state.settings.authorityLists || typeof state.settings.authorityLists !== "object") state.settings.authorityLists = {};
  return state.settings.authorityLists;
}

function createAuthorityEntry(label, overrides = {}) {
  const now = Date.now();
  return {
    id: overrides.id || `authority-${now}-${Math.floor(Math.random() * 1000)}`,
    preferredLabel: String(label || "").trim(),
    displayLabel: overrides.displayLabel || "",
    alternateLabels: Array.isArray(overrides.alternateLabels) ? overrides.alternateLabels.filter(Boolean) : [],
    notes: overrides.notes || "",
    status: overrides.status || "active",
    sortOrder: Number.isFinite(Number(overrides.sortOrder)) ? Number(overrides.sortOrder) : "",
    createdAt: Number(overrides.createdAt) || now,
    updatedAt: Number(overrides.updatedAt) || now,
    retiredAt: Number(overrides.retiredAt) || 0,
  };
}

function saveAuthorityStore() {
  saveSettings(state.settings);
}

function getRecordValuesForAuthority(key) {
  if (key === "genres") return state.records.flatMap((record) => asArray(record.genres?.length ? record.genres : record.genre));
  if (key === "subjects") return state.records.flatMap((record) => asArray(record.subjects));
  if (key === "locations") return state.records.flatMap((record) => [record.location, ...(record.holdings || []).map((holding) => holding.location)]).filter(Boolean);
  const recordKey = AUTHORITY_LIST_CONFIG[key]?.recordKey;
  if (!recordKey) return [];
  return state.records.flatMap((record) => asArray(record[recordKey]));
}

function getAuthorityEntries(key) {
  const config = AUTHORITY_LIST_CONFIG[key];
  if (!config) return [];
  const store = getAuthorityStore();
  const existing = Array.isArray(store[key]) ? store[key] : [];
  const fromLegacy = Array.isArray(state.settings[config.legacyKey]) ? state.settings[config.legacyKey] : [];
  const fromDefaults = Array.isArray(DEFAULT_AUTHORITY_SEEDS[key]) ? DEFAULT_AUTHORITY_SEEDS[key] : [];
  const fromRecords = getRecordValuesForAuthority(key);
  const normalizedExisting = existing
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") return createAuthorityEntry(entry);
      return createAuthorityEntry(entry.preferredLabel || entry.label || entry.name || "", entry);
    })
    .filter((entry) => entry?.preferredLabel);
  const combined = [...normalizedExisting];
  const known = new Set(normalizedExisting.map((entry) => String(entry.preferredLabel || "").trim().toLowerCase()));
  [...fromLegacy, ...fromDefaults, ...fromRecords].map((value) => String(value || "").trim()).filter(Boolean).forEach((value) => {
    if (known.has(value.toLowerCase())) return;
    combined.push(createAuthorityEntry(value));
    known.add(value.toLowerCase());
  });
  store[key] = combined.map((entry) => createAuthorityEntry(entry.preferredLabel, entry));
  return store[key].slice().sort((a, b) => String(a.preferredLabel).localeCompare(String(b.preferredLabel)));
}

function syncLegacyAuthorityList(key) {
  const config = AUTHORITY_LIST_CONFIG[key];
  if (!config?.legacyKey) return;
  state.settings[config.legacyKey] = getAuthorityEntries(key)
    .filter((entry) => entry.status !== "retired")
    .map((entry) => entry.preferredLabel)
    .sort((a, b) => a.localeCompare(b));
}

function syncAllLegacyAuthorityLists() {
  Object.keys(AUTHORITY_LIST_CONFIG).forEach(syncLegacyAuthorityList);
  saveAuthorityStore();
}

function getAuthorityUsageDetails(key, label) {
  if (key === "genres") {
    const records = state.records.filter((record) => asArray(record.genres?.length ? record.genres : record.genre).includes(label));
    return { count: records.length, records: records.slice(0, 5).map((record) => `${record.title} — ${record.creator || "Unknown creator"}`) };
  }
  if (key === "subjects") {
    const records = state.records.filter((record) => asArray(record.subjects).includes(label));
    return { count: records.length, records: records.slice(0, 5).map((record) => `${record.title} — ${record.creator || "Unknown creator"}`) };
  }
  if (key === "locations") {
    const records = state.records.filter((record) => record.location === label || (record.holdings || []).some((holding) => holding.location === label));
    return { count: records.length, records: records.slice(0, 5).map((record) => `${record.title} — ${record.callNumber || record.location || "No call number"}`) };
  }
  const recordKey = AUTHORITY_LIST_CONFIG[key]?.recordKey;
  const records = recordKey ? state.records.filter((record) => asArray(record[recordKey]).includes(label)) : [];
  return { count: records.length, records: records.slice(0, 5).map((record) => `${record.title} — ${record.creator || "Unknown creator"}`) };
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getAuthorityListSummary(key) {
  const entries = getAuthorityEntries(key);
  const active = entries.filter((entry) => entry.status !== "retired").length;
  const retired = entries.length - active;
  const inUse = entries.filter((entry) => getAuthorityUsageDetails(key, entry.preferredLabel).count > 0).length;
  return { total: entries.length, active, retired, inUse };
}

function getManagedMaterialTypes() { return getAuthorityEntries("materialTypes").filter((entry) => entry.status !== "retired").map((entry) => entry.preferredLabel); }
function getManagedGenres() { return getAuthorityEntries("genres").filter((entry) => entry.status !== "retired").map((entry) => entry.preferredLabel); }
function getManagedFormats() { return getAuthorityEntries("formats").filter((entry) => entry.status !== "retired").map((entry) => entry.preferredLabel); }
function getManagedBindings() { return getAuthorityEntries("bindings").filter((entry) => entry.status !== "retired").map((entry) => entry.preferredLabel); }
function getManagedLocations() { return getAuthorityEntries("locations").filter((entry) => entry.status !== "retired").map((entry) => entry.preferredLabel); }
function getManagedCuratedShelves() { return getAuthorityEntries("curatedShelves").filter((entry) => entry.status !== "retired").map((entry) => entry.preferredLabel); }
function getManagedLibraries() { return getAuthorityEntries("libraries").filter((entry) => entry.status !== "retired").map((entry) => entry.preferredLabel); }

function fillMaterialTypes() {
  const managed = getManagedMaterialTypes();
  const current = els.materialTypeSelect?.value || "";
  if (els.materialTypeSelect) {
    els.materialTypeSelect.innerHTML = ['<option value="">Unspecified</option>', ...managed.map((materialType) => `<option value="${materialType}">${materialType}</option>`)].join("");
    els.materialTypeSelect.value = managed.includes(current) ? current : "";
  }
}

function fillGenres() {
  const managed = getManagedGenres();
  const genreInput = $("#genres");
  if (genreInput) genreInput.innerHTML = managed.map((g) => `<option value="${g}">${g}</option>`).join("");
}

function fillFormats() {
  const managed = getManagedFormats();
  const current = els.formatSelect?.value || "";
  if (els.formatSelect) {
    els.formatSelect.innerHTML = managed.map((format) => `<option value="${format}">${format}</option>`).join("");
    els.formatSelect.value = managed.includes(current) ? current : (managed[0] || "Other");
  }
}

function fillBindings() {
  const managed = getManagedBindings();
  const current = els.bindingSelect?.value || "";
  if (els.bindingSelect) {
    els.bindingSelect.innerHTML = ['<option value="">None</option>', ...managed.map((binding) => `<option value="${binding}">${binding}</option>`)].join("");
    els.bindingSelect.value = managed.includes(current) ? current : "";
  }
}

function fillLocations() {
  const managed = getManagedLocations();
  const current = els.locationSelect?.value || "";
  if (els.locationSelect) {
    els.locationSelect.innerHTML = ['<option value="">Unspecified</option>', ...managed.map((location) => `<option value="${location}">${location}</option>`)].join("");
    els.locationSelect.value = managed.includes(current) ? current : "";
  }
}

function fillCuratedShelves() {
  const managed = getManagedCuratedShelves();
  const current = els.curatedShelfSelect?.value || "";
  if (els.curatedShelfSelect) {
    const selectedShelf = current || String(els.curatedShelfSelect.dataset.pendingValue || "").trim();
    const options = [...new Set([...(managed || []), ...(selectedShelf ? [selectedShelf] : [])])];
    els.curatedShelfSelect.innerHTML = "";
    const noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.textContent = "None";
    els.curatedShelfSelect.append(noneOption);
    options.forEach((shelf) => {
      const option = document.createElement("option");
      option.value = shelf;
      option.textContent = shelf;
      els.curatedShelfSelect.append(option);
    });
    els.curatedShelfSelect.value = options.includes(selectedShelf) ? selectedShelf : "";
    delete els.curatedShelfSelect.dataset.pendingValue;
  }
}

function fillIllLibraries() {
  const list = document.querySelector("#authorityLibrariesList");
  if (!list) return;
  const transactionLibraries = [
    ...getIllTransactions("incoming").map((entry) => String(entry.lendingLibrary || "").trim()),
    ...getIllTransactions("outgoing").map((entry) => String(entry.borrowingLibrary || "").trim()),
  ].filter(Boolean);
  const options = [...new Set([...getManagedLibraries(), ...transactionLibraries])].sort((a, b) => a.localeCompare(b));
  list.innerHTML = options.map((library) => `<option value="${library}"></option>`).join("");
}

function fillAuthorityInputLists() {
  const mappings = [
    ["#creatorAuthorityOptions", "creators"],
    ["#publisherAuthorityOptions", "publishers"],
    ["#languageAuthorityOptions", "languages"],
    ["#seriesAuthorityOptions", "series"],
    ["#subjectsAuthorityOptions", "subjects"],
    ["#audienceAuthorityOptions", "audience"],
  ];
  mappings.forEach(([selector, key]) => {
    const list = document.querySelector(selector);
    if (!list) return;
    const options = getAuthorityEntries(key)
      .filter((entry) => entry.status !== "retired")
      .map((entry) => String(entry.preferredLabel || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    list.innerHTML = options.map((label) => `<option value="${escapeHtml(label)}"></option>`).join("");
  });
}

function renderAuthorityHome() {
  if (!els.authorityCategoryGroups) return;
  const query = state.authoritySearch.trim().toLowerCase();
  const matchingKeys = Object.keys(AUTHORITY_LIST_CONFIG).filter((key) => {
    const config = AUTHORITY_LIST_CONFIG[key];
    if (!query) return true;
    const haystack = `${config.label} ${config.description} ${getAuthorityEntries(key).map((entry) => `${entry.preferredLabel} ${entry.alternateLabels.join(" ")}`).join(" ")}`.toLowerCase();
    return haystack.includes(query);
  });
  els.authorityCategoryGroups.innerHTML = Object.entries(AUTHORITY_GROUPS).map(([groupKey, group]) => {
    const keys = matchingKeys.filter((key) => (AUTHORITY_LIST_CONFIG[key].group || "local") === groupKey);
    if (!keys.length) return "";
    return `<section class="authority-group"><div class="panel-header compact"><div><h3>${group.label}</h3><p class="muted">${group.description}</p></div></div><div class="authority-category-grid">${keys.map((key) => {
      const config = AUTHORITY_LIST_CONFIG[key];
      const summary = getAuthorityListSummary(key);
      return `<button class="authority-category-card" type="button" data-authority-open="${key}"><div class="authority-card-main"><div><h4>${config.label}</h4><p class="muted">${config.description}</p></div><span class="authority-count-pill">${summary.total} entries</span></div><div class="authority-card-meta"><span>${summary.active} active</span><span>${summary.retired} retired</span><span>${summary.inUse} in use</span></div></button>`;
    }).join("")}</div></section>`;
  }).join("") || '<div class="managed-empty">No authority categories matched that search.</div>';
  els.authorityCategoryGroups.querySelectorAll("[data-authority-open]").forEach((button) => button.addEventListener("click", () => openAuthorityCategoryModal(button.dataset.authorityOpen)));
}

function openAuthorityCategoryModal(key) {
  if (!AUTHORITY_LIST_CONFIG[key]) return;
  state.authorityListKey = key;
  if (els.authorityEntrySearchInput) els.authorityEntrySearchInput.value = state.authorityEntrySearch || "";
  if (els.authorityStatusFilter) els.authorityStatusFilter.value = state.authorityStatusFilter || "all";
  if (els.authoritySortSelect) els.authoritySortSelect.value = state.authoritySort || "alpha";
  renderAuthorityCategoryModal();
  els.authorityCategoryModal?.classList.remove("hidden");
  els.authorityCategoryModal?.setAttribute("aria-hidden", "false");
}

function closeAuthorityCategoryModal() {
  els.authorityCategoryModal?.classList.add("hidden");
  els.authorityCategoryModal?.setAttribute("aria-hidden", "true");
}

function getFilteredAuthorityEntries(key = state.authorityListKey) {
  const query = state.authorityEntrySearch.trim().toLowerCase();
  return getAuthorityEntries(key).filter((entry) => {
    const usage = getAuthorityUsageDetails(key, entry.preferredLabel).count;
    if (state.authorityStatusFilter === "active" && entry.status === "retired") return false;
    if (state.authorityStatusFilter === "retired" && entry.status !== "retired") return false;
    if (state.authorityStatusFilter === "in-use" && usage < 1) return false;
    if (state.authorityStatusFilter === "unused" && usage > 0) return false;
    if (!query) return true;
    return `${entry.preferredLabel} ${entry.displayLabel} ${entry.alternateLabels.join(" ")} ${entry.notes}`.toLowerCase().includes(query);
  }).sort((a, b) => {
    if (state.authoritySort === "usage") return getAuthorityUsageDetails(key, b.preferredLabel).count - getAuthorityUsageDetails(key, a.preferredLabel).count || a.preferredLabel.localeCompare(b.preferredLabel);
    if (state.authoritySort === "updated") return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
    return a.preferredLabel.localeCompare(b.preferredLabel);
  });
}

function renderAuthorityCategoryModal() {
  const key = state.authorityListKey;
  const config = AUTHORITY_LIST_CONFIG[key];
  if (!config || !els.authorityEntriesBody) return;
  const entries = getFilteredAuthorityEntries(key);
  if (els.authorityCategoryModalTitle) els.authorityCategoryModalTitle.textContent = config.label;
  if (els.authorityCategoryModalSubtitle) els.authorityCategoryModalSubtitle.textContent = config.description;
  const summary = getAuthorityListSummary(key);
  if (els.authorityCategoryStatusLine) els.authorityCategoryStatusLine.textContent = `${summary.total} entries · ${summary.active} active · ${summary.retired} retired · ${summary.inUse} currently in use`;
  els.authorityEntriesBody.innerHTML = entries.map((entry) => {
    const usage = getAuthorityUsageDetails(key, entry.preferredLabel);
    return `<tr class="authority-entry-row" data-authority-edit="${entry.id}"><td><div class="authority-term-cell"><strong>${entry.preferredLabel}</strong>${entry.displayLabel ? `<span class="muted">Public label: ${entry.displayLabel}</span>` : ""}${entry.notes ? `<span class="muted">${entry.notes}</span>` : ""}</div></td><td>${entry.alternateLabels.length ? `<span class="badge badge-status">${entry.alternateLabels.length} alternate</span><div class="authority-alt-list">${entry.alternateLabels.join(", ")}</div>` : '<span class="muted">—</span>'}</td><td>${usage.count}</td><td>${entry.status === "retired" ? '<span class="badge badge-status">Retired</span>' : '<span class="badge badge-status">Active</span>'}</td><td>${formatDateTime(entry.updatedAt)}</td><td><button class="button button-secondary" type="button" data-authority-inline-edit="${entry.id}">Edit</button></td></tr>`;
  }).join("") || `<tr><td colspan="6" class="muted">No entries matched the current filters.</td></tr>`;
  els.authorityEntriesBody.querySelectorAll("[data-authority-edit], [data-authority-inline-edit]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    openAuthorityModal(key, event.currentTarget.dataset.authorityEdit || event.currentTarget.dataset.authorityInlineEdit);
  }));
  els.authorityEntriesBody.querySelectorAll("tr[data-authority-edit]").forEach((row) => row.addEventListener("click", () => openAuthorityModal(key, row.dataset.authorityEdit)));
}

function findAuthorityEntry(key, entryId) {
  return getAuthorityEntries(key).find((entry) => entry.id === entryId) || null;
}

function updateAuthorityEntry(key, nextEntry) {
  const store = getAuthorityStore();
  const entries = getAuthorityEntries(key);
  store[key] = entries.map((entry) => entry.id === nextEntry.id ? createAuthorityEntry(nextEntry.preferredLabel, nextEntry) : entry);
  syncLegacyAuthorityList(key);
  saveAuthorityStore();
}

function addAuthorityEntry(key, entry) {
  const store = getAuthorityStore();
  store[key] = [...getAuthorityEntries(key), createAuthorityEntry(entry.preferredLabel, entry)];
  syncLegacyAuthorityList(key);
  saveAuthorityStore();
}

function removeAuthorityEntry(key, entryId) {
  const store = getAuthorityStore();
  store[key] = getAuthorityEntries(key).filter((entry) => entry.id !== entryId);
  syncLegacyAuthorityList(key);
  saveAuthorityStore();
}

function replaceAuthorityLabelInRecords(key, prev, next = "") {
  if (key === "genres") {
    state.records = state.records.map((record) => {
      const genres = asArray(record.genres?.length ? record.genres : record.genre).map((genre) => genre === prev ? next : genre).filter(Boolean);
      const unique = [...new Set(genres)];
      return { ...record, genres: unique, genre: unique.join(", ") };
    });
  } else if (key === "subjects") {
    state.records = state.records.map((record) => ({ ...record, subjects: [...new Set(asArray(record.subjects).map((subject) => subject === prev ? next : subject).filter(Boolean))].join(", ") }));
  } else if (key === "locations") {
    state.records = state.records.map((record) => ({
      ...record,
      location: record.location === prev ? next : record.location,
      holdings: (record.holdings || []).map((holding) => holding.location === prev ? { ...holding, location: next } : holding),
    }));
  } else {
    const recordKey = AUTHORITY_LIST_CONFIG[key]?.recordKey;
    if (recordKey) state.records = state.records.map((record) => record[recordKey] === prev ? { ...record, [recordKey]: next } : record);
  }
  saveRecords(state.records);
}

function showAuthorityUsagePreview(key, entryId, openModal = false) {
  const entry = findAuthorityEntry(key, entryId);
  if (!entry || !els.authorityUsagePreview) return;
  const usage = getAuthorityUsageDetails(key, entry.preferredLabel);
  els.authorityUsagePreview.innerHTML = usage.count
    ? `<strong>Used in ${usage.count} record${usage.count === 1 ? "" : "s"}</strong><ul class="authority-preview-list">${usage.records.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<strong>Unused entry</strong><p class="muted">This standard entry is not attached to any records right now.</p>`;
  if (openModal) openAuthorityModal(key, entryId);
}

function populateAuthorityCategorySelect(selectedKey = state.authorityListKey) {
  if (!els.authorityCategorySelect) return;
  els.authorityCategorySelect.innerHTML = Object.values(AUTHORITY_LIST_CONFIG).map((config) => `<option value="${config.key}">${config.label}</option>`).join("");
  els.authorityCategorySelect.value = AUTHORITY_LIST_CONFIG[selectedKey] ? selectedKey : "creators";
}

function populateAuthorityMergeTargets(key, currentId = "") {
  if (!els.authorityMergeTarget) return;
  const options = getAuthorityEntries(key).filter((entry) => entry.id !== currentId && entry.status !== "retired").map((entry) => `<option value="${entry.id}">${entry.preferredLabel}</option>`).join("");
  els.authorityMergeTarget.innerHTML = `<option value="">Do not merge</option>${options}`;
}

function openAuthorityModal(key = state.authorityListKey, entryId = "") {
  state.authorityEditingId = entryId;
  populateAuthorityCategorySelect(key);
  populateAuthorityMergeTargets(key, entryId);
  const config = AUTHORITY_LIST_CONFIG[key];
  const entry = entryId ? findAuthorityEntry(key, entryId) : null;
  if (els.authorityModalTitle) els.authorityModalTitle.textContent = entry ? `Edit ${config.singular}` : `Add ${config.singular}`;
  if (els.authorityModalSubtitle) els.authorityModalSubtitle.textContent = config.description;
  if (els.authorityEntryId) els.authorityEntryId.value = entry?.id || "";
  if (els.authorityCategorySelect) els.authorityCategorySelect.value = key;
  if (els.authorityPreferredLabel) els.authorityPreferredLabel.value = entry?.preferredLabel || "";
  if (els.authorityDisplayLabel) els.authorityDisplayLabel.value = entry?.displayLabel || "";
  if (els.authorityEntryStatus) els.authorityEntryStatus.value = entry?.status || "active";
  if (els.authorityAltLabels) els.authorityAltLabels.value = entry?.alternateLabels.join(", ") || "";
  if (els.authorityEntryNotes) els.authorityEntryNotes.value = entry?.notes || "";
  if (els.authoritySortOrder) els.authoritySortOrder.value = entry?.sortOrder ?? "";
  if (els.authorityModalMessage) els.authorityModalMessage.textContent = "";
  showAuthorityUsagePreview(key, entryId);
  if (!entry && els.authorityUsagePreview) els.authorityUsagePreview.innerHTML = `<strong>New entry</strong><p class="muted">Add a preferred term now and alternate terms if your staff uses multiple local wordings.</p>`;
  if (els.authorityRetireBtn) els.authorityRetireBtn.classList.toggle("hidden", !entry);
  if (els.authorityDeleteBtn) els.authorityDeleteBtn.classList.toggle("hidden", !entry);
  if (els.authorityEntryModal) {
    els.authorityEntryModal.classList.remove("hidden");
    els.authorityEntryModal.setAttribute("aria-hidden", "false");
  }
}

function closeAuthorityModal() {
  if (!els.authorityEntryModal) return;
  els.authorityEntryModal.classList.add("hidden");
  els.authorityEntryModal.setAttribute("aria-hidden", "true");
}

function toggleAuthorityRetirement(key, entryId, forcedStatus = "") {
  const entry = findAuthorityEntry(key, entryId);
  if (!entry) return;
  const nextStatus = forcedStatus || (entry.status === "retired" ? "active" : "retired");
  updateAuthorityEntry(key, { ...entry, status: nextStatus, retiredAt: nextStatus === "retired" ? Date.now() : 0, updatedAt: Date.now() });
  renderAuthorityHome();
  renderAuthorityCategoryModal();
  fillMaterialTypes(); fillGenres(); fillFormats(); fillBindings(); fillLocations(); fillCuratedShelves(); fillIllLibraries(); fillAuthorityInputLists();
}

function deleteAuthorityEntry(key, entryId) {
  const entry = findAuthorityEntry(key, entryId);
  if (!entry) return;
  const usage = getAuthorityUsageDetails(key, entry.preferredLabel);
  if (usage.count > 0) {
    if (els.authorityModalMessage) els.authorityModalMessage.textContent = `This entry is in use by ${usage.count} record(s). Merge or retire it instead of deleting.`;
    return;
  }
  if (!window.confirm(`Delete ${entry.preferredLabel}? This cannot be undone.`)) return;
  removeAuthorityEntry(key, entryId);
  closeAuthorityModal();
  renderAuthorityHome();
  renderAuthorityCategoryModal();
  fillAuthorityInputLists();
}

function saveAuthorityEntry(event) {
  event.preventDefault();
  const key = els.authorityCategorySelect?.value || state.authorityListKey;
  const config = AUTHORITY_LIST_CONFIG[key];
  const preferredLabel = els.authorityPreferredLabel?.value.trim() || "";
  const alternateLabels = (els.authorityAltLabels?.value || "").split(",").map((value) => value.trim()).filter(Boolean);
  const displayLabel = els.authorityDisplayLabel?.value.trim() || "";
  const notes = els.authorityEntryNotes?.value.trim() || "";
  const status = els.authorityEntryStatus?.value || "active";
  const sortOrder = els.authoritySortOrder?.value || "";
  const mergeTargetId = els.authorityMergeTarget?.value || "";
  const currentId = els.authorityEntryId?.value || "";
  const entries = getAuthorityEntries(key);
  if (!preferredLabel) {
    if (els.authorityModalMessage) els.authorityModalMessage.textContent = `Enter a preferred ${config.singular} before saving.`;
    return;
  }
  if (entries.some((entry) => entry.id !== currentId && entry.preferredLabel.toLowerCase() === preferredLabel.toLowerCase())) {
    if (els.authorityModalMessage) els.authorityModalMessage.textContent = `${preferredLabel} already exists in ${config.label}.`;
    return;
  }
  const payload = createAuthorityEntry(preferredLabel, {
    id: currentId || undefined,
    displayLabel,
    alternateLabels,
    notes,
    status,
    sortOrder,
    createdAt: currentId ? findAuthorityEntry(key, currentId)?.createdAt : Date.now(),
    updatedAt: Date.now(),
    retiredAt: status === "retired" ? Date.now() : 0,
  });
  const original = currentId ? findAuthorityEntry(key, currentId) : null;
  if (mergeTargetId && original) {
    const mergeTarget = findAuthorityEntry(key, mergeTargetId);
    if (mergeTarget) {
      replaceAuthorityLabelInRecords(key, original.preferredLabel, mergeTarget.preferredLabel);
      updateAuthorityEntry(key, { ...mergeTarget, alternateLabels: [...new Set([...(mergeTarget.alternateLabels || []), original.preferredLabel, ...alternateLabels])], updatedAt: Date.now() });
      removeAuthorityEntry(key, original.id);
    }
  } else if (original) {
    if (original.preferredLabel !== preferredLabel) replaceAuthorityLabelInRecords(key, original.preferredLabel, preferredLabel);
    updateAuthorityEntry(key, payload);
  } else {
    addAuthorityEntry(key, payload);
  }
  if (key === "materialTypes" && !getCirculationRules().some((rule) => rule.materialType === preferredLabel)) saveCirculationRules([...getCirculationRules(), { materialType: preferredLabel, loanDays: 21 }]);
  closeAuthorityModal();
  render();
}

function renderAuthorityControl() {
  syncAllLegacyAuthorityLists();
  renderAuthorityHome();
  renderAuthorityCategoryModal();
}

function resetForm() {
  els.recordForm.reset();
  if (els.coverUploadStatus) els.coverUploadStatus.textContent = "";
  $("#recordId").value = "";
  $("#format").value = "Book";
  $("#binding").value = "";
  $("#identifier").value = "";
  $("#recordStatus").value = "Available";
  $("#primaryMaterialNumber").value = "";
  $("#callNumber").value = "";
  $("#location").value = "";
  $("#curatedShelf").value = "";
  $("#marcText").dataset.edited = "false";
  state.draftHoldings = [sanitizeHolding()];
  renderHoldingsEditor(state.draftHoldings);
  els.duplicateWarning.textContent = "";
  syncPrimaryHoldingFields();
  updateMarcPreview();
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

function copyActiveRecord() {
  const current = buildCurrentFormRecord();
  const copy = normalizeRecord({
    ...current,
    id: crypto.randomUUID(),
    localRecordId: "",
    title: current.title ? `${current.title} (Copy)` : "Untitled record (Copy)",
    materialNumbers: [],
    holdings: (current.holdings || []).map((holding) => ({ ...holding, id: crypto.randomUUID(), materialNumbers: [] })),
  });
  populateForm(copy);
  $("#recordId").value = "";
  $("#localRecordId").value = "";
  $("#primaryMaterialNumber").value = "";
  setActiveWorkspaceRecord("");
  setFormDirty(true);
  setRecordSaveMessage("Copy created in the editor. Review it and save when ready.", "success");
}

function saveAndNewRecord() {
  const saved = saveFormRecord(null, { resetAfterSave: true });
  if (!saved) return;
  $("#identifier").focus();
  setRecordSaveMessage(`Record saved for ${saved.title || "Untitled record"}. Ready for the next import.`, "success");
}

function lookupWorkspaceRecord() {
  const mode = els.workspaceLookupMode?.value || "Material Number";
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
    const holdSummary = getItemHoldSummary(r.materialNumbers?.[0] || '');
    tr.innerHTML = `<td><input type="checkbox" ${state.selectedIds.has(r.id) ? "checked" : ""}></td><td>${r.title}<div class="muted">${holdSummary.active ? `${holdSummary.active} waiting · ${holdSummary.trapped ? `Hold shelf for ${holdSummary.trapped.patronName}` : 'Queue active'}` : 'No active holds'}</div></td><td>${r.creator}</td><td>${r.format}</td><td>${r.year || ""}</td><td>${r.curatedShelf || "—"}</td><td>${r.status || "Available"}</td><td><button class="button button-secondary" data-act="edit" type="button">Edit</button> <button class="button button-secondary" data-act="dup" type="button">Duplicate</button> <button class="button" data-act="del" type="button">Delete</button></td>`;

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
  const normalizedRecord = normalizeRecord(record);
  if (els.curatedShelfSelect) els.curatedShelfSelect.dataset.pendingValue = String(normalizedRecord.curatedShelf || "").trim();
  FORM_FIELDS.forEach((pair) => {
    const [elId, prop] = pair.includes(":") ? pair.split(":") : [pair, pair];
    const value = prop === "materialNumbers" ? (normalizedRecord.materialNumbers || []).join("\n") : (normalizedRecord[prop] || "");
    const field = $(`#${elId}`);
    if (field) field.value = value;
  });

  const selected = [...new Set(asArray(normalizedRecord.genres?.length ? normalizedRecord.genres : normalizedRecord.genre))];
  [...$("#genres").options].forEach((option) => {
    option.selected = selected.includes(option.value);
  });
  $("#marcText").dataset.edited = normalizedRecord.marcText ? "true" : "false";

  window.scrollTo({ top: 0, behavior: "smooth" });
  state.draftHoldings = (normalizedRecord.holdings || []).map((holding) => sanitizeHolding(holding));
  renderHoldingsEditor(state.draftHoldings);
  checkDuplicateDraft();
  syncPrimaryHoldingFields();
  updateMarcPreview();
  setActiveWorkspaceRecord(normalizedRecord.id);
  switchIlsTab("records");
  setFormDirty(false);
}

function saveFormRecord(event, options = {}) {
  event?.preventDefault?.();
  const id = $("#recordId").value || crypto.randomUUID();
  const dateAdded = $("#dateAdded").value || new Date().toISOString().slice(0, 10);
  const selectedGenres = [...$("#genres").selectedOptions].map((option) => option.value);
  const custom = $("#genre").value.trim();
  const genres = [...new Set([...selectedGenres, ...(custom ? [custom] : [])])];
  syncHoldingDraftFromPrimary(false);
  const holdings = state.draftHoldings.map((holding) => sanitizeHolding(holding));
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
    isbn: $("#isbn").value.trim(),
    upc: $("#upc").value.trim(),
    lccn: $("#lccn").value.trim(),
    oclcNumber: $("#oclcNumber").value.trim(),
    localRecordId: $("#localRecordId").value.trim(),
    deweyNumber: $("#deweyNumber").value.trim(),
    lcClassNumber: $("#lcClassNumber").value.trim(),
    identifier: $("#identifier").value.trim() || $("#isbn").value.trim() || $("#upc").value.trim() || $("#oclcNumber").value.trim() || $("#lccn").value.trim(),
    genre: genres.join(", "),
    genres,
    materialType: $("#materialType").value.trim(),
    subjects: $("#subjects").value.trim(),
    audience: $("#audience").value.trim(),
    summaryNote: $("#summaryNote").value.trim(),
    targetAudience: $("#targetAudience").value.trim(),
    bibliographyNote: $("#bibliographyNote").value.trim(),
    description: $("#summaryNote").value.trim(),
    location: primaryHolding.location,
    callNumber: $("#callNumber").value.trim() || primaryHolding.callNumber,
    accessionNumber: primaryHolding.accessionNumber,
    materialNumbers: holdings.flatMap((holding) => holding.materialNumbers || []),
    status: $("#recordStatus").value || primaryHolding.status || "Available",
    dateAcquired: primaryHolding.dateAcquired,
    dateAdded,
    source: primaryHolding.source,
    pricePaid: primaryHolding.pricePaid,
    retailPrice: primaryHolding.retailPrice,
    notes: $("#notes").value.trim(),
    circulationHistory: $("#circulationHistory").value.trim(),
    coverUrl: $("#coverUrl").value.trim(),
    binding: $("#binding").value.trim(),
    dimensions: $("#dimensions").value.trim(),
    seriesName: $("#seriesName").value.trim(),
    seriesNumber: $("#seriesNumber").value.trim(),
    curatedShelf: $("#curatedShelf").value.trim(),
    pageCount: $("#pageCount").value.trim(),
    physicalDetails: $("#physicalDetails").value.trim(),
    marcLeader: $("#marcLeader").value.trim(),
    marc008: $("#marc008").value.trim(),
    marcText: $("#marcText").value.trim(),
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
  if (options.resetAfterSave) resetForm();
  else populateForm(record);
  setRecordSaveMessage(`Record saved for ${record.title || "Untitled record"}.`, "success");
  render();
  return record;
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
  const activeId = $("#recordId").value || state.activeWorkspaceRecordId;
  const record = activeId ? (state.records.find((entry) => entry.id === activeId) || buildCurrentFormRecord()) : buildCurrentFormRecord();
  if (!record?.title && !record?.creator && !record?.identifier) {
    setCirculationMessage("Enter or load a record first to export MARC.", true);
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

async function fetchMetadataByIdentifier(type, value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  const endpointMap = {
    isbn: `https://openlibrary.org/isbn/${encodeURIComponent(normalized)}.json`,
    oclc: `https://openlibrary.org/search.json?oclc=${encodeURIComponent(normalized)}`,
    lccn: `https://openlibrary.org/search.json?lccn=${encodeURIComponent(normalized)}`,
  };

  if (endpointMap[type]) {
    const response = await fetch(endpointMap[type]);
    if (!response.ok) return null;
    const data = await response.json();
    return data.docs ? data.docs[0] || null : data;
  }

  const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(normalized)}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.docs?.[0] || null;
}

async function fetchMetadata() {
  const rawIdentifier = $("#identifier").value.trim();
  if (!rawIdentifier) {
    els.duplicateWarning.textContent = "Enter an ISBN, UPC, OCLC number, or LCCN first.";
    return;
  }

  try {
    const normalizedIsbn = rawIdentifier.replace(/[^0-9Xx]/g, "");
    const searchType = rawIdentifier.toLowerCase().startsWith("oclc") ? "oclc"
      : rawIdentifier.toLowerCase().startsWith("lccn") ? "lccn"
      : /^[0-9Xx-]{8,}$/.test(rawIdentifier) ? "isbn"
      : "upc";
    const identifierValue = searchType === "isbn"
      ? normalizedIsbn
      : rawIdentifier.replace(/^oclc[:\s-]*/i, "").replace(/^lccn[:\s-]*/i, "").trim();
    const data = await fetchMetadataByIdentifier(searchType, identifierValue);
    if (!data) throw new Error("No metadata found for that identifier");

    const title = data.title || data.title_suggest || "";
    const subtitle = data.subtitle || "";
    const publisher = Array.isArray(data.publishers) ? data.publishers[0] : Array.isArray(data.publisher) ? data.publisher[0] : data.publishers || data.publisher || "";
    const publishDate = data.publish_date || data.first_publish_year || "";
    const authorNames = Array.isArray(data.author_name) ? data.author_name : [];
    const authors = Array.isArray(data.authors) ? data.authors : [];

    if (!$("#title").value && title) $("#title").value = String(title).slice(0, 300);
    if (!$("#subtitle").value && subtitle) $("#subtitle").value = String(subtitle).slice(0, 300);
    if (!$("#publisher").value && publisher) $("#publisher").value = String(publisher).slice(0, 300);
    if (!$("#year").value && publishDate) $("#year").value = String(publishDate).match(/\d{4}/)?.[0] || "";
    if (!$("#creator").value && authorNames.length) $("#creator").value = authorNames.join(", ");
    if (!$("#creator").value && authors.length) {
      const names = await Promise.all(authors.map(async (authorRef) => {
        try {
          if (!authorRef?.key) return "";
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

    if (!$("#summaryNote").value && data.notes) $("#summaryNote").value = String(Array.isArray(data.notes) ? data.notes[0] : data.notes).slice(0, 500);
    if (!$("#physicalDetails").value && data.physical_format) $("#physicalDetails").value = String(data.physical_format);
    if (!$("#pageCount").value && data.number_of_pages) $("#pageCount").value = String(data.number_of_pages);
    if (!$("#languageCode").value && Array.isArray(data.language) && data.language[0]?.key) $("#languageCode").value = String(data.language[0].key).split("/").pop().slice(0, 3);
    if (!$("#isbn").value && normalizedIsbn) $("#isbn").value = normalizedIsbn;
    if (!$("#upc").value && searchType === "upc") $("#upc").value = identifierValue;
    if (!$("#oclcNumber").value && (data.oclc?.[0] || searchType === "oclc")) $("#oclcNumber").value = String(data.oclc?.[0] || identifierValue);
    if (!$("#lccn").value && (data.lccn?.[0] || searchType === "lccn")) $("#lccn").value = String(data.lccn?.[0] || identifierValue);
    if (!$("#coverUrl").value && normalizedIsbn) $("#coverUrl").value = `https://covers.openlibrary.org/b/isbn/${normalizedIsbn}-L.jpg`;
    updateMarcPreview();
    setRecordSaveMessage(`Imported metadata for ${title || rawIdentifier}. Review and complete the form before saving.`, "success");
    els.duplicateWarning.textContent = "";
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
  const feeMessage = $("#patronFeeMessage");
  if (!feeMessage) return;
  feeMessage.textContent = message;
  feeMessage.classList.toggle('warning', isError);
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
    category: $("#feeCategory")?.value,
    dateAssessed: $("#feeDateAssessed")?.value || todayIso(),
    amount: $("#feeAmount")?.value,
    description: $("#feeDescription")?.value,
    status: $("#feeStatus")?.value,
  });
  saveFeeEntries([entry, ...getFeeEntries()]);
  $("#patronFeeForm")?.reset();
  populateStaticSelects();
  setPatronFeeMessage(`Added ${entry.category.toLowerCase()} for ${patron.name}.`);
  openPatronAccountModal('fines', patron);
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
  renderPatronDetail();
  if (state.activePatronModal === 'fines') openPatronAccountModal('fines');
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

function getMonthlyCirculationFilters() {
  const monthValue = els.monthlyCirculationMonth?.value || "";
  const startValue = els.monthlyCirculationStartDate?.value || "";
  const endValue = els.monthlyCirculationEndDate?.value || "";
  if (monthValue) {
    const [year, month] = monthValue.split("-").map((part) => Number.parseInt(part, 10));
    const start = new Date(year, (month || 1) - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month || 1, 0, 23, 59, 59, 999);
    return { start, end, label: formatMonthLabel(monthValue), monthValue, mode: 'month' };
  }
  const start = startValue ? new Date(`${startValue}T00:00:00`) : null;
  const end = endValue ? new Date(`${endValue}T23:59:59`) : null;
  return { start, end, label: start && end ? `${start.toLocaleDateString()} – ${end.toLocaleDateString()}` : start ? `From ${start.toLocaleDateString()}` : end ? `Through ${end.toLocaleDateString()}` : 'All recorded circulation', monthValue: '', mode: 'range' };
}

function summarizeMonthlyCirculation() {
  const filters = getMonthlyCirculationFilters();
  const monthly = new Map();
  const material = new Map();
  let total = 0;
  state.records.forEach((record) => {
    const materialType = record.materialType || record.format || 'Other';
    parseCirculationLines(record).filter((line) => line.isCheckout && Number.isFinite(line.timestamp)).forEach((line) => {
      const date = new Date(line.timestamp);
      if (filters.start && date < filters.start) return;
      if (filters.end && date > filters.end) return;
      const monthKey = getMonthKey(date.toISOString());
      monthly.set(monthKey, Number(monthly.get(monthKey) || 0) + 1);
      material.set(materialType, Number(material.get(materialType) || 0) + 1);
      total += 1;
    });
  });
  const monthlyRows = [...monthly.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({ month, count }));
  const materialRows = [...material.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([type, count]) => ({ type, count, percent: total ? (count / total) * 100 : 0 }));
  return { ...filters, total, monthlyRows, materialRows };
}

function renderMonthlyCirculationReport() {
  if (!els.monthlyCirculationReport || !els.monthlyCirculationSummary) return;
  const summary = summarizeMonthlyCirculation();
  els.monthlyCirculationSummary.textContent = summary.total
    ? `${summary.total} checkout${summary.total === 1 ? '' : 's'} found for ${summary.label}.`
    : `No checkout activity was found for ${summary.label}.`;
  if (!summary.total) {
    els.monthlyCirculationReport.innerHTML = '<div class="empty-state">No circulation activity matches the selected period yet.</div>';
    return;
  }
  const peakMonth = summary.monthlyRows.reduce((best, row) => (!best || row.count > best.count ? row : best), null);
  const topMaterial = summary.materialRows[0] || null;
  const monthlyMax = Math.max(...summary.monthlyRows.map((row) => row.count), 1);
  const materialMax = Math.max(...summary.materialRows.map((row) => row.count), 1);
  els.monthlyCirculationReport.innerHTML = `
    <div class="summary-card-grid">
      <article class="summary-card"><span class="summary-card-label">Selected period</span><strong class="summary-card-value">${escapeHtml(summary.label)}</strong><span>${summary.monthValue ? 'Specific month filter applied' : 'Range or open-ended filter'}</span></article>
      <article class="summary-card"><span class="summary-card-label">Total circulation</span><strong class="summary-card-value">${summary.total}</strong><span>checkouts in period</span></article>
      <article class="summary-card"><span class="summary-card-label">Peak month</span><strong class="summary-card-value">${escapeHtml(peakMonth ? formatMonthLabel(peakMonth.month) : '—')}</strong><span>${peakMonth ? `${peakMonth.count} checkout${peakMonth.count === 1 ? '' : 's'}` : 'No monthly totals'}</span></article>
      <article class="summary-card"><span class="summary-card-label">Top material type</span><strong class="summary-card-value">${escapeHtml(topMaterial?.type || '—')}</strong><span>${topMaterial ? `${topMaterial.count} checkouts · ${topMaterial.percent.toFixed(1)}%` : 'No type data'}</span></article>
    </div>
    <section class="report-split-grid">
      <article class="report-card"><div class="panel-header compact"><div><h4>Monthly totals</h4><p class="muted">Monthly checkout trend for the selected data.</p></div></div><ul class="bar-list">${summary.monthlyRows.map((row) => `<li><span>${escapeHtml(formatMonthLabel(row.month))}</span><div class="bar-track"><div class="bar-fill" style="width:${(row.count / monthlyMax) * 100}%"></div></div><strong>${row.count}</strong></li>`).join('')}</ul></article>
      <article class="report-card"><div class="panel-header compact"><div><h4>Material type distribution</h4><p class="muted">Checkout share by item material type.</p></div></div><ul class="bar-list">${summary.materialRows.map((row) => `<li><span>${escapeHtml(row.type)}</span><div class="bar-track"><div class="bar-fill material-bar-fill" style="width:${(row.count / materialMax) * 100}%"></div></div><strong>${row.percent.toFixed(1)}%</strong></li>`).join('')}</ul></article>
    </section>
    <section class="report-split-grid">
      <article class="report-card"><h4>Monthly totals table</h4><div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Month</th><th>Total checkouts</th></tr></thead><tbody>${summary.monthlyRows.map((row) => `<tr><td>${escapeHtml(formatMonthLabel(row.month))}</td><td>${row.count}</td></tr>`).join('')}</tbody></table></div></article>
      <article class="report-card"><h4>Material type breakdown</h4><div class="report-table-wrap"><table class="serials-table"><thead><tr><th>Material type</th><th>Total checkouts</th><th>% of circulation</th></tr></thead><tbody>${summary.materialRows.map((row) => `<tr><td>${escapeHtml(row.type)}</td><td>${row.count}</td><td>${row.percent.toFixed(1)}%</td></tr>`).join('')}</tbody></table></div></article>
    </section>`;
}

function exportMonthlyCirculationCsv() {
  const summary = summarizeMonthlyCirculation();
  if (!summary.total) {
    els.monthlyCirculationSummary.textContent = 'No circulation data is available to export for the selected period.';
    return;
  }
  const rows = [
    ['Monthly Circulation Report'],
    ['Selected period', summary.label],
    ['Total circulation', String(summary.total)],
    [],
    ['Monthly totals'],
    ['Month', 'Total checkouts'],
    ...summary.monthlyRows.map((row) => [formatMonthLabel(row.month), String(row.count)]),
    [],
    ['Material type breakdown'],
    ['Material type', 'Total checkouts', 'Percent of total'],
    ...summary.materialRows.map((row) => [row.type, String(row.count), row.percent.toFixed(1) + '%']),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `monthly-circulation-${(summary.monthValue || todayIso()).replace(/[^0-9-]/g, '')}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderReportsModule() {
  const category = REPORT_CATEGORIES[state.reportsCategory] || REPORT_CATEGORIES.collection;
  const activeReport = REPORT_DEFINITIONS[state.activeReportId] || REPORT_DEFINITIONS['monthly-circulation'];
  if (els.reportsCategoryGrid) {
    els.reportsCategoryGrid.innerHTML = Object.entries(REPORT_CATEGORIES).map(([key, config]) => `<article class="report-nav-card"><div><p class="eyebrow">${config.reports.length} report${config.reports.length === 1 ? '' : 's'}</p><h3>${escapeHtml(config.label)}</h3><p class="muted">${escapeHtml(config.description)}</p></div><div class="report-nav-card-footer"><span class="report-count-pill">${config.reports.length} total</span><button class="button button-secondary" type="button" data-report-category="${key}">View Reports</button></div></article>`).join('');
  }
  if (els.reportsCategoryTitle) els.reportsCategoryTitle.textContent = category.label;
  if (els.reportsCategoryDescription) els.reportsCategoryDescription.textContent = category.description;
  if (els.reportsCategoryList) {
    els.reportsCategoryList.innerHTML = category.reports.map((reportId) => {
      const report = REPORT_DEFINITIONS[reportId];
      return `<article class="report-nav-card compact"><div><h3>${escapeHtml(report.title)}</h3><p class="muted">${escapeHtml(report.description)}</p></div><div class="report-nav-card-footer"><button class="button button-secondary" type="button" data-open-report="${reportId}">Open Report</button></div></article>`;
    }).join('');
  }
  if (els.reportsWorkspaceEyebrow) els.reportsWorkspaceEyebrow.textContent = category.label;
  if (els.reportsWorkspaceTitle) els.reportsWorkspaceTitle.textContent = activeReport.title;
  if (els.reportsWorkspaceDescription) els.reportsWorkspaceDescription.textContent = activeReport.description;
  els.reportsLandingView?.classList.toggle('hidden', state.reportsView !== 'landing');
  els.reportsCategoryView?.classList.toggle('hidden', state.reportsView !== 'category');
  els.reportsWorkspaceView?.classList.toggle('hidden', state.reportsView !== 'workspace');
  els.reportWorkspacePanels.forEach((panel) => panel.classList.add('hidden'));
  const activePanel = document.querySelector(`#${activeReport.panelId}`);
  if (activePanel) activePanel.classList.remove('hidden');
}

function renderEnhancedReports() {
  renderMonthlyCirculationReport();
  renderWeedingReport();
  renderBusiestHoursReport();
  renderMostBorrowedAuthorsReport();
  renderSectionUsageReport();
  renderFinesFeesReport();
}

function openReportsLanding() {
  state.reportsView = 'landing';
  renderReportsModule();
}

function openReportCategory(categoryId) {
  state.reportsCategory = REPORT_CATEGORIES[categoryId] ? categoryId : 'collection';
  state.reportsView = 'category';
  renderReportsModule();
}

function openReportWorkspace(reportId) {
  const report = REPORT_DEFINITIONS[reportId] || REPORT_DEFINITIONS['monthly-circulation'];
  state.activeReportId = reportId in REPORT_DEFINITIONS ? reportId : 'monthly-circulation';
  state.reportsCategory = report.category;
  state.reportsView = 'workspace';
  renderReportsModule();
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
  [
    renderReportsModule,
    renderEnhancedReports,
    renderMissingBiblioReport,
    renderOverdueReport,
    renderOperationalReports,
  ].forEach((renderFn) => {
    try {
      renderFn();
    } catch (error) {
      console.error(`Unable to finish ${renderFn.name}.`, error);
    }
  });
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

  on(els.recordForm, "submit", saveFormRecord);
  on(els.recordForm, "input", () => {
    setFormDirty(true);
    setRecordSaveMessage("");
    if (document.activeElement?.id === "marcText") {
      const marcText = $("#marcText");
      if (marcText) marcText.dataset.edited = "true";
    }
    if (["callNumber", "location", "recordStatus", "primaryMaterialNumber"].includes(document.activeElement?.id || "")) syncHoldingDraftFromPrimary();
    updateMarcPreview();
    checkDuplicateDraft();
  });
  on(els.cancelEditBtn, "click", () => {
    if (state.formDirty && !window.confirm("Discard unsaved changes?")) return;
    resetForm();
    setFormDirty(false);
    setRecordSaveMessage("");
  });
  on(els.fetchMetadataBtn, "click", fetchMetadata);
  if (els.createBlankRecordBtn) els.createBlankRecordBtn.addEventListener("click", () => {
    resetForm();
    const identifierInput = $("#identifier");
    if (identifierInput) identifierInput.focus();
    setActiveWorkspaceRecord("");
    setRecordSaveMessage("Blank record ready. Complete the form and save when finished.", "success");
  });
  if (els.saveAndNewBtn) els.saveAndNewBtn.addEventListener("click", saveAndNewRecord);
  if (els.copyRecordBtn) els.copyRecordBtn.addEventListener("click", copyActiveRecord);
  on(els.coverUpload, "change", handleCoverUpload);
  if (els.serialCoverUpload) els.serialCoverUpload.addEventListener("change", handleSerialCoverUpload);
  if (els.acqCoverUpload) els.acqCoverUpload.addEventListener("change", handleAcquisitionCoverUpload);

  on(els.searchInput, "input", () => {
    state.query = els.searchInput.value;
    renderSearchPopover();
  });

  on(els.searchInput, "focus", renderSearchPopover);
  on(els.searchInput, "keydown", (event) => {
    if (!els.searchResultsPopover) return;
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
    if (event.target === els.searchInput || (els.searchResultsPopover && els.searchResultsPopover.contains(event.target))) return;
    hideSearchPopover();
  });
  document.addEventListener("click", (event) => {
    if (event.target === els.patronSearchInput || els.patronSearchResults?.contains(event.target)) return;
    hidePatronSearchResults();
  });

  on(els.selectAllRows, "change", (event) => {
    state.selectedIds.clear();
    if (event.target.checked) state.records.forEach((record) => state.selectedIds.add(record.id));
    renderTable();
  });

  on(els.applyBulkBtn, "click", applyBulkStatus);
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
  if (els.patronSearchInput) {
    els.patronSearchInput.addEventListener("input", (event) => {
      state.patronSearchQuery = event.target.value || "";
      state.patronSearchIndex = 0;
      renderPatronSearchResults();
    });
    els.patronSearchInput.addEventListener("focus", renderPatronSearchResults);
    els.patronSearchInput.addEventListener("keydown", (event) => {
      const results = getFilteredPatronResults();
      if (!results.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        state.patronSearchIndex = Math.min((state.patronSearchIndex < 0 ? -1 : state.patronSearchIndex) + 1, results.length - 1);
        renderPatronSearchResults();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        state.patronSearchIndex = Math.max((state.patronSearchIndex < 0 ? results.length : state.patronSearchIndex) - 1, 0);
        renderPatronSearchResults();
      } else if (event.key === "Enter") {
        event.preventDefault();
        selectPatron(results[Math.max(state.patronSearchIndex, 0)]?.id || results[0].id);
      } else if (event.key === "Escape") {
        hidePatronSearchResults();
      }
    });
  }
  if (els.openPatronCreateModalBtn) els.openPatronCreateModalBtn.addEventListener("click", () => { resetPatronForm(); openPatronEditorModal("add"); });
  [els.noticeAgeFilter, els.noticePatronFilter, els.noticeCardFilter, els.noticeMaterialTypeFilter, els.noticeAccountStatusFilter].filter(Boolean).forEach((el) => el.addEventListener("input", renderNoticesWorkspace));
  [els.noticeAgeFilter, els.noticeMaterialTypeFilter, els.noticeAccountStatusFilter].filter(Boolean).forEach((el) => el.addEventListener("change", renderNoticesWorkspace));
  if (els.clearNoticeFiltersBtn) els.clearNoticeFiltersBtn.addEventListener("click", () => {
    if (els.noticeAgeFilter) els.noticeAgeFilter.value = "1";
    if (els.noticePatronFilter) els.noticePatronFilter.value = "";
    if (els.noticeCardFilter) els.noticeCardFilter.value = "";
    if (els.noticeMaterialTypeFilter) els.noticeMaterialTypeFilter.value = "all";
    if (els.noticeAccountStatusFilter) els.noticeAccountStatusFilter.value = "all";
    renderNoticesWorkspace();
  });
  if (els.closePatronModalBtn) els.closePatronModalBtn.addEventListener("click", closePatronAccountModal);
  if (els.closePatronEditorModalBtn) els.closePatronEditorModalBtn.addEventListener("click", closePatronEditorModal);
  if (els.patronAccountModal) els.patronAccountModal.addEventListener("click", (event) => { if (event.target === els.patronAccountModal) closePatronAccountModal(); });
  if (els.patronEditorModal) els.patronEditorModal.addEventListener("click", (event) => { if (event.target === els.patronEditorModal) closePatronEditorModal(); });
  if (els.serialIssueForm) els.serialIssueForm.addEventListener("submit", addSerialIssue);
  if (els.serialSubscriptionForm) els.serialSubscriptionForm.addEventListener("submit", saveSubscription);
  if (els.openIncomingIllModalBtn) els.openIncomingIllModalBtn.addEventListener("click", () => openIllRecordModal('incoming', 'create'));
  if (els.openOutgoingIllModalBtn) els.openOutgoingIllModalBtn.addEventListener("click", () => openIllRecordModal('outgoing', 'create'));
  if (els.closeIllModalBtn) els.closeIllModalBtn.addEventListener("click", closeIllRecordModal);
  if (els.illRecordModal) els.illRecordModal.addEventListener("click", (event) => { if (event.target === els.illRecordModal) closeIllRecordModal(); });
  if (els.illRecordForm) els.illRecordForm.addEventListener("submit", saveIllRecord);
  if (els.illPatronLookup) els.illPatronLookup.addEventListener("input", renderIllPatronLookupResults);
  if (els.clearIllFilterBtn) els.clearIllFilterBtn.addEventListener("click", () => { state.activeIllFilter = ''; renderIllWorkspace(); });
  if (els.registerForm) els.registerForm.addEventListener("submit", saveRegisterEntry);
  if (els.cancelRegisterEditBtn) els.cancelRegisterEditBtn.addEventListener("click", resetRegisterForm);
  if (els.registerCategory) els.registerCategory.addEventListener("change", toggleDonationFields);
  if (els.registerDonationPurpose) els.registerDonationPurpose.addEventListener("change", toggleDonationFields);
  if (els.registerReportDate) els.registerReportDate.addEventListener("change", renderRegisterWorkspace);
  if (els.viewRegisterTransactionsBtn) els.viewRegisterTransactionsBtn.addEventListener("click", openRegisterTransactionsModal);
  if (els.closeRegisterTransactionsModalBtn) els.closeRegisterTransactionsModalBtn.addEventListener("click", closeRegisterTransactionsModal);
  if (els.registerTransactionsModal) els.registerTransactionsModal.addEventListener("click", (event) => { if (event.target === els.registerTransactionsModal) closeRegisterTransactionsModal(); });
  $$('[data-register-quick-amount]').forEach((button) => button.addEventListener('click', () => prefillRegisterForm({ amount: button.dataset.registerQuickAmount, category: 'Copies' })));
  if (els.dashboardTileGrid) els.dashboardTileGrid.addEventListener("click", (event) => {
    const visitorBtn = event.target.closest('#visitorCounterBtn');
    if (visitorBtn) {
      incrementDailyCounter("visitor");
      return;
    }
    const referenceBtn = event.target.closest('#referenceCounterBtn');
    if (referenceBtn) incrementDailyCounter("reference");
  });
  if (els.visitorCounterBtn) els.visitorCounterBtn.addEventListener("click", () => incrementDailyCounter("visitor"));
  if (els.referenceCounterBtn) els.referenceCounterBtn.addEventListener("click", () => incrementDailyCounter("reference"));
  els.heroSectionJumpButtons.forEach((button) => button.addEventListener("click", () => switchIlsSection(button.dataset.ilsSection)));
  if (els.checkOutForm) els.checkOutForm.addEventListener("submit", checkOutRecord);
  if (els.checkOutCardNumber) els.checkOutCardNumber.addEventListener("input", () => renderCheckoutPatronPreview());
  if (els.runMissingReportBtn) els.runMissingReportBtn.addEventListener("click", renderMissingBiblioReport);
  if (els.reportsBackToLandingBtn) els.reportsBackToLandingBtn.addEventListener('click', openReportsLanding);
  if (els.reportsBackToCategoryBtn) els.reportsBackToCategoryBtn.addEventListener('click', () => openReportCategory(state.reportsCategory));
  if (els.reportsBackToLandingFromWorkspaceBtn) els.reportsBackToLandingFromWorkspaceBtn.addEventListener('click', openReportsLanding);
  document.addEventListener('click', (event) => {
    const categoryBtn = event.target.closest('[data-report-category]');
    if (categoryBtn) openReportCategory(categoryBtn.dataset.reportCategory);
    const reportBtn = event.target.closest('[data-open-report]');
    if (reportBtn) openReportWorkspace(reportBtn.dataset.openReport);
  });
  [els.monthlyCirculationMonth, els.monthlyCirculationStartDate, els.monthlyCirculationEndDate, els.weedingPreset, els.weedingCustomValue, els.weedingCustomUnit, els.weedingLocationFilter, els.weedingMaterialTypeFilter, els.weedingStatusFilter, els.weedingAudienceFilter, els.weedingSort, els.trafficRangePreset, els.trafficStartDate, els.trafficEndDate, els.authorStartDate, els.authorEndDate, els.authorLocationFilter, els.authorMaterialTypeFilter, els.authorAudienceFilter, els.authorSort, els.sectionSort, els.feeReportStatusFilter, els.feeReportCategoryFilter, els.feeReportPatronFilter, els.feeReportStartDate, els.feeReportEndDate].filter(Boolean).forEach((el) => el.addEventListener('input', renderStatsPanel));
  [els.monthlyCirculationMonth, els.weedingPreset, els.weedingLocationFilter, els.weedingMaterialTypeFilter, els.weedingStatusFilter, els.weedingAudienceFilter, els.weedingSort, els.trafficRangePreset, els.authorLocationFilter, els.authorMaterialTypeFilter, els.authorAudienceFilter, els.authorSort, els.sectionSort, els.feeReportStatusFilter, els.feeReportCategoryFilter, els.feeReportPatronFilter].filter(Boolean).forEach((el) => el.addEventListener('change', renderStatsPanel));
  if (els.monthlyCirculationExportBtn) els.monthlyCirculationExportBtn.addEventListener('click', exportMonthlyCirculationCsv);
  if (els.queueCheckoutItemBtn) els.queueCheckoutItemBtn.addEventListener("click", queueCheckoutItem);
  if (els.loadCheckoutPatronBtn) els.loadCheckoutPatronBtn.addEventListener("click", () => loadCheckoutPatron());
  if (els.clearCheckoutPatronBtn) els.clearCheckoutPatronBtn.addEventListener("click", () => clearCheckoutSession());
  if (els.printCheckoutReceiptBtn) els.printCheckoutReceiptBtn.addEventListener("click", printCheckoutReceipt);
  if (els.receiptSettingsForm) els.receiptSettingsForm.addEventListener("submit", saveReceiptSettingsFromForm);
  if (els.receiptLogoUpload) els.receiptLogoUpload.addEventListener("change", handleReceiptLogoUpload);
  if (els.checkOutCardNumber) {
    els.checkOutCardNumber.addEventListener("input", () => renderCheckoutPatronPreview(els.checkOutCardNumber.value));
    els.checkOutCardNumber.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); loadCheckoutPatron(); } });
    els.checkOutCardNumber.addEventListener("blur", () => { if (els.checkOutCardNumber.value.trim()) loadCheckoutPatron(); });
  }
  if (els.addHoldingBtn) els.addHoldingBtn.addEventListener("click", () => {
    state.draftHoldings = [...collectDraftHoldings(), sanitizeHolding()];
    renderHoldingsEditor(state.draftHoldings);
  });
  if (els.checkOutMaterialNumber) els.checkOutMaterialNumber.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); queueCheckoutItem(); } });
  if (els.checkInForm) els.checkInForm.addEventListener("submit", checkInByMaterialNumber);
  if (els.holdForm) els.holdForm.addEventListener("submit", placeHold);
  if (els.holdCardNumber) els.holdCardNumber.addEventListener('input', buildHoldPlacementPreview);
  if (els.holdMaterialNumber) els.holdMaterialNumber.addEventListener('input', buildHoldPlacementPreview);
  if (els.holdType) els.holdType.addEventListener('change', buildHoldPlacementPreview);
  if (els.holdPatronSelect) els.holdPatronSelect.addEventListener('change', () => { if (!els.holdCardNumber.value.trim()) els.holdCardNumber.value = els.holdPatronSelect.value; buildHoldPlacementPreview(); });
  if (els.holdShelfDays) els.holdShelfDays.addEventListener('change', () => { state.settings.holdShelfDays = Number(els.holdShelfDays.value || 7); saveSettings(state.settings); renderHoldsTable(); });
  if (els.runHoldExpirationBtn) els.runHoldExpirationBtn.addEventListener('click', () => expireReadyHolds());
  if (els.holdsReadySort) els.holdsReadySort.addEventListener('change', renderHoldsTable);
  if (els.closeHoldQueueModalBtn) els.closeHoldQueueModalBtn.addEventListener('click', closeHoldQueueModal);
  if (els.holdQueueModal) els.holdQueueModal.addEventListener('click', (event) => { if (event.target === els.holdQueueModal) closeHoldQueueModal(); });
  els.holdQuickFilters.forEach((button) => button.addEventListener('click', () => { state.holdFilter = button.dataset.holdFilter; els.holdQuickFilters.forEach((entry) => entry.classList.toggle('is-active', entry === button)); renderHoldsTable(); }));
  els.circulationTabButtons.forEach((button) => button.addEventListener("click", () => switchCirculationTab(button.dataset.circulationTab)));
  els.ilsSectionButtons.forEach((btn) => btn.addEventListener("click", () => switchIlsSection(btn.dataset.ilsSection)));
  window.addEventListener("beforeunload", (event) => {
    if (!state.formDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  if (els.authoritySearchInput) els.authoritySearchInput.addEventListener("input", (event) => { state.authoritySearch = event.target.value || ""; renderAuthorityHome(); });
  if (els.authorityClearSearchBtn) els.authorityClearSearchBtn.addEventListener("click", () => { state.authoritySearch = ""; if (els.authoritySearchInput) els.authoritySearchInput.value = ""; renderAuthorityHome(); });
  if (els.authorityAddEntryBtn) els.authorityAddEntryBtn.addEventListener("click", () => openAuthorityModal(state.authorityListKey || "creators"));
  if (els.closeAuthorityCategoryModalBtn) els.closeAuthorityCategoryModalBtn.addEventListener("click", closeAuthorityCategoryModal);
  if (els.authorityWorkspaceAddBtn) els.authorityWorkspaceAddBtn.addEventListener("click", () => openAuthorityModal(state.authorityListKey));
  if (els.authorityEntrySearchInput) els.authorityEntrySearchInput.addEventListener("input", (event) => { state.authorityEntrySearch = event.target.value || ""; renderAuthorityCategoryModal(); });
  if (els.authorityStatusFilter) els.authorityStatusFilter.addEventListener("change", (event) => { state.authorityStatusFilter = event.target.value || "all"; renderAuthorityCategoryModal(); });
  if (els.authoritySortSelect) els.authoritySortSelect.addEventListener("change", (event) => { state.authoritySort = event.target.value || "alpha"; renderAuthorityCategoryModal(); });
  if (els.authorityCategorySelect) els.authorityCategorySelect.addEventListener("change", (event) => populateAuthorityMergeTargets(event.target.value, els.authorityEntryId?.value || ""));
  if (els.authorityEntryForm) els.authorityEntryForm.addEventListener("submit", saveAuthorityEntry);
  if (els.closeAuthorityModalBtn) els.closeAuthorityModalBtn.addEventListener("click", closeAuthorityModal);
  if (els.authorityRetireBtn) els.authorityRetireBtn.addEventListener("click", () => {
    const key = els.authorityCategorySelect?.value || state.authorityListKey;
    const entryId = els.authorityEntryId?.value || "";
    toggleAuthorityRetirement(key, entryId, "retired");
    closeAuthorityModal();
    render();
  });
  if (els.authorityDeleteBtn) els.authorityDeleteBtn.addEventListener("click", () => deleteAuthorityEntry(els.authorityCategorySelect?.value || state.authorityListKey, els.authorityEntryId?.value || ""));
  if (els.authorityCategoryModal) els.authorityCategoryModal.addEventListener("click", (event) => { if (event.target === els.authorityCategoryModal) closeAuthorityCategoryModal(); });
  if (els.authorityEntryModal) els.authorityEntryModal.addEventListener("click", (event) => { if (event.target === els.authorityEntryModal) closeAuthorityModal(); });
}

function runRenderStep(label, renderStep) {
  try {
    renderStep();
  } catch (error) {
    console.error(`Unable to render ${label}.`, error);
  }
}

function initCatalogingSectionTabs() {
  const recordEditorShell = document.querySelector(".record-editor-shell");
  if (!recordEditorShell) return;
  const sections = Array.from(recordEditorShell.querySelectorAll(".cataloging-section"));
  if (!sections.length) return;

  const tabBar = document.createElement("div");
  tabBar.className = "cataloging-section-tabs";

  sections.forEach((section, index) => {
    const heading = section.querySelector("h4");
    const label = (heading?.textContent || `Section ${index + 1}`).replace(/^\d+\.\s*/, "").trim();
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cataloging-section-tab";
    button.textContent = label;
    section.id = section.id || `cataloging-section-${index + 1}`;
    button.addEventListener("click", () => {
      const targetSection = sections[index];
      if (!targetSection) return;
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      sections.forEach((entry) => entry.classList.remove("is-targeted"));
      targetSection.classList.add("is-targeted");
      window.setTimeout(() => targetSection.classList.remove("is-targeted"), 1200);
      tabBar.querySelectorAll(".cataloging-section-tab").forEach((tab, tabIndex) => {
        tab.classList.toggle("is-active", tabIndex === index);
      });
    });
    tabBar.appendChild(button);
  });

  recordEditorShell.insertBefore(tabBar, sections[0]);
  const firstTab = tabBar.querySelector(".cataloging-section-tab");
  if (firstTab) firstTab.classList.add("is-active");
}

function render() {
  ensureNoticeTemplatesSeeded();
  [
    ["material types", fillMaterialTypes],
    ["genres", fillGenres],
    ["formats", fillFormats],
    ["bindings", fillBindings],
    ["locations", fillLocations],
    ["curated shelves", fillCuratedShelves],
    ["ILL libraries", fillIllLibraries],
    ["authority input lists", fillAuthorityInputLists],
    ["holdings editor", () => renderHoldingsEditor(collectDraftHoldings().length ? collectDraftHoldings() : state.draftHoldings)],
    ["records table", renderTable],
    ["patron search results", renderPatronSearchResults],
    ["patron detail", renderPatronDetail],
    ["notices workspace", renderNoticesWorkspace],
    ["subscriptions table", renderSubscriptionsTable],
    ["serial issues table", renderSerialIssuesTable],
    ["acquisitions workspace", renderAcquisitionsWorkspace],
    ["checkout queue", renderCheckoutQueue],
    ["checkout patron preview", renderCheckoutPatronPreview],
    ["checkout patron context", renderCheckoutPatronContext],
    ["check-in result", renderCheckInResult],
    ["recent checkout transactions", () => renderRecentTransactions(els.recentCheckoutTransactions, 'checkout')],
    ["recent check-in transactions", () => renderRecentTransactions(els.recentCheckinTransactions, 'checkin')],
    ["circulation rules table", renderCirculationRulesTable],
    ["receipt settings", renderReceiptSettings],
    ["holds table", renderHoldsTable],
    ["stats panel", renderStatsPanel],
    ["dashboard", renderDashboard],
    ["quick counters", renderQuickCounters],
    ["ILL workspace", renderIllWorkspace],
    ["register workspace", renderRegisterWorkspace],
    ["authority control", renderAuthorityControl],
  ].forEach(([label, renderStep]) => runRenderStep(label, renderStep));
}

function init() {
  ensureNoticeTemplatesSeeded();
  populateStaticSelects();
  toggleDonationFields();
  bindEvents();
  initCatalogingSectionTabs();
  state.draftHoldings = [sanitizeHolding()];

  switchIlsSection("dashboard");
  switchCirculationTab("checkout");
  renderReceiptSettings();
  renderCheckoutReceipt(null);
  updateCheckoutStatus('Awaiting patron load.', 'Items will display updated status here.');
  renderCheckoutGateState();
  render();
  hydrateRemoteRecords();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
