# Willow Creek Personal OPAC

A front-end-only personal catalog/OPAC app built with plain HTML, CSS, and JavaScript.
It now includes a polished public catalog experience and a distinct Firebase-ready ILS workspace.

## Features

### Public OPAC
- Global keyword search and advanced field search (title, creator, subject, keyword, year, format).
- Faceted filtering (format, genre, year, availability, location).
- Sort options: relevance, newest/oldest, title A-Z/Z-A, creator A-Z.
- Results count, empty states, and "Load More" pagination.
- Recently added carousel and random-item browsing.
- Rich record cards with badges, location/call-number preview, and clickable subject chips.
- Full-record modal with OPAC-style bibliographic display, related-item suggestions, and citation copy.
- Hash-based permalink support (`#record-<id>`) for future route-friendly URLs.

### ILS (Integrated Library System)
- Separate `ils.html` staff workspace for add/edit/delete record management.
- Firebase Auth email/password login for staff access, with a local admin fallback (`admin` / `catalog123`) available when Firebase is unavailable or not yet configured.
- Firebase Firestore-backed **record** storage shared with the OPAC; the rest of the ILS settings/data stay in local browser storage.
- LocalStorage fallback for offline/dev use.

## Project structure

- `opac.html`: semantic layout for public OPAC, admin UI, login modal, and record details modal.
- `opac.css`: OPAC-facing stylesheet entrypoint.
- `ils.css`: ILS/staff-facing stylesheet entrypoint.
- `js/config.js`: app constants and credentials placeholder.
- `js/seed.js`: starter sample records across books, vinyl, board games, and other media.
- `js/storage.js`: persistence adapter (`localStorage`) + import/export helpers.
- `js/auth.js`: coded login/session adapter (ready to swap for Firebase Auth).
- `js/catalog.js`: search/filter/sort/faceting/statistics/duplicate/related-item logic.
- `js/main.js`: UI orchestration and event wiring.

## Run locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Firebase-ready insertion points

- **Auth replacement:** swap logic in `js/auth.js` (`login`, `logout`, `isAdminSessionActive`) with Firebase Auth methods.
- **Database replacement:** swap `loadRecords` / `saveRecords` in `js/storage.js` with Firestore reads/writes.
- **Real-time sync:** add listeners in `js/main.js` where `state.records` is loaded/refreshed.
- **File uploads:** keep `coverUrl` today, later map to Firebase Storage download URLs.

## Firebase setup

1. Open `js/config.js` and fill in `FIREBASE_CONFIG` if you want the OPAC/record layer to use Firebase services later.
2. Ensure Firestore has a collection matching `FIREBASE_COLLECTION` (default: `records`) if you plan to re-enable Firebase-backed record sync.
3. Open `opac.html` for OPAC and `ils.html` for cataloging. The ILS currently signs in locally with `admin` / `catalog123`.

When Firebase is configured, OPAC and ILS use the same Firestore records so you do not need to recreate items manually. Other ILS data such as patrons, subscriptions, holds, circulation rules, and acquisitions remain local to the browser.
