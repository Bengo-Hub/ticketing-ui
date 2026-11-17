/** subscriptions-ui, where a tenant picks a plan and buys prepaid credits. */
export const SUBSCRIPTIONS_UI_URL = (process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL ?? "https://pricing.codevertexafrica.com").replace(
  /\/$/,
  "",
);

/** subscriptions-ui's billing page, whose credits section sells AI credit bundles. */
export const AI_CREDITS_URL = `${SUBSCRIPTIONS_UI_URL}/billing`;
