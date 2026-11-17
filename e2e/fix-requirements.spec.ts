import { expect, test, type Page } from "@playwright/test";
import { ANALYTICS, ORG, TICKET, freshState, mockApi, signIn, type MockState } from "./mocks";

/**
 * The five Fix requirements of the ticketing revamp (docs/plan.md, Find, Flip, Fix), driven through
 * the agent console against the mocked APIs. Each test checks what the person sees and what the
 * console sent.
 */

let s: MockState;

test.beforeEach(async ({ context, page, baseURL }) => {
  s = freshState();
  await signIn(context, baseURL!);
  await mockApi(page, s);
});

test.afterEach(() => {
  // A call the mock does not model is a gap in the test, not a pass.
  expect(s.unknown, `unmocked API calls: ${s.unknown.join(", ")}`).toEqual([]);
});

/**
 * Moves the ticket's status through the Properties pane. The picker is the shared-ui-lib
 * SearchableCombobox: a plain button named after the current status opens a list of buttons, one
 * per status the API accepts from here, rendered inside the same pane.
 */
async function setStatus(page: Page, from: string, to: string) {
  const properties = page.getByRole("region", { name: "Properties" });
  await properties.getByRole("button", { name: from, exact: true }).click();
  await properties.getByRole("button", { name: to, exact: true }).click();
  // The picker closes and shows the new status once the API has taken it and the ticket reloads.
  await expect(properties.getByRole("button", { name: to, exact: true })).toBeVisible();
}

test("Fix 1: a tier-1 agent replies to and resolves a ticket with nothing behind an add-on", async ({ page }) => {
  await page.goto(`/${ORG}/tickets/${TICKET}`);
  await expect(page.getByText("Printer jams on every second page").first()).toBeVisible();

  const editor = page.locator('[contenteditable="true"]').first();
  await editor.click();
  await editor.fill("We have booked a technician for this afternoon.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect.poll(() => s.comments[TICKET].length).toBe(1);
  expect(s.comments[TICKET][0].content).toContain("technician");

  await setStatus(page, "Open", "Resolved");
  expect(s.statusChanges).toEqual([{ id: TICKET, status: "resolved" }]);
});

test("Fix 2: a new desk takes a ticket from creation to resolution without the admin pages", async ({ page }) => {
  await page.goto(`/${ORG}/tickets/new`);
  await page.getByLabel("Subject").fill("Card payment failed at checkout");
  const description = page.locator('[contenteditable="true"]').first();
  await description.click();
  await description.fill("The customer's card was declined twice although it has funds.");
  await page.getByRole("button", { name: /create ticket|submit/i }).click();

  await expect.poll(() => s.created.length).toBe(1);
  expect(s.created[0].subject).toBe("Card payment failed at checkout");
  const created = s.tickets[0];
  await expect(page).toHaveURL(new RegExp(`/${ORG}/tickets/${created.id}`));
  await expect(page.getByText("Card payment failed at checkout").first()).toBeVisible();

  // A new ticket is picked up, then resolved, from the ticket page alone.
  await setStatus(page, "New", "Open");
  await setStatus(page, "Open", "Resolved");
  expect(s.statusChanges).toEqual([
    { id: created.id, status: "open" },
    { id: created.id, status: "resolved" },
  ]);
  // No admin route was needed on the way.
  expect(page.url()).not.toContain("/admin");
});

test("Fix 3: a second agent on the same ticket is shown within two seconds", async ({ page }) => {
  s.presence = [{ user_id: "88888888-8888-4888-8888-888888888888", name: "Bea Agent", state: "typing" }];
  await page.goto(`/${ORG}/tickets/${TICKET}`);
  const banner = page.getByRole("status").filter({ hasText: "Bea Agent is typing a reply" });
  await expect(banner).toBeVisible({ timeout: 2_000 });
  // The console announced this agent too, and never lists the agent to themselves.
  await expect.poll(() => s.presenceBeats).toContain("viewing");
  await expect(banner).not.toContainText("Ann Agent");
});

test("Fix 4: with no AI credits the suggestion is refused cleanly and the reply still saves", async ({ page }) => {
  s.aiStatus = 402;
  await page.goto(`/${ORG}/tickets/${TICKET}`);
  await page.getByRole("button", { name: "Suggest reply" }).click();
  await expect(page.getByText("Out of AI credits.")).toBeVisible();
  expect(s.aiCalls).toEqual([`tickets/${TICKET}/reply`]);

  const editor = page.locator('[contenteditable="true"]').first();
  await editor.click();
  await editor.fill("Checking this for you now.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect.poll(() => s.comments[TICKET].length).toBe(1);
});

test("Fix 5: the analytics page shows the rollup figures promptly", async ({ page }) => {
  const started = Date.now();
  await page.goto(`/${ORG}/admin/analytics`);

  // The KPI card is the nearest div around its label.
  const card = (label: string) => page.getByText(label, { exact: true }).first().locator("xpath=ancestor::div[1]");
  const period = page.getByRole("region", { name: "In this period" });
  await expect(period.getByText("Resolved", { exact: true }).locator("xpath=ancestor::div[1]")).toContainText(
    String(ANALYTICS.resolved),
  );
  await expect(period.getByText("Created", { exact: true }).locator("xpath=ancestor::div[1]")).toContainText(
    String(ANALYTICS.created),
  );
  await expect(card("Resolved today")).toContainText(String(ANALYTICS.resolvedToday));
  // The API side of Fix 5 is the 200k-ticket benchmark; here the page must render its answer fast.
  expect(Date.now() - started).toBeLessThan(5_000);

  // One rollup read for the default view, with the window and the browser's time zone.
  expect(s.analyticsCalls.map((c) => c.view)).toContain("tickets");
  const q = s.analyticsCalls.find((c) => c.view === "tickets")!.params;
  expect(q.from).toMatch(/^\d{4}-\d{2}-\d{2}/);
  expect(q.to).toMatch(/^\d{4}-\d{2}-\d{2}/);
  expect(q.tz).toBeTruthy();
});
