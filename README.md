# Personal Library Catalog

A lightweight starter app for a personal collection catalog with:

- Public OPAC-style browsing/search/filter.
- Temporary coded admin login (`admin` / `catalog123`).
- Admin add/edit/delete management UI.
- Support for multiple collection formats (Book, Vinyl, Board Game, Other).
- Cover image URL fields so you can link images now and later swap to uploads.

## Run locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Next steps

- Replace coded login with Firebase Auth.
- Move record storage from `localStorage` to Firestore.
- Add image upload/storage (Firebase Storage).
