import type { TicketChannel, TicketListFilters, TicketPriority, TicketSort, TicketStatus } from "@/types/tickets";
import type { TicketView, ViewFilters } from "@/types/workspace";

/** The inbox filters on screen. The search term lives in the debounced search box. */
export interface InboxFilters {
  status: TicketStatus | "";
  priority: TicketPriority | "";
  channel: TicketChannel | "";
  categoryId: string;
  tags: string[];
  sort: TicketSort;
}

export const EMPTY_FILTERS: InboxFilters = {
  status: "",
  priority: "",
  channel: "",
  categoryId: "",
  tags: [],
  sort: "created_desc",
};

/** Page size of the inbox. The API allows up to 100. */
export const INBOX_PAGE_SIZE = 25;

/** Whether anything narrows the list (the order does not). */
export function isFiltered(f: InboxFilters, term: string): boolean {
  return !!(term || f.status || f.priority || f.channel || f.categoryId || f.tags.length);
}

/** The list query for the filters; empty values are left out. */
export function toListFilters(f: InboxFilters): TicketListFilters {
  return {
    status: f.status || undefined,
    priority: f.priority || undefined,
    channel: f.channel || undefined,
    categoryId: f.categoryId || undefined,
    tags: f.tags.length ? f.tags.join(",") : undefined,
    sort: f.sort,
    limit: INBOX_PAGE_SIZE,
  };
}

/** What a saved view stores for the filters and the search text. */
export function toViewFilters(f: InboxFilters, search: string): ViewFilters {
  const out: ViewFilters = {};
  if (search.trim()) out.search = search.trim();
  if (f.status) out.status = f.status;
  if (f.priority) out.priority = f.priority;
  if (f.channel) out.channel = f.channel;
  if (f.categoryId) out.categoryId = f.categoryId;
  if (f.tags.length) out.tags = f.tags;
  return out;
}

/** The filters a saved view restores. Unknown keys from older views are ignored. */
export function fromView(view: TicketView): { filters: InboxFilters; search: string } {
  const v = view.filters ?? {};
  return {
    filters: {
      status: v.status ?? "",
      priority: v.priority ?? "",
      channel: (v.channel as TicketChannel | undefined) ?? "",
      categoryId: v.categoryId ?? "",
      tags: Array.isArray(v.tags) ? v.tags.filter((t): t is string => typeof t === "string") : [],
      sort: view.sort === "created_asc" ? "created_asc" : "created_desc",
    },
    search: typeof v.search === "string" ? v.search : "",
  };
}
