export const FORMAT_OPTIONS = ["Book", "Vinyl", "Board Game", "CD", "Zine", "Magazine", "Other"];
export const BINDING_OPTIONS = ["", "Paperback", "Hardcover"];
export const PRELOADED_GENRES = [
  "Fantasy", "Science Fiction", "Experimental Fiction", "Mystery", "Romance", "Nonfiction", "Biography", "Poetry", "Horror",
  "Essay", "History", "Philosophy", "Art", "Design", "Comics", "Small Press", "Jazz", "Rock", "Classical", "Strategy",
];

export function buildFacets(records) {
  return {
    format: unique(records.map((r) => r.format)),
    genre: unique(records.flatMap((r) => asArray(r.genres).length ? asArray(r.genres) : [r.genre]).filter(Boolean)),
    year: unique(records.map((r) => String(r.year || "")).filter(Boolean)).sort((a, b) => Number(b) - Number(a)),
    status: unique(records.map((r) => r.status).filter(Boolean)),
    location: unique(records.map((r) => r.location).filter(Boolean)),
    binding: unique(records.map((r) => r.binding).filter(Boolean)),
  };
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function includes(haystack, needle) {
  return !needle || String(haystack || "").toLowerCase().includes(needle.toLowerCase());
}

export function asArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value || "").split(",").map((v) => v.trim()).filter(Boolean);
}

export function normalizeAuthor(author) {
  return String(author || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

export function queryRecords(records, q) {
  const filtered = records.filter((r) => {
    const genres = asArray(r.genres?.length ? r.genres : r.genre).join(" ");
    const global = `${r.title} ${r.subtitle || ""} ${r.creator} ${r.contributors || ""} ${genres} ${r.subjects || ""} ${r.notes || ""} ${r.description || ""} ${r.callNumber || ""} ${r.location || ""} ${r.binding || ""} ${r.seriesName || ""}`;
    const matchesGlobal = includes(global, q.keyword);

    const matchesAdvanced =
      includes(r.title, q.title) &&
      includes(`${r.creator} ${r.contributors || ""}`, q.creator) &&
      includes(`${genres} ${r.subjects || ""}`, q.subject) &&
      includes(global, q.advKeyword) &&
      (!q.year || String(r.year || "") === String(q.year)) &&
      (q.advFormat === "all" || !q.advFormat || r.format === q.advFormat);

    const genreArray = asArray(r.genres?.length ? r.genres : r.genre);
    const matchesFacets =
      (q.facetFormat === "all" || r.format === q.facetFormat) &&
      (q.facetGenre === "all" || genreArray.includes(q.facetGenre)) &&
      (q.facetYear === "all" || String(r.year || "") === q.facetYear) &&
      (q.facetStatus === "all" || r.status === q.facetStatus) &&
      (q.facetLocation === "all" || r.location === q.facetLocation) &&
      (q.facetBinding === "all" || r.binding === q.facetBinding);

    return matchesGlobal && matchesAdvanced && matchesFacets;
  });

  filtered.forEach((r) => {
    const keyword = q.keyword || q.advKeyword;
    const genres = asArray(r.genres?.length ? r.genres : r.genre).join(" ");
    r._score = keyword
      ? [r.title, r.creator, genres, r.subjects, r.description]
          .map((field) => (field || "").toLowerCase().includes(keyword.toLowerCase()))
          .filter(Boolean).length
      : 0;
  });

  filtered.sort((a, b) => sortRecords(a, b, q.sort));
  return filtered;
}

function sortRecords(a, b, sort) {
  if (sort === "newest") return Number(b.year || 0) - Number(a.year || 0);
  if (sort === "oldest") return Number(a.year || 0) - Number(b.year || 0);
  if (sort === "titleAsc") return a.title.localeCompare(b.title);
  if (sort === "titleDesc") return b.title.localeCompare(a.title);
  if (sort === "creatorAsc") return a.creator.localeCompare(b.creator);
  if (sort === "callNumber") return normalizeCallNumber(a.callNumber).localeCompare(normalizeCallNumber(b.callNumber), undefined, { numeric: true });
  if (sort === "relevance") return (b._score || 0) - (a._score || 0) || Number(b.addedAt || 0) - Number(a.addedAt || 0);
  return Number(b.addedAt || 0) - Number(a.addedAt || 0);
}

export function getStats(records) {
  const total = records.length;
  const byFormat = records.reduce((acc, r) => {
    acc[r.format] = (acc[r.format] || 0) + 1;
    return acc;
  }, {});
  const byYear = records.reduce((acc, r) => {
    const decade = r.year ? `${Math.floor(Number(r.year) / 10) * 10}s` : "Unknown";
    acc[decade] = (acc[decade] || 0) + 1;
    return acc;
  }, {});
  const mostOwnedAuthors = Object.entries(records.reduce((acc, r) => {
    const key = normalizeAuthor(r.creator);
    acc[key] = acc[key] || { author: r.creator, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {})).map(([, v]) => v).sort((a, b) => b.count - a.count).slice(0, 5);
  const recentlyAdded = records.filter((r) => Number(r.addedAt || 0) > Date.now() - 1000 * 60 * 60 * 24 * 30).length;
  return { total, byFormat, byYear, mostOwnedAuthors, recentlyAdded, newest: [...records].sort((a,b)=>Number(b.addedAt)-Number(a.addedAt)).slice(0,5) };
}

export function duplicateCandidates(records, draft) {
  return records.filter((r) =>
    r.id !== draft.id && (
      (r.title.toLowerCase() === draft.title.toLowerCase() && r.creator.toLowerCase() === draft.creator.toLowerCase()) ||
      (draft.identifier && r.identifier && r.identifier.toLowerCase() === draft.identifier.toLowerCase())
    )
  );
}

export function getRelated(records, record) {
  const withCallNumbers = records
    .filter((r) => r.callNumber)
    .sort((a, b) => normalizeCallNumber(a.callNumber).localeCompare(normalizeCallNumber(b.callNumber), undefined, { numeric: true }));

  const currentIndex = withCallNumbers.findIndex((r) => r.id === record.id);
  const virtualShelf = withCallNumbers.slice(Math.max(currentIndex - 4, 0), currentIndex + 5);

  const recordGenres = asArray(record.genres?.length ? record.genres : record.genre);
  const recordSubjects = asArray(record.subjects);
  const recordTags = asArray(record.tags || record.subjects);

  const scored = records
    .filter((r) => r.id !== record.id)
    .map((r) => {
      const genres = asArray(r.genres?.length ? r.genres : r.genre);
      const subjects = asArray(r.subjects);
      const tags = asArray(r.tags || r.subjects);
      let score = 0;
      if (normalizeAuthor(r.creator) === normalizeAuthor(record.creator)) score += 6;
      if (record.seriesName && r.seriesName === record.seriesName) score += 5;
      if (r.format === record.format) score += 3;
      score += genres.filter((g) => recordGenres.includes(g)).length * 3;
      score += subjects.filter((s) => recordSubjects.includes(s)).length * 2;
      score += tags.filter((t) => recordTags.includes(t)).length;
      return { r, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.r.addedAt || 0) - Number(a.r.addedAt || 0));

  const relatedItems = scored.map((item) => item.r).slice(0, 6);

  return {
    byCreator: relatedItems.filter((r) => normalizeAuthor(r.creator) === normalizeAuthor(record.creator)).slice(0, 6),
    byCategory: relatedItems,
    bySeries: relatedItems.filter((r) => record.seriesName && r.seriesName === record.seriesName).sort((a,b)=>Number(a.seriesNumber||999)-Number(b.seriesNumber||999)),
    virtualShelf,
  };
}

export function normalizeCallNumber(callNumber) {
  return String(callNumber || "")
    .toUpperCase()
    .replace(/[^A-Z0-9.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function didYouMean(records, term) {
  if (!term || term.length < 3) return "";
  const corpus = unique(records.flatMap((r) => [r.title, r.creator, ...asArray(r.genres?.length ? r.genres : r.genre)]).filter(Boolean));
  const lower = term.toLowerCase();
  let best = "";
  let bestScore = Infinity;
  corpus.forEach((entry) => {
    const score = Math.abs(entry.length - term.length) + (entry.toLowerCase().startsWith(lower.slice(0, 2)) ? 0 : 2);
    if (score < bestScore && entry.toLowerCase() !== lower) {
      bestScore = score;
      best = entry;
    }
  });
  return bestScore <= 4 ? best : "";
}
