// The diagnostic report (Settings > Download diagnostic report): what's
// useful for finding a problem, without anything personal. These are the
// parts made from the notes: counts and shapes only. Never note text,
// titles, tag names, or page addresses (not even their hostnames, which
// would be browsing history). The rest is put together by
// background/diagnostics.js.

type AnyNote = Record<string, any>;

const stats = (values: number[]) => {
  if (values.length === 0) return { count: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    min: sorted[0],
    median: sorted[Math.floor(sorted.length / 2)],
    max: sorted[sorted.length - 1],
  };
};

const lengthOf = (value: unknown) => (typeof value === "string" ? value.length : 0);

/** What a page's address looks like, without the address */
const urlShape = (key: string) => {
  try {
    const url = new URL(key);
    return { scheme: url.protocol.replace(":", ""), query: url.search.length > 0, fragment: url.hash.length > 0 };
  } catch {
    return { scheme: "unparseable", query: false, fragment: false };
  }
};

/**
 * Counts and shapes of the saved notes. Each line answers a question that
 * comes up when something's wrong: are notes off screen, are ids duplicated,
 * do tags point at notes that are gone, how big is the biggest note, ...
 */
export const noteStats = (state: { pages?: Record<string, any>; tags?: any[] } | undefined) => {
  const pages = state?.pages && typeof state.pages === "object" && !Array.isArray(state.pages) ? state.pages : {};
  const entries = Object.entries(pages);
  const notes: AnyNote[] = entries.flatMap(([, page]) => (Array.isArray(page?.notes) ? page.notes.filter((n: unknown) => n && typeof n === "object") : []));
  const ids = notes.map((note) => note.id).filter((id) => id !== undefined && id !== null);
  const idCounts = new Map<unknown, number>();
  ids.forEach((id) => idCounts.set(id, (idCounts.get(id) || 0) + 1));
  const tags = Array.isArray(state?.tags) ? state!.tags.filter((t) => t && typeof t === "object") : [];
  const tagIds = new Set(tags.map((tag) => tag.id));
  const noteIds = new Set(ids);
  const shapes = entries.map(([key]) => urlShape(key));
  const count = (test: (note: AnyNote) => boolean) => notes.filter(test).length;

  return {
    pages: {
      count: entries.length,
      with_notes: entries.filter(([, page]) => Array.isArray(page?.notes) && page.notes.length > 0).length,
      without_notes_array: entries.filter(([, page]) => !Array.isArray(page?.notes)).length,
      with_title: entries.filter(([, page]) => typeof page?.title === "string" && page.title.length > 0).length,
      notes_per_page: stats(entries.map(([, page]) => (Array.isArray(page?.notes) ? page.notes.length : 0))),
      address_schemes: shapes.reduce<Record<string, number>>((acc, shape) => ({ ...acc, [shape.scheme]: (acc[shape.scheme] || 0) + 1 }), {}),
      addresses_with_query: shapes.filter((shape) => shape.query).length,
      addresses_with_fragment: shapes.filter((shape) => shape.fragment).length,
    },
    notes: {
      count: notes.length,
      without_id: notes.length - ids.length,
      duplicate_ids: [...idCounts.values()].filter((n) => n > 1).length,
      with_title: count((note) => lengthOf(note.title) > 0),
      with_text: count((note) => lengthOf(note.body) > 0),
      empty: count((note) => lengthOf(note.title) === 0 && lengthOf(note.body) === 0),
      text_length: stats(notes.map((note) => lengthOf(note.body))),
      favorites: count((note) => note.heart === true),
      hidden_from_page: count((note) => note.visible === false),
      collapsed: count((note) => note.collapsed === true),
      kept_on_screen: count((note) => note.stickify === true),
      anchored_to_a_panel: count((note) => Boolean(note.anchor)),
      with_tags: count((note) => Array.isArray(note.tags) && note.tags.length > 0),
      with_created_on_url: count((note) => typeof note.created_on_url === "string"),
      with_updated_at: count((note) => note.updated_at !== undefined),
      colors: {
        named: count((note) => typeof note.color === "string" || Boolean(note.color?.name)),
        from_before_5_1: count((note) => Boolean(note.color) && typeof note.color === "object" && !note.color.name),
        missing: count((note) => !note.color),
      },
      position: {
        missing: count((note) => !note.position),
        left_of_page: count((note) => Number(note.position?.x) < 0),
        above_page: count((note) => Number(note.position?.y) < 0),
        x: stats(notes.map((note) => Number(note.position?.x)).filter(Number.isFinite)),
        y: stats(notes.map((note) => Number(note.position?.y)).filter(Number.isFinite)),
      },
      width: stats(notes.map((note) => Number(note.size?.width)).filter(Number.isFinite)),
      with_height: count((note) => Number.isFinite(Number(note.size?.height))),
    },
    tags: {
      count: tags.length,
      unused: tags.filter((tag) => !notes.some((note) => Array.isArray(note.tags) && note.tags.some((t: any) => t?.id === tag.id))).length,
      notes_per_tag: stats(tags.map((tag) => notes.filter((note) => Array.isArray(note.tags) && note.tags.some((t: any) => t?.id === tag.id)).length)),
      // Links that point nowhere: a note's tag that no longer exists, a tag's note that's gone
      missing_tag_references: notes.reduce((n, note) => n + (Array.isArray(note.tags) ? note.tags.filter((t: any) => !tagIds.has(t?.id)).length : 0), 0),
      missing_note_references: tags.reduce((n, tag) => n + (Array.isArray(tag.notes) ? tag.notes.filter((id: unknown) => !noteIds.has(id)).length : 0), 0),
    },
  };
};

/** Settings, by name: only the known ones, only their values */
export const knownPreferences = (preferences: Record<string, unknown> | undefined) => {
  const keep = ["theme", "note_text_size", "new_note_color", "follow_panels"];
  return Object.fromEntries(keep.filter((key) => preferences && key in preferences).map((key) => [key, preferences![key]]));
};
