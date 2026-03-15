# Willow Creek Personal OPAC

A front-end-only personal catalog/OPAC app built with plain HTML, CSS, and JavaScript.
It now includes a polished public catalog experience and a distinct cataloging/admin workspace.

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

### Admin / Cataloging
- Coded login with session persistence and logout toggle.
- Structured cataloging form with expanded bibliographic + holdings fields.
- Required-field validation and duplicate warnings.
- Searchable records table with quick actions: edit, duplicate, delete.
- Bulk status update for selected records.
- JSON import/export and sample data seeding.
- LocalStorage persistence.

## Project structure

- `index.html`: semantic layout for public OPAC, admin UI, login modal, and record details modal.
- `styles.css`: responsive OPAC/admin styling, accessibility focus states, and print-friendly record display.
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
