import type { BrowserContext, Page, Route } from "@playwright/test";

/**
 * A stateful mock of auth-api's SSO profile and ticketing-api, enough for the agent console flows
 * the Fix requirement tests drive. Routes match by path, whatever API URL the build was made with.
 * Unknown reads answer an empty page and unknown writes an empty object, and both are recorded in
 * state.unknown so a test can fail on a call the mock does not cover.
 */

export const ORG = "acme";
export const TENANT = "55555555-5555-4555-8555-555555555555";
export const ME = "44444444-4444-4444-8444-444444444444";
export const AGENT = "66666666-6666-4666-8666-666666666666";
export const TICKET = "77777777-7777-4777-8777-777777777777";

/** Every ticketing permission a tier-1 tenant's agent holds (Fix 1: nothing behind an add-on). */
export const AGENT_PERMISSIONS = [
  "ticketing.tickets.view",
  "ticketing.tickets.add",
  "ticketing.tickets.change",
  "ticketing.comments.add",
  "ticketing.comments.view",
  "ticketing.agents.view",
  "ticketing.teams.view",
  "ticketing.categories.view",
  "ticketing.kb.view",
  "ticketing.analytics.view",
];

export interface MockTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  channel: string;
  assigned_agent_id?: string;
  created_at: string;
  updated_at: string;
  sla_resolution_due_at?: string;
  sla_response_breached: boolean;
  sla_resolution_breached: boolean;
  escalation_level: number;
  metadata: Record<string, unknown>;
}

export interface MockState {
  tickets: MockTicket[];
  comments: Record<string, { id: string; content: string; comment_type: string; created_at: string }[]>;
  statusChanges: { id: string; status: string }[];
  assigns: { id: string; body: unknown }[];
  created: Record<string, unknown>[];
  /** Other people on the ticket (collision presence). */
  presence: { user_id: string; name: string; state: "viewing" | "typing" }[];
  /** The states this agent's own presence heartbeats sent (POST /presence). */
  presenceBeats: string[];
  /** Subjects the new-ticket form searched the public KB with (deflection). */
  kbQueries: string[];
  /** Every analytics read: the view and its query string. */
  analyticsCalls: { view: string; params: Record<string, string> }[];
  /** When set, every /ai/* call answers this status (402 means out of AI credits). */
  aiStatus?: number;
  aiCalls: string[];
  unknown: string[];
}

const now = () => new Date().toISOString();

export function freshState(): MockState {
  return {
    tickets: [
      {
        id: TICKET,
        ticket_number: "TKT-000042",
        subject: "Printer jams on every second page",
        description: "<p>The office printer jams.</p>",
        status: "open",
        priority: "normal",
        channel: "email",
        created_at: now(),
        updated_at: now(),
        sla_resolution_due_at: new Date(Date.now() + 4 * 3600_000).toISOString(),
        sla_response_breached: false,
        sla_resolution_breached: false,
        escalation_level: 0,
        metadata: { requester_name: "Amina Otieno", requester_email: "amina@example.com" },
      },
    ],
    comments: { [TICKET]: [] },
    statusChanges: [],
    assigns: [],
    created: [],
    presence: [],
    presenceBeats: [],
    kbQueries: [],
    analyticsCalls: [],
    aiCalls: [],
    unknown: [],
  };
}

/** Seeds a signed-in agent session into the persisted auth store before any page script runs. */
export async function signIn(context: BrowserContext, baseURL: string) {
  const user = {
    id: ME,
    email: "agent@acme.test",
    fullName: "Ann Agent",
    firstName: "Ann",
    lastName: "Agent",
    roles: ["staff"],
    permissions: [],
    tenantId: TENANT,
    tenantSlug: ORG,
    isPlatformOwner: false,
    isSuperUser: false,
  };
  const state = {
    state: {
      session: { accessToken: "e2e-token", refreshToken: "e2e-refresh", expiresAt: new Date(Date.now() + 3600_000).toISOString() },
      user,
    },
    version: 0,
  };
  await context.addInitScript(
    ([origin, value]) => {
      if (window.location.origin === origin) window.localStorage.setItem("ticketing-auth-storage", value);
    },
    [new URL(baseURL).origin, JSON.stringify(state)] as const,
  );
  return user;
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

const page_ = <T>(data: T[]) => ({ data, has_more: false, next_cursor: "" });

/** The figures the analytics mock answers, so a test can look for them on the page. */
export const ANALYTICS = { created: 128, resolved: 117, previousResolved: 96, resolvedToday: 4, createdToday: 5 };

const DAY_MS = 24 * 3600_000;

function metrics(created: number, resolved: number) {
  return {
    created,
    resolved,
    first_responses: 120,
    avg_first_response_minutes: 42,
    avg_resolution_minutes: 380,
    first_response_sla: { met: 110, breached: 10, compliance_pct: 91.7 },
    resolution_sla: { met: 105, breached: 12, compliance_pct: 89.7 },
    csat: { responses: 40, average: 4.4, satisfied_pct: 85, scores: { "1": 1, "2": 1, "3": 4, "4": 10, "5": 24 } },
  };
}

/** One analytics view (TicketsAnalytics, AgentsAnalytics, SLAAnalytics or CsatAnalytics). */
function analyticsAnswer(view: string) {
  const t = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const base = {
    period: {
      from: iso(t - 30 * DAY_MS),
      to: iso(t),
      previous_from: iso(t - 60 * DAY_MS),
      previous_to: iso(t - 30 * DAY_MS),
      tz: "Africa/Nairobi",
      interval: "day",
      source: "day",
      rollups_as_of: iso(t),
      backfill_complete: true,
    },
    filters: { team_id: null, agent_id: null, category_id: null, channel: null, priority: null },
  };
  const current = metrics(ANALYTICS.created, ANALYTICS.resolved);
  const previous = metrics(100, ANALYTICS.previousResolved);
  const change = {
    created_pct: 28,
    resolved_pct: 21.9,
    avg_first_response_pct: null,
    avg_resolution_pct: null,
    first_response_compliance_delta: null,
    resolution_compliance_delta: null,
    csat_responses_pct: null,
    csat_average_delta: null,
    csat_satisfied_delta: null,
  };
  switch (view) {
    case "agents":
      return { ...base, agents: [] };
    case "sla":
      return { ...base, overdue: 1, current, previous, change, trend: [], by_priority: [], by_team: [], by_agent: [] };
    case "csat":
      return {
        ...base, current: current.csat, previous: previous.csat, change, trend: [],
        by_agent: [], by_team: [], by_channel: [], recent_comments: [],
      };
    default:
      return {
        ...base,
        stats: {
          open: 11,
          by_status: { new: 3, open: 6, in_progress: 2 },
          overdue: 1,
          unassigned: 2,
          created_today: ANALYTICS.createdToday,
          resolved_today: ANALYTICS.resolvedToday,
          today_start: iso(t - (t % DAY_MS)),
        },
        current, previous, change, trend: [],
        by_priority: [], by_channel: [], by_category: [], by_team: [],
      };
  }
}

/** Installs the mock on every request the page makes to auth-api or ticketing-api. */
export async function mockApi(page: Page, s: MockState) {
  await page.route(/\/api\/v1\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/\/+$/, "");
    const method = req.method();
    const body = () => {
      try {
        return req.postDataJSON() as Record<string, unknown>;
      } catch {
        return {};
      }
    };

    // auth-api: the SSO profile and token refresh.
    if (path.endsWith("/auth/me") && !path.includes("/ticketing/")) {
      return json(route, {
        id: ME, email: "agent@acme.test", full_name: "Ann Agent", roles: ["staff"], permissions: [],
        tenant_id: TENANT, tenant_slug: ORG, is_platform_owner: false, profile: { name: "Ann Agent" },
      });
    }
    if (path.endsWith("/auth/refresh")) return json(route, { access_token: "e2e-token", refresh_token: "e2e-refresh", expires_in: 3600 });
    // auth-api: the public tenant record the shell reads for branding.
    if (path.endsWith(`/tenants/by-slug/${ORG}`)) {
      return json(route, { id: TENANT, name: "Acme Support", slug: ORG, status: "active", metadata: { org_name: "Acme Support" } });
    }

    // ticketing-api: the service profile (role and permissions).
    if (path.endsWith(`/${ORG}/ticketing/auth/me`)) {
      return json(route, {
        user_id: ME, email: "agent@acme.test", name: "Ann Agent", tenant_id: TENANT, tenant_slug: ORG,
        global_roles: ["staff"], service_role: "agent", permissions: AGENT_PERMISSIONS, agent_id: AGENT,
        is_platform_owner: false,
      });
    }

    // Live updates: no stream in tests.
    if (path.endsWith("/stream")) return route.fulfill({ status: 204, body: "" });

    // AI (Fix 4): every call answers aiStatus when set.
    const ai = path.match(/\/ai\/(.+)$/);
    if (ai) {
      s.aiCalls.push(ai[1]);
      if (s.aiStatus) return json(route, { error: "out of AI credits", code: "ai_credits_exhausted" }, s.aiStatus);
      return json(route, {
        reply: "Thanks Amina, a technician will check the printer today.",
        credits: { charged: 1, exempt: false, replayed: false },
        review_notes: [], tainted: false,
      });
    }

    const tk = path.match(new RegExp(`/${ORG}/tickets/([0-9a-f-]{36})(/.*)?$`));
    if (tk) {
      const [, id, rest = ""] = tk;
      const t = s.tickets.find((x) => x.id === id);
      if (!t) return json(route, { error: "ticket not found" }, 404);
      if (rest === "" && method === "GET") return json(route, t);
      if (rest === "/comments" && method === "GET") return json(route, { data: s.comments[id] ?? [] });
      if (rest === "/comments" && method === "POST") {
        const b = body();
        const c = { id: crypto.randomUUID(), content: String(b.content ?? ""), comment_type: String(b.comment_type ?? "public"), created_at: now() };
        (s.comments[id] ??= []).push(c);
        return json(route, c, 201);
      }
      if (rest === "/status" && (method === "PUT" || method === "PATCH")) {
        const status = String(body().status ?? "");
        s.statusChanges.push({ id, status });
        t.status = status;
        t.updated_at = now();
        return json(route, t);
      }
      if (rest === "/assign" && method === "PUT") {
        const b = body();
        s.assigns.push({ id, body: b });
        t.assigned_agent_id = String(b.agent_id ?? AGENT);
        return json(route, t);
      }
      if (rest === "/presence") {
        // GET and the heartbeat POST both answer everyone on the ticket, as ticketing-api does;
        // usePresence writes the POST answer straight into its cache, so an empty POST answer
        // would wipe the other agents the GET returned. The caller's own entry is in the list
        // and the UI must filter it out.
        const expires_at = new Date(Date.now() + 30_000).toISOString();
        const others = s.presence.map((p) => ({ ...p, agent_id: null, expires_at }));
        if (method === "GET") return json(route, { ticket_id: id, data: others });
        if (method === "POST") {
          const state = String(body().state ?? "");
          s.presenceBeats.push(state);
          const self = { user_id: ME, agent_id: AGENT, name: "Ann Agent", state, expires_at };
          return json(route, { ticket_id: id, data: [self, ...others] });
        }
        if (method === "DELETE") return route.fulfill({ status: 204, body: "" });
      }
      if (["/attachments", "/links"].includes(rest) && method === "GET") return json(route, { data: [] });
    }

    if (path.endsWith(`/${ORG}/tickets`) && method === "GET") return json(route, page_(s.tickets));
    if (path.endsWith(`/${ORG}/tickets`) && method === "POST") {
      const b = body();
      s.created.push(b);
      const t: MockTicket = {
        ...freshState().tickets[0],
        id: crypto.randomUUID(),
        ticket_number: `TKT-0000${50 + s.created.length}`,
        subject: String(b.subject ?? ""),
        description: String(b.description ?? ""),
        status: "new",
        priority: String(b.priority ?? "normal"),
        channel: "web",
      };
      s.tickets.unshift(t);
      s.comments[t.id] = [];
      return json(route, t, 201);
    }

    // Public KB deflection on the new-ticket form (no sign-in route): no matching articles.
    if (path.endsWith(`/${ORG}/kb/suggestions`) && method === "GET") {
      s.kbQueries.push(url.searchParams.get("q") ?? "");
      return json(route, { data: [] });
    }

    // Analytics (Fix 5): each view in the shape src/types/analytics.ts reads from the rollup.
    const an = path.match(new RegExp(`/${ORG}/analytics/(tickets|agents|sla|csat)$`));
    if (an && method === "GET") {
      const view = an[1];
      s.analyticsCalls.push({ view, params: Object.fromEntries(url.searchParams) });
      return json(route, analyticsAnswer(view));
    }

    // Lists the console reads on every page.
    if (method === "GET" && /\/(categories|teams|agents|agents\/available|macros|views|tickets\/tags|sla\/policies|sla\/calendars)$/.test(path)) {
      return json(route, page_([]));
    }

    s.unknown.push(`${method} ${path}`);
    if (method === "GET") return json(route, page_([]));
    return json(route, {});
  });
}
