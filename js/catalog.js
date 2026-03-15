export function buildFacets(records) {
  return {
    format: unique(records.map((r) => r.format)),
    genre: unique(records.map((r) => r.genre).filter(Boolean)),
    year: unique(records.map((r) => String(r.year || "")).filter(Boolean)).sort((a, b) => Number(b) - Number(a)),
    status: unique(records.map((r) => r.status).filter(Boolean)),
    location: unique(records.map((r) => r.location).filter(Boolean)),
  };
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function includes(haystack, needle) {
  return !needle || haystack.toLowerCase().includes(needle.toLowerCase());
}

export function queryRecords(records, q) {
  const filtered = records.filter((r) => {
    const global = `${r.title} ${r.subtitle || ""} ${r.creator} ${r.contributors || ""} ${r.genre || ""} ${r.subjects || ""} ${r.notes || ""} ${r.description || ""} ${r.callNumber || ""} ${r.location || ""}`;
    const matchesGlobal = includes(global, q.keyword);

    const matchesAdvanced =
      includes(r.title, q.title) &&
      includes(`${r.creator} ${r.contributors || ""}`, q.creator) &&
      includes(`${r.genre || ""} ${r.subjects || ""}`, q.subject) &&
      includes(global, q.advKeyword) &&
      (!q.year || String(r.year || "") === String(q.year)) &&
      (q.advFormat === "all" || !q.advFormat || r.format === q.advFormat);

    const matchesFacets =
      (q.facetFormat === "all" || r.format === q.facetFormat) &&
      (q.facetGenre === "all" || r.genre === q.facetGenre) &&
      (q.facetYear === "all" || String(r.year || "") === q.facetYear) &&
      (q.facetStatus === "all" || r.status === q.facetStatus) &&
      (q.facetLocation === "all" || r.location === q.facetLocation);

    return matchesGlobal && matchesAdvanced && matchesFacets;
  });

  filtered.forEach((r) => {
    const keyword = q.keyword || q.advKeyword;
    r._score = keyword
      ? [r.title, r.creator, r.genre, r.subjects, r.description]
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
  if (sort === "relevance") return (b._score || 0) - (a._score || 0) || Number(b.addedAt || 0) - Number(a.addedAt || 0);
  return Number(b.addedAt || 0) - Number(a.addedAt || 0);
}

export function getStats(records) {
  const total = records.length;
  const byFormat = records.reduce((acc, r) => {
    acc[r.format] = (acc[r.format] || 0) + 1;
    return acc;
  }, {});
  const recentlyAdded = records.filter((r) => Number(r.addedAt || 0) > Date.now() - 1000 * 60 * 60 * 24 * 30).length;
  return { total, byFormat, recentlyAdded };
}

export function duplicateCandidates(records, draft) {
  return records.filter((r) =>
    r.id !== draft.id &&
    r.title.toLowerCase() === draft.title.toLowerCase() &&
    r.creator.toLowerCase() === draft.creator.toLowerCase()
  );
}

export function getRelated(records, record) {
  return {
    byCreator: records.filter((r) => r.id !== record.id && r.creator === record.creator).slice(0, 3),
    byCategory: records.filter((r) => r.id !== record.id && r.genre && r.genre === record.genre).slice(0, 3),
    nearbyFormat: records.filter((r) => r.id !== record.id && r.format === record.format).slice(0, 3),
  };
}
