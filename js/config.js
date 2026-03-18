export const STORAGE_KEY = "catalogRecordsV2";
export const SETTINGS_KEY = "catalogSettingsV1";
export const SESSION_KEY = "catalogAdminSession";

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "catalog123",
};

export const STATUSES = ["Available", "Checked In", "On Loan", "On Order", "Reference Only", "Missing"];

export const PAGE_SIZE = 12;

export const PLACEHOLDER_COVER = "https://placehold.co/180x260?text=No+Cover";


export const FIREBASE_COLLECTION = "records";

export const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};


export const FIREBASE_REQUIRED_FIELDS = ["apiKey", "authDomain", "projectId", "appId"];

export function getMissingFirebaseConfigFields(config = FIREBASE_CONFIG) {
  return FIREBASE_REQUIRED_FIELDS.filter((field) => !String(config?.[field] || "").trim());
}

export function isFirebaseConfigReady(config = FIREBASE_CONFIG) {
  return getMissingFirebaseConfigFields(config).length === 0;
}
