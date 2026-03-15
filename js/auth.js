import { ADMIN_CREDENTIALS, SESSION_KEY } from "./config.js";

export function isAdminSessionActive() {
  return localStorage.getItem(SESSION_KEY) === "1";
}

export function login(username, password) {
  const ok = username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
  if (ok) localStorage.setItem(SESSION_KEY, "1");
  return ok;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
